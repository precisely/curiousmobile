define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Transitionable = require('famous/transitions/Transitionable');
	var StateModifier = require('famous/modifiers/StateModifier');
	var u = require('util/Utils');
	var Utility = require('famous/utilities/Utility');
	var Scrollview = require('famous/views/Scrollview');
	var RenderController = require('famous/views/RenderController');
	var Discussion = require('models/Discussion');
	var DiscussionPost = require('models/DiscussionPost');
	var discussionPostTemplate = require('text!templates/discussion-post.html');
	var commentTemplate = require('text!templates/comments.html');

	function DiscussionSummaryView(discussionId) {
		View.apply(this, arguments);
		var transition = new Transitionable(Transform.translate(0, 50, 0));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);
		this.add(this.renderController);
		this.init(this, discussionId);
	}

	DiscussionSummaryView.prototype = Object.create(View.prototype);
	DiscussionSummaryView.prototype.constructor = DiscussionSummaryView;

	DiscussionSummaryView.DEFAULT_OPTIONS = {};

	DiscussionSummaryView.prototype.init = function(argument, discussionId) {
		DiscussionPost.fetch(discussionId, function(discussionPost) {

			var surfaceList = [];
			var scrollView = new Scrollview({
				direction: Utility.Direction.Y,
			});
			var prettyDate = u.prettyDate(new Date(discussionPost.updated));
			var discussionPostSurface = new Surface({
				size: [undefined, true],
				content: _.template(discussionPostTemplate, discussionPost, templateSettings),
			});
			surfaceList.push(discussionPostSurface)
			
			discussionPostSurface.on('click', function(e) {
				var classList;
				if (e instanceof CustomEvent) {
					if (e.srcElement.localName == 'a' || e.srcElement.localName == 'button') {
						classList = e.srcElement.classList;
					} else {
						classList = e.srcElement.parentElement.classList;
					}
					if (_.contains(classList, 'delete-discussion')) {
						this.alert = u.showAlert({
							message: 'Are you sure to delete discussion ?',
							a: 'Yes',
							b: 'No',
							onA: function() {
								Discussion.deleteDiscussion({id: discussionId}, function(success){
									this.renderController.show(scrollView);
								}.bind(this));
							}.bind(this),
							onB: function() {
							}.bind(this),
						});
					} else if (_.contains(classList, 'submit-comment')) {
						var message = document.forms["commentForm"]["message"].value;
						DiscussionPost.createComment({discussionId: discussionId, message: message}, function(success){
							this.renderController.show(scrollView);
						}.bind(this));
					}
				}
			}.bind(this));
			
			discussionPost.prettyDate =  prettyDate;
			discussionPost.posts.forEach(function(post) {
				if (post.message) {
					var commentSurface = new Surface({
						size: [undefined, true],
						content: _.template(commentTemplate, post, templateSettings),
					});
					
					commentSurface.on('click', function(e) {
						var classList;
						if (e instanceof CustomEvent) {
							classList = e.srcElement.parentElement.classList;
							if (_.contains(classList, 'delete-comment')) {
								this.alert = u.showAlert({
									message: 'Are you sure to delete this comment ?',
									a: 'Yes',
									b: 'No',
									onA: function() {
										DiscussionPost.deleteComment( { discussionId : discussionId,
											clearPostId : post.id }, function(sucess){
											var index = surfaceList.indexOf(commentSurface);
											surfaceList.splice(index, 1);
										}.bind(this));
									}.bind(this),
									onB: function() {
									}.bind(this),
								});
							}
						}
					}.bind(this));

					surfaceList.push(commentSurface);
					commentSurface.pipe(scrollView);
				}
			});
			scrollView.sequenceFrom(surfaceList);
			this.renderController.show(scrollView);
		}.bind(this));
	}

	module.exports = DiscussionSummaryView;
});
