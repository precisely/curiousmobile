define(function(require, exports, module) {

	'use strict';

	var RenderNode = require('famous/core/RenderNode');
	var Draggable = require('famous/modifiers/Draggable');
	var TouchSync = require("famous/inputs/TouchSync");

	function DraggableNode(options) {
		RenderNode.apply(this, arguments);

		this.height = options.height;
		this.draggableSurface = options.draggableSurface;

		this.xRange = options.xRange || [-100, 0];
		this.yRange = options.yRange || [0, 0];

		this.dragLimit = options.dragLimit || 50;

		this.init();
	}

	DraggableNode.prototype = Object.create(RenderNode.prototype);
	DraggableNode.prototype.constructor = DraggableNode;

	DraggableNode.DEFAULT_OPTIONS = {
	};

	DraggableNode.prototype.init = function() {
		this.draggable = new Draggable({
			xRange: this.xRange,
			yRange: this.yRange
		});

		var snapTransition = {
			method: 'snap',
			period: 300,
			dampingRatio: 0.3,
			velocity: 0
		};

		var touchSync = new TouchSync();
		touchSync.on('end', function() {
			var xPosition = Math.abs(this.draggable.getPosition()[0]);

			this.draggable.setPosition((xPosition < this.dragLimit ? [0, 0] : this.xRange), snapTransition);
		}.bind(this));

		this.add(this.draggable).add(this.draggableSurface);
		this.draggableSurface.pipe(touchSync);
		this.draggableSurface.pipe(this.draggable);
	};

	DraggableNode.prototype.getSize = function() {
		return [true, this.height];
	};

	module.exports = DraggableNode;
});
