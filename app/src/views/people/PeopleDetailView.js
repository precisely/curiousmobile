define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Transform = require('famous/core/Transform');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var DraggableView = require("views/widgets/DraggableView");
	var Modifier = require('famous/core/Modifier');
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
		activeMenu: 'feed'
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

			this.setHeaderLabel(peopleDetails.user.name);
			var peopleSurface = new Surface({
				size: [undefined, undefined],
				content: _.template(PeopleDetailsTemplate, peopleDetails, templateSettings),
				properties: {

				}
			});

			this.draggableDetailsView = new DraggableView(peopleSurface);
			this.renderController.show(this.draggableDetailsView);
		}.bind(this), function() {
			App.pageView.goBack();
		}.bind(this));
	};

	App.pages['PeopleDetailView'] = PeopleDetailView;
	module.exports = PeopleDetailView;
});
