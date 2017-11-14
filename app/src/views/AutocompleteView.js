define(function(require, exports, module) {
	'use strict';
	var Utility = require('famous/utilities/Utility');
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Transform = require('famous/core/Transform');
	var RenderController = require('famous/views/RenderController');
	var Scrollview = require('famous/views/Scrollview');
	var FastClick = require('famous/inputs/FastClick');
	var u = require('util/Utils');

	function AutocompleteView(AutocompleteObj) {
		View.apply(this, arguments);
		this.init();
		this.AutocompleteObj = AutocompleteObj;
	}

	AutocompleteView.prototype = Object.create(View.prototype);
	AutocompleteView.prototype.constructor = AutocompleteView;
	AutocompleteView.DEFAULT_OPTIONS = {};

	AutocompleteView.prototype.init = function() {
		this.renderController = new RenderController();
		this.add(this.renderController);
	};


	AutocompleteView.prototype.hide = function(callback) {
		this.renderController.hide({duration:0});
	}

	AutocompleteView.prototype.onSelect = function(callback) {
		this.onSelectCallback = callback;
	};

	AutocompleteView.prototype.getAutocompletes = function(enteredKey, callback) {
		this.surfaceList = [];
		this.scrollView = new Scrollview({
			direction: Utility.Direction.Y,
		});
		var i = 0;
		if (!enteredKey) {
			this.processAutocompletes(false);
			return;
		}
		enteredKey = enteredKey.toLowerCase().trim();
		this.addItem({label:enteredKey}, 0, false)
		this.AutocompleteObj.fetch(enteredKey, function(autocompletes) {
			this.processAutocompletes(autocompletes, enteredKey, callback);
		}.bind(this));
	}

	AutocompleteView.prototype.processAutocompletes = function(autocompletes, enteredKey, callback) {
		if (autocompletes) {
			autocompletes.forEach(function(autocomplete, index) {
				var isLastItem = false;
				if (autocomplete.label && (autocomplete.label.trim() === enteredKey)) {
					return;
				}
				if (index == autocompletes.length-1) {
					isLastItem = true;
				}
				this.addItem(autocomplete, index+1, isLastItem);
			}.bind(this));
		}
		this.scrollView.sequenceFrom(this.surfaceList);
		this.renderController.show(this.scrollView);

		if (callback) {
			callback(this.surfaceList);
		}
	};

	AutocompleteView.prototype.addItem = function(autocomplete, i, isLastItem) {
		var myView = new View();
		var backgroundColor = 'white';
		var borderProperty = '0px solid #aaaaaa';
		if (isLastItem) {
			borderProperty = '1px solid #aaaaaa';
		}
		if (i % 2 == 0) {
			backgroundColor = '#cccccc';
		}
		myView.autoCompleteSurface = new Surface({
			content: autocomplete.label || autocomplete,
			properties: {
				backgroundColor: backgroundColor,
				padding: '9px',
				fontSize: '15px',
				borderBottom: borderProperty,
				borderLeft: '1px solid #aaaaaa',
				borderRight: '1px solid #aaaaaa'
			}
		});

		myView.autoCompleteModifier = new StateModifier({
			transform:Transform.translate(15,55, App.zIndex.autocomplete),
			size: [window.innerWidth - 30, 40]
		});

		myView.autoCompleteSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				console.log('Autocomplete click: ' + e);
				this.renderController.hide(this.scrollView);
				this.onSelectCallback(autocomplete.label || autocomplete);
			}
		}.bind(this));

		myView.add(myView.autoCompleteModifier).add(myView.autoCompleteSurface);
		this.surfaceList.push(myView);
		myView.pipe(this.scrollView);
	};
	module.exports = AutocompleteView;
});
