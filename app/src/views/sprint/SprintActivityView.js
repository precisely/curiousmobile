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
	var Draggable = require("famous/modifiers/Draggable");
	var SprintActivityTitleTemplate = require('text!templates/sprint-activity-title.html');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var DiscussionCardView = require('views/community/card/DiscussionCardView')
	var Sprint = require('models/Sprint');
	var u = require('util/Utils');

	function SprintActivityView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'FeedView';
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

		this.pencilSurface = new ImageSurface({
			size: [44, 64],
			content: 'content/images/edit-pencil.png',
		});

		this.pencilIconModifier = new StateModifier({
			origin: [1, 0],
			align: [1, 0],
			transform: Transform.translate(0, 0, App.zIndex.header + 1)
		});

		this.setHeaderSurface(this.pencilSurface, this.pencilIconModifier);
		this.initContent();
	}


	SprintActivityView.prototype = Object.create(BaseView.prototype);
	SprintActivityView.prototype.constructor = SprintActivityView;

	SprintActivityView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
	};

	SprintActivityView.prototype.initContent = function() {
   		var sequentialLayout = new SequentialLayout({
   			direction: 1,
   			itemSpacing: 10
   		});
   		this.renderables = [];
   		sequentialLayout.sequenceFrom(this.renderables);

		this.sprintActivityTitleSurface = new Surface({
			size: [undefined, true],
			properties: {
				zIndex: App.zIndex.readView + 1
			}
		});
		this.sprintActivityTitleSurface.on('click', function(e) {
			var classList;
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'details')) {
					var state = {
						hash: this.hash,
						name: this.name,
						parentPage: 'SprintActivityView'
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
				}

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

	SprintActivityView.prototype.fetchDiscussions = function(args) {
		var params = args;
		this.sprintActivityTitleSurface.setContent(_.template(SprintActivityTitleTemplate, {name: this.name}, templateSettings));
		Sprint.listDiscussions(args, addListItemsToScrollView.bind(this), function() {
			App.pageView.goBack();
		});
		this.scrollView.sequenceFrom(this.deck);
	};

	SprintActivityView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
	};

	SprintActivityView.prototype.preShow = function(state) {
		if (!state || !state.hash) {
			return false;
		}
		this.hash = state.hash;
		this.name = state.name;
		this.parentPage = state.parentPage || 'FeedView';
		this.fetchDiscussions({sprintHash: this.hash, max: 5, offset: 0});
		return true;
	};

	function addListItemsToScrollView(listItems) {
		if (!listItems) {
			this.itemsAvailable = false;
			console.log('no more items available');
			return;
		}
		listItems.forEach(function(item) {
			var discussionCardView = new DiscussionCardView(item, 'SprintActivityView');
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
	};

	App.pages['SprintActivityView'] = SprintActivityView;
	module.exports = SprintActivityView;
});
