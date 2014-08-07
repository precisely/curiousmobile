/*** main.js ***/

//main.js

define(function(require, exports, module) {
	var Engine = require('famous/core/Engine');
	var AppView = require('views/AppView');
	//var AppView = require('views/AppView');

	var App = {};
	App.CSRF = {};
	App.CSRF.SyncTokenKeyName = "SYNCHRONIZER_TOKEN"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_KEY
	App.CSRF.SyncTokenUriName = "SYNCHRONIZER_URI"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_URI
	window.App = App;

	App.serverUrl = "http://192.168.0.31:8080";
	//App.serverUrl = "https://dev.wearecurio.us";
	var mainContext = Engine.createContext();
	window.mainContext = mainContext;
	var appView = new AppView();

	mainContext.add(appView);
});

//TODO A cleaner approach to setting template format
//
window.templateSettings = {
	interpolate: /\{\{(.+?)\}\}/g
};
