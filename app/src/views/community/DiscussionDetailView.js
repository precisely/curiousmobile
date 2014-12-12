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
		this.surfaceList = [];
		this.loadMoreItems = true;
		this.itemsAvailable = true;
		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y,
		});
		this.init();
	}

	DiscussionDetailView.prototype = Object.create(View.prototype);
	DiscussionDetailView.prototype.constructor = DiscussionDetailView;

	DiscussionDetailView.DEFAULT_OPTIONS = {};

	DiscussionDetailView.prototype.init = function() {
		this.surfaceList = [];
		DiscussionPost.fetch({discussionId: this.discussionId}, function(discussionPost) {
			this.discussionPost = discussionPost;
			this.refresh();
		}.bind(this));
	}

	DiscussionDetailView.prototype.refresh = function(discussionPost) {
		
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
		this.surfaceList.push(discussionPostSurface)

		discussionPostSurface.on('keyup', function (e) {
			if (e.keyCode == 13) {
				this.postComment();
			}	
		}.bind(this));

		discussionPostSurface.on('click', function(e) {
			var	classList = e.srcElement.classList;
			if (u.isAndroid() || (e instanceof CustomEvent)) {
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

		this.showComments(discussionPost);

		this.scrollView.sync.on('start',function(){
			if (this.itemsAvailable) {
				this.loadMoreItems = true;
			}
		}.bind(this));

		this.scrollView._eventOutput.on('onEdge',function(){
			var currentIndex = this.scrollView.getCurrentIndex();

			// Check if end of the page is reached
			if ((this.scrollView._scroller._onEdge != -1) && this.loadMoreItems && this.itemsAvailable) {
				this.loadMoreItems = false;
				var params = {
					discussionId: this.discussionId,
					offset: this.surfaceList.length - 1
				}
				DiscussionPost.fetch(params, function(discussionPost) {
					this.discussionPost = discussionPost;
					this.showComments(discussionPost);
				}.bind(this));
			}
		}.bind(this));

		this.scrollView.sequenceFrom(this.surfaceList);
		this.renderController.show(this.scrollView);
	};

	DiscussionDetailView.prototype.showComments = function(discussionPost) {
		if(discussionPost.posts.length === 0) {
			this.itemsAvailable = false;
			return;
		}
		discussionPost.posts.forEach(function(post) {
			
			post.prettyDate = u.prettyDate(new Date(post.updated));
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
					if (u.isAndroid() || (e instanceof CustomEvent)) {
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

				this.surfaceList.push(commentSurface);
				commentSurface.pipe(this.scrollView);
			}
		}.bind(this));
	}

	DiscussionDetailView.prototype.postComment = function() {
		var message = document.getElementById('message').value;
		DiscussionPost.createComment({discussionId: this.discussionId, message: message}, function(success){
			this.init();
		}.bind(this));
	};
	module.exports = DiscussionDetailView;
});
