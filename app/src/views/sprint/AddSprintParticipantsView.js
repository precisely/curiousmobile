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
	var ParticipantsAutocomplete = require('models/ParticipantsAutocomplete');
	var u = require('util/Utils');
	var Utility = require('famous/utilities/Utility');
	var store = require('store');
	var Entry = require('models/Entry');
	var EventHandler = require('famous/core/EventHandler');
	var inputSurfaceTemplate = require('text!templates/input-surface.html');

	function AddSprintParticipantsView(parentView) {
		StateView.apply(this, arguments);
		this.parentView = parentView;
		this.parentPage = parentView;
		_setListeners.call(this);
		_createForm.call(this);
	}

	AddSprintParticipantsView.prototype = Object.create(StateView.prototype);
	AddSprintParticipantsView.prototype.constructor = AddSprintParticipantsView;

	AddSprintParticipantsView.prototype.eventHandler = new EventHandler();
	var enteredKey;

	function _zIndex(argument) {
		return window.App.zIndex.formView;
	}

	function _setListeners() {
		var AutocompleteObj = new ParticipantsAutocomplete();
		this.autoCompleteView = new AutocompleteView(AutocompleteObj);
		this.autoCompleteView.on('updateInputSurface', function() {
			console.log('update the Input Surface');
		}.bind(this));

		this.on('new-sprint-participant', function(resp) {
			var participant = resp;
			this.parentView.killAddSprintParticipantsOverlay(participant + '<br>');
		}.bind(this));
	}

	function _createForm() {
		this.clazz = 'AddSprintParticipantsView';

		var formContainerSurface = new ContainerSurface({
			properties: {
				background: 'rgb(184, 182, 182)'
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
			content: '<input type="text" id="participant-username" placeholder="search by username...">',
			size: [undefined, undefined],
			properties: {
			}
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
				formContainerSurface.add(this.autoCompleteView);
			}
		}.bind(this));

		//update input field
		this.autoCompleteView.onSelect(function(inputLabel) {
			console.log(inputLabel);
			Timer.setTimeout(function() {
				var inputElement = document.getElementById("participant-username");
				inputElement.value = inputLabel;
				this.submit(inputLabel);
			}.bind(this), 500);
		}.bind(this));

		formContainerSurface.add(this.inputModifier).add(this.inputSurface);
		this.formContainerSurface = formContainerSurface;

		this.add(this.formContainerSurface);
	}
	
	AddSprintParticipantsView.prototype.preShow = function(state) {
		if (state.preShowCheck) {
			this[state.preShowCheck.name].apply(this, state.preShowCheck.args);
			if (state.preShowCheck.doNotLoad) {
				return false;
			}
		}
		return true;
	};
	AddSprintParticipantsView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		if (!state) {
			//TODO if no state
			App.pageView.changePage(this.parentView);
			return;
		}
		this.loadState(state);
	};

	AddSprintParticipantsView.prototype.blur = function(e) {
		this.autoCompleteView.hide();
		this.unsetEntry();
	};

	AddSprintParticipantsView.prototype.getCurrentState = function() {
		var state = BaseView.prototype.getCurrentState.call(this);
		var inputElement = document.getElementById("entry-description");
		return {
			viewProperties: [{
					name: 'entry',
					model: 'User',
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

	AddSprintParticipantsView.prototype.setCurrentState = function(state) {
		var result = BaseView.prototype.setCurrentState.call(this, state);
		if (state && result) {
			var inputElement = document.getElementById("entry-description");
			this.entry = new Entry(state.entry);
		} else {
			return false;
		}
	}

	AddSprintParticipantsView.prototype.setEntry = function(entry) {
		this.entry = entry;
	};

	AddSprintParticipantsView.prototype.unsetEntry = function() {
		var inputElement = document.getElementById("entry-description");
		if (inputElement) {
			inputElement.value = '';
		}
		this.entry = null;
		this.setEntryText('');
	};

	AddSprintParticipantsView.prototype.setEntryText = function(text) {
		document.getElementById("entry-description").value = '';
	};

	AddSprintParticipantsView.prototype.submit = function(participantUsername) {
		queuePostJSON('Adding members', App.serverUrl + '/api/sprint/action/addMember', u.getCSRFPreventionObject('addMemberCSRF',
				{username: participantUsername, sprintHash: this.parentView.hash}), function (data) {
			if (!u.checkData(data)) {
				return;
			}

			if (data.success) {
				this._eventOutput.emit('new-sprint-participant', participantUsername);
			}
		}.bind(this), function(data) {
			u.showAlert(data.message);
		});
	};

	App.pages[AddSprintParticipantsView.name] = AddSprintParticipantsView;
	module.exports = AddSprintParticipantsView;
});
