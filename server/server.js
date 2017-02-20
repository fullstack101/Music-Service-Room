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
var participants = [];

//Server's IP address
app.set("ipaddr", "127.0.0.1");

//Server's port number
app.set("port", 3000);

//specify views for folder
app.set('views', express.static(__dirname + '/../client'));

//view engine in jade
//app.set("view engine", "jade");

//specify where the static content is
app.use(express.static(__dirname + '/../client'));

//Tells the server to support JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  //res.render(__dirname + '/../client/index');
  res.sendFile(path.resolve(__dirname + "/../client/chat.html"));
});

//POST method to create a chat message
app.post("/message", function(req, res) {

  //The request body expects a param named "message"
  let message = req.body.message;

  //If the message is empty or wasn't sent it's a bad request
  if(_.isUndefined(message) || _.isEmpty(message.trim())) {
    return res.json(400, {error: "Message is invalid"});
  }

  let name = req.body.name;
  //console.log("socket: " + typeof(sockets));
  io.sockets.emit("incomingMessage", {message: message, name: name});

  //Looks good, let the client know
  res.status(200).json({message: "Message received"});

});

io.on("connection", function(socket){

  //when a new user connects
  socket.on("newUser", function(data) {
      participants.push({id: data.id, name: data.name});
      io.sockets.emit("newConnection", {participants: participants});
  });

  //when a user changes their name
  socket.on("nameChange", function(data){
    _.findWhere(participants, {id: socket.id}).name = data.name;
    io.sockets.emit("nameChnaged", {id: data.id, name: data.name});
  });

  //when a user disconnects
  socket.on("disconnect", function(){
    participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
    io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });

});

http.listen(3000, function(){
  console.log("Server up and running. Go to http://" +
    app.get("ipaddr") + ":" + app.get("port"));
});


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
  let scope = 'user-read-private user-read-email';
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

        // var options = {
        //   url: 'https://api.spotify.com/v1/me',
        //   headers: { 'Authorization': 'Bearer ' + access_token },
        //   json: true
        // };

        // use the access token to access the Spotify Web API
        // request.get(options, function(error, response, body) {
        //   //console.log(body);
        // });

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
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

//http.listen(3000);
