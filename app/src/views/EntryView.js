define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Utils = require('Utils');
	var EntryReadView = require('views/EntryReadView');
	var EntryFormView = require('views/EntryFormView');
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
		
		this.readView = new EntryReadView(this.entry);
		this.readViewModifier = new StateModifier({
		});
		this.add(this.readViewModifier).add(this.readView);
		this.readView.on('click', function($event){
			console.log("Click on EntryReadView");
			this.showFormView();		
		}.bind(this));
	}

	function showFormView(argument) {
		//TODO
		if (typeof this.createForm != 'undefined') {
			_createFormView.call(this);
		}	
	}
	/**
	 *	Form view for a given entry
	 *
	 */
	function _createFormView(argument) {
		this.formView = new EntryFormView(this.entry);
		this.formModifier = new StateModifier();
		this.add(formModifier).add(formView);
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

