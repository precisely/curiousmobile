define(function(require, exports, module) {
    'use strict';
    var Utility = require('famous/utilities/Utility');
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Transform = require('famous/core/Transform');
    var RenderController = require('famous/views/RenderController');
    var Scrollview = require('famous/views/Scrollview');
    var u = require('util/Utils');
    var AutoComplete = require('models/AutoComplete');
    var AutoCompleteObj;
    
    function AutoCompleteView() {
        View.apply(this, arguments);
        this.init();
        AutoCompleteObj = new AutoComplete();
        window.autoCompleteCache = AutoCompleteObj;
    }

    AutoCompleteView.prototype = Object.create(View.prototype);
    AutoCompleteView.prototype.constructor = AutoCompleteView;
    AutoCompleteView.DEFAULT_OPTIONS = {};

    var onSelectCallback;
    
    AutoCompleteView.prototype.init = function() {
        this.renderController = new RenderController();
        this.add(this.renderController);
    };

    AutoCompleteView.prototype.onSelect = function(callback) {
        onSelectCallback = callback;
    };
    AutoCompleteView.prototype.getAutoCompletes = function(enteredKey) {
        AutoCompleteObj.fetch(enteredKey, function(autocompletes) {
            var $this = this;
            var surfaceList = [];
            var scrollView = new Scrollview({
                direction: Utility.Direction.Y,
            });
            var i = 0;
            var borderProperty = '0px solid #aaaaaa';
            
            autocompletes.forEach(function(autocomplete) {
                var myView = new View();
				var backgroundColor = 'white';

				if (i % 2 == 0) {
					backgroundColor = '#cccccc';
				}
                if (i == autocompletes.length-1){
                    borderProperty = '1px solid #aaaaaa';
                } 
                else{
                    i = i + 1;
                }
                myView.autoCompleteSurface = new Surface({
                    content: autocomplete.label,
                    properties: {
                        backgroundColor: backgroundColor,
                        padding: '24px',
						fontSize: '24px',
                        borderBottom: borderProperty,
                        borderLeft: '1px solid #aaaaaa',
                        borderRight: '1px solid #aaaaaa'
                    }
                });

                myView.autoCompleteModifier = new StateModifier({
                    transform:Transform.translate(15,55, 1000),
                    size: [window.innerWidth - 30, 90]
                });

                myView.autoCompleteSurface.on('click', function() {
                    this.renderController.hide(scrollView);
                    onSelectCallback(autocomplete.label);
                }.bind($this));

                myView.add(myView.autoCompleteModifier).add(myView.autoCompleteSurface);
                surfaceList.push(myView);
                myView.pipe(scrollView);
            });
            scrollView.sequenceFrom(surfaceList);
            this.renderController.show(scrollView);
        }.bind(this));
    }

    module.exports = AutoCompleteView;
});
