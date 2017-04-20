define( function(require, exports, module) {

	'use strict';

	var TagInputType = require('util/TagInputType');

	/**
	 * This is a collection of TagInputType.
	 * @constructor
	 */
	function TagInputTypeMap() {
		this.map = {};
	}

	TagInputTypeMap.prototype.constructor = TagInputTypeMap;

	TagInputTypeMap.prototype.add = function(tagId, description, inputType, min, max, noOfLevels,
			defaultUnit, lastUnits) {
		var tagInputType = new TagInputType(tagId, description, inputType, min, max, noOfLevels, defaultUnit,
				lastUnits);

		this.map[description] = tagInputType;

		return tagInputType;
	};

	TagInputTypeMap.prototype.addAll = function(tagInputTypeMap) {
		_.each(tagInputTypeMap, function(tagInputType) {
			this.add(tagInputType.tagId, tagInputType.description, tagInputType.inputType, tagInputType.min,
				tagInputType.max, tagInputType.noOfLevels, tagInputType.defaultUnit, tagInputType.lastUnits);
		}.bind(this));
	};

	TagInputTypeMap.prototype.set = function(tagId, description, inputType, min, max, noOfLevels,
			defaultUnit, lastUnits) {
		var tagInputType = this.map[description];

		if (tagInputType) {
			return;
		}

		return this.add(tagId, description, inputType, min, max, noOfLevels, defaultUnit, lastUnits);
	};

	TagInputTypeMap.prototype.get = function(description) {
		return this.map[description];
	};

	module.exports = TagInputTypeMap;
});
