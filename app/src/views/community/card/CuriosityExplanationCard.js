define(function (require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var FastClick = require('famous/inputs/FastClick');
	var CardView = require('views/community/card/CardView');
	var curiosityExplanationTemplate = require('text!templates/curiosity-explanation-card.html');
	var PeopleDetailView = require('views/people/PeopleDetailView');
	var User = require('models/User');
	var u = require('util/Utils');

	function CuriosityExplanationCardView() {
		CardView.apply(this, arguments);
		createCard.call(this);
	}

	CuriosityExplanationCardView.prototype = Object.create(CardView.prototype);
	CuriosityExplanationCardView.prototype.constructor = CuriosityExplanationCardView;

	CuriosityExplanationCardView.DEFAULT_OPTIONS = {};

	function createCard() {
		this.cardSurface = new Surface({
			size: [undefined, true],
			content: _.template(curiosityExplanationTemplate, templateSettings),
			properties: {
				backgroundColor: '#efefef',
				padding: '10px 5px 40px 5px'
			}
		});

		this.cardSurface.on('click', function (e) {
			var classList;
			if (e instanceof CustomEvent) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'close') || _.contains(classList, 'fa')) {
					App.pageView.getCurrentView()._eventOutput.emit('close-explanation', this);
				}
			}
		}.bind(this));

		this.add(this.cardSurface);
	};

	module.exports = CuriosityExplanationCardView;
});

