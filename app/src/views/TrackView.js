define(function(require, exports, module) {

	'use strict';

	require('jquery');
	require('bootstrap');

	var Surface = require('famous/core/Surface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Transform = require('famous/core/Transform');

	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
	var RenderNode = require('famous/core/RenderNode');
	var FastClick = require('famous/inputs/FastClick');
	var Utility = require("famous/utilities/Utility");
	var Scrollview = require("famous/views/Scrollview");

	var Entry = require('models/Entry');
	var User = require('models/User');
	var EntryCollection = require('models/EntryCollection');
	var EntryView = require('views/entry/EntryView');
	var EntryListView = require('views/entry/EntryListView');
	var TrackEntryFormView = require('views/entry/TrackEntryFormView');
	var CalendarView = require('views/calendar/CalendarView');
	var BaseView = require('views/BaseView');
	var SelectTagForEntryView = require('views/entry/SelectTagForEntryView');
	var LevelInputWidgetView = require('views/widgets/LevelInputWidgetView');

	var store = require('store');
	var u = require('util/Utils');
	var DateUtil = require('util/DateUtil');

	function TrackView() {
		BaseView.apply(this, arguments);

		this.popoversList = [];

		this.createBody();
		this.createCalendar();
		this.addPlusIcon();
	}

	TrackView.prototype = Object.create(BaseView.prototype);
	TrackView.prototype.constructor = TrackView;

	TrackView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		noBackButton: true,
		reloadOnResume: true,
		activeMenu: 'track',
	};

	TrackView.prototype.createBody = function() {
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(function() {
			return Transform.translate(0, 0, 5);
		});

		this.entryListContainer = new ContainerSurface({
			classes: ['entry-list-container'],
			properties: {
				overflow: 'hidden',
				zIndex: 2,
				backgroundColor: '#D3D3D3'
			}
		});

		this.entryListModifier = new Modifier({
			transform: Transform.translate(0, 1, 5)
		});

		this.entryListModifier.sizeFrom(function() {
			var size = [App.width, App.height];
			return [undefined, size[1] - 115];
		});

		this.entryListContainer.add(this.renderController);

		this.addContent(this.entryListModifier, this.entryListContainer);

		this.on('close-date-grid', function() {
			this.hideShimSurface();
			this.calendarView.renderController.hide();
			this.calendarView.showingDateGrid = false;
		}.bind(this));
	};

	TrackView.prototype.addPlusIcon = function() {
		this.plusIconModifier = new Modifier({
			transform: Transform.translate(30, App.height - 120, 20)
		});

		this.plusIconSurface = new Surface({
			content: '<div class="plus-icon-button">+</div>',
			size: [true, true]
		});

		this.add(this.plusIconModifier).add(this.plusIconSurface);

		this.selectTagForEntryView = new SelectTagForEntryView({trackView: this});

		this.plusIconSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.showSelectTagForEntryView();
			}
		}.bind(this));
	};

	TrackView.prototype.refresh = function() {
		EntryCollection.clearCache();

		this.changeDate(this.calendarView.selectedDate);
	};

	TrackView.prototype.createCalendar = function() {
		this.calendarView = new CalendarView();

		this.calendarView.on('manual-date-change', function(e) {
			this.dateNotToday = false;
			this.changeDate(e.date);
		}.bind(this));

		App.selectedDate = DateUtil.getMidnightDate(this.calendarView.selectedDate);
		this.setHeaderSurface(this.calendarView);
	};

	TrackView.prototype.showAllPopovers = function(state, glowEntry) {
		var showEntryBalloon;
		var entryId;

		if (state && state.data) {
			showEntryBalloon = state.data.showEntryBalloon ? state.data.showEntryBalloon : false;
			entryId = glowEntry ? glowEntry.id : null;
		}

		if (!store.get('hasVisitedMobileApp')) {
			store.set('hasVisitedMobileApp', true);

			App.showPopover('.plus-icon-button', {key: 'plusIcon', container: '#popover-surface'});
			this.popoversList.push('.plus-icon-button');

			var inputWidgetToShowPopover = this.currentListView.inputWidgetGroupViewList[1];
			if (inputWidgetToShowPopover && inputWidgetToShowPopover.drawerSurface instanceof LevelInputWidgetView) {
				var tagId = inputWidgetToShowPopover.tagInputType.tagId;
				App.showPopover('#c2-level-tag-' + tagId, {key: 'inputWidgetUsage', container: '#popover-surface'});
				this.popoversList.push('#c3-level-132');
			}
		}

		if (showEntryBalloon) {
			App.showPopover('#time-box-' + entryId, {key: 'entryAdded', autoHide: true, container: '#popover-surface'});
			this.popoversList.push('#time-box-' + entryId);
		}

		this.showSprintMenuPopover();
	};

	TrackView.prototype.hideAllPopovers = function() {
		_.each(this.popoversList, function(popoverId) {
			$(popoverId).popover('destroy');
		});
	};

	TrackView.prototype.hideSprintMenuPopover = function() {
		$('#TrackView-sprint-menu').popover('destroy');
		if (document.getElementById('TrackView-sprint-menu')) {
			document.getElementById('TrackView-sprint-menu').classList.remove('active');
		}
		this.isSprintMenuPopoverVisible = false;
	};

	TrackView.prototype.showSprintMenuPopover = function() {
		if (!store.get('trackathonVisited') && this.currentListView.draggableList.length > 0) {
			App.showPopover('#TrackView-sprint-menu', {key: 'sprintMenu', container: '#popover-surface'});
			if (document.getElementById('TrackView-sprint-menu')) {
				document.getElementById('TrackView-sprint-menu').classList.add('active');
			}
			this.isSprintMenuPopoverVisible = true;
		}
	};

	TrackView.prototype.preShow = function(state) {
		if (this.processingNotification) {
			return false;
		}

		this.isSprintMenuPopoverVisible = false;

		var glowEntry;

		// New entry or bookmark from the server.
		if (state && state.fromServer) {
			var glowEntryDate, entries, currentDay;

			glowEntry = state.data.glowEntry;
			glowEntryDate = glowEntry.get("date");
			entries = EntryCollection.getFromCache(glowEntryDate);

			currentDay = this.isCurrentDay(glowEntryDate);
			if (currentDay) {
				this.currentListView.refreshEntries(entries, glowEntry, null, function() {
					this.showAllPopovers(state, glowEntry);
				}.bind(this));

				return true;
			}

			if (glowEntryDate.getTime() > App.selectedDate.getTime()) {
				this.changeDate(glowEntryDate, null, glowEntry);

				return true;
			}
		} else if (state && state.isPushNotificaton) {
			var glowEntryId = state.entryId;
			var glowEntryDate = state.entryDate;

			this.processingNotification = true;

			this.changeDate(this.calendarView.selectedDate, function() {
				this.currentListView.entryIdOfInputWidgetViewToGlow = glowEntryId;
				this.processingNotification = false;
			}.bind(this), null);

			return true;
		}

		EntryCollection.clearCache();

		/*
		 * Refresh all entries if entry is created on a different date than what is set currently on calendar.
		 */
		if (glowEntry) {
			glowEntry.refreshAll = true;
		}

		this.changeDate(glowEntry ? glowEntry.get('date') : this.calendarView.selectedDate, function() {
			this.showAllPopovers(state, glowEntry);
		}.bind(this), glowEntry);

		return true;
	};

	TrackView.prototype.preChangePage = function() {
		this.hideSprintMenuPopover();
	};

	TrackView.prototype.isCurrentDay = function(date) {
		return (this.calendarView.getSelectedDate().setHours(0, 0, 0, 0) == new Date(date).setHours(0, 0, 0, 0));
	};

	TrackView.prototype.getScrollPosition = function() {
		return this.currentListView.scrollView.getPosition();
	};

	TrackView.prototype.killOverlayContent = function(callback) {
		this.entryListContainer.setProperties({
			webkitFilter: 'blur(0px)',
			filter: 'blur(0px)'
		});

		BaseView.prototype.killOverlayContent.call(this);

		this.showMenuButton();
		this.showSearchIcon();

		if (this.isSprintMenuPopoverVisible) {
			this.showSprintMenuPopover();
		}

		this.setHeaderSurface(this.calendarView, new StateModifier({align: [0.5, 0.5], origin: [0.5, 0.5]}));

		if (callback) {
			callback();
		}
	};

	TrackView.prototype.addNewInputWidget = function(tagDescription) {
		this.killOverlayContent(function() {
			this.currentListView.addNewInputWidget(tagDescription);
		}.bind(this));
	};

	TrackView.prototype.changeDate = function(date, callback, glowEntry) {
		date = u.getMidnightDate(date);

		App.selectedDate = date;
		this.calendarView.setSelectedDate(date);

		// Currently fetching only for selected date.
		var dates = [date];
		EntryCollection.fetchEntries(dates, function(entries, recentlyUsedTags) {
			if (this.currentListView) {
				this.currentListView.refreshEntries(entries, glowEntry, recentlyUsedTags, callback);
			} else {
				this.currentListView = new EntryListView(entries, glowEntry, recentlyUsedTags, callback);

				this.currentListView.on('delete-failed', function() {
					this.changeDate(this.calendarView.selectedDate, function() {
						u.showAlert("Error deleting entry");
					}.bind(this));
				}.bind(this));

				this.renderController.show(this.currentListView, {duration: 500});
			}
		}.bind(this));
	};

	TrackView.prototype.getSelectedDate = function() {
		return this.calendarView.getSelectedDate();
	};

	TrackView.prototype.showSelectTagForEntryView = function() {
		this.overlaySurfaceSetup();
		this.setHeaderLabel('New Tag');

		// Initializing the tags list.
		this.selectTagForEntryView.initializeTagsList();

		// Displaying the SelectTagForEntryView.
		this.showOverlayContent(this.selectTagForEntryView, function() {
			this.selectTagForEntryView.setFocusOnInputSurface();
		}.bind(this));
	};

	TrackView.prototype.showEditEntryOverlay = function(editEntryOverlayView, callback) {
		this.overlaySurfaceSetup();
		this.setHeaderLabel('Edit Entry');

		this.showOverlayContent(editEntryOverlayView, callback);
	};

	TrackView.prototype.overlaySurfaceSetup = function() {
		this.hideAllPopovers();

		if (this.isSprintMenuPopoverVisible) {
			this.hideSprintMenuPopover();
			this.isSprintMenuPopoverVisible = true;
		}

		// Producing the blur effect.
		this.entryListContainer.setProperties({
			webkitFilter: 'blur(5px)',
			filter: 'blur(5px)'
		});

		this.showBackButton();
		this.hideSearchIcon();
	};

	TrackView.prototype.getCurrentState = function() {
		return {onLoad: true};
	};

	App.pages[TrackView.name] = TrackView;

	module.exports = TrackView;
});
