var capture = document.querySelector('button.capture');
var restore = document.querySelector('button.restore');
var editor  = document.querySelector('.editor');
var start   = document.querySelector('td.start');
var end     = document.querySelector('td.end');
var startN  = document.querySelector('td.start-node');
var endN    = document.querySelector('td.end-node');
var startO  = document.querySelector('td.start-offset');
var endO    = document.querySelector('td.end-offset');
var curse   = new Curse(editor);

capture.addEventListener('click', function onClick() {
  curse.capture();
});

restore.addEventListener('click', function onRestore() {
  curse.restore(false);
});

Object.observe(curse, function onChange() {
  var sel = window.getSelection();

  startN.innerText = sel.anchorNode;
  startO.innerText = sel.anchorOffset;

  endN.innerText = sel.focusNode;
  endO.innerText = sel.focusOffset;

  start.innerText = curse.start;
  end.innerText   = curse.end;
});
