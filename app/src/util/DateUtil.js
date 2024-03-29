define(function(require, exports, module) {
	'use strict';
	var DateUtil = {};

	DateUtil.getMonth = function(date) {
		var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'
		];

		return monthNames[date.getMonth()];
	}

	DateUtil.getDaysInMonth = function(year, month) {
		return 32 - DateUtil.daylightSavingAdjust(new Date(year, month, 32)).getDate();
	}

	DateUtil.getFirstDayOfMonth = function(date) {
		return new Date(date.getFullYear(), date.getMonth(), 1);
	}

	DateUtil.daylightSavingAdjust = function(date) {
		if (!date) {
			return null;
		}
		date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
		return date;
	}

	DateUtil.daysInMonth = function(date) {
		var d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		return d.getDate();
	}

	DateUtil.addDays = function(date, numOfDays) {
		var d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + numOfDays);
		return d;
	}

	DateUtil.areEqual = function(a, b) {
		return a.getDate() == b.getDate() && a.getMonth() == b.getMonth() && a.getFullYear() == b.getFullYear();
	}

	DateUtil.getMidnightDate = function(date) {
		var start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
		return start;
	}


	module.exports = DateUtil;
});
