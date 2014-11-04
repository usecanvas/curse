var capture = document.querySelector('button.capture');
var restore = document.querySelector('button.restore');
var editor  = document.querySelector('.editor');
var start   = document.querySelector('td.start');
var end     = document.querySelector('td.end');
var curse   = new Curse(editor);

capture.addEventListener('click', function onClick() {
  curse.capture();
});

restore.addEventListener('click', function onRestore() {
  curse.restore(false);
});

start.addEventListener('keyup', function onKeyup() {
  curse.start = +start.innerText || null;
});

end.addEventListener('keyup', function onKeyup() {
  curse.end = +end.innerText;
});

Object.observe(curse, function onChange(changes) {
  start.innerText = curse.start;
  end.innerText   = curse.end;
});
