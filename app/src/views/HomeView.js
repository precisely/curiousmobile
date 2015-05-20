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
		var logoSurface = new ImageSurface({
			size: [265, true],
			content: 'content/images/logo-horizontal.png'
		});

		var logoModifier = new Modifier({
			origin:[0.5, 0.5],
			align: [0.5, 0],
			transform: Transform.translate(0, 80, 0)
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
			size: [undefined, 200],
			content: '<div class="home-buttons">' +
				'<button type="button" class="btn login">Log In</button>' +
				'<button type="button" class="btn create-account">Get Started</button>' + 
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

		this.bottomTriangle = new Surface({
			size: [0,0],
			properties : {
				borderTop: '411px solid transparent',
				borderLeft: '1000px solid #c04f7f',
				borderBottom: '574px solid transparent',
			}	
		});

		this.triangleModifier = new Modifier({
			transform: Transform.translate(0, App.height - 248, 0)
		});
		this.add(this.triangleModifier).add(this.bottomTriangle);

		this.homeSurfaceModifier = new Modifier({
			origin:[0.5, 0.5],
			align: [0.5, 0.6],
			transform: Transform.translate(0, 0, 2)
		});
		this.add(this.homeSurfaceModifier).add(this.homeSurface);

		this.buttonsModifier = new Modifier({
			origin:[0.5, 0.5],
			align: [0.5, 1],
			transform: Transform.translate(20, 5, 4)
		});
		this.add(this.buttonsModifier).add(this.buttonSurface);
	};

	App.pages[HomeView.name] = HomeView;
	module.exports = HomeView;
});
