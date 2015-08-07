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
	var SprintCardView = require('views/community/card/SprintCardView')
	var PeopleCardView = require('views/community/card/PeopleCardView')
	var DiscussionCardView = require('views/community/card/DiscussionCardView')

	function SprintListView() {
		BaseView.apply(this, arguments);
		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y,
		});
		this.max = 10;
		init.call(this);
	}

	SprintListView.prototype = Object.create(BaseView.prototype);
	SprintListView.prototype.constructor = SprintListView;

	SprintListView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		noBackButton: true,
		activeMenu: 'sprint'
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
		this.setRightIcon(this.pencilSurface);
		this.setHeaderLabel('SPRINTS');


		this.pencilSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				Sprint.create(function(data) {
					App.pageView.changePage('SprintFormView', {hash: data.hash});
				});
			}
		}.bind(this));

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

				this.fetchSprints(args);
			}
		}.bind(this));

		this.renderController = new RenderController();
		// This is to modify renderController so that items in scroll view are not hidden behind footer menu
		var mod = new StateModifier({
			size: [undefined, App.height - 130],
			transform: Transform.translate(0, 70, App.zIndex.feedItem)
		});
		this.add(mod).add(this.renderController);
		this.initScrollView();
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

	SprintListView.prototype.initScrollView = function() {

		this.deck = [];
		this.group = '';
		this.loadMoreItems = true;
		this.itemsAvailable = true;
		this.offset = 0;
		this.scrollView.setPosition(0);
	};

	App.pages[SprintListView.name] = SprintListView;
	module.exports = SprintListView;
});
