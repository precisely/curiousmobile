define(function(require, exports, module) {
	'use strict';

	var EntryFormView = require('views/entry/EntryFormView');
	var DateGridView = require('views/calendar/DateGridView');
	var BaseView = require('views/BaseView');
	var Timer = require('famous/utilities/Timer');
	var Transform = require('famous/core/Transform');
	var AutocompleteView = require("views/AutocompleteView");
	var Autocomplete = require('models/TagsAutoComplete');
	var Entry = require('models/Entry');
	var u = require('util/Utils');
	var store = require('store');
	var Surface = require('famous/core/Surface');
	var RenderController = require("famous/views/RenderController");
	var StateModifier = require('famous/modifiers/StateModifier');

	function TrackEntryFormView(options) {
		EntryFormView.apply(this, arguments);
		this.trackView = options.trackView;
		this.dateGridOpen = false;
		this.createDeleteButton();
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
				if (this.modifiersMovedDown) {
					this.batchMoveUpModifiers();
				}
			}.bind(this), 500);
		}.bind(this));

		this.repeatSurface.on('click', function(e) {
			console.log("repeatSurface event");
			if (e instanceof CustomEvent) {
				this.removeSuffix();
				this.setRepeat = !this.setRepeat;
				this.setPinned = false;
				if (this.setRepeat) {
					this.renderController.show(this.repeatModifierSurface, null, function() {
						document.getElementById('daily').checked = true;
						this.setSelectedDate(this.selectedDate);
					}.bind(this));
					this.submitButtonModifier.setTransform(Transform.translate(30, this.submitButtonModifier.getTransform()[13] + 220, App.zIndex.formView + 5));
					this.deleteButtonModifier.setTransform(Transform.translate(30, this.deleteButtonModifier.getTransform()[13] + 220, App.zIndex.formView + 5));
				} else {
					this.dateGridRenderController.hide();
					this.renderController.hide();
					this.submitButtonModifier.setTransform(Transform.translate(30, this.submitButtonModifier.getTransform()[13] - 220, App.zIndex.formView + 5));
					this.deleteButtonModifier.setTransform(Transform.translate(30, this.deleteButtonModifier.getTransform()[13] - 220, App.zIndex.formView + 5));
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
				if (store.get('showRemindAlertBalloon') && this.setRemind) {
					App.showPopover('#remind-surface', {key: 'setAlert', autoHide: true, container: '#remind-surface'});
					store.set('showRemindAlertBalloon', false);
				}
			}
		}.bind(this));

		this.pinSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.removeSuffix();
				this.setPinned = !this.setPinned;
				this.setRepeat = this.setRemind = false;
				this.toggleSelector(this.pinSurface);
				this.dateGridRenderController.hide();
				this.renderController.hide();
				this.submit();
			}
		}.bind(this));

		this.repeatModifierSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.parentElement.classList;
				if (_.contains(classList, 'date-picker-field')) {
					if (typeof cordova !== 'undefined') {
						cordova.plugins.Keyboard.close();
					}
					document.getElementById('entry-description').blur();
					if (this.dateGridOpen) {
						this.dateGridRenderController.hide();
					} else {
						this.dateGrid = new DateGridView(this.selectedDate || new Date());
						this.dateGridRenderController.show(this.dateGrid, null, function() {
							App.pageView.getCurrentView().showShimSurface();
						});
						this.dateGrid.on('select-date', function(date) {
							console.log('CalenderView: Date selected');
							this.setSelectedDate(date);
							this.dateGridRenderController.hide();
							this.dateGridOpen = false;
						}.bind(this));

						this.dateGrid.on('close-date-grid', function(date) {
							this.dateGridRenderController.hide();
						}.bind(this));
					}
					this.dateGridOpen = !this.dateGridOpen;
				}
			}
		}.bind(this));

		this.on('new-entry', function(resp) {
			console.log("New Entry - TrackView event");
			this.resetRepeatModifierForm();
			this.renderController.hide();
			window.autocompleteCache.update(resp.tagStats[0], resp.tagStats[1], resp.tagStats[2],resp.tagStats[3], resp.tagStats[4]);
			this.trackView.killTrackEntryForm();
			this.trackView.preShow({data: resp, fromServer: true});
		}.bind(this));

		this.on('update-entry', function(resp) {
			console.log('EntryListView: Updating an entry ');
			this.resetRepeatModifierForm();
			this.renderController.hide();
			if (resp.tagStats[0]) {
				window.autocompleteCache.update(resp.tagStats[0][0], resp.tagStats[0][1], resp.tagStats[0][2],resp.tagStats[0][3], resp.tagStats[0][4])
			}
			if (resp.tagStats[1]) {
				window.autocompleteCache.update(resp.tagStats[1][0], resp.tagStats[1][1], resp.tagStats[1][2],resp.tagStats[1][3], resp.tagStats[1][4])
			}
			this.trackView.killTrackEntryForm();
			this.trackView.preShow({data: resp, fromServer: true});
		}.bind(this));
	};

	/**
	 * If form loads in edit mode, this will initialize
	 * entry modifier form according to properties of current entry
	 */
	TrackEntryFormView.prototype.showEntryModifiers = function(args) {
		var buttonName = 'CREATE ENTRY';
		var isInEditMode = false;

		if (this.entry.get('id')) {
			buttonName = 'UPDATE ENTRY';
			isInEditMode = true;
		}

		this.submitSurface.setContent('<button type="button" class="full-width-button create-entry-button">' + buttonName + '</button>');
		this.submitButtonModifier.setTransform(Transform.translate(30, 180, App.zIndex.formView + 5));

		if (isInEditMode) {
			this.deleteButtonModifier.setTransform(Transform.translate(30, 230, App.zIndex.formView + 5));
		}

		this.buttonsRenderController.show(this.buttonsAndHelp);
		this.submitButtonRenderController.show(this.submitSurface);
		this.resetRepeatModifierForm();
		this.renderController.hide();
		this.selectedDate = null;
		var entry = this.entry;
		if (isInEditMode) {
			if(!entry.isContinuous() || entry.state === 'bookmarkEdit') {
				this.deleteButtonRenderController.show(this.deleteButtonSurface);
			}
		}
		if (entry.isContinuous() && entry.state !== 'bookmarkEdit') {
			this.setRepeat = false;
			this.setRemind = false;
			this.setPinned = false;
			this.submitSurface.setContent('<button type="button" class="full-width-button create-entry-button">CREATE ENTRY</button>');
			return;
		} else if (entry.state === 'bookmarkEdit') {
			this.setPinned = true;
			this.buttonsRenderController.hide();
			this.submitSurface.setContent('<button type="button" class="full-width-button create-entry-button">UPDATE BOOKMARK</button>');
			this.deleteButtonSurface.setContent('<button type="button" class="full-width-button create-entry-button">DELETE BOOKMARK</button>');
			return;
		}

		var radioSelector = 'daily';
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
		if (this.setRepeat) {
			this.isUpdating = true;
			var setDate = function(entry) {
				if (entry.get("repeatEnd")) {
					var repeatEnd = new Date(entry.get("repeatEnd"));
					this.selectedDate = repeatEnd;
					this.setSelectedDate(repeatEnd);
				}
			}.bind(this);
			this.submitButtonModifier.setTransform(Transform.translate(30, this.submitButtonModifier.getTransform()[13] + 220, App.zIndex.formView + 5));
			this.deleteButtonModifier.setTransform(Transform.translate(30, this.deleteButtonModifier.getTransform()[13] + 220, App.zIndex.formView + 5));
			this.renderController.show(this.repeatModifierSurface, null, function() {
				document.getElementById(radioSelector).checked = true;
				if (entry.isGhost()) {
					document.getElementById('confirm-each-repeat').checked = true;
				}
				setDate(entry);
			}.bind(this));
		}
		if (this.setRemind) {
			this.toggleSelector(this.remindSurface);
		}
		if (this.setRepeat) {
			this.toggleSelector(this.repeatSurface);
		}
		this.buttonsRenderController.show(this.buttonsAndHelp);
	};

	TrackEntryFormView.prototype.buildStateFromEntry = function(entry) {
		console.log('Build state for entry with id: ' + entry.id);
		this.setPinned = this.setRemind = this.setRepeat = false;
		this.entry = entry;
		var directlyCreateEntry = false;
		if (entry.state !== 'bookmarkEdit' && (entry.isContinuous() || ((entry.isRemind() || entry.isRepeat()) && entry.isGhost()))) {
			var tag = this.removeSuffix(entry.toString());
			var tagStatsMap = autocompleteCache.tagStatsMap.get(tag);
			var nullAmount = false;
			if ((entry.get('amountPrecision') < 0) && (entry.get('amount') == null)) {
				nullAmount = true;
 			}
			if (!tagStatsMap) {
				tagStatsMap = autocompleteCache.tagStatsMap.getFromText(tag);
			}
			if (!tagStatsMap || tagStatsMap.typicallyNoAmount) {
				if (nullAmount) {
					directlyCreateEntry = false;
				} else {
					directlyCreateEntry = true;
				}
			} else if (tag.indexOf('start') > -1 || tag.indexOf('begin') > -1 ||
					tag.indexOf('stop') > -1 || tag.indexOf('end') > -1 || (entry.isRepeat() && entry.isGhost())) {
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
				focus: true
			}],
			postLoadAction: {
				name: 'showEntryModifiers',
				args: {
					entry: entry
				}
			}
		};

		if (directlyCreateEntry) {
			state.preShowCheck = {
				name: 'submit',
				args: [entry, true],
				doNotLoad: true
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
				value: this.entry
			}],
			form: [{
				id: 'entry-description',
				value: inputElement.value,
				selectionRange: [inputElement.selectionStart, inputElement.selectionEnd],
				elementType: ElementType.domElement,
				focus: true
			}]
		};
	};


	TrackEntryFormView.prototype.submit = function(e, directlyCreateEntry) {
		this.autoCompleteView.hide();
		$('#remind-surface').popover('destroy');
		if (typeof cordova !== 'undefined') {
			cordova.plugins.Keyboard.close();
		}
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

		if (!entry || !entry.get('id') || (entry.isContinuous() && entry.state !== 'bookmarkEdit') ||
				(!entry.isContinuous() && repeatTypeId && repeatTypeId === Entry.RepeatType.CONTINUOUSGHOST)) {
			var newEntry = new Entry();
			newEntry.setText(newText);
			if (repeatTypeId) {
				newEntry.set("repeatType", repeatTypeId);
			}
			if (repeatEnd) {
				newEntry.set("repeatEnd", repeatEnd);
			}
			this.trackView.killTrackEntryForm();
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
			this.trackView.killTrackEntryForm();
			this.trackView._eventOutput.emit('done-edit-bookmarks');
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
				type: 'alert',
				message: 'Update just this one event or also future events?',
				a: 'One',
				b: 'All Future',
				onA: function() {
					this.saveEntry(false);
				}.bind(this),
				onB: function() {
					this.saveEntry(true);
				}.bind(this)
			});
			return;
		}
		this.saveEntry(true);
	};

	TrackEntryFormView.prototype.saveEntry = function(allFuture) {
		var entry = this.entry;
		this.trackView.killTrackEntryForm();
		entry.save(allFuture, function(resp) {
			this._eventOutput.emit('update-entry', resp);
			this.blur();
		}.bind(this));
	};

	TrackEntryFormView.prototype.createEntry = function() {
		var entry = this.entry;
		this.trackView.killTrackEntryForm();
		entry.save(function(resp) {
			this.entry = new Entry(entry);
			this._eventOutput.emit('new-entry', resp);
		}.bind(this));
	};

	TrackEntryFormView.prototype.hasFuture = function() {
		var entry = this.entry;
		return ((entry.isRepeat() && !entry.isRemind()) || entry.isGhost()) && !entry.isTodayOrLater();
	};

	TrackEntryFormView.prototype.resetTrackEntryFormView = function() {
		this.dateGridRenderController.hide();
		this.renderController.hide();
		this.buttonsRenderController.hide();
		this.submitButtonRenderController.hide();
		this.deleteButtonRenderController.hide();
		this.batchMoveUpModifiers();
	};

	App.pages[TrackEntryFormView.name] = TrackEntryFormView;
	module.exports = TrackEntryFormView;
});
