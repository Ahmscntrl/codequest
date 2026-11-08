# Adding content for a language (C++, C#, Java, ...)

Python and JavaScript content lives inside `js/levels.js` (descriptions, starters, checks) and
`js/teach.js` (tutorials, hints, similar examples). Every other language gets **one content file**,
`js/content/<lang>.js`, plus reference solutions in `tests/solutions/<lang>.js`. Nothing else needs to
change: the checks that decide whether a terminal is solved are shared by all languages.

C++, C# and Java run on `js/clike.js`, one interpreter with a dialect per language
(`CLike.run(code, { dialect: 'cpp' | 'csharp' | 'java', ... })`). Naming rules live in `js/langs.js`.

## The content file

```js
GameData.addLanguageContent('cpp', {
  intro:     { hello: '<p>...</p>', vars: '...', ifs, loops, funcs, classes, world, boss },
  tutorials: { hello: [ { title, body, code, expectError }, ... ], ... },   // every level id
  terminals: { hello: { desc, starter, hints: ['...', '...'], similar: { task, code } }, ... }, // every terminal id
  snippets:  { syntax: [ { code, expect, hint } x4 ], name: [ ... x4 ], type: [ ... x4 ] },
});
```

* `intro[level]`: the first ("story") page of each level's tutorial. Keep the story from the
  Python intro (`LEVELS[..].intro.python` in `js/levels.js`), with any code samples in this language.
* `tutorials[level]`: the lesson pages after the story page. Each page teaches **one** piece of
  syntax: `title`, `body` (HTML), and `code`, a complete program the player can edit and run.
  The code must run and print something, unless the page sets `expectError: true` to show an error on
  purpose. End each level with a cheat-sheet page (no `code`). Mirror the Python tutorial pages in
  `js/teach.js`, adapted to the language. The boss level needs one page.
* `terminals[id].desc`: HTML shown in the terminal. Explain the task and the syntax it needs, in this
  language. You can use `{planks}`, `{password}` (collected variables) and `{name}` (the hero's name).
* `terminals[id].starter`: the code in the editor when the terminal first opens. It must be a
  complete program that compiles, and it must **not** already solve the terminal.
* `terminals[id].hints`: 1–3 nudges in plain words. Never the solution and never code that solves it.
* `terminals[id].similar`: `{ task, code }`, a *different* problem of the same difficulty solved in full
  (a complete runnable program that prints something). Players see it as the final hint, so it must
  **not** solve the terminal itself.
* `snippets`: broken programs a bug "bites" into your code. `syntax` snippets must fail with a
  SyntaxError, `name` with a NameError (undeclared or misspelled name) and `type` with a TypeError
  (wrong type, for example `int x = "5";`). Once fixed, each prints exactly `expect`.

No emojis anywhere.

## Program shape in each language

* **C++**: `#include <iostream>` (plus `<string>`, `<vector>`, `<map>` as needed), `using namespace std;`,
  functions and classes first, then `int main() { ... return 0; }`. Statements outside a function are an
  error, just like the real thing.
* **Java**: `public class Main { public static void main(String[] args) { ... } }`. Helper functions are
  `static` methods inside `Main`. Other classes go in the same file, outside `Main` and without `public`.
* **C#**: top-level statements (no `Main` needed), local functions, and classes declared **after** the
  statements, which is the order real C# requires.

## Names the game uses

| | C++ | Java | C# |
|---|---|---|---|
| game functions (e.g. `build_bridge`) | `build_bridge` | `buildBridge` | `BuildBridge` |
| game variables (e.g. `my_name`, `has_ticket`) | `my_name`, `has_ticket` | `myName`, `hasTicket` | `myName`, `hasTicket` |
| functions the player writes | `cheer echo double_it square greet even total biggest` | `cheer echo doubleIt square greet even total biggest` | `Cheer Echo DoubleIt Square Greet Even Total Biggest` |
| lists the game hands you | `vector<T>`: `.size()`, `[i]` | `ArrayList<T>`: `.size()`, `.get(i)` | `List<T>`: `.Count`, `[i]` |
| dictionaries (`prices`) | `map<string,int>`: `prices["x"]` | `HashMap<String,Integer>`: `prices.get("x")` | `Dictionary<string,int>`: `prices["x"]` |

* Terminals that read your variables (`firstvar`: `color`; `types`: `name`, `level`, `alive`) need them
  declared inside `main` (C#: at the top level).
* Classes: the checks read the attributes `name`, `damage`, `power`, `species`, `contents` and the
  methods `speak`, `describe`, `swing`. In C# write them PascalCase (`Name`, `Speak()`). The game reads
  them either way.
* Printing `true`/`false` in C++ shows `1`/`0` unless you print `boolalpha` first. The checks accept
  both.

## Checking your work

```bash
LANGS=cpp node tests/challenges_test.js   # every terminal: solution passes, starter doesn't, snippets error
LANGS=cpp node tests/teach_test.js        # tutorials run, intros exist, hints/similar never solve a terminal
node tests/clike_test.js                  # the interpreter itself
```
