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

	function CalendarView(currentDate) {
		View.apply(this, arguments);
		if (typeof currentDate == 'undefined' || !(currentDate instanceof Date)) {
			currentDate = new Date();
		}
		this.currentDate = currentDate;
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
		var selectDateView = new SelectDateView(this.currentDate);
		this.add(selectDateView);
		selectDateView.on('click', function() {
			console.log("CalendarView: toggle date grid event");
			this.toggleDateGrid();
		}.bind(this));
	}

	function _createDateGrid(argument) {
		var dateGridView = new DateGridView();
		var gridModifier = new StateModifier({
			transform: Transform.translate(-20, 44, 0)
		});
		this.dateGrid = dateGridView;
	}

	function _renderTransitions() {
		var transition = new Transitionable(Transform.translate(-20, 44, 0));
		this.renderController.inTransformFrom(transition);
		this.renderController.outTransformFrom(transition);
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

	module.exports = CalendarView;
});
