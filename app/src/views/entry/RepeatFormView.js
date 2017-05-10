define(function(require, exports, module) {
	'use strict';

	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Transform = require('famous/core/Transform');

	var DateGridView = require('views/calendar/DateGridView');
	var RenderController = require("famous/views/RenderController");
	var repeatModifierTemplate = require('text!templates/repeat-input-modifier.html');

	var EditEntryOverlayView = require('views/entry/EditEntryOverlayView');

	var Utils = require('util/Utils');

	function RepeatFormView(parentInputWidgetView) {
		EditEntryOverlayView.apply(this, arguments);

		this.dateGridOpen = false;
		this.addDateGrid();
		this.addRepeatSurface();
		this.createRemoveRepeatButton();
	}

	RepeatFormView.prototype = Object.create(EditEntryOverlayView.prototype);
	RepeatFormView.prototype.constructor = RepeatFormView;

	RepeatFormView.prototype.addDateGrid = function() {
		this.dateGridRenderController = new RenderController();
		this.dateGridModifier = new StateModifier({
			transform: Transform.translate((App.width < 320 ? 18: 30), 80, App.zIndex.datePicker)
		});
		this.add(this.dateGridModifier).add(this.dateGridRenderController);

		this.createShimSurface();
		this.shimSurfaceModifier.setTransform(Transform.translate(0, -64, App.zIndex.datePicker - 1));

		this.on('close-date-grid', function() {
			this.hideShimSurface();
			this.dateGridRenderController.hide();
			this.dateGridOpen = false;
		}.bind(this));
	};

	RepeatFormView.prototype.getEntryRepeatSettings = function() {
		var entryRepeatSettings = {
			repeatEndDate: this.parentInputWidget.repeatEndDate ? this.getEndDateDisplayText() : '',
			isDaily: this.parentInputWidget.entry.isDaily() ? 'checked' : '',
			isWeekly: this.parentInputWidget.entry.isWeekly() ? 'checked' : '',
			isMonthly: this.parentInputWidget.entry.isMonthly() ? 'checked' : '',
			confirmEachRepeat: this.parentInputWidget.entry.isGhost() ? 'checked' : ''
		};

		return entryRepeatSettings;
	};

	RepeatFormView.prototype.addRepeatSurface = function() {
		this.repeatModifierSurface = new Surface({
			content: _.template(repeatModifierTemplate, this.getEntryRepeatSettings(), templateSettings),
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'transparent',
				padding: '30px'
			}
		});

		this.repeatModifierSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var parentElement = e.srcElement.parentElement;

				/*
				 * The IOS platform have unusual with checkboxes, it is resetting the input to previous state. Hence
				 * added a check for IOS to again reset the input so that the final result is the intended one.
				 * For example: If the checkbox is checked, IOS will clear it (reset), but this code will then
				 * invert the current state, i.e will again check it.
				 * 
				 * TODO This repeat form is same in TrackEntryFormView also. Make it generic.
				 */
				if (Utils.isIOS()) {
					if (_.contains(parentElement.classList, 'entry-checkbox') ||
								_.contains(e.srcElement.parentElement.parentElement.classList, 'entry-checkbox')) {
						var repeatEachCheckbox = document.getElementById('confirm-each-repeat');
						repeatEachCheckbox.checked = !repeatEachCheckbox.checked;

						return;
					}
				}

				if (_.contains(parentElement.classList, 'date-picker-field')) {
					if (typeof cordova !== 'undefined') {
						cordova.plugins.Keyboard.close();
					}

					if (this.dateGridOpen) {
						this.dateGridRenderController.hide();
					} else {
						this.dateGrid = new DateGridView(this.parentInputWidget.repeatEndDate || new Date());

						this.dateGridRenderController.show(this.dateGrid, null, function() {
							this.showShimSurface();
						}.bind(this));

						this.dateGrid.on('select-date', function(date) {
							this.setSelectedDate(date);
							this.dateGridRenderController.hide();
							this.dateGridOpen = false;
							this.hideShimSurface();
						}.bind(this));

						this.dateGrid.on('close-date-grid', function(date) {
							this.dateGridRenderController.hide();
							this.hideShimSurface();
						}.bind(this));
					}

					this.dateGridOpen = !this.dateGridOpen;
				}
			}
		}.bind(this));

		this.overlayContainerSurface.add(this.repeatModifierSurface);
	};

	RepeatFormView.prototype.createRemoveRepeatButton = function() {
		this.removeRepeatButton = new Surface({
			content: '<button type="button" class="full-width-button remove-repeat-button">REMOVE REPEAT</button>',
			size: [undefined, true]
		});

		this.removeRepeatButton.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (_.contains(e.srcElement.classList, 'remove-repeat-button')) {
					var removeRepeat = true;
					this._eventOutput.emit('submit', removeRepeat);
				}
			}
		}.bind(this));

		this.removeButtonModifier = new StateModifier({
			size: [App.width - 60, undefined],
			transform: Transform.translate(30, 320, 20)
		});

		this.removeButtonRenderController = new RenderController();

		this.overlayContainerSurface.add(this.removeButtonModifier).add(this.removeButtonRenderController);
	};

	RepeatFormView.prototype.showRemoveRepeatButton = function() {
		this.removeButtonRenderController.show(this.removeRepeatButton);
	};

	RepeatFormView.prototype.hideRemoveRepeatButton = function() {
		this.removeButtonRenderController.hide();
	};

	RepeatFormView.prototype.setSelectedDate = function(date) {
		if (!date) {
			document.getElementsByClassName('choose-date-input')[0].value = '';
			return;
		}

		this.parentInputWidget.repeatEndDate = date;

		var dateElement = document.getElementsByClassName('choose-date-input')[0];

		if (dateElement) {
			dateElement.value = this.getEndDateDisplayText();
		}
	};

	RepeatFormView.prototype.getEndDateDisplayText = function() {
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
			'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
		];

		var date = this.parentInputWidget.repeatEndDate;

		var monthName = months[date.getMonth()];

		return (date.getDate() + ' ' + monthName + ' ' + date.getFullYear());
	};

	RepeatFormView.prototype.reset = function() {
		this.parentInputWidget.setRepeatEndDate();

		var entryRepeatSettings = this.getEntryRepeatSettings();

		document.getElementsByClassName('choose-date-input')[0].value = entryRepeatSettings.repeatEndDate;

		document.getElementById('daily').checked = entryRepeatSettings.isDaily ? true : false;
		document.getElementById('weekly').checked = entryRepeatSettings.isWeekly ? true : false;
		document.getElementById('monthly').checked = entryRepeatSettings.isMonthly ? true : false;

		document.getElementById('confirm-each-repeat').checked = entryRepeatSettings.confirmEachRepeat ? true
				: false;
	};

	RepeatFormView.prototype.getHeaderLabel = function() {
		return 'Set Repeat Interval';
	};

	module.exports = RepeatFormView;
});