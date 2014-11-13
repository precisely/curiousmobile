define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var ContextMenuTemplate = require('text!templates/context-menu.html');

	function EntryView(entry) {
		View.apply(this, arguments);
		this.entry = entry;
		this.createView();
	}

	EntryView.prototype = Object.create(View.prototype);
	EntryView.prototype.constructor = EntryView;

	EntryView.DEFAULT_OPTIONS = {};

	EntryView.prototype.createView = function() {
		this.contextController = new RenderController();	
		this.add(this.contextController);
		var template = ContextMenuTemplate;
		this.contextMenu = new Surface({
			content: _.template(template, {}, templateSettings)
		});
		this._eventInput.on('show-context-menu', function (e) {
			
		});
	};

	module.exports = EntryView;
});
