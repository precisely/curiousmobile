/*** PageView.js ***/

define(function(require, exports, module) {
	var View = require('famous/core/View');
	var StateView = require('views/StateView');
	var Surface = require('famous/core/Surface');
	var Timer = require('famous/utilities/Timer');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
	var TrackView = require('views/TrackView');
	var QuickHelpView = require('views/QuickHelpView');
	var LaunchView = require('views/LaunchView');
	var CommunityView = require('views/community/CommunityView');
	var ContextMenuView = require('views/ContextMenuView');
	var EntryFormView = require('views/entry/EntryFormView');
	var Utils = require('util/Utils');
	var push = require('util/Push');
	var store = require('store');
	var User = require('models/User');


	function PageView() {
		StateView.apply(this, arguments);
		this.renderController = new RenderController();
		App.pageView = this;
		this.pageMap = {};
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
		this.launchView = new LaunchView();
		this.subViews.push(this.launchView);
		this.pageMap['launch'] = this.launchView;

		if (!User.isLoggedIn()) {
			this.changePage('launch');
		} else {
			this.addPages();
		}

		this.launchView.on('login-success', function(data) {
			if (this.getLastPage() === 'launch') {
				this.setLastPage('track');	
			}
			this.addPages();
		}.bind(this));

		this.launchView.on('registered', function(e) {
			this.addPages();
		}.bind(this));

		App.coreEventHandler.on('app-paused', function (e) {
			this.saveState();
		}.bind(this));
	}

	PageView.prototype.addPages = function(loadLastState) {
		_createTrackPage.call(this);
		_createEntryFormView.call(this);
		this.communityView = new CommunityView('');
		this.subViews.push(this.communityView);
		this.pageMap['community'] = this.communityView;
		this.communityView.pipe(this._eventOutput);
		this.quickHelpView = new QuickHelpView();
		this.subViews.push(this.quickHelpView);
		this.pageMap['help'] = this.quickHelpView;
		this.quickHelpView.pipe(this._eventOutput);

		var view = new View();
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'white'
			}
		});
		view.add(backgroundSurface);
		this.renderController.show(view);
		try {
			push.registerNotification();
		} catch (err) {
			console.log('Could not register the push notification: ' + err);	
		}
		console.log('PageView: login-success');

		var lastPage = this.getLastPage();
		if (lastPage) {
			this.changePage(lastPage);
		} else {
			this.changePage('track');
		}

		if (loadLastState) {
			this.getStateFromCache();
		}
	}

	function _createContextMenu() {
		var contextMenuView = new ContextMenuView();
		this.add(contextMenuView.renderController);
		this.on('show-context-menu', function(e) {
			console.log('PageView: calling contextMenuView.show');
			contextMenuView.show(e);
		});
	}

	function _createTrackPage() {
		this.trackView = new TrackView();
		this.pageMap['track'] = this.trackView;
		this.subViews.push(this.trackView);
		this.trackView.pipe(this._eventOutput);
		this.trackView.on('select-entry', function(entry) {
			console.log('entry selected with id: ' + entry.id);
			var directlyCreateEntry = false;
			if (entry.isContinuous() || (entry.isRemind() && entry.isGhost())) {
				var tag = entry.get('description');
				var tagStatsMap = autocompleteCache.tagStatsMap.get(tag);
				if ((tagStatsMap && tagStatsMap.typicallyNoAmount) || tag.indexOf('start') > -1 ||
					tag.indexOf('begin') > -1 || tag.indexOf('stop') > -1 || tag.indexOf('end') > -1) {
					directlyCreateEntry = true;
				}
			}

			if (directlyCreateEntry) {
				this.entryFormView.submit(entry, directlyCreateEntry);
				return;
			}

			this.changePage('form-view', entry.id);
		}.bind(this));

		this.trackView.on('create-entry', function(e) {
			console.log('EventHandler: this.trackView.on event: create-entry');
			this.entryFormView.unsetEntry();
			this.changePage('form-view');
		}.bind(this));
	}

	function _menuHandlers() {
		this.on('noevent', function(e) {
			console.log('PageView: noevent');
		}.bind(this));

		this.on('logout', function(e) {
			push.unregisterNotification(function() {
				User.logout(function(user) {
					this.changePage('launch');
					this.launchView.showHome();
				}.bind(this));
			}.bind(this));
			console.log('PageView: logout');
		}.bind(this));

		this.on('change-page', function(e) {
			console.log('Changing page to ' + e.data);
			this.changePage(e.data);
		}.bind(this));
	}

	function _createEntryFormView() {
		this.entryFormView = new EntryFormView();
		this.pageMap['form-view'] = this.entryFormView;
		this.subViews.push(this.entryFormView);
		this.entryFormView.pipe(this._eventOutput);
		this.entryFormView.on('new-entry', function(data) {
			console.log("New Entry - TrackView event");
			var currentListView = this.trackView.currentListView;
			currentListView.refreshEntries(data.entries, data.glowEntry);
			this.changePage('track');
		}.bind(this));

		this.entryFormView.on('update-entry', function(resp) {
			console.log('EntryListView: Updating an entry');
			var currentListView = this.trackView.currentListView;
			currentListView.refreshEntries(resp.entries, resp.glowEntry);
			this.changePage('track');
		}.bind(this));

		this.entryFormView.on('go-back', function(e) {
			console.log('EventHandler: this.entryFormView event: go-back');
			store.set('lastPage', 'track');
			this.entryFormView.blur();
			this.changePage('track');
		}.bind(this));

		this.entryFormView.on('hiding-form-view', function(e) {
			console.log('EventHandler: this.entryFormView event: hiding-form-view');
			this.changePage('track');
		}.bind(this));
	}

	/**
	 * Track the last page visited by the user
	 * @param {string} page - name of the page
	 */
	PageView.prototype.setLastPage = function(page) {
		store.set('lastPage', page);
	};


	/**
	 * Get the last page visited by the user
	 * @param {string} page - name of the page
	 */
	PageView.prototype.getLastPage = function() {
		return store.get('lastPage');
	};

	/**
	 * Changing the page
	 * @params {string} pageName - name of the page to go to
	 *
	 */
	PageView.prototype.changePage = function(pageName, pageData) {
		this.renderController.hide({
			duration: 200
		}); //hides the last page
		var view = this.getPage(pageName);
		this.renderController.show(view, {
			duration: 200
		}, function() {
			console.log("PageView: show complete");
			Timer.setTimeout(function() {
				this.resetState();
				this._eventInput.trigger('on-show', pageData);
			}.bind(this), 300);
		}.bind(view));
		this.setLastPage(pageName);
		this._eventOutput.emit('page-change-complete');
	};

	/**
	 * Getting the view instance from the page map
	 * @params {string} pageName - key for the page in the pageMap
	 *
	 */
	PageView.prototype.getPage = function(pageName) {
		var view = this.pageMap[pageName];
		return view;
	};

	PageView.prototype.getSelectedDate = function() {
		return this.trackView.getSelectedDate();
	};

	module.exports = PageView;
});
