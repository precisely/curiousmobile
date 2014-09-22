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
		this.pageChange = false; //making sure the pageChange even is disregarded on page reload
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
			if (this.listViewKeyMap[data.key]) {
				this.listViewKeyMap[data.key].refreshEntries(data.entries);
			}
		}.bind(this));

		var backgroundModifier = new StateModifier({
			origin: [0,0],
			transform: Transform.translate(0, 44, 0),
			//            size: [400,400]
		});
		this.layout.content.add(backgroundModifier).add(this.createView);
		var scrollModifier = new StateModifier({
			origin: [0,0],
			transform: Transform.translate(0, 110, 1)
		});
		this.renderController = new RenderController();
		this.layout.content.add(scrollModifier).add(this.renderController);
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
		this.listViewKeyMap = {};
		date = u.getMidnightDate(date);
		this.entryListViewCache = [];
		//creating 11 cached list views by default
		//5 days before and 5 days after today

		EntryCollection.fetchEntries(_getDefaultDates(date), function(collections) {
			for (var i = 0, l = collections.length; i < l; i++) {
				var entryListView = new EntryListView(collections[i]);
				this.entryListViewCache.push(entryListView);
				this.listViewKeyMap[collections[i].key] = entryListView;
			}
			this.currentListView = this.entryListViewCache[5];
			//setting the scroll position to today
			//this.scrollView.goToPage(5);
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
