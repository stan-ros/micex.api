# Micex API [![Build Status](https://travis-ci.org/sklyukin/micex.api.svg?branch=master)](https://travis-ci.org/sklyukin/micex.api)


Micex (MOEX) ISS API  
[http://moex.com/iss/reference/](http://moex.com/iss/reference/)

#### ru
Доступ к данным ММВБ через ISS API.

## Installation
`npm install micex.api`
```js
  Micex = require('micex.api');
```

## Request example
Get current USD/RUB value.  

```js
Micex.securityMarketdata('USD000UTSTOM')
  .then(function (security){
     console.log(security.node.last); // e.g. 64.04
     console.log(security);
  });
```

part of output
```js
{ SPREAD: 0.009,
  HIGH: 64.7,
  LOW: 63.455,
  OPEN: 64.098,
  LAST: 64.04,
  LASTCNGTOLASTWAPRICE: -0.0359,
  VALTODAY: 303942518535,
  VOLTODAY: 4738709000,
  VALTODAY_USD: 4738709000,
  WAPRICE: 64.1404,
  WAPTOPREVWAPRICE: 0.0645,
  CLOSEPRICE: 63.8399,
  NUMTRADES: 58453,
```

## More examples
```js
Micex.securityMarketdata('MICEXINDEXCF'); //MICEX INDEX
Micex.securityMarketdata('RTSI'); //RTS INDEX
Micex.securityMarketdata('SBER'; //SBERBANK SHARES
Micex.securityMarketdata('RIZ5'); //FUTURES RTS 12.15
```

## Available methods
```js
Micex.engines;
Micex.markets(engine);
Micex.boards(engine, market);
Micex.securitiesDefinitions(query);
Micex.securityDefinition(security);
Micex.securitiesMarketData(engine, market, query);
Micex.securitiesDataRaw(engine, market, query);
Micex.getSecurityInfo(security);
Micex.securityMarketData(security);
```
## More info
Micex class - [lib/mices.js](lib/micex.js)  
Usage examples / tests - [test/micex.spec.js](test/micex.spec.js)
