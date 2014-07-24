define(function(require, exports, module) {
	var View = require('famous/core/View'),
		Surface = require('famous/core/Surface'),
		Transform = require('famous/core/Transform'),
		StateModifier = require('famous/modifiers/StateModifier'),
		Timer = require('famous/utilities/Timer'),
		Easing = require('famous/transitions/Easing'),
		MenuItem = require('views/MenuItemView');

	var Scrollview = require("famous/views/Scrollview");


	function MenuView() {
		View.apply(this, arguments);

		_createMenuItems.call(this);

	}

	MenuView.DEFAULT_OPTIONS = {
		menuData: {},
        angle: -0.2,
        menuItemWidth: 320,
        menuItemHeight: 54,
        topOffset: 0,
		menuItemOffset: 58,
        staggerDelay: 35,
        transition: {
            duration: 700,
            curve: 'easeOut'
        }
	};

	MenuView.prototype = Object.create(View.prototype);
	MenuView.prototype.constructor = MenuView;

	MenuView.prototype.resetMenuItems = function() {
		for (var i = 0; i < this.menuItemModifiers.length; i++) {
			var initX = -this.options.menuItemWidth;
			var initY = this.options.topOffset + this.options.menuItemOffset * i + this.options.menuItemWidth * Math.tan(-this.options.angle);

			this.menuItemModifiers[i].setTransform(Transform.translate(initX, initY, 0));
		}
	};

	MenuView.prototype.animateMenuItems = function() {
		this.resetMenuItems();

		var transition = this.options.transition;
		var delay = this.options.staggerDelay;
		var menuItemOffset = this.options.menuItemOffset;
		var topOffset = this.options.topOffset;

		for (var i = 0; i < this.menuItemModifiers.length; i++) {
			Timer.setTimeout(function(i) {
				var yOffset = topOffset + menuItemOffset * i;

				this.menuItemModifiers[i].setTransform(
					Transform.translate(0, yOffset, 0), transition);
			}.bind(this, i), i * delay);
		}
	};

	_createMenuItems = function() {
		// used in _animateMenuItems()
		this.menuItemModifiers = [];

		var yOffset = this.options.topOffset;

		for (var i = 0; i < this.options.menuData.length; i++) {

			var menuItem = new MenuItem({
				iconFont: this.options.menuData[i].iconFont,
				title: this.options.menuData[i].title
			});

			var menuItemModifier = new StateModifier({
				transform: Transform.translate(0, yOffset, 0)
			});

			this.menuItemModifiers.push(menuItemModifier);
			this.add(menuItemModifier).add(menuItem);

			yOffset += this.options.menuItemOffset;

		}

	};

	module.exports = MenuView;
});
