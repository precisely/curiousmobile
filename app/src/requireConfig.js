/*globals require*/
require.config({
	urlArgs: "ver=4",
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
		jquery: '../lib/jquery/dist/jquery',
		famous: '../lib/famous/src',
		requirejs: '../lib/requirejs/require',
		almond: '../lib/almond/almond',
		backbone: '../lib/backbone/backbone',
		underscore: '../lib/underscore/underscore',
		exoskeleton: '../lib/exoskeleton/exoskeleton',
		fontawesome: '../lib/fontawesome/fonts/*',
		store: '../lib/store.js/store',
		text: '../lib/text/text',
		jstzdetect: '../lib/jstzdetect/jstz.min',
		jscache: '../lib/jscache/cache',
		'exoskeleton.localStorage': '../lib/exoskeleton.localStorage/backbone.localStorage',
		bootstrap: '../lib/bootstrap/dist/js/bootstrap',
		Entry: './models/Entry',
		'angular-resource': '../lib/angular-resource/angular-resource',
		angularjs: '../lib/angularjs/angular',
		'famous-flex': '../lib/famous-flex/src'
	},
	packages: [

	]
});
require(['jquery', 'main']);
