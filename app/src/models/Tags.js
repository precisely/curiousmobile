define(function(require, exports, module) {
	'use strict';
	var exoskeleton = require('exoskeleton');
	var EventHandler = require("famous/core/EventHandler");
	var store = require('store');
	var u = require('util/Utils');

	var Tags = Backbone.Model.extend({
		constructor: function(argument) {
			this.eventInput = new EventHandler();
			Backbone.Model.apply(this, arguments);
			this.tagsList = [];
		},
	});

	Tags.fetch = function(successCallback) {
		// get top-level list of items, add new or changed ones to list
		u.backgroundJSON("loading list of tags", "/tag/listTagsAndTagGroupsData?callback=?",
			u.getCSRFPreventionObject("listTagsAndTagGroupsCSRF", {sort: 'alpha'}), function(data) {
				if (!u.checkData(data))
					return;

				if (successCallback) {
					this.tagsList = data;
					successCallback(data);
				}

			}.bind(this));
	}

	Tags.eachSearchMatches = function(term, matchClosure, noMatchClosure, skipSet, additionalWordsCharLimit) {
		var list = App.tagListWidget.list.listItems.list;
		var i, j, result = [];

		var terms = term.split(' ');
		var spaceTerms = [];

		for (j in terms) {
			spaceTerms.push(' ' + terms[j]);
		}

		var termLonger = term.length > additionalWordsCharLimit;

		for (i = 0; i < list.length; ++i) {
			var tag = list[i];
			var match = false;
			var tagName = tag.description;
			if (tagName in skipSet) continue;
			match = true;
			for (j in terms) {
				if (terms[j].length >0 && (!(tagName.startsWith(terms[j]) || (termLonger && (tagName.indexOf(spaceTerms[j]) >= 0)) ))) {
					match = false;
					break;
				}
			}
			if (match) {
				skipSet[tag.description] = 1;
				if (matchClosure) {
					matchClosure(tag, i);
				}
				result.push(tag);
			} else if (noMatchClosure) {
				noMatchClosure(tag, i);
			}
		}

		return result;
	}

	Tags.eachMatchingTags = function(term, matchClosure, noMatchClosure) {
		if (term.length > 0) {
			var skipSet = {};

			return this.eachSearchMatches(term, matchClosure, noMatchClosure, skipSet, 3);
		} else {
			return this.tagsList;
		}
	};

	Tags.sortTags = function(tagList, sortAscending, sortFilter) {
		if (sortFilter === 'most-used') {
			tagList.sortByUseCount();
		} else {
			if (sortAscending) {
				tagList.listItems.list.sort(function(a, b) {
					if (a.description < b.description)
						return -1;
					if (a.description > b.description)
						return 1;
					return 0;
				});
			} else {
				tagList.listItems.list.sort(function(a, b) {
					if (a.description < b.description)
						return 1;
					if (a.description > b.description)
						return -1;
					return 0;
				});
			}
		}
	};

	Tags.getTagProperties = function(id, callback) {
		u.backgroundJSON("loading tag information", App.serverUrl + "/tag/getTagPropertiesData?callback=?",
            u.makeGetArgs(u.getCSRFPreventionObject("getTagPropertiesCSRF", {id : id})),
			function(data) {
				if (!u.checkData(data))
					return;

				callback(data);
			}.bind(this));
	}

	module.exports = Tags;
});
