
// var Game = function(){
// };

// utils
var $id = function(id) { return document.getElementById(id); }
var createSpanArray = function(span, m, n){
    var array = [];
    for (var i = m; i < m+n; i++) {
        array.push(span * i);
    }
    return array;
}

// 定数
var SCREEN_WIDTH = (window.innerWidth > 640) ? 640 : window.innerWidth*0.9;
var RATIO = SCREEN_WIDTH/640; //640よりも小さい画面の場合に比率を保持
var SCREEN_HEIGHT = Math.round(SCREEN_WIDTH/16 * 9); // 16:9 ex> 640:360
var NOTE_LIST = null;

// 画面描画用パラメータ
var GRID_NUM = 14; //画面幅の分割数
var NOTE_WIDTH = (SCREEN_WIDTH / GRID_NUM) * 0.8; // ノーツの幅：画面サイズで変える？
var NOTE_HEIGHT = 6*RATIO;

var NOTE_POS_SPAN = SCREEN_WIDTH / GRID_NUM;
// var NOTE_POSES = [NOTE_POS_SPAN*3, NOTE_POS_SPAN*4, NOTE_POS_SPAN*5, NOTE_POS_SPAN*6];
var NOTE_POSES = createSpanArray(NOTE_POS_SPAN, 4, 8);
var NOTE_POSES_LEN = NOTE_POSES.length;

var NOTE_COLOR = "rgb(139, 236, 242)";
var LONG_NOTE_COLOR = "rgb(77, 60, 212)";
// var WATER_COLOR = "#146f9b";
var WATER_COLOR = "#125779";
var EFFECT_COLOR = NOTE_COLOR;
// var EFFECT_COLOR = "rgba(152, 171, 236, 1)";

var JUDGE_LINE_Y = Math.round(SCREEN_HEIGHT * 0.7); //
var NOTE_DEST_Y = JUDGE_LINE_Y - NOTE_HEIGHT * 0.5; // ノーツ最終位置Y
var EFFECT_HEIGHT = JUDGE_LINE_Y * 0.4; // エフェクトの高さ

var RATING_TEXT_POS_X = SCREEN_WIDTH * 0.5;
var RATING_TEXT_POS_Y = SCREEN_HEIGHT * 0.4;
var SCORE_TEXT_FONT_SIZE = 20*RATIO;
var SCORE_TEXT_POS_X =  SCREEN_WIDTH * 0.9;
var SCORE_TEXT_POS_Y = SCORE_TEXT_FONT_SIZE * 1.25;

var PROGRESSBAR_X = 10*RATIO;
var PROGRESSBAR_Y = 10*RATIO;
var PROGRESSBAR_WIDTH =  SCREEN_WIDTH * 0.6 |0;
var PROGRESSBAR_HEIGHT = 8 * RATIO;

var LIGHT_POS_X = 60*RATIO;
var LIGHT_POS_Y = 110*RATIO;
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
    good: 10,
    nice: 50,
    great: 100,
    // hold: 10
};

// レパートリーリスト
var activeMusicPointer = 1;
var musicList = [
    {
        name: "Game gadget at midnight (NORMAL)",
        author: "MATSU",
        url: "http://dova-s.jp/_contents/author/profile089.html",
        difficulty: 3,
        theme: "night",
        src: "./data/music/Game_gadget_at_midnight.mp3",
        fumen: "./data/midnight-fumen_rev1.json"
    },{
        name: "Morning (EASY)",
        author: "しゃろう",
        url: "http://dova-s.jp/_contents/author/profile106.html",
        difficulty: 1,
        theme: "day",
        src: "./data/music/Morning.mp3",
        fumen: "./data/morning-fumen.json"
    },{
        name: "野良猫は宇宙を目指した (EASY)",
        author: "しゃろう",
        url: "http://dova-s.jp/_contents/author/profile106.html",
        difficulty: 2,
        theme: "night",
        src: "./data/music/Morning.mp3",
        fumen: "./data/morning-fumen.json"
    },
];

var SOUND_ASSETS = {
    clap:"./assets/sounds/clap.mp3",
    conga: "./assets/sounds/conga.mp3"
};
var IMAGE_ASSETS = {
    streetLight: "./assets/images/streetLight2.png",
    girl: "./assets/images/girl.png",
}

