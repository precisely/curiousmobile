define( function(require, exports, module) {
	var u = require('util/Utils');
	var User = require('models/User');

	function DiscussionPost(){
	}
	DiscussionPost.fetch = function(discussionId, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			Id: User.getCurrentUserId(),
			discussionId: discussionId,
			timeZoneName: window.jstz.determine().name()
		});
		console.log('Fetching discussions from the server: ');
		u.backgroundJSON("loading discussion list", u.makeGetUrl("listCommentData"),
		  u.makeGetArgs(argsToSend), function(comments) {
			if (u.checkData(comments)) {
				console.log('comments from the server: ', comments);
				callback(comments);
			}
		});
	};

	DiscussionPost.deleteComment = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			userId: User.getCurrentUserId(),
			discussionId : args.discussionId,
			clearPostId : args.clearPostId
		});
		console.log(args.clearPostId, args.discussionId);
		u.backgroundJSON("loading discussion list", u.makeGetUrl("deleteComment"), 
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
