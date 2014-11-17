define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var TouchSync = require("famous/inputs/TouchSync");

	var entrySurface = null;
	var self = null;
	function EntryView(entry) {
		View.apply(this, arguments);
		self = this;
		self.entry = entry;
		_createView.call(self);
	}

	EntryView.prototype = Object.create(View.prototype);
	EntryView.prototype.constructor = EntryView;

	EntryView.DEFAULT_OPTIONS = {};

	function _createView() {
		self.start = 0;
		self.update = 0;
		self.end = 0;
		self.delta = [0,0];
		self.position = [0, 0];
		self.touchSync = new TouchSync(function() {
			return position;
		});

		self.touchSync.on('start', function() {
			self.start = Date.now();	
		});

		self.touchSync.on('end', function() {
			self.end = Date.now();	
			var timeDelta = self.end - self.start;
			console.log('Sart: ' + self.start + ' End: ' + self.end);
			console.log('touch-end for entry id: ' + self.entry.id);
			console.log('timeDelta: ' + timeDelta);
			if (timeDelta > 1200) {
				console.log('EntryView: Firing show-context-menu event');
				App.pageView._eventOutput.emit('show-context-menu', { menu: 'entry', target: self, eventArg: self.entry});	
			}
		});

		self.entrySurface = new Surface();

		self.entrySurface.on('click', function(e) {
			console.log("entrySurface event");
			if (e instanceof CustomEvent) {
				self._eventOutput.emit('select-entry', self.entry);
			}
		});

		self.entrySurface.pipe(self.touchSync);

		self.add(self.entrySurface);
	};

	module.exports = EntryView;
});