// 要素取得
var app = $id('app');
var bgCanvas = $id('bg');
var holderElement = $id('game-field');
var timerNode = $id('time');
var ua = navigator.userAgent.toLowerCase();
var timer;

// 情報格納用変数
var noteList = []; //譜面情報
var hitEffect = null;
var score = 0;
var chainNum = 0;
var maxChain = 0; // マックス
var fullChainNum = 1; // フルコンボ時の数値
var rateText = null; // GREAT!などのラベル @string
var longNote = null; // ロングノート情報 @float

// flags
var btnFlg = false; // ボタンが押下状態フラグ
var isPlaying = false; // プレイ中
var autoPlay = false;
// var autoPlay = true;
var enableSE = (ua.indexOf("android")>0) ? false : true;
var enableInput = true;
var isHTMLaudio = null;

// 譜面位置・判定調整用
var currentNoteIndex = 1;
var calib = 0; // 判定調整用　RATING.good判定より小さいこと
var zerohour = 0; // （音源中での実際の音楽再生開始時間）譜面load時に修正される
var endhour = 0; // ゲーム終了時間：音源ロード時に設定
var wait = 3.0; // 音源再生までの待ち時間
// var wait = zerohour + _wait; //  計算に利用する最終的な待ち時間
var bpm = 120; // dummy
var speed = 1.25;

// asset register
var sounds = {} // サウンド管理;
var images = {} // image管理;
var music = null;

