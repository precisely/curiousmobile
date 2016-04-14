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
		contextMenu: 50,
		overlay: 20
	};
	
	// Global popover contents, so that any popover content can be changed here without visiting any views.
	var popoverContents = {
		entryAdded: 'Tap to edit',
		bookmarkAdded: 'Bookmark added here, tap to track it!',
		setAlert: 'An alert will pop up at the time of this entry to remind you to track this',
		bookmarksPresent: 'Tap a bookmark to track it',
		createBookmark: 'Create a bookmark for one-tap tracking',
		sprintMenu: 'Ideas for activities to do with <br>We Are Curious!',
		shareChart: 'Tap here to share',
		enterTag: 'Enter tag here to track'
	};
	
	//Global popover settings applied to every popup in the app. 
	var popoverSettings = {
		placement: 'top',
		html: true,
		container: 'body',
		template: '<div class="popover" role="tooltip"><div class="arrow"><div class="vline"></div></div><h3 class="popover-title">' +
				'</h3><div class="popover-content"></div></div>'
	};
	
	// Show popover with specific content.
	this.showPopover = function(elementId, key) {
		setTimeout(function() {
			var popover = popoverSettings;
			popover.content = popoverContents[key];
			$(elementId).popover(popover);
			$(elementId).popover('show');

			setTimeout(function() {
				$(elementId).popover('destroy');
			}, 3000)
		}, 500);
	};
	
	// Get popover with content.
	this.getPopover = function(key) {
		var popover = popoverSettings;
		popover.content = popoverContents[key];
		
		return popover;
	};

	this.setCacheAndCoreEeventHandlers = function(EventHandler, Cache) {
		this.collectionCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec'));
		this.pinnedCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec-pinned'));
		this.stateCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('state'));
		this.coreEventHandler = new EventHandler();
	};

	//this.serverUrl = "http://192.168.0.31:8080";
	//this.serverUrl = "http://192.168.1.123:8080";
	//this.serverUrl = "https://www.wearecurio.us";
	//this.serverUrl = "http://192.168.0.111:8080";
	//this.serverUrl = "http://localhost:8080";
	//this.serverUrl = "http://127.0.0.1:8080";
	//this.serverUrl = "http://192.168.0.108:8080";
	this.serverUrl = "http://192.168.1.141:8080";
	//this.serverUrl = "http://192.168.1.107:8080";
	//this.serverUrl = "http://103.17.156.129:8080";
	//this.serverUrl = "http://114.143.237.122:8080";
	//this.serverUrl = "http://219.91.208.70:8080";

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
