define(function(require, exports, module) {
	'use strict';
	var Utility = require('famous/utilities/Utility');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var Timer = require('famous/utilities/Timer');
	var Transform = require('famous/core/Transform');
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
	var DiscussionDetailView = require("views/community/DiscussionDetailView");
	var CreatePostView = require('views/community/CreatePostView');
	var SprintCardView = require('views/community/card/SprintCardView');
	var PeopleCardView = require('views/community/card/PeopleCardView');
	var DiscussionCardView = require('views/community/card/DiscussionCardView');
	var NoMoreItemsCardView = require('views/community/card/NoMoreItemsCardView');
	var DiscussionCreateOptionsSurface = require('views/community/DiscussionOptionsOverlay');

	function FeedView(showSearchView) {
		BaseView.apply(this, arguments);
		console.log('FeedView Constructor');
		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y
		});
		this.pillsScrollView = new Scrollview({
			direction: Utility.Direction.X
		});
		this.max = 10;
		this.currentPill = 'ALL';
		init.call(this);
		if (this.constructor.name === 'FeedView') {
			this.initFeedSpecificContents();
		}
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
		this.pillNames = ['ALL', 'NOTIFICATIONS', 'DISCUSSIONS', 'PEOPLE', 'AUTHORED'];
		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#efefef'
			}
		});

		this.setBody(this.backgroundSurface);

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
				};

				if (_.contains(['FeedView', 'SprintListView'], this.constructor.name)) {
					this.fetchFeedItems(this.currentPill, args);
				} else if (this.constructor.name === 'CuriositiesListView') {
					C.handleScroll();
				} else {
					this.fetchSearchResults(args);
				}
			}
		}.bind(this));

		this.renderController = new RenderController();
		// This is to modify renderController so that items in scroll view are not hidden behind footer menu
		this.scrollViewMod = new StateModifier({
			size: [undefined, App.height - 190],
			transform: Transform.translate(0, this.options.scrollViewYTransform || 110, App.zIndex.feedItem)
		});
		this.add(this.scrollViewMod).add(this.renderController);
		this.initScrollView();
	}

	FeedView.prototype.initFeedSpecificContents = function() {
		this.plusSurface = new Surface({
			size: [44, 64],
			content: '<i class="fa fa-2x fa-plus-square-o"></i>',
			properties: {
				padding: '19px 0px 0px 5px',
				color: '#f14a42'
			}
		});
		this.setRightIcon(this.plusSurface);
		this.setHeaderLabel('SOCIAL FEED');

		this.plusSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var discussionCreateOptionsSurface = new DiscussionCreateOptionsSurface();
				this.showDiscussionOptions(discussionCreateOptionsSurface);
			}
		}.bind(this));

		this.pillsScrollViewContainerModifier = new StateModifier({
			transform: Transform.translate(0, 64, App.zIndex.readView + 5)
		});

		var pillsScrollViewContainer = new ContainerSurface({
			size: [undefined, 50],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});
		this.add(this.pillsScrollViewContainerModifier).add(pillsScrollViewContainer);

		this.navPills = [];
		this.pillsScrollView.sequenceFrom(this.navPills);
		this.renderPills();
		pillsScrollViewContainer.add(this.pillsScrollView);
	};

	FeedView.prototype.createPillsSurface = function(pillFor, active) {
		var activePill = active ? ' active-pill' : '';
		var badge = '';
		if (pillFor === 'NOTIFICATIONS' && App.getNotificationCount()) {
			badge = '<span class="badge">' + App.getNotificationCount() + '</span>';
		}
		var pillSurface = new Surface({
			content: '<button class="feed-pill btn' + activePill + '" id="' + pillFor + '-pill">' + pillFor + badge + '</button>',
			size: [true, 50],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});

		pillSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.deck = [];
				this.initScrollView();
				this.fetchFeedItems(pillFor);
				this.setCurrentPill(pillFor);
			}
		}.bind(this));

		pillSurface.pipe(this.pillsScrollView);
		return pillSurface;
	};

	FeedView.prototype.setCurrentPill = function(lable, position) {
		var previousActivePill = document.getElementsByClassName('active-pill');
		if (previousActivePill[0]) {
			previousActivePill[0].classList.remove('active-pill');
		}
		var pillElement = document.getElementById(lable + '-pill');
		pillElement.classList.add('active-pill');
		this.currentPill = lable;
		if (position) {
			this.pillsScrollView.setPosition(position);
		}
		this.saveState();
	};

	FeedView.prototype.getScrollPosition = function() {
		return this.scrollView.getPosition();
	};

	FeedView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		if (state && state.currentPill) {
			this.setCurrentPill(state.currentPill, state.position);
		}
	};

	FeedView.prototype.preShow = function(state) {
		this.initScrollView();
		var lable = this.currentPill || 'ALL';
		if (state && state.currentPill) {
			lable = state.currentPill;
		}
		this.fetchFeedItems(lable);
		return true;
	};

	FeedView.prototype.getCurrentState = function() {
		var state = {
			currentPill: this.currentPill,
			position: this.pillsScrollView.getPosition()
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

	FeedView.prototype.resetNotificationCount = function() {
		if (this.navPills) {
			this.navPills.splice(1, 1, this.createPillsSurface('NOTIFICATIONS', this.currentPill === 'NOTIFICATIONS'));
		}
		_.each(App.pageView.pageMap, function(page) {
			page.resetFooter();
		});
	};

	FeedView.prototype.fetchFeedItems = function(lable, args) {
		this.currentPill = lable;
		var params = args || {
			offset: 0,
			max: this.max
		};
		if (lable === 'ALL') {
			params.type = 'all';
			params.nextSuggestionOffset = this.nextSuggestionOffset;
			var argsToSend = u.getCSRFPreventionObject('getListDataCSRF', params);
			u.queueJSON("loading feeds", u.makeGetUrl('getAllSocialData', 'search'),
				u.makeGetArgs(argsToSend),
				function(data) {
					if(!u.checkData(data)) {
						return;
					}

					this.addListItemsToScrollView(data.listItems, data.nextSuggestionOffset);
				}.bind(this));
		} else if (lable === 'PEOPLE') {
			User.fetch(params, this.addListItemsToScrollView.bind(this));
		} else if (lable === 'DISCUSSIONS') {
			Discussion.fetch(params, this.addListItemsToScrollView.bind(this));
		} else if (lable === 'NOTIFICATIONS') {
			Discussion.getNotifications(params, function(listItems) {
				Discussion.getNewNotificationCount();
				this.addListItemsToScrollView(listItems);
			}.bind(this));
		} else if (lable === 'AUTHORED') {
			Discussion.fetchOwned(params, this.addListItemsToScrollView.bind(this));
		}
	};

	FeedView.prototype.addListItemsToScrollView = function(listItems, nextSuggestionOffset) {
		if (!listItems || listItems.length <= 0) {
			this.itemsAvailable = false;
			console.log('no more items available');
			var noMoreItemsCardView = new NoMoreItemsCardView('No results');
			this.deck.push(noMoreItemsCardView);
			noMoreItemsCardView.setScrollView(this.scrollView);

			this.on('list-empty', function () {
				noMoreItemsCardView.setText('No results');
			});

			if (!this.offset == 0) {
				noMoreItemsCardView.setText('No more results');
			}
			return;
		}

		if (nextSuggestionOffset) {
			this.nextSuggestionOffset = nextSuggestionOffset;
		}

		listItems.forEach(function(item) {

			if (item.type === 'spr') {
				var sprintCardView = new SprintCardView(item);
				this.deck.push(sprintCardView);
				sprintCardView.setScrollView(this.scrollView);

			} else if (item.type === 'dis') {
				var discussion = new Discussion(item);
				var discussionCardView = new DiscussionCardView(discussion, App.pageView.getCurrentPage(), this.deck);
				this.deck.push(discussionCardView);
				discussionCardView.setScrollView(this.scrollView);

			} else if (item.type === 'usr') {
				var peopleCardView = new PeopleCardView(item);
				this.deck.push(peopleCardView);
				peopleCardView.setScrollView(this.scrollView);
			}
		}.bind(this));
	};

	FeedView.prototype.refresh = function() {
		this.initScrollView();
		this.fetchFeedItems(this.currentPill);
	};

	FeedView.prototype.renderPills = function() {
		this.navPills.splice(0, this.navPills.length);
		// Adding navigation pills below header
		_.each(this.pillNames, function(pillName) {
			var active = (pillName === 'ALL');
			this.navPills.push(this.createPillsSurface(pillName, active));
		}.bind(this));
	};

	FeedView.prototype.initScrollView = function() {
		this.deck = [];
		this.group = '';
		this.loadMoreItems = true;
		this.itemsAvailable = true;
		this.offset = 0;
		this.nextSuggestionOffset = 0;
		this.scrollView.setPosition(0);
		this.scrollView.sequenceFrom(this.deck);
		this.renderController.show(this.scrollView);
	};

	FeedView.prototype.showDiscussionOptions = function(discussionCreateOptionsSurface) {
		this.showBackButton();
		this.removeRightIcon();
		this.hideSearchIcon();
		this.showOverlayContent(discussionCreateOptionsSurface);
	};

	FeedView.prototype.killOverlayContent = function() {
		BaseView.prototype.killOverlayContent.call(this);
		this.showMenuButton();
		this.showSearchIcon();
		this.setRightIcon(this.plusSurface);
	};

	App.pages[FeedView.name] = FeedView;
	module.exports = FeedView;
});
