define(function(require, exports, module) {
	'use strict';
	var SizeAwareView = require('famous/views/SizeAwareView');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Timer = require('famous/utilities/Timer');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var TouchSync = require("famous/inputs/TouchSync");
	var Entry = require('models/Entry');
	var TrackView = require('views/TrackView');
	var u = require('util/Utils');

	var entrySurface = null;

	function EntryView(options) {
		SizeAwareView.apply(this, arguments);
		this.entry = options.entry;
		_createView.call(this);
	}

	EntryView.prototype = Object.create(SizeAwareView.prototype);
	EntryView.prototype.constructor = EntryView;

	EntryView.DEFAULT_OPTIONS = {};

	function _createView() {
		this.start = 0;
		this.update = 0;
		this.end = 0;
		this.delta = [0, 0];
		this.position = [0, 0];
		this.entrySurface = new Surface();
		this.entrySurface.on('click', function(argument) {
			console.log('Entry was clicked');
		});
		this.on('trigger-delete-entry', this.delete.bind(this));
		if (!this.options.doNotAddEntrySurface) {
			this.add(this.entrySurface);
		}
		this.touchSync = new TouchSync(function() {
			return position;
		});

		this.entrySurface.pipe(this.touchSync);
		this.touchSync.on('start', function(data) {
			console.log('Entry touched: ' + this.entry.id);
			this.start = Date.now();
			// Show context menu after the timeout regardless of tap end
			this.touchTimeout = setTimeout(function() {

			}.bind(this), 500)
		}.bind(this));

		this.touchSync.on('update', function(data) {
			var movementX = Math.abs(data.position[0]);
			var movementY = Math.abs(data.position[1]);
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
			if (movementX < 8 && movementY < 8) {
				if (timeDelta < 500) {
					clearTimeout(this.touchTimeout);
					this.select();
					return;
				}
				if (timeDelta > 600) {
					App.pageView._eventOutput.emit('show-context-menu', {
						menu: this.menu,
						target: this,
						eventArg: {entry: this.entry}
					});
				}
			}

		}.bind(this));

		//Glow surface
		this.glowSurface = new Surface();
		this.glowController = new RenderController();
		this.glowControllerModifier = new StateModifier({transform: Transform.translate(0, 0, 555)});
		this.add(this.glowControllerModifier).add(this.glowController);
	};

	EntryView.prototype.glow = function() {
		this.glowController.show(this.glowSurface, null
			, function() {
				setTimeout(function () {
					//Calling just hide() was not allowing the glow surface to persist so modifying the z-Index first and then hiding the glow surface.
					//Also since glow surface was displayed on the top of entry surface zIndex had to be given so added a state modifier.
					this.glowControllerModifier.setTransform(Transform.translate(0, 0, 0), {duration: 3000});
					this.glowController.hide();
				 }.bind(this), 1000);
		}.bind(this));
	}

	EntryView.prototype.glowInit = function (options) {
		var glowSurfaceOptions = Object.create(options);
		this.glowSurface.setOptions(glowSurfaceOptions);
		this.glowSurface.addClass('glow');
	};

	EntryView.prototype.select = function() {
		console.log('entry selected with id: ' + this.entry.id);
		if (this.entry.get("sourceName")) {
			u.showAlert('You can not edit this entry');
			return;
		}
		var trackView = App.pageView.getPage('TrackView');
		var formViewState = trackView.buildStateFromEntry(this.entry);
		trackView.showEntryFormView(formViewState);
	};

	EntryView.prototype.delete = function(e) {
		console.log('EntryView: Deleting entry - ' + this.entry.id);
		if ((e instanceof CustomEvent) || e instanceof Entry) {
			this.entry.delete(function(data) {
				this._eventOutput.emit('delete-entry', data);
			}.bind(this));
		}
	}

	module.exports = EntryView;
});
