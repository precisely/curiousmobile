define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Timer = require('famous/utilities/Timer');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var DeviceDataView = require('views/entry/DeviceDataView');
	function DeviceDataGroupView(entries) {
		DeviceDataView.apply(this, arguments);
		this.expanded = true;
	}

	DeviceDataGroupView.prototype = Object.create(DeviceDataView.prototype);
	DeviceDataGroupView.prototype.constructor = DeviceDataGroupView;

	DeviceDataGroupView.DEFAULT_OPTIONS = {};

	DeviceDataGroupView.prototype.getDisplayText = function () {
		var text = this.getTriangle();
		return text + ' ' + this.deviceEntries[0].get('sourceName');
	};

	DeviceDataGroupView.prototype.groupEntries = function (param) {
		this.deviceEntries.each(function(entry) {
			var currentGroup = this.groupedEntries[entry.description] = this.groupedEntries[entry.description] || [];
			currentGroup.push(entry);
		});
	};
	module.exports = DeviceDataGroupView;
});
