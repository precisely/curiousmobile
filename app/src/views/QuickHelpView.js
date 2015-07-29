define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Engine = require('famous/core/Engine');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Scrollview = require('famous/views/Scrollview');
	var RenderController = require('famous/views/RenderController');
	var Transform = require('famous/core/Transform');
	var Transitionable = require('famous/transitions/Transitionable');
	var Draggable = require("famous/modifiers/Draggable");
	var RenderNode = require('famous/core/RenderNode');
	var View = require('famous/core/View');
	var HelpStep1Template = require('text!templates/help-step-1.html');
	var HelpStep2Template = require('text!templates/help-step-2.html');
	var HelpStep3Template = require('text!templates/help-step-3.html');
	var HelpGetStartedTemplate = require('text!templates/help-get-started.html');
	var MoodHelpView = require('views/help/MoodHelpView');
	var Entry = require('models/Entry');
	var u = require('util/Utils');

	function QuickHelpView() {
		BaseView.apply(this, arguments);

		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height],
			transform: Transform.translate(0, 0, 16)
		});

		this.add(mod).add(this.renderController);
		this.init();
		Engine.on('keyup', onKeyUp.bind(this));
		this.on('backToStep1', function() {
			this.navigate('step1');
		});
	}

	QuickHelpView.prototype = Object.create(BaseView.prototype);

	QuickHelpView.prototype.constructor = QuickHelpView;

	QuickHelpView.DEFAULT_OPTIONS = {
		header: false,
		footer: true,
	};

	function createStepSurfaces(helpStepTemplate) {
		var stepSurface = new Surface({
			size: [App.width, App.height],
			content: _.template(helpStepTemplate, templateSettings),
			properties: {
				backgroundColor: '#f48d5b',
				textAlign: 'center',
				paddingTop: '30px'
			}
		});
		return stepSurface;
	}

	QuickHelpView.prototype.init = function() {
		this.step1Surface = createStepSurfaces(HelpStep1Template);
		this.step2Surface = createStepSurfaces(HelpStep2Template);
		this.step3Surface = createStepSurfaces(HelpStep3Template);
		this.getStartedSurface = createStepSurfaces(HelpGetStartedTemplate);

		this.step1Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				var value = document.getElementById('sleep-hour-entry').value;
				if (_.contains(classList, 'next-question')) {
					if (value != '') {
						value = value.substring(value.indexOfRegex(/[0-9]/g));
						if (isNaN(value.charAt(0))) {
							u.showAlert("Please enter a duration such as '8 hours'");
							return false;
						} else {
							value = 'sleep ' + value;
						}
						createSingleEntry.call(this, value, function(resp) {
							this.navigate('step2');
						}.bind(this));
					} else {
						this.navigate('step2');
					}
				} else if (_.contains(classList, 'skip-label')) {
					if (value != '') {
						value = value.substring(value.indexOfRegex(/[0-9]/g));
						if (isNaN(value.charAt(0))) {
							u.showAlert("Please enter a duration such as '8 hours'");
							return false;
						} else {
							value = 'sleep ' + value;
						}
						createSingleEntry.call(this, value, function(resp) {
							App.pageView.changePage('TrackView', {
								new: true
							});
						});
					} else {
						App.pageView.changePage('TrackView', {
							new: true
						});
					}
				}
			}
		}.bind(this));

		this.step2Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				var value = document.getElementById('mood-entry').value;
				if (_.contains(classList, 'back-label')) {
					this.navigate('step1');
				} else if (_.contains(classList, 'next-question')) {
					if (value != '') {
						createSingleEntry.call(this, value, function(resp) {
							this.navigate('step3');
						}.bind(this));
					} else {
						this.navigate('step3');
					}
				} else if (_.contains(classList, 'skip-label')) {
					if (value != '') {
						createSingleEntry.call(this, value, function(resp) {
							App.pageView.changePage('TrackView', {
								new: true
							});
						});
					} else {
						App.pageView.changePage('TrackView', {
							new: true
						});
					}
				}
			}
		}.bind(this));

		this.step3Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				if (_.contains(classList, 'back-label')) {
					this.navigate('step2');
				} else if (_.contains(classList, 'next-question')) {
					if (cordova) {
						cordova.plugins.Keyboard.close();
					}
					createEntries.call(this);
				} else if (event.srcElement.type === 'text') {
					event.srcElement.focus();
				}
			}
		}.bind(this));

		this.getStartedSurface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				if (_.contains(classList, 'back-label')) {
					this.navigate('step3');
				} else if (_.contains(classList, 'next-question')) {
					App.pageView.changePage('TrackView', {
						new: true
					});
				}
			}
		}.bind(this));

		this.navigate('step1');

	};

	function onKeyUp(event) {
		var classList;
		var id = event.srcElement.id;
		if (id === 'sleep-hour') {
			var sleepInputElement = document.getElementById('sleep-hour');
			if (event.which === 13) {
				var value = document.getElementById('sleep-hour-entry').value;
				if (value != '') {
					value = value.substring(value.indexOfRegex(/[0-9]/g));
					if (isNaN(value.charAt(0))) {
						u.showAlert("Please enter a duration such as '8 hours'");
						return false;
					} else {
						value = 'sleep ' + value;
					}
					createSingleEntry.call(this, value, function(resp) {
						this.navigate('step2');
					}.bind(this));
				} else {
					this.navigate('step2');
				}
			} else if (sleepInputElement.value === '') {
				document.getElementById('sleep-entry-label').innerHTML = '';
				document.getElementById('sleep-hour-entry').value = '';
			} else {
				document.getElementById('sleep-entry-label').innerHTML = 'You have just tracked: \'sleep ' + sleepInputElement.value + '\'';
				document.getElementById('sleep-hour-entry').value = 'sleep ' + sleepInputElement.value;
			}
		} else if (id === 'mood-box') {
			var moodInputElement = document.getElementById('mood-box');
			if (event.which === 13) {
				var value = document.getElementById('mood-entry').value;
				if (value != '') {
					createSingleEntry.call(this, value, function(resp) {
						this.navigate('step3');
					}.bind(this));
				} else {
					this.navigate('step3');
				}
			} else if (moodInputElement.value === '') {
				document.getElementById('mood-entry-label').innerHTML = '';
				document.getElementById('mood-entry').value = '';
			} else {
				document.getElementById('mood-entry-label').innerHTML = 'You have just tracked: \'mood ' + moodInputElement.value + '\'';
				document.getElementById('mood-entry').value = 'mood ' + moodInputElement.value;
			}
			
		}else if (event.which === 13) {
			if (id === 'cardio') {
				document.getElementById('resistance').focus();
			} else if (id === 'resistance') {
				document.getElementById('stretch').focus();
			} else if (id === 'stretch') {
				document.getElementById('metabolic').focus();
			} else if (id === 'metabolic') {
				createEntries.call(this);
			}
		}
	}

	function createSingleEntry(value, callback) {
		var entry = new Entry;
		entry.setText(value);
		entry.create(callback);
	}

	function createEntries() {
		var now = new Date();
		var baseDate = now.setHours(0, 0, 0, 0);
		var argsToSend = u.getCSRFPreventionObject("addEntryCSRF", {
			currentTime: new Date().toUTCString(),
			baseDate: new Date(baseDate).toUTCString(),
			timeZoneName: u.getTimezone(),
			'entry.0': document.getElementById('cardio').value,
			'entry.1': document.getElementById('resistance').value,
			'entry.2': document.getElementById('stretch').value,
			'entry.3': document.getElementById('metabolic').value
		});
		u.queuePostJSON('Creating entries', u.makePostUrl('createHelpEntriesData'),
			u.makeGetArgs(argsToSend),
			function(data) {
				if (u.checkData(data)) {
					if (data.success) {
						this.navigate('getStarted');
					} else {
						u.showAlert(data.message);
					}
				}
			}.bind(this),
			function(error) {
				u.showAlert('Internal server error occurred');
				console.log('Error occured: ', error);
			});
	};

	QuickHelpView.prototype.storeMoodEntry = function(moodEntry) {
		this.moodEntry = moodEntry;
		this.navigate('step3');
	};


	QuickHelpView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		this.init();

	};

	QuickHelpView.prototype.navigate = function(step) {
		if (step === 'step1') {
			this.renderController.show(this.step1Surface);
		} else if (step === 'step2') {
			this.renderController.show(this.step2Surface);
		} else if (step === 'step3') {
			this.renderController.show(this.step3Surface);
		} else {
			this.renderController.show(this.getStartedSurface);
		}
	};

	App.pages[QuickHelpView.name] = QuickHelpView;
	module.exports = QuickHelpView;
});
