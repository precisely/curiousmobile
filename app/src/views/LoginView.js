define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var LoginTemplate = require('text!templates/login.html');
	var User = require('models/User');

	function LoginView() {
		View.apply(this, arguments);
		_createView.call(this);
	}

	LoginView.prototype = Object.create(View.prototype);
	LoginView.prototype.constructor = LoginView;

	LoginView.DEFAULT_OPTIONS = {};

	function _createView(argument) {
		var template = LoginTemplate;
		var loginSurface = new Surface({
			content: _.template(template, this.options, templateSettings)
		});

		loginSurface.on('click', function(e) {
			var classList;
			if (e.srcElement.localName == 'a' || e.srcElement.localName == 'button') {
				classList = e.srcElement.classList;
			} else {
				classList = e.srcElement.parentElement.classList;
			}
			if (_.contains(classList, 'submit')) {
				console.log("Submit login");
				this.submit();
			} else if (_.contains(classList, 'create-account')) {
				console.log("Show create-account form");
				this._eventOutput.emit('create-account');
			} else if (_.contains(classList, 'forgot-password')) {
				console.log("otherLinksSurface forgot password");
				this._eventOutput.emit('forgot-password');
			}
		}.bind(this));

		loginSurface.on('keydown', function (e) {
			if (e.keyCode == 13) {
				this.submit();
			}
		}.bind(this));
		this.add(loginSurface);
	}

	LoginView.prototype.submit = function() {
		var currentUser = new User();
		var username = document.forms["loginForm"]["username"].value;
		var password = document.forms["loginForm"]["password"].value;
		currentUser.login(
				username,
				password,
				function(user) {
					window.App.currentUser = user;
					console.log('LoginView: login success');
					this._eventOutput.emit('login-success');
				}.bind(this)
		)
	};

	module.exports = LoginView;
});
