define( function(require, exports, module) {

	'use strict';

	var Store = require('store');

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

		var lastQueryDate = Store.get('lastInputTypeQueryDate');

		if (this.isOutdated(lastQueryDate)) {
			this.getResultsFromServer();
		} else {
			this.initializeFromStore();
		}
	};

	TagInputTypeAutoComplete.prototype.initializeFromStore = function() {
		var tagsInputTypeMap = Store.get('taginputTypeMap');
        this.taginputTypeMap.addAll(tagsInputTypeMap);

		var tagsWithInputType = Store.get('tagsWithInputType');
		this.tagsWithInputType = tagsWithInputType ? tagsWithInputType : [];
	};

	TagInputTypeAutoComplete.prototype.isOutdated = function(lastQueryDate) {
		if (!lastQueryDate) {
			return true;
		}

		var now = new Date().getTime();
		var queryDate = new Date(lastQueryDate).getTime();

		return (now - queryDate > (48 * 60 * 60 * 1000)); // Difference should be greater than 48 hours.
	};

	TagInputTypeAutoComplete.prototype.getResultsFromServer = function() {
		var lastInputTypeCacheDate = Store.get('lastInputTypeCacheDate');

		var params = lastInputTypeCacheDate ? {lastInputTypeCacheDate: lastInputTypeCacheDate} : {};
		var argsToSend = Utils.getCSRFPreventionObject("getAllTagsWithInputTypeCSRF", params);

		Utils.backgroundJSON("TagInputType AutoComplete", Utils.makeGetUrl("getAllTagsWithInputType"),
				argsToSend, function(data) {
					Store.set('lastInputTypeQueryDate', new Date().getTime());

					if (data && Utils.checkData(data)) {

						if (data.cacheDate) {
							Store.set('lastInputTypeCacheDate', data.cacheDate);
						}

						if (data.tagsWithInputTypeList && data.tagsWithInputTypeList.length > 0) {
							data.tagsWithInputTypeList.forEach(function(tagDetails) {
								this.update(tagDetails.tagId, tagDetails.description, tagDetails.inputType,
										tagDetails.min, tagDetails.max, tagDetails.noOfLevels, tagDetails.defaultUnit,
										tagDetails.lastUnits);
							}.bind(this));

							Store.set('taginputTypeMap', this.taginputTypeMap.map);
							Store.set('tagsWithInputType', this.tagsWithInputType)
						} else {
							this.initializeFromStore();
						}
					}
			}.bind(this)
		);
	};

	TagInputTypeAutoComplete.prototype.getResultForMatchingText = function(description) {
		return this.taginputTypeMap.get(description);
	};

	TagInputTypeAutoComplete.prototype.update = function(tagId, description, inputType, min, max, noOfLevels,
			defaultUnit, lastUnits) {
		var tagInputTypeAdded = this.taginputTypeMap.set(tagId, description, inputType, min, max, noOfLevels,
				defaultUnit, lastUnits);

		if (tagInputTypeAdded) {
			this.tagsWithInputType.push(description);
		}
	};

	TagInputTypeAutoComplete.prototype.getListForMatch = function() {
		return this.tagsWithInputType;
	};

	module.exports = TagInputTypeAutoComplete;
});