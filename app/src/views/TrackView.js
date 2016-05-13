define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	require('jquery');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Transform = require('famous/core/Transform');
	var Transitionable = require("famous/transitions/Transitionable");
	var SnapTransition = require("famous/transitions/SnapTransition");
	Transitionable.registerMethod('snap', SnapTransition);
	var Draggable = require('famous/modifiers/Draggable');
	var InputSurface = require('famous/surfaces/InputSurface');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
	var RenderNode = require('famous/core/RenderNode');
	var FastClick = require('famous/inputs/FastClick');
	var Utility = require("famous/utilities/Utility");
	var Scrollview = require("famous/views/Scrollview");
	var EntryListView = require('views/entry/EntryListView');
	var EntryView = require('views/entry/EntryView');
	var TrackEntryFormView = require('views/entry/TrackEntryFormView');
	var CalendarView = require('views/calendar/CalendarView');
	var Entry = require('models/Entry');
	var EntryCollection = require('models/EntryCollection');
	var User = require('models/User');
	var store = require('store');
	var u = require('util/Utils');
	require('bootstrap');
	var DateUtil = require('util/DateUtil');
	var inputSurfaceTemplate = require('text!templates/input-surface-dummy.html');
	
	function TrackView() {
		BaseView.apply(this, arguments);
		this.pageChange = false; //making sure the pageChange even is disregarded on page reload
		this.entryFormView = new TrackEntryFormView({trackView: this});
		this.popoversList = [];
		_createBody.call(this);
		_createCalendar.call(this);
		_setHandlers.call(this);
	}

	TrackView.prototype = Object.create(BaseView.prototype);
	TrackView.prototype.constructor = TrackView;

	TrackView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		noBackButton: true,
		reloadOnResume: true,
		activeMenu: 'track',
		contextMenuOptions: [
			{class: 'add-bookmark', label: 'Add Bookmark'},
			{class: 'edit-bookmarks', label: 'Edit Bookmarks'}
		]
	};

	function _getDefaultDates(date) {
		var dates = [date];
		// var date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 5);
		// date = u.getMidnightDate(date);
		//
		// for (var i = 0, len = 11; i < len; i++) {
		// 	dates.push(new Date(date.getFullYear(), date.getMonth(), date.getDate() + i));
		// }
		return dates;
	}

	function _createBody() {
		var formContainerSurface = new ContainerSurface({
			size: [undefined, 80],
			properties: {
				backgroundColor: '#eaeaea',
				fontSize: '12px',
				color: 'rgb(113, 113, 113)',
				paddingBottom: '5px'
			}
		});

		this.inputModifier = new Modifier({
			align: [0, 0],
			transform: Transform.translate(15, 15, window.App.zIndex.readView)
		});

		this.inputModifier.sizeFrom(function() {
			var mainContext = window.mainContext;
			var size = mainContext.getSize();
			return [window.innerWidth - 30, 40];
		});

		this.inputSurface = new Surface({
			content: _.template(inputSurfaceTemplate, {
				tag: ''
			}, templateSettings),
		});

		this.inputSurface.on('click', function(e) {
			console.log('TrackView: Clicking on dummy input surface');
			if (e instanceof CustomEvent) {
				if (_.contains(e.srcElement.classList, 'bookmark-plus') || _.contains(e.srcElement.parentElement.classList, 'bookmark-plus')) {
					$('#bookmark-menu-icon').popover('destroy');
					if (this.currentListView.pinnedViews.length === 0) {
						this.options.contextMenuOptions.splice(1, 1);
					}
					App.pageView._eventOutput.emit('show-context-menu', {
						menu: 'bookmark',
						target: this,
						eventArg: {}
					});
				} else if (_.contains(e.srcElement.classList, 'input-placeholder')) {
					$('#entry-description-dummy').popover('destroy');
					this._eventOutput.emit('create-entry');
				}
			}
		}.bind(this));

		formContainerSurface.add(this.inputModifier).add(this.inputSurface);

		this.renderController = new RenderController();
		this.renderController.inTransformFrom(function(progress) {
			return Transform.translate(0, 0, 5);
		});

		var draggableToRefresh = new Draggable({
			xRange: [0, 0],
			yRange: [0, 40],
		});

		var draggableNode = new RenderNode(draggableToRefresh);
		var snapTransition = {
			method: 'snap',
			period: 300,
			dampingRatio: 0.3,
			velocity: 0
		};

		var entryListContainer = new ContainerSurface({
			classes: ['entry-list-container'],
			properties: {
				overflow: 'hidden',
				zIndex: 2
			}
		});

		var entryListModifier = new Modifier({
			transform: Transform.translate(0, 55, 5)
		});

		entryListModifier.sizeFrom(function() {
			var size = [App.width, App.height];
			return [undefined, size[1] - 160];
		});

		entryListContainer.add(this.renderController);

		this.formContainerSurface = formContainerSurface;
		this.setBody(formContainerSurface);
		this.entryListContainer = entryListContainer;
		this.addContent(entryListModifier, entryListContainer);

		this.on('create-entry', function(e) {
			console.log('EventHandler: this.trackView.on event: create-entry');
			var formViewState = this.entryFormView.buildStateFromEntry(new Entry());
			this.showEntryFormView(formViewState);
		}.bind(this));

		this.on('close-date-grid', function(date) {
			this.hideShimSurface();
			this.calendarView.renderController.hide();
			this.calendarView.showingDateGrid = false;
			this.entryFormView.dateGridRenderController.hide();
			this.entryFormView.dateGridOpen = false;
		}.bind(this));
	}

	TrackView.prototype.refresh = function() {
		EntryCollection.clearCache();
		this.changeDate(this.calendarView.selectedDate, function() {
			console.log('TrackView: Entries refreshed');
		}.bind(this));
	};

	function _createCalendar() {
		this.calendarView = new CalendarView();
		this.calendarView.on('manual-date-change', function(e) {
			this.changeDate(e.date);
		}.bind(this));
		App.selectedDate = DateUtil.getMidnightDate(this.calendarView.selectedDate);
		this.setHeaderSurface(this.calendarView);
	}

	TrackView.prototype.showAllPopovers = function(state, glowEntry) {
		var showEntryBalloon;
		var showBookmarkBalloon;
		var entryId;

		if (state && state.data) {
			showEntryBalloon = state.data.showEntryBalloon ? state.data.showEntryBalloon : false;
			showBookmarkBalloon = state.data.showBookmarkBalloon ? state.data.showBookmarkBalloon : false;
			entryId = glowEntry ? glowEntry.id : null;
		}
		var elementId = "#entry-" + entryId;

		if (!store.get('hasVisitedMobileApp')) {
			store.set('hasVisitedMobileApp', true);

			if (!this.currentListView || this.currentListView.pinnedViews.length > 0) {
				App.showPopover('#bookmark-label', {key: 'bookmarksPresent', container: '#bookmark-label', placement: 'bottom', autoHide: true});
				this.popoversList.push('#bookmark-label');
			} else {
				App.showPopover('#bookmark-menu-icon', {key: 'createBookmark', container: '#bookmark-menu-icon', placement: 'bottom'});
				this.popoversList.push('#bookmark-menu-icon');
			}

			App.showPopover('#entry-description-dummy', {key: 'enterTag', placement: 'bottom', container: '#entry-description-dummy'});
			this.popoversList.push('#entry-description-dummy');
		}

		if (showEntryBalloon) {
			App.showPopover(elementId, {key: 'entryAdded', autoHide: true, container: '#popover-surface'});
			this.popoversList.push(elementId);
		}

		if (showBookmarkBalloon) {
			App.showPopover(elementId, {key: 'bookmarkAdded', autoHide: true, container: '#popover-surface'});
			this.popoversList.push(elementId);
		}

		this.showSprintMenuPopover();

		if (state && state.showTrackathonTagsBalloon) {
			App.showPopover('#bookmark-label', {key: 'trackathonBookmarks', container: '#bookmark-label', placement: 'bottom', autoHide: true});
			this.popoversList.push('#bookmark-label');
		}
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

	TrackView.prototype.initContextMenuOptions = function() {
		this.options.contextMenuOptions = [
			{class: 'add-bookmark', label: 'Add Bookmark'},
			{class: 'edit-bookmarks', label: 'Edit Bookmarks'}
		];
	};

	TrackView.prototype.preShow = function(state) {
		if (this.processingNotification) {
			return false;
		}
		BaseView.prototype.preShow.call(this);
		this.isSprintMenuPopoverVisible = false;

		var glowEntry;

		// New entry or bookmark from the server.
		if (state && state.fromServer) {
			var glowEntryDate, entries, currentDay;

			glowEntry = state.data.glowEntry;
			glowEntryDate = glowEntry.get("date");
			entries = EntryCollection.setCache(glowEntryDate, state.data.entries);

			currentDay = this.isCurrentDay(glowEntryDate);
			if (currentDay) {
				this.currentListView.refreshEntries(entries, glowEntry, function() {
					this.showAllPopovers(state, glowEntry);
				}.bind(this));

				return true;
			}
		} else if (state && state.isPushNotificaton) {
			var glowEntryId = state.entryId;
			var glowEntryDate = state.entryDate;
			this.processingNotification = true;
			
			this.calendarView.setSelectedDate(glowEntryDate);
			this.changeDate(this.calendarView.selectedDate, function() {
				var glowEntry = this.currentListView.getEntry(glowEntryId);
				this.currentListView.glowView = this.currentListView.getTrackEntryView(glowEntryId);
				this.currentListView.handleGlowEntry();
				this.processingNotification = false;
			}.bind(this), null);
			
			return true;
		}

		EntryCollection.clearCache();
		this.changeDate(this.calendarView.selectedDate, function() {
			this.showAllPopovers(state, glowEntry);
		}.bind(this), glowEntry);

		return true;
	};

	TrackView.prototype.preChangePage = function() {
		BaseView.prototype.preChangePage.call(this);
		this.hideSprintMenuPopover();
	};

	TrackView.prototype.isCurrentDay = function(date) {
		return (this.calendarView.getSelectedDate().setHours(0, 0, 0) == new Date(date).setHours(0, 0, 0));
	};

	TrackView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		this.options.contextMenuOptions.splice(1, 1, {class: 'edit-bookmarks', label: 'Edit Bookmarks'});
	};

	TrackView.prototype.getScrollPosition = function() {
		return this.currentListView.scrollView.getPosition();
	};

	TrackView.prototype.killOverlayContent = function () {
		this.killEntryForm();
	};

	TrackView.prototype.killEntryForm = function(onEntryFormSubmit) {
		$('#remind-surface').popover('destroy');
		this.entryListContainer.setProperties({
			webkitFilter: 'blur(0px)',
			filter: 'blur(0px)'
		});
		this.formContainerSurface.setProperties({
			visibility: 'visible'
		});
		$('#entry-description').val('');
		this.entryFormView.dateGridRenderController.hide();
		this.entryFormView.renderController.hide();
		this.entryFormView.buttonsRenderController.hide();
		this.entryFormView.submitButtonRenderController.hide();
		this.entryFormView.deleteButtonRenderController.hide();
		this.entryFormView.batchMoveUpModifiers();
		BaseView.prototype.killOverlayContent.call(this);
		this.showMenuButton();
		this.showSearchIcon();
		if (this.isSprintMenuPopoverVisible) {
			this.showSprintMenuPopover();
		}
		this.setHeaderSurface(this.calendarView, new StateModifier({align: [0.5, 0.5], origin: [0.5, 0.5]}));
		if (this.currentListView.keepBookmarkEditMode && this.currentListView.pinnedViews.length > 0) {
			this.showBookmarkShimSurface();
		}
		this.currentListView.keepBookmarkEditMode = false;
	};

	TrackView.prototype.changeDate = function(date, callback, glowEntry) {
		date = u.getMidnightDate(date);

		App.selectedDate = date;
		EntryCollection.fetchEntries(_getDefaultDates(date), function(entries) {
			//5 days before and 5 days after today
			this.currentListView = new EntryListView(entries, glowEntry);
			//Handle entry selection handler
			this.currentListView.on('select-entry', function(entry) {
				console.log('TrackView: Selecting an entry');
				this._eventOutput.emit('select-entry', entry);
			}.bind(this));

			//Handle cache refresh

			this.currentListView.on('delete-failed', function() {
				this.changeDate(this.calendarView.selectedDate, function() {
					u.showAlert("Error deleting entry");
					console.log('TrackView: Entries refreshed after a failed delete');
				}.bind(this));
			});
			//setting the scroll position to today
			//this.scrollView.goToPage(5);
			this.renderController.hide({
				duration: 0
			});
			this.renderController.show(this.currentListView, null, callback);
		}.bind(this));
	};

	TrackView.prototype.getSelectedDate = function() {
		return this.calendarView.getSelectedDate();
	};

	TrackView.prototype.showEntryFormView = function(state) {
		this.hideAllPopovers();
		this.hideBookmarkShimSurface();
		var continueShowForm = this.entryFormView.preShow(state);
		if (continueShowForm) {
			if (this.isSprintMenuPopoverVisible) {
				this.hideSprintMenuPopover();
				this.isSprintMenuPopoverVisible = true;
			}
			this.entryListContainer.setProperties({
				webkitFilter: 'blur(5px)',
				filter: 'blur(5px)'
			});
			this.formContainerSurface.setProperties({
				visibility: 'hidden'
			});
			this.showBackButton();
			this.setHeaderLabel('');
			this.entryFormView.draggableEntryFormView.setPosition([0, 0]);
			this.hideSearchIcon();
			this.showOverlayContent(this.entryFormView, function() {
				this.onShow(state);
			}.bind(this.entryFormView));
		}
	};

	TrackView.prototype.buildStateFromEntry = function(entry) {
		return this.entryFormView.buildStateFromEntry(entry);
	};

	TrackView.prototype.getCurrentState = function() {
		if (this.currentOverlay == 'EntryFormView') {
			return {
				onLoad: true,
				postLoadAction: {
					name: 'showEntryFormView',
					args: this.entryFormView.getCurrentState()
				}
			};
		} else {
			return {onLoad: true};
		}
	};

	function _setHandlers() {
		this.on('edit-bookmarks', function(event) {
			this.options.contextMenuOptions.splice(1, 1, {class: 'done-edit-bookmarks', label: 'Done Editing'});
			this.showBookmarkShimSurface();
			_.each(document.getElementsByClassName('edit-pin'), function(editPinIcon, index) {
				editPinIcon.classList.remove('display-none');
				this.currentListView.pinnedViews[index].entry.state = 'bookmarkEdit';
			}.bind(this));
		});

		this.on('done-edit-bookmarks', function(event) {
			this.options.contextMenuOptions.splice(1, 1, {class: 'edit-bookmarks', label: 'Edit Bookmarks'});
			this.hideBookmarkShimSurface();
			_.each(document.getElementsByClassName('edit-pin'), function(editPinIcon, index) {
				editPinIcon.classList.add('display-none');
				this.currentListView.pinnedViews[index].entry.state = null;
			}.bind(this));
		});

		this.on('add-bookmark', function(event) {
			this.showEntryFormView({bookmarkForm: true});
		});
	}

	App.pages[TrackView.name] = TrackView;
	module.exports = TrackView;
});
