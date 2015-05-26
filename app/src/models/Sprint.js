define(function(require, exports, module) {
	'use strict';
	var exoskeleton = require('exoskeleton');
	var EventHandler = require("famous/core/EventHandler");
	var store = require('store');
	var u = require('util/Utils');
	var User = require('models/User');

	var Sprint = Backbone.Model.extend({
		constructor: function(argument) {
			this.eventInput = new EventHandler();
			Backbone.Model.apply(this, arguments);
		},
	});

	Sprint.max = 10;

	Sprint.fetch = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			max : Sprint.max,
			offset: args.offset?args.offset:0,
			type: 'sprints'
		});
		u.backgroundJSON("loading feeds", u.makeGetUrl('indexData', 'search'), 
		u.makeGetArgs(argsToSend), function(data) {
			if (u.checkData(data)) {
				callback(data.listItems.sprintList);
			}
		});
	};
	module.exports = Sprint;
});
