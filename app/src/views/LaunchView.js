define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require('famous/views/RenderController');
	var Transitionable = require('famous/transitions/Transitionable');
	var Transform = require('famous/core/Transform');
	var Timer = require('famous/utilities/Timer');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var HomeView = require('views/HomeView');
	var LoginView = require('views/LoginView');
	var StateView = require('views/StateView');
	var RegisterView = require('views/RegisterView');
	var ForgotPasswordView = require('views/ForgotPasswordView');

	function LaunchView() {
		StateView.apply(this, arguments);
	}

	LaunchView.prototype = Object.create(StateView.prototype);
	LaunchView.prototype.constructor = LaunchView;

	LaunchView.DEFAULT_OPTIONS = {};

	function _setListeners() {
		this.on('login-success', function(data) {
			App.pageView.changeToLastPage();
		}.bind(this));

		this.on('registered', function(e) {
			App.pageView.changeToLastPage();
		}.bind(this));
	}
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

		this.homeView.on('create-account', function() {
			this.showView(this.registerView);
		}.bind(this));

		this.homeView.on('login', function() {
			this.showView(this.loginView);
		}.bind(this));

		this.loginView.on('login-success', function() {
			console.log('LaunchView: login success');
			this._eventOutput.emit('login-success');
		}.bind(this));

		this.loginView.on('go-back', function() {
			console.log('LaunchView: login success');
			this.showHome();
		}.bind(this));

		this.forgotPasswordView.on('cancel-forgot-password', function(e) {
			this.showView(this.loginView);
		}.bind(this));

		this.forgotPasswordView.on('password-reset', function(e) {
			this.showView(this.loginView);
		}.bind(this));

		this.forgotPasswordView.on('go-back', function() {
			console.log('LaunchView: ForgotPasswordView Go Back');
			this.showHome();
		}.bind(this));

		this.registerView.on('cancel-registration', function(e) {
			this.showHome();
		}.bind(this));

		this.registerView.on('go-back', function() {
			console.log('LaunchView: login success');
			this.showHome();
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
		this.renderController.hide({duration:0});
		this.renderController.show(view, {duration: 0});
		this.currentView = view;
		Timer.setTimeout(function(){
			this._eventOutput.emit('on-show');
		}.bind(view), 300);
	}
	App.pages[LaunchView.name] = LaunchView;
	module.exports = LaunchView;
});
