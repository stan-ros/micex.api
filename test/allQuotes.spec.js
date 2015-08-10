/* jshint -W106 */
import Micex from '../src/micex';
import Mocha from 'mocha';

let Test = Mocha.Test;
let should = require('chai').should();

let suite = describe('MICEX GET ALL QUOTES.', function() {
  this.timeout(10000);

  before(() => {
    return Micex.index()
      .then((blocks) => {
        let markets = blocks.markets;
        for (let row of markets) {
          let engine = row.trade_engine_name;
          let market = row.market_name;
          let testTitle = `Getting quotes for ${engine}/${market}`;
          suite.addTest(new Test(testTitle, () => {
            return Micex.securitiesMarketdata(engine, market);
          }));
        }
      });
  });

  it('First sample test', () => {
    //just one not dynamic test to have all executed;
    should.exist(1);
  });
});
