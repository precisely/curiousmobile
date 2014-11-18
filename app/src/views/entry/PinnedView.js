define(function(require, exports, module) {
	'use strict';
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var EntryView = require('views/entry/EntryView');
	var Timer = require('famous/utilities/Timer');
	var FastClick = require('famous/inputs/FastClick');

	function PinnedView(entry) {
		EntryView.apply(this, arguments);
		this.menu = 'pinnedEntry';
		_createView.call(this);
	}

	PinnedView.prototype = Object.create(EntryView.prototype);
	PinnedView.prototype.constructor = PinnedView;

	PinnedView.DEFAULT_OPTIONS = {};

	function _createView() {
		this.entrySurface.setOptions({
			classes: ['pinned', this.entry.id],
			size: [true, true],
			content: this.getDisplayText(),
			properties: {
				border: '1px solid #868686',
				color: '#868686',
				padding: '5px',
				borderRadius: '2px',
				fontWeight: 'lighter',
				lineHeight: '13px',
				fontSize: '13px',
			}
		});
		this.entrySurface.on('deploy', function() {
			Timer.every(function() {
				var size = this.getSize();
				var width = (size[0] == true) ? this._currTarget.offsetWidth: size[0];
				var height = (size[1] == true) ? this._currTarget.offsetHeight : size[1];
				this.setSize([width, height]);
			}.bind(this), 2);
		});

	};

	PinnedView.prototype.getSize = function () {
		return this.entrySurface.getSize();
	}

	PinnedView.prototype.getDisplayText = function() {
		var displayText = this.entry.removeSuffix();
		return displayText;
	}
	module.exports = PinnedView;
});
