define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var HelpView = require('views/help/HelpView');
	var repeatAlertTagsTemplate = require('text!templates/make-repeat-alert-help.html');

	function RepeatAlertTagsHelpView() {
		HelpView.apply(this, arguments);
	}
	RepeatAlertTagsHelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		helpTemplate: repeatAlertTagsTemplate,
		templateScrollHeight: 1000
	};
	RepeatAlertTagsHelpView.prototype = Object.create(HelpView.prototype);

	RepeatAlertTagsHelpView.prototype.constructor = RepeatAlertTagsHelpView;

	App.pages['RepeatAlertTagsHelpView'] = RepeatAlertTagsHelpView;
	module.exports = RepeatAlertTagsHelpView;
});
