define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var InputSurface = require("famous/surfaces/InputSurface");
	var AlertTemplate = require('text!templates/alert.html');
	var AlertABTemplate = require('text!templates/alert-ab.html');
	var RenderController = require("famous/views/RenderController");

	function AlertView() {
		View.apply(this, arguments);
		_createAlert.call(this);
		this.controller = new RenderController();
		window.mainContext.add(this.controller);
		this.controller.show(this);
	}

	AlertView.prototype = Object.create(View.prototype);
	AlertView.prototype.constructor = AlertView;

	AlertView.DEFAULT_OPTIONS = {
		type: 'info',
		message: 'Enter message',
		verify: false,
		a: 'OK',
		b: 'Cancel',
		onA: undefined,
		onB: undefined,
	};

	function _createAlert() {
		var containerSurface = new ContainerSurface({
			size: [window.innerWidth, 40],
		});

		messageModifier = new Modifier({
			transform: Transform.translate(0, 88, 999),
			origin: [0.5, 0.5],
		});

		var template = AlertTemplate;
		if (this.options.onA && this.options.onB) {
			template = AlertABTemplate;
		}

		var messageSurface = new Surface({
			size: [300, 40],
			content: _.template(template, this.options, templateSettings)
		});


		messageSurface.on('click', function(e) {
			var classList;
			if (e instanceof CustomEvent) {
				if (e.srcElement.localName == 'button') {
					classList = e.srcElement.classList;
				} else {
					classList = e.srcElement.parentElement.classList;
				}
				if (_.contains(classList, 'close')) {
					this.controller.hide();
				} else if (_.contains(classList, 'a') && this.options.onA) {
					console.log('Event A');
					this.options.onA.call();
				} else if (_.contains(classList, 'b') && this.options.onB) {
					console.log('Event B');
					this.options.onB.call();
				}
			}
		}.bind(this));

		containerSurface.add(messageModifier).add(messageSurface);

		this.add(containerSurface);
	}
	module.exports = AlertView;
});
