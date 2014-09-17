/*globals require*/
require.config({
	shim: {
		exoskeleton: {
			deps: [
				'underscore'
			],
			exports: 'Backbone'
		}
	},
	paths: {
		famous: '../lib/famous',
		requirejs: '../lib/requirejs/require',
		almond: '../lib/almond/almond',
		angularjs: '../lib/angularjs/angular',
		'angular-resource': '../lib/angular-resource/angular-resource',
		backbone: '../lib/backbone/backbone',
		underscore: '../lib/underscore/underscore',
		exoskeleton: '../lib/exoskeleton/exoskeleton',
		jquery: '../lib/jquery/dist/jquery',
		fontawesome: '../lib/fontawesome/fonts/*',
		store: '../lib/store.js/store',
		text: '../lib/text',
		jstzdetect: '../lib/jstzdetect/jstz.min',
		jscache: '../lib/jscache/cache',
		'exoskeleton.localStorage': '../lib/exoskeleton.localStorage/backbone.localStorage'
	},
	packages: [

	]
});
require(['main']);
