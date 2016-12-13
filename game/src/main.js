window.onload = function() {
  new RRAIN.App();
}

// ;(function(window){


//     // asset register
//     // var sounds = {} // サウンド管理;
//     // var images = {} // image管理;
//     // var music = null;
//     // var musicName = null;

//     // // 要素取得
//     // var app = $id('app');
//     // var bgCanvas = $id('bg');
//     // var holderElement = $id('game-field');
//     // var repertoryWrapper = $id('repertory-wrapper');

//     // // ゲーム情報格納用変数
//     // var timer;
//     // var noteList = []; //譜面情報
//     // var hitEffect = null; //@int
//     // var score = 0; //@int
//     // var chainNum = 0; // @int
//     // var maxChain = 0; // 最大チェイン数 @int
//     // var fullChainNum = 1; // フルコンボ時の数値 @int
//     // var rateText = null; // GREAT!などのラベル @string
//     // var longNote = null; // ロングノート情報 @float

//     // // flags
//     // var btnFlg = false; // ボタンが押下状態フラグ
//     // var isPlaying = false; // プレイ中
//     // var autoPlay = false;
//     // // var autoPlay = true;
//     // var _ua = navigator.userAgent.toLowerCase();
//     // // IE andriodではSE無効
//     // // console.log(_ua)
//     // var enableSE = (_ua.indexOf("android")>0 || _ua.indexOf("MSIE")>0 || _ua.indexOf("trident")>0) ? false : true;
//     // var enableInput = true;
//     // var isHTMLaudio = null;
//     // var canPlayMusic = true;

//     // // 譜面位置・判定調整用
//     // var currentNoteIndex = 1;
//     // var calib = Math.min(0, RATING.good); // 判定調整用　RATING.good判定より小さいこと
//     // var zerohour = 0; // （音源中での実際の音楽再生開始時間）譜面load時に修正される
//     // var endhour = 0; // ゲーム終了時間：音源ロード時に設定
//     // var wait = 3.0; // 音源再生までの待ち時間
//     // var bpm = 120; // ノーツスピードに絡む(数値はダミー)
//     // var noteSpeed = 0; // ユーザーノーツスピード

//     // // other
//     // // var musicList;
//     // var activeMusicPointer = 0;

//     // 汎用素材プリロード　-> 立ち上げ
//     // RRAIN.Loader.loadBatch({
//     //   "image": IMAGE_ASSETS,
//     //   "sound": SOUND_ASSETS,
//     //   "json": {
//     //     "musicList": MUSIC_LIST_PATH
//     //   }
//     // }).then(appInitialize);


//     // window.addEventListener('DOMContentLoaded', function(){
//     //     // レパートリーリストのロード
//     //     getXmlData(MUSIC_LIST_PATH, function (res){
//     //         var data = JSON.parse(res);
//     //         musicList = data.list;

//     //         appInitialize();
//     //     });
//     // }, false); // --window DOMContentLoaded callback

//     function appInitialize(){
//         var musicList = RRAIN.Loader.getAsset("musicList").data.list;

//         /* 曲の詳細更新関数 */
//         var updateMusicInfo = function(index){
//           if (index == null) return;
//           var parent = $id("music-info");
//           parent.innerHTML = null;

//           var obj = musicList[index];
//           Object.keys(obj).forEach(function(key){
//             if (key == "src" || key == "fumen" || key == "url" || key == "theme") return;

//             var li = document.createElement('li');
//             if (key == "author"){
//               //アンカー付き
//               var inner = "<a href="+obj['url']+">"+obj[key]+"</a>";
//               li.innerHTML = key.toUpperCase()+": "+ inner;
//             } else if (key == "difficulty"){
//               //星の数で難易度表す
//               li.innerHTML += key.toUpperCase()+": ";
//               for (var i = 0; i < obj[key]; i++) {
//                 li.innerHTML +="&#9733";
//               }
//             } else {
//               li.textContent = key.toUpperCase()+": "+ obj[key];
//             }

//             parent.appendChild(li);
//           });
//         }

