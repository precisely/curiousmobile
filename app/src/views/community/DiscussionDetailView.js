define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Timer = require('famous/utilities/Timer');
	var Transitionable = require('famous/transitions/Transitionable');
	var FastClick = require('famous/inputs/FastClick');
	var StateModifier = require('famous/modifiers/StateModifier');
	var u = require('util/Utils');
	var Utility = require('famous/utilities/Utility');
	var Scrollview = require('famous/views/Scrollview');
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var Discussion = require('models/Discussion');
	var DiscussionPost = require('models/DiscussionPost');
	var discussionPostTemplate = require('text!templates/discussion-post.html');
	var commentTemplate = require('text!templates/comments.html');
	var User = require('models/User');

	function DiscussionDetailView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'FeedView';
		this.setHeaderLabel('FEED');

		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#efefef',
				zIndex: 5
			}
		});

		this.setBody(this.backgroundSurface);

		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y,
		});
		this.surfaceList = [];

		this.scrollView.sync.on('start', function() {
			if (this.itemsAvailable) {
				this.loadMoreItems = true;
			}
		}.bind(this));

		this.scrollView._eventOutput.on('onEdge', function() {
			var currentIndex = this.scrollView.getCurrentIndex();

			// Check if end of the page is reached
			if ((this.scrollView._scroller._onEdge != -1) && this.loadMoreItems && this.itemsAvailable) {
				this.loadMoreItems = false;
				this.offset += DiscussionPost.max;

				var params = {
					discussionHash: this.discussionHash,
					offset: this.offset
				}
				DiscussionPost.fetch(params, function(discussionPost) {
					this.discussionPost = discussionPost;
					this.showComments(discussionPost);
				}.bind(this));
			}
		}.bind(this));
	}

	DiscussionDetailView.prototype = Object.create(BaseView.prototype);
	DiscussionDetailView.prototype.constructor = DiscussionDetailView;

	DiscussionDetailView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		activeMenu: 'feed'
	};

	DiscussionDetailView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
	};

	DiscussionDetailView.prototype.preShow = function(state) {
		if (!state || !state.discussionHash) {
			return false;
		}
		this.discussionHash = state.discussionHash;
		this.parentPage = state.parentPage || 'FeedView';
		this.refresh();
		return true;
	};

	DiscussionDetailView.prototype.refresh = function() {
		console.log('DiscussionDetailView: refresh called...');
		this.surfaceList = [];
		var transition = new Transitionable(Transform.translate(0, 75, App.zIndex.feedItem));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);

		// This is to modify renderController so that items in scroll view are not hidden behind footer menu
		var mod = new StateModifier({
			size: [undefined, App.height - 130],
		});
		var node = new RenderNode(mod);
		node.add(this.renderController);
		this.add(node);
		this.scrollView.sequenceFrom(this.surfaceList);
		this.renderController.show(this.scrollView);
		DiscussionPost.fetch({
			discussionHash: this.discussionHash
		}, function(discussionPost) {
			this.discussionPost = discussionPost;
			this.postRefresh();
		}.bind(this));
	};

	DiscussionDetailView.prototype.postRefresh = function() {
		this.loadMoreItems = true;
		this.itemsAvailable = true;
		this.offset = 0;
		var discussionPost = this.discussionPost;
		var prettyDate = u.prettyDate(new Date(discussionPost.updated));
		discussionPost.updated = prettyDate;
		var discussionPostSurface = new Surface({
			size: [undefined, true],
			properties: {
				padding: '5px 10px',
				marginTop: '10px'
			},
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
		this.surfaceList.push(discussionPostSurface);
		discussionPostSurface.pipe(this.scrollView);

		discussionPostSurface.on('keyup', function(e) {
			if (e.keyCode == 13) {
				this.postComment();
			}
		}.bind(this));

		discussionPostSurface.on('click', function(e) {
			var classList = e.srcElement.classList;
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				if (_.contains(classList, 'close-discussion')) {
					this.alert = u.showAlert({
						message: 'Are you sure to delete discussion ?',
						a: 'Yes',
						b: 'No',
						onA: function() {
							Discussion.deleteDiscussion({
								hash: this.discussionHash
							}, function(success) {
								App.pageView.changePage('FeedView', {new: true});
							}.bind(this));
						}.bind(this),
						onB: function() {}.bind(this),
					});
				} else if (_.contains(classList, 'submit-comment')) {
					this.postComment();
				}
			}
		}.bind(this));

		this.showComments(discussionPost);
	};

	DiscussionDetailView.prototype.getCurrentState = function() {
		var inputElement = document.getElementById("message");
		var state = {
			viewProperties: {
				discussionHash: this.discussionHash,
			},
			form: [{
				id: 'message',
				value: inputElement.value,
				elementType: ElementType.domElement,
			}]
		};
		return state;
	};

	DiscussionDetailView.prototype.showComments = function(discussionPost) {
		if (discussionPost.posts.length === 0) {
			this.itemsAvailable = false;
			return;
		}
		console.log('Comments: ', discussionPost);
		var discussionHash = this.discussionHash;

		discussionPost.posts.forEach(function(post) {
			post.prettyDate = u.prettyDate(new Date(post.updated));
			post.isAdmin = post.authorUserId == User.getCurrentUserId();
			if (post.message) {
				var commentSurface = new Surface({
					size: [undefined, true],
					content: _.template(commentTemplate, post, templateSettings),
				});

				commentSurface.discussionView = this;

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
						if (_.contains(classList, 'delete-post')) {
							u.showAlert({
								message: 'Are you sure to delete this comment ?',
								a: 'Yes',
								b: 'No',
								onA: function() {
									DiscussionPost.deleteComment({
										discussionHash: discussionHash,
										clearPostId: post.id
									}, function(sucess) {
										console.log('delete success...');
										this.discussionView.surfaceList.splice(
											this.discussionView.surfaceList.indexOf(this),
											1
										);
									}.bind(this));
								}.bind(this),
								onB: function() {}.bind(this),
							});
						}
					}
				});

				this.surfaceList.push(commentSurface);
				commentSurface.pipe(this.scrollView);
			}
		}.bind(this));
	}

	DiscussionDetailView.prototype.postComment = function() {
		var message = document.getElementById('message').value;
		DiscussionPost.createComment({
			discussionHash: this.discussionHash,
			message: message
		}, function(success) {
			App.pageView.changePage('DiscussionDetailView', {discussionHash: this.discussionHash});
		}.bind(this));
	};
	App.pages[DiscussionDetailView.name] = DiscussionDetailView;
	module.exports = DiscussionDetailView;
});
