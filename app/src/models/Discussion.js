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

	module.exports = Discussion;
});
