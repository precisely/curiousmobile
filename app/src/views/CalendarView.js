define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var SelectDateView = require('views/SelectDateView');
	var DateGridView = require('views/DateGridView');
	var RenderController = require("famous/views/RenderController");

	function CalendarView(currentDate) {
		View.apply(this, arguments);
		if (typeof currentDate == 'undefined' || !(currentDate instanceof Date)) {
			currentDate = new Date();
		}
		this.currentDate = currentDate;
		_createHeader.call(this);
		_createDateGrid.call(this);
	}

	CalendarView.prototype = Object.create(View.prototype);
	CalendarView.prototype.constructor = CalendarView;

	CalendarView.DEFAULT_OPTIONS = {};

	function _createHeader(argument) {
		var selectDateView = new SelectDateView(this.currentDate);
		this.add(selectDateView);
	}

	function _createDateGrid(argument) {
		var dateGridView = new DateGridView();
		var gridModifier = new StateModifier({
			transform: Transform.translate(-20, 44, 0)
		});
		this.add(gridModifier).add(dateGridView);
	}

	module.exports = CalendarView;
});
