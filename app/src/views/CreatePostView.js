define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Transitionable = require('famous/transitions/Transitionable');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require('famous/views/RenderController');
	var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var PostTemplate = require('text!templates/create-post.html');
	var DiscussionListView = require('views/community/DiscussionListView');
	var Discussion = require('models/Discussion');
	var u = require('util/Utils');

	function CreatePostView() {
		View.apply(this, arguments);
		var transition = new Transitionable(Transform.translate(0, 20, 0));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);
		this.add(this.renderController);
		_createView.call(this);
	}

	CreatePostView.prototype = Object.create(View.prototype);
	CreatePostView.prototype.constructor = CreatePostView;

	CreatePostView.DEFAULT_OPTIONS = {};

	function _createView(argument) {
		var template = PostTemplate;
		this.postSurface = new Surface({
			content: _.template(template, this.options, templateSettings),
			properties: {
				backgroundColor: 'white'
			}
		});

		this.postSurface.on('click', function(e) {
			var classList;
			if (e instanceof CustomEvent) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'cancel-post')) {
					this._eventOutput.emit('cancel-post-discussion');
				} else if (_.contains(classList, 'submit-post')) {
					this.submit();
					this._eventOutput.emit('post-success');
				}
			}
		}.bind(this));

		this.renderController.show(this.postSurface);
	}

	CreatePostView.prototype.submit = function() {
		var discussion = new Discussion();
		var name = document.forms["postForm"]["name"].value;
		var discussionPost = document.forms["postForm"]["discussionPost"].value;
		if (!name){
			u.showAlert("Topic is a required field!");
		} else if (!discussionPost){
			u.showAlert("Detail is a required field!");
		} else {
			discussion.post(
				name,
				discussionPost,
				function(result) {
					console.log('Posted a new discussion');
					this._eventOutput.emit('post-success');
				}.bind(this)
			)
		}
	};

	module.exports = CreatePostView;
});
