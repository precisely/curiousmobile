define(function(require, exports, module) {
	var BaseView = require('views/BaseView');
    var Surface       = require('famous/core/Surface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');

    function TrackView() {
        BaseView.apply(this, arguments);
		_createBody.call(this);
    }

    TrackView.prototype = Object.create(BaseView.prototype);
    TrackView.prototype.constructor = TrackView;

    TrackView.DEFAULT_OPTIONS = {};

    function _createBody() {
        this.bodySurface = new Surface({
            content: '<span>Testing</span>',
            properties: {
                backgroundColor: 'green',
                color: 'white'
            }
        });

        var backgroundModifier = new StateModifier({
            transform: Transform.translate(0,44,0),
            //            size: [400,400]
        });
        this.layout.content.add(backgroundModifier).add(this.bodySurface);
    }


    module.exports = TrackView;
});
