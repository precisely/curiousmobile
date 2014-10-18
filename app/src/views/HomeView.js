define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var HomeTemplate = require('text!templates/home.html');
	var ImageSurface = require('famous/surfaces/ImageSurface');

	function HomeView() {
		View.apply(this, arguments);
		this.createView();
	}

	HomeView.prototype = Object.create(View.prototype);
	HomeView.prototype.constructor = HomeView;

	HomeView.DEFAULT_OPTIONS = {};

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
			size: [undefined, window.innerHeight - 160],
			content: _.template(HomeTemplate, {}, templateSettings),
			properties: {
			}
		});

		this.bottomTriangle = new Surface({
			size: [0,0],
			properties : {
				borderTop: '411px solid transparent',
				borderLeft: '1000px solid #c04f7f',
				borderBottom: '574px solid transparent',
			}	
		});

		this.triangleModifier = new Modifier({
			transform: Transform.translate(0, window.innerHeight - 248, 0)
		});
		this.add(this.triangleModifier).add(this.bottomTriangle);

		this.homeSurfaceModifier = new Modifier({
			transform: Transform.translate(0, 150, 4)
		});
		this.add(this.homeSurfaceModifier).add(this.homeSurface);
	};

	module.exports = HomeView;
});
