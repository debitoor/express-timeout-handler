var groom = require('groom');

const DEFAULT_DISABLE_LIST = [
	'writeHead',
	'setHeaders',
	'write',
	'addTrailers',
	'end',
	'writeContinue',
	'append',
	'attachment',
	'download',
	'format',
	'json',
	'jsonp',
	'location',
	'redirect',
	'render',
	'send',
	'sendFile',
	'sendStatus',
	'set',
	'status',
	'type',
	'vary'
];

module.exports = {
	set: set,
	handler
};

function set(timeout) {
	validateTimeout(timeout);

	return function(req, res, next) {
		req.connection.setTimeout(timeout);
		next();
	};
}

function handler(opts) {
	opts = opts || {};
	validateTimeout(opts.timeout);
	if (opts.onResponse && typeof opts.onResponse !== 'function') {
		throw new Error('onResponse option must be a function');
	}
	var disableList = opts.disable || DEFAULT_DISABLE_LIST;
	var start, timeoutSocket, timeoutError;

	return function(req, res, next) {
		start = Date.now();
		timeoutSocket = null;
		timeoutError = null;

		opts.timeout && req.connection.setTimeout(opts.timeout);

		res.on('timeout', socket => {
			timeoutError = getError(opts.error);
			timeoutSocket = socket;
			next(timeoutError);
		});

		res.on('finish', timeoutSocket && disableResponse(res));

		next();
	};

	function disableResponse(res) {
		timeoutSocket.destroy();

		disableList.forEach( method => {
			res[method] = accessAttempt.bind(null, method);
		});
	}

	function accessAttempt() {
		if (opts.onDelayedResponse) {
			var requestTime = Date.now() - start;
			var method = `res.${arguments[0]}`;
			delete arguments[0];
			var args = Object.keys(arguments).reduce((memo, key, index) => {
				memo[index] = groom(arguments[key]);
				return memo;
			}, {});
			opts.onDelayedResponse(method, args, requestTime, timeoutError);
		}
	}
}

function getError(error) {
	if (typeof error === 'function') {
		return error();
	} else if (error) {
		return error;
	}
	return new Error('Timeout happened');
}

function validateTimeout(timeout) {
	if (typeof timeout !== 'number' || timeout % 1 !== 0 || timeout <= 0) {
		throw new Error('timeout must be a whole number bigger than zero');
	}
}
