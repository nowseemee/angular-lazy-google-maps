(function() {
    'use strict';

    module.exports = function(config){
        config.set({

            basePath: './',

            files: [
                'bower_components/angular/angular.js',
                'bower_components/angular-mocks/angular-mocks.js',
                'src/**/*.js',
                'src/**/*.html'
            ],

            preprocessors: {
                'src/**/*.html': ['ng-html2js']
            },

            ngHtml2JsPreprocessor: {
                stripPrefix: 'src/',
                moduleName: 'templates'
            },

            autoWatch: true,

            frameworks: ['jasmine'],

            browsers: ['Chrome'],

            plugins: [
                'karma-chrome-launcher',
                'karma-firefox-launcher',
                'karma-jasmine',
                'karma-junit-reporter',
                'karma-ng-html2js-preprocessor'
            ],

            junitReporter: {
                outputFile: 'test_out/unit.xml',
                suite: 'unit'
            }

        });
    };

})();
