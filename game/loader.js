//
var getAudioBuffer = function(context, url, fn) {
    var req = new XMLHttpRequest();
    // array buffer を指定
    req.responseType = 'arraybuffer';
    console.log(context);
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            if (req.status === 0 || req.status === 200) {
                // array buffer を audio buffer に変換
                context.decodeAudioData(req.response, function(buffer) {
                    // コールバックを実行
                    fn(buffer);
                });
            }
        }
    };

    req.open('GET', url, true);
    req.send(null);
};

var _soundPreload = function(srcObj, register, fn){
    var _keys = Object.keys(srcObj);
    // var context = window.AudioContext || window.webkitAudioContext;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();

    _keys.forEach(function(key){
        if (context)
        {
            // webAudio
            getAudioBuffer(context, srcObj[key], function(buffer){
                register[key] = buffer; // 登録
                console.log("webAudio",Object.keys(register).length+" , 全音源: "+Object.keys(SOUND_ASSETS).length);
                if (Object.keys(register).length === _keys.length) fn(); // ロード完了後コールバック実行
            });
        } else
        {
            // html5audio
            var audio = new Audio(srcObj[key]);
            audio.load();
            var counter = 0;
            audio.addEventListener('loadeddata', function(){
                register[key] = audio; //登録
                console.log(Object.keys(register).length+" , 全音源:"+Object.keys(SOUND_ASSETS).length);
                if (Object.keys(register).length === _keys.length) fn(); //コールバック実行
            });
            audio.addEventListener('error', function(e){
                counter++;
                // console.log(counter);
                if (counter>10){
                    throw new Error(e.target.error);
                    alert('failed sound loading. Try reloading the browser', e);
                }else{
                    // try reloading
                    // audio.src = "./assets/Game_gadget_at_midnight.mp3"; //test用
                    audio.load();
                }
            });

        }
    });
}

// 画像
var _imagePreload = function(srcObj, register, fn){
    var _keys = Object.keys(srcObj);
    _keys.forEach(function(key){
        var img = new Image();
        // console.log(img);
        img.onload = function(){
            register[key] = img
            if (Object.keys(register).length === _keys.length){
                fn();
            }
        }
        img.src = srcObj[key];

        img.onerror = function(e){
            console.log(e);
            alert('画像の読み込みに失敗したようです...')
        }
    });
}
