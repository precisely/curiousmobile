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
		urlRoot: 'http://192.168.0.119:8080/api/discussion'
	});

	Discussion.max = 20;

	Discussion.post = function(name, discussionPost, callback) {
		u.queueJSON("posting in",
			u.makeGetUrl('createDiscussionData'),
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
		u.queueJSON("loading discussion list", u.makeGetUrl('indexData', 'search'),
			u.makeGetArgs(argsToSend),
			function(data) {
				callback(data.listItems.discussionList);
			});
	};

	Discussion.deleteDiscussion = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			userId: User.getCurrentUserId(),
			id: args.id
		});
		u.queueJSON("loading discussion list", u.makeGetUrl("deleteDiscussionId"),
			u.makeGetArgs(argsToSend),
			function(data) {
				callback(data);
			}
		}.bind(this));
};

module.exports = Discussion;
});
