define(function(require, exports, module) {

	'use strict';

	var View = require('famous/core/View');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Surface = require('famous/core/Surface');

	var Draggable = require('famous/modifiers/Draggable');
	var Utils = require('util/Utils');

	var sliderInputWidgetTemplate = require('text!templates/input-widgets/slider-input-widget.html');

	function RangeInputView(parentInputWidgetView) {
		View.apply(this, arguments);

		this.parentInputWidgetView = parentInputWidgetView;

		this.createRunnableTrack();
		this.createSliderThumb();
	}

	RangeInputView.prototype = Object.create(View.prototype);
	RangeInputView.prototype.constructor = RangeInputView;

	RangeInputView.DEFAULT_OPTIONS = {};

	RangeInputView.prototype.createRunnableTrack = function() {
		var entryId = this.parentInputWidgetView.getIdForDOMElement();

		var templateOptions = this.parentInputWidgetView.getTemplateOptions();
		this.currentPosition = templateOptions.position;

		var classes = ['range-input-view-runnable-track'];
		if (!this.parentInputWidgetView.isDrawerInputSurface && this.parentInputWidgetView.entry.isGhost()) {
			classes.push('ghost-entry');
		}

		this.runnableTrackSurface = new Surface({
			content: _.template(sliderInputWidgetTemplate, templateOptions, templateSettings),
			classes: classes
		});

		this.runnableTrackSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (this.isDirectPositionTap(e.srcElement)) {
					var selectedPosition = this.parentInputWidgetView.positionMap[e.srcElement.id];

					if (!Utils.isValidNumber(selectedPosition) || (this.currentPosition === selectedPosition)) {
						return;
					}

					this._eventOutput.emit('position-direct-tap', {
						element: e.srcElement,
						callback: function() {
							this.currentPosition = selectedPosition;
							this.setDraggablePosition();
						}.bind(this)
					});
				}
			}
		}.bind(this));

		this.runnableTrackSurface.on('deploy', function() {
			this.runnableTrackLength = $('#slider-runnable-track-' + entryId).width();

			var xRange = [0 , 0];

			if (App.width < 768) {
				xRange = [-40, this.runnableTrackLength + 20];
			} else if (App.width < 1024) {
				xRange = [-85, this.runnableTrackLength + 80];
			} else {
				xRange = [-125, this.runnableTrackLength + 135];
			}

			this.lengthOfOneMovement = this.runnableTrackLength/4;

			var draggableOptions = {
				xRange: xRange,
				yRange: [0, 0],
				snapX: this.lengthOfOneMovement
			};

			this.draggable.setOptions(draggableOptions);

			this.setDraggablePosition();
		}.bind(this));

		if (!this.parentInputWidgetView.isDrawerInputSurface) {
			this.add(this.parentInputWidgetView.entryDraggableNode.draggable).add(this.runnableTrackSurface);
		} else {
			this.add(this.runnableTrackSurface);
		}
	};

	RangeInputView.prototype.createSliderThumb = function() {
		this.draggable = new Draggable();

		var classes = ['range-input-view-slider-thumb'];
		if (!this.parentInputWidgetView.isDrawerInputSurface && this.parentInputWidgetView.entry.isGhost()) {
			classes.push('ghost-entry');
		}

		this.sliderThumb = new Surface({
			size: [20, 20],
			classes: classes
		});

		var sliderThumbModifier = new StateModifier({
			transform: Transform.translate(13, -6, 10)
		});

		this.sliderThumb.pipe(this.draggable);

		this.snapTransition = {
			method: 'snap',
			period: 300,
			dampingRatio: 0.3,
			velocity: 0
		};

		this.draggable.on('end', function() {
			var xPosition = Math.abs(this.draggable.getPosition()[0]);
			var updatedPosition = Math.round(xPosition/this.lengthOfOneMovement);
			this._eventOutput.emit('position-update', {
				position: updatedPosition,
				callback: function() {
					this.currentPosition = updatedPosition;
					this.setDraggablePosition();
				}.bind(this)
			});
		}.bind(this));

		if (!this.parentInputWidgetView.isDrawerInputSurface) {
			this.add(sliderThumbModifier)
				.add(this.parentInputWidgetView.entryDraggableNode.draggable).add(this.draggable).add(this.sliderThumb);
		} else {
			this.add(sliderThumbModifier).add(this.draggable).add(this.sliderThumb);
		}
	};

	RangeInputView.prototype.isDirectPositionTap = function(element) {
		return (_.contains(element.parentElement.classList, 'slider-track-unit'));
	};

	RangeInputView.prototype.setDraggablePosition = function() {
		if (!this.parentInputWidgetView.isDrawerInputSurface) {
			this.draggable.setPosition([(this.currentPosition * this.lengthOfOneMovement) - 3, 0],
					this.snapTransition);
		}
	};

	RangeInputView.prototype.removeGhostEntryClasses = function() {
		this.runnableTrackSurface.removeClass('ghost-entry');
		this.sliderThumb.removeClass('ghost-entry')
	};

	module.exports = RangeInputView;
});
