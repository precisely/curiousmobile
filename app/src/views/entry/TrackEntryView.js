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
	var EntryReadView = require('views/entry/EntryReadView');
	var u = require('util/Utils');
	var Entry = require('models/Entry');

	function TrackEntryView(options) {
		EntryReadView.apply(this, arguments);
		this.menu = 'entry';
		_addSurface.call(this);
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

	function _addSurface() {
		var repeatTypeAsClass = this.entry.repeatTypeAsClass();
		var entryTextColor = '#b0366b';
		if (_.contains(repeatTypeAsClass, 'ghost')) {
			entryTextColor = 'white';
		}

		var readSurfaceOptions = this.options.readSurfaceOptions;
		readSurfaceOptions.size = [window.innerWidth, this.options.entryHeight];
		readSurfaceOptions.content = this.getDisplayText();
		readSurfaceOptions.classes = this.entry.repeatTypeAsClass();
		if (this.entry.isContinuous()) {
			readSurfaceOptions.properties.margin = '5px';
			size[0] = size[0] - 10;
			size[1] = size[1] - 10;
		}

		this.entrySurface.setOptions(readSurfaceOptions);
		this.glowInit(readSurfaceOptions);

		this.entrySurface.pipe(this._eventOutput);
		this.showMoreSurface = new ImageSurface({
			content: 'content/images/show-more-' + (this.entry.isRemind() ? 'remind' : this.entry.isRepeat() ? 'repeat' : 'default') + '.png',
			size: [24, 24],
			properties: {
				zIndex: 10
			}
		});
		var showMoreModifier = new StateModifier({
			transform: Transform.translate(window.innerWidth - 40, 15, window.App.zIndex.readView + 6)
		});
		this.showMoreSurface.pipe(this._eventOutput);
		this.showMoreSurface.on('click', function(e) {
			console.log("showMoreSurface event");
			if (e instanceof CustomEvent) {
				this.select();
			}
		}.bind(this));
		this.add(showMoreModifier).add(this.showMoreSurface);

		deleteModifier = new StateModifier({
			transform: Transform.translate(window.innerWidth, 0, window.App.zIndex.readView + 2)
		});
		this.add(deleteModifier).add(this.deleteSurface);

		var entryModifier = new Modifier({
			transform: Transform.translate(0, 0, window.App.zIndex.readView + 5)
		});
		this.add(entryModifier).add(this.entrySurface);
	}

	TrackEntryView.prototype.setEntry = function(entry) {
		this.entry = entry;
		this.entrySurface.setContent(this.entry.toString());
	}

	EntryReadView.prototype.getDisplayText = function() {
		var date = new Date(this.entry.date);
		var time = u.formatAMPM(date);
		var displayText = this.entry.removeSuffix();
		if (this.entry.isRemind() && this.entry.isRepeat()) {
			if (this.entry.isDaily()) {
				return '<div class="help"><i class="fa fa-repeat"></i> Alert + Repeat every day </div>' + displayText;
			} else if (this.entry.isWeekly()) {
				return '<div class="help"><i class="fa fa-repeat"></i> Alert + Repeat every week</div>' + displayText;
			} else if (this.entry.isMonthly()) {
				return '<div class="help"><i class="fa fa-repeat"></i> Alert + Repeat every month</div>' + displayText;
			}
		} else if (this.entry.isRemind()) {
			return '<div class="help"><i class="fa fa-bell"></i> Alert set </div>' + displayText;
		} else if (this.entry.isDaily()) {
			return '<div class="help"><i class="fa fa-repeat"></i> Repeat every day</div>' + displayText;
		} else if (this.entry.isWeekly()) {
			return '<div class="help"><i class="fa fa-repeat"></i> Repeat every week</div>' + displayText;
		} else if (this.entry.isMonthly()) {
			return '<div class="help"><i class="fa fa-repeat"></i> Repeat every month</div>' + displayText;
		} else if (this.entry.isRepeat()) {
			return '<div class="help"><i class="fa fa-repeat"></i> Repeat</div>' + displayText;
		}
		return displayText;
	}

	module.exports = TrackEntryView;
});
