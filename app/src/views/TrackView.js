define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
    var Surface       = require('famous/core/Surface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');

    function TrackView() {
        BaseView.apply(this, arguments);
    }

    TrackView.prototype = Object.create(BaseView.prototype);
    TrackView.prototype.constructor = TrackView;

    TrackView.DEFAULT_OPTIONS = {};

    module.exports = TrackView;
});
