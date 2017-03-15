define(function(require, exports, module) {
	'use strict';

	require('jquery');
	require('bootstrap');
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var baseInputWidgetTemplate = require('text!templates/input-widgets/base-input-widget.html');
	var DateGridView = require('views/calendar/DateGridView');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var RenderController = require("famous/views/RenderController");
	var ContainerSurface = require('famous/surfaces/ContainerSurface');

	function InputWidgetView() {
		View.apply(this, arguments);
		this.initializeWidgetContent();
		this.createWidget();
		this.addComponents();
		this.registerListeners();
	}

	InputWidgetView.prototype = Object.create(View.prototype);
	InputWidgetView.prototype.constructor = InputWidgetView;

	InputWidgetView.prototype.STATES = {
		UNSELECTED: 0,
		SELECTED: 1,
		NONE_SELECTED: 2
	};

	InputWidgetView.prototype.DOM_ID = {
		NONE: 'none'
	};

	// Dom Id of the element.
	var BELL_ICON = 'remind-bell-button';

	InputWidgetView.prototype.isBellIcon = function(element) {
		return (_.contains(element.classList, BELL_ICON) || _.contains(element.parentElement.classList, BELL_ICON))
	};

	InputWidgetView.prototype.initializeWidgetContent = function() {
		this.time = '';
		this.tagDescription = '';
		this.inputWidgetDiv = '<div></div>';
		this.remindEntry = false;
	};

	InputWidgetView.prototype.createWidget = function() {
		this.inputWidgetSurface = new Surface({
			size: [App.width, 105],
			content: _.template(baseInputWidgetTemplate, {
				tag: this.tagDescription,
				time: this.time,
				widgetDiv: this.inputWidgetDiv,
				reminderSet: this.reminderSet
			}, templateSettings),
			classes: ['input-widget-surface']
		});
	};

	InputWidgetView.prototype.addComponents = function() {
		this.add(this.inputWidgetSurface);
	};

	InputWidgetView.prototype.registerListeners = function() {
		this.inputWidgetSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (this.isBellIcon(e.srcElement)) {
					this.handleReminderBellEvent(e.srcElement);
				} else if (e.srcElement.id) {
					this.inputWidgetEventHandler(e.srcElement);
				}
			}
		}.bind(this));
	};

	InputWidgetView.prototype.handleReminderBellEvent = function(element) {
		if (this.remindEntry) {
			$(element).removeClass('fa-bell');
			$(element).addClass('fa-bell-o');
			this.remindEntry = false;
		} else {
			$(element).removeClass('fa-bell-o');
			$(element).addClass('fa-bell');
			this.remindEntry = true;
		}
	};

	InputWidgetView.prototype.inputWidgetEventHandler = function(element) {
		if (this.currentlySelected.id === this.DOM_ID.NONE) {
			this.selectInput(element);
		} else {
			if ((element.id === this.currentlySelected.id)) {
				this.unSelectCurrentlySelected(element);
			} else {
				// Select new input and deselect currently selected input.
				this.handleNewInputSelection(element);
			}
		}
	};

	InputWidgetView.prototype.handleNewInputSelection = function(element) {
		this.defaultNewInputSelectionHandler(element);
	};

	InputWidgetView.prototype.defaultNewInputSelectionHandler = function(element) {
		var currentlySelectedElement = document.getElementById(this.currentlySelected.id);
		if (currentlySelectedElement) {
			this.unSelectCurrentlySelected(currentlySelectedElement);
		}

		this.selectInput(element);
	};

	module.exports = InputWidgetView;
});

