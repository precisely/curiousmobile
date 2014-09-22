define(['require', 'exports', 'module', 'jstzdetect', 'exoskeleton', 'models/Discussion', 'jscache', '../data/DiscussionData'],
	function(require, exports, module, jstz, exoskeleton, Discussion, Cache, discussions) {
		var u = require('util/Utils');
		var User = require('models/User');
		var jstz = require('jstzdetect');
		var store = require('store');
		var u = require('util/Utils');

		var DetailedDiscussion = Backbone.Collection.extend({
			model: Discussion
		});

		DetailedDiscussion.fetch = function(args, callback) {
			//TODO fetch discussion from server
			var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
//				date: argDates,
                Id: User.getCurrentUserId(),
//				userId: User.getCurrentUserId(),
				timeZoneName: window.jstz.determine().name()
			});
			console.log('Fetching discussions from the server: ');
			// loadSnapshotDataId? or getPeopleData
			u.backgroundJSON("loading discussion list", u.makeGetUrl("loadSnapshotDataId"), u.makeGetArgs(argsToSend),
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
