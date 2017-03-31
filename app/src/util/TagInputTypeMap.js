define( function(require, exports, module) {

	'use strict';

	var TagInputType = require('util/TagInputType');

	function TagInputTypeMap() {
		this.map = {};
	}

	TagInputTypeMap.prototype.constructor = TagInputTypeMap;

	TagInputTypeMap.prototype.add = function(tagId, description, inputType, min, max, noOfLevels) {
		var tagInputType = new TagInputType(tagId, description, inputType, min, max, noOfLevels);
		this.map[description] = tagInputType;

		return tagInputType;
	};

	TagInputTypeMap.prototype.set = function(tagId, description, inputType, min, max, noOfLevels) {
		var tagInputType = this.map[description];

		if (tagInputType) {
			return;
		}

		return this.add(tagId, description, inputType, min, max, noOfLevels);
	};

	TagInputTypeMap.prototype.get = function(description) {
		return this.map[description];
	};

	module.exports = TagInputTypeMap;
});