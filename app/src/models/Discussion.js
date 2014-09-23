define(function(require, exports, module) {
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
		post: function(name, discussionPost, callback) {
			this.u.queueJSON("posting in",
					this.u.makeGetUrl('createDiscussion'),
//					this.u.makeGetUrl('createData'),
					this.u.makeGetArgs({
						name: name,
						discussionPost: discussionPost,
						group: ""
					}),
					function(data) {
				if (data['success']) {
					callback(this.getUserData(data));
				} else {
					this.u.showAlert('Failed to post the discussion, please try again');
				}
			}.bind(this));
		}
	});


	Discussion.fetch = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
//			q : "searchQuery",
			userId: User.getCurrentUserId(),
			timeZoneName: window.jstz.determine().name()
		});
		console.log('Fetching discussions from the server: ');
		u.backgroundJSON("loading discussion list", u.makeGetUrl("listDiscussionData"), 
		  u.makeGetArgs(argsToSend), function(discussions) {
			if (u.checkData(discussions)) {
				console.log('discussions from the server: ', discussions);
				callback(discussions);
			}
		});
	};

	Discussion.getFromCache = function(key){
		var cache = window.App.discussionCache;
		return cache.getItem(key);
	}

	module.exports = Discussion;
});
