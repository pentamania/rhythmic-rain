const gulp = require("gulp"),
      concat = require("gulp-concat"),
      del = require('del'),
      UglifyJS = require("uglify-js"),
      pleeease = require('pleeease'),
      fs = require('fs')
;
// todo...
const pathOpts = {
  srcLess: "./src/less",
  destCSS: "./dist/style.css",
  srcJS: "./src/scripts",
  tmpJS: "./tmp/all.js",
  destJS: "./dist/all.min.js",
};


gulp.task('clean', (cb)=> {
  return del(['./tmp/**/*', './dist/**/*'], cb)
});

// css ==============================
gulp.task('css:compile', (cb)=> {
  // 環境で変える？
  const opt = {
    less: {
      paths: [pathOpts.srcLess]
    },
    sourcemaps: false,
    // "browsers": ["last 3 versions", "Android 2.3"],
    // 'minifier': false,
  };
  const srcScript = fs.readFileSync(pathOpts.srcLess+"/style.less", "utf8");

  pleeease.process(srcScript, opt)
  .then(function(output) {
    fs.writeFileSync(pathOpts.destCSS, output, "utf8");
    cb();
  })
  .catch(function(err) {
    cb(err);
  });
})
gulp.task('css:watch', (cb)=> {
  return gulp.watch('./src/less/*.less', ['css:compile']);
})

// js ==============================
gulp.task('js:concat', (cb)=> {
  return gulp.src([
    'src/scripts/lib/*.js',
    'src/scripts/constants.js',
    'src/scripts/*.js',
    'src/main.js',
  ])
  .pipe(concat('all.js'))
  .pipe(gulp.dest('tmp'));
});
gulp.task('js:minify', ['js:concat'], (cb)=> {
  const options = {
    output: {
      comments: /^!/, // "/*! ... */"などビックリマークで始まるコメントを残す
      // comments: "some", // @liceneseなどを残す
    },
  };
  const srcScript = fs.readFileSync(pathOpts.tmpJS, "utf8");
  const minified = UglifyJS.minify(srcScript, options).code;
  if (minified != null) {
    fs.writeFileSync(pathOpts.destJS, minified, "utf8");
  } else {
    throw new Error('some error..')
  }
  cb();
})

gulp.task('js:watch', (cb)=> {
  return gulp.watch(pathOpt.srcJS+'/*.js', ['js:minify']);
})


// html ==============================
gulp.task('html:copy', (cb)=> {
  return gulp.src(['src/*.html'])
  .pipe(gulp.dest('dist/'));
})
// gulp.task('html:watch', (cb)=> {
//   return gulp.watch('src/*.html', ['html:copy'])
// })


// その他アセット類 ==============================

gulp.task('image:copy', (cb)=> {
  return gulp.src(['src/assets/images/*.*'])
  .pipe(gulp.dest('dist/assets/images'));
})
gulp.task('sound:copy', (cb)=> {
  return gulp.src(['src/assets/sounds/*.*'])
  .pipe(gulp.dest('dist/assets/sounds'));
})
// まとめて
gulp.task('asset:copy', ['image:copy', 'sound:copy'], (cb)=> {
  console.log('copying assets...')
  cb();
})

