var express = require('express');
var timeout = require('..');

module.exports = function (timeoutOpts, lag, specificTimeout, callback) {
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
