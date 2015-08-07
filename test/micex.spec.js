import Micex from '../lib/micex';
let should = require('chai').should();

describe('MICEX. ', () => {
  it('General request', () => {
    should.exist(Micex);
    should.exist(Micex._request);
    return Micex._request('engines')
      .then((data) => {
        data.should.be.an('object');
        data.should.have.property('engines');
        data.engines.should.have.property('data');
      })
  });

  it('Engines. Should be at least 3, should have stock engine.', () => {
    return Micex.engines()
      .then((engines) => {
        engines.should.have.length.least(3);
        let stockEngine = engines.find( engine => engine.name === 'stock');
        should.exist(stockEngine);
      });
  });

  it('Markets. Should contains shares market for stock engine', () => {
    return Micex.markets('stock')
      .then((markets) => {
        markets.should.have.length.least(5);
        let sharesMarket = markets.find( market => market.NAME === 'shares');
        should.exist(sharesMarket);
      })
  });
});
