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

	function SetRepeatTypeAndDateView(parentInputWidgetView) {
		EditEntryOverlayView.apply(this, arguments);

		this.dateGridOpen = false;
		this.addDateGrid();
		this.addRepeatSurface();
	}

	SetRepeatTypeAndDateView.prototype = Object.create(EditEntryOverlayView.prototype);
	SetRepeatTypeAndDateView.prototype.constructor = SetRepeatTypeAndDateView;

	SetRepeatTypeAndDateView.prototype.addDateGrid = function() {
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

	SetRepeatTypeAndDateView.prototype.addRepeatSurface = function() {
		this.initialRepeatViewState = {
			repeatEndDate: this.parentInputWidget.repeatEndDate ? this.getEndDateDisplayText() : '',
			isDaily: this.parentInputWidget.entry.isDaily() ? 'checked' : '',
			isWeekly: this.parentInputWidget.entry.isWeekly() ? 'checked' : '',
			isMonthly: this.parentInputWidget.entry.isMonthly() ? 'checked' : '',
			confirmEachRepeat: this.parentInputWidget.entry.isGhost() ? 'checked' : ''
		};

		this.repeatModifierSurface = new Surface({
			content: _.template(repeatModifierTemplate, this.initialRepeatViewState, templateSettings),
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'transparent',
				padding: '30px'
			}
		});

		this.repeatModifierSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.parentElement.classList;
				if (_.contains(classList, 'date-picker-field')) {
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

	SetRepeatTypeAndDateView.prototype.setSelectedDate = function(date) {
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

	SetRepeatTypeAndDateView.prototype.getEndDateDisplayText = function() {
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
			'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
		];

		var date = this.parentInputWidget.repeatEndDate;

		var monthName = months[date.getMonth()];

		return (date.getDate() + ' ' + monthName + ' ' + date.getFullYear());
	};

	SetRepeatTypeAndDateView.prototype.reset = function() {
		document.getElementsByClassName('choose-date-input')[0].value = this.initialRepeatViewState.repeatEndDate;

		document.getElementById('daily').checked = this.initialRepeatViewState.isDaily ? true : false;
		document.getElementById('weekly').checked = this.initialRepeatViewState.isWeekly ? true : false;
		document.getElementById('monthly').checked = this.initialRepeatViewState.isMonthly ? true : false;

		document.getElementById('confirm-each-repeat').checked = this.initialRepeatViewState.confirmEachRepeat ? true 
				: false;
	};

	module.exports = SetRepeatTypeAndDateView;
});