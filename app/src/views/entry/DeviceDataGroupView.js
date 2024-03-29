define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var DeviceDataView = require('views/entry/DeviceDataView');
	var DeviceDataSummaryView = require('views/entry/DeviceDataSummaryView');
	var Timer = require('famous/utilities/Timer');
	var Utility = require('famous/utilities/Utility');

	function DeviceDataGroupView(options) {
		DeviceDataView.apply(this, arguments);
		//this.collapsed = false;

		this.expand();
		//this.add(this.bgModifier).add(this.backgroundSurface);
	}

	DeviceDataGroupView.prototype = Object.create(DeviceDataView.prototype);
	DeviceDataGroupView.prototype.constructor = DeviceDataGroupView;

	DeviceDataGroupView.DEFAULT_OPTIONS = {};

	DeviceDataGroupView.prototype.getDisplayText = function () {
		var text = this.getTriangle();
		return text + ' ' + this.entries.at(0).get('sourceName');
	};

	DeviceDataGroupView.prototype.group = function () {
		this.entries.each(function(entry) {
			if (!entry.get('normalizedAmounts')) {
				return;
			}
			var currentGroup = this.groupedData[entry.get('description')] =
				this.groupedData[entry.get('description')] || [];
			currentGroup.push(entry);
		}.bind(this));
	};

	DeviceDataGroupView.prototype.createChildren = function () {
		for (var i in this.groupedData) {
			var groupedEntry = this.groupedData[i];
			 this.children.push(new DeviceDataSummaryView({entry: groupedEntry,
				 entryZIndex: App.zIndex.readView + 4, scrollView: this.options.scrollView}));
		}
	};
	module.exports = DeviceDataGroupView;
});
