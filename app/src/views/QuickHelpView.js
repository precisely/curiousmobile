define(function(require, exports, module) {
	'use strict';
	var Utility = require('famous/utilities/Utility');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Engine = require('famous/core/Engine');
	var StateModifier = require('famous/modifiers/StateModifier');
	var ImageSurface = require("famous/surfaces/ImageSurface");
	var Scrollview = require('famous/views/Scrollview');
	var RenderController = require('famous/views/RenderController');
	var Transform = require('famous/core/Transform');
	var Transitionable = require('famous/transitions/Transitionable');
	var View = require('famous/core/View');
	var HelpStep1Template = require('text!templates/help-step-1.html');
	var HelpStep2Template = require('text!templates/help-step-2.html');
	var HelpStep3Template = require('text!templates/help-step-3.html');
	var u = require('util/Utils');

	function QuickHelpView() {
		BaseView.apply(this, arguments);
		this.entry = [];
		this.init();
	}

	QuickHelpView.prototype = Object.create(BaseView.prototype);

	QuickHelpView.prototype.constructor = QuickHelpView;

	QuickHelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
	};

	function createStepSurfaces(helpStepTemplate) {
		var stepSurface = new Surface({
			size: [undefined, undefined],
			content: _.template(helpStepTemplate, templateSettings),
			properties: {
				backgroundColor: '#f48d5b',
				textAlign: 'center',
				padding: '10px'
			}
		});
		return stepSurface;
	}

	QuickHelpView.prototype.init = function() {
		this.setHeaderLabel('Quick Help');

		var step1Surface = createStepSurfaces(HelpStep1Template);
		var step2Surface = createStepSurfaces(HelpStep2Template);
		var step3Surface = createStepSurfaces(HelpStep3Template);

		var scrollView = new Scrollview({
			direction: Utility.Direction.Y,
			clipSize: 50
		});
		step3Surface.pipe(scrollView);
		scrollView.sequenceFrom([step3Surface]);

		scrollView.sync.on('update', function() {
		});

		this.renderController = new RenderController();

		step1Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				if (_.contains(classList, 'next-question')) {
					this.sleepEntry = document.getElementById('sleep-hour-entry').value;
					this.renderController.hide();
					this.renderController.show(step2Surface);
				} else if (_.contains(classList, 'skip-label')) {
					document.getElementById('sleep-hour-entry').value = '';
					document.getElementById('sleep-hour').value = '';
					document.getElementById('sleep-entry-label').innerHTML = '';
					this.sleepEntry = '';
					this.renderController.hide();
					this.renderController.show(step2Surface);
				}
			}
		}.bind(this));

		step2Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				if (_.contains(classList, 'next-question')) {
					this.moodEntry = document.getElementById('mood-entry').value;
					this.renderController.hide();
					this.renderController.show(scrollView);
				} else if (_.contains(classList, 'back-label')) {
					this.renderController.hide();
					this.renderController.show(step1Surface);
				} else if (_.contains(classList, 'skip-label')) {
					document.getElementById('mood-entry').value = '';
					document.getElementById('mood-entry-label').innerHTML = '';
					this.moodEntry = '';
					this.renderController.hide();
					this.renderController.show(scrollView);
				} else if (event.srcElement.id === 'mood-range') {
					var value = 'mood ' + document.getElementById('mood-range').value;
					document.getElementById('mood-entry-label').innerHTML = '[' + value + ']';
					document.getElementById('mood-entry').value = value;
				}
			}
		}.bind(this));

		step3Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				if (_.contains(classList, 'back-label')) {
					this.renderController.hide();
					this.renderController.show(step2Surface);
				} else if (_.contains(classList, 'next-question')) {
					var argsToSend = u.getCSRFPreventionObject("addEntryCSRF", {
						currentTime: new Date().toUTCString(),
						baseDate: new Date().toUTCString(),
						timeZoneName: u.getTimezone(),
						'entry.0': this.sleepEntry,
						'entry.1': this.moodEntry,
						'entry.2': document.getElementById('cardio').value,
						'entry.3': document.getElementById('resistance').value,
						'entry.4': document.getElementById('stretch').value,
						'entry.5': document.getElementById('metabolic').value
					});
					u.queuePostJSON('Creating entries', u.makePostUrl('createHelpEntriesData'),
						u.makeGetArgs(argsToSend), 
						function (data) {
							if (u.checkData(data)) {
								console.log('Success: ', data);
								if (data.success) {
									u.showAlert(data.message);
									App.pageView.changePage('trackView');
								} else {
									u.showAlert(data.message);
								}
							}
						}, function (error) {
							u.showAlert('Internal server error occurred');
							console.log('Error occured: ', error);
						});
				}
			}
		}.bind(this));

		var mod = new StateModifier({
			size: [undefined, 600],
			transform: Transform.translate(0, 64, 16)
		});
		this.add(mod).add(this.renderController);

		this.renderController.show(step1Surface);

		Engine.on('keyup', function(event) {
			var classList;
			var id = event.srcElement.id;
			if (id === 'sleep-hour') {
				var sleepInputElement = document.getElementById('sleep-hour');
				if (event.which === 13) {
					event.preventDefault(); 
				} else if (sleepInputElement.value === '') {
					document.getElementById('sleep-entry-label').innerHTML = '';
					document.getElementById('sleep-hour-entry').value = '';
				} else {
					document.getElementById('sleep-entry-label').innerHTML = '[sleep ' + sleepInputElement.value + ']';
					document.getElementById('sleep-hour-entry').value =  'sleep ' + sleepInputElement.value;
				}
			}
		});
	};

	QuickHelpView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		this.entry = [];
		this.setBody(this.renderController);
	};

	App.pages[QuickHelpView.name] = QuickHelpView;
	module.exports = QuickHelpView;
});
