define(['require', 'exports', 'module', 'jstzdetect', 'exoskeleton'], function(require, exports, module, jstz, exoskeleton) {
	var Entry = require('models/Entry');
	var u = require('util/Utils');
	var User = require('models/User');
	var jstz = require('jstzdetect');
	var store = require('store');
	var u = require('util/Utils');
	var EntryCollection = Backbone.Collection.extend({
		model: Entry
	});

	EntryCollection.fetchEntries = function(dates, callback) {
		var argDates = [];

		if (typeof dates == 'undefined') {
			console.log('fetchEntries: Missing dates');
		}

		for (var i = 0, len = dates.length; i < len; i++) {
			argDates.push(dates[i].toUTCString());
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
					var collections = [];
					for (var prop in entries) {
						var entryCollection = new EntryCollection(entries[prop]);
						collections.push(entryCollection);
						store.set('entry-cache ' + prop, entryCollection);
					}
					callback(collections);
				}
			});
	}



	module.exports = EntryCollection;
});
