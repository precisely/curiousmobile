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

	EntryReadView.DEFAULT_OPTIONS = {
		entryHeight: 74,
	};

	function _addSurface() {
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(function(progress){
			return Transform.translate(0, 0, window.App.zIndex.readView);	
		});
		this.add(this.renderController);
		var repeatTypeAsClass = this.entry.repeatTypeAsClass();
		var entryTextColor = 'white';
		if (repeatTypeAsClass.length < 2) {
			entryTextColor = '#b0366b';	
		}
		this.entrySurface = new Surface({
			size: [undefined, this.options.entryHeight],
			content: this.getHelpText() + this.entry.toString(),
			classes: this.entry.repeatTypeAsClass(),
			properties: {
				padding: '15px',
				color: entryTextColor,
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
			this._eventOutput.emit('select-entry', this.entry);
		}.bind(this));

		this.deleteSurface = new Surface({
			size: [100, this.options.entryHeight],
			content: 'Delete',
			properties: {
				padding: '20px',
				backgroundColor: '#dc6059',
				fontSize: '18px',
				color: 'white',
				fontWeight: 'bold'
			}
		});

		this.deleteSurface.on('click', function(e) {
			console.log('EventHandler: this.deleteSurface event: click');
			if (e instanceof CustomEvent) {
				this.entry.delete(function(){
					this._eventOutput.emit('delete-entry',this.entry);
				}.bind(this));
			}
		}.bind(this));
		deleteModifier = new StateModifier({
			transform: Transform.translate(window.innerWidth, 0, 0)
		});
		this.add(deleteModifier).add(this.deleteSurface);
		this.add(this.entrySurface);

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
