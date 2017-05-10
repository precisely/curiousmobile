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
	var EntryView = require('views/entry/EntryView');
	var Entry = require('models/Entry');
	var u = require('util/Utils');

	function EntryReadView(options) {
		EntryView.apply(this, arguments);
		this.menu = 'entry';
		this.addDeleteSurface();
	}

	EntryReadView.prototype = Object.create(EntryView.prototype);
	EntryReadView.prototype.constructor = EntryReadView;

	EntryReadView.DEFAULT_OPTIONS = {
		entryHeight: 55,
		lineHeight: 16,
	};

	EntryReadView.prototype.addDeleteSurface = function() {
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
	};

	EntryReadView.prototype.getDisplayText = function() {
		var displayText = u.escapeHTML(this.entry.removeSuffix());

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
	};

	module.exports = EntryReadView;
});
