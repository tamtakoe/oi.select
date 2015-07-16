var path          = require('path');
var del           = require('del');
var series        = require('stream-series');
var gulp          = require('gulp');
var rename        = require('gulp-rename');
var concat        = require('gulp-concat');
var webserver     = require('gulp-webserver');
var templateCache = require('gulp-angular-templatecache');
var minifyCss     = require('gulp-minify-css');
var minifyHtml    = require('gulp-minify-html');
var uglify        = require('gulp-uglify');
var stylus        = require('gulp-stylus');
var autoprefixer  = require('autoprefixer-stylus')({
    browsers: ["ff >= 20", "chrome >= 35", "safari >= 7", "ios >= 7", "android >= 4", "opera >= 12.1", "ie >= 10"]
});

//var runSequence     = require('run-sequence');
var through = require('through2');


var paths = {
    root:     __dirname,
    src:      path.join(__dirname, '/src'),
    template: path.join(__dirname, '/template'),
    dist:     path.join(__dirname, '/dist')
};

gulp.task('webserver', function() {
    return gulp.src(paths.root)
        .pipe(webserver({
            host: 'localhost',
            port: 3000,
            fallback: 'index.html',
            livereload: true
        }));
});

gulp.task('clean', function() {
    del.sync(paths.dist);
});

gulp.task('compileStyles', function() {
    return gulp.src(path.join(paths.template, 'select/style.styl'))
        .pipe(stylus({
            use: autoprefixer
        }))
        .pipe(concat('multiselect.css'))
        .pipe(gulp.dest(paths.dist))
        .pipe(minifyCss())
        .pipe(rename('multiselect.min.css'))
        .pipe(gulp.dest(paths.dist))
});

gulp.task('compileScripts', function() {
    var templateStream = gulp.src(path.join(paths.template, 'select/template.html'))
        .pipe(minifyHtml())
        .pipe(templateCache({
            module: 'oi.multiselect',
            root: 'template/'
        }));

    var scriptStream = gulp.src([
        path.join(paths.src, 'select/module.js'),
        path.join(paths.src, 'select/services.js'),
        path.join(paths.src, 'select/directives.js'),
        path.join(paths.src, 'select/filters.js')
    ]);

    scriptStream
        //.pipe(through.obj(function(file, enc, callback) {
        //    console.log(file);
        //    callback(null, file);
        //}))
        .pipe(concat('multiselect.js'))
        .pipe(gulp.dest(paths.dist))
        .pipe(uglify())
        .pipe(rename('multiselect.min.js'))
        .pipe(gulp.dest(paths.dist));

    series(scriptStream, templateStream)
        .pipe(concat('multiselect-tpls.js'))
        .pipe(gulp.dest(paths.dist))
        .pipe(uglify())
        .pipe(rename('multiselect-tpls.min.js'))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('watch', function() {
    gulp.watch(path.join(paths.template, '**/*.styl'), ['compileStyles']);
});

gulp.task('build', ['clean', 'compileScripts', 'compileStyles']);
gulp.task('default', ['webserver', 'watch']);




var karma = require('karma').server;

gulp.task('karma:unit', function(done) {

    karma.start({
        configFile: path.join(__dirname, 'test/karma.conf.js'),
        browsers: ['PhantomJS'],
        //reporters: ['dots'],
        singleRun: true
    }, function(code) {
        console.log('Karma has exited with ' + code);
        process.exit(code);
        done();
    });
});