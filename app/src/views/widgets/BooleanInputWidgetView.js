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
		var entryId = this.getIdForDOMElement();
		var position =  this.getInputElementPositionToSelect();
		var yesSelectedClass = this.getYesSelectedCLass(position);
		var noSelectedClass = this.getNoSelectedCLass(position);

		this.inputWidgetDiv = _.template(booleanInputWidgetTemplate, {
			entryId: entryId,
			yesSelected: yesSelectedClass,
			noSelected: noSelectedClass
		}, templateSettings);

		this.YES_BUTTON_ID = 'yes-button-' + entryId;
		this.NO_BUTTON_ID = 'no-button-' + entryId;
		this.DESCRIBE_BUTTON_ID = 'describe-button-' + entryId;

		var selectedElementId;
		var state;
		if (!yesSelectedClass && !noSelectedClass) {
			selectedElementId = this.DOM_ID.NONE;
			state = this.STATES.NONE_SELECTED;
		} else {
			state = this.STATES.SELECTED;

			if (yesSelectedClass) {
				selectedElementId = this.YES_BUTTON_ID;
			} else {
				selectedElementId = this.NO_BUTTON_ID;
			}
		}

		// Initialize the currently selected input.
		this.currentlySelected = {
			id: selectedElementId, 
			state: state
		};
	};

	BooleanInputWidgetView.prototype.getYesSelectedCLass = function(position) {
		return (this.isDrawerInputSurface ? '' : (position >= 1 ? 'boolean-button-selected' : ''));
	};

	BooleanInputWidgetView.prototype.getNoSelectedCLass = function(position) {
		return (this.isDrawerInputSurface ? '' : (position <= 0 ? 'boolean-button-selected' : ''));
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