import Micex from '../lib/micex';
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
      return Micex.securities()
        .then((securities) => {
          securities.should.have.length.least(50);
        });
    });

    it.only('Pagination should works for securities method', function() {
      this.timeout(4000);
      return Micex.securities()
        .then((firstPageSecurites) => {
          return Micex.securities({
              start: 100
            })
            .then((securities) => {
              securities.should.have.length.least(50);
              securities[0].id.should.not.be.eq(firstPageSecurites[0].id);
            });
        })
    });


    it('Should give specific security -  USD000UTSTOM ', () => {
      return Micex.security('USD000UTSTOM')
        .then((security) => {
          should.exist(security);
          should.exist(security.description);
          should.exist(security.boards);
          should.exist(security.boards.CETS);
        })
    });
  });
});
