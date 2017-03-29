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
		this.repeatModifierSurface = new Surface({
			content: _.template(repeatModifierTemplate, templateSettings),
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'transparent',
				padding: '30px'
			}
		});

		this.repeatModifierSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.parentElement.classList;
				if (_.contains(classList, 'entry-checkbox') ||
					_.contains(e.srcElement.parentElement.parentElement.classList, 'entry-checkbox')) {
					var repeatEachCheckbox = document.getElementById('confirm-each-repeat');
					//repeatEachCheckbox.checked = !repeatEachCheckbox.checked;
				} else if (_.contains(classList, 'date-picker-field')) {
					if (typeof cordova !== 'undefined') {
						cordova.plugins.Keyboard.close();
					}
					if (this.dateGridOpen) {
						this.dateGridRenderController.hide();
					} else {
						this.dateGrid = new DateGridView(this.selectedDate || new Date());
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
		this.selectedDate = date;

		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
			'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
		];
		var monthName = months[date.getMonth()];
		document.getElementsByClassName('choose-date-input')[0].value = date.getDate() + ' ' +
				monthName + ' ' + date.getFullYear();
	};

	module.exports = SetRepeatTypeAndDateView;
});