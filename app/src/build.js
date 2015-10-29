({
    appDir: '../',
    baseUrl: './src',
    dir: '../../dist',
    modules: [
        {
            name: 'main'
        }
    ],
    fileExclusionRegExp: /^(r|build)\.js$/,
    optimizeCss: 'standard',
    removeCombined: true,
    paths: {
		famous: '../lib/famous/src',
		requirejs: '../lib/requirejs/require',
		almond: '../lib/almond/almond',
		angularjs: '../lib/angularjs/angular',
		'angular-resource': '../lib/angular-resource/angular-resource',
		backbone: '../lib/backbone/backbone',
		underscore: '../lib/underscore/underscore',
		exoskeleton: '../lib/exoskeleton/exoskeleton',
		fontawesome: '../lib/fontawesome/fonts/*',
		store: '../lib/store.js/store',
		text: '../lib/text/text',
		jstzdetect: '../lib/jstzdetect/jstz.min',
		jscache: '../lib/jscache/cache',
		'exoskeleton.localStorage': '../lib/exoskeleton.localStorage/backbone.localStorage',
		bootstrap: '../lib/bootstrap/dist/js/bootstrap'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        backboneLocalstorage: {
            deps: ['backbone'],
            exports: 'Store'
        }
    }
})
