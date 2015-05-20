define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var BaseView = require('views/BaseView');
	var Surface = require("famous/core/Surface");
	var FastClick = require('famous/inputs/FastClick');
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
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'btn')) {
					this.submit();
				}
			}
		}.bind(this));

		forgotSurface.on('keyup', function(e) {
			if (e.keyCode == 13) {
				this.submit();
			}
		}.bind(this));

		this.setHeaderLabel('FORGOT PASSWORD');
		this.setBody(forgotSurface);

	}

	ForgotPasswordView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		var inputElement = document.getElementById("email");
		inputElement.focus();
	};

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
					setTimeout(function() {
						this._eventOutput.emit('password-reset');
					}, 3000);
				} else {
					u.showAlert(data.message + ' Please try again or hit the back button to return to the login screen.');
				}
			}.bind(this));
	};

	ForgotPasswordView.prototype.reset = function() {
		this.usernameSurface.setValue('');
	};
	App.pages[ForgotPasswordView.name] = ForgotPasswordView;
	module.exports = ForgotPasswordView;
});
