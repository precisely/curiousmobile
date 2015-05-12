/*** PageView.js ***/

define(function(require, exports, module) {
	var StateView = require('views/StateView');
	var Surface = require('famous/core/Surface');
	var Timer = require('famous/utilities/Timer');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
	var TrackView = require('views/TrackView');
	var QuickHelpView = require('views/QuickHelpView');
	var HomeView = require('views/HomeView');
	var LoginView = require('views/LoginView');
	var RegisterView = require('views/RegisterView');
	var DiscussionListView = require('views/community/DiscussionListView');
	var EntryFormView = require('views/entry/EntryFormView');
	var ContextMenuView = require('views/ContextMenuView');
	var Utils = require('util/Utils');
	var push = require('util/Push');
	var store = require('store');
	var User = require('models/User');


	function PageView() {
		StateView.apply(this, arguments);
		this.renderController = new RenderController();
		App.pageView = this;
		this.pageMap = {};
		this.history = [];
		_onLoad.call(this);
		_menuHandlers.call(this);
		_createContextMenu.call(this);
		window.onclick = function() {
			Utils.closeAlerts();
		};
	}

	PageView.prototype = Object.create(StateView.prototype);
	PageView.prototype.constructor = PageView;

	PageView.DEFAULT_OPTIONS = {};

	function _onLoad(argument) {
		var windowSize = Utils.getWindowSize();
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#ffffff'
			}
		});
		this.add(backgroundSurface);
		this.hiddenModifier = new Modifier({
			align: [0, 0],
			size: [App.width, App.height],
		});
		this.add(this.hiddenModifier).add(this.renderController);

		this.changePage(this.getCurrentPage());

		App.coreEventHandler.on('app-paused', function(e) {
			this.saveState();
		}.bind(this));
	}

	function _createContextMenu() {
		var contextMenuView = new ContextMenuView();
		this.add(contextMenuView.renderController);
		this.on('show-context-menu', function(e) {
			console.log('PageView: calling contextMenuView.show');
			contextMenuView.show(e);
		});
	}

	function _menuHandlers() {
		this.on('noevent', function(e) {
			console.log('PageView: noevent');
		}.bind(this));

		this.on('logout', function(e) {
			push.unregisterNotification(function() {
				User.logout(function(user) {
					this.changePage('HomeView');
				}.bind(this));
			}.bind(this));
			console.log('PageView: logout');
		}.bind(this));

		this.on('change-page', function(e) {
			console.log('Changing page to ' + e.data);
			if (e.clearHistory) {
				this.history = [];
			}
			this.changePage(e.data);
		}.bind(this));
	}

	/**
	 * Track the last page visited by the user
	 * @param {string} page - name of the page
	 */
	PageView.prototype.setCurrentPage = function(page) {
		store.set('currentPage', page);
	};


	/**
	 * Get the last page visited by the user
	 * @param {string} page - name of the page
	 */
	PageView.prototype.getCurrentPage = function() {
		return store.get('currentPage');
	};

	/**
	 * Changing the page
	 * @params {string} pageName - name of the page to go to
	 *
	 */
	PageView.prototype.changePage = function(pageName, state) {
		var view = this.getPage(pageName);
		var comingFromPage = this.getCurrentPage();

		if (view.options.noBackButton) {
			this.clearHistory();
		} else {
			if (comingFromPage) {
				this.history.push(comingFromPage.constructor.name);
			}
		}
		this.setCurrentPage(pageName);

		this.renderController.hide({
			duration: 200
		}); //hides the last page


		this.renderController.show(view, {
			duration: 200
		}, function() {
			console.log("PageView: show complete");
			Timer.setTimeout(function() {
				this.onShow(state);
			}.bind(this), 300);
		}.bind(view));
		this._eventOutput.emit('page-change-complete');
	};

	/**
	 * Getting the view instance from the page map
	 * @params {string} pageName - key for the page in the pageMap
	 *
	 */
	PageView.prototype.getPage = function(pageName) {
		var view = this.pageMap[pageName];
		if (!view) {
			var ViewClass = App.pages[pageName];
			if (!ViewClass) {
				if (!User.isLoggedIn()) {
					pageName = 'HomeView';
				} else {
					pageName = 'TrackView';
				}
				ViewClass = App.pages[pageName];
			}
			view = new ViewClass();
			this.pageMap[pageName] = view;
			view.pipe(this._eventOutput);
			this.subViews.push(view);
		}
		return view;
	};

	PageView.prototype.goBack = function() {
		var backTo = this.history.pop();
		this.changePage(backTo);
	};

	PageView.prototype.hasHistory = function() {
		return this.history.length > 0;
	};

	PageView.prototype.clearHistory = function() {
		this.history = [];
	};

	PageView.prototype.getSelectedDate = function() {
		return this.trackView.getSelectedDate();
	};

	module.exports = PageView;
});
