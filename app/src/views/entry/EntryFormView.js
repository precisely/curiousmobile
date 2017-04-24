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
	var RenderController = require("famous/views/RenderController");
	var StateView = require('views/StateView');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var DraggableView = require("views/widgets/DraggableView");
	var store = require('store');
	var Entry = require('models/Entry');
	var DateUtil = require('util/DateUtil');
	var DateGridView = require('views/calendar/DateGridView');
	var EntryCollection = require('models/EntryCollection');
	var EventHandler = require('famous/core/EventHandler');
	var inputSurfaceTemplate = require('text!templates/input-surface.html');
	var repeatModifierTemplate = require('text!templates/repeat-input-modifier.html');
	var Engine = require('famous/core/Engine');

	function EntryFormView() {
		StateView.apply(this, arguments);
		this.dateGridOpen = false;
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				background: (this.constructor.name === 'TrackEntryFormView') ? 'rgba(123, 120, 120, 0.48)' : 'rgb(184, 182, 182)'
			}
		});
		this.add(new StateModifier({
			transform: Transform.translate(0, 0, 0)
		})).add(backgroundSurface);
		_createForm.call(this);
		this._setListeners();
	}

	EntryFormView.prototype = Object.create(StateView.prototype);
	EntryFormView.prototype.constructor = EntryFormView;

	EntryFormView.prototype.eventHandler = new EventHandler();
	var enteredKey;

	function _zIndex(argument) {
		// zIndex calculated on top of the containing surface hence returning 0 will use zIndex of the form container
		return 1;
	}

	EntryFormView.prototype.setSelectedDate = function(date) {
		if (!date) {
			document.getElementsByClassName('choose-date-input')[0].value = '';
			return;
		}
		var App = window.App;
		this.selectedDate = date;

		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
			'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
		];
		var monthName = months[date.getMonth()];
		document.getElementsByClassName('choose-date-input')[0].value = date.getDate() + ' ' + monthName + ' ' + date.getFullYear();
	};

	function _createForm() {
		this.clazz = 'EntryFormView';

		var formContainerSurface = new ContainerSurface({
			size: [undefined, undefined],
			classes: ['entry-form', 'draggable-container'],
			properties: {}
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
			}, templateSettings)
		});

		this.inputSurface.on('click', function(e) {
			document.getElementById('entry-description').focus();
		});

		formContainerSurface.add(this.inputModifier).add(this.inputSurface);
		this.formContainerSurface = formContainerSurface;

		if (!this.justBookmark) {
			this.showEntryButtons();
		}
		this.submitSurface = new Surface({
			content: '<button type="button" class="full-width-button create-entry-button">CREATE/UPDATE ENTRY</button>',
			size: [undefined, true]
		});

		this.submitSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (_.contains(e.srcElement.classList, 'create-entry-button')) {
					this.submit();
				}
			}
		}.bind(this));

		this.submitButtonModifier = new StateModifier({
			size: [App.width - 60, undefined],
			transform: Transform.translate(30, 180, App.zIndex.formView + 5)
		});

		this.submitButtonRenderController = new RenderController();
		this.submitButtonRenderController.show(this.submitSurface);
		this.formContainerSurface.add(this.submitButtonModifier).add(this.submitButtonRenderController);

		this.draggableEntryFormView = new DraggableView(this.formContainerSurface, true, 300);
		this.add(new StateModifier({
			transform: Transform.translate(0, 0, App.zIndex.formView + 2)
		})).add(this.draggableEntryFormView);
	}

	EntryFormView.prototype.createDeleteButton = function() {
		this.deleteButtonSurface = new Surface({
			content: '<button type="button" class="full-width-button create-entry-button">DELETE ENTRY</button>',
			size: [undefined, true]
		});

		this.deleteButtonSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.entry.delete(function(data) {
				    this.trackView.killTrackEntryForm();
                    this.trackView.currentListView.deleteLegacyEntryViewForEntry(this.entry);
				}.bind(this));
			}
		}.bind(this));

		this.deleteButtonRenderController = new RenderController();
		this.deleteButtonModifier = new StateModifier({
			size: [App.width - 60, undefined],
			transform: Transform.translate(30, 250, App.zIndex.formView + 5)
		});
		this.formContainerSurface.add(this.deleteButtonModifier).add(this.deleteButtonRenderController);
	};

	EntryFormView.prototype.showEntryButtons = function() {
		this.buttonsRenderController = new RenderController();
		var sequentialLayout = new SequentialLayout({
			direction: 0,
			itemSpacing: 50,
			defaultItemSize: [80, 24],
		});

		this.repeatSurface = new Surface({
			content: '<div class="text-center"><i class="fa fa-repeat"></i> <br/> Set Repeat</div>',
			size: [84, 24]
		});

		this.remindSurface = new Surface({
			content: '<div id="remind-surface" class="text-center"><i class="fa fa-bell"></i> <br/>' + ((this.constructor.name === 'TrackEntryFormView') ? ' Set Alert' : ' Daily Alert') + '</div>',
			size: [84, 24]
		});

		this.pinSurface = new Surface({
			content: '',
			size: [0, 0]
		});

		this.firstOffset = (App.width - ((84 * 2) + 30)) / 2;
		sequentialLayout.sequenceFrom([this.repeatSurface, this.remindSurface]);
		this.buttonsAndHelp = new ContainerSurface({
			size: [undefined, true],
			classes: ['entry-form-buttons'],
			properties: {
				color: '#fff',
				backgroundColor: 'transparent'
			}
		});
		this.buttonsAndHelp.add(sequentialLayout);

		this.buttonsModifier = new StateModifier({
			transform: Transform.translate(this.firstOffset, 100, _zIndex())
		});
		this.formContainerSurface.add(this.buttonsModifier).add(this.buttonsRenderController);

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

		this.repeatControllerModifier = new StateModifier({
			size: [App.width, undefined],
			transform: Transform.translate(0, 140, _zIndex() + 1)
		});
		this.dateGridRenderControllerMod = new StateModifier({
			transform: Transform.translate(18, 220, 16)
		});
		this.formContainerSurface.add(this.repeatControllerModifier).add(this.renderController);
		this.formContainerSurface.add(new StateModifier({
			transform: Transform.translate(0, 0, _zIndex() + 2)
		})).add(this.dateGridRenderControllerMod).add(this.dateGridRenderController);
	};

	EntryFormView.prototype.preShow = function(state) {
		if (state.preShowCheck) {
			this[state.preShowCheck.name].apply(this, state.preShowCheck.args);
			if (state.preShowCheck.doNotLoad) {
				return false;
			}
		}
		return true;
	};

	EntryFormView.prototype.toggleSelector = function(selectorSurface) {
		var isHilighted = selectorSurface ? _.contains(selectorSurface.getClassList(), 'highlight-surface') : null;
		if (this.constructor.name === 'SprintEntryFormView') {
			this.repeatSurface.removeClass('highlight-surface');
			this.remindSurface.removeClass('highlight-surface');
			this.pinSurface.removeClass('highlight-surface');
		}
		if (selectorSurface && !isHilighted) {
			selectorSurface.addClass('highlight-surface');
		} else if (selectorSurface && isHilighted) {
			selectorSurface.removeClass('highlight-surface');
		}
	};

	EntryFormView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		console.log('FormView: on-show ' + state);
		if (!state) {
			//TODO if no state
			App.pageView.changePage(this.parentPage);
			return;
		} else if (state) {
			if (state.bookmarkForm) {
				this.setPinned = true;
				this.setRemind = this.setRepeat = false;
				this.buttonsRenderController.hide();
				this.renderController.hide();
				this.submitSurface.setContent('<button type="button" class="full-width-button create-entry-button">CREATE BOOKMARK</button>');
				this.submitButtonModifier.setTransform(Transform.translate(30, 200, App.zIndex.formView + 5));
				this.submitButtonRenderController.show(this.submitSurface);
				return;
			} else if (!this.entry && state.viewProperties) {
				this.entry  = state.viewProperties.value;
			}
		}
		this.loadState(state);
	};

	EntryFormView.prototype.resetRepeatModifierForm = function() {
		this.repeatSurface.removeClass('highlight-surface');
		this.pinSurface.removeClass('highlight-surface');
		this.remindSurface.removeClass('highlight-surface');
		if (document.getElementById('repeat-modifier-form')) {
			document.getElementById('repeat-modifier-form').reset();
		}
	};

	EntryFormView.prototype.toggleSuffix = function(suffix) {
		var text = document.getElementById("entry-description").value;
		if (text.endsWith(' repeat') || text.endsWith(' remind') || text.endsWith(' pinned') || text.endsWith(' button')) {
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

	EntryFormView.prototype.removeSuffix = function(text) {
		text = text ? text : document.getElementById("entry-description").value;
		if (text.endsWith(' repeat') || text.endsWith(' remind') || text.endsWith(' pinned') ||
			text.endsWith(' button')) {
			text = text.substr(0, text.length - 7);
		} else if (text.endsWith(' bookmark')) {
			text = text.substr(0, text.length - 9);
		}

		if (text.endsWith(' favorite')) {
			text = text.substr(0, text.length - 8);
		}
		return text;
	};

	EntryFormView.prototype.blur = function(e) {
		this.autoCompleteView.hide();
		this.unsetEntry();
	};

	EntryFormView.prototype.setCurrentState = function(state) {
		var result = BaseView.prototype.setCurrentState.call(this, state);
		if (state && result) {
			var inputElement = document.getElementById("entry-description");
			this.entry = new Entry(state.entry);
		} else {
			return false;
		}
	};

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

	EntryFormView.prototype.batchMoveUpModifiers = function() {
		this.modifiersMovedDown = false;
		this.buttonsModifier.setTransform(Transform.translate(this.firstOffset, 100, _zIndex()));
		this.repeatControllerModifier.setTransform(Transform.translate(0, 140, _zIndex()));
		this.dateGridRenderControllerMod.setTransform(Transform.translate(18, 220, 16));
		var yTransformSubmitButtonModifier = this.submitButtonModifier.getTransform()[13];
		if (yTransformSubmitButtonModifier > 150) {
			this.submitButtonModifier.setTransform(Transform.translate(30, this.submitButtonModifier.getTransform()[13] - 100, App.zIndex.formView + 5));
			this.deleteButtonModifier.setTransform(Transform.translate(30, this.deleteButtonModifier.getTransform()[13] - 100, App.zIndex.formView + 5));
		}
	};

	EntryFormView.prototype.batchMoveDownModifiers = function() {
		this.modifiersMovedDown = true;
		this.buttonsModifier.setTransform(Transform.translate(this.firstOffset, 200, _zIndex()));
		this.repeatControllerModifier.setTransform(Transform.translate(0, 240, _zIndex()));
		this.dateGridRenderControllerMod.setTransform(Transform.translate(18, 320, 16));
		var yTransformSubmitButtonModifier = this.submitButtonModifier.getTransform()[13];
		if (yTransformSubmitButtonModifier < 500) {
			this.submitButtonModifier.setTransform(Transform.translate(30, this.submitButtonModifier.getTransform()[13] + 100, App.zIndex.formView + 5));
			this.deleteButtonModifier.setTransform(Transform.translate(30, this.deleteButtonModifier.getTransform()[13] + 100, App.zIndex.formView + 5));
		}
	};

	App.pages[EntryFormView.name] = EntryFormView;
	module.exports = EntryFormView;
});
