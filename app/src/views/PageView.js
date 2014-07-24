/*** PageView.js ***/

define(function(require, exports, module) {
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
	var TrackView = require('views/TrackView');

    function PageView() {
        View.apply(this, arguments);
		_addPages.call(this);
    }

    PageView.prototype = Object.create(View.prototype);
    PageView.prototype.constructor = PageView;

    PageView.DEFAULT_OPTIONS = {
    };

	function _addPages() {
		this.trackView = new TrackView();
		this.pageModifier = new StateModifier();

		this.add(this.pageModifier).add(this.trackView);
		this.trackView.on('menuToggle', function(){
            this._eventOutput.emit('menuToggleNested');
        }.bind(this));
	}

    module.exports = PageView;
});
