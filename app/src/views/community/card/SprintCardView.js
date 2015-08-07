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
	var SprintTemplate = require('text!templates/sprint.html');
	var SprintDetailView = require('views/sprint/SprintDetailView');
	var SprintActivityView = require('views/sprint/SprintActivityView');
	var u = require('util/Utils');

	function SprintCardView(sprint) {
		CardView.apply(this, arguments);
		this.sprint = sprint;
		createCard.call(this);
	}

	SprintCardView.prototype = Object.create(CardView.prototype);
	SprintCardView.prototype.constructor = SprintCardView;

	SprintCardView.DEFAULT_OPTIONS = {
		cardHeight: '300px'
	};

	function createCard() {
		this.cardSurface = new Surface({
			size: [undefined, true],
			content: _.template(SprintTemplate, this.sprint, templateSettings),
			properties: {
				padding: '10px'
			}
		});

		this.cardSurface.on('click', function(e) {
			var classList;
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'details')) {
					var state = {
						hash: this.sprint.hash,
						name: this.sprint.name
					};
					App.pageView.changePage('SprintDetailView', state);
				} else if (_.contains(classList, 'activity')) {
					var state = {
						hash: this.sprint.hash,
						name: this.sprint.name
					};
					App.pageView.changePage('SprintActivityView', state);
				}
			}
		
		}.bind(this));

		this.add(this.cardSurface);
	};

	module.exports = SprintCardView;
});

