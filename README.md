# express-timeout-handler

[![npm version](https://badge.fury.io/js/express-timeout-handler.svg)](https://badge.fury.io/js/express-timeout-handler) [![Build Status](https://travis-ci.org/debitoor/express-timeout-handler.svg?branch=master)](https://travis-ci.org/debitoor/express-timeout-handler) [![Dependency Status](https://david-dm.org/debitoor/express-timeout-handler.svg)](https://david-dm.org/debitoor/express-timeout-handler) [![devDependency Status](https://david-dm.org/debitoor/express-timeout-handler/dev-status.svg)](https://david-dm.org/debitoor/express-timeout-handler#info=devDependencies) [![Coverage Status](https://coveralls.io/repos/github/debitoor/express-timeout-handler/badge.svg?branch=master)](https://coveralls.io/github/debitoor/express-timeout-handler?branch=master)

Express timeout middleware that ensures a response is returned to the client on a timeout event.

Add a global timeout to all your routes in express and add individual timeouts to specific routes. If a timeout happens the ``onTimeout`` function will be called. The ``onTimeout`` function MUST terminate the request with a response. When a timeout happens, this module will set a ``globalTimeout`` property on the response object to true and disable all methods on the response object which might try and send something after the timeout happened.

Note on streams: whenever a stream has started streaming to the response object, the ``onTimeout`` function will not be triggered. Or in other words: if a timeout happens after we start streaming, the stream will not be interrupted.

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

  // Optional. This function will be called on a timeout and it MUST
  // terminate the request.
  // If omitted the module will end the request with a default 503 error.
  onTimeout: function(req, res) {
    res.status(503).send('Service unavailable. Please retry.');
  },

  // Optional. Define a function to be called if an attempt to send a response
  // happens after the timeout where:
  // - method: is the method that was called on the response object
  // - args: are the arguments passed to the method
  // - requestTime: is the duration of the request
  // timeout happened
  onDelayedResponse: function(req, method, args, requestTime) {
    console.log(`Attempted to call ${method} after timeout`);
  },

  // Optional. Provide a list of which methods should be disabled on the
  // response object when a timeout happens and an error has been sent. If
  // omitted, a default list of all methods that tries to send a response
  // will be disable on the response object
  disable: ['write', 'setHeaders', 'send', 'json', 'end'];
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

app.listen(3000, function () {
  console.log('Server listening on port 3000');
});
```

## License

[MIT](http://opensource.org/licenses/MIT)
