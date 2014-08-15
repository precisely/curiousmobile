define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var FormContainerSurface = require('famous/surfaces/FormContainerSurface');
	var InputSurface = require('famous/surfaces/InputSurface');
	var SequentialLayout = require('famous/views/SequentialLayout');
	var User = require('models/User');
	var u = require('util/Utils');

	function RegisterView() {
		View.apply(this, arguments);
		this.createView();
	}

	RegisterView.prototype = Object.create(View.prototype);
	RegisterView.prototype.constructor = RegisterView;

	RegisterView.DEFAULT_OPTIONS = {};

	RegisterView.prototype.createView = function() {
		var formSurface = new FormContainerSurface({
			size: [200, 200],
			properties: {
				backgroundColor: 'white'
			}
		});

		this.elementModifier = new StateModifier({
			transform: Transform.translate(0, 0, 2)
		});

		var emailSurface = new InputSurface({
			placeholder: 'email',
			size: [200, 25]
		});

		var usernameSurface = new InputSurface({
			placeholder: 'username',
			size: [200, 25]
		});
		var passwordSurface = new InputSurface({
			placeholder: 'password',
			size: [200, 25],
			type: 'password'
		});

		passwordSurface.on('keydown', function(e) {
			//on enter
			if (e.keyCode == 13) {
				this.submit();
			}
		}.bind(this));

		var submitSurface = new Surface({
			content: '<input type="button" value="Cancel" class="cancel" />' +
				' <input type="button" value="Submit" class="submit" />',
		});

		this.emailSurface = emailSurface;
		this.usernameSurface = usernameSurface;
		this.passwordSurface = passwordSurface;
		submitSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.classList;
				if (_.contains(classList, 'cancel')) {
					console.log('registration canclled');
					this._eventOutput.emit('cancel-registration');
				} else if (_.contains(classList, 'submit')) {
					console.log('RegisterView: submit form');
					this.submit();
				}
			}
		}.bind(this));

		var formLayout = new SequentialLayout({
			direction: 1,
			itemSpacing: 7,
		});


		formLayout.sequenceFrom([emailSurface, usernameSurface, passwordSurface, submitSurface]);
		formSurface.add(this.elementModifier).add(formLayout);

		this.add(formSurface);
	};

	RegisterView.prototype.submit = function() {
		var user = new User();
		user.register(
			this.emailSurface.getValue(),
			this.usernameSurface.getValue(),
			this.passwordSurface.getValue(),
			function (user) {
				this._eventOutput.emit('registration-success');
			}.bind(this)
		)
	}

	module.exports = RegisterView;
});
