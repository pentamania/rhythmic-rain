
/**
 * Game core class
 * ゲーム処理・描画等に関わる
 */
var RRAIN = RRAIN || {};
(function(ns){

  var Game = function(app) {
    this.timer = new Timer();
    this.canvas = app.canvas;
    this.bufferCanvas = document.createElement('canvas');
    this.music = null;
    this.bpm = 120;
    this.wait = 4;

    // 判定
    this.currentNoteIndex = 0;
    this._activeLongNote = null;
    this.hitEffects = [];
    this.noteList = [];

    // 設定関連
    this.adjustTime = 0;
    this.noteSpeedRate = 1;

    // 記録系
    this.score = 0;
    this.maxChain = 0;
    this.chainNum = 0;

    // flags
    this.isPlaying = false;
    this.isPressed = true;
    this.isAutoPlay = false;

    this._notePositions = createSpanArray(NOTE_POS_SPAN, 4, 8)
    this._notePositionsLen = this._notePositions.length;
  };

  Game.prototype = {

    init: function() {
      this._setInitCanvas();

      this._loop();
    },

    _setInitCanvas: function() {
      var girlImage = RRAIN.Loader.getAsset("girl");
      var streetLightImage = RRAIN.Loader.getAsset("streetLight")

      // Resize canvas
      var cw = this.canvas.width = this.bufferCanvas.width = SCREEN_WIDTH;
      var ch = this.canvas.height = this.bufferCanvas.height  = SCREEN_HEIGHT;

      // 背景は一度しか描画しないので、転写で使いまわす
      var bctx = this.bufferCanvas.getContext('2d');
      // bctx.fillStyle = "rgb(0, 0, 0)"; // TODO: themeによって変える？
      // bctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); //bgcolor

      // 女の子 > 水面 > 電灯の描画
      bctx.drawImage(girlImage, GIRL_POS_X, GIRL_POS_Y, 124*1.1*RATIO, 166*1.1*RATIO);
      drawGradRect(bctx, 0, JUDGE_LINE_Y, cw, ch-JUDGE_LINE_Y, [ [0, WATER_COLOR], [1, "rgba(255, 255, 255, 0)"] ]);
      bctx.drawImage(streetLightImage, LIGHT_POS_X, LIGHT_POS_Y, 132*RATIO, 358*RATIO);

      // フィルタ
      bctx.fillStyle = FILTER_COLOR;
      bctx.fillRect(0, 0, cw, ch);
    },

    _loop: function() {
      if (this.isPlaying) {
        this._update();
      };

      this._render();

      setTimeout(this._loop.bind(this), 1000/FPS);
    },

    _update: function() {
      var i, len;
      var noteTime;
      var noteList = this.noteList;
      var time = this.timer.time();
      var rTime;

      if (this.update) this.update();

      this.timer.update();
      // if (DEBUG_MODE) $id('time').innerHTML = timer.time(); //DEBUG

      // 時間が来たら音楽再生開始: 一回のみ
      if (!this.music._played && this.wait-this.zerohour < time) {
        console.log("music start");
        this.music.play();
        this.music._played = true;
      }

      // ゲーム終了
      // if (this.endhour < time) {
      //   console.log("music end");
      //   if (this.music.playing()) this.music.stop();
      //   this.isPlaying = false;
      // }

      for (i=this.currentNoteIndex, len=noteList.length; i < len; i++) {
        noteTime = noteList[i];

        // ロングノートだったら
        // if (typeof noteTime === 'object') {
        if (noteTime.length) {
          noteTime = noteTime[0];
        }

        // 無入力判定： 判定ラインを超え、かつ判定時間を過ぎたらmiss判定、そして次のターゲットへ
        // ロングノート判定中は引っかからないようにする
        if (!this._activeLongNote && noteTime+this.wait + RATING.good < time) {
          this.judge();
        }

        // TODO: オートプレイ
        //great範囲内に入ったら即座に反応
        // ロングノート判定中にロングノート情報を消さないようにする
        if (this.isAutoPlay && !this._activeLongNote) {
          if (noteTime + wait - RATING.great*0.5 < time) {
            this.judge();
          }
        }
      }

      // long note 処理
      if (this._activeLongNote != null) {
        rTime = this._activeLongNote - time + this.adjustTime;

        // ボタンを押している
        if (this.isPressed) {
          // 終了時間に達していない
          if (rTime > 0) {
            // hitEffect = 3;

          // 規定時間まで押しつづけた
          } else {
            this._activeLongNote = null;
            effect('great');
          }

        // 途中で離してしまった
        } else {
          this._activeLongNote = null;
          this.reaction('miss');
        }
      }

    },

    _render: function() {
      // Memo: corrをマイナスにすると、画面の下側からノーツが降る
      var ctx = this.canvas.getContext('2d');
      var noteList = this.noteList;
      var len = noteList.length;
      var buffer = this.bufferCanvas;
      var timer = this.timer;
      var noteHeight; // LNの場合は伸びる
       // ハイスピ等の補正
      var corr = this.bpm * 1.75 * RATIO * this.noteSpeedRate;

      var relativeTime = 0;
      var deltaY; // 判定ラインまでの距離
      var drawingPointX = 100; // X軸 描画開始位置
      var drawingPointY; // Y軸 描画開始位置
      var effectPosX = null; // エフェクトX位置
      var i, effect, noteTime;

      // 初期化
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 背景
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.drawImage(buffer, 0, 0, buffer.width, buffer.height);

      // ノーツレイヤー
      ctx.save();
      for (i=this.currentNoteIndex, len=noteList.length; i<len; i++) {
        drawingPointX = this._notePositions[i%this._notePositionsLen];
        noteTime = noteList[i];

        // noteTimeがarrayだったら == ロングノートだったら
        if (noteTime.length) {
          ctx.fillStyle = LONG_NOTE_COLOR;
          // 最終位置に合わせて、ノーツ高さを変更する
          noteHeight = - (noteTime[1] - noteTime[0]) * corr; //上方向に伸ばすため、マイナス値
          noteTime = noteTime[0];
        } else {
          noteHeight = NOTE_HEIGHT;
          ctx.fillStyle = NOTE_COLOR;
        }

        // 待ち時間を加算
        noteTime += this.wait;

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
      }

      ctx.restore();

      // スコア表示とか
      // フォント設定
      ctx.fillStyle = "white"; // 色は白
      ctx.font = SCORE_TEXT_FONT_SIZE+"px 'Audiowide'"; // フォントのウエイト、サイズ、ファミリー
      ctx.textAlign = 'center'; // 軸を文字列中央に持ってくる

      // プレイ中のみ表示
      if (this.isPlaying) {

        // "great!"とか
        if (this.rateText) {
          ctx.save();
          ctx.fillStyle = (rateText.match(/great|nice/i) == null) ? "rgba(120, 158, 215, 0.68)" : "rgb(177, 224, 125)"; // 色
          // ctx.fillText(rateText, RATING_TEXT_POS_X,  RATING_TEXT_POS_Y);
          ctx.fillText(rateText, effectPosX+NOTE_WIDTH/2,  JUDGE_LINE_Y*0.8);
          // rateText = null;
          if (!this.isPlaying) rateText = null;
          ctx.restore();
        }

        // チェイン数
        if (this.chainNum !== 0){
          ctx.fillText(this.chainNum+" CHAIN", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y + 16);
        }

        // スコア
        ctx.textAlign = 'right'; // 軸を文字列中央に持ってくる
        ctx.fillText(this.score, SCORE_TEXT_POS_X, SCORE_TEXT_POS_Y);

        // TODO エフェクト（破壊的なのでfor-reverse文）
        // for (i = this.hitEffects.length - 1; i >= 0; i -= 1) {
        //   effect = this.hitEffects[i];
        //   ctx.save();
        //   ctx.globalAlpha = effect.life * 0.1; //opacity
        //   drawGradRect(ctx, effect.posX, JUDGE_LINE_Y-EFFECT_HEIGHT,  NOTE_WIDTH, EFFECT_HEIGHT, [[0,"rgba(0, 0, 0, 0)"], [1, effect.color]]);
        //   effect.life--;
        //   if (effect.life < 0) this.hitEffects.splice(i, 1);
        //   ctx.restore();
        // }

        // progress bar
        ctx.save();
        var remainRatio = this.timer.time() / this.endhour;
        ctx.fillStyle = "#d5e9f1"; // bg色
        ctx.fillRect(PROGRESSBAR_X, PROGRESSBAR_Y, PROGRESSBAR_WIDTH, PROGRESSBAR_HEIGHT);
        ctx.fillStyle = "#5099b6"; // ゲージ色
        ctx.fillRect(PROGRESSBAR_X,PROGRESSBAR_Y, PROGRESSBAR_WIDTH * remainRatio, PROGRESSBAR_HEIGHT);
        ctx.restore();
      }

      // スタート＆リザルト画面
      if (!this.isPlaying) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // 色
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // PRESS START
        ctx.textAlign = 'center';
        ctx.fillStyle = "rgba(255, 255, 255, 0.99)"; // 色
        ctx.globalAlpha = 0.4; //opacity
        ctx.fillText("TAP KEYBOARD or SCREEN to PLAY", RATING_TEXT_POS_X,  SCORE_TEXT_FONT_SIZE*2);
        ctx.globalAlpha = 1; //opacity

        // if (score) {ctx.fillText("RESULT", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y);}
        // if (score) {ctx.fillText("SCORE: "+score+"", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*1.5);}
        // if (maxChain) {ctx.fillText("MAX-CHAIN: "+maxChain+" / "+fullChainNum, RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*3);}
        // if (score) {ctx.fillText("結構歌えた！", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*5);}

        ctx.restore();
      }
    },

    setNoteSpeedRate: function(v) {
      // TODO: 計算
      this.noteSpeedRate = v;
    },

    setMusic: function(music) {
      music.on('end', function() {
        console.log("game end");
        this.isPlaying = false;
        this.timer.pause();
      }.bind(this));

      this.music = music;
      this.endhour = music.duration();
    },

    setupGame: function(data) {
      this.noteList = [].concat(data.noteList);
      this.bpm = data.BPM;
      this.zerohour = data.zerohour;
    },

    reset: function() {
      this.currentNoteIndex = 0;
      this.music.stop();
      this.music._played = false;
      this.timer.reset();

      this.rateText = null;
      this.chainNum = 0;
      this.maxChain = 0;
      this.score = 0;
      this.hitEffects = [];

      if (this.isAutoPlay) this.isPressed = true;
    },

    start: function() {
      // repertoryWrapper.style.visibility = "visible";
      // $id('pauseBtn').style.visibility = "hidden";
      this.timer.run();
      this.isPlaying = true;
    },

    pause: function() {
      this.music.pause();
      this.timer.pause();
      this.isPlaying = false;
    },

    judge: function() {
      // if (!this.isPlaying) return;

      var noteTime = this.noteList[this.currentNoteIndex];
      var _longEnd; // ロング最終位置を一時保持
      var reaction = this.reaction.bind(this);

      // array(ロングノート)だったら
      if (typeof noteTime == 'object') {
        _longEnd = noteTime[1];
        noteTime = noteTime[0];
        _longEnd += this.wait;
      }

      noteTime += this.wait;

      // 正判定位置からどれくらいずれているか
      var rTime = Math.abs(noteTime - this.timer.time() + this.adjustTime);
      // console.log("rt", rTime);
      // 判定範囲外なら何もせず終了
      if (rTime > RATING.out) return;

      // ロング成功時
      if (_longEnd) this._activeLongNote = _longEnd;

      if (rTime < RATING.great) return reaction("great");
      if (rTime < RATING.nice) return reaction("nice");
      if (rTime < RATING.good) return reaction("good");

      // miss確定
      this._activeLongNote = null;
      if (rTime < RATING.out) return reaction("miss");
    },

    // TODO: effect描画位置の指定
    reaction: function(rating) {
      // ロングノートでなければターゲット進める
      // if (this._activeLongNote == null) this.currentNoteIndex++;

      this.currentNoteIndex++;
      // TEMP
      console.log(this, rating);
      return;

      if (rating === "hold") return;

      var ratingData = RATING_MAP[rating];
      if (rating !== "miss") {
        this.chainNum++;
        this.rateText = ratingData.message;
        this.playShot(ratingData.sound);
        this.hitEffects.push({
          life: ratingData.effectTime,
          posX: this._notePositions[this.currentNoteIndex%this._notePositionsLen],
          color: ratingData.effectColor,
        });
        this.score += ratingData.score;

      } else {
        // miss
        this.chainNum = 0; // チェイン切る
        this.rateText = "MISS...";
      }

      // 最大チェイン記録
      this.maxChain = Math.max(this.chainNum, this.maxChain);
      // if (maxChain == 0 || maxChain <= chainNum) {
      //     maxChain = chainNum;
      // }
    },

    playShot: function(key) {
      if (!this.enableSE) return;
      RRAIN.Loader.getAsset(key).play();
    },

    pointstart: function() {
      if (this.isAutoPlay) return;
      // console.log("push!", this.currentNoteIndex);

      this.isPressed = true;
      this.judge();
    },

    pointend: function() {
      if (this.isAutoPlay) return;

      this.isPressed = false;
      this.judge();
    },

  };

  ns.Game = Game;

  // Draw vertical 2-tone linear gradient rect
  function drawGradRect(context, x, y, width, height, color) {
    context.save();

    // グラデーション領域をセット
    var grad = context.createLinearGradient(x, y, x, y+height);

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

  /* arrayから */
  function createSpanArray(span, m, n, randomize){
    var array = [];
    for (var i = m; i < m+n; i++) {
      array.push(span * i);
    }
    if (randomize === true){
      for(var i = 0; i < array.length; i++) {
        swap(array, i, ((Math.random() * (array.length - i)) + i) | 0);
      }
    }

    return array;

    // randomize: http://nmi.jp/archives/541
    function swap(a, s, d) {
      var t = a[s];
      a[s] = a[d];
      a[d] = t;
    }
  };

}(RRAIN))