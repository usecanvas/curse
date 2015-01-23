!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Curse=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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
  function Curse(element) {
    var _ref = arguments[1] === undefined ? {} : arguments[1];
    var lineBreak = _ref.lineBreak;
    var nodeLengths = _ref.nodeLengths;
    this.lineBreak = lineBreak;
    this.nodeLengths = nodeLengths || {};
    this.element = element;
    this.reset();
  }

  _prototypeProperties(Curse, null, {
    iterator: {

      /**
       * An iterator to iterate over the nodes in `this.element`.
       *
       * This returns a simple node iterator that skips `this.element`, but not its
       * children.
       *
       * @property iterator
       * @private
       * @type {NodeIterator}
       */
      get: function () {
        var elem = this.element;

        return document.createNodeIterator(this.element, NodeFilter.SHOW_ALL, function onNode(node) {
          return node === elem ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
        });
      },
      enumerable: true,
      configurable: true
    },
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
          start = this.lengthUpTo(child);
        }

        if (focusNode.nodeName === "#text") {
          end = this.lengthUpTo(focusNode) + focusOffset;
        } else {
          child = focusNode.childNodes[focusOffset ? focusOffset - 1 : 0];
          end = this.lengthUpTo(child) + this.nodeLength(child);
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
        var iter = this.iterator;
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
        var iter = this.iterator;
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
       * @param {Node} node a Node, typically a Text or HTMLElement node
       * @return {Number} the length of the node, as text
       */
      value: function nodeLength(node) {
        var charNodes = ["BR", "HR", "IMG"];
        var previousSibling = undefined;

        if (this.lineBreak) {
          previousSibling = node.previousElementSibling;
        }

        if (previousSibling && previousSibling.classList.contains(this.lineBreak)) {
          return 1;
        } else if (node.nodeName === "#text") {
          return node.data.length;
        } else if (this.nodeLengths[node.nodeName]) {
          return this.nodeLengths[node.nodeName];
        } else if (charNodes.indexOf(node.nodeName) > -1) {
          return 1;
        } else {
          return 0;
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Curse;
})();

module.exports = Curse;

},{}]},{},[1])
(1)
});