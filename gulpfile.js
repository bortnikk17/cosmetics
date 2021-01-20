let preprocessor= 'sass';

const {src, dest, parallel, series, watch}= require('gulp');

const browserSync = require('browser-sync').create();

const concat = require('gulp-concat');

const uglify = require('gulp-uglify-es').default;

const sass = require('gulp-sass');

const less = require('gulp-less');

const autoprefixer = require('gulp-autoprefixer');

const cleancss = require('gulp-clean-css');

const imagemin =require('gulp-imagemin');

const newer= require('gulp-newer');

const del= require('del');

const pug= require('gulp-pug');

const cheerio= require('gulp-cheerio');

const replace= require('gulp-replace');

const sprite= require('gulp-svg-sprite');

const svgmin= require('gulp-svgmin');

function browsersync(){
    browserSync.init({
        server:{baseDir:'app/'}
    })
}

function pugs(){
    return src([
        'app/pug/index.pug',
        'app/pug/mixin.pug',
        'app/pug/modal.pug'
    ])
    .pipe(pug({
        doctype:'html',
        pretty: true
    }))
    .pipe(dest('app/'))
    .pipe(browserSync.stream())
}

function scripts(){
    return src([
        'node_modules/jquery/dist/jquery.min.js',
        'app/js/swiper-bundle.min.js',
        'app/js/app.js'
    ])
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js/'))
    .pipe(browserSync.stream())
}

function styles(){
    return src('app/' + preprocessor + '/main.scss')
    .pipe(eval(preprocessor)())
    .pipe(concat('app.min.css'))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid:true}))
    .pipe(cleancss(({level:{1:{specialComments: 0}}})))
    .pipe(dest('app/css/'))
    .pipe(browserSync.stream())
}

function images(){
    return src('app/images/src/**/*')
    .pipe(newer('app/images/dest/'))
    .pipe(imagemin())
    .pipe(dest('app/images/dest/'))
}

function svg(){
return src('app/images/svg/*.svg')
	// minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill, style and stroke declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
			},
			parserOptions: {xmlMode: true}
		}))
		// cheerio plugin create unnecessary string '&gt;', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(sprite({
			mode: {
				symbol: {
					sprite: "sprite.svg"
				}
			}
		}))
		.pipe(dest('app/images/svg/'))
        .pipe(browserSync.stream())
}

function buildcopy(){
    return src([
        'app/css/**/*.min.css',
        'app/js/**/*.min.js',
        'app/images/dest/**/*',
        'app/**/*.html',
        'app/images/svg/**/*.svg',
        ],{base:'app'})
    .pipe(dest('dist'));
}

function cleanimg(){
    return del('app/images/dest/**/*')
}
function cleandist(){
    return del('dist/**/*')
}

function startwatch(){
    watch('app/**/'+ preprocessor+ '/**/*', styles);
    watch(['app/**/*.js','!app/**/*.min.js'], scripts);
    watch('app/pug/*.pug',pugs);
    watch('app/images/**/*', images);
    watch('app/images/svg/*.svg',svg);
    watch('app/**/*.html').on('change', browserSync.reload);
    
}

exports.browsersync= browsersync;
exports.scripts= scripts;
exports.pugs= pugs;
exports.styles= styles;
exports.images= images;
exports.svg= svg;
exports.cleanimg= cleanimg;
exports.build = series(cleandist, styles,scripts,images,buildcopy);
exports.default= parallel(pugs, svg, styles, scripts, browsersync, startwatch);