define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/surfaces/ContainerSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var u = require('util/Utils');
	var DiscussionTemplate = require('text!templates/discussion.html');

	function DiscussionSummaryView(discussion) {
		View.apply(this, arguments);
		this.init(discussion)
	}

	DiscussionSummaryView.prototype = Object.create(View.prototype);
	DiscussionSummaryView.prototype.constructor = DiscussionSummaryView;

	DiscussionSummaryView.DEFAULT_OPTIONS = {};

	DiscussionSummaryView.prototype.init = function(discussion) {
		var prettyDate = u.prettyDate(new Date(discussion.get('updated')));
		console.log('Pretty date ' + prettyDate);
		discussion.set('prettyDate', prettyDate);
		var discussionSurface = new ContainerSurface({
			content: _.template(DiscussionTemplate, discussion.attributes, templateSettings),
		});
		this.add(discussionSurface);
	}

	module.exports = DiscussionSummaryView;
});
