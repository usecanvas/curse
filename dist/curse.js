!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Curse=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

/**
 * Captures and restores the cursor position inside of an HTML element. This
 * is particularly useful for capturing, editing, and restoring selections
 * in contenteditable elements, where the selection may span both text nodes
 * and element nodes.
 *
 *     var elem  = document.querySelector('#editor');
 *     var curse = new Curse(elem);
 *     curse.capture();
 *
 *     // ...
 *
 *     curse.restore();
 *
 * @class Curse
 * @constructor
 * @param {HTMLElement} element an element to track the cursor inside of
 */
var Curse = (function () {
  var Curse = function (element) {
    var _ref = arguments[1] === undefined ? {} : arguments[1];
    var nodeLengthFn = _ref.nodeLengthFn;
    this.element = element;
    this.nodeLengthFn = nodeLengthFn;
    this.reset();
  };

  _prototypeProperties(Curse, null, {
    capture: {

      /**
       * Captures the current selection in the element, by storing "start" and
       * "end" integer values. This allows for the text and text nodes to change
       * inside the element and still have the Curse be able to restore selection
       * state.
       *
       * A `<br>` tag, for example, is counted as a single "character", while
       * a text node with the text "Hello, world" is counted as 12 characters.
       *
       * @method capture
       */
      value: function capture() {
        var _window$getSelection = window.getSelection();

        var anchorNode = _window$getSelection.anchorNode;
        var anchorOffset = _window$getSelection.anchorOffset;
        var focusNode = _window$getSelection.focusNode;
        var focusOffset = _window$getSelection.focusOffset;
        var child = undefined,
            start = undefined,
            end = undefined;

        if (anchorNode === null || focusNode === null) {
          this.reset();
          return;
        }

        if (anchorNode.nodeName === "#text") {
          start = this.lengthUpTo(anchorNode) + anchorOffset;
        } else {
          child = anchorNode.childNodes[anchorOffset ? anchorOffset - 1 : 0];
          start = this.lengthUpTo(child) + this.nodeLength(child, false, true);
        }

        if (focusNode.nodeName === "#text") {
          end = this.lengthUpTo(focusNode) + focusOffset;
        } else {
          child = focusNode.childNodes[focusOffset ? focusOffset - 1 : 0];
          end = this.lengthUpTo(child) + this.nodeLength(child, false, true);
        }

        this.start = start;
        this.end = end;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    restore: {

      /**
       * Restore the captured cursor state by iterating over the child nodes in the
       * element and counting their length.
       *
       * @method restore
       * @param {Boolean} [onlyActive=true] only restore if the curse's element is
       *   the active element
       */
      value: function restore() {
        var onlyActive = arguments[0] === undefined ? true : arguments[0];
        if (onlyActive && document.activeElement !== this.element) {
          return;
        }

        if (!onlyActive) {
          this.element.focus();
        }

        var range = document.createRange();
        var idx = 0;
        var _ref2 = this;
        var start = _ref2.start;
        var end = _ref2.end;
        var iter = this.getIterator(this.element);
        var node = undefined,
            setStart = undefined,
            setEnd = undefined;

        if (this.start > this.end) {
          start = this.end;
          end = this.start;
        }

        while (node = iter.nextNode()) {
          if (setStart && setEnd) {
            break;
          }

          var nodeLength = this.nodeLength(node);
          var isText = node.nodeName === "#text";
          var childIdx = undefined;

          if (!setStart && start <= idx + nodeLength) {
            this.indexOfNode(node);
            if (isText) {
              range.setStart(node, start - idx);
            } else {
              childIdx = this.indexOfNode(node);
              range.setStart(node.parentNode, childIdx);
            }

            setStart = true;
          }

          if (!setEnd && end <= idx + nodeLength) {
            if (isText) {
              range.setEnd(node, end - idx);
            } else {
              childIdx = this.indexOfNode(node);
              range.setEnd(node.parentNode, childIdx);
            }

            setEnd = true;
          }

          idx += nodeLength;
        }

        var selection = window.getSelection();
        selection.removeAllRanges();

        // Reverse the selection if it was originally backwards
        if (this.start > this.end) {
          var startContainer = range.startContainer;
          var startOffset = range.startOffset;
          range.collapse(false);
          selection.addRange(range);
          selection.extend(startContainer, startOffset);
        } else {
          selection.addRange(range);
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    getIterator: {

      /**
       * Get an iterator to iterate over the child nodes in a given node.
       *
       * @method getIterator
       * @private
       * @param {Node} iteratee The node to iterate through the children of
       * @return {NodeIterator}
       */
      value: function getIterator(iteratee) {
        return document.createNodeIterator(iteratee, NodeFilter.SHOW_ALL, function onNode(node) {
          return node === iteratee ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    indexOfNode: {

      /**
       * Get the index of a node in its parent node.
       *
       * @method indexOfNode
       * @private
       * @param {Node} child the child node to find the index of
       * @returns {Number} the index of the child node
       */
      value: function indexOfNode(child) {
        var i = 0;

        while (child = child.previousSibling) {
          i++;
        }

        return i;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    lengthUpTo: {

      /**
       * Get the number of characters up to a given node.
       *
       * @method lengthUpTo
       * @private
       * @param {Node} node a node to find the length up to
       * @returns {Number} the length up to the given node
       */
      value: function lengthUpTo(lastNode) {
        var len = 0;
        var iter = this.getIterator(this.element);
        var node = undefined;

        while (node = iter.nextNode()) {
          if (node === lastNode) {
            break;
          }

          len += this.nodeLength(node);
        }

        return len;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    reset: {

      /**
       * Reset the state of the cursor.
       *
       * @method reset
       * @private
       */
      value: function reset() {
        this.start = null;
        this.end = null;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    nodeLength: {

      /**
       * Get the "length" of a node. Text nodes are the length of their contents,
       * and `<br>` tags, for example, have a length of 1 (a newline character,
       * essentially).
       *
       * @method nodeLength
       * @private
       * @param {Node} node A Node, typically a Text or HTMLElement node
       * @param {Bool} ignoreNodeLengthFn Ignore the custom nodeLengthFn
       * @param {Bool} recurse Recurse through the node to get its length
       * @return {Number} The length of the node, as text
       */
      value: function nodeLength(node) {
        var _this = this;
        var ignoreNodeLengthFn = arguments[1] === undefined ? false : arguments[1];
        var recurse = arguments[2] === undefined ? false : arguments[2];
        if (this.nodeLengthFn && !ignoreNodeLengthFn) {
          var _ret = (function () {
            var nodeLength = _this.nodeLength.bind(_this);

            return {
              v: _this.nodeLengthFn(node, function __super() {
                return nodeLength(node, true, recurse);
              })
            };
          })();

          if (typeof _ret === "object") return _ret.v;
        }

        if (recurse && node.childNodes.length) {
          var iter = this.getIterator(node);

          var innerLength = 0;
          var childNode = undefined;

          while (childNode = iter.nextNode()) {
            innerLength += this.nodeLength(childNode, ignoreNodeLengthFn, recurse);
          }

          return innerLength;
        }

        var charNodes = ["BR", "HR", "IMG"];

        if (node.nodeName === "#text") {
          return node.data.length;
        } else if (charNodes.indexOf(node.nodeName) > -1) {
          return 1;
        } else {
          return 0;
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    offset: {

      /**
       * Offset the cursor position's start and end.
       *
       * @method offset
       * @param {Number} startOffset the offset for the curse start
       * @param {Number} endOffset the offset for the curse end
       */
      value: function offset() {
        var _this2 = this;
        var startOffset = arguments[0] === undefined ? 0 : arguments[0];
        var endOffset = arguments[1] === undefined ? startOffset : arguments[1];
        return (function () {
          _this2.start += startOffset;
          _this2.end += endOffset;
        })();
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Curse;
})();

module.exports = Curse;


},{}]},{},[1])(1)
});