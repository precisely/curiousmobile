define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');

	function StateView() {
		View.apply(this, arguments);
		this.subStates = [];
	}

	StateView.prototype = Object.create(View.prototype);
	StateView.prototype.constructor = StateView;

	StateView.DEFAULT_OPTIONS = {};

	StateView.prototype.getStateFromCache = function () {
		var oldState = App.stateCache.getItem(this.constructor.name);	
		this.loadState(oldState);
	};

	StateView.prototype.resetState = function () {
		var oldState = App.stateCache.getItem(this.constructor.name);	
		if (oldState) {
			App.stateCache.removeItem(this.constructor.name);	
		}
	};

	StateView.prototype.loadState = function (state) {
		if (state && state.form) {
			for (var i = 0, len = state.form.length; i < len; i++) {
				var element = state.form[i];
				console.log('Setting value for ' + element.id);
				var elementDOM = document.getElementById(element.id);
				elementDOM.value = element.value;
				if (element.selectionRange) {
					elementDOM.setSelectionRange(element.selectionRange[0], elementSelectionRange[1]);
				}
			}
			return true;
		}
		return false;
	};

	StateView.prototype.saveState = function() {
	
	};

	module.exports = StateView;
});
