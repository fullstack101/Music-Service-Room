const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const readline = require('readline');
const bodyParser = require('body-parser');
const path = require('path');

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname + '/../client/chat.html'));
});

//==================JUST IGNORE================================================
app.use(bodyParser.urlencoded({extended: true}));
app.post('/', function(req, res){
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

http.listen(3000, function(){
  console.log('listening on *:3000');
});
