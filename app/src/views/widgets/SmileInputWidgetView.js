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
		this.tagDescription = 'Mood';
		this.time = '12:03 PM';
		this.inputWidgetDiv = _.template(smileInputWidgetTemplate, {}, templateSettings);

		// Initialize the currently selected input.
		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
	};

	var CIRCLE_1 = 'c1-smile';
	var CIRCLE_2 = 'c2-smile';
	var CIRCLE_3 = 'c3-smile';
	var CIRCLE_4 = 'c4-smile';
	var CIRCLE_5 = 'c5-smile';
	var FROWN ='frown';
	var SMILE = 'smile';
	var FLAT_MOUTH = 'flat-mouth';

	SmileInputWidgetView.prototype.isPlainCircleInput = function(element) {
		return _.contains([CIRCLE_2, CIRCLE_4], element.id);
	};

	SmileInputWidgetView.prototype.selectIcon = function(element) {
		var image;
		var circleId;

		if (element.id === FROWN) {
			image = 'content/images/widgets/frown_white.png';
			circleId = CIRCLE_1;
		} else if (element.id === FLAT_MOUTH) {
			image = 'content/images/widgets/flat_mouth_white.png';
			circleId = CIRCLE_3;
		} else if (element.id === SMILE) {
			image = 'content/images/widgets/smile_white.png';
			circleId = CIRCLE_5;
		}

		$(element).attr('src', image);

		var currentlySelectedElement = document.getElementById(circleId);
		this.selectCircle(currentlySelectedElement);
	};

	SmileInputWidgetView.prototype.unSelectIcon = function(element) {
		var image;
		var circleId;

		if (element.id === FROWN) {
			image = 'content/images/widgets/frown.png';
			circleId = CIRCLE_1;
		} else if (element.id === FLAT_MOUTH) {
			image = 'content/images/widgets/flat_mouth.png';
			circleId = CIRCLE_3;
		} else if (element.id === SMILE) {
			image = 'content/images/widgets/smile.png';
			circleId = CIRCLE_5;
		}

		$(element).attr('src', image);

		var currentlySelectedElement = document.getElementById(circleId);
		this.unSelectCircle(currentlySelectedElement);
	};

	module.exports = SmileInputWidgetView;
});
