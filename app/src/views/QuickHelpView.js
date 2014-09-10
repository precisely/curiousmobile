define(function(require, exports, module) {
	'use strict';
	var Utility = require('famous/utilities/Utility');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var ImageSurface = require("famous/surfaces/ImageSurface");
	var Scrollview = require('famous/views/Scrollview');
	var View = require('famous/core/View');

	function QuickHelpView() {
		BaseView.apply(this, arguments);
		this.init();
	}

	QuickHelpView.prototype = Object.create(BaseView.prototype);
	QuickHelpView.prototype.constructor = QuickHelpView;
	QuickHelpView.DEFAULT_OPTIONS = {};

	var surfaceList = [];

	var scrollView = new Scrollview({
		direction: Utility.Direction.X,
	});

	var firstSurface = new ImageSurface({
		content: 'content/images/help-track.png'
	});

	var secondSurface = new ImageSurface({
		content: 'content/images/help-community.png'
	});

	firstSurface.pipe(scrollView);  
	secondSurface.pipe(scrollView);
	surfaceList.push(firstSurface);
	surfaceList.push(secondSurface);

	scrollView.sequenceFrom(surfaceList);

	QuickHelpView.prototype.init = function() {
		this._eventInput.on('on-show', function() {
			this.add(scrollView);
		}.bind(this));
	}

	module.exports = QuickHelpView;
});
