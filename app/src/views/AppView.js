/*** AppView.js ***/

define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var PageView = require('views/PageView');

	function AppView() {
		View.apply(this, arguments);
		this.menuToggle = false;
		_createPageView.call(this);
		_setListeners.call(this);
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
		this.pageModifier = new StateModifier();

		this.add(this.pageModifier).add(this.pageView);
	}

	function _setListeners() {
		this.pageView.on('menuToggle', function() {
			this.toggleMenu();
		}.bind(this));
	}

	AppView.prototype.toggleMenu = function() {
		if (this.menuToggle) {
			this.slideLeft();
		} else {
			this.slideRight();
		}
		this.menuToggle = !this.menuToggle;
	};

	AppView.prototype.slideRight = function() {
        this.pageModifier.setTransform(Transform.translate(this.options.openPosition, 0, 0), this.options.transition);
	};

	AppView.prototype.slideLeft = function() {
        this.pageModifier.setTransform(Transform.translate(0, 0, 0), this.options.transition);
	};

	module.exports = AppView;
});
