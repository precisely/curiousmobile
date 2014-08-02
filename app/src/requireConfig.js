/*globals require*/
require.config({
	shim: {
		'exoskeleton': {
            //These script dependencies should be loaded before loading
            //backbone.js
            deps: ['underscore'],
            //Once loaded, use the global 'Backbone' as the
            //module value.
            exports: 'Backbone'
        },
		underscore: {
			exports: '_',
			init: function() {
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
		text: '../lib/text'
	},
	packages: [

	]
});
require(['main']);
