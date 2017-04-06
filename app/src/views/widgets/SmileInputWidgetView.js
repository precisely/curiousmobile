define(function(require, exports, module) {
	'use strict';

	var CircleInputWidgetView = require('views/widgets/CircleInputWidgetView');
	var smileInputWidgetTemplate = require('text!templates/input-widgets/smile-input-widget.html');

	function SmileInputWidgetView() {
		CircleInputWidgetView.apply(this, arguments);
	}

	SmileInputWidgetView.prototype = Object.create(CircleInputWidgetView.prototype);
	SmileInputWidgetView.prototype.constructor = SmileInputWidgetView;

	SmileInputWidgetView.prototype.initializeWidgetContent = function() {
		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
		this.inputWidgetDiv = _.template(smileInputWidgetTemplate, this.getTemplateOptions(), templateSettings);
	};

	SmileInputWidgetView.prototype.getTemplateOptions = function() {
		var entryId = this.getIdForDOMElement();

		this.positionMap = {};

		this.CIRCLE_1_ID = 'c1-smile-' + entryId;
		this.FROWN_ID ='frown-' + entryId;
		this.positionMap[this.CIRCLE_1_ID] = this.positionMap[this.FROWN_ID] = 1;

		this.CIRCLE_2_ID = 'c2-smile-' + entryId;
		this.positionMap[this.CIRCLE_2_ID] = 2;

		this.CIRCLE_3_ID = 'c3-smile-' + entryId;
		this.FLAT_MOUTH_ID = 'flat-mouth-' + entryId;
		this.positionMap[this.CIRCLE_3_ID] = this.positionMap[this.FLAT_MOUTH_ID] = 3;

		this.CIRCLE_4_ID = 'c4-smile-' + entryId;
		this.positionMap[this.CIRCLE_4_ID] = 4;

		this.CIRCLE_5_ID = 'c5-smile-' + entryId;
		this.SMILE_ID = 'smile-' + entryId;
		this.positionMap[this.CIRCLE_5_ID] = this.positionMap[this.SMILE_ID] = 5;

		var templateOptions = {entryId: entryId};
		var elementIdToSelect = this.getElementIdToSelect();

		for (var i = 1; i <= 5 ; i++) {
			templateOptions['c' + i + 'Class'] = '';
			
			if (!(i === 2) || !(i === 4)) {
				templateOptions['s' + i + 'Image'] = '';
			}

			if (this['CIRCLE_' + i + '_ID'] === elementIdToSelect) {
				templateOptions['c' + i + 'Class'] = 'fill-circle';
				if (!(i === 2) || !(i === 4)) {
					templateOptions['s' + i + 'Image'] = '_white';
				}
			}
		}

		if (elementIdToSelect) {
			// Initialize the currently selected input.
			this.currentlySelected = {id: elementIdToSelect, state: this.STATES.SELECTED};
		}

		return templateOptions;
	};

	SmileInputWidgetView.prototype.isPlainCircleInput = function(element) {
		return _.contains([this.CIRCLE_2_ID, this.CIRCLE_4_ID], element.id);
	};

	SmileInputWidgetView.prototype.isIconInput = function(element) {
		return _.contains([this.FROWN_ID, this.FLAT_MOUTH_ID, this.SMILE_ID, this.CIRCLE_1_ID, this.CIRCLE_3_ID, 
				this.CIRCLE_5_ID], element.id);
	};

	SmileInputWidgetView.prototype.getCurrentlySelectedElement = function(element, unSelect) {
		var image;
		var circleId;

		var elementId = element.id;

		if (elementId === this.FROWN_ID || elementId === this.CIRCLE_1_ID) {
			image = 'content/images/widgets/' + (unSelect ? 'frown@3x.png' : 'frown_white@3x.png');
			circleId = this.CIRCLE_1_ID;

			if (elementId === this.CIRCLE_1_ID) {
				element = document.getElementById(this.FROWN_ID);
			}
		} else if (elementId === this.FLAT_MOUTH_ID || elementId === this.CIRCLE_3_ID) {
			image = 'content/images/widgets/' + (unSelect ? 'flat_mouth@3x.png' : 'flat_mouth_white@3x.png');
			circleId = this.CIRCLE_3_ID;

			if (elementId === this.CIRCLE_3_ID) {
				element = document.getElementById(this.FLAT_MOUTH_ID);
			}
		} else if (elementId === this.SMILE_ID || elementId === this.CIRCLE_5_ID) {
			image = 'content/images/widgets/' + (unSelect ? 'smile@3x.png' : 'smile_white@3x.png');
			circleId = this.CIRCLE_5_ID;

			if (elementId === this.CIRCLE_5_ID) {
				element = document.getElementById(this.SMILE_ID);
			}
		}

		$(element).attr('src', image);

		return document.getElementById(circleId);
	};

	module.exports = SmileInputWidgetView;
});
