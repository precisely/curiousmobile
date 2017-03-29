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
		var entryId = this.getIdForDOMElement();
		this.inputWidgetDiv = _.template(levelInputWidgetTemplate, {
			entryId: entryId
		}, templateSettings);

		this.CIRCLE_1_ID = 'c0-level-' + entryId;
		this.CIRCLE_2_ID = 'c1-level-' + entryId;
		this.CIRCLE_3_ID = 'c2-level-' + entryId;
		this.CIRCLE_4_ID = 'c3-level-' + entryId;
		this.CIRCLE_5_ID = 'c4-level-' + entryId;

		this.LEVEL_0_ID = '0-power-' + entryId;
		this.LEVEL_1_ID = '1-power-' + entryId;
		this.LEVEL_2_ID = '2-power-' + entryId;
		this.LEVEL_3_ID = '3-power-' + entryId;
		this.LEVEL_4_ID = '4-power-' + entryId;

		// Initialize the currently selected input.
		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
	};

	LevelInputWidgetView.prototype.isPlainCircleInput = function(element) {
		return false; // All circles with image, no plain circle input.
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