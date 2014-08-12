define(['require', 'exports', 'module', 'jstzdetect', 'exoskeleton', 'models/Entry', 'jscache'],
	function(require, exports, module, jstz, exoskeleton, Entry, Cache) {
		var u = require('util/Utils');
		var User = require('models/User');
		var jstz = require('jstzdetect');
		var store = require('store');
		var u = require('util/Utils');
		var collectionCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec'));
		var EntryCollection = Backbone.Collection.extend({
			model: Entry
		});

		function _getCacheKey(date) {
			var dateStr;
			if (typeof date == 'object') {
				var month = ("0" + (date.getMonth() + 1)).slice(-2);
				var day = ("0" + date.getDate()).slice(-2);
				dateStr = month + '/' + day + '/' + (date.getYear() + 1900);
			} else {
				dateStr = date;
			}
			return dateStr;
		}

		EntryCollection.fetchEntries = function(dates, callback) {
			var argDates = [];

			if (typeof dates == 'undefined') {
				console.log('fetchEntries: Missing dates');
			}

			for (var i = 0, len = dates.length; i < len; i++) {
				var key = _getCacheKey(dates[i]);
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
							collectionCache.setItem(prop, entries[prop]);
						}
						var collections = [];
						for (var i = 0, len = dates.length; i < len; i++) {
							var entries = collectionCache.getItem(_getCacheKey(dates[i]));
							var entryCollection = new EntryCollection(entries);
							collections.push(entryCollection);
						}
						callback(collections);
					}
				});
		}



		module.exports = EntryCollection;
	});
