define(function(require, exports, module) {
	'use strict';

	var InputWidgetView = require('views/widgets/InputWidgetView');
	var sliderInputWidgetTemplate = require('text!templates/input-widgets/slider-input-widget.html');

	function SliderInputWidgetView() {
		InputWidgetView.apply(this, arguments);
	}

	SliderInputWidgetView.prototype = Object.create(InputWidgetView.prototype);
	SliderInputWidgetView.prototype.constructor = SliderInputWidgetView;

	var SLIDER_INPUT_ELEMENT = 'slider-input-element';

	SliderInputWidgetView.prototype.initializeWidgetContent = function() {
		this.tagDescription = 'Bowell Movement';
		this.time = '6:44 am, 12:03 pm';
		this.inputWidgetDiv = _.template(sliderInputWidgetTemplate, {}, templateSettings);

		// Initialize the currently selected input.
		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
	};

	SliderInputWidgetView.prototype.registerListeners = function() {
		this.inputWidgetSurface.on('change', function(e) {
			this.inputWidgetEventHandler(e.srcElement);
		}.bind(this));
	};

	SliderInputWidgetView.prototype.inputWidgetEventHandler = function(element) {
		if (element.id === SLIDER_INPUT_ELEMENT) {
			var currentValue = element.value;

			$(element).removeClass(element.className);
			$(element).addClass('rv-' + currentValue);
		}
	};

	module.exports = SliderInputWidgetView;
});