define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Transform = require('famous/core/Transform');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var Draggable = require("famous/modifiers/Draggable");
	var StateView = require('views/StateView');
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var Draggable = require("famous/modifiers/Draggable");
	var PeopleDetailsTemplate = require('text!templates/people-details.html');
	var User = require('models/User');
	var u = require('util/Utils');

	function PeopleDetailView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'FeedView';

		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#fff',
				zIndex: 5
			}
		});
		this.setBody(this.backgroundSurface);

		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height - 120],
			transform: Transform.translate(0, 64, 16)
		});

		this.add(mod).add(this.renderController);
	}

	PeopleDetailView.prototype = Object.create(BaseView.prototype);
	PeopleDetailView.prototype.constructor = PeopleDetailView;

	PeopleDetailView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
	};

	PeopleDetailView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
	};

	PeopleDetailView.prototype.preShow = function(state) {
		if (!state || !state.hash) {
			return false;
		}
		this.hash = state.hash;
		this.refresh();
		return true;
	};

	PeopleDetailView.prototype.refresh = function() {
		User.show(this.hash, function(peopleDetails) {
			var peopleSurface = new Surface({
				size: [undefined, undefined],
				content: _.template(PeopleDetailsTemplate, peopleDetails, templateSettings),
				properties: {

				}
			});

			var yRange = Math.max(0, (800 - App.height));
			var lastDraggablePosition = 0;

			var draggable = new Draggable({
				xRange: [0, 0],
				yRange: [-1500, 0]
			});

			draggable.subscribe(peopleSurface);

			draggable.on('end', function(e) {
				console.log(e);
				var newYRange = Math.max(0, (document.getElementsByClassName('people-detail')[0].offsetHeight - (App.height - 114)));
				if (e.position[1] < lastDraggablePosition) {
					this.setPosition([0, -newYRange, 0], {
						duration: 300
					}, function() {
						lastDraggablePosition = this.getPosition()[1];
					}.bind(this));
				} else if (e.position[1] != lastDraggablePosition) {
					this.setPosition([0, 0, 0], {
						duration: 300
					}, function() {
						lastDraggablePosition = this.getPosition()[1];
					}.bind(this));
				}
			});

			var nodePlayer = new RenderNode();
			nodePlayer.add(draggable).add(peopleSurface);
			this.renderController.show(nodePlayer);
		}.bind(this), function() {
			App.pageView.goBack();
		}.bind(this));
	};

	App.pages['PeopleDetailView'] = PeopleDetailView;
	module.exports = PeopleDetailView;
});
