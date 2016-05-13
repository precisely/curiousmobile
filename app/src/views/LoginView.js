define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var FastClick = require('famous/inputs/FastClick');
	var LoginTemplate = require('text!templates/login.html');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var User = require('models/User');
	var Discussion = require('models/Discussion');
	var u = require('util/Utils');
	var push = require('util/Push');

	function LoginView() {
		BaseView.apply(this, arguments);
		_createView.call(this);
		this.parentPage = 'HomeView';
	}

	LoginView.prototype = Object.create(BaseView.prototype);
	LoginView.prototype.constructor = LoginView;

	LoginView.DEFAULT_OPTIONS = {
		header: true,
		footer: false,
		backButton: true,
	};

	function _createView(argument) {
		var template = LoginTemplate;
		this.loginSurface = new Surface({
			size: [undefined, undefined],
			content: _.template(template, this.options, templateSettings),
			properties: {
				backgroundColor: 'white'
			}
		});

		this.loginSurface.on('click', function(e) {
			var classList;
			classList = e.srcElement.classList;

			if (_.contains(classList, 'btn')) {
				console.log("Submit login");
				this.submit();
			} else if (_.contains(classList, 'create-account')) {
				console.log("Show create-account form");
				App.pageView.changePage('RegisterView');
			} else if (_.contains(classList, 'forgot-password')) {
				console.log("otherLinksSurface forgot password");
				App.pageView.changePage('ForgotPasswordView');
			}
		}.bind(this));

		this.loginSurface.on('keydown', function(e) {
			if (e.keyCode == 13) {
				$(e.srcElement).blur();
				this.submit();
			}
		}.bind(this));

		this.add(new StateModifier({transform: Transform.translate(0, 64, App.zIndex.readView)})).add(this.loginSurface);
		this.setHeaderLabel('LOGIN');
	}

	LoginView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		App.pageView.history = ['HomeView'];
		var inputElement = document.getElementById("username");
		inputElement.focus();
	};

//	LoginView.prototype.getCurrentState = function() {

//	};

	LoginView.prototype.submit = function() {
		var currentUser = new User();
		var username = document.forms["loginForm"]["username"].value;
		var password = document.forms["loginForm"]["password"].value;
		if (!username) {
			u.showAlert("Username is a required field!");
		} else if (!password) {
			u.showAlert("Password is a required field!");
		} else {
			currentUser.login(
				username,
				password,
				function(user) {
					window.App.currentUser = user;
					console.log('LoginView: login success');
					Discussion.getNewNotificationCount(function(data) {
						App.setNotificationCount(data.totalNotificationCount);
					});
					App.pageView.changePage('TrackView', { onLoad: true });
					push.register();
				}.bind(this)
			)
		}
	};

	App.pages[LoginView.name] = LoginView;
	module.exports = LoginView;
});
