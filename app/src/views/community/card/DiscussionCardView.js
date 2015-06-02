define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var Timer = require('famous/utilities/Timer');
	var FastClick = require('famous/inputs/FastClick');
	var CardView = require('views/community/card/CardView');
	var DiscussoinTemplate = require('text!templates/discussion.html');
	var Discussion = require('models/Discussion');
	var DiscussionPost = require('models/DiscussionPost');
	var u = require('util/Utils');
	var m = require('util/Model');

	function DiscussionCardView(discussion) {
		CardView.apply(this, arguments);
		this.discussion = discussion;
		createCard.call(this);
	}

	DiscussionCardView.prototype = Object.create(CardView.prototype);
	DiscussionCardView.prototype.constructor = DiscussionCardView;

	DiscussionCardView.DEFAULT_OPTIONS = {
	};

	function createCard() {
		var prettyDate = u.prettyDate(new Date(this.discussion.updated));
		this.discussion.prettyDate = prettyDate;

		this.cardSurface = new Surface({
			size: [undefined, true],
			content: _.template(DiscussoinTemplate, this.discussion, templateSettings),
			properties: {
				padding: '5px 10px 0px 10px'
			}
		});

		this.cardSurface.on('deploy', function() {
			Timer.every(function() {
				var size = this.getSize();
				var width = (size[0] == true) ? this._currTarget.offsetWidth : size[0];
				var height = (size[1] == true) ? this._currTarget.offsetHeight : size[1];
				this.setSize([width, height]);
			}.bind(this), 2);
		});

		this.cardSurface.on('click', function(e) {
			var classList;
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				classList = e.srcElement.parentElement.classList;
				if (_.contains(classList, 'close-discussion')) {
					this.alert = u.showAlert({
						message: 'Are you sure to delete ' + this.discussion.name + ' ?',
						a: 'Yes',
						b: 'No',
						onA: function() {
							Discussion.deleteDiscussion({
								id: this.discussion.id
							}, function(success) {
								console.log('deleted successfully...');
								App.pageView.getPage('FeedView').refresh();
							}.bind(this));
						}.bind(this),
						onB: function() {
							u.closeAlerts;
						}.bind(this),
					});
				} else {
					var state = {
						discussionId: this.discussion.id
					};
					App.pageView.changePage('DiscussionDetailView', state);
				}
			}
		}.bind(this));

 		this.add(this.cardSurface);
 	};

 	module.exports = DiscussionCardView;
 });

