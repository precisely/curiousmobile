define(function(require, exports, module) {
	'use strict';
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var EntryView = require('views/entry/EntryView');
	var Timer = require('famous/utilities/Timer');

	function PinnedView(entry) {
		EntryView.apply(this, arguments);
		this.entry = entry;
		this.createView();
	}

	PinnedView.prototype = Object.create(EntryView.prototype);
	PinnedView.prototype.constructor = PinnedView;

	PinnedView.DEFAULT_OPTIONS = {};

	PinnedView.prototype.createView = function() {
		this.entrySurface = new Surface({
			classes: ['pinned'],
			size: [true, true],
			content: '<i class="fa fa-thumb-tack"></i> &nbsp;' + this.entry.toString(),
			properties: {
				backgroundColor: '#ebebeb',
				border: '1px solid #868686',
				color: '#868686',
				minHeight: '34px',
				padding: '11px',
				borderRadius: '3px'
			}
		});
		this.entrySurface.on('deploy', function() {
			Timer.every(function() {
				var size = this.getSize();
				var width = (size[0] == true) ? this._currTarget.offsetWidth : size[0];
				var height = (size[1] == true) ? this._currTarget.offsetHeight : size[1];
				this.setSize([width, height]);
			}.bind(this), 2);
		});
		this.add(this.entrySurface);
	};

	PinnedView.prototype.getSize = function () {
		return this.entrySurface.getSize();
	}

	module.exports = PinnedView;
});
