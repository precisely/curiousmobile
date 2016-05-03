define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var HelpView = require('views/help/HelpView');
	var AddHelpTemplate = require('text!templates/add-discussion.html');

	function AddDiscussionHelpView() {
		HelpView.apply(this, arguments);
	}
	AddDiscussionHelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		helpTemplate: AddHelpTemplate
	};
	AddDiscussionHelpView.prototype = Object.create(HelpView.prototype);

	AddDiscussionHelpView.prototype.constructor = AddDiscussionHelpView;

	App.pages['AddDiscussionHelpView'] = AddDiscussionHelpView;
	module.exports = AddDiscussionHelpView;
});
