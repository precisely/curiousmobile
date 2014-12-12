define( function(require, exports, module) {
	var u = require('util/Utils');
	//static autocomplete
	function TagStats(term, amount, amountPrecision, units, typicallyNoAmount) {
		this.term = term;
		this.amount = amount;
		this.amountPrecision = amountPrecision;
		this.units = units;
		this.typicallyNoAmount = !(!typicallyNoAmount);

		this.set = function(amount, amountPrecision, units, typicallyNoAmount) {
			typicallyNoAmount = !(!typicallyNoAmount);
			if (this.amount != amount || this.amountPrecision != amountPrecision
			|| this.units != units || this.typicallyNoAmount != typicallyNoAmount) {
				this.amount = amount;
				this.amountPrecision = amountPrecision;
				this.units = units;
				this.typicallyNoAmount = typicallyNoAmount;

				return true;
			}

			return false;
		}

		this.text = function() {
			var label = this.term;
			var value = this.term;
			var noAmt = true;

			if (this.amount !== null && this.amountPrecision > 0) {
				label += ' ' + this.amount;
				value += ' ' + this.amount;
				noAmt = false;
			} else if (this.amount == null && this.units.length == 0) {
				label += ' ';
				value += ' ';
			}

			if (this.units != null && this.units.length > 0) {
				if (noAmt) {
					//label += '   ';
					value += ' ';
				}
				//label += ' ' + this.units;
				value += ' ' + this.units;
			}

			return { label:label, value:value };
		}

		this.getAmountSelectionRange = function() {
			var start = this.term.length;
			var end = start;

			if (this.amount != null && this.amountPrecision > 0) {
				++start;
				end += ('' + this.amount).length + 1;
			} else if (this.amount == null) {
				++start;
				++end;
			} else if (this.units != null && this.units.length > 0) {
				++start;
				++end;
			}

			return [start, end];
		}
	}

	function TagStatsMap() {
		this.map = {};
		this.textMap = {};

		this.import = function(list) {
			// import list of tag elements from server
			for (var i in list) {
				this.add(list[i][0], list[i][1], list[i][2], list[i][3], list[i][4]);
			}
		}

		this.add = function(term, amount, amountPrecision, units, typicallyNoAmount) {
			var tagStats = new TagStats(term, amount, amountPrecision, units, typicallyNoAmount);
			this.map[term] = tagStats;
			this.textMap[tagStats.text().value] = tagStats;
			return tagStats;
		}

		// return null if stats already present, stats if it isn't
		this.set = function(term, amount, amountPrecision, units, typicallyNoAmount) {
			var stats = this.map[term];

			if (stats != null) {
				var oldTextValue = stats.text().value;
				if (stats.set(amount, amountPrecision, units, typicallyNoAmount)) {
					var newTextValue = stats.text().value;
					if (oldTextValue != newTextValue) {
						delete this.textMap[oldTextValue];
						delete this.map[term];
						this.textMap[newTextValue] = stats;
						this.map[term] = stats;
					}
				}

				return null;
			}

			return this.add(term, amount, amountPrecision, units, typicallyNoAmount);
		}

		this.get = function(term) {
			return this.map[term];
		}

		this.getFromText = function(textValue) {
			return this.textMap[textValue];
		}
	}

	function Autocomplete(autocompleteId, autocompleteView) {
		this.autocompleteId = autocompleteId;
		this.autocompleteView = autocompleteView;

		this.addStatsTermToSet = function(list, set) {
			for (var i in list) {
				set[list[i].term] = 1;
			}
		}

		this.appendStatsTextToList = function(list, stats) {
			for (var i in stats) {
				list.push(stats[i].text());
			}
		}

		this.findAutoMatches = function(list, term, limit, skipSet, additionalWordsCharLimit) {
			var i, j, num = 0, result = [];

			var terms = term.split(' ');
			var spaceTerms = [];

			for (j in terms) {
				spaceTerms.push(' ' + terms[j]);
			}

			var termLonger = term.length > additionalWordsCharLimit;

			for (i in list) {
				var tag = list[i];
				if (tag in skipSet) continue;
				var match = true;
				for (j in terms) {
					if (terms[j].length >0 && (!(tag.startsWith(terms[j]) || (termLonger && (tag.indexOf(spaceTerms[j]) >= 0)) ))) {
						match = false;
						break;
					}
				}
				if (match) {
					result.push(this.tagStatsMap.get(tag));
					if (++num >= limit) break;
				}
			}

			return result;
		}

		this.tagStatsMap = new TagStatsMap();
		this.algTagList = [];
		this.freqTagList = [];

		// refresh autocomplete data if new tag added
		this.update = function(term, amount, amountPrecision, units, typicallyNoAmount) {
			var stats = this.tagStatsMap.set(term, amount, amountPrecision, units, typicallyNoAmount);
			if (stats != null) {
				this.algTagList.push(term);
				this.freqTagList.push(term);
			}
		}

		var autocompleteWidget = this;

		u.backgroundJSON("getting autocomplete info", u.makeGetUrl("autocompleteData"), u.getCSRFPreventionObject("autocompleteDataCSRF", {all: 'info'}),
		function(data) {
			if (u.checkData(data)) {
				autocompleteWidget.tagStatsMap.import(data['all']);
				autocompleteWidget.algTagList = data['alg'];
				autocompleteWidget.freqTagList = data['freq'];
			}
		}.bind(this));

		this.fetch = function(term, callback) {
			term = term.toLowerCase();

			var skipSet = {};
			var result = [];

			var matches = autocompleteWidget.findAutoMatches(autocompleteWidget.algTagList, term, 3, skipSet, 1);

			autocompleteWidget.addStatsTermToSet(matches, skipSet);
			autocompleteWidget.appendStatsTextToList(result, matches);

			var remaining = 6 - matches.length;

			if (term.length == 1) {
				var nextRemaining = remaining > 3 ? 3 : remaining;
				matches = autocompleteWidget.findAutoMatches(autocompleteWidget.algTagList, term, nextRemaining, skipSet, 0);
				autocompleteWidget.addStatsTermToSet(matches, skipSet);
				autocompleteWidget.appendStatsTextToList(result, matches);
				remaining -= nextRemaining;
			}

			if (remaining > 0) {
				matches = autocompleteWidget.findAutoMatches(autocompleteWidget.freqTagList, term, remaining, skipSet, 0);
				autocompleteWidget.appendStatsTextToList(result, matches);
			}
			callback(result);
		}
	}
	module.exports = Autocomplete;
});
