define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var u = require('util/Utils');
	var HelpView = require('views/help/HelpView');
	var CreateTagHelpTemplate = require('text!templates/create-tag-help.html');

	function CreateTagHelpView() {
		HelpView.apply(this, arguments);
	}
	CreateTagHelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		helpTemplate: CreateTagHelpTemplate
	};
	CreateTagHelpView.prototype = Object.create(HelpView.prototype);

	CreateTagHelpView.prototype.constructor = CreateTagHelpView;

	App.pages['CreateTagHelpView'] = CreateTagHelpView;
	module.exports = CreateTagHelpView;
});
