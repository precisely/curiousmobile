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
	var EventHandler = require('famous/core/EventHandler');
	var inputSurfaceTemplate = require('text!templates/input-surface.html');

	function AddSprintParticipantsView(parentView) {
		StateView.apply(this, arguments);
		this.parentView = parentView;
		this.parentPage = parentView;
		_createForm.call(this);
		_setListeners.call(this);
	}

	AddSprintParticipantsView.prototype = Object.create(StateView.prototype);
	AddSprintParticipantsView.prototype.constructor = AddSprintParticipantsView;

	AddSprintParticipantsView.prototype.eventHandler = new EventHandler();
	var enteredKey;

	function _zIndex(argument) {
		return window.App.zIndex.formView;
	}

	function _setListeners() {
		this.autoCompleteView.on('updateInputSurface', function() {
			console.log('update the Input Surface');
		}.bind(this));

		this.on('new-sprint-participant', function(resp) {
			var participant = '<p>' + resp + ' <i class="fa fa-times-circle delete-participant" data-participant="' + resp + '"></i></p>';
			this.parentView.killAddSprintParticipantsOverlay(participant);
		}.bind(this));
	}

	function _createForm() {
		this.clazz = 'AddSprintParticipantsView';
		var AutocompleteObj = new ParticipantsAutocomplete();
		this.autoCompleteView = new AutocompleteView(AutocompleteObj);
		var formContainerSurface = new ContainerSurface({
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
			content: '<input type="text" id="participant-username" placeholder="search by username...">',
			size: [undefined, undefined],
			properties: {
			}
		});

		this.inputSurface.on('keyup', function(e) {
			//on enter
			if (e.keyCode == 13) {
				if (cordova) {
					cordova.plugins.Keyboard.close();
				}
				var username = document.getElementById("participant-username").value;
				if (username && username != '') {
					this.submit(username);
				}
			} else if (e.keyCode == 27) {
				this.blur(e);
				this.goBack();
			} else {
				enteredKey = e.srcElement.value;
				this.autoCompleteView.getAutocompletes(enteredKey);
			}
		}.bind(this));

		this.autoCompleteView.onSelect(function(inputLabel) {
			console.log(inputLabel);
			var inputElement = document.getElementById("participant-username");
			inputElement.value = inputLabel;
			this.submit(inputLabel);
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
	};

	AddSprintParticipantsView.prototype.getCurrentState = function() {
		var state = BaseView.prototype.getCurrentState.call(this);
		var inputElement = document.getElementById("participant-username");
		return {
			form: [{
				id: 'participant-username',
				value: inputElement.value,
				elementType: ElementType.domElement,
				focus: true,
			}]
		};
	};

	AddSprintParticipantsView.prototype.setCurrentState = function(state) {
		var result = BaseView.prototype.setCurrentState.call(this, state);
		if (state && result) {
			var inputElement = document.getElementById("participant-username");
		} else {
			return false;
		}
	}

	AddSprintParticipantsView.prototype.unsetInputField = function() {
		var inputElement = document.getElementById("participant-username");
		if (inputElement) {
			inputElement.value = '';
		}
	};

	AddSprintParticipantsView.prototype.submit = function(participantUsername) {
		u.queuePostJSON('Adding members', App.serverUrl + '/api/sprint/action/addMember', u.getCSRFPreventionObject('addMemberCSRF',
				{username: participantUsername, sprintHash: this.parentView.hash}), function (data) {
			if (!u.checkData(data)) {
				return;
			}

			if (data.success) {
				this._eventOutput.emit('new-sprint-participant', participantUsername);
			} else if (data.error) {
				u.showAlert(data.errorMessage);
			}
		}.bind(this), function(data) {
			u.showAlert(data.errorMessage);
		});
	};

	App.pages[AddSprintParticipantsView.name] = AddSprintParticipantsView;
	module.exports = AddSprintParticipantsView;
});
