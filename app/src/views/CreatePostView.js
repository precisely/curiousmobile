define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var PostTemplate = require('text!templates/create-post.html');
	var Post = require('models/Post');
	var u = require('util/Utils');

	function CreatePostView() {
		View.apply(this, arguments);
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
				if (e.srcElement.localName == 'button') {
					classList = e.srcElement.classList;
				}
				if (_.contains(classList, 'submit')) {
					console.log("Submit post");
					this.submit();
				}
			}
		}.bind(this));

		this.postSurface.on('keydown', function (e) {
			if (e.keyCode == 13) {
				this.submit();
			}
		}.bind(this));

		this.add(this.postSurface);
	}


	CreatePostView.prototype.submit = function() {
        var postDiscussion = new Post();
        var name = document.forms["postForm"]["name"].value;
        var discussionPost = document.forms["postForm"]["discussionPost"].value;
        if (!name){
            u.showAlert("Topic is a required field!");
        } else if (!discussionPost){
            u.showAlert("Detail is a required field!");
        } else {
            postDiscussion.post(
                name,
                discussionPost,
                function(post) {
                    console.log('Posting new discussion');
                    this._eventOutput.emit('post-success');
                }.bind(this)
            )
        }
    };

	module.exports = CreatePostView;
});
