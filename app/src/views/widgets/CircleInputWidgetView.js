define(function(require, exports, module) {
	'use strict';

	var InputWidgetView = require('views/widgets/InputWidgetView');

	function CircleInputWidgetView() {
		InputWidgetView.apply(this, arguments);
	}

	CircleInputWidgetView.prototype = Object.create(InputWidgetView.prototype);
	CircleInputWidgetView.prototype.constructor = CircleInputWidgetView;

	CircleInputWidgetView.prototype.getElementIdToSelect = function() {
		var position = this.getInputElementPositionToSelect();

		switch (position) {
			case 1:
				return this.CIRCLE_1_ID;
				break;
			case 2:
				return this.CIRCLE_2_ID;
				break;
			case 3:
				return this.CIRCLE_3_ID;
				break;
			case 4:
				return this.CIRCLE_4_ID;
				break;
			case 5:
				return this.CIRCLE_5_ID;
		}
	};

	CircleInputWidgetView.prototype.selectCircle = function(element) {
		$(element).addClass('fill-circle');
	};

	CircleInputWidgetView.prototype.unSelectCircle = function(element) {
		$(element).removeClass('fill-circle');
	};

	CircleInputWidgetView.prototype.selectInput = function(element) {
		var isInputElement = false;
		if (this.isPlainCircleInput(element)) {
			this.selectCircle(element);
			isInputElement = true;
		} else if (this.isIconInput(element)) {
			this.selectIcon(element);
			isInputElement = true;
		}

		if (isInputElement) {
			this.currentlySelected.state = this.STATES.SELECTED;
			this.currentlySelected.id = element.id;
		}
	};

	CircleInputWidgetView.prototype.unSelectCurrentlySelected = function(element) {
		var isInputElement = false;
		if (this.isPlainCircleInput(element)) {
			this.unSelectCircle(element);
			isInputElement = true;
		} else if (this.isIconInput(element)) {
			this.unSelectIcon(element);
			isInputElement = true;
		}

		if (isInputElement) {
			this.currentlySelected.state = this.STATES.NONE_SELECTED;
			this.currentlySelected.id = this.DOM_ID.NONE;
		}
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