// 0. スタート
window.addEventListener('DOMContentLoaded', function(){

    // 曲の詳細情報更新
    var updateMusicInfo = function(index){
        $id("music-info").innerHTML = null;

        var obj = musicList[index];
        Object.keys(obj).forEach(function(key){
            if (key == "src" || key == "fumen" || key == "url" || key == "theme") return;

            var li = document.createElement('li');
            if (key == "author"){
                //アンカー付き
                var inner = "<a href="+obj['url']+">"+obj[key]+"</a>";
                li.innerHTML = key.toUpperCase()+": "+ inner;
            } else if (key == "difficulty"){
                //星の数で表す
                li.innerHTML += key.toUpperCase()+": ";
                for (var i = 0; i < obj[key]; i++) {
                    li.innerHTML +="&#9733";
                }
            } else {
                li.textContent = key.toUpperCase()+": "+ obj[key];
            }

            $id('music-info').appendChild(li);
        });
    }

    //楽曲リスト生成
    musicList.forEach(function(m, index){
        var DEFAULT_COLOR = 'rgb(60, 100, 214)';
        var ACTIVE_COLOR = 'rgb(161, 182, 241)';
        // music['active'] = false;
        var li = document.createElement('li');
        // li.setAttribute("data-active", "false");
        li.textContent = m.name;
        console.log(index === activeMusicPointer);
        li.style.background = (index === activeMusicPointer) ? ACTIVE_COLOR : DEFAULT_COLOR;
        updateMusicInfo(activeMusicPointer);

        //クリック・タップイベント
        li.addEventListener('mousedown', _musicLoad, false);
        li.addEventListener('touchstart', _musicLoad, false);
        function _musicLoad(e){
            // console.log(e.target);
            if(index === activeMusicPointer) return;
            // 音源のロード
            // console.log("this music is : ",createjs.Sound.loadComplete(m.src));
            if(music) stopSound(music); //再生中なら止める

            if (!createjs.Sound.loadComplete(m.src)){
                $id('load-filter').style.visibility = "visible";enableInput = false;

                preloadOneSound(m.src, m.name, function(e){
                    music = createjs.Sound.createInstance(e.id);
                    // console.log("代入地点", music);
                    $id('load-filter').style.visibility = "hidden";enableInput = true;
                    playSound(music);
                    endhour = music.duration*0.001 + wait;
                    // console.log(endhour);
                });
            }else{
                music = createjs.Sound.createInstance(m.name);
                playSound(music);
                endhour = music.duration*0.001 + wait;
                // console.log(endhour);
            }
            // 譜面情報の取得:parallel
            getXmlData(m.fumen, function(res){
                // console.log(res);
                importData(res);

                // フルコンボ数決定
                fullChainNum = 0;
                noteList = NOTE_LIST.slice();
                noteList.forEach(function(note){
                    if(note.length){
                        fullChainNum += 2;
                    } else {
                        fullChainNum += 1;
                    }
                });
            });

            var childs = $id('repertory').childNodes;

            // 背景アクティブ化
            Object.keys(childs).forEach(function(i){
                var c = childs[i];
                // c.dataset.active = 'false';
                c.style.background = DEFAULT_COLOR;
            });
            // this.dataset.active = 'true';
            activeMusicPointer = index;
            updateMusicInfo(index);
            e.target.style.background = ACTIVE_COLOR;
        }

        $id('repertory').appendChild(li);
    });

    // 1. 画像ロード
    imagePreload(IMAGE_ASSETS, images, function(){
        // 2. 初期化（canvasセット, 譜面ロード, タイマー）
        init();
        main();
        // 2.5 music select ?
        // 3. 初回タップ、クリックでスタート
        var _func = (function(event) {
            return function f(event) {
                preloadSounds(SOUND_ASSETS, sounds, function(){
                    $id('load-filter').style.visibility = "visible";enableInput = false;

                    // イベントリスナ消す
                    window.removeEventListener(event.type, _func, false);
                    app.removeEventListener(event.type, _func, false);

                    // 入力系 set up
                    // サウンドロードが完了した地点で入力できるようにする
                    var setUpInputEvents = function(){
                        app.addEventListener('mousedown',  function(e){ e.preventDefault();onpointdown();}, false);
                        app.addEventListener('touchstart', function(e){ e.preventDefault();onpointdown();}, false);
                        document.addEventListener('keydown', function(e){
                            // if (e.keyCode == 32) return judge();
                            onpointdown();
                        });
                        // keyup系
                        app.addEventListener('mouseup', onpointup, false);
                        app.addEventListener('touchend', onpointup, false);
                        document.addEventListener('keyup', onpointup, false);
                    }

                    // bgmロード：曲選択していない場合
                    if(!music) {
                        var _mObj = musicList[0];
                        preloadOneSound(_mObj.src, _mObj.name, function(e){
                            music = createjs.Sound.createInstance(e.id);
                            var _audiotype = music.constructor.toString().toLowerCase();
                            isHTMLaudio = _audiotype.match(/htmlaudio/);
                            // console.log(isHTMLaudio);
                            // stopSound(music); // 一度再生しないとpausedを設定できない？
                            // music.paused = true;
                            // music.position = 0;
                            // music.position = zerohour*1000;
                            // music.startTime = zerohour*1000; // milisec
                            console.log("paused? :", music.paused);
                            console.log("playstate? :", music.playState);

                            // ajaxで譜面情報の取得
                            getXmlData(_mObj.fumen, function(res){
                                importData(res);
                                // フルコンボ数決定
                                noteList = NOTE_LIST.slice();
                                noteList.forEach(function(note){
                                    if(note.length){
                                        fullChainNum += 2;
                                    } else {
                                        fullChainNum++;
                                    }
                                });

                                if (endhour == 0) endhour = music.duration + wait;
                                setUpInputEvents();

                                isPlaying = true;
                                gameReset();
                                $id('load-filter').style.visibility = "hidden"; enableInput = true;
                            });
                        });
                    } else {
                        //すでに曲選択
                        // console.log("music preset");
                        // console.log(music);
                        var _audiotype = music.constructor.toString().toLowerCase();
                        isHTMLaudio = _audiotype.match(/htmlaudio/);
                        stopSound(music); //一度再生しないとpausedを設定できない？
                        // music.paused = true;
                        // music.position = 0;
                        // music.position = zerohour*1000;
                        setUpInputEvents();
                        isPlaying = true;
                        gameReset();
                        $id('load-filter').style.visibility = "hidden"; enableInput = true;
                    }

                });
            }
        })();
        window.addEventListener('keyup', _func, false); // PC
        app.addEventListener('touchend', _func, false); // SP/tab
    });

}, false);

