define( function(require, exports, module) {

	'use strict';

	var Utils = require('util/Utils');
	var TagStatsMap = require('util/TagStatsMap');
	var BaseAutoComplete = require('models/BaseAutoComplete');

	function TagsAutoComplete() {
		BaseAutoComplete.apply(this, arguments);
	}

	TagsAutoComplete.prototype = Object.create(BaseAutoComplete.prototype);
	TagsAutoComplete.prototype.constructor = TagsAutoComplete;

	TagsAutoComplete.prototype.init = function() {
		this.tagStatsMap = new TagStatsMap();
		this.algTagList = [];
		this.freqTagList = [];

		Utils.backgroundJSON("getting autocomplete info", Utils.makeGetUrl("autocompleteData"),
				Utils.getCSRFPreventionObject("autocompleteDataCSRF", {all: 'info'}),
			function(data) {
				if (Utils.checkData(data)) {
					this.tagStatsMap.import(data['all']);
					this.algTagList = data['alg'];
					this.freqTagList = data['freq'];
				}
			}.bind(this)
		);
	};

	TagsAutoComplete.prototype.addMatchesToSkipSet = function(list, set) {
		for (var i in list) {
			set[list[i].description] = 1;
		}
	};

	TagsAutoComplete.prototype.updateResultWithMatches = function(list, matches) {
		for (var i in matches) {
			list.push(matches[i].text());
		}
	};

	TagsAutoComplete.prototype.getResultForMatchingText = function(description) {
		return this.tagStatsMap.get(description);
	};

	// Refresh AutoComplete data when new tag is added.
	TagsAutoComplete.prototype.update = function(description, amount, amountPrecision, units, typicallyNoAmount) {
		var stats = this.tagStatsMap.set(description, amount, amountPrecision, units, typicallyNoAmount);
		if (stats != null) {
			this.algTagList.push(description);
			this.freqTagList.push(description);
		}
	};

	TagsAutoComplete.prototype.getListForMatch = function() {
		return this.algTagList;
	};

	module.exports = TagsAutoComplete;
});