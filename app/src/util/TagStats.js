define( function(require, exports, module) {

	'use strict';

	function TagStats(description, amount, amountPrecision, units, typicallyNoAmount) {
		this.description = description;
		this.amount = amount;
		this.amountPrecision = amountPrecision;
		this.units = units;
		this.typicallyNoAmount = !(!typicallyNoAmount);
	}

	TagStats.prototype.constructor = TagStats;

	TagStats.prototype.set = function(amount, amountPrecision, units, typicallyNoAmount) {
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
	};

	TagStats.prototype.text = function() {
		var label = this.description;
		var value = this.description;
		var noAmt = true;

		if (this.amount !== null && this.amountPrecision > 0) {
			label += ' ' + this.amount;
			value += ' ' + this.amount;
			noAmt = false;
		} else if (this.amount == null && (this.units && this.units.length == 0)) {
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

		return { label: label, value: value };
	};

	TagStats.prototype.getAmountSelectionRange = function() {
		var start = this.description.length;
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
	};

	module.exports = TagStats;
});