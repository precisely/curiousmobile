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
	var Utility = require('famous/utilities/Utility');
	var navigatorTemplate = require('text!templates/tutorial/navigator.html');
	var HelpStep1Template = require('text!templates/tutorial/help-step-1.html');
	var HelpStep2Template = require('text!templates/tutorial/help-step-2.html');
	var HelpStep3Template = require('text!templates/tutorial/help-step-3.html');
	var HelpStep4Template = require('text!templates/tutorial/help-step-final.html');
	var Entry = require('models/Entry');
	var User = require('models/User');
	var Timer = require('famous/utilities/Timer');
	var u = require('util/Utils');

	function TutorialView() {
		BaseView.apply(this, arguments);

		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height - 100],
			transform: Transform.translate(0, 0, 16)
		});
		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y,
		});
		this.currentList = [];
		this.scrollView.sequenceFrom(this.currentList);
		Timer.every(function(){
			this.add(mod).add(this.renderController);
		}.bind(this), 5);
		this.renderController.show(this.scrollView);
		this.init();
		this.setNavigator();
		Engine.on('keyup', onKeyUp.bind(this));
		this.on('backToStep1', function() {
			this.navigate(-1);
		});
		this.on('swiped-right', function() {
			this.navigate(-1);
		}.bind(this));
		this.on('swiped-left', function() {
			this.navigate(1);
		}.bind(this));
	}

	TutorialView.prototype = Object.create(BaseView.prototype);

	TutorialView.prototype.constructor = TutorialView;

	TutorialView.DEFAULT_OPTIONS = {
		header: false,
		footer: true,
	};

	function createStepSurfaces(helpStepTemplate, templateData) {
		var stepSurface = new Surface({
			size: [undefined, true],
			content: templateData ? _.template(helpStepTemplate, templateData, templateSettings) : _.template(helpStepTemplate, templateSettings),
			properties: {
				backgroundColor: '#ff6f4c',
				paddingTop: '30px'
			}
		});
		return stepSurface;
	}

	TutorialView.prototype.setNavigator = function() {
		this.navigatorSurface = new Surface({
			size: [undefined, 60],
			content: _.template(navigatorTemplate, templateSettings),
			properties: {
				backgroundColor: '#ff6f4c',
			}
		});

		this.navigatorSurface.on('click', function(event) {
			if (event instanceof CustomEvent) {
				var classList = event.srcElement.classList;
				if (this.currentStepIndex === 2) {
					var value = document.getElementById('sleep-hour').value;
					var entryId = document.getElementById('sleep-hour').dataset.id;
					if (_.contains(classList, 'next') || _.contains(event.srcElement.parentElement.classList, 'next')) {
						this.createSleepEntry(value, entryId, function(resp) {
							if (resp.glowEntry) {
								document.getElementById('sleep-hour').dataset.id = resp.glowEntry.id;
							}
							this.navigate(1);
						}.bind(this));
					} else if (_.contains(classList, 'back') || _.contains(event.srcElement.parentElement.classList, 'back')) {
						this.navigate(-1);
					}
				} else if (this.currentStepIndex === 3) {
					var value = document.getElementById('mood-box').value;
					var entryId = document.getElementById('mood-box').dataset.id;
					if (_.contains(classList, 'back') || _.contains(event.srcElement.parentElement.classList, 'back')) {
						this.navigate(-1);
					} else if (_.contains(classList, 'next') || _.contains(event.srcElement.parentElement.classList, 'next')) {
						if (value != '' && validateMoodEntry(value)) {
							createSingleEntry.call(this, {value: 'mood ' + value, entryId: entryId}, function(resp) {
								if (resp.glowEntry) {
									document.getElementById('mood-box').dataset.id = resp.glowEntry.id;
								}
								this.navigate(1);
							}.bind(this));
						} else if (!value) {
							this.navigate(1);
						}
					} 
				} else if (this.currentStepIndex === 4) {
					if (_.contains(classList, 'back') || _.contains(event.srcElement.parentElement.classList, 'back')) {
						this.navigate(-1);
					} else if (_.contains(classList, 'next') || _.contains(event.srcElement.parentElement.classList, 'next')) {
						if (typeof cordova !== 'undefined') {
							cordova.plugins.Keyboard.close();
						}
						createEntries.call(this);
					} else if (event.srcElement.type === 'text') {
						event.srcElement.focus();
					}
				} else if (this.currentStepIndex === 5) {
					if (_.contains(classList, 'back') || _.contains(event.srcElement.parentElement.classList, 'back')) {
						this.navigate(-1);
					} else if (_.contains(classList, 'next') || _.contains(event.srcElement.parentElement.classList, 'next')) {
						var tagOptions = [];
						_.each(document.getElementsByClassName('tracking-tags'), function(element) {
							if (element.checked) {
								tagOptions.push(element.value);
							}
						});
						User.saveTrackingTags(tagOptions, function(data) {
							App.pageView.changePage('TrackView', {
								new: true
							});
						}.bind(this));
					}
				} else {
					if (_.contains(classList, 'skip')) {
						App.pageView.changePage('TrackView', {
							new: true
						});
					} else if (_.contains(classList, 'next') || _.contains(event.srcElement.parentElement.classList, 'next')) {
						this.navigate(1);
					} else if (_.contains(classList, 'back') || _.contains(event.srcElement.parentElement.classList, 'back')) {
						this.navigate(-1);
					}
				}
			}
		}.bind(this));

		this.add(new StateModifier({transform: Transform.translate(0, App.height - 110, App.zIndex.header - 1)})).add(this.navigatorSurface);
	};

	TutorialView.prototype.init = function() {
		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#ff6f4c',
				zIndex: 5
			}
		});
		this.setBody(this.backgroundSurface);
		var spareSurface = new Surface({
			size: [undefined, 30],
			properties: {
				backgroundColor: '#ff6f4c',
			}
		});
		this.currentList.push(spareSurface);
		this.tutorialIntro1 = createStepSurfaces(TutorialIntro1Template);
		this.tutorialIntro2 = createStepSurfaces(TutorialIntro2Template);
		this.step1Surface = createStepSurfaces(HelpStep1Template);
		this.step2Surface = createStepSurfaces(HelpStep2Template);
		this.step3Surface = createStepSurfaces(HelpStep3Template);

		this.stepsSurfaceList = [this.tutorialIntro1, this.tutorialIntro2, this.step1Surface, 
				this.step2Surface, this.step3Surface];
		User.getSurveyTags(function(surveyOptions) {
			this.step4Surface = createStepSurfaces(HelpStep4Template, {surveyOptions: surveyOptions});
			this.stepsSurfaceList.push(this.step4Surface);
			this.step4Surface.on('click', function(event) {
				var classList;
				classList = event.srcElement.classList;
				if (u.isAndroid() || (event instanceof CustomEvent)) {
					if (_.contains(classList, 'tag-options')) {
						event.srcElement.firstElementChild.checked = !event.srcElement.firstElementChild.checked;
					} else if( _.contains(event.srcElement.parentElement.classList, 'tag-options')) {
						event.srcElement.parentElement.firstElementChild.checked = !event.srcElement.parentElement.firstElementChild.checked;
					} else if (_.contains(classList, 'skip') || _.contains(event.srcElement.parentElement.classList, 'skip')) {
						App.pageView.changePage('TrackView', {
							new: true
						});
					}
				}
			}.bind(this));
		}.bind(this));

		this.step1Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				var value = document.getElementById('sleep-hour').value;
				var entryId = document.getElementById('sleep-hour').dataset.id;
				if (_.contains(classList, 'skip') || _.contains(event.srcElement.parentElement.classList, 'skip')) {
					this.createSleepEntry(value, entryId, function(resp) {
						App.pageView.changePage('TrackView', {
							new: true
						});
					});
				}
			}
		}.bind(this));

		this.step2Surface.on('click', function(event) {
			var classList;
			if (event instanceof CustomEvent) {
				classList = event.srcElement.classList;
				if (_.contains(classList, 'skip') || _.contains(event.srcElement.parentElement.classList, 'skip')) {
					var value = document.getElementById('mood-box').value;
					if (value != '' && validateMoodEntry(value)) {
						createSingleEntry.call(this, {value: 'mood ' + value, entryId: entryId}, function(resp) {
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
			classList = event.srcElement.classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				if (_.contains(classList, 'skip') || _.contains(event.srcElement.parentElement.classList, 'skip')) {
					App.pageView.changePage('TrackView', {
						new: true
					});
				} else if (event.srcElement.type === 'text') {
					setTimeout(function() {
						event.srcElement.setSelectionRange(0, event.srcElement.value.length);
					}, 100);
				}
			}
		}.bind(this));

		this.tutorialIntro1.on('click', closeTutorial.bind(this));
		this.tutorialIntro2.on('click', closeTutorial.bind(this));

		this.currentStepIndex = -1;
		this.navigate(1);
	};

	function closeTutorial(event) {
		var classList;
		if (u.isAndroid() || (event instanceof CustomEvent)) {
			classList = event.srcElement.classList;
			if (_.contains(classList, 'skip') || _.contains(event.srcElement.parentElement.classList, 'skip')) {
				App.pageView.changePage('TrackView', {
					new: true
				});
			}
		}
	}

	function onKeyUp(event) {
		var classList;
		var id = event.srcElement.id;
		if (id === 'sleep-hour') {
			if (event.which === 13) {
				var value = document.getElementById('sleep-hour').value;
				var entryId = document.getElementById('sleep-hour').dataset.id;
				this.createSleepEntry(value, entryId, function(resp) {
					if (resp.glowEntry) {
						document.getElementById('sleep-hour').dataset.id = resp.glowEntry.id;
					}
					this.navigate(1);
				}.bind(this));
			}
		} else if (id === 'mood-box') {
			if (event.which === 13) {
				var value = document.getElementById('mood-box').value;
				var entryId = document.getElementById('mood-box').dataset.id;
				if (value != '' && validateMoodEntry(value)) {
					createSingleEntry.call(this, {value: 'mood ' + value, entryId: entryId}, function(resp) {
						if (resp.glowEntry) {
							document.getElementById('mood-box').dataset.id = resp.glowEntry.id;
						}
						this.navigate(1);
					}.bind(this));
				} else if (!value) {
					this.navigate(1);
				}
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

	function validateMoodEntry(value) {
		if (isNaN(value)) {
			u.showAlert("Please enter a number(1-10) to track mood");
			document.getElementById('mood-box').value = '';
			return false;
		}
		return true;
	}
	TutorialView.prototype.createSleepEntry = function(value, entryId, callback) {
		if (value != '') {
			if (isNaN(value.charAt(0))) {
				u.showAlert("Please enter a duration such as '8 hours'");
				return false;
			}
			value = 'sleep ' + value;
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
		} else {
			entry.setText(args.value);
		}
		entry.saveHelpEntry(callback);
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
		if ((this.currentStepIndex === 0 && indexModifier === -1) || 
				(this.currentStepIndex === 5 && indexModifier === 1)) {
			return false;
		}
		this.scrollView.setPosition(0);
		this.currentStepIndex += indexModifier;
		var currentSurface = this.stepsSurfaceList[this.currentStepIndex];
		if (this.currentList.length > 1) {
			this.currentList.splice(0, 1, currentSurface);
		} else {
			this.currentList.splice(0, 0, currentSurface);
		}
		currentSurface.pipe(this.scrollView);
		setTimeout(function() {
			if (this.currentStepIndex == 0) {
				document.getElementsByClassName('back')[0].style.visibility = "hidden";
			} else {
				document.getElementsByClassName('back')[0].style.visibility = "visible";
			}

			_.each(document.getElementsByClassName('navigation-dots'), function(dot, index){
				if (index === this.currentStepIndex) {
					dot.classList.add('active');
				} else {
					dot.classList.remove('active');
				}
			}.bind(this));
		}.bind(this), 100);
	};

	App.pages[TutorialView.name] = TutorialView;
	module.exports = TutorialView;
});
