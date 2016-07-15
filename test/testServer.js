var express = require('express');
var util = require('util');
var timeout = require('..');

module.exports = function (timeoutOpts, lag, specificTimeout, callback) {
	if (typeof specificTimeout === 'function') {
		callback = specificTimeout;
		specificTimeout = null;
	}

	var app = express();
	var start;

	app.use(timeout.handler(timeoutOpts));

	app.get('/test',
		function (req, res, next) {
			start = Date.now();
			next();
		},
		function (req, res, next) {
			setTimeout(() => {
				if (res.globalTimeout) {
					res.send('globalTimeout');
				} else {
					res.send('no globalTimeout set');
				}
			}, lag);
		}
	);

	if (specificTimeout) {
		app.get('/testSpecificTimeout',
			function (req, res, next) {
				start = Date.now();
				next();
			},
			timeout.set(specificTimeout),
			function (req, res, next) {
				setTimeout(() => {
					res.send('ok');
				}, lag);
			}
		);
	}

	app.use(function(err, req, res, next) {
		var requestTime = Date.now() - start;
		var msg;
		if (util.isError(err)) {
			msg = err.toString();
		} else {
			msg = err.msg || 'Error happened on server';
		}
		var statusCode = err.statusCode || 500;
		res.status(statusCode).send({
			msg,
			requestTime
		});
	});

	var server = app.listen(4303, function () {
		var host = server.address().address;
		host = host === '::' ? 'localhost' : host;
		var url = `http://${host}:${server.address().port}`;
		callback(url);
	});

	return server;
};
