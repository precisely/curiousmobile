define( function(require, exports, module) {

	'use strict';

	function TagInputType(tagId, description, inputType, min, max, noOfLevels, defaultUnit, lastUnits) {
		this.tagId = tagId;
		this.description = description;
		this.inputType = inputType;
		this.min = min;
		this.max = max;
		this.noOfLevels = noOfLevels;
		this.defaultUnit = defaultUnit;
		this.lastUnits = lastUnits;
	}

	TagInputType.prototype.constructor = TagInputType;

	TagInputType.prototype.text = function() {
		return { label: this.description }
	};

	module.exports = TagInputType;
});