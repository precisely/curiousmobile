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
		this.tagDescription = 'Energy';
		this.time = '12:03 PM';
		this.inputWidgetDiv = _.template(levelInputWidgetTemplate, {}, templateSettings);

		// Initialize the currently selected input.
		this.currentlySelected = {id: this.DOM_ID.NONE, state: this.STATES.NONE_SELECTED};
	};

	LevelInputWidgetView.prototype.isPlainCircleInput = function(element) {
		return false; // All circles with image, no plain circle input.
	};

	LevelInputWidgetView.prototype.highlightCircle = function() {
		
	};

	LevelInputWidgetView.prototype.abateCircle = function() {
		
	};

	LevelInputWidgetView.prototype.selectIcon = function(element) {
		var powerLevel = element.id.substr(0, 1);

		var image = 'content/images/widgets/' + powerLevel + '_power.png';

		$(element).attr('src', image);

		var circleId = 'c' + powerLevel + '-level';
		var currentlySelectedElement = document.getElementById(circleId);
		this.highlightCircle(currentlySelectedElement);
	};

	LevelInputWidgetView.prototype.unSelectIcon = function(element) {
		$(element).attr('src', 'content/images/widgets/0_power.png');
	};

	module.exports = LevelInputWidgetView;
});