define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var HelpView = require('views/help/HelpView');
	var ShareHelpTemplate = require('text!templates/share-help.html');

	function ShareHelpView() {
		HelpView.apply(this, arguments);
	}
	ShareHelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		helpTemplate: ShareHelpTemplate
	};
	ShareHelpView.prototype = Object.create(HelpView.prototype);

	ShareHelpView.prototype.constructor = ShareHelpView;

	App.pages['ShareHelpView'] = ShareHelpView;
	module.exports = ShareHelpView;
});
