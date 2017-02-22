const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const browserify = require('gulp-browserify');

gulp.task('default', () => {
  return gulp.src('client/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel({
      "presets": [ "es2015" ]
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/tmp'))
    .on('end', () => {
        gulp.src('dist/tmp/*.js')
        .pipe(browserify({debug: true}))
        .pipe(gulp.dest('dist/ready'));
    }).on('end', () => gulp.src('client/*.html').pipe(gulp.dest('dist/ready')))
    .on('end', () => gulp.src('client/css/style.css').pipe(gulp.dest('dist/ready')));
});
