define(function(require, exports, module) {
    var View          = require('famous/core/View');
    var Surface       = require('famous/core/Surface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require("famous/views/RenderController");

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
		this.add(this.renderController);
		this.entrySurface = new Surface({
			content: this.entry.toString(),
			classes: this.entry.repeatTypeAsClass(),
			properties: {
				padding: '12px'
			}
		});
		this.glowSurface = new Surface({
			content: this.entry.toString(),
			classes: this.entry.repeatTypeAsClass(),
			properties: {
				padding: '12px',
				color: '#ffffff',
				backgroundColor: '#c0c0c0'
			}
		});
		this.entrySurface.on('click', function() {
			console.log("entrySurface event");
			this._eventOutput.emit('select-entry');
		}.bind(this));
		this.renderController.show(this.entrySurface, {duration:0});
		
	}

	EntryReadView.prototype.setEntry = function(entry){
		this.entry = entry;
	}
	 
	EntryReadView.prototype.glow = function(){
		var rc = this.renderController;
		rc.show(this.glowSurface, {duration: 1000});
		rc.hide();
		rc.show(this.entrySurface);
	}

    module.exports = EntryReadView;
});
