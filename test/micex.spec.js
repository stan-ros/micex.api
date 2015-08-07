import Micex from '../lib/micex';
let should = require('chai').should();

describe('MICEX. ', () => {
  it('General request', (done) => {
    should.exist(Micex);
    should.exist(Micex._request);
    Micex._request('engines')
      .then((data) => {
        data.should.be.an('object');
        data.should.have.property('engines');
        data.engines.should.have.property('data');
        done();
      })
      .catch((error) => {
        console.console.error(error);
        throw error;
      })
  });
  it('Engines. Should be at least 3', (done) => {
    Micex.engines()
      .then((engines) => {
          engines.should.have.length.least(6);
          done();
      });
  });
});
