define(function(require, exports, module) {

	'use strict';

	var WidgetEntryFormView = require('views/entry/WidgetEntryFormView');
	var Entry = require('models/Entry');

	function TrackWidgetEntryFormView(options) {
		WidgetEntryFormView.apply(this, arguments);

		this.trackView = options.trackView;
	}

	TrackWidgetEntryFormView.prototype = Object.create(WidgetEntryFormView.prototype);
	TrackWidgetEntryFormView.prototype.constructor = TrackWidgetEntryFormView;

	TrackWidgetEntryFormView.prototype.registerOnSelectForAutoCompleteView = function() {
		this.autoCompleteView.onSelect(function(tagDescription) {
			this.trackView.addNewInputWidget(tagDescription);
		}.bind(this));
	};

	TrackWidgetEntryFormView.prototype.killOverlayContent = function() {
		this.trackView.killOverlayContent();
	};

	TrackWidgetEntryFormView.prototype.registerYesButtonListener = function() {
		this.on('yes-button-selected', function() {
			var inputSurfaceElement = document.getElementById('entry-description');
			if (inputSurfaceElement) {
				inputSurfaceElement.value = '';
			}
			var state = this.trackView.entryFormView.buildStateFromEntry(new Entry());
			this.trackView.showTrackEntryFormView(state);
		}.bind(this));
	};

	module.exports = TrackWidgetEntryFormView;
});
