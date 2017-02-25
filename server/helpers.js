const _ = require("underscore");

const client_id = '51ddd5db3e6342b69cbc9a9f957e48c6';
const client_secret = '3772d947a7c147f28210541b352472fb';

const getUserOptions = function(access_token) {
  return {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
};

const isMessageValid = function(message) {
  //If the message is empty or wasn't sent it's a bad request
  return !(_.isUndefined(message) && _.isEmpty(message.trim()));
};

const getAuthOptions = function(refresh_token) {
  return {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };
};

//how to return from request????????
const getUserSpotifyId = function(request, access_token) {
  let user_object = getUserOptions(access_token);
  request.get(user_object, function(error, response, body) {
    console.log(body);

      return body.id;

  });
};


module.exports = {
  isMessageValid: isMessageValid,
  getAuthOptions: getAuthOptions,
  getUserSpotifyId: getUserSpotifyId
};
