define(['require', 'exports', 'module', 'exoskeleton'], function(require, exports, module, exoskeleton) {
	var User = Backbone.Model.extend({
		property: {}
	});

	User.login = function(username, password, callback) {
		queueJSON("logging in",
			makeGetUrl('dologinData'),
			makeGetArgs({
				username: username,
				password: password
			}),
			function(data) {
				if (data['success']) {
					localStorage['mobileSessionId'] = data['mobileSessionId'];
					callback(data);
				} else {
					showAlert('Username or password not correct, please try again');
				}
			});

	}
	module.exports = User;
});
