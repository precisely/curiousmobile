define(['require', 'exports', 'module', 'jstzdetect', 'exoskeleton', 'models/Entry', 'jscache'],
	function(require, exports, module, jstz, exoskeleton, Entry, Cache) {
		var u = require('util/Utils');
		var User = require('models/User');
		var jstz = require('jstzdetect');
		var store = require('store');
		var u = require('util/Utils');

		var EntryCollection = Backbone.Collection.extend({
			model: Entry
		});


		EntryCollection.fetchEntries = function(dates, callback) {
			var collectionCache = window.App.collectionCache;
			var argDates = [];

			if (typeof dates == 'undefined') {
				console.log('fetchEntries: Missing dates');
			}

			for (var i = 0, len = dates.length; i < len; i++) {
				var key = Entry.getCacheKey(dates[i]);
				var cachedCollection = collectionCache.getItem(key);
				if (!cachedCollection) {
					argDates.push(dates[i].toUTCString());
				}
			}
			if (typeof callback == 'undefined') {
				console.log('fetchEntries: Missing a callback');
			}

			var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
				date: argDates,
				userId: User.getCurrentUserId(),
				timeZoneName: window.jstz.determine().name()
			});
			console.log('Fetching entries from the server for dates: ' + dates);
			u.backgroundJSON("loading entry list", u.makeGetUrl("getListData"), u.makeGetArgs(argsToSend),
				function(entries) {
					if (u.checkData(entries)) {
						console.log('entries from the server: ' + entries);
						for (var prop in entries) {
							Entry.cacheEntries(prop, entries[prop]);
						}
						var collections = [];
						for (var i = 0, len = dates.length; i < len; i++) {
							var entries = collectionCache.getItem(Entry.getCacheKey(dates[i]));
							var entryCollection = new EntryCollection(entries);
							entryCollection.date = dates[i];
							collections.push(entryCollection);
						}
						callback(collections);
					}
				});
		}


		module.exports = EntryCollection;
	});
