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

	function DiscussionCardView(discussion, parentPage, cardViewCollection) {
		CardView.apply(this, arguments);
		this.discussion = discussion;
		this.parentPage = parentPage || 'FeedView';
		this.cardViewCollection = cardViewCollection;
		createCard.call(this);
	}

	DiscussionCardView.prototype = Object.create(CardView.prototype);
	DiscussionCardView.prototype.constructor = DiscussionCardView;

	DiscussionCardView.DEFAULT_OPTIONS = {
	};

	function createCard() {
		var prettyDate = u.prettyDate(new Date(this.discussion.get("updated")));
		this.discussion.set("prettyDate", prettyDate);

		this.cardSurface = new Surface({
			size: [undefined, true],
			content: _.template(DiscussoinTemplate, this.discussion.toJSON(), templateSettings),
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
			if (e instanceof CustomEvent) {
				classList = e.srcElement.parentElement.classList;
				if (_.contains(classList, 'close-discussion') || _.contains(e.srcElement.classList, 'close-discussion')) {
					this.alert = u.showAlert({
						message: 'Are you sure you want to delete ' + this.discussion.get("name") + ' ?',
						a: 'Yes',
						b: 'No',
						onA: function() {
							Discussion.deleteDiscussion({
								hash: this.discussion.get("hash")
							}, function(success) {
								console.log('deleted successfully...');
								this.cardViewCollection.splice(this.cardViewCollection.indexOf(this), 1);
							}.bind(this));
						}.bind(this),
						onB: function() {
							u.closeAlerts;
						}.bind(this),
					});
				} else if (_.contains(classList, 'share-button') || _.contains(e.srcElement.classList, 'share-button')) {
					if (window.plugins) {
						window.plugins.socialsharing.share(null, 'Curious Discussions', null, App.serverUrl + '/home/social/discussions/' + this.discussion.get("hash"));
					}
				} else if (_.contains(classList, 'follow-button') || _.contains(e.srcElement.parentElement.classList, 'follow-button')) {
					Discussion.follow({id: this.discussion.get("hash")}, function(data) {
						this.viewDetailPage();
					}.bind(this));
				} else if (_.contains(classList, 'unfollow-button') || _.contains(e.srcElement.parentElement.classList, 'unfollow-button')) {
					Discussion.follow({id: this.discussion.get("hash"), unfollow: true}, function(data) {
						this.viewDetailPage();
					}.bind(this));
				} else if (_.contains(classList, 'discussion-author') || _.contains(e.srcElement.parentElement.classList, 'discussion-author')) {
					App.pageView.changePage('PeopleDetailView', {hash: this.discussion.get("userHash")});
				} else {
 					this.viewDetailPage();
				}
			}
		}.bind(this));

 		this.add(this.cardSurface);
 	};

	DiscussionCardView.prototype.viewDetailPage = function() {
		var state = {
			discussionHash: this.discussion.get("hash"),
			parentPage: this.parentPage
		};
		App.pageView.changePage('DiscussionDetailView', state);
	};

 	module.exports = DiscussionCardView;
 });
