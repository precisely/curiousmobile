var App = function() {
	//var u = require('models/User');
	//var AppView = require('views/AppView');

	this.pages = {};
	this.CSRF = {};
	this.CSRF.SyncTokenKeyName = "SYNCHRONIZER_TOKEN"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_KEY
	this.CSRF.SyncTokenUriName = "SYNCHRONIZER_URI"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_URI

	this.zIndex = {
		menu: 59,
		readView: 16,
		feedItem: 16,
		pinned: 0,
		formView: 14,
		header: 35,
		footer: 35,
		datePicker: 50,
		autocomplete: 99,
		alertView: 999,
		noInternet: 900,
		contextMenu: 90,
		overlay: 20,
		spinner: 950
	};

	// Global popover contents, so that any popover content can be changed here without visiting any views.
	var popoverContents = {
		entryAdded: 'Tap here to edit time',
		sprintMenu: 'Activities to do with <br>We Are Curious!',
		shareChart: 'Tap here to share',
		addDiscussionTrackathon: 'Post new discussion topic',
		trackathonBookmarks: "The trackathon’s tags have been added to your bookmarks! " +
				"Go to the Trackathon/STARTED tab to see your started trackathons and discuss your progress with" +
				" other users",
		firstChartPlot: 'Tap tag to change graphing style',
		plusIcon: 'Tap here to add a tag you have not tracked recently',
		inputWidgetUsage: 'Tap here to change value'
	};

	// Global popover settings applied to every popup in the app.
	this.getDefaultPopoverSettings = function(customCss) {
		return {
			placement: 'top',
			html: true,
			container: 'body',
			template: '<div class="popover ' + customCss + '" role="tooltip"><div class="arrow"><div' +
					' class="vline"></div></div><div class="popover-content"></div></div>'
		};
	};

	// Show popover with specific content.
	this.showPopover = function(elementId, customSettings) {
		setTimeout(function() {
			var popover = this.getDefaultPopoverSettings(customSettings.key);
			popover.content = popoverContents[customSettings.key];
			popover.placement = customSettings.placement || popover.placement;
			popover.container = customSettings.container || popover.container;

			var $element = $(elementId);
			$element.popover(popover);
			$element.popover('show');

			$('.popover').off('click').on('click', function(e) {
				$(this).popover('destroy'); // prevent event for bubbling up => will not get caught with
			});

			if (customSettings.autoHide) {
				setTimeout(function() {
					$element.popover('destroy');
				}, 15000);
			}
		}.bind(this), 500);
	};

	this.setCacheAndCoreEeventHandlers = function(EventHandler, Cache) {
		this.collectionCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec'));
		this.pinnedCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec-pinned'));
		this.stateCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('state'));
		this.coreEventHandler = new EventHandler();
	};

	this.serverUrl = "https://www.wearecurio.us";

	this.width = window.innerWidth;
	this.height = window.innerHeight;

	this.viewsWithoutSearchIcon = ['EditProfileView', 'LoginView', 'RegisterView', 'AdvancedTagsView', 'SearchView',
		'ForgotPasswordView', 'HelpContentsView', 'CreateTagHelpView', 'HelpContentsView', 'RepeatAlertTagsHelpView',
		'ShareHelpView', 'MakeChartHelpView', 'TermsView', 'DiscussionDetailView', 'CreateSprintHelpView', 'AddDiscussionHelpView',
		'ManageCuriositiesHelpView', 'SprintFormView', 'ExternalDevicesHelpView', 'PeopleDetailView'
	];

	this.setAppView = function(appView) {
		this.appView = appView;
	};

	this.getNotificationCount = function() {
		return this.totalNotificationCount;
	};

	this.setNotificationCount = function(totalNotificationCount) {
		this.totalNotificationCount = totalNotificationCount;
	};
};
