define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var TouchSync = require("famous/inputs/TouchSync");
	var FastClick = require('famous/inputs/FastClick');
	var Entry = require('models/Entry');
	var u = require('util/Utils');

	var entrySurface = null;
	function EntryView(entry) {
		View.apply(this, arguments);
		this.entry = entry;
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

		this.touchSync.on('start', function(data) {
			this.start = Date.now();
			// Show context menu after the timeout regardless of tap end
			this.touchTimeout = setTimeout(function(){
				App.pageView._eventOutput.emit('show-context-menu', { menu: this.menu, target: this, eventArg: this.entry});
			}.bind(this),500)
		}.bind(this));

		this.touchSync.on('update', function(data) {
			var movementX = Math.abs(data.position[0]);
			var movementY = Math.abs(data.position[1]);
			console.log('movementx: ', movementX, ' movementy: ', movementY);
			// Don't show context menu if there is intent to move something
			if (movementX > 8 || movementY > 8) {
				clearTimeout(this.touchTimeout);
			}
		}.bind(this));

		this.touchSync.on('end', function(data) {
			this.end = Date.now();	
			var movementX = Math.abs(data.position[0]);
			var movementY = Math.abs(data.position[1]);
			var timeDelta = this.end - this.start;
			// If the intent is to just select don't show context menu
			if (timeDelta < 500 && movementX < 8 && movementY < 8) {
				clearTimeout(this.touchTimeout);
				this._eventOutput.emit('select-entry', this.entry);
			}
		}.bind(this));

		this.entrySurface = new Surface();

		this.entrySurface.pipe(this.touchSync);
		this.on('trigger-delete-entry', this.delete.bind(this));
		this.add(this.entrySurface);
	};

	EntryView.prototype.delete = function (e) {
		console.log('EntryView: Deleting entry - ' + this.entry.id);
		if ((u.isAndroid() || (e instanceof CustomEvent)) || e instanceof Entry) {
			this.entry.delete(function(data){
				this._eventOutput.emit('delete-entry',data);
			}.bind(this));
		}
	}


	module.exports = EntryView;
});
