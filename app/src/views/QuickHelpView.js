define(function(require, exports, module) {
	'use strict';
	var Utility = require('famous/utilities/Utility');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Engine = require('famous/core/Engine');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var ImageSurface = require("famous/surfaces/ImageSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
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
	var u = require('util/Utils');

	function QuickHelpView() {
		BaseView.apply(this, arguments);
		this.entry = [];
		this.init();
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
		var step1Surface = createStepSurfaces(HelpStep1Template);
		var step2InnerSurface = createStepSurfaces(HelpStep2Template);
		var step3Surface = createStepSurfaces(HelpStep3Template);
		var step2Surface = new ContainerSurface({
			size: [App.width, App.height],
		});
		step2Surface.add(step2InnerSurface);
		var moodRangeSurface = new InputSurface({
			size: [App.width - 60, 5],
			type: 'range',
			properties: {
				zIndex: 99,
			},
			attributes: {
				min: 1,
				max: 10
			}
		});

		var rangeModifier = new Modifier({
			transform: Transform.translate(30, 134, 0)
		});
		step2Surface.add(rangeModifier).add(moodRangeSurface);
		var yRange = Math.max(0, (620 - App.height));
		var lastDraggablePosition = 0;

		var draggable = new Draggable({
			xRange: [0, 0],
			yRange: [-yRange, 0]
		});

		draggable.subscribe(step3Surface);

		draggable.on('end', function(e) {
			console.log(e);
			if (e.position[1] <= lastDraggablePosition) {
				this.setPosition([0, -yRange, 0], {
					duration: 300
				});
			} else {
				this.setPosition([0, 0, 0], {
					duration: 300
				});
			}
			lastDraggablePosition = e.position[1];
		});

		var nodePlayer = new RenderNode();
		nodePlayer.add(draggable).add(step3Surface);

		this.renderController = new RenderController();

		step1Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				if (_.contains(classList, 'next-question')) {
					this.sleepEntry = document.getElementById('sleep-hour-entry').value;
					this.renderController.show(step2Surface);
				} else if (_.contains(classList, 'skip-label')) {
					document.getElementById('sleep-hour-entry').value = '';
					document.getElementById('sleep-hour').value = '';
					document.getElementById('sleep-entry-label').innerHTML = '';
					this.sleepEntry = '';
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
					this.renderController.show(nodePlayer);
				} else if (_.contains(classList, 'back-label')) {
					this.renderController.show(step1Surface);
				} else if (_.contains(classList, 'skip-label')) {
					document.getElementById('mood-entry').value = '';
					document.getElementById('mood-entry-label').innerHTML = '';
					this.moodEntry = '';
					this.renderController.show(nodePlayer);
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
					createEntries.call(this);
				} else if (event.srcElement.type === 'text') {
					event.srcElement.focus();
				}
			}
		}.bind(this));

		var mod = new StateModifier({
			size: [App.width, App.height],
			transform: Transform.translate(0, 0, 16)
		});
		this.add(mod).add(this.renderController);

		this.renderController.show(step1Surface);

		Engine.on('keyup', function(event) {
			var classList;
			var id = event.srcElement.id;
			if (id === 'sleep-hour') {
				var sleepInputElement = document.getElementById('sleep-hour');
				if (event.which === 13) {
					this.sleepEntry = document.getElementById('sleep-hour-entry').value;
					this.renderController.show(step2Surface);
				} else if (sleepInputElement.value === '') {
					document.getElementById('sleep-entry-label').innerHTML = '';
					document.getElementById('sleep-hour-entry').value = '';
				} else {
					document.getElementById('sleep-entry-label').innerHTML = '[sleep ' + sleepInputElement.value + ']';
					document.getElementById('sleep-hour-entry').value = 'sleep ' + sleepInputElement.value;
				}
			} else if (event.which === 13) {
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
		}.bind(this));
	};

	function createEntries() {
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
			function(data) {
				if (u.checkData(data)) {
					console.log('Success: ', data);
					if (data.success) {
						u.showAlert(data.message);
						App.pageView.changePage('trackView');
					} else {
						u.showAlert(data.message);
					}
				}
			},
			function(error) {
				u.showAlert('Internal server error occurred');
				console.log('Error occured: ', error);
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
