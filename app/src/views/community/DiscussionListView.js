define(function(require, exports, module) {
	'use strict';
	var Utility = require('famous/utilities/Utility');
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Timer = require('famous/utilities/Timer');
	var Transform = require('famous/core/Transform');
	var Transitionable = require('famous/transitions/Transitionable');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var Scrollview = require('famous/views/Scrollview');
	var DiscussionCollection = require('models/DiscussionCollection');
	var DiscussionTemplate = require('text!templates/discussion.html');
	var TrueSurface = require('surfaces/TrueSurface');
	var u = require('util/Utils');

	function DiscussionListView(group) {
		View.apply(this, arguments);
		this.group = group;
		this.init();
	}

	DiscussionListView.prototype = Object.create(View.prototype);
	DiscussionListView.prototype.constructor = DiscussionListView;

	DiscussionListView.DEFAULT_OPTIONS = {};

	DiscussionListView.prototype.init = function() {
		//var postSurface = new Surface({
		//content: postTemplate
		//});
		var transition = new Transitionable(Transform.translate(0, 44, 0));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);
		this.add(this.renderController);
		this.changeGroup(this.group);
	};

	DiscussionListView.prototype.changeGroup = function(group) {
		DiscussionCollection.fetch(group, function(discussions) {
			var surfaceList = [];

			var scrollView = new Scrollview({
				direction: Utility.Direction.Y,
			});

			discussions.each(function(discussion) {
				var prettyDate = u.prettyDate(new Date(discussion.get('updated')));
				console.log('Pretty date ' + prettyDate);
				discussion.set('prettyDate', prettyDate);
				var discussionSurface = new Surface({
					size: [undefined, true],
					//content: 'testing'
					content: _.template(DiscussionTemplate, discussion.attributes, templateSettings),
				});

				discussionSurface.on('deploy', function() {
					Timer.every(function() {
						var size = this.getSize();
						var width = (size[0] == true) ? this._currTarget.offsetWidth : size[0];
						var height = (size[1] == true) ? this._currTarget.offsetHeight : size[1];
						this.setSize([width, height]);
					}.bind(this), 2);
				});
				surfaceList.push(discussionSurface);
				discussionSurface.pipe(scrollView);
			});


			scrollView.sequenceFrom(surfaceList);
			this.renderController.show(scrollView);
		}.bind(this));

	}

	module.exports = DiscussionListView;
});
