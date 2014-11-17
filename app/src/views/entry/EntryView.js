define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var TouchSync = require("famous/inputs/TouchSync");
	var Entry = require('models/Entry');

	var entrySurface = null;
	var self = null;
	function EntryView(entry) {
		View.apply(this, arguments);
		self = this;
		self.entry = entry;
		_createView.call(this);
	}

	EntryView.prototype = Object.create(View.prototype);
	EntryView.prototype.constructor = EntryView;

	EntryView.DEFAULT_OPTIONS = {};

	function _createView() {
		this.start = 0;
		this.update = 0;
		this.end = 0;
		this.delta = [0,0];
		this.position = [0, 0];
		this.touchSync = new TouchSync(function() {
			return position;
		});

		this.touchSync.on('start', function() {
			this.start = Date.now();	
		}.bind(this));

		this.touchSync.on('end', function() {
			this.end = Date.now();	
			var timeDelta = this.end - this.start;
			console.log('Sart: ' + this.start + ' End: ' + this.end);
			console.log('touch-end for entry id: ' + this.entry.id);
			console.log('timeDelta: ' + timeDelta);
			if (timeDelta > 1200) {
				console.log('EntryView: Firing show-context-menu event');
				App.pageView._eventOutput.emit('show-context-menu', { menu: this.menu, target: this, eventArg: this.entry});	
			}
		}.bind(this));

		this.entrySurface = new Surface();

		this.entrySurface.on('click', function(e) {
			console.log("entrySurface event");
			if (e instanceof CustomEvent) {
				this._eventOutput.emit('select-entry', this.entry);
			}
		}.bind(this));

		this.entrySurface.pipe(this.touchSync);
		this.on('trigger-delete-entry', this.delete.bind(this));
		this.add(this.entrySurface);
	};

	EntryView.prototype.delete = function (e) {
		console.log('EntryView: Deleting entry - ' + this.entry.id);
		if (e instanceof CustomEvent || e instanceof Entry) {
			this.entry.delete(function(data){
				if (data && data.fail) {
					this._eventOutput.emit('delete-entry',data);
					return;	
				}
				this._eventOutput.emit('delete-entry',this.entry);
			}.bind(this));
		}
	}


	module.exports = EntryView;
});
