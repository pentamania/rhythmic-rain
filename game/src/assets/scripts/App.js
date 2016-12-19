
/**
 * App class
 *
 * アプリ全体を管理するクラス
 */
var RRAIN = RRAIN || {};
var createCounter = createCounter;

(function(ns){
  var App = function() {

    this.canvas = $id("app");
    this.game = new ns.Game(this);
    this.music = null;
    this.musicList;
    this.noteSpeed = 0;

    // flag
    this.enableInput = true;

    // Node refs
    this.refs = {
      musicDetail: $id("music-info"),
      repertoryList: $id("repertory"),
      repertoryWrapper: $id("repertory-wrapper"),
      musicNameDisplay: $id('music-name-display'),
      filterElement: $id("load-filter"),

      gameField: $id('game-field'),
      pauseBtn: $id('pause-btn'),
      autoPlayBtn: $id('autoplay-btn'),
      optionArea: $id('option-area'),

      // restartBtn: $id('restart-btn'),
      resultOptions: $id('result-options'),
      twitterShareBtn: $id('twitter-share-btn'),
    };

    // デバッグ要素消す
    var debugElm = $id('debug-container');
    if (!DEBUG_MODE) debugElm.parentNode.removeChild(debugElm);

    this._init();
  };

  App.prototype = {

    _init: function() {

      // サイズを合わせ
      this.refs.gameField.style.width = SCREEN_WIDTH +"px";
      this.refs.gameField.style.height = SCREEN_HEIGHT +"px";

      // ロード画面が全体を覆うようにする
      resizeCover(this.refs.filterElement);
      window.addEventListener('resize', function(){
        resizeCover(this.refs.filterElement);
      }.bind(this));

      // DOM初期状態
      this.changeState("initial");

      this.toggleLoadingState(true);
      // アセットのロード開始
      RRAIN.Loader.loadBatch({
        "image": IMAGE_ASSETS,
        "sound": SOUND_ASSETS,
        "json": {
          "musicList": MUSIC_LIST_PATH
        }
      })
      .then(this.init.bind(this))
      .catch(function(){
        this.toggleLoadingState(false);
        alert("何かおかしいようです");
      }.bind(this));
    },

    init: function() {
      this.toggleLoadingState(false);
      var musicList = this.musicList = RRAIN.Loader.getAsset("musicList").data.list;

      this._checkBrowserSupport();
      this.setupInputEvent();
      this.setupRepertoryList(musicList);
      this._setupOptions();

      // ツイートリンク等の位置を調整
      this.refs.resultOptions.style.top = RESULT_OPT_POSITION+"px";

      this.game.init();
      // this.adjustTiming(-100);
    },

    _checkBrowserSupport: function() {
      var ua = navigator.userAgent.toLowerCase();
      var unsupported = (ua.indexOf("android")>0 || ua.indexOf("MSIE")>0 || ua.indexOf("trident")>0);

      if (unsupported) {
        alert('ご使用のブラウザは推奨環境下ではありません。\nGoogle chrome (PC)、もしくはiOS safariでのプレイをオススメします');
        this.toggleSE(false);
      }
    },

    setTwitterShareLink: function(score) {
      var msg = "☔";
      var pre = 'https://twitter.com/share?';
      var euc = encodeURIComponent;
      var tweetText = msg+" - "+this.music._musicName+" スコア： "+score;
      var queries = [
        "text="+euc(tweetText),
        "hashtags="+euc("リズミックレイン"),
        "url="+euc(location.href)
      ];
      var url = pre+queries.join('&');

      // this.refs.twitterShareBtn.setAttribute('href', url);
      this.refs.twitterShareBtn.onclick = function() {
        window.open(url, 'share window', 'width=480, height=320');
      };
    },

    setupInputEvent: function() {
      var self = this;

      // keydown
      var pointstartFunc = function(e) {
        // ロード中などは何もしない
        if (!self.enableInput) return;
        // e.preventDefault();

        // ゲーム中 -> インタラクション
        // if (self.game.isPlaying) {
        if (self.game.playState === "playing") {
          if (self.game.pointstart) self.game.pointstart(e);

        // ポーズ中 -> ポーズ解除
        } else if (self.game.playState === "pause") {
          self.changeState("playing");
          self.game.play();

        // それ以外(idle中など) -> リセットしてゲーム開始
        } else {
          if (!self.music) {
            // alert("Select Music! 曲を選んで下さい");
            return;
          }

          self.music.stop();
          self.game.reset();
          self.game.play();
          self.changeState("playing");
        }
      };

      this.canvas.addEventListener('mousedown', function(e){ e.preventDefault(); pointstartFunc(e);}, false);
      this.canvas.addEventListener('touchstart',  function(e){ e.preventDefault(); pointstartFunc(e);}, false);
      document.addEventListener('keydown', function(e){
        // e.preventDefault();
        pointstartFunc(e);
      });

      // keyup
      var onpointup = function(e) {
        e.preventDefault();
        if (self.game.pointend && self.game.playState === "playing") self.game.pointend(e);
      };
      this.canvas.addEventListener('mouseup', onpointup, false);
      this.canvas.addEventListener('touchend', onpointup, false);
      document.addEventListener('keyup', onpointup, false);

      // pause
      this.refs.pauseBtn.addEventListener('click', this._togglePause.bind(this), false);

      // autoplay button
      this.refs.autoPlayBtn.onchange = function(e) {
        // console.log(e.target.checked);
        self.game.isAutoPlay = e.target.checked;
      };
    },

    _setupOptions: function() {
      var size = 40;
      // Rain speed change
      var counter = createCounter({
        label: "SPEED",
        callback: this.varyNoteSpeed.bind(this),
        buttonClass: "t-blue",
        width: size,
      });
      this.refs.optionArea.appendChild(counter);

      // timing adjust
      counter = createCounter({
        label: "ADJUST",
        callback: this.adjustTiming.bind(this),
        buttonClass: "t-green",
        width: size,
      });
      this.refs.optionArea.appendChild(counter);
    },

    _togglePause: function() {
      if (this.game.playState === "pause") {
        // ポーズ解除
        this.changeState("playing");
        this.game.play();
      } else {
        this.changeState("pause");
        this.game.pause();
      }
    },

    /* レパートリーリスト要素を立ち上げ */
    setupRepertoryList: function(musicList) {
      var self = this;

      musicList.forEach(function(music) {
        var li = document.createElement('li');
        li.textContent = music.name;
        li.style.background = DEFAULT_COLOR;
        li.style.opacity = DEFAULT_OPACITY;

        // 初期設定
        // self.updateMusicDetail(musicList[0]);

        // 各選択肢にクリック・タップイベント設定
        li.addEventListener('mousedown', _handleClick, false);
        li.addEventListener('touchstart', _handleClick, false);

        self.refs.repertoryList.appendChild(li);

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
              alert("音源のロードに失敗しました"+error);
              self.toggleLoadingState(false);
            });

            // 譜面情報の取得
            var p2 = RRAIN.Loader.loadJson(DATA_PATH+music.fumen, "chart_"+music.name)
            .then(function(res){
              self.game.setupGame(res.data);
            })
            .catch(function(error){
              alert("譜面のロードに失敗しました"+error);
              // console.error(error);
              self.toggleLoadingState(false);
            });

            // ロードを終えたら
            Promise.all([p1,p2])
            .then(postFunc);
          } else {
            // ロード済み
            self.music = selectedMusic;
            self.game.setupGame(RRAIN.Loader.getAsset("chart_"+music.name).data);
            postFunc();
          }

          function postFunc() {
            self.toggleLoadingState(false);
            // self.endhour = self.music.duration() + self.wait;
            self.music.play(); // 試聴
            self.music._musicName = music.name;
            // self._currentMusicName = music.name;
            self.game.setMusic(self.music); // Gameに音楽をセット
            self.game.reset(); // ゲームリセット
            self.refs.musicNameDisplay.innerHTML = "♪ " + music.name;
          }
        }
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
          li.innerHTML = "ARTIST: "+ inner;
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

    varyNoteSpeed: function(val) {
      this.game.setNoteSpeed(val);
    },

    adjustTiming: function(val) {
      this.game.adjustTiming(val);
    },

    changeState: function(state) {
      this.game.playState = state;
      // console.log("changestate "+state)

      switch (state) {
        case "pause":
          // this.refs.repertoryWrapper.style.visibility = "visible";
          this.refs.repertoryWrapper.style.display = "block";
          this.refs.pauseBtn.style.visibility = "hidden";
          break;

        case "playing":
          // this.refs.repertoryWrapper.style.visibility = "hidden";
          this.refs.repertoryWrapper.style.display = "none";
          this.refs.pauseBtn.style.visibility = "visible";
          this.refs.resultOptions.style.visibility = "hidden";
          break;

        case "idle":
          // this.refs.repertoryWrapper.style.visibility = "visible";
          this.refs.repertoryWrapper.style.display = "block";
          this.refs.pauseBtn.style.visibility = "hidden";
          this.refs.resultOptions.style.visibility = "visible";
          break;

        default:
          // 初期状態
          this.refs.pauseBtn.style.visibility = "hidden";
          this.refs.resultOptions.style.visibility = "hidden";
          break;
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

      this.refs.filterElement.style.visibility = visibility;
    },
  };

  ns.App = App;

  // == utils ==

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

}(RRAIN));