define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
    var Surface       = require('famous/core/Surface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
	var Utility = require("famous/utilities/Utility");
    var Scrollview = require("famous/views/Scrollview");
	var EntryListView = require('views/entry/EntryListView');
	var CalendarView = require('views/calendar/CalendarView');
	var Entry = require('models/Entry');

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
		this.scrollView  = new Scrollview({
			direction: Utility.Direction.X,
			pagination: true,
			edgeGrip: 0.2,
		});

		for (var i = 0, l = 5; i < l; i++) {
			var entryListView = new EntryListView();
			this.entryListViewCache.push(entryListView);
			entryListView.pipe(this.scrollView);
		}

		this.scrollView.sequenceFrom(this.entryListViewCache);

        var backgroundModifier = new StateModifier({
            transform: Transform.translate(0,44,0),
            //            size: [400,400]
        });
        this.layout.content.add(backgroundModifier).add(this.scrollView);
    }

	function _createCalendar() {
		var calendarView = new CalendarView();
        var calendarModifier = new StateModifier({
			transform: Transform.translate(50,0,0)
        });
		this.layout.header.add(calendarModifier).add(calendarView);
		
	}


    module.exports = TrackView;
});
