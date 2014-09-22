define( function(require, exports, module) {
    var u = require('util/Utils');
    var User = require('models/User');

    function DetailedDiscussion(){
    }

		DetailedDiscussion.fetch = function(discussionId, callback) {
			var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
                Id: User.getCurrentUserId(),
                discussionId: discussionId,
				timeZoneName: window.jstz.determine().name()
			});
			console.log('Fetching discussions from the server: ');
			u.backgroundJSON("loading discussion list", u.makeGetUrl("listCommentData"), u.makeGetArgs(argsToSend),
				function(detailedDiscussions) {
					if (u.checkData(detailedDiscussions)) {
					    console.log('Detailed discussions from the server: ', detailedDiscussions);
						callback(detailedDiscussions);
					}
				});
		};

		DetailedDiscussion.getFromCache = function(key){
			var cache = window.App.discussionCache;
			return cache.getItem(key);
		}


		module.exports = DetailedDiscussion;
	});
