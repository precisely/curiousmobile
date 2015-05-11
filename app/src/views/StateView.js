define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');

	function StateView() {
		View.apply(this, arguments);
		this.subViews = [];
	}

	StateView.prototype = Object.create(View.prototype);
	StateView.prototype.constructor = StateView;

	StateView.DEFAULT_OPTIONS = {};

	StateView.prototype.getStateFromCache = function() {
		var oldState = App.stateCache.getItem(this.constructor.name);
		this.loadState(oldState);
		_.each(this.subViews, function(subView) {
			subView.getStateFromCache();
		});
	};

	StateView.prototype.resetState = function() {
		var oldState = App.stateCache.getItem(this.constructor.name);
		if (oldState) {
			App.stateCache.removeItem(this.constructor.name);
		}
	};

	StateView.prototype.loadState = function(state) {
		var focusElement = null;
		if (!state) {
			return;
		}

		if (state && state.form) {
			console.log(this.constructor.name + ': Loading elements/form from state');
			for (var i = 0, len = state.form.length; i < len; i++) {
				var element = state.form[i];
				console.log(this.constructor.name + ': Setting value for ' + element.id);
				var elementDOM = document.getElementById(element.id);
				elementDOM.value = element.value;
				if (element.selectionRange) {
					elementDOM.setSelectionRange(element.selectionRange[0], element.selectionRange[1]);
				}

				if (element.focus) {
					elementDOM.focus();	
				}
			}
		}

		if (state.postLoadAction) {
			this[state.postLoadAction.name].apply(this, state.postLoadAction.args);	
		}
		return false;
	};

	StateView.prototype.setState = function(state) {
		App.stateCache.setItem(this.constructor.name, state);
	};

	StateView.prototype.getCurrentState = function() {

	};

	module.exports = StateView;
});