//         /* リストから楽曲一覧生成　*/
//         musicList.forEach(function(m, index){

//             /* 選択肢（レパートリーリスト）のセットアップ */
//             var li = document.createElement('li');
//             // li.setAttribute("data-active", "false");
//             li.textContent = m.name;
//             li.style.background = (index === activeMusicPointer) ? ACTIVE_COLOR : DEFAULT_COLOR;
//             li.style.opacity = (index === activeMusicPointer) ? 1.0 : DEFAULT_OPACITY;
//             updateMusicInfo(activeMusicPointer);

//             // 各選択肢にクリック・タップイベント設定
//             li.addEventListener('mousedown', _musicLoad, false);
//             li.addEventListener('touchstart', _musicLoad, false);

//             function _musicLoad(e){
//               // if(index === activeMusicPointer) return;

//               // 音源のロード
//               if (music) stopSound(music); // 再生中なら止める

//               var selected = RRAIN.Loader.getAsset(m.name);
//               if (!selected) {
//                 // 未ロード
//                 $id('load-filter').style.visibility = "visible";
//                 enableInput = false;

//                 // 音源
//                 var p1 = RRAIN.Loader.loadSound(DATA_PATH+m.src, m.name)
//                 .then(function(res){
//                   music = res;
//                   endhour = music.duration() + wait;
//                 });
//                 // 譜面情報の取得
//                 var p2 = RRAIN.Loader.loadJson(DATA_PATH+m.fumen, "chart_"+m.name)
//                 .then(function(res){
//                   setupFumen(res.raw);
//                 });

//                 Promise.all([p1,p2]).then(function(){
//                   gameReset();
//                   playSound(music); // 視聴
//                   musicName = m.name;
//                   $id('music-name-display').innerHTML = "♪ "+m.name;
//                   $id('load-filter').style.visibility = "hidden";
//                   enableInput = true;
//                 });
//               } else {
//                 // ロード済み
//                 music = selected;
//                 endhour = music.duration() + wait; //ms -> secに直す
//                 setupFumen(RRAIN.Loader.getAsset("chart_"+m.name).raw);
//                 gameReset();
//                 playSound(music);
//                 musicName = m.name;
//                 $id('music-name-display').innerHTML = "♪ "+m.name;
//                 $id('load-filter').style.visibility = "hidden";
//                 enableInput = true;
//               }
//               // if (!createjs.Sound.loadComplete(DATA_PATH+m.src)){
//               //     $id('load-filter').style.visibility = "visible";
//               //     enableInput = false;

//               //     preloadOneSound(DATA_PATH+m.src, m.name, function(e){
//               //         music = createjs.Sound.createInstance(e.id);
//               //         // console.log("代入地点", music);
//               //         endhour = music.duration*0.001 + wait; //ms -> secに直す

//               //         // 譜面情報の取得
//               //         getXmlData(DATA_PATH+m.fumen, function(res){
//               //             setupFumen(res);
//               //             gameReset();
//               //             playSound(music);
//               //             musicName = m.name;
//               //             $id('music-name-display').innerHTML = "♪ "+m.name;
//               //             $id('load-filter').style.visibility = "hidden";enableInput = true;
//               //         });
//               //     });
//               // } else {
//               //     // すでにロード済み
//               //     music = createjs.Sound.createInstance(m.name);
//               //     endhour = music.duration * 0.001 + wait;
//               //     // 譜面情報の取得
//               //     $id('load-filter').style.visibility = "visible";enableInput = false;
//               //     getXmlData(DATA_PATH+m.fumen, function(res){
//               //         setupFumen(res);
//               //         gameReset();
//               //         playSound(music);
//               //         $id('music-name-display').innerHTML = "♪ "+m.name;
//               //         $id('load-filter').style.visibility = "hidden";enableInput = true;
//               //     });
//               // }

//               // 選択中のli要素をアクティブ化
//               var childs = $id('repertory').childNodes;
//               Object.keys(childs).forEach(function(i){
//                   var c = childs[i];
//                   // c.dataset.active = 'false';
//                   c.style.background = DEFAULT_COLOR;
//                   c.style.opacity = 0.5;
//               });

