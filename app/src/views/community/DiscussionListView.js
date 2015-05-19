define(function(require, exports, module) {
	'use strict';
	var Utility = require('famous/utilities/Utility');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var ImageSurface = require('famous/surfaces/ImageSurface');
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
	var InputSurface = require("famous/surfaces/InputSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var DiscussionDetailView = require("views/community/DiscussionDetailView");
	var CreatePostView = require('views/community/CreatePostView');
	var GenericSync = require('famous/inputs/GenericSync');

	function DiscussionListView() {
		BaseView.apply(this, arguments);
		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y,
		});
		init.call(this);
	}

	DiscussionListView.prototype = Object.create(BaseView.prototype);
	DiscussionListView.prototype.constructor = DiscussionListView;

	DiscussionListView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		noBackButton: true,
	};

	function init() {
		this.headerSurface = new ImageSurface({
			size: [44, 64],
			content: 'content/images/edit-pencil.png',
		});

		this.pencilIconModifier = new StateModifier({
			origin: [1, 0],
			align: [1, 0],
			transform: Transform.translate(0, 0, App.zIndex.header + 1)
		});

		this.setHeaderSurface(this.headerSurface, this.pencilIconModifier);
		this.setHeaderLabel('FEED');

		this.headerSurface.on('click', function(e) {
			App.pageView.changePage(CreatePostView.name);
		}.bind(this));

		var transition = new Transitionable(Transform.translate(0, 75, App.zIndex.feedItem));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);

		// This is to modify renderController so that items in scroll view are not hidden behind footer menu
		var mod = new StateModifier({
			size: [undefined, App.height - 130],
		});
		var node = new RenderNode(mod);
		node.add(this.renderController);
		this.add(node);
		this.group = '';
		this.surfaceList = [];
		this.loadMoreItems = true;
		this.itemsAvailable = true;
		this.offset = 0;
		this.changeGroup(this.group);
	};

	DiscussionListView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this, state);
	};

	DiscussionListView.prototype.submit = function() {
		var searchDiscussion = document.forms["searchForm"]["searchDiscussion"].value;
		if (!searchDiscussion) {
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
				discussion.prettyDate = prettyDate;

				var iconImage = '<i class="fa fa-comment close pull-right"></i>';
				discussion.deleteIcon = '';
				if (discussion.isAdmin) {
					discussion.deleteIcon = '<div class="close-discussion">' +
						'<i class="fa fa-times-circle pull-right"></i>' +
						'</div>';
				}

				if (discussion.isPlot) {
					iconImage = '<i class="fa fa-area-chart close pull-right"></i>';
				}

				discussion.iconImage = iconImage;

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
									Discussion.deleteDiscussion({
										id: discussion.id
									}, function(success) {
										console.log('deleted successfully...');
										this.refresh();
									}.bind(this));
								}.bind(this),
								onB: function() {
									u.closeAlerts;
								}.bind(this),
							});
						} else {
							var state = {
								discussionId: discussion.id
							};
							App.pageView.changePage('DiscussionDetailView', state);
						}
					}
				}.bind(this));
				this.surfaceList.push(discussionSurface);
				discussionSurface.pipe(this.scrollView);
			}.bind(this));
		}.bind(this));
	};

	DiscussionListView.prototype.initScrollView = function() {

		this.scrollView.sync.on('start', function() {
			if (this.itemsAvailable) {
				this.loadMoreItems = true;
			}
		}.bind(this));

		this.scrollView._eventOutput.on('onEdge', function() {
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

	App.pages[DiscussionListView.name] = DiscussionListView;
	module.exports = DiscussionListView;
});
