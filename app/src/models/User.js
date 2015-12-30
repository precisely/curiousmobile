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
							console.log('username or password not correct....');
							this.u.showAlert('Username or password not correct, please try again');
						}
					}.bind(this));

		},
		isLoggedIn: function() {
			User.isLoggedIn();
		},
		register: function(email, confirmEmail, username, password, callback) {
			this.u.queuePostJSON("creating account",
					this.u.makePostUrl('doregisterData'),
					this.u.makePostArgs({
						email: email,
						confirm_email: confirmEmail,
						username: username,
						password: password,
						groups: "['announce','curious','curious announce']"
					}),
					function(data) {
						if (data['success']) {
							this.getUserData(data);
							if (callback) {
								callback();
							}
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
							this.cache(data[0]);
						}.bind(this)
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

	User.getCurrentUserHash = function() {
		var user = store.get('user');
		if (typeof user == 'undefined') {
			return false;
		}
		return user.hash;
	}

	User.getCurrentUser = function() {
		var user = store.get('user');
		if (typeof user == 'undefined') {
			return false;
		}
		return new User(user);
	}

	User.logout = function(callback) {
		var userData = store.get('user');
		window.App.collectionCache.clear();
		window.App.stateCache.clear();
		var hideSprintExplanation = store.get('hideSprintExplanation');
		var hideCuriositiesExplanation = store.get('hideCuriositiesExplanation');
		localStorage.clear();
		App.pageView.getPage('ChartView').graphView.clearGraph();
		store.set('hideSprintExplanation', hideSprintExplanation);
		store.set('hideCuriositiesExplanation', hideCuriositiesExplanation);
		u.callLogoutCallbacks();
		if (typeof callback != 'undefined') {
			callback(userData);
		}
		store.set('mobileSessionId', false);
		store.set('user', false);
	}

	User.max = 10;

	User.fetch = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			max : User.max,
			offset: args.offset?args.offset:0,
			type: 'people'
		});
		u.queueJSON("loading feeds", u.makeGetUrl('getPeopleSocialData', 'search'),
				u.makeGetArgs(argsToSend), function(data) {
					if (u.checkData(data)) {
						callback(data.listItems);
					}
				});
	};

	User.show = function(hash, successCallback, failCallback) {
		u.queueJSON('Getting user data', App.serverUrl + '/api/user/' + hash + '?callback=?',
				u.getCSRFPreventionObject('getUserData'),
				function(data) {
					if (u.checkData(data)) {
						if (data.success) {
							successCallback({user: data.user});
						} else {
							u.showAlert(data.message);
							failCallback();
						}
					}
				}, function(error) {
					console.log('error: ', error);
				});
	};

	User.update = function(updatedData, successCallback, failCallback) {
		u.queueJSONAll('Updating user details', App.serverUrl + '/api/user/' + updatedData.id, JSON.stringify(updatedData),
				function(data) {
					if (u.checkData(data)) {
						if (data.success) {
							successCallback({hash: data.hash});
						} else {
							u.showAlert(data.message);
							if (failCallback) {
								failCallback();
							}
						}
					}
				}, function(error) {
					console.log('error: ', error);
				}, null, {requestMethod: 'PUT'});
	};

	User.addInterestTags = function(tags, successCallback, failCallback) {
		u.queuePostJSON('Adding interest tags', App.serverUrl + '/api/data/action/addInterestTagData', tags,
				function(data) {
					if (u.checkData(data)) {
						if (data.interestTags) {
							successCallback();
						} else {
							u.showAlert(data.message);
							if (failCallback) {
								failCallback();
							}
						}
					}
				}, function(error) {
					console.log('error: ', error);
				});
	};

	User.deleteInterestTags = function(tag, successCallback, failCallback) {
		u.queuePostJSON('Deleting interest tags', App.serverUrl + '/api/data/action/deleteInterestTagData', {userId: this.getCurrentUserId(), tagName: tag},
				function(data) {
					if (u.checkData(data)) {
						if (data.interestTags) {
							successCallback();
						} else {
							u.showAlert(data.message);
							if (failCallback) {
								failCallback();
							}
						}
					}
				}, function(error) {
					console.log('error: ', error);
				});
	};

	User.saveAvatar = function(updatedData, successCallback, failCallback) {
		var httpArgs = { processData: false, contentType: false, requestMethod:'POST' };
		u.queueJSONAll('Updating user avatar', App.serverUrl + '/api/user/action/saveAvatar', updatedData,
				function(data) {
					if (u.checkData(data)) {
						if (data.success) {
							successCallback();
						} else {
							u.showAlert(data.message);
							if (failCallback) {
								failCallback();
							}
						}
					}
				}, function(error) {
					console.log('error: ', error);
				}, null, httpArgs);
	};

	User.follow = function(args, successCallback, failCallback) {
		var httpArgs = {requestMethod:'GET'};
		u.queueJSONAll('Following user', App.serverUrl + '/api/user/action/follow', args,
				function(data) {
					if (u.checkData(data)) {
						if (data.success) {
							successCallback();
						} else {
							u.showAlert(data.message);
							if (failCallback) {
								failCallback();
							}
						}
					}
				}, function(error) {
					console.log('error: ', error);
				}, null, httpArgs);
	};

	module.exports = User;
});
