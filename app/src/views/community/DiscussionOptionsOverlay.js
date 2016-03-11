define(function (require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var Transform = require('famous/core/Transform');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var discussionOptionsSurfaceTemplate = require('text!templates/discussion-options.html');
	var u = require('util/Utils');

	function DiscussionOptionsOverlay() {
		View.apply(this, arguments);
		_createView.call(this);
	}

	DiscussionOptionsOverlay.prototype = Object.create(View.prototype);
	DiscussionOptionsOverlay.prototype.constructor = DiscussionOptionsOverlay;

	DiscussionOptionsOverlay.DEFAULT_OPTIONS = {
	};

	function _createView() {
		this.DiscussionOptionsSurface = new Surface({
			size: [undefined, undefined],
			origin: [0, 0.5],
			content: _.template(discussionOptionsSurfaceTemplate, templateSettings),
			properties: {
				backgroundColor: '#ffffff'
			}
		});

		this.DiscussionOptionsSurface.on('click', function (e) {
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.classList;
				if (_.contains(classList, 'full-width')) {
					var selectedOption = document.querySelector('input[name="option"]:checked').value;
					App.pageView.getCurrentView().killOverlayContent();
					if (selectedOption === 'how-to') {
						App.pageView.changePage('CreatePostView', {hashTag: '#howto'});
					} else if (selectedOption === 'support') {
						App.pageView.changePage('CreatePostView', {hashTag: '#support'});
					} else {
						App.pageView.changePage('ChartView', {shareDiscussion: true});
					}
				}
			}
		}.bind(this));

		this.add(new Modifier({transform: Transform.translate(0, 0, App.zIndex.contextMenu)})).add(this.DiscussionOptionsSurface)
	};

	module.exports = DiscussionOptionsOverlay;
});
