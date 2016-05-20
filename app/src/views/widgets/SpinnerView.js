define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var FastClick = require('famous/inputs/FastClick');
	var RenderController = require("famous/views/RenderController");
	var StateView = require('views/StateView');
	var u = require('util/Utils');

	function SpinnerView() {
		StateView.apply(this, arguments);
		this.createSpinner();
	}

	SpinnerView.prototype = Object.create(StateView.prototype);
	SpinnerView.prototype.constructor = SpinnerView;

	SpinnerView.DEFAULT_OPTIONS = {
	};

 	SpinnerView.prototype.createSpinner = function () {
		this.spinnerSurface = new Surface({
			size: [50, 50],
			content: '<i class="fa fa-spinner fa-spin fa-pulse fa-3x fa-fw"></i>',
			properties: {
				color: 'rgb(123, 123, 123)'
			}
		});
		var spinnerShimSurface = new Surface({
			size: [App.width, App.height],
			properties: {
				backgroundColor: 'transparent'
			}
		});
		this.spinnerContainerSurface = new ContainerSurface({});
		this.spinnerContainerSurface.add(new Modifier({align: [0.5, 0.5], origin: [0.5, 0.5]})).add(this.spinnerSurface);
		this.spinnerContainerSurface.add(new Modifier({transform: Transform.translate(0, 0, 999)})).add(spinnerShimSurface);
		this.spinnerRendercontroller = new RenderController();
		this.add(this.spinnerRendercontroller);
 	};

	SpinnerView.prototype.show = function(color) {
		this.spinnerRendercontroller.show(this.spinnerContainerSurface);
	};

	SpinnerView.prototype.hide = function() {
		this.spinnerRendercontroller.hide();
	};

	module.exports = SpinnerView;
});
