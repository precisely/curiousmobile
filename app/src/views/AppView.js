/*** AppView.js ***/

define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var PageView = require('views/PageView');
	var MenuView = require('views/MenuView');
	var	MenuData = require('data/MenuData');
	function AppView() {
		View.apply(this, arguments);
		this.menuToggle = false;
		_createPageView.call(this);
		_createMenuView.call(this);
	}

	AppView.prototype = Object.create(View.prototype);
	AppView.prototype.constructor = AppView;

	AppView.DEFAULT_OPTIONS = {
		openPosition: 276,
		transition: {
			duration: 300,
			curve: 'easeOut'
		}
	};

	function _createPageView() {
		this.pageView = new PageView();
		this.pageModifier = new StateModifier({
			size: [window.innerWidth, window.innerHeight]

		});

		this.add(this.pageModifier).add(this.pageView);
		_setListeners.call(this);
	}

	function _createMenuView() {
		this.menuView = new MenuView({ menuData: MenuData });
		this.menuView.on('logout', function(e) {
			console.log('AppView logout event');
		}.bind(this));
		this.menuView.pipe(this.pageView._eventOutput);

		var menuModifier = new StateModifier({
			transform: Transform.behind
		});

		this.add(menuModifier).add(this.menuView);
	}

	function _setListeners() {

		this.pageView.on('page-change-complete', function() {
			if (this.showingMenu) {
				this.toggleMenu();
			}
		}.bind(this));

		this.pageView.on('show-menu', function(e) {
			console.log('pageView event');
			this.toggleMenu();
		}.bind(this));

	}

	AppView.prototype.toggleMenu = function() {
		if (this.menuToggle) {
			this.slideLeft();
			this.menuView.resetMenuItems();
			this.showingMenu = false;
		} else {
			this.slideRight();
			this.menuView.animateMenuItems();
			this.showingMenu = true;
		}
		this.menuToggle = !this.menuToggle;
	};

	AppView.prototype.slideRight = function() {
		this.pageModifier.setTransform(Transform.translate(this.options.openPosition, 0, 0), this.options.transition);
	};

	AppView.prototype.slideLeft = function() {
		this.pageModifier.setTransform(Transform.translate(0, 0, 0), this.options.transition);
	};

	AppView.prototype.getSelectedDate = function () {
		this.pageView.trackView.getSelectedDate();
	}

	module.exports = AppView;
});
