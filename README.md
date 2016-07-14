# express-timeout-handler

Add a global timeouts to all your routes in express and add individual timeouts to specific routes. If a timeout happens an error will be passed to ''next'' callback in express, so that an error handler can act on the timeout. When the response ends, this modules disables all methods on the response object which might try and send something after the timeout happened.

	npm install --save express-timeout-handler

## Usage

```javascript
var timeout = require('express-timeout-handler');
var express = require('express');
var app = express();

var options = {

	//Optional. This will be the default timeout for all endpoints. If omitted there is no default timeout on endpoints
	timeout: 3000,

	//Optional. This will be the error passed to the next-function if a timeout happens. It can be an object or a function that returns the error to be used. If omitted a default error is used.
	error: new Error('oh no, timeout happened'),

	//Optional. Define a function to be called if an attempt to send a response happens after the timeout where:
	// method: is the method that was called on the response object
	// arguments: are the arguments passed to the method
	// requestTime: is the duration of the request
	// err: is the same err as was passed to the next-function when the timeout happened
	onDelayedResponse: function(method, arguments, requestTime, err) {
		console.log('Attempt to send response after timeout');
	},

	//Optional. Provide a list of which methods should be disabled on the response object when a timeout happens and an error has been sent. If omitted, a default list of all methods that tries to send a response will be disable on the response object
	disable: ['writeHead', 'send', 'json', 'end'];
};

app.use(timeout.handler(options));

app.get('/greeting',
	//This is a specific endpoint timeout which overrides the default timeout
	timeout.set(4000),
	function (req, res) {
		res.send('Hello world!');
	}
);

app.use(function(err, res, req, next) {
	if (!res.headersSent) {
		res.send('Error happened on server');
	}
});

app.listen(3000, function () {
	console.log('Server listening on port 3000');
});
```

## License

[MIT](http://opensource.org/licenses/MIT)
