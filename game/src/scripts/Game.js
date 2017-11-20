
/**
 * Game core class
 * ゲーム処理・描画等に関わる
 */
var RRAIN = RRAIN || {};
(function(ns){

  var Game = function(app) {
    this.timer = new Timer();
    this.canvas = app.canvas;
    this._bufferCanvas = document.createElement('canvas');
    this.app = app;

    this.music = null;
    this._bpm = 120;
    this.wait = 2.3; // sec
    this._theme = "night";

    // 判定
    this._currentNoteIndex = 0;
    this._activeLongNote = null;
    this._hitEffects = [];
    this._noteList = [];

    // 設定関連
    this._adjustedGap = 0;
    this._noteSpeedRate = 1;

    // 記録
    this.score = 0;
    this._chainNum = 0;
    this._maxChain = 0;
    this._fullChainNum = 0;

    // flags
    // this.isPlaying = false;
    this.isAutoPlay = false;
    this.playState = "initial";
    this._isPressed = true;
    this.enableSE = true;

    this._notePositions = [];
    this._notePositionsLen = 0;
    this.setNotePositions(RANDOMIZE_INIT_STAT);
  };

  Game.prototype = {

    init: function() {
      this._initCanvas();

      // スタート
      this._loop();
    },

    _initCanvas: function() {
      var girlImage = RRAIN.Loader.getAsset("girl");
      var streetLightImage = RRAIN.Loader.getAsset("streetLight");

      // Resize canvas
      var cw = this.canvas.width = this._bufferCanvas.width = SCREEN_WIDTH;
      var ch = this.canvas.height = this._bufferCanvas.height = SCREEN_HEIGHT;

      // 背景は一度しか描画しないので、転写で使いまわす
      var bctx = this._bufferCanvas.getContext('2d');

      // 女の子 > 水面 > 電灯の描画
      bctx.drawImage(girlImage, GIRL_POS_X, GIRL_POS_Y, 124*1.1*RATIO, 166*1.1*RATIO);
      drawGradRect(bctx, 0, JUDGE_LINE_Y, cw, ch-JUDGE_LINE_Y, [ [0, WATER_COLOR], [1, "rgba(255, 255, 255, 0)"] ]);
      bctx.drawImage(streetLightImage, LIGHT_POS_X, LIGHT_POS_Y, 132*RATIO, 358*RATIO);

      // フィルタ
      bctx.fillStyle = FILTER_COLOR;
      bctx.fillRect(0, 0, cw, ch);
    },

    _loop: function() {
      // if (this.isPlaying) {
      if (this.playState === "playing") {
        this._update();
      }

      this._render();

      setTimeout(this._loop.bind(this), 1000/FPS);
    },

    _update: function() {
      this.timer.update();

      var i, len;
      var noteTime;
      var noteList = this._noteList;
      var time = this.timer.time();
      var rTime;
      if (this.isAutoPlay) this._isPressed = true;

      // if (DEBUG_MODE) $id('time').innerHTML = timer.time(); //DEBUG

      // 時間が来たら音楽再生開始: 一回のみ
      if (!this.music._played && (this.wait-this.zerohour) < time) {
        // console.log("music start");
        this.music.play();
        this.music._played = true;
      }

      // ノーツ状態変更
      for (i=this._currentNoteIndex, len=noteList.length; i < len; i++) {
        noteTime = noteList[i];

        // ロングノートだったら
        // if (typeof noteTime === 'object') {
        if (noteTime.length) {
          noteTime = noteTime[0] + this._adjustedGap;
        } else {
          noteTime += this._adjustedGap;
        }

        // オートプレイ: great範囲内に入ったら即座に反応
        // ロングノート判定中にロングノート情報を消さないようにする
        if (this.isAutoPlay && !this._activeLongNote) {
          if (noteTime + this.wait - RATING_DATA_MAP.great.range*0.5 < time) {
            this._judge();
          }
        }

        // 無入力判定： 判定ラインを超え、かつ判定時間を過ぎたらmiss判定、そして次のターゲットへ
        // ロングノート判定中は引っかからないようにする
        if (this._activeLongNote == null && noteTime+this.wait + RATING_DATA_MAP.good.range < time) {
          this._judge();
        }
      }

      // long note 処理
      if (this._activeLongNote != null) {
        // rTime = this._activeLongNote - time + this._adjustedGap;
        rTime = this._activeLongNote - time;

        // ボタンを押している
        if (this._isPressed) {
          // 終了時間に達していない
          if (0 < rTime) {
            // this._reaction('hold');

          // 規定時間まで押しつづけた
          } else {
            this._reaction('great');
            this._activeLongNote = null;
            this._currentNoteIndex++;
          }

        // 途中で離してしまった
        } else {
          this._reaction('miss');
          this._activeLongNote = null;
          this._currentNoteIndex++;
        }
      }

    },

    _render: function() {
      // Memo: corrをマイナスにすると、画面の下側からノーツが降る
      var ctx = this.canvas.getContext('2d');
      var noteList = this._noteList;
      var len = noteList.length;
      var buffer = this._bufferCanvas;
      var timer = this.timer;
      var noteHeight; // LNの場合は伸びる

       // ハイスピ等の補正
      var corr = this._bpm * 1.75 * RATIO * this._noteSpeedRate;

      var relativeTime = 0;
      var deltaY; // 判定ラインまでの距離
      var drawingPointX = 100; // X軸 描画開始位置
      var drawingPointY; // Y軸 描画開始位置
      var i, effect, noteTime;

      // 初期化
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 背景、テーマによって変える
      ctx.fillStyle = THEME_COLOR[this._theme];
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.drawImage(buffer, 0, 0, buffer.width, buffer.height);

      // ノーツ描画
      ctx.save();
      for (i=this._currentNoteIndex, len=noteList.length; i<len; i++) {
        drawingPointX = this._notePositions[i%this._notePositionsLen];
        noteTime = noteList[i];

        if (noteTime.length) {
          // noteTimeがarrayだったら == ロングノートだったら
          ctx.fillStyle = LONG_NOTE_COLOR;
          // 最終位置に合わせて、ノーツ高さを変更する（基準を底辺側にするため、マイナス値を指定）
          noteHeight = -(noteTime[1] - noteTime[0]) * corr;
          noteTime = noteTime[0];
        } else {
          // 単ノーツ: 上下反転しても対応
          noteHeight = (corr < 0) ? NOTE_HEIGHT : -NOTE_HEIGHT;
          ctx.fillStyle = NOTE_COLOR;
        }

        // 待ち時間を加算
        noteTime += this.wait + this._adjustedGap;

        // 描画位置を決める
        relativeTime = noteTime - timer.time();
        deltaY = relativeTime * corr;
        // drawingPointY = NOTE_DEST_Y - deltaY;
        drawingPointY = JUDGE_LINE_Y - deltaY;

        // 画面外だったら描画をスキップして次のループへ
        if (drawingPointY < -10) continue;

        // 判定ライン位置でストップ & ロングノートの場合高さを縮める
        if (relativeTime < 0) {
          noteHeight -= relativeTime * corr;
          // drawingPointY = NOTE_DEST_Y;
          drawingPointY = JUDGE_LINE_Y;
        }

        // ノーツ描く
        ctx.fillRect(drawingPointX, drawingPointY, NOTE_WIDTH, noteHeight);
      }
      ctx.restore();

      // UI系 スコア表示とか
      // 基本フォント設定
      ctx.fillStyle = "white"; // 色は白
      ctx.font = SCORE_TEXT_FONT_SIZE+"px 'Audiowide'"; // フォントのウエイト、サイズ、ファミリー
      ctx.textAlign = 'center';

      // プレイ中のみ表示
      // if (this.isPlaying) {
      if (this.playState === "playing") {

        // チェイン数
        if (this._chainNum !== 0) {
          ctx.fillText(this._chainNum+" CHAIN", RATING_TEXT_POS_X, RATING_TEXT_POS_Y + 16);
        }

        // スコア
        ctx.textAlign = 'right';
        ctx.fillText(this.score, SCORE_TEXT_POS_X, SCORE_TEXT_POS_Y);

        // エフェクト（破壊的なのでfor-reverse文）
        for (i = this._hitEffects.length - 1; i >= 0; i -= 1) {
          effect = this._hitEffects[i];
          ctx.save();
          ctx.globalAlpha = effect.life * 0.1; //opacity
          drawGradRect(ctx, effect.posX, JUDGE_LINE_Y-EFFECT_HEIGHT,  NOTE_WIDTH, EFFECT_HEIGHT, [[0,"rgba(0, 0, 0, 0)"], [1, effect.color]]);
          effect.life--;
          if (effect.life < 0) this._hitEffects.splice(i, 1);
          ctx.restore();

          // "great!"とか
          ctx.save();
          // ctx.fillStyle = (rateText.match(/great|nice/i) == null) ? "rgba(120, 158, 215, 0.68)" : "rgb(177, 224, 125)"; // 色
          ctx.globalAlpha = effect.life * 0.1; //opacity
          ctx.textAlign = 'center';
          ctx.fillStyle = effect.color;
          ctx.fillText(effect.message, effect.posX+NOTE_WIDTH/2,  JUDGE_LINE_Y*0.8);
          // if (!this.isPlaying) rateText = null;
          ctx.restore();
        }

        // progress bar
        ctx.save();
        var remainRatio = this.music.seek() / this.endhour;
        remainRatio = Math.min(remainRatio, 1.0);
        ctx.fillStyle = "#d5e9f1"; // bg色
        ctx.fillRect(PROGRESSBAR_X, PROGRESSBAR_Y, PROGRESSBAR_WIDTH, PROGRESSBAR_HEIGHT);
        ctx.fillStyle = "#5099b6"; // ゲージ色
        ctx.fillRect(PROGRESSBAR_X,PROGRESSBAR_Y, PROGRESSBAR_WIDTH * remainRatio, PROGRESSBAR_HEIGHT);
        ctx.restore();
      }
      else {
        // スタート or リザルト画面
        ctx.save();

        // くろフィルター
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // 色
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // "PRESS START"
        ctx.textAlign = 'center';
        ctx.fillStyle = "rgba(255, 255, 255, 0.99)"; // 色
        ctx.globalAlpha = 0.4; //opacity
        ctx.fillText("TAP KEYBOARD or SCREEN to PLAY/RESUME", RATING_TEXT_POS_X,  SCORE_TEXT_FONT_SIZE*2);
        ctx.globalAlpha = 1; //opacity

        // リザルト表示
        if (this.score != 0) {
        // if (this.playState !== "initial") {
          // 見出し
          ctx.save();
          ctx.fillStyle = "#45C1F4";
          if (this.playState === "pause") {
            ctx.fillText("PAUSE", RATING_TEXT_POS_X, RATING_TEXT_POS_Y);
          } else {
            ctx.fillText("RESULT", RATING_TEXT_POS_X, RATING_TEXT_POS_Y);
          }
          ctx.restore();

          // トータルスコア
          ctx.fillText("SCORE: "+this.score+"", RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*1.5);

          // Max chain
          ctx.fillText("MAX-CHAIN: "+this._maxChain+" / "+this._fullChainNum, RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*3);
          // if (this._maxChain != 0) {ctx.fillText("MAX-CHAIN: "+this._maxChain+" / "+this._fullChainNum, RATING_TEXT_POS_X,  RATING_TEXT_POS_Y+SCORE_TEXT_FONT_SIZE*3);}
        }

        ctx.restore();
      }
    },

    setNoteSpeed: function(v) {
      var rate = 1+0.125*v;
      // this._noteSpeedRate = Math.max(rate, 0.1);
      this._noteSpeedRate = rate;
    },

    setNotePositions: function(randomize) {
      this._notePositions = createSpanArray(NOTE_POS_SPAN, 4, 8, randomize);
      this._notePositionsLen = this._notePositions.length;
    },

    adjustTiming: function(v) {
      // 正の数ほど判定が遅くなる（早ずれ気味のときに修正）
      // 負の数ほど判定が早ずれ
      this._adjustedGap = v/1000;
      // console.log(this._adjustedGap)
    },

    setMusic: function(music) {
      music.on('end', this.end.bind(this));

      this.music = music;
      this.endhour = music.duration();
    },

    setupGame: function(data) {
      this._noteList = [].concat(data.noteList);
      this._bpm = data.BPM;
      this.zerohour = data.zerohour;
      this._theme = data.theme || "night";

      // 理論チェイン数
      this._fullChainNum = 0;
      data.noteList.forEach(function(note) {
        if (note.length){
          this._fullChainNum += 2;
        } else {
          this._fullChainNum++;
        }
      }.bind(this));
    },

    reset: function() {
      this._currentNoteIndex = 0;
      // this.music.stop();
      this.music._played = false;
      this.timer.reset();

      this._chainNum = 0;
      this._maxChain = 0;
      this.score = 0;
      this._hitEffects = [];

      this.playState = "idle";
    },

    play: function() {
      // ポーズ解除時
      if (this.music.seek() !== 0) {
        this.timer.setTime(this.music.seek()-this.zerohour+this.wait);
        this.music.play();
        // console.log(this.timer.time())
      }

      this.timer.run();
      // this.isPlaying = true;
      this.playState = "playing";
    },

    pause: function() {
      this.music.pause();
      this.timer.pause();
      // console.log(this.timer.time())

      // this.isPlaying = false;
      this.playState = "pause";
    },

    end: function() {
      // console.log("game end");
      this.app.changeState("idle");
      // this.isPlaying = false;
      this.timer.pause();
      this.app.setTwitterShareLink(this.score);
    },

    _judge: function(noteTime) {
      noteTime = (noteTime) ? noteTime : this._noteList[this._currentNoteIndex];

      if (typeof noteTime === "undefined") {
       this._playShot("empty");
       return;
      }

      var _longEnd; // ロング最終位置を一時保持
      var reaction = this._reaction.bind(this);

      // array(ロングノート)だったら
      if (typeof noteTime === 'object') {
        _longEnd = noteTime[1] + this.wait + this._adjustedGap;
        noteTime = noteTime[0];
      }

      noteTime += this.wait + this._adjustedGap;

      // 正判定位置からどれくらいずれているか
      // var rTime = noteTime - this.timer.time() + this._adjustedGap;
      var rTime = noteTime - this.timer.time();
      var rTimeAbs = Math.abs(rTime);
      var RDM = RATING_DATA_MAP;

      // 判定範囲外なら何もせず終了
      if (RDM.out.range < rTime) {
        this._playShot("empty");
        return;
      }
      // console.log(note)

      // ロング成功時
      if (_longEnd) this._activeLongNote = _longEnd;

      if (rTimeAbs < RDM.great.range) return reaction("great");
      if (rTimeAbs < RDM.nice.range) return reaction("nice");
      if (rTimeAbs < RDM.good.range) return reaction("good");

      // miss確定
      this._activeLongNote = null;
      return reaction("miss");
    },

    // effect描画等
    _reaction: function(rating) {
      var ratingData = RATING_DATA_MAP[rating];
      var posX = this._notePositions[this._currentNoteIndex%this._notePositionsLen];

      if (rating !== "miss") {
        if (rating === "hold") {
          this._hitEffects.push({
            life: ratingData.effectTime,
            posX: posX,
            color: ratingData.color,
            message: "",
          });

        } else {
          this._chainNum++;

          this._playShot(ratingData.sound);
          this._hitEffects.push({
            life: ratingData.effectTime,
            posX: posX,
            color: ratingData.color,
            message: ratingData.message,
          });

          this.score += ratingData.score;
        }

      } else {
        // miss
        this._chainNum = 0; // チェイン切る
        this._hitEffects.push({
          life: ratingData.effectTime,
          posX: posX,
          color: ratingData.color,
          message: ratingData.message,
        });
      }

      // ロングノートでなければターゲット進める
      if (this._activeLongNote == null) this._currentNoteIndex++;
      // this._currentNoteIndex++;

      // 最大チェインを記録
      this._maxChain = Math.max(this._chainNum, this._maxChain);
    },

    _playShot: function(key) {
      if (!this.enableSE) return;
      RRAIN.Loader.getAsset(key).play();
    },

    pointstart: function() {
      if (this.isAutoPlay || this._isPressed) return;
      // console.log("push!", this._currentNoteIndex);

      this._isPressed = true;
      this._judge();
    },

    pointend: function() {
      if (this.isAutoPlay || !this._isPressed) return;

      this._isPressed = false;
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
    context.fillStyle = grad;

    // 矩形を描画
    context.fillRect(x, y, width, height);

    context.restore();
  }

  /* ある位置から一定間隔(span)ずつずらした数値群の配列を返す（？） */
  function createSpanArray(span, m, n, randomize) {
    var array = [];
    for (var i = m; i < m+n; i++) {
      array.push(span * i);
    }
    if (randomize === true){
      for(i = 0; i < array.length; i++) {
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
  }

}(RRAIN));