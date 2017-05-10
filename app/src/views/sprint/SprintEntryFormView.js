define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Timer = require('famous/utilities/Timer');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var InputSurface = require('famous/surfaces/InputSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var Transitionable = require('famous/transitions/Transitionable');
	var StateView = require('views/StateView');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var AutocompleteView = require("views/AutocompleteView");
	var TagsAutoComplete = require('models/TagsAutoComplete');
	var u = require('util/Utils');
	var Utility = require('famous/utilities/Utility');
	var store = require('store');
	var Entry = require('models/Entry');
	var EventHandler = require('famous/core/EventHandler');
	var EntryFormView = require('views/entry/EntryFormView');

	function SprintEntryFormView(parentView) {
		EntryFormView.apply(this, arguments);
		this.parentView = parentView;
		this.buttonsRenderController.show(this.buttonsAndHelp);
		this.submitSurface.setContent('<button type="button" class="full-width-button create-entry-button">ADD TAG</button>');
		this.createDeleteButton();
	}

	SprintEntryFormView.prototype = Object.create(EntryFormView.prototype);
	SprintEntryFormView.prototype.constructor = SprintEntryFormView;

	SprintEntryFormView.prototype._setListeners = function() {
		var AutocompleteObj = new TagsAutoComplete();
		window.autocompleteCache = AutocompleteObj;
		this.autoCompleteView = new AutocompleteView(AutocompleteObj);
		this.autoCompleteView.on('updateInputSurface', function() {
			console.log('update the Input Surface');
		}.bind(this));

		this.autoCompleteView.onSelect(function(inputLabel) {
			console.log(inputLabel);
			Timer.setTimeout(function() {
				var inputElement = document.getElementById("entry-description");
				inputElement.value = inputLabel;
				inputElement.focus();
			}.bind(this), 500);
		}.bind(this));

		this.on('form-sprint-entry', function(resp) {
			var createdEntry = resp.glowEntry;
			var entryItem = this.parentView.getTagItem(createdEntry);
			this.parentView.killAddSprintTagsOverlay({entryItem: entryItem, entry: createdEntry});
		}.bind(this));

		this.on('update-sprint-entry', function(resp) {
			var updatedEntry = resp.glowEntry;
			var entryItem = this.parentView.getTagItem(updatedEntry);
			this.parentView.killAddSprintTagsOverlay({entryItem: entryItem, entry: updatedEntry, hasUpdatedTag: true});
		}.bind(this));

		this.on('delete-entry', function(resp) {
			if (resp && resp.fail) {
				u.showAlert('Could not delete entry');
				this.parentView.killAddSprintTagsOverlay();
			} else {
				this.parentView.killAddSprintTagsOverlay({entryId: this.entry.get('id'), hasDeletedTag: true});
			}
		}.bind(this));

		this.remindSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				document.getElementById("entry-description").value = this.removeSuffix();
				this.setRemind = !this.setRemind;
				this.setRepeat = this.setPinned = false;
				this.toggleSelector(this.remindSurface);
			}
		}.bind(this));

		this.repeatSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				document.getElementById("entry-description").value = this.removeSuffix();
				this.setRepeat = !this.setRepeat;
				this.setRemind = this.setPinned = false;
				this.toggleSelector(this.repeatSurface);
			}
		}.bind(this));

		this.pinSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				document.getElementById("entry-description").value = this.removeSuffix();
				this.setPinned = !this.setPinned;
				this.setRemind = this.setRepeat = false;
				this.toggleSelector(this.pinSurface);
			}
		}.bind(this));
	};

	SprintEntryFormView.prototype.preShow = function(state) {
		if (state.preShowCheck) {
			this[state.preShowCheck.name].apply(this, state.preShowCheck.args);
			if (state.preShowCheck.doNotLoad) {
				return false;
			}
		}
		return true;
	};

	SprintEntryFormView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		if (!state) {
			//TODO if no state
			App.pageView.changePage(this.parentView);
			return;
		}
		this.loadState(state);
	};

	/**
	 * If form loads in edit mode, this will initialize
	 * entry modifier form according to properties of current entry
	 * currently not in use
	 */
	SprintEntryFormView.prototype.showEntryModifiers = function(args) {
		var buttonName = 'CREATE ENTRY';
		var isInEditMode = false;

		if (this.entry.get('id')) {
			buttonName = 'UPDATE ENTRY';
			isInEditMode = true;
		}

		this.submitSurface.setContent('<button type="button" class="full-width-button create-entry-button">' + buttonName + '</button>');
		this.submitButtonModifier.setTransform(Transform.translate(30, 180, App.zIndex.formView));

		if (isInEditMode) {
			this.deleteButtonModifier.setTransform(Transform.translate(30, 230, App.zIndex.formView));
		}

		this.buttonsRenderController.show(this.buttonsAndHelp);
		this.submitButtonRenderController.show(this.submitSurface);
		this.resetRepeatModifierForm();
		var entry = this.entry;

		if (entry.isRemind()) {
			this.setRemind = true;
			this.toggleSelector(this.remindSurface);
		} else if (entry.isRepeat()) {
			this.setRepeat = true;
			this.toggleSelector(this.repeatSurface);
		} else {
			this.setPinned = true;
			this.toggleSelector(this.pinSurface);
		}

		this.buttonsRenderController.show(this.buttonsAndHelp);

		if (isInEditMode) {
			this.deleteButtonRenderController.show(this.deleteButtonSurface);
		}
	};

	SprintEntryFormView.prototype.toggleSuffix = function(suffix) {
		var text = document.getElementById("entry-description").value;
		if (text.endsWith(' repeat') || text.endsWith(' remind') || text.endsWith(' pinned')) {
			text = text.substr(0, text.length - 7);
		} else if (text.endsWith(' bookmark')) {
			text = text.substr(0, text.length - 9);
		}

		if (typeof suffix != 'undefined') {
			text += ' ' + suffix;
		}
		document.getElementById("entry-description").value = text;

		return text.length > 0;
	};

	SprintEntryFormView.prototype.submit = function(e, directlyCreateEntry) {
		var entry = this.entry;
		var newText = document.getElementById("entry-description").value;

		if (!newText) {
			return;
		}

		var repeatTypeId;

		if (!u.isOnline()) {
			u.showAlert("You don't seem to be connected. Please wait until you are online to add an entry.");
			return;
		}

		if (this.setRepeat || this.setRemind) {
			var repeatParams = Entry.getRepeatParams(this.setRepeat, this.setRemind);
			repeatTypeId = repeatParams.repeatTypeId;
		} else {
			repeatTypeId = Entry.RepeatType.CONTINUOUSGHOST;
		}

		if (!entry || !entry.get('id')) {
			var newEntry = new Entry();
			if (repeatTypeId) {
				newEntry.set("repeatType", repeatTypeId);
			}
			newEntry.set('date', window.App.selectedDate);
			newEntry.userId = this.parentView.virtualUserId;
			newEntry.setText(newText);

			// This code is replicated from Web's feeds.js file.
			var baseDate = new Date('January 1, 2001 12:00 am');

			newEntry.create(function(resp) {
				if (newText.indexOf('repeat') > -1 || newText.indexOf('remind') > -1 ||
					newText.indexOf('pinned') > -1 || newText.indexOf('bookmark') > -1) {
					window.App.collectionCache.clear();
				}
				this.blur();
				this._eventOutput.emit('form-sprint-entry', resp);
			}.bind(this), baseDate);
			return;
		} else {
			if (repeatTypeId) {
				entry.set("repeatType", repeatTypeId);
			}
			entry.setText(newText);
		}

		this.saveEntry(true);
	};

	SprintEntryFormView.prototype.saveEntry = function(allFuture) {
		var entry = this.entry;
		entry.save(allFuture, function(resp) {
			this._eventOutput.emit('update-sprint-entry', resp);
			this.blur();
		}.bind(this));
	};

	SprintEntryFormView.prototype.createEntry = function() {
		var entry = this.entry;
		entry.save(function(resp) {
			this.entry = new Entry(entry);
			this._eventOutput.emit('form-sprint-entry', resp);
		}.bind(this));
	};

	SprintEntryFormView.prototype.hasFuture = function() {
		var entry = this.entry;
		return ((entry.isRepeat() && !entry.isRemind()) || entry.isGhost()) && !entry.isTodayOrLater();
	};

	App.pages[SprintEntryFormView.name] = SprintEntryFormView;
	module.exports = SprintEntryFormView;
});
