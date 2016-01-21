define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Timer = require('famous/utilities/Timer');
	var Transitionable = require('famous/transitions/Transitionable');
	var FastClick = require('famous/inputs/FastClick');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require("famous/core/Modifier");
	var u = require('util/Utils');
	var Utility = require('famous/utilities/Utility');
	var Scrollview = require('famous/views/Scrollview');
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var Discussion = require('models/Discussion');
	var DiscussionPost = require('models/DiscussionPost');
	var discussionPostTemplate = require('text!templates/discussion-post.html');
	var commentTemplate = require('text!templates/comments.html');
	var addCommentTemplate = require('text!templates/post-comment.html');
	var GraphView = require('views/graph/GraphView');
	var User = require('models/User');

	function DiscussionDetailView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'FeedView';
		this.setHeaderLabel('SOCIAL');

		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#efefef',
			}
		});

		this.setBody(this.backgroundSurface);

		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y,
			paginated: false
		});
		this.surfaceList = [];

		this.scrollView.sync.on('start', function() {
			if (this.itemsAvailable) {
				this.loadMoreItems = true;
			}
		}.bind(this));
	}

	DiscussionDetailView.prototype = Object.create(BaseView.prototype);
	DiscussionDetailView.prototype.constructor = DiscussionDetailView;

	DiscussionDetailView.prototype.loadItems = function() {
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
	};

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
		this.isCommentSelected = false;
		this.discussionHash = state.discussionHash;
		this.parentPage = state.parentPage || 'FeedView';
		this.isSharedGraph = false;
		this.loadDetails();
		return true;
	};

	DiscussionDetailView.prototype.loadDetails = function() {
		console.log('DiscussionDetailView: loadDetails');
		this.surfaceList = [];
		this.scrollView.setPosition(0);
		this.isCommentSelected = false;
		this.commentBoxHeight = 0;
		var transition = new Transitionable(Transform.translate(0, 75, App.zIndex.feedItem));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);

		// This is to modify renderController so that items in scroll view are not hidden behind footer menu
		this.scrollViewControllerMod = new StateModifier({
			size: [undefined, App.height - 130],
			transform: Transform.translate(0, 75, App.zIndex.feedItem)
		});
		this.add(this.scrollViewControllerMod).add(this.scrollView);
		this.scrollView.sequenceFrom(this.surfaceList);

		DiscussionPost.fetch({
			discussionHash: this.discussionHash
		}, function(discussionPost) {
			this.discussionPost = discussionPost;
			this.postloadDetails();
		}.bind(this), function() {
			App.pageView.goBack();
		}.bind(this));
	};

	DiscussionDetailView.prototype.postloadDetails = function() {
		this.loadMoreItems = true;
		this.itemsAvailable = true;
		this.offset = 0;
		var discussionPost = this.discussionPost;
		this.totalPostCount = discussionPost.discussionDetails.totalPostCount;
		var prettyDate = u.prettyDate(new Date(discussionPost.discussionDetails.updated));
		discussionPost.discussionDetails.updated = prettyDate;
		var discussionPostSurface = new Surface({
			size: [undefined, true],
			properties: {
				padding: '5px 10px',
				paddingTop: '20px'
			},
			content: _.template(discussionPostTemplate, discussionPost.discussionDetails, templateSettings),
		});

		if (discussionPost.discussionDetails.firstPost && discussionPost.discussionDetails.firstPost.plotDataId) {
			this.isSharedGraph = true;
			App.tagListWidget = initTagListWidget();
			this.graphView = new GraphView();
			this.surfaceList.splice(0, 0, this.graphView);
			this.graphView.pipe(this.scrollView)
		} else {
			this.isSharedGraph = false;
		}
		discussionPostSurface.on('deploy', function() {
			Timer.every(function() {
				var size = discussionPostSurface.getSize();
				var width = (size[0] == true) ? discussionPostSurface._currTarget.offsetWidth : size[0];
				var height = (size[1] == true) ? discussionPostSurface._currTarget.offsetHeight : size[1];
				discussionPostSurface.setSize([width, height]);
			}.bind(this), 2);
			if (this.isSharedGraph) {
				this.graphView.showDiscussionChart(discussionPost.discussionDetails.firstPost.plotDataId, this.discussionHash);
			}
		}.bind(this));
		this.surfaceList.push(discussionPostSurface);
		discussionPostSurface.pipe(this.scrollView);

		discussionPostSurface.on('click', function(e) {
			var classList = e.srcElement.classList;
			if (e instanceof CustomEvent) {
				if (this.isCommentSelected) {
					this.unselectComment();
				} else if (_.contains(classList, 'close-discussion')) {
					this.alert = u.showAlert({
						message: 'Are you sure you want to delete this discussion?',
						a: 'Yes',
						b: 'No',
						onA: function() {
							Discussion.deleteDiscussion({
								hash: this.discussionHash
							}, function(success) {
								u.spinnerStart();
								setTimeout(function() {
									u.spinnerStop();
									App.pageView.changePage('FeedView', {
										new: true
									});
								}, 1000);
							}.bind(this));
						}.bind(this),
						onB: function() {}.bind(this),
					});
				} else if (_.contains(classList, 'submit-comment')) {
					this.postComment();
				} else if (_.contains(classList, 'share-button') || _.contains(e.srcElement.parentElement.classList, 'share-button')) {
					if (window.plugins) {
						window.plugins.socialsharing.share(null, 'Curious Discussions', null, App.serverUrl + '/home/social/discussion/' + this.discussionHash);
					}
				} else if (_.contains(classList, 'view-more-comments')) {
					this.loadItems();
				} else if (_.contains(classList, 'follow-button') || _.contains(e.srcElement.parentElement.classList, 'follow-button')) {
					Discussion.follow({id: this.discussionHash}, function(data) {
						this.loadDetails();
					}.bind(this));
				} else if (_.contains(classList, 'unfollow-button') || _.contains(e.srcElement.parentElement.classList, 'unfollow-button')) {
					Discussion.follow({id: this.discussionHash, unfollow: true}, function(data) {
						this.loadDetails();
					}.bind(this));
				} else if (_.contains(classList, 'discussion-author') || _.contains(e.srcElement.parentElement.classList, 'discussion-author')) {
					App.pageView.changePage('PeopleDetailView', {hash: discussionPost.discussionDetails.discussionOwnerHash});
				}
			}
		}.bind(this));

		this.addCommentSurface = this.getAddCommentSurface({});

		if(discussionPost.discussionDetails.canWrite) {
			this.surfaceList.push(this.addCommentSurface.node);
			this.addCommentSurface.pipe(this.scrollView);
		}
		this.showComments(discussionPost);
	};

	DiscussionDetailView.prototype.getAddCommentSurface = function(post, currentIndex) {
		var addCommentSurface = new Surface({
			size: [undefined, true],
			content: _.template(addCommentTemplate, {message: post.message || '', postId: post.id || undefined, 
				authorAvatarURL: post.authorAvatarURL, commentIndex: currentIndex}, templateSettings),
				properties: {
				}
		});

		addCommentSurface.on('keydown', function(e) {
			if (e.keyCode == 13 && !e.shiftKey) {
				this.postComment();
				e.preventDefault();
				e.stopPropagation()
			}
		}.bind(this));

		addCommentSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.commentScrollPosition = this.scrollView.getPosition();
				setTimeout(function() {
					this.setScrollViewPosition();
				}.bind(this), 50)
			}
		}.bind(this));

		addCommentSurface.on('keyup', function() {
			this.resizeCommentSurface(addCommentSurface);
			this.setScrollViewPosition();
		}.bind(this));

		addCommentSurface.state = new Modifier();

		addCommentSurface.trans = new Transitionable(60);

		addCommentSurface.state.sizeFrom(function(){
			return [undefined, this.trans.get()];
		}.bind(addCommentSurface));

		addCommentSurface.node = new RenderNode();

		addCommentSurface.node.add(addCommentSurface.state).add(addCommentSurface);
		this.initialHeight = 50;

		return addCommentSurface;
	};

	DiscussionDetailView.prototype.resizeCommentSurface = function(addCommentSurface, setInitialHeight) {
		// Auto expanding height of the textarea if text overflowes
		setTimeout(function() {
			var commentBox = document.getElementById('message');
			commentBox.style.cssText = 'height:auto;';
			commentBox.style.cssText = 'height:' + commentBox.scrollHeight + 'px';
			this.addCommentSurface.trans.halt();
			addCommentSurface.trans.set(commentBox.scrollHeight + 20);
			if (setInitialHeight) {
				this.initialHeight = commentBox.scrollHeight + 20;
			}
		}.bind(this), 0);
	};

	DiscussionDetailView.prototype.setScrollViewPosition = function() {
		if (typeof this.commentScrollPosition !== 'undefined') {
			var commentBox = document.getElementById('message');
			var boxHeight = commentBox.offsetHeight;
			var overflowingHeight = boxHeight - this.initialHeight;
			this.scrollView.setPosition(this.commentScrollPosition + overflowingHeight);
		}
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
		if ((this.offset + DiscussionPost.max) >= this.totalPostCount) {
			this.itemsAvailable = false;
			$('.view-more-comments').hide();
		}
		if (!discussionPost.posts) {
			return;
		}
		var discussionHash = this.discussionHash;

		discussionPost.posts.forEach(function(post) {
			this.renderComment(post);
		}.bind(this));
	};

	DiscussionDetailView.prototype.renderComment = function(post) {
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
				if (e instanceof CustomEvent) {
					var classList;
					classList = e.srcElement.parentElement.classList;
					if (this.discussionView.isCommentSelected) {
						this.discussionView.unselectComment();
					} else if (_.contains(classList, 'delete-post')) {
						u.showAlert({
							message: 'Are you sure you want to delete this comment?',
							a: 'Yes',
							b: 'No',
							onA: function() {
								DiscussionPost.deleteComment({
									postId: post.id
								}, function(sucess) {
									this.discussionView.surfaceList.splice(
										this.discussionView.surfaceList.indexOf(this),
										1
									);
								}.bind(this));
							}.bind(this),
							onB: function() {}.bind(this),
						});
					} else if (_.contains(classList, 'edit-post')) {
						this.discussionView.isCommentSelected = true;
						this.discussionView.selectedCommentSurface = commentSurface;
						this.discussionView.selectionIndex = this.discussionView.surfaceList.indexOf(commentSurface);
						this.discussionView.surfaceList.splice(this.discussionView.surfaceList.indexOf(this.discussionView.addCommentSurface), 1);
						post.message = post.message.replace(/<br.*?>/g, '\n');
						var editCommentSurface = this.discussionView.getAddCommentSurface(post, this.discussionView.selectionIndex);
						this.discussionView.surfaceList.splice(this.discussionView.selectionIndex, 1, editCommentSurface.node);
						editCommentSurface.pipe(this.discussionView.scrollView);
						setTimeout(function() {
							this.discussionView.resizeCommentSurface(editCommentSurface, true, true);
							this.discussionView.commentScrollPosition = this.discussionView.scrollView.getPosition();
							moveCaretToEnd(document.getElementById('message'));
						}.bind(this), 50);
					} else if (_.contains(classList, 'comment-author') || _.contains(e.srcElement.parentElement.classList, 'comment-author')) {
						App.pageView.changePage('PeopleDetailView', {hash: post.authorHash});
					}

				}
			});


			if (this.isSharedGraph) {
				this.surfaceList.splice(2, 0, commentSurface);
			} else {
				this.surfaceList.splice(1, 0, commentSurface);
			}

			commentSurface.pipe(this.scrollView);
		}
	};

	DiscussionDetailView.prototype.postComment = function() {
		var messageBox = document.getElementById('message');
		// Formatting carriage returns to new line
		var message = messageBox.value.replace(/(\r\n|\n|\r)/g,"<br/>");
		var postId = messageBox.dataset.postId;
		var currentCommentIndex = messageBox.dataset.commentIndex;
		if (!postId) {
			DiscussionPost.createComment({
				discussionHash: this.discussionHash,
				message: message
			}, function(success) {
				this.loadDetails();
			}.bind(this));
		} else {
			DiscussionPost.update({postId: postId, message: message}, function(data) {
				this.loadDetails();
			}.bind(this), function(data) {
			}.bind(this));
		}
	};

	DiscussionDetailView.prototype.unselectComment = function() {
		this.surfaceList.splice(this.selectionIndex, 1, this.selectedCommentSurface);
		this.surfaceList.push(this.addCommentSurface);
		this.isCommentSelected = false;
		this.commentBoxHeight = 0;
		this.initialHeight = 50;
	}

	App.pages[DiscussionDetailView.name] = DiscussionDetailView;
	module.exports = DiscussionDetailView;
});
