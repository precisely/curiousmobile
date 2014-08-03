define(['require', 'exports', 'module', 'exoskeleton'], function(require, exports, module, exoskeleton) {
	'use strict';
	var Utils = require('util/Utils');
	// Singleton Class function.
	var RepeatType = {
		CONTINUOUS_BIT: 0x100,
		GHOST_BIT: 0x200,
		CONCRETEGHOST_BIT: 0x400,
		TIMED_BIT: 0x1 | 0x2 | 0x4,
		REPEAT_BIT: 0x1 | 0x2,
		REMIND_BIT: 0x4,

	};

	var Entry = Backbone.Model.extend({

		isConcreteGhost: function() {
			return (this.get('repeatType') & RepeatType.CONCRETEGHOST_BIT) != 0;
		},
		isContinuous: function() {
			return (this.get('repeatType') & RepeatType.CONTINUOUS_BIT) != 0;
		},
		isGhost: function() {
			return (this.get('repeatType') & RepeatType.GHOST_BIT) != 0;
		},
		isRemind: function() {
			return (this.get('repeatType') & RepeatType.REMIND_BIT) != 0;
		},
		isRepeat: function() {
			return (this.get('repeatType') & RepeatType.REPEAT_BIT) != 0;
		},
		isTimed: function() {
			return (this.get('repeatType') & RepeatType.TIMED_BIT) != 0;
		},
		repeatTypeAsClass: function() {
			var repeatType = this.get('repeatType');
			var classes = ['entry'];
			if (this.isGhost(repeatType)) {
				classes.push('ghost');
				classes.push('anyghost');
			}
			if (this.isConcreteGhost(repeatType)) {
				classes.push('concreteghost');
				classes.push('anyghost');
			}
			if (this.isContinuous(repeatType)) {
				classes.push('continuous');
			}
			if (this.isTimed(repeatType)) {
				classes.push('timedrepeat');
			}
			if (this.isRepeat(repeatType)) {
				classes.push('repeat');
			}
			if (this.isRemind(repeatType)) {
				classes.push('remind');
			}
			return classes;
		},
		getSelectionRange: function(argument) {
			var formattedAmount = this.formattedAmount();
			var selectStart = this.get('description').length + 1 + (formattedAmount.length == 0 ? 1 : 0);
			var selectEnd = selectStart + formattedAmount.length - 1;
			return [selectStart, selectEnd]; // if third item is true, insert extra space at cursor
		},
		needExtraSpace: function () {
			return this.get('amountPrecision') < 0;
		},
		toString: function(argument) {
			var entry = this.attributes;
			var escapeHTML = Utils.escapeHTML;
			var dateStr = '';
			if (this.get('datePrecisionSecs') < 43200) {
				dateStr = Utils.dateToTimeStr(new Date(entry.date), false);
				dateStr = ' ' + dateStr;
			}
			var entryStr = escapeHTML(entry.description)
				+ escapeHTML(this.formattedAmount())
				+ escapeHTML(this.formatUnits())
				+ escapeHTML(dateStr)
				+ (entry.comment != '' ? ' ' + escapeHTML(entry.comment) : '')
			return entryStr;
		},
		formattedAmount: function(argument) {
			var entry = this.attributes;
			if (entry.amount == null) return " ___";
			if (entry.amountPrecision < 0) return "";
			if (entry.amountPrecision == 0) {
				return entry.amount ? " yes" : " no";
			}
			return " " + entry.amount;
		},
		formatUnits: function() {
			var units = this.get('units');
			if (units.length > 0)
				return " " + units;

			return "";
		}

	});

	Entry.RepeatType = RepeatType;
	module.exports = Entry;
});
