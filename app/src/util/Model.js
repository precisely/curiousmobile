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
			window.plugins.spinnerDialog.hide();
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
			window.plugins.spinnerDialog.hide();
		};

		if (m.numJSONCalls > 0) { // json call in progress
			var jsonCall = function() {
				window.plugins.spinnerDialog.show(null, null, true);
				console.log('pending Json call in progress');
				model[method](attributes, {
					success: wrapSuccessCallback,
					error: wrapFailCallback
				});
			};
			++m.numJSONCalls;
			m.pendingJSONCalls.push(jsonCall);
		} else { // first call
			window.plugins.spinnerDialog.show(null, null, true);
			console.log('first Json call in progress');
			model[method](attributes, {
				success: wrapSuccessCallback,
				error: wrapFailCallback
			});
			++m.numJSONCalls;
		}
	}

	Model.nextJSONCall = function () {
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