//               // this.dataset.active = 'true';
//               activeMusicPointer = index;
//               updateMusicInfo(index);
//               e.target.style.background = ACTIVE_COLOR;
//               e.target.style.opacity = 1;
//           }

//           $id('repertory').appendChild(li);
//         });

//         /* ゲーム本体の初期化 */
//         // 1. 画像ロード
//         // imagePreload(IMAGE_ASSETS, images, function(){
//         // 2. 初期化（canvasセット等）
//         init();

//         // 3. 初回タップ、クリックのみ実行
//         var _func = (function(event) {
//           return function f(event) {
//             // 効果音のロード
//             // preloadSounds(SOUND_ASSETS, sounds, function(){
//               $id('load-filter').style.visibility = "visible";
//               enableInput = false;

//               // イベントリスナ消す
//               window.removeEventListener(event.type, _func, false);
//               app.removeEventListener(event.type, _func, false);

//               // 入力系 set up
//               // サウンドロードが完了した地点で入力できるようにする
//               var addInputEvents = function(){
//                 app.addEventListener('mousedown',  function(e){ e.preventDefault();onpointdown();}, false);
//                 app.addEventListener('touchstart', function(e){ e.preventDefault();onpointdown();}, false);
//                 document.addEventListener('keydown', function(e){
//                     // if (e.keyCode == 32) return judge();
//                     // if (!(e.keyCode === 116)) e.preventDefault();
//                     e.preventDefault();
//                     onpointdown();
//                 });
//                 // keyup系
//                 app.addEventListener('mouseup', onpointup, false);
//                 app.addEventListener('touchend', onpointup, false);
//                 document.addEventListener('keyup', onpointup, false);
//               }

//               // オーディオタイプの確認：IE系の場合HTMLaudio
//               var checkAudioType = function(audio){
//                 var _audiotype = audio.constructor.toString().toLowerCase();
//                 isHTMLaudio = _audiotype.match(/htmlaudio/);
//               }

//               // bgmロード（曲選択していない場合）
//               if (!music) {
//                   if(!musicList){
//                       return console.log("レパートリー情報がありません");
//                   }
//                   var musicData = musicList[activeMusicPointer];

//                   var p1 = RRAIN.Loader.loadSound(DATA_PATH+musicData.src, musicData.name)
//                   .then(function(audio){
//                     music = audio;
//                     endhour = music.duration() + wait;
//                     checkAudioType(music);
//                   });

//                   // 譜面情報の取得
//                   var p2 = RRAIN.Loader.loadJson(DATA_PATH+musicData.fumen, "chart_"+musicData.name)
//                   .then(function(res){
//                     setupFumen(res.raw);

//                   });

//                   Promise.all([p1,p2]).then(function(){
//                     addInputEvents();
//                     gameReset();
//                     isPlaying = true;
//                     $id('music-name-display').innerHTML = "♪ "+musicData.name;
//                     $id('load-filter').style.visibility = "hidden";
//                     enableInput = true;

//                   });

//                   // preloadOneSound(DATA_PATH+musicData.src, musicData.name, function(e){
//                   //     // music = createjs.Sound.createInstance(e.id);
//                   //     checkAudioType(music);
//                   //     // console.log(isHTMLaudio);
//                   //     // stopSound(music); // 一度再生しないとpausedを設定できない？
//                   //     // music.position = zerohour*1000;
//                   //     // music.startTime = zerohour*1000; // milisec
//                   //     // console.log("playstate? :", music.playState);

//                   //     // 譜面情報の取得
//                   //     getXmlData(DATA_PATH+musicData.fumen, function(res){
//                   //         setupFumen(res);

