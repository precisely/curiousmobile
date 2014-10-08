define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var RenderNode = require('famous/core/RenderNode');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');

	function FixedRenderNode() {
		RenderNode.apply(this, arguments);
	}

	FixedRenderNode.prototype = Object.create(RenderNode.prototype);
	FixedRenderNode.prototype.constructor = FixedRenderNode;

	FixedRenderNode.DEFAULT_OPTIONS = {
	};

	FixedRenderNode.prototype.getSize = function(target) {
		return [320, 90];
	}

	module.exports = FixedRenderNode;
});