var canPlayMusic = true;
function gameReset(){
    currentNoteIndex = 0;
    music.position = 0;
    music.paused = true;
    // console.log("music duration:",music.duration);
    if (autoPlay) btnFlg = true;
    // music.position = zerohour*1000;
    // music.pause();
    // music.currentTime = zerohour; //0以下の場合は0になる？
    rateText = null;
    chainNum = 0;
    maxChain = 0;
    score = 0;
    hitEffect = 0;
    timer.reset();
    timer.run();
    canPlayMusic = true;
    isPlaying = true;
    // console.log(noteList);
    console.log("reset");
}

function init() {
    //timerset
    timer = new Timer();

    // set up main canvas
    app.width = bgCanvas.width = SCREEN_WIDTH;
    app.height = bgCanvas.height  = SCREEN_HEIGHT;
    holderElement.style.width = SCREEN_WIDTH +"px";
    holderElement.style.height = SCREEN_HEIGHT +"px";
    // set up background canvas : draw once
    var bgctx = bgCanvas.getContext('2d');
    bgctx.fillStyle = "rgb(0, 0, 0)"; //themeによって変える？
    // bgctx.fillStyle = "rgb(249, 250, 207)"; //themeによって変える？
    bgctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); //bgcolor
    bgctx.drawImage(images.girl, GIRL_POS_X, GIRL_POS_Y, 124*1.1*RATIO, 166*1.1*RATIO);
    drawGradRect(bgctx, 0, JUDGE_LINE_Y,  SCREEN_WIDTH, SCREEN_HEIGHT-JUDGE_LINE_Y, [ [0, WATER_COLOR], [1, "rgba(255, 255, 255, 0)"] ]);
    bgctx.drawImage(images.streetLight,0,0,118,308, LIGHT_POS_X, LIGHT_POS_Y, 132*RATIO, 358*RATIO);
    // Filter
    bgctx.fillStyle = "rgba(164, 146, 146, 0.59)";
    bgctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

// main loop
function main() {
    if (isPlaying){
        timer.update();
        timerNode.innerHTML = timer.time();
        calc();
    };
    screenRender();

    setTimeout(main, 1000/60);
}

// 内部処理
function calc(){
    var i, len;
    var noteTime;

    // if (!isPlaying) return;
    var time = timer.time();

    // 時間が来たら音楽再生開始: 一回のみ
    if (time > wait - zerohour && canPlayMusic) {
    // if (time > wait && music.paused) {
        // if(music.playState==null || music.playState=="playFinished"){
            console.log("music start");
            // music.play();
            canPlayMusic = false;
            playSound(music);
            // console.log("paused:", music.paused);
            // console.log(music.playState); //playSucceeded
        // }
    }
    // endhour に達したら
    if (time > endhour && !music.paused) {
        console.log("music end");
        // music.volume -= 0.1;
        // stopSound(music);
        console.log(music.playState); //playSucceeded
    }
    if (time > endhour){
        isPlaying = false;
    }

    for (i = currentNoteIndex, len=noteList.length; i < len; i++){
        noteTime = noteList[i];

        // ロングノートだったら
        if (typeof noteTime == 'object') {
            noteTime = noteTime[0];
        }

        // 無入力判定：判定ラインを超え、かつ判定時間を過ぎたらmiss判定、そして次のターゲットへ
        // ロングノート判定中は引っかからないようにする
        if (time > noteTime+wait + RATING.good && !longNote){
            miss();
            currentNoteIndex++;
        }

        //オートプレイ
        //great範囲内に入ったら即座に反応
        // ロングノート判定中にロングノート情報を消さないようにする
        if (autoPlay && !longNote) {
            if (time > noteTime + wait - RATING.great*0.5){
                judge();
                // currentNoteIndex++;

            }
        }
    }

    // long note 処理
    if (longNote != null) {
        var rTime = longNote - time + calib;

        // ボタンを押している
        if (btnFlg) {
            // 終了時間に達していない
            if (rTime > 0) {
                // console.log('ji');
                hitEffect = 3;
                // effect('hold');
            // 規定時間まで押しつづけたら終了
            }else{
                longNote = null;
                effect('great');
            }

        // 途中で離してしまった
        }else{
            longNote = null;
            effect('miss');
        }
    }

}

