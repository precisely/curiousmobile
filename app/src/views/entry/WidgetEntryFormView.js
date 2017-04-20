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
	var TagInputTypeAutoComplete = require('models/TagInputTypeAutoComplete');

	var inputSurfaceTemplate = require('text!templates/input-surface.html');
	var TrackEntryFormView = require('views/entry/TrackEntryFormView');

	var Entry = require('models/Entry');

	function WidgetEntryFormView(options) {
		View.apply(this, arguments);

		this.trackView = options.trackView;

		this.tagsList = [];

		this.addAutoCompleteView();
		this.addViewContainer();
		this.addScrollView();
		this.addInputSurface();

		this.createAddNewTagButton();
	}

	WidgetEntryFormView.prototype = Object.create(View.prototype);
	WidgetEntryFormView.prototype.constructor = WidgetEntryFormView;

	WidgetEntryFormView.prototype.addViewContainer = function() {
		this.selectTagContainerSurface = new ContainerSurface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'rgba(123, 120, 120, 0.48)',
				overflow: 'hidden'
			},
			attributes: {
				id: 'select-tag-container'
			}
		});

		this.add(this.selectTagContainerSurface);
	};

	WidgetEntryFormView.prototype.addAutoCompleteView = function() {
		this.autoCompleteModelInstance = new TagInputTypeAutoComplete();
		window.tagWithInputTypeAutoComplete = this.autoCompleteModelInstance;

		this.autoCompleteView = new AutoCompleteView(this.autoCompleteModelInstance);

		this.autoCompleteView.onSelect(function(tagDescription) {
			this.trackView.addNewInputWidget(tagDescription);
		}.bind(this));
	};

	WidgetEntryFormView.prototype.addScrollView = function() {
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
		this.selectTagContainerSurface.add(this.containerSurfaceModifier).add(this.scrollViewContainerSurface);
	};

	WidgetEntryFormView.prototype.setFocusOnInputSurface = function() {
		var element = document.getElementById('entry-description').focus();

		if (element) {
			element.focus();
		}
	};

	WidgetEntryFormView.prototype.addInputSurface = function() {
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

		this.selectTagContainerSurface.add(this.inputModifier).add(this.inputSurface);

		this.inputSurface.on('click', function() {
			this.setFocusOnInputSurface();
		}.bind(this));

		this.inputSurface.on('keyup', function(e) {
			var addButton = new View();
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
						var refreshList = true;
						if (autoCompleteViewList.length === 1) {
							var autoCompleteSurface = autoCompleteViewList[0].autoCompleteSurface;
							if (!window.tagWithInputTypeAutoComplete.taginputTypeMap.get(autoCompleteSurface.content)) {
								this.scrollView.sequenceFrom([]);
								this.addButtonRenderController.show(this.addNewTagButton);
								refreshList = false;
							}
						}

						if (refreshList) {
							this.addButtonRenderController.hide();
							this.refreshTagsList(autoCompleteViewList);
						}
					}
				}.bind(this));
			}
		}.bind(this));
	};

	WidgetEntryFormView.prototype.refreshTagsList = function(autoCompleteViewList) {
		this.tagsList = [];

		this.addButtonRenderController.hide({duration: 0});

		autoCompleteViewList.forEach(function(autoCompleteView) {
			var autoCompleteSurface = autoCompleteView.autoCompleteSurface;
			this.tagsList.push(autoCompleteSurface);
			this.scrollView.sequenceFrom(this.tagsList);
			autoCompleteSurface.pipe(this.scrollView);
		}.bind(this));
	};

	WidgetEntryFormView.prototype.initializeTagsList = function() {
		this.autoCompleteView.surfaceList = [];
		this.autoCompleteView.processAutocompletes(this.autoCompleteModelInstance.tagsWithInputType, '',
				function(autoCompleteViewList) {
			this.refreshTagsList(autoCompleteViewList);
		}.bind(this));
	};

	WidgetEntryFormView.prototype.createAddNewTagButton = function() {
		this.addNewTagButton = new Surface({
			content: '<button type="button" class="full-width-button create-entry-button">ADD NEW TAG</button>',
			size: [undefined, true]
		});

		this.addNewTagButton.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.trackView.killOverlayContent();
				var state = this.trackView.entryFormView.buildStateFromEntry(new Entry());
				this.trackView.showTrackEntryFormView(state);
			}
		}.bind(this));

		this.addTagButtonModifier = new StateModifier({
			size: [App.width - 60, undefined],
			transform: Transform.translate(30, 85, 20)
		});

		this.addButtonRenderController = new RenderController();

		this.selectTagContainerSurface.add(this.addTagButtonModifier).add(this.addButtonRenderController);
	};

	module.exports = WidgetEntryFormView;
});
