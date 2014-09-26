/*** PageView.js ***/

define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require("famous/views/RenderController");
	var TrackView = require('views/TrackView');
	var QuickHelpView = require('views/QuickHelpView');
	var LaunchView = require('views/LaunchView');
	var CommunityView = require('views/community/CommunityView');
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
		this.hiddenModifier = new StateModifier({
			align: [0, 0]
		});
		this.add(this.hiddenModifier).add(this.renderController);
		this.launchView = new LaunchView();
		this.pageMap['launch'] = this.launchView;

		this.launchView.on('login-success', function(data) {
			_createTrackPage.call(this);
			var view = new View();
			var backgroundSurface = new Surface({
				size: [undefined, undefined],
				properties: {
					backgroundColor: 'white'
				}
			});
			view.add(backgroundSurface);
			this.renderController.show(view);
			this.changePage('track');
			console.log('PageView: login-success');
		}.bind(this));

		this.launchView.on('registered', function(e) {
			_createTrackPage.call(this);
		}.bind(this));

		this.communityView = new CommunityView('');
		this.pageMap['community'] = this.communityView;
		this.communityView.pipe(this._eventOutput);
		this.quickHelpView = new QuickHelpView();
		this.pageMap['help'] = this.quickHelpView;
		this.quickHelpView.pipe(this._eventOutput);
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
				this.launchView.showLogin();
			}.bind(this));
			console.log('PageView: logout');
		}.bind(this));

		this.on('change-page', function(e) {
			console.log('Changing page to ' + e.data);
			this.changePage(e.data);	
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
		var view = this.getPage(pageName);
		this.renderController.show(view, {
			duration: 0
		});
		if (pageName === 'launch') {
			view.showLogin();	
		}
		view._eventInput.trigger('on-show');
		this._eventOutput.emit('page-change-complete');
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
