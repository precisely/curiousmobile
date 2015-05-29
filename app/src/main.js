/*** main.js ***/

//main.js

var App = {};
App.pages = {};
App.CSRF = {};
require.config({
	baseUrl: './src/'
});
function onLoad() {
	document.addEventListener("deviceready", onDeviceReady, false);
	document.addEventListener("resume", onAppResume, false);
	document.addEventListener("pause", function() {
		App.coreEventHandler.emit('app-paused');
	}, false);
}

// Cordova is loaded and it is now safe to make calls Cordova methods
//
function onDeviceReady() {
	// Now safe to use the Cordova API
	console.log('index.html:56 Device Ready');
	StatusBar.hide();
	cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	document.getElementById('reloading').style.display = "none";
}

function onAppResume() {
	console.log('App has resumed from background');
	console.log(device.platform);
	App.coreEventHandler.emit('app-resume');
}

define(function(require, exports, module) {
	var App = window.App;
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
		autocomplete: 99,
		alertView: 999,
		contextMenu: 30,
	};
	var Engine = require('famous/core/Engine');
	var Cache = require('jscache');
	var TouchSync = require("famous/inputs/TouchSync");
	var FastClick = require('famous/inputs/FastClick');
	var u = require('util/Utils');
	var AppView = require('views/AppView');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var EventHandler = require('famous/core/EventHandler');
	//var AppView = require('views/AppView');

	var collectionCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec'));
	var pinnedCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('ec-pinned'));
	var stateCache = new Cache(1000, true, new Cache.LocalStorageCacheStorage('state'));
	var start = 0;
	var update = 0;
	var end = 0;
	var delta = [0, 0];
	var position = [0, 0];


	App.coreEventHandler = new EventHandler();
	App.collectionCache = collectionCache;
	App.pinnedCache = pinnedCache;
	App.stateCache = stateCache;
	//App.serverUrl = "http://192.168.0.31:8080";
	//App.serverUrl = "http://192.168.0.111:8080";
	App.serverUrl = "http://dev.wearecurio.us";
	//App.serverUrl = "http://127.0.0.1:8080";
	//App.serverUrl = "http://192.168.0.108:8080";
	Engine.setOptions({
		containerClass: 'app-container'
	});
	var mainContext = Engine.createContext();
	window.mainContext = mainContext;
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

	var touchSync = new TouchSync(function() {
		return position;
	});

	touchSync.on('start', function(data) {
		start = Date.now();
	});

	touchSync.on('end', function(data) {
		var movementY = Math.abs(data.position[1]);
		// Don't show context menu if there is intent to move something
		if (movementY > 80 &&  App.pageView.getCurrentPage() === 'TrackView') {
			console.log('main.js: ', ' movementy: ', movementY);
			App.coreEventHandler.emit('refresh-entries');
		}
	});

	Engine.pipe(touchSync);
	module.exports = App;
});

//TODO A cleaner approach to setting template format
//
window.templateSettings = {
	evaluate: /\{\{(.+?)\}\}/g,
	interpolate: /\{\{=(.+?)\}\}/g
};

window.ElementType = {
	surface: 1,
	domElement: 2
}
