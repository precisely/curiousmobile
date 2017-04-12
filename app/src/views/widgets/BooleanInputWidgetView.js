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
		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
		this.inputWidgetDiv = _.template(booleanInputWidgetTemplate, this.getTemplateOptions(), templateSettings);
	};

	BooleanInputWidgetView.prototype.getTemplateOptions = function() {
		var entryId = this.getIdForDOMElement();

		this.positionMap = {};
		this.YES_BUTTON_ID = 'yes-button-' + entryId;
		this.positionMap[this.YES_BUTTON_ID] = 1;

		this.NO_BUTTON_ID = 'no-button-' + entryId;
		this.positionMap[this.NO_BUTTON_ID] = 2;

		this.DESCRIBE_BUTTON_ID = 'describe-button-' + entryId;

		var templateOptions = {entryId: entryId, yesSelected: '', noSelected: ''};
		var elementIdToSelect = this.getElementIdToSelect();

		if (this.YES_BUTTON_ID === elementIdToSelect) {
			templateOptions['yesSelected'] = 'boolean-button-selected';
		}

		if (this.NO_BUTTON_ID === elementIdToSelect) {
			templateOptions['noSelected'] = 'boolean-button-selected';
		}

		if (elementIdToSelect) {
			// Initialize the currently selected input.
			this.currentlySelected = {id: elementIdToSelect, state: this.STATES.SELECTED};
		}

		return templateOptions;
	};

	BooleanInputWidgetView.prototype.getElementIdToSelect = function() {
		var position = this.getInputElementPositionToSelect();

		switch (position) {
			case 1:
				return this.YES_BUTTON_ID;
				break;
			case 2:
				return this.NO_BUTTON_ID;
				break;
		}
	};

	BooleanInputWidgetView.prototype.isBooleanInput = function(element) {
		return _.contains([this.YES_BUTTON_ID, this.NO_BUTTON_ID], element.id);
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
		if (element.id === this.DESCRIBE_BUTTON_ID) {
			// Handle describe event.
		} else {
			this.defaultNewInputSelectionHandler(element);
		}
	};

	module.exports = BooleanInputWidgetView;
});