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
		this.parentPage = 'FeedView';
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
					this.clear();
					App.pageView.changePage('FeedView');
				} else if (_.contains(classList, 'submit-post')) {
					this.submit();
				}
			}
		}.bind(this));
		this.setBody(this.postSurface);
	}

	CreatePostView.prototype.clear = function() {
		document.forms["postForm"]["name"].value = '';
		document.forms["postForm"]["discussionPost"].value = '';
	};

	CreatePostView.prototype.submit = function() {
		var name = document.forms["postForm"]["name"].value;
		var discussionPost = document.forms["postForm"]["discussionPost"].value;
		if (!name) {
			u.showAlert("Topic is a required field!");
		} else if (!discussionPost) {
			u.showAlert("Detail is a required field!");
		} else {
			Discussion.post(
				name,
				discussionPost,
				function(result) {
					console.log('Posted a new discussion');
					// Indicating this is a new like state so list gets reloaded
					App.pageView.changePage('FeedView', {
						new: true
					});
				}.bind(this)
			);
		}
	};

	CreatePostView.prototype.getCurrentState = function() {
		var name = document.forms["postForm"]["name"].value;
		var discussionPost = document.forms["postForm"]["discussionPost"].value;
		var state = {
			form: [{
				id: 'name',
				value: name,
				elementType: ElementType.domElement,
			}, {
				id: 'discussionPost',
				value: discussionPost,
				elementType: ElementType.domElement,
			}]
		};
		return state;
	};

	App.pages[CreatePostView.name] = CreatePostView;
	module.exports = CreatePostView;
});
