define(function(require, exports, module) {
	'use strict';
	var exoskeleton = require('exoskeleton');
	var EventHandler = require("famous/core/EventHandler");
	var store = require('store');
	var u = require('util/Utils');
	var User = require('models/User');

	var Feed = Backbone.Model.extend({
		constructor: function(argument) {
			this.eventInput = new EventHandler();
			Backbone.Model.apply(this, arguments);
		},
	});

	Feed.max = 10;

	Feed.fetch = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			max : Feed.max,
			offset: args.offset?args.offset:0,
			type: args.type
		});
		u.backgroundJSON("loading feeds", u.makeGetUrl('indexData', 'search'), 
		u.makeGetArgs(argsToSend), function(data) {
			if (u.checkData(data)) {
				callback(data.listItems);
			}
		});
	};
	module.exports = Feed;
});
