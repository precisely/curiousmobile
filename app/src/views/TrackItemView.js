define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');

	function TrackItemView() {
		View.apply(this, arguments);
	}

	TrackItemView.prototype = Object.create(View.prototype);
	TrackItemView.prototype.constructor = TrackItemView;

	TrackItemView.DEFAULT_OPTIONS = {};

	module.exports = TrackItemView;
});
