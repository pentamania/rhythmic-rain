
/* timer class */
;(function(ns) {

    var Timer = function () {
        this._time = 0;
        this.isStop = false;
        this._past = 0;
    }

    Timer.prototype.run = function () {
        this.isStop = false;
    };

    Timer.prototype.update = function () {
        if (!this.isStop) {
            if (!this._past) {
                this._past = Date.now();
            } else {
                this._time += Date.now() - this._past;
                this._past = Date.now();
            }
        }
    };

    Timer.prototype.toggle = function () {
        this.isStop = !this.isStop;
        this._past = 0;
    };
    Timer.prototype.pause = function (){
        this.isStop = true;
        this._past = 0;
    }
    Timer.prototype.setTime = function (sec) {
        this._time = sec*1000;
        this._past = 0;
    };
    Timer.prototype.reset = function () {
        this._time = 0;
        this._past = 0;
    };
    Timer.prototype.time = function () {
        return this._time/1000;
    };

    ns.Timer = Timer;

})(window);
