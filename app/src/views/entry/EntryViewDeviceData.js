define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Timer = require('famous/utilities/Timer');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var DeviceDataView = require('views/entry/DeviceDataView');

	function EntryViewDeviceData(entry) {
		DeviceDataView.apply(this, arguments);
	}

	EntryViewDeviceData.prototype = Object.create(DeviceDataView.prototype);
	EntryViewDeviceData.prototype.constructor = EntryViewDeviceData;

	EntryViewDeviceData.DEFAULT_OPTIONS = {};

	module.exports = EntryViewDeviceData;
});
