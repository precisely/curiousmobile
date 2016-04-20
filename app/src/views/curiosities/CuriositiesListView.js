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
	var u = require('util/Utils');
	var CuriosityCardView = require('views/curiosities/CuriosityCardView');
	var CuriosityExplanationCardView = require('views/community/card/CuriosityExplanationCard');
	var FeedView = require('views/community/FeedView');
	var curiosities = require('util/curiosities');
	var User = require('models/User');
	var store = require('store');
	var Modifier = require('famous/core/Modifier');

	function CuriositiesListView() {
		FeedView.apply(this, arguments);
		this.max = 10;
		if (!store.get('hideCuriositiesExplanation')) {
			this.showExplanationCard();
		}
		this.mainContainerSurface = new ContainerSurface({
			size: [undefined, true]
		});
		this.containerModifierState = new Transitionable(64);
		this.mainContainerModifier = new Modifier({
			transform: function() {
				var yPos = this.containerModifierState.get();
				return Transform.translate(0, yPos, App.zIndex.readView);
			}.bind(this)
		});
		this.add(this.mainContainerModifier).add(this.mainContainerSurface);
		this.createCuriositiesPills();
		this.createSearchBar();
		initCuriosityView.call(this);
	}

	CuriositiesListView.prototype = Object.create(FeedView.prototype);
	CuriositiesListView.prototype.constructor = CuriositiesListView;

	CuriositiesListView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		noBackButton: true,
		activeMenu: 'curiosities',
		scrollViewYTransform: 160
	};

	function initCuriosityView() {
		this.setHeaderLabel('CURIOSITIES');
		this.loadCuriosities();
	};

	CuriositiesListView.prototype.showExplanationCard = function() {
		if (this.explanationVisible) {
			return;
		}
		this.explanationVisible = true;
		var curiosityExplanationCard = new CuriosityExplanationCardView();
		this.explanationRenderController = new RenderController();
		this.add(new StateModifier({transform: Transform.translate(0, 64, App.zIndex.header)})).add(this.explanationRenderController);

		this.explanationRenderController.show(curiosityExplanationCard, null, function() {
			var explanationCardHeight = curiosityExplanationCard.getSize()[1]
			this.containerModifierState.set(52 + explanationCardHeight);
			this.scrollViewMod.setTransform(Transform.translate(0, this.options.scrollViewYTransform + explanationCardHeight, App.zIndex.feedItem));
		}.bind(this));

		this.on('close-explanation', this.hideExplanationBox);
	};

	CuriositiesListView.prototype.hideExplanationBox = function() {
		User.hideExplanationCard('curiosity', function() {
			this.explanationRenderController.hide();
			this.explanationVisible = false;
			store.set('hideCuriositiesExplanation', true);
			this.containerModifierState.set(64);
			this.scrollViewMod.setTransform(Transform.translate(0, this.options.scrollViewYTransform, App.zIndex.feedItem));
		}.bind(this));
	};

	CuriositiesListView.prototype.createSearchBar = function() {
		var searchBox = new Surface({
			size: [undefined, 58],
			content: '<div class="curiosities-search-div input-group input-group-lg"><i class="input-group-addon fa fa-search fa-2x"></i>' +
			'<input type="text" class="form-control curiosities-search-input" placeholder="Search Curiosities" id="curiosities-search"></div>',
			properties: {
				color: '#d8d8d8',
			}
		});

		searchBox.on('deploy', function() {
			$('#curiosities-search').keyup(function(e) {
				this.scrollView.goToPage(0);
				setTimeout(function() {
					this.deck.splice(0, this.deck.length);
					C.performSearch($('#curiosities-search').val(), true);
				}.bind(this), 50);
				
			}.bind(this));
		}.bind(this));
		this.mainContainerSurface.add(new StateModifier({transform: Transform.translate(0, 49, App.zIndex.readView + 5)})).add(searchBox);
	};

	CuriositiesListView.prototype.createCuriositiesPills = function() {
		this.pillsModifierState = new Transitionable(64);
		this.pillsScrollViewContainerModifier = new StateModifier({
			transform: Transform.translate(0, 0, App.zIndex.readView)
		});

		var pillsScrollViewContainer = new ContainerSurface({
			size: [undefined, 50],
			classes: ['sort-curiosities', 'filter-group'],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});

		this.mainContainerSurface.add(this.pillsScrollViewContainerModifier).add(pillsScrollViewContainer);

		this.pillsScrollViewModifier = new StateModifier({
			origin: [0.5, 0],
			align: [0.5, 0]
		});
		var navPills = [];
		this.pillsScrollView.sequenceFrom(navPills);

		// Adding navigation pills below header
		navPills.push(this.createPillsSurface('Unrated', true, 'natural'));
		navPills.push(this.createPillsSurface('Rated', false, 'rated'));
		navPills.push(this.createPillsSurface('All', false, 'all'));

		pillsScrollViewContainer.add(this.pillsScrollViewModifier).add(this.pillsScrollView);
		pillsScrollViewContainer.on('deploy', function() {
			C.sortClickHandler('.sort-curiosities');
		}.bind(this));

		var showExplanationSurface = new Surface({
			size: [50, 49],
			content: '<i class="fa fa-question-circle"></i>',
			properties: {
				backgroundColor: '#efefef',
				padding: '15px 5px 0px 18px'
			}
		});

		this.mainContainerSurface.add(new StateModifier({transform: Transform.translate(App.width - 50, 0, App.zIndex.header)})).add(showExplanationSurface);

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

	CuriositiesListView.prototype.createPillsSurface = function(pillFor, active, id) {
		var activePill = active ? ' active-pill' : '';
		var pillSurface = new Surface({
			content: '<button class="feed-pill btn filter' + activePill + '" id="' + id + '" data-order="' + id + '">' + pillFor + '</button>',
			size: [true, 50],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});

		pillSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				//C.sortClickHandler('.sort-curiosities');
				var previousActivePill = document.getElementsByClassName('active-pill');
				this.deck = [];
				this.initScrollView();
				previousActivePill[0].classList.remove('active-pill');
				var pillElement = e.srcElement;
				pillElement.classList.add('active-pill');
			}
		}.bind(this));

		pillSurface.pipe(this.pillsScrollView);
		return pillSurface;
	};

	CuriositiesListView.prototype.sortBy = function(type) {

	};

	CuriositiesListView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
	}

	CuriositiesListView.prototype.preShow = function(state) {
		if (this.deck.length <= 0) {
			this.initScrollView();
		}
		return true;
	};

	CuriositiesListView.prototype.getCurrentState = function() {
		var state = {};
		return state;
	};

	CuriositiesListView.prototype.addListItems = function(templateProperties) {
		addListItemsToScrollView.call(this, templateProperties);
	};

	function addListItemsToScrollView(templateProperties) {
		var curiosityCardvView = new CuriosityCardView(templateProperties);
		this.deck.push(curiosityCardvView);
		curiosityCardvView.setScrollView(this.scrollView);
		curiosityCardvView.on('deploy', function() {
		});
	}

	CuriositiesListView.prototype.fetchSearchResults = function() {
		// TODO: Second argument is search string
		C.searchWithDefaults(null, '', C.curiositiesPageNumber);
	};

	CuriositiesListView.prototype.refresh = function() {
		this.initScrollView();
		C.performSearch($('#curiosities-search').val(), true);
	};

	CuriositiesListView.prototype.loadCuriosities = function() {
		initCuriosities();
	};

	CuriositiesListView.prototype.getScrollPosition = function() {
		return this.scrollView.getPosition()
	};

	App.pages[CuriositiesListView.name] = CuriositiesListView;
	module.exports = CuriositiesListView;
});
