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

	Sprint.fetchStarted = function(args, callback) {
		var argsToSend = u.getCSRFPreventionObject('getStartedSprintData', {
			max : Sprint.max,
			offset: args.offset ? args.offset : 0,
		});
		u.queueJSON('loading feeds', u.makeGetUrl('getStartedSprintData', 'search'),
				u.makeGetArgs(argsToSend), function(data) {
					if (u.checkData(data)) {
						callback(data.listItems);
					}
				});
	};

	Sprint.show = function(hash, successCallback, failCallback) {
		u.queueJSON('Getting trackathon data', App.serverUrl + '/api/sprint/' + hash + '?callback=?',
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
		u.queueJSONAll('Updating trackathon', App.serverUrl + '/api/sprint/' + params.id + '?' +
			u.getCSRFPreventionURI('updateSprintDataCSRF'), JSON.stringify(params),
			function(data) {
				if (u.checkData(data)) {
					if (data.success) {
						successCallback({hash: data.hash});
					} else {
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
					store.set('showPostDiscussionBalloon', data.showPostDiscussionBalloon);
					successCallback(data.listItems);
				} else {
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
		u.queueJSON('Stopping Trackathon', App.serverUrl + '/api/sprint/action/stop?callback=?', u.getCSRFPreventionObject('stopSprintDataCSRF', {
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
		u.queueJSON('Starting Trackathon', App.serverUrl + '/api/sprint/action/start?callback=?', u.getCSRFPreventionObject('startSprintDataCSRF', {
			id: sprintHash,
			now: now,
			timeZoneName: timeZoneName
		}), function(data) {
			if (!u.checkData(data))
				return;

			if (data.success) {
				store.set('showSprintStartBalloon', data.showSprintStartBalloon);
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
			type: 'alert',
			message: 'Are you sure you want to delete this trackathon?',
			a: 'Yes',
			b: 'No',
			onA: function() {
				u.queueJSONAll('Deleting trackathon', App.serverUrl + '/api/sprint/' + sprintHash,
						u.getCSRFPreventionObject('deleteSprintDataCSRF'),
						function(data) {
							if (!u.checkData(data))
								return;

							if (!data.success) {
								u.showAlert('Unable to delete trackathon!');
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
		u.queueJSON('Unfollow trackathon', App.serverUrl + '/api/sprint/action/leave?callback=?', u.getCSRFPreventionObject('leaveSprintDataCSRF', {
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

	Sprint.follow = function(sprintHash, successCallback, failCallback) {
		var timeZoneName = jstz.determine().name();
		var now = new Date().toUTCString();
		u.queueJSON('Unfollow trackathon', App.serverUrl + '/api/sprint/action/join?callback=?', u.getCSRFPreventionObject('leaveSprintDataCSRF', {
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

	Sprint.disableComments = function(args, callback) {
		u.queueJSON("Modifying comment preferences", App.serverUrl + '/api/sprint/action/disableComments',
				u.makeGetArgs(args),
			function(data) {
				if (u.checkData(data)) {
					if (data.success) {
						if (callback) {
							callback(data.disableComments);
						}
					}
				}
			});
	};

	Sprint.deleteParticipant = function(args, callback) {
		args.timeZoneName = jstz.determine().name();
		queuePostJSON('Removing members', App.serverUrl + '/api/sprint/action/deleteMember', u.getCSRFPreventionObject('deleteMemberCSRF', args),
			function(data) {
				if (!checkData(data))
					return;

				if (data.success) {
					if (callback) {
						callback();
					}
				} else {
					u.showAlert(data.errorMessage);
				}
			}, function(xhr) {
				console.log('error: ', xhr);
			});
	};

	module.exports = Sprint;
});
