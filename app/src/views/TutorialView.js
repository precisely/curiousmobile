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
	var TutorialIntro1Template = require('text!templates/tutorial/tutorial-intro-1.html');
	var TutorialIntro2Template = require('text!templates/tutorial/tutorial-intro-2.html');
	var TutorialIntro3Template = require('text!templates/tutorial/tutorial-intro-3.html');
	var TutorialIntro4Template = require('text!templates/tutorial/tutorial-intro-4.html');
	var HelpStep1Template = require('text!templates/tutorial/help-step-1.html');
	var HelpStep2Template = require('text!templates/tutorial/help-step-2.html');
	var HelpStep3Template = require('text!templates/tutorial/help-step-3.html');
	var HelpGetStartedTemplate = require('text!templates/tutorial/help-get-started.html');
	var Entry = require('models/Entry');
	var u = require('util/Utils');

	function TutorialView() {
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
			this.navigate(-1);
		});
	}

	TutorialView.prototype = Object.create(BaseView.prototype);

	TutorialView.prototype.constructor = TutorialView;

	TutorialView.DEFAULT_OPTIONS = {
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

	TutorialView.prototype.init = function() {
		this.tutorialIntro1 = createStepSurfaces(TutorialIntro1Template);
		this.tutorialIntro2 = createStepSurfaces(TutorialIntro2Template);
		this.tutorialIntro3 = createStepSurfaces(TutorialIntro3Template);
		this.tutorialIntro4 = createStepSurfaces(TutorialIntro4Template);
		this.step1Surface = createStepSurfaces(HelpStep1Template);
		this.step2Surface = createStepSurfaces(HelpStep2Template);
		this.step3Surface = createStepSurfaces(HelpStep3Template);
		this.getStartedSurface = createStepSurfaces(HelpGetStartedTemplate);

		this.stepsSurfaceList = [this.tutorialIntro1, this.tutorialIntro2, this.tutorialIntro3, this.tutorialIntro4,
				this.step1Surface, this.step2Surface, this.step3Surface, this.getStartedSurface];
		this.step1Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				var value = document.getElementById('sleep-hour-entry').value;
				var entryId = document.getElementById('sleep-hour-entry').dataset.id;
				if (_.contains(classList, 'next-question')) {
					this.createSleepEntry(value, entryId, function(resp) {
						if (resp.glowEntry) {
							document.getElementById('sleep-hour-entry').dataset.id = resp.glowEntry.id;
						}
						this.navigate(1);
					}.bind(this));
				} else if (_.contains(classList, 'skip-label')) {
					this.createSleepEntry(value, entryId, function(resp) {
						App.pageView.changePage('TrackView', {
							new: true
						});
					});
				} else if (_.contains(classList, 'back-label')) {
					this.navigate(-1);
				}
			}
		}.bind(this));

		this.step2Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				var value = document.getElementById('mood-entry').value;
				var entryId = document.getElementById('mood-entry').dataset.id;
				if (_.contains(classList, 'back-label')) {
					this.navigate(-1);
				} else if (_.contains(classList, 'next-question')) {
					if (value != '') {
						createSingleEntry.call(this, {value: value, entryId: entryId}, function(resp) {
							if (resp.glowEntry) {
								document.getElementById('mood-entry').dataset.id = resp.glowEntry.id;
							}
							this.navigate(1);
						}.bind(this));
					} else {
						this.navigate(1);
					}
				} else if (_.contains(classList, 'skip-label')) {
					if (value != '') {
						createSingleEntry.call(this, {value: value, entryId: entryId}, function(resp) {
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
					this.navigate(-1);
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
				if (_.contains(classList, 'next-question')) {
					App.pageView.changePage('TrackView', {
						new: true
					});
				}
			}
		}.bind(this));

		this.tutorialIntro1.on('click', tutorialNavigation.bind(this));
		this.tutorialIntro2.on('click', tutorialNavigation.bind(this));
		this.tutorialIntro3.on('click', tutorialNavigation.bind(this));
		this.tutorialIntro4.on('click', tutorialNavigation.bind(this));

		this.currentStepIndex = -1;
		this.navigate(1);

	};

	function tutorialNavigation(event) {
		var classList;
		if (u.isAndroid() || (event instanceof CustomEvent)) {
			classList = event.srcElement.classList;
			if (_.contains(classList, 'skip-label')) {
				App.pageView.changePage('TrackView', {
					new: true
				});
			} else if (_.contains(classList, 'next-question')) {
				this.navigate(1);
			} else if (_.contains(classList, 'back-label')) {
				this.navigate(-1);
			}
		}
	}

	function onKeyUp(event) {
		var classList;
		var id = event.srcElement.id;
		if (id === 'sleep-hour') {
			var sleepInputElement = document.getElementById('sleep-hour');
			if (event.which === 13) {
				var value = document.getElementById('sleep-hour-entry').value;
				var entryId = document.getElementById('sleep-hour-entry').dataset.id;
				this.createSleepEntry(value, entryId, function(resp) {
					if (resp.glowEntry) {
						document.getElementById('sleep-hour-entry').dataset.id = resp.glowEntry.id;
					}
					this.navigate(1);
				}.bind(this));
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
				var entryId = document.getElementById('mood-entry').dataset.id;
				if (value != '') {
					createSingleEntry.call(this, {value: value, entryId: entryId}, function(resp) {
						if (resp.glowEntry) {
							document.getElementById('mood-entry').dataset.id = resp.glowEntry.id;
						}
						this.navigate(1);
					}.bind(this));
				} else {
					this.navigate(1);
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

	TutorialView.prototype.createSleepEntry = function(value, entryId, callback) {
		if (value != '') {
			value = value.substring(value.indexOfRegex(/[0-9]/g));
			if (isNaN(value.charAt(0))) {
				u.showAlert("Please enter a duration such as '8 hours'");
				return false;
			} else {
				value = 'sleep ' + value;
			}
			createSingleEntry.call(this, {value: value, entryId: entryId}, callback);
		} else {
			callback([]);
		}
	};

	function createSingleEntry(args, callback) {
		var entry = new Entry();
		if (args.entryId) {
			entry.set('id', args.entryId + '');
		}

		if (args.entryId) {
			entry.setText(args.value + ' ' + u.dateToTimeStr(new Date(), false));
			entry.save(false, callback);
		} else {
			entry.setText(args.value);
			entry.create(callback);
		}
	}

	function createEntries() {
		var now = new Date();
		var baseDate = now.setHours(0, 0, 0, 0);
		var entries = [document.getElementById('cardio').value, document.getElementById('resistance').value,
			document.getElementById('stretch').value, document.getElementById('metabolic').value];
		entries = _.filter(entries, Boolean);
		if (entries.length == 0) {
			this.navigate(1);
			return false;
		}
		var argsToSend = u.getCSRFPreventionObject("addEntryCSRF", {
			currentTime: new Date().toUTCString(),
			baseDate: new Date(baseDate).toUTCString(),
			timeZoneName: u.getTimezone(),
			entries: entries
		});
		u.queuePostJSON('Creating entries', u.makePostUrl('createHelpEntriesData'),
		u.makeGetArgs(argsToSend),
		function(data) {
			if (u.checkData(data)) {
				if (data.success) {
					this.navigate(1);
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

	TutorialView.prototype.storeMoodEntry = function(moodEntry) {
		this.moodEntry = moodEntry;
		this.navigate(1);
	};


	TutorialView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		this.init();
	};

	TutorialView.prototype.navigate = function(indexModifier) {
		this.currentStepIndex += indexModifier;
		this.renderController.show(this.stepsSurfaceList[this.currentStepIndex]);
	};

	App.pages[TutorialView.name] = TutorialView;
	module.exports = TutorialView;
});
