/*globals require*/
require.config({
    shim: {

    },
    paths: {
        famous: '../lib/famous',
        requirejs: '../lib/requirejs/require',
        almond: '../lib/almond/almond',
        angularjs: '../lib/angularjs/angular',
        'angular-resource': '../lib/angular-resource/angular-resource'
    },
    packages: [

    ]
});
require(['main']);
