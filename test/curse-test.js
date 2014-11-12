describe('Curse', function() {
  var $e, curse;

  beforeEach(function() {
    $e = document.createElement('div');
    curse = new Curse($e);

    $e.setAttribute('contenteditable', true);
    document.body.appendChild($e);
    $e.focus();
  });

  afterEach(function() {
    $e.remove();
  });

  describe('capturing and restoring over plaintext', function() {
    beforeEach(function() {
      $e.innerText = 'foo bar';
      var range = createRange([$e.childNodes[0], 2], [$e.childNodes[0], 6]);
      addRange(range);
      assertSelected('o ba');
      curse.capture();
    });

    it('can capture a selection', function() {
      [curse.start, curse.end].should.eql([2, 6]);
    });

    it('can restore a selection', function() {
      window.getSelection().removeAllRanges();
      curse.restore();
      assertSelected('o ba');
    });
  });

  describe('capturing and restoring a backwards selection', function() {
    beforeEach(function() {
      $e.innerText = 'foo bar';
      var range = createRange([$e.childNodes[0], 2], [$e.childNodes[0], 6]);
      addRange(range, true);
      assertSelected('o ba');
      curse.capture();
    });

    it('can capture a selection', function() {
      [curse.start, curse.end].should.eql([6, 2]);
    });

    it('can restore a selection', function() {
      var sel = window.getSelection();
      sel.removeAllRanges();
      curse.restore();
      sel.anchorOffset.should.eql(6);
      sel.focusOffset.should.eql(2);
      assertSelected('o ba');
    });
  });

  describe('capturing and restoring spanning an HTML element', function() {
    beforeEach(function() {
      $e.innerHTML = 'foo <b>bar</b> baz';
      var range = createRange([$e.childNodes[0], 2], [$e.childNodes[2], 2]);
      addRange(range);
      assertSelected('o bar b');
      curse.capture();
    });

    it('can capture the selection', function() {
      [curse.start, curse.end].should.eql([2, 9]);
    });

    it('can restore the selection', function() {
      window.getSelection().removeAllRanges();
      curse.restore();
      assertSelected('o bar b');
    });
  });

  describe('capturing and restoring spanning a newline', function() {
    beforeEach(function() {
      $e.innerText = 'foo\nbar\nbaz';
      var range = createRange([$e.childNodes[0], 1], [$e.childNodes[4], 1]);
      addRange(range);
      assertSelected('oo\nbar\nb');
      curse.capture();
    });

    it('can capture the selection', function() {
      [curse.start, curse.end].should.eql([1, 9]);
    });

    it('can restore the selection', function() {
      window.getSelection().removeAllRanges();
      curse.restore();
      assertSelected('oo\nbar\nb');
    });
  });
});

function addRange(range, reverse) {
  var sel = window.getSelection();
  sel.removeAllRanges();

  if (reverse) {
    var startC = range.startContainer;
    var startO = range.startOffset;
    range.collapse(false);
    sel.addRange(range);
    sel.extend(startC, startO);
  } else {
    sel.addRange(range);
  }
}

function assertSelected(text) {
  window.getSelection().toString().should.eql(text);
}

function createRange(anchor, focus) {
  var r = document.createRange();
  r.setStart(anchor[0], anchor[1]);
  r.setEnd(focus[0], focus[1]);
  return r;
}
