define(function(require, exports, module) {
	var exoskeleton = require('exoskeleton');
	var EventHandler = require("famous/core/EventHandler");
	var store = require('store');
	var u = require('util/Utils');
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
						callback(this.getUserData(data));
					} else {
						this.u.showAlert('Username or password not correct, please try again');
					}
				}.bind(this));

		},
		isLoggedIn: function() {
			User.isLoggedIn();
		},
		register: function(email, username, password, callback) {
			this.u.queuePostJSON("creating account",
				this.u.makePostUrl('doregisterData'),
				this.u.makePostArgs({
					email: email,
					username: username,
					password: password,
					groups: "['announce','curious','curious announce']"
				}),
				function(data) {
					if (data['success']) {
						this.getUserData(data);
						callback(data);
					} else {
						this.u.showAlert(data.message + ' Please try again or hit Cancel to return to the login screen.');
					}
				}.bind(this)
			);

		},
		getUserData: function(data) {
			store.set('mobileSessionId', data['mobileSessionId']);
			if (data.user) {
				return this.cache(data.user);
			} else {
				this.u.queueJSON("loading login data",
					this.u.makeGetUrl("getPeopleData"),
					this.u.makeGetArgs(this.u.getCSRFPreventionObject("getPeopleDataCSRF")),
					function(data) {
						if (!u.checkData(data))
							return;
						this.cache(data);
					}
				);

			}
		},
		cache: function(user) {
			var currentUser = new User(user);
			store.set('user', currentUser);
			dataReady = true;
			this.u.callDataReadyCallbacks();
			return currentUser;
		}

	});

	User.isLoggedIn = function() {
		var mobileSessionId = store.get('mobileSessionId');
		if (!mobileSessionId) {
			return false;
		}
		return true;
	}

	User.getCurrentUserId = function() {
		var user = store.get('user');
		if (typeof user == 'undefined') {
			return false;
		}
		return user.id;
	}

	User.getCurrentUser = function() {
		var user = store.get('user');
		if (typeof user == 'undefined') {
			return false;
		}
		return new User(user);
	}

	User.logout = function(callback) {
		window.App.collectionCache.clear();
		u.callLogoutCallbacks();
		if (typeof callback != 'undefined') {
			callback();	
		}
	}

	module.exports = User;
});
