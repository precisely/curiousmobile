define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var HelpView = require('views/help/HelpView');
	var advancedeTagsTemplate = require('text!templates/advanced-tags-help.html');

	function AdvancedTagsView() {
		HelpView.apply(this, arguments);
	}
	AdvancedTagsView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		helpTemplate: advancedeTagsTemplate,
		templateScrollHeight: 800
	};
	AdvancedTagsView.prototype = Object.create(HelpView.prototype);

	AdvancedTagsView.prototype.constructor = AdvancedTagsView;

	App.pages['AdvancedTagsView'] = AdvancedTagsView;
	module.exports = AdvancedTagsView;
});
