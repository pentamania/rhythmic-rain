// ( function ( mod ) {

//   // browserify ( commonJS )
//   if ( typeof exports === "object" ) {
//     var createjs = require( 'createjs' );
//     module.exports = mod();
//   } else {
//     window.loader = mod();
//   }

// } ) ( function ( ) {

//   var loader = function () {
//     // モジュールの本体
//   };
//   return  loader;

// } );

var RRAIN = RRAIN || {};
(function(ns){

  var Loader = {

    get LOADFUNC_MAP() {
      return {
        "image": this.loadImage,
        "json": this.loadJson,
        "sound": this.loadSound,
      }
    },

    _registered: {},

    getAsset: function(key) {
      if (this._registered[key] != null) {
        return this._registered[key];
      } else {
        // console.warn(key+ " does not exist");
        return false;
      }
    },

    loadBatch: function(assets) {
      var ps = new Array();
      var self = this;

      Object.keys(assets).forEach(function(type) {
        Object.keys(assets[type]).forEach(function(key) {
          var src = assets[type][key];
          var loadFunc = self.LOADFUNC_MAP[type].bind(self);
          ps.push(loadFunc(src, key));
        });
      });

      return Promise.all(ps);
    },

    loadSound: function(src, key) {
      var self = this;
      if (typeof Howl === "undefined") {
        console.error('Howler.js is not load');
        return;
      }

      return new Promise(function(resolve, reject) {
        var sound = new Howl({
          src: [src],
          onload: function(e) {
            self._registered[key] = sound;
            resolve(sound);
          },
          onloaderror: function(error) {
            reject(error);
          }
        });
      });
    },

    loadImage: function(src, key) {
      var self = this;
      // console.log(self)

      return new Promise(function(resolve, reject) {
        var img = new Image();
        img.onload = function() {
          self._registered[key] = img;
          resolve(img);
        }
        img.onerror = function(e) {
          reject(e);
        }
        img.src = src;
      });
    },

    loadJson: function(src, key) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open("get", src, true);
        // disable cache
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00 GMT');
        xhr.onreadystatechange = function() {
          if ((xhr.readyState === 4) && (xhr.status === 200)) {
            var json = {
              raw: xhr.responseText,
              data: JSON.parse(xhr.responseText)
            };
            resolve(json);
            self._registered[key] = json;
          }
        };
        xhr.onerror = function(err){
          resolve(err);
        }

        xhr.send(null);
      });
    },

  };

  ns.Loader = Loader;

}(RRAIN));


// var preloadOneSound = function(src, id, fn){
//     if (createjs.Sound) {
//         createjs.Sound.registerSound(src, id);
//         var _loadHandler = function(e) {
//             if(createjs.Sound.loadComplete(e.src)) {
//                 // var instance = createjs.Sound.createInstance(e.id);
//                 // fn(instance);
//                 fn(e);
//             }
//         }
//         // createjs.Sound.on("fileload", _loadHandler); // リスナー残る
//         createjs.Sound.on("fileload", _loadHandler, null, true); // 一回のみ実行して消える
//     }
// }

// var preloadSounds = function(srcObj, register, fn){
//     var _keys = Object.keys(srcObj);
//     // window.AudioContext = window.AudioContext || window.webkitAudioContext;
//     // var context = new AudioContext();
//     var counter = 0;
//     if (createjs.Sound) {
//         // console.log("using soundjs");

//         var _loadHandler = function(e) {
//             if(createjs.Sound.loadComplete(e.src)) {
//                 // console.log("loaded sound: "+e.id, e.src);
//                 register[e.id] = createjs.Sound.createInstance(e.id);
//                 counter++;
//                 // console.log(counter+" , 全音源: "+_keys.length);
//                 if (counter === _keys.length) {
//                     e.remove(); //イベントリスナ削除
//                     fn(); // ロード完了後コールバック実行
//                 }
//             }
//         }

//         createjs.Sound.on("fileload", _loadHandler);
//     }
//     _keys.forEach(function(key){
//         if (createjs.Sound) {
//             createjs.Sound.registerSound(srcObj[key], key); // (src, id)

//             // 以下NG: 複数回、実行されたり
//             // preloadOneSound(srcObj[key], key, function(e){
//             //     console.log("loaded sound: "+e.id, e.src);
//             //     register[e.id] = createjs.Sound.createInstance(e.id);
//             //     counter++;
//             //     console.log(Object.keys(register).length+" , 全音源: "+_keys.length);
//             //     if (Object.keys(register).length === _keys.length) fn(); // ロード完了後コールバック実行
//             // });
//         }
//         // if (context){
//         //     // webAudio
//         //     getAudioBuffer(context, srcObj[key], function(buffer){
//         //         register[key] = buffer; // 登録
//         //         console.log("webAudio",Object.keys(register).length+" , 全音源: "+Object.keys(SOUND_ASSETS).length);
//         //         if (Object.keys(register).length === _keys.length) fn(); // ロード完了後コールバック実行
//         //     });
//         // }
//         // else {
//         //     // html5audio
//         //     var audio = new Audio(srcObj[key]);
//         //     audio.load();
//         //     var counter = 0;
//         //     audio.addEventListener('loadeddata', function(){
//         //         register[key] = audio; //登録
//         //         console.log(Object.keys(register).length+" , 全音源:"+Object.keys(SOUND_ASSETS).length);
//         //         if (Object.keys(register).length === _keys.length) fn(); //コールバック実行
//         //     });
//         //     audio.addEventListener('error', function(e){
//         //         counter++;
//         //         // console.log(counter);
//         //         if (counter>10){
//         //             throw new Error(e.target.error);
//         //             alert('failed sound loading. Try reloading the browser', e);
//         //         }else{
//         //             // try reloading
//         //             // audio.src = "./assets/Game_gadget_at_midnight.mp3"; //test用
//         //             audio.load();
//         //         }
//         //     });
//         //
//         // }
//     });
// }

// // 画像
// var imagePreload = function(srcObj, register, fn){
//     var _keys = Object.keys(srcObj);
//     _keys.forEach(function(key){
//         var img = new Image();
//         img.onload = function(){
//             register[key] = img
//             if (Object.keys(register).length === _keys.length){
//                 fn();
//             }
//         }
//         img.src = srcObj[key];

//         img.onerror = function(e){
//             console.log(e);
//             alert('画像の読み込みに失敗したようです...')
//         }
//     });
// }

// var getXmlData = function(src, fn){
//     var xhr = new XMLHttpRequest();
//     //disable cache

//     xhr.open("get", src, true);
//     xhr.setRequestHeader('Pragma', 'no-cache');
//     xhr.setRequestHeader('Cache-Control', 'no-cache');
//     xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00 GMT');
//     xhr.onreadystatechange = function(){
//         // console.log(xhr);
//         if ((xhr.readyState === 4) && (xhr.status === 200)) {
//             return fn(xhr.responseText); //callback
//         }
//     };
//     xhr.onerror = function(e){
//         console.log(e);
//         alert('xmlエラー');
//     }
//     xhr.send(null);

// };
