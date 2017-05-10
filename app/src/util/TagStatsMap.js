define( function(require, exports, module) {

	'use strict';

	var TagStats = require('util/TagStats');

	function TagStatsMap() {
		this.map = {};
		this.textMap = {};
	}

	TagStatsMap.prototype.constructor = TagStatsMap;

	TagStatsMap.prototype.import = function(list) {
		// Import list of tag elements from server
		for (var i in list) {
			this.add(list[i][0], list[i][1], list[i][2], list[i][3], list[i][4]);
		}
	};

	TagStatsMap.prototype.add = function(description, amount, amountPrecision, units, typicallyNoAmount) {
		var tagStats = new TagStats(description, amount, amountPrecision, units, typicallyNoAmount);
		this.map[description] = tagStats;
		this.textMap[tagStats.text().value] = tagStats;
		return tagStats;
	};

	// return null if stats already present, stats if it isn't
	TagStatsMap.prototype.set = function(description, amount, amountPrecision, units, typicallyNoAmount) {
		var stats = this.map[description];

		if (stats != null) {
			var oldTextValue = stats.text().value;
			if (stats.set(amount, amountPrecision, units, typicallyNoAmount)) {
				var newTextValue = stats.text().value;
				if (oldTextValue != newTextValue) {
					delete this.textMap[oldTextValue];
					delete this.map[description];
					this.textMap[newTextValue] = stats;
					this.map[description] = stats;
				}
			}

			return null;
		}

		return this.add(description, amount, amountPrecision, units, typicallyNoAmount);
	};

	TagStatsMap.prototype.get = function(description) {
		return this.map[description];
	};

	TagStatsMap.prototype.getFromText = function(textValue) {
		return this.textMap[textValue];
	};

	module.exports = TagStatsMap;
});