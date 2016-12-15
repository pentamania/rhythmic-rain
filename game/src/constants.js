'use strict';

/* 定数 */
var DEBUG_MODE = false;
var FPS = 60;
var TWEET_MESSAGES = [
  "お父さんはいつ返ってくるんだろう...",
  "雨がビニール傘を叩くときの音が好き",
  "雨の日は落ち着く",
];

// 画面描画用パラメータ
var SCREEN_WIDTH = (window.innerWidth > 640) ? 640 : window.innerWidth * 0.9;
var RATIO = SCREEN_WIDTH / 640; //640よりも小さい画面の場合に縮小比を保持
var SCREEN_HEIGHT = Math.round(SCREEN_WIDTH/16 * 9); // 比率16:9 == 640:360

var GRID_NUM = 14; // 画面幅の分割数
var NOTE_WIDTH = (SCREEN_WIDTH / GRID_NUM) * 0.7;
var NOTE_HEIGHT = 6 * RATIO;
var RESULT_OPT_POSITION = SCREEN_HEIGHT*0.66;

var NOTE_POS_SPAN = Math.round(SCREEN_WIDTH / GRID_NUM);
// var NOTE_SPEED_RANGE = {
//   max: 5,
//   min: 0
// };

// 色
var NOTE_COLOR = "rgb(139, 236, 242)";
var LONG_NOTE_COLOR = "rgb(77, 60, 212)";
var WATER_COLOR = "#125779";
// var EFFECT_COLOR = "rgba(152, 171, 236, 1)";
// var THEME_COLOR = {
//   morning: "rgb(249, 250, 207)",
//   daytime: "#B9F5EF",
//   night: "rgb(0, 0, 0)"
// };
var FILTER_COLOR = "rgba(164, 146, 146, 0.59)";
var THEME_COLOR = {
  day: "#62bcb8",
  evening: "#e2441d",
  night: "black",
};

// レパートリー
var DEFAULT_COLOR = 'rgb(60, 100, 214)';
var ACTIVE_COLOR = 'rgb(161, 182, 241)';
var DEFAULT_OPACITY = 0.5;

// アセット位置
var JUDGE_LINE_Y = SCREEN_HEIGHT * 0.7 | 0; //
var NOTE_DEST_Y = JUDGE_LINE_Y - NOTE_HEIGHT * 0.5; // ノーツ最終位置Y
var EFFECT_HEIGHT = JUDGE_LINE_Y * 0.3; // エフェクトの高さ

var RATING_TEXT_POS_X = SCREEN_WIDTH * 0.5;
var RATING_TEXT_POS_Y = SCREEN_HEIGHT * 0.4;
var SCORE_TEXT_FONT_SIZE = 20 * RATIO;
var SCORE_TEXT_POS_X =  SCREEN_WIDTH * 0.9;
var SCORE_TEXT_POS_Y = SCORE_TEXT_FONT_SIZE * 1.25;

var PROGRESSBAR_X = 10 * RATIO;
var PROGRESSBAR_Y = 10 * RATIO;
var PROGRESSBAR_WIDTH =  SCREEN_WIDTH * 0.6 |0;
var PROGRESSBAR_HEIGHT = 8 * RATIO;

var LIGHT_POS_X = 60 * RATIO;
var LIGHT_POS_Y = 110 * RATIO;
var GIRL_POS_X = SCREEN_WIDTH * 0.75;
var GIRL_POS_Y = 75 * RATIO;

var RATING_DATA_MAP = {
  miss: {
    message: "MISS...",
    effectTime: 8,
    color: "gray",
  },
  hold: {
    effectTime: 4,
    color: "#C2FAEF",
  },
  out: {
    range: 0.13,
  },
  good: {
    range: 0.100,
    message: "GOOD",
    effectTime: 20,
    score: 10,
    color: "#7FBBCA",
    sound: "conga",
  },
  nice: {
    range: 0.054,
    message: "NICE!",
    effectTime: 20,
    score: 50,
    color: "#EA9447",
    sound: "clap"
  },
  great: {
    range: 0.032,
    message: "GREAT!!",
    effectTime: 25,
    score: 100,
    color: "#5DF3EE",
    sound: "clap"
  },
};

// paths
var SOUND_ASSETS = {
  clap:"./assets/sounds/clap.mp3",
  conga: "./assets/sounds/conga.mp3"
};
var IMAGE_ASSETS = {
  streetLight: "./assets/images/streetLight2.png",
  girl: "./assets/images/girl.png",
};
var MUSIC_LIST_PATH = '../data/music_list.json';
var DATA_PATH = "../data/";