//                   //         if (endhour == 0) endhour = music.duration + wait;
//                   //         addInputEvents();
//                   //         gameReset();
//                   //         isPlaying = true;
//                   //         $id('music-name-display').innerHTML = "♪ "+musicData.name;
//                   //         $id('load-filter').style.visibility = "hidden"; enableInput = true;
//                   //     });
//                   // });
//               } else {
//                   //すでに曲が選択ずみ
//                   checkAudioType(music);
//                   stopSound(music); //一度再生しないとpausedを設定できない？
//                   // music.paused = true;
//                   // music.position = 0;

//                   addInputEvents();
//                   gameReset();
//                   isPlaying = true;
//                   $id('load-filter').style.visibility = "hidden"; enableInput = true;
//               }

//             // });
//           }
//         })(); //--func

//         window.addEventListener('keyup', _func, false); // PC
//         app.addEventListener('touchend', _func, false); // SP/tab
//         // });

//     }; //--appInitialize

//     function setupFumen(data){
//         importData(data);
//         // フルコンボ数決定
//         noteList = NOTE_LIST.slice();
//         fullChainNum = 0;
//         noteList.forEach(function(note){
//             if(note.length){
//                 fullChainNum += 2;
//             } else {
//                 fullChainNum++;
//             }
//         });
//     }

//     function gameReset(){
//         currentNoteIndex = 0;
//         music.stop();
//         // music.position = -1;
//         // music.paused = true;
//         if (autoPlay) btnFlg = true;
//         // music.position = zerohour*1000;
//         // music.pause();
//         // music.currentTime = zerohour; //0以下の場合は0になる？
//         rateText = null;
//         chainNum = 0;
//         maxChain = 0;
//         score = 0;
//         hitEffect = 0;
//         timer.reset();

//         timer.run();
//         canPlayMusic = true;
//         console.log("reset", music);
//     }

//     function init() {

//         //timer set up
//         timer = new Timer();

//         // set up main canvas
//         app.width = bgCanvas.width = SCREEN_WIDTH;
//         app.height = bgCanvas.height  = SCREEN_HEIGHT;
//         holderElement.style.width = SCREEN_WIDTH +"px";
//         holderElement.style.height = SCREEN_HEIGHT +"px";

//         resizeCover($id('load-filter'));
//         window.addEventListener('resize', function(){
//             console.log('resized');
//             resizeCover($id('load-filter'));
//         });

//         // set up background canvas : draw once
//         var bgctx = bgCanvas.getContext('2d');
//         bgctx.fillStyle = "rgb(0, 0, 0)"; // TODO: themeによって変える？
//         bgctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); //bgcolor

//         // 女の子、水面と電灯の描画
//         bgctx.drawImage(RRAIN.Loader.getAsset("girl"), GIRL_POS_X, GIRL_POS_Y, 124*1.1*RATIO, 166*1.1*RATIO);
//         drawGradRect(bgctx, 0, JUDGE_LINE_Y,  SCREEN_WIDTH, SCREEN_HEIGHT-JUDGE_LINE_Y, [ [0, WATER_COLOR], [1, "rgba(255, 255, 255, 0)"] ]);
//         bgctx.drawImage(RRAIN.Loader.getAsset("streetLight"), 0,0,118,308, LIGHT_POS_X, LIGHT_POS_Y, 132*RATIO, 358*RATIO);

//         // フィルタ
//         bgctx.fillStyle = FILTER_COLOR;
//         bgctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

//         //NoteSpeed表示
//         $id('note-speed-display').innerHTML = noteSpeed;
//         //
//         var debugElm = $id('debug');
//         if (!DEBUG_MODE) debugElm.parentNode.removeChild(debugElm);

//         main();
//     }

//     // main loop
//     function main() {
//         if (isPlaying){
//             timer.update();
//             calc();
//             if (DEBUG_MODE) $id('time').innerHTML = timer.time(); //DEBUG
//         };
//         screenRender();

//         setTimeout(main, 1000/FPS);
//     }

//     // 内部処理
//     function calc(){
//         var i, len;
//         var noteTime;

//         var time = timer.time();

