/*** PageView.js ***/

define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require("famous/views/RenderController");
	var TrackView = require('views/TrackView');
	var LaunchView = require('views/LaunchView');
	var Utils = require('util/Utils');
	var store = require('store');
	var User = require('models/User');

	function PageView() {
		View.apply(this, arguments);
		this.renderController = new RenderController();
		this.pageMap = {};
		_addPages.call(this);
		_menuHandlers.call(this);
	}

	PageView.prototype = Object.create(View.prototype);
	PageView.prototype.constructor = PageView;

	PageView.DEFAULT_OPTIONS = {};

	function _addPages() {
		var windowSize = Utils.getWindowSize();
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'white'
			}
		});
		this.add(backgroundSurface);
		this.add(this.renderController);
		this.launchView = new LaunchView();
		this.pageMap['launch'] = this.launchView;
		this.hiddenModifier = new StateModifier({
			align: [1, 1]
		});

		this.launchView.on('login-success', function(data) {
			_createTrackPage.call(this);
			console.log('PageView: login-success');
		}.bind(this));

		this.launchView.on('registered', function(e) {
			_createTrackPage.call(this);
		}.bind(this));

		if (!User.isLoggedIn()) {
			this.changePage('launch');
		} else {
			_createTrackPage.call(this);
		}
	}

	function _createTrackPage() {
		this.trackView = new TrackView();
		this.pageMap['track'] = this.trackView;
		this.trackView.pipe(this._eventOutput);
		this.changePage('track');
	}

	function _menuHandlers() {
		this.on('noevent', function(e) {
			console.log('PageView: noevent');
		}.bind(this));

		this.on('logout', function(e) {
			User.logout(function(){
				this.changePage('launch');	
			}.bind(this));
			console.log('PageView: logout');
		}.bind(this));
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
		this.renderController.show(this.getPage(pageName), {
			duration: 0
		});
		this._eventOutput.emit('change-page');
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

	PageView.prototype.getSelectedDate = function() {
		return this.trackView.getSelectedDate();
	}

	module.exports = PageView;
});
