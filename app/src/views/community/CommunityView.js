define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var RenderController = require('famous/views/RenderController');
	var DiscussionListView = require('views/community/DiscussionListView');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var Surface = require('famous/core/Surface');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var DiscussionDetailView = require("views/community/DiscussionDetailView");
	var CreatePostView = require('views/CreatePostView');
	var PageView = require('views/PageView');

	function CommunityView(options) {
		BaseView.apply(this, arguments);
		this.init();
	}

	CommunityView.prototype = Object.create(BaseView.prototype);
	CommunityView.prototype.constructor = CommunityView;

	CommunityView.DEFAULT_OPTIONS = {
		header: true,	
		footer: true,
	};
	CommunityView.prototype.init = function() {
		this.headerSurface = new ImageSurface({
			size: [44, 64],
			content: 'content/images/edit-pencil.png',
		});

		this.pencilIconModifier = new StateModifier({
			origin: [1, 0],
			align : [1, 0],
			transform: Transform.translate(0, 0, App.zIndex.header)
		});

		this.setHeaderSurface(this.headerSurface, this.pencilIconModifier);
		this.setHeaderLabel('FEED');

		this.headerSurface.on('click', function(e) {
			var createPostSurface = new CreatePostView();
			this.renderController.show(createPostSurface);
			createPostSurface.on('cancel-post-discussion', function(e) {
				this.renderController.show(this.discussionListView);
			}.bind(this));

			createPostSurface.on('post-success', function(e) {
				this.discussionListView.refresh();
				this.renderController.show(this.discussionListView);
			}.bind(this));
		}.bind(this));

		this.backgroundSurface = new Surface({
			size: [undefined, App.height - 65],
			properties: {
				backgroundColor: '#efefef'
			}
		});

		var backgroundModifier = new Modifier({
			transform: Transform.translate(0, 65, 0)
		});

		this.add(backgroundModifier).add(this.backgroundSurface);

		this.renderController = new RenderController();

		var discussionListModifier = new Modifier({
			transform: Transform.translate(0, 0, 5)
		});
		this.add(discussionListModifier).add(this.renderController);

		this._eventInput.on('on-show', function() {
			if (!this.discussionListView) {
				console.log('Creating Discussion List View');
				this.discussionListView = new DiscussionListView('');

				this.discussionListView.on('show-detailed-view', function(discussion) {
					console.log('Creating Discussion Detail View');
					var discussionDetailSurface = new DiscussionDetailView(discussion.id);
					this.renderController.show(discussionDetailSurface);
					discussionDetailSurface.on('delete-post', function(e) {
						this.renderController.show(this.discussionListView);
					}.bind(this));

				}.bind(this));

			}
			console.log('CommunityView: on show');
			this.renderController.show(this.discussionListView);
		}.bind(this));
	}

	module.exports = CommunityView;
});