function screenRender() {
    var ctx = app.getContext('2d');
    var relativeTime = 0; // 再生位置とノーツ出現情報との差、０のとき判定ライン位置になるように
    var corr = bpm * 1.75 * RATIO * speed; // 補正、ハイスピ
    var deltaY; // 判定ラインまでの距離
    var drawingPointX = 100; // X軸 描画位置
    var drawingPointY; // Y軸 描画位置
    var noteHeight = 0;
    var effectPosX = null; // エフェクトX位置
    var i, len;
    var noteTime = null;

    //画面初期化：背景色で塗りつぶす
    // ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // ブラーエフェクト
    // ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.clearRect(0, 0, app.width, app.height);

    // filter
    // ctx.fillStyle = "rgba(87, 98, 121, 0.5)";
    // ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    //ノーツの描画：
    ctx.save();
    // ctx.beginPath();
    for (i=currentNoteIndex, len=noteList.length; i<len; i++) {
        noteHeight = NOTE_HEIGHT;
        drawingPointX = NOTE_POSES[i%NOTE_POSES_LEN];
        noteTime = noteList[i];

        // ロングノートだったら
        if (noteTime.length) {
            ctx.fillStyle = LONG_NOTE_COLOR;
            // 最終位置に合わせて、ノーツ高さを変更する
            noteHeight = - (noteTime[1] - noteTime[0]) * corr; //上方向に伸ばすため、マイナス値
            noteTime = noteTime[0];
        } else {
            ctx.fillStyle = NOTE_COLOR;
        }

        // 待ち時間を加算
        noteTime += wait;

        // 描画位置を決める
        relativeTime = noteTime - timer.time();
        deltaY = relativeTime * corr;
        drawingPointY = NOTE_DEST_Y - deltaY;

        // 画面外だったら描画をスキップして次のループへ
        if (drawingPointY < -10) continue;

        // 判定ライン位置でストップ & ロングノートの場合高さを縮める
        if (relativeTime < 0){
            noteHeight -= relativeTime * corr;
            drawingPointY = NOTE_DEST_Y;
        }

        // ノーツ描く
        ctx.fillRect(drawingPointX, drawingPointY, NOTE_WIDTH, noteHeight);
        // ctx.rect(drawingPointX, drawingPointY, NOTE_WIDTH, noteHeight);

    }
    // ctx.fill();
    ctx.restore();

    // スコア表示とか
    // フォント設定
    ctx.fillStyle = "white"; // 色は白
    // ctx.font = "bold 20px ''Shadows Into Light, Verdana, sans-serif'"; // フォントのウエイト、サイズ、ファミリー
    ctx.font = SCORE_TEXT_FONT_SIZE+"px 'Audiowide'"; // フォントのウエイト、サイズ、ファミリー
    // ctx.font = "bold 20px ''Merienda One, Verdana, sans-serif'"; // フォントのウエイト、サイズ、ファミリー
    ctx.textAlign = 'center'; // 軸を文字列中央に持ってくる

    // effectPosX = drawingPointX;
    effectPosX = (longNote) ? NOTE_POSES[currentNoteIndex%NOTE_POSES_LEN] : NOTE_POSES[(currentNoteIndex-1)%NOTE_POSES_LEN];

    if (isPlaying){

        // "great!"とか
        if (rateText){
            ctx.save();
            ctx.fillStyle = (rateText.match(/great|nice/i) == null) ? "rgba(120, 158, 215, 0.68)" : "rgb(177, 224, 125)"; // 色
            // ctx.fillText(rateText, RATING_TEXT_POS_X,  RATING_TEXT_POS_Y);
            ctx.fillText(rateText, effectPosX+NOTE_WIDTH/2,  JUDGE_LINE_Y*0.8);
            // rateText = null;
            if (!isPlaying)  rateText = null;
            ctx.restore();
        }

        // チェイン数
        if (chainNum !== 0){
            ctx.fillText(chainNum+" CHAIN", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y + 16);
        }

        //スコア
        ctx.textAlign = 'right'; //軸を文字列中央に持ってくる
        ctx.fillText(score, SCORE_TEXT_POS_X,  SCORE_TEXT_POS_Y);

        //エフェクト描画
        // effect変数には整数が入り、０以上のときに描画
        if (hitEffect > 0) {
            ctx.save();
            ctx.globalAlpha = hitEffect * 0.1; //opacity
            // drawGradRect(ctx, effectPosX, JUDGE_LINE_Y-EFFECT_HEIGHT,  NOTE_WIDTH, EFFECT_HEIGHT*1.5, [[0,"rgba(0, 0, 0, 0)"],[0.7,EFFECT_COLOR],[1,"rgba(0, 0, 0, 0)"]]);
            drawGradRect(ctx, effectPosX, JUDGE_LINE_Y-EFFECT_HEIGHT,  NOTE_WIDTH, EFFECT_HEIGHT, [[0,"rgba(0, 0, 0, 0)"],[1,EFFECT_COLOR]]);
            hitEffect--;
            ctx.restore();
        }

        //progress gauge
        ctx.save();
        var remainRatio = timer.time() / endhour;
        ctx.fillStyle = "#d5e9f1"; // bg色
        ctx.fillRect(PROGRESSBAR_X, PROGRESSBAR_Y, PROGRESSBAR_WIDTH, PROGRESSBAR_HEIGHT);
        ctx.fillStyle = "#5099b6"; // ゲージ色
        ctx.fillRect(PROGRESSBAR_X,PROGRESSBAR_Y, PROGRESSBAR_WIDTH * remainRatio, PROGRESSBAR_HEIGHT);
        ctx.restore();

        // レパートリーリスト消す
        $id('repertory-wrapper').style.visibility = "hidden";
    }

    // スタート＆リザルト
    if(!isPlaying){
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // 色
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        //
        ctx.textAlign = 'center';
        ctx.fillStyle = "rgba(255, 255, 255, 0.99)"; // 色
        ctx.globalAlpha = 0.4; //opacity
        ctx.fillText("TAP KEYBOARD or SCREEN to PLAY", RATING_TEXT_POS_X,  SCORE_TEXT_FONT_SIZE*2);
        ctx.globalAlpha = 1; //opacity
        if (score) {ctx.fillText("RESULT", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y);}
        if (score) {ctx.fillText("SCORE: "+score+"", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*1.5);}
        if (maxChain) {ctx.fillText("MAX-CHAIN: "+maxChain+" / "+fullChainNum, RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*3);}
        // if (score) {ctx.fillText("結構歌えた！", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*5);}
        ctx.restore();

        $id('repertory-wrapper').style.visibility = "visible";
    }

}

