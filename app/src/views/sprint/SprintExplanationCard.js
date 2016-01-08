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
	var sprintExplanationTemplate = require('text!templates/experiment-explanation-card.html');
	var PeopleDetailView = require('views/people/PeopleDetailView');
	var User = require('models/User');
	var u = require('util/Utils');

	function SprintExplanationCardView() {
		CardView.apply(this, arguments);
		createCard.call(this);
	}

	SprintExplanationCardView.prototype = Object.create(CardView.prototype);
	SprintExplanationCardView.prototype.constructor = SprintExplanationCardView;

	SprintExplanationCardView.DEFAULT_OPTIONS = {};

	function createCard() {
		this.cardSurface = new Surface({
			size: [undefined, true],
			content: _.template(sprintExplanationTemplate, templateSettings),
			properties: {
				backgroundColor: '#efefef',
				padding: '10px 10px 10px 10px'
			}
		});

		this.cardSurface.on('click', function (e) {
			var classList;
			if (e instanceof CustomEvent) {
				classList = e.srcElement.classList;
				App.pageView.getCurrentView()._eventOutput.emit('close-explanation', this);
			}
		}.bind(this));

		this.add(this.cardSurface);
	};

	module.exports = SprintExplanationCardView;
});

