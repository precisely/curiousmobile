define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require('famous/views/RenderController');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var LoginView = require('views/LoginView');
	var RegisterView = require('views/RegisterView');
	var ForgotPasswordView = require('views/ForgotPasswordView');


	function LaunchView() {
		View.apply(this, arguments);
		_createView.call(this);
	}

	LaunchView.prototype = Object.create(View.prototype);
	LaunchView.prototype.constructor = LaunchView;

	LaunchView.DEFAULT_OPTIONS = {};

	function _createView() {
		var containerSurface = new ContainerSurface({
			size: [window.innerWidth, window.innerHeight],
			properties: {
				backgroundColor: 'white'
			}
		});
		this.add(containerSurface);

		var logoSurface = new ImageSurface({
			size: [205, 230],
			content: 'content/images/logo.gif'
		});

		var logoModifier = new Modifier({
			origin: [0.5, 0.1],
		});

		var formModifier = new Modifier({
			origin: [0.5, 0.8],
		});
		this.add(logoModifier).add(logoSurface);
		this.renderController = new RenderController();
		this.add(formModifier).add(this.renderController);
		this.loginView = new LoginView();
		this.renderController.show(this.loginView);
		this.registerView = new RegisterView();
		this.forgotPasswordView = new ForgotPasswordView();

		this.loginView.on('forgot-password', function() {
			this.renderController.show(this.forgotPasswordView);
		}.bind(this));

		this.loginView.on('create-account', function() {
			this.renderController.hide();
			this.renderController.show(this.registerView);
		}.bind(this));

		this.loginView.on('login-success', function() {
			console.log('LaunchView: login success');
			this._eventOutput.emit('login-success');
		}.bind(this));

		this.forgotPasswordView.on('cancel-forgot-password', function(e) {
			this.renderController.show(this.loginView);
		}.bind(this));

		this.forgotPasswordView.on('password-reset', function(e) {
			this.renderController.show(this.loginView);
		}.bind(this));
		
		this.registerView.on('cancel-registration', function(e) {
			this.renderController.show(this.loginView);
		}.bind(this));

		this.registerView.on('registration-success', function(e) {
			console.log('LaunchView: registeration-success');
			this._eventOutput.emit('registered', e);
		}.bind(this));


	}

	module.exports = LaunchView;
});
