define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Transitionable = require('famous/transitions/Transitionable');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var PostTemplate = require('text!templates/create-post.html');
	var DiscussionListView = require('views/community/DiscussionListView');
	var CommunityView = require('views/community/CommunityView');
	var Discussion = require('models/Discussion');
	var u = require('util/Utils');

	function CreatePostView() {
		BaseView.apply(this, arguments);
		_createView.call(this);
	}

	CreatePostView.prototype = Object.create(BaseView.prototype);
	CreatePostView.prototype.constructor = CreatePostView;

	CreatePostView.DEFAULT_OPTIONS = {
		header: true,	
		footer: false,
	};

	function _createView(argument) {
		var template = PostTemplate;
		this.postSurface = new Surface({
			size: [App.width, App.height - 120],
			content: _.template(template, this.options, templateSettings),
			properties: {
				backgroundColor: 'white'
			}
		});

		this.postSurface.on('click', function(e) {
			var classList;
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'cancel-post')) {
					this._eventOutput.emit('cancel-post-discussion');
				} else if (_.contains(classList, 'submit-post')) {
					this.submit();
				}
			}
		}.bind(this));
		this.add(this.postSurface);
	}

	CreatePostView.prototype.submit = function() {
		var name = document.forms["postForm"]["name"].value;
		var discussionPost = document.forms["postForm"]["discussionPost"].value;
		if (!name){
			u.showAlert("Topic is a required field!");
		} else if (!discussionPost){
			u.showAlert("Detail is a required field!");
		} else {
			Discussion.post(
				name,
				discussionPost,
				function(result) {
					console.log('Posted a new discussion');
					u.showAlert("Detail is a required field!");
					App.pageView.changePage(CommunityView.constructor.name);
				}.bind(this)
			);
		}
	};

	App.pages[CreatePostView.name] = CreatePostView;
	module.exports = CreatePostView;
});
