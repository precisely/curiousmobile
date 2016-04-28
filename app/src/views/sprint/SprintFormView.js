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
	var DraggableView = require("views/widgets/DraggableView");
	var StateView = require('views/StateView');
	var SprintEntryFormView = require('views/sprint/SprintEntryFormView');
	var AddSprintParticipantsView = require('views/sprint/AddSprintParticipantsView');
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var SprintEditTemplate = require('text!templates/sprint-details.html');
	var Sprint = require('models/Sprint');
	var Entry = require('models/Entry');
	var u = require('util/Utils');
	var Scrollview = require('famous/views/Scrollview');
	var Utility = require('famous/utilities/Utility');

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
		this.scrollView = new Scrollview();
		this.scrollElements = [];
		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height - 120],
			transform: Transform.translate(0, 75, 16)
		});

		this.spareSurface = new Surface({
			size: [undefined, 20]
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
		this.entryMap = {};
		this.loadData();
		return true;
	};

	SprintFormView.prototype.loadData = function() {
		this.participantsOffset = 10;
		Sprint.show(this.hash, function(sprintDetails) {
			this.entryMap = _.object(_.map(sprintDetails.entries, function(entry) {
				entry.sprintEntry = true;
				return [entry.id, new Entry(entry)]
			}));

			this.totalParticipants = sprintDetails.totalParticipants;
			this.virtualUserId = sprintDetails.sprint.virtualUserId;
			this.virtualGroupId = sprintDetails.sprint.virtualGroupId;
			sprintDetails.entries = this.entryMap;
			sprintDetails.isFormView = true;
			sprintDetails.isCreateForm = (this.parentPage == 'SprintDetailView') ? false : true;
			this.sprintSurface = new Surface({
				size: [undefined, true],
				content: _.template(SprintEditTemplate, sprintDetails, templateSettings),
			});

			this.sprintSurface.on('keyup', function(e) {
				if (e.keyCode === 13 && e.srcElement.id !== 'sprint-description') {
					cordova.plugins.Keyboard.close();
				} if (e.srcElement.id === 'sprint-description') {
					this.resizeDescreption();
				}
			}.bind(this));

			this.sprintSurface.on('click', function(e) {
				var classList;
				if (e instanceof CustomEvent) {
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
						if (e.srcElement.id === 'sprint-description') {
							this.resizeDescreption();
						} else {
							setTimeout(function() {
								e.srcElement.setSelectionRange(0, e.srcElement.value.length);
							}, 50)
						}
					} else if (_.contains(classList, 'add-tags') || _.contains(e.srcElement.parentElement.classList, 'add-tags')) {
						if (typeof cordova !== 'undefined') {
							cordova.plugins.Keyboard.close();
						}
						this.addSprintTagsView = new SprintEntryFormView(this);
						this.showOverlayContent(this.addSprintTagsView);
					} else if (_.contains(classList, 'delete-tag')) {
						if (typeof cordova !== 'undefined') {
							cordova.plugins.Keyboard.close();
						}
						// this.addSprintTagsView = new SprintEntryFormView(this);
						// var formViewState = this.addSprintTagsView.buildStateFromEntry(this.entryMap[entryId]);
						// this.showOverlayContent(this.addSprintTagsView, function() {
						// 	this.onShow(formViewState);
						// }.bind(this.addSprintTagsView));
						var entryId = e.srcElement.parentElement.dataset.id;
						var entry = this.entryMap[entryId];
						entry.delete(function(data) {
							if (data && data.fail) {
								u.showAlert('Could not delete entry');
							} else {
								var tagToRemove = document.querySelectorAll("[data-id='"+ entryId +"']")[0];
								document.getElementsByClassName('tags-wrapper')[0].removeChild(tagToRemove);
							}
						}.bind(this));
					} else if (_.contains(classList, 'delete-participant')) {
						var participantUserName = e.srcElement.dataset.participant;
						Sprint.deleteParticipant({username: participantUserName, now: new Date().toUTCString(), sprintHash: this.hash}, function() {
							document.getElementsByClassName('participants-wrapper')[0].removeChild(e.srcElement.parentElement);
						}.bind(this));
					} else if (_.contains(classList, 'add-participants') || _.contains(e.srcElement.parentElement.classList, 'add-participants')) {
						if (typeof cordova !== 'undefined') {
							cordova.plugins.Keyboard.close();
						}
						this.addSprintParticipantsView = new AddSprintParticipantsView(this);
						this.showOverlayContent(this.addSprintParticipantsView);
					} else if (_.contains(e.srcElement.parentElement.classList, 'disable-button-option')) {
						var disableCommentCheckbox = document.getElementById('disable-comments-checkbox');
						var disable = !disableCommentCheckbox.checked;
						Sprint.disableComments({id: this.hash, disable: disable}, function(disableComments) {
							if (disableComments) {
								disableCommentCheckbox.checked = true;
							} else {
								disableCommentCheckbox.checked = false;
							}
						}.bind(this));
					} else {
						document.activeElement.blur();
						cordova.plugins.Keyboard.close();
					}
				}
			}.bind(this));

			//this.draggableFormView = new DraggableView(this.sprintSurface, true);
			this.scrollElements = [this.sprintSurface, this.spareSurface];
			this.scrollView.sequenceFrom(this.scrollElements);
			this.sprintSurface.pipe(this.scrollView);
			this.spareSurface.pipe(this.scrollView);
			this.renderController.show(this.scrollView);
		}.bind(this), function() {
			App.pageView.goBack();
		}.bind(this));
	};

	SprintFormView.prototype.killAddSprintTagsOverlay = function(args) {
		this.killOverlayContent();
		var previousHeight = 0, heightDiff = 0;
		var tagsWrapperElement = document.getElementsByClassName('tags-wrapper')[0];
		if (tagsWrapperElement) {
			previousHeight = tagsWrapperElement.clientHeight;
		}
		if (args) {
			var entryItem = args.entryItem;
			var hasUpdatedTag = args.hasUpdatedTag;
			var entryId = args.entry.id;
			this.entryMap[entryId] = args.entry;

			if (entryItem && entryItem != '') {
				var noTagsLabel = document.getElementById('no-tags-added');
				if (noTagsLabel) {
					noTagsLabel.parentNode.removeChild(noTagsLabel);
				}
				if (hasUpdatedTag) {
					var tagToRemove = document.querySelectorAll("[data-id='" + entryId + "']")[0];
					if (tagToRemove) {
						entryItem = u.htmlToElement(entryItem);
						document.getElementsByClassName('tags-wrapper')[0].replaceChild(entryItem, tagToRemove);
					}
				} else {
					document.getElementsByClassName('tags-wrapper')[0].innerHTML += entryItem;
				}
			} else if (args.hasDeletedTag) {
				var tagToRemove = document.querySelectorAll("[data-id='" + entryId + "']")[0];
				document.getElementsByClassName('tags-wrapper')[0].removeChild(tagToRemove);
			}
		}
		if (tagsWrapperElement) {
			heightDiff = tagsWrapperElement.clientHeight - previousHeight;
		}
		this.resizeScrollView(heightDiff);
		this.scrollView.sequenceFrom(this.scrollElements);
	};

	SprintFormView.prototype.resizeDescreption = function() {
		// Auto expanding height of the textarea if text overflowes
		setTimeout(function() {
			var commentBox = document.getElementById('sprint-description');
			commentBox.style.cssText = 'height:auto;';
			commentBox.style.cssText = 'height:' + commentBox.scrollHeight + 'px';
			this.scrollView.sequenceFrom(this.scrollElements);
		}.bind(this), 0);
	};

	SprintFormView.prototype.resizeScrollView = function(heightDiff) {
		var currentHeight = this.sprintSurface.getSize()[1];
		this.sprintSurface.setSize([undefined, currentHeight + heightDiff]);
	};

	SprintFormView.prototype.killAddSprintParticipantsOverlay = function(participant) {
		this.killOverlayContent();
		document.getElementById('participant-label').innerHTML = 'PARTICIPANTS(' + (++this.totalParticipants) + ')';
		document.getElementsByClassName('participants-wrapper')[0].innerHTML += participant;
		this.resizeScrollView(30);
		this.scrollView.sequenceFrom(this.scrollElements);
	};

	App.pages['SprintFormView'] = SprintFormView;
	module.exports = SprintFormView;
});
