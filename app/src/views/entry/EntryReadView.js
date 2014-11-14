define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var TrueSurface = require('surfaces/TrueSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
	var FastClick = require('famous/inputs/FastClick');
	var EventHandler = require('famous/core/EventHandler');
	var EntryView = require('views/entry/EntryView');
	var u = require('util/Utils');
	var Entry = require('models/Entry');

	function EntryReadView(entry) {
		EntryView.apply(this, arguments);
		_addSurface.call(this);
	}

	EntryReadView.prototype = Object.create(EntryView.prototype);
	EntryReadView.prototype.constructor = EntryReadView;

	EntryReadView.DEFAULT_OPTIONS = {
		entryHeight: 55,
		lineHeight: 16,
	};

	function _addSurface() {
			var repeatTypeAsClass = this.entry.repeatTypeAsClass();
			var entryTextColor = '#b0366b';
			if (_.contains(repeatTypeAsClass, 'ghost')) {
				entryTextColor = 'white';	
			}

			var properties = {
				padding: '15px',
				fontSize: this.options.lineHeight + 'px',
				fontWeight: 'lighter',
				lineHeight: this.options.lineHeight + 'px',
				textOverflow: 'ellipsis'
			};

			var size = [window.innerWidth, this.options.entryHeight];
			if (this.entry.isContinuous()) {
				properties.margin = '5px'	
				size[0] = size[0] - 10;
				size[1] = size[1] - 10;
			}
			this.entrySurface = new Surface({
				size: size,
				content: this.getDisplayText(),
				classes: this.entry.repeatTypeAsClass(),
				properties: properties
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

			var showMoreColor = 'white';
			if (_.contains(repeatTypeAsClass, 'continuous')) {
				showMoreColor = '#ec2d35';	
			}
			this.showMoreSurface = new Surface({
				content: '<i class="fa fa-chevron-circle-down"></i>',
				size: [24, 24],
				properties: {
					color: showMoreColor,
					fontSize: '26px'
				}
			});
			var showMoreModifier = new StateModifier({
				transform: Transform.translate(window.innerWidth - 40, 10, window.App.zIndex.readView + 1)
			});
			this.showMoreSurface.pipe(this._eventOutput);
			this.showMoreSurface.on('click', function(e) {
				console.log("showMoreSurface event");
				if (e instanceof CustomEvent) {
					this._eventOutput.emit('select-entry', this.entry);
				} 
			}.bind(this));
			this.add(showMoreModifier).add(this.showMoreSurface);

			this.deleteSurface = new Surface({
				size: [100, this.options.entryHeight],
				content: 'Delete',
				properties: {
					padding: '8px 26px',
					backgroundColor: '#dc6059',
					fontSize: '16px',
					lineHeight: '45px',
					color: 'white',
				}
			});

			this.deleteSurface.on('click', function(e) {
				console.log('EventHandler: this.deleteSurface event: click');
				if (e instanceof CustomEvent) {
					this.delete();
				}
			}.bind(this));
			deleteModifier = new StateModifier({
				transform: Transform.translate(window.innerWidth, 0, window.App.zIndex.readView + 2)
			});
			this.add(deleteModifier).add(this.deleteSurface);
			var entryModifier = new Modifier({
				transform: Transform.translate(0, 0, window.App.zIndex.readView)
			});
			this.add(entryModifier).add(this.entrySurface);
	}

	EntryReadView.prototype.delete = function () {
		this.entry.delete(function(data){
			if (data && data.fail) {
				this._eventOutput.emit('delete-entry',data);
				return;	
			}
			this._eventOutput.emit('delete-entry',this.entry);
		}.bind(this));
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

	EntryReadView.prototype.getDisplayText = function() {
		var date = new Date(this.entry.date);
		var time = u.formatAMPM(date);
		var displayText = this.entry.removeSuffix();
		if (this.entry.isRemind()) {
			return '<div class="help"><i class="fa fa-bell"></i> Reminder set </div>' + displayText;	
		} else if (this.entry.isRepeat()) {
			return '<div class="help"><i class="fa fa-repeat"></i> Repeat every day</div>' + displayText;	
		}
		return  displayText;
	}

	module.exports = EntryReadView;
});
