define( function(require, exports, module) {
	var u = require('util/Utils');
	var User = require('models/User');

	var DiscussionPost = Backbone.Model.extend({
		constructor: function(argument) {
			Backbone.Model.apply(this, arguments);
		},
		url: "/api/discussionPost"
	});

	DiscussionPost.max = 10;

	DiscussionPost.fetch = function(params, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			Id: User.getCurrentUserId(),
			discussionHash: params.discussionHash,
			timeZoneName: window.jstz.determine().name(),
			max: DiscussionPost.max,
			offset: params.offset?params.offset:0
		});
		console.log('Fetching discussions from the server: ');
		u.queueJSON("loading comments", u.makeGetUrl("listCommentData"),
		  u.makeGetArgs(argsToSend), function(comments) {
			if (u.checkData(comments)) {
				callback(comments);
			}
		});
	};

	DiscussionPost.deleteComment = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			userId: User.getCurrentUserId(),
			discussionHash : args.discussionHash,
			clearPostId : args.clearPostId
		});
		console.log(args.clearPostId, args.discussionId);
		u.queueJSON("deleting a comment", u.makeGetUrl("deleteCommentData"), 
		  u.makeGetArgs(argsToSend), function(data) {
			console.log(data);
			if (data == 'success') {
				callback(data);
			} else {
				this.u.showAlert('Failed to delete discussion, please try again');
			}
		}.bind(this));
	};

	DiscussionPost.createComment = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			userId: User.getCurrentUserId(),
			discussionHash : args.discussionHash,
			message : args.message,
			plotIdMessage : args.plotIdMessage
		});
		u.queueJSON("adding a comment", u.makeGetUrl("createCommentData"), 
		  u.makeGetArgs(argsToSend), function(data) {
			console.log(data);
			if (data == 'success') {
				callback(data);
			} else {
				this.u.showAlert('Failed to delete discussion, please try again');
			}
		}.bind(this));
	};
	
	module.exports = DiscussionPost;
});
