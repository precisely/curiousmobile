define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var	Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Utils = require('Utils');
	var EntryReadView = require('views/EntryReadView');
	var EntryFormView = require('views/EntryFormView');
	var Easing = require("famous/transitions/Easing");
	var TransitionableTransform = require("famous/transitions/TransitionableTransform");
	var TweenTransition = require('famous/transitions/TweenTransition');
	TweenTransition.registerCurve('inSine', Easing.inSine);

	var Entry = require('models/Entry');

	function EntryView(entry) {
		View.apply(this, arguments);
		this.entry = entry;
		_createReadView.call(this);
	}

	EntryView.prototype = Object.create(View.prototype);
	EntryView.prototype.constructor = EntryView;

	EntryView.DEFAULT_OPTIONS = {};

	/**
	 *	The default view based on the RepeatType for the entry in question.
	 *	Binding the backbone update event to the view
	 *
	 */
	function _createReadView(argument) {
		//TODO

		var selectionTransitionable = new TransitionableTransform();
		var selectionModifier = new Modifier({
			transform: selectionTransitionable,
		});
		this.selectionTransitionable = selectionTransitionable;
		this.entryBackground = new Surface({
			size: [undefined, 44],
			properties: {
				borderBottom: '2px solid #dde2e9',
			}
		});
		this.add(selectionModifier).add(this.entryBackground);
		this.readView = new EntryReadView(this.entry);
		this.readViewModifier = new StateModifier({});
		this.add(this.readView.renderController);
		this.readView.on('select-entry', function($event) {
			console.log("Click on EntryReadView");
			this.select();
		}.bind(this));
	}

	EntryView.prototype.showFormView = function(argument) {
		//TODO
		this.selectionTransitionable.setScale([1, 1.60, 1], {
			duration: 1000,
			curve: Easing.inOutQuad
		});
		if (typeof this.createForm == 'undefined') {
			_createFormView.call(this);
		}
	}

	EntryView.prototype.select = function() {
		this.readView.renderController.hide();
		this.entryBackground.setProperties({
			backgroundColor: '#dde2e9'
		});
		this._eventOutput.emit('select-entry', this.entry);
		this.showFormView();
	}

	/**
	 *	Form view for a given entry
	 *
	 */
	function _createFormView(argument) {
		console.log("EntryView : creating entry form view");
		this.formView = new EntryFormView(this.entry);
		this.add(this.formView.renderController);
	}

	/**
	 * Updateing read and form(if exists) views with the updated value
	 * @param entry
	 */
	function updateEntryViews(entry) {

	}

	function toggleFormView(argument) {

	}


	module.exports = EntryView;
});
