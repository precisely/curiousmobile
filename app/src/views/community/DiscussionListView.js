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
	var Discussion = require('models/Discussion');
	var DiscussionTemplate = require('text!templates/discussion.html');
	var discussionHeaderTemplate = require('text!templates/discussion-header.html');
	var TrueSurface = require('surfaces/TrueSurface');
	var u = require('util/Utils');
	var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var DiscussionSummaryView = require("views/community/DiscussionSummaryView");

	function DiscussionListView(group) {
		View.apply(this, arguments);
		this.group = group;
		this.init();
	}

	DiscussionListView.prototype = Object.create(View.prototype);
	DiscussionListView.prototype.constructor = DiscussionListView;

	DiscussionListView.DEFAULT_OPTIONS = {};

	DiscussionListView.prototype.init = function() {
		var transition = new Transitionable(Transform.translate(0, 0, 0));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);
		this.add(this.renderController);
		this.changeGroup(this.group);
	};

	DiscussionListView.prototype.submit = function() {
		var searchDiscussion = document.forms["searchForm"]["searchDiscussion"].value;
		if (!searchDiscussion){
			u.showAlert("No search data!");
		} else {
			console.log('Fetch result from server');
		}
	};

	DiscussionListView.prototype.changeGroup = function(group) {
		Discussion.fetch(group, function(discussions) {
			var surfaceList = [];
			var $this = this;
			var scrollView = new Scrollview({
				direction: Utility.Direction.Y,
			});

			this.searchAndPostSurface = new Surface({
				size: [undefined, 40],
				content: _.template(discussionHeaderTemplate, templateSettings),
				properties: {
					marginTop: '10px'	
				}
			});
			surfaceList.push(this.searchAndPostSurface);

			this.searchAndPostSurface.on('click', function(e) {
				var classList;
				if (e instanceof CustomEvent) {
					classList = e.srcElement.parentElement.classList;
					if (_.contains(classList, 'submit')) {
						console.log("Submit for search");
						this.submit();
					} else if (_.contains(classList, 'create-post')) {
						console.log("Show create-post page");
						this._eventOutput.emit('create-post');
					}
				}
			}.bind(this));

			this.searchAndPostSurface.on('keydown', function (e) {
				if (e.keyCode == 13) {
					this.submit();
				}
			}.bind(this));

			discussions.dataList.forEach(function(discussion) {
				var prettyDate = u.prettyDate(new Date(discussion.updated));
				discussion.prettyDate =  prettyDate;

				var iconImage='<i class="fa fa-comment close pull-right"></i>';

				if (discussion.isPlot) {
					iconImage= '<i class="fa fa-area-chart close pull-right"></i>';
				}

				discussion.iconImage =  iconImage;

				var discussionSurface = new Surface({
					size: [undefined, true],
					content: _.template(DiscussionTemplate, discussion, templateSettings),
				});

				discussionSurface.on('deploy', function() {
					Timer.every(function() {
						var size = this.getSize();
						var width = (size[0] == true) ? this._currTarget.offsetWidth : size[0];
						var height = (size[1] == true) ? this._currTarget.offsetHeight : size[1];
						this.setSize([width, height]);
					}.bind(this), 2);
				});

				discussionSurface.on('click', function(e) {
					var classList;
					if (e instanceof CustomEvent) {
						classList = e.srcElement.parentElement.classList;
						if (_.contains(classList, 'close-discussion')) {
							this.alert = u.showAlert({
								message: 'Are you sure to delete ' + discussion.name + ' ?',
								a: 'Yes',
								b: 'No',
								onA: function() {
									Discussion.deleteDiscussion({id: discussion.id}, function(success){
										var index = surfaceList.indexOf(discussionSurface);
										surfaceList.splice(index, 1);
										this.renderController.inTransformFrom(transition);
										this.renderController.show(scrollView);
									}.bind(this));
								}.bind(this),
								onB: function() {
									u.closeAlerts;
								}.bind(this),
							});
						} else {
							console.log("Discussion Title");
							var detailedDiscussionSurface = new Surface({
								size: [undefined, true],
								content: _.template(DiscussionTemplate, 
									discussion, templateSettings),
							});
							this._eventOutput.emit('show-detailed-view',
								{id: discussion.id});
						}
					}
				}.bind(this));
				surfaceList.push(discussionSurface);
				discussionSurface.pipe(scrollView);
			}.bind(this));

			scrollView.sequenceFrom(surfaceList);
			this.renderController.show(scrollView);
		}.bind(this));
	}

	module.exports = DiscussionListView;
});
