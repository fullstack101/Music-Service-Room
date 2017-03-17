const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');
const request = require('request');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const _ = require("underscore");
const session = require('express-session');
let participants = [];
let spotifyUser = {};
let lastPlayedTrack = {};

const isMessageValid = require('./helpers.js').isMessageValid;
const getAuthOptions = require('./helpers.js').getAuthOptions;
const getUserOptions = require('./helpers.js').getUserOptions;
const getUserSpotifyData = require('./helpers.js').getUserSpotifyData;
const getRecentlyPlayedOptions = require('./helpers.js').getRecentlyPlayedOptions;
const getLastPlayedTrack = require('./helpers.js').getLastPlayedTrack;

//specify views for folder
// app.set('views', express.static(__dirname + '/../dist/ready'));

//Tells the server to support JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000
}));

//=======================SPOTIFY API===================================

const client_id = '51ddd5db3e6342b69cbc9a9f957e48c6';
const client_secret = '3772d947a7c147f28210541b352472fb';
const redirect_uri = 'http://localhost:3000/callback';

let stateKey = 'spotify_auth_state';

app.use(express.static(path.join(__dirname + '/../dist/ready')))
   .use(cookieParser());

app.get('/', function(req, res) {
     res.sendFile(path.join(__dirname + '/../dist/ready/spotify.html'));
});

app.get('/spotify.js', function(req, res) {
     res.sendFile(path.join(__dirname + '/../dist/ready/spotify.js'));
});

app.get('/login', function(req, res) {
  let state = 'random_state';
  res.cookie(stateKey, state);

  // request authorization
  let scope = 'user-read-private user-read-email user-read-recently-played';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  let code = req.query.code || null;
  let state = req.query.state || null;
  let storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    let authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        let access_token = body.access_token,
            refresh_token = body.refresh_token;

        getUserSpotifyData(getUserOptions(access_token)).then(body => req.session.user_body = body)
          .then(() => spotifyUser={id: req.session.user_body.id, token: access_token, image: req.session.user_body.images[0].url});

        getLastPlayedTrack(getRecentlyPlayedOptions(access_token)).then(body => lastPlayedTrack = body);

        //we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  const refresh_token = req.query.refresh_token;
  const authOptions = getAuthOptions(refresh_token);

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

//=======================SPOTIFY API END=================================


app.get("/chat", function (req, res) {
  res.sendFile(path.resolve(__dirname + "/../dist/ready/chat.html"));
});

//POST method to create a chat message
app.post("/message", function(req, res) {
  let message = req.body.message;
  let name = req.body.name;
  let image = req.body.image;

  if(!isMessageValid(message)) {
    return res.status(400).json({error: "Message is invalid"});
  }

  io.sockets.emit("incomingMessage", {message: message, name: name, image: image});
});

io.on("connection", function(socket){

  //when a new user connects
  socket.on("newUser", function(data) {
      participants.push({id: data.id, name: spotifyUser.id, image: spotifyUser.image});
      io.sockets.emit("newConnection", {participants: participants});
  });

  //when a user disconnects
  socket.on("disconnect", function(){
    participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
    io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });

});

http.listen(3000, function(){
  console.log("Server up and running. Go to port 3000."); //eslint-disable-line no-console
});
