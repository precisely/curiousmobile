define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var SelectDateView = require('views/SelectDateView');
	var DateGridView = require('views/DateGridView');
	var RenderController = require("famous/views/RenderController");
    var Transitionable = require("famous/transitions/Transitionable");
	var DateUtil = require('DateUtil');

	function CalendarView(selectedDate) {
		View.apply(this, arguments);
		if (typeof selectedDate == 'undefined' || !(selectedDate instanceof Date)) {
			var today = new Date();
			selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		}
		this.selectedDate = selectedDate;
		this.renderController = new RenderController();
		this.add(this.renderController);
		_createHeader.call(this);
		_createDateGrid.call(this);
		_renderTransitions.call(this);
	}

	CalendarView.prototype = Object.create(View.prototype);
	CalendarView.prototype.constructor = CalendarView;

	CalendarView.DEFAULT_OPTIONS = {};

	function _createHeader(argument) {
		var selectDateView = new SelectDateView(this.selectedDate);
		this.add(selectDateView);
		selectDateView.on('toggle-date-grid', function() {
			console.log("CalendarView: toggle date grid event");
			this.toggleDateGrid();
		}.bind(this));
		this.selectDateView = selectDateView;
		selectDateView.on('date-add', function() {
			console.log("CalendarView: adding a day");
			this.selectedDate = DateUtil.addDays(this.selectedDate, 1);
			this.changeToDate();
		}.bind(this));

		selectDateView.on('date-minus', function() {
			console.log("CalendarView: subtracting a day");
			this.selectedDate = DateUtil.minusDays(this.selectedDate, 1);
			this.changeToDate();
		}.bind(this));
		
	}

	function _createDateGrid(argument) {
		var dateGridView = new DateGridView(this.selectedDate);
		this.dateGrid = dateGridView;
		this.dateGrid.on('select-date', function(date) {
			console.log('CalenderView: Date selected');
			this.changeToDate(date);
			this.toggleDateGrid();
		}.bind(this));
	}

	function _renderTransitions() {
		var transition = new Transitionable(Transform.translate(-20, 44, 0));
		this.renderController.inTransformFrom(transition);
		this.renderController.outTransformFrom(transition);
	}
	
	function _setListeners(argument) {
		
	}

	CalendarView.prototype.toggleDateGrid = function () {
		if (typeof this.showingDateGrid == 'undefined' || !this.showingDateGrid) {
			this.renderController.show(this.dateGrid);	
			this.showingDateGrid = true;
		} else {
			this.renderController.hide();	
			this.showingDateGrid = false;
		}
	}
	
	CalendarView.prototype.changeToDate = function (date) {
		if (typeof date == 'undefined') {
			date = this.selectedDate;	
		} else {
			this.selectedDate = date;	
		}
		this.selectDateView.changeDate(this.selectedDate);	
		this.dateGrid.changeSelectedDate(this.selectedDate);
	}

	module.exports = CalendarView;
});
