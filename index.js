const DEFAULT_DISABLE_LIST = [
	'setHeaders',
	'write',
	'send',
	'json',
	'status',
	'end',
	'writeHead',
	'addTrailers',
	'writeContinue',
	'append',
	'attachment',
	'download',
	'format',
	'jsonp',
	'location',
	'redirect',
	'render',
	'sendFile',
	'sendStatus',
	'set',
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
	if (opts && typeof opts.timeout !== 'undefined') {
		validateTimeout(opts.timeout);
	}
	opts = opts || {};

	if (opts.onTimeout && typeof opts.onTimeout !== 'function') {
		throw new Error('onTimeout option must be a function');
	}
	if (opts.onDelayedResponse && typeof opts.onDelayedResponse !== 'function') {
		throw new Error('onDelayedResponse option must be a function');
	}
	if (opts.disable && !Array.isArray(opts.disable)) {
		throw new Error('disable option must be an array');
	}
	const disableList = opts.disable || DEFAULT_DISABLE_LIST;

	return function(req, res, next) {
		const start = Date.now();
		let timeoutSocket = null;

		opts.timeout && req.connection.setTimeout(opts.timeout);

		res.on('timeout', socket => {
			res.globalTimeout = true;
			timeoutSocket = socket;

			if (!res.headersSent) {
				if (opts.onTimeout) {
					opts.onTimeout(req, res, next);
				} else {
					res.status(503).send('Service unavailable');
				}
				disableList.forEach( method => {
					res[method] = accessAttempt.bind(res, method);
				});
			}
		});

		res.on('finish', () => {
			timeoutSocket && timeoutSocket.destroy();
		});

		function accessAttempt() {
			if (opts.onDelayedResponse) {
				const requestTime = Date.now() - start;
				const method = `res.${arguments[0]}`;
				delete arguments[0];
				const args = Object.keys(arguments).reduce((memo, key, index) => {
					memo[index] = arguments[key];
					return memo;
				}, {});
				opts.onDelayedResponse(req, method, args, requestTime);
				opts.onDelayedResponse = null; //only call onDelayedResponse once
			}
			return this;
		}

		next();
	};
}

function validateTimeout(timeout) {
	if (typeof timeout !== 'number' || timeout % 1 !== 0 || timeout <= 0) {
		throw new Error('timeout must be a whole number bigger than zero');
	}
}
