define(['require', 'exports', 'module', 'exoskeleton'], function(require, exports, module, exoskeleton) {
	var EventHandler = require("famous/core/EventHandler");
	var store = require('store');
	var User = Backbone.Model.extend({
		constructor: function(argument) {
			this.eventInput = new EventHandler();
			this.eventInput.on('logout', function() {
				this.logout();
			});
			this.u = require('util/Utils');
			Backbone.Model.apply(this, arguments);
		},
		logout: function() {
			store.set('mobileSessionId', undefined);
			store.set('user', undefined);
		},
		login: function(username, password, callback) {
			this.u.queueJSON("logging in",
				this.u.makeGetUrl('dologinData'),
				this.u.makeGetArgs({
					username: username,
					password: password
				}),
				function(data) {
					if (data['success']) {
						store.set('mobileSessionId', data['mobileSessionId']);
						var currentUser = new User(data['user']);
						store.set('user', currentUser);
						console.log(data);
						callback(currentUser);
					} else {
						this.u.showAlert('Username or password not correct, please try again');
					}
				}.bind(this));

		},
		isLoggedIn: function() {
			User.isLoggedIn();
		},

	});

	User.isLoggedIn = function() {
		var mobileSessionId = store.get('mobileSessionId');
		if (!mobileSessionId) {
			return false;
		}
		return true;
	},

	User.getCurrentUserId = function() {
		var user = store.get('user');
		if (typeof user == 'undefined') {
			return false;
		}
		return user.id;
	}

	module.exports = User;
});
