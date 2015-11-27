define(function(require, exports, module) {
	'use strict';
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
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

		var options = {
			classes: ['pinned'],
			size: [true, true],
			content: this.getDisplayText(),
			properties: {
				color: '#5E5E5E',
				padding: '10px',
				borderRadius: '2px',
				lineHeight: '13px',
				fontSize: '13px',
				backgroundColor: '#e2e2e2',
				overflow: 'hidden',
				whiteSpace: 'nowrap',
				fontStyle: 'normal',
				textOverflow: 'ellipsis',
				maxWidth: '150px',
			}
		};

		this.entrySurface.setOptions(options);
		this.glowInit(options);
	};

	PinnedView.prototype.getSize = function () {
		// This is to get exact width and height after surface gets rendered
		return this.entrySurface._currentTarget ? 
				[this.entrySurface._currentTarget.offsetWidth, this.entrySurface._currentTarget.offsetHeight] : this.entrySurface.getSize();
	}

	PinnedView.prototype.getDisplayText = function() {
		var displayText = this.entry.removeSuffix();
		return displayText;
	}
	module.exports = PinnedView;
});
