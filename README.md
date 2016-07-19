# express-timeout-handler

[![npm version](https://badge.fury.io/js/express-timeout-handler.svg)](https://badge.fury.io/js/express-timeout-handler) [![Build Status](https://travis-ci.org/debitoor/express-timeout-handler.svg?branch=master)](https://travis-ci.org/debitoor/express-timeout-handler) [![Dependency Status](https://david-dm.org/debitoor/express-timeout-handler.svg)](https://david-dm.org/debitoor/express-timeout-handler) [![devDependency Status](https://david-dm.org/debitoor/express-timeout-handler/dev-status.svg)](https://david-dm.org/debitoor/express-timeout-handler#info=devDependencies) [![Coverage Status](https://coveralls.io/repos/github/debitoor/express-timeout-handler/badge.svg?branch=master)](https://coveralls.io/github/debitoor/express-timeout-handler?branch=master)

Express timeout middleware that works in combination with any error middleware in express.

Add a global timeouts to all your routes in express and add individual timeouts to specific routes. If a timeout happens an error will be passed to the ``next`` callback in express, so that an error handler can act on the timeout. After the error handler sends a response to the caller, this module will set a ``globalTimeout`` property on the response object to true and disable all methods on the response object which might try and send something after the timeout happened.

Note on streams: whenever a stream has started streaming to the response object, the timeout can not be expected to be triggered. Or in other words: if a timeout happens after we start streaming, the stream will not be interrupted.

	npm install --save express-timeout-handler

## Usage

```javascript
var timeout = require('express-timeout-handler');
var express = require('express');
var app = express();

var options = {

  // Optional. This will be the default timeout for all endpoints.
  // If omitted there is no default timeout on endpoints
  timeout: 3000,

  // Optional. This will be the error passed to the next-function if a timeout
  // happens. It can be an object or a function that returns the error to be
  // used. If omitted a default error is used.
  error: {
    msg: 'Service unavailable. Please try again.',
    statusCode: 503
  },

  // Optional. Define a function to be called if an attempt to send a response
  // happens after the timeout where:
  // - method: is the method that was called on the response object
  // - args: are the arguments passed to the method
  // - requestTime: is the duration of the request
  // - err: is the same err that was passed to the next-function when the
  // timeout happened
  onDelayedResponse: function(method, args, requestTime, err) {
    console.log(`Attempted to call ${method} after timeout`);
  },

  // Optional. Provide a list of which methods should be disabled on the
  // response object when a timeout happens and an error has been sent. If
  // omitted, a default list of all methods that tries to send a response
  // will be disable on the response object
  disable: ['writeHead', 'send', 'json', 'end'];
};

app.use(timeout.handler(options));

app.get('/greet', //The default timeout is in effect here
  function (req, res) {
    res.send('Hello world!');
  }
);

app.get('/leave',
  // This is a specific endpoint timeout which overrides the default timeout
  timeout.set(4000),
  function (req, res) {
    res.send('Goodbye!');
  }
);

app.use(function(err, req, res, next) {
  var statusCode = err.statusCode || 500;
  var msg = err.msg || 'Error happened on server';
  res.status(statusCode).send(msg);
});

app.listen(3000, function () {
  console.log('Server listening on port 3000');
});
```

## License

[MIT](http://opensource.org/licenses/MIT)
