define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Timer = require('famous/utilities/Timer');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var DeviceDataView = require('views/entry/DeviceDataView');

	function DeviceDataSummaryView(entry) {
		DeviceDataView.apply(this, arguments);
	}

	DeviceDataSummaryView.prototype = Object.create(DeviceDataView.prototype);
	DeviceDataSummaryView.prototype.constructor = DeviceDataSummaryView;

	DeviceDataSummaryView.DEFAULT_OPTIONS = {};

	module.exports = DeviceDataSummaryView;
});
