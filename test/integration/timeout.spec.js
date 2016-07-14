var request = require('request');
var testServer = require('../testServer');

describe.only('timeout.spec.js', () => {

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

	describe('when calling endoints without timeout', () => {
		var statusCode, delayArguments;

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
			var specificTimeout = 500;
			testServer(options, lag, specificTimeout, url => {
				var endpoint = `${url}/test`;
				request.get(endpoint, (err, resp, body) => {
					if (err) {
						done(err);
					}
					statusCode = resp && resp.statusCode;
				});
			});
		});

		it('should timeout within the default timeout', () => {
			expect(statusCode).to.equal(503);
		});

		describe('when onDelayedResponse function is called', () => {

			it('should return which method was called', () => {
				expect(delayArguments.method).to.equal('res.send');
			});

			it('should return the argument values provided to the method', () => {
				expect(delayArguments.args).to.deep.equal({
					0: 'ok'
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



});
