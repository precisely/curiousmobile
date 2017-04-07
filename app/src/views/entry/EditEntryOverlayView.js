define(function(require, exports, module) {
	'use strict';

	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Transform = require('famous/core/Transform');

	var BaseView = require('views/BaseView');

	function EditEntryOverlayView(parentInputWidgetView) {
		View.apply(this, arguments);

		/*
		 Only need the reusable functions from the BaseView and not the View components, hence not calling the
		 constructor and only using the BaseView for creating the prototype.
		 */
		// BaseView.apply(this, arguments);

		this.parentInputWidget = parentInputWidgetView;

		this.init();
		this.addSubmitButton();
	}

	EditEntryOverlayView.prototype = Object.create(BaseView.prototype);
	EditEntryOverlayView.prototype.constructor = EditEntryOverlayView;

	EditEntryOverlayView.prototype.init = function() {
		this.overlayContainerSurface = new ContainerSurface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'rgba(123, 120, 120, 0.48)',
				overflow: 'hidden'
			},
			attributes: {
				id: 'select-repeat-type-container'
			}
		});

		this.containerSurfaceModifier = new StateModifier({
			transform: Transform.translate(0, 0, 10)
		});

		this.add(this.containerSurfaceModifier).add(this.overlayContainerSurface);
	};

	EditEntryOverlayView.prototype.addSubmitButton = function() {
		this.submitButton = new Surface({
			content: '<button type="button" class="full-width-button create-entry-button">UPDATE ENTRY</button>',
			size: [undefined, true]
		});

		this.submitButton.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (_.contains(e.srcElement.classList, 'create-entry-button')) {
					this._eventOutput.emit('submit');
				}
			}
		}.bind(this));

		this.submitButtonModifier = new StateModifier({
			size: [App.width - 60, undefined],
			transform: Transform.translate(30, 269, 20)
		});

		this.overlayContainerSurface.add(this.submitButtonModifier).add(this.submitButton);
	};

	module.exports = EditEntryOverlayView;
});