define(function(require, exports, module) {
	'use strict';

	var InputWidgetView = require('views/widgets/InputWidgetView');
	var RangeInputView = require('views/widgets/RangeInputView');

	var StateModifier = require('famous/modifiers/StateModifier');
	var Transform = require('famous/core/Transform');

	var Utils = require('util/Utils');

	function SliderInputWidgetView() {
		InputWidgetView.apply(this, arguments);

		this.addAdditionalComponents();
	}

	SliderInputWidgetView.prototype = Object.create(InputWidgetView.prototype);
	SliderInputWidgetView.prototype.constructor = SliderInputWidgetView;

	SliderInputWidgetView.prototype.initializeWidgetContent = function() {
		this.inputWidgetDiv = '';

		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
	};

	SliderInputWidgetView.prototype.addAdditionalComponents = function() {
		// Surface height - (bottom padding + slider height + value box height)
		var yTransform = this.options.surfaceHeight - (12 + 5 + 12) - (this.isDrawerInputSurface ? 0 : 10);

		var size = [this.isDrawerInputSurface ? App.width : App.width - 14, 5];
		var rangeViewModifier = new StateModifier({
			transform: Transform.translate(0, yTransform, 20),
			size: size,
		});

		this.rangeInputView = new RangeInputView(this);
		this.rangeInputView.on('position-update', function(updateDetails) {
			this.createOrUpdateEntry({value: updateDetails.position}, updateDetails.callback);
		}.bind(this));

		this.rangeInputView.on('position-direct-tap', function(tapDetails) {
			this.createOrUpdateEntry(tapDetails.element, tapDetails.callback);
		}.bind(this));

		this.add(rangeViewModifier).add(this.rangeInputView);
	};

	SliderInputWidgetView.prototype.createOrUpdateEntry = function(element, callback) {
		if (this.isDrawerInputSurface) {
			this.createEntry(element);

			return;
		}

		this.updateEntryValue(element, callback);
	};

	SliderInputWidgetView.prototype.handleNewInputSelection = function(element, callback) {
		var id = element.id || this['SLIDER_POSITION_' + element.value + '_ID'];
		var position = this.positionMap[id];

		// Getting the DOM element to update CSS.
		var domElement = $('#' + this.RUNNABLE_TRACK_ID);

		if (Utils.isValidNumber(position) && domElement) {
			$(domElement).removeClass();
			$(domElement).addClass('slider-runnable-track rv-' + position);
			$('#' + this.SLIDER_INPUT_VALUE_BOX_ID).text(position);

			if (callback) {
				callback();
			}
		}
	};

	SliderInputWidgetView.prototype.getTemplateOptions = function() {
		var entryId = this.getIdForDOMElement();

		this.SLIDER_INPUT_VALUE_BOX_ID = 'slider-value-' + entryId;
		this.RUNNABLE_TRACK_ID = 'slider-runnable-track-' + entryId;

		this.positionMap = {};

		var templateOptions = {entryId: entryId};

		var position = this.getInputElementPositionToSelect();
		position = position ? position : 0;

		templateOptions.position = position;
		templateOptions.rvClass = 'rv-' + position;

		for (var i = 0; i <= 4 ; i++) {
			var idVarName = 'SLIDER_POSITION_' + i + '_ID';
			var domId = 'position' + i + '-' + entryId;

			this[idVarName] = domId;
			this.positionMap[domId] = i; 
		}

		this.currentlySelected = {id: this['SLIDER_POSITION_' + position + '_ID'], state: this.STATES.SELECTED};

		return templateOptions;
	};

	SliderInputWidgetView.prototype.getAmountValueFromElementPosition = function(element) {
		var position;

		if (element && Utils.isValidNumber(element.value)) {
			position = element.value;
		} else if (element && element.id && element.id !== 'none') {
			position = this.positionMap[element.id];
		} else {
			position = this.getInputElementPositionToSelect();
		}

		return this.getAmountForPosition(position);
	};

	module.exports = SliderInputWidgetView;
});