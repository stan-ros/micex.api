/* jshint -W106 */
import arrayCombine from './array_combine';
import request from 'request';
import _ from 'lodash';
let debug = require('debug')('micex.api');

function required(parameter = '') {
  throw `Missing ${parameter} parameter`;
}

const API_BASE = 'http://www.micex.ru/iss';
const SECURITY_INFO = {};
const SECURITIES_ORDERING_COLUMN = 'VALTODAY';

class Micex {
  /*
   * difference with securityMarketdataExplicit - this method works without
   * engine / market parameters (it will use first pair from security
   * definition). It makes additional request to MICEX API for
   * first time for specific security, than cache this engine / market
   * for this security.
   */
  static securityMarketdata(security = required('security')) {
    return Micex.getSecurityInfo(security)
      .then(({
        engine, market
      }) => {
        return Micex.securityMarketdataExplicit(engine, market, security);
      });
  }

  static getSecurityInfo(security) {
    if (SECURITY_INFO[security]) {
      return Promise.resolve(SECURITY_INFO[security]);
    }
    return Micex.securityDefinition(security)
      .then((data) => {
        let boards = _.values(data.boards);
        if (!boards.length)
          throw `Security ${security} doesn't have any board in definition`;
        let board = boards[0];
        let info = {
          engine: board.engine,
          market: board.market
        };
        SECURITY_INFO[security] = info;
        return info;
      });
  }

  static securityMarketdataExplicit(engine = required('engine'),
    market = required('market'), security = required('security')) {
    return Micex.securityDataRawExplicit(engine, market, security)
      .then((response) => {
        let rows = Micex._responseToSecurities(response, {
          engine, market
        });
        rows = rows.filter(row => row.node.last);
        rows = _.sortByOrder(rows, SECURITIES_ORDERING_COLUMN, 'desc');
        if (!rows.length) return null;
        return rows[0];
      });
  }


  static securityDataRawExplicit(engine = required('engine'),
    market = required('market'), security = required('security')) {
    let url = `engines/${engine}/markets/${market}/securities/${security}`;
    return Micex._request(url);
  }

  /*return marketdata grouped by security id (board with most trading volume
   * is selected from data) */
  static securitiesMarketdata(engine = required('engine'),
    market = required('market'), query = {}) {

    const COLUMN = SECURITIES_ORDERING_COLUMN;
    if (!query.sort_column) {
      query.sort_order = 'desc';
      query.sort_column = COLUMN;
    }
    let first = null;
    if (query.first) {
      first = query.first;
      delete query.first;
    }

    return Micex.securitiesDataRaw(engine, market, query)
      .then((response) => {

        let rows = Micex._responseToSecurities(response, {
          engine, market
        });
        let data = {};
        for (let row of rows) {
          let secID = row.SECID;
          //so we use board with max VALTODAY for quotes
          if (row.node.last && (!data[secID] ||
              data[secID][COLUMN] < row[COLUMN])) {
            data[secID] = row;
          }
        }

        if (first) {
          rows = _.values(data);
          rows = _.sortByOrder(rows, COLUMN, 'desc');
          rows = rows.slice(0, first);
          data = _.indexBy(rows, 'SECID');
        }
        return data;
      });
  }

  static _responseToSecurities(response, requestParams) {
    function indexBy(row) {
      return `${row.SECID}_${row.BOARDID}`;
    }
    let blocks = Micex._responseToBlocks(response);
    let securitiesInfoIndex = _.indexBy(blocks.securities, indexBy);
    let securities = blocks.marketdata;
    //let's store info from securitiesInfo block
    securities.forEach((security, index) =>
      security.securityInfo = securitiesInfoIndex[indexBy(security)]);

    Micex._securitiesCustomFields(securities, requestParams);
    return securities;
  }

  //not structured response with marketdata from Micex
  static securitiesDataRaw(engine = required('engine'),
    market = required('market'), query = {}) {
    return Micex._request(`engines/${engine}/markets/${market}/securities`,
      query);
  }

  static securityDefinition(security = required('security')) {
    return Micex._request(`securities/${security}`)
      .then((response) => {
        let security = Micex._responseToBlocks(response);
        security.description = _.indexBy(security.description, 'name');
        security.boards = _.indexBy(security.boards, 'boardid');
        return security;
      });
  }

  static securitiesDefinitions(query = {}) {
    return Micex._request('securities', query)
      .then(Micex._responseFirstBlockToArray);
  }

  static boards(engine = required('engine'), market = required('market')) {
    return Micex._request(`engines/${engine}/markets/${market}/boards`)
      .then(Micex._responseFirstBlockToArray);
  }

  static markets(engine = required('engine')) {
    return Micex._request(`engines/${engine}/markets`)
      .then(Micex._responseFirstBlockToArray);
  }

  static engines() {
    return Micex._request('engines')
      .then(Micex._responseFirstBlockToArray);
  }

  // global constants
  static index() {
    return Micex._request('')
      .then(Micex._responseToBlocks);
  }


  static _securitiesCustomFields(securities, requestParams) {
    securities.forEach((security) => {
      Micex._securityCustomFields(security, requestParams);
    });
  }

  static _securityCustomFields(security, requestParams) {
    security.node = {
      last: security.LAST || security.CURRENTVALUE,
      volume: security.VALTODAY_RUR || security.VALTODAY ||
        security.VALTODAY_USD,
      friendlyTitle: Micex._securityFriendlyTitle(security, requestParams),
      id: security.SECID
    };
    //in case market closed for today or there are no deals for this security
    let info = security.securityInfo;
    if (!security.node.last && info) {
      security.node.last = info.PREVPRICE;
    }
  }

  static _securityFriendlyTitle(security, {
    engine, market
  }) {
    let info = security.securityInfo;
    if (!info) return security.SECID;
    switch (market) {
      case 'index':
        return info.NAME || info.SHORTNAME;
      case 'forts':
        return info.SECNAME || info.SHORTNAME;
      default:
        return info.SHORTNAME;
    }
  }

  //call _responseBlockToArray for multiple blocks
  static _responseToBlocks(response) {
    return _.mapValues(response, (block) => Micex._responseBlockToArray(block));
  }

  //same as _responseToBlocks, just only parse first block
  static _responseFirstBlockToArray(response) {
    let key = _.keys(response)[0];
    return Micex._responseBlockToArray(response[key]);
  }

  //combine columns and data to array of objects
  static _responseBlockToArray(block) {
    let rows = block.data.map(
      (data) => arrayCombine(block.columns, data));
    return rows;
  }

  static _request(method, query = {}) {
    let BASE = method ? API_BASE + '/' : API_BASE;
    return new Promise((resolve, reject) => {
      request(`${BASE}${method}.json`, {
        qs: query
      }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          let json;
          try {
            json = JSON.parse(body);
          } catch (e) {
            debug('Unable to parse body');
            debug(body);
            return reject(e);
          }
          resolve(json);
        } else {
          error = error || (response.statusCode + ' ' + response.statusMessage);
          reject(error);
        }
      });
    });
  }
}

export default Micex;
