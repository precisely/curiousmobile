define(function(require, exports, module) {
	'use strict';
	var Utility = require('famous/utilities/Utility');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
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
	var TrueSurface = require('surfaces/TrueSurface');
	var u = require('util/Utils');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var DiscussionDetailView = require("views/community/DiscussionDetailView");
	var CreatePostView = require('views/community/CreatePostView');
	var SprintCardView = require('views/community/card/SprintCardView')
	var PeopleCardView = require('views/community/card/PeopleCardView')
	var DiscussionCardView = require('views/community/card/DiscussionCardView')

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
		activeMenu: 'feed'
	};

	function init() {
		this.deck = [];
		this.pencilSurface = new ImageSurface({
			size: [44, 64],
			content: 'content/images/edit-pencil.png',
		});

		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#efefef'
			}
		});

		this.setBody(this.backgroundSurface);
		this.setRightIcon(this.headerSurface);
		this.setHeaderLabel('SOCIAL');


		this.pencilSurface.on('click', function(e) {
			App.pageView.changePage(CreatePostView.name);
		}.bind(this));

		this.pillsScrollViewContainerModifier = new StateModifier({
			origin: [0, 0],
			align: [0, 0],
			transform: Transform.translate(0, 64, App.zIndex.header)
		});

		var pillsScrollViewContainer = new ContainerSurface({
			size: [undefined, 50],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});
		this.add(this.pillsScrollViewContainerModifier).add(pillsScrollViewContainer);

		this.pillsScrollViewModifier = new StateModifier({
			origin: [0.5, 0],
			align: [0.5, 0]
		});
		var navPills = [];
		this.pillsScrollView.sequenceFrom(navPills);

		// Adding navigation pills below header
		navPills.push(this.createPillsSurface('ALL', true));
		navPills.push(this.createPillsSurface('PEOPLE'));
		navPills.push(this.createPillsSurface('DISCUSSIONS'));

		pillsScrollViewContainer.add(this.pillsScrollViewModifier).add(this.pillsScrollView);


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

		this.renderController = new RenderController();
		// This is to modify renderController so that items in scroll view are not hidden behind footer menu
		var mod = new StateModifier({
			size: [undefined, App.height - 130],
			transform: Transform.translate(0, 110, App.zIndex.feedItem)
		});
		this.add(mod).add(this.renderController);
		this.initScrollView();
		this.fetchFeedItems(this.currentPill || 'ALL');
	};

	FeedView.prototype.createPillsSurface = function(pillFor, active) {
		var activePill = active ? ' active-pill' : '';
		var pillSurface = new Surface({
			content: '<button class="feed-pill btn' + activePill + '" id="' + pillFor + '-pill">' + pillFor + '</button>',
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
			var previousActivePill = document.getElementsByClassName('active-pill');
			previousActivePill[0].classList.remove('active-pill');
			var pillElement = document.getElementById(pillFor + '-pill');
			pillElement.classList.add('active-pill');
		}.bind(this));

		pillSurface.pipe(this.pillsScrollView);
		return pillSurface;
	};

	FeedView.prototype.getScrollPosition = function() {
		return this.scrollView.getPosition()	
	};

	FeedView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
	}

	FeedView.prototype.preShow = function(state) {
		if (this.deck.length <= 0 || (state && state.new)) {
			this.initScrollView();
			this.fetchFeedItems(this.currentPill || 'ALL');
		}
		return true;
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
		this.removeRightIcon();
		if (lable === 'ALL') {
			params.type = 'all';
			var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', params);
			u.queueJSON("loading feeds", u.makeGetUrl('getAllSocialData', 'search'),
				u.makeGetArgs(argsToSend),
				function(data) {
					if(!u.checkData(data)) {
						return;
					}

					addListItemsToScrollView.call(this, data.listItems);
				}.bind(this));
		} else if (lable === 'PEOPLE') {
			User.fetch(params, addListItemsToScrollView.bind(this));
		} else if (lable === 'DISCUSSIONS') {
			this.setRightIcon(this.pencilSurface);
			Discussion.fetch(params, addListItemsToScrollView.bind(this));
		}
	};

	function addListItemsToScrollView(listItems) {
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
				var discussionCardView = new DiscussionCardView(item, null, this.deck);
				this.deck.push(discussionCardView);
				discussionCardView.setScrollView(this.scrollView);

			} else if (item.type === 'usr') {
				var peopleCardView = new PeopleCardView(item);
				this.deck.push(peopleCardView);
				peopleCardView.setScrollView(this.scrollView);
			}
		}.bind(this));

		//this.add(Scrollview);
	}

	FeedView.prototype.refresh = function() {
		this.initScrollView();
		this.fetchFeedItems(this.currentPill);
	};

	FeedView.prototype.initScrollView = function() {

		this.deck = [];
		this.group = '';
		this.loadMoreItems = true;
		this.itemsAvailable = true;
		this.offset = 0;
		this.scrollView.setPosition(0);
		this.scrollView.sequenceFrom(this.deck);
		this.renderController.show(this.scrollView);
	};

	App.pages[FeedView.name] = FeedView;
	module.exports = FeedView;
});
