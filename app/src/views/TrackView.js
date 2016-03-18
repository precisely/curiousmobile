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
		_createBody.call(this);
		_createCalendar.call(this);
	}

	TrackView.prototype = Object.create(BaseView.prototype);
	TrackView.prototype.constructor = TrackView;

	TrackView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		noBackButton: true,
		reloadOnResume: true,
		activeMenu: 'track'
	};

	function _getDefaultDates(date) {
		var dates = [];
		var date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 5);
		date = u.getMidnightDate(date);

		for (var i = 0, len = 11; i < len; i++) {
			dates.push(new Date(date.getFullYear(), date.getMonth(), date.getDate() + i));
		}
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
				this._eventOutput.emit('create-entry');
			}
		}.bind(this));

		formContainerSurface.add(this.inputModifier).add(this.inputSurface);
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(function(progress) {
			return Transform.translate(0, 0, 0);
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
			}
		});

		var entryListModifier = new Modifier({
			transform: Transform.translate(0, 55, 1),
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

	TrackView.prototype.preChangePage = function() {
		BaseView.prototype.preChangePage.call(this);
		this.hidePopover();
	}

	TrackView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
	};

	TrackView.prototype.showPopover = function() {
		if (!store.get('trackathonVisited')) {
			setTimeout(function() {
				$('#TrackView-sprint-menu').popover('show');
				if (document.getElementById('TrackView-sprint-menu')) {
					document.getElementById('TrackView-sprint-menu').classList.add('active');
				}
			}.bind(this), 400);
			this.isPopoverVisible = true;
		}
	};

	TrackView.prototype.hidePopover = function() {
		$('#TrackView-sprint-menu').popover('hide');
		if (document.getElementById('TrackView-sprint-menu')) {
			document.getElementById('TrackView-sprint-menu').classList.remove('active');
		}
		this.isPopoverVisible = false;
	};

	TrackView.prototype.preShow = function(state) {
		BaseView.prototype.preShow.call(this);
		this.popoverVisible = false;
		if (state && state.fromServer) {
			var glowEntryDate = state.data.glowEntry.get("date");
			if (this.calendarView.getSelectedDate().setHours(0, 0, 0) !== new Date(glowEntryDate).setHours(0, 0, 0)) {
				return true;
			}
			var updatedEntries = EntryCollection.getFromCache(glowEntryDate);
			this.currentListView.refreshEntries(state.data.entries, state.data.glowEntry);
		} else {
			EntryCollection.clearCache();
			this.changeDate(this.calendarView.selectedDate, function() {
				if (this.currentListView && this.currentListView.draggableList.length) {
					this.showPopover();
				}
			}.bind(this));
		}
		return true;
	};

	TrackView.prototype.getScrollPosition = function() {
		return this.currentListView.scrollView.getPosition();
	};

	TrackView.prototype.killOverlayContent = function () {
		this.killEntryForm();
	};

	TrackView.prototype.killEntryForm = function(onEntryFormSubmit) {
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
		if (this.isPopoverVisible) {
			this.showPopover();
		}
		this.setHeaderSurface(this.calendarView, new StateModifier({align: [0.5, 0.5], origin: [0.5, 0.5]}));
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
			this.renderController.show(this.currentListView, {
				duration: 0
			}, callback);
		}.bind(this));
	};

	TrackView.prototype.getSelectedDate = function() {
		return this.calendarView.getSelectedDate();
	};

	TrackView.prototype.showEntryFormView = function(state) {
		var continueShowForm = this.entryFormView.preShow(state);
		if (continueShowForm) {
			if (this.isPopoverVisible) {
				this.hidePopover();
				this.isPopoverVisible = true;
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
				new: true,
				postLoadAction: {
					name: 'showEntryFormView',
					args: this.entryFormView.getCurrentState()
				}
			};
		} else {
			return {new: true};
		}
	};

	App.pages[TrackView.name] = TrackView;
	module.exports = TrackView;
});
