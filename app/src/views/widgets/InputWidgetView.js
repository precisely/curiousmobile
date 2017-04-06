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
	var EntryDraggableNode = require('views/entry/EntryDraggableNode');
	var Entry = require('models/Entry');
	var Utils = require('util/Utils');

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

		this.setValueOfOneInputElement();
		this.initializeWidgetContent(); // Defined in Overriding Views to set the content.
		this.createWidget();
		this.addComponents();
		this.registerListeners();
	};

	InputWidgetView.prototype.setValueOfOneInputElement = function() {
		var min = this.parentWidgetGroup.tagInputType.min;
		var max = this.parentWidgetGroup.tagInputType.max;
		var noOfLevels = this.parentWidgetGroup.tagInputType.noOfLevels;

		this.valueOfOneInputElement = (max - min)/noOfLevels;
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
		var domId = this.getIdForDOMElement();
		var classes = ['input-widget-view', domId];

		if (!this.isDrawerInputSurface) {
			classes.push('input-widget-view-drawer-content', domId);

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
				entryId: domId
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

	InputWidgetView.prototype.deleteEntry = function(e) {
		console.log('InputWidgetView: Deleting entry - ' + this.entry.id);

		if ((e instanceof CustomEvent) || e.entry instanceof Entry) {
			this.entry.delete(function(data) {
				if (data && data.fail) {
					this._eventOutput.emit('delete-failed');

					return;
				}

				this._eventOutput.emit('delete-entry');
			}.bind(this));
		}
	};

	InputWidgetView.prototype.addDraggableSurface = function() {
		this.deleteSurface = new Surface({
			size: [100, this.options.surfaceHeight - 10],
			content: '<div class="delete-surface-text">Delete</div>',
			classes: ['delete-surface']
		});

		this.deleteSurface.on('click', this.deleteEntry.bind(this));

		this.deleteSurfaceModifier = new StateModifier({
			transform: Transform.translate(App.width - 130, 0, 0)
		});

		this.add(this.deleteSurfaceModifier).add(this.deleteSurface);

		var entryDraggableNode = new EntryDraggableNode({
			draggableSurface: this.inputWidgetSurface,
			height: this.options.widgetHeight
		});

		var inputSurfaceModifier = new StateModifier({
			transform: Transform.translate(-5, 0, 5)
		});
		this.add(inputSurfaceModifier).add(entryDraggableNode);
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
					this.handleDrawerSurfaceEvent(e.srcElement);
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
		return (element.id === 'input-widget-surface-' + this.getIdForDOMElement()
				|| _.contains(element.classList, 'tag-time-row'));
	};

	InputWidgetView.prototype.handleDrawerSurfaceEvent = function(element) {
		if (this.isInputWidgetDiv(element)) {
			this.parentWidgetGroup.select();
		} else if (element.id) {
			this.createEntry(element);
		}
	};

	InputWidgetView.prototype.createEntry = function(element) {
		var amount = this.getAmountValueFromElementPosition(element);

		if (!amount || !(amount > 0)) {
			return;
		}

		if (!Utils.isOnline()) {
			Utils.showAlert("You don't seem to be connected. Please wait until you are online to add an entry.");

			return;
		}

		var entryText = this.parentWidgetGroup.tagInputType.description + ' ' + amount;

		if (this.parentWidgetGroup.tagInputType.description == 'sleep') {
			entryText += ' ' + 'hrs';
		}

		var newEntry = new Entry();
		newEntry.setText(entryText);

		newEntry.create(function(resp) {
			this._eventOutput.emit('new-entry', resp);
		}.bind(this));
	};

	InputWidgetView.prototype.updateRemindType = function(callback) {
		// Create new reference for performing changes.
		var entry = new Entry(this.entry.attributes);

		var repeatParams = Entry.getRepeatParams(this.isRepeat, this.isRemind, this.repeatEndDate);
		var repeatTypeId = repeatParams.repeatTypeId;
		var repeatEnd = repeatParams.repeatEnd;

		if (repeatTypeId) {
			entry.set("repeatType", repeatTypeId);
		}
		if (repeatEnd) {
			entry.set("repeatEnd", repeatEnd);
		}

		entry.setText(entry.toString());

		var allFuture = false;
		entry.save(allFuture, function(resp) {
			this.glow();

			// Update the reference with updated entry.
			this.entry = entry;

			if (callback) {
				callback();
			}

			if (window.autocompleteCache) {
				if (resp.tagStats[0]) {
					window.autocompleteCache.update(resp.tagStats[0][0],
							resp.tagStats[0][1], resp.tagStats[0][2], resp.tagStats[0][3], resp.tagStats[0][4])
				}

				if (resp.tagStats[1]) {
					window.autocompleteCache.update(resp.tagStats[1][0],
							resp.tagStats[1][1], resp.tagStats[1][2], resp.tagStats[1][3], resp.tagStats[1][4])
				}
			}
		}.bind(this));
	};

	InputWidgetView.prototype.handleReminderBellEvent = function(element) {
		if (element.id !== this.BELL_ICON_ID) {
			element = document.getElementById(this.BELL_ICON_ID);
		}

		this.isRemind = !this.isRemind;

		this.updateRemindType(function() {
			if (this.isRemind) {
				$(element).removeClass('fa-bell-o');
				$(element).addClass('fa-bell');
			} else {
				$(element).removeClass('fa-bell');
				$(element).addClass('fa-bell-o');
			}
		}.bind(this));
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

		return Math.ceil(amount/this.valueOfOneInputElement);
	};

	InputWidgetView.prototype.getAmountValueFromElementPosition = function(element) {
		var position = this.positionMap[element.id] || this.positionMap[element.parentElement.id];

		return (position ? (position * this.valueOfOneInputElement) : 0);
	};

	module.exports = InputWidgetView;
});

