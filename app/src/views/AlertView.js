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

	function AlertView() {
		View.apply(this, arguments);
		_createAlert.call(this);
	}

	AlertView.prototype = Object.create(View.prototype);
	AlertView.prototype.constructor = AlertView;

	AlertView.DEFAULT_OPTIONS = {
		type: 'info',
		message: 'Enter message',
		verify: false
	};

	function _createAlert() {
		var containerSurface = new ContainerSurface({
			size: [window.innerWidth, 40],
		});

		messageModifier = new Modifier({
			transform: Transform.translate(0, 88, 999),
			origin: [0.5, 0.5],
		});

		var messageSurface = new Surface({
			size: [300, 40],
			content: _.template(AlertTemplate, this.options, templateSettings)
		});


		messageSurface.on('click', function(e) {
			this._eventOutput.emit('alert-ok');
			if (_.contains(e.srcElement.parentElement.classList, 'close')) {
				this.controller.hide();
			}
		}.bind(this));
		if (this.verify) {}

		containerSurface.add(messageModifier).add(messageSurface);

		this.add(containerSurface);
	}
	module.exports = AlertView;
});
