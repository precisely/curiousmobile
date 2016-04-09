define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var HelpView = require('views/help/HelpView');
	var externalDeviceHelpTemplate = require('text!templates/link-external-device-help.html');

	function ExternalDevicesHelpView() {
		HelpView.apply(this, arguments);
	}

	ExternalDevicesHelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		helpTemplate: externalDeviceHelpTemplate
	};
	ExternalDevicesHelpView.prototype = Object.create(HelpView.prototype);

	ExternalDevicesHelpView.prototype.constructor = ExternalDevicesHelpView;

	App.pages['ExternalDevicesHelpView'] = ExternalDevicesHelpView;
	module.exports = ExternalDevicesHelpView;
});
