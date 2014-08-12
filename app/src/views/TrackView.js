define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require("famous/views/RenderController");
	var Utility = require("famous/utilities/Utility");
	var Scrollview = require("famous/views/Scrollview");
	var EntryListView = require('views/entry/EntryListView');
	var EntryView = require('views/entry/EntryView');
	var CalendarView = require('views/calendar/CalendarView');
	var Entry = require('models/Entry');
	var EntryCollection = require('models/EntryCollection');
	var User = require('models/User');
	var u = require('util/Utils');


	function TrackView() {
		BaseView.apply(this, arguments);
		_createBody.call(this);
		_createCalendar.call(this);
	}

	TrackView.prototype = Object.create(BaseView.prototype);
	TrackView.prototype.constructor = TrackView;

	TrackView.DEFAULT_OPTIONS = {};

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
		this.createView = new EntryView(new Entry(), true);

		this.createView.on('new-entry', function(data) {
			console.log("New Entry - TrackView event");
			this.currentListView.refreshEntries(data.entries, data.glowEntry);
		}.bind(this));

		var backgroundModifier = new StateModifier({
			transform: Transform.translate(0, 44, 0),
			//            size: [400,400]
		});
		this.layout.content.add(backgroundModifier).add(this.createView);
		var scrollModifier = new StateModifier({
			transform: Transform.translate(0, 110, 1)
		});
		this.renderController = new RenderController();
		this.layout.content.add(scrollModifier).add(this.renderController);
		if (User.isLoggedIn()) {
			this.addEntryListViews(new Date());
		}

	}

	function _createCalendar() {
		this.calendarView = new CalendarView();
		var calendarModifier = new StateModifier({
			transform: Transform.translate(50, 0, 0)
		});

		this.calendarView.on('manual-date-change', function(e) {
			this.addEntryListViews(e.date);
		}.bind(this));
		this.layout.header.add(calendarModifier).add(this.calendarView);

	}

	TrackView.prototype.addEntryListViews = function(date) {
		this.entryListViewCache = [];
		if (this.scrollView) {
			this.renderController.hide(this.scrollView);
		}
		this.scrollView = new Scrollview({
			direction: Utility.Direction.X,
			paginated: true,
		});
		//creating 11 cached list views by default
		//5 days before and 5 days after today

		EntryCollection.fetchEntries(_getDefaultDates(date), function(collections) {
			for (var i = 0, l = collections.length; i < l; i++) {
				var entryListView = new EntryListView(collections[i]);
				// TODO make it work with scroll
				this.currentListView = entryListView;
				this.entryListViewCache.push(entryListView);
				entryListView.pipe(this.scrollView);
			}
			this.scrollView.sequenceFrom(this.entryListViewCache);
			//setting the scroll position to today
			this.scrollView.setPosition(window.innerWidth * 5);
			this.lastScrollPosition = this.scrollView.getPosition();
			this.scrollView.on('pageChange', function(e) {
				var listView = this.entryListViewCache[e.index];
				if (listView) {
					if (e.index < 2 || e.index > this.entryListViewCache.length - 2) {
						var selectedDate = listView.entries.date;
						this.calendarView.setSelectedDate(selectedDate);
						this.addEntryListViews(selectedDate);
					} else {
						this.calendarView.changeDate(e.direction);
						listView.refreshEntries();
						console.log('No list view found');
					}
				}
			}.bind(this));
			this.renderController.show(this.scrollView);
		}.bind(this));
	}

	TrackView.prototype.getSelectedDate = function() {
		return this.calendarView.getCurrentDate();
	}


	module.exports = TrackView;
});
