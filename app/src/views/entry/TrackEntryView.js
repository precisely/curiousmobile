define(function(require, exports, module) {
	'use strict';

	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
	var EventHandler = require('famous/core/EventHandler');
	var EntryReadView = require('views/entry/EntryReadView');
	var Entry = require('models/Entry');
	var DraggableNode = require('views/entry/DraggableNode');

	function TrackEntryView(options) {
		EntryReadView.apply(this, arguments);
		this.menu = 'entry';
		this.addEntrySurface();
	}

	TrackEntryView.prototype = Object.create(EntryReadView.prototype);
	TrackEntryView.prototype.constructor = TrackEntryView;

	TrackEntryView.DEFAULT_OPTIONS = {
		entryHeight: 55,
		lineHeight: 16,
		readSurfaceOptions : {
			size: [window.innerWidth, 55],
			properties: {
				fontSize: 16 + 'px',
				padding: '15px 45px 15px 15px',
				fontWeight: 'lighter',
				lineHeight: 16 + 'px',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap',
				overflow: 'hidden',
				zIndex: 10
			}
		}
	};

	TrackEntryView.prototype.addEntrySurface = function() {
		var readSurfaceOptions = this.options.readSurfaceOptions;
		this.size = readSurfaceOptions.size = [window.innerWidth, this.options.entryHeight];

		readSurfaceOptions.content = this.getDisplayText();
		readSurfaceOptions.classes = this.entry.repeatTypeAsClass();

		readSurfaceOptions.attributes = {
			id: 'entry-' + this.entry.get('id')
		};

		this.entrySurface.setOptions(readSurfaceOptions);
		this.glowInit(readSurfaceOptions);

		this.entrySurface.pipe(this._eventOutput);

		var showMoreSurfaceContent = 'content/images/show-more-' +
				(this.entry.isRemind() ? 'remind' : this.entry.isRepeat() ? 'repeat' : 'default') + '.png';
		this.showMoreSurface = new ImageSurface({
			content: showMoreSurfaceContent,
			size: [24, 24],
			properties: {
				zIndex: 10
			},
			classes: ['show-more-surface' + (this.entry.isGhost() ? '-ghost' : '')]
		});
		var showMoreModifier = new StateModifier({
			transform: Transform.translate(window.innerWidth - 40, 15, window.App.zIndex.readView + 6)
		});
		this.showMoreSurface.pipe(this._eventOutput);
		this.showMoreSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.select();
			}
		}.bind(this));

		var deleteModifier = new StateModifier({
			transform: Transform.translate(window.innerWidth - 100, 0, window.App.zIndex.readView + 2)
		});
		this.add(deleteModifier).add(this.deleteSurface);

		var entryModifier = new Modifier({
			transform: Transform.translate(0, 0, window.App.zIndex.readView + 500)
		});

		var entryDraggableNode = new DraggableNode({
			draggableSurface: this.entrySurface,
			deleteSurface: this.deleteSurface,
			height: this.options.entryHeight
		});

		this.add(entryModifier).add(entryDraggableNode);

		if (!this.options.doNotAddMoreSurface) {
			this.add(showMoreModifier).add(entryDraggableNode.draggable).add(this.showMoreSurface);
		}

		this.showMoreSurface.pipe(entryDraggableNode.draggable);
	};

	TrackEntryView.prototype.getSize = function () {
		return this.size;
	};

	module.exports = TrackEntryView;
});
