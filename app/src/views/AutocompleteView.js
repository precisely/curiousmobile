define(function(require, exports, module) {
    'use strict';
    var Utility = require('famous/utilities/Utility');
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var RenderController = require('famous/views/RenderController');
    var Scrollview = require('famous/views/Scrollview');
    var AutocompleteCollection = require('models/AutocompleteCollection');
    var u = require('util/Utils');

    var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
    var InputSurface = require("famous/surfaces/InputSurface");
    var SequentialLayout = require("famous/views/SequentialLayout");
    var StateModifier = require('famous/modifiers/StateModifier');
    var User = require('models/User');
    var EventHandler = require('famous/core/EventHandler');

    function AutocompleteView() {
        View.apply(this, arguments);
        this.init();
    }

    AutocompleteView.prototype = Object.create(View.prototype);
    AutocompleteView.prototype.constructor = AutocompleteView;
    AutocompleteView.DEFAULT_OPTIONS = {};
    
    var onSelectCallback;
    
    AutocompleteView.prototype.init = function() {
        this.renderController = new RenderController();
        this.add(this.renderController);
    };

    AutocompleteView.prototype.onSelect = function(callback) {
        onSelectCallback = callback;
    };

    AutocompleteView.prototype.getAutoCompletes = function(enteredKey) {
        AutocompleteCollection.fetch(enteredKey, function(autocompletes) {
            var surfaceList = [];
            var scrollView = new Scrollview({
                direction: Utility.Direction.Y,
            });

            autocompletes.forEach(function(autocomplete) {
                var myView = new View();
                myView.autoCompleteSurface = new Surface({
                    size: [1270, 20],
                    content: autocomplete.label,
                    properties: {
                        backgroundColor: 'white'
                    }
                });

                myView.autoCompleteModifier = new StateModifier({
                    transform:Transform.translate(6,35,99)
                });

                myView.autoCompleteSurface.on('click', function() {
                    onSelectCallback(autocomplete.label);
                });

                myView.add(myView.autoCompleteModifier).add(myView.autoCompleteSurface);
                surfaceList.push(myView);
                myView.pipe(scrollView);
            });

            scrollView.sequenceFrom(surfaceList);
            this.renderController.show(scrollView);
        }.bind(this));
    }

    module.exports = AutocompleteView;
});
