define(function(require, exports, module) {
	'use strict';

	require('jquery');
	require('bootstrap');

	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');

	var StateModifier = require('famous/modifiers/StateModifier');

	var RenderController = require("famous/views/RenderController");

	var EntryCollection = require('models/EntryCollection');
	var baseInputWidgetTemplate = require('text!templates/input-widgets/base-input-widget.html');

	var RepeatFormView = require('views/entry/RepeatFormView');
	var TimePickerView = require('views/entry/TimePickerView');
	var DraggableNode = require('views/entry/DraggableNode');
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
		this.REPEAT_ICON_ID = 'repeat-icon-' + entryId;
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
		return (element.id === this.BELL_ICON_ID || element.parentElement.id === this.BELL_ICON_ID);
	};

	InputWidgetView.prototype.isRepeatIcon = function(element) {
		return (element.id === this.REPEAT_ICON_ID || element.parentElement.id === this.REPEAT_ICON_ID);
	};

	InputWidgetView.prototype.isTimeBox = function(element) {
		return (element.id === this.TIME_BOX_ID);
	};

	InputWidgetView.prototype.getTagDisplayText = function() {
		return this.parentWidgetGroup.tagInputType.description;
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

				return timeString.toUpperCase();
			}

			return '';
		}

		return this.entry.getTimeString().toUpperCase();
	};

	InputWidgetView.prototype.updateEntryTimeBox = function() {
		var timeBox = document.getElementById(this.TIME_BOX_ID);

		if (timeBox) {
			var newTimeDisplayText = this.getTimeDisplayText();
			if (newTimeDisplayText) {
				timeBox.innerHTML = newTimeDisplayText;
			} else {
				$(timeBox).hide();
			}
		}
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

	InputWidgetView.prototype.setRepeatEndDate = function() {
		if (this.entry.isRepeat() && this.entry.get("repeatEnd")) {
			this.repeatEndDate = new Date(this.entry.get("repeatEnd"));
		} else {
			this.repeatEndDate = null;
		}
	};

	InputWidgetView.prototype.setRepeatAndRemind = function() {
		this.isRemind = this.isRemindEntry();
		this.isRepeat = this.isRepeatEntry();
	};

	InputWidgetView.prototype.getCurrentElement = function () {
		return (document.getElementById(this.currentlySelected.id));
	};

	InputWidgetView.prototype.createWidget = function() {
		var domId = this.getIdForDOMElement();
		var classes = ['input-widget-view', domId];

		this.setRepeatAndRemind();

		if (!this.isDrawerInputSurface) {
			classes.push('input-widget-view-drawer-content', domId);

			if (this.entry.isGhost()) {
				classes.push('ghost-entry');
			}

			this.setRepeatEndDate();

			this.entryText = this.getEntryTextForSelectedInputElement({id: this.currentlySelected.id});

			this.repeatView = new RepeatFormView(this);
			this.repeatView.on('submit', function(removeRepeat) {
				this.trackView.killOverlayContent();

				if (removeRepeat) {
					this.isRepeat = false;
				}

				var refreshEntries = false;
				this.updateEntry(this.entryText, function() {
					var classToAdd = 'faded-icon';
					var classToRemove = 'colored-icon';

					if (this.entry.isRepeat()) {
						classToAdd = 'colored-icon';
						classToRemove = 'faded-icon';
					}

					$('#' + this.REPEAT_ICON_ID).addClass(classToAdd).removeClass(classToRemove);
				}.bind(this), refreshEntries, removeRepeat);
			}.bind(this));

			this.timePickerView = new TimePickerView(this);
			this.timePickerView.on('submit', function() {
				var newEntryTime = this.timePickerView.getTimeText();

				var oldEntryText = this.entryText;
				var oldEntryTime = this.entry.getTimeString();

				var newEntryText = oldEntryText.replace(oldEntryTime, newEntryTime);

				this.trackView.killOverlayContent();

				var callback = null;
				var refreshEntries = true;
				this.updateEntry(newEntryText, callback, refreshEntries);
			}.bind(this));
		}

		this.inputWidgetSurfaceContent = {
			size: this.getInputWidgetSurfaceSize(),
			content: _.template(baseInputWidgetTemplate, {
				entryDisplayText: this.getEntryInfoText(),
				tag: this.getTagDisplayText(),
				time: this.getTimeDisplayText(),
				reminderSet: this.isRemind,
				repeatSet: this.isRepeat,
				isDrawer: this.isDrawerInputSurface,
				widgetDiv: this.inputWidgetDiv,
				entryId: domId
			}, templateSettings),
			classes: classes
		};

		this.inputWidgetSurface = new Surface(this.inputWidgetSurfaceContent);
	};

	InputWidgetView.prototype.getEntryInfoText = function() {
		if (this.isDrawerInputSurface) {
			return '';
		}

		var infoText = '';

		if (this.entry.isRemind()) {
			infoText = 'Alert';

			if (!this.entry.isRepeat()) {
				infoText += ' set';
			} else {
				infoText += ' + ';
			}
		}

		if (this.entry.isRepeat()) {
			infoText += 'Repeat';

			if (this.entry.isDaily()) {
				infoText += ' every day';
			} else if (this.entry.isWeekly()) {
				infoText += ' every week';
			} else if (this.entry.isMonthly()) {
				infoText += ' every month';
			}
		}

		return infoText;
	};

	InputWidgetView.prototype.getIdForDOMElement = function() {
		return (this.isDrawerInputSurface ? 'tag-' + this.parentWidgetGroup.tagInputType.tagId : this.entry.get('id'));
	};

	InputWidgetView.prototype.getInputWidgetSurfaceSize = function() {
		if (this.isDrawerInputSurface) {
			return [App.width, this.options.surfaceHeight];
		}

		return ([App.width - 14, this.options.surfaceHeight - 10]);
	};

	InputWidgetView.prototype.deleteEntry = function(e) {
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
			transform: Transform.translate(App.width - 119, 0, 0)
		});

		this.add(this.deleteSurfaceModifier).add(this.deleteSurface);

		this.entryDraggableNode = new DraggableNode({
			draggableSurface: this.inputWidgetSurface,
			height: this.options.widgetHeight
		});

		var inputSurfaceModifier = new StateModifier({
			transform: Transform.translate(0, 0, 5)
		});
		this.add(inputSurfaceModifier).add(this.entryDraggableNode);
	};

	InputWidgetView.prototype.addComponents = function() {
		if (!this.isDrawerInputSurface) {
			this.addDraggableSurface();
		} else {
			this.add(this.inputWidgetSurface);
		}

		this.inputWidgetSurface.pipe(this.parentWidgetGroup.scrollView);
	};

	InputWidgetView.prototype.handleGhostEntryEvent = function() {
		this.entry.setText(this.entryText);
		var allFuture = false;
		this.entry.save(allFuture, function(resp) {
			this.updateTagStatsCache(resp);
			this.inputWidgetSurface.removeClass('ghost-entry');
			this.glow();
			this._eventOutput.emit('ghost-entry-updated');
		}.bind(this));
	};

	InputWidgetView.prototype.registerListeners = function() {
		this.inputWidgetSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (this.isDrawerInputSurface) {
					this.handleDrawerSurfaceEvent(e.srcElement);
				} else if (this.entry.isGhost()) {
					this.handleGhostEntryEvent();
				} else if (this.isBellIcon(e.srcElement)) {
					this.handleReminderBellEvent(e.srcElement);
				} else if (this.isRepeatIcon(e.srcElement)) {
					this.handleRepeatEvent();
				} else if (this.isTimeBox(e.srcElement)) {
					this.handleTimeBoxEvent();
				} else if (e.srcElement.id) {
					this.updateEntryValue(e.srcElement);
				}
			}
		}.bind(this));
	};

	InputWidgetView.prototype.updateEntryValue = function(element, callback) {
		var entryText = this.getEntryTextForSelectedInputElement(element);

		this.updateEntry(entryText, function() {
			this.handleNewInputSelection(element, callback);
		}.bind(this));
	};

	InputWidgetView.prototype.isInputWidgetDiv = function(element) {
		return (element.id === 'input-widget-surface-' + this.getIdForDOMElement()
				|| _.contains(element.classList, 'tag-time-row'));
	};

	InputWidgetView.prototype.handleDrawerSurfaceEvent = function(element) {
		if (this.isInputWidgetDiv(element) || this.isTimeBox(element)) {
			this.parentWidgetGroup.select();
		} else if (element.id) {
			this.createEntry(element);
		}
	};

	InputWidgetView.prototype.getEntryTextForSelectedInputElement = function(element) {
		var amount = this.getAmountValueFromElementPosition(element);

		if (!Utils.isValidNumber(amount)) {
			return;
		}

		var entryText = this.parentWidgetGroup.tagInputType.description + ' ' + amount;

		if (this.parentWidgetGroup.tagInputType.lastUnits) {
			entryText += ' ' + this.parentWidgetGroup.tagInputType.lastUnits;
		} else if (this.parentWidgetGroup.tagInputType.defaultUnit) {
			entryText += ' ' + this.parentWidgetGroup.tagInputType.defaultUnit;
		}

		if (this.entry.getTimeString) {
			entryText += ' ' + this.entry.getTimeString();
		}

		return entryText;
	};

	InputWidgetView.prototype.createEntry = function(element) {
		if (!Utils.isOnline()) {
			Utils.showAlert("You don't seem to be connected. Please wait until you are online to add an entry.");

			return;
		}

		var entryText = this.getEntryTextForSelectedInputElement(element);

		if (!entryText || entryText.indexOf('undefined') > -1) {
			return;
		}

		var newEntry = new Entry();
		newEntry.setText(entryText);

		newEntry.create(function(resp) {
			this.trackView.preShow({data: resp, fromServer: true});

			if (window.autocompleteCache) {
				window.autocompleteCache.update(resp.tagStats[0], resp.tagStats[1], resp.tagStats[2],
						resp.tagStats[3], resp.tagStats[4]);
			}
		}.bind(this));
	};

	InputWidgetView.prototype.updateEntry = function(entryText, callback, refreshEntries, removeRepeat) {
		if (!Utils.isOnline()) {
			Utils.showAlert("You don't seem to be connected. Please wait until you are online to update the entry.");

			return;
		}

		if (!entryText || entryText.indexOf('undefined') > -1) {
			return;
		}

		// Create new reference for performing changes.
		var entry = new Entry(this.entry.attributes);

		var repeatParams = Entry.getRepeatParams(this.isRepeat, this.isRemind, this.repeatEndDate, removeRepeat);
		var repeatTypeId = repeatParams.repeatTypeId;
		var repeatEnd = repeatParams.repeatEnd;

		entry.set("repeatType", repeatTypeId);
		entry.set("repeatEnd", repeatEnd);
		entry.setText(entryText);

		if (entry.isRepeat() || entry.isRemind()) {
			window.App.collectionCache.clear();
		}

		var updateCallback = function(resp) {
			this.entry = entry; // Update the original entry reference.

			this.setRepeatAndRemind();
			this.setRepeatEndDate();

			this.updateTagStatsCache(resp);

			/*
			 * Entries are refreshed when new entry is created or when an entry's time is updated. For other updates
			 * like Alert toggle, Repeat settings, Ghost to Real and Amount change, only the glow effect is used.
			 */
			if (refreshEntries) {
				this.trackView.preShow({data: resp, fromServer: true});
			} else {
				this.glow();
			}

			if (callback) {
				callback();
			}
		}.bind(this);

		var allFuture = true; // By default all future entries should be updated.

		/*
		 * This check is performed on the current state of the entry and not on the updated state. Thus the call is
		 * this.entry.hasFuture() and not entry.hasFuture()
		 */
		if (this.entry.hasFuture()) {
			Utils.showAlert({
					type: 'alert',
					message: 'Update just this one event or also future events?',
					a: 'One',
					b: 'All Future',
					onA: function() {
						allFuture = false;
						entry.save(allFuture, updateCallback);
					}.bind(this),
					onB: function() {
						allFuture = true;
						entry.save(allFuture, updateCallback);
					}.bind(this)
			});

			return;
		}

		entry.save(allFuture, updateCallback);
	};

	InputWidgetView.prototype.updateTagStatsCache = function(resp) {
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
	};

	InputWidgetView.prototype.handleReminderBellEvent = function(element) {
		if (element.id !== this.BELL_ICON_ID) {
			element = document.getElementById(this.BELL_ICON_ID);
		}

		this.isRemind = !this.isRemind;

		var entryText = this.entryText;

		this.updateEntry(entryText, function() {
			var classesToAdd = 'fa-bell-o faded-icon';
			var classesToRemove = 'fa-bell colored-icon';

			if (this.entry.isRemind()) {
				classesToAdd = 'fa-bell colored-icon';
				classesToRemove = 'fa-bell-o faded-icon';
			}

			$(element).removeClass(classesToRemove).addClass(classesToAdd);
		}.bind(this));
	};

	InputWidgetView.prototype.handleRepeatEvent = function() {
		this.trackView.showEditEntryOverlay(this.repeatView, function() {
			this.repeatView.reset();
			if (this.entry.isRepeat()) {
				this.repeatView.showRemoveRepeatButton();
			} else {
				this.repeatView.hideRemoveRepeatButton();
			}
		}.bind(this));
	};

	InputWidgetView.prototype.handleTimeBoxEvent = function() {
		this.trackView.showEditEntryOverlay(this.timePickerView, function() {
			this.timePickerView.resetTimePicker();
		}.bind(this));
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
		return [App.width, this.options.surfaceHeight - 8];
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
		if (!element) {
			return;
		}

		var elementId = element.id;
		var parentElementId = element.parentElement ? element.parentElement.id : '';

		var position = this.positionMap[elementId] || this.positionMap[parentElementId];

		return this.getAmountForPosition(position);
	};

	InputWidgetView.prototype.getAmountForPosition = function(position) {
		if (!Utils.isValidNumber(position)) {
			return;
		}

		return (position * this.valueOfOneInputElement);
	};

	module.exports = InputWidgetView;
});

