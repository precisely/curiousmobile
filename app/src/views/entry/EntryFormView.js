define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var InputSurface = require('famous/surfaces/InputSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var Easing = require("famous/transitions/Easing");
	var RenderController = require("famous/views/RenderController");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var AutoCompleteView = require("views/AutoCompleteView");
	var u = require('util/Utils');
	var Entry = require('models/Entry');
	var EventHandler = require('famous/core/EventHandler');

	function EntryFormView(entry) {
		View.apply(this, arguments);
		this.entry = entry;
		if (!entry.get('id')) {
			this.newEntryForm = true;
		}
		this.renderController = new RenderController();
		this.iconRenderController = new RenderController();
		_createForm.call(this);
	}

	EntryFormView.prototype = Object.create(View.prototype);
	EntryFormView.prototype.constructor = EntryFormView;

	EntryFormView.DEFAULT_OPTIONS = {};
	EntryFormView.prototype.eventHandler = new EventHandler();
	var autoCompleteSurface = new AutoCompleteView();
	var enteredKey;

	function _zIndex(argument) {
		return window.App.zIndex.formView;
	}

	function _setListeners() {
		this.autoCompleteSurface.on('updateInputSurface', function(){
			console.log('update the Input Surface');
		}.bind(this));
	}

	function _createForm() {
		var formContainerSurface = new ContainerSurface({
			classes: ['entry-form'],
			properties: {
			}
		});

		this.backgroundModifier = new Modifier({
			size: [undefined,70],
			transform: Transform.translate(0, 0, _zIndex())
		});

		this.backgroundSurface = new Surface({
			properties: {
				backgroundColor: '#ad326c',
			}
		});
		formContainerSurface.add(this.backgroundModifier).add(this.backgroundSurface);
		this.inputModifier = new Modifier({
			align: [0, 0],
			transform: Transform.translate(15, 15, _zIndex())
		});

		this.inputModifier.sizeFrom(function() {
			var mainContext = window.mainContext;
			var size = mainContext.getSize();
			return [0.90 * size[0], 30];
		});

		var text = '';
		if (this.entry) {
			text = this.entry.toString();
		}
		this.inputSurface = new InputSurface({
			value: text,
			placeholder: 'Enter Tags Here (Example: Caffeine)'
		});

		this.toggleSuffix();

		this.inputSurface.on('keyup', function(e) {
			console.log('keyup on formview');
			//on enter
			if (e.keyCode == 13) {
				this.submit(e);
				this._eventOutput.emit('refresh-list-view');
			} else {
				enteredKey = e.srcElement.value;
				if (!enteredKey) {
					enteredKey = "/";
				}
//				autoCompleteSurface.getAutoCompletes(enteredKey);
//				formContainerSurface.add(autoCompleteSurface);
			}
		}.bind(this));


		this.inputSurface.on('click', function(e) {
			if (e instanceof CustomEvent && this.entry) {
				var selectionRange = this.entry.getSelectionRange();
				e.srcElement.setSelectionRange(selectionRange);
				this.renderController.show(this.buttonsAndHelp);
				this._eventOutput.emit('showing-form-view');
				this.backgroundModifier.setSize([undefined, undefined]);
				this.backgroundSurface.addClass('blur');
			}
		}.bind(this));

		//update input field
		autoCompleteSurface.onSelect(function(inputLabel) {
			console.log(inputLabel);
			this.inputSurface.setValue(inputLabel);
		}.bind(this));

		//		this.inputSurface.setValue('test');
		formContainerSurface.add(this.inputModifier).add(this.inputSurface);
		this.formContainerSurface = formContainerSurface;

		var sequentialLayout = new SequentialLayout({
			direction: 0,
			itemSpacing: 60,
			defaultItemSize: [100, 24],
		});

		sequentialLayout.setOutputFunction(function(input, offset, index) {
			//Bumping the offset to add additional padding on the left
			offset += 40;
			var transform = Transform.translate(offset, 40, 0);
			return {
				transform: transform,
				target: input.render()
			};
		});

		this.repeatSurface = new Surface({
			content: '<i class="fa fa-repeat"></i> <br/> Repeat',
			size: [24, 24],
		});

		this.repeatSurface.on('click', function(e) {
			console.log("repeatSurface event");
			if (e instanceof CustomEvent) {
				this.toggleSuffix('repeat');
			}
		}.bind(this));

		this.remindSurface = new Surface({
			content: '<i class="fa fa-bell"></i> <br/> Remind',
			size: [24, 24],
		});

		this.remindSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.toggleSuffix('remind');
			}
		}.bind(this));

		this.pinSurface = new Surface({
			content: '<i class="fa fa-star"></i><br/> Favorite',
			size: [24, 24],
		});

		this.pinSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.toggleSuffix('pinned');
			}
		}.bind(this));
		sequentialLayout.sequenceFrom([this.repeatSurface, this.pinSurface, this.remindSurface]);
		this.buttonsAndHelp = new ContainerSurface({
			size: [undefined, 320],
			properties: {
				color: '#ffffff'	
			}
		});
		this.renderController.inTransformFrom(function() {
			return Transform.translate(0, 40, _zIndex());
		});
		formContainerSurface.add(this.renderController);
		this.buttonsAndHelp.add(sequentialLayout);
		var helpSurface = new Surface({
			size: [260, undefined],
			content: 'You can repeat this tag, favorite it (keep it at the top of your list), or remind yourself later.',
			properties: {
				fontStyle: 'italic',
				color: 'white',
				paddingTop: '20px',
				borderTop: '1px solid white',
				marginTop: '110px',
				marginLeft: '20px'
			}
		});

		this.buttonsAndHelp.add(helpSurface);
		if (!this.newEntryForm) {
			var deleteSurface = new Surface({
				content: 'x',
				size: [24, 24],
				properties: {
					color: 'black',
				}
			});

			var deleteModifier = new Modifier({
				transform: Transform.translate(window.innerWidth * 0.95, 44, _zIndex())
			});

			formContainerSurface.add(deleteModifier).add(deleteSurface);
			deleteSurface.on('click', function(e) {
				if (e instanceof CustomEvent) {
					this.entry.delete(function(){
						this._eventOutput.emit('delete-entry',this.entry);
					}.bind(this))
				}
			}.bind(this));
		}

		this.add(formContainerSurface);
	}

	EntryFormView.prototype.toggleSuffix = function(suffix) {
		var text = this.inputSurface.getValue();
		if (text.endsWith(' repeat') || text.endsWith(' remind') || text.endsWith(' pinned')) {
			text = text.substr(0, text.length - 7);
		} else if (typeof suffix != 'undefined') {
			text += ' ' + suffix;
		}
		this.inputSurface.setValue(text);

		return text.length > 0;
	}

	EntryFormView.prototype.focus = function(arguments) {
		this.inputSurface.focus();
	}

	EntryFormView.prototype.setEntry = function(entry) {
		this.entry = entry;
		this.setEntryText(entry.toString());
	}

	EntryFormView.prototype.setEntryText = function(text){
		this.inputSurface.setValue(text);
	}

	EntryFormView.prototype.blur = function(e) {
		this.renderController.hide({duration: 0});
		this._eventOutput.emit('hiding-form-view');
		this.backgroundModifier.setSize([undefined, 70]);
		this.backgroundSurface.removeClass('blur');
	}

	EntryFormView.prototype.submit = function(e) {
		var entry = this.entry;
		var newText = e.srcElement.value;
		if (!u.isOnline()) {
			u.showAlert("Please wait until online to add an entry");
			return;
		}
		if (!entry || !entry.get('id') || entry.isContinuous()) {
			var newEntry = new Entry();
			newEntry.set('date', window.App.selectedDate);
			this.entry = newEntry;
			this.entry.setText(newText);
			this.entry.create(function(resp) {
				this._eventOutput.emit('new-entry', resp);
				this.inputSurface.setValue('');
				this.entry = null;
				this.blur();
			}.bind(this));
			return;
		} else if (!entry.isRemind() && entry.toString() == newText) {
			return;
		} else {
			entry.setText(newText);
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
					this.saveEntry(false);
				}.bind(this),
			});
			return;
		}
		this.saveEntry(false);
	}

	EntryFormView.prototype.saveEntry = function(allFuture) {
		var entry = this.entry;
		entry.save(allFuture, function(resp) {
			if (this.alert) {
				this.alert.controller.hide();
			}
			this._eventOutput.emit('update-entry', resp);
		}.bind(this));
		this.blur();
	}

	EntryFormView.prototype.createEntry = function(){
		var entry = this.entry;
		entry.save(function(resp) {
			this.entry = new Entry(entry);
			this._eventOutput.emit('new-entry', resp);
		}.bind(this));
	}

	EntryFormView.prototype.hasFuture = function(options) {
		var entry = this.entry;
		return((entry.isRepeat() && !entry.isRemind()) || entry.isGhost()) && entry.isTodayOrLater()
	}

	module.exports = EntryFormView;
});
