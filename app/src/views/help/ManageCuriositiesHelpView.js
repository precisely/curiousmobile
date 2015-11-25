define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var HelpView = require('views/help/HelpView');
	var CuriositiesTemplate = require('text!templates/manage-curiosities-help.html');

	function ManageCuriositiesHelpView() {
		HelpView.apply(this, arguments);
	}
	ManageCuriositiesHelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		helpTemplate: CuriositiesTemplate,
		templateScrollHeight: 450
	};
	ManageCuriositiesHelpView.prototype = Object.create(HelpView.prototype);

	ManageCuriositiesHelpView.prototype.constructor = ManageCuriositiesHelpView;

	App.pages['ManageCuriositiesHelpView'] = ManageCuriositiesHelpView;
	module.exports = ManageCuriositiesHelpView;
});
