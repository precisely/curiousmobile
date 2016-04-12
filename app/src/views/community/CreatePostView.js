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

	function _createView() {
		var template = PostTemplate;
		this.setHeaderLabel('CREATE DISCUSSION');
		this.postSurface = new Surface({
			content: _.template(template, this.options, templateSettings),
			properties: {
				backgroundColor: 'white',
				padding: '10px'
			}
		});

		this.postSurface.on('click', function(e) {
			var classList;
			if (e instanceof CustomEvent) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'cancel-post')) {
					this.clear();
					App.pageView.changePage('FeedView');
				} else if (_.contains(classList, 'submit-post')) {
					this.submit();
				}
			}
		}.bind(this));

		this.postSurface.on('deploy', function(e) {
			document.getElementById('name').onkeyup = function(e) {
				// if (e.which === 13) {
				// 	this.submit();
				// }
			}.bind(this);
		}.bind(this));
		this.setBody(this.postSurface);
	}

	CreatePostView.prototype.clear = function() {
		document.forms["postForm"]["name"].value = '';
	};

	CreatePostView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		this.hashTag = '';
		if (state && state.hashTag) {
			this.hashTag = state.hashTag;
		}
	}

	CreatePostView.prototype.submit = function() {
		var value = document.forms["postForm"]["name"].value;
		if (!value) {
			u.showAlert("Topic is a required field!");
		} else {
			var extractedData = extractDiscussionNameAndPost(value);
			extractedData.name += this.hashTag ? '\n' + this.hashTag : '';
			Discussion.post(
				extractedData.name,
				extractedData.post,
				function(result) {
					this.clear();
					console.log('Posted a new discussion');
					// Indicating this is a new like state so list gets reloaded
					u.spinnerStart();
					setTimeout(function(){
						u.spinnerStop();
						App.pageView.changePage('FeedView', {
							new: true
						});
					}, 1000);
				}.bind(this)
			);
		}
	};

	CreatePostView.prototype.getCurrentState = function() {
		var name = document.forms["postForm"]["name"].value;
		var state = {
			form: [{
				id: 'name',
				value: name,
				elementType: ElementType.domElement,
			}]
		};
		return state;
	};

	function extractDiscussionNameAndPost(value) {
		var discussionName, discussionPost;

		// Try to get the first sentence i.e. a line ending with either "." "?" or "!"
		var firstSentenceData = /^.*?[\.!\?](?:\s|$)/.exec(value);

		if (firstSentenceData) {
			discussionName = firstSentenceData[0].trim();
		} else {	// If user has not used any of the above punctuations
			discussionName = value;
		}

		// Trim the entered text max upto the 100 characters and use it as the discussion name/title
		if (discussionName.length > 100) {
			discussionName = shorten(discussionName, 100).trim();       // See base.js for "shorten" method
			// And the rest of the string (if any) will be used as first discussion comment message,
			// reducing 3 characters as trailing ellipsis appended at the end of the post title
			discussionPost = value.substring(discussionName.length - 3).trim();
		} else {
			discussionPost = value.substring(discussionName.length).trim();
		}

		return {name: discussionName, post: discussionPost};
	}

	App.pages[CreatePostView.name] = CreatePostView;
	module.exports = CreatePostView;
});
