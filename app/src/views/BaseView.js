/*** BaseView.js ***/

define(function(require, exports, module) {
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var HeaderFooter = require('famous/views/HeaderFooterLayout');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var FastClick       = require('famous/inputs/FastClick');

    function BaseView() {
        View.apply(this, arguments);
        _createLayout.call(this);
        _createHeader.call(this);
        _createBody.call(this);
        _setListeners.call(this);
    }

    BaseView.prototype = Object.create(View.prototype);
    BaseView.prototype.constructor = BaseView;

    BaseView.DEFAULT_OPTIONS = {
        headerSize: 44,
    };

    function _createLayout() {
        this.layout = new HeaderFooter({
            headerSize: this.options.headerSize
        });

        var layoutModifier = new StateModifier({
            transform: Transform.translate(0, 0, 0.1)
        });

        this.add(layoutModifier).add(this.layout);
    }

    function _createHeader() {
        var backgroundSurface = new Surface({
            size: [undefined, 44],
            properties: {
                backgroundColor: 'black'
            }
        });

        var backgroundModifier = new StateModifier({
            transform: Transform.behind
        });

        this.layout.header.add(backgroundModifier).add(backgroundSurface);

        this.hamburgerSurface = new ImageSurface({
            size: [44, 44],
            content: 'content/images/hamburger.png'
        });

        var searchSurface = new ImageSurface({
            size: [232, 44],
            content: 'content/images/search.png'
        });

        var iconSurface = new ImageSurface({
            size: [44, 44],
            content: 'content/images/icon.png'
        });
        var hamburgerModifier = new StateModifier({
            origin: [0, 0],
            align: [0, 0]
        });

        var searchModifier = new StateModifier({
            origin: [0.5, 0],
            align: [0.5, 0]
        });

        var iconModifier = new StateModifier({
            origin: [1, 0.5],
            align: [1, 0.5]
        });
        this.layout.header.add(hamburgerModifier).add(this.hamburgerSurface);
        this.layout.header.add(searchModifier).add(searchSurface);
    }

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

    function _setListeners() {
        this.hamburgerSurface.on('click', function() {
			console.log("Clicked on menu icon image");
            this._eventOutput.emit('menuToggle');
        }.bind(this));
    }
    module.exports = BaseView;
});
