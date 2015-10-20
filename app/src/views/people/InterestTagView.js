define(function(require, exports, module) {
    'use strict';
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Modifier = require('famous/core/Modifier');
    var InputSurface = require('famous/surfaces/InputSurface');
    var FastClick = require('famous/inputs/FastClick');
    var RenderNode = require("famous/core/RenderNode");
    var StateView = require('views/StateView');
    var ContainerSurface = require('famous/surfaces/ContainerSurface');
    var Surface = require('famous/core/Surface');
    var InterestTagTemplate = require('text!templates/interest-tag.html');
    var User = require('models/User');
    var u = require('util/Utils');

    function InterestTagView(tag) {
        StateView.apply(this, arguments);
        _createTagListSurface.call(this);
    }

    InterestTagView.prototype = Object.create(StateView.prototype);
    InterestTagView.prototype.constructor = InterestTagView;

    InterestTagView.DEFAULT_OPTIONS = {
    };

    function _createTagListSurface() {
        var tagSurface = new Surface({
            size: [undefined, App.height - 114],
            /*content: _.template(InterestTagTemplate,peopleDetails, templateSettings),*/
            content: this.tag,
            properties: {
                background: ''
            }
        });

        var mod = new StateModifier({
            transform: Transform.translate(0, 0, 99)
        });

        this.add(mod).add(tagSurface);
    }
    module.exports = InterestTagView;
});
