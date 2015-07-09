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
		u.queueJSON('loading feeds', u.makeGetUrl('indexData', 'search'), 
		u.makeGetArgs(argsToSend), function(data) {
			if (u.checkData(data)) {
				callback(data.listItems.sprintList);
			}
		});
	};

	Sprint.show = function(hash, successCallback, failCallback) {
		u.queueJSON('Getting sprint data', App.serverUrl + '/api/sprint/' + hash + '?callback=?', 
			u.getCSRFPreventionObject('getSprintData'),
			function(data) {
				if (u.checkData(data)) {
					if (data.success) {
						successCallback({sprint: data.sprint, entries: data.entries, participants: data.participants,
							totalParticipants: data.totalParticipants});
					} else {
						u.showAlert(data.message);
						failCallback();
					}
				}
			}, function(error) {
				console.log('error: ', error);
			});
	};

	Sprint.listDiscussions = function(args, successCallback, failCallback) {
		u.queueJSON('Getting more discussions', App.serverUrl + '/api/sprint/action/discussions?callback=?', 
		u.getCSRFPreventionObject('getSprintData', args), 
		function(data) {
			if (u.checkData(data)) {
				if (data.success) {
					successCallback(data.listItems.discussionList);
				} else {
					u.showAlert(data.message);
					failCallback();
				}
			}
		}, function(error) {
			console.log(error);
		});	
	};

	Sprint.getMoreParticipants = function(args, successCallback, failCallback) {
		u.queueJSON('Getting more participants', App.serverUrl + '/data/getSprintParticipantsData?callback=?', 
		u.getCSRFPreventionObject('getParticipantsData', args),
		function(data) {
			if (u.checkData(data)) {
				if (data.success) {
					successCallback(data.participants);
				} else {
					u.showAlert(data.message);
					failCallback();
				}
			}
		}, function(error) {
			console.log(error);
		});	
	};

	module.exports = Sprint;
});
