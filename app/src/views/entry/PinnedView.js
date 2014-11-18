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
		this.entrySurface.setOptions({
			classes: ['pinned'],
			size: [true, true],
			content: this.getDisplayText(),
			properties: {
				border: '1px solid #868686',
				color: '#868686',
				padding: '5px',
				paddingLeft: '20px',
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

		var pinIcon = new Surface({
			size: [9, 14],
			content: '<i class="fa fa-thumb-tack"></i>',
			properties: {
				color: '#868686',
			}
		});

		var pinIconModifier = new Modifier({
			transform: Transform.translate(8, 5, 0)
		});

		this.add(pinIconModifier).add(pinIcon);

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
