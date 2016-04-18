define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var Utility = require('famous/utilities/Utility');
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Transform = require('famous/core/Transform');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Scrollview = require('famous/views/Scrollview');
	var Modifier = require('famous/core/Modifier');
	var StateView = require('views/StateView');
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var SprintActivityTitleTemplate = require('text!templates/sprint-activity-title.html');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var DiscussionCardView = require('views/community/card/DiscussionCardView');
	var Sprint = require('models/Sprint');
	var Discussion = require('models/Discussion');
	var store = require('store');
	var NoMoreItemsCardView = require('views/community/card/NoMoreItemsCardView');
	var DiscussionCreateOptionsSurface = require('views/community/DiscussionOptionsOverlay');
	var u = require('util/Utils');

	function SprintActivityView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'SprintListView';
		this.goBackToHistory = false;
		this.setHeaderLabel('');
		this.max = 5;
		this.offset = 0;

		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#efefef',
				zIndex: 5
			}
		});
		this.setBody(this.backgroundSurface);

		this.initContent();
	}


	SprintActivityView.prototype = Object.create(BaseView.prototype);
	SprintActivityView.prototype.constructor = SprintActivityView;

	SprintActivityView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		activeMenu: 'sprint'
	};

	SprintActivityView.prototype.createPlusSurface = function() {
		this.plusSurface = new Surface({
			size: [44, 64],
			content: '<i class="fa fa-2x fa-plus-square-o" id="add-discussion"></i>',
			properties: {
				padding: '19px 0px 0px 5px',
				color: '#f14a42'
			},
			attributes: {
				id: 'plus-icon-surface'
			}
		});
		this.removeRightIcon();
		this.setRightIcon(this.plusSurface);

		this.plusSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (!_.contains(['popover', 'arrow', 'popover-content', 'vline'], className)) {
					var discussionCreateOptionsSurface = new DiscussionCreateOptionsSurface({createTrackathonDiscussion: true,
							groupName: this.virtualGroupName});
					this.showBackButton();
					this.removeRightIcon();
					this.hideSearchIcon();
					this.showOverlayContent(discussionCreateOptionsSurface);
				}
			}
		}.bind(this));
	};
	
	SprintActivityView.prototype.initContent = function() {
   		var sequentialLayout = new SequentialLayout({
   			direction: 1,
   			itemSpacing: 0
   		});
   		this.renderables = [];
   		sequentialLayout.sequenceFrom(this.renderables);

		this.sprintActivityTitleSurface = new Surface({
			size: [undefined, true],
			properties: {
				zIndex: App.zIndex.header + 10
			}
		});
		this.sprintActivityTitleSurface.on('click', function(e) {
			var classList;
			if (e instanceof CustomEvent) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'details')) {
					var state = {
						hash: this.hash,
						name: this.name,
						parentPage: this.parentPage != 'SprintDetailView' ? 'SprintActivityView' : undefined
					};
					App.pageView.changePage('SprintDetailView', state);
				}
			}
		}.bind(this));

		this.renderables.push(this.sprintActivityTitleSurface);

		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y
		});

		this.scrollView.sync.on('start', function() {
			if (this.itemsAvailable) {
				this.loadMoreItems = true;
			}
		}.bind(this));

		this.initScrollView();

		this.scrollView._eventOutput.on('onEdge', function() {
			var currentIndex = this.scrollView.getCurrentIndex();

			// Check if end of the page is reached
			if ((this.scrollView._scroller._onEdge != -1) && this.loadMoreItems && this.itemsAvailable) {
				this.loadMoreItems = false;
				this.offset += this.max;
				var args = {
					sprintHash: this.hash,
					offset: this.offset,
					max: this.max
				};

				this.fetchDiscussions(args);
			}
		}.bind(this));

		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height - 300],
			transform: Transform.translate(0, 63, 16)
		});

		this.renderController.show(this.scrollView);
		this.renderables.push(this.renderController);
		this.add(mod).add(sequentialLayout);
	};

	SprintActivityView.prototype.killOverlayContent = function() {
		BaseView.prototype.killOverlayContent.call(this);
		this.showMenuButton();
		this.showSearchIcon();
		this.setRightIcon(this.plusSurface);
	};

	SprintActivityView.prototype.fetchDiscussions = function(args) {
		var params = args;
		var parsedTemplate = _.template(SprintActivityTitleTemplate, {name: this.name}, templateSettings);
		this.sprintActivityTitleSurface.setContent(parsedTemplate);

		Sprint.listDiscussions(args, function(data) {
			if (store.get('showPostDiscussionBalloon')) {
				App.showPopover('#add-discussion', {placement: 'bottom', key: 'addDiscussionTrackathon', autoHide: true, container: '#plus-icon-surface'});
			}
			if (data.isMember) {
				this.createPlusSurface();
			}
			addListItemsToScrollView.call(this, data.listItems);
		}.bind(this), function() {
			Sprint.follow(args.sprintHash, function() {
				this.fetchDiscussions(args);
			}.bind(this), function() {
				this.goBack();
			}.bind(this));
		}.bind(this));

	};

	SprintActivityView.prototype.preChangePage = function() {
		$('#add-discussion').popover('destroy');
	};
	
	SprintActivityView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
	};

	SprintActivityView.prototype.preShow = function(state) {
		if (!state || (!state.hash && (state.new && !this.hash))) {
			return false;
		} else if (state.hash) {
			this.hash = state.hash;
			this.name = state.name;
			this.virtualGroupName = state.virtualGroupName;
		}
		this.parentPage = state.parentPage || 'SprintListView';
		this.initScrollView();
		this.fetchDiscussions({sprintHash: this.hash, max: 5, offset: 0});
		return true;
	};

	function addListItemsToScrollView(listItems) {
		if (typeof listItems === 'undefined' || !listItems.length) {
			var noActivityMessage = new NoMoreItemsCardView('No results');
			this.deck.push(noActivityMessage);
			noActivityMessage.setScrollView(this.scrollView);
			this.itemsAvailable = false;
			console.log('no more items available');

			this.on('list-empty', function() {
				noActivityMessage.setText('No results');
			});

			if (this.offset !== 0) {
				noActivityMessage.setText('No more results')
			}

			return;
		}
		listItems.forEach(function(item) {
			var discussion = new Discussion(item);
			var discussionCardView = new DiscussionCardView(discussion, 'SprintActivityView', this.deck);
			this.deck.push(discussionCardView);
			discussionCardView.setScrollView(this.scrollView);
		}.bind(this));
	}

	SprintActivityView.prototype.initScrollView = function() {
		this.deck = [];
		this.group = '';
		this.loadMoreItems = true;
		this.itemsAvailable = true;
		this.offset = 0;
		this.scrollView.setPosition(0);
		this.scrollView.sequenceFrom(this.deck);
	};

	App.pages['SprintActivityView'] = SprintActivityView;
	module.exports = SprintActivityView;
});
