'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _array_combine = require('./array_combine');

var _array_combine2 = _interopRequireDefault(_array_combine);

var _request2 = require('request');

var _request3 = _interopRequireDefault(_request2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function required() {
  var parameter = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

  throw 'Missing ' + parameter + ' parameter';
}

var API_BASE = "http://www.micex.ru/iss/";
var SECURITY_INFO = {};

var Micex = (function () {
  function Micex() {
    _classCallCheck(this, Micex);
  }

  _createClass(Micex, null, [{
    key: 'securityMarketdata',

    /*
     * difference with securityMarketdataExplicit - this method works without
     * engine / market parameters (it will use first pair from security
     * definition). It makes additional request to MICEX API for
     * first time for specific security, than cache this engine / market
     * for this security.
     */
    value: function securityMarketdata() {
      var security = arguments.length <= 0 || arguments[0] === undefined ? required('security') : arguments[0];

      return Micex.getSecurityInfo(security).then(function (_ref) {
        var engine = _ref.engine;
        var market = _ref.market;

        return Micex.securityMarketdataExplicit(engine, market, security);
      });
    }
  }, {
    key: 'getSecurityInfo',
    value: function getSecurityInfo(security) {
      if (SECURITY_INFO[security]) {
        return Promise.resolve(SECURITY_INFO[security]);
      }
      return Micex.securityDefinition(security).then(function (data) {
        var boards = _lodash2['default'].values(data.boards);
        if (!boards.length) throw 'Security ' + security + ' doesn\'t have any board in definition';
        var board = boards[0];
        var info = {
          engine: board.engine,
          market: board.market
        };
        SECURITY_INFO[security] = info;
        return info;
      });
    }
  }, {
    key: 'securityMarketdataExplicit',
    value: function securityMarketdataExplicit() {
      var engine = arguments.length <= 0 || arguments[0] === undefined ? required('engine') : arguments[0];
      var market = arguments.length <= 1 || arguments[1] === undefined ? required('market') : arguments[1];
      var security = arguments.length <= 2 || arguments[2] === undefined ? required('security') : arguments[2];

      return Micex.securityDataRawExplicit(engine, market, security).then(function (response) {
        var marketdata = response.marketdata;
        var rows = marketdata.data.map(function (data) {
          return (0, _array_combine2['default'])(marketdata.columns, data);
        });
        rows.sort(function (a, b) {
          return b.VALTODAY_RUR - a.VALTODAY_RUR;
        });
        if (!rows.length) return null;
        var row = rows[0];
        row.node = {
          last: row.LAST || row.LASTVALUE,
          id: row.SECID
        };
        return row;
      });
    }
  }, {
    key: 'securityDataRawExplicit',
    value: function securityDataRawExplicit() {
      var engine = arguments.length <= 0 || arguments[0] === undefined ? required('engine') : arguments[0];
      var market = arguments.length <= 1 || arguments[1] === undefined ? required('market') : arguments[1];
      var security = arguments.length <= 2 || arguments[2] === undefined ? required('security') : arguments[2];

      return Micex._request('engines/' + engine + '/markets/' + market + '/securities/' + security);
    }

    //return marketdata grouped by security id (board with most trading volume is selected from data)
  }, {
    key: 'securitiesMarketdata',
    value: function securitiesMarketdata() {
      var engine = arguments.length <= 0 || arguments[0] === undefined ? required('engine') : arguments[0];
      var market = arguments.length <= 1 || arguments[1] === undefined ? required('market') : arguments[1];
      var query = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (!query.sort_column) {
        query.sort_order = 'desc';
        query.sort_column = "VALTODAY_RUR";
      }
      var first = null;
      if (query.first) {
        first = query.first;
        delete query.first;
      }

      return Micex.securitiesDataRaw(engine, market, query).then(function (response) {
        var marketdata = response.marketdata;
        var rows = marketdata.data.map(function (data) {
          return (0, _array_combine2['default'])(marketdata.columns, data);
        });

        var data = {};
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = rows[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var row = _step.value;

            var secID = row.SECID;
            //so we use board with max VALTODAY for quotes
            if (row.LAST && (!data[secID] || data[secID].VALTODAY_RUR < row.VALTODAY_RUR)) {
              data[secID] = row;
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
              _iterator['return']();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        if (first) {
          rows = _lodash2['default'].values(data);
          rows.sort(function (a, b) {
            return b.VALTODAY_RUR - a.VALTODAY_RUR;
          });

          rows = rows.slice(0, first);
          data = _lodash2['default'].indexBy(rows, 'SECID');
        }
        return data;
      });
    }

    //not structured response with marketdata from Micex
  }, {
    key: 'securitiesDataRaw',
    value: function securitiesDataRaw() {
      var engine = arguments.length <= 0 || arguments[0] === undefined ? required('engine') : arguments[0];
      var market = arguments.length <= 1 || arguments[1] === undefined ? required('market') : arguments[1];
      var query = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      return Micex._request('engines/' + engine + '/markets/' + market + '/securities', query);
    }
  }, {
    key: 'securityDefinition',
    value: function securityDefinition() {
      var security = arguments.length <= 0 || arguments[0] === undefined ? required('security') : arguments[0];

      return Micex._request('securities/' + security).then(function (response) {
        var security = {};
        var description = response.description;
        var fields = description.data.map(function (data) {
          return (0, _array_combine2['default'])(description.columns, data);
        });
        security.description = _lodash2['default'].indexBy(fields, 'name');
        var boards = response.boards;
        fields = boards.data.map(function (data) {
          return (0, _array_combine2['default'])(boards.columns, data);
        });
        security.boards = _lodash2['default'].indexBy(fields, 'boardid');

        return security;
      });
    }
  }, {
    key: 'securitiesDefinitions',
    value: function securitiesDefinitions() {
      var query = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return Micex._request('securities', query).then(Micex._requestParsingColumnAndData);
    }
  }, {
    key: 'boards',
    value: function boards() {
      var engine = arguments.length <= 0 || arguments[0] === undefined ? required('engine') : arguments[0];
      var market = arguments.length <= 1 || arguments[1] === undefined ? required('market') : arguments[1];

      return Micex._request('engines/' + engine + '/markets/' + market + '/boards').then(Micex._requestParsingColumnAndData);
    }
  }, {
    key: 'markets',
    value: function markets() {
      var engine = arguments.length <= 0 || arguments[0] === undefined ? required('engine') : arguments[0];

      return Micex._request('engines/' + engine + '/markets').then(Micex._requestParsingColumnAndData);
    }
  }, {
    key: 'engines',
    value: function engines() {
      return Micex._request('engines').then(Micex._requestParsingColumnAndData);
    }

    // extract and combine columns and data rows into objects array
  }, {
    key: '_requestParsingColumnAndData',
    value: function _requestParsingColumnAndData(responseWrapper) {
      var key = _lodash2['default'].keys(responseWrapper)[0];
      var response = responseWrapper[key];
      var columns = response.columns;
      var data = response.data;
      var objects = data.map(function (object) {
        return (0, _array_combine2['default'])(columns, object);
      });
      return objects;
    }
  }, {
    key: '_request',
    value: function _request(method) {
      var query = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return new Promise(function (resolve, reject) {
        (0, _request3['default'])('' + API_BASE + method + '.json', {
          qs: query
        }, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            resolve(JSON.parse(body));
          } else {
            error = error || response.statusCode + ' ' + response.statusMessage;
            reject(error);
          }
        });
      });
    }
  }]);

  return Micex;
})();

exports['default'] = Micex;
module.exports = exports['default'];