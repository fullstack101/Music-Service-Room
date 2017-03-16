
function init() {
  var serverBaseUrl = document.domain;
  var socket = io.connect(serverBaseUrl);

  //We'll save our session ID in a variable for later
  var sessionId = '';
  let chat_users = [];

  //Helper function to update the participants' list
  function updateParticipants(participants) {
    $('#participants').html('');
    for (var i = 0; i < participants.length; i++) {
      $('#participants').append('<div id="' + participants[i].id + '"><img src=" ' + participants[i].image + '" class="participantPhoto"> <span>' +
        participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /></span></div>');
    }
  }

  function getParticipant(participants) {
    for (var i = 0; i < participants.length; i++) {
      if (participants[i].id === sessionId){
         return participants[i];
      };
    }
  }

  /*
   When the client successfully connects to the server, an
   event "connect" is emitted. Let's get the session ID and
   log it. Also, let the socket.IO server there's a new user
   with a session ID and a name. We'll emit the "newUser" event
   for that.
   */
  socket.on('connect', function () {
    sessionId = socket.io.engine.id;
    console.log('Connected ' + sessionId);
    socket.emit('newUser', {id: sessionId, name: document.cookie.user_id});

  });

  /*
   When the server emits the "newConnection" event, we'll reset
   the participants section and display the connected clients.
   Note we are assigning the sessionId as the span ID.
   */
  socket.on('newConnection', function (data) {
    updateParticipants(data.participants);
    chat_users = data.participants.slice();
  });

  /*
   When the server emits the "userDisconnected" event, we'll
   remove the span element from the participants element
   */
  socket.on('userDisconnected', function(data) {
    $('#' + data.id).remove();
  });

  /*
   When receiving a new chat message with the "incomingMessage" event,
   we'll prepend it to the messages section
   */
  socket.on('incomingMessage', function (data) {
    var message = data.message;
    var name = data.name;
    var image = data.image;
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    $('#messages').append('<img src="' + image +'" class="msgPhoto">' + '<b>' + name + '</b>' + ' @' + h + ':' + m + 'h<br />' + '<br />' + message + '<hr />');
    $(document).scrollTop($(document).height());
  });

  /*
   Log an error if unable to connect to server
   */
  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });

  /*
   "sendMessage" will do a simple ajax POST call to our server with
   whatever message we have in our textarea
   */
  function sendMessage() {
    var outgoingMessage = $('#outgoingMessage').val();
    var name = getParticipant(chat_users).name;
    var image = getParticipant(chat_users).image;

    $.ajax({
      url:  '/message',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({message: outgoingMessage, name: name, image: image})
    });
  }

  /*
   If user presses Enter key on textarea, call sendMessage if there
   is something to share
   */
  function outgoingMessageKeyDown(event) {
    if (event.which === 13) {
      event.preventDefault();
      if ($('#outgoingMessage').val().trim().length <= 0) {
        return;
      }
      sendMessage();
      $('#outgoingMessage').val('');
    }
  }


  /*
   When a user updates his/her name, let the server know by
   emitting the "nameChange" event
   */
  function nameFocusOut() {
    var name = $('#name').val();
    socket.emit('nameChange', {id: sessionId, name: name});
  }

  /* Elements setup */
  $('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
  $('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
  $('#name').on('focusout', nameFocusOut);
  $('#send').on('click', sendMessage);

}

$(document).on('ready', init);
