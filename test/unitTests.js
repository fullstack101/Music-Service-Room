/* eslint-env mocha */

require('chai').should();

const helperFun = require('../server/helpers');

describe('spotify-server', () => {

    it ('should be a function', () => {
      helperFun.isMessageValid.should.be.a('function');
    });

    // it('should return an object', () => {
    //     helperFun.isMessageValid.should.be.an('object');
    // });

    it('should return a promise', () => {
        helperFun.getUserSpotifyId("abcdefghijklmnopqrstuvwxyz").should.be.a('promise');
    });
});
