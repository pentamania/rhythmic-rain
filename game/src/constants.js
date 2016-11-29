
/* 定数 */
;(function(window){
    var DEBUG_MODE = false;
    // 画面描画用パラメータ
    var SCREEN_WIDTH = (window.innerWidth > 640) ? 640 : window.innerWidth * 0.9;
    var RATIO = SCREEN_WIDTH / 640; //640よりも小さい画面の場合に縮小比を保持
    var SCREEN_HEIGHT = Math.round(SCREEN_WIDTH/16 * 9); // 比率16:9 == 640:360
    var NOTE_LIST = null;
    var FPS = 60;

    // 画面描画用パラメータ
    var GRID_NUM = 14; // 画面幅の分割数
    var NOTE_WIDTH = (SCREEN_WIDTH / GRID_NUM) * 0.8; // ノーツの幅：画面サイズで変える？
    var NOTE_HEIGHT = 6 * RATIO;

    var NOTE_POS_SPAN = Math.round(SCREEN_WIDTH / GRID_NUM);
    // var NOTE_POSITIONS = [NOTE_POS_SPAN*3, NOTE_POS_SPAN*4, NOTE_POS_SPAN*5, NOTE_POS_SPAN*6];
    var NOTE_POSITIONS = createSpanArray(NOTE_POS_SPAN, 4, 8);
    var NOTE_POSITIONS_LEN = NOTE_POSITIONS.length;
    var NOTE_SPEED_RANGE = {
        max: 5,
        min: 0
    };

    // 色
    var NOTE_COLOR = "rgb(139, 236, 242)";
    var LONG_NOTE_COLOR = "rgb(77, 60, 212)";
    var WATER_COLOR = "#125779";
    var EFFECT_COLOR = NOTE_COLOR;
    // var EFFECT_COLOR = "rgba(152, 171, 236, 1)";
    var THEME_COLOR = {
        morning: "rgb(249, 250, 207)",
        daytime: "#B9F5EF",
        night: "rgb(0, 0, 0)"
    };
    var FILTER_COLOR = "rgba(164, 146, 146, 0.59)";
    // レパートリー背景
    var DEFAULT_COLOR = 'rgb(60, 100, 214)';
    var ACTIVE_COLOR = 'rgb(161, 182, 241)';
    var DEFAULT_OPACITY = 0.5;

    // アセット位置
    var JUDGE_LINE_Y = SCREEN_HEIGHT * 0.7 | 0; //
    var NOTE_DEST_Y = JUDGE_LINE_Y - NOTE_HEIGHT * 0.5; // ノーツ最終位置Y
    var EFFECT_HEIGHT = JUDGE_LINE_Y * 0.4; // エフェクトの高さ

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

    // 判定範囲（sec）
    var RATING = {
        out: 0.13,
        good: 0.10,
        nice: 0.05,
        great: 0.03
    };
    // 加点設定
    var SCORE = {
        // hold: 10,
        good: 10,
        nice: 50,
        great: 100
    };

    // path
    var SOUND_ASSETS = {
        clap:"./assets/sounds/clap.mp3",
        conga: "./assets/sounds/conga.mp3"
    };
    var IMAGE_ASSETS = {
        streetLight: "./assets/images/streetLight2.png",
        girl: "./assets/images/girl.png",
    }
    var MUSIC_LIST_PATH = '../data/music_list.json';
    var DATA_PATH = "../data/";
}(window));