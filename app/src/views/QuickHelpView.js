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
	QuickHelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
	};

	var surfaceList = [];

	var scrollView = new Scrollview({
		direction: Utility.Direction.X,
		paginated: true
	});

	var trackSurface = new ImageSurface({
		content: 'content/images/help-track.png'
	});

	var commmunitySurface = new ImageSurface({
		content: 'content/images/help-community.png'
	});

	trackSurface.pipe(scrollView);
	commmunitySurface.pipe(scrollView);
	surfaceList.push(trackSurface);
	surfaceList.push(commmunitySurface);

	scrollView.sequenceFrom(surfaceList);

	QuickHelpView.prototype.init = function() {
		this.setHeaderLabel('Quick Help');
	}

	QuickHelpView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		this.setBody(scrollView);
	};

	App.pages[QuickHelpView.name] = QuickHelpView;
	module.exports = QuickHelpView;
});
