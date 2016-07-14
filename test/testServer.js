var express = require('express');
var app = express();
var timeout = require('..');

module.exports = function (timeoutOpts, lag, specificTimeout, callback) {
	if (typeof specificTimeout === 'function') {
		callback = specificTimeout;
		specificTimeout = null;
	}

	app.use(timeout.handler(timeoutOpts));

	app.get('/test', function (req, res, next) {
		setTimeout(() => {
			res.send('ok');
		}, lag);
	});

	if (specificTimeout) {
		app.get('/testSpecificTimeout',
		timeout.set(specificTimeout),
		function (req, res, next) {
			setTimeout(() => {
				res.send('ok');
			}, lag);
		});
	}

	app.use(function(err, req, res, next) {
		var statusCode = err.statusCode || 500;
		var msg = err.msg || 'Error happened on server';
		res.status(statusCode).send(msg);
	});

	var server = app.listen(4303, function () {
		var host = server.address().address;
		host = host === '::' ? 'localhost' : host;
		var url = `http://${host}:${server.address().port}`;
		callback(url);
	});
};
