define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var StateView = require('views/StateView');
	var Scrollview = require('famous/views/Scrollview');
	var RenderController = require('famous/views/RenderController');
	var ContentsData = require('data/HelpContentData');
	var u = require('util/Utils');
	var BaseView = require('views/BaseView');

	function HelpContentsView() {
		BaseView.apply(this, arguments);
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#fff'
			}
		});
		this.add(new StateModifier({transform: Transform.translate(0, 0, 5)})).add(backgroundSurface);
		this.renderController = new RenderController();
		this.add(new StateModifier({size: [undefined, App.height - 200], transform: Transform.translate(0, 64, App.zIndex.footer - 1)})).add(this.renderController);
		this.setHeaderLabel('precise.ly Help');
		this.initScrollView();
		this.listContents();
	}

	HelpContentsView.prototype = Object.create(BaseView.prototype);
	HelpContentsView.prototype.constructor = HelpContentsView;

	HelpContentsView.DEFAULT_OPTIONS = {
		contentsData: ContentsData,
		noBackButton: true,
		header: true,
		footer:true
	};

	HelpContentsView.prototype.initScrollView = function() {
		this.scrollView = new Scrollview({
			direction: 1,
		});
		this.contentsSurfaceList = [];
		this.scrollView.sequenceFrom(this.contentsSurfaceList);
		this.renderController.show(this.scrollView);
	};

	HelpContentsView.prototype.listContents = function() {
		this.initScrollView();
		_.each(this.options.contentsData, function(content) {
			this.addItemsToList(content.title, content.destinationPage);
		}.bind(this));
	};

	HelpContentsView.prototype.addItemsToList = function(title, destinationPage) {
		var contentItemSurface = new Surface({
			size: [undefined, true],
			content: '<div class="help-item-bar"><p>' + title + '</p></div>',
			properties: {
				backgroundColor: '#f9f9f9',
				borderBottom: '1px solid #e1e1e1'
			}
		});
		contentItemSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				App.pageView.changePage(destinationPage);
			}
		}.bind(this));

		this.contentsSurfaceList.push(contentItemSurface);
		contentItemSurface.pipe(this.scrollView);
	};

	HelpContentsView.prototype.preShow = function() {
		this.listContents();
		return true;
	};

	App.pages[HelpContentsView.name] = HelpContentsView;
	module.exports = HelpContentsView;
});
