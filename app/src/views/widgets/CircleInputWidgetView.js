define(function(require, exports, module) {
	'use strict';

	var InputWidgetView = require('views/widgets/InputWidgetView');

	function CircleInputWidgetView() {
		InputWidgetView.apply(this, arguments);
	}

	CircleInputWidgetView.prototype = Object.create(InputWidgetView.prototype);
	CircleInputWidgetView.prototype.constructor = CircleInputWidgetView;

	CircleInputWidgetView.prototype.CIRCLE_DOM_IDS = {
		CIRCLE_1: 'c1',
		CIRCLE_2: 'c2',
		CIRCLE_3: 'c3',
		CIRCLE_4: 'c4',
		CIRCLE_5: 'c5'
	};

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

	module.exports = CircleInputWidgetView;
});