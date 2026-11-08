# The Data Structures & Algorithms course

A sixth save file on the title screen. Unlike the language save files, it isn't tied to one language: the player picks a language when they create it and can switch at any time, from the map or the pause menu. Their code is stored separately for each language. So **every terminal, tutorial page, hint and example exists in all five languages**: `python`, `javascript`, `cpp`, `csharp`, `java`.

It assumes the player knows the basics (Chapter 1: variables, if, loops, functions, classes, lists, dictionaries).

| File | Contents |
| --- | --- |
| `js/dsa/course.js` | course header (title, theme) |
| `js/dsa/part1.js` | levels 1–4: Arrays & Big-O, Searching, Hash Maps, Stacks & Queues |
| `js/dsa/part2.js` | levels 5–8: Recursion, Sorting, Linked Lists & Trees, Graphs |
| `tests/solutions/dsa/<lang>.js` | `module.exports = { challengeId: 'code', ... }` for each language |

Level ids (fixed, minibosses are attached to two of them): `dsa_arrays`, `dsa_search`, `dsa_hash`, `dsa_stack` (miniboss "Stack Overflow"), `dsa_recur`, `dsa_sort`, `dsa_nodes`, `dsa_graph` (miniboss "The Big O", the finale). The miniboss arena is added to the end of those maps automatically; build the map normally.

## A part file

```js
(function (root) {
  'use strict';
  const GD = root.GameData;
  const { c, escapeHTML } = GD.helpers;
  const tn = (n, ctx) => Lang.testName(n, ctx.lang);   // binary_search -> binarySearch / BinarySearch ...
  GD.addCourseLevels('dsa', {
    challenges: { /* id: challenge */ },
    levels: [ /* level, in order */ ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

Any field below marked **per language** may be a single value used for every language, or an object `{ python, javascript, cpp, csharp, java }`.

### A level

```js
{
  id: 'dsa_search', name: 'The Binary Library', topic: 'Searching',
  blurb: 'One sentence for the map panel.',
  theme: 'cave',                       // meadow | cave | circuit | wilds | isle | neon | forge | crystal | coffee
  intro: '<p>Story page. Keep language-neutral, or give one per language.</p>',   // per language
  tutorial: [                          // 3–6 pages, one idea per page
    { title: 'Halving the problem',    // per language
      body: '<p>Explanation; may differ per language.</p>',                       // per language
      code: { python: '...', javascript: '...', cpp: '...', csharp: '...', java: '...' } },  // must run and print in every language
  ],
  signs: ['...'],
  terminals: ['dsa_search1', ...],     // map digit 1 = terminals[0], ...
  map: (B) => { ... },                 // exactly like Chapter 2 maps, see docs/CHAPTER2.md "Maps"
}
```

Tutorial code and starters for C++/Java/C# are complete programs, written the way Chapter 1 does it in that language (see `js/content/cpp.js`, `js/content/csharp.js`, `js/content/java.js`): `#include` + `int main()` for C++, `public class Main` with `main` for Java, top-level statements for C#.

### A challenge

```js
dsa_search1: {
  title: 'The Index Card',
  desc: (ctx) => `<p>Write ${c(tn('binary_search', ctx))}(items, target) ...</p>`,   // or a per-language object of HTML strings
  starter: { python: '...', javascript: '...', cpp: '...', csharp: '...', java: '...' },
  hints: { python: ['...'], ... },                 // per language; nudges, never the answer
  similar: { python: { task: '...', code: '...' }, ... },   // per language; a solved *different* problem of the same calibre
  callTests: [{ fn: 'binary_search', args: [[1, 3, 5, 7], 5] }, ...],   // fn in snake_case: renamed per language automatically
  expectCalls: [2, ...],                           // values the calls must return (compared as JSON; lists/vectors/arrays compare as arrays)
  // or expect: ['line 1', ...] (per language) for printed output, or check(runs, ctx, code) => ({ ok, msg })
  require: { python: [[/while/, 'Use a loop that halves the range.']], ... },  // optional, per language
  gate: 'A',
  success: 'Optional message.',
}
```

* **Prefer function terminals with `callTests`**: they are language-neutral, can't be beaten by printing, and fit DSA well. The function name in each language is `Lang.testName(name, lang)` (snake_case in Python and C++, camelCase in JavaScript and Java, PascalCase in C#). Write `desc` with `tn(...)` so each language shows its own name.
  - C++: a free function, e.g. `int binary_search(vector<int> items, int target)`.
  - Java: a `static` method of `Main`.
  - C#: a local (static) function in top-level statements.
  - Arguments arrive as Python lists / JS arrays / `vector<int>` or `vector<string>` / `List<int>` (C#) / `int[]`, `String[]` or `ArrayList` (Java): check what the interpreter passes and write starters to match (see how Chapter 1's `total` and `biggest` terminals do it in `js/content/*.js`).
* For data structures built from classes (linked lists, trees, a stack class), give a starter with the class and some test lines that print, and check the printed output with `expect`, plus `require` for the key idea.
* The starter must not pass; no hint and no `similar.code` may pass (the tests check this).
* Descriptions for non-Python languages must not contain `print(`, `def `, `self.` or `elif`.
* Everything printed must be deterministic and must match what the real language would print.

## Interpreters

Python runs on `js/python.js` (imports are disabled: use lists as stacks/queues, dicts as hash maps, no `collections`). C++/C#/Java run on `js/clike.js`; JavaScript runs natively. If a correct program in some language misbehaves, fix the interpreter with **small Edit-tool replacements only** (another agent may be editing the same file), keep fixes guarded to the right dialect, and keep `node tests/py_test.js` and `node tests/clike_test.js` passing. Only teach code a real compiler/interpreter would accept.

## Testing

```bash
ONLY_DSA=1 node tests/challenges_test.js   # DSA terminals in all five languages
ONLY_DSA=1 node tests/teach_test.js
LANGS=cpp ONLY_DSA=1 node tests/challenges_test.js   # one language
```
