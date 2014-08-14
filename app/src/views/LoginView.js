define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require("famous/core/Modifier");
	var ImageSurface = require("famous/surfaces/ImageSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var ImageSurface = require("famous/surfaces/ImageSurface");
	var SubmitInputSurface = require("famous/surfaces/SubmitInputSurface");
	var User = require('models/User');
	var u = require('util/Utils');


	function LoginView() {
		View.apply(this, arguments);
		_createView.call(this);
	}

	LoginView.prototype = Object.create(View.prototype);
	LoginView.prototype.constructor = LoginView;

	LoginView.DEFAULT_OPTIONS = {};

	function _createView() {
		var containerSurface = new ContainerSurface({
			size: [window.innerWidth, window.innerHeight],
			properties: {
				backgroundColor: 'white'
			}
		});
		this.add(containerSurface);

		var logoSurface = new ImageSurface({
			size: [205, 230],
			content: 'content/images/logo.gif'
		});

		var logoModifier = new Modifier({
			origin: [0.5, 0.1],
		});

		var formModifier = new Modifier({
			origin: [0.5, 0.8],
		});
		var formSurface = new FormContainerSurface({
			size: [200, 200],
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

		passwordSurface.on('keydown', function (e) {
			//on enter
			if (e.keyCode == 13) {
				this.submit();
			}
		}.bind(this));

		var submitSurface = new InputSurface({
			value: 'Login',
			type: 'button',
			classes: ['btn'],
			size: [80, 40],
		});

		this.usernameSurface = usernameSurface;
		this.passwordSurface = passwordSurface;
		submitSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.submit();	
			}
		}.bind(this));

		var formLayout = new SequentialLayout({
			direction: 1,
			itemSpacing: 7,
		});

		formLayout.sequenceFrom([usernameSurface, passwordSurface, submitSurface]);
		formSurface.add(formLayout);

		this.add(formModifier).add(formSurface);
		this.add(logoModifier).add(logoSurface);
	}

	LoginView.prototype.submit = function(arguments) {
		var currentUser = new User();
		currentUser.login(this.usernameSurface.getValue(), this.passwordSurface.getValue(), function(user) {
			window.App.currentUser = user;
			this._eventOutput.emit('login-success');
		}.bind(this));
	}

	module.exports = LoginView;
});
