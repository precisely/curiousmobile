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
	module.exports = DiscussionPost;
});
