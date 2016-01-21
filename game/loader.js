
var preloadOneSound = function(src, id, fn){
    if (createjs.Sound) {
        createjs.Sound.registerSound(src, id);
        var loadHandler = function(e) {
            if(createjs.Sound.loadComplete(e.src)) {
                var instance = createjs.Sound.createInstance(e.id);
                // fn(instance);
                fn(e);
            }
        }
        createjs.Sound.on("fileload", loadHandler);
    }
}
var preloadSounds = function(srcObj, register, fn){
    var _keys = Object.keys(srcObj);
    // window.AudioContext = window.AudioContext || window.webkitAudioContext;
    // var context = new AudioContext();
    var counter = 0;
    if (createjs.Sound) {
        console.log("using soundjs");

        var loadHandler = function(e) {
            if(createjs.Sound.loadComplete(e.src)) {
                // createjs.Sound.play(e.src);
                console.log("loaded sound: "+e.id, e.src);
                register[e.id] = createjs.Sound.createInstance(e.id);
                counter++;
                console.log(counter+" , 全音源: "+Object.keys(SOUND_ASSETS).length);
                if (Object.keys(register).length === _keys.length) fn(); // ロード完了後コールバック実行
            }
        }
        createjs.Sound.on("fileload", loadHandler);
    }
    _keys.forEach(function(key){
        if (createjs.Sound) {
            createjs.Sound.registerSound(srcObj[key], key); // (src, id)

            // 以下NG: _keys.length回、実行される
            // preloadOneSound(srcObj[key], key, function(e){
            //     register[e.id] = createjs.Sound.createInstance(e.id);
            //     counter++;
            //     console.log(counter+" , 全音源: "+Object.keys(SOUND_ASSETS).length);
            //     if (Object.keys(register).length === _keys.length) fn(); // ロード完了後コールバック実行
            // })
        }
        // if (context){
        //     // webAudio
        //     getAudioBuffer(context, srcObj[key], function(buffer){
        //         register[key] = buffer; // 登録
        //         console.log("webAudio",Object.keys(register).length+" , 全音源: "+Object.keys(SOUND_ASSETS).length);
        //         if (Object.keys(register).length === _keys.length) fn(); // ロード完了後コールバック実行
        //     });
        // }
        // else {
        //     // html5audio
        //     var audio = new Audio(srcObj[key]);
        //     audio.load();
        //     var counter = 0;
        //     audio.addEventListener('loadeddata', function(){
        //         register[key] = audio; //登録
        //         console.log(Object.keys(register).length+" , 全音源:"+Object.keys(SOUND_ASSETS).length);
        //         if (Object.keys(register).length === _keys.length) fn(); //コールバック実行
        //     });
        //     audio.addEventListener('error', function(e){
        //         counter++;
        //         // console.log(counter);
        //         if (counter>10){
        //             throw new Error(e.target.error);
        //             alert('failed sound loading. Try reloading the browser', e);
        //         }else{
        //             // try reloading
        //             // audio.src = "./assets/Game_gadget_at_midnight.mp3"; //test用
        //             audio.load();
        //         }
        //     });
        //
        // }
    });
}

// 画像
var imagePreload = function(srcObj, register, fn){
    var _keys = Object.keys(srcObj);
    _keys.forEach(function(key){
        var img = new Image();
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

var getXmlData = function(url, fn){
    var httpObj = new XMLHttpRequest();

    httpObj.open("get", url, true);
    httpObj.onload = function(){
        return fn(this.responseText); //callback
    };
    httpObj.onerror = function(e){
        console.log(e);
        alert('xmlエラー');
    }
    httpObj.send(null);

};
