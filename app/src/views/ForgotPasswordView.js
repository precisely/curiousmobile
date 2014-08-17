define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require("famous/core/Surface");
	var InputSurface = require('famous/surfaces/InputSurface');
	var FormContainerSurface = require('famous/surfaces/FormContainerSurface');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var u = require('util/Utils');

	function ForgotPasswordView() {
		View.apply(this, arguments);
		_createView.call(this);
	}

	ForgotPasswordView.prototype = Object.create(View.prototype);
	ForgotPasswordView.prototype.constructor = ForgotPasswordView;

	ForgotPasswordView.DEFAULT_OPTIONS = {};

	function _createView() {
		var formSurface = new FormContainerSurface({
			size: [200, 200],
			properties: {
				backgroundColor: 'white'
			}
		});

		this.elementModifier = new StateModifier({
			transform: Transform.translate(0, 0, 2)
		});

		this.usernameSurface = new InputSurface({
			placeholder: 'username',
			size: [200, 25]
		});

		this.usernameSurface.on('keydown', function(e) {
			//on enter
			if (e.keyCode == 13) {
				this.submit();
			}
		}.bind(this));

		var submitSurface = new Surface({
			content: '<input type="button" value="Cancel" class="cancel" /> <input type="button" value="Submit" class="submit" />'
		});

		submitSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.classList;
				if (_.contains(classList, 'cancel')) {
					console.log('password reset canclled');
					this._eventOutput.emit('cancel-forgot-password');
				} else if (_.contains(classList, 'submit')) {
					this.submit();
				}
			}
		}.bind(this));

		var formLayout = new SequentialLayout({
			direction: 1,
			itemSpacing: 7,
		});


		formLayout.sequenceFrom([this.usernameSurface, submitSurface]);
		formSurface.add(this.elementModifier).add(formLayout);

		this.add(formSurface);

	}

	ForgotPasswordView.prototype.submit = function() {
		u.queueJSON('password recovery',
			u.makeGetUrl('doforgotData'),
			u.makeGetArgs({
				username: this.usernameSurface.getValue()
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
