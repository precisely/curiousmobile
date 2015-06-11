define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Transform = require('famous/core/Transform');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var StateView = require('views/StateView');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var Draggable = require("famous/modifiers/Draggable");
	var HelpStep2Template = require('text!templates/help-step-2.html');
	var QuickHelpView = require('views/QuickHelpView');
	var u = require('util/Utils');

	function MoodHelpView(quickHelpView) {
		StateView.apply(this, arguments);
		this.quickHelpView = quickHelpView;
		this.labelSurfaceProperties = {
			backgroundColor: 'transparent',
			textAlign: 'center',
			color: '#fff',
			zIndex: 16
		};
		this.init();
	}

	MoodHelpView.prototype = Object.create(StateView.prototype);
	MoodHelpView.prototype.constructor = MoodHelpView;

	MoodHelpView.DEFAULT_OPTIONS = {
	};

	MoodHelpView.prototype.init = function() {
		var step2InnerSurface = new Surface({
			size: [App.width, App.height],
			content: _.template(HelpStep2Template, templateSettings),
			properties: {
				backgroundColor: '#f48d5b',
				textAlign: 'center',
				paddingTop: '30px'
			}
		});

		var step2Surface = new ContainerSurface({
			size: [App.width, App.height],
		});
		step2Surface.add(step2InnerSurface);
		var moodRangeSurface = new Surface({
			size: [App.width - 30, 15],
			properties: {
				borderRadius: '8px',
				backgroundColor: '#e27c4a',
				zIndex: 16
			}
		});

		var rangeSeeker = new Surface({
			size: [30, 30],
			properties: {
				borderRadius: '15px',
				backgroundColor: '#fff',
				zIndex: 17
			}
		});

		var xRange = App.width - 40;
		var rangeDraggable = new Draggable({
			xRange: [0, xRange],
			yRange: [0, 0],
			snapX: 4
		});

		rangeDraggable.setRelativePosition([xRange / 2, 0], null, null);

		rangeDraggable.on('end', function(e) {
			var interval = xRange / 10;
			var moodValue = Math.floor(e.position[0] / interval);
			var value = 'mood ' + ++moodValue;
			document.getElementById('mood-entry-label').innerHTML = value;
			this.moodEntry = value;
		}.bind(this));

		rangeDraggable.subscribe(rangeSeeker);
		
		var rangeModifier = new Modifier({
			transform: Transform.translate(15, 128, 0)
		});
		var seekerModifier = new Modifier({
			transform: Transform.translate(15, 120, 0)
		});

		step2Surface.add(seekerModifier).add(rangeDraggable).add(rangeSeeker);
		step2Surface.add(rangeModifier).add(moodRangeSurface);
		this.add(step2Surface);
		this.createMoodRangeLabels();
		this.moodEntry = 'mood 5';

		step2Surface.on('click', function(event) {
			var classList;
			if (u.isAndroid() || (event instanceof CustomEvent)) {
				classList = event.srcElement.classList;
				if (_.contains(classList, 'next-question')) {
					this.quickHelpView.storeMoodEntry(this.moodEntry);
				} else if (_.contains(classList, 'back-label')) {
					this.quickHelpView.navigate('step1');
				} else if (_.contains(classList, 'skip-label')) {
					document.getElementById('mood-entry').value = '';
					document.getElementById('mood-entry-label').innerHTML = '';
					this.quickHelpView.storeMoodEntry('');
				}
			}
		}.bind(this));
	};

	MoodHelpView.prototype.createMoodRangeLabels = function() {
		var moodCalmLabel = new Surface({
			size: [80, true],
			content: '<label class="calm-day">Pretty Calm, even-keeled.</label>',
			properties: this.labelSurfaceProperties
		});

		var moodLowLabel = new Surface({
			size: [70, true],
			content: '<label class="good-day">Oh dear, what a day.</label>',
			properties: this.labelSurfaceProperties
		});

		var moodbestLabel = new Surface({
			size: [90, true],
			content: '<label class="super-day">Super stocked, cheerful frame of mind.</label>',
			properties: this.labelSurfaceProperties
		});

		var centerLabelModifier = new Modifier({
			transform: Transform.translate((App.width / 2) - 40, 170, 0)
		});

		var leftLabelModifier = new Modifier({
			transform: Transform.translate(10, 170, 0)
		});

		var rightLabelModifier = new Modifier({
			transform: Transform.translate(App.width - 100, 170, 0)
		});

		this.add(leftLabelModifier).add(moodLowLabel);
		this.add(centerLabelModifier).add(moodCalmLabel);
		this.add(rightLabelModifier).add(moodbestLabel);
		
	};

	module.exports = MoodHelpView;
});

