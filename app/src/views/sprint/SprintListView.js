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
	var SprintExplanationCardView = require('views/sprint/SprintExplanationCard');
	var FeedView = require('views/community/FeedView');
	var store = require('store');

	function SprintListView() {
		FeedView.apply(this, arguments);
		this.max = 10;
		initSprintView.call(this);
		if (!store.get('hideSprintExplanation')) {
			this.showExplanationCard();
		}
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
		this.setHeaderLabel('EXPERIMENTS');


		this.plusSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				Sprint.create(function(data) {
					App.pageView.changePage('SprintFormView', {hash: data.hash});
				});
			}
		}.bind(this));

		this.pillsScrollViewContainerModifier = new StateModifier({
			transform: Transform.translate(0, 64, App.zIndex.header)
		});

		var pillsScrollViewContainer = new ContainerSurface({
			size: [App.width - 50, 50],
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

		var showExplanationSurface = new Surface({
			size: [50, 50],
			content: '<i class="fa fa-question-circle"></i>',
			properties: {
				backgroundColor: '#efefef',
				padding: '15px 5px 0px 18px'
			}
		});

		this.explanationBoxModifier = new StateModifier({transform: Transform.translate(App.width - 50, 64, App.zIndex.header)});
		this.add(this.explanationBoxModifier).add(showExplanationSurface);

		showExplanationSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (this.explanationVisible) {
					this.hideExplanationBox();
				} else {
					this.showExplanationCard();
				}
			}
		}.bind(this));
	};

	SprintListView.prototype.showExplanationCard = function() {
		var sprintExplanationCard = new SprintExplanationCardView();
		this.sprintRenderController = new RenderController();
		this.add(new StateModifier({transform: Transform.translate(0, 64, App.zIndex.header)})).add(this.sprintRenderController);

		this.sprintRenderController.show(sprintExplanationCard, function() {
			this.explanationVisible = true;
			var explanationCardHeight = sprintExplanationCard.getSize()[1]
			this.pillsScrollViewContainerModifier.setTransform(Transform.translate(0, 52 + explanationCardHeight, App.zIndex.header));
			this.scrollViewMod.setTransform(Transform.translate(0, 110 + explanationCardHeight, App.zIndex.feedItem));
			this.explanationBoxModifier.setTransform(Transform.translate(App.width - 50, 55 + explanationCardHeight, App.zIndex.header));
		}.bind(this));

		this.on('close-explanation', this.hideExplanationBox);
	};

	SprintListView.prototype.hideExplanationBox = function() {
		this.sprintRenderController.hide();
		this.explanationVisible = false;
		store.set('hideSprintExplanation', true);
		this.pillsScrollViewContainerModifier.setTransform(Transform.translate(0, 64, App.zIndex.header));
		this.scrollViewMod.setTransform(Transform.translate(0, 110, App.zIndex.feedItem));
		this.explanationBoxModifier.setTransform(Transform.translate(App.width - 50, 64, App.zIndex.header));
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
			params.nextSuggestionOffset = this.nextSuggestionOffset;
			Sprint.fetch(params, this.addListItemsToScrollView.bind(this));
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
		Sprint.fetch(params, this.addListItemsToScrollView.bind(this));
		this.scrollView.sequenceFrom(this.deck);
		this.renderController.show(this.scrollView);
	};

	SprintListView.prototype.getScrollPosition = function() {
		return this.scrollView.getPosition()	
	};

	App.pages[SprintListView.name] = SprintListView;
	module.exports = SprintListView;
});
