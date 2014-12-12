define(function(require, exports, module) {
	'use strict';
	var Utility = require('famous/utilities/Utility');
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Timer = require('famous/utilities/Timer');
	var Transform = require('famous/core/Transform');
	var Transitionable = require('famous/transitions/Transitionable');
	var StateModifier = require('famous/modifiers/StateModifier');
	var FastClick = require('famous/inputs/FastClick');
	var RenderController = require('famous/views/RenderController');
	var RenderNode = require("famous/core/RenderNode");
	var Scrollview = require('famous/views/Scrollview');
	var Discussion = require('models/Discussion');
	var DiscussionTemplate = require('text!templates/discussion.html');
	var discussionHeaderTemplate = require('text!templates/discussion-header.html');
	var TrueSurface = require('surfaces/TrueSurface');
	var u = require('util/Utils');
	var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var DiscussionDetailView = require("views/community/DiscussionDetailView");
	var GenericSync = require('famous/inputs/GenericSync');

	function DiscussionListView(group) {
		View.apply(this, arguments);
		this.group = group;
		this.surfaceList = [];
		this.loadMoreItems = true;
		this.itemsAvailable = true;
		this.offset = 0;
		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y,
		});
		init.call(this);
	}

	DiscussionListView.prototype = Object.create(View.prototype);
	DiscussionListView.prototype.constructor = DiscussionListView;

	DiscussionListView.DEFAULT_OPTIONS = {};

	function init() {
		var transition = new Transitionable(Transform.translate(0, 75, 0));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);
		
		// This is to modify renderController so that items in scroll view are not hidden behind footer menu
		var mod = new StateModifier({
			size: [undefined, App.height - 130],
		});
		var node = new RenderNode(mod);
		node.add(this.renderController);
		this.add(node);
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


	DiscussionListView.prototype.refresh = function() {
		this.surfaceList = [];
		this.changeGroup(this.group);	
	};

	DiscussionListView.prototype.changeGroup = function(group) {
		this.fetchDiscussionData(group);
		this.initScrollView();
	};
	
	DiscussionListView.prototype.fetchDiscussionData = function(urlParameters) {
		Discussion.fetch(urlParameters, function(discussions) {
			var $this = this;

			if (discussions.dataList.length === 0) {
				this.itemsAvailable = false;
				console.log('no more items');
				return;
			}
			discussions.dataList.forEach(function(discussion) {
				var prettyDate = u.prettyDate(new Date(discussion.updated));
				discussion.prettyDate =  prettyDate;

				var iconImage='<i class="fa fa-comment close pull-right"></i>';
				discussion.deleteIcon = '';
				if (discussion.isAdmin) {
					discussion.deleteIcon = '<div class="close-discussion">' +
						'<i class="fa fa-times-circle pull-right"></i>' +
						'</div>';
				}

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
					if (u.isAndroid() || (e instanceof CustomEvent)) {
						classList = e.srcElement.parentElement.classList;
						if (_.contains(classList, 'close-discussion')) {
							this.alert = u.showAlert({
								message: 'Are you sure to delete ' + discussion.name + ' ?',
								a: 'Yes',
								b: 'No',
								onA: function() {
									Discussion.deleteDiscussion({id: discussion.id}, function(success){
										console.log('deleted successfully...');
										this.refresh();
									}.bind(this));
								}.bind(this),
								onB: function() {
									u.closeAlerts;
								}.bind(this),
							});
						} else {
							this._eventOutput.emit('show-detailed-view',
							{id: discussion.id});
						}
					}
				}.bind(this));
				this.surfaceList.push(discussionSurface);
				discussionSurface.pipe(this.scrollView);
			}.bind(this));
		}.bind(this));
	};
	
	DiscussionListView.prototype.initScrollView = function() {

		this.scrollView.sync.on('start',function(){
			if (this.itemsAvailable) {
				this.loadMoreItems = true;
			}
		}.bind(this));

		this.scrollView._eventOutput.on('onEdge',function(){
			var currentIndex = this.scrollView.getCurrentIndex();

			// Check if end of the page is reached
			if ((this.scrollView._scroller._onEdge != -1) && this.loadMoreItems && this.itemsAvailable) {
				this.loadMoreItems = false;
				this.offset += Discussion.max;
				var args = {
						offset: this.offset
				}
				this.fetchDiscussionData(args);
			}
		}.bind(this));

		this.scrollView.sequenceFrom(this.surfaceList);
		this.renderController.show(this.scrollView);
	};

	module.exports = DiscussionListView;
});
