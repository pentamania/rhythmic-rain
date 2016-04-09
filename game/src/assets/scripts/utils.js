
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

/* getElementById shorthand */
var $id = function(id) { return document.getElementById(id); }

/* arrayから */
var createSpanArray = function(span, m, n, randomize){
    var array = [];
    for (var i = m; i < m+n; i++) {
        array.push(span * i);
    }
    if (randomize === true){
        for(var i = 0; i < array.length; i++) {
            swap(array, i, ((Math.random() * (array.length - i)) + i) | 0);
        }
    }

    return array;

    // randomize: http://nmi.jp/archives/541
    function swap(a, s, d) {
        var t = a[s];
        a[s] = a[d];
        a[d] = t;
    }

}

/* 指定要素の幅・高さを画面全体に広げる */
var resizeCover = function(element){
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

// draw vertical 2-tone linear gradient rect
var drawGradRect = function(context, x, y, width, height, color){
    context.save();

    // グラデーション領域をセット
    // console.log(width, height);
    var grad  = context.createLinearGradient(x, y, x, y+height);

    // グラデーション終点のオフセットと色をセット
    if (color.length > 0){
        for (var i = 0, len=color.length; i < len; i++) {
            grad.addColorStop(color[i][0], color[i][1]);
        }
    } else {
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');  // 透明
        grad.addColorStop(1, color);
    }

    // グラデーションをfillStyleプロパティにセット
    // context.globalAlpha = (alpha) ? alpha : 1;
    context.fillStyle = grad;

    // 矩形を描画
    context.fillRect(x, y, width, height);

    context.restore();
}
