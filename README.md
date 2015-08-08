# Micex API [![Build Status](https://travis-ci.org/sklyukin/micex.api.svg?branch=master)](https://travis-ci.org/sklyukin/micex.api)


Micex (MOEX) ISS API  
[http://moex.com/iss/reference/](http://moex.com/iss/reference/)

####ru
Доступ к данным ММВБ через ISS API.

##Request example
Get list of markets in `stocks` engine.  
```js
Micex.markets('stocks')
  .then(function (markets){
    console.log(markets)
  });
```

response
```js
[ { id: 5, NAME: 'index', title: 'Индексы фондового рынка' },
  { id: 1, NAME: 'shares', title: 'Рынок акций' },
  { id: 2, NAME: 'bonds', title: 'Рынок облигаций' },
  { id: 4, NAME: 'ndm', title: 'Режим переговорных сделок' },
  { id: 29, NAME: 'otc', title: 'ОТС' },
  { id: 27, NAME: 'ccp', title: 'РЕПО с ЦК' },
  { id: 3, NAME: 'repo', title: 'Рынок сделок РЕПО' },
  { id: 28, NAME: 'qnv', title: 'Квал. инвесторы' },
  { id: 33, NAME: 'moexboard', title: 'MOEX Board' },
  { id: 25, NAME: 'classica', title: 'Classica' },
  { id: 23, NAME: 'standard', title: 'Standard' } ]
```
