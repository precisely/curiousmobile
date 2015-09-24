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
	var EditUserProfileTemplate = require('text!templates/edit-user-profile.html');
	var AddInterestTagView = require('views/people/AddInterestTagView');
	var User = require('models/User');
	var u = require('util/Utils');

	function EditProfileView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'FeedView';
		this.addInterestTagView = new AddInterestTagView(this);

		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height - 120],
			transform: Transform.translate(0, 64, App.zIndex.readView)
		});

		this.add(mod).add(this.renderController);
	}

	EditProfileView.prototype = Object.create(BaseView.prototype);
	EditProfileView.prototype.constructor = EditProfileView;

	EditProfileView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		activeMenu: 'feed'
	};

	EditProfileView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
	};

	EditProfileView.prototype.preShow = function(state) {
		if (!state || !state.hash) {
			return false;
		}
		this.hash = state.hash;
		this.refresh();
		return true;
	};

	EditProfileView.prototype.showAddInterestTagForm = function() {
		this.editPeopleSurface.setProperties({
			webkitFilter: 'blur(20px)',
			filter: 'blur(20px)'
		});
		this.showBackButton();
		this.setHeaderLabel('');
		this.showOverlayContent(this.addInterestTagView, function() {
			console.log('overlay successfully created');
		}.bind(this.entryFormView));
	}

	EditProfileView.prototype.refresh = function() {
		User.show(this.hash, function(peopleDetails) {

			this.setHeaderLabel(peopleDetails.user.name);
			peopleDetails.user.userID = User.getCurrentUserId();
			var editPeopleSurface = new Surface({
				size: [undefined, undefined],
				content: _.template(EditUserProfileTemplate, peopleDetails, templateSettings),
				properties: {

				}
			});

			editPeopleSurface.on('click', function(e) {
                var classList;
                if (u.isAndroid() || (e instanceof CustomEvent)) {
                    classList = e.srcElement.classList;
                    if (_.contains(classList, 'new-tag')) {
                        this.editPeopleSurface = editPeopleSurface;
                        this.showAddInterestTagForm();
                    }
                }
			}.bind(this));

			var yRange = Math.max(0, (800 - App.height));
			var lastDraggablePosition = 0;

			var draggable = new Draggable({
				xRange: [0, 0],
				yRange: [-1500, 0]
			});

			draggable.subscribe(editPeopleSurface);

			draggable.on('end', function(e) {
				console.log(e);
				var newYRange = Math.max(0, (document.getElementsByClassName('edit-people-detail')[0].offsetHeight - (App.height - 114)));
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
			nodePlayer.add(draggable).add(editPeopleSurface);
			this.renderController.show(nodePlayer);
		}.bind(this), function() {
			App.pageView.goBack();
		}.bind(this));
	};

	App.pages['EditProfileView'] = EditProfileView;
	module.exports = EditProfileView;
});