//         // 時間が来たら音楽再生開始: 一回のみ
//         if (time > wait - zerohour && canPlayMusic) {
//         // if (time > wait && music.paused) {
//             // if(music.playState==null || music.playState=="playFinished"){
//                 console.log("music start");
//                 // music.play();
//                 canPlayMusic = false;
//                 playSound(music);
//                 // console.log("paused:", music.paused);
//                 // console.log(music.playState); //playSucceeded
//             // }
//         }
//         // endhour に達したら
//         if (time > endhour && !music.paused) {
//             console.log("music end");
//             // music.volume -= 0.1;
//             // stopSound(music);
//             // console.log(music.playState); //playSucceeded
//         }
//         if (time > endhour){
//             isPlaying = false;
//         }

//         for (i = currentNoteIndex, len=noteList.length; i < len; i++){
//             noteTime = noteList[i];

//             // ロングノートだったら
//             // if (typeof noteTime === 'object') {
//             if (noteTime.length) {
//                 noteTime = noteTime[0];
//             }

//             // 無入力判定：判定ラインを超え、かつ判定時間を過ぎたらmiss判定、そして次のターゲットへ
//             // ロングノート判定中は引っかからないようにする
//             if (time > noteTime+wait + RATING.good && !longNote){
//                 miss();
//                 currentNoteIndex++;
//             }

//             //オートプレイ
//             //great範囲内に入ったら即座に反応
//             // ロングノート判定中にロングノート情報を消さないようにする
//             if (autoPlay && !longNote) {
//                 if (time > noteTime + wait - RATING.great*0.5){
//                     judge();
//                     // currentNoteIndex++;

//                 }
//             }
//         }

//         // long note 処理
//         if (longNote != null) {
//             var rTime = longNote - time + calib;

//             // ボタンを押している
//             if (btnFlg) {
//                 // 終了時間に達していない
//                 if (rTime > 0) {
//                     hitEffect = 3;
//                     // effect('hold');
//                 // 規定時間まで押しつづけた
//                 } else {
//                     longNote = null;
//                     effect('great');
//                 }

//             // 途中で離してしまった
//             } else {
//                 longNote = null;
//                 effect('miss');
//             }
//         }
//     }

//     function screenRender() {
//         var ctx = app.getContext('2d');
//         var relativeTime = 0; // 再生位置とノーツ出現情報との差、０のとき判定ライン位置になるように
//         // var corr = bpm * 1.75 * RATIO * noteSpeed; // 補正、ハイスピ
//         // Memo: corrをマイナスにすると、画面の下側からノーツが降ってきます。
//         var corr = bpm * 1.75 * RATIO * (1+noteSpeed*0.5); // 補正、ハイスピ
//         var deltaY; // 判定ラインまでの距離
//         var drawingPointX = 100; // X軸 描画位置
//         var drawingPointY; // Y軸 描画位置
//         var noteHeight = 0;
//         var effectPosX = null; // エフェクトX位置
//         var i, len;
//         var noteTime = null;

//         //画面初期化：背景色で塗りつぶす
//         // ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // ブラーエフェクト
//         // ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
//         ctx.clearRect(0, 0, app.width, app.height);

//         //ノーツの描画：
//         ctx.save();
//         // ctx.beginPath();
//         for (i=currentNoteIndex, len=noteList.length; i<len; i++) {
//             noteHeight = NOTE_HEIGHT;
//             drawingPointX = NOTE_POSITIONS[i%NOTE_POSITIONS_LEN];
//             noteTime = noteList[i];

//             // ロングノートだったら
//             if (noteTime.length) {
//                 ctx.fillStyle = LONG_NOTE_COLOR;
//                 // 最終位置に合わせて、ノーツ高さを変更する
//                 noteHeight = - (noteTime[1] - noteTime[0]) * corr; //上方向に伸ばすため、マイナス値
//                 noteTime = noteTime[0];
//             } else {
//                 ctx.fillStyle = NOTE_COLOR;
//             }

//             // 待ち時間を加算
//             noteTime += wait;

//             // 描画位置を決める
//             relativeTime = noteTime - timer.time();
//             deltaY = relativeTime * corr;
//             drawingPointY = NOTE_DEST_Y - deltaY;

