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

	Sprint.create = function(callback) {
		u.queuePostJSON('Creating experiments', App.serverUrl + '/api/sprint', u.getCSRFPreventionObject('createSprintCSRF'),
		function(data) {
			if (u.checkData(data)) {
				callback(data);
			}
		});
	}

	Sprint.fetch = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getAllSprintData', {
			max : Sprint.max,
			offset: args.offset ? args.offset : 0,
			nextSuggestionOffset: args.nextSuggestionOffset,
			type: 'sprints'
		});
		u.queueJSON('loading feeds', u.makeGetUrl('getAllSprintData', 'search'),
		u.makeGetArgs(argsToSend), function(data) {
			if (u.checkData(data)) {
				callback(data.listItems, data.nextSuggestionOffset);
			}
		});
	};

	Sprint.fetchOwned = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getOwnedSprintData', {
			max : Sprint.max,
			offset: args.offset ? args.offset : 0,
		});
		u.queueJSON('loading feeds', u.makeGetUrl('getOwnedSprintData', 'search'),
				u.makeGetArgs(argsToSend), function(data) {
					if (u.checkData(data)) {
						callback(data.listItems);
					}
				});
	};

	Sprint.show = function(hash, successCallback, failCallback) {
		u.queueJSON('Getting experiment data', App.serverUrl + '/api/sprint/' + hash + '?callback=?',
			u.getCSRFPreventionObject('getSprintData'),
			function(data) {
				if (u.checkData(data)) {
					if (data.success) {
						successCallback({sprint: data.sprint, entries: data.entries, participants: data.participants,
							totalParticipants: data.totalParticipants});
					} else {
						u.showAlert(data.message);
						if (failCallback) {
							failCallback();
						}
					}
				}
			}, function(error) {
				console.log('error: ', error);
			});
	};

	Sprint.update = function(params, successCallback, failCallback) {
		u.queueJSONAll('Updating experiment', App.serverUrl + '/api/sprint/' + params.id + '?' +
			u.getCSRFPreventionURI('updateSprintDataCSRF'), JSON.stringify(params), 
			function(data) {
				if (u.checkData(data)) {
					if (data.success) {
						successCallback({hash: data.hash});
					} else {
						u.showAlert(data.message);
						if (failCallback) {
							failCallback();
						}
					}
				}
			}, function(error) {
				console.log('error: ', error);
			}, null, {requestMethod: 'PUT'});
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

	Sprint.stop = function(sprintHash, successCallback, failCallback) {
		var timeZoneName = jstz.determine().name();
		var now = new Date().toUTCString();
		u.queueJSON('Stopping Sprint', App.serverUrl + '/api/sprint/action/stop?callback=?', u.getCSRFPreventionObject('stopSprintDataCSRF', {
			id: sprintHash,
			now: now,
			timeZoneName: timeZoneName
		}), function(data) {
			if (!u.checkData(data))
				return;

			if (data.success) {
				if (successCallback) {
					successCallback();
				}
			} else {
				u.showAlert(data.message);
				if (failCallback) {
					failCallback();
				}
			}
		});
	};

	Sprint.start = function(sprintHash, successCallback, failCallback) {
		var timeZoneName = jstz.determine().name();
		var now = new Date().toUTCString();
		u.queueJSON('Stopping Experiment', App.serverUrl + '/api/sprint/action/start?callback=?', u.getCSRFPreventionObject('stopSprintDataCSRF', {
			id: sprintHash,
			now: now,
			timeZoneName: timeZoneName
		}), function(data) {
			if (!u.checkData(data))
				return;

			if (data.success) {
				if (successCallback) {
					successCallback();
				}
			} else {
				u.showAlert(data.message);
				if (failCallback) {
					failCallback();
				}
			}
		});
	};

	Sprint.delete = function(sprintHash, successCallback) {
		var httpArgs ={requestMethod:'delete'};
		u.showAlert({
			message: 'Are you sure to delete this experiment?',
			a: 'Yes',
			b: 'No',
			onA: function() {
				u.queueJSONAll('Deleting experiment', App.serverUrl + '/api/sprint/' + sprintHash,
						u.getCSRFPreventionObject('deleteSprintDataCSRF'),
						function(data) {
							if (!u.checkData(data))
								return;

							if (!data.success) {
								u.showAlert('Unable to delete experiment!');
							} else if (successCallback) {
								successCallback();
							}
						}, function(data) {
							u.showAlert(data.message);
						}, null, httpArgs);
			}.bind(this),
			onB: function() {}.bind(this),
		});
	};

	Sprint.unfollow = function(sprintHash, successCallback) {
		var timeZoneName = jstz.determine().name();
		var now = new Date().toUTCString();
		u.queueJSON('Unfollow experiment', App.serverUrl + '/api/sprint/action/leave?callback=?', u.getCSRFPreventionObject('leaveSprintDataCSRF', {
			id: sprintHash,
			now: now,
			timeZoneName: timeZoneName
		}), function(data) {
			if (!u.checkData(data))
				return;

			if (data.success) {
				if (successCallback) {
					successCallback();
				}
			} else {
				u.showAlert(data.message);
			}
		});
	};

	Sprint.follow = function(sprintHash, successCallback) {
		var timeZoneName = jstz.determine().name();
		var now = new Date().toUTCString();
		u.queueJSON('Unfollow experiment', App.serverUrl + '/api/sprint/action/join?callback=?', u.getCSRFPreventionObject('leaveSprintDataCSRF', {
			id: sprintHash,
			now: now,
			timeZoneName: timeZoneName
		}), function(data) {
			if (!u.checkData(data))
				return;

			if (data.success) {
				if (successCallback) {
					successCallback();
				}
			} else {
				u.showAlert(data.message);
			}
		});
	};

	module.exports = Sprint;
});
