# Curse

Curse captures and restores cursors and selections in a `contenteditable` HTML
element. This is especially useful in cases where the inner text of an element
may change slightly, but it is necessary to preserve ths user's cursor or
selection, such as in the case of a realtime collaborative text editor.

![Demonstration](http://cl.ly/image/1z0n0K0c1P2p/curse.mov.gif)

## Install

```sh
bower install curse
```

## Usage

Create a new `Curse` and pass it an `HTMLElement`. The curse is capable of
capturing and restoring the user's selection.

```javascript
var element = document.querySelector('#editor');
var curse   = new Curse(element);

element.innerText = 'Hello world';

// User makes a selection

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

Curse currently only knows how to calculate the length of `Text` nodes and
`HTMLBRElement`s (`<br>`). `Text` nodes are the length of their text data, and
`HTMLBRElement`s have a length of 1 (i.e. a newline character).

Because of ongoing work handling proper calculation of node length, it's not
recommended to use it in production, yet. For example `<img>` tags should have
a length of 1, but I haven't implemented them, yet.

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

## Known Issues

There are some bugs :(

- Selecting text in a backwards motion captures (and restores) text as a
  forwards selection.
- Selections that begin or end on HTML elements may not properly capture.
