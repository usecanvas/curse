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
export default class Curse {
  constructor(element, { lineBreak, nodeLengths } = {}) {
    this.lineBreak = lineBreak;
    this.nodeLengths = nodeLengths || {};
    this.element = element;
    this.reset();
  }

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
  get iterator() {
    let elem = this.element;

    return document.createNodeIterator(
      this.element,

      NodeFilter.SHOW_ALL,

      function onNode(node) {
        return node === elem ?
          NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
      }
    );
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
  capture() {
    let { anchorNode, anchorOffset, focusNode, focusOffset }
      = window.getSelection();
    let child, start, end;

    if (anchorNode === null || focusNode === null) {
      this.reset();
      return;
    }

    if (anchorNode.nodeName === '#text') {
      start = this.lengthUpTo(anchorNode) + anchorOffset;
    } else {
      child = anchorNode.childNodes[anchorOffset];
      start = this.lengthUpTo(child);
    }

    if (focusNode.nodeName === '#text') {
      end = this.lengthUpTo(focusNode) + focusOffset;
    } else {
      child = focusNode.childNodes[focusOffset];
      end = this.lengthUpTo(child) + this.nodeLength(child);
    }

    this.start = start;
    this.end = end;
  }

  /**
   * Restore the captured cursor state by iterating over the child nodes in the
   * element and counting their length.
   *
   * @method restore
   * @param {Boolean} [onlyActive=true] only restore if the curse's element is
   *   the active element
   */
  restore(onlyActive = true) {
    if (onlyActive && document.activeElement !== this.element) {
      return;
    }

    if (!onlyActive) {
      this.element.focus();
    }

    let range = document.createRange();
    let idx = 0;
    let { start, end } = this;
    let iter = this.iterator;
    let node, setStart, setEnd;

    if (this.start > this.end) {
      start = this.end;
      end = this.start;
    }

    while ((node = iter.nextNode())) {
      if (setStart && setEnd) {
        break;
      }

      let nodeLength = this.nodeLength(node);
      let isText = node.nodeName === '#text';
      let childIdx;

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

    let selection = window.getSelection();
    selection.removeAllRanges();

    // Reverse the selection if it was originally backwards
    if (this.start > this.end) {
      let { startContainer, startOffset } = range;
      range.collapse(false);
      selection.addRange(range);
      selection.extend(startContainer, startOffset);
    } else {
      selection.addRange(range);
    }
  }

  /**
   * Get the index of a node in its parent node.
   *
   * @method indexOfNode
   * @private
   * @param {Node} child the child node to find the index of
   * @returns {Number} the index of the child node
   */
  indexOfNode(child) {
    let i = 0;

    while ((child = child.previousSibling)) {
      i++;
    }

    return i;
  }

  /**
   * Get the number of characters up to a given node.
   *
   * @method lengthUpTo
   * @private
   * @param {Node} node a node to find the length up to
   * @returns {Number} the length up to the given node
   */
  lengthUpTo(lastNode) {
    let len  = 0;
    let iter = this.iterator;
    let node;

    while ((node = iter.nextNode())) {
      if (node === lastNode) {
        break;
      }

      len += this.nodeLength(node);
    }

    return len;
  }

  /**
   * Reset the state of the cursor.
   *
   * @method reset
   * @private
   */
  reset() {
    this.start = null;
    this.end = null;
  }

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
  nodeLength(node) {
    let charNodes = ['BR', 'HR', 'IMG'];
    let previousSibling;

    if (this.lineBreak) {
      previousSibling = node.previousElementSibling;
    }

    if (previousSibling && previousSibling.classList.contains(this.lineBreak)) {
      return 1;
    } else if (node.nodeName === '#text') {
      return node.data.length;
    } else if (this.nodeLengths[node.nodeName]) {
      return this.nodeLengths[node.nodeName];
    } else if (charNodes.indexOf(node.nodeName) > -1) {
      return 1;
    } else {
      return 0;
    }
  }
}
