/*** main.js ***/

//main.js

define(function(require, exports, module) {
	var Engine = require('famous/core/Engine');
	var Cache = require('jscache');
	var AppView = require('views/AppView');
	//var AppView = require('views/AppView');

	var collectionCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec'));

	var App = {};
	App.CSRF = {};
	App.CSRF.SyncTokenKeyName = "SYNCHRONIZER_TOKEN"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_KEY
	App.CSRF.SyncTokenUriName = "SYNCHRONIZER_URI"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_URI
	App.zIndex = {
		menu: 11,
		readView: 9,
		formView: 11, 
		baseHeader: 12,
		datePicker: 13,
	};

	App.collectionCache = collectionCache;

	//App.serverUrl = "http://192.168.0.106:8080";
	App.serverUrl = "http://127.0.0.1:8080";
	//App.serverUrl = "https://dev.wearecurio.us";
	var mainContext = Engine.createContext();
	window.mainContext = mainContext;
	window.App = App;
	var appView = new AppView();

	mainContext.add(appView);
});

//TODO A cleaner approach to setting template format
//
window.templateSettings = {
	interpolate: /\{\{(.+?)\}\}/g
};
