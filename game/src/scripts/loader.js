
;var RRAIN = RRAIN || {};
(function(ns){

  var Loader = {

    get LOADFUNC_MAP() {
      return {
        "image": this.loadImage,
        "json": this.loadJson,
        "sound": this.loadSound,
      };
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
          onload: function() {
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
        };
        img.onerror = function(e) {
          reject(e);
        };
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
        };

        xhr.send(null);
      });
    },

  };

  ns.Loader = Loader;

}(RRAIN));