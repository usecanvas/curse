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
function Curse(element) {
  this.element = element;
  this.reset();
}

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
Curse.prototype.capture = function capture() {
  var sel    = window.getSelection();
  var anc    = sel.anchorNode;
  var ancOff = sel.anchorOffset;
  var foc    = sel.focusNode;
  var focOff = sel.focusOffset;
  var child, start, end;

  if (anc === null || foc === null) {
    this.reset();
    return;
  }

  if (anc.nodeName === '#text') {
    start = this.lengthUpTo(anc) + ancOff;
  } else {
    child = anc.childNodes[ancOff];
    start = this.lengthUpTo(child);
  }

  if (foc.nodeName === '#text') {
    end = this.lengthUpTo(foc) + focOff;
  } else {
    child = foc.childNodes[focOff];
    end = this.lengthUpTo(child) + this.nodeLength(child);
  }

  this.start = start;
  this.end   = end;
};

/**
 * Restore the captured cursor state by iterating over the child nodes in the
 * element and counting their length.
 *
 * @method restore
 * @param {Boolean} [onlyActive=true] only restore if the curse's element is
 *   the active element
 */
Curse.prototype.restore = function restore(onlyActive) {
  if (onlyActive === undefined) { onlyActive = true; }

  if (onlyActive && document.activeElement !== this.element) {
    return;
  } else if (!onlyActive) {
    this.element.focus();
  }

  var range = document.createRange();
  var idx   = 0;
  var setStart, setEnd;

  this.domWalk(this.element, function onNode(node) {
    if (setStart && setEnd) { return false; }

    var nodeLength = this.nodeLength(node);
    var isText     = node.nodeName === '#text';
    var childIdx;

    if (!setStart && this.start <= idx + nodeLength) {
      if (isText) {
        range.setStart(node, this.start - idx);
      } else {
        childIdx = this.indexOfNode(node);
        range.setStart(node.parentNode, childIdx);
      }

      setStart = true;
    }

    if (!setEnd && this.end <= idx + nodeLength) {
      if (isText) {
        range.setEnd(node, this.end - idx);
      } else {
        childIdx = this.indexOfNode(node);
        range.setEnd(node.parentNode, childIdx);
      }

      setEnd = true;
    }

    idx += nodeLength;
  }.bind(this));

  var selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};

/**
 * Recursively traverse a DOM tree and call a function on each node. To halt
 * iteration, return `false` from `fn`.
 *
 * @method domWalk
 * @private
 * @param {Node} node a DOM node to traverse
 * @param {Function} fn a function to call on each child node
 */
Curse.prototype.domWalk = function domWalk(node, fn) {
  var onNode = fn(node);

  if (onNode === false) {
    return;
  }

  node = node.firstChild;

  while (node) {
    this.domWalk(node, fn);
    node = node.nextSibling;
  }
};

/**
 * Get the index of a node in its parent node.
 *
 * @method indexOfNode
 * @private
 * @param {Node} child the child node to find the index of
 * @returns {Number} the index of the child node
 */
Curse.prototype.indexOfNode = function indexOfNode(child) {
  var i = 0;

  while ((child = child.previousSibling)) {
    i++;
  }

  return i;
};

/**
 * Get the number of characters up to a given node.
 *
 * @method lengthUpTo
 * @private
 * @param {Node} node a node to find the length up to
 * @returns {Number} the length up to the given node
 */
Curse.prototype.lengthUpTo = function lengthUpTo(lastNode) {
  var len  = 0;
  var done = false;

  this.domWalk(this.element, function onNode(node) {
    if (done || node === lastNode) {
      done = true;
      return false;
    }

    len += this.nodeLength(node);
  }.bind(this));

  return len;
};


/**
 * Reset the state of the cursor.
 *
 * @method reset
 * @private
 */
Curse.prototype.reset = function reset() {
  this.start = null;
  this.end   = null;
};

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
Curse.prototype.nodeLength = function nodeLength(node) {
  var charNodes = ['BR', 'HR', 'IMG'];

  if (node.nodeName === '#text') {
    return node.data.length;
  } else if (charNodes.indexOf(node.nodeName) > -1) {
    return 1;
  } else {
    return 0;
  }
};
