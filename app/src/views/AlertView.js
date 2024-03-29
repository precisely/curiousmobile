define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var Engine = require('famous/core/Engine');
	var AlertTemplate = require('text!templates/alert.html');
	var AlertABTemplate = require('text!templates/alert-ab.html');
	var RenderController = require("famous/views/RenderController");
	var u = require('util/Utils');

	function AlertView() {
		View.apply(this, arguments);
		_createAlert.call(this);
		this.controller = new RenderController();
		window.mainContext.add(this.controller);
		this.controller.show(this, null, function() {
			if (this.options.onShow) {
				this.options.onShow();
			}
			Engine.on('click', closeAlert);
			if (this.options.type === 'default') {
				setTimeout(function() {
					closeAlert();
				}, this.options.delay);
			}
		}.bind(this));
	}

	AlertView.prototype = Object.create(View.prototype);
	AlertView.prototype.constructor = AlertView;

	AlertView.DEFAULT_OPTIONS = {
		type: 'default',
		message: 'Enter message',
		verify: false,
		a: 'OK',
		b: 'Cancel',
		onA: undefined,
		onB: undefined,
		tapOnBodyHandler: undefined,
		delay: 3000,
		onShow: undefined,
		onHide: undefined
	};

	function _createAlert() {
		var messageModifier = new Modifier({
			transform: Transform.translate(20, App.height / 2 - 100, 999),
			origin: [0, 0],
		});

		var template = AlertTemplate;
		if (this.options.onA && this.options.onB) {
			template = AlertABTemplate;
		}

		var messageSurface = new Surface({
			size: [App.width - 40, true],
			content: _.template(template, this.options, templateSettings),
			properties: {
				zIndex: 350
			}
		});

		messageSurface.on('click', function(e) {
			var u = require('util/Utils');
			var classList;
			if (e instanceof CustomEvent) {
				classList = e.srcElement.classList;
				if (_.contains(classList, 'a') && this.options.onA) {
					console.log('Event A');
					this.options.onA.call();
					u.closeAlerts();
				} else if (_.contains(classList, 'b') && this.options.onB) {
					console.log('Event B');
					this.options.onB.call();
					u.closeAlerts();
				} else if (_.contains(classList, 'close')) {
					u.closeAlerts();
				} else {
					if (this.options.tapOnBodyHandler) {
						this.options.tapOnBodyHandler();
					}
					u.closeAlerts();
				}
			}
		}.bind(this));

		this.add(messageModifier).add(messageSurface);
	}

	function closeAlert() {
		var u = require('util/Utils');
		u.closeAlerts();
	}

	AlertView.prototype.removeHandler = function() {
		Engine.removeListener('click', closeAlert);
	};

	module.exports = AlertView;
});
