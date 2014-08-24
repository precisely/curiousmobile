define(['require', 'exports', 'module', 'jstzdetect', 'exoskeleton', 'models/Discussion', 'jscache', '../data/DiscussionData'],
	function(require, exports, module, jstz, exoskeleton, Discussion, Cache, discussions) {
		var u = require('util/Utils');
		var User = require('models/User');
		var jstz = require('jstzdetect');
		var store = require('store');
		var u = require('util/Utils');

		var DiscussionCollection = Backbone.Collection.extend({
			model: Discussion
		});


		DiscussionCollection.fetch = function(args, callback) {
			//TODO fetch discussion from server
			//var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
				//date: argDates,
				//userId: User.getCurrentUserId(),
				//timeZoneName: window.jstz.determine().name()
			//});
			//console.log('Fetching discussions from the server: ');
			//u.backgroundJSON("loading entry list", u.makeGetUrl("getListData"), u.makeGetArgs(argsToSend),
				//function(discussions) {
					//if (u.checkData(discussions)) {
						//console.log('discussions from the server: ' + discussions);
						//callback(collections);
					//}
				//});
				
			callback(new DiscussionCollection(discussions));	
		};

		DiscussionCollection.getFromCache = function(key){
			var cache = window.App.discussionCache;
			return cache.getItem(key);
		}


		module.exports = DiscussionCollection;
	});
