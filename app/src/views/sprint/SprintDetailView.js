define(function (require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Transform = require('famous/core/Transform');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var DraggableView = require("views/widgets/DraggableView");
	var StateView = require('views/StateView');
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var SprintDetailsTemplate = require('text!templates/sprint-details.html');
	var SprintFormView = require("views/sprint/SprintFormView");
	var Sprint = require('models/Sprint');
	var Entry = require('models/Entry');
	var u = require('util/Utils');
	var Scrollview = require('famous/views/Scrollview');
	var Utility = require('famous/utilities/Utility');
	var store = require('store');

	function SprintDetailView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'SprintListView';
		this.setHeaderLabel('');

		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#fbfbfb',
				zIndex: 5
			}
		});
		this.setBody(this.backgroundSurface);

		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height - 120],
			transform: Transform.translate(0, 65, 16)
		});

		this.add(mod).add(this.renderController);
	}

	SprintDetailView.prototype = Object.create(BaseView.prototype);
	SprintDetailView.prototype.constructor = SprintDetailView;

	SprintDetailView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		activeMenu: 'sprint'
	};

	SprintDetailView.prototype.showEditIcon = function () {
		this.pencilSurface = new ImageSurface({
			size: [44, 64],
			content: 'content/images/edit-pencil.png'
		});

		// Pencil icon will appear when sprint edit will be functional
		this.removeRightIcon();
		this.setRightIcon(this.pencilSurface);

		this.pencilSurface.on('click', function (e) {
			if (e instanceof CustomEvent) {
				App.pageView.changePage('SprintFormView', {parentPage: 'SprintDetailView', hash: this.hash});
			}
		}.bind(this));
	};

	SprintDetailView.prototype.onShow = function (state) {
		BaseView.prototype.onShow.call(this);
		this.saveState();
	};

	SprintDetailView.prototype.preShow = function (state) {
		if (!state || !state.hash) {
			return false;
		}
		this.hash = state.hash;
		this.name = state.name;
		this.virtualGroupName = state.virtualGroupName;
		this.parentPage = state.parentPage || 'SprintListView';
		this.parentCard = state.parentCard;
		this.loadDetails();
		return true;
	};

	SprintDetailView.prototype.loadDetails = function (args) {
		this.participantsOffset = 10;
		Sprint.show(this.hash, function (sprintDetails) {
			this.totalParticipants = sprintDetails.totalParticipants;
			if (sprintDetails.sprint.hasAdmin) {
				this.showEditIcon();
			} else {
				this.removeRightIcon();
			}
			if (!this.name) {
				this.name = sprintDetails.sprint.name;
			}
			sprintDetails.sprint.description = u.parseNewLine(sprintDetails.sprint.description);
			sprintDetails.isFormView = false;
			if (typeof(args) !== 'undefined') {
				sprintDetails.sprint.hasStarted = args.started;
				sprintDetails.sprint.hasEnded = args.stopped;
			}
			this.entryMap = _.object(_.map(sprintDetails.entries, function(entry) {
				entry.sprintEntry = true;
				return [entry.id, new Entry(entry)]
			}));
			sprintDetails.entries = this.entryMap;
			var parsedTemplate = _.template(SprintDetailsTemplate, sprintDetails, templateSettings);
			var sprintSurface = new Surface({
				size: [undefined, true],
				content: parsedTemplate
			});

			sprintSurface.on('click', function (e) {
				var classList;
				if (e instanceof CustomEvent) {
					classList = e.srcElement.classList;
					if (_.contains(classList, 'activity')) {
						var state = {
							hash: this.hash,
							name: this.name,
							virtualGroupName: this.virtualGroupName,
							parentPage: this.parentPage != 'SprintActivityView' ? 'SprintDetailView' : undefined
						};
						App.pageView.changePage('SprintActivityView', state);
					} else if (e.srcElement.id.indexOf('more-participants') > -1) {
						Sprint.getMoreParticipants({
							id: this.hash,
							offset: this.participantsOffset,
							max: 10
						}, function (participantsList) {
							var participantsWrapper = document.getElementsByClassName('participants-wrapper')[0];
							_.each(participantsList, function (participant) {
								participantsWrapper.innerHTML +=  '<p>' + participant.username + '</p>';
							});
							this.participantsOffset += 10;
							if (this.participantsOffset >= this.totalParticipants) {
								document.getElementById('more-participants').style.visibility = 'hidden';
							}
							var newHeight = document.getElementsByClassName('sprint-details')[0].offsetHeight;
							sprintSurface.setSize([undefined, newHeight]);
						}.bind(this), function () {

						});
					} else if (e.srcElement.id.indexOf('start-sprint') > -1) {
						Sprint.start(this.hash, function (data) {
							this.loadDetails({started: true});
							var showTrackathonTagsBalloon = false;
							if (store.get('showSprintStartBalloon')) {
								showTrackathonTagsBalloon = true;
							}
							App.pageView.changePage('TrackView', {showTrackathonTagsBalloon: showTrackathonTagsBalloon});
						}.bind(this));
					} else if (e.srcElement.id.indexOf('stop-sprint') > -1) {
						Sprint.stop(this.hash, function (data) {
							this.loadDetails({stopped: true});
						}.bind(this));
					} else if (e.srcElement.id.indexOf('delete-sprint') > -1) {
						Sprint.delete(this.hash, function (data) {
							var sprintsList = App.pageView.getPage(this.parentPage).deck;
							sprintsList.splice(sprintsList.indexOf(this.parentCard), 1);
							App.pageView.changePage('SprintListView');
						}.bind(this));
					} else if (e.srcElement.id.indexOf('leave-sprint') > -1) {
						Sprint.unfollow(this.hash, function (data) {
							App.pageView.changePage('SprintListView');
						}.bind(this));
					} else if (e.srcElement.id.indexOf('join-sprint') > -1) {
						Sprint.follow(this.hash, function (data) {
							this.loadDetails();
						}.bind(this));
					}
				}
			}.bind(this));

			this.scrollableSprintDetailView = new Scrollview({
				direction: Utility.Direction.Y
			});

			var spareSurface = new Surface({
				size: [undefined, 10]
			});

			this.scrollableSprintDetailView.sequenceFrom([sprintSurface, spareSurface]);

			sprintSurface.pipe(this.scrollableSprintDetailView);
			spareSurface.pipe(this.scrollableSprintDetailView);

			this.renderController.show(this.scrollableSprintDetailView);
		}.bind(this), function () {
			App.pageView.goBack();
		}.bind(this));
	};

	SprintDetailView.prototype.getCurrentState = function() {
		return {
			hash: this.hash,
			name: this.name,
			virtualGroupName: this.virtualGroupName,
			lastPage: App.pageView.history.slice(-1)[0]
		}
	};

	App.pages['SprintDetailView'] = SprintDetailView;
	module.exports = SprintDetailView;
});
