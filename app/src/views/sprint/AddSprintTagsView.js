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
	var inputSurfaceTemplate = require('text!templates/input-surface.html');

	function AddSprintTagsView(parentView) {
		StateView.apply(this, arguments);
		this.parentView = parentView;
		_createForm.call(this);
		_setListeners.call(this);
	}

	AddSprintTagsView.prototype = Object.create(StateView.prototype);
	AddSprintTagsView.prototype.constructor = AddSprintTagsView;

	AddSprintTagsView.prototype.eventHandler = new EventHandler();
	var enteredKey;

	function _zIndex(argument) {
		return window.App.zIndex.formView;
	}

	function _setListeners() {
		this.autoCompleteView.on('updateInputSurface', function() {
			console.log('update the Input Surface');
		}.bind(this));

		this.on('form-sprint-entry', function(resp) {
			var createdEntry = resp.glowEntry;
			console.log('Entry comment: ' + createdEntry.comment);
			var icon = (createdEntry.comment.indexOf('repeat') > -1) ? '<i class="fa fa-repeat"></i>' : 
					(createdEntry.comment.indexOf('remind') > -1) ? '<i class="fa fa-bell"></i>' : 
					(createdEntry.comment.indexOf('pinned') > -1) ? '<i class="fa fa-thumb-track"></i>' : '';
			var entryItem = '<button class="entry-button">' + createdEntry.description + icon + '</button>';
			this.parentView.killAddSprintTagsOverlay(entryItem);
		}.bind(this));
	}

	function _createForm() {
		this.clazz = 'AddSprintTagsView';
		var AutocompleteObj = new Autocomplete();
		this.autoCompleteView = new AutocompleteView(AutocompleteObj);
		var formContainerSurface = new ContainerSurface({
			classes: ['entry-form'],
			properties: {
				background: 'rgb(184, 182, 182)'
			}
		});
		formContainerSurface.add(this.autoCompleteView);

		this.inputModifier = new Modifier({
			align: [0, 0],
			transform: Transform.translate(15, 15, _zIndex())
		});

		this.inputModifier.sizeFrom(function() {
			var mainContext = window.mainContext;
			var size = mainContext.getSize();
			return [window.innerWidth - 30, 40];
		});

		this.inputSurface = new Surface({
			classes: ['input-surface'],
			content: _.template(inputSurfaceTemplate, {
				tag: ''
			}, templateSettings),
		});

		this.inputSurface.on('keyup', function(e) {
			//on enter
			if (e.keyCode == 13) {
				this.submit(e);
			} else if (e.keyCode == 27) {
				this.blur(e);
				this.goBack();
			} else {
				enteredKey = e.srcElement.value;
				this.autoCompleteView.getAutocompletes(enteredKey);
			}
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

		formContainerSurface.add(this.inputModifier).add(this.inputSurface);
		this.formContainerSurface = formContainerSurface;

		var sequentialLayout = new SequentialLayout({
			direction: 0,
			itemSpacing: 80,
			defaultItemSize: [100, 24],
		});

		var firstOffset = (App.width / 2) - 140;
		sequentialLayout.setOutputFunction(function(input, offset, index) {
			//Bumping the offset to add additional padding on the left
			if (index === 0) {
				offset = firstOffset;
			} else {
				offset += firstOffset;
			}
			var transform = Transform.translate(offset, 150, _zIndex() + 1);
			return {
				transform: transform,
				target: input.render()
			};
		});

		this.repeatSurface = new Surface({
			content: '<i class="fa fa-repeat"></i> <br/> Repeat',
			size: [34, 24],
		});

		this.repeatSurface.on('click', function(e) {
			console.log("repeatSurface event");
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				this.removeSuffix();
				this.toggleSuffix('repeat');
				this.submit();
			}
		}.bind(this));

		this.remindSurface = new Surface({
			content: '<i class="fa fa-bell"></i> <br/> Remind',
			size: [34, 24],
		});

		this.remindSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				this.removeSuffix();
				this.toggleSuffix('remind');
				this.submit();
			}
		}.bind(this));

		this.pinSurface = new Surface({
			content: '<i class="fa fa-thumb-tack"></i><br/> Pin It',
			size: [37, 24],
		});

		this.pinSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				this.removeSuffix();
				this.toggleSuffix('pinned');
				this.submit();
			}
		}.bind(this));
		sequentialLayout.sequenceFrom([this.repeatSurface, this.pinSurface, this.remindSurface]);
		this.buttonsAndHelp = new ContainerSurface({
			size: [undefined, undefined],
			classes: ['entry-form-buttons'],
			properties: {
				color: '#fff',
				backgroundColor: 'transparent'
			}
		});
		this.buttonsAndHelp.add(sequentialLayout);

		this.formContainerSurface.add(this.buttonsAndHelp);
		this.add(this.formContainerSurface);
	}
	
	AddSprintTagsView.prototype.preShow = function(state) {
		if (state.preShowCheck) {
			this[state.preShowCheck.name].apply(this, state.preShowCheck.args);
			if (state.preShowCheck.doNotLoad) {
				return false;
			}
		}
		return true;
	};
	AddSprintTagsView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		if (!state) {
			//TODO if no state
			App.pageView.changePage(this.parentView);
			return;
		}
		this.loadState(state);
	};

	AddSprintTagsView.prototype.toggleSuffix = function(suffix) {
		var text = document.getElementById("entry-description").value;
		if (text.endsWith(' repeat') || text.endsWith(' remind') || text.endsWith(' pinned')) {
			text = text.substr(0, text.length - 7);
		}

		if (typeof suffix != 'undefined') {
			text += ' ' + suffix;
		}
		document.getElementById("entry-description").value = text;

		return text.length > 0;
	};

	AddSprintTagsView.prototype.removeSuffix = function(text) {
		text = text ? text : document.getElementById("entry-description").value;
		if (text.endsWith(' repeat') || text.endsWith(' pinned') ||
			text.endsWith(' button')) {
			text = text.substr(0, text.length - 7);
		}
		if (text.endsWith(' favorite')) {
			text = text.substr(0, text.length - 8);
		}
		return text;
	};

	AddSprintTagsView.prototype.buildStateFromEntry = function(entry) {
		console.log('entry selected with id: ' + entry.id);
		this.entry = entry;
		var directlyCreateEntry = false;
		if (entry.isContinuous() || (entry.isRemind() && entry.isGhost())) {
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
			}]
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

	AddSprintTagsView.prototype.blur = function(e) {
		this.autoCompleteView.hide();
		this.unsetEntry();
	};

	AddSprintTagsView.prototype.getCurrentState = function() {
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

	AddSprintTagsView.prototype.setCurrentState = function(state) {
		var result = BaseView.prototype.setCurrentState.call(this, state);
		if (state && result) {
			var inputElement = document.getElementById("entry-description");
			this.entry = new Entry(state.entry);
		} else {
			return false;
		}
	}

	AddSprintTagsView.prototype.setEntry = function(entry) {
		this.entry = entry;
	};

	AddSprintTagsView.prototype.unsetEntry = function() {
		var inputElement = document.getElementById("entry-description");
		if (inputElement) {
			inputElement.value = '';
		}
		this.entry = null;
		this.setEntryText('');
	};

	AddSprintTagsView.prototype.setEntryText = function(text) {
		document.getElementById("entry-description").value = '';
	};

	AddSprintTagsView.prototype.submit = function(e, directlyCreateEntry) {
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
					newText.indexOf('pinned') > -1) {
					window.App.collectionCache.clear();
				}
				this.blur();
				this._eventOutput.emit('form-sprint-entry', resp);
			}.bind(this));
			return;
		} else if (this.originalText == newText) {
			console.log("AddSprintTagsView: No changes made");
			if (entry.isRemind()) {
				entry.setText(newText);
				this.saveEntry(false);
				return;
			}
			this.blur();
			this.goBack();
			return;
		} else {
			entry.setText(newText);
		}

		if (newText.indexOf('repeat') > -1 || newText.indexOf('remind') > -1 ||
			newText.indexOf('pinned') > -1) {
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

	AddSprintTagsView.prototype.saveEntry = function(allFuture) {
		var entry = this.entry;
		entry.save(allFuture, function(resp) {
			this._eventOutput.emit('form-sprint-entry', resp);
			this.blur();
		}.bind(this));
	};

	AddSprintTagsView.prototype.createEntry = function() {
		var entry = this.entry;
		entry.save(function(resp) {
			this.entry = new Entry(entry);
			this._eventOutput.emit('form-sprint-entry', resp);
		}.bind(this));
	};

	AddSprintTagsView.prototype.hasFuture = function() {
		var entry = this.entry;
		return ((entry.isRepeat() && !entry.isRemind()) || entry.isGhost()) && !entry.isTodayOrLater();
	};

	App.pages[AddSprintTagsView.name] = AddSprintTagsView;
	module.exports = AddSprintTagsView;
});