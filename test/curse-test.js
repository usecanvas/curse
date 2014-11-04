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
      curse.restore();
      assertSelected('o ba');
    });
  });
});

function addRange(range) {
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
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
