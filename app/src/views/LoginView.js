define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require("famous/core/Modifier");
	var ImageSurface = require("famous/surfaces/ImageSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var ImageSurface = require("famous/surfaces/ImageSurface");
	var SubmitInputSurface = require("famous/surfaces/SubmitInputSurface");
	var User = require('models/User');


	function LoginView() {
		View.apply(this, arguments);
		_createForm.call(this);
	}

	LoginView.prototype = Object.create(View.prototype);
	LoginView.prototype.constructor = LoginView;

	LoginView.DEFAULT_OPTIONS = {};

	function _createForm() {

		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'white'
			}
		});
		var logoSurface = new ImageSurface({
			size: [205, 230],
			content: 'content/images/logo.gif'
		});

		var logoModifier = new Modifier({
			transform: Transform.translate(window.innerWidth * 0.20, window.innerHeight * 0.02, 1)
		});


		var formSurface = new FormContainerSurface({
			size: [200, 200],
		});

		this.formModifier = new Modifier({
			transform: Transform.translate(window.innerWidth * 0.20, window.innerHeight * 0.50, 1)
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

		var submitSurface = new InputSurface({
			value: 'Login',
			type: 'button',
			size: [80, 20],
			properties: {
				padding: '10px'
			}
		});

		this.usernameSurface = usernameSurface;
		this.passwordSurface = passwordSurface;
		submitSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				User.login(this.usernameSurface.getValue(), this.passwordSurface.getValue(), function(data) {
					console.log('login attempted');
				});
			}
		}.bind(this));

		var formLayout = new SequentialLayout({
			direction: 1,
			itemSpacing: 7,
		});

		formLayout.sequenceFrom([usernameSurface, passwordSurface, submitSurface]);
		formSurface.add(formLayout);

		this.add(backgroundSurface);
		this.add(logoModifier).add(logoSurface);
		this.add(this.formModifier).add(formSurface);
	}

	module.exports = LoginView;
});
