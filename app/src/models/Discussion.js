define(function(require, exports, module) {
	'use strict';
	var exoskeleton = require('exoskeleton');
	var EventHandler = require("famous/core/EventHandler");
	var store = require('store');
	var u = require('util/Utils');
	var User = require('models/User');

	var Discussion = Backbone.Model.extend({
		constructor: function(argument) {
			this.eventInput = new EventHandler();
			Backbone.Model.apply(this, arguments);
		},
		urlRoot: 'http://dev.wearecurio.us/api/discussion'
	});

	Discussion.max = 10;

	Discussion.post = function(name, discussionPost, callback) {
		u.queuePostJSON("posting in", App.serverUrl + '/api/discussion',
				u.makeGetArgs({
					name: name,
					discussionPost: discussionPost,
					group: ""
				}),
				function(data) {
					callback(data);
				});
	};

	Discussion.fetch = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			max: Discussion.max,
			offset: args.offset ? args.offset : 0,
			type: 'discussions'
		});
		u.queueJSON("loading discussion list", u.makeGetUrl('getDiscussionSocialData', 'search'),
				u.makeGetArgs(argsToSend),
				function(data) {
					callback(data.listItems);
				});
	};

	Discussion.getNewNotificationCount = function(callback) {
		if (!User.isLoggedIn()) {
			return;
		}

		u.queueJSON("Getting notifications count", u.makeGetUrl('getTotalNotificationsCount', 'search'),
				function(data) {
					if (u.checkData(data)) {
						if (data.success) {
							App.setNotificationCount(data.totalNotificationCount);
							var currentView = App.pageView.getCurrentView();
							if (currentView.resetNotificationCount) {
								currentView.resetNotificationCount();
							} else {
								for (var i in App.pageView.pageMap) {
									App.pageView.pageMap[i].resetFooter();
								}
							}
							if (callback) {
								callback(data);
							}
						}
					}
				});
	}

	Discussion.getNotifications = function(args, callback) {
		console.log('Getting Notifications from the server');
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			max: Discussion.max,
			offset: args.offset ? args.offset : 0,
		});
		u.queueJSON("Getting notifications", u.makeGetUrl('getSocialNotifications', 'search'),
				u.makeGetArgs(argsToSend),
				function(data) {
					if (u.checkData(data)) {
						if (data.success) {
							App.setNotificationCount(0);
						}
						callback(data.listItems);
					}
				});
	}

	Discussion.disableComments = function(args, callback) {
		var argsToSend = {
			id: args.hash,
			disable: args.disable
		};

		u.queueJSON("Modifying comment preferences", App.serverUrl + '/api/discussion/action/disableComments',
				u.makeGetArgs(argsToSend),
				function(data) {
					if (u.checkData(data)) {
						if (data.success) {
							callback(data.disableComments);
						}
					}
				});
	};

	Discussion.fetchOwned = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getOwnedSocialData', {
			max: Discussion.max,
			offset: args.offset ? args.offset : 0,
		});
		u.queueJSON("loading discussion list", u.makeGetUrl('getOwnedSocialData', 'search'),
				u.makeGetArgs(argsToSend),
				function(data) {
					callback(data.listItems);
				});
	};

	Discussion.deleteDiscussion = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			userId: User.getCurrentUserId(),
		});
		u.queueJSONAll("loading discussion list", App.serverUrl + '/api/discussion/' + args.hash,
				u.makeGetArgs(argsToSend),
				function(data) {
					callback(data);
				}.bind(this),
				function(xhr) {
					u.showAlert('Internal server error occurred');
				}, null, {requestMethod: 'DELETE'}
		);
	};

	Discussion.follow = function(args, successCallback, failCallback) {
		var httpArgs = {requestMethod: 'GET'};
		u.queueJSONAll('Following discussion', App.serverUrl + '/api/discussion/action/follow', args,
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

	module.exports = Discussion;
});
