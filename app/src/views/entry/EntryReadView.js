define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require("famous/views/RenderController");
	var u = require('util/Utils');

	function EntryReadView(entry) {
		View.apply(this, arguments);
		this.entry = entry;
		_addSurface.call(this);
	}

	EntryReadView.prototype = Object.create(View.prototype);
	EntryReadView.prototype.constructor = EntryReadView;

	EntryReadView.DEFAULT_OPTIONS = {};

	function _addSurface() {
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(function(progress){
			return Transform.translate(0, 0, window.App.zIndex.readView);	
		});
		this.add(this.renderController);
		this.entrySurface = new Surface({
			size: [undefined, 74],
			content: this.getHelpText() + this.entry.toString(),
			classes: this.entry.repeatTypeAsClass(),
			properties: {
				padding: '15px',
			}
		});
		this.entrySurface.pipe(this._eventOutput);
		this.glowSurface = new Surface({
			size: [undefined, 44],
			content: this.entry.toString(),
			classes: this.entry.repeatTypeAsClass(),
			properties: {
				padding: '12px',
				color: '#ffffff',
				backgroundColor: '#c0c0c0'
			}
		});
		this.entrySurface.on('click', function(e) {
			console.log("entrySurface event");
			if (e instanceof CustomEvent) {
				this._eventOutput.emit('select-entry', this.entry);
			}
		}.bind(this));
		this.renderController.show(this.entrySurface, {
			duration: 0
		});

	}

	EntryReadView.prototype.setEntry = function(entry) {
		this.entry = entry;
		this.entrySurface.setContent(this.entry.toString());
	}

	EntryReadView.prototype.glow = function() {
		//var rc = this.renderController;
		//rc.show(this.glowSurface, {
			//duration: 1000
		//});
		//rc.hide();
		//rc.show(this.entrySurface);
	}

	EntryReadView.prototype.getHelpText = function() {
		var date = new Date(this.entry.date);
		var time = u.formatAMPM(date);
		if (this.entry.isContinuous()) {
			return '<div class="help"><i class="fa fa-star"></i> Favorite</div>';	
		} else if (this.entry.isRemind()) {
			return '<div class="help"><i class="fa fa-repeat"></i> Repeat every other day</div>';	
		} else if (this.entry.isRepeat() && this.entry.isGhost()) {
			return '<div class="help"><i class="fa fa-bell"></i> Reminder set (' + u.mmddyy(date) + ' ' + 
				+ time + ')</div>';	
		}
		return '<div style="height: 9px"></div>';
	}

	module.exports = EntryReadView;
});
