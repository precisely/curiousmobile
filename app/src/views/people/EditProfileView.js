define(function(require, exports, module, store) {
	'use strict';
	var BaseView = require('views/BaseView');
	var Engine = require('famous/core/Engine');
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Transform = require('famous/core/Transform');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var Draggable = require("famous/modifiers/Draggable");
	var StateView = require('views/StateView');
	var DraggableView = require("views/widgets/DraggableView");
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var FixedRenderNode = require('util/FixedRenderNode');
	var EditUserProfileTemplate = require('text!templates/edit-user-profile.html');
	var AddInterestTagView = require('views/people/AddInterestTagView');
	var UpdateAvatarView = require('views/people/UpdateAvatarView');
	var InterestTagView = require('views/people/InterestTagView');
	var Timer = require('famous/utilities/Timer');
	var User = require('models/User');
	var u = require('util/Utils');

	function EditProfileView() {
		BaseView.apply(this, arguments);
		this.headerBackgroundSurface.setProperties({
			background: 'rgb(241, 83, 69)'
		});
		this.parentPage = 'FeedView';
		this.addInterestTagView = new AddInterestTagView(this);
		this.UpdateAvatarView = new UpdateAvatarView(this);
		Engine.on('click', onTap.bind(this));
		jQuery.fn.serializeObject = function() {
			var params = {};
			$(this).serializeArray().map(function(x) {params[x.name] = x.value;});
			return params;
		}


		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height - 120],
			transform: Transform.translate(0, 64, App.zIndex.readView)
		});

		this.add(mod).add(this.renderController);
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				background: '-webkit-linear-gradient(top,  #f14d43 0%,#f48157 100%)'
			}
		});
		this.add(new StateModifier({translate: Transform.translate(0, 0, 0)})).add(backgroundSurface);
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
		this.showProfile(
			function() {
				if (state.lastDraggedPosition) {
					this.draggableView.setPosition([0, state.lastDraggedPosition, 0])
				}
			}.bind(this)
		);
		if (state.message) {
			u.showAlert(state.message);
		}
		return true;
	};

	EditProfileView.prototype.showAddInterestTagForm = function() {
		this.showBackButton();
		this.setHeaderLabel('');
		this.interestTagFormVisible = true;
		this.showOverlayContent(this.addInterestTagView, function() {
			console.log('overlay successfully created');
		}.bind(this.addInterestTagView));
	}

	EditProfileView.prototype.killOverlayContent = function () {
		this.killInterestTagsForm();
	};

	EditProfileView.prototype.killInterestTagsForm = function(state) {
		this.addInterestTagView.clearForm();
		BaseView.prototype.killOverlayContent.call(this);
		console.log("overlay killed");
		this.interestTagFormVisible = false;
		this.showMenuButton();
		this.showBackButton();
		this.setHeaderLabel('EDIT PROFILE', '#fff');
		state = state || this.getCurrentState();
		state.lastDraggedPosition = this.draggableView.getPosition()[1];
		this.preShow(state);
	}

	EditProfileView.prototype.getCurrentState = function (argument) {
		return {
			hash: this.hash
		}
	}
	EditProfileView.prototype.showProfileUpdateForm = function() {
		this.showBackButton();
		this.setHeaderLabel('');
		this.setRightIcon('');
		this.showOverlayContent(this.UpdateAvatarView, function() {
			console.log('overlay successfully created');
		}.bind(this.UpdateAvatarView));
	}

	EditProfileView.prototype.showProfile = function( callback) {
		User.show(this.hash, function(peopleDetails) {
			peopleDetails.user.userID = User.getCurrentUserId();

			this.editProfileContainerSurface = new ContainerSurface({
				size: [undefined, true],
				properties: {
					padding: '5px 20px'
				}
			});
			var editPeopleSurface = new Surface({
				size: [undefined, true],
				content: _.template(EditUserProfileTemplate, peopleDetails, templateSettings),
			});

			this.saveSurface = new Surface({
				size: [90, 64],
				content: 'SAVE',
				properties: {
					fontSize: '15px',
					fontWeight: 'normal',
					color: '#FFF',
					textAlign: 'center',
					padding: '20px'
				}
			});

			this.setHeaderLabel('EDIT PROFILE', '#FFF');
			this.add(new Modifier({align: [1, 0], origin: [1, 0], transform: Transform.translate(0, 0, App.zIndex.header + 5)})).add(this.saveSurface);

			this.saveSurface.on('click', function(e) {
				if (e instanceof CustomEvent) {
					if (this.currentOverlay) {
						if (this.interestTagFormVisible) {
							this.addInterestTagView.submit();
						} else {
							u.showAlert('Tap upload to finish uploading.');
						}
					} else {
						this.saveProfile(peopleDetails);
					}
				}
			}.bind(this));

			this.submitSurface = new Surface({
				content: '<button type="button" class="full-width-button create-entry-button">Update Profile</button>',
			});
			this.submitButtonModifier = new StateModifier({
				size: [App.width - 40, undefined],
				transform: Transform.translate(30, 1280, App.zIndex.readView + 72)
			});
			this.editProfileContainerSurface.add(this.submitButtonModifier).add(this.submitSurface);

			this.submitSurface.on('click', function(e) {
				if (e instanceof CustomEvent) {
					this.saveProfile(peopleDetails);
				}
			}.bind(this));

			editPeopleSurface.on('click', function(e) {
				var classList;
				if (e instanceof CustomEvent) {
					classList = e.srcElement.classList;
					this.editPeopleSurface = editPeopleSurface;
					if (_.contains(classList, 'new-tag')) {
						this.showAddInterestTagForm();
					} else if (_.contains(classList, 'choose-image')) {
						this.showProfileUpdateForm();
					} else if (_.contains(classList, 'link-withings')) {
						u.oauththirdparty('registerwithings');
					} else if (_.contains(classList, 'link-moves')) {
						u.oauththirdparty('registermoves');
					} else if (_.contains(classList, 'link-fitbit')) {
						u.oauththirdparty('registerfitbit');
					} else if (_.contains(classList, 'link-jawbone')) {
						u.oauththirdparty('registerJawboneUp');
					} else if (_.contains(classList, 'link-twenty3andMe')) {
						u.oauththirdparty('register23andme');
					} else if (_.contains(classList, 'unlink-moves')) {
						u.oauththirdparty('unregistermoves');
					} else if (_.contains(classList, 'unlink-withings')) {
						u.oauththirdparty('unregisterwithings');
					} else if (_.contains(classList, 'unlink-fitbit')) {
						u.oauththirdparty('unregisterfitbit');
					} else if (_.contains(classList, 'unlink-jawbone')) {
						u.oauththirdparty('unregisterJawboneUp');
					} else if (_.contains(classList, 'link-oura')) {
						u.oauththirdparty('registerOura');
					} else if (_.contains(classList, 'unlink-oura')) {
						u.oauththirdparty('unregisterOura');
					}
				} else {
					e.stopPropagation();
				}
			}.bind(this));

			editPeopleSurface.on('keyup', function(e) {
				var inputType = e.srcElement.type;
				if ((e.which === 13) && (inputType === 'text' || inputType === 'textarea' || inputType === 'password' || inputType === "radio")) {
					cordova.plugins.Keyboard.close();
				}
			}.bind(this));

			//interestTagSurface(peopleDetails.user.interestTags);
			this.tagList = [];
			this.tagSequentialLayout = new SequentialLayout({
				direction: 1,
				itemSpacing: 40,
				defaultItemSize: [undefined, 24],
			});
			_.each(peopleDetails.user.interestTags, function(tag) {
				var tagView = new InterestTagView({entry: tag});
				var draggableTag = new Draggable({
					xRange: [-100, 0],
					yRange: [0, 0],
				});

				draggableTag.subscribe(tagView.entrySurface);
				var draggableNode = new RenderNode();
				draggableNode.add(draggableTag).add(tagView);
				this.tagList.push(draggableNode);
			}.bind(this));
			this.tagSequentialLayout.sequenceFrom(this.tagList);
			this.editProfileContainerSurface.add(new StateModifier({transform: Transform.translate(0, 0, 0)})).add(editPeopleSurface);
			this.editProfileContainerSurface.add(new StateModifier({transform: Transform.translate(0, 1240, 0)})).add(this.tagSequentialLayout);

			// Calculating draggable container height according to the taglist height
			this.draggableView = new DraggableView(this.editProfileContainerSurface, true, 1030 + (this.tagList.length * 50));
			this.submitButtonModifier.setTransform(Transform.translate(0, (1330 + this.tagList.length * 40),  App.zIndex.readView + 62));
			this.renderController.show(this.draggableView);
			if (callback) {
				callback();
			}
		}.bind(this), function() {
			App.pageView.goBack();
		}.bind(this));


	};

	function onTap(event) {
		var inputType;
		if (u.isAndroid() || (event instanceof CustomEvent)) {
			inputType = event.srcElement.type;
			if (inputType === 'text' || inputType === 'textarea' || inputType === 'password' || inputType === "radio") {
				event.srcElement.focus();
			}
		}
	}

	EditProfileView.prototype.saveProfile = function(peopleDetails) {
		var formData = $('#userDetailsEdit').serializeObject();
		formData.id = peopleDetails.user.hash;
		if ((formData.username !== peopleDetails.user.username) && !formData.password) {
			u.showAlert('If you change the username, you must set the password as well');
			return;
		}
		if (formData.password && !formData.oldPassword) {
			u.showAlert('You need to enter old password to set new password');
			return;
		} else if (formData.password && (formData.password !== formData.verify_password)) {
			u.showAlert('New password and verify password fields do not match');
			return;
		}
		User.update(formData, function (state) {
			App.pageView.changePage('PeopleDetailView', state);
			App.pageView.history.pop();
		});
	}

	App.pages['EditProfileView'] = EditProfileView;
	module.exports = EditProfileView;
});
