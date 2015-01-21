/* jshint node: true */

'use strict';

var gulp = require('gulp');
var bify = require('gulp-browserify');

require('6to5ify');

gulp.task('build', function build() {
  return gulp.src(['src/curse.js'])
    .pipe(bify({ transform: ['6to5ify'], standalone: 'Curse' }))
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-example', ['build'], function copyExample() {
  gulp.src('dist/curse.js')
    .pipe(gulp.dest('examples'));
});

gulp.task('watch', function() {
  gulp.watch('src/curse.js', ['copy-example']);
});
