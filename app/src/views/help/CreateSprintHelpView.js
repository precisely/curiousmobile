define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var HelpView = require('views/help/HelpView');
	var CreateSprintHelpTemplate = require('text!templates/create-sprint-help.html');

	function CreateSprintHelpView() {
		HelpView.apply(this, arguments);
	}
	CreateSprintHelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		helpTemplate: CreateSprintHelpTemplate
	};
	CreateSprintHelpView.prototype = Object.create(HelpView.prototype);

	CreateSprintHelpView.prototype.constructor = CreateSprintHelpView;

	App.pages['CreateSprintHelpView'] = CreateSprintHelpView;
	module.exports = CreateSprintHelpView;
});
