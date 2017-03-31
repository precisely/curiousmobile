define(function(require, exports, module) {
	'use strict';

	var CircleInputWidgetView = require('views/widgets/CircleInputWidgetView');
	var thumbsUpInputWidgetTemplate = require('text!templates/input-widgets/thumbs-up-input-widget.html');

	function ThumbsUpInputWidgetView() {
		CircleInputWidgetView.apply(this, arguments);
	}

	ThumbsUpInputWidgetView.prototype = Object.create(CircleInputWidgetView.prototype);
	ThumbsUpInputWidgetView.prototype.constructor = ThumbsUpInputWidgetView;

	ThumbsUpInputWidgetView.prototype.initializeWidgetContent = function() {
		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
		this.inputWidgetDiv = _.template(thumbsUpInputWidgetTemplate, this.getTemplateOptions(), templateSettings);
	};

	ThumbsUpInputWidgetView.prototype.getTemplateOptions = function() {
		var entryId = this.getIdForDOMElement();

		this.THUMBS_DOWN_ID = 'thumbs-down-' + entryId;
		this.THUMBS_UP_ID = 'thumbs-up-' + entryId;

		this.CIRCLE_1_ID = 'c1-thumb-' + entryId;
		this.CIRCLE_2_ID = 'c2-thumb-' + entryId;
		this.CIRCLE_3_ID = 'c3-thumb-' + entryId;
		this.CIRCLE_4_ID = 'c4-thumb-' + entryId;
		this.CIRCLE_5_ID = 'c5-thumb-' + entryId;

		var templateOptions = {entryId: entryId};
		var elementIdToSelect = this.getElementIdToSelect();

		for (var i = 1; i <= 5 ; i++) {
			templateOptions['c' + i + 'Class'] = '';

			if (i === 1) {
				templateOptions['t' + i + 'Icon'] = 'o-down';
			}

			if (i === 5) {
				templateOptions['t' + i + 'Icon'] = 'o-up';
			}

			if (this['CIRCLE_' + i + '_ID'] === elementIdToSelect) {
				if (i !== 1 && i !== 5) {
					templateOptions['c' + i + 'Class'] = 'fill-circle';
				}

				if (i === 1) {
					templateOptions['t' + i + 'Icon'] = 'down';
				}

				if (i === 5) {
					templateOptions['t' + i + 'Icon'] = 'up';
				}
			}
		}

		if (elementIdToSelect) {
			// Initialize the currently selected input.
			this.currentlySelected = {id: elementIdToSelect, state: this.STATES.SELECTED};
		}

		return templateOptions;
	};

	ThumbsUpInputWidgetView.prototype.isPlainCircleInput = function(element) {
		return _.contains([this.CIRCLE_2_ID, this.CIRCLE_3_ID, this.CIRCLE_4_ID], element.id);
	};

	ThumbsUpInputWidgetView.prototype.isIconInput = function(element) {
		return _.contains([this.THUMBS_DOWN_ID, this.THUMBS_UP_ID, this.CIRCLE_1_ID, this.CIRCLE_5_ID], element.id);
	};

	ThumbsUpInputWidgetView.prototype.fillCurrentlySelectedElement = function(element, unSelect) {
		var classToAdd;
		var classToRemove;

		var elementId = element.id;

		if (elementId === this.THUMBS_DOWN_ID || elementId === this.CIRCLE_1_ID) {
			if (unSelect) {
				classToAdd = 'fa-thumbs-o-down';
				classToRemove = 'fa-thumbs-down';
			} else {
				classToAdd = 'fa-thumbs-down';
				classToRemove = 'fa-thumbs-o-down';
			}

			if (elementId === this.CIRCLE_1_ID) {
				element = document.getElementById(this.THUMBS_DOWN_ID);
			}
		} else if (elementId === this.THUMBS_UP_ID || elementId === this.CIRCLE_5_ID) {
			if (unSelect) {
				classToAdd = 'fa-thumbs-o-up';
				classToRemove = 'fa-thumbs-up';
			} else {
				classToAdd = 'fa-thumbs-up';
				classToRemove = 'fa-thumbs-o-up';
			}

			if (elementId === this.CIRCLE_5_ID) {
				element = document.getElementById(this.THUMBS_UP_ID);
			}
		}

		$(element).removeClass(classToRemove);
		$(element).addClass(classToAdd);
	};

	ThumbsUpInputWidgetView.prototype.selectIcon = function(element) {
		this.fillCurrentlySelectedElement(element);
	};

	ThumbsUpInputWidgetView.prototype.unSelectIcon = function(element) {
		var unSelect = true;
		this.fillCurrentlySelectedElement(element, unSelect);
	};

	module.exports = ThumbsUpInputWidgetView;
});

