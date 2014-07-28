define(['require', 'exports', 'module','exoskeleton'],function(require, exports, module, exoskeleton) {
	var Entry = require('models/Entry');
	var EntryCollection = Backbone.Collection.extend({
		fetchEntries: function() {
			var	entries = [{"id":176477,"userId":54,"date":"2014-07-22T18:30:00.000Z","datePrecisionSecs":86400,"timeZoneName":"Asia/Kolkata","description":"dinner","amount":1,"amountPrecision":-1,"units":"","comment":"pinned","repeatType":768},{"id":176474,"userId":54,"date":"2014-07-22T18:30:00.000Z","datePrecisionSecs":86400,"timeZoneName":"Asia/Kolkata","description":"shower","amount":1,"amountPrecision":-1,"units":"","comment":"pinned","repeatType":768},{"id":224880,"userId":54,"date":"2014-07-23T03:30:00.000Z","datePrecisionSecs":180,"timeZoneName":"Asia/Kolkata","description":"cough medicine","amount":1,"amountPrecision":-1,"units":"","comment":"remind","repeatType":517,"setName":null}];
			var models = [];
			for (var i = 0, len = entries.length; i < len; i++) {
				models.push(new Entry(entries[i]));	
			}
			return models;
		}
	});
    module.exports = EntryCollection;
});
