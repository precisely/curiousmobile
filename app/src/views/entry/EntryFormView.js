define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
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
	var StateView = require('views/StateView');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var AutocompleteView = require("views/AutocompleteView");
	var Autocomplete = require('models/Autocomplete');
	var u = require('util/Utils');
	var store = require('store');
	var Entry = require('models/Entry');
	var DateUtil = require('util/DateUtil');
	var DateGridView = require('views/calendar/DateGridView');
	var EntryCollection = require('models/EntryCollection');
	var EventHandler = require('famous/core/EventHandler');
	var inputSurfaceTemplate = require('text!templates/input-surface.html');
	var repeatModifierTemplate = require('text!templates/repeat-input-modifier.html');

	function EntryFormView(trackView) {
		StateView.apply(this, arguments);
		this.trackView = trackView;
		this.dateGridOpen = false;
		_createForm.call(this);
		_setListeners.call(this);
	}

	EntryFormView.prototype = Object.create(StateView.prototype);
	EntryFormView.prototype.constructor = EntryFormView;

	EntryFormView.prototype.eventHandler = new EventHandler();
	var enteredKey;

	function _zIndex(argument) {
		return window.App.zIndex.formView;
	}

	function _setListeners() {
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
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				this.removeSuffix();
				this.setRemind = false;
				this.setRepeat = true;
				this.setPinned = false;
				if (!this.isUpdating) {
					this.resetRepeatModifierForm();
				}
				this.highlightSelector(this.repeatSurface);
				this.renderController.show(this.repeatModifierSurface);
			}
		}.bind(this));

		this.remindSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				this.removeSuffix();
				this.setRemind = true;
				this.setRepeat = false;
				this.setPinned = false;
				if (!this.isUpdating) {
					this.resetRepeatModifierForm();
					this.renderController.show(this.repeatModifierSurface, null, function() {
						document.getElementById('daily').checked = false;
						document.getElementById('confirm-each-repeat').checked = true;
					}.bind(this));
				} else {
					this.renderController.show(this.repeatModifierSurface);
				}
				this.highlightSelector(this.remindSurface);
			}
		}.bind(this));

		this.pinSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				this.removeSuffix();
				this.setRemind = false;
				this.setRepeat = false;
				this.setPinned = true;
				this.highlightSelector(this.pinSurface);
				this.submit();
				this.renderController.hide();
			}
		}.bind(this));

		this.repeatModifierSurface.on('click', function(e) {
			var classList = e.srcElement.parentElement.classList;
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				if (_.contains(classList, 'entry-checkbox') || 
						_.contains(e.srcElement.parentElement.parentElement.classList, 'entry-checkbox')) {
					var repeatEachCheckbox = document.getElementById('confirm-each-repeat');
					repeatEachCheckbox.checked = !repeatEachCheckbox.checked;
				} else if (_.contains(classList, 'input-group')) {
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

	EntryFormView.prototype.setSelectedDate = function(date) {
		var App = window.App;
		this.selectedDate = date;

		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 
				'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		var monthName = months[date.getMonth()];
		document.getElementsByClassName('choose-date-input')[0].value = date.getDate() + ' '  + monthName 
				+ ' ' + date.getFullYear();
	}

	function _createForm() {
		this.clazz = 'EntryFormView';

		var formContainerSurface = new ContainerSurface({
			classes: ['entry-form'],
			properties: {
				background: 'rgba(123, 120, 120, 0.48)'
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
			//on enter
			if (e.keyCode == 13) {
				this.submit(e);
			} else if (e.keyCode == 27) {
				this.blur(e);
				this.trackView.killEntryForm(null);
			} else {
				enteredKey = e.srcElement.value;
				this.autoCompleteView.getAutocompletes(enteredKey);
				formContainerSurface.add(this.autoCompleteView);
			}
		}.bind(this));

		formContainerSurface.add(this.inputModifier).add(this.inputSurface);
		this.formContainerSurface = formContainerSurface;

		var sequentialLayout = new SequentialLayout({
			direction: 0,
			itemSpacing: 30,
			defaultItemSize: [80, 24],
		});

		var firstOffset = (App.width / 2) - 175;
		sequentialLayout.setOutputFunction(function(input, offset, index) {
			//Bumping the offset to add additional padding on the left
			if (index === 0) {
				offset = (firstOffset < 0) ? 10 : firstOffset;
			} else {
				offset += (firstOffset < 0) ? 0 : firstOffset;
			}
			var transform = Transform.translate(offset, 80, _zIndex() + 1);
			return {
				transform: transform,
				target: input.render()
			};
		});

		this.repeatSurface = new Surface({
			content: '<div class="text-center"><i class="fa fa-repeat"></i> <br/> Set Repeat</div>',
			size: [84, 24],
		});

		this.remindSurface = new Surface({
			content: '<div class="text-center"><i class="fa fa-bell"></i> <br/> Set Alarm</div>',
			size: [84, 24],
		});

		this.pinSurface = new Surface({
			content: '<div class="text-center"><i class="fa fa-plus-square-o"></i><br/> Make Button</div>',
			size: [84, 24],
		});

		sequentialLayout.sequenceFrom([this.repeatSurface, this.remindSurface, this.pinSurface]);
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

		this.renderController = new RenderController();
		this.dateGridRenderController = new RenderController();
		this.repeatModifierSurface = new Surface({
			content: _.template(repeatModifierTemplate, templateSettings),
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'transparent',
				padding: '30px'
			}
		});

		var mod = new StateModifier({
			size: [App.width, App.height - 220],
			transform: Transform.translate(0, 130, 16)
		});
		var dateGridRenderControllerMod = new StateModifier({
			transform: Transform.translate(0, 160, 16)
		});
		this.formContainerSurface.add(mod).add(this.renderController);
		this.formContainerSurface.add(dateGridRenderControllerMod).add(this.dateGridRenderController);
		this.add(this.formContainerSurface);
	}
	
	EntryFormView.prototype.preShow = function(state) {
		if (state.preShowCheck) {
			this[state.preShowCheck.name].apply(this, state.preShowCheck.args);
			if (state.preShowCheck.doNotLoad) {
				return false;
			}
		}
		return true;
	};
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

	EntryFormView.prototype.removeSuffix = function(text) {
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
	
	/**
	 * If form loads in edit mode, this will initialize
	 * entry modifier form according to properties of current entry
	 */
	EntryFormView.prototype.showEntryModifiers = function(arguments) {
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
				if (entry.attributes.repeatEnd) {
					var repeatEnd = new Date(entry.attributes.repeatEnd);
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
					this.highlightSelector(this.remindSurface);
				} else {
					this.highlightSelector(this.repeatSurface);
				}
			}.bind(this));
		}
	};

	EntryFormView.prototype.highlightSelector = function(selectorSurface) {
		this.pinSurface.removeClass('highlight-surface');
		this.repeatSurface.removeClass('highlight-surface');
		this.remindSurface.removeClass('highlight-surface');
		if (selectorSurface) {
			selectorSurface.addClass('highlight-surface');
		}
	}

	EntryFormView.prototype.buildStateFromEntry = function(entry) {
		console.log('entry selected with id: ' + entry.id);
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

	EntryFormView.prototype.blur = function(e) {
		this.autoCompleteView.hide();
		this.unsetEntry();
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
		if (document.getElementById('entry-description')) {
			document.getElementById('entry-description').value = '';
		}
	};

	function getRepeatParams(isRepeat, isRemind, repeatEnd) {
		var repeatTypeId = getRepeatTypeId(isRepeat, isRemind, repeatEnd);
		if (repeatEnd) {
			repeatEnd = repeatEnd.setHours(23, 59, 59, 0);
			var now = new Date();
			if(new Date(repeatEnd) < now) {
				now.setHours(23,59,59,0);
				repeatEnd = now;
			}
			repeatEnd = new Date(repeatEnd).toUTCString();
		}
		return {repeatTypeId: repeatTypeId, repeatEnd: repeatEnd};
	}

	function getRepeatTypeId(isRepeat, isRemind, repeatEnd) {
		var confirmRepeat = document.getElementById('confirm-each-repeat').checked;
		var frequencyBit, repeatTypeBit;

		if (document.getElementById('daily').checked) {
			frequencyBit = Entry.RepeatType.DAILY_BIT;
		} else if (document.getElementById('weekly').checked) {
			frequencyBit = Entry.RepeatType.WEEKLY_BIT;
		} else if (document.getElementById('monthly').checked) {
			frequencyBit = Entry.RepeatType.MONTHLY_BIT;
		}
		if (!isRepeat && (frequencyBit || repeatEnd || confirmRepeat)) {
			isRepeat = true;
		}
		if (isRepeat) {
			if (frequencyBit) {
				repeatTypeBit = (Entry.RepeatType.CONCRETEGHOST_BIT | frequencyBit);
			} else {
				repeatTypeBit = (Entry.RepeatType.CONCRETEGHOST_BIT);
			}
		}
		if (isRemind) {
			if (repeatTypeBit) {
				repeatTypeBit = (Entry.RepeatType.REMIND_BIT | repeatTypeBit);
			} else {
				repeatTypeBit = Entry.RepeatType.REMIND_BIT;
			}
		}

		if (confirmRepeat) {
			return (repeatTypeBit | Entry.RepeatType.GHOST_BIT);
		}
		return (repeatTypeBit);
	}

	EntryFormView.prototype.submit = function(e, directlyCreateEntry) {
		var entry = null;
		var newText;

		if (e instanceof Entry && directlyCreateEntry) {
			entry = e;
			this.entry = entry;
			newText = this.removeSuffix(entry.toString());
			if (entry.isGhost() && !entry.isContinuous()) {
				this.entry.setText(newText);
				this.saveEntry(false);
				return;
			}
		} else {
			entry = this.entry;

			newText = document.getElementById("entry-description").value;
			if (newText === '') {
				return false;
			}
		}

		if (!u.isOnline()) {
			u.showAlert("You don't seem to be connected. Please wait until you are online to add an entry.");
			return;
		}

		var repeatTypeId, repeatEnd;

		if (this.setRepeat || this.setRemind) {
			var repeatParams = getRepeatParams(this.setRepeat, this.setRemind, this.selectedDate);
			repeatTypeId = repeatParams.repeatTypeId;
			repeatEnd = repeatParams.repeatEnd;
		} else if (this.setPinned) {
			repeatTypeId = Entry.RepeatType.CONTINUOUSGHOST;
		}

		if (!entry || !entry.get('id') || entry.isContinuous()) {
			var newEntry = new Entry();
			newEntry.set('date', DateUtil.getMidnightDate(this.selectedDate || App.selectedDate));
			newEntry.setText(newText);
			if (repeatTypeId) {
				newEntry.repeatTypeId = repeatTypeId;
			}
			if (repeatEnd && repeatEnd != '') {
				newEntry.repeatEnd = repeatEnd;
			} 
			newEntry.create(function(resp) {
				if (this.setRepeat || this.setRemind || this.setPinned) {
					window.App.collectionCache.clear();
				}
				this.blur();
				this._eventOutput.emit('new-entry', resp);
			}.bind(this));
			return;
		} else if ((this.originalText == newText) && (entry.repeatType == repeatTypeId) && (entry.repeatEnd == repeatEnd)) {
			console.log("EntryFormView: No changes made");
			this.blur();
			this.trackView.killEntryForm(null);
			return;
		} else {
			entry.setText(newText);
			if (repeatTypeId) {
				entry.repeatTypeId = repeatTypeId;
			}
			if (repeatEnd) {
				entry.repeatEnd = repeatEnd;
			} 
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
		return ((entry.isRepeat() && !entry.isRemind()) || entry.isGhost()) && !entry.isTodayOrLater();
	};

	EntryFormView.prototype.resetRepeatModifierForm = function() {
		this.highlightSelector(null);
		if (document.getElementById('repeat-modifier-form')) {
			document.getElementById('repeat-modifier-form').reset();
		}
	};

	App.pages[EntryFormView.name] = EntryFormView;
	module.exports = EntryFormView;
});
