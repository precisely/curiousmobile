/*globals require*/
require.config({
	shim: {
		exoskeleton: {
			deps: [
				'underscore'
			],
			exports: 'Backbone'
		},
		underscore: {
			exports: '_',
			init: function () {
		this._.extend(this._.templateSettings, {
			interpolate: /\{\{(.+?)\}\}/g
		});
		return this._;
	}
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
		text: '../lib/text/text',
		jstzdetect: '../lib/jstzdetect/jstz.min',
		jscache: '../lib/jscache/cache',
		'exoskeleton.localStorage': '../lib/exoskeleton.localStorage/backbone.localStorage',
		bootstrap: '../lib/bootstrap/dist/js/bootstrap'
	},
	packages: [

	]
});
require(['main']);
