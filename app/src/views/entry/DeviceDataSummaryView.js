define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Timer = require('famous/utilities/Timer');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var DeviceDataView = require('views/entry/DeviceDataView');
	var TrackEntryView = require('views/entry/TrackEntryView');
	var Entry = require('models/Entry');

	function DeviceDataSummaryView(options) {
		DeviceDataView.apply(this, arguments);
		this.pipe(options.scrollView);
	}

	DeviceDataSummaryView.prototype = Object.create(DeviceDataView.prototype);
	DeviceDataSummaryView.prototype.constructor = DeviceDataSummaryView;

	DeviceDataSummaryView.DEFAULT_OPTIONS = {};

	DeviceDataSummaryView.prototype.group = function () {
		this.entries.each(function(entry) {
			var normalizedAmounts = entry.get('normalizedAmounts');
			if (!normalizedAmounts) {
				return;
			}

			for (var i in normalizedAmounts) {
				var currentGroup = this.groupedData[normalizedAmounts[i].units] =
					this.groupedData[normalizedAmounts[i].units] || [];
				currentGroup.push(normalizedAmounts[i]);
			}
		}.bind(this));
		this.aggregateUnits();
		var copiedEntry = JSON.parse(JSON.stringify(this.entries.at(0).attributes));
		copiedEntry.id = -1;
		copiedEntry.amounts = this.aggregatedUnitAmounts;
		this.aggregatedEntry = new Entry(copiedEntry);
	};

	DeviceDataSummaryView.prototype.aggregateUnits = function () {
		this.aggregatedUnitAmounts = {};
		var aggregateIndex = 0; // Index used to create the amounts object. See DeviceData.js
		for (var unit in this.groupedData) {
			var groupedUnitData = this.groupedData[unit];
			var shouldSum;
			var amount = 0;
			for (var i in groupedUnitData) {
				var unitData = groupedUnitData[i];
				var calculatedAmount = this.aggregatedUnitAmounts[aggregateIndex];
				if (calculatedAmount) {
					amount = calculatedAmount.amount;
				}
				calculatedAmount = this.aggregatedUnitAmounts[aggregateIndex] = JSON.parse(JSON.stringify(unitData));

				if (typeof calculatedAmount.sum !== 'undefined' && typeof shouldSum == 'undefined') {
				   shouldSum = calculatedAmount.sum;
				}
				amount += unitData.amount;
				calculatedAmount.amount = amount;
			}
			if (!shouldSum) {
				calculatedAmount.amount = calculatedAmount.amount / groupedUnitData.length;
			}
			aggregateIndex++;
		}
	};
	DeviceDataSummaryView.prototype.getDisplayText = function () {
		var text = '&nbsp;&nbsp;&nbsp;&nbsp;' + this.getTriangle() + '&nbsp;';
		text += this.aggregatedEntry.toString();
		return text;
	};

	DeviceDataSummaryView.prototype.createChildren = function () {
		this.entries.each(function(entry) {
			var childView = new TrackEntryView({
				entry: entry,
				readSurfaceOptions : {
					properties: {
						padding:'15px 45px 15px 46px'
					}
				}
			});
			childView.pipe(this.options.scrollView);
			this.children.push(childView);
		}.bind(this));
	};
	module.exports = DeviceDataSummaryView;
});
