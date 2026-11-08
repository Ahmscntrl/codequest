# CodeQuest

A puzzle platformer where you build things and make progress by **writing real code**, in the language of your choice (**Python** or **JavaScript**).

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

Each save opens on a little map of the course: one stop per level, labelled with the topic it teaches. Your hero stands on the level you're up to. Click any level you've unlocked to play it, whether that's continuing where you left off or replaying an old one. Levels you haven't reached yet are locked. In-game, the label at the top left shows the current level and topic. Click it or press **M** to open the map.

## Features (from the original idea list)

- **A puzzle platformer where you write scripts in a language of your choice.** Python runs on a small Python interpreter built for the game (`js/python.js`), with real Python-style errors. JavaScript runs on the browser's own JS engine inside a sandboxed Web Worker with a timeout. You can switch languages at any time, and every terminal works in both.
- **You collect objects as variables and print them when you need them.** Glowing boxes like `planks` and `password` become variables in your scripts. The password is random for each player, so you have to print the variable rather than type the value.
- **A character creator** with your name, skin, clothes, hats and eyes. The guard bot even checks visitors against your name.
- **Levels, starting with "Hello, World".** Each topic is a series of small steps, and every terminal teaches one new idea:
  1. **print()**: Hello World → printing several lines → math with numbers
  2. **Variables**: make a variable → use a collected one → do math with variables → change a variable → print a secret
  3. **Conditions**: true/false comparisons → `if` → `if/else` → `elif` → `and`
  4. **Loops**: repeat → use the counter `i` → count 1 to 10 → count down → `while` → add up totals
  5. **Functions**: call a function → parameters → `return` → returning text → functions with loops → functions with `if`
  6. **Classes**: objects and attributes → constructor inputs and methods → forge a weapon / adopt a pet
  7. **The Wilds**, an open world: list and string warm-ups, then lists, strings, Fibonacci, FizzBuzz and dictionaries
  8. **The final boss**: Segfault the Bug King
- **The `i` in loops is a little friend you can find.** `i` is hidden in the Loops level, and the Staircase Engine won't run until you find them. They hop up each step your loop builds (`i=0`, `i=1`, ...) and follow you for the rest of the game.
- **Save slots.** There are 3 slots stored in your browser's localStorage. The game saves at checkpoints and when you solve terminals.
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
js/levels.js      level maps, terminal challenges, glitch snippets, skills
js/art.js         procedural drawing: hero, i, pets, bugs, boss
js/game.js        platformer engine: physics, entities, effects, boss
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
| `A` / `B` | gates |
| `_` | bridge slot |
| `S` | stair origin |
| `P` | player start |
| `1`–`9` | terminals |
| `*` | variable pickup |
| `?` | sign |
| `@` | the `i` friend |
| `e` / `w` | walking / flying bug |
| `s` | spring |
| `K` | checkpoint |
| `$` | skill shrine |
| `F` | exit portal |
| `Z` | boss |

A challenge has a description, starter code for each language, the API functions it exposes, optional test cases, a `check()` function and a world `effect()`.

## Tests

```bash
node tests/py_test.js          # Python interpreter
node tests/challenges_test.js  # every challenge solved in both languages + every glitch snippet errors
```
