define(function(require, exports, module) {
	'use strict';
    var View          = require('famous/core/View');
    var Surface       = require('famous/core/Surface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
	var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var User = require('models/User');
    var u = require('util/Utils');

    function LoginView() {
        View.apply(this, arguments);
		_createView.call(this);
    }

    LoginView.prototype = Object.create(View.prototype);
    LoginView.prototype.constructor = LoginView;

    LoginView.DEFAULT_OPTIONS = {};

	function _createView(argument) {
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

		var submitSurface = new Surface({
			size: [52, 25],
			content: '<input type="button" value="Login" />'
		});

		this.usernameSurface = usernameSurface;
		this.passwordSurface = passwordSurface;
		submitSurface.on('click', function(e) {
//			if (e instanceof CustomEvent) {
				this.submit();	
//			}
		}.bind(this));

		var formLayout = new SequentialLayout({
			direction: 1,
			itemSpacing: 7,
		});

		var otherLinksSurface = new Surface({
			size: [200,20],
			content: '<a href="#" class="create-account">Create an account</a> | ' +
				'<a href="#" class="forgot-password">Forgot Password?</a>',
			properties: {
				color: 'black',
				fontSize: '11px'
			}
				
		});

		otherLinksSurface.on('click', function(e) {
//			if (e instanceof CustomEvent) {
//	            u.showAlert('2nd ');
				if (_.contains(e.srcElement.classList, 'create-account')) {
//		            u.showAlert('3rd ');
					console.log("Show create-account form");
					this._eventOutput.emit('create-account');
				} else if (_.contains(e.srcElement.classList, 'forgot-password')) {
//                    u.showAlert('4th ');
					console.log("otherLinksSurface forgot password");
					this._eventOutput.emit('forgot-password');
				}
//			}
		}.bind(this));

		formLayout.sequenceFrom([usernameSurface, passwordSurface, submitSurface, otherLinksSurface]);
		formSurface.add(formLayout);

		this.add(formSurface);
	}

	LoginView.prototype.submit = function() {
		var currentUser = new User();
		currentUser.login(this.usernameSurface.getValue(), this.passwordSurface.getValue(), function(user) {
			window.App.currentUser = user;
			console.log('LoginView: login success');
			this._eventOutput.emit('login-success');
		}.bind(this));
	}

	LoginView.prototype.reset = function(){
		this.usernameSurface.setValue('');
		this.passwordSurface.setValue('');
	}

    module.exports = LoginView;
});
