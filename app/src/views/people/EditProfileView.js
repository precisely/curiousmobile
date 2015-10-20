define(function(require, exports, module) {
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
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var Draggable = require("famous/modifiers/Draggable");
	var EditUserProfileTemplate = require('text!templates/edit-user-profile.html');
	var AddInterestTagView = require('views/people/AddInterestTagView');
    var UpdateAvatarView = require('views/people/UpdateAvatarView');
    var InterestTagView = require('views/people/InterestTagView');
	var User = require('models/User');
	var u = require('util/Utils');

	function EditProfileView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'FeedView';
		this.addInterestTagView = new AddInterestTagView(this);
        this.UpdateAvatarView = new UpdateAvatarView(this);
        this.InterestTagView = new InterestTagView(this);
        Engine.on('click', onTap.bind(this));

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
			webkitFilter: 'blur(0px)',
			filter: 'blur(0px)'
		});
		this.showBackButton();
		this.setHeaderLabel('');
        //this.setRightIcon('SAVE');
		this.showOverlayContent(this.addInterestTagView, function() {
			console.log('overlay successfully created');
		}.bind(this.addInterestTagView));
	}

    EditProfileView.prototype.killOverlayContent = function () {
        this.killEntryForm();
    };

    EditProfileView.prototype.killEntryForm = function(state) {
        this.editPeopleSurface.setProperties({
            webkitFilter: 'blur(0px)',
            filter: 'blur(0px)'
        });
        BaseView.prototype.killOverlayContent.call(this);
        console.log("overlay killed");
        this.showMenuButton();
        this.showBackButton();
        this.setHeaderLabel('EDIT PROFILE');
        //this.setRightIcon('SAVE');
        this.preShow(state);
    }

    EditProfileView.prototype.showProfileUpdateForm = function() {
        this.editPeopleSurface.setProperties({
            webkitFilter: 'blur(0px)',
            filter: 'blur(0px)'
        });
        this.showBackButton();
        this.setHeaderLabel('');
        this.setRightIcon('');
        this.showOverlayContent(this.UpdateAvatarView, function() {
            console.log('overlay successfully created');
        }.bind(this.UpdateAvatarView));
    }

    EditProfileView.prototype.addInterestTagSurface = function(tag) {
        var tagView = new InterestTagView(tag);
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

            this.saveSurface = new Surface({
                size: [window.innerWidth - 250, 64],
                content: 'SAVE',
                properties: {
                    fontSize: '15px',
                    fontWeight: 'normal',
                    color: '#F14A42',
                    textAlign: 'center',
                    padding: '21px 0'
                }
            });

            this.setHeaderLabel('EDIT PROFILE');
            this.setRightIcon(this.saveSurface);

            this.saveSurface.on('click', function(e) {
                if (u.isAndroid() || (e instanceof CustomEvent)) {
                    if (this.currentOverlay) {
                        var tagName = $('#tagName').serializeObject();
                        var userHash = peopleDetails.user.hash;
                        User.addInterestTags(tagName, userHash, function (state) {
                            App.pages.EditProfileView.prototype.killOverlayContent();
                            App.pageView.changePage('EditProfileView', state);
                        });
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
                if (u.isAndroid() || (e instanceof CustomEvent)) {
                    classList = e.srcElement.classList;
                    if (_.contains(classList, 'new-tag')) {
                        this.editPeopleSurface = editPeopleSurface;
                        this.showAddInterestTagForm();
                    } else if (_.contains(classList, 'delete-tag')) {
                        var tagName = $('#tagName').serializeObject();
                        var userHash = peopleDetails.user.hash;
                        User.addInterestTags(tagName, userHash, function (state) {
                          App.pages.EditProfileView.prototype.killOverlayContent();
                         App.pageView.changePage('EditProfileView', state);
                        });
                    } else if (_.contains(classList, 'choose-image')) {
                      this.editPeopleSurface = editPeopleSurface;
                      this.showProfileUpdateForm();
                 }
            }
			}.bind(this));

            //interestTagSurface(peopleDetails.user.interestTags);

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

/*    function interestTagSurface(interestTags) {
        _.forEach(interestTags, function (tag) {
            this.addInterestTagSurface(tag);
        }.bind(this));
    }*/

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
