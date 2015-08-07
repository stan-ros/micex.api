import array_combine from './array_combine';
import request from 'request';
const API_BASE = "http://www.micex.ru/iss/";

class Micex {
  static engines() {
    return Micex._request('engines')
      .then((response) => {
        let columns = response.engines.columns;
        let data = response.engines.data;
        let engines =  data.map( (engine) => array_combine(columns, engine) );
        return engines;
      });
  }
  static _request(method) {
    return new Promise((resolve, reject) => {
      request(`${API_BASE}${method}.json`, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          resolve(JSON.parse(body));
        } else {
          reject(error);
        }
      })
    });
  }
}

export default Micex;
