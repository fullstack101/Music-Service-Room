const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const readline = require('readline');
const bodyParser = require('body-parser');
const path = require('path');
const request = require('request');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

app.get('/chat', function(req, res){
  res.sendFile(path.join(__dirname + '/../client/chat.html'));
});

//==================JUST IGNORE================================================
app.use(bodyParser.urlencoded({extended: true}));
app.post('/chat', function(req, res){
  let name = req.body.name;
  res.send('You sent the name ' + name + '.');
  console.log(name);
});

const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
  terminal: false
});

rl.question('What is your username', (answer) =>{
  //TODO: Log the answer in a database
  console.log(`Thank you, ${answer}`);
});

//=============================================================================

io.on('connection', function(socket){
  console.log('user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
});

// io.on('connection', function(socket){
//   console.log('user connected');
//   socket.on('chat message', function(msg){
//     io.emit('chat message', msg);
//   });
// });


//=======================SPOTIFY API===================================

const client_id = '51ddd5db3e6342b69cbc9a9f957e48c6';
const client_secret = '3772d947a7c147f28210541b352472fb';
const redirect_uri = 'http://localhost:3000/callback';

let stateKey = 'spotify_auth_state';

app.use(express.static(path.join(__dirname + '/../client')))
   .use(cookieParser());

app.get('/', function(req, res){
     res.sendFile(path.join(__dirname + '/../client/spotify.html'));
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

http.listen(3000);
