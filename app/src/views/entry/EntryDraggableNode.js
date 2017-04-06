define(function(require, exports, module) {

	'use strict';

	var RenderNode = require('famous/core/RenderNode');
	var Draggable = require('famous/modifiers/Draggable');
	var TouchSync = require("famous/inputs/TouchSync");

	function EntryDraggableNode(options) {
		RenderNode.apply(this, arguments);

		this.height = options.height;
		this.draggableSurface = options.draggableSurface;

		this.init();
	}

	EntryDraggableNode.prototype = Object.create(RenderNode.prototype);
	EntryDraggableNode.prototype.constructor = EntryDraggableNode;

	EntryDraggableNode.DEFAULT_OPTIONS = {
	};

	EntryDraggableNode.prototype.init = function() {
		var draggable = new Draggable({
			xRange: [-100, 0],
			yRange: [0, 0],
		});

		var snapTransition = {
			method: 'snap',
			period: 300,
			dampingRatio: 0.3,
			velocity: 0
		};

		var touchSync = new TouchSync();
		touchSync.on('end', function() {
			var movementX = Math.abs(draggable.getPosition()[0]);

			draggable.setPosition((movementX < 50 ? [0, 0] : [-100, 0]), snapTransition);
		});

		this.add(draggable).add(this.draggableSurface);
		this.draggableSurface.pipe(touchSync);
		this.draggableSurface.pipe(draggable);
	};

	EntryDraggableNode.prototype.getSize = function() {
		return [undefined, this.height];
	};

	module.exports = EntryDraggableNode;
});