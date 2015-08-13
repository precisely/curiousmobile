define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Transform = require('famous/core/Transform');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var Draggable = require("famous/modifiers/Draggable");
	var StateView = require('views/StateView');
	var AddSprintTagsView = require('views/sprint/AddSprintTagsView');
	var AddSprintParticipantsView = require('views/sprint/AddSprintParticipantsView');
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var Draggable = require("famous/modifiers/Draggable");
	var SprintEditTemplate = require('text!templates/sprint-details.html');
	var Sprint = require('models/Sprint');
	var u = require('util/Utils');

	function SprintFormView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'SprintListView';
		this.setHeaderLabel('');

		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#efefef',
				zIndex: 5
			}
		});
		this.setBody(this.backgroundSurface);

		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height - 120],
			transform: Transform.translate(0, 75, 16)
		});

		this.add(mod).add(this.renderController);
	}

	SprintFormView.prototype = Object.create(BaseView.prototype);
	SprintFormView.prototype.constructor = SprintFormView;

	SprintFormView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		activeMenu: 'sprint'
	};

	SprintFormView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
	};

	SprintFormView.prototype.preShow = function(state) {
		if (!state || !state.hash) {
			return false;
		}
		this.hash = state.hash;
		this.parentPage = state.parentPage || 'SprintListView';
		this.refresh();
		return true;
	};

	SprintFormView.prototype.refresh = function() {
		this.participantsOffset = 10;
		Sprint.show(this.hash, function(sprintDetails) {
			this.totalParticipants = sprintDetails.totalParticipants;
			this.virtualUserId = sprintDetails.sprint.virtualUserId;
			this.virtualGroupId = sprintDetails.sprint.virtualGroupId;
			sprintDetails.isFormView = true;
			sprintDetails.isCreateForm = (this.parentPage == 'SprintDetailView') ? false : true;
			this.sprintSurface = new Surface({
				size: [undefined, undefined],
				content: _.template(SprintEditTemplate, sprintDetails, templateSettings),
			});

			this.sprintSurface.on('keydown', function(e) {
				if (cordova && e.keyCode == 13) {
					cordova.plugins.Keyboard.close();
				}
			}.bind(this));

			this.sprintSurface.on('click', function(e) {
				var classList;
				if (u.isAndroid() || (e instanceof CustomEvent)) {
					classList = e.srcElement.classList;
					if (_.contains(classList, 'submit')) {
						var name = document.getElementById('sprint-title').value;
						var description = document.getElementById('sprint-description').value;
						if (name == '') {
							u.showAlert('Sprint title can not be blank');
							return false;
						} else if (description == '') {
							u.showAlert('Sprint description can not be blank');
							return false;
						}

						Sprint.update({
							name: name,
							description: description,
							id: this.hash
						}, function(state) {
							App.pageView.changePage('SprintDetailView', state);
						});
					} else if (e.srcElement.tagName == 'INPUT' || e.srcElement.tagName == 'TEXTAREA') {
						e.srcElement.focus();
					} else if (_.contains(classList, 'add-tags') || _.contains(e.srcElement.parentElement.classList, 'add-tags')) {
						this.addSprintTagsView = new AddSprintTagsView(this);
						this.showOverlayContent(this.addSprintTagsView);
					} else if (_.contains(classList, 'add-participants') || _.contains(e.srcElement.parentElement.classList, 'add-participants')) {
						this.addSprintParticipantsView = new AddSprintParticipantsView(this);
						this.showOverlayContent(this.addSprintParticipantsView);
					}
				}
			}.bind(this));

			var yRange = Math.max(0, (800 - App.height));
			var lastDraggablePosition = 0;

			var draggable = new Draggable({
				xRange: [0, 0],
				yRange: [-1500, 0]
			});

			draggable.subscribe(this.sprintSurface);

			draggable.on('end', function(e) {
				console.log(e);
				var newYRange = Math.max(0, (document.getElementsByClassName('sprint-details')[0].offsetHeight - (App.height - 114)));
				if (e.position[1] < lastDraggablePosition) {
					this.setPosition([0, -newYRange, 0], {
						duration: 300
					}, function() {
						lastDraggablePosition = this.getPosition()[1];
					}.bind(this));
				} else if (e.position[1] != lastDraggablePosition) {
					this.setPosition([0, 0, 0], {
						duration: 300
					}, function() {
						lastDraggablePosition = this.getPosition()[1];
					}.bind(this));
				}
			});

			var nodePlayer = new RenderNode();
			nodePlayer.add(draggable).add(this.sprintSurface);
			this.renderController.show(nodePlayer);
		}.bind(this), function() {
			App.pageView.goBack();
		}.bind(this));
	};

	SprintFormView.prototype.killAddSprintTagsOverlay = function(entryItem) {
		this.killOverlayContent();
		if (entryItem != '') {
			var noTagsLabel = document.getElementById('no-tags-added');
			if (noTagsLabel) {
				noTagsLabel.parentNode.removeChild(noTagsLabel);
			}
			document.getElementsByClassName('tags-wrapper')[0].innerHTML += entryItem;
		}
	};

	SprintFormView.prototype.killAddSprintParticipantsOverlay = function(participant) {
		this.killOverlayContent();
		document.getElementById('sprint-participants').innerHTML += participant;
	};

	App.pages['SprintFormView'] = SprintFormView;
	module.exports = SprintFormView;
});
