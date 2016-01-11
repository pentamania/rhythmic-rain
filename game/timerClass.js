
// runstart: http://goo.gl/Sj50xC
;(function(ns) {

    var Timer = function () {
        this._time = 0;
        this.isStop = false;
        this._past = 0;
    }

    Timer.prototype.run = function () {
        this.isStop = false;
        // if (!this.isStop) {
        //     if (!this._past) {
        //         this._past = Date.now();
        //     } else {
        //         this._time += Date.now() - this._past;
        //         this._past = Date.now();
        //     }
        // }
        // window.setTimeout(this.run.bind(this), 16);
        // // requestAnimationFrame(this.run.bind(this));
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
    Timer.prototype.setTime = function (time) {
        this._time = time;
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


/*
usage

window.onload = function(){
  var timer = new Timer();
  timer.run();

  var timerEl = document.querySelector('#timerNode');
  document.querySelector('#stopBtn').onclick = function(){timer.toggle()};
  var testLoop = function(){

      timerEl.innerHTML = timer.time;
      setTimeout(testLoop, 100)
  }
  testLoop();
}
*/
