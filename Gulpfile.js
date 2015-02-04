/* jshint node: true */

'use strict';

var browserify = require('browserify');
var buffer     = require('vinyl-buffer');
var gulp       = require('gulp');
var source     = require('vinyl-source-stream');

require('6to5ify');

gulp.task('build', function build() {
  var bundler = browserify({
    entries   : ['./src/curse.js'],
    standalone: 'Curse',
    transform : ['6to5ify']
  });

  var bundle = bundler.bundle();

  bundle
    .pipe(source('curse.js'))
    .pipe(buffer())
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-example', ['build'], function copyExample() {
  gulp.src('dist/curse.js')
    .pipe(gulp.dest('examples'));
});

gulp.task('watch', function() {
  gulp.watch('src/curse.js', ['copy-example']);
});
