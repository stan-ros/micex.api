import Micex from '../lib/micex';
import _ from 'lodash';
let should = require('chai').should();

describe('MICEX. ', () => {
  describe('General. ', () => {

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

    it('Engines. Should be at least 3, should have stock engine', () => {
      return Micex.engines()
        .then((engines) => {
          engines.should.have.length.least(3);
          let stockEngine = engines.find(engine => engine.name === 'stock');
          should.exist(stockEngine);
        });
    });

    it('Markets. Should contains shares market for stock engine', () => {
      return Micex.markets('stock')
        .then((markets) => {
          markets.should.have.length.least(5);
          let sharesMarket = markets.find(market => market.NAME === 'shares');
          should.exist(sharesMarket);
        })
    });

    it('Boards. Should return ETC board for currency/selt engine/market', () => {
      return Micex.boards('currency', 'selt')
        .then((boards) => {
          let board = boards.find(board => board.boardid === 'CETS' && board.title === 'ETC');
          should.exist(board);
        })
    });
  });

  describe('Securities. ', () => {

    it('Should contains at least 50 securities', () => {
      return Micex.securitiesDefinitions()
        .then((securities) => {
          securities.should.have.length.least(50);
        });
    });

    it('Pagination should works for securities method', function() {
      this.timeout(4000);
      return Micex.securitiesDefinitions()
        .then((firstPageSecurites) => {
          return Micex.securitiesDefinitions({
              start: 100
            })
            .then((securities) => {
              securities.should.have.length.least(50);
              securities[0].id.should.not.be.eq(firstPageSecurites[0].id);
            });
        })
    });


    it('Should give specific security -  USD000UTSTOM ', () => {
      return Micex.securityDefinition('USD000UTSTOM')
        .then((security) => {
          should.exist(security);
          should.exist(security.description);
          should.exist(security.boards);
          should.exist(security.boards.CETS);
        })
    });
  });

  describe('Marketdata. ', () => {

    it('Should have securities data for currency/selt', () => {
      return Micex.securitiesDataRaw('currency', 'selt')
        .then((response) => {
          should.exist(response);
          should.exist(response.securities);
          should.exist(response.securities.data);
          response.securities.data.should.have.length.least(50);
          should.exist(response.marketdata);
          should.exist(response.marketdata.data);
          response.marketdata.data.should.have.length.least(50);
        });
    })

    it('Should return only 10 rows', () => {
      return Micex.securitiesDataRaw('currency', 'selt', {first: 10})
        .then((response) => {
          response.marketdata.data.length.should.be.eql(10);
        });
    });

    it('marketdata should return only 4 rows with max VALTODAY_RUR', () => {
      return Micex.securitiesMarketdata('currency', 'selt', {first: 4})
        .then((marketdata) => {
          Object.values(marketdata).length.should.be.eql(4);
        });
    });
  });
});