// draw vertical linear gradient rect
function drawGradRect(context, x, y, width, height, color){
    context.save();

    // グラデーション領域をセット
    // console.log(width, height);
    var grad  = context.createLinearGradient(x, y, x, y+height);

    // グラデーション終点のオフセットと色をセット
    if (color.length > 0){
        for (var i = 0, len=color.length; i < len; i++) {
            grad.addColorStop(color[i][0], color[i][1]);
        }
    } else {
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');  // 透明
        grad.addColorStop(1, color);
    }

    // グラデーションをfillStyleプロパティにセット
    // context.globalAlpha = (alpha) ? alpha : 1;
    context.fillStyle = grad;

    // 矩形を描画
    context.fillRect(x, y, width, height);

    context.restore();
}

//　判定処理
function judge() {
    var noteTime = noteList[currentNoteIndex]; // いまのノーツを見る
    var _longEnd = null; //ロング最終位置を一時保持

    //ロングノートだったら
    if (typeof noteTime == 'object') {
        _longEnd = noteTime[1];
        noteTime = noteTime[0]; // ノーツを
        _longEnd += wait;
        // console.log(noteTime);
    }
    noteTime += wait;

    // 正判定位置からどれくらいずれているか
    // var rTime = noteTime - music.currentTime + calib; // 再生位置と先頭ノーツ出現時間との差
    var rTime = noteTime - timer.time() + calib; // 再生位置と先頭ノーツ出現時間との差
    // console.log(longNote);
    // 早押し・遅押しを区別しない場合
    if (rTime < 0) rTime *= -1;

    // 判定範囲外なら何もせず終了
    if (rTime > RATING.out) return;

    longNote = _longEnd;

    if (rTime < RATING.great) return effect("great");

    if (rTime < RATING.nice) return effect("nice");

    if (rTime < RATING.good) return effect("good");

    longNote = null;

    if (rTime < RATING.out) return effect("miss");

    // 判定受付範囲外の場合は無し
    // 下のように書いても同じ

    // if (){
    // } else if (rTime) {
    //
    // }

}