//             // 画面外だったら描画をスキップして次のループへ
//             if (drawingPointY < -10) continue;

//             // 判定ライン位置でストップ & ロングノートの場合高さを縮める
//             if (relativeTime < 0){
//                 noteHeight -= relativeTime * corr;
//                 drawingPointY = NOTE_DEST_Y;
//             }

//             // ノーツ描く
//             ctx.fillRect(drawingPointX, drawingPointY, NOTE_WIDTH, noteHeight);
//             // ctx.rect(drawingPointX, drawingPointY, NOTE_WIDTH, noteHeight);

//         }
//         // ctx.fill();
//         ctx.restore();

//         // スコア表示とか
//         // フォント設定
//         ctx.fillStyle = "white"; // 色は白
//         // ctx.font = "bold 20px ''Shadows Into Light, Verdana, sans-serif'"; // フォントのウエイト、サイズ、ファミリー
//         ctx.font = SCORE_TEXT_FONT_SIZE+"px 'Audiowide'"; // フォントのウエイト、サイズ、ファミリー
//         // ctx.font = "bold 20px ''Merienda One, Verdana, sans-serif'"; // フォントのウエイト、サイズ、ファミリー
//         ctx.textAlign = 'center'; // 軸を文字列中央に持ってくる

//         // effectPosX = drawingPointX;
//         // ロングノート判定中は 現ノートと同じ位置、そうでないなら前ノートの位置に出現
//         effectPosX = (longNote) ? NOTE_POSITIONS[currentNoteIndex%NOTE_POSITIONS_LEN] : NOTE_POSITIONS[(currentNoteIndex-1)%NOTE_POSITIONS_LEN];

//         // プレイ中のみ表示
//         if (isPlaying){
//             // "great!"とか
//             if (rateText){
//                 ctx.save();
//                 ctx.fillStyle = (rateText.match(/great|nice/i) == null) ? "rgba(120, 158, 215, 0.68)" : "rgb(177, 224, 125)"; // 色
//                 // ctx.fillText(rateText, RATING_TEXT_POS_X,  RATING_TEXT_POS_Y);
//                 ctx.fillText(rateText, effectPosX+NOTE_WIDTH/2,  JUDGE_LINE_Y*0.8);
//                 // rateText = null;
//                 if (!isPlaying)  rateText = null;
//                 ctx.restore();
//             }

//             // チェイン数
//             if (chainNum !== 0){
//                 ctx.fillText(chainNum+" CHAIN", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y + 16);
//             }

//             //スコア
//             ctx.textAlign = 'right'; //軸を文字列中央に持ってくる
//             ctx.fillText(score, SCORE_TEXT_POS_X,  SCORE_TEXT_POS_Y);

//             //エフェクト描画
//             // effect変数には整数が入り、０以上のときに描画
//             if (hitEffect > 0) {
//                 ctx.save();
//                 ctx.globalAlpha = hitEffect * 0.1; //opacity
//                 // drawGradRect(ctx, effectPosX, JUDGE_LINE_Y-EFFECT_HEIGHT,  NOTE_WIDTH, EFFECT_HEIGHT*1.5, [[0,"rgba(0, 0, 0, 0)"],[0.7,EFFECT_COLOR],[1,"rgba(0, 0, 0, 0)"]]);
//                 drawGradRect(ctx, effectPosX, JUDGE_LINE_Y-EFFECT_HEIGHT,  NOTE_WIDTH, EFFECT_HEIGHT, [[0,"rgba(0, 0, 0, 0)"],[1,EFFECT_COLOR]]);
//                 hitEffect--;
//                 ctx.restore();
//             }

//             //progress gauge
//             ctx.save();
//             var remainRatio = timer.time() / endhour;
//             ctx.fillStyle = "#d5e9f1"; // bg色
//             ctx.fillRect(PROGRESSBAR_X, PROGRESSBAR_Y, PROGRESSBAR_WIDTH, PROGRESSBAR_HEIGHT);
//             ctx.fillStyle = "#5099b6"; // ゲージ色
//             ctx.fillRect(PROGRESSBAR_X,PROGRESSBAR_Y, PROGRESSBAR_WIDTH * remainRatio, PROGRESSBAR_HEIGHT);
//             ctx.restore();

