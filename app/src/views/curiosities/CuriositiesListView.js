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

	function CuriositiesListView() {
		FeedView.apply(this, arguments);
		this.max = 10;
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
		this.loadCuriosities();
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
