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
	var Autocomplete = require('models/Autocomplete');
	var u = require('util/Utils');
	var Utility = require('famous/utilities/Utility');
	var store = require('store');
	var Entry = require('models/Entry');
	var EventHandler = require('famous/core/EventHandler');
	var EntryFormView = require('views/entry/EntryFormView');

	function SprintEntryFormView(parentView) {
		EntryFormView.apply(this, arguments);
		this.parentView = parentView;
	}

	SprintEntryFormView.prototype = Object.create(EntryFormView.prototype);
	SprintEntryFormView.prototype.constructor = SprintEntryFormView;

	function _zIndex(argument) {
		return window.App.zIndex.formView;
	}

	SprintEntryFormView.prototype._setListeners = function() {
		var AutocompleteObj = new Autocomplete();
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
			console.log('Entry comment: ' + createdEntry.comment);
			var icon = (createdEntry.comment.indexOf('repeat') > -1) ? '<i class="fa fa-repeat"></i>' : 
					(createdEntry.comment.indexOf('remind') > -1) ? '<i class="fa fa-bell"></i>' : 
					((createdEntry.comment.indexOf('bookmark') > -1) || (createdEntry.comment.indexOf('pinned') > -1)) ? '<i class="fa fa-bookmark"></i>' : '';
			var entryItem = '<button class="entry-button">' + createdEntry.description + icon + '</button>';
			this.parentView.killAddSprintTagsOverlay(entryItem);
		}.bind(this));

		this.remindSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.removeSuffix();
				if (this.toggleSuffix(' remind')) {
					this.submit();
				}
			}
		}.bind(this));

		this.repeatSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.removeSuffix();
				if (this.toggleSuffix(' repeat')) {
					this.submit();
				}
			}
		}.bind(this));

		this.pinSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.removeSuffix();
				if (this.toggleSuffix(' bookmark')) {
					this.submit();
				}
			}
		}.bind(this));
	}

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
		var entry = null;
		var newText = document.getElementById("entry-description").value;

		if (e instanceof Entry && directlyCreateEntry) {
			entry = e;
			this.entry = entry;
			newText = this.removeSuffix(entry.toString());
		} else {
			entry = this.entry;
		}

		if (!u.isOnline()) {
			u.showAlert("You don't seem to be connected. Please wait until you are online to add an entry.");
			return;
		}
		if (!entry || !entry.get('id') || entry.isContinuous()) {
			var newEntry = new Entry();
			newEntry.set('date', window.App.selectedDate);
			newEntry.userId = this.parentView.virtualUserId;
			newEntry.setText(newText);
			newEntry.create(function(resp) {
				if (newText.indexOf('repeat') > -1 || newText.indexOf('remind') > -1 ||
					newText.indexOf('pinned') > -1 || newText.indexOf('bookmark') > -1) {
					window.App.collectionCache.clear();
				}
				this.blur();
				this._eventOutput.emit('form-sprint-entry', resp);
			}.bind(this));
			return;
		} else {
			entry.setText(newText);
		}

		this.saveEntry(true);
	};

	SprintEntryFormView.prototype.saveEntry = function(allFuture) {
		var entry = this.entry;
		entry.save(allFuture, function(resp) {
			this._eventOutput.emit('form-sprint-entry', resp);
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
