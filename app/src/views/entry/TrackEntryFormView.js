'use strict';

define(function(require, exports, module) {
	var EntryFormView = require('views/entry/EntryFormView');
	var DateGridView = require('views/calendar/DateGridView');
	var BaseView = require('views/BaseView');
	var Timer = require('famous/utilities/Timer');
	var AutocompleteView = require("views/AutocompleteView");
	var Autocomplete = require('models/Autocomplete');
	var Entry = require('models/Entry');
	var u = require('util/Utils');

	function TrackEntryFormView(trackView) {
		EntryFormView.apply(this, arguments);
		this.trackView = trackView;
		this.dateGridOpen = false;
	}

	TrackEntryFormView.prototype = Object.create(EntryFormView.prototype);
	TrackEntryFormView.prototype.constructor = TrackEntryFormView;

	TrackEntryFormView.prototype._setListeners = function() {
		var AutocompleteObj = new Autocomplete();
		window.autocompleteCache = AutocompleteObj;
		this.autoCompleteView = new AutocompleteView(AutocompleteObj);
		this.autoCompleteView.on('updateInputSurface', function() {
			console.log('update the Input Surface');
		}.bind(this));
		//update input field
		this.autoCompleteView.onSelect(function(inputLabel) {
			console.log(inputLabel);
			Timer.setTimeout(function() {
				var inputElement = document.getElementById("entry-description");
				inputElement.value = inputLabel;
				inputElement.focus();
			}.bind(this), 500);
		}.bind(this));

		this.repeatSurface.on('click', function(e) {
			console.log("repeatSurface event");
			if (e instanceof CustomEvent) {
				this.removeSuffix();
				this.setRepeat = !this.setRepeat;
				this.setPinned = false;
				if (this.setRepeat) {
					if (!this.isUpdating) {
						this.resetRepeatModifierForm();
					}
					this.renderController.show(this.repeatModifierSurface);
				} else {
					this.renderController.hide();
				}
				this.toggleSelector(this.repeatSurface);
			}
		}.bind(this));

		this.remindSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.removeSuffix();
				this.setRemind = !this.setRemind;
				this.setPinned = false;
				this.toggleSelector(this.remindSurface);
			}
		}.bind(this));

		this.pinSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.removeSuffix();
				this.setPinned = !this.setPinned;
				this.toggleSelector(this.pinSurface);
				this.renderController.hide();
				this.dateGridRenderController.hide();
				this.submit();
			}
		}.bind(this));

		this.repeatModifierSurface.on('click', function(e) {
			var classList = e.srcElement.parentElement.classList;
			if (e instanceof CustomEvent) {
				if (_.contains(classList, 'entry-checkbox') ||
						_.contains(e.srcElement.parentElement.parentElement.classList, 'entry-checkbox')) {
					var repeatEachCheckbox = document.getElementById('confirm-each-repeat');
					repeatEachCheckbox.checked = !repeatEachCheckbox.checked;
				} else if (_.contains(classList, 'date-picker-field')) {
					if (cordova) {
						cordova.plugins.Keyboard.close();
					}
					document.getElementById('entry-description').blur();
					if(this.dateGridOpen) {
						this.dateGridRenderController.hide();
					} else {
						var dateGridView = new DateGridView(this.selectedDate || new Date());
						this.dateGrid = dateGridView;
						this.dateGridRenderController.show(this.dateGrid);
						this.dateGrid.on('select-date', function(date) {
							console.log('CalenderView: Date selected');
							this.setSelectedDate(date);
							this.dateGridRenderController.hide();
							this.dateGridOpen = false;
						}.bind(this));
					}
					this.dateGridOpen = !this.dateGridOpen;
				} else if (_.contains(e.srcElement.classList, 'create-entry-button')) {
					this.submit();
				}
			}
		}.bind(this));

		this.on('new-entry', function(resp) {
			console.log("New Entry - TrackView event");
			this.resetRepeatModifierForm();
			this.renderController.hide();
			var currentListView = this.trackView.currentListView;
			currentListView.refreshEntries(resp.entries, resp.glowEntry);
			this.trackView.killEntryForm({ entryDate: resp.glowEntry.date });
		}.bind(this));

		this.on('update-entry', function(resp) {
			console.log('EntryListView: Updating an entry');
			this.resetRepeatModifierForm();
			this.renderController.hide();
			var currentListView = this.trackView.currentListView;
			currentListView.refreshEntries(resp.entries, resp.glowEntry);
			var state = {};
			if (resp.glowEntry.changed.date) {
				state = {
					entryDate: resp.glowEntry.changed.date
				}
			} else {
				state = {
					new: false
				}
			}
			this.trackView.killEntryForm(state);
		}.bind(this));
	}

	/**
	 * If form loads in edit mode, this will initialize
	 * entry modifier form according to properties of current entry
	 */
	TrackEntryFormView.prototype.showEntryModifiers = function(args) {
		this.resetRepeatModifierForm();
		this.renderController.hide();
		this.selectedDate = null;
		var entry = this.entry;
		if (entry.isContinuous()) {
			this.setRepeat = false;
			this.setRemind = false;
			return;
		}

		var radioSelector;
		if (entry.isWeekly()) {
			radioSelector = 'weekly';
		} else if (entry.isMonthly()) {
			radioSelector = 'monthly';
		} else if (entry.isDaily()) {
			radioSelector = 'daily';
		}

		this.isUpdating = false;
		this.setRepeat = entry.isRepeat();
		this.setRemind = entry.isRemind();
		if (radioSelector || this.setRemind) {
			this.isUpdating = true;
			var setDate = function (entry) {
				if (entry.get("repeatEnd")) {
					var repeatEnd = new Date(entry.get("repeatEnd"));
					this.selectedDate = repeatEnd;
					this.setSelectedDate(repeatEnd);
				}
			}.bind(this);
			this.renderController.show(this.repeatModifierSurface, null, function () {
				if (radioSelector) {
					document.getElementById(radioSelector).checked = true;
				}
				if (entry.isGhost()) {
					document.getElementById('confirm-each-repeat').checked = true;
				}
				setDate(entry);
				if (this.setRemind) {
					this.toggleSelector(this.remindSurface);
				}
				if (this.setRepeat) {
					this.toggleSelector(this.repeatSurface);
				}
			}.bind(this));
		}
	};

	TrackEntryFormView.prototype.toggleSelector = function(selectorSurface) {
		var isHilighted = selectorSurface ? _.contains(selectorSurface.getClassList(), 'highlight-surface') : null;
		if (selectorSurface && !isHilighted) {
			selectorSurface.addClass('highlight-surface');
		} else if (selectorSurface && isHilighted) {
			selectorSurface.removeClass('highlight-surface');
		}
	}

	TrackEntryFormView.prototype.buildStateFromEntry = function(entry) {
		console.log('entry selected with id: ' + entry.id);
		this.setPinned = this.setRemind = this.setRepeat = false;
		this.entry = entry;
		var directlyCreateEntry = false;
		if (entry.isContinuous() || ((entry.isRemind() || entry.isRepeat()) && entry.isGhost())) {
			var tag = entry.get('description');
			var tagStatsMap = autocompleteCache.tagStatsMap.get(tag);
			if ((tagStatsMap && tagStatsMap.typicallyNoAmount) || tag.indexOf('start') > -1 ||
					tag.indexOf('begin') > -1 || tag.indexOf('stop') > -1 || tag.indexOf('end') > -1) {
				directlyCreateEntry = true;
			}
		}
		var entryText = entry.toString();

		if (entry && entry.isContinuous()) {
			entryText = this.removeSuffix(entryText);
		}

		var selectionRange = entry.getSelectionRange();
		if (selectionRange !== undefined) {
			if (selectionRange[2]) { // insert space at selectionRange[0]
				entryText = entryText.substr(0, selectionRange[0] - 1) + " " + entryText.substr(selectionRange[0] - 1);
			}
		}

		var state = {
			viewProperties: {
				name: 'entry',
				value: entry,
				model: 'entry'
			},
			form: [{
				id: 'entry-description',
				value: entryText,
				selectionRange: selectionRange,
				elementType: ElementType.domElement,
				focus: true,
			}],
			postLoadAction: {
				name: 'showEntryModifiers',
				args: {entry: entry}
			}
		};

		if (directlyCreateEntry) {
			state.preShowCheck = {
				name: 'submit',
				args: [entry, true],
				doNotLoad: true,
			}
		}
		return state;
	};

	TrackEntryFormView.prototype.getCurrentState = function() {
		var state = BaseView.prototype.getCurrentState.call(this);
		var inputElement = document.getElementById("entry-description");
		return {
			viewProperties: [{
				name: 'entry',
				model: 'Entry',
				value: this.entry,
			},
			],
			form: [{
				id: 'entry-description',
				value: inputElement.value,
				selectionRange: [inputElement.selectionStart, inputElement.selectionEnd],
				elementType: ElementType.domElement,
				focus: true,
			}]
		};
	};


	TrackEntryFormView.prototype.submit = function(e, directlyCreateEntry) {
		/*if (cordova) {
			cordova.plugins.Keyboard.close();
		}*/
		var entry = null;
		var newText;

		if (e instanceof Entry && directlyCreateEntry) {
			entry = e;
			this.entry = entry;
			newText = this.removeSuffix(entry.toString());

			// Checking if entry is ghost but not pinned
			if (entry.isGhost() && !entry.isContinuous()) {
				this.entry.setText(newText);
				this.saveEntry(false);
				return;
			}
		} else {
			entry = this.entry;

			newText = document.getElementById("entry-description").value;
			if (!newText) {
				return false;
			}
		}

		if (!u.isOnline()) {
			u.showAlert("You don't seem to be connected. Please wait until you are online to add an entry.");
			return;
		}

		var repeatTypeId, repeatEnd;

		if (this.setRepeat || this.setRemind) {
			var repeatParams = Entry.getRepeatParams(this.setRepeat, this.setRemind, this.selectedDate);
			repeatTypeId = repeatParams.repeatTypeId;
			repeatEnd = repeatParams.repeatEnd;
		} else if (this.setPinned) {
			repeatTypeId = Entry.RepeatType.CONTINUOUSGHOST;
		}

		if (!entry || !entry.get('id') || entry.isContinuous()) {
			var newEntry = new Entry();
			newEntry.setText(newText);
			if (repeatTypeId) {
				newEntry.set("repeatType", repeatTypeId);
			}
			if (repeatEnd) {
				newEntry.set("repeatEnd", repeatEnd);
			}
			newEntry.create(function(resp) {
				if (this.setRepeat || this.setRemind || this.setPinned) {
					window.App.collectionCache.clear();
				}
				this.blur();
				this._eventOutput.emit('new-entry', resp);
			}.bind(this));
			return;
		} else if ((this['originalText-entry-description'] == newText) && (entry.get("repeatType") == repeatTypeId) && (entry.get("repeatEnd") == repeatEnd)) {
			console.log("TrackEntryFormView: No changes made");
			this.blur();
			this.trackView.killEntryForm(null);
			return;
		} else {
			entry.setText(newText);
			entry.set("repeatType", repeatTypeId);
			entry.set("repeatEnd", repeatEnd);
		}

		if (this.setRepeat || this.setRemind || this.setPinned) {
			window.App.collectionCache.clear();
		}

		if (this.hasFuture()) {
			this.alert = u.showAlert({
				message: 'Update just this one event or also future events?',
				a: 'One',
				b: 'All Future',
				onA: function() {
					this.saveEntry(false);
				}.bind(this),
				onB: function() {
					this.saveEntry(true);
				}.bind(this),
			});
			this.autoCompleteView.hide();
			return;
		}
		this.saveEntry(true);
	};

	TrackEntryFormView.prototype.saveEntry = function(allFuture) {
		var entry = this.entry;
		entry.save(allFuture, function(resp) {
			this._eventOutput.emit('update-entry', resp);
			this.blur();
		}.bind(this));
	};

	TrackEntryFormView.prototype.createEntry = function() {
		var entry = this.entry;
		entry.save(function(resp) {
			this.entry = new Entry(entry);
			this._eventOutput.emit('new-entry', resp);
		}.bind(this));
	};

	TrackEntryFormView.prototype.hasFuture = function() {
		var entry = this.entry;
		return ((entry.isRepeat() && !entry.isRemind()) || entry.isGhost()) && !entry.isTodayOrLater();
	};

	TrackEntryFormView.prototype.resetRepeatModifierForm = function() {
		this.repeatSurface.removeClass('highlight-surface');
		this.pinSurface.removeClass('highlight-surface');
		this.remindSurface.removeClass('highlight-surface');
		if (document.getElementById('repeat-modifier-form')) {
			document.getElementById('repeat-modifier-form').reset();
		}
	};

	App.pages[TrackEntryFormView.name] = TrackEntryFormView;
	module.exports = TrackEntryFormView;
})