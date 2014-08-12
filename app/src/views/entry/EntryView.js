define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Utils = require('util/Utils');
	var RenderController = require("famous/views/RenderController");
	var EntryReadView = require('views/entry/EntryReadView');
	var EntryFormView = require('views/entry/EntryFormView');
	var Easing = require("famous/transitions/Easing");
	var TransitionableTransform = require("famous/transitions/TransitionableTransform");
	var TweenTransition = require('famous/transitions/TweenTransition');
	TweenTransition.registerCurve('inSine', Easing.inSine);

	var Entry = require('models/Entry');

	function EntryView(entry, formView) {
		View.apply(this, arguments);
		this.entry = entry;
		_createBase.call(this);
		if (formView) {
			console.log('Creating a form view for Entry: ' + entry.id);
			_createFormView.call(this);
		} else {
			_createReadView.call(this);
		}
	}

	EntryView.prototype = Object.create(View.prototype);
	EntryView.prototype.constructor = EntryView;

	EntryView.DEFAULT_OPTIONS = {};

	function _createBase(argument) {
		this.renderController = new RenderController();
		this.add(this.renderController);
	}

	/**
	 *	The default view based on the RepeatType for the entry in question.
	 *	Binding the backbone update event to the view
	 *
	 */
	function _createReadView(argument) {
		//TODO
		this.readView = new EntryReadView(this.entry);
		this.readViewModifier = new StateModifier({});
		this.readView.on('select-entry', function($event) {
			console.log("Click on EntryReadView");
			this._eventOutput.emit('select-entry', this.entry);
		}.bind(this));
		this.renderController.show(this.readView);
		this.readView.pipe(this._eventOutput);
	}

	function _createFormView(argument) {
		//TODO
		this.formView = new EntryFormView(this.entry);
		this.formView.pipe(this._eventOutput);
		this.renderController.show(this.formView, function (argument) {
			return Transform.translate(0, 0, window.App.zIndex.readView)
		}, function() {
			this.formView.focus();
		}.bind(this));
	}

	EntryView.prototype.glow = function() {
		this.readView.glow();
	}

	module.exports = EntryView;
});
