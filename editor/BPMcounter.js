
/*
* BPM counter class
@pentamania

*usage example

var cnt = new BPMcounter();

var _keyDownFunc = function(e){
    if (e.shiftKey) {
        if (e.keyCode == 32) {
            cnt.count();
            console.log(cnt.bpm.toFixed(2));
        }
    }
}
var _keyUpFunc = function(e){
    if (!e.shiftKey) {
        cnt.clear();
        console.log("clear");
    }
}

document.addEventListener('keydown', _keyDownFunc, false);
document.addEventListener('keyup', _keyUpFunc, false);

*/

(function(ns){
    var BPMcounter = function(){
        this._counts = [];
        this._past = 0;
        this._bpm = 0;
    }

    BPMcounter.prototype = {

        count: function(fn){
            var now,delta,sum,avg,i,len;

            if (!this._past) {
                this._past = performance.now();
            } else {
                now = performance.now();
                delta = now - this._past; //前回タップから差分
                this._counts.push(delta);
                this._past = now;

                //4カウントごとにｂｐｍ計算
                len = this._counts.length;
                if (len%4 === 0) {
                    // 差分の平均を得る
                    sum = this._counts.reduce(function(x,y){ return x+y });
                    avg = sum / len;

                    this._bpm = (60 / avg*1000);

                    // callback when bpm is changed
                    if(fn && typeof(fn)==='function') fn();
                }
            }
        },

        clear: function(){
            this._counts = [];
            this._bpm = 0;
            this._past = 0;
        }
    }

    Object.defineProperty(BPMcounter.prototype, "bpm", {
        get: function(){
            return this._bpm;
        }
    });

    ns.BPMcounter = BPMcounter;

})(window);



