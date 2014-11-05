'use strict';

var gulp = require('gulp');

gulp.task('copy-example', function() {
  gulp.src('lib/curse.js')
    .pipe(gulp.dest('examples'));
});

gulp.task('watch', function() {
  gulp.watch('lib/curse.js', ['copy-example']);
});
