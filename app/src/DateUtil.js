define(function(require, exports, module) {
	'use strict';
	var DateUtil = {};

	DateUtil.getMonth = function(date) {
		var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'
		];
		
		return monthNames[date.getMonth()];
	}
	module.exports = DateUtil;
});
