'use strict';

// adopted from https://github.com/paislee/healthy-gulp-angular

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var es = require('event-stream');
var bowerFiles = require('main-bower-files');
var Q = require('q');

var paths = {
    scripts: ['./src/**/*.js', '!./src/**/*.spec.js'],
    styles: ['./src/**/*.css', './src/**/*.scss'],
    images: ['./src/images/images/*'],
    index: './src/index.html',
    partials: ['./src/**/*.html', '!./src/index.html'],
    distDev: './dev',
    distdist: './dist',
    distScriptsdist: './dist',
    scriptsDevServer: 'devServer/**/*.js',
    testFiles: './src/**/*.spec.js'
};

var pipes = {};

pipes.orderedVendorScripts = function() {
    return plugins.order(['angular.js', 'angular-ui-router.js', 'lodash.js']);
};

pipes.orderedAppScripts = function() {
    return plugins.angularFilesort();
};

pipes.minifiedFileName = function() {
    return plugins.rename(function (path) {
        path.extname = '.min' + path.extname;
    });
};

pipes.validatedAppScripts = function() {
    return gulp.src(paths.scripts)
        .pipe(plugins.eslint())
        .pipe(plugins.eslint.format())
        .pipe(plugins.jscs());
};

pipes.testedAppScripts = function() {
    var karmaConf = {
        configFile: 'karma.conf.js',
        action: 'run'
    };
    gulp.src('./foo')
        .pipe(plugins.karma(karmaConf).on('error', function(err) {
            del(paths.distdist);
            throw err;
        }));
    return pipes.validatedAppScripts();
};

pipes.builtAppScriptsDev = function() {
    return pipes.validatedAppScripts()
        .pipe(gulp.dest(paths.distDev));
};

pipes.builtAppScriptsDist = function() {
    var scriptedPartials = pipes.scriptedPartials();
    var validatedAppScripts = pipes.testedAppScripts();

    return es.merge(scriptedPartials, validatedAppScripts)
        .pipe(plugins.ngAnnotate())
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('lazyGoogleMaps.min.js'))
        .pipe(plugins.uglify())
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest(paths.distScriptsdist));
};

pipes.builtVendorScriptsDev = function() {
    return gulp.src(bowerFiles())
        .pipe(gulp.dest('dev/bower_components'));
};

pipes.builtVendorScriptsDist = function() {
    return gulp.src(bowerFiles())
        .pipe(pipes.orderedVendorScripts())
        .pipe(plugins.ngAnnotate())
        .pipe(plugins.concat('vendor.min.js'))
        .pipe(plugins.uglify())
        .pipe(gulp.dest(paths.distScriptsdist));
};

pipes.validatedDevServerScripts = function() {
    return gulp.src(paths.scriptsDevServer)
        .pipe(plugins.eslint())
        .pipe(plugins.eslint.format())
        .pipe(plugins.jscs());
};

pipes.validatedPartials = function() {
    return gulp.src(paths.partials)
        .pipe(plugins.htmlhint({'doctype-first': false}))
        .pipe(plugins.htmlhint.reporter());
};

pipes.builtPartialsDev = function() {
    return pipes.validatedPartials()
        .pipe(gulp.dest(paths.distDev));
};

pipes.scriptedPartials = function() {
    return pipes.validatedPartials()
        .pipe(plugins.htmlhint.failReporter())
        .pipe(plugins.htmlmin({collapseWhitespace: true, removeComments: true}))
        .pipe(plugins.ngHtml2js({
            moduleName: 'lazyGoogleMaps'
        }));
};

pipes.builtStylesDev = function() {
    return gulp.src(paths.styles)
        .pipe(plugins.sass())
        .pipe(gulp.dest(paths.distDev));
};

pipes.builtStylesDist = function() {
    return gulp.src(paths.styles)
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.sass())
        .pipe(plugins.minifyCss())
        .pipe(plugins.sourcemaps.write())
        .pipe(pipes.minifiedFileName())
        .pipe(gulp.dest(paths.distdist));
};

pipes.processedImagesDev = function() {
    return gulp.src(paths.images)
        .pipe(gulp.dest(paths.distDev + '/images/'));
};

pipes.processedImagesdist = function() {
    return gulp.src(paths.images)
        .pipe(gulp.dest(paths.distdist + '/images/'));
};

pipes.validatedIndex = function() {
    return gulp.src(paths.index)
        .pipe(plugins.htmlhint())
        .pipe(plugins.htmlhint.reporter());
};

pipes.builtIndexDev = function() {

    var orderedVendorScripts = pipes.builtVendorScriptsDev()
        .pipe(pipes.orderedVendorScripts());

    var orderedAppScripts = pipes.builtAppScriptsDev()
        .pipe(pipes.orderedAppScripts());

    var appStyles = pipes.builtStylesDev();

    return pipes.validatedIndex()
        .pipe(gulp.dest(paths.distDev)) // write first to get relative path for inject
        .pipe(plugins.inject(orderedVendorScripts, {relative: true, name: 'bower'}))
        .pipe(plugins.inject(orderedAppScripts, {relative: true}))
        .pipe(plugins.inject(appStyles, {relative: true}))
        .pipe(gulp.dest(paths.distDev));
};

pipes.builtIndexdist = function() {

    var vendorScripts = pipes.builtVendorScriptsDist();
    var appStyles = pipes.builtStylesDist();
    var appScripts = pipes.builtAppScriptsDist();

    return pipes.validatedIndex()
        .pipe(gulp.dest(paths.distdist)) // write first to get relative path for inject
        .pipe(plugins.inject(vendorScripts, {relative: true, name: 'bower'}))
        .pipe(plugins.inject(appStyles, {relative: true}))
        .pipe(plugins.inject(appScripts, {relative: true}))
        .pipe(plugins.htmlmin({collapseWhitespace: true, removeComments: true}))
        .pipe(gulp.dest(paths.distdist));
};

