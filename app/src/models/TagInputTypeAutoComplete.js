define( function(require, exports, module) {

	'use strict';

	var Utils = require('util/Utils');
	var TagInputTypeMap = require('util/TagInputTypeMap');
	var TagsAutoComplete = require('models/TagsAutoComplete');

	function TagInputTypeAutoComplete() {
		TagsAutoComplete.apply(this, arguments);
	}

	TagInputTypeAutoComplete.prototype = Object.create(TagsAutoComplete.prototype);
	TagInputTypeAutoComplete.prototype.constructor = TagInputTypeAutoComplete;

	TagInputTypeAutoComplete.prototype.init = function() {
		this.taginputTypeMap = new TagInputTypeMap();
		this.tagsWithInputType = [];

		Utils.backgroundJSON("TagInputType AutoComplete", Utils.makeGetUrl("getAllTagsWithInputType"),
				Utils.getCSRFPreventionObject("getAllTagsWithInputTypeCSRF"),
			function(tagsWithInputType) {
				if (Utils.checkData(tagsWithInputType)) {
					tagsWithInputType.forEach(function(tagDetails) {
						this.update(tagDetails.tagId, tagDetails.description, tagDetails.inputType, tagDetails.min,
								tagDetails.max, tagDetails.noOfLevels);
					}.bind(this));
				}
			}.bind(this)
		);
	};

	TagInputTypeAutoComplete.prototype.getResultForMatchingText = function(description) {
		return this.taginputTypeMap.get(description);
	};

	TagInputTypeAutoComplete.prototype.update = function(tagId, description, inputType, min, max, noOfLevels) {
		var tagInputTypeAdded = this.taginputTypeMap.set(tagId, description, inputType, min, max, noOfLevels);
		if (tagInputTypeAdded) {
			this.tagsWithInputType.push(description);
		}
	};

	TagInputTypeAutoComplete.prototype.getListForMatch = function() {
		return this.tagsWithInputType;
	};

	module.exports = TagInputTypeAutoComplete;
});