define(function(require, exports, module) {
	'use strict';
	var exoskeleton = require('exoskeleton');
	var EventHandler = require("famous/core/EventHandler");
	var store = require('store');
	var u = require('util/Utils');
	var User = require('models/User');

	var Search = Backbone.Model.extend({
		constructor: function(argument) {
			this.eventInput = new EventHandler();
			Backbone.Model.apply(this, arguments);
		},
	});

	Search.max = 10;

	Search.fetch = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			max : Search.max,
			offset: args.offset ? args.offset : 0,
			q: args.searchTerm
		});
		u.queueJSON("loading Searchs", u.makeGetUrl('searchAllData', 'search'),
				u.makeGetArgs(argsToSend), function(data) {
					if (u.checkData(data)) {
						callback(data.listItems);
					}
				});
	};

	Search.fetchDiscussions = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('searchDiscussionDataCSRF', {
			max : Search.max,
			offset: args.offset ? args.offset : 0,
			q: args.searchTerm
		});
		u.queueJSON("loading Searchs", u.makeGetUrl('searchDiscussionData', 'search'),
				u.makeGetArgs(argsToSend), function(data) {
					if (u.checkData(data)) {
						callback(data.listItems);
					}
				});
	};

	Search.fetchSprints = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('searchSprintDataCSRF', {
			max : Search.max,
			offset: args.offset ? args.offset : 0,
			q: args.searchTerm
		});
		u.queueJSON("loading Searchs", u.makeGetUrl('searchSprintData', 'search'),
				u.makeGetArgs(argsToSend), function(data) {
					if (u.checkData(data)) {
						callback(data.listItems);
					}
				});
	};

	Search.fetchPeople = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('searchPeopleDataCSRF', {
			max : Search.max,
			offset: args.offset ? args.offset : 0,
			q: args.searchTerm
		});
		u.queueJSON("loading Searchs", u.makeGetUrl('searchPeopleData', 'search'),
				u.makeGetArgs(argsToSend), function(data) {
					if (u.checkData(data)) {
						callback(data.listItems);
					}
				});
	};

	Search.fetchOwned = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('searchAllOwnedDataCSRF', {
			max : Search.max,
			offset: args.offset ? args.offset : 0,
			q: args.searchTerm
		});
		u.queueJSON("loading Searchs", u.makeGetUrl('searchAllOwnedData', 'search'),
				u.makeGetArgs(argsToSend), function(data) {
					if (u.checkData(data)) {
						callback(data.listItems);
					}
				});
	};

	module.exports = Search;
});
