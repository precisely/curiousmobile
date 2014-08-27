define(function(require, exports, module) {
    'use strict';
    var Utility = require('famous/utilities/Utility');
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Timer = require('famous/utilities/Timer');
    var Transform = require('famous/core/Transform');
    var RenderController = require('famous/views/RenderController');
    var Scrollview = require('famous/views/Scrollview');
    var AutocompleteCollection = require('models/AutocompleteCollection');
    var TrueSurface = require('surfaces/TrueSurface');
    var u = require('util/Utils');

    var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
    var InputSurface = require("famous/surfaces/InputSurface");
    var SequentialLayout = require("famous/views/SequentialLayout");
    var StateModifier = require('famous/modifiers/StateModifier');
    var User = require('models/User');

    function AutocompleteView(key) {
        View.apply(this, arguments);
        _createView.call(this);
        AutocompleteView.enteredKey = key;
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
        this.getAutoCompletes();
    };

    function _createView(argument) {
        var formSurface = new FormContainerSurface({
            size: [1280, 120],
        });
        
        var usernameSurface = new InputSurface({
            size: [1280, 120]
        });

        this.usernameSurface = usernameSurface;

        var formLayout = new SequentialLayout({
            direction: 1,
            itemSpacing: 7,
        });

        usernameSurface.on('click', function(e) {
            if (e instanceof CustomEvent) {
                if (_.contains(e.srcElement.classList, 'create-account')) {
                    console.log("Show create-account form");
                    this._eventOutput.emit('create-account');
                } else if (_.contains(e.srcElement.classList, 'forgot-password')) {
                    console.log("otherLinksSurface forgot password");
                    this._eventOutput.emit('forgot-password');
                }
            }
        }.bind(this));

        formLayout.sequenceFrom([usernameSurface]);
        formSurface.add(formLayout);

        var autoCompleteModifier = new StateModifier({
            transform:Transform.translate(6,35,11)
        });

        this.add(autoCompleteModifier).add(formSurface);
    }


    AutocompleteView.prototype.getAutoCompletes = function() {
        AutocompleteCollection.fetch(AutocompleteView.enteredKey, function(autocompletes) {
            var surfaceList = [];
//
//            autocompletes.forEach(function(entry) {
////              console.log(entry);
//                resultOut = entry.label;
//                alert(resultOut);
//            });
            
            var scrollView = new Scrollview({
                direction: Utility.Direction.Y,
            });

            autocompletes.forEach(function(autocomplete) {
//                alert(autocomplete.label);
                
                var gridSurfaceView = new View();
                
                gridSurfaceView.autoCompleteView = new Surface({
                    size: [1270, 20],
//                    size: [undefined, true],
                    //content: 'testing'
                    content: autocomplete.label
                });

                gridSurfaceView.autoCompleteModifier = new StateModifier({
                    transform:Transform.translate(6,35,99)
                });

                gridSurfaceView.add(gridSurfaceView.autoCompleteModifier).add(gridSurfaceView.autoCompleteView);
                
                surfaceList.push(gridSurfaceView);
                gridSurfaceView.pipe(scrollView);
            });


            scrollView.sequenceFrom(surfaceList);
            this.renderController.show(scrollView);
        }.bind(this));

    }

    module.exports = AutocompleteView;
});