//             // レパートリーリスト消す
//             repertoryWrapper.style.visibility = "hidden";
//             // 停止ボタン
//             $id('pauseBtn').style.visibility = "visible";
//         }

//         // スタート＆リザルト画面
//         if(!isPlaying){
//             ctx.save();
//             ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // 色
//             ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

//             ctx.textAlign = 'center';
//             ctx.fillStyle = "rgba(255, 255, 255, 0.99)"; // 色
//             ctx.globalAlpha = 0.4; //opacity
//             ctx.fillText("TAP KEYBOARD or SCREEN to PLAY", RATING_TEXT_POS_X,  SCORE_TEXT_FONT_SIZE*2);
//             ctx.globalAlpha = 1; //opacity
//             if (score) {ctx.fillText("RESULT", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y);}
//             if (score) {ctx.fillText("SCORE: "+score+"", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*1.5);}
//             if (maxChain) {ctx.fillText("MAX-CHAIN: "+maxChain+" / "+fullChainNum, RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*3);}
//             // if (score) {ctx.fillText("結構歌えた！", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*5);}
//             ctx.restore();

//             repertoryWrapper.style.visibility = "visible";
//             $id('pauseBtn').style.visibility = "hidden";
//         }
//     }

//     /* 判定処理 */
//     function judge() {
//         var noteTime = noteList[currentNoteIndex]; // いまのノーツを見る
//         var _longEnd = null; //ロング最終位置を一時保持

//         //ロングノートだったら
//         if (typeof noteTime == 'object') {
//             _longEnd = noteTime[1];
//             noteTime = noteTime[0]; // ノーツを
//             _longEnd += wait;
//         }
//         noteTime += wait;

//         // 正判定位置からどれくらいずれているか
//         // var rTime = noteTime - music.currentTime + calib; // 再生位置と先頭ノーツ出現時間との差
//         var rTime = noteTime - timer.time() + calib; // 再生位置と先頭ノーツ出現時間との差
//         // console.log(longNote);
//         // 早押し・遅押しを区別しない
//         if (rTime < 0) rTime *= -1;

//         // 判定範囲外なら何もせず終了
//         if (rTime > RATING.out) return;

//         longNote = _longEnd;

//         if (rTime < RATING.great) return effect("great");

//         if (rTime < RATING.nice) return effect("nice");

//         if (rTime < RATING.good) return effect("good");

//         // miss確定
//         longNote = null;

//         if (rTime < RATING.out) return effect("miss");

//         // 判定受付範囲外の場合は無し
//         // 下のように書いても同じ

//         // if (){
//         // } else if (rTime) {
//         //
//         // }

//     }

//     /* 判定時の反応 reactionでもいいかも */
//     function effect(rating){
//         if (longNote == null) currentNoteIndex++; //ロングでなければ現在ノート消す

//         switch (rating) {
//             case "great":
//                 chainNum++;
//                 rateText = "GREAT!!!";
//                 playShot("clap");
//                 hitEffect = 16;
//                 score += SCORE.great;
//                 // console.log("great!!!");

//                 break;

//             case "nice":
//                 chainNum++;
//                 rateText = "NICE!";
//                 hitEffect = 10;
//                 playShot("clap");
//                 score += SCORE.nice;
//                 // console.log("nice!");
//                 break;

//             case "good":
//                 chainNum++;
//                 rateText = "GOOD";
//                 playShot("conga");
//                 score += SCORE.good;
//                 // console.log("good");
//                 // noteList.shift();
//                 break;

//             case "hold":
//                 // rateText = "HOLD!";
//                 // chainNum++;
//                 // playShot(se2);
//                 // score += SCORE.hold;
//                 break;

//             case "miss":
//                 miss();
//                 // noteList.shift();
//                 break;

