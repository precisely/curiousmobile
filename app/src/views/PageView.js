/*** PageView.js ***/

define(function(require, exports, module) {
	var StateView = require('views/StateView');
	var Surface = require('famous/core/Surface');
	var Timer = require('famous/utilities/Timer');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
	var TrackView = require('views/TrackView');
	var TutorialView = require('views/TutorialView');
	var HelpContentsView = require('views/help/HelpContentsView');
	var HomeView = require('views/HomeView');
	var LoginView = require('views/LoginView');
	var Transform = require('famous/core/Transform');
	var RegisterView = require('views/RegisterView');
	var TermsView = require('views/TermsView');
	var ForgotPasswordView = require('views/ForgotPasswordView');
	var FeedView = require('views/community/FeedView');
	var SearchView = require('views/community/SearchView');
	var ChartView = require('views/graph/ChartView');
	var SpinnerView = require('views/widgets/SpinnerView');
	var CreateTagHelpView = require('views/help/CreateTagHelpView');
	var CuriositiesGraphView = require('views/graph/CuriositiesGraphView');
	var ShareHelpView = require('views/help/ShareHelpView');
	var AdvancedTagsView = require('views/help/AdvancedTagsView');
	var ExternalDevicesHelpView = require('views/help/ExternalDevicesHelpView');
	var RepeatAlertTagsHelpView = require('views/help/RepeatAlertTagsHelpView');
	var MakeChartHelpView = require('views/help/MakeChartHelpView');
	var SprintListView = require('views/sprint/SprintListView');
	var CuriositiesListView = require('views/curiosities/CuriositiesListView');
	var ManageCuriositiesHelpView = require('views/help/ManageCuriositiesHelpView');
	var AddDiscussionHelpView = require('views/help/AddDiscussionHelpView');
	var CreateSprintHelpView = require('views/help/CreateSprintHelpView');
	var EntryFormView = require('views/entry/EntryFormView');
	var TrackEntryFormView = require('views/entry/TrackEntryFormView');
	var ContextMenuView = require('views/ContextMenuView');
	var Utils = require('util/Utils');
	var push = require('util/Push');
	var store = require('store');
	var User = require('models/User');
	var Discussion = require('models/Discussion');


	function PageView() {
		StateView.apply(this, arguments);
		this.renderController = new RenderController();
		App.pageView = this;
		this.pageMap = {};
		this.history = [];
		_onLoad.call(this);
		_menuHandlers.call(this);
		_createContextMenu.call(this);
		setTimeout(function() {
			navigator.splashscreen.hide();
		}, 100);
		//		window.onclick = function() {
		//			Utils.closeAlerts();
		//		};
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
		this.spinnerView = new SpinnerView();
		this.add(new Modifier({transform: Transform.translate(0, 0, App.zIndex.spinner)})).add(this.spinnerView);
		var currentPage = this.getCurrentPage();
		var state = App.stateCache.getItem(currentPage);
		if (state && state.lastPage) {
			App.pageView.history.push(state.lastPage);
		}
		this.changePage(this.getCurrentPage(), state || { onLoad: true });

		App.coreEventHandler.on('app-paused', function() {
			this.saveState();
		}.bind(this));
		App.coreEventHandler.on('app-resume', function() {
			this.getStateFromCache();
			var trackView = this.getPage('TrackView');
			if (trackView && App.selectedDate) {
				trackView.dateNotToday = App.selectedDate.setHours(0, 0, 0, 0) != new Date().setHours(0, 0, 0, 0);
			}
			Discussion.getNewNotificationCount();
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
			User.logout(function(user) {
				this.changePage('HomeView');
			}.bind(this));
			Utils.saveEventForAnalysis('Logout', 'Done', 'User logout successfully', 0 ,'Logout successfully.');
			console.log('PageView: logout');
		}.bind(this));

		this.on('change-page', function(e) {
			console.log('Changing page to ' + e.data);
			if (e.clearHistory) {
				this.history = [];
			}
			var state = new Object();
			if(e.data == "PeopleDetailView") {
				state.hash = User.getCurrentUserHash();
			}
			this.changePage(e.data, state);
		}.bind(this));
	}

	/**
	 * Track the current page visited by the user. This specially is useful to because we want to know which
	 * page the user is coming from to determine if the back button needs to displayed
	 * @param {string} page - name of the page
	 */
	PageView.prototype.setCurrentPage = function(page) {
		store.set('currentPage', page);
	};


	/**
	 * Get the current page the user is on, while changing the page this is important. See setCurrentPage.
	 * @param {string} page - name of the page
	 */
	PageView.prototype.getCurrentPage = function() {
		return store.get('currentPage');
	};

	/**
	 * Get the current View instance
	 */
	PageView.prototype.getCurrentView = function() {
		var currentPageName = this.getCurrentPage();
		if (!currentPageName) {
			console.log('PageView: Cannot find the current page name');
			return;
		}
		var currentView = this.getPage(currentPageName);
		if (!currentView) {
			console.log('PageView: Found the page name but could not get the view');
			return;
		}
		return currentView;
	};

	/**
	 * Changing the page
	 * @params {string} pageName - name of the page to go to
	 * @params {string} state - Initial state the page is to be loaded with.
	 *
	 * Every page is a subclass of BaseView. After each page is changed an onShow method
	 * is being called to do that handles getting data if needed and the general view
	 * setup needed to bring back the page to focus.
	 *
	 * state.new - This can be set to true if the page needs to be rendered as if it were loaded for the first time.
	 * If you are coming back from a sub-section you might want to just return to the state the view was in rather than
	 * reloading the entire view. ex: Returning from DiscussionDetailView back to DiscusssionListView
	 *
	 */
	PageView.prototype.changePage = function(pageName, state) {
		var view = this.getPage(pageName);
		var comingFromPage = this.getCurrentPage();

		if (!view) {
			console.log('Unable to find view with name: ' + pageName);
		}

		var continueChangePage = view.preShow(state);
		if (!continueChangePage && (state && !state.onLoad)) {
			return false;
		} else if (state && state.onLoad) {
			if (view.parentPage) {
				this.goBack(view.parentPage, {onLoad: true});
				return false;
			}
		}

		if (comingFromPage) {
			this.getPage(comingFromPage).preChangePage();
		}

		if (view.options.noBackButton) {
			this.clearHistory();
		} else {
			if (comingFromPage && comingFromPage !== pageName) {
				this.history.push(comingFromPage);
			}
		}
		this.setCurrentPage(view.constructor.name);
		// See main.js
		if (_.contains(App.viewsWithoutSearchIcon, view.constructor.name)) {
			view.hideSearchIcon();
		} else {
			view.showSearchIcon();
		}
		this.renderController.show(view, {
			duration: 200
		}, function() {
			// this is bound to the 'view'.
			console.log(this.constructor.name + ": show complete");
			if (continueChangePage) {
				Timer.setTimeout(function() {
					this.onShow(state);
				}.bind(this), 300);
			}
			this._eventOutput.emit('page-change-complete', {view: view, state: state});
		}.bind(view));

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

	PageView.prototype.getCachedPage = function(pageName) {
		var view = this.pageMap[pageName];
		return view;
	};

	/**
	 * Goes back to the last page in the history
	 */
	PageView.prototype.goBack = function(parent, state) {
		var backTo = this.history.pop();
		if (parent && (!state || (state && !state.goBackToHistory))) {
			backTo = parent;
		}
		this.changePage(backTo, state);
	};

	/**
	 * Determines if there is navigation history
	 */
	PageView.prototype.hasHistory = function() {
		return this.history.length > 0;
	};

	/**
	 * Clears navigation history. Useful when going to a top-level page from the footer or
	 * slide menu.
	 */
	PageView.prototype.clearHistory = function() {
		this.history = [];
	};

	/**
	 * Gets the selected date from the TrackView
	 */
	PageView.prototype.getSelectedDate = function() {
		return this.getPage('TrackView').getSelectedDate();
	};

	/**
	 * Saves the current state of the current page so it can be restored later.
	 */
	PageView.prototype.saveState = function() {
		return this.getCurrentView().saveState();
	};

	/**
	 * Load state of the current page from the cache on app resume
	 */
	PageView.prototype.loadState = function() {
		var view = this.getCurrentView();
		if (view.options.reloadOnResume) {
			this.changePage(view.constructor.name, {
				onLoad: true
			});
		} else {
			view.getStateFromCache();
			view.clearLastCachedState();
		}
	};

	module.exports = PageView;
});
