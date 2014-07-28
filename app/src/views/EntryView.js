define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Modifier = require('famous/core/Modifier');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Utils = require('Utils');
	var RenderController = require("famous/views/RenderController");
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
		_createBase.call(this);
		_createReadView.call(this);
	}

	EntryView.prototype = Object.create(View.prototype);
	EntryView.prototype.constructor = EntryView;

	EntryView.DEFAULT_OPTIONS = {};

	function _createBase(argument) {
		this.renderController = new RenderController();
		this.add(this.renderController);
		var selectionTransitionable = new TransitionableTransform();
		var selectionModifier = new Modifier({
			transform: selectionTransitionable,
		});
		this.selectionTransitionable = selectionTransitionable;
		this.entryBackground = new Surface({
			size: [undefined, 44],
			properties: {
				borderBottom: '2px solid #c0c0c0',
			}
		});
		this.add(selectionModifier).add(this.entryBackground);
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
			this.select();
		}.bind(this));
		this.renderController.show(this.readView);
	}

	EntryView.prototype.showFormView = function(argument) {
		//TODO
		this.entryBackground.setProperties({
			backgroundColor: '#c0c0c0'
		})
		this.selectionTransitionable.setScale([1, 1.60, 1], {});
		if (typeof this.formView == 'undefined') {
			_createFormView.call(this);
		}
		this.renderController.hide(this.readView);
		this.renderController.show(this.formView);
	}

	EntryView.prototype.hideFormView = function(argument) {
		if (typeof this.formView == 'undefined') {
			return;
		}
		this.entryBackground.setProperties({
			backgroundColor: 'white'
		});
		this.renderController.hide(this.formView);
		this.renderController.show(this.readView);
		this.selectionTransitionable.setScale([1, 1, 1]);
	}

	EntryView.prototype.select = function() {
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
	}

	/**
	 * Updateing read and form(if exists) views with the updated value
	 * @param entry
	 */
	function updateEntryViews(entry) {

	}

	EntryView.prototype.entryString = function() {

	}


	module.exports = EntryView;
});
