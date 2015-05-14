define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var PostTemplate = require('text!templates/create-post.html');
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
		this.setHeaderLabel('CREATE DISCUSSION');
		this.postSurface = new Surface({
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
		this.setBody(this.postSurface);
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
					App.pageView.changePage('DiscussionListView');
				}.bind(this)
			);
		}
	};

	App.pages[CreatePostView.name] = CreatePostView;
	module.exports = CreatePostView;
});
