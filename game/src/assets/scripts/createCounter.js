/*
 * カウンターコンポーネントを生成する
 *  <div>
      <div>LABEL</div>
      <div styled class={params.buttonClass}>+</div>
      <div>0</div>
      <div styled class={params.buttonClass}>slow</div>
    </div>
 *
 */
;(function (ns) {
  var $div = function() { return document.createElement('div')}
  var $addStyle = function(target, style) {
    for (var prop in style) {
      if (style.hasOwnProperty(prop)) {
        target.style[prop] = style[prop];
      }
    }
  }

  var createCounter = function(params) {
    var _value = 0;
    var labelStr = params.label;
    var onchange = params.callback;
    var width = params.width || 40;
    var height = width*.55;
    var fontSize = width*.3;
    var unit = params.unit || 1;
    var buttonClass =　params.buttonClass || "";

    // Container
    var container = $div();
    $addStyle(container, {
      display: "inline-block",
      textAlign: "center",
      width: width+"px",
    });

    // ラベル部分
    var label = $div();
    label.name = labelStr+"-label";
    label.innerText = labelStr;
    // label.className = className;
    $addStyle(label, {
      width: "inherit",
      textAlign: "center",
      fontSize: fontSize*.7+"px",
    });
    container.appendChild(label)

    // Increment button
    var increBtn = $div();
    increBtn.onclick = function(e) {
      _value += unit;
      valueNode.innerText = _value;
      onchange(_value);
    }
    $addStyle(increBtn, {
      width: "inherit",
      height: height+"px",
      textAlign: "center",
      lineHeight: height+"px",
      verticalAlign: "middle",
      borderRadius: width+"px "+width+"px 0 0",
      fontSize: fontSize+"px",
      cursor: "pointer",
      userSelect: "none",
    });
    increBtn.innerText = "+";
    increBtn.className = buttonClass;
    // increBtn.className = "p-counter p-counter__increment-btn";
    container.appendChild(increBtn)

    // Value display
    var valueNode = $div();
    valueNode.innerText = _value;
    // valueNode.className = "p-counter p-counter__display";
    $addStyle(valueNode, {
      // width: width+"px",
      width: "inherit",
      textAlign: "center",
      fontSize: (fontSize/2)+"px",
    });
    container.appendChild(valueNode);

    // decrement button
    var decreBtn = $div();
    decreBtn.onclick = function(e) {
      _value -= unit;
      valueNode.innerText = _value;
      onchange(_value);
    }
    $addStyle(decreBtn, {
      width: width+"px",
      height: height+"px",
      textAlign: "center",
      fontSize: fontSize+"px",
      verticalAlign: "middle",
      borderRadius: "0 0 "+width+"px "+width+"px",
      lineHeight: height+"px",
      cursor: "pointer",
      userSelect: "none",
    });
    decreBtn.innerText = "-";
    decreBtn.className = buttonClass;
    // decreBtn.className = "p-counter p-counter__decrement-btn";
    container.appendChild(decreBtn)

    return container;
  };

  ns.createCounter = createCounter;

  if (typeof module !== "undefined") module.exports = createCounter;
}(window));
