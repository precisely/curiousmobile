define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');

	function TrueSurface() {
		Surface.apply(this, arguments);
	}

	TrueSurface.prototype = Object.create(Surface.prototype);
	TrueSurface.prototype.constructor = TrueSurface;

	TrueSurface.DEFAULT_OPTIONS = {};

	TrueSurface.prototype.deploy = function(target) {
		var content, height, width;
		content = this.getContent();
		this.target = target;
		if (content instanceof Node) {
			while (target.hasChildNodes()) {
				target.removeChild(target.firstChild);
			}
			target.appendChild(content);
		} else {
			target.innerHTML = content;
		}
		width = this.target.offsetWidth;
		height = this.target.offsetHeight;
		if (height < this.options.entryHeight) {
			height = this.options.entryHeight;
		}
		//var properties = this.getProperties();
		//properties.lineHeight = height * (2/3);
		//this.setProperties(properties);
		return this.size = [width, height];
	}

	module.exports = TrueSurface;
});
