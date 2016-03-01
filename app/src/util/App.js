var App = function() {
	//var u = require('util/Utils');
	//var AppView = require('views/AppView');

	this.pages = {};
	this.CSRF = {};
	this.CSRF.SyncTokenKeyName = "SYNCHRONIZER_TOKEN"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_KEY
	this.CSRF.SyncTokenUriName = "SYNCHRONIZER_URI"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_URI

	this.zIndex = {
		menu: 1,
		readView: 16,
		feedItem: 16,
		pinned: 0,
		formView: 14,
		header: 35,
		footer: 35,
		datePicker: 23,
		autocomplete: 99,
		alertView: 999,
		contextMenu: 50,
		overlay: 20
	};

	this.setCacheAndCoreEeventHandlers = function(EventHandler, Cache) {
		this.collectionCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec'));
		this.pinnedCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec-pinned'));
		this.stateCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('state'));
		this.coreEventHandler = new EventHandler();
	};


	//this.serverUrl = "http://192.168.0.31:8080";
	//this.serverUrl = "http://192.168.1.123:8080";
	this.serverUrl = "https://www.wearecurio.us";
	//this.serverUrl = "http://192.168.0.111:8080";
	//this.serverUrl = "http://localhost:8080";
	//this.serverUrl = "http://127.0.0.1:8080";
	//this.serverUrl = "http://192.168.0.108:8080";
	//this.serverUrl = "http://192.168.1.104:8080";
	//this.serverUrl = "http://192.168.1.107:8080";
	//this.serverUrl = "http://103.17.156.129:8080";
	//this.serverUrl = "http://114.143.237.122:8080";
	//this.serverUrl = "http://219.91.208.70:8080";

	this.width = window.innerWidth;
	this.height = window.innerHeight;

	this.viewsWithoutSearchIcon = ['EditProfileView', 'LoginView', 'RegisterView', 'AdvancedTagsView', 'SearchView',
		'ForgotPasswordView', 'HelpContentsView', 'CreateTagHelpView', 'HelpContentsView', 'RepeatAlertTagsHelpView',
		'ShareHelpView', 'MakeChartHelpView', 'TermsView', 'DiscussionDetailView', 'CreateSprintHelpView', 'AddDiscussionHelpView',
		'ManageCuriositiesHelpView', 'SprintFormView', 'ExternalDevicesHelpView'
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
