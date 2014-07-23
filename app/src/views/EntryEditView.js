define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');

	function EntryEditView() {
		View.apply(this, arguments);
	}

	EntryEditView.prototype = Object.create(View.prototype);
	EntryEditView.prototype.constructor = EntryEditView;

	EntryEditView.DEFAULT_OPTIONS = {};

	module.exports = EntryEditView;
});
