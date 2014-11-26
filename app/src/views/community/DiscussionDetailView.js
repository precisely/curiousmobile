define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Timer = require('famous/utilities/Timer');
	var Transitionable = require('famous/transitions/Transitionable');
	var FastClick = require('famous/inputs/FastClick');
	var StateModifier = require('famous/modifiers/StateModifier');
	var u = require('util/Utils');
	var Utility = require('famous/utilities/Utility');
	var Scrollview = require('famous/views/Scrollview');
	var RenderController = require('famous/views/RenderController');
	var Discussion = require('models/Discussion');
	var DiscussionPost = require('models/DiscussionPost');
	var discussionPostTemplate = require('text!templates/discussion-post.html');
	var commentTemplate = require('text!templates/comments.html');

	function DiscussionDetailView(discussionId) {
		View.apply(this, arguments);
		var transition = new Transitionable(Transform.translate(0, 75, 0));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);
		this.add(this.renderController);
		this.discussionId = discussionId;
		this.init();
	}

	DiscussionDetailView.prototype = Object.create(View.prototype);
	DiscussionDetailView.prototype.constructor = DiscussionDetailView;

	DiscussionDetailView.DEFAULT_OPTIONS = {};

	DiscussionDetailView.prototype.init = function() {
		DiscussionPost.fetch(this.discussionId, function(discussionPost) {
			this.discussionPost = discussionPost;
			this.refresh();
		}.bind(this));
	}

	DiscussionDetailView.prototype.refresh = function(discussionPost) {
		var surfaceList = [];
		var scrollView = new Scrollview({
			direction: Utility.Direction.Y,
		});

		if (!discussionPost && this.discussionPost) {
			discussionPost = this.discussionPost;
		}

		var prettyDate = u.prettyDate(new Date(discussionPost.updated));
		discussionPost.prettyDate = prettyDate;
		var discussionPostSurface = new Surface({
			size: [undefined, true],
			content: _.template(discussionPostTemplate, discussionPost, templateSettings),
		});

		discussionPostSurface.on('deploy', function() {
			Timer.every(function() {
				var size = this.getSize();
				var width = (size[0] == true) ? this._currTarget.offsetWidth : size[0];
				var height = (size[1] == true) ? this._currTarget.offsetHeight : size[1];
				this.setSize([width, height]);
			}.bind(this), 2);
		});
		surfaceList.push(discussionPostSurface)

		discussionPostSurface.on('keyup', function (e) {
			if (e.keyCode == 13) {
				this.postComment();
			}	
		}.bind(this));

		discussionPostSurface.on('click', function(e) {
			var	classList = e.srcElement.classList;
			if (e instanceof CustomEvent) {
				if (_.contains(classList, 'delete-discussion')) {
					this.alert = u.showAlert({
						message: 'Are you sure to delete discussion ?',
						a: 'Yes',
						b: 'No',
						onA: function() {
							Discussion.deleteDiscussion({id: this.discussionId}, function(success){
								this.init();
							}.bind(this));
						}.bind(this),
						onB: function() {
						}.bind(this),
					});
				} else if (_.contains(classList, 'submit-comment')) {
					this.postComment();
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

				commentSurface.on('deploy', function() {
					Timer.every(function() {
						var size = this.getSize();
						var width = (size[0] == true) ? this._currTarget.offsetWidth : size[0];
						var height = (size[1] == true) ? this._currTarget.offsetHeight : size[1];
						this.setSize([width, height]);
					}.bind(this), 2);
				});
				commentSurface.on('click', function(e) {
					if (e instanceof CustomEvent) {
						var classList;
						classList = e.srcElement.parentElement.classList;
						if (_.contains(classList, 'delete-comment')) {
							u.showAlert({
								message: 'Are you sure to delete this comment ?',
								a: 'Yes',
								b: 'No',
								onA: function() {
									DiscussionPost.deleteComment( { discussionId : post.discussionId,
										clearPostId : post.id }, function(sucess){
											this.init();
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
		}.bind(this));
		scrollView.sequenceFrom(surfaceList);
		this.renderController.show(scrollView);
	};

	DiscussionDetailView.prototype.postComment = function() {
		var message = document.getElementById('message').value;
		DiscussionPost.createComment({discussionId: this.discussionId, message: message}, function(success){
			this.init();
		}.bind(this));
	};
	module.exports = DiscussionDetailView;
});
