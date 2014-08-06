/*** PageView.js ***/

define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require("famous/views/RenderController");
	var TrackView = require('views/TrackView');
	var LoginView = require('views/LoginView');
	var Utils = require('util/Utils');
	var store = require('store');
	var User = require('models/User');

	function PageView() {
		View.apply(this, arguments);
		this.renderController = new RenderController();
		this.pageMap = {};
		_addPages.call(this);
	}

	PageView.prototype = Object.create(View.prototype);
	PageView.prototype.constructor = PageView;

	PageView.DEFAULT_OPTIONS = {};

	function _addPages() {
		var windowSize = Utils.getWindowSize();
		var backgroundSurface = new Surface({
			size: [undefined,undefined],
			properties: {
				backgroundColor: 'white'	
			}	
		});
		this.add(backgroundSurface);
		this.add(this.renderController);
		this.loginView = new LoginView();
		this.trackView = new TrackView();
		this.pageMap['track'] = this.trackView;
		this.pageMap['login'] = this.loginView;
		this.hiddenModifier = new StateModifier({
			align: [1, 1]
		});
		this.trackView.on('menuToggle', function() {
			this._eventOutput.emit('menuToggleNested');
		}.bind(this));

		this.loginView.on('login-success', function(data) {
			this.changePage('track');
		}.bind(this));
		if (!User.isLoggedIn()) {
			this.changePage('login');
		} else {
			this.changePage('track');
		}
	}

	/**
	 * Track the last page visited by the user
	 * @param {string} page - name of the page
	 */
	PageView.prototype.setLastPage = function(page) {
		store.set('lastPage', page)
	}


	/**
	 * Get the last page visited by the user
	 * @param {string} page - name of the page
	 */
	PageView.prototype.getLastPage = function(page) {
		var view = this.pageMap[store.get('lastPage')];
		return view;
	}

	/**
	 * Changing the page
	 * @params {string} pageName - name of the page to go to
	 *
	 */
	PageView.prototype.changePage = function(pageName) {
		var lastPageName = store.get('lastPage');
		this.renderController.hide(); //hides the last page
		this.renderController.show(this.getPage(pageName), {duration:0});
	}

	/**
	 * Getting the view instance from the page map
	 * @params {string} pageName - key for the page in the pageMap
	 *
	 */
	PageView.prototype.getPage = function(pageName) {
		var view = this.pageMap[pageName];
		return view;
	}

	PageView.prototype.getSelectedDate = function(){
		return this.trackView.getSelectedDate();	
	}

	module.exports = PageView;
});
