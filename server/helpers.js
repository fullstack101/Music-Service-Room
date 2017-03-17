const _ = require("underscore");
const request = require('request');

const client_id = '51ddd5db3e6342b69cbc9a9f957e48c6';
const client_secret = '3772d947a7c147f28210541b352472fb';

const getUserOptions = function(access_token) {
  return {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
};

const getRecentlyPlayedOptions = function(access_token) {
  return {
    url: 'https://api.spotify.com/v1/me/player/recently-played?limit=3',
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

const getUserSpotifyData = access_token => new Promise((resolve, reject) => {
  request.get(access_token, (error, response, body) => {
    if (error) { reject(error); return; }
    resolve(body);
  });
});

const getRecentlyPlayedTracks = access_token => new Promise((resolve, reject) => {
  request.get(access_token, (error, response, body) => {
    if (error) { reject(error); return; }
    resolve(body.items);
  });
});

const getRecentlyPlayedTracksUri = function(tracks) {
  let tracksUri = [];

  for(var i = 0; i < tracks.length; i++) {
    tracksUri.push(tracks[i].track.uri);
  }

  return tracksUri;
}

module.exports = {
  isMessageValid: isMessageValid,
  getAuthOptions: getAuthOptions,
  getUserOptions: getUserOptions,
  getUserSpotifyData: getUserSpotifyData,
  getRecentlyPlayedOptions: getRecentlyPlayedOptions,
  getRecentlyPlayedTracks: getRecentlyPlayedTracks,
  getRecentlyPlayedTracksUri: getRecentlyPlayedTracksUri
};
