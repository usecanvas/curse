'use strict';

var es        = require('event-stream');
var gulp      = require('gulp');
var rename    = require('gulp-rename');
var to5       = require('gulp-6to5');
var transpile = require('gulp-es6-module-transpiler');
var uglify    = require('gulp-uglify');

gulp.task('default', function gulpTo5() {
  var amd = gulp.src('lib/curse.js')
    .pipe(transpile({ type: 'amd' }))
    .pipe(to5({ blacklist: ['modules', 'generators', 'useStrict'] }))
    .pipe(rename({ extname: '.amd.js' }))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('dist'));

  var globals = gulp.src('lib/curse.js')
    .pipe(transpile({ type: 'globals' }))
    .pipe(to5({ blacklist: ['modules', 'generators', 'useStrict'] }))
    .pipe(gulp.dest('dist'))
    .pipe(gulp.dest('examples'))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('dist'));

  return es.concat(amd, globals);
});

gulp.task('watch', function() {
  gulp.watch('lib/curse.js', ['default']);
  gulp.watch('test/**/*', ['default']);
});
