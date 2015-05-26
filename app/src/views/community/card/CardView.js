define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var FastClick = require('famous/inputs/FastClick');
	var StateView = require('views/StateView');
	var u = require('util/Utils');

	function CardView() {
		StateView.apply(this, arguments);
		this.cardSurface;
	}

	CardView.prototype = Object.create(StateView.prototype);
	CardView.prototype.constructor = CardView;

	CardView.DEFAULT_OPTIONS = {
	};

 	CardView.prototype.setScrollView = function (scrollView) {
 		this.scrollView = scrollView;
 		this.cardSurface.pipe(this.scrollView);
 	}

	module.exports = CardView;
});

