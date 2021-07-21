var express = require('express');
var timeout = require('..');
let serverError = { err: null };

const testServer = function (timeoutOpts, lag, specificTimeout, callback) {

	if (typeof specificTimeout === 'function') {
		callback = specificTimeout;
		specificTimeout = null;
	}

	var app = express();

	app.use(timeout.handler(timeoutOpts));

	app.get('/test',
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

	app.get('/testChaining',
		function (req, res, next) {
			setTimeout(() => {
				try {
					res
						.status(500)
						.json({ message: 'Chaining should work' });
				} catch (err) {
					serverError.err = err;
				}
			}, lag);
		}
	);

	if (specificTimeout) {
		app.get('/testSpecificTimeout',
			timeout.set(specificTimeout),
			function (req, res, next) {
				setTimeout(() => {
					res.send('ok');
				}, lag);
			}
		);
	}

	var server = app.listen(4303, function () {
		var host = server.address().address;
		host = host === '::' ? 'localhost' : host;
		var url = `http://${host}:${server.address().port}`;
		callback(url);
	});

	return server;
};

module.exports = {
	testServer,
	serverError
};