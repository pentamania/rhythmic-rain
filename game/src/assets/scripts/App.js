
/**
 * App class
 * アプリ全体を管理するクラス
 */
var RRAIN = RRAIN || {};
(function(ns){
  var App = function() {
    var canvas = this.canvas = $id("app");

    this.game = new ns.Game(this);
    this.music = null;
    this.musicList;
    this.noteSpeed = 0;

    // flag
    this.enableInput = true;
    // this.isPlaying = false; // gameがもつ

    // Node refs
    this.refs = {
      musicDetail: $id("music-info"),
      repertoryList: $id("repertory"),
      musicNameDisplay: $id('music-name-display'),
      pauseBtn: $id('pause-btn'),
      filterNode: $id("load-filter"),
      gameField: $id('game-field'),
      noteSpeedDisplay: $id('note-speed-display'),
      // twitterShareLink: $id(),
      // startBtn: $id(),
      // this.timingAdjustment: $id('');
    // this.twitterShareLink = $id('');
    // var debugElm = $id('debug');
    };

    // if (!DEBUG_MODE) debugElm.parentNode.removeChild(debugElm);

    this.init();
  };

  App.prototype = {

    init: function() {
      // サイズを合わせ
      this.refs.gameField.style.width = SCREEN_WIDTH +"px";
      this.refs.gameField.style.height = SCREEN_HEIGHT +"px";

      resizeCover(this.refs.filterNode);
      window.addEventListener('resize', function(){
        resizeCover(this.refs.filterNode);
      });

      // ロード開始
      RRAIN.Loader.loadBatch({
        "image": IMAGE_ASSETS,
        "sound": SOUND_ASSETS,
        "json": {
          "musicList": MUSIC_LIST_PATH
        }
      })
      .then(function() {
        var musicList = this.musicList = RRAIN.Loader.getAsset("musicList").data.list;

        this._checkBrowserSupport();
        this.setupInputEvent();
        this.setupRepertoryList(musicList);
        this.game.init();

        console.log("init end");
      }.bind(this));
    },

    _checkBrowserSupport: function() {
      var ua = navigator.userAgent.toLowerCase();
      var unsupported = (ua.indexOf("android")>0 || ua.indexOf("MSIE")>0 || ua.indexOf("trident")>0);

      if (unsupported) {
        alert('ご使用のブラウザは推奨環境下ではありません。\nGoogle chrome (PC)、もしくはiOS safariでのプレイをオススメします')
        this.toggleSE(false);
      }
    },

    setupInputEvent: function() {
      var self = this;

      var onpointdown = function(e) {
        // ロード中などは何もしない
        if (!self.enableInput) return;
        // e.preventDefault();

        // TODO： ポーズ中など、より細かい状態に対応する？
        // ゲーム中： インタラクション
        if (self.game.isPlaying) {
          if (self.game.pointstart) self.game.pointstart(e);

        // ゲーム中以外: リセットしてゲーム開始
        } else {
          if (!self.music) {
            alert("Select Music! 曲を選んで下さい");
            return;
          }

          // DOM操作
          self.refs.repertoryList.style.visibility = "hidden";
          self.refs.pauseBtn.style.visibility = "visible";
          self.game.reset();
          self.game.start();
        }
      };

      var onpointup = function(e) {
        e.preventDefault();
        if (self.game.pointstart) self.game.pointstart(e);

        // if (!enableInput) return;
        // if (autoPlay) return;
        // btnFlg = false;
      }

      // keydown
      this.canvas.addEventListener('mousedown', function(e){ e.preventDefault(); onpointdown(e);}, false);
      this.canvas.addEventListener('touchstart',  function(e){ e.preventDefault(); onpointdown(e);}, false);
      document.addEventListener('keydown', function(e){
        // e.preventDefault();
        onpointdown(e);
      });

      // keyup
      this.canvas.addEventListener('mouseup', onpointup, false);
      this.canvas.addEventListener('touchend', onpointup, false);
      document.addEventListener('keyup', onpointup, false);
    },

    /* レパートリーリスト要素を立ち上げ */
    setupRepertoryList: function(musicList) {
      var self = this;

      musicList.forEach(function(music, index) {
        var li = document.createElement('li');
        li.textContent = music.name;
        // li.style.background = (index === activeMusicPointer) ? ACTIVE_COLOR : DEFAULT_COLOR;
        // li.style.opacity = (index === activeMusicPointer) ? 1.0 : DEFAULT_OPACITY;
        li.style.background = DEFAULT_COLOR;
        li.style.opacity = DEFAULT_OPACITY;

        // 初期設定
        // self.updateMusicDetail(musicList[0]);

        // 各選択肢にクリック・タップイベント設定
        li.addEventListener('mousedown', _handleClick, false);
        li.addEventListener('touchstart', _handleClick, false);

        function _handleClick(e) {
          if (self.music) self.music.stop(); // 再生中なら止める

          self.updateMusicDetail(music);

          // Reset all li style > Change selected li style
          var childs = self.refs.repertoryList.childNodes;
          Object.keys(childs).forEach(function(i) {
            var cs = childs[i].style;
            cs.background = DEFAULT_COLOR;
            cs.opacity = 0.5;
          });
          e.target.style.background = ACTIVE_COLOR;
          e.target.style.opacity = 1;

          // Music set
          var selectedMusic = RRAIN.Loader.getAsset(music.name);
          if (!selectedMusic) {
            // データ未ロード
            self.toggleLoadingState(true);

            // 音源の取得
            var p1 = RRAIN.Loader.loadSound(DATA_PATH+music.src, music.name)
            .then(function(res){
              self.music = res;
            })
            .catch(function(error){
              alert("音源のロードに失敗しました");
              console.error(error);
              self.toggleLoadingState(false);
            });

            // 譜面情報の取得
            var p2 = RRAIN.Loader.loadJson(DATA_PATH+music.fumen, "chart_"+music.name)
            .then(function(res){
              self.game.setupGame(res.data);
            })
            .catch(function(error){
              alert("譜面のロードに失敗しました");
              console.error(error);
              self.toggleLoadingState(false);
            });

            // ロードを終えたら
            Promise.all([p1,p2])
            .then(postFunc)
            ;

          } else {

            // ロード済み
            self.music = selectedMusic;
            self.game.setupGame(RRAIN.Loader.getAsset("chart_"+music.name).data);
            postFunc();
          }

          function postFunc() {
            self.toggleLoadingState(false);
            self.endhour = self.music.duration() + self.wait;
            self.music.play(); // 試聴
            self.game.setMusic(self.music); // Gameに音楽をセット
            self.refs.musicNameDisplay.innerHTML = "♪ " + music.name;
          }
        }

        self.refs.repertoryList.appendChild(li);
      });
    },

    updateMusicDetail: function(musicObj) {
      this.refs.musicDetail.innerHTML = null;

      Object.keys(musicObj).forEach(function(key) {
        if (key === "src" || key === "fumen" || key === "url") return;
        // if (key !== "name" || key !== "author" || key !== "difficulty") return;

        var val = musicObj[key];
        var li = document.createElement('li');
        if (key === "author") {
          // 作者名表示 アンカーつける
          var inner = "<a href=" + musicObj['url'] + ">" + val + "</a>";
          li.innerHTML = key.toUpperCase()+": "+ inner;
        } else if (key === "difficulty"){
          // 難易度： 星の数で表す
          li.innerHTML += key.toUpperCase()+": ";
          for (var i = 0; i < val; i++) {
            li.innerHTML +="&#9733";
          }
        } else {
          // その他、特に加工せず表示
          li.textContent = key.toUpperCase()+": "+ musicObj[key];
        }

        this.refs.musicDetail.appendChild(li);
      }.bind(this));
    },

    toggleSE: function(force) {
      if (force != null) {
        this.game.enableSE = force;
      } else {
        this.game.enableSE = !this.game.enableSE;
      }
    },

    toggleLoadingState: function(show) {
      var visibility;

      if (show) {
        visibility = "visible";
        this.enableInput = false;
      } else {
        visibility = "hidden";
        this.enableInput = true;
      }
      this.refs.filterNode.style.visibility = visibility
    },

    varyNoteSpeed: function(increment) {
      var noteSpeed = this.noteSpeed;

      if (increment === true && noteSpeed < NOTE_SPEED_RANGE.max){
        this.noteSpeed += 1;
      } else if (!increment && NOTE_SPEED_RANGE.min < noteSpeed) {
        this.noteSpeed -= 1;
      }

      this.game.setNoteSpeed(this.noteSpeed);
      this.noteSpeedDisplay.innerHTML = this.noteSpeed;
    },

  };

  ns.App = App;

  /* getElementById shorthand */
  function $id(id) { return document.getElementById(id); }

  /* 指定要素の幅・高さを画面全体に広げる */
  function resizeCover(element) {
    var target = element;

    var MaxHeight = Math.max(
      Math.max(document.body.clientHeight, document.body.scrollHeight),
      Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight)
    );
    target.style.height = MaxHeight+"px";

    var MaxWidth = Math.max(
      Math.max(document.body.clientWidth, document.body.scrollWidth),
      Math.max(document.documentElement.scrollWidth, document.documentElement.clientWidth)
    );
    target.style.width = MaxWidth + "px";
  }

}(RRAIN))