define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var SelectDateView = require('views/calendar/SelectDateView');
	var DateGridView = require('views/calendar/DateGridView');
	var RenderController = require("famous/views/RenderController");
	var Transitionable = require("famous/transitions/Transitionable");
	var DateUtil = require('util/DateUtil');

	function CalendarView(selectedDate) {
		View.apply(this, arguments);
		if (typeof selectedDate == 'undefined' || !(selectedDate instanceof Date)) {
			var today = new Date();
			selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		}
		this.renderController = new RenderController();
		this.add(this.renderController);
		_createHeader.call(this, selectedDate);
		_createDateGrid.call(this, selectedDate);
		this.setSelectedDate(selectedDate);
		_renderTransitions.call(this);
	}

	CalendarView.prototype = Object.create(View.prototype);
	CalendarView.prototype.constructor = CalendarView;

	CalendarView.DEFAULT_OPTIONS = {};

	function _zIndex(argument) {
		return window.App.zIndex.datePicker;
	}

	function _createHeader(date) {
		var selectDateView = new SelectDateView(date);
		this.add(selectDateView);
		selectDateView.on('toggle-date-grid', function() {
			console.log("CalendarView: toggle date grid event");
			this.toggleDateGrid();
		}.bind(this));
		this.selectDateView = selectDateView;
		selectDateView.on('date-add', function() {
			console.log("CalendarView: adding a day");
			var date = DateUtil.addDays(this.selectedDate, 1);
			this.setSelectedDate(date);
			_manualDateChangeHandler.call(this, date);
		}.bind(this));

		selectDateView.on('date-minus', function() {
			console.log("CalendarView: subtracting a day");
			var date = DateUtil.addDays(this.selectedDate, -1);
			this.setSelectedDate(date);
			_manualDateChangeHandler.call(this, date);
		}.bind(this));

	}

	function _createDateGrid(date) {
		var dateGridView = new DateGridView(date);
		this.dateGrid = dateGridView;
		this.dateGrid.on('select-date', function(date) {
			console.log('CalenderView: Date selected');
			this.setSelectedDate(date);
			_manualDateChangeHandler.call(this, date);
			this.toggleDateGrid();
		}.bind(this));
	}

	function _manualDateChangeHandler(date) {
		this._eventOutput.emit('manual-date-change', {date: date});
	}

	function _renderTransitions() {
		var transition = new Transitionable(Transform.translate(-20, 74, _zIndex()));
		this.renderController.inTransformFrom(transition);
		this.renderController.outTransformFrom(transition);
	}

	function _setListeners(argument) {

	}

	CalendarView.prototype.toggleDateGrid = function() {
		if (typeof this.showingDateGrid == 'undefined' || !this.showingDateGrid) {
			this.renderController.show(this.dateGrid);
			this.showingDateGrid = true;
		} else {
			this.renderController.hide();
			this.showingDateGrid = false;
		}
	}

	CalendarView.prototype.getSelectedDate = function() {
		return this.selectedDate;
	}

	CalendarView.prototype.setSelectedDate = function(date) {
		var App = window.App;
		this.selectedDate = date;
		this.selectDateView.setDate(this.selectedDate);
		this.dateGrid.setSelectedDate(this.selectedDate);
	}

	CalendarView.prototype.changeDate = function(direction) {
		var date = this.selectedDate;
		var newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + direction);
		this.setSelectedDate(newDate);
		return newDate;
	}

	module.exports = CalendarView;
});
