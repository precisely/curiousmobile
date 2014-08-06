define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
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

	function _createBody() {
		this.entryListViewCache = [];
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
		if (User.isLoggedIn()) {
			this.scrollView = new Scrollview({
				direction: Utility.Direction.X,
				pagination: true,
				edgeGrip: 0.2,
			});
			var scrollModifier = new StateModifier({
				transform: Transform.translate(0,110, 0)	
			});	
			EntryCollection.fetchEntries([u.getMidnightDate(new Date())], function(collections) {
				for (var i = 0, l = collections.length; i < l; i++) {
					var entryListView = new EntryListView(collections[i]);
					// TODO make it work with scroll
					this.currentListView = entryListView;
					this.entryListViewCache.push(entryListView);
					entryListView.pipe(this.scrollView);
				}
				this.scrollView.sequenceFrom(this.entryListViewCache);
				this.layout.content.add(scrollModifier).add(this.scrollView);
			}.bind(this));

		}

	}

	function _createCalendar() {
		this.calendarView = new CalendarView();
		var calendarModifier = new StateModifier({
			transform: Transform.translate(50, 0, 0)
		});
		this.layout.header.add(calendarModifier).add(this.calendarView);

	}

	TrackView.prototype.getSelectedDate = function(){
		return this.calendarView.getCurrentDate();	
	}


	module.exports = TrackView;
});
