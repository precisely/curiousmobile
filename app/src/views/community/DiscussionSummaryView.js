define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/surfaces/ContainerSurface');
	var Transform = require('famous/core/Transform');
	var Transitionable = require('famous/transitions/Transitionable');
	var StateModifier = require('famous/modifiers/StateModifier');
	var u = require('util/Utils');
	var Utility = require('famous/utilities/Utility');
	var Scrollview = require('famous/views/Scrollview');
	var RenderController = require('famous/views/RenderController');
	var DiscussionPost = require('models/DiscussionPost');
	var discussionPostTemplate = require('text!templates/discussion-post.html');
	var LoginTemplate = require('text!templates/login.html');

	function DiscussionSummaryView(discussionId) {
		View.apply(this, arguments);
		var transition = new Transitionable(Transform.translate(0, 70, 0));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);
		this.add(this.renderController);
		this.init(this, discussionId);
	}

	DiscussionSummaryView.prototype = Object.create(View.prototype);
	DiscussionSummaryView.prototype.constructor = DiscussionSummaryView;

	DiscussionSummaryView.DEFAULT_OPTIONS = {};

	DiscussionSummaryView.prototype.init = function(argument, discussionId) {
		var surfaceList = [];
		this.add(this.loginSurface);
//		{{discussionTitle}} {{firstPost.message}}
		DiscussionPost.fetch(discussionId, function(discussionPost) {
			var scrollView = new Scrollview({
				direction: Utility.Direction.Y,
			});
			var prettyDate = u.prettyDate(new Date(discussionPost.updated));
			discussionPost.prettyDate =  prettyDate;
			discussionPost.posts.forEach(function(post) {
				var discussionPostSurface = new Surface({
					size: [undefined, true],
					content: _.template(discussionPostTemplate, post, templateSettings),
				});
				surfaceList.push(discussionPostSurface);
				discussionPostSurface.pipe(scrollView);
			});
			scrollView.sequenceFrom(surfaceList);
			this.renderController.show(scrollView);
		}.bind(this));
	}

	module.exports = DiscussionSummaryView;
});
