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
	var TouchSync = require("famous/inputs/TouchSync");
	var DiscussionPost = require('models/DiscussionPost');
	var discussionPostTemplate = require('text!templates/discussion-post.html');
	var commentTemplate = require('text!templates/comments.html');
	var addCommentTemplate = require('text!templates/post-comment.html');
	var GraphView = require('views/graph/GraphView');
	var OverlayWithGroupListView = require('views/community/OverlayWithGroupListView');
	var editDiscussionTemplate = require('text!templates/edit-discussion.html');
	var User = require('models/User');

	function DiscussionDetailView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'FeedView';
		this.setHeaderLabel('SOCIAL FEED');

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

		_setHandlers.call(this);
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
		this.touchSync = new TouchSync(function() {
			return [0, 0];
		});
		this.discussionDetails = this.discussionPost.discussionDetails;
		this.totalPostCount = discussionPost.discussionDetails.totalPostCount;
		var prettyDate = u.prettyDate(new Date(discussionPost.discussionDetails.updated));
		discussionPost.discussionDetails.updated = prettyDate;
		discussionPost.discussionDetails.discussionTitle = u.parseNewLine(discussionPost.discussionDetails.discussionTitle);
		if (discussionPost.discussionDetails.firstPost && discussionPost.discussionDetails.firstPost.message) {
			discussionPost.discussionDetails.firstPost.message = u.parseNewLine(discussionPost.discussionDetails.firstPost.message);
		}
		var parsedTemplate = _.template(discussionPostTemplate, discussionPost.discussionDetails, templateSettings);
		var discussionPostSurface = new Surface({
			size: [undefined, true],
			properties: {
				padding: '5px 10px',
				paddingTop: '20px'
			},
			content: parsedTemplate
		});

		if (discussionPost.discussionDetails.firstPost && discussionPost.discussionDetails.firstPost.plotDataId) {
			this.isSharedGraph = true;
			App.tagListWidget = initTagListWidget();
			this.graphView = new GraphView(null, 'discussionDetailPlotArea-' + this.discussionHash);
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
				} else if (_.contains(classList, 'close-discussion') || _.contains(e.srcElement.parentElement.classList, 'close-discussion')) {
					this.deleteDiscussion();
				} else if (_.contains(classList, 'submit-comment')) {
					this.postComment();
				} else if (_.contains(classList, 'share-button') || _.contains(e.srcElement.parentElement.classList, 'share-button')) {
					if (window.plugins) {
						window.plugins.socialsharing.share(null, 'Curious Discussions', null, App.serverUrl + '/home/social/discussions/' + this.discussionHash);
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
				} else if (_.contains(e.srcElement.parentElement.classList, 'disable-button-option')) {
					var disableCommentCheckbox = document.getElementById('disable-comments-checkbox');
					var disable = !disableCommentCheckbox.checked;
					Discussion.disableComments({hash: this.discussionHash, disable: disable}, function(disableComments) {
						if (disableComments) {
							disableCommentCheckbox.checked = true;
							if (!discussionPost.discussionDetails.isAdmin) {
								this.surfaceList.splice(this.surfaceList.indexOf(this.addCommentSurface), 1);
							}
						} else {
							disableCommentCheckbox.checked = false;
							if (!document.getElementsByClassName('comment-form')) {
								this.surfaceList.push(this.addCommentSurface);
							}
						}
					}.bind(this));
				} else if (_.contains(e.srcElement.classList, 'add-description')) {
					this.overlayWithGroupListView = new OverlayWithGroupListView(editDiscussionTemplate, {name: u.parseDivToNewLine(this.discussionDetails.discussionTitle), description: u.parseDivToNewLine(this.discussionDetails.firstPost.message),
							groupName: this.discussionDetails.groupName || (this.discussionDetails.isPublic ? 'PUBLIC' : 'PRIVATE')});
					this.showOverlayContent(this.overlayWithGroupListView);
					this.setHeaderLabel('EDIT DISCUSSION');
				}
			}
		}.bind(this));

		discussionPostSurface.pipe(this.touchSync);

		this.addCommentSurface = this.getAddCommentSurface({});

		if (discussionPost.discussionDetails.isAdmin || (discussionPost.discussionDetails.canWrite && !discussionPost.discussionDetails.disableComments)) {
			this.surfaceList.push(this.addCommentSurface.node);
			this.addCommentSurface.pipe(this.scrollView);
		}

		this.touchSync.on('start', function(data) {
			this.start = Date.now();
			// Show context menu after the timeout regardless of tap end
			this.touchTimeout = setTimeout(function() {

			}.bind(this), 500)
		}.bind(this));

		this.touchSync.on('update', function(data) {
			var movementX = Math.abs(data.position[0]);
			var movementY = Math.abs(data.position[1]);
			// Don't show context menu if there is intent to move something
			if (movementX > 8 || movementY > 8) {
				clearTimeout(this.touchTimeout);
			}
		}.bind(this));

		this.touchSync.on('end', function(data) {
			this.end = Date.now();
			var movementX = Math.abs(data.position[0]);
			var movementY = Math.abs(data.position[1]);
			var timeDelta = this.end - this.start;
			if (movementX < 8 && movementY < 8) {
				if (timeDelta < 500) {
					clearTimeout(this.touchTimeout);
					return;
				}
				if (timeDelta > 600) {
					App.pageView._eventOutput.emit('show-context-menu', {
						menu: 'discussion',
						target: this,
						eventArg: this
					});
				}
			}

		}.bind(this));

		this.showComments(discussionPost);
	};

	DiscussionDetailView.prototype.deleteDiscussion = function() {
		this.alert = u.showAlert({
			type: 'alert',
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
	};

	function _setHandlers() {
		this.on('edit-discussion', function() {
			this.overlayWithGroupListView = new OverlayWithGroupListView(editDiscussionTemplate, {name: u.parseDivToNewLine(this.discussionDetails.discussionTitle), description: u.parseDivToNewLine(this.discussionDetails.firstPost.message),
					groupName: this.discussionDetails.groupName || (this.discussionDetails.isPublic ? 'PUBLIC' : 'PRIVATE')});
			this.showOverlayContent(this.overlayWithGroupListView);
			this.setHeaderLabel('EDIT DISCUSSION');
		}.bind(this));
		this.on('delete-discussion', function() {
			this.deleteDiscussion();
		}.bind(this));
	}

	DiscussionDetailView.prototype.getAddCommentSurface = function(post, currentIndex) {
		var addCommentSurface = new Surface({
			size: [undefined, true],
			content: _.template(addCommentTemplate, {message: post.message || '', postId: post.id || undefined,
				authorAvatarURL: post.authorAvatarURL, commentIndex: currentIndex}, templateSettings),
				properties: {
				}
		});

		addCommentSurface.on('deploy', function(e) {
			document.getElementById('message').onblur = function() {
				document.getElementById('add-comment-avatar').classList.remove('invisible');
			}.bind(this);
		});

		addCommentSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (e.srcElement.id === 'post-comment-button') {
					document.getElementById('add-comment-avatar').classList.remove('invisible');
					this.postComment();
				} else {
					document.getElementById('add-comment-avatar').classList.add('invisible');
					this.commentScrollPosition = this.scrollView.getPosition();
					setTimeout(function() {
						this.setScrollViewPosition();
					}.bind(this), 50)
				}
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
			this.addCommentSurface.trans.set(commentBox.scrollHeight + 20);
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
			post.message = u.parseNewLine(post.message);
			var parsedTemplate =  _.template(commentTemplate, post, templateSettings);
			var commentSurface = new Surface({
				size: [undefined, true],
				content: parsedTemplate
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
					if (this.isCommentSelected) {
						this.unselectComment();
					} else if (_.contains(classList, 'delete-post') || _.contains(e.srcElement.parentElement.classList, 'delete-post')) {
						u.showAlert({
							type: 'alert',
							message: 'Are you sure you want to delete this comment?',
							a: 'Yes',
							b: 'No',
							onA: function() {
								DiscussionPost.deleteComment({
									postId: post.id
								}, function(sucess) {
									this.discussionView.surfaceList.splice(
										this.surfaceList.indexOf(commentSurface), 1);
										this.scrollView.sequenceFrom(this.surfaceList);
								}.bind(this));
							}.bind(this),
							onB: function() {}.bind(this),
						});
					} else if (_.contains(classList, 'edit-post')) {
						this.isCommentSelected = true;
						this.selectedCommentSurface = commentSurface;
						this.selectionIndex = this.surfaceList.indexOf(commentSurface);
						this.surfaceList.splice(this.surfaceList.indexOf(this.addCommentSurface), 1);
						post.message = u.parseDivToNewLine(post.message);
						var editCommentSurface = this.getAddCommentSurface(post, this.selectionIndex);
						this.surfaceList.splice(this.selectionIndex, 1, editCommentSurface.node);
						editCommentSurface.pipe(this.scrollView);
						setTimeout(function() {
							this.resizeCommentSurface(editCommentSurface, true, true);
							document.getElementById('add-comment-avatar').classList.add('invisible');
							this.commentScrollPosition = this.scrollView.getPosition();
							moveCaretToEnd(document.getElementById('message'));
						}.bind(this), 400);
					} else if (_.contains(classList, 'comment-author') || _.contains(e.srcElement.parentElement.classList, 'comment-author')) {
						App.pageView.changePage('PeopleDetailView', {hash: post.authorHash});
					}

				}
			}.bind(this));


			if (post.newPost) {
				this.surfaceList.splice(this.surfaceList.length - 1, 0, commentSurface);
			} else if (this.isSharedGraph) {
				this.surfaceList.splice(2, 0, commentSurface);
			}else {
				this.surfaceList.splice(1, 0, commentSurface);
			}

			commentSurface.pipe(this.scrollView);
		}
	};

	DiscussionDetailView.prototype.postComment = function() {
		var messageBox = document.getElementById('message');
		// Formatting carriage returns to new line
		var message = messageBox.value;
		if (!message) {
			return;
		}
		var postId = messageBox.dataset.postId;
		var currentCommentIndex = messageBox.dataset.commentIndex;
		if (!postId) {
			DiscussionPost.createComment({
				discussionHash: this.discussionHash,
				message: message
			}, function(data) {
				messageBox.value = '';
				this.resizeCommentSurface(messageBox);
				data.post.newPost = true;
				this.renderComment(data.post);
			}.bind(this));
		} else {
			DiscussionPost.update({id: postId, message: message}, function(data) {
				this.loadDetails();
			}.bind(this), function(data) {
			}.bind(this));
		}
	};

	DiscussionDetailView.prototype.updateDiscussion = function(args) {
		args.discussionHash = this.discussionHash;
		Discussion.update(args, function() {
			this.killOverlayContent();
			this.loadDetails();
		}.bind(this), function() {
		}.bind(this));
	};

	DiscussionDetailView.prototype.unselectComment = function() {
		this.surfaceList.splice(this.selectionIndex, 1, this.selectedCommentSurface);
		this.surfaceList.push(this.addCommentSurface);
		this.isCommentSelected = false;
		this.commentBoxHeight = 0;
		this.initialHeight = 50;
	};

	DiscussionDetailView.prototype.killOverlayContent = function() {
		BaseView.prototype.killOverlayContent.call(this);
		this.setHeaderLabel('SOCIAL');
	};

	App.pages[DiscussionDetailView.name] = DiscussionDetailView;
	module.exports = DiscussionDetailView;
});
