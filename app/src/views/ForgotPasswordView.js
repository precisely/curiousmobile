define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require("famous/core/Surface");
	var InputSurface = require('famous/surfaces/InputSurface');
	var FormContainerSurface = require('famous/surfaces/FormContainerSurface');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var ForgotPasswordTemplate = require('text!templates/forgot-password.html');
	var u = require('util/Utils');

	function ForgotPasswordView() {
		View.apply(this, arguments);
		_createView.call(this);
	}

	ForgotPasswordView.prototype = Object.create(View.prototype);
	ForgotPasswordView.prototype.constructor = ForgotPasswordView;

	ForgotPasswordView.DEFAULT_OPTIONS = {};

	function _createView() {
		var template = ForgotPasswordTemplate;
		var forgotSurface = new Surface({
			content: _.template(template, this.options, templateSettings)
		});

		forgotSurface.on('click', function(e) {
			var classList;
			if (e instanceof CustomEvent) {
				if (e.srcElement.localName == 'button') {
					classList = e.srcElement.classList;
				} else {
					classList = e.srcElement.parentElement.classList;
				}
				if (_.contains(classList, 'cancel')) {
					console.log('password reset cancelled');
					this._eventOutput.emit('cancel-forgot-password');;
				} else if (_.contains(classList, 'submit')) {
					this.submit();
				}
			}
		}.bind(this));
		this.add(forgotSurface);

	}

	ForgotPasswordView.prototype.submit = function() {
		var name = document.forms["forgotPasswordForm"]["username"].value;
		u.queueJSON('password recovery',
				u.makeGetUrl('doforgotData'),
				u.makeGetArgs({
					username: name
				}),
				function(data) {
			if (data.success) {
				u.showAlert('Look for instructions on recovering your account information in your email.');
				this._eventOutput.emit('password-reset');
			} else {
				u.showAlert(data.message + ' Please try again or hit Cancel to return to the login screen.');
			}
		}.bind(this));
	};

	ForgotPasswordView.prototype.reset = function(){
		this.usernameSurface.setValue('');
	};
	module.exports = ForgotPasswordView;
});