pipes.builtAppDev = function() {
    return es.merge(pipes.builtIndexDev(), pipes.builtPartialsDev(), pipes.processedImagesDev());
};

pipes.builtAppdist = function() {
    return es.merge(pipes.builtIndexdist(), pipes.processedImagesdist());
};

// == TASKS ========

// removes all compiled dev files
gulp.task('clean-dev', function() {
    var deferred = Q.defer();
    del(paths.distDev, function() {
        deferred.resolve();
    });
    return deferred.promise;
});

// removes all compiled distuction files
gulp.task('clean-dist', function() {
    var deferred = Q.defer();
    del(paths.distdist, function() {
        deferred.resolve();
    });
    return deferred.promise;
});

// checks html source files for syntax errors
gulp.task('validate-partials', pipes.validatedPartials);

// checks index.html for syntax errors
gulp.task('validate-index', pipes.validatedIndex);

// moves html source files into the dev environment
gulp.task('build-partials-dev', pipes.builtPartialsDev);

// converts partials to javascript using html2js
gulp.task('convert-partials-to-js', pipes.scriptedPartials);

// runs jshint on the dev server scripts
gulp.task('validate-devserver-scripts', pipes.validatedDevServerScripts);

// runs jscs, eslint on the app scripts
gulp.task('validate-app-scripts', pipes.validatedAppScripts);

// runs karma tests on the app scripts
gulp.task('test-app-scripts', pipes.testedAppScripts);

// moves app scripts into the dev environment
gulp.task('build-app-scripts-dev', pipes.builtAppScriptsDev);

// concatenates, uglifies, and moves app scripts and partials into the dist environment
gulp.task('build-app-scripts-dist', pipes.builtAppScriptsDist);

// compiles app sass and moves to the dev environment
gulp.task('build-styles-dev', pipes.builtStylesDev);

// compiles and minifies app sass to css and moves to the dist environment
gulp.task('build-styles-dist', pipes.builtStylesDist);

// moves vendor scripts into the dev environment
gulp.task('build-vendor-scripts-dev', pipes.builtVendorScriptsDev);

// concatenates, uglifies, and moves vendor scripts into the dist environment
gulp.task('build-vendor-scripts-dist', pipes.builtVendorScriptsDist);

// validates and injects sources into index.html and moves it to the dev environment
gulp.task('build-index-dev', pipes.builtIndexDev);

// validates and injects sources into index.html, minifies and moves it to the dev environment
gulp.task('build-index-dist', pipes.builtIndexdist);

// builds a complete dev environment
gulp.task('build-app-dev', pipes.builtAppDev);

// builds a complete dist environment
gulp.task('build-app-dist', pipes.builtAppdist);

// cleans and builds a complete dev environment
gulp.task('clean-build-app-dev', ['clean-dev'], pipes.builtAppDev);

// cleans and builds a complete dist environment
gulp.task('clean-build-app-dist', ['clean-dist'], pipes.builtAppdist);

// clean, build, and watch live changes to the dev environment
gulp.task('watch-dev', ['clean-build-app-dev', 'validate-devserver-scripts'], function() {

    // start nodemon to auto-reload the dev server
    plugins.nodemon({ script: 'server.js', ext: 'js', env: {NODE_ENV: 'development'} })
        .on('change', ['validate-devserver-scripts'])
        .on('restart', function () {
            console.log('[nodemon] restarted dev server');
        });

    // start live-reload server
    plugins.livereload.listen({ start: true });

    // watch index
    gulp.watch(paths.index, function() {
        return pipes.builtIndexDev()
            .pipe(plugins.livereload());
    });

    // watch app scripts
    gulp.watch(paths.scripts, function() {
        return pipes.builtAppScriptsDev()
            .pipe(plugins.livereload());
    });

    // watch html partials
    gulp.watch(paths.partials, function() {
        return pipes.builtPartialsDev()
            .pipe(plugins.livereload());
    });

    // watch styles
    gulp.watch(paths.styles, function() {
        return pipes.builtStylesDev()
            .pipe(plugins.livereload());
    });

});

// clean, build, and watch live changes to the dist environment
gulp.task('watch-dist', ['clean-build-app-dist', 'validate-devserver-scripts'], function() {

    // start nodemon to auto-reload the dev server
    plugins.nodemon({ script: 'server.js', ext: 'js', watch: ['devServer/'], env: {NODE_ENV: 'distuction'} })
        .on('change', ['validate-devserver-scripts'])
        .on('restart', function () {
            console.log('[nodemon] restarted dev server');
        });

    // start live-reload server
    plugins.livereload.listen({start: true});

    // watch index
    gulp.watch(paths.index, function() {
        return pipes.builtIndexdist()
            .pipe(plugins.livereload());
    });

    // watch app scripts
    gulp.watch(paths.scripts, function() {
        return pipes.builtAppScriptsDist()
            .pipe(plugins.livereload());
    });

    // watch hhtml partials
    gulp.watch(paths.partials, function() {
        return pipes.builtAppScriptsDist()
            .pipe(plugins.livereload());
    });

    // watch styles
    gulp.watch(paths.styles, function() {
        return pipes.builtStylesDist()
            .pipe(plugins.livereload());
    });

});

// default task builds for dist
gulp.task('default', ['clean-build-app-dist', 'clean-build-app-dev']);
