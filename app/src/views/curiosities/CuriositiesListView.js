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
	var FeedView = require('views/community/FeedView');
	var curiosities = require('util/curiosities');
	require('../../../lib/bootstrap/dist/js/bootstrap.min');

	function CuriositiesListView() {
		FeedView.apply(this, arguments);
		this.max = 10;
		this.createCuriositiesPills();
		initCuriosityView.call(this);
	}

	CuriositiesListView.prototype = Object.create(FeedView.prototype);
	CuriositiesListView.prototype.constructor = CuriositiesListView;

	CuriositiesListView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		noBackButton: true,
		activeMenu: 'curiosities'
	};

	function initCuriosityView() {
		this.setHeaderLabel('CURIOSITIES');
		var filterButton = new Surface({
			size: [80, 40],
			content: '<div class="btn-group">' +
					'<button type="button" class="btn btn-default dropdown-toggle curiosities-filter-button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
					'Filter&nbsp;&nbsp;<i class="fa fa-chevron-down"></i></button><ul class="dropdown-menu">' +
					'<li><a href="#">All</a></li><li><a href="#">Yes</a></li>' +
					'<li><a href="#">No</a></li></ul></div>',
			properties: {
				margin: '15px 20px 0px 0px'
			}
		});
		filterButton.on('deploy', function() {
			$('.dropdown-toggle').dropdown();
		}.bind(this));
		this.setRightIcon(filterButton);
		this.loadCuriosities();
	};

	CuriositiesListView.prototype.createCuriositiesPills = function() {
		this.pillsScrollViewContainerModifier = new StateModifier({
			origin: [0, 0],
			align: [0, 0],
			transform: Transform.translate(0, 64, App.zIndex.header)
		});

		var pillsScrollViewContainer = new ContainerSurface({
			size: [undefined, 50],
			classes: ['sort-curiosities'],
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
		navPills.push(this.createPillsSurface('NATURAL', true, 'natural'));
		navPills.push(this.createPillsSurface('A-Z', false, 'alpha'));
		navPills.push(this.createPillsSurface('MARKED', false, 'marked'));
		navPills.push(this.createPillsSurface('SCORE', false, 'score'));

		pillsScrollViewContainer.add(this.pillsScrollViewModifier).add(this.pillsScrollView);
		pillsScrollViewContainer.on('deploy', function() {
			C.sortClickHandler('.sort-curiosities');
		}.bind(this));
	};

	CuriositiesListView.prototype.createPillsSurface = function(pillFor, active, id) {
		var activePill = active ? ' active-pill' : '';
		var pillSurface = new Surface({
			content: '<button class="feed-pill btn filter' + activePill + '" id="' + id + '" data-order="' + id +
			((id !== 'natural') ? ' asc' : '') + '">' + pillFor + '</button>',
			size: [true, 50],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});

		pillSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
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
		this.loadCuriosities();
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
