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
	var RenderNode = require('famous/core/RenderNode');
	var Scrollview = require('famous/views/Scrollview');
	var Discussion = require('models/Discussion');
	var Sprint = require('models/Sprint');
	var User = require('models/User');
	var DiscussionTemplate = require('text!templates/discussion.html');
	var discussionHeaderTemplate = require('text!templates/discussion-header.html');
	var TrueSurface = require('surfaces/TrueSurface');
	var u = require('util/Utils');
	var InputSurface = require("famous/surfaces/InputSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var DiscussionDetailView = require("views/community/DiscussionDetailView");
	var CreatePostView = require('views/community/CreatePostView');
	var SprintCardView = require('views/community/card/SprintCardView')
	var PeopleCardView = require('views/community/card/PeopleCardView')
	var DiscussionCardView = require('views/community/card/DiscussionCardView')
	var GenericSync = require('famous/inputs/GenericSync');

	function FeedView() {
		BaseView.apply(this, arguments);
		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y,
		});
		this.pillsScrollView = new Scrollview({
			direction: Utility.Direction.X,
		});
		this.max = 10;
		this.currentPill = 'ALL';
		init.call(this);
	}

	FeedView.prototype = Object.create(BaseView.prototype);
	FeedView.prototype.constructor = FeedView;

	FeedView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		noBackButton: true,
	};

	function init() {
		this.deck = [];
		this.headerSurface = new ImageSurface({
			size: [44, 64],
			content: 'content/images/edit-pencil.png',
		});

		this.pencilIconModifier = new StateModifier({
			origin: [1, 0],
			align: [1, 0],
			transform: Transform.translate(0, 0, App.zIndex.header + 1)
		});

		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#efefef'
			}
		});

		this.setBody(this.backgroundSurface);
		this.setHeaderSurface(this.headerSurface, this.pencilIconModifier);
		this.setHeaderLabel('FEED');

		this.headerSurface.on('click', function(e) {
			App.pageView.changePage(CreatePostView.name);
		}.bind(this));

		this.pillsScrollViewModifier = new StateModifier({
			origin: [0, 0],
			align: [0, 0],
			transform: Transform.translate(0, 65, App.zIndex.header)
		});

		var navPills = [];
		this.pillsScrollView.sequenceFrom(navPills);

		// Adding navigation pills below header
		navPills.push(this.createPillsSurface('ALL'));
		navPills.push(this.createPillsSurface('PEOPLE'));
		navPills.push(this.createPillsSurface('DISCUSSIONS'));
		navPills.push(this.createPillsSurface('SPRINT'));

		this.add(this.pillsScrollViewModifier).add(this.pillsScrollView);

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
				this.offset += this.max;
				var args = {
					offset: this.offset,
					max: this.max
				}

				this.fetchFeedItems(this.currentPill, args);
			}
		}.bind(this));

		this.initScrollView();
		this.fetchFeedItems(this.currentPill || 'ALL');
	};

	FeedView.prototype.createPillsSurface = function(pillFor) {
		var pillSurface = new Surface({
			content: '<button class="feed-pill btn">' + pillFor + '</button>',
			size: [true, 50],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});

		pillSurface.on('click', function(e) {
			this.deck = [];
			this.initScrollView();
			this.fetchFeedItems(pillFor);
		}.bind(this));

		pillSurface.pipe(this.pillsScrollView);
		return pillSurface;
	};

	FeedView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		/*if (!state) {
			state = {
			};
		}*/
		this.currentPill = state ?  state.viewProperties.currentPill : null;
		this.fetchFeedItems(this.currentPill || 'ALL');
	};

	FeedView.prototype.getCurrentState = function() {
		var state = {
			viewProperties: {
				currentPill: this.currentPill,
			}
		};
		return state;
	};

	FeedView.prototype.submit = function() {
		var searchDiscussion = document.forms["searchForm"]["searchDiscussion"].value;
		if (!searchDiscussion) {
			u.showAlert("No search data!");
		} else {
			console.log('Fetch result from server');
		}
	};

	FeedView.prototype.fetchFeedItems = function(lable, args) {
		this.currentPill = lable;
		var params = args || {
			offset: 0,
			max: this.max
		};
		if (lable === 'ALL') {
			params.type = 'all';
			var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', params);
			u.backgroundJSON("loading feeds", u.makeGetUrl('indexData', 'search'), 
			u.makeGetArgs(argsToSend), function(data) {
				if (u.checkData(data)) {
					data.listItems.sort(function(a, b) {
						return a.updated > b.updated ? -1 : (a.updated < b.updated ? 1 : 0)
					});
					addListItemsToScrollView.call(this, data.listItems);
				}
			}.bind(this));
		} else if (lable === 'PEOPLE') {
			User.fetch(params, addListItemsToScrollView.bind(this));
		} else if (lable === 'SPRINT') {
			Sprint.fetch(params, addListItemsToScrollView.bind(this));
		} else if (lable === 'DISCUSSIONS') {
			Discussion.fetch(params, addListItemsToScrollView.bind(this));
		}
	};

	function addListItemsToScrollView (listItems) {
		if (!listItems) {
			this.itemsAvailable = false;
			console.log('no more items available');
			return;
		}
		listItems.forEach(function(item) {

			if (item.type === 'spr') {
				var sprintCardView = new SprintCardView(item);
				this.deck.push(sprintCardView);
				sprintCardView.setScrollView(this.scrollView);

			} else if (item.type === 'dis') {
				var discussionCardView = new DiscussionCardView(item);
				this.deck.push(discussionCardView);
				discussionCardView.setScrollView(this.scrollView);

			} else if (item.type === 'usr') {
				var peopleCardView = new PeopleCardView(item);
				this.deck.push(peopleCardView);
				peopleCardView.setScrollView(this.scrollView);
			}
		}.bind(this));
			
		this.add(Scrollview);
	}

	FeedView.prototype.refresh = function() {
		this.fetchFeedItems(this.currentPill);
	};

	FeedView.prototype.changeGroup = function(group) {
	//	this.fetchDiscussionData(group);
		this.initScrollView();
	};

	FeedView.prototype.fetchDiscussionData = function(urlParameters) {
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

	FeedView.prototype.initScrollView = function() {

		var transition = new Transitionable(Transform.translate(0, 110, App.zIndex.feedItem));
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
		this.deck = [];
		this.loadMoreItems = true;
		this.itemsAvailable = true;
		this.offset = 0;

		this.scrollView.sequenceFrom(this.deck);
		this.renderController.show(this.scrollView);
	};

	App.pages[FeedView.name] = FeedView;
	module.exports = FeedView;
});
