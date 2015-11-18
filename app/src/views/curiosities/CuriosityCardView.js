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

	function CuriosityCardView(templateProperties) {
		CardView.apply(this, arguments);
		this.templateProperties = templateProperties;
		createCard.call(this);
	}

	CuriosityCardView.prototype = Object.create(CardView.prototype);
	CuriosityCardView.prototype.constructor = CuriosityCardView;

	CuriosityCardView.DEFAULT_OPTIONS = {
	};

	function createCard() {
		this.cardSurface = new Surface({
			size: [undefined, true],
			content: _.template(CuriosityCardTemplate, this.templateProperties, templateSettings),
			properties: {
				padding: '10px'
			}
		});

		this.cardSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				var classList = e.srcElement.classList;
				if (_.contains(classList, 'bubble')) {
					var currentElement = e.srcElement;
					setNoiseOrSignal(currentElement);
				} else if (_.contains(classList, 'plot-curiosity-chart-image')) {
					e.preventDefault();
					e.stopPropagation();
					App.pageView.changePage('ChartView', {tagsByDescription: [this.templateProperties.description1,
						this.templateProperties.description2]});
				}
			}
		}.bind(this));

		this.add(this.cardSurface);
	};

	module.exports = CuriosityCardView;
});

