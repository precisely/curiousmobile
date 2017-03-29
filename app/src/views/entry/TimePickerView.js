define(function(require, exports, module) {
	'use strict';

	require('jquery');

	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Transform = require('famous/core/Transform');

	var timePickerBoxTemplate = require('text!templates/input-widgets/time-picker-box.html');
	var EditEntryOverlayView = require('views/entry/EditEntryOverlayView');

	function TimePickerView(parentInputWidgetView) {
		EditEntryOverlayView.apply(this, arguments);

		this.addTimePickerSurface();

		this.submitButtonModifier.setTransform(Transform.translate(30, 120, 20));
	}

	TimePickerView.prototype = Object.create(EditEntryOverlayView.prototype);
	TimePickerView.prototype.constructor = TimePickerView;

	TimePickerView.prototype.addTimePickerSurface = function() {
		var timeObject = this.parentInputWidget.getTimeForTimePickerView();

		var entryId = this.parentInputWidget.getIdForDOMElement();
		this.AM_PM_BOX = 'ampm-box-' + entryId;

		this.timePickerSurface = new Surface({
			content: _.template(timePickerBoxTemplate, {
				hh: timeObject.hh,
				mm: timeObject.mm,
				ampm: timeObject.ampm,
				entryId: entryId
			}, templateSettings),
			size: [180, 40]
		});

		this.timePickerSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (e.srcElement.id === this.AM_PM_BOX) {
					var newValue = e.srcElement.innerHTML === 'AM' ? 'PM': 'AM';
					$(e.srcElement).html(newValue);
				}
			}
		}.bind(this));

		this.timePickerModifier = new StateModifier({
			transform: Transform.translate(((App.width / 2) - 90), 15, 1)
		});

		this.overlayContainerSurface.add(this.timePickerModifier).add(this.timePickerSurface);
	};

	module.exports = TimePickerView;
});