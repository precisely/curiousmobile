define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
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
	var EntryFormView = require('views/entry/EntryFormView');
	var CalendarView = require('views/calendar/CalendarView');
	var Entry = require('models/Entry');
	var EntryCollection = require('models/EntryCollection');
	var User = require('models/User');
	var u = require('util/Utils');
	var inputSurfaceTemplate = require('text!templates/input-surface-dummy.html');


	function TrackView() {
		BaseView.apply(this, arguments);
		this.pageChange = false; //making sure the pageChange even is disregarded on page reload
		_createBody.call(this);
		_createCalendar.call(this);
	}

	TrackView.prototype = Object.create(BaseView.prototype);
	TrackView.prototype.constructor = TrackView;

	TrackView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
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
			size: [undefined, 70],
			properties: {
				backgroundColor: '#eaeaea',
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
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				this._eventOutput.emit('create-entry');
			}
		}.bind(this));

		formContainerSurface.add(this.inputModifier).add(this.inputSurface);
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(function(progress) {
			return Transform.translate(0, 0, window.App.zIndex.readView);
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
			transform: Transform.translate(0, 70, 1),
		});

		entryListModifier.sizeFrom(function() {
			var size = [App.width, App.height];
			return [undefined, size[1] - 185];
		});

		entryListContainer.add(this.renderController);

		this.setBody(formContainerSurface);
		this.addContent(entryListModifier, entryListContainer);

		if (User.isLoggedIn()) {
			this.changeDate(new Date());
		}


		this._eventInput.on('on-show', function(e) {
			if (e && e.pushNotification) {
				this.changeDate(e.entryDate);
			}
		});

		App.coreEventHandler.on('refresh-entries', function() {
			EntryCollection.clearCache();
			this.changeDate(this.calendarView.selectedDate, function() {
				console.log('TrackView: Entries refreshed');
			}.bind(this));
		}.bind(this));


		this.on('select-entry', function(entry) {
			console.log('entry selected with id: ' + entry.id);
			var formViewState = this.getPage('EntryFormView').buildStateFromEntry(entry);
			this.changePage('EntryFormView', formViewState);
		}.bind(App.pageView));

		this.on('create-entry', function(e) {
			console.log('EventHandler: this.trackView.on event: create-entry');
			this.getPage('EntryFormView').unsetEntry();
			this.changePage('EntryFormView', {
				viewProperties: {
					entry: new Entry(),
				},
			});
		}.bind(App.pageView));
	}

	function _createCalendar() {
		this.calendarView = new CalendarView();
		var calendarModifier = new StateModifier({
			transform: Transform.translate(50, 0, 0)
		});
		this.calendarView.on('manual-date-change', function(e) {
			this.changeDate(e.date);
		}.bind(this));
		this.layout.header.add(calendarModifier).add(this.calendarView);

	}

	TrackView.prototype.changeDate = function(date, callback) {
		date = u.getMidnightDate(date);

		EntryCollection.fetchEntries(_getDefaultDates(date), function(entries) {
			//5 days before and 5 days after today
			this.currentListView = new EntryListView(entries);
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
	}

	TrackView.prototype.getSelectedDate = function() {
		return this.calendarView.getSelectedDate();
	}


	App.pages[TrackView.name] = TrackView;
	module.exports = TrackView;
});
