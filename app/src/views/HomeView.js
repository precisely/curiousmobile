define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var HomeTemplate = require('text!templates/home.html');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var FastClick = require('famous/inputs/FastClick');
	var u = require('util/Utils');

	function HomeView() {
		BaseView.apply(this, arguments);
		this.createView();
	}

	HomeView.prototype = Object.create(BaseView.prototype);
	HomeView.prototype.constructor = HomeView;

	HomeView.DEFAULT_OPTIONS = {
		header: false,
		footer: false,
	};

	HomeView.prototype.createView = function() {
		//var transitionableHeight = new Transitionable(App.height);
		var backgroundSurface = new ImageSurface({
			content: 'content/images/final-splash.png'
		});
		var backgroundModifier = new Modifier({
			transform: Transform.translate(0, 0, 1)
		});

		backgroundModifier.sizeFrom(function () {
			return [App.width, App.height];
		});
		this.add(backgroundModifier).add(backgroundSurface);

		var logoSurface = new ImageSurface({
			size: [265, true],
			content: 'content/images/logo-long-white-font.png'
		});

		var logoModifier = new Modifier({
			origin: [1, 0],
			transform: Transform.translate(App.width - 30, 60, 5)
		});
		this.add(logoModifier).add(logoSurface);
		this.homeSurface = new Surface({
			classes: ['home'],
			size: [265, App.height - 160],
			content: _.template(HomeTemplate, {}, templateSettings),
			properties: {
			}
		});

		this.buttonSurface = new Surface({
			size: [undefined, 60],
			content: '<div class="home-buttons">' +
				'<button type="button" class="btn create-account">Sign Up</button><span class="vertical-bar"></span>' + 
				'<button type="button" class="btn login">Log In</button>' +
				'</div>',
		});

		this.buttonSurface.on('click', function(e) {
			console.log('EventHandler: this.homeSurface.on event: click');
			if (!u.isAndroid() && (!e instanceof CustomEvent)) {
				return;	
			}

			if (e.srcElement.classList.contains('login')) {
				App.pageView.changePage('LoginView');
			} else if (e.srcElement.classList.contains('create-account')) {
				App.pageView.changePage('RegisterView');
			}
		}.bind(this));


		this.homeSurfaceModifier = new Modifier({
			origin: [1, 0],
			transform: Transform.translate(App.width - 30, 150, 2)
		});
		this.add(this.homeSurfaceModifier).add(this.homeSurface);

		this.buttonsModifier = new Modifier();
		this.buttonsModifier.transformFrom(function() {
			return Transform.translate(0, window.innerHeight - 60, 4);
		});
		this.add(this.buttonsModifier).add(this.buttonSurface);
	};

	App.pages[HomeView.name] = HomeView;
	module.exports = HomeView;
});
