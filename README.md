# CodeQuest

A puzzle platformer where you build things and make progress by **writing real code**, in the language of your choice: **Python, JavaScript, C++, C# or Java**.

Walk up to terminals, write scripts, and watch your code change the world: build bridges, open gates, turn lava into stone, raise staircases, forge weapons, and fight a final boss with loops.

## Play

There's no build step and nothing to install. Serve the folder with any static file server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

You can also publish it with GitHub Pages (Settings → Pages → deploy from the `main` branch, root folder).

### Controls

| Key | Action |
| --- | --- |
| ← → / A D | Move |
| Space / W / ↑ | Jump |
| ↓ / S | Drop through platforms |
| E | Use a terminal or the skill shrine |
| X / J | Attack (once you've forged a weapon) |
| Q | Debugger (fix glitches) |
| K | Skill tree |
| M | Level map |
| Esc | Pause, switch language, save & quit |
| Ctrl + Enter | Run code in the editor |

Touch controls appear automatically on phones and tablets.

## Level map

Each save opens on a little map of the course: one stop per level, labelled with the topic it teaches. Every language has its own map for each chapter (Python's Chapter 1 is a meadow valley, its Chapter 2 a chain of islands, and so on). You can look at locked chapters and levels too: see their topics and terminals and read their tutorials. They just can't be played until you unlock them. Your hero stands on the level you're up to. Click any level you've unlocked to play it, whether that's continuing where you left off or replaying an old one. Levels you haven't reached yet are locked. In-game, the label at the top left shows the current level and topic. Click it or press **M** to open the map.

## Chapter 2

Beat Segfault and a **Chapter 2** tab opens on the level map. Each language gets its own chapter, with its own map, story and topics that go deep into that language:

| Language | Chapter | Topics |
| --- | --- | --- |
| Python | The Pythonic Isles | comprehensions, slicing & f-strings, tuples & dicts, exceptions, inheritance & `__str__` |
| JavaScript | The Neon Grid | map/filter/reduce, destructuring & spread, objects & JSON, closures & callbacks, classes (extends, getters, static) |
| C++ | The Iron Forge | references, encapsulation, STL algorithms & lambdas, overloading, inheritance & virtual |
| C# | The Crystal Spire | properties, LINQ, interfaces & inheritance, exceptions |
| Java | The Coffee Works | encapsulation & static, inheritance & @Override, interfaces & abstract classes, collections & lambdas, exceptions |

Chapter 2 keeps its own progress and checkpoints. See `docs/CHAPTER2.md` to write or change one.

## Features (from the original idea list)

- **A puzzle platformer where you write scripts in a language of your choice.** Python runs on a small Python interpreter built for the game (`js/python.js`). JavaScript runs in the browser in a sandboxed Web Worker. C++, C# and Java run on one C-family interpreter (`js/clike.js`) with a dialect per language, real program shapes (`int main()`, `public class Main`, C# top-level statements) and compiler-style error messages. Every terminal, tutorial, hint and glitch exists in all five languages.
- **You collect objects as variables and print them when you need them.** Glowing boxes like `planks` and `password` become variables in your scripts. The password is random for each player, so you have to print the variable rather than type the value.
- **A character creator** with your name, skin, clothes, hats and eyes. The guard bot even checks visitors against your name.
- **Levels, starting with "Hello, World".** Each level opens with a step-by-step **tutorial** that teaches the syntax: one idea per page, each with an example you can edit and run. Then a series of terminals practises one new idea each:
  1. **print()**: print → several lines → gluing text with `+` → maths → brackets first → printing several values
  2. **Variables**: make one → text/number/boolean types → use a collected one → maths with variables → change a variable → build sentences from variables → print a secret
  3. **Conditions**: comparisons → `if` → `if/else` → `%` and even/odd → `elif` → `and` → `or`
  4. **Loops**: repeat → use the counter `i` → count 1 to 10 → count down → loop over a list → `while` → running totals → `break`
  5. **Functions**: call → parameters → `return` → using returned values → returning text → returning True/False → loops inside functions → `if` inside functions
  6. **Classes**: objects and attributes → constructor inputs and methods → methods that change attributes → methods with inputs → forge a weapon / adopt a pet
  7. **The Wilds**, an open world: list and string side quests, then the three Core puzzles, FizzBuzz and dictionaries
  8. **The final boss**: Segfault the Bug King
- **Varied obstacles and fun paths.** Each terminal unlocks a different kind of obstacle: code-block stairs up a cliff, a code bridge over lava, a spike tunnel whose spikes retract, a launch spring over a tall wall, a lava lake that cools to stone, or the classic gate. Between terminals there are hills, lava pits with stepping platforms, moving platforms, climbable towers and hidden **data bits** (). Every 20 bits earns a skill point once skill points are unlocked.
- **Hints that teach.** Hints nudge you toward the idea without giving code to copy. The last hint shows a *similar* problem solved step by step, never the answer to your own terminal (a test checks this).
- **The `i` in loops is a little friend you can find.** `i` is hidden in the Loops level, and the Staircase Engine won't run until you find them. They hop up each step your loop builds (`i=0`, `i=1`, ...) and follow you for the rest of the game.
- **One save file per language.** The title screen has a save file for each language, so you can run a Python adventure and a Java adventure side by side. Each save stays in its language. Saves are stored in your browser's localStorage.
- **Classes can be used for weapons or pets.** Write a `class` with `name`/`damage` to get a real weapon, or one with `name`/`speak()` to get a pet that follows you around and talks (cats, dogs, birds, robots, dragons, slimes...).
- **Once you reach classes you earn skill points and unlock an open world.** The skills are Double Jump, Swift Boots, Vitality, Sharpened Code, Debugger's Eye, Companion Strike and Overclock. You earn points from Core terminals, side quests (FizzBuzz, a dictionary merchant) and squashing bugs.
- **Enemies can put errors in your code.** SyntaxBugs, NameBugs and TypeBugs bite you and corrupt your code with a *glitch*: jumping is disabled, your controls are reversed, or you're slowed down. Press **Q** to open the debugger and fix the broken snippet to get your powers back. The boss can also corrupt your cannon code in the middle of the fight.
- **A final boss.** Blast Segfault with a looped Compiler Cannon, hit it with your weapon when it swoops, or jump on its head.

## Project layout

```
index.html        page shell (title, creator, HUD, editor)
css/style.css     styles
js/python.js      Python interpreter (tokenizer, parser, evaluator)
js/runner.js      runs player code: Python interpreter or JS in a Web Worker
js/clike.js       C++ / C# / Java interpreter
js/langs.js       naming and printing rules per language
js/content/       C++, C# and Java course content (see docs/ADDING_A_LANGUAGE.md)
js/chapter2/      one Chapter 2 per language (see docs/CHAPTER2.md)
js/levels.js      level maps, terminal challenges, glitch snippets, skills
js/teach.js       tutorials, hints and similar-problem examples
js/art.js         procedural drawing: hero, i, pets, bugs, boss
js/game.js        platformer engine: physics, entities, effects, boss
js/mapart.js      the level-map boards (scenery and routes per language and chapter)
js/ui.js          menus, save slots, character creator, code editor, HUD, sound
tests/            Node test scripts
```

### Adding a level

Levels are built with a small map builder in `js/levels.js`. Each character in a map is one tile:

| Char | Tile |
| --- | --- |
| `#` | ground |
| `W` | wall |
| `-` | one-way platform |
| `^` | spikes |
| `~` | lava |
| `%` | lava a terminal can cool |
| `A`–`H` | gates (a terminal's effect opens its letter) |
| `_` | bridge slot |
| `S` | stair origin |
| `P` | player start |
| `1`–`9` | terminals |
| `*` | variable pickup |
| `?` | sign |
| `@` | the `i` friend |
| `e` / `w` | walking / flying bug |
| `o` | data bit collectible |
| `s` | spring |
| `K` | checkpoint |
| `$` | skill shrine |
| `F` | exit portal |
| `Z` | boss |

Obstacles tied to a terminal are placed with the helpers in `js/levels.js` (`room(m, x, n, 'climb' | 'bridge' | 'spikes' | 'spring' | 'lava' | 'wall', group)`), and travel pieces with `TR.hills / pit / mover / tower`. A terminal whose effect calls `openGate('C')` unlocks every group-C obstacle in its level.

A challenge has a description, starter code for each language, the API functions it exposes, optional test cases, a `check()` function and a world `effect()`.

## Tests

```bash
node tests/py_test.js          # Python interpreter
node tests/challenges_test.js  # every challenge solved in both languages + every glitch snippet errors
node tests/teach_test.js       # tutorials run; hints and similar examples never solve their terminal
node tests/clike_test.js       # the C++ / C# / Java interpreter
LANGS=cpp node tests/challenges_test.js   # just one language
```
