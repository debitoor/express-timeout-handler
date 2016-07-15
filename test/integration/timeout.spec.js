var request = require('request');
var testServer = require('../testServer');

describe('timeout.spec.js', () => {

	describe('options validations', () => {

		describe('when timeout is not a number', () => {
			var errMsg;

			before( done => {
				try {
					testServer({
						timeout: '1'
					}, 0, 0, () => {});
				} catch (e) {
					errMsg = e.toString();
					done();
				}
			});

			it('should throw an error', () => {
				expect(errMsg).to.be.equal('Error: timeout must be a whole number bigger than zero');
			});
		});

		describe('when timeout is not a whole number', () => {
			var errMsg;

			before( done => {
				try {
					testServer({
						timeout: 1.1
					}, 0, 0, () => {});
				} catch (e) {
					errMsg = e.toString();
					done();
				}
			});

			it('should throw an error', () => {
				expect(errMsg).to.be.equal('Error: timeout must be a whole number bigger than zero');
			});
		});

		describe('when timeout is not larger than zero', () => {
			var errMsg;

			before( done => {
				try {
					testServer({
						timeout: 0
					}, 0, 0, () => {});
				} catch (e) {
					errMsg = e.toString();
					done();
				}
			});

			it('should throw an error', () => {
				expect(errMsg).to.be.equal('Error: timeout must be a whole number bigger than zero');
			});
		});

		describe('when onDelayedResponse is not a function', () => {
			var errMsg;

			before( done => {
				try {
					testServer({
						timeout: 1,
						onDelayedResponse: '1'
					}, 0, 0, () => {});
				} catch (e) {
					errMsg = e.toString();
					done();
				}
			});

			it('should throw an error', () => {
				expect(errMsg).to.be.equal('Error: onDelayedResponse option must be a function');
			});
		});

		describe('when disable is not an Array', () => {
			var errMsg;

			before( done => {
				try {
					testServer({
						timeout: 1,
						onDelayedResponse: () => {},
						disable: '1'
					}, 0, 0, () => {});
				} catch (e) {
					errMsg = e.toString();
					done();
				}
			});

			it('should throw an error', () => {
				expect(errMsg).to.be.equal('Error: disable option must be an array');
			});
		});
	});

	describe('when calling endoint without timeout', () => {
		var server, statusCode, responseBody, delayArguments;

		before( done => {
			var options = {
				timeout: 250,
				error: {
					statusCode: 503
				},
				onDelayedResponse: function(method, args, requestTime, err) {
					delayArguments = {
						method,
						args,
						requestTime,
						err
					};
					done();
				}
			};

			var lag = 750;
			server = testServer(options, lag, url => {
				var endpoint = `${url}/test`;
				request.get(endpoint, { json: true }, (err, resp, body) => {
					if (err) {
						done(err);
					}
					statusCode = resp && resp.statusCode;
					responseBody = body;
				});
			});
		});

		after( done => {
			server.close(done);
		});

		it('should timeout after default timeout time has passed', () => {
			expect(responseBody.requestTime).to.be.at.least(250);
		});

		it('should respond with expected error', () => {
			expect(statusCode).to.equal(503);
		});

		describe('when onDelayedResponse function is called', () => {

			it('should return which method was called', () => {
				expect(delayArguments.method).to.equal('res.send');
			});

			it('should return the argument values provided to the method', () => {
				expect(delayArguments.args).to.deep.equal({
					0: 'globalTimeout'
				});
			});

			it('should return the true request duration', () => {
				expect(delayArguments.requestTime).to.be.at.least(750);
			});

			it('should return err passed to next-function', () => {
				expect(delayArguments.err).to.deep.equal({
					statusCode: 503
				});
			});
		});
	});

	describe('when calling endoint with specific endpoint timeout', () => {
		var server, statusCode, responseBody;

		before( done => {
			var options = {
				timeout: 250,
				error: () => {
					return {
						statusCode: 503
					};
				}
			};

			var lag = 750;
			var specificTimeout = 500;
			server = testServer(options, lag, specificTimeout, url => {
				var endpoint = `${url}/testSpecificTimeout`;
				request.get(endpoint, { json: true }, (err, resp, body) => {
					statusCode = resp && resp.statusCode;
					responseBody = body;
					done(err);
				});
			});
		});

		after( done => {
			server.close(done);
		});

		it('should timeout after specific endpoint timeout time has passed', () => {
			expect(responseBody.requestTime).to.be.at.least(500);
		});

		it('should respond with expected error', () => {
			expect(statusCode).to.equal(503);
		});

	});

	describe('when setting no default timeout and calling endpoint with specific timeout', () => {
		var server, responseBody;

		before( done => {
			var lag = 750;
			var specificTimeout = 500;
			server = testServer(null, lag, specificTimeout, url => {
				var endpoint = `${url}/testSpecificTimeout`;
				request.get(endpoint, { json: true }, (err, resp, body) => {
					responseBody = body;
					done(err);
				});
			});
		});

		after( done => {
			server.close(done);
		});

		it('should timeout after specific endpoint timeout time has passed', () => {
			expect(responseBody.requestTime).to.be.at.least(500);
		});

		it('should respond with expected error', () => {
			expect(responseBody.msg).to.equal('Error: Timeout happened');
		});
	});

});
