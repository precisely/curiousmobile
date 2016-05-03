define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var HelpView = require('views/help/HelpView');
	var MakeChartTemplate = require('text!templates/make-chart-help.html');

	function MakeChartHelpView() {
		HelpView.apply(this, arguments);
	}
	MakeChartHelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		helpTemplate: MakeChartTemplate
	};
	MakeChartHelpView.prototype = Object.create(HelpView.prototype);

	MakeChartHelpView.prototype.constructor = MakeChartHelpView;

	App.pages['MakeChartHelpView'] = MakeChartHelpView;
	module.exports = MakeChartHelpView;
});
