# Chapter 2 — one deeper chapter per language

Chapter 1 is the same course in every language (print → variables → conditions → loops → functions → classes → the Wilds → boss).
Chapter 2 is **different for every language**: its own map, its own story and topics that go deep into what makes that language itself.
It unlocks once Segfault is defeated. In the level map it shows as a second tab.

| Language | File | Title | Theme |
| --- | --- | --- | --- |
| Python | `js/chapter2/python.js` | The Pythonic Isles | `isle` |
| JavaScript | `js/chapter2/javascript.js` | The Neon Grid | `neon` |
| C++ | `js/chapter2/cpp.js` | The Iron Forge | `forge` |
| C# | `js/chapter2/csharp.js` | The Crystal Spire | `crystal` |
| Java | `js/chapter2/java.js` | The Coffee Works | `coffee` |

Reference solutions live in `tests/solutions/ch2/<lang>.js` (`module.exports = { challengeId: 'code', ... }`).

## The file

```js
(function (root) {
  'use strict';
  const GD = root.GameData;
  const { c, lines, escapeHTML } = GD.helpers;      // see "Helpers" below
  GD.addChapter2('python', {
    title: 'The Pythonic Isles',
    blurb: 'One sentence shown on the Chapter 2 unlock card.',
    outro: 'HTML shown when the last level is finished.',
    theme: 'isle',                                  // default theme for its levels
    challenges: { /* id: challenge, ... */ },
    levels: [ /* level, ... in order */ ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

### A level

```js
{
  id: 'py2_comp',                 // unique; prefix with the language: py2_ js2_ cpp2_ cs2_ java2_
  name: 'Comprehension Cove',     // place name
  topic: 'Comprehensions',        // shown on the map node and HUD (keep it short: 1–3 words)
  blurb: 'One sentence for the map panel.',
  theme: 'isle',                  // optional, defaults to the chapter theme
  intro: '<p>Story page HTML (2–4 short paragraphs, may contain <pre> code).</p>',
  tutorial: [                     // 3–6 pages; ONE idea per page; each code example must run and print something
    { title: 'A list in one line', body: '<p>HTML explanation...</p>', code: 'squares = [x * x for x in range(5)]\nprint(squares)' },
    { title: 'Common mistake', body: '...', code: '...', expectError: true },   // optional: a page whose code SHOULD error
  ],
  signs: ['Text of the 1st ? sign', 'Text of the 2nd ? sign'],
  terminals: ['py2_comp1', 'py2_comp2', ...],   // map digit 1 = terminals[0], 2 = terminals[1], ...
  map: (B) => { /* build and return a MapBuilder, see "Maps" */ },
}
```

### A challenge (terminal)

```js
py2_comp1: {
  title: 'The Square Shell',
  desc: '<p>HTML task description. Say exactly what to print / return. Use <code>...</code> for code.</p>',  // or (ctx) => html
  starter: 'nums = [1, 2, 3]\n# your code here\n',   // must NOT already pass
  hints: ['A nudge toward the idea, no code to copy.', 'A more specific nudge.'],   // must not solve it
  similar: { task: 'A *similar* problem, solved', code: 'runnable code solving a different but same-calibre problem' },
  gate: 'A',                       // the group letter this terminal opens (see Maps)

  // pick ONE way to check:
  expect: ['[1, 4, 9]', 'done'],   // the exact printed lines (trimmed)
  // or
  callTests: [{ fn: 'evens', args: [[1, 2, 3, 4]] }, { fn: 'evens', args: [[]] }],
  expectCalls: [[2, 4], []],       // what each call must return (compared as JSON)
  // or a full check function: check(runs, ctx, code) => ({ ok, msg })   (runs[0].output, runs[0].calls, runs[0].vars)
  //   with optional tests(ctx) => [{ label, globals: {name: value}, expect }] to run the code several times with different inputs

  require: [[/\bfor\b/, 'Use a comprehension (a <code>for</code> inside the brackets).']],  // optional: regexes the code (comments stripped) must match
  success: 'Message when it passes (HTML). Default: "It works! The way is open."',
}
```

* Function names in `callTests` are used **as written**; use the language's own style (`average_score`, `averageScore`, `AverageScore`).
  For C++/Java/C# the function must be a free function (C++), a `static` method of `Main` (Java) or a local/static function in top-level statements (C#), exactly like Chapter 1's function terminals.
* For classes, interfaces, exceptions and so on, check what the program **prints** (`expect`, or `check`) and use `require` to make sure the concept was actually used (e.g. `/\bextends\b/`, `/\btry\b/`, `/=>/`).
* Every printed value must be **deterministic**.
* The starter must not pass, and no hint and no `similar.code` may pass (tests check all three).
* Descriptions for non-Python languages must not contain `print(`, `def `, `self.` or `elif`.

### Helpers

`GameData.helpers` has `c(s)` (wrap in `<code>`), `lines(run)` (trimmed output lines), `lastLine(run)`, `escapeHTML`, `nothing(v)`, `show(v)` (JSON), `checkCalls`, `stripComments(code, ctx)`, `actionsOf`, `firstErr`.

## Maps

`map: (B) => {...}` gets `B = { MapBuilder, room, OB, TR, gate, mapOf }`. Build levels like Chapter 1 does (see `level1()`–`level6()` in `js/levels.js`):

```js
map: (B) => {
  const m = B.MapBuilder(130, 17);           // width ~100–160, height 17
  m.fill(0, 15, 129, 16, '#');               // ground on rows 15–16
  m.put(2, 14, 'P'); m.put(5, 14, '?');      // start, first sign (row 14 = standing on the ground)
  let x = B.room(m, 7, 1, 'climb', 'A');     // terminal "1" then a code-block staircase that group A opens
  x = B.TR.hills(m, x);                      // fun traversal between terminals
  x = B.room(m, x, 2, 'bridge', 'B');
  m.put(x + 1, 14, 'K');                     // checkpoint
  x = B.TR.mover(m, x + 3);
  x = B.room(m, x + 1, 3, 'spikes', 'C');
  m.put(x + 2, 14, 'e');                     // a walking bug
  x = B.room(m, x + 4, 4, 'spring', 'D');
  x = B.TR.pit(m, x + 1);
  x = B.room(m, x + 1, 5, 'lava', 'E');
  x = B.room(m, x + 1, 6, 'wall', 'G');
  m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F'); // last sign, exit portal
  return m;
}
```

* Obstacles (`room(m, x, n, kind, group)`): `wall`, `climb`, `bridge`, `spikes`, `spring`, `lava`. **Vary them** — never the same kind twice in a row.
* Group letters: `A B C D E G H` (there is no `F`, which is the portal). One letter per terminal, at most 7 terminals per level.
* Travel pieces between rooms (never block progress): `TR.hills`, `TR.pit`, `TR.mover`, `TR.tower`. Put one between most rooms.
* Extras: `o` data bit, `e` walking bug, `w` flying bug (mid-air, e.g. row 10), `K` checkpoint (one around the middle), `?` sign (one sign text per `?`, in order).
* Only use these building blocks on flat ground so the level stays beatable — every terminal must be reachable and the portal must be unreachable until every gate is open.

## Size

About 4–5 levels per chapter (fewer is fine where the topic doesn't need more), each with 4–7 terminals that go from "first taste" to a real, satisfying use of the idea.
Levels should get longer and the final level of the chapter should combine the chapter's ideas.

## Testing

```bash
LANGS=python node tests/challenges_test.js   # reference solutions pass, starters don't
LANGS=python node tests/teach_test.js        # tutorials run, hints/similar don't solve
node tests/py_test.js && node tests/clike_test.js
```
