define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Timer = require('famous/utilities/Timer');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var FastClick = require('famous/inputs/FastClick');
	var LoginTemplate = require('text!templates/login.html');
	var User = require('models/User');
	var u = require('util/Utils');

	function LoginView() {
		BaseView.apply(this, arguments);
		_createView.call(this);
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
			size: [undefined, 270],
			content: _.template(template, this.options, templateSettings),
			properties: {
				backgroundColor: 'white'
			}
		});

		this.loginSurface.on('click', function(e) {
			var classList;
			if (e instanceof CustomEvent) {
				classList = e.srcElement.classList;

				if (_.contains(classList, 'btn')) {
					console.log("Submit login");
					this.submit();
				} else if (_.contains(classList, 'create-account')) {
					console.log("Show create-account form");
					this._eventOutput.emit('create-account');
				} else if (_.contains(classList, 'forgot-password')) {
					console.log("otherLinksSurface forgot password");
					this._eventOutput.emit('forgot-password');
				}
			}
		}.bind(this));

		this.loginSurface.on('keydown', function (e) {
			if (e.keyCode == 13) {
				$(e.srcElement).blur();
				this.submit();
			}
		}.bind(this));
		
		this.on('on-show', function() {
			var inputElement = document.getElementById("username");
			inputElement.focus();
		}.bind(this));

		this.setBody(this.loginSurface);
		this.setHeaderLabel('LOGIN');
	}

	LoginView.prototype.submit = function() {
		var currentUser = new User();
		var username = document.forms["loginForm"]["username"].value;
		var password = document.forms["loginForm"]["password"].value;
		if (!username){
			u.showAlert("Username is a required field!");
		} else if (!password){
			u.showAlert("Password is a required field!");
		} else {
			currentUser.login(
				username,
				password,
				function(user) {
					window.App.currentUser = user;
					console.log('LoginView: login success');
					this._eventOutput.emit('login-success');
				}.bind(this)
			)
		}
	};

	module.exports = LoginView;
});
