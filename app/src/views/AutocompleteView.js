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
        _createView.call(this);
//        _addEventHandlers.call(this);
//        AutocompleteView.enteredKey = key;
        this.init();
    }

    AutocompleteView.prototype = Object.create(View.prototype);
    AutocompleteView.prototype.constructor = AutocompleteView;

    AutocompleteView.DEFAULT_OPTIONS = {};
//    AutocompleteView.enteredKey = 'm';
//    alert(enteredKey);

    AutocompleteView.prototype.init = function() {
        this.renderController = new RenderController();
        this.add(this.renderController);
//        this.getAutoCompletes(enteredKey);
    };

    function _createView(argument) {
        var formSurface = new FormContainerSurface({
            size: [1280, 120],
        });
        var formLayout = new SequentialLayout({
            direction: 1,
            itemSpacing: 7,
        });
        var usernameSurface = new InputSurface({
            size: [1280, 120]
        });
        formLayout.sequenceFrom([usernameSurface]);
        formSurface.add(formLayout);
        var autoCompleteModifier = new StateModifier({
            transform:Transform.translate(6,35,11)
        });
        this.add(autoCompleteModifier).add(formSurface);
    }

    AutocompleteView.prototype.getAutoCompletes = function(enteredKey) {
        AutocompleteCollection.fetch(enteredKey, function(autocompletes) {
            var surfaceList = [];
            var scrollView = new Scrollview({
                direction: Utility.Direction.Y,
            });
            autocompletes.forEach(function(autocomplete) {
                var autoCompleteView = new View();
                autoCompleteView.autoCompleteSurface = new Surface({
                    size: [1270, 20],
                    content: autocomplete.label
                });

                autoCompleteView.autoCompleteModifier = new StateModifier({
                    transform:Transform.translate(6,35,99)
                });

                //Todo: listener that would set the data clicked into input field
                autoCompleteView.autoCompleteSurface.on('click', function(e) {
                    console.log("Clicked on autocomplete data");
                    this._eventOutput.emit('autoCompleteEvent');
                }.bind(this));

                autoCompleteView.add(autoCompleteView.autoCompleteModifier).add(autoCompleteView.autoCompleteSurface);
                surfaceList.push(autoCompleteView);
                autoCompleteView.pipe(scrollView);
            });

            scrollView.sequenceFrom(surfaceList);
            this.renderController.show(scrollView);
        }.bind(this));
    }

    module.exports = AutocompleteView;
});
