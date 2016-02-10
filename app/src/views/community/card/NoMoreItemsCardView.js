define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var FastClick = require('famous/inputs/FastClick');
	var CardView = require('views/community/card/CardView');
	var CuriosityCardTemplate = require('text!templates/curiosity-card.html');
	var PeopleDetailView = require('views/people/PeopleDetailView');
	var u = require('util/Utils');

	function NoMoreItemsCardView() {
		CardView.apply(this, arguments);
		createCard.call(this);
	}

	NoMoreItemsCardView.prototype = Object.create(CardView.prototype);
	NoMoreItemsCardView.prototype.constructor = NoMoreItemsCardView;

	NoMoreItemsCardView.DEFAULT_OPTIONS = {
	};

	function createCard() {
		this.cardSurface = new Surface({
			size: [undefined, true],
			content: 'No more items',
			properties: {
				padding: '10px'
			}
		});

		this.add(this.cardSurface);
	};

	module.exports = NoMoreItemsCardView;
});

