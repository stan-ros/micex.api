import array_combine from './array_combine';
import request from 'request';
import _ from 'lodash';

const API_BASE = "http://www.micex.ru/iss/";

function required(parameter = ''){
    throw `Missing ${parameter} parameter`;
}

class Micex {
  static security(security = required('security')){
    return Micex._request(`securities/${security}`)
      .then((response) => {
        let security = {};
        let description = response.description;
        let fields = description.data.map(
          (data) => array_combine(description.columns, data));
        security.description = _.indexBy(fields, 'name');
        let boards = response.boards;
        fields = boards.data.map(
          (data) => array_combine(boards.columns, data));
        security.boards = _.indexBy(fields, 'boardid');

        return security;
      });
  }

  static securities(query = {}){
    return Micex._request('securities', query)
      .then(Micex._requestParsingColumnAndData);
  }

  static boards(engine = required('engine') , markets = required('markets')){
    return Micex._request(`engines/${engine}/markets/${markets}/boards`)
      .then(Micex._requestParsingColumnAndData);
  }

  static markets(engine = required('engine')) {
    return Micex._request(`engines/${engine}/markets`)
      .then(Micex._requestParsingColumnAndData);
  }

  static engines() {
    return Micex._request('engines')
      .then(Micex._requestParsingColumnAndData);
  }

  // extract and combine columns and data rows into objects array
  static _requestParsingColumnAndData(responseWrapper) {
    let key = Object.keys(responseWrapper)[0];
    let response = responseWrapper[key];
    let columns = response.columns;
    let data = response.data;
    let objects = data.map((object) => array_combine(columns, object));
    return objects;
  }

  static _request(method, query = {}) {
    return new Promise((resolve, reject) => {
      request(`${API_BASE}${method}.json`, {qs: query}, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          resolve(JSON.parse(body));
        } else {
          error = error || (response.statusCode + ' ' + response.statusMessage);
          reject(error);
        }
      })
    });
  }
}

export default Micex;
