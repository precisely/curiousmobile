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
	var peopleTemplate = require('text!templates/people.html');
	var PeopleDetailView = require('views/people/PeopleDetailView');
	var u = require('util/Utils');

	function PeopleCardView(user) {
		CardView.apply(this, arguments);
		this.user = user;
		createCard.call(this);
	}

	PeopleCardView.prototype = Object.create(CardView.prototype);
	PeopleCardView.prototype.constructor = PeopleCardView;

	PeopleCardView.DEFAULT_OPTIONS = {
	};

	function createCard() {
		var prettyDate = u.prettyDate(new Date(this.user.updated));
		this.user.updated = prettyDate;
		this.cardSurface = new Surface({
			size: [undefined, true],
			content: _.template(peopleTemplate, this.user, templateSettings),
			properties: {
				padding: '10px'
			}
		});

		this.cardSurface.on('click', function(e) {
			var classList;
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'follow')) {
				} else {
					var state = {
						hash: this.user.hash
					};
					App.pageView.changePage('PeopleDetailView', state);
				}
			}
		}.bind(this));

		this.add(this.cardSurface);
	};

	module.exports = PeopleCardView;
});

