define( function(require, exports, module) {

	'use strict';

	function BaseAutoComplete() {
		this.init();
	}

	BaseAutoComplete.prototype.constructor = BaseAutoComplete;

	BaseAutoComplete.prototype.findAutoMatches = function(list, term, limit, skipSet, additionalWordsCharLimit) {
		var i, j, k, num = 0, matches = [];

		var terms = term.split(' ');
		var spaceTerms = [];

		for (i in terms) {
			spaceTerms.push(' ' + terms[i]);
		}

		var termLonger = term.length > additionalWordsCharLimit;

		for (j in list) {
			var textToMatch = list[j];

			if (textToMatch in skipSet) {
				continue;
			}

			var match = true;

			for (k in terms) {
				if (terms[k].length > 0 &&
						(!(textToMatch.startsWith(terms[k]) || 
						(termLonger && (textToMatch.indexOf(spaceTerms[k]) >= 0))))) {
					match = false;
					break;
				}
			}

			if (match) {
				if (num++ >= limit) {
					break;
				}

				matches.push(this.getResultForMatchingText(textToMatch));
			}
		}

		return matches;
	};

	BaseAutoComplete.prototype.fetch = function(term, callback) {
		term = term.toLowerCase();

		var skipSet = {};
		var result = [];
		var listForMatch = this.getListForMatch();

		var matches = this.findAutoMatches(listForMatch, term, 3, skipSet, 1);

		this.addMatchesToSkipSet(matches, skipSet);
		this.updateResultWithMatches(result, matches);

		var remaining = 3 - matches.length;

		if (term.length == 1) {
			var nextRemaining = remaining >= 2 ? 2 : remaining;
			matches = this.findAutoMatches(listForMatch, term, nextRemaining, skipSet, 0);

			this.addMatchesToSkipSet(matches, skipSet);
			this.updateResultWithMatches(result, matches);

			remaining -= nextRemaining;
		}

		if (remaining > 0) {
			matches = this.findAutoMatches(listForMatch, term, remaining, skipSet, 0);
			this.updateResultWithMatches(result, matches);
		}

		callback(result);
	};

	module.exports = BaseAutoComplete;
});