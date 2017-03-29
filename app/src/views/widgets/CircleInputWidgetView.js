define(function(require, exports, module) {
	'use strict';

	var InputWidgetView = require('views/widgets/InputWidgetView');

	function CircleInputWidgetView() {
		InputWidgetView.apply(this, arguments);
	}

	CircleInputWidgetView.prototype = Object.create(InputWidgetView.prototype);
	CircleInputWidgetView.prototype.constructor = CircleInputWidgetView;

	CircleInputWidgetView.prototype.selectCircle = function(element) {
		$(element).addClass('fill-circle');
	};

	CircleInputWidgetView.prototype.unSelectCircle = function(element) {
		$(element).removeClass('fill-circle');
	};

	CircleInputWidgetView.prototype.selectInput = function(element) {
		if (this.isPlainCircleInput(element)) {
			this.selectCircle(element);
		} else {
			this.selectIcon(element);
		}

		this.currentlySelected.state = this.STATES.SELECTED;
		this.currentlySelected.id = element.id;
	};

	CircleInputWidgetView.prototype.unSelectCurrentlySelected = function(element) {
		if (this.isPlainCircleInput(element)) {
			this.unSelectCircle(element);
		} else {
			this.unSelectIcon(element);
		}

		this.currentlySelected.state = this.STATES.NONE_SELECTED;
		this.currentlySelected.id = this.DOM_ID.NONE;
	};

	CircleInputWidgetView.prototype.selectIcon = function(element) {
		var currentSelection = this.getCurrentlySelectedElement(element);
		this.selectCircle(currentSelection);
	};

	CircleInputWidgetView.prototype.unSelectIcon = function(element) {
		var unSelect = true;
		var currentSelection = this.getCurrentlySelectedElement(element, unSelect);

		this.unSelectCircle(currentSelection);
	};

	module.exports = CircleInputWidgetView;
});