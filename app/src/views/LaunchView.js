define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require('famous/views/RenderController');
	var Transitionable = require('famous/transitions/Transitionable');
	var Transform = require('famous/core/Transform');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var HomeView = require('views/HomeView');
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
		this.renderController = new RenderController();
		this.add(this.renderController);
		this.homeView = new HomeView();
		this.loginView = new LoginView();
		this.showView(this.homeView);
		this.registerView = new RegisterView();
		this.forgotPasswordView = new ForgotPasswordView();
		
		this.loginView.on('forgot-password', function() {
			this.showView(this.forgotPasswordView);
		}.bind(this));

		this.loginView.on('create-account', function() {
			this.showView(this.registerView);
		}.bind(this));

		this.loginView.on('login-success', function() {
			console.log('LaunchView: login success');
			this._eventOutput.emit('login-success');
		}.bind(this));

		this.forgotPasswordView.on('cancel-forgot-password', function(e) {
			this.showView(this.loginView);
		}.bind(this));

		this.forgotPasswordView.on('password-reset', function(e) {
			this.showView(this.loginView);
		}.bind(this));

		this.registerView.on('cancel-registration', function(e) {
			this.showView(this.loginView);
		}.bind(this));

		this.registerView.on('registration-success', function(e) {
			console.log('LaunchView: registeration-success');
			this._eventOutput.emit('registered', e);
		}.bind(this));

		this.on('on-show', function(e){
			this.showHome();
		});

	}

	LaunchView.prototype.showLogin = function() {
		this.showView(this.loginView);	
	};

	LaunchView.prototype.showHome = function() {
		this.showView(this.homeView);	
	};

	LaunchView.prototype.showView = function(view){
		this.renderController.show(view);
		this.currentView = view;
	}

	module.exports = LaunchView;
});
