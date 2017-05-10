define(function(require, exports, module) {

	'use strict';

	var View = require('famous/core/View');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Timer = require('famous/utilities/Timer');
	var OptionsManager = require('famous/core/OptionsManager');

	/**
	 * All stateful views need to extend this class. On app-pause this will save the state of all stateful views in
	 * memory. On app-resume it the app loads the last view and if stateful its state gets loaded as well.
	 */
	function StateView(options) {
		this.options = Object.create(StateView.DEFAULT_OPTIONS);
		this._optionsManager = new OptionsManager(this.options);
		if (options) {
			this._optionsManager.setOptions(options);
		}
		View.apply(this, arguments);
		this.subViews = [];
	}

	StateView.prototype = Object.create(View.prototype);
	StateView.prototype.constructor = StateView;

	StateView.DEFAULT_OPTIONS = {
		reloadOnResume: false,
	};

	/**
	 * Fetches the last cached state for the current view
	 */
	StateView.prototype.getStateFromCache = function() {
		var oldState = App.stateCache.getItem(this.constructor.name);
		this.loadState(oldState);
	};


	/**
	 * Clears the last cached state for the current view
	 */
	StateView.prototype.clearLastCachedState = function() {
		var oldState = App.stateCache.getItem(this.constructor.name);
		if (oldState) {
			App.stateCache.removeItem(this.constructor.name);
		}
	};

	/**
	 * @param {Object} state - State to be loaded
	 * Loads the given state onto the view.
	 */
	StateView.prototype.loadState = function(state) {
		if (!state) {
			return;
		}

		if (state.reload) {
			this.clearLastCachedState();
			window.location.reload();
			return;
		} else if (state.lastPage) {
			App.pageView.history.push(state.lastPage);
		}

		if (state.viewProperties) {
			for (var i = 0, len = state.viewProperties.length; i < len; i++) {
				var property = state.viewProperties[i];
				var value = property.value;
				if (property.model) {
					// TODO get model class from model cache and instantiate
					require([property.model], function(ModelClass) {
						value = new ModelClass(value);
						this[property.name] = value;
					}.bind(this));
					continue;
				}
				this[property.name] = value;
			}
		}

		if (state && state.form) {
			console.log(this.constructor.name + ': Loading elements/form from state');
			Timer.setTimeout(function() {
				for (var i = 0, len = state.form.length; i < len; i++) {
					var element = state.form[i];
					console.log(this.constructor.name + ': Setting value for ' + element.id);

					var elementDOM = document.getElementById(element.id);
					elementDOM.value = element.value;

					// This is to store original text by elementId for reference
					this['originalText-' + element.id] = element.value;
					if (element.selectionRange) {
						elementDOM.setSelectionRange(element.selectionRange[0], element.selectionRange[1]);
					}

					if (element.focus) {
						elementDOM.focus();
					}
				}
			}.bind(this), 300);
		}

		if (state.postLoadAction) {
			this[state.postLoadAction.name].apply(this, state.postLoadAction.args);
		}

		return false;
	};

	/**
	 * Cache the given state for this view.
	 * @param {Object} state - State object
	 */
	StateView.prototype.setState = function(state) {
		App.stateCache.setItem(this.constructor.name, state);
	};

	/**
	 * Gets the current in memory state of a view. Dummy method should be implemented by all state views else the state
	 * won't be persisted.
	 * @return {Object} - State object
	 */
	StateView.prototype.getCurrentState = function() {
		// For views that we simply will always get the latest data from the
		// server and have no saved state
		return {
			onLoad: true
		};
	};

	/**
	 * Save the current state
	 */
	StateView.prototype.saveState = function() {
		var currentState = this.getCurrentState();
		this.setState(currentState);
	};

	module.exports = StateView;
});
