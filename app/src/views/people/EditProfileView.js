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
		this.showUserDetailsForm();
		if (state.message) {
			u.showAlert(state.message);
		}
		return true;
	};

	EditProfileView.prototype.showAddInterestTagForm = function() {
		this.showBackButton();
		this.setHeaderLabel('');
		this.showOverlayContent(this.addInterestTagView, function() {
			console.log('overlay successfully created');
		}.bind(this.addInterestTagView));
	}

	EditProfileView.prototype.killOverlayContent = function () {
		this.killInterestTagsForm();
	};

	EditProfileView.prototype.killInterestTagsForm = function(state) {
		BaseView.prototype.killOverlayContent.call(this);
		console.log("overlay killed");
		this.showMenuButton();
		this.showBackButton();
		this.setHeaderLabel('EDIT PROFILE', '#fff');
		this.preShow(state);
	}

	EditProfileView.prototype.showProfileUpdateForm = function() {
		this.showBackButton();
		this.setHeaderLabel('');
		this.setRightIcon('');
		this.showOverlayContent(this.UpdateAvatarView, function() {
			console.log('overlay successfully created');
		}.bind(this.UpdateAvatarView));
	}

	EditProfileView.prototype.showUserDetailsForm = function() {
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
				size: [window.innerWidth - 250, 64],
				content: 'SAVE',
				properties: {
					fontSize: '15px',
					fontWeight: 'normal',
					color: '#FFF',
					textAlign: 'center',
					padding: '21px 0'
				}
			});

			this.setHeaderLabel('EDIT PROFILE', '#FFF');
			this.add(new Modifier({align: [1, 0], origin: [1, 0], transform: Transform.translate(0, 0, App.zIndex.header + 5)})).add(this.saveSurface);

			this.saveSurface.on('click', function(e) {
				if (e instanceof CustomEvent) {
					if (this.currentOverlay) {
						this.addInterestTagView.submit();
					} else {
						var formData = $('#userDetailsEdit').serializeObject();
						formData.id = peopleDetails.user.hash;
						User.update(formData, function (state) {
							App.pageView.changePage('PeopleDetailView', state);
						});
					}
				}
			}.bind(this));

			editPeopleSurface.on('click', function(e) {
				var classList;
				if (e instanceof CustomEvent) {
					classList = e.srcElement.classList;
					this.editPeopleSurface = editPeopleSurface;
					if (_.contains(classList, 'new-tag')) {
						this.showAddInterestTagForm();
					} else if (_.contains(classList, 'delete-tag')) {
						var tagName = $('#tagName').serializeObject();
						var userHash = peopleDetails.user.hash;
						User.addInterestTags(tagName, userHash, function (state) {
							App.pages.EditProfileView.prototype.killOverlayContent();
							App.pageView.changePage('EditProfileView', state);
						});
					} else if (_.contains(classList, 'choose-image')) {
						this.showProfileUpdateForm();
					} else if (_.contains(classList, 'link-withings')) {
						cordova.InAppBrowser.open(App.serverUrl + '/home/registerwithings?mobileRequest=1&mobileSessionId=' + u.getMobileSessionId(), '_system');
					} else if (_.contains(classList, 'link-moves')) {
						cordova.InAppBrowser.open(App.serverUrl + '/home/registermoves?mobileRequest=1&mobileSessionId=' + u.getMobileSessionId(), '_system');
					} else if (_.contains(classList, 'link-fitbit')) {
						cordova.InAppBrowser.open(App.serverUrl + '/home/registerfitbit?mobileRequest=1&mobileSessionId=' + u.getMobileSessionId(), '_system');
					} else if (_.contains(classList, 'link-jawbone')) {
						cordova.InAppBrowser.open(App.serverUrl + '/home/registerjawbone?mobileRequest=1&mobileSessionId=' + u.getMobileSessionId(), '_system');
					} else if (_.contains(classList, 'link-twenty3andMe')) {
						cordova.InAppBrowser.open(App.serverUrl + '/home/register23andme?mobileRequest=1&mobileSessionId=' + u.getMobileSessionId(), '_system');
					} else if (_.contains(classList, 'unlink-moves')) {
						cordova.InAppBrowser.open(App.serverUrl + '/home/unregistermoves?mobileRequest=1&mobileSessionId=' + u.getMobileSessionId(), '_system');
					} else if (_.contains(classList, 'unlink-withings')) {
						cordova.InAppBrowser.open(App.serverUrl + '/home/unregisterwithings?mobileRequest=1&mobileSessionId=' + u.getMobileSessionId(), '_system');
					} else if (_.contains(classList, 'unlink-fitbit')) {
						cordova.InAppBrowser.open(App.serverUrl + '/home/unregisterfitbit?mobileRequest=1&mobileSessionId=' + u.getMobileSessionId(), '_system');
					} else if (_.contains(classList, 'unlink-jawbone')) {
						cordova.InAppBrowser.open(App.serverUrl + '/home/unregisterjawbone?mobileRequest=1&mobileSessionId=' + u.getMobileSessionId(), '_system');
					}
				} else {
					e.stopPropagation();
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
				var tagView = new InterestTagView(tag);
				var draggableTag = new Draggable( {
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
			this.editProfileContainerSurface.add(new StateModifier({transform: Transform.translate(0, 1280, 0)})).add(this.tagSequentialLayout);

			// Calculating draggable container height according to the taglist height
			var draggableView = new DraggableView(this.editProfileContainerSurface, true, 930 + (this.tagList.length * 50));
			this.renderController.show(draggableView);
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

	App.pages['EditProfileView'] = EditProfileView;
	module.exports = EditProfileView;
});
