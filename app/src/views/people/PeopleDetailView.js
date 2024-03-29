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
	var ProfileDetailsTemplate = require('text!templates/user-profile.html');
	var PeopleDetailsTemplate = require('text!templates/people-details.html');
	var User = require('models/User');
	var u = require('util/Utils');
	var EditUserView = require('views/people/EditProfileView');
	var Scrollview = require('famous/views/Scrollview');
	var Utility = require('famous/utilities/Utility');

	function PeopleDetailView() {
		BaseView.apply(this, arguments);
		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
		});

		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height - 120],
			transform: Transform.translate(0, 64, 16)
		});

		this.add(mod).add(this.renderController);
		this.add(new StateModifier({transform: Transform.translate(0, 0, 0)})).add(this.backgroundSurface);
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
		this.saveState();
	};

	PeopleDetailView.prototype.preShow = function(state) {
		if (state && state.onLoad) {
			setTimeout(function() {
				App.pageView.changePage('FeedView');
			}, 50);
			return false;
		}
		if (!state || !state.hash) {
			return false;
		}
		this.hash = state.hash;
		this.showProfile();
		return true;
	};

	PeopleDetailView.prototype.getCurrentState = function() {
		return {
			hash: this.hash
		};
	};
	
	PeopleDetailView.prototype.goBack = function() {
		BaseView.prototype.goBack.call(this, {lable: 'PEOPLE'});
	};

	PeopleDetailView.prototype.showProfile = function() {
		User.show(this.hash, function(peopleDetails) {
			this.setHeaderLabel(peopleDetails.user.name);
			var profileTemplate = PeopleDetailsTemplate;
			peopleDetails.user.bio = u.parseNewLine(peopleDetails.user.bio);
			this.backgroundSurface.setProperties({
				background: '#fff'
			});
			if (peopleDetails.user.id == User.getCurrentUserId()) {
				profileTemplate = ProfileDetailsTemplate;
				this.backgroundSurface.setProperties({
					background: '-webkit-linear-gradient(top,  #f14d43 0%, #f48157 100%)'
				});
			}

			peopleDetails.user.buttonLabel = peopleDetails.user.followed ? 'UNFOLLOW' : 'FOLLOW';
			var parsedTemplate = _.template(profileTemplate, peopleDetails, templateSettings);
			var peopleSurface = new Surface({
				size: [undefined, true],
				content: parsedTemplate
			});

			peopleSurface.on('click', function(e) {
				var classList;
				if (e instanceof CustomEvent) {
					classList = e.srcElement.classList;
					if (_.contains(classList, 'edit-button')) {
						var state = {
							hash: this.hash
						};
						App.pageView.changePage('EditProfileView', state);
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
					} else if (_.contains(classList, 'email-link')) {
						User.sendVerificationLink();
					} else if (e.srcElement.id === 'FOLLOW') {
						User.follow({id: peopleDetails.user.hash}, function (data) {
							e.srcElement.innerText = 'UNFOLLOW';
							e.srcElement.id === 'UNFOLLOW'
						});
					} else if (e.srcElement.id === 'UNFOLLOW') {
						User.follow({id: peopleDetails.user.hash, unfollow: true}, function (data) {
							e.srcElement.innerText = 'FOLLOW';
							e.srcElement.id === 'FOLLOW'
						});
					}
				}
			}.bind(this));

			this.scrollableDetailsView = new Scrollview({
				direction: Utility.Direction.Y
			});
		
			var spareSurface = new Surface({
				size: [undefined, 10]
			});
		
			this.scrollableDetailsView.sequenceFrom([peopleSurface, spareSurface]);
		
			peopleSurface.pipe(this.scrollableDetailsView);
			spareSurface.pipe(this.scrollableDetailsView);

			this.renderController.show(this.scrollableDetailsView);
		}.bind(this), function() {
			App.pageView.goBack();
		}.bind(this));
	};

	App.pages['PeopleDetailView'] = PeopleDetailView;
	module.exports = PeopleDetailView;
});
