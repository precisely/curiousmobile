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
		width = this.size[0] === true ? this.target.offsetWidth : this.size[0];
		height = this.size[1] === true ? this.target.offsetHeight : this.size[1];
		return this.size = [width, height];
	}

	module.exports = TrueSurface;
});
