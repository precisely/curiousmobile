define(function(require, exports, module) {
	'use strict';

	var InputWidgetView = require('views/widgets/InputWidgetView');
	var sliderInputWidgetTemplate = require('text!templates/input-widgets/slider-input-widget.html');

	function SliderInputWidgetView() {
		InputWidgetView.apply(this, arguments);
		this.addCustomEventListeners();
	}

	SliderInputWidgetView.prototype = Object.create(InputWidgetView.prototype);
	SliderInputWidgetView.prototype.constructor = SliderInputWidgetView;

	SliderInputWidgetView.prototype.initializeWidgetContent = function() {
		var entryId = this.getIdForDOMElement();
		var position =  this.getInputElementPositionToSelect();

		this.inputWidgetDiv = _.template(sliderInputWidgetTemplate, {
			entryId: entryId,
			value: position ? position : 0
		}, templateSettings);

		this.SLIDER_INPUT_ELEMENT_ID = 'slider-input-element-' + entryId;
		this.SLIDER_INPUT_VALUE_BOX_ID = 'slider-value-' + entryId;

		this.currentlySelected = {id: this.SLIDER_INPUT_ELEMENT_ID, state: this.STATES.SELECTED};
	};

	SliderInputWidgetView.prototype.addCustomEventListeners = function() {
		this.inputWidgetSurface.on('change', function(e) {
			this.inputWidgetEventHandler(e.srcElement);
		}.bind(this));
	};

	SliderInputWidgetView.prototype.inputWidgetEventHandler = function(element) {
		if (element.id === this.SLIDER_INPUT_ELEMENT_ID) {
			var currentValue = element.value;

			if (this.isDrawerInputSurface) {
				this.createEntry(element);

				return;
			}

			$(element).removeClass(element.className);
			$(element).addClass('rv-' + currentValue);
			$('#' + this.SLIDER_INPUT_VALUE_BOX_ID).text(currentValue);
		}
	};

	SliderInputWidgetView.prototype.getAmountValueFromElementPosition = function(element) {
		var position;

		if (element && element.value) {
			position = element.value
		} else {
			position = this.getInputElementPositionToSelect()
		}

		return (position ? (position * this.valueOfOneInputElement) : 0);
	};

	module.exports = SliderInputWidgetView;
});