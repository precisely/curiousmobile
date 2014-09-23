define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var RenderController = require('famous/views/RenderController');
	var DiscussionListView = require('views/community/DiscussionListView');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var Surface = require('famous/core/Surface');
	var DiscussionSummaryView = require("views/community/DiscussionSummaryView");
	var CreatePostView = require("views/CreatePostView");

	function CommunityView() {
		BaseView.apply(this, arguments);
		this.init();
	}

	CommunityView.prototype = Object.create(BaseView.prototype);
	CommunityView.prototype.constructor = CommunityView;

	CommunityView.DEFAULT_OPTIONS = {};
	CommunityView.prototype.init = function() {
		this.renderController = new RenderController();
		this.add(this.renderController);
		this.setHeaderLabel('Community Feed');
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

				this.discussionListView.on('create-post', function(e) {
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
