const gulp = require("gulp"),
      concat = require("gulp-concat"),
      del = require('del'),
      exec = require('child_process').exec
;

gulp.task('clean', (cb)=> {
  return del(['./tmp/*.*'], cb)
});

gulp.task('build:css', function(cb) {
  exec('npm run build:css', function (err, stdout, stderr) {
    cb(err);
  });
})

gulp.task('js:concat:lib', function(cb) {
  return gulp.src([
    'src/assets/scripts/lib/*.js',
    'src/assets/scripts/*.js'
  ])
  .pipe(concat('lib.js'))
  .pipe(gulp.dest('tmp'));
})

// gulp.task('js:concat:all', ['js:concat:lib'], function(cb) {
//   return gulp.src([
//     'tmp/lib.js',
//     'src/*.js'
//   ])
//   .pipe(concat('all.js'))
//   .pipe(gulp.dest('tmp'));
// })

gulp.task('js:minify', ['js:concat:lib'], function(cb) {
  exec('npm run js:minify', function (err, stdout, stderr) {
    cb(err);
  });
})