// 判定時の反応 reactionでもいいかも
function effect(rating){
    if (longNote == null) currentNoteIndex++; //ロングでなければ現在ノート消す

    switch (rating) {
        case "great":
            chainNum++;
            rateText = "GREAT!!!";
            playShot("clap");
            hitEffect = 16;
            score += SCORE.great;
            // console.log("great!!!");

            break;

        case "nice":
            chainNum++;
            rateText = "NICE!";
            hitEffect = 10;
            playShot("clap");
            score += SCORE.nice;
            // console.log("nice!");
            break;

        case "good":
            chainNum++;
            rateText = "GOOD";
            playShot("conga");
            score += SCORE.good;
            // console.log("good");
            // noteList.shift();
            break;

        case "hold":
            // rateText = "HOLD!";
            // chainNum++;
            // playShot(se2);
            // score += SCORE.hold;
            break;

        case "miss":
            miss();
            // playShot(se2);
            // noteList.shift();
            break;

        default:
            break;
    }
    // 最大チェイン数更新：ゼロもしくは更新時
    if (maxChain == 0 || maxChain <= chainNum) {
        maxChain = chainNum;
    }
}

// 使いまわせるように切り出す
function miss(){
    chainNum = 0; // チェイン切る
    rateText = "MISS...";
    // console.log("miss...");
}

// ショット音再生
function playShot(id){
    if(!enableSE) return;
    if (isHTMLaudio){
        //html5audio
        var audio = sounds[id];
        // if(!audio.ended){
            //インスタンス使い回し：巻き戻し再生によって連続再生
            // audio.pause();
            // audio.currentTime = 0;  // 再生位置を0秒にする
            audio.paused = true;
            audio.position = 0;
            audio.play();
    } else {
        createjs.Sound.play(id);
    }
}

function playSound(audio){
    // console.log("play");
    if (createjs.Sound) {
        // if(!audio.paused) audio.paused = false; //一時停止中ならレジューム
        audio.play();
    } else {
        audio.play();
    }
}
function stopSound(audio){
    // console.log("stop");
    if (createjs.Sound) {
        // audio.stop();
        audio.paused = true; //cjs //paused はplaySucceeded中にしか指定できない？
        console.log(".paused;", audio.paused);
        console.log("playstate:", music.playState);
    } else {
        audio.pause();
    }
}

function onpointdown(e){
    // e.preventDefault();
    if (!enableInput) return;
    if (!isPlaying) {
        gameReset();
        isPlaying = true;
        return;
    }
    if (isPlaying){
        if (autoPlay) return;
        if(btnFlg) return;
        btnFlg = true;
        // if(longNote) return;
        judge();
    }else{
        isPlaying = true;
    }
}
function onpointup(e){
    e.preventDefault();
    if (!enableInput) return;
    if (autoPlay) return;
    btnFlg = false;
}

function importData(jsonData){
    var dataobj;
    try {
        dataobj = JSON.parse(jsonData); //オブジェクト化
    } catch(e) {
        alert('jsonデータをパース出来ませんでした');
        console.warn(e);
    }
    // 各数値代入
    bpm = dataobj.BPM;
    NOTE_LIST =  dataobj.noteList;
    zerohour = dataobj.zerohour;
    if(dataobj.endhour) endhour = dataobj.endhour + wait;
}

//==============================
$id('resetBtn').addEventListener('click', gameReset, false);

function pause(){
    // music.pause();
    stopSound(music);
    timer.pause();
    isPlaying = false;
}
$id('pause').addEventListener('click', pause);

$id('seek').onblur = function(){
    timer.setTime(this.value);
    music.currentTime = this.value;
}
