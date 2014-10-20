define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var RenderController = require('famous/views/RenderController');
	var DiscussionListView = require('views/community/DiscussionListView');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var Surface = require('famous/core/Surface');
	var DiscussionSummaryView = require("views/community/DiscussionSummaryView");
	var CreatePostView = require('views/CreatePostView');

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
		this.renderController = new RenderController();
		this.add(this.renderController);
		this.headerSurface = new Surface({
			size: [window.innerWidth, 74],
			content: 'FEED <i class="post fa fa-pencil"></i>',
			properties: {
				fontSize: '22px',
				fontWeight: 'bold',
				color: '#e83838',	
				textAlign: 'center',
				padding: '18px 0'
			}
		});
		this.setHeaderSurface(this.headerSurface);
		this._eventInput.on('on-show', function() {

			if (!this.discussionListView) {
				console.log('Creating Discussion List View');
				this.discussionListView = new DiscussionListView('');
				
				this.discussionListView.on('show-detailed-view', function(discussion) {
					console.log('Creating Discussion Summary View');
					var discussionSummarySurface = new DiscussionSummaryView(discussion.id);
					this.renderController.show(discussionSummarySurface);
					discussionSummarySurface.on('delete-post', function(e) {
						this.renderController.show(this.discussionListView);
					}.bind(this));

				}.bind(this));

				this.headerSurface.on('click', function(e) {
					var createPostSurface = new CreatePostView();
					this.renderController.show(createPostSurface);
					createPostSurface.on('cancel-post-discussion', function(e) {
						this.renderController.show(this.discussionListView);
					}.bind(this));

					createPostSurface.on('post-success', function(e) {
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
