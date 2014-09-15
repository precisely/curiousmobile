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
	var RegisterTemplate = require('text!templates/registration.html');
	var u = require('util/Utils');

	function RegisterView() {
		View.apply(this, arguments);
		this.createView();
	}

	RegisterView.prototype = Object.create(View.prototype);
	RegisterView.prototype.constructor = RegisterView;

	RegisterView.DEFAULT_OPTIONS = {};

	RegisterView.prototype.createView = function() {
		var template = RegisterTemplate;
		var registerSurface = new Surface({
			content: _.template(template, this.options, templateSettings)
		});

		registerSurface.on('click', function(e) {
			var classList;
			if (e instanceof CustomEvent) {
				if (e.srcElement.localName == 'button') {
					classList = e.srcElement.classList;
				} else {
					classList = e.srcElement.parentElement.classList;
				}
				if (_.contains(classList, 'submit')) {
					console.log('RegisterView: submit form');
					this.submit();
				}
			}
		}.bind(this));
		this.add(registerSurface);
	};

	RegisterView.prototype.submit = function() {
		var user = new User();
		var emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
		var email = document.forms["registerForm"]["email"].value;
		var username = document.forms["registerForm"]["username"].value;
		var password = document.forms["registerForm"]["password"].value;
		var rePassword = document.forms["registerForm"]["re-password"].value;
		if (!email){
			u.showAlert("Email is a required field!");
		} else if (email.search(emailRegEx) == -1){
			u.showAlert("Please enter a valid email address!");
		} else if (!username){
			u.showAlert("Username is a required field!");
		} else if (!password){
			u.showAlert("Password is a required field!");
		} else if (password !== rePassword){
			u.showAlert("Passwords don't match!");
		} else {
			user.register(
					email,
					username,
					password,
					function (user) {
						this._eventOutput.emit('registration-success');
					}.bind(this)
			)
		}
	};

	module.exports = RegisterView;
});
