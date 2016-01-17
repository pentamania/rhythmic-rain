//
var _soundPreload = function(srcObj, register, fn){
    var _keys = Object.keys(srcObj);
    var context = false
    _keys.forEach(function(key){
        if (context)
        {
            // webAudio
            getAudioBuffer(srcObj[key], function(buffer){
                register[key] = buffer; // 登録
                console.log("webAudio",Object.keys(register).length+" , 全音源:"+Object.keys(SOUND_ASSETS).length);
                if (Object.keys(register).length === _keys.length) fn(); //コールバック実行
            })
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
