define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var RenderController = require('famous/views/RenderController');
	var DiscussionListView = require('views/community/DiscussionListView');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var Surface = require('famous/core/Surface');
	//var DiscussionView = require('views/community/DiscussionView');


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
			}
			console.log('CommunityView: on show');
			this.renderController.show(this.discussionListView);
		}.bind(this));
	}

	module.exports = CommunityView;
});
