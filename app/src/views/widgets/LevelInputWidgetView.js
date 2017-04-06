define(function(require, exports, module) {
	'use strict';

	var CircleInputWidgetView = require('views/widgets/CircleInputWidgetView');
	var levelInputWidgetTemplate = require('text!templates/input-widgets/level-input-widget.html');

	function LevelInputWidgetView() {
		CircleInputWidgetView.apply(this, arguments);
	}

	LevelInputWidgetView.prototype = Object.create(CircleInputWidgetView.prototype);
	LevelInputWidgetView.prototype.constructor = LevelInputWidgetView;

	LevelInputWidgetView.prototype.initializeWidgetContent = function() {
		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
		this.inputWidgetDiv = _.template(levelInputWidgetTemplate, this.getTemplateOptions(), templateSettings);
	};

	LevelInputWidgetView.prototype.getTemplateOptions = function() {
		var entryId = this.getIdForDOMElement();

		this.positionMap = {};

		this.CIRCLE_1_ID = 'c1-level-' + entryId;
		this.LEVEL_0_ID = '0-power-' + entryId;
		this.positionMap[this.CIRCLE_1_ID] = this.positionMap[this.LEVEL_0_ID] = 1;

		this.CIRCLE_2_ID = 'c2-level-' + entryId;
		this.LEVEL_1_ID = '1-power-' + entryId;
		this.positionMap[this.CIRCLE_2_ID] = this.positionMap[this.LEVEL_1_ID] = 2;

		this.CIRCLE_3_ID = 'c3-level-' + entryId;
		this.LEVEL_2_ID = '2-power-' + entryId;
		this.positionMap[this.CIRCLE_3_ID] = this.positionMap[this.LEVEL_2_ID] = 3;

		this.CIRCLE_4_ID = 'c4-level-' + entryId;
		this.LEVEL_3_ID = '3-power-' + entryId;
		this.positionMap[this.CIRCLE_4_ID] = this.positionMap[this.LEVEL_3_ID] = 4;

		this.CIRCLE_5_ID = 'c5-level-' + entryId;
		this.LEVEL_4_ID = '4-power-' + entryId;
		this.positionMap[this.CIRCLE_5_ID] = this.positionMap[this.LEVEL_4_ID] = 5;

		var templateOptions = {entryId: entryId};
		var elementIdToSelect = this.getElementIdToSelect();

		for (var i = 1; i <= 5 ; i++) {
			templateOptions['c' + i + 'Class'] = '';
			templateOptions['l' + (i - 1) + 'Image'] = '';

			if (this['CIRCLE_' + i + '_ID'] === elementIdToSelect) {
				templateOptions['c' + i + 'Class'] = 'fill-circle';
				if (!(i === 1)) {
					templateOptions['l' + (i - 1) + 'Image'] = '_invert';
				}
			}
		}

		if (elementIdToSelect) {
			// Initialize the currently selected input.
			this.currentlySelected = {id: elementIdToSelect, state: this.STATES.SELECTED};
		}

		return templateOptions;
	};

	LevelInputWidgetView.prototype.isPlainCircleInput = function(element) {
		return false; // All circles with image, no plain circle input.
	};

	LevelInputWidgetView.prototype.isIconInput = function(element) {
		return _.contains([this.LEVEL_0_ID, this.LEVEL_1_ID, this.LEVEL_2_ID, this.LEVEL_3_ID, this.LEVEL_4_ID,
				this.CIRCLE_1_ID, this.CIRCLE_2_ID, this.CIRCLE_3_ID, this.CIRCLE_4_ID, this.CIRCLE_5_ID], element.id);
	};

	LevelInputWidgetView.prototype.getCurrentlySelectedElement = function(element, unSelect) {
		var image;
		var circleId;

		var elementId = element.id;

		if (elementId === this.LEVEL_0_ID || elementId === this.CIRCLE_1_ID) {
			image = 'content/images/widgets/0_power@3x.png';
			circleId = this.CIRCLE_1_ID;

			if (elementId === this.CIRCLE_1_ID) {
				element = document.getElementById(this.LEVEL_0_ID);
			}
		} else if (elementId === this.LEVEL_1_ID || elementId === this.CIRCLE_2_ID) {
			image = 'content/images/widgets/' + (unSelect ? '1_power@3x.png' : '1_power_invert@3x.png');
			circleId = this.CIRCLE_2_ID;

			if (elementId === this.CIRCLE_2_ID) {
				element = document.getElementById(this.LEVEL_1_ID);
			}
		} else if (elementId === this.LEVEL_2_ID || elementId === this.CIRCLE_3_ID) {
			image = 'content/images/widgets/' + (unSelect ? '2_power@3x.png' : '2_power_invert@3x.png');
			circleId = this.CIRCLE_3_ID;

			if (elementId === this.CIRCLE_3_ID) {
				element = document.getElementById(this.LEVEL_2_ID);
			}
		} else if (elementId === this.LEVEL_3_ID || elementId === this.CIRCLE_4_ID) {
			image = 'content/images/widgets/' + (unSelect ? '3_power@3x.png' : '3_power_invert@3x.png');
			circleId = this.CIRCLE_4_ID;

			if (elementId === this.CIRCLE_4_ID) {
				element = document.getElementById(this.LEVEL_3_ID);
			}
		} else if (elementId === this.LEVEL_4_ID || elementId === this.CIRCLE_5_ID) {
			image = 'content/images/widgets/' + (unSelect ? '4_power@3x.png' : '4_power_invert@3x.png');
			circleId = this.CIRCLE_5_ID;

			if (elementId === this.CIRCLE_5_ID) {
				element = document.getElementById(this.LEVEL_4_ID);
			}
		}

		$(element).attr('src', image);

		return document.getElementById(circleId);
	};

	module.exports = LevelInputWidgetView;
});