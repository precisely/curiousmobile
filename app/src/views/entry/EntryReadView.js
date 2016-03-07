define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var TrueSurface = require('surfaces/TrueSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
	var EventHandler = require('famous/core/EventHandler');
	var EntryView = require('views/entry/EntryView');
	var u = require('util/Utils');
	var Entry = require('models/Entry');

	function EntryReadView(options) {
		EntryView.apply(this, arguments);
		this.menu = 'entry';
		_addSurface.call(this);
	}

	EntryReadView.prototype = Object.create(EntryView.prototype);
	EntryReadView.prototype.constructor = EntryReadView;

	EntryReadView.DEFAULT_OPTIONS = {
		entryHeight: 55,
		lineHeight: 16,
	};

	function _addSurface() {
		this.deleteSurface = new Surface({
			size: [100, this.options.entryHeight],
			content: 'Delete',
			properties: {
				padding: '5px 0px',
				backgroundColor: '#dc6059',
				fontSize: '16px',
				lineHeight: '45px',
				color: 'white',
				textAlign: 'center'
			}
		});
		this.deleteSurface.on('click', this.delete.bind(this));
	}

	module.exports = EntryReadView;
});
