/* eslint-env mocha */

require('chai').should();

const helperFun = require('../server/helpers');

describe('spotify-server', () => {

    it ('should be a function', () => {
      helperFun.getUserOptions.should.be.a('function');
    });

    it('should return an object', () => {
        helperFun.getUserOptions('abcdefghigklmnopqrstuvwxyz').should.be.an('object');
    });
});
