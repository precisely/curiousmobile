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
	var DiscussionDetailView = require("views/community/DiscussionDetailView");
	var SprintFormView = require("views/sprint/SprintFormView");
	var CreatePostView = require('views/community/CreatePostView');
	var SprintCardView = require('views/community/card/SprintCardView');
	var PeopleCardView = require('views/community/card/PeopleCardView');
	var DiscussionCardView = require('views/community/card/DiscussionCardView');
	var FeedView = require('views/community/FeedView');

	function SprintListView() {
		FeedView.apply(this, arguments);
		this.max = 10;
		initSprintView.call(this);
	}

	SprintListView.prototype = Object.create(FeedView.prototype);
	SprintListView.prototype.constructor = SprintListView;

	SprintListView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		noBackButton: true,
		activeMenu: 'sprint'
	};

	function initSprintView() {
		this.plusSurface = new Surface({
			size: [44, 64],
			content: '<i class="fa fa-2x fa-plus-square-o"></i>',
			properties: {
				padding: '19px 0px 0px 5px',
				color: '#f14a42'
			}
		});

		this.setRightIcon(this.plusSurface);
		this.setHeaderLabel('SPRINTS');


		this.plusSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				Sprint.create(function(data) {
					App.pageView.changePage('SprintFormView', {hash: data.hash});
				});
			}
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
		navPills.push(this.createPillsSurface('OWNED'));

		pillsScrollViewContainer.add(this.pillsScrollViewModifier).add(this.pillsScrollView);
		this.fetchSprints();
	};

	SprintListView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
	}

	SprintListView.prototype.preShow = function(state) {
		if (this.deck.length <= 0 || (state && state.new)) {
			this.initScrollView();
			this.fetchSprints();
		}
		return true;
	};

	SprintListView.prototype.getCurrentState = function() {
		var state = {};
		return state;
	};

	SprintListView.prototype.fetchFeedItems = function(lable, args) {
		this.currentPill = lable;
		var params = args || {
					offset: 0,
					max: this.max
				};
		if (lable === 'ALL') {
			Sprint.fetch(params, addListItemsToScrollView.bind(this));
		} else if (lable === 'OWNED') {
			Sprint.fetchOwned(params, this.addListItemsToScrollView.bind(this));
		}
	};

	SprintListView.prototype.submit = function() {
		var searchDiscussion = document.forms["searchForm"]["searchDiscussion"].value;
		if (!searchDiscussion) {
			u.showAlert("No search data!");
		} else {
			console.log('Fetch result from server');
		}
	};

	SprintListView.prototype.fetchSprints = function(args) {
		var params = args || {
			offset: 0,
			max: this.max
		};
		Sprint.fetch(params, addListItemsToScrollView.bind(this));
		this.scrollView.sequenceFrom(this.deck);
		this.renderController.show(this.scrollView);
	};

	function addListItemsToScrollView(listItems) {
		if (!listItems) {
			this.itemsAvailable = false;
			console.log('no more items available');
			return;
		}
		listItems.forEach(function(item) {
			var sprintCardView = new SprintCardView(item);
			this.deck.push(sprintCardView);
			sprintCardView.setScrollView(this.scrollView);
		}.bind(this));

		//this.add(Scrollview);
	}

	SprintListView.prototype.refresh = function() {
		this.initScrollView();
		this.fetchSprints();
	};

	SprintListView.prototype.getScrollPosition = function() {
		return this.scrollView.getPosition()	
	};

	App.pages[SprintListView.name] = SprintListView;
	module.exports = SprintListView;
});
