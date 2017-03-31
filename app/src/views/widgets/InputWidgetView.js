define(function(require, exports, module) {
	'use strict';

	require('jquery');
	require('bootstrap');

	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');

	var StateModifier = require('famous/modifiers/StateModifier');
	var Draggable = require('famous/modifiers/Draggable');
	var TouchSync = require("famous/inputs/TouchSync");

	var RenderController = require("famous/views/RenderController");

	var FixedRenderNode = require('util/FixedRenderNode');
	var EntryCollection = require('models/EntryCollection');
	var baseInputWidgetTemplate = require('text!templates/input-widgets/base-input-widget.html');

	var SetRepeatTypeAndDateView = require('views/entry/SetRepeatTypeAndDateView');
	var TimePickerView = require('views/entry/TimePickerView');

	function InputWidgetView(entry, parentWidgetGroup) {
		View.apply(this, arguments);

		this.options = Object.create(InputWidgetView.DEFAULT_OPTIONS);

		this.entry = entry;
		this.parentWidgetGroup = parentWidgetGroup;

		this.init();
	}

	InputWidgetView.prototype = Object.create(View.prototype);
	InputWidgetView.prototype.constructor = InputWidgetView;

	InputWidgetView.DEFAULT_OPTIONS = {
		widgetHeight: 100,
		surfaceHeight: 95
	};

	InputWidgetView.prototype.init = function() {
		if (this.entry instanceof EntryCollection) {
			this.isDrawerInputSurface = true;
		}

		this.trackView = App.pageView.getPage('TrackView');

		var entryId = this.getIdForDOMElement();
		this.BELL_ICON_ID = 'bell-icon-' + entryId;
		this.BELL_ICON_BOX_CLASS = 'bell-icon-box-' + entryId;
		this.REPEAT_ICON_CLASS = 'repeat-icon-' + entryId;
		this.TIME_BOX_ID = 'time-box-' + entryId;

		this.initializeWidgetContent(); // Defined in Overriding Views to set the content.
		this.createWidget();
		this.addComponents();
		this.registerListeners();
	};

	InputWidgetView.prototype.STATES = {
		UNSELECTED: 0,
		SELECTED: 1,
		NONE_SELECTED: 2
	};

	InputWidgetView.prototype.DOM_ID = {
		NONE: 'none'
	};

	InputWidgetView.prototype.isBellIcon = function(element) {
		return (_.contains(element.classList, this.BELL_ICON_BOX_CLASS) || 
				_.contains(element.parentElement.classList, this.BELL_ICON_BOX_CLASS));
	};

	InputWidgetView.prototype.isRepeatIcon = function(element) {
		return (_.contains(element.classList, this.REPEAT_ICON_CLASS) ||
				_.contains(element.parentElement.classList, this.REPEAT_ICON_CLASS));
	};

	InputWidgetView.prototype.isTimeBox = function(element) {
		return (element.id === this.TIME_BOX_ID);
	};

	InputWidgetView.prototype.getTagDisplayText = function() {
		if (this.isDrawerInputSurface) {
			return this.parentWidgetGroup.tagInputType.description;
		}

		return this.entry.get('description');
	};

	InputWidgetView.prototype.getTimeDisplayText = function() {
		if (this.isDrawerInputSurface) {
			if (this.entry.length >= 1) {
				var timeString = this.entry.at(0).getTimeString();

				if (this.entry.length >= 2) {
					timeString += ', ' + this.entry.at(1).getTimeString();
				}

				if (this.entry.length >= 3) {
					timeString += '...';
				}

				return timeString;
			}

			return '';
		}

		return this.entry.getTimeString();
	};

	InputWidgetView.prototype.isRemindEntry = function() {
		if (this.isDrawerInputSurface) {
			return false;
		}

		return this.entry.isRemind();
	};

	InputWidgetView.prototype.isRepeatEntry = function() {
		if (this.isDrawerInputSurface) {
			return false;
		}

		return this.entry.isRepeat();
	};

	InputWidgetView.prototype.createWidget = function() {
		var classes = ['input-widget-view'];

		if (!this.isDrawerInputSurface) {
			classes.push('input-widget-view-drawer-content');

			this.repeatView = new SetRepeatTypeAndDateView(this);
			this.timePickerView = new TimePickerView(this);
		}

		this.inputWidgetSurfaceContent = {
			size: this.getInputWidgetSurfaceSize(),
			content: _.template(baseInputWidgetTemplate, {
				tag: this.getTagDisplayText(),
				time: this.getTimeDisplayText(),
				reminderSet: this.isRemindEntry(),
				repeatSet: this.isRepeatEntry(),
				isDrawer: this.isDrawerInputSurface,
				widgetDiv: this.inputWidgetDiv,
				entryId: this.getIdForDOMElement()
			}, templateSettings),
			classes: classes
		};

		this.inputWidgetSurface = new Surface(this.inputWidgetSurfaceContent);
	};

	InputWidgetView.prototype.getIdForDOMElement = function() {
		return (this.isDrawerInputSurface ? 'tag-' + this.parentWidgetGroup.tagInputType.tagId : this.entry.get('id'));
	};

	InputWidgetView.prototype.getInputWidgetSurfaceSize = function() {
		if (this.isDrawerInputSurface) {
			return [App.width, this.options.surfaceHeight];
		}

		return ([App.width - 10, this.options.surfaceHeight - 10]);
	};

	InputWidgetView.prototype.addDraggableSurface = function() {
		var draggable = new Draggable({
			xRange: [-100, 0],
			yRange: [0, 0],
		});

		var touchSync = new TouchSync();
		touchSync.on('end', function() {
			var movementX = Math.abs(draggable.getPosition()[0]);

			draggable.setPosition((movementX < 50 ? [0, 0] : [-100, 0]));
		});

		var fixedRenderNode = new FixedRenderNode(draggable);
		fixedRenderNode.add(this.inputWidgetSurface);

		this.deleteSurface = new Surface({
			size: [100, this.options.surfaceHeight - 10],
			content: '<div class="delete-surface-text">Delete</div>',
			classes: ['delete-surface']
		});

		//this.deleteSurface.on('click', this.delete.bind(this));

		this.deleteSurfaceModifier = new StateModifier({
			transform: Transform.translate(App.width - 130, 0, 0)
		});

		this.add(this.deleteSurfaceModifier).add(this.deleteSurface);

		var inputSurfaceModifier = new StateModifier({
			transform: Transform.translate(-5, 0, 5)
		});
		this.add(inputSurfaceModifier).add(fixedRenderNode);

		this.inputWidgetSurface.pipe(draggable);
		this.inputWidgetSurface.pipe(touchSync);
	};

	InputWidgetView.prototype.addComponents = function() {
		if (!this.isDrawerInputSurface) {
			this.addDraggableSurface();
		} else {
			this.add(this.inputWidgetSurface);
		}

		this.inputWidgetSurface.pipe(this.parentWidgetGroup.scrollView);
	};

	InputWidgetView.prototype.registerListeners = function() {
		this.inputWidgetSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (this.isDrawerInputSurface) {
					this.handleDrawerSurfaceEvent();
				} else if (this.isBellIcon(e.srcElement)) {
					this.handleReminderBellEvent(e.srcElement);
				} else if (this.isRepeatIcon(e.srcElement)) {
					this.handleRepeatEvent();
				} else if (this.isTimeBox(e.srcElement)) {
					this.handleTimeBoxEvent();
				} else if (e.srcElement.id) {
					this.inputWidgetEventHandler(e.srcElement);
				}
			}
		}.bind(this));
	};

	InputWidgetView.prototype.isInputWidgetDiv = function(element) {
		return (element.id === 'input-widget-surface-' + this.getIdForDOMElement());
	};

	InputWidgetView.prototype.handleDrawerSurfaceEvent = function() {
		this.parentWidgetGroup.select();
	};

	InputWidgetView.prototype.handleReminderBellEvent = function(element) {
		if (element.id !== this.BELL_ICON_ID) {
			element = document.getElementById(this.BELL_ICON_ID);
		}

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

	InputWidgetView.prototype.handleRepeatEvent = function() {
		this.trackView.showRepeatOverlay(this.repeatView);
	};

	InputWidgetView.prototype.handleTimeBoxEvent = function() {
		this.trackView.showRepeatOverlay(this.timePickerView);
	};

	InputWidgetView.prototype.inputWidgetEventHandler = function(element) {
		if (this.isInputWidgetDiv(element)) {
			return;
		}

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

	InputWidgetView.prototype.getSize = function() {
		return [undefined, this.options.surfaceHeight - 5];
	};

	InputWidgetView.prototype.removeTimeSuffix = function() {
		var timeString = this.entry.getTimeString();
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

	InputWidgetView.prototype.getTimeForTimePickerView = function() {
		var timeString = this.entry.getTimeString();

		var hoursMinutesPlaceValues = timeString.split(':');
		var hoursPlaceValue = hoursMinutesPlaceValues[0];
		var minutesPlaceValueWithAmPm = hoursMinutesPlaceValues[1];

		var minutesPlaceValue = minutesPlaceValueWithAmPm.substr(0, 2);
		var ampm = minutesPlaceValueWithAmPm.substr(2);

		return {hh: hoursPlaceValue, mm: minutesPlaceValue, ampm: ampm};
	};

	InputWidgetView.prototype.glow = function() {
		this.inputWidgetSurface.addClass('glow');

		setTimeout(function() {
			this.inputWidgetSurface.removeClass('glow');
		}.bind(this), 3000);
	};

	InputWidgetView.prototype.getInputElementPositionToSelect = function() {
		if (this.isDrawerInputSurface) {
			return;
		}

		var amount = this.entry.get('amount');
		var min = this.parentWidgetGroup.tagInputType.min;
		var max = this.parentWidgetGroup.tagInputType.max;
		var noOfLevels = this.parentWidgetGroup.tagInputType.noOfLevels;

		var valueOfOneInputElement = (max - min)/noOfLevels;

		return Math.ceil(amount/valueOfOneInputElement);
	};

	module.exports = InputWidgetView;
});

