import array_combine from './array_combine';
import request from 'request';
const API_BASE = "http://www.micex.ru/iss/";

function required(parameter = ''){
    throw `Missing ${parameter} parameter`;
}

class Micex {
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

  // extract and combine columns and data row into objects array
  static _requestParsingColumnAndData(responseWrapper) {
    let key = Object.keys(responseWrapper)[0];
    let response = responseWrapper[key];
    let columns = response.columns;
    let data = response.data;
    let objects = data.map((object) => array_combine(columns, object));
    return objects;
  }

  static _request(method) {
    return new Promise((resolve, reject) => {
      request(`${API_BASE}${method}.json`, (error, response, body) => {
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
