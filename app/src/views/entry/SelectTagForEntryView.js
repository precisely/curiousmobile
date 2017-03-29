define(function(require, exports, module) {

	'use strict';

	require('jquery');
	require('bootstrap');

	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');

	var ContainerSurface = require('famous/surfaces/ContainerSurface');

	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Draggable = require('famous/modifiers/Draggable');

	var RenderController = require("famous/views/RenderController");
	var ScrollView = require('famous/views/Scrollview');

	var Utility = require('famous/utilities/Utility');

	var AutoCompleteView = require("views/AutocompleteView");
	var AutoCompleteModel = require('models/Autocomplete');

	var inputSurfaceTemplate = require('text!templates/input-surface.html');

	function SelectTagForEntryView(options) {
		View.apply(this, arguments);
		this.trackView = options.trackView;

		this.tagsList = [];
		this.addAutoCompleteView();
		this.addViewContainer();
		this.addScrollView();
		this.addInputSurface();
	}

	SelectTagForEntryView.prototype = Object.create(View.prototype);
	SelectTagForEntryView.prototype.constructor = SelectTagForEntryView;

	SelectTagForEntryView.prototype.addViewContainer = function() {
		this.timePickerContainerSurface = new ContainerSurface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'rgba(123, 120, 120, 0.48)',
				overflow: 'hidden'
			},
			attributes: {
				id: 'select-tag-container'
			}
		});

		this.add(this.timePickerContainerSurface);
	};

	SelectTagForEntryView.prototype.addAutoCompleteView = function() {
		this.autoCompleteModelInstance = new AutoCompleteModel();
		window.autocompleteCache = this.autoCompleteModelInstance;

		this.autoCompleteView = new AutoCompleteView(this.autoCompleteModelInstance);

		this.autoCompleteView.onSelect(function(tagDescription) {
			this.trackView.addNewInputWidget(tagDescription);
		}.bind(this));
	};

	SelectTagForEntryView.prototype.addScrollView = function() {
		this.scrollView = new ScrollView({
			direction: Utility.Direction.Y,
		});

		this.scrollView.sequenceFrom(this.tagsList);

		this.scrollViewContainerSurface = new ContainerSurface({
			size: [undefined, undefined],
			properties: {
				overflow: 'hidden'
			},
			attributes: {
				id: 'select-tag-scroll-view-container'
			}
		});

		this.containerSurfaceModifier = new StateModifier({
			transform: Transform.translate(15, 55, 10),
			size: [App.width - 30, App.height - 170]
		});
		this.scrollViewContainerSurface.add(this.scrollView);
		this.timePickerContainerSurface.add(this.containerSurfaceModifier).add(this.scrollViewContainerSurface);
	};

	SelectTagForEntryView.prototype.setFocusOnInputSurface = function() {
		var element = document.getElementById('entry-description').focus();

		if (element) {
			element.focus();
		}
	};

	SelectTagForEntryView.prototype.addInputSurface = function() {
		this.inputModifier = new StateModifier({
			transform: Transform.translate(15, 15, 10),
			size: [App.width - 30, 40]
		});

		this.inputSurface = new Surface({
			classes: ['input-surface'],
			content: _.template(inputSurfaceTemplate, {
				tag: ''
			}, templateSettings)
		});

		this.timePickerContainerSurface.add(this.inputModifier).add(this.inputSurface);

		this.inputSurface.on('click', function(e) {
			this.setFocusOnInputSurface();
		});

		this.inputSurface.on('keyup', function(e) {
			// On enter
			if (e.keyCode == 13) {
				this.submit(e);
			} else if (e.keyCode == 27) {
				this.blur(e);
				this.trackView.killOverlayContent();
			} else {
				var enteredKey = e.srcElement.value;

				if (!enteredKey) {
					this.initializeTagsList();
					return;
				}

				this.autoCompleteView.getAutocompletes(enteredKey, function(autoCompleteViewList) {
					if (autoCompleteViewList && autoCompleteViewList.length >= 1) {
						this.refreshTagsList(autoCompleteViewList);
					} else {
						this.initializeTagsList();
					}
				}.bind(this));
			}
		}.bind(this));
	};

	SelectTagForEntryView.prototype.refreshTagsList = function(autoCompleteViewList) {
		this.tagsList = [];

		autoCompleteViewList.forEach(function(autoCompleteView) {
			var autoCompleteSurface = autoCompleteView.autoCompleteSurface;
			this.tagsList.push(autoCompleteSurface);
			this.scrollView.sequenceFrom(this.tagsList);
			autoCompleteSurface.pipe(this.scrollView);
		}.bind(this));
	};

	SelectTagForEntryView.prototype.initializeTagsList = function() {
		this.autoCompleteView.surfaceList = [];
		this.autoCompleteView.processAutocompletes(this.autoCompleteModelInstance.freqTagList, '',
				function(autoCompleteViewList) {
			this.refreshTagsList(autoCompleteViewList);
		}.bind(this));
	};

	module.exports = SelectTagForEntryView;
});