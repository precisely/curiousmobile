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
		logout: function() {},
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
					groups: "['announce','precise.ly','precise.ly announce']"
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
			store.set('hasVisitedMobileApp', data['hasVisitedMobileApp']);
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
			closedExplanationCardSprint = user.closedExplanationCardTrackathon;
			store.set('hideCuriositiesExplanation', user.closedExplanationCardCuriousities);
			store.set('hideSprintExplanation', user.closedExplanationCardTrackathon);
			store.set('trackathonVisited', user.hasVisitedTrackathon);
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

	User.clearCache = function() {
		var chartView = App.pageView.getCachedPage('ChartView');
		if (chartView) {
			chartView.graphView.clearGraph();
		}
		store.set('mobileSessionId', undefined);
		store.set('user', undefined);
		window.App.collectionCache.clear();
		window.App.stateCache.clear();
		localStorage.clear();
		var homeView = App.pageView.pageMap['HomeView'];
		App.pageView.pageMap = [];
		App.pageView.pageMap['HomeView'] = homeView;
		store.set('mobileSessionId', false);
		store.set('user', false);
	}

	User.logout = function(callback) {
		var userData = store.get('user');
		u.callLogoutCallbacks();
		if (typeof push.pushNotification !== 'undefined') {
			push.unregister();
		} else {
			User.clearCache();
		}
		if (typeof callback !== 'undefined') {
			callback(userData);
		}
	}

	User.max = 10;

	User.fetch = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			max: User.max,
			offset: args.offset ? args.offset : 0,
			type: 'people'
		});
		u.queueJSON("loading feeds", u.makeGetUrl('getPeopleSocialData', 'search'),
		u.makeGetArgs(argsToSend),
		function(data) {
			if (u.checkData(data)) {
				callback(data.listItems);
			}
		});
	};

	User.show = function(hash, successCallback, failCallback) {
		u.queueJSON('Getting user details', App.serverUrl + '/api/user/' + hash + '?callback=?',
			u.getCSRFPreventionObject('getUserData'),
			function(data) {
				if (u.checkData(data)) {
					if (data.success) {
						successCallback({
							user: data.user
						});
					} else {
						u.showAlert(data.message);
						failCallback();
					}
				}
			},
			function(error) {
				console.log('error: ', error);
			});
	};

	User.update = function(updatedData, successCallback, failCallback) {
		u.queueJSONAll('Updating user details', App.serverUrl + '/api/user/' + updatedData.id, JSON.stringify(updatedData),
		function(data) {
			if (u.checkData(data)) {
				if (data.success) {
					successCallback({
						hash: data.hash
					});
				} else {
					u.showAlert(data.message);
					if (failCallback) {
						failCallback();
					}
				}
			}
		},
		function(error) {
			console.log('error: ', error);
		}, null, {
			requestMethod: 'PUT'
		});
	};

	User.addInterestTags = function(tags, successCallback, failCallback) {
		u.queuePostJSON('Adding interest tags', App.serverUrl + '/api/data/action/addInterestTagData', tags,
			function(data) {
				if (u.checkData(data)) {
					if (data.interestTags) {
						successCallback(data);
					} else {
						u.showAlert(data.message);
						if (failCallback) {
							failCallback();
						}
					}
				}
			},
			function(error) {
				console.log('error: ', error);
			});
	};

	User.deleteInterestTags = function(tag, successCallback, failCallback) {
		u.queuePostJSON('Deleting interest tags', App.serverUrl + '/api/data/action/deleteInterestTagData', {
			userId: this.getCurrentUserId(),
			tagName: tag
		},
		function(data) {
			if (u.checkData(data)) {
				if (data.interestTags) {
					successCallback(data.interestTags);
				} else {
					u.showAlert(data.message);
					if (failCallback) {
						failCallback();
					}
				}
			}
		},
		function(error) {
			console.log('error: ', error);
		});
	};

	User.saveAvatar = function(updatedData, successCallback, failCallback) {
		var httpArgs = {
			processData: false,
			contentType: false,
			requestMethod: 'POST'
		};
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
			},
			function(error) {
				console.log('error: ', error);
			}, null, httpArgs);
	};

	User.follow = function(args, successCallback, failCallback) {
		var httpArgs = {
			requestMethod: 'GET'
		};
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
			},
			function(error) {
				console.log('error: ', error);
			}, null, httpArgs);
	};

	User.hideExplanationCard = function(cardType, successCallback) {
		var actionName = (cardType === 'curiosity') ? 'closeExplanationCardCuriosity' : 'closeExplanationCardTrackathon';
		u.backgroundJSON('Closing explanation', App.serverUrl + '/api/user/action/' + actionName + '?' +
			u.getCSRFPreventionURI('closeExplanationCardCSRF') + '&callback=?', null, function(data) {
				if (checkData(data)) {
					if (data.success) {
						successCallback()
					} else {
						u.showAlert(data.message);
					}
				}
			}, function(xhr) {
				console.log(xhr);
			});
	};

	User.markTrackathonVisited = function(successCallback) {
		u.backgroundJSON('Mark trackathon visited', App.serverUrl + '/api/user/action/markTrackathonVisited?' +
			u.getCSRFPreventionURI('markTrackathonVisitedCSRF') + '&callback=?', null, function(data) {
				if (checkData(data)) {
					if (data.success) {
						store.set('trackathonVisited', true);
						if(successCallback) {
							successCallback();
						}
					} else {
						u.showAlert(data.message);
					}
				}
			}, function(xhr) {
				console.log(xhr);
			});
	};

	User.markFirstChartPlotted = function(successCallback) {
		u.backgroundJSON('Mark first chart plotted', App.serverUrl + '/api/user/action/markFirstChartPlotted?' +
			u.getCSRFPreventionURI('markFirstChartPlottedCSRF') + '&callback=?', null, function(data) {
			if (checkData(data)) {
				if (data.success) {
					store.set('firstChartPlotted', true);
					if(successCallback) {
						successCallback();
					}
				} else {
					u.showAlert(data.message);
				}
			}
		}, function(xhr) {
			console.log(xhr);
		});
	};

	User.getSurveyTags = function(callback) {
		u.queueJSON('Getting survey options', App.serverUrl + '/public/getSurveyOptions?callback=?', null,
				function(surveyOptions) {
					callback(surveyOptions);
				});
	};

	User.saveTrackingTags = function(surveyOptions, callback) {
		u.queueJSON('Saving tracking tags', App.serverUrl + '/api/user/action/addTutorialTags',
			u.getCSRFPreventionObject('saveTrackingTags', {tags: surveyOptions}),
				function(surveyOptions) {
					callback(surveyOptions);
				});

	};

	User.sendVerificationLink = function() {
		u.queueJSON('Resending verification link', App.serverUrl + '/home/dosendverifyData?callback=?', null,
				function(data) {
					if (!checkData(data)) {
						return false;
					}
					if (data.success) {
						u.showAlert('Verification email sent. Be sure to check your spam folder for an email from curious@wearecurio.us');
					} else {
						u.showAlert(data.message);
					}
				}
		);
	};

	User.getGroupsToShare = function(successCallback) {
		u.queueJSON('Loading group list', App.serverUrl + '/api/user/action/getGroupsToShare?' + u.getCSRFPreventionURI('getGroupsList') + '&callback=?', function(data) {
			if (!checkData(data) || !data.success) {
				return
			}

			var groups = [];
			// https://github.com/syntheticzero/curious2/issues/688#issuecomment-164689115
			if (data.groups.length > 0) {
				groups.push(data.groups[0]);
			}
			groups.push({name: "PUBLIC", fullName: "Public"}, {name: "PRIVATE", fullName: "Private"});
			if (data.groups.length > 0) {
				// Adding the rest of all the groups to the array.
				groups.push.apply(groups, data.groups.slice(1));
			}

			data.groups = groups;

			successCallback(data);
		});
	};

	module.exports = User;
});
