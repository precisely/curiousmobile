define(function(require, exports, module) {
	var exoskeleton = require('exoskeleton');
	var EventHandler = require("famous/core/EventHandler");
	var store = require('store');
	var u = require('util/Utils');
	var Post = Backbone.Model.extend({
		constructor: function(argument) {
			this.eventInput = new EventHandler();
			this.u = require('util/Utils');
			Backbone.Model.apply(this, arguments);
		},
		post: function(name, discussionPost, callback) {
			this.u.queueJSON("posting in",
                this.u.makeGetUrl('createDiscussion'),
                this.u.makeGetArgs({
                    name: name,
                    discussionPost: discussionPost,
                    group: ""
				}),
				function(data) {
					if (data['success']) {
						callback(this.getUserData(data));
					} else {
						this.u.showAlert('Failed to post the discussion, please try again');
					}
				}.bind(this));
		}
	});

	module.exports = Post;
});
