define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');

	function StateView() {
		View.apply(this, arguments);
	}

	StateView.prototype = Object.create(View.prototype);
	StateView.prototype.constructor = StateView;

	StateView.DEFAULT_OPTIONS = {};

	StateView.prototype.loadLastState = function () {
		var oldState = App.stateCache.get(this.clazz);	
		if (!oldState) {
			if (this.getCurrentState) {
				App.stateCache.set(this.clazz, this.getCurrentState());	
			} else {
				console.log(this.clazz + ': Cannot get current state as it is not supported');	
			}
		} else {
			this.setCurrentState(oldState);	
		}
	};

	StateView.prototype.resetState = function () {
		var oldState = App.stateCache.get(this.clazz);	
		if (oldState) {
			App.stateCache.remove(this.clazz);	
		}
	};

	StateView.prototype.setCurrentState = function (state) {
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

	StateView.prototype.getCurrentState = function () {
		return {};
	};

	module.exports = StateView;
});
