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
			this.setSelectedDate(DateUtil.addDays(this.selectedDate, 1));
		}.bind(this));

		selectDateView.on('date-minus', function() {
			console.log("CalendarView: subtracting a day");
			this.setSelectedDate(DateUtil.addDays(this.selectedDate, -1));
		}.bind(this));
		
	}

	function _createDateGrid(date) {
		var dateGridView = new DateGridView(date);
		this.dateGrid = dateGridView;
		this.dateGrid.on('select-date', function(date) {
			console.log('CalenderView: Date selected');
			this.setSelectedDate(date);
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
	
	CalendarView.prototype.getSelectedDate = function(){
		return this.selectedDate;
	}

	CalendarView.prototype.setSelectedDate = function(date){
		var App = window.App;
		App.selectedDate = DateUtil.getMidnightDate(date);
		this.selectedDate = date;
		this.selectDateView.setDate(this.selectedDate);	
		this.dateGrid.setSelectedDate(this.selectedDate);
	}

	module.exports = CalendarView;
});
