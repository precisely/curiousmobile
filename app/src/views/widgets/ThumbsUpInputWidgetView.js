define(function(require, exports, module) {
	'use strict';

	var CircleInputWidgetView = require('views/widgets/CircleInputWidgetView');
	var thumbsUpInputWidgetTemplate = require('text!templates/input-widgets/thumbs-up-input-widget.html');

	function ThumbsUpInputWidgetView() {
		CircleInputWidgetView.apply(this, arguments);
	}

	ThumbsUpInputWidgetView.prototype = Object.create(CircleInputWidgetView.prototype);
	ThumbsUpInputWidgetView.prototype.constructor = ThumbsUpInputWidgetView;

	// Values corresponding to each circle.
	var WIDGET_CIRCLE_VALUES = {
		'thumbs-down': 0,
		c2: 2,
		c3: 4,
		c4: 6,
		'thumbs-up': 10
	};

	// DOM id corresponding to each circle.
	var THUMBS_DOWN = 'thumbs-down';
	var THUMBS_UP = 'thumbs-up';

	ThumbsUpInputWidgetView.prototype.isPlainCircleInput = function(element) {
		return _.contains([this.CIRCLE_DOM_IDS.CIRCLE_2, this.CIRCLE_DOM_IDS.CIRCLE_3, this.CIRCLE_DOM_IDS.CIRCLE_4],
			element.id);
	};

	ThumbsUpInputWidgetView.prototype.isIconInput = function(element) {
		return _.contains([THUMBS_DOWN, THUMBS_UP], element.id);
	};

	ThumbsUpInputWidgetView.prototype.initializeWidgetContent = function() {
		this.tagDescription = 'Sleep';
		this.time = '12:03 PM';
		this.inputWidgetDiv = _.template(thumbsUpInputWidgetTemplate, {}, templateSettings);

		// Initialize the currently selected input.
		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
	};

	ThumbsUpInputWidgetView.prototype.selectIcon = function(element) {
		var image;

		if (element.id === THUMBS_DOWN) {
			image = 'content/images/widgets/thumb_down_invert.png';
		} else if (element.id === THUMBS_UP) {
			image = 'content/images/widgets/thumb_up_invert.png';
		}

		$(element).attr('src', image);
	};

	ThumbsUpInputWidgetView.prototype.unSelectIcon = function(element) {
		var image;

		if (element.id === THUMBS_DOWN) {
			image = 'content/images/widgets/thumb_down.png';
		} else if (element.id === THUMBS_UP) {
			image = 'content/images/widgets/thumb_up.png';
		}

		$(element).attr('src', image);
	};

	module.exports = ThumbsUpInputWidgetView;
});

