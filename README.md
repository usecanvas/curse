# Curse

Curse is a library for capturing and restoring selections—primarily for use in
HTML elements that are `contenteditable`, where text may stay the same, but
the rendered HTML may change.

![Demonstration](https://dl.dropboxusercontent.com/s/0ekgujm9vihn2rd/curse.gif?raw=1)

## Install

```sh
bower install curse
```

## Usage

Create a new `Curse` and pass it an `HTMLElement`. The curse is capable of
capturing and restoring the user's selection inside of that element.

```javascript
var element = document.querySelector('#editor');
var curse   = new Curse(element);

element.innerText = 'Hello world';

// User selects "llo w"

curse.capture(); // Capture the current cursor or selection

element.innerText = 'Hello, world';

curse.restore(); // Restore the user's selection.
```

Note that a `Curse` is dumb. In the above example, if the user's selection was
`"llo w"`, after the text was changed and the cursor restored, the user's
selection would have been `"llo, "`. It is up to the implementer to handle
changes in text length by adjusting `curse.start` and `curse.end`:

```javascript
element.innerText = 'Hello world';
// User selects "llo w"
curse.capture();
element.innerText = 'Hello, world';
curse.end++;
curse.restore(); // Selection is "llo, w"
```

It's possible that depending on your setup, you may need to pass a custom
function to a Curse to count node length. This can be done by passing
`nodeLengthFn`:

```javascript
let curse = new Curse(element, { nodeLengthFn: nodeLengthFn });

function nodeLengthFn(node, __super) {
  if (node.classList.contains('Foo')) {
    return 12;
  } else {
    /*
     * `__super` can be called to call the original `nodeLength` function on the
     * given node.
     */
    return __super();
  }
}
```

Curse still gets a little confused when it sees certain types of HTML elements
in a contenteditable. If you run across something, please [open an
issue](https://github.com/slowink/curse/issues).

## Development

Tests use [testem](https://github.com/airportyh/testem) and run in the Chrome
browser.

Install:

```sh
git clone git@github.com:slowink/curse.git
cd curse
npm install
```

Test:

```sh
npm test
```

In order to run the example page (useful for experimentation):

```sh
npm run dev
```
