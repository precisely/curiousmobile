define(function(require, exports, module) {
    var View          = require('famous/core/View');
    var Surface       = require('famous/core/Surface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');

    function EntryReadView(entry) {
        View.apply(this, arguments);
		this.entry = entry;
		_addSurface.call(this);
    }

    EntryReadView.prototype = Object.create(View.prototype);
    EntryReadView.prototype.constructor = EntryReadView;

    EntryReadView.DEFAULT_OPTIONS = {};

	function _addSurface() {
		this.surfaceModifier = new StateModifier();
		var entrySurface = new Surface({
			content: this.entry.description,
			properties: {
				padding: '12px'
			}
		});
		entrySurface.on('click', function() {
			console.log("entrySurface event");
			this._eventOutput.emit('select-entry');
		}.bind(this));
		this.add(this.surfaceModifier).add(entrySurface);
	}

    module.exports = EntryReadView;
});
