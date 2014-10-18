define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
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
			content: _.template(inputSurfaceTemplate, {tag: ''}, templateSettings),
		});

		this.inputSurface.on('click', function(e) {
			console.log('TrackView: Clicking on dummy input surface');
				this._eventOutput.emit('create-entry');
		}.bind(this));

		formContainerSurface.add(this.inputModifier).add(this.inputSurface);
		var formModifier = new StateModifier({
			origin: [0,0],
			transform: Transform.translate(0, 74, 0),
			//            size: [400,400]
		});
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(function(progress){
			return Transform.translate(0, 0, window.App.zIndex.readView);	
		});
		var entryListContainer = new ContainerSurface({
			size: [320, window.innerHeight - 140],
			properties: {
				overflow: 'hidden',
			}
		});
		var entryListModifier = new StateModifier({
			origin: [0,0],
			transform: Transform.translate(0, 70, 0),
			size: [320,358]
		});
		entryListContainer.add(this.renderController);
		formContainerSurface.add(entryListModifier).add(entryListContainer);
		this.setBody(formContainerSurface);

		if (User.isLoggedIn()) {
			this.changeDate(new Date());
		}

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

	TrackView.prototype.changeDate = function(date) {
		date = u.getMidnightDate(date);

		EntryCollection.fetchEntries(_getDefaultDates(date), function(collections) {
			//5 days before and 5 days after today
			this.currentListView = new EntryListView(collections[5]);
			//Handle entry selection handler
			this.currentListView.on('select-entry', function(entry) {
				console.log('TrackView: Selecting an entry');
				this._eventOutput.emit('select-entry', entry);
			}.bind(this));
			//setting the scroll position to today
			//this.scrollView.goToPage(5);
			this.renderController.hide({duration:0});
			this.renderController.show(this.currentListView, {
				duration: 0
			});
		}.bind(this));
	}

	TrackView.prototype.getSelectedDate = function() {
		return this.calendarView.getCurrentDate();
	}


	module.exports = TrackView;
});
