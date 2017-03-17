define(function(require, exports, module) {
	'use strict';

	require('jquery');
	require('bootstrap');
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var baseInputWidgetTemplate = require('text!templates/input-widgets/base-input-widget.html');
	var DateGridView = require('views/calendar/DateGridView');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var RenderController = require("famous/views/RenderController");
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var TouchSync = require("famous/inputs/TouchSync");

	function InputWidgetView(entry, parentWidgetGroup) {
		View.apply(this, arguments);
		this.entry = entry;
		this.parentWidgetGroup = parentWidgetGroup;
		this.initializeWidgetContent(); // Defined in Overriding Views to set the content.
		this.createWidget();
		this.addComponents();
		this.registerListeners();
	}

	InputWidgetView.prototype = Object.create(View.prototype);
	InputWidgetView.prototype.constructor = InputWidgetView;

	InputWidgetView.prototype.STATES = {
		UNSELECTED: 0,
		SELECTED: 1,
		NONE_SELECTED: 2
	};

	InputWidgetView.prototype.DOM_ID = {
		NONE: 'none'
	};

	// Dom Id of the element.
	var BELL_ICON = 'remind-bell-button';

	InputWidgetView.prototype.isBellIcon = function(element) {
		return (_.contains(element.classList, BELL_ICON) || _.contains(element.parentElement.classList, BELL_ICON))
	};

	InputWidgetView.prototype.createWidget = function() {
		this.inputWidgetSurface = new Surface({
			size: [App.width, 105],
			content: _.template(baseInputWidgetTemplate, {
				tag: this.entry.get('description'),
				time: this.entry.getTimeString(),
				reminderSet: this.entry.isRemind(),
				widgetDiv: this.inputWidgetDiv
			}, templateSettings),
			classes: ['input-widget-surface']
		});
	};

	InputWidgetView.prototype.addComponents = function() {
		this.add(this.inputWidgetSurface);
		this.inputWidgetSurface.pipe(this.parentWidgetGroup.scrollView);
		this.inputWidgetSurface.pipe(this._eventOutput);
		this.createTouchInputSurface();
	};

	InputWidgetView.prototype.createTouchInputSurface = function() {
		this.start = 0;
		this.update = 0;
		this.end = 0;
		this.delta = [0, 0];
		this.position = [0, 0];

		//this.on('trigger-delete-entry', this.delete.bind(this));

		this.touchSync = new TouchSync(function() {
			return position;
		});

		this.inputWidgetSurface.pipe(this.touchSync);

		this.touchSync.on('start', function(data) {
			console.log('Entry touched: ' + this.entry.get('id'));
			this.start = Date.now();
			// Show context menu after the timeout regardless of tap end
			this.touchTimeout = setTimeout(function() {}.bind(this), 500)
		}.bind(this));

		this.touchSync.on('update', function(data) {
			var movementX = Math.abs(data.position[0]);
			var movementY = Math.abs(data.position[1]);
			// Don't show context menu if there is intent to move something
			if (movementX > 8 || movementY > 8) {
				clearTimeout(this.touchTimeout);
			}
		}.bind(this));

		this.touchSync.on('end', function(data) {
			this.end = Date.now();
			var movementX = Math.abs(data.position[0]);
			var movementY = Math.abs(data.position[1]);
			var timeDelta = this.end - this.start;
			// If the intent is to just select don't show context menu
			if (movementX < 8 && movementY < 8) {
				if (timeDelta < 500) {
					clearTimeout(this.touchTimeout);
					this.select();
					return;
				}
				if (timeDelta > 600) {
					App.pageView._eventOutput.emit('show-context-menu', {
						menu: this.menu,
						target: this,
						eventArg: {entry: this.entry}
					});
				}
			}
		}.bind(this));
	};

	InputWidgetView.prototype.registerListeners = function() {
		this.inputWidgetSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (this.isBellIcon(e.srcElement)) {
					this.handleReminderBellEvent(e.srcElement);
				} else if (e.srcElement.id) {
					this.inputWidgetEventHandler(e.srcElement);
				}
			}
		}.bind(this));
	};

	InputWidgetView.prototype.handleReminderBellEvent = function(element) {
		if (this.remindEntry) {
			$(element).removeClass('fa-bell');
			$(element).addClass('fa-bell-o');
			this.remindEntry = false;
		} else {
			$(element).removeClass('fa-bell-o');
			$(element).addClass('fa-bell');
			this.remindEntry = true;
		}
	};

	InputWidgetView.prototype.inputWidgetEventHandler = function(element) {
		if (this.currentlySelected.id === this.DOM_ID.NONE) {
			this.selectInput(element);
		} else {
			if ((element.id === this.currentlySelected.id)) {
				this.unSelectCurrentlySelected(element);
			} else {
				// Select new input and deselect currently selected input.
				this.handleNewInputSelection(element);
			}
		}
	};

	InputWidgetView.prototype.handleNewInputSelection = function(element) {
		this.defaultNewInputSelectionHandler(element);
	};

	InputWidgetView.prototype.defaultNewInputSelectionHandler = function(element) {
		var currentlySelectedElement = document.getElementById(this.currentlySelected.id);
		if (currentlySelectedElement) {
			this.unSelectCurrentlySelected(currentlySelectedElement);
		}

		this.selectInput(element);
	};

	InputWidgetView.prototype.removeTimeSuffix = function(timeString) {
		var timeStringInHHMMFormat = timeString.replace(/am|pm/gi, '');

		var hoursMinutesPlaceValues = timeStringInHHMMFormat.split(':');
		var hoursPlaceValue = hoursMinutesPlaceValues[0];
		var minutesPlaceValue = hoursMinutesPlaceValues[1];

		if (hoursPlaceValue.length == 1) {
			hoursPlaceValue = (timeString.indexOf('pm') > -1) ? 12 + Number(hoursPlaceValue) : ('0' + hoursPlaceValue);
		}

		if (minutesPlaceValue.length == 1) {
			minutesPlaceValue = '0' + minutesPlaceValue;
		}

		return (hoursPlaceValue + ':' + minutesPlaceValue);
	};

	module.exports = InputWidgetView;
});

