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

	DiscussionPost.fetch = function(params, successCallback, failCallback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			Id: User.getCurrentUserId(),
			discussionHash: params.discussionHash,
			max: DiscussionPost.max,
			offset: params.offset ? params.offset : 0
		});
		u.queueJSON("loading comments", App.serverUrl + '/api/discussionPost',
		  u.makeGetArgs(argsToSend), function(data) {
			if (!u.checkData(data)) {
				return false;
			}
			if (data.success) {
				successCallback(data);
			} else {
				u.showAlert(data.message);
				if (failCallback) {
					failCallback();
				}
			}
		});
	};

	DiscussionPost.deleteComment = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('deleteCommentDataCSRF');
		console.log(args.clearPostId, args.discussionId);
		u.queueJSONAll("deleting a comment", App.serverUrl + '/api/discussionPost/' + args.postId, 
		  u.makeGetArgs(argsToSend), function(data) {
			if (data.success) {
				callback(data);
			} else {
				u.showAlert(u.message);
			}
		}.bind(this), function(error) {
			u.showAlert('Internal server error occurred');
		}, null, {requestMethod: 'DELETE'});
	};

	DiscussionPost.createComment = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('createCommentDataCSRF', {
			userId: User.getCurrentUserId(),
			discussionHash : args.discussionHash,
			message : args.message,
			plotIdMessage : args.plotIdMessage
		});
		u.queuePostJSON("adding a comment", App.serverUrl + '/api/discussionPost', 
		  u.makeGetArgs(argsToSend), function(data) {
			if (data.success) {
				callback(data);
			} else {
				u.showAlert(data.message);
			}
		}.bind(this));
	};
	
	module.exports = DiscussionPost;
});
