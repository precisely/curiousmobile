define(function(require, exports, module) {
	'use strict';
	var exoskeleton = require('exoskeleton');
	var EventHandler = require("famous/core/EventHandler");
	var store = require('store');
	var u = require('util/Utils');
	var User = require('models/User');

	var Graph = Backbone.Model.extend({
		constructor: function(argument) {
			this.eventInput = new EventHandler();
			Backbone.Model.apply(this, arguments);
		},
	});

	Graph.max = 10;

	Graph.load = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', {
			max : Graph.max,
			offset: args.offset ? args.offset : 0
		});
		u.queueJSON("loading saved graphs", u.makeGetUrl('listPlotData'),
				u.makeGetArgs(argsToSend), function(data) {
				if (u.checkData(data)) {
					if (callback) {
						callback(data);
					}
				}
			});
	};

	Graph.delete = function(id, callback) {
		u.backgroundJSON("deleting saved graph", "/home/deletePlotDataId?id=" + escape(id) + "&callback=?",
				function(entries) {
				if (checkData(entries)) {
					if (callback)
						callback();
				}
			});
	}

	module.exports = Graph;
});
