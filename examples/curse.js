(function(__exports__) {
  "use strict";

  var Curse = function() {
    var Curse = function Curse(element) {
      this.element = element;
      this.reset();
    };

    Object.defineProperties(Curse.prototype, {
      capture: {
        writable: true,

        value: function() {
          var _this = this;
          var selection = window.getSelection();
          var idx       = 0;

          this.reset();

          this.domWalk(this.element, function(node) {
            if (_this.start && _this.end) { return false; }

            if (selection.anchorNode === node) {
              _this.start = idx + selection.anchorOffset;
            }

            if (selection.focusNode === node) {
              _this.end = idx + selection.focusOffset;
            }

            idx += _this.nodeLength(node);
          });
        }
      },

      restore: {
        writable: true,

        value: function(onlyActive) {
          var _this2 = this;

          if (onlyActive === undefined)
            onlyActive = true;

          if (onlyActive && document.activeElement !== this.element) {
            return;
          } else if (!onlyActive) {
            this.element.focus();
          }

          var range = document.createRange();
          var idx   = 0;
          var setStart, setEnd;

          this.domWalk(this.element, function(node) {
            if (setStart && setEnd) { return false; }

            var _nodeLength = _this2.nodeLength(node);

            if (!setStart && start <= idx + _nodeLength) {
              setStart = true;
              range.setStart(node, start - idx);
            }

            if (!setEnd && end <= idx + _nodeLength) {
              setEnd = true;
              range.setEnd(node, end - idx);
            }

            idx += _nodeLength;
          });

          var _selection = window.getSelection();
          _selection.removeAllRanges();
          _selection.addRange(range);
        }
      },

      domWalk: {
        writable: true,

        value: function(node, fn) {
          var _onNode = fn(node);

          if (_onNode === false) {
            return;
          }

          node = node.firstChild;

          while (node) {
            this.domWalk(node, fn);
            node = node.nextSibling;
          }
        }
      },

      reset: {
        writable: true,

        value: function() {
          this.start = null;
          this.end   = null;
        }
      },

      nodeLength: {
        writable: true,

        value: function(node) {
          if (node.nodeName === '#text') {
            return node.data.length;
          } else if (node.nodeName === 'BR') {
            return 1;
          } else {
            return 0;
          }
        }
      }
    });

    return Curse;
  }();

  __exports__.Curse = Curse;
})(window);