
;(function(){
    var $id = function(id) { return document.getElementById(id); }

    // webaudio: http://phiary.me/webaudio-api-getting-started/
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();

    // Audio 用の buffer を読み込む
    var getAudioBuffer = function(url, fn) {
        var req = new XMLHttpRequest();
        // array buffer を指定
        req.responseType = 'arraybuffer';

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
        req.send('');
    };

    // サウンドを再生
    var playSound = function(buffer) {
      // source を作成
      var source = context.createBufferSource();
      // buffer をセット
      source.buffer = buffer;
      // context に connect
      source.connect(context.destination);
      // 再生
      source.start(0);
    //   console.log(context);
    };

    var noteList = [];
    var _shotList = []; // テスト再生用List
    // var music = new Audio("file:///C:/Users/masa/Dropbox/codesDB/simpleOtoge/assets/Game_gadget_at_midnight.mp3");
    var music = null;
    var clap;// = new Audio('./assets/clap.mp3');
    var duration = 0; //再生時間
    var _baseMag  = 90;
    var userMag  = 1.0;
    var magni = _baseMag * userMag; // 表示幅拡張率
    var zerohour = 0; // sec
    var _zero = zerohour * magni;
    var endhour = 0;
    // var bpm = 147;
    var bpm = 130;
    // var _beatTime = (1 / (bpm/60)); //4分ノーツの時間(秒)
    // var beatTimeWidth = beatTime*magni;
    var barTime = (1 / (bpm/60)) * 4 // 1小節の時間
    var barTimeWidth = barTime*magni // 1小節の表示幅
    var barNum = 0; // 小節数　曲の長さ/小節時間；音源ロードに計算
    // var unitTime = barTime/16; // 16分の時間幅：テスト再生に利用
    var quant = 4; // クオンタイズ
    // var unit = barTimeWidth / 16; // 16分の幅
    var beatUnit = barTimeWidth / quant; // 表示上の拍の長さ
    var NOTE_WIDTH = 3;
    var _longNoteStart = null;

    // flag
    var autoscroll = true;
    var autosaving = true;
    var canPlayShot = true;

    //bpm counter
    var bpmCounter = new BPMcounter();

    var currentTime = document.getElementById('currentTime');
    var mousePos = document.getElementById('mousePos');
    var canvas = document.getElementById('canvas');
    var c = canvas.getContext('2d');
    var tl = document.getElementById('timeline');
    var tlc = tl.getContext('2d');

    var _musicName = "dummy music";
    var fps = 1000 / 90;
    var page = 1;

    //延伸率変更
    var scaleRate = document.getElementById('scale');
    var _changeScaleRate = function(){
        magni = _baseMag * scaleRate.value; // 再生時間延長率
        updateVal();
        // _zero = zerohour * magni;
        // canvas.width = tl.width =  music.duration*magni;
        // barTimeWidth = barTime*magni // 1小節の表示幅
        // beatUnit = barTimeWidth / quant; // 表示上の伯の長さ
        // userMag = scaleRate.value;
        // console.log(scaleRate.value);
        // redraw(c);
    }
    scaleRate.addEventListener('input', _changeScaleRate);
    scaleRate.addEventListener('change', _changeScaleRate); // ie

    //音楽スタート位置
    document.getElementById("zerohour").oninput = function(){
        zerohour = Number(this.value);
        _zero = zerohour * magni;
        // redraw(c);
        updateVal();
    }

    //クオンタイズ change
    var quantize = document.getElementById('quantize');
    var _changeQuant = function(){
        quant = quantize.value;
        beatUnit = barTimeWidth / quant;
        redraw(c);
        // update();
    }
    $id("quantize").addEventListener('change', _changeQuant, false);
    quantize.addEventListener('click', _changeQuant, false);

    //再生速度変更
    var playbackRate = document.getElementById('playbackRate');
    var _changePlayRate = function(){
        music.playbackRate = playbackRate.value;
    }
    playbackRate.addEventListener('change', _changePlayRate);
    playbackRate.addEventListener('click', _changePlayRate);

    // 自動スクロールスイッチ
    var autoscrollSwitch = document.getElementById("autoscrollSwitch");
    autoscrollSwitch.checked = autoscroll;
    autoscrollSwitch.onclick = function(){
        autoscroll = !autoscroll;
        autoscrollSwitch.checked = autoscroll;
        this.blur();
    }

    // オートセーブスイッチ
    $id("autosaveSwitch").checked = autosaving;
    $id("autosaveSwitch").onclick = function(){
        autosaving = !autosaving;
        $id("autosaveSwitch").checked = autosaving;
        this.blur();
    }

    // score clear
    var clearBtn = document.getElementById('clearBtn');
    clearBtn.onclick = function(){
        this.blur();
        if (confirm("本当に譜面を消しますか？")){
            noteList = [];
            redraw(c);
        }else{
            return;
        }
    }

    // update after bpm change and import
    var bpmInput = document.getElementById('bpm');
    bpmInput.addEventListener('input', updateVal);
    function updateVal(){
        if (!music){
            console.warn("music not load");
            return;
        }
        bpm = bpmInput.value || bpm;
        // console.log('BPM changed: '+ bpm)
        barTime = (1 / (bpm/60)) * 4;
        barTimeWidth = barTime * magni;
        beatUnit = barTimeWidth / quant;
        _zero = zerohour * magni;
        duration = music.duration - zerohour;
        barNum = Math.round(duration / barTime);
        canvas.width = tl.width =  music.duration * magni;

        redraw(c);
    }

    // ロード後の初期化
    // music.onloadeddata = function(){
    //     // console.log(this);
    //     duration = music.duration - zerohour;
    //     barNum = Math.round(duration / barTime);
    //     canvas.width = tl.width =  music.duration*magni;
    //
    //     redraw(c);
    //     loadStorage();
    // }
    // music.onerror = function(){
    //     alert('音楽をロードしてね')
    // }

    // var isPlaying = false; // 再生中は redraw
    function _playMusic(audio){
        if(!audio) {
            throw new Error("no music!")
            return;
        }
        // 現在位置より前のノーツは鳴らさない
        _shotList = reloadShotList(audio, noteList, zerohour);

        // 再生中だったら止める
        if(!audio.paused){
            audio.pause();
            // isPlaying = false;
        }else{
            audio.play();
            // isPlaying = true;
        }
    }

    function reloadShotList(audio, modelList, zerohour){
        var shotList = [];
        for (var i=0, len=modelList.length ; i < len; i++) {
            var time = modelList[i];
            var currentTime = audio.currentTime;

            //ロングノート
            if (time.length){
                time.forEach(function(t){
                    if (t+zerohour > currentTime) {
                        shotList.push(t)
                    }
                });
            }else{
                if (time+zerohour > currentTime) {
                    shotList.push(time);
                    // console.log("i: "+i+": "+time+" vs "+currentTime);
                }
            }
        }

        return shotList;
    }

    // drawing
    // using canvas, tlc, barTimeWidth, beatUnit, zerohour,
    function redraw(c){
        // if(!c || !music) return;
        canvas.width = tl.width =  music.duration * magni; // for firefox
        var _current = music.currentTime * magni;
        var i, len;

        c.save();
        c.clearRect(0, 0, canvas.width, canvas.height);
        //background
        c.fillStyle = "#5a858a";
        c.fillRect(0, 0, canvas.width, canvas.height);

        // music area
        c.fillStyle = "rgb(211, 233, 196)";
        c.fillRect(_zero, 0, canvas.width-_zero, canvas.height);

        // 基準線
        len = canvas.width/beatUnit | 0;
        // var len = noteList.length;
        for (i = 1; i < len; i++) {
            c.fillStyle = "gray";
            c.fillRect(_zero+beatUnit * i - (NOTE_WIDTH*0.5), 0, NOTE_WIDTH, canvas.height)
        }

        // 小節ライン
        // c.fillStyle = "rgb(26, 69, 117)";
        // for (i = 0; i < barNum; i++) {
        //     c.fillRect(_zero+barTimeWidth*i, 0, 2, canvas.height);
        // }

        //ノーツのある位置を上書き
        for (i = 0, len=noteList.length; i < len; i++) {
            // c.fillRect(_zero+noteList[i]*unit-(NOTE_WIDTH*0.5), 0, NOTE_WIDTH, canvas.height)
            //ロングノート描画
            if (noteList[i].length){
                c.fillStyle = "rgba(160, 95, 224, 0.63)";
                var _start = _zero+noteList[i][0]*magni;
                var _end = _zero+noteList[i][1]*magni;
                c.fillRect(_start, 0, _end - _start, canvas.height);
            }else{
                c.fillStyle = "rgba(205, 53, 53, 0.8)";
                c.fillRect(_zero+noteList[i]*magni-(NOTE_WIDTH*0.5), 0, NOTE_WIDTH, canvas.height);
            }
            // c.moveTo(noteList[i]*unit, 0);
            // c.lineTo(noteList[i]*unit, canvas.height);
            // c.stroke();
        }

        //long note start point
        if (_longNoteStart){
            c.fillStyle = "rgb(43, 215, 161)";
            c.fillRect(_zero+_longNoteStart*magni-(NOTE_WIDTH*0.5), 0, NOTE_WIDTH, canvas.height);
        }

        // 再生位置ライン
        c.fillStyle = "white";
        c.fillRect(_current-1, 0, 2, canvas.height);

        c.restore();

        // timeline rendering (seek bar)
        tlc.save();
        tlc.clearRect(0, 0, tl.width, tl.height);
        tlc.fillStyle = "rgba(229, 213, 242, 0.51)";
        var _margin = tl.height*0.2;
        tlc.fillRect(0, _margin, tl.width, tl.height-(_margin*2));
        // bar line
        for (i = 0; i < barNum*2; i++) {
            tlc.fillStyle = "white";
            if (i%2 === 0){
                tlc.fillRect(_zero+barTimeWidth/2*i,  tl.height*0.5, 2, tl.height);
            } else {
                tlc.fillRect(_zero+barTimeWidth/2*i,  tl.height*0.5, 2, tl.height*0.5);
            }
            // text
            tlc.fillStyle = "rgb(237, 233, 247)";
            tlc.textAlign = "center";
            tlc.font = "bold 16px 'Arial'";
            // tlc.strokeText(i, _zero+barTimeWidth*i, 12);
            tlc.fillText(i, _zero+barTimeWidth*i+1, 12);
        }
        // seek point
        tlc.fillStyle = "rgba(71, 26, 108, 0.68)";
        tlc.fillRect(_current-2, 0, 4, tl.height);
        tlc.restore();

    }

    //マウスクラス関連
    var mouse = new function Mouse(){
        this.x = 0;
        this.y = 0;
    }
    function mouseMove(event){
        // マウスカーソル座標の更新
        mouse.x = event.pageX - canvas.offsetLeft;
        // mouse.y = event.pageY - canvas.offsetTop;
        mouse.x = event.pageX - tl.offsetLeft;
        // mouse.y = event.pageY - tl.offsetTop;
    }
    canvas.addEventListener('mousemove', mouseMove, true);
    tl.addEventListener('mousemove', mouseMove, true);

    function _addNote(list, e){
        var _x = mouse.x - _zero;
        // console.log(_x);
        var none = true; // タップしたところに何もなければtrueのまま
        // var unit = barTimeWidth/quant;
        var barNow =  Math.floor(_x / barTimeWidth)+1 // n小節目？
        var _newNote = Math.round(_x/beatUnit); // 指定拍単位でしかおけないようにする
        _newNote = _newNote *  (barTime / quant); // 実時間にもどす

        // noteList検索し、同じ数字があったらそれをnullにする。（spliceすると全検索できなくなる）
        for (var i = 0,len =  list.length; i < len; i++) {
            // console.log("ckeing "+ i+" : "+list[i])

            // tap vs long
            if (list[i].length){
                // console.log("added:"+ _newNote)
                var _start = list[i][0];
                var _last = list[i][1];
                if (_start-0.001 <= _newNote && _newNote <= _last+0.001){
                    // console.log("long removed");
                    // list.splice(i, 1);
                    list[i] = null;
                    none = false;
                    break;
                }
                // else{
                //     _temp.push(list[i]);
                // }
            } else {
                // tap vs tap
                // if (_newNote === list[i]) {
                if (list[i]-0.001 <= _newNote && _newNote <=  list[i]+0.001) {
                    // list.splice(i, 1);
                    list[i] = null;
                    // _removed.push(i);
                    none = false;
                    break;
                }
            }

            // long vs tap
            if (_longNoteStart != null) {
                var _startNote = (_longNoteStart < _newNote) ? _longNoteStart :  _newNote;
                var _endNote = (_startNote != _newNote) ?  _newNote : _longNoteStart;
                var _tgt = (list[i].length) ? list[i][0] : list[i];
                if (_startNote <= _tgt && _tgt <= _endNote){
                    console.log("long attach: remove"+ list[i]);
                    // _removed.push(i);
                    // list.splice(i, 1);
                    list[i] = null;
                    // break;
                }
                // else{
                //     _temp.push(list[i]);
                // }
            }
        }// -for end
        // list.forEach(function(n, i){
        //     if(n != null){
        //         // list.splice(i, 1);
        //         // console.log("n is"+n);
        //         _temp.push(n);
        //     }
        // })
        //新規追加
        if (none) {
            if (e.ctrlKey && !_longNoteStart){
                _longNoteStart = _newNote;
                console.log("_longNoteStart added");
            }else{
                if (_longNoteStart){
                    // 同じ場所には置けない
                    if (_longNoteStart !== _newNote){
                        _newNote = [_longNoteStart, _newNote];
                        _newNote.sort(function(a, b) {return a > b ? 1 : -1;}); // ソート
                    }
                    _longNoteStart = null;
                }
                list.push(_newNote);
                // _temp.push(_newNote);
            }
        }

        // null を省いて新たに配列入れなおし （もっといい方法があるかも）
        var _temp = list.filter(function(x){return x != null;});
        list.length = 0;
        _temp.forEach(function(n, i){
            // if(n != null){
            list.push(n);
            // }
        })
        // list = list.filter(function(x){return x != null;}) // NG:値渡しできない

        redraw(c);

        //ショット音リスト更新
        _shotList = reloadShotList(music, noteList, zerohour);
    }
    canvas.addEventListener('click', function(e){
        e.preventDefault();
        _addNote(noteList, e);

        if (autosaving) saveState();
    }, false);

    // シーク
    function _seek(audio){
        var _pos = mouse.x / magni;
        audio.currentTime = _pos;
        //ショット音リスト更新
        _shotList = reloadShotList(music, noteList, zerohour);
        redraw(c);
    }
    tl.addEventListener('mousedown', function(){_seek(music)}, false);
    tl.addEventListener('mousemove', function(e){
        // if(!e.which){
            // console.log(e.which); return;
        // }
        if (e.which === 1) _seek(music); // chrome/opera のみマウス移動によるシーク可
    }, false);

    function playShot(audio){
        if(!audio.currentTime) return;
        if(!canPlayShot) return;
        if(!audio.ended){
            //巻き戻し再生
            audio.pause();
            audio.currentTime = 0;  // 再生位置を0秒にする
            audio.play();
        }else{
            audio.play();
        }
    }

    // Main loop
    (function(){
        if(music){
            var cTime = music.currentTime;
            // HTMLを更新
            mousePos.innerHTML = 'x: '+mouse.x;
            currentTime.innerHTML = "再生時間: "+cTime+" 秒";

            // while playing...
            if(music && !music.paused) {
                //ショット音の再生
                _shotList.forEach(function(noteTime, i){
                    // 遅れを考慮して早めに実行?
                    if (cTime > noteTime+zerohour){
                        // playShot(clap);
                        playSound(clap);
                        _shotList.splice(i, 1);
                        // console.log('shotted');
                    }
                })
                redraw(c);

                //自動スクロール
                var _page = Math.floor((cTime*magni)/window.innerWidth);
                if (autoscroll){
                    window.scrollTo(window.innerWidth*_page, 0);//再生中はスクロールロック状態:シンプル

                    // if (_page > page){
                    //     window.scrollTo(window.innerWidth*_page, 0);
                    //     page++; //連続スクロール防止
                    // }
                }
            }
        }
        setTimeout(arguments.callee, fps);
    })();

    // 後からBPM値を変えたときに、ノーツ時間を調整する
    function bpmExchange(noteList, preBPM, newBPM){
        var noteList = noteList;
        var newList = [];
        var _baseNote = [];
        var _prebeatTime = (1 / (preBPM/60));
        var _newbeatTime = (1 / (newBPM/60));
        noteList.forEach(function(note){
            if (note.length){
                var _longnote = [];
                note.forEach(function(childnote, i){
                    _longnote[i] = (childnote /_prebeatTime) * _newbeatTime;
                });
                note = _longnote;
            } else{
                note =  (note /_prebeatTime) * _newbeatTime;
            }

            newList.push(note);
        });

        console.log(newList);
        return newList;
    }

    // keydown
    var handleKeyDown = function(e){
        // e.preventDefault();
        // console.log(e.keyCode);
        var kc = e.keyCode;

        // t
       if (e.keyCode === 84) {
            noteList = bpmExchange(noteList, 179, 180);
            console.log('noteList revised');
            redraw(c);
        }
         // z key: reset music
        if (e.keyCode == 90) {
            // music.currentTime = 0;
            music.currentTime = zerohour;
            _shotList = reloadShotList(music, noteList, zerohour);
            console.log(_shotList);
            redraw(c);
            // page = 0;
            return;
        }

        // space key: play music
        if (!e.shiftKey) {
            if (e.keyCode == 32) {
                _playMusic(music);
            }
        }
        // b key: add note
       if (kc == 66) {
            _addNote(noteList, e);
        }
        // w,s key: change quantize value
       if (kc == 87 || kc == 83) {
           var _qIndex = quantize.selectedIndex;
           _qIndex += (kc==87)? -1 : 1;
           if(_qIndex < 0 || quantize.options.length-1 < _qIndex) return;

            quant = quantize.options[_qIndex].value;
            quantize.selectedIndex = _qIndex;
            updateVal();
        }

        //shift+space: bpm counter
        if (e.shiftKey && e.keyCode === 32) {
            bpmCounter.count();
            bpmInput.value = bpmCounter.bpm.toFixed(2);
            updateVal();
        }

    };
    document.addEventListener('keydown', handleKeyDown, false);

    var handleKeyUp = function(e){
        if(!e.ctrlKey){
            // release long note info
            if (_longNoteStart) _longNoteStart = null;
        }
        if (!e.shiftKey) {
            bpmCounter.clear()
        }
    };
    document.addEventListener('keyup', handleKeyUp, false);

    // var exportBtn = document.getElementById("export");
    function exportData(){
        // starttime, bpm, list, musicname
        //ソートする
        noteList.sort(function(a, b) {
            if (a.length) a = a[0];
            if (b.length) b = b[0];
            return a > b ? 1 : -1;
        });
        console.log(noteList);
        var dataobj = {
            audioSrc: music.src,
            musicName: _musicName,
            BPM: bpm,
            zerohour: zerohour,
            noteList: noteList,
        }
        var jsonString = JSON.stringify(dataobj, null, 2);
        // タイプを指定してBlobオブジェクトを生成。対象を [ ] で囲む。
        var blob = new Blob([jsonString], {type:'text/plain'});

        if (window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(blob,"fumen.json");
        } else {
            $id("export").setAttribute("href", URL.createObjectURL(blob));
            URL.revokeObjectURL(blob);
        }
    }
    $id("export").addEventListener('click', exportData);

    // file import
    // http://tmlife.net/programming/javascript/html5-file-api-file-read.html
    function readFile(file){
        var encode_type = 'utf-8';// エンコードタイプ
        var reader = new FileReader();                  // ファイルリーダー生成
        // ロード関数登録
        reader.onload = function(e) {
            var result = e.target.result;
            console.log(result);
            importData(result);
        };

        var name = file.name,
        type = file.type;
        console.log(type);
        if(name.match(/json/)){
            // jsonファイルはテキストとしてファイルを読み込む
            reader.readAsText(file, encode_type);
        }else if(type.match(/audio|mpeg|ogg/)){
            // 音源ファイルは
            // reader.readAsDataURL(file);
            //https://lostechies.com/derickbailey/2013/09/23/getting-audio-file-information-with-htmls-file-api-and-audio-element/
            _musicName = name;
            importSound(URL.createObjectURL(file));
        }else{
            alert('jsonファイル, ブラウザ対応サウンドファイル以外は無効です')
        }
    }

    $id("readerBtn").onchange = function(e){
        var file = e.target.files[0];
        // console.log(e.target.files);
        readFile(file);
        this.blur();
    }

    // DnD
    function _ondropFile(e) {
        e.preventDefault();
        // console.log("drop");
        // File オブジェクトを取得
        var file = e.dataTransfer.files[0];
        // console.log(file);
        // ファイル読み込み
        readFile(file);
    }
    var _oncancel = function(e){
        // console.log(e);
        if(e.preventDefault) { e.preventDefault(); }
        return false;
    };
    $id("import-field").addEventListener('drop', _ondropFile, false);
    $id("import-field").addEventListener('dragenter', _oncancel, false);
    $id("import-field").addEventListener('dragover', _oncancel, false);

    //import data
    function importSound(blob){
        //以前のblobを開放
        URL.revokeObjectURL(music.src);

        music = new Audio(blob);
        music.onloadeddata = function(){
        // music.oncanplaythrough = function(){
            console.log("ながさ: "+music.duration);
            updateVal();
            // URL.revokeObjectURL(blob);
        }
        music.onerror = function(){
            alert(this.src+"\nは見つかりませんでした…")
        }
    }

    function importData(data){
        var dataobj;
        // console.log(data);
        // if(data.match(/data:audio/)){
        // if(data.match(/blob:/)){
        //     music = new Audio(data);
        //     music.onloadeddata = function(){
        //     // music.oncanplaythrough = function(){
        //         console.log("ながさ: "+music.duration);
        //         updateVal();
        //     }
        // }else{
            try {
                dataobj = JSON.parse(data); //オブジェクト化
            }catch(e){
                alert(e+'\n正しいjsonデータでは無いっぽいです…');
            }
            var _src = dataobj.audioSrc;
            // music = new Audio(_src);
            // music.onloadeddata = function(){
            //     console.log("loaded");
            // }
            // music.onerror = function(){
            //     alert(this.src+"\nは見つかりませんでした…")
            // }
            // 各数値代入
            bpm = bpmInput.value = dataobj.BPM;
            noteList =  dataobj.noteList;
            zerohour = dataobj.zerohour;

            updateVal();
        // }
    }

    // localstorage に保存
    function saveState(){
        if(window.localStorage) {
            var storage = localStorage;
            // storage.clear();
            var data = {
                audioSrc: music.src,
                musicName:_musicName,
                BPM: bpm,
                zerohour: zerohour,
                noteList: noteList,
            };
            storage.setItem("fumenData", JSON.stringify(data));

            console.log("saved!");
        }else{
            console.warn('ローカルストレージに対応してません');
            return;
        }
    }

    function loadStorage(){
        var data = window.localStorage.getItem("fumenData");
        console.log("loading...");
            // console.log(data);
        if (data) {
            try {
                dataobj = JSON.parse(data); //オブジェクト化
            }catch(e){
                alert(e+'\nデータがロードできませんでした・・・');
                return;
            }

            music = new Audio(dataobj.audioSrc);
            music.onloadeddata = function(){
                console.log("loaded");
                alert(dataobj.musicName+"の音源と譜面データをロードしました")
                updateVal();
            }
            music.onerror = function(e){
                // console.log(e);
                alert(dataobj.musicName+"の譜面データのみをロードしました")
            }
            // 各数値代入
            bpm = bpmInput.value = dataobj.BPM;
            noteList =  dataobj.noteList;
            zerohour = dataobj.zerohour;

        }
    }
    // TODO:以前のデータ消す
    function deleteStorage(){
        return 0;
    }

    function init(){
        getAudioBuffer('./assets/clap.mp3', function(buffer){
            clap = buffer;
        })
        loadStorage();
        // clap.onloadeddata = function(){
            // clap.play();
        // }
    }
    window.addEventListener("load", init, false);

})();

