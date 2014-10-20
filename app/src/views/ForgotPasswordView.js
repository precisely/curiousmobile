define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var BaseView = require('views/BaseView');
	var Surface = require("famous/core/Surface");
	var InputSurface = require('famous/surfaces/InputSurface');
	var FormContainerSurface = require('famous/surfaces/FormContainerSurface');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var ForgotPasswordTemplate = require('text!templates/forgot-password.html');
	var u = require('util/Utils');

	function ForgotPasswordView() {
		BaseView.apply(this, arguments);
		_createView.call(this);
	}

	ForgotPasswordView.prototype = Object.create(BaseView.prototype);
	ForgotPasswordView.prototype.constructor = ForgotPasswordView;

	ForgotPasswordView.DEFAULT_OPTIONS = {
		header: true,	
		footer: false,
		backButton: true,
	};

	function _createView() {
		var template = ForgotPasswordTemplate;
		var forgotSurface = new Surface({
			content: _.template(template, this.options, templateSettings),
			properties: {
				backgroundColor: 'white'
			}
		});

		forgotSurface.on('click', function(e) {
			var classList;
			if (e instanceof CustomEvent) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'btn')) {
					this.submit();
				}
			}
		}.bind(this));

		this.on('on-show', function() {
			var inputElement = document.getElementById("email");
			inputElement.focus();
		}.bind(this));

		this.setHeaderLabel('FORGOT PASSWORD');
		this.setBody(forgotSurface);

	}

	ForgotPasswordView.prototype.submit = function() {
		var email = document.forms["forgotPasswordForm"]["email"].value;
		u.queueJSON('password recovery',
			u.makeGetUrl('doforgotData'),
			u.makeGetArgs({
				email: email
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
