define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
    var Surface       = require('famous/core/Surface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
	var EntryListView = require('views/EntryListView');
	var CalendarView = require('views/CalendarView');
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
		this.entryListView = new EntryListView();

        var backgroundModifier = new StateModifier({
            transform: Transform.translate(0,44,0),
            //            size: [400,400]
        });
        this.layout.content.add(backgroundModifier).add(this.entryListView);
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
