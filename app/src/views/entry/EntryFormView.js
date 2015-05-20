define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Timer = require('famous/utilities/Timer');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var InputSurface = require('famous/surfaces/InputSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require("famous/transitions/Easing");
	var RenderController = require("famous/views/RenderController");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var AutocompleteView = require("views/AutocompleteView");
	var u = require('util/Utils');
	var store = require('store');
	var Entry = require('models/Entry');
	var EntryCollection = require('models/EntryCollection');
	var EventHandler = require('famous/core/EventHandler');
	var inputSurfaceTemplate = require('text!templates/input-surface.html');

	function EntryFormView() {
		BaseView.apply(this, arguments);
		_setListeners.call(this);
		_createForm.call(this);
		this.parentPage = 'TrackView';
	}

	EntryFormView.prototype = Object.create(BaseView.prototype);
	EntryFormView.prototype.constructor = EntryFormView;

	EntryFormView.DEFAULT_OPTIONS = {
		header: true,
		backButton: true,
	};
	EntryFormView.prototype.eventHandler = new EventHandler();
	var enteredKey;

	function _zIndex(argument) {
		return window.App.zIndex.formView;
	}

	function _setListeners() {
		this.autoCompleteView = new AutocompleteView();
		this.autoCompleteView.on('updateInputSurface', function() {
			console.log('update the Input Surface');
		}.bind(this));

		this.on('new-entry', function(data) {
			console.log("New Entry - TrackView event");
			var currentListView = this.getPage('TrackView').currentListView;
			currentListView.refreshEntries(data.entries, data.glowEntry);
			this.changePage('TrackView');
		}.bind(App.pageView));

		this.on('update-entry', function(resp) {
			console.log('EntryListView: Updating an entry');
			var currentListView = this.getPage('TrackView').currentListView;
			currentListView.refreshEntries(resp.entries, resp.glowEntry);
			this.changePage('TrackView');
		}.bind(App.pageView));

		this.on('go-back', function(e) {
			console.log('EventHandler: this.entryFormView event: go-back');
			store.set('lastPage', 'TrackView');
			this.getPage('EntryFormView').blur();
		}.bind(App.pageView));

		this.on('hiding-form-view', function(e) {
			console.log('EventHandler: this.entryFormView event: hiding-form-view');
			this.changePage('TrackView');
		}.bind(App.pageView));
	}

	function _createForm() {
		this.clazz = 'EntryFormView';
		this.setHeaderLabel('ENTER TAG');
		var formContainerSurface = new ContainerSurface({
			classes: ['entry-form'],
			properties: {
				backgroundColor: '#ad326c',
			}
		});

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
			console.log('keyup on formview');
			//on enter
			if (e.keyCode == 13) {
				this.submit(e);
				this._eventOutput.emit('refresh-list-view');
			} else if (e.keyCode == 27) {
				this.blur(e);
			} else {
				enteredKey = e.srcElement.value;
				this.autoCompleteView.getAutocompletes(enteredKey);
				formContainerSurface.add(this.autoCompleteView);
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

		var firstOffset = 20;
		sequentialLayout.setOutputFunction(function(input, offset, index) {
			//Bumping the offset to add additional padding on the left
			if (index === 0) {
				offset = firstOffset;
			} else {
				offset += firstOffset;
			}
			var transform = Transform.translate(offset, 200, _zIndex() + 1);
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
			size: [34, 24],
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
			size: [undefined, 320],
			classes: ['entry-form-buttons'],
			properties: {
				color: '#ffffff',
				backgroundColor: '#ad326c',
			}
		});
		this.buttonsAndHelp.add(sequentialLayout);
		var helpSurface = new Surface({
			size: [window.innerWidth - 40, undefined],
			content: 'You can repeat the tag, make a button out of it (for instant access), or remind yourself later.<hr>',
			properties: {
				fontStyle: 'italic',
				color: 'white',
				margin: '30px 20px',
				padding: '12px 10px',
				textAlign: 'justify',
			}
		});

		var helpModifier = new Modifier({
			transform: Transform.translate(0, 50, 0)
		});
		this.buttonsAndHelp.add(helpModifier).add(helpSurface);

		formContainerSurface.add(this.buttonsAndHelp);
		this.setBody(formContainerSurface);
	}

	EntryFormView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		console.log('FormView: on-show ' + state);
		if (!state) {
			//TODO if no state
			App.pageView.changePage(this.parentPage);
			return;
		}
		this.loadState(state);
	};

	EntryFormView.prototype.toggleSuffix = function(suffix) {
		var text = document.getElementsByName("entry-description")[0].value;
		if (text.endsWith(' repeat') || text.endsWith(' remind') || text.endsWith(' pinned')) {
			text = text.substr(0, text.length - 7);
		}

		if (typeof suffix != 'undefined') {
			text += ' ' + suffix;
		}
		document.getElementsByName("entry-description")[0].value = text;

		return text.length > 0;
	};

	EntryFormView.prototype.removeSuffix = function(text) {
		text = text ? text : document.getElementsByName("entry-description")[0].value;
		if (text.endsWith(' repeat') || text.endsWith(' pinned') ||
			text.endsWith(' button')) {
			text = text.substr(0, text.length - 7);
		}
		if (text.endsWith(' favorite')) {
			text = text.substr(0, text.length - 8);
		}
		return text;
	};

	EntryFormView.prototype.buildStateFromEntry = function(entry) {
		console.log('entry selected with id: ' + entry.id);
		var currentDayEntries =
			new EntryCollection(EntryCollection.getFromCache(
				App.pageView.getPage('TrackView').getSelectedDate()));
		entry = currentDayEntries.get(entry);
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
				entry: entry,
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
			state.postLoadAction = {
				name: 'submit',
				args: [entry, true],
			}
		}

		return state;
	};

	EntryFormView.prototype.blur = function(e) {
		this.autoCompleteView.hide();
		this.unsetEntry();
		this._eventOutput.emit('hiding-form-view');
	};

	EntryFormView.prototype.getCurrentState = function() {
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

	EntryFormView.prototype.setCurrentState = function(state) {
		var result = BaseView.prototype.setCurrentState.call(this, state);
		if (state && result) {
			var inputElement = document.getElementById("entry-description");
			this.entry = new Entry(state.entry);
		} else {
			return false;
		}
	}

	EntryFormView.prototype.setEntry = function(entry) {
		this.entry = entry;
	};

	EntryFormView.prototype.unsetEntry = function() {
		var inputElement = document.getElementById("entry-description");
		if (inputElement) {
			inputElement.value = '';
		}
		this.entry = null;
		this.setEntryText('');
	};

	EntryFormView.prototype.setEntryText = function(text) {
		document.getElementsByName("entry-description")[0].value = '';
	};

	EntryFormView.prototype.submit = function(e, directlyCreateEntry) {
		var entry = null;
		var newText = document.getElementsByName("entry-description")[0].value;

		if (e instanceof Entry && directlyCreateEntry) {
			entry = e;
			this.entry = entry;
			newText = this.removeSuffix(entry.toString());
		} else {
			entry = this.entry;
		}

		if (!u.isOnline()) {
			u.showAlert("Please wait until online to add an entry");
			return;
		}
		if (!entry || !entry.get('id') || entry.isContinuous()) {
			var newEntry = new Entry();
			newEntry.set('date', window.App.selectedDate);
			newEntry.setText(newText);
			newEntry.create(function(resp) {
				if (newText.indexOf('repeat') > -1 || newText.indexOf('remind') > -1 ||
					newText.indexOf('pinned') > -1) {
					window.App.collectionCache.clear();
				}
				store.set('lastPage', 'track');
				this.blur();
				this._eventOutput.emit('new-entry', resp);
			}.bind(this));
			return;
		} else if (this.originalText == newText) {
			console.log("EntryFormView: No changes made");
			if (entry.isRemind()) {
				entry.setText(newText);
				this.saveEntry(false);
				return;
			}
			this.blur();
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
			return;
		}
		this.saveEntry(false);
	};

	EntryFormView.prototype.saveEntry = function(allFuture) {
		var entry = this.entry;
		entry.save(allFuture, function(resp) {
			this._eventOutput.emit('update-entry', resp);
			this.blur();
		}.bind(this));
	};

	EntryFormView.prototype.createEntry = function() {
		var entry = this.entry;
		entry.save(function(resp) {
			this.entry = new Entry(entry);
			this._eventOutput.emit('new-entry', resp);
		}.bind(this));
	};

	EntryFormView.prototype.hasFuture = function() {
		var entry = this.entry;
		return ((entry.isRepeat() && !entry.isRemind()) || entry.isGhost()) && entry.isTodayOrLater();
	};

	App.pages[EntryFormView.name] = EntryFormView;
	module.exports = EntryFormView;
});