//             default:
//                 break;
//         }
//         // 最大チェイン数更新：ゼロもしくは更新時
//         if (maxChain == 0 || maxChain <= chainNum) {
//             maxChain = chainNum;
//         }
//     }

//     // ミス時
//     function miss(){
//         chainNum = 0; // チェイン切る
//         rateText = "MISS...";
//     }

//     // ショット音再生
//     function playShot(key){
//         if(!enableSE) return;
//         if (isHTMLaudio){
//             //html5audio
//             // var audio = sounds[id];
//             var audio = RRAIN.Loader.getAsset(key);
//             // if(!audio.ended){
//                 //インスタンス使い回し：巻き戻し再生によって連続再生
//                 // audio.pause();
//                 // audio.currentTime = 0;  // 再生位置を0秒にする
//                 audio.paused = true;
//                 audio.position = 0;
//                 audio.play();
//         } else {
//             RRAIN.Loader.getAsset(key).play();
//             // createjs.Sound.play(id);
//         }
//     }

//     function playSound(audio){
//       audio.play();
//     }

//     function stopSound(audio){
//         // console.log("stop");
//         audio.stop();
//     //     if (createjs.Sound) {
//     //         // audio.stop();
//     //         audio.paused = true; //cjs //paused はplaySucceeded中にしか指定できない？
//     //         console.log(".paused;", audio.paused);
//     //         console.log("playstate:", music.playState);
//     //     } else {
//     //         audio.pause();
//     //     }
//     }

//     /* 入力処理 */
//     function onpointdown(e){
//         if (!enableInput) return;

//         //  ゲーム中以外
//         if (!isPlaying) {
//             gameReset();
//             isPlaying = true;
//             return;
//         }

//         //  ゲーム中
//         if (isPlaying){
//             if (autoPlay) return;
//             if (btnFlg) return;
//             btnFlg = true;
//             // if(longNote) return;
//             judge();
//         }else{
//             isPlaying = true;
//         }
//     }

//     function onpointup(e){
//         e.preventDefault();
//         if (!enableInput) return;
//         if (autoPlay) return;
//         btnFlg = false;
//     }

//     function varyNoteSpeed(dir, element){
//         var dir = (dir != null) ? dir : null;
//         if (dir === 'up' && noteSpeed < NOTE_SPEED_RANGE.max){
//             noteSpeed += 1;
//         } else if (dir === 'down' && NOTE_SPEED_RANGE.min < noteSpeed) {
//             noteSpeed -= 1;
//         }
//         element.innerHTML = noteSpeed;
//         // console.log(noteSpeed);
//     }

//     function importData(jsonData){
//         var dataobj;
//         try {
//             dataobj = JSON.parse(jsonData); //オブジェクト化
//         } catch(e) {
//             alert('譜面データをパース出来ませんでした');
//             console.log(e);
//         }
//         // 各数値代入
//         bpm = dataobj.BPM;
//         NOTE_LIST =  dataobj.noteList;
//         zerohour = dataobj.zerohour;
//         if(dataobj.endhour) endhour = dataobj.endhour + wait;
//     }

//     function pause(){
//         stopSound(music);
//         timer.pause();
//         isPlaying = false;
//     }

//     function setAutoPlay(){
//         autoPlay = (!autoPlay) ? true : false;
//         console.log('autoplay: ', autoPlay);
//     }
//     //==============================

//     /* コンフィグ入力 */
//     // $id('note-speed-up-button').onclick = function(){
//     //     varyNoteSpeed('up', $id('note-speed-display'));
//     // }
//     // $id('note-speed-down-button').onclick = function(){
//     //     varyNoteSpeed('down', $id('note-speed-display'));
//     // }

//     // $id('autoPlayBtn').addEventListener('click', setAutoPlay, false);

//     // $id('resetBtn').addEventListener('click', gameReset, false);

//     // $id('pauseBtn').addEventListener('click', pause);

//     // $id('seek').onblur = function(){
//     //     timer.setTime(this.value);
//     //     music.currentTime = this.value;
//     // }

// })(window);
