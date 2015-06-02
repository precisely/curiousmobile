define(['require', 'exports', 'module', 'store', 'jstzdetect', 'exoskeleton', 'views/AlertView'],
	function(require, exports, module, store, jstz, exoskeleton, AlertView) {
		var u = require('util/Utils');
		var Model = {};
		var m = Model;

		m.numJSONCalls = 0;
		m.pendingJSONCalls = [];

		Model.queueJSON = function(model, method, attributes, options) {
			var currentLoginSession = u._loginSessionNumber; // cache current login session
			var stillRunning = true;

			window.setTimeout(function() {
				if (stillRunning) {
					stillRunning = false;
					window.location.reload();
				}
			}, 10000);

			if (!options) {
				options = attributes;
				attributes = null;
			}
			var delay = options.delay;

			var wrapSuccessCallback = function(modelInstance, response) {
				stillRunning = false;
				if (currentLoginSession != u._loginSessionNumber)
					return; // if current login session is over, cancel callbacks
				if (options.success)
					options.success(modelInstance, response);
				m.nextJSONCall();
				u.spinnerStop();
			};
			var wrapFailCallback = function(modelInstance, response) {
				stillRunning = false;
				if (currentLoginSession != u._loginSessionNumber)
					return; // if current login session is over, cancel callbacks
				if (options.error)
					options.error(modelInstance, response);

				m.nextJSONCall();
				if (msg == "timeout") {
					if (delay * 2 > 1000000) { // stop retrying after delay too large
						console.log('server down...');
						u.showAlert('Server down... giving up');
						return;
					}
					if (!(delay > 0))
						u.showAlert('Server not responding... retrying');

					delay = (delay > 0 ? delay * 2 : 5000);
					window.setTimeout(function() {
						m.queueJSON(model, method, attributes, options);
					}, delay);
				}
				u.spinnerStop();
			};

			var jsonCall = function() {
				u.spinnerStart();
				console.log('pending Json call in progress');
				if (attributes) {
					model[method](attributes, {
						success: wrapSuccessCallback,
						error: wrapFailCallback
					});
				} else {
					if (options.attributeNeeded) {
						model[method](null, {
							success: wrapSuccessCallback,
							error: wrapFailCallback
						});
					} else {
						model[method]({
							success: wrapSuccessCallback,
							error: wrapFailCallback
						});
					}
				}
			};

			if (m.numJSONCalls > 0) { // json call in progress
				++m.numJSONCalls;
				m.pendingJSONCalls.push(jsonCall);
			} else { // first call
				u.spinnerStart();
				console.log('first Json call in progress');
				jsonCall();
				++m.numJSONCalls;
			}
		}

		Model.nextJSONCall = function() {
			--m.numJSONCalls;
			if (m.numJSONCalls < 0)
				m.numJSONCalls = 0;
			if (m.pendingJSONCalls.length > 0) {
				var nextCall = m.pendingJSONCalls.shift();
				nextCall();
			}
		}

		Model.clearJSONQueue = function() {
			m.numJSONCalls = 0;
			m.pendingJSONCalls = [];
		}

		module.exports = Model;
	});
