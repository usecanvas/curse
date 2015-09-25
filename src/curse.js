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
  constructor(element, { nodeLengthFn } = {}) {
    this.element = element;
    this.nodeLengthFn = nodeLengthFn;
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
      child = anchorNode.childNodes[anchorOffset - 1];

      if (child) {
        start = this.lengthUpTo(child) + this.nodeLength(child, false, true);
      } else {
        start = this.lengthUpTo(anchorNode);
      }
    }

    if (focusNode.nodeName === '#text') {
      end = this.lengthUpTo(focusNode) + focusOffset;
    } else {
      child = focusNode.childNodes[focusOffset - 1];

      if (child) {
        end = this.lengthUpTo(child) + this.nodeLength(child, false, true);
      } else {
        end = this.lengthUpTo(focusNode);
      }
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
    let iter = this.getIterator(this.element);
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
   * Get an iterator to iterate over the child nodes in a given node.
   *
   * @method getIterator
   * @private
   * @param {Node} iteratee The node to iterate through the children of
   * @return {NodeIterator}
   */
  getIterator(iteratee) {
    return document.createNodeIterator(
      iteratee,

      NodeFilter.SHOW_ALL,

      function onNode(node) {
        return node === iteratee ?
          NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
      }
    );
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
    let iter = this.getIterator(this.element);
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
   * @param {Node} node A Node, typically a Text or HTMLElement node
   * @param {Bool} ignoreNodeLengthFn Ignore the custom nodeLengthFn
   * @param {Bool} recurse Recurse through the node to get its length
   * @return {Number} The length of the node, as text
   */
  nodeLength(node, ignoreNodeLengthFn = false, recurse = false) {
    if (this.nodeLengthFn && !ignoreNodeLengthFn) {
      const nodeLength = this.nodeLength.bind(this);

      return this.nodeLengthFn(node, function __super() {
        return nodeLength(node, true, recurse);
      });
    }

    if (recurse && node.childNodes.length) {
      const iter = this.getIterator(node);

      let innerLength = 0;
      let childNode;

      while ((childNode = iter.nextNode())) {
        innerLength += this.nodeLength(childNode, ignoreNodeLengthFn, recurse);
      }

      return innerLength;
    }

    let charNodes = ['BR', 'HR', 'IMG'];

    if (node.nodeName === '#text') {
      return node.data.length;
    } else if (charNodes.indexOf(node.nodeName) > -1) {
      return 1;
    } else {
      return 0;
    }
  }

  /**
   * Offset the cursor position's start and end.
   *
   * @method offset
   * @param {Number} startOffset the offset for the curse start
   * @param {Number} endOffset the offset for the curse end
   */
  offset(startOffset = 0, endOffset = startOffset) {
    this.start += startOffset;
    this.end += endOffset;
  }
}
