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
			this.u = require('util/Utils');
			Backbone.Model.apply(this, arguments);
		},
	});


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
			//			q : "searchQuery",
			userId: User.getCurrentUserId(),
			max : 5,
			offset: args.offset?args.offset:0,
			timeZoneName: window.jstz.determine().name()
		});
		u.backgroundJSON("loading discussion list", u.makeGetUrl("listDiscussionData"), 
		u.makeGetArgs(argsToSend), function(discussions) {
			if (u.checkData(discussions)) {
				callback(discussions);
			}
		});
	};

	Discussion.deleteDiscussion = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			userId: User.getCurrentUserId(),
			id : args.id
		});
		u.backgroundJSON("loading discussion list", u.makeGetUrl("deleteDiscussionId"), 
		u.makeGetArgs(argsToSend), function(data) {
			if (data == 'success') {
				callback(data);
			} else {
				this.u.showAlert('Failed to delete discussion, please try again');
			}
		}.bind(this));
	};

	module.exports = Discussion;
});
