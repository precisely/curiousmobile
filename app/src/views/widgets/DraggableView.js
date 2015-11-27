define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Transitionable = require('famous/transitions/Transitionable');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var Draggable = require("famous/modifiers/Draggable");
	var RenderNode = require("famous/core/RenderNode");
	var SpringTransition = require('famous/transitions/SpringTransition');
	var Timer = require('famous/utilities/Timer');
	var u = require('util/Utils');

	Transitionable.registerMethod('spring', SpringTransition);

	function DraggableView(targetSurface, nonStickyEdges, minYRange) {
		View.apply(this, arguments);
		this.targetSurface = targetSurface;
		this.nonStickyEdges = nonStickyEdges;
		this.minYRange = minYRange;
		this.calculateScrollHeight = minYRange ? false : true;
		_createDraggableSurface.call(this);
	}

	DraggableView.prototype = Object.create(View.prototype);
	DraggableView.prototype.constructor = DraggableView;

	DraggableView.DEFAULT_OPTIONS = {
	};

	function _createDraggableSurface() {
		var lastDraggablePosition = 0;
		var dragToRefresh = this.nonStickyEdges ? 0 : 100;

		var draggable = new Draggable({
			xRange: [0, 0],
			yRange: [-this.minYRange, dragToRefresh]
		});

		draggable.subscribe(this.targetSurface);

		var spring = {
			method: 'spring',
			period: 300,
			dampingRatio: 0.4
		};

		if (!this.nonStickyEdges) {
			draggable.on('end', function(e) {
				console.log(e);
				var newYRange = Math.max(0, (document.getElementsByClassName('draggable-container')[0].offsetHeight - (App.height - 114)));
				if (e.position[1] < lastDraggablePosition) {
					this.setPosition([0, -newYRange, 0], spring, function() {
						lastDraggablePosition = this.getPosition()[1];
					}.bind(this));
				} else if (e.position[1] != lastDraggablePosition) {
					this.setPosition([0, 0, 0], spring, function() {
						lastDraggablePosition = this.getPosition()[1];
					}.bind(this));
				}
			});
		} else {
			this.targetSurface.on('deploy', function(e) {
				Timer.every(function() {
					if (this.calculateScrollHeight && document.getElementsByClassName('draggable-container')[0]) {
						var containerHeight = document.getElementsByClassName('draggable-container')[0].offsetHeight;
						if (containerHeight <= App.height) {
							this.minYRange = -80;
						} else {
							this.minYRange = -(containerHeight - (App.height - 100));
						}
						draggable.setOptions({
							yRange: [this.minYRange, 0]
						});
					}
				}.bind(this));
			}.bind(this));
		}

		var nodePlayer = new RenderNode();
		nodePlayer.add(draggable).add(this.targetSurface);
		this.add(nodePlayer);
	}

	module.exports = DraggableView;
});

