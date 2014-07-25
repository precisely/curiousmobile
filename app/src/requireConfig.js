/*globals require*/
require.config({
    shim: {

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
        fontawesome: '../lib/fontawesome/fonts/*'
    },
    packages: [

    ]
});
require(['main']);
