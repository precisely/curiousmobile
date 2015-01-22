/*** main.js ***/

//main.js

define(function(require, exports, module) {
	var Engine = require('famous/core/Engine');
	var Cache = require('jscache');
	var AppView = require('views/AppView');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	//var AppView = require('views/AppView');

	var collectionCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec'));
	var pinnedCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec-pinned'));

	var App = {};
	App.CSRF = {};
	App.CSRF.SyncTokenKeyName = "SYNCHRONIZER_TOKEN"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_KEY
	App.CSRF.SyncTokenUriName = "SYNCHRONIZER_URI"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_URI
	App.zIndex = {
		menu: 12,
		readView: 16,
		feedItem: 16,
		pinned: 22,
		formView: 14, 
		header: 21,
		footer: 21,
		datePicker: 22,
		alertView: 999,
		contextMenu: 30,
	};

	App.collectionCache = collectionCache;
	App.pinnedCache = pinnedCache;
	//App.serverUrl = "http://192.168.0.31:8080";
	//App.serverUrl = "http://192.168.0.111:8080";
	//App.serverUrl = "http://dev.wearecurio.us";
	//App.serverUrl = "http://127.0.0.1:8080";
	App.serverUrl = "http://192.168.0.108:8080";
	Engine.setOptions({containerClass: 'app-container'});
	var mainContext = Engine.createContext();
	window.mainContext = mainContext;
	window.App = App;
	window.App.width = window.innerWidth;
	window.App.height = window.innerHeight;
	var appView = new AppView();
	window.App.appView = appView;
	var mod = new Modifier({
		size: [window.App.width, window.App.height],
		origin: [0, 0],
		align: [0, 0]
	});
	mainContext.add(mod).add(appView);
	module.exports = App;
});

//TODO A cleaner approach to setting template format
//
window.templateSettings = {
	interpolate: /\{\{(.+?)\}\}/g
};
