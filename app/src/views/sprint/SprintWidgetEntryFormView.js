define(function(require, exports, module) {

	'use strict';

	var WidgetEntryFormView = require('views/entry/WidgetEntryFormView');
	var Entry = require('models/Entry');

	function SprintWidgetEntryFormView(options) {
		WidgetEntryFormView.apply(this, arguments);

		this.sprintFormView = options.sprintFormView;
	}

	SprintWidgetEntryFormView.prototype = Object.create(WidgetEntryFormView.prototype);
	SprintWidgetEntryFormView.prototype.constructor = SprintWidgetEntryFormView;

	SprintWidgetEntryFormView.prototype.registerOnSelectForAutoCompleteView = function() {
		this.autoCompleteView.onSelect(function(tagDescription) {
			this.addTagToSprintFormView(tagDescription);
		}.bind(this));
	};

	SprintWidgetEntryFormView.prototype.addTagToSprintFormView = function(tagDescription) {
		var newEntry = new Entry();

		newEntry.setText(tagDescription);
		newEntry.set('date', window.App.selectedDate);
		newEntry.userId = this.sprintFormView.virtualUserId;
		newEntry.set("repeatType", Entry.RepeatType.CONTINUOUSGHOST);

		newEntry.create(function(resp) {
			var createdEntry = resp.glowEntry;
			var entryItem = this.sprintFormView.getTagItem(createdEntry);
			this.sprintFormView.killAddSprintTagsOverlay({entryItem: entryItem, entry: createdEntry});
		}.bind(this));
	};

	SprintWidgetEntryFormView.prototype.killOverlayContent = function() {
		this.sprintFormView.killOverlayContent();
	};

	SprintWidgetEntryFormView.prototype.registerYesButtonListener = function() {
		this.on('yes-button-selected', function() {
			this.sprintFormView.showSprintEntryFormView();
		}.bind(this));
	};

	module.exports = SprintWidgetEntryFormView;
});
