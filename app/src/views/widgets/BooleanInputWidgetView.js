define(function(require, exports, module) {
	'use strict';

	var InputWidgetView = require('views/widgets/InputWidgetView');
	var booleanInputWidgetTemplate = require('text!templates/input-widgets/boolean-input-widget.html');

	function BooleanInputWidgetView() {
		InputWidgetView.apply(this, arguments);
	}

	BooleanInputWidgetView.prototype = Object.create(InputWidgetView.prototype);
	BooleanInputWidgetView.prototype.constructor = BooleanInputWidgetView;

	BooleanInputWidgetView.prototype.initializeWidgetContent = function() {
		this.inputWidgetDiv = _.template(booleanInputWidgetTemplate, {}, templateSettings);

		// Initialize the currently selected input.
		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
	};

	var YES_BUTTON = 'yes-button';
	var NO_BUTTON = 'no-button';
	var DESCRIBE_BUTTON = 'describe-button';

	BooleanInputWidgetView.prototype.isBooleanInput = function(element) {
		return _.contains([YES_BUTTON, NO_BUTTON], element.id);
	};

	BooleanInputWidgetView.prototype.selectButton = function(element) {
		$(element).addClass('boolean-button-selected');
	};

	BooleanInputWidgetView.prototype.unSelectButton = function(element) {
		$(element).removeClass('boolean-button-selected');
	};

	BooleanInputWidgetView.prototype.selectInput = function(element) {
		if (this.isBooleanInput(element)) {
			this.selectButton(element);
			this.currentlySelected.state = this.STATES.SELECTED;
			this.currentlySelected.id = element.id;
		}
	};

	BooleanInputWidgetView.prototype.unSelectCurrentlySelected = function(element) {
		if (this.isBooleanInput(element)) {
			this.unSelectButton(element);
			this.currentlySelected.state = this.STATES.NONE_SELECTED;
			this.currentlySelected.id = this.DOM_ID.NONE;
		}
	};

	BooleanInputWidgetView.prototype.handleNewInputSelection = function(element) {
		if (element.id === DESCRIBE_BUTTON) {
			// Handle describe event.
		} else {
			this.defaultNewInputSelectionHandler(element);
		}
	};

	module.exports = BooleanInputWidgetView;
});