/* CodeQuest — Chapter 2 for Python: The Pythonic Isles.
 * Five islands that go deep into the things that make Python feel like Python:
 * comprehensions, slicing & f-strings, tuples & dicts, exceptions, and inheritance.
 * See docs/CHAPTER2.md for the format.
 */
(function (root) {
  'use strict';
  const GD = root.GameData;
  const { c, lines, escapeHTML, nothing } = GD.helpers;

  // ------------------------------------------------------------ check helpers
  // Python-style display of a test value (as it comes back from the interpreter)
  function pyRepr(v) {
    if (v === null || v === undefined) return 'None';
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (typeof v === 'string') {
      const q = v.includes("'") && !v.includes('"') ? '"' : "'";
      return q + v.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q) + q;
    }
    if (Array.isArray(v)) return '[' + v.map(pyRepr).join(', ') + ']';
    if (typeof v === 'object') {
      if (v.__obj) return `<${v.className} object>`;
      return '{' + Object.keys(v).map(k => pyRepr(k) + ': ' + pyRepr(v[k])).join(', ') + '}';
    }
    return String(v);
  }
  // dicts are equal whatever order their keys are in, just like in Python
  const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x)) ? Object.keys(x).sort().reduce((o, k2) => { o[k2] = x[k2]; return o; }, {}) : x);
  // <code> that keeps spaces visible (for alignment tasks)
  const cs = (s) => `<code style="white-space:pre">${escapeHTML(s)}</code>`;

  // Function terminals: cases = [{ args, want }] or [{ args, raises: 'ValueError', message }]
  function fnCheck(name, cases, success) {
    return {
      callTests: cases.map(k => ({ fn: name, args: k.args })),
      check(runs) {
        const calls = runs[0].calls || [];
        for (let i = 0; i < cases.length; i++) {
          const k = cases[i], call = calls[i];
          const sig = cs(`${name}(${k.args.map(pyRepr).join(', ')})`);
          if (!call || (call.error && call.error.startsWith(`NameError: name '${name}'`))) return { ok: false, msg: `There's no function called ${c(name)} yet. Define it with ${c('def ' + name + '(...):')} and spell the name exactly like that.` };
          if (k.raises) {
            if (!call.error) return { ok: false, msg: `${sig} should <b>raise</b> a ${c(k.raises)}, but it returned ${cs(pyRepr(call.value))} instead. Use ${c('raise ' + k.raises + '(...)')}.` };
            const at = call.error.indexOf(': ');
            const type = at < 0 ? call.error : call.error.slice(0, at), msg = at < 0 ? '' : call.error.slice(at + 2);
            if (type !== k.raises) return { ok: false, msg: `${sig} raised a ${c(escapeHTML(type))}${msg ? ` (${escapeHTML(msg)})` : ''}, but it should raise a ${c(k.raises)}.` };
            if (k.message !== undefined && msg !== k.message) return { ok: false, msg: `${sig} raised ${c(k.raises)} with the message ${cs(msg || '(empty)')}, but the message should be exactly ${cs(k.message)}.` };
            continue;
          }
          if (call.error) return { ok: false, msg: `${sig} crashed with <b>${escapeHTML(call.error)}</b>.` };
          if (canon(call.value) !== canon(k.want)) {
            const none = call.value === null ? ' <i>(None means nothing was <b>returned</b>. Did you forget <code>return</code>?)</i>' : '';
            return { ok: false, msg: `${sig} returned ${cs(pyRepr(call.value))} but it should return ${cs(k.wantText || pyRepr(k.want))}.${none}` };
          }
        }
        return { ok: true, msg: success || `All ${cases.length} tests pass! Your function ${c(name)} works.` };
      },
    };
  }
  // Printing terminals: cases = [{ label, globals, expect: [lines] }] (one run per case)
  function outCheck(cases, success) {
    return {
      tests: () => cases.map(k => ({ label: k.label || 'run', globals: k.globals || {} })),
      check(runs) {
        for (let i = 0; i < cases.length; i++) {
          const got = lines(runs[i]), want = cases[i].expect;
          const pre = cases.length > 1 ? `Test ${i + 1} (${escapeHTML(cases[i].label)}): ` : '';
          for (let j = 0; j < want.length; j++) {
            if (got[j] !== want[j]) return { ok: false, msg: `${pre}line ${j + 1} should be ${cs(want[j])} but it was ${got[j] === undefined ? '<i>nothing</i>' : cs(got[j])}.` };
          }
          if (got.length > want.length) return { ok: false, msg: `${pre}expected ${want.length} line${want.length === 1 ? '' : 's'} of output, but you printed ${got.length}. The extra line is ${cs(got[want.length])}.` };
        }
        return { ok: true, msg: success || 'It works! <b>The way is open.</b>' };
      },
    };
  }
  void nothing;
  const COMP = [/[[{][^\n]*\bfor\b[^\n]*\bin\b[^\n]*[\]}]/, 'Use a <b>comprehension</b>: brackets with a <code>for ... in ...</code> inside them, like <code>[x * 2 for x in nums]</code>.'];
  const NO_APPEND = [/^(?![\s\S]*\.append\s*\()/, 'Nice try, but this terminal wants it <b>without</b> <code>.append()</code>. Build the whole list in one line with a comprehension.'];

  // ------------------------------------------------------------ challenges
  const challenges = {
    // ================================================= 1. Comprehension Cove
    py2_comp1: {
      title: 'The Doubling Tide',
      desc: `<p>The tide doubles every shell it touches. The list ${c('shells')} holds some numbers (it changes for each test).</p>
        <p>Make a new list called ${c('doubled')} where every number is <b>twice as big</b>, using a <b>list comprehension</b>. Then print it.</p>
        <pre>shells = [3, 7, 1]\n# prints: [6, 14, 2]</pre>`,
      starter: `# shells is given to you (it changes for each test)\ndoubled = []   # turn this into a comprehension\nprint(doubled)\n`,
      hints: ['A comprehension looks like [something for x in shells]. What should "something" be?', 'The "something" is what each new item becomes. Here each shell becomes the shell times 2.'],
      similar: { task: 'Make a list of every price plus 1 coin of tax.', code: `prices = [5, 12, 8]\nwith_tax = [p + 1 for p in prices]\nprint(with_tax)` },
      gate: 'A',
      ...outCheck([
        { label: 'shells = [3, 7, 1, 9, 4]', globals: { shells: [3, 7, 1, 9, 4] }, expect: ['[6, 14, 2, 18, 8]'] },
        { label: 'shells = [10, 0, 5]', globals: { shells: [10, 0, 5] }, expect: ['[20, 0, 10]'] },
        { label: 'shells = []', globals: { shells: [] }, expect: ['[]'] },
      ], 'The tide rolls in and every shell doubles. <b>Your first comprehension!</b>'),
      require: [COMP, NO_APPEND],
    },
    py2_comp2: {
      title: 'The Measuring Pier',
      desc: `<p>The harbour master wants to know how long each word on the dock signs is.</p>
        <p>Write a function ${c('lengths(words)')} that <b>returns</b> a list with the length of each word, using a comprehension.</p>
        <pre>lengths(["sea", "island", "ok"])  →  [3, 6, 2]\nlengths([])                       →  []</pre>`,
      starter: `def lengths(words):\n    return []   # use a comprehension here\n\nprint(lengths(["sea", "island", "ok"]))\n`,
      hints: ['len(w) gives the length of one word w.', 'Inside the brackets: what each word becomes, then for w in words.'],
      similar: { task: 'Return the first letter of every name.', code: `def initials(names):\n    return [n[0] for n in names]\n\nprint(initials(["Ada", "Bo", "Cy"]))` },
      gate: 'B',
      ...fnCheck('lengths', [
        { args: [['sea', 'island', 'ok']], want: [3, 6, 2] },
        { args: [['python']], want: [6] },
        { args: [[]], want: [] },
        { args: [['a', 'bb', 'ccc', 'dddd']], want: [1, 2, 3, 4] },
      ]),
      require: [COMP, NO_APPEND],
    },
    py2_comp3: {
      title: 'The Pearl Sieve',
      desc: `<p>The sieve keeps only some pearls and polishes them. Write ${c('even_squares(nums)')} that returns the <b>squares</b> of only the <b>even</b> numbers, in order.</p>
        <pre>even_squares([1, 2, 3, 4])  →  [4, 16]\neven_squares([5, 7])        →  []</pre>
        <p>Put an ${c('if')} at the <b>end</b> of the comprehension to filter: ${c('[... for n in nums if ...]')}</p>`,
      starter: `def even_squares(nums):\n    return [n * n for n in nums]   # keep only the even ones!\n\nprint(even_squares([1, 2, 3, 4]))\n`,
      hints: ['A number n is even when n % 2 == 0.', 'The filter goes after the for part: ... for n in nums if (your test here)'],
      similar: { task: 'Return the doubled value of every number bigger than 10.', code: `def double_big(nums):\n    return [n * 2 for n in nums if n > 10]\n\nprint(double_big([4, 12, 30, 9]))` },
      gate: 'C',
      ...fnCheck('even_squares', [
        { args: [[1, 2, 3, 4]], want: [4, 16] },
        { args: [[5, 7]], want: [] },
        { args: [[10, 3, 6, 0]], want: [100, 36, 0] },
        { args: [[]], want: [] },
      ]),
      require: [COMP, NO_APPEND],
    },
    py2_comp4: {
      title: 'The Tide Labels',
      desc: `<p>The tide gauge reads a list of water levels. Write ${c('tide_labels(levels)')} that returns a list of labels: ${c('"high"')} for a level of <b>5 or more</b>, otherwise ${c('"low"')}.</p>
        <pre>tide_labels([2, 7, 5])  →  ["low", "high", "high"]</pre>
        <p>This time every item stays, but it <b>becomes</b> one of two things. That's an ${c('if ... else')} at the <b>front</b> of the comprehension.</p>`,
      starter: `def tide_labels(levels):\n    return [level for level in levels]   # each level should become "high" or "low"\n\nprint(tide_labels([2, 7, 5]))\n`,
      hints: ['The front part can be a choice: A if (test) else B.', 'Put the choice where "level" is now, before the word for.'],
      similar: { task: 'Label numbers as "big" or "small" (big means over 100).', code: `def sizes(nums):\n    return ["big" if n > 100 else "small" for n in nums]\n\nprint(sizes([5, 500, 100]))` },
      gate: 'D',
      ...fnCheck('tide_labels', [
        { args: [[2, 7, 5]], want: ['low', 'high', 'high'] },
        { args: [[4]], want: ['low'] },
        { args: [[]], want: [] },
        { args: [[9, 0, 5, 4, 6]], want: ['high', 'low', 'high', 'low', 'high'] },
      ]),
      require: [COMP, NO_APPEND],
    },
    py2_comp5: {
      title: 'The Budget Market',
      desc: `<p>A market stall has a dict of ${c('prices')}, like ${c('{"rope": 4, "lamp": 15}')}. You only have ${c('budget')} coins.</p>
        <p>Write ${c('affordable(prices, budget)')} that returns a <b>new dict</b> with only the items that cost <b>at most</b> ${c('budget')}. Use a <b>dict comprehension</b>.</p>
        <pre>affordable({"rope": 4, "lamp": 15, "map": 9}, 10)\n→  {"rope": 4, "map": 9}</pre>`,
      starter: `def affordable(prices, budget):\n    return {}   # a dict comprehension goes here\n\nprint(affordable({"rope": 4, "lamp": 15, "map": 9}, 10))\n`,
      hints: ['Loop over both parts of the dict with: for item, price in prices.items()', 'A dict comprehension has a key: value pair at the front, and you can add an if at the end.'],
      similar: { task: 'Make a dict of only the islands with more than 100 people.', code: `towns = {"Tortuga": 120, "Rocky": 8, "Palm": 300}\nbig = {name: people for name, people in towns.items() if people > 100}\nprint(big)` },
      gate: 'E',
      ...fnCheck('affordable', [
        { args: [{ rope: 4, lamp: 15, map: 9 }, 10], want: { rope: 4, map: 9 } },
        { args: [{ rope: 4, lamp: 15, map: 9 }, 3], want: {} },
        { args: [{ sail: 20, oar: 20, net: 21 }, 20], want: { sail: 20, oar: 20 } },
        { args: [{}, 50], want: {} },
      ]),
      require: [COMP],
    },
    py2_comp6: {
      title: 'The Lighthouse Index',
      desc: `<p>The lighthouse keeps an index of ship names by their first letter. Write ${c('first_letters(names)')} that returns a <b>sorted list</b> of the <b>different</b> first letters, all in <b>lowercase</b>.</p>
        <pre>first_letters(["Albatross", "kraken", "Anchor", "Mermaid"])\n→  ["a", "k", "m"]</pre>
        <p>A <b>set comprehension</b> (curly brackets, no colon) throws away duplicates for you. Then ${c('sorted(...)')} turns it into a sorted list.</p>`,
      starter: `def first_letters(names):\n    letters = [name[0] for name in names]   # duplicates sneak in, and capitals!\n    return letters\n\nprint(first_letters(["Albatross", "kraken", "Anchor", "Mermaid"]))\n`,
      hints: ['name[0].lower() is the first letter of name, in lowercase.', 'Swap the square brackets for curly ones to make a set, then return sorted(that set).'],
      similar: { task: 'Find the different word lengths in a sentence, smallest first.', code: `words = ["sea", "sky", "island", "bay"]\nsizes = {len(w) for w in words}\nprint(sorted(sizes))` },
      gate: 'G',
      ...fnCheck('first_letters', [
        { args: [['Albatross', 'kraken', 'Anchor', 'Mermaid']], want: ['a', 'k', 'm'] },
        { args: [['zed', 'Zara', 'Bo']], want: ['b', 'z'] },
        { args: [['Pip']], want: ['p'] },
        { args: [[]], want: [] },
      ], 'The index glows: every letter once, in order. <b>The cove is clear!</b>'),
      require: [[/\{[^\n:]*\bfor\b[^\n]*\}|\bset\s*\(/, 'Use a <b>set comprehension</b> <code>{... for ... in ...}</code> (or <code>set(...)</code>) so duplicates disappear.']],
    },

    // ================================================= 2. Slice Shoals
    py2_slice1: {
      title: 'The Bottle Message',
      desc: `<p>A message in a bottle washed ashore. The variable ${c('message')} holds its text (it changes for each test).</p>
        <p>Print the <b>first 3</b> characters on one line, then the <b>last 3</b> characters on the next line. Use slices!</p>
        <pre>message = "PYTHONIC"\n# prints:\nPYT\nNIC</pre>`,
      starter: `# message is given to you (it changes for each test)\nprint(message)\n`,
      hints: ['message[:3] means "from the start up to (not including) index 3".', 'A negative start counts from the end: [-3:] means "the last three to the end".'],
      similar: { task: 'Print the first 2 and last 4 letters of a word.', code: `word = "lighthouse"\nprint(word[:2])\nprint(word[-4:])` },
      gate: 'A',
      ...outCheck([
        { label: 'message = "PYTHONIC"', globals: { message: 'PYTHONIC' }, expect: ['PYT', 'NIC'] },
        { label: 'message = "SEASHELL"', globals: { message: 'SEASHELL' }, expect: ['SEA', 'ELL'] },
        { label: 'message = "ab12cd34"', globals: { message: 'ab12cd34' }, expect: ['ab1', 'd34'] },
      ], 'The bottle\'s secret is revealed. <b>Slices work!</b>'),
      require: [[/\[[^\]\n]*:[^\]\n]*\]/, 'Use <b>slices</b> like <code>message[:3]</code>, not single indexes.']],
    },
    py2_slice2: {
      title: 'The Every-Other Cipher',
      desc: `<p>Smugglers hide their messages between junk letters. The real letters are at index 1, 3, 5, 7... (every <b>second</b> letter, starting at index <b>1</b>).</p>
        <p>Write ${c('decode(secret)')} that returns the hidden message.</p>
        <pre>decode("xHxExLxLxO")  →  "HELLO"\ndecode("qSqEqA")      →  "SEA"</pre>`,
      starter: `def decode(secret):\n    return secret   # slice out every second letter\n\nprint(decode("xHxExLxLxO"))\n`,
      hints: ['A slice can have three parts: [start:stop:step].', 'Start at 1, leave stop empty, and step by 2.'],
      similar: { task: 'Return every third letter, starting at index 0.', code: `def every_third(text):\n    return text[::3]\n\nprint(every_third("PaaIbbRccAddTee"))` },
      gate: 'B',
      ...fnCheck('decode', [
        { args: ['xHxExLxLxO'], want: 'HELLO' },
        { args: ['qSqEqA'], want: 'SEA' },
        { args: ['-P-y-t-h-o-n'], want: 'Python' },
        { args: [''], want: '' },
      ]),
    },
    py2_slice3: {
      title: 'The Turning Lighthouse',
      desc: `<p>The lighthouse lamp turns around in a circle. Write ${c('rotate(items, n)')} that moves the first ${c('n')} items to the <b>end</b> of the list.</p>
        <pre>rotate([1, 2, 3, 4, 5], 2)  →  [3, 4, 5, 1, 2]\nrotate(["a", "b", "c"], 0)  →  ["a", "b", "c"]</pre>
        <p>Glue two slices together with ${c('+')}. Bonus: try a negative ${c('n')} like ${c('-1')} and see what your slices do!</p>`,
      starter: `def rotate(items, n):\n    return items   # glue two slices together\n\nprint(rotate([1, 2, 3, 4, 5], 2))\n`,
      hints: ['items[n:] is everything from index n to the end.', 'items[:n] is everything before index n. Which one goes first?'],
      similar: { task: 'Return the list with the first and last item cut off.', code: `def middle(items):\n    return items[1:-1]\n\nprint(middle([1, 2, 3, 4, 5]))` },
      gate: 'C',
      ...fnCheck('rotate', [
        { args: [[1, 2, 3, 4, 5], 2], want: [3, 4, 5, 1, 2] },
        { args: [['a', 'b', 'c'], 0], want: ['a', 'b', 'c'] },
        { args: [['a', 'b', 'c'], 1], want: ['b', 'c', 'a'] },
        { args: [[1, 2, 3, 4], -1], want: [4, 1, 2, 3] },
      ]),
    },
    py2_slice4: {
      title: 'The Shipwright\'s Receipt',
      desc: `<p>The shipwright writes every price with exactly <b>2 decimal places</b>. Write ${c('price_tag(item, price)')} that returns text like this:</p>
        <pre>price_tag("rope", 3.5)    →  "rope: 3.50 coins"\nprice_tag("sail", 12)     →  "sail: 12.00 coins"</pre>
        <p>Use an f-string with a <b>format spec</b>: ${c('{price:.2f}')}.</p>`,
      starter: `def price_tag(item, price):\n    return f"{item}: {price} coins"   # show 2 decimal places\n\nprint(price_tag("rope", 3.5))\n`,
      hints: ['After the value inside the curly brackets, a colon starts the format spec.', '.2f means "a number with 2 digits after the point".'],
      similar: { task: 'Show a weight with 1 decimal place.', code: `def weight_tag(thing, kg):\n    return f"{thing} weighs {kg:.1f} kg"\n\nprint(weight_tag("anchor", 40))` },
      gate: 'D',
      ...fnCheck('price_tag', [
        { args: ['rope', 3.5], want: 'rope: 3.50 coins' },
        { args: ['sail', 12], want: 'sail: 12.00 coins' },
        { args: ['anchor', 7.249], want: 'anchor: 7.25 coins' },
        { args: ['map', 0.1], want: 'map: 0.10 coins' },
      ]),
    },
    py2_slice5: {
      title: 'The Harbour Board',
      desc: `<p>The harbour board lists ships in neat columns. Write ${c('board_line(ship, crew)')} that returns one line of the board:</p>
        <ul><li>the ship name <b>left-aligned</b> in <b>10</b> characters,</li><li>then a ${c('|')},</li><li>then the crew number <b>right-aligned</b> in <b>4</b> characters.</li></ul>
        <pre>board_line("Kraken", 7)      →  "Kraken    |   7"\nboard_line("Albatross", 120) →  "Albatross | 120"</pre>`,
      starter: `def board_line(ship, crew):\n    return f"{ship}|{crew}"   # add widths and alignment\n\nprint(board_line("Kraken", 7))\nprint(board_line("Albatross", 120))\n`,
      hints: ['{ship:<10} pads the ship name with spaces on the right until it is 10 characters wide.', '> means right-align. Put the width number right after it.'],
      similar: { task: 'Make a menu line: dish centered in 12 characters between stars.', code: `def menu_line(dish):\n    return f"*{dish:^12}*"\n\nprint(menu_line("fish"))\nprint(menu_line("coconut"))` },
      gate: 'E',
      ...fnCheck('board_line', [
        { args: ['Kraken', 7], want: 'Kraken    |   7' },
        { args: ['Albatross', 120], want: 'Albatross | 120' },
        { args: ['Pip', 1000], want: 'Pip       |1000' },
        { args: ['Mermaid', 42], want: 'Mermaid   |  42' },
      ]),
    },
    py2_slice6: {
      title: 'The Captain\'s Log',
      desc: `<p>Time to write the captain's log! Write ${c('log_entry(day, place, gold)')} that returns a line like this:</p>
        <pre>log_entry(3, "Skull Island", 1250.5)\n→  "Day 03 | Skull Is |   1,250.50"</pre>
        <ul><li>the day with at least <b>2 digits</b>, padded with zeros (${c('{day:02d}')}),</li>
        <li>the place cut to its <b>first 8</b> characters (a slice!) and left-aligned in <b>8</b>,</li>
        <li>the gold with <b>commas</b> and <b>2 decimals</b>, right-aligned in <b>10</b> (${c('{gold:>10,.2f}')}).</li></ul>
        <p>Parts are separated by ${c(' | ')} (a space, a bar, a space).</p>`,
      starter: `def log_entry(day, place, gold):\n    return f"Day {day} | {place} | {gold}"\n\nprint(log_entry(3, "Skull Island", 1250.5))\n`,
      hints: ['You can slice right inside the curly brackets: {place[:8]:<8}', 'The order inside a spec is: alignment, width, comma, then .2f.'],
      similar: { task: 'Make a scoreboard line: rank padded to 3 digits, name cut to 5 letters, score with commas.', code: `def score_line(rank, name, score):\n    return f"#{rank:03d} {name[:5]:<5} {score:>8,}"\n\nprint(score_line(7, "Adalinde", 45000))` },
      gate: 'G',
      ...fnCheck('log_entry', [
        { args: [3, 'Skull Island', 1250.5], want: 'Day 03 | Skull Is |   1,250.50' },
        { args: [12, 'Bay', 7], want: 'Day 12 | Bay      |       7.00' },
        { args: [1, 'Tortuga', 1000000], want: 'Day 01 | Tortuga  | 1,000,000.00' },
        { args: [100, 'Coral Reef', 0.5], want: 'Day 100 | Coral Re |       0.50' },
      ], 'The log is perfect: neat, sliced and formatted. <b>The shoals are behind you!</b>'),
    },

    // ================================================= 3. Treasure Atoll (tuples & dicts)
    py2_tup1: {
      title: 'The Compass Swap',
      desc: `<p>The compass got its directions backwards! Write ${c('swap(pair)')} that takes a pair of two values and returns them the other way round, as a <b>tuple</b>.</p>
        <pre>swap((3, 8))         →  (8, 3)\nswap(("N", "S"))     →  ("S", "N")</pre>
        <p><b>Unpack</b> the pair into two names first: ${c('a, b = pair')}</p>`,
      starter: `def swap(pair):\n    return pair   # unpack it, then return it swapped\n\nprint(swap((3, 8)))\n`,
      hints: ['a, b = pair puts the first value in a and the second in b.', 'return b, a sends back a tuple of two values.'],
      similar: { task: 'Return a point moved one step to the right.', code: `def step_right(point):\n    x, y = point\n    return x + 1, y\n\nprint(step_right((2, 5)))` },
      gate: 'A',
      ...fnCheck('swap', [
        { args: [[3, 8]], want: [8, 3], wantText: '(8, 3)' },
        { args: [['N', 'S']], want: ['S', 'N'], wantText: "('S', 'N')" },
        { args: [[0, 0]], want: [0, 0], wantText: '(0, 0)' },
        { args: [['gold', 99]], want: [99, 'gold'], wantText: "(99, 'gold')" },
      ]),
      require: [[/\b\w+\s*,\s*\w+\s*=[^=]/, 'Unpack the pair into two variables, like <code>a, b = pair</code>.']],
    },
    py2_tup2: {
      title: 'The Crow\'s Nest',
      desc: `<p>The first name on the crew list is always the captain; everyone else is crew. Write ${c('captain_and_crew(names)')} that returns text like:</p>
        <pre>captain_and_crew(["Ada", "Bo", "Cy"])  →  "Captain Ada, crew of 2"\ncaptain_and_crew(["Pip"])              →  "Captain Pip, crew of 0"</pre>
        <p>Use <b>star-unpacking</b>: ${c('first, *rest = names')} puts the first item in ${c('first')} and <b>all the others</b> in the list ${c('rest')}.</p>`,
      starter: `def captain_and_crew(names):\n    captain = names[0]\n    return f"Captain {captain}, crew of ?"\n\nprint(captain_and_crew(["Ada", "Bo", "Cy"]))\n`,
      hints: ['After first, *rest = names, rest is a list of everyone except the first.', 'len(rest) tells you how many crew there are.'],
      similar: { task: 'Split a race result into the winner and the last place.', code: `def podium(runners):\n    winner, *middle, last = runners\n    return f"{winner} won, {last} came last"\n\nprint(podium(["Kip", "Mo", "Zed", "Lu"]))` },
      gate: 'B',
      ...fnCheck('captain_and_crew', [
        { args: [['Ada', 'Bo', 'Cy']], want: 'Captain Ada, crew of 2' },
        { args: [['Pip']], want: 'Captain Pip, crew of 0' },
        { args: [['Zara', 'Kip', 'Mo', 'Lu', 'Ned']], want: 'Captain Zara, crew of 4' },
      ]),
      require: [[/\*\s*[A-Za-z_]\w*\s*(,[^\n]*)?=/, 'Use star-unpacking, like <code>first, *rest = names</code>.']],
    },
    py2_tup3: {
      title: 'The Roll Call',
      desc: `<p>Every morning the crew is counted. The list ${c('crew')} holds their names (it changes for each test).</p>
        <p>Print one line per sailor with their number, <b>starting at 1</b>:</p>
        <pre>crew = ["Ada", "Bo"]\n# prints:\n1. Ada\n2. Bo</pre>
        <p>Then print ${c('Crew: 2')} (with the real count) on the last line. Use ${c('enumerate')}.</p>`,
      starter: `# crew is given to you (it changes for each test)\nfor name in crew:\n    print(name)\n`,
      hints: ['for i, name in enumerate(crew) gives you a number and a name each time round.', 'enumerate counts from 0 unless you pass start=1.'],
      similar: { task: 'Print a numbered shopping list starting at 10.', code: `items = ["rope", "tar"]\nfor n, item in enumerate(items, start=10):\n    print(f"{n}) {item}")` },
      gate: 'C',
      ...outCheck([
        { label: 'crew = ["Ada", "Bo", "Cy"]', globals: { crew: ['Ada', 'Bo', 'Cy'] }, expect: ['1. Ada', '2. Bo', '3. Cy', 'Crew: 3'] },
        { label: 'crew = ["Pip"]', globals: { crew: ['Pip'] }, expect: ['1. Pip', 'Crew: 1'] },
        { label: 'crew = ["Zara", "Kip", "Mo", "Lu", "Ned"]', globals: { crew: ['Zara', 'Kip', 'Mo', 'Lu', 'Ned'] }, expect: ['1. Zara', '2. Kip', '3. Mo', '4. Lu', '5. Ned', 'Crew: 5'] },
      ]),
      require: [[/\benumerate\s*\(/, 'Use <code>enumerate(crew, start=1)</code> to get the numbers.']],
    },
    py2_tup4: {
      title: 'The Cargo Manifest',
      desc: `<p>The cargo list comes as two lists: the ${c('items')} and how many of each (${c('counts')}), in the same order.</p>
        <p>Write ${c('manifest(items, counts)')} that returns a <b>dict</b> pairing each item with its count. Use ${c('zip')}!</p>
        <pre>manifest(["rope", "barrel"], [3, 10])  →  {"rope": 3, "barrel": 10}</pre>`,
      starter: `def manifest(items, counts):\n    result = {}\n    # pair them up with zip\n    return result\n\nprint(manifest(["rope", "barrel"], [3, 10]))\n`,
      hints: ['zip(items, counts) gives pairs: ("rope", 3), ("barrel", 10)...', 'Unpack each pair in the loop: for item, count in zip(items, counts). A dict comprehension works great here.'],
      similar: { task: 'Pair each island with its distance as text.', code: `islands = ["Palm", "Rocky"]\nmiles = [4, 9]\nfor name, m in zip(islands, miles):\n    print(f"{name} is {m} miles away")` },
      gate: 'D',
      ...fnCheck('manifest', [
        { args: [['rope', 'barrel'], [3, 10]], want: { rope: 3, barrel: 10 } },
        { args: [[], []], want: {} },
        { args: [['map', 'lamp', 'oar'], [1, 2, 4]], want: { map: 1, lamp: 2, oar: 4 } },
      ]),
      require: [[/\bzip\s*\(/, 'Use <code>zip(items, counts)</code> to walk through both lists together.']],
    },
    py2_tup5: {
      title: 'The Gull Census',
      desc: `<p>A birdwatcher wrote down every bird they saw, one name per sighting. Write ${c('count_birds(sightings)')} that returns a <b>dict</b> of how many times each bird was seen.</p>
        <pre>count_birds(["gull", "crab", "gull"])  →  {"gull": 2, "crab": 1}\ncount_birds([])                        →  {}</pre>
        <p>The trick: ${c('counts.get(bird, 0)')} gives the count so far, or ${c('0')} if the bird is new.</p>`,
      starter: `def count_birds(sightings):\n    counts = {}\n    for bird in sightings:\n        counts[bird] = 1   # this forgets the earlier sightings!\n    return counts\n\nprint(count_birds(["gull", "crab", "gull"]))\n`,
      hints: ['counts[bird] = 1 throws away the old count. Use the old count plus one instead.', 'The old count is counts.get(bird, 0): safe even when bird is not in the dict yet.'],
      similar: { task: 'Count how many times each letter appears in a word.', code: `letters = {}\nfor ch in "banana":\n    letters[ch] = letters.get(ch, 0) + 1\nprint(letters)` },
      gate: 'E',
      ...fnCheck('count_birds', [
        { args: [['gull', 'crab', 'gull']], want: { gull: 2, crab: 1 } },
        { args: [[]], want: {} },
        { args: [['puffin', 'puffin', 'puffin']], want: { puffin: 3 } },
        { args: [['gull', 'tern', 'crab', 'tern', 'gull', 'tern']], want: { gull: 2, tern: 3, crab: 1 } },
      ]),
    },
    py2_tup6: {
      title: 'The Leaderboard',
      desc: `<p>The island games are over! ${c('scores')} is a dict of names and points. Write ${c('top_three(scores)')} that returns a list of the <b>3 names</b> with the <b>most points</b>, best first.</p>
        <pre>top_three({"Ada": 50, "Bo": 80, "Cy": 20, "Di": 65})\n→  ["Bo", "Di", "Ada"]</pre>
        <p>Use ${c('sorted(..., key=..., reverse=True)')} and then slice off the first 3. (If there are fewer than 3 players, return them all.)</p>`,
      starter: `def top_three(scores):\n    names = sorted(scores)   # this sorts by name, not by points!\n    return names\n\nprint(top_three({"Ada": 50, "Bo": 80, "Cy": 20, "Di": 65}))\n`,
      hints: ['key=lambda name: scores[name] tells sorted to compare the points of each name.', 'reverse=True puts the biggest first, and [:3] keeps the first three.'],
      similar: { task: 'Sort words from longest to shortest.', code: `words = ["sea", "island", "bay", "lagoon"]\nprint(sorted(words, key=lambda w: len(w), reverse=True))` },
      gate: 'G',
      ...fnCheck('top_three', [
        { args: [{ Ada: 50, Bo: 80, Cy: 20, Di: 65 }], want: ['Bo', 'Di', 'Ada'] },
        { args: [{ Zed: 5, Kip: 9 }], want: ['Kip', 'Zed'] },
        { args: [{ a: 1, b: 2, c: 3, d: 4, e: 5 }], want: ['e', 'd', 'c'] },
        { args: [{}], want: [] },
      ]),
      require: [[/\bkey\s*=/, 'Tell <code>sorted</code> what to compare with <code>key=...</code>.']],
    },
    py2_tup7: {
      title: 'The Treasure Split',
      desc: `<p>The treasure has been counted! ${c('loot')} is a list of <b>(name, gold)</b> pairs, one pair per find (it changes for each test). A pirate can appear many times.</p>
        <p>Add up each pirate's gold, then print a ranking, <b>most gold first</b>:</p>
        <pre>loot = [("Ada", 5), ("Bo", 9), ("Ada", 7)]\n# prints:\n1. Ada: 12\n2. Bo: 9</pre>
        <p>You'll need almost everything from this island: unpacking, a dict with ${c('.get')}, ${c('sorted')} with a ${c('key')}, and ${c('enumerate')}.</p>`,
      starter: `# loot is given to you (it changes for each test)\ntotals = {}\nfor pair in loot:\n    print(pair)\n\n# then rank the pirates by their total gold\n`,
      hints: ['for name, gold in loot unpacks each pair. totals.get(name, 0) + gold is the new total.', 'sorted(totals.items(), key=lambda kv: kv[1], reverse=True) gives (name, total) pairs, richest first. enumerate(..., start=1) numbers them.'],
      similar: { task: 'Add up rainfall per island and print the wettest first.', code: `rain = [("Palm", 3), ("Rocky", 8), ("Palm", 6)]\ntotal = {}\nfor island, mm in rain:\n    total[island] = total.get(island, 0) + mm\nfor island, mm in sorted(total.items(), key=lambda kv: kv[1], reverse=True):\n    print(island, mm)` },
      gate: 'H',
      ...outCheck([
        { label: 'loot = [("Ada", 5), ("Bo", 9), ("Ada", 7)]', globals: { loot: [['Ada', 5], ['Bo', 9], ['Ada', 7]] }, expect: ['1. Ada: 12', '2. Bo: 9'] },
        { label: 'loot = [("Kip", 3), ("Mo", 20), ("Lu", 4), ("Kip", 30), ("Lu", 1)]', globals: { loot: [['Kip', 3], ['Mo', 20], ['Lu', 4], ['Kip', 30], ['Lu', 1]] }, expect: ['1. Kip: 33', '2. Mo: 20', '3. Lu: 5'] },
        { label: 'loot = [("Pip", 1)]', globals: { loot: [['Pip', 1]] }, expect: ['1. Pip: 1'] },
      ], 'Every pirate gets a fair share, and the ranking is spotless. <b>The atoll is yours!</b>'),
    },

    // ================================================= 4. Stormy Reef (exceptions)
    py2_exc1: {
      title: 'The Safe Number',
      desc: `<p>Sailors shout numbers at the dock, but sometimes they shout nonsense. ${c('int("abc")')} crashes with a ${c('ValueError')}.</p>
        <p>Write ${c('to_number(text)')} that returns ${c('int(text)')}, or ${c('0')} if the text isn't a whole number. Use ${c('try')} / ${c('except ValueError')}.</p>
        <pre>to_number("42")   →  42\nto_number("abc")  →  0</pre>`,
      starter: `def to_number(text):\n    return int(text)   # this crashes on bad text!\n\nprint(to_number("42"))\nprint(to_number("abc"))\n`,
      hints: ['Put the risky line inside try: and the plan B inside except ValueError:', 'Both the try part and the except part need their own return.'],
      similar: { task: 'Turn text into a float, or return -1 if it fails.', code: `def to_float(text):\n    try:\n        return float(text)\n    except ValueError:\n        return -1\n\nprint(to_float("2.5"), to_float("wave"))` },
      gate: 'A',
      ...fnCheck('to_number', [
        { args: ['42'], want: 42 },
        { args: ['abc'], want: 0 },
        { args: ['-7'], want: -7 },
        { args: ['3.5'], want: 0 },
        { args: [''], want: 0 },
      ]),
      require: [[/\btry\s*:/, 'Use a <code>try:</code> block around the risky code.'], [/\bexcept\b/, 'Add an <code>except ValueError:</code> block.']],
    },
    py2_exc2: {
      title: 'The Divider Buoy',
      desc: `<p>The buoy splits supplies between boats. Write ${c('safe_divide(a, b)')} that returns ${c('a / b')}, but returns ${c('None')} when ${c('b')} is zero.</p>
        <pre>safe_divide(10, 4)  →  2.5\nsafe_divide(9, 2)   →  4.5\nsafe_divide(1, 0)   →  None</pre>
        <p>Don't check with ${c('if')} this time: <b>try</b> the division and catch exactly the error it raises, ${c('ZeroDivisionError')}.</p>`,
      starter: `def safe_divide(a, b):\n    return a / b\n\nprint(safe_divide(10, 2))\nprint(safe_divide(1, 0))\n`,
      hints: ['Run the starter to see the exact name of the error you need to catch.', 'except ZeroDivisionError: then return None.'],
      similar: { task: 'Return the first item of a list, or None if the list is empty.', code: `def first(items):\n    try:\n        return items[0]\n    except IndexError:\n        return None\n\nprint(first([4, 5]), first([]))` },
      gate: 'B',
      ...fnCheck('safe_divide', [
        { args: [10, 2], want: 5 },
        { args: [7, 2], want: 3.5 },
        { args: [1, 0], want: null },
        { args: [0, 5], want: 0 },
      ]),
      require: [[/\bexcept\s+ZeroDivisionError\b/, 'Catch the exact error: <code>except ZeroDivisionError:</code>.']],
    },
    py2_exc3: {
      title: 'The Two Storms',
      desc: `<p>The quartermaster picks items from a list by position, but people type the position as text. Two things can go wrong:</p>
        <ul><li>the text isn't a number: ${c('int("x")')} raises ${c('ValueError')}, so return ${c('"not a number"')}</li>
        <li>the number is too big: ${c('items[7]')} raises ${c('IndexError')}, so return ${c('"no such item"')}</li></ul>
        <p>Write ${c('pick(items, position)')}. Otherwise return ${c('items[int(position)]')}.</p>
        <pre>pick(["rope", "map", "lamp"], "1")  →  "map"\npick(["rope", "map", "lamp"], "x")  →  "not a number"\npick(["rope", "map", "lamp"], "7")  →  "no such item"</pre>`,
      starter: `def pick(items, position):\n    try:\n        return items[int(position)]\n    except ValueError:\n        return "not a number"\n\nprint(pick(["rope", "map", "lamp"], "7"))\n`,
      hints: ['One try can have several except blocks, one for each kind of error.', 'Add a second block: except IndexError:'],
      similar: { task: 'Look up a price, handling a missing item and a bad quantity.', code: `prices = {"rope": 4}\ndef cost(item, qty):\n    try:\n        return prices[item] * int(qty)\n    except KeyError:\n        return "we don't sell that"\n    except ValueError:\n        return "bad quantity"\n\nprint(cost("rope", "3"), cost("gold", "1"), cost("rope", "lots"))` },
      gate: 'C',
      ...fnCheck('pick', [
        { args: [['rope', 'map', 'lamp'], '1'], want: 'map' },
        { args: [['rope', 'map', 'lamp'], 'x'], want: 'not a number' },
        { args: [['rope', 'map', 'lamp'], '7'], want: 'no such item' },
        { args: [['rope', 'map', 'lamp'], '-1'], want: 'lamp' },
        { args: [[], '0'], want: 'no such item' },
      ]),
      require: [[/\bexcept\s+IndexError\b/, 'Catch the second kind of error with <code>except IndexError:</code>.']],
    },
    py2_exc4: {
      title: 'The Lighthouse Log',
      desc: `<p>The lighthouse sensor sends a list of ${c('readings')} as text (it changes for each test). Some are broken. For each reading:</p>
        <ul><li><b>try</b> to turn it into a number with ${c('int(r)')},</li>
        <li><b>except</b> ${c('ValueError')}: print ${c('Bad reading: ...')}</li>
        <li><b>else</b> (it worked): print ${c('Reading ... ok')} and add it to ${c('total')}</li>
        <li><b>finally</b> (always): add 1 to ${c('checked')}</li></ul>
        <p>After the loop print ${c('Checked 3, total 12')} (with the real numbers).</p>
        <pre>readings = ["5", "storm", "7"]\n# prints:\nReading 5 ok\nBad reading: storm\nReading 7 ok\nChecked 3, total 12</pre>`,
      starter: `# readings is given to you (it changes for each test)\nchecked = 0\ntotal = 0\nfor r in readings:\n    n = int(r)\n    print(f"Reading {n} ok")\n    total += n\n    checked += 1\nprint(f"Checked {checked}, total {total}")\n`,
      hints: ['The order is: try, except, else, finally. Each has its own colon and indented block.', 'Only the int(r) line needs to be inside try. The printing and adding go in else; checked += 1 goes in finally.'],
      similar: { task: 'Open every crate: count the empty ones and the full ones.', code: `crates = [["fish"], [], ["rum", "map"]]\nopened = 0\nfor crate in crates:\n    try:\n        first = crate[0]\n    except IndexError:\n        print("empty crate")\n    else:\n        print("found", first)\n    finally:\n        opened += 1\nprint("opened", opened)` },
      gate: 'D',
      ...outCheck([
        { label: 'readings = ["5", "storm", "7"]', globals: { readings: ['5', 'storm', '7'] }, expect: ['Reading 5 ok', 'Bad reading: storm', 'Reading 7 ok', 'Checked 3, total 12'] },
        { label: 'readings = ["x", "?"]', globals: { readings: ['x', '?'] }, expect: ['Bad reading: x', 'Bad reading: ?', 'Checked 2, total 0'] },
        { label: 'readings = ["10", "-4", "3.5", "20"]', globals: { readings: ['10', '-4', '3.5', '20'] }, expect: ['Reading 10 ok', 'Reading -4 ok', 'Bad reading: 3.5', 'Reading 20 ok', 'Checked 4, total 26'] },
      ]),
      require: [[/\belse\s*:/, 'Use an <code>else:</code> block after the <code>except</code> for the code that runs when nothing went wrong.'], [/\bfinally\s*:/, 'Use a <code>finally:</code> block for the code that must <b>always</b> run.']],
    },
    py2_exc5: {
      title: 'The Harbour Rule',
      desc: `<p>Now <b>you</b> raise the alarm. Write ${c('set_sail(crew)')}:</p>
        <ul><li>if ${c('crew')} is less than 3, <b>raise</b> a ${c('ValueError')} with the message ${c('"A ship needs at least 3 crew"')}</li>
        <li>otherwise return ${c('"Setting sail with 5 crew!"')} (with the real number)</li></ul>
        <pre>set_sail(5)  →  "Setting sail with 5 crew!"\nset_sail(2)  →  ValueError: A ship needs at least 3 crew</pre>`,
      starter: `def set_sail(crew):\n    if crew < 3:\n        return "not enough crew"   # raise an error instead!\n    return f"Setting sail with {crew} crew!"\n\nprint(set_sail(5))\n`,
      hints: ['raise works like return, but it sends an error up instead of a value.', 'raise ValueError("...") with the exact message from the task.'],
      similar: { task: 'Refuse to load a negative number of barrels.', code: `def load(barrels):\n    if barrels < 0:\n        raise ValueError("barrels can't be negative")\n    return f"Loaded {barrels}"\n\ntry:\n    print(load(4))\n    print(load(-1))\nexcept ValueError as e:\n    print("Refused:", e)` },
      gate: 'E',
      ...fnCheck('set_sail', [
        { args: [5], want: 'Setting sail with 5 crew!' },
        { args: [2], raises: 'ValueError', message: 'A ship needs at least 3 crew' },
        { args: [3], want: 'Setting sail with 3 crew!' },
        { args: [0], raises: 'ValueError', message: 'A ship needs at least 3 crew' },
      ]),
      require: [[/\braise\b/, 'Use <code>raise ValueError("...")</code> to raise the error.']],
    },
    py2_exc6: {
      title: 'The Storm Warning',
      desc: `<p>A ${c('ValueError')} is too vague for a storm. Make your <b>own</b> kind of error!</p>
        <ul><li>Make a class ${c('StormWarning')} that inherits from ${c('Exception')}.</li>
        <li>Write ${c('check_wind(speed)')}: if ${c('speed')} is over 50, raise ${c('StormWarning')} with the message ${c('"Wind 80 is too strong!"')} (with the real speed). Otherwise return ${c('"Calm seas"')}.</li></ul>
        <pre>check_wind(20)  →  "Calm seas"\ncheck_wind(80)  →  StormWarning: Wind 80 is too strong!</pre>`,
      starter: `# 1. Make the StormWarning class here\n\n\ndef check_wind(speed):\n    if speed > 50:\n        pass   # 2. raise a StormWarning\n    return "Calm seas"\n\nprint(check_wind(20))\n`,
      hints: ['class StormWarning(Exception): with just pass inside is a complete custom error.', 'Raise it like any other error: raise StormWarning(f"...")'],
      similar: { task: 'A custom error for a leaking hull.', code: `class LeakError(Exception):\n    pass\n\ndef check_hull(holes):\n    if holes > 0:\n        raise LeakError(f"{holes} holes found")\n    return "Hull OK"\n\ntry:\n    check_hull(2)\nexcept LeakError as e:\n    print("Leak!", e)` },
      gate: 'G',
      ...fnCheck('check_wind', [
        { args: [20], want: 'Calm seas' },
        { args: [80], raises: 'StormWarning', message: 'Wind 80 is too strong!' },
        { args: [50], want: 'Calm seas' },
        { args: [51], raises: 'StormWarning', message: 'Wind 51 is too strong!' },
      ]),
      require: [[/class\s+StormWarning\s*\(\s*Exception\s*\)/, 'Define the class with <code>class StormWarning(Exception):</code>.']],
    },
    py2_exc7: {
      title: 'The Reef Bank',
      desc: `<p>The reef bank starts with a ${c('balance')} of <b>100</b> gold. ${c('requests')} is a list of amounts people want to take out (it changes for each test).</p>
        <p>Finish the program:</p>
        <ul><li>${c('NotEnoughGold')} is a custom error. Its message should be ${c('"missing 20 gold"')} (with the real amount missing), and it keeps the number in ${c('self.missing')}.</li>
        <li>${c('withdraw(balance, amount)')} raises ${c('ValueError("amount must be positive")')} if the amount is 0 or less, raises ${c('NotEnoughGold')} if it's more than the balance, and otherwise returns the new balance.</li>
        <li>For each request print one of: ${c('Paid 30, left 70')}, ${c('Denied: missing 20 gold')} or ${c('Invalid: amount must be positive')}.</li>
        <li>At the end print ${c('Final balance: 70')}.</li></ul>`,
      starter: `class NotEnoughGold(Exception):\n    def __init__(self, missing):\n        # call super().__init__ with the message, and keep missing\n        pass\n\ndef withdraw(balance, amount):\n    # raise ValueError or NotEnoughGold when needed\n    return balance - amount\n\n# requests is given to you (it changes for each test)\nbalance = 100\nfor amount in requests:\n    balance = withdraw(balance, amount)\n    print(f"Paid {amount}, left {balance}")\nprint(f"Final balance: {balance}")\n`,
      hints: ['In __init__: super().__init__(f"missing {missing} gold") sets the message, then self.missing = missing.', 'In the loop: try the withdraw, then except NotEnoughGold as e: and except ValueError as e: print the right line, and else: prints the "Paid" line.'],
      similar: { task: 'A ticket booth that sells seats and refuses bad orders.', code: `class SoldOut(Exception):\n    pass\n\nseats = 3\nfor wanted in [2, 0, 5]:\n    try:\n        if wanted <= 0:\n            raise ValueError("pick at least 1 seat")\n        if wanted > seats:\n            raise SoldOut(f"only {seats} left")\n        seats -= wanted\n    except SoldOut as e:\n        print("Sorry:", e)\n    except ValueError as e:\n        print("Oops:", e)\n    else:\n        print("Sold", wanted)\nprint("Seats left:", seats)` },
      gate: 'H',
      ...outCheck([
        { label: 'requests = [30, 90, 0, 70]', globals: { requests: [30, 90, 0, 70] }, expect: ['Paid 30, left 70', 'Denied: missing 20 gold', 'Invalid: amount must be positive', 'Paid 70, left 0', 'Final balance: 0'] },
        { label: 'requests = [-5, 100]', globals: { requests: [-5, 100] }, expect: ['Invalid: amount must be positive', 'Paid 100, left 0', 'Final balance: 0'] },
        { label: 'requests = [150, 25, 25]', globals: { requests: [150, 25, 25] }, expect: ['Denied: missing 50 gold', 'Paid 25, left 75', 'Paid 25, left 50', 'Final balance: 50'] },
      ], 'The bank survives every storm of bad requests. <b>The reef is calm!</b>'),
      require: [[/\braise\s+NotEnoughGold\b/, 'Inside <code>withdraw</code>, <code>raise NotEnoughGold(...)</code> when the amount is too big.'], [/\bexcept\s+NotEnoughGold\b/, 'Catch it in the loop with <code>except NotEnoughGold as e:</code>.'], [/super\(\)\.__init__/, 'In <code>NotEnoughGold.__init__</code>, call <code>super().__init__(...)</code> with the message.']],
    },

    // ================================================= 5. Heritage Harbour (inheritance)
    py2_inh1: {
      title: 'The Heir\'s Tugboat',
      desc: `<p>A ${c('Ship')} class is already built. Make a class ${c('Tugboat')} that <b>inherits</b> from it, so a tugboat gets ${c('__init__')} and ${c('horn()')} for free.</p>
        <p>Give ${c('Tugboat')} one new method, ${c('push()')}, that returns ${c('"Tuggy pushes the big ships"')} (using its own name).</p>
        <pre>Tuggy goes TOOT!\nTuggy pushes the big ships</pre>`,
      starter: `class Ship:\n    def __init__(self, name):\n        self.name = name\n\n    def horn(self):\n        return f"{self.name} goes TOOT!"\n\n# Make class Tugboat here (it inherits from Ship)\n\n\ntug = Tugboat("Tuggy")\nprint(tug.horn())\nprint(tug.push())\n`,
      hints: ['Put the parent class in brackets: class Tugboat(Ship):', 'Tugboat doesn\'t need its own __init__: it uses the one from Ship. Just add def push(self):'],
      similar: { task: 'A Puppy that inherits from Dog and adds a new trick.', code: `class Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        return "Woof"\n\nclass Puppy(Dog):\n    def roll(self):\n        return f"{self.name} rolls over"\n\np = Puppy("Bit")\nprint(p.bark())\nprint(p.roll())` },
      gate: 'A',
      ...outCheck([{ expect: ['Tuggy goes TOOT!', 'Tuggy pushes the big ships'] }]),
      require: [[/class\s+Tugboat\s*\(\s*Ship\s*\)/, 'Make Tugboat inherit from Ship: <code>class Tugboat(Ship):</code>.'], [/self\.name/, 'Use <code>self.name</code> in <code>push()</code> so every tugboat says its own name.']],
    },
    py2_inh2: {
      title: 'The Parrot\'s Voice',
      desc: `<p>Every ${c('Bird')} can introduce itself with ${c('intro()')}, which uses ${c('speak()')}. A plain bird just says ${c('"..."')}.</p>
        <p>Make ${c('Parrot')} <b>override</b> ${c('speak()')} so it returns ${c('"Pieces of eight!"')}. Don't change ${c('Bird')}!</p>
        <pre>Gull says ...\nPip says Pieces of eight!</pre>`,
      starter: `class Bird:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return "..."\n\n    def intro(self):\n        return f"{self.name} says {self.speak()}"\n\nclass Parrot(Bird):\n    pass   # override speak here\n\nfor bird in [Bird("Gull"), Parrot("Pip")]:\n    print(bird.intro())\n`,
      hints: ['Overriding means writing a method with the same name in the child class.', 'Inside Parrot: def speak(self): and return the parrot\'s words. intro() will find the new speak by itself.'],
      similar: { task: 'A Cat that overrides the sound of an Animal.', code: `class Animal:\n    def sound(self):\n        return "hmm"\n    def talk(self):\n        return "It goes " + self.sound()\n\nclass Cat(Animal):\n    def sound(self):\n        return "meow"\n\nprint(Animal().talk())\nprint(Cat().talk())` },
      gate: 'B',
      ...outCheck([{ expect: ['Gull says ...', 'Pip says Pieces of eight!'] }]),
      require: [[/class\s+Bird\b[\s\S]*return\s+"\.\.\."[\s\S]*class\s+Parrot\s*\(\s*Bird\s*\)[\s\S]*def\s+speak\s*\(/, 'Keep <code>Bird</code> as it is, and add <code>def speak(self):</code> inside <code>Parrot</code>.']],
    },
    py2_inh3: {
      title: 'The Captain\'s Hat',
      desc: `<p>A ${c('Captain')} is a ${c('Sailor')} with a ship. The captain's ${c('__init__')} takes a name <b>and</b> a ship. It must call ${c('super().__init__(name)')} so the ${c('Sailor')} part gets set up too, then store the ship.</p>
        <pre>Ahoy, I'm Ada\nCaptain Ada of the Kraken: hoist the sails!</pre>`,
      starter: `class Sailor:\n    def __init__(self, name):\n        self.name = name\n\n    def greet(self):\n        return f"Ahoy, I'm {self.name}"\n\nclass Captain(Sailor):\n    def __init__(self, name, ship):\n        self.ship = ship   # the Sailor part never gets its name!\n\n    def order(self):\n        return f"Captain {self.name} of the {self.ship}: hoist the sails!"\n\ncap = Captain("Ada", "Kraken")\nprint(cap.greet())\nprint(cap.order())\n`,
      hints: ['super() means "the parent class". super().__init__(name) runs Sailor\'s __init__.', 'Call it as the first line inside Captain\'s __init__, then set self.ship.'],
      similar: { task: 'A Chef who is a Worker with a favourite dish.', code: `class Worker:\n    def __init__(self, name):\n        self.name = name\n\nclass Chef(Worker):\n    def __init__(self, name, dish):\n        super().__init__(name)\n        self.dish = dish\n\nc = Chef("Mo", "fish soup")\nprint(c.name, "cooks", c.dish)` },
      gate: 'C',
      ...outCheck([{ expect: ["Ahoy, I'm Ada", 'Captain Ada of the Kraken: hoist the sails!'] }]),
      require: [[/super\(\)\.__init__\s*\(\s*name\s*\)/, 'Call <code>super().__init__(name)</code> inside <code>Captain.__init__</code>.']],
    },
    py2_inh4: {
      title: 'The Island Atlas',
      desc: `<p>Printing an object shows something ugly like ${c('&lt;Island object&gt;')}. Give ${c('Island')} a ${c('__str__')} method so that printing it shows:</p>
        <pre>Tortuga (population 120)</pre>
        <p>The program then prints the whole atlas:</p>
        <pre>Tortuga (population 120)\n- Tortuga (population 120)\n- Palm Key (population 8)\n- Rocky (population 0)</pre>`,
      starter: `class Island:\n    def __init__(self, name, population):\n        self.name = name\n        self.population = population\n\n    # add __str__ here\n\n\nprint(Island("Tortuga", 120))\natlas = [Island("Tortuga", 120), Island("Palm Key", 8), Island("Rocky", 0)]\nfor isle in atlas:\n    print(f"- {isle}")\n`,
      hints: ['def __str__(self): has two underscores on each side, and only takes self.', '__str__ must return a string (not print it). An f-string with self.name and self.population is perfect.'],
      similar: { task: 'A Coin that prints as "5 gold".', code: `class Coin:\n    def __init__(self, value):\n        self.value = value\n    def __str__(self):\n        return f"{self.value} gold"\n\nprint(Coin(5))\nprint(f"I found {Coin(9)}!")` },
      gate: 'D',
      ...outCheck([{ expect: ['Tortuga (population 120)', '- Tortuga (population 120)', '- Palm Key (population 8)', '- Rocky (population 0)'] }]),
      require: [[/def\s+__str__\s*\(\s*self\s*\)/, 'Add a <code>def __str__(self):</code> method to Island.']],
    },
    py2_inh5: {
      title: 'The Royal Echo',
      desc: `<p>A ${c('PirateKing')} greets like a normal ${c('Pirate')}, then adds a royal boast. Override ${c('greet()')} in ${c('PirateKing')} so it returns the <b>parent's greeting</b> plus ${c('" and I rule these seas!"')}.</p>
        <p>Call the parent's version with ${c('super().greet()')} instead of copying its text.</p>
        <pre>Ahoy, I'm Bo\nAhoy, I'm Zara and I rule these seas!</pre>`,
      starter: `class Pirate:\n    def __init__(self, name):\n        self.name = name\n\n    def greet(self):\n        return f"Ahoy, I'm {self.name}"\n\nclass PirateKing(Pirate):\n    def greet(self):\n        return "I rule these seas!"\n\nprint(Pirate("Bo").greet())\nprint(PirateKing("Zara").greet())\n`,
      hints: ['super().greet() gives you exactly what Pirate.greet would return.', 'Glue it together with + and the extra text (mind the space at the start).'],
      similar: { task: 'A LoudBell that rings twice as loud as a Bell.', code: `class Bell:\n    def ring(self):\n        return "ding"\n\nclass LoudBell(Bell):\n    def ring(self):\n        return super().ring().upper() + "!!"\n\nprint(Bell().ring(), LoudBell().ring())` },
      gate: 'E',
      ...outCheck([{ expect: ["Ahoy, I'm Bo", "Ahoy, I'm Zara and I rule these seas!"] }]),
      require: [[/super\(\)\.greet\s*\(\s*\)/, 'Use <code>super().greet()</code> to reuse the Pirate greeting.']],
    },
    py2_inh6: {
      title: 'The Harbour Inspector',
      desc: `<p>The inspector checks everything floating in the harbour. ${c('isinstance(thing, Boat)')} is ${c('True')} for a ${c('Boat')} <b>and</b> for anything that inherits from it.</p>
        <p>Count how many things are boats of any kind, and how many are sailboats. A ${c('Raft')} is not a boat! Print:</p>
        <pre>Boats: 4\nSailboats: 2</pre>`,
      starter: `class Boat:\n    def __init__(self, name):\n        self.name = name\n\nclass Sailboat(Boat):\n    pass\n\nclass Steamboat(Boat):\n    pass\n\nclass Raft:   # not a Boat!\n    def __init__(self, name):\n        self.name = name\n\nharbour = [Sailboat("Breeze"), Raft("Logs"), Steamboat("Chugger"), Sailboat("Gust"), Boat("Dinghy")]\n\nboats = len(harbour)   # this counts the raft too!\nsailboats = 0\nprint("Boats:", boats)\nprint("Sailboats:", sailboats)\n`,
      hints: ['Loop over harbour and use isinstance(thing, Boat) in an if.', 'A comprehension works too: len([t for t in harbour if isinstance(t, Sailboat)])'],
      similar: { task: 'Count the numbers and the words in a mixed list.', code: `stuff = [3, "sea", 7, "sky", 1.5]\nnumbers = len([x for x in stuff if isinstance(x, (int, float))])\nwords = len([x for x in stuff if isinstance(x, str)])\nprint(numbers, words)` },
      gate: 'G',
      ...outCheck([{ expect: ['Boats: 4', 'Sailboats: 2'] }]),
      require: [[/\bisinstance\s*\(/, 'Use <code>isinstance(thing, Boat)</code> to check each thing.']],
    },
    py2_inh7: {
      title: 'The Grand Regatta',
      desc: `<p>The great race of the Isles! ${c('entries')} is a list of <b>(name, kind, time)</b> entries (it changes for each test), like ${c('("Kraken", "steam", 38.25)')}. Kind is ${c('"sail"')} or ${c('"steam"')}.</p>
        <ol><li>Finish the classes. ${c('Boat.__init__')} raises ${c('InvalidTime')} with the message ${c('"Nautilus has an impossible time"')} if the time is 0 or less. ${c('Sailboat')} and ${c('Steamboat')} override ${c('kind()')}.</li>
        <li>${c('__str__')} shows the name left-aligned in 10, the kind left-aligned in 6, and the time right-aligned in 6 with 2 decimals: ${cs('Kraken    steam  38.25')}</li>
        <li>Build the fleet. For an impossible time print ${c('Disqualified: Nautilus has an impossible time')}.</li>
        <li>Print the fleet <b>fastest first</b> (smallest time), numbered from 1: ${cs('1. Kraken    steam  38.25')}</li>
        <li>Last line: ${c('Sailboats: Albatross, Mermaid')} (names of the sailboats, in race order, joined with a comma and a space).</li></ol>`,
      starter: `class InvalidTime(Exception):\n    pass\n\nclass Boat:\n    def __init__(self, name, time):\n        # raise InvalidTime if time is 0 or less\n        self.name = name\n        self.time = time\n\n    def kind(self):\n        return "boat"\n\n    def __str__(self):\n        return f"{self.name} {self.kind()} {self.time}"   # fix the widths\n\nclass Sailboat(Boat):\n    pass   # kind() should return "sail"\n\nclass Steamboat(Boat):\n    pass   # kind() should return "steam"\n\n# entries is given to you (it changes for each test)\nfleet = []\nfor name, kind, time in entries:\n    if kind == "sail":\n        fleet.append(Sailboat(name, time))\n    else:\n        fleet.append(Steamboat(name, time))\n\nfor boat in fleet:\n    print(boat)\n`,
      hints: ['Wrap the two fleet.append lines in try: and catch except InvalidTime as e: to print the Disqualified line.', 'sorted(fleet, key=lambda b: b.time) puts the fastest first; enumerate(..., start=1) numbers them; a comprehension with isinstance(b, Sailboat) finds the sailboat names for ", ".join(...).'],
      similar: { task: 'Rank animals in a race, skipping ones with a bad speed.', code: `class BadSpeed(Exception):\n    pass\n\nclass Runner:\n    def __init__(self, name, speed):\n        if speed <= 0:\n            raise BadSpeed(f"{name} can't run")\n        self.name = name\n        self.speed = speed\n    def __str__(self):\n        return f"{self.name:<6}{self.speed:>5.1f}"\n\nclass Crab(Runner):\n    pass\n\nteam = []\nfor name, speed in [("Kip", 3.5), ("Mo", 0), ("Lu", 9)]:\n    try:\n        team.append(Crab(name, speed))\n    except BadSpeed as e:\n        print("Out:", e)\nfor i, r in enumerate(sorted(team, key=lambda r: -r.speed), start=1):\n    print(f"{i}. {r}")` },
      gate: 'H',
      ...outCheck([
        { label: 'four boats, one with a bad time', globals: { entries: [['Albatross', 'sail', 41.5], ['Kraken', 'steam', 38.25], ['Nautilus', 'steam', -1], ['Mermaid', 'sail', 44]] },
          expect: ['Disqualified: Nautilus has an impossible time', '1. Kraken    steam  38.25', '2. Albatross sail   41.50', '3. Mermaid   sail   44.00', 'Sailboats: Albatross, Mermaid'] },
        { label: 'three fast boats', globals: { entries: [['Gust', 'sail', 9.876], ['Chugger', 'steam', 12], ['Breeze', 'sail', 7.5]] },
          expect: ['1. Breeze    sail    7.50', '2. Gust      sail    9.88', '3. Chugger   steam  12.00', 'Sailboats: Breeze, Gust'] },
        { label: 'steam only, two disqualified', globals: { entries: [['Smoky', 'steam', 0], ['Puffer', 'steam', 20.1], ['Ghost', 'sail', -3]] },
          expect: ['Disqualified: Smoky has an impossible time', 'Disqualified: Ghost has an impossible time', '1. Puffer    steam  20.10', 'Sailboats:'] },
      ], 'The crowd roars! Classes, errors, sorting and formatting all working together. <b>The Pythonic Isles are saved!</b>'),
      require: [[/\braise\s+InvalidTime\b/, 'Raise <code>InvalidTime</code> in <code>Boat.__init__</code> when the time is 0 or less.'], [/\bexcept\s+InvalidTime\b/, 'Catch the error while building the fleet with <code>except InvalidTime as e:</code>.'], [/\bisinstance\s*\(/, 'Use <code>isinstance(boat, Sailboat)</code> to find the sailboats.']],
    },
  };

  // ------------------------------------------------------------ levels
  const levels = [
    {
      id: 'py2_comp', name: 'Comprehension Cove', topic: 'Comprehensions',
      blurb: 'Build whole lists, dicts and sets in a single line, with filters and choices.',
      intro: `<p>With Segfault defeated, a message in a bottle washes up at your feet: <i>"The Pythonic Isles are drowning in the <b>Boilerplate Fog</b>. Our code grows long and clumsy. Please help!"</i></p>
        <p>You sail out and meet <b>Pip</b>, a parrot who speaks fluent Python. "Squawk! The fog feeds on long, clunky code. Every time you write something short and <b>Pythonic</b>, it clears a little."</p>
        <p>Your first stop is Comprehension Cove, where islanders build a whole list in one line:</p>
        <pre>squares = [n * n for n in range(5)]\nprint(squares)   # [0, 1, 4, 9, 16]</pre>`,
      tutorial: [
        { title: 'A list in one line',
          body: '<p>In Chapter 1 you built new lists with a loop and <code>.append()</code>. A <b>list comprehension</b> does the same thing in a single line.</p><p>Both halves of this example make exactly the same list. Run it and compare.</p>',
          code: `nums = [1, 2, 3, 4]\n\n# the long way\ndoubled = []\nfor n in nums:\n    doubled.append(n * 2)\nprint(doubled)\n\n# the Pythonic way\ndoubled = [n * 2 for n in nums]\nprint(doubled)` },
        { title: 'Reading a comprehension',
          body: '<p>Read it from the middle: <b>"for each word in words, give me word.upper()"</b>.</p><pre>[ word.upper()   for word in words ]\n  what to keep    where it comes from</pre><p>The front part can be any expression: maths, a method call, even a function you wrote.</p>',
          code: `words = ["sea", "sand", "sun"]\nprint([word.upper() for word in words])\nprint([len(word) for word in words])\nprint([word + "!" for word in words])` },
        { title: 'Filtering with if',
          body: '<p>Add an <code>if</code> at the <b>end</b> to keep only some items. Items that fail the test are simply left out.</p>',
          code: `nums = [5, 12, 8, 21, 3]\nbig = [n for n in nums if n > 6]\nprint(big)\nevens = [n * 10 for n in nums if n % 2 == 0]\nprint(evens)` },
        { title: 'Choosing with if / else',
          body: '<p>To turn <b>every</b> item into one of two things, put <code>A if test else B</code> at the <b>front</b>.</p><ul><li><code>if</code> at the end = <b>filter</b> (fewer items)</li><li><code>if ... else</code> at the front = <b>choose</b> (same number of items)</li></ul>',
          code: `nums = [3, 8, 1, 6]\nlabels = ["big" if n > 4 else "small" for n in nums]\nprint(labels)` },
        { title: 'Dict comprehensions',
          body: '<p>Curly brackets and a <code>key: value</code> pair make a <b>dict</b>. To loop over an existing dict, <code>.items()</code> gives you each key <b>and</b> value at once.</p>',
          code: `names = ["Ada", "Bo", "Cyrus"]\nprint({name: len(name) for name in names})\n\nprices = {"rope": 4, "lamp": 15, "map": 9}\ncheap = {item: price for item, price in prices.items() if price < 10}\nprint(cheap)` },
        { title: 'Set comprehensions',
          body: '<p>Curly brackets <b>without</b> a colon make a <b>set</b>: a collection where every value appears only once. Duplicates vanish!</p><p>Sets have no fixed order, so use <code>sorted(...)</code> when you want a tidy, ordered list.</p>',
          code: `words = ["sea", "sky", "island", "bay", "sun"]\nsizes = {len(w) for w in words}\nprint(len(sizes), "different lengths")\nprint(sorted(sizes))` },
      ],
      signs: ['Pip: "Squawk! Each terminal here wants a comprehension: square brackets with a for inside."', 'Pip: "Curly brackets with key: value make a dict. Curly brackets without a colon make a set!"', 'The fog thins. Next stop: the Slice Shoals.'],
      terminals: ['py2_comp1', 'py2_comp2', 'py2_comp3', 'py2_comp4', 'py2_comp5', 'py2_comp6'],
      map: (B) => {
        const m = B.MapBuilder(134, 17);
        m.fill(0, 15, 133, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'wall', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'climb', 'B');
        x = B.TR.mover(m, x + 6);
        x = B.room(m, x + 1, 3, 'bridge', 'C');
        m.put(x + 1, 14, 'K'); m.put(x + 3, 14, '?');
        x = B.room(m, x + 5, 4, 'spring', 'D');
        x = B.TR.pit(m, x + 1);
        x = B.room(m, x + 1, 5, 'spikes', 'E');
        m.put(x + 2, 14, 'e');
        x = B.room(m, x + 4, 6, 'lava', 'G');
        m.put(x + 1, 14, '?'); m.put(x + 5, 14, 'F');
        return m;
      },
    },
    {
      id: 'py2_slice', name: 'Slice Shoals', topic: 'Slicing & f-strings',
      blurb: 'Cut strings and lists into pieces with slices, and line up text neatly with f-strings.',
      intro: `<p>The Slice Shoals are a maze of sandbanks. The locals cut paths through them with <b>slices</b>, and they write their signs with beautifully lined-up <b>f-strings</b>.</p>
        <p>"Squawk! A slice cuts out a piece," says Pip. "And f-strings can do much more than glue text together. They can round numbers and line things up in columns!"</p>
        <pre>word = "lighthouse"\nprint(word[:5])         # light\nprint(f"{3.14159:.2f}")  # 3.14</pre>`,
      tutorial: [
        { title: 'Cutting a slice',
          body: '<p><code>text[start:stop]</code> cuts out the piece from index <code>start</code> up to, but <b>not including</b>, index <code>stop</code>. Indexes start at 0.</p><p>Slices work on lists too, and they never change the original.</p>',
          code: `word = "lighthouse"\nprint(word[0:5])\nprint(word[5:10])\nnums = [10, 20, 30, 40, 50]\nprint(nums[1:3])` },
        { title: 'Leaving parts out',
          body: '<p>Leave out <code>start</code> to begin at the start, or <code>stop</code> to go to the end. A <b>negative</b> index counts from the end: <code>-1</code> is the last item.</p>',
          code: `word = "lighthouse"\nprint(word[:5])    # the first 5\nprint(word[5:])    # from index 5 on\nprint(word[-1])    # the last letter\nprint(word[-5:])   # the last 5\nprint(word[1:-1])  # all but the first and last` },
        { title: 'Taking steps',
          body: '<p>A third number is the <b>step</b>: <code>[start:stop:step]</code>. A step of 2 takes every second item. A step of <code>-1</code> walks backwards, which reverses!</p>',
          code: `letters = "abcdefgh"\nprint(letters[::2])    # every second letter\nprint(letters[1::2])   # every second, starting at index 1\nprint(letters[::-1])   # reversed\nprint([1, 2, 3, 4, 5, 6][::3])` },
        { title: 'Rounding in f-strings',
          body: '<p>Inside an f-string, a colon after the value starts a <b>format spec</b>. <code>:.2f</code> means "show 2 digits after the decimal point". It rounds for you.</p><p><code>:,</code> adds commas to big numbers, and you can combine them: <code>:,.2f</code>.</p>',
          code: `price = 3.14159\nprint(f"{price:.2f}")\nprint(f"{price:.1f}")\nprint(f"{12:.2f}")\nprint(f"{1234567:,}")\nprint(f"{9876.5:,.2f}")` },
        { title: 'Lining things up',
          body: '<p>A number in the spec is a <b>width</b>. <code>&lt;</code> lines up on the left, <code>&gt;</code> on the right and <code>^</code> in the middle. Put a character before the arrow to fill with it instead of spaces.</p><p><code>:03d</code> pads a whole number with zeros: <code>7</code> becomes <code>007</code>.</p>',
          code: `for ship, crew in [("Kraken", 7), ("Albatross", 120)]:\n    print(f"{ship:<10}|{crew:>5}|")\nprint(f"[{'map':^9}]")\nprint(f"[{'map':*^9}]")\nprint(f"Day {7:03d}")` },
        { title: 'Expressions inside f-strings',
          body: '<p>Anything inside the curly brackets is real Python code: maths, method calls and even slices! Then the spec comes after the colon.</p>',
          code: `place = "Skull Island"\ngold = 1250.5\nprint(f"{place.upper()}")\nprint(f"{place[:5]} has {gold * 2:,.2f} gold")\nprint(f"[{place[:8]:<10}]")` },
      ],
      signs: ['Pip: "Remember: the stop index is NOT included. word[0:3] is three letters!"', 'Pip: "In a format spec the order is: fill, align, width, comma, .precision, type. Like {x:*>10,.2f}"', 'The fog lifts from the shoals. The Treasure Atoll is ahead.'],
      terminals: ['py2_slice1', 'py2_slice2', 'py2_slice3', 'py2_slice4', 'py2_slice5', 'py2_slice6'],
      map: (B) => {
        const m = B.MapBuilder(136, 17);
        m.fill(0, 15, 135, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'climb', 'A');
        x = B.TR.pit(m, x + 1);
        x = B.room(m, x + 1, 2, 'spikes', 'B');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 3, 'bridge', 'C');
        m.put(x + 1, 14, 'K'); m.put(x + 3, 14, '?'); m.put(x + 6, 14, 'e');
        x = B.TR.tower(m, x + 9);
        x = B.room(m, x, 4, 'wall', 'D');
        x = B.TR.mover(m, x + 1);
        x = B.room(m, x + 1, 5, 'spring', 'E');
        m.put(x + 2, 10, 'w');
        x = B.room(m, x + 4, 6, 'lava', 'G');
        m.put(x + 1, 14, '?'); m.put(x + 5, 14, 'F');
        return m;
      },
    },
    {
      id: 'py2_tup', name: 'Treasure Atoll', topic: 'Tuples & Dicts',
      blurb: 'Pack and unpack tuples, count with dicts, walk lists with zip and enumerate, and sort by any key.',
      intro: `<p>Treasure Atoll is where the pirates keep their books. Everything comes in <b>pairs</b>: a name and its gold, an item and its count, a place and its position.</p>
        <p>"Squawk! Pirates love <b>tuples</b>," says Pip. "Pairs you can pack up and unpack in one go. And they count everything with <b>dicts</b>!"</p>
        <pre>name, gold = ("Ada", 12)\nprint(name, "has", gold)</pre>`,
      tutorial: [
        { title: 'Tuples',
          body: '<p>A <b>tuple</b> is like a list with round brackets: <code>(3, 8)</code>. The big difference: a tuple <b>can\'t be changed</b> once made. That makes it a good fit for things that belong together, like a position or a name and score.</p><p>Run this: reading works, but the last line causes an error.</p>',
          code: `point = (3, 8)\nprint(point[0], point[1], len(point))\npoint[0] = 5`, expectError: true },
        { title: 'Unpacking',
          body: '<p><b>Unpacking</b> puts each value of a tuple (or list) into its own variable in one line. It even swaps two variables without a helper!</p><p>A <b>star</b> collects "all the rest" into a list.</p>',
          code: `x, y = (3, 8)\nprint(x, y)\nx, y = y, x\nprint(x, y)\nfirst, *rest = ["Ada", "Bo", "Cy", "Di"]\nprint(first, rest)\n*others, last = [1, 2, 3]\nprint(others, last)` },
        { title: 'zip and enumerate',
          body: '<p><code>enumerate(items)</code> gives you a number <b>and</b> an item each time round the loop. <code>start=1</code> starts counting at 1.</p><p><code>zip(a, b)</code> walks through two lists side by side, giving you pairs.</p>',
          code: `crew = ["Ada", "Bo"]\nfor i, name in enumerate(crew, start=1):\n    print(i, name)\n\nitems = ["rope", "barrel"]\ncounts = [3, 10]\nfor item, n in zip(items, counts):\n    print(item, n)\nprint(list(zip(items, counts)))` },
        { title: '.items() and .get()',
          body: '<p><code>d.items()</code> gives each <b>(key, value)</b> pair of a dict, ready to unpack.</p><p><code>d[key]</code> crashes if the key is missing, but <code>d.get(key, default)</code> calmly gives you the default instead.</p>',
          code: `gold = {"Ada": 12, "Bo": 9}\nfor name, amount in gold.items():\n    print(f"{name} has {amount}")\nprint(gold.get("Ada", 0))\nprint(gold.get("Zed", 0))` },
        { title: 'Counting with a dict',
          body: '<p>A common counting trick: for each thing, store its <b>old count plus one</b>. <code>.get(thing, 0)</code> makes it work even the first time you see something.</p>',
          code: `counts = {}\nfor bird in ["gull", "crab", "gull", "tern", "gull"]:\n    counts[bird] = counts.get(bird, 0) + 1\nprint(counts)` },
        { title: 'Sorting by a key',
          body: '<p><code>sorted(..., key=...)</code> lets you choose <b>what</b> to compare. A <code>lambda</code> is a tiny one-line function: <code>lambda w: len(w)</code> means "given w, use len(w)".</p><p><code>reverse=True</code> puts the biggest first.</p>',
          code: `words = ["sea", "island", "bay", "lagoon"]\nprint(sorted(words, key=lambda w: len(w)))\nscores = {"Ada": 50, "Bo": 80, "Cy": 20}\nprint(sorted(scores, key=lambda name: scores[name], reverse=True))\nprint(sorted(scores.items(), key=lambda pair: pair[1]))` },
      ],
      signs: ['Pip: "Squawk! a, b = pair unpacks a pair. first, *rest = items grabs the first and the rest."', 'Pip: "Counting things? counts.get(thing, 0) + 1. Every pirate knows that one."', 'Pip: "The final terminal needs a bit of everything from this island. You can do it!"'],
      terminals: ['py2_tup1', 'py2_tup2', 'py2_tup3', 'py2_tup4', 'py2_tup5', 'py2_tup6', 'py2_tup7'],
      map: (B) => {
        const m = B.MapBuilder(160, 17);
        m.fill(0, 15, 159, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'wall', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'spring', 'B');
        x = B.TR.mover(m, x + 1);
        x = B.room(m, x + 1, 3, 'climb', 'C');
        m.put(x + 2, 14, 'e');
        x = B.room(m, x + 4, 4, 'spikes', 'D');
        m.put(x + 1, 14, 'K'); m.put(x + 3, 14, '?');
        x = B.TR.pit(m, x + 5);
        x = B.room(m, x + 1, 5, 'lava', 'E');
        x = B.TR.tower(m, x);
        x = B.room(m, x, 6, 'wall', 'G');
        m.put(x + 2, 14, 'e'); m.put(x + 4, 14, '?');
        x = B.room(m, x + 6, 7, 'bridge', 'H');
        m.put(x + 4, 14, 'F');
        return m;
      },
    },
    {
      id: 'py2_exc', name: 'Stormy Reef', topic: 'Exceptions',
      blurb: 'Catch errors with try / except / else / finally, raise your own, and invent custom exception classes.',
      intro: `<p>Thunder rolls over the <b>Stormy Reef</b>. Here, things go wrong all the time: broken sensors, empty crates, impossible orders. Normally an error <b>crashes</b> your whole program.</p>
        <p>"Squawk! Real Pythonistas don't panic," says Pip. "They <b>catch</b> the error and carry on, and they <b>raise</b> their own errors when something is wrong."</p>
        <pre>try:\n    n = int("storm")\nexcept ValueError:\n    print("That's not a number!")</pre>`,
      tutorial: [
        { title: 'Errors stop everything',
          body: '<p>When Python hits a problem it <b>raises an exception</b>: an error with a <b>type</b> (like <code>ValueError</code>) and a message. If nobody catches it, the program stops right there.</p><p>Run this. The first line prints, then the program crashes and the last line never runs.</p>',
          code: `print("Reading the sensor...")\nlevel = int("storm")\nprint("This line never runs")`, expectError: true },
        { title: 'try and except',
          body: '<p>Put risky code inside <code>try:</code>. If an exception happens, Python jumps straight to the matching <code>except</code> block instead of crashing, and then carries on after it.</p>',
          code: `for text in ["42", "storm", "7"]:\n    try:\n        n = int(text)\n        print("Got", n)\n    except ValueError:\n        print("Not a number:", text)\nprint("Still running!")` },
        { title: 'Catching the right error',
          body: '<p>Name the exact error you expect. A <code>try</code> can have <b>several</b> <code>except</code> blocks, one per kind of error.</p><p><code>as e</code> gives you the exception itself, so you can print its message.</p><p>Common types: <code>ValueError</code>, <code>IndexError</code>, <code>KeyError</code>, <code>ZeroDivisionError</code>, <code>TypeError</code>.</p>',
          code: `crates = ["fish", "rum"]\nfor spot in [1, 5]:\n    try:\n        print(crates[spot])\n    except IndexError as e:\n        print("Oops:", e)\ntry:\n    print(10 / 0)\nexcept ZeroDivisionError as e:\n    print("Oops:", e)` },
        { title: 'else and finally',
          body: '<p>Two optional extras:</p><ul><li><code>else:</code> runs only if <b>no</b> error happened.</li><li><code>finally:</code> runs <b>always</b>, error or not. Great for clean-up and counting.</li></ul>',
          code: `for text in ["8", "wave"]:\n    try:\n        n = int(text)\n    except ValueError:\n        print(text, "is broken")\n    else:\n        print(text, "is fine:", n * 2)\n    finally:\n        print("checked", text)` },
        { title: 'Raising your own errors',
          body: '<p>Your functions can <b>raise</b> errors too, when they get something they can\'t handle. <code>raise</code> stops the function and sends the error up to whoever called it, who can catch it.</p>',
          code: `def set_sail(crew):\n    if crew < 3:\n        raise ValueError("not enough crew")\n    return "Off we go!"\n\nprint(set_sail(5))\ntry:\n    print(set_sail(1))\nexcept ValueError as e:\n    print("Can't sail:", e)` },
        { title: 'Custom exceptions',
          body: '<p>Make your own kind of error with a class that <b>inherits from</b> <code>Exception</code>. Even an empty class (<code>pass</code>) works!</p><p>Want extra information? Give it an <code>__init__</code>, call <code>super().__init__(message)</code> to set the message, and store anything else on <code>self</code>.</p>',
          code: `class StormWarning(Exception):\n    pass\n\nclass LowFuel(Exception):\n    def __init__(self, missing):\n        super().__init__(f"need {missing} more fuel")\n        self.missing = missing\n\ntry:\n    raise StormWarning("wind is too strong")\nexcept StormWarning as e:\n    print("Warning:", e)\ntry:\n    raise LowFuel(30)\nexcept LowFuel as e:\n    print(e, "/ missing:", e.missing)` },
      ],
      signs: ['Pip: "Squawk! Run the code first to see the exact name of the error, then catch exactly that one."', 'Pip: "try, except, else, finally. Always in that order!"', 'Pip: "Custom errors are just classes that inherit from Exception."', 'The storm breaks. One island left: Heritage Harbour.'],
      terminals: ['py2_exc1', 'py2_exc2', 'py2_exc3', 'py2_exc4', 'py2_exc5', 'py2_exc6', 'py2_exc7'],
      map: (B) => {
        const m = B.MapBuilder(174, 17);
        m.fill(0, 15, 173, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'bridge', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'climb', 'B');
        x = B.TR.mover(m, x + 6);
        m.put(x + 1, 14, '?');
        x = B.room(m, x + 3, 3, 'spikes', 'C');
        m.put(x + 3, 10, 'w');
        m.put(x + 1, 14, 'K');
        x = B.room(m, x + 6, 4, 'spring', 'D');
        x = B.TR.pit(m, x + 1);
        x = B.room(m, x + 1, 5, 'wall', 'E');
        m.put(x + 2, 14, 'e');
        x = B.TR.hills(m, x + 4);
        x = B.room(m, x, 6, 'lava', 'G');
        x = B.TR.hills(m, x);
        m.put(x + 1, 14, '?');
        x = B.room(m, x + 3, 7, 'climb', 'H');
        m.put(x + 2, 14, 'e'); m.put(x + 5, 14, '?'); m.put(x + 9, 14, 'F');
        return m;
      },
    },
    {
      id: 'py2_inh', name: 'Heritage Harbour', topic: 'Inheritance',
      blurb: 'Build families of classes: subclasses, super(), overriding, __str__ and isinstance. Then the Grand Regatta!',
      intro: `<p>The last of the Isles is <b>Heritage Harbour</b>, home to the oldest shipyard in Syntaxia. Every boat here is built from the blueprint of an older one, and then improved.</p>
        <p>"Squawk! That's <b>inheritance</b>," says Pip. "A child class gets everything from its parent, then adds or changes what it needs."</p>
        <p>Clear the harbour, then win the <b>Grand Regatta</b> using everything you learned on the Isles, and the Boilerplate Fog will be gone for good.</p>
        <pre>class Boat:\n    def horn(self):\n        return "Toot!"\n\nclass Tugboat(Boat):\n    pass\n\nprint(Tugboat().horn())   # Toot!</pre>`,
      tutorial: [
        { title: 'A child class',
          body: '<p>Put a class name in brackets to <b>inherit</b> from it: <code>class Tugboat(Ship):</code>. The child (<b>subclass</b>) gets all of the parent\'s methods, including <code>__init__</code>.</p><p>Then add anything new the child needs.</p>',
          code: `class Ship:\n    def __init__(self, name):\n        self.name = name\n    def horn(self):\n        return f"{self.name}: TOOT!"\n\nclass Tugboat(Ship):\n    def push(self):\n        return f"{self.name} pushes"\n\ntug = Tugboat("Tuggy")\nprint(tug.horn())\nprint(tug.push())` },
        { title: 'Overriding a method',
          body: '<p>If the child writes a method with the <b>same name</b> as the parent\'s, the child\'s version wins. That\'s called <b>overriding</b>.</p><p>Notice: <code>intro()</code> lives in the parent, but it calls whichever <code>speak()</code> the object really has.</p>',
          code: `class Bird:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return "..."\n    def intro(self):\n        return f"{self.name} says {self.speak()}"\n\nclass Parrot(Bird):\n    def speak(self):\n        return "Hello!"\n\nprint(Bird("Gull").intro())\nprint(Parrot("Pip").intro())` },
        { title: 'super().__init__',
          body: '<p>If the child needs <b>extra</b> attributes, it writes its own <code>__init__</code>. But then the parent\'s <code>__init__</code> doesn\'t run by itself!</p><p>Call it with <code>super().__init__(...)</code>. <code>super()</code> means "my parent class".</p>',
          code: `class Sailor:\n    def __init__(self, name):\n        self.name = name\n\nclass Captain(Sailor):\n    def __init__(self, name, ship):\n        super().__init__(name)\n        self.ship = ship\n\ncap = Captain("Ada", "Kraken")\nprint(cap.name, "commands the", cap.ship)` },
        { title: 'Extending with super()',
          body: '<p><code>super()</code> works for any method, not just <code>__init__</code>. Use it to <b>reuse</b> the parent\'s result and add something, instead of copying the parent\'s code.</p>',
          code: `class Pirate:\n    def __init__(self, name):\n        self.name = name\n    def greet(self):\n        return f"Ahoy, I'm {self.name}"\n\nclass PoliteP(Pirate):\n    def greet(self):\n        return super().greet() + ". Nice to meet you!"\n\nprint(PoliteP("Bo").greet())` },
        { title: 'Printing objects with __str__',
          body: '<p>Printing an object normally shows something like <code>&lt;Island object&gt;</code>. Give the class a <code>__str__</code> method that <b>returns</b> a string, and <code>print()</code> and f-strings will use it.</p>',
          code: `class Island:\n    def __init__(self, name, people):\n        self.name = name\n        self.people = people\n    def __str__(self):\n        return f"{self.name} ({self.people} people)"\n\nhome = Island("Tortuga", 120)\nprint(home)\nprint(f"Welcome to {home}!")` },
        { title: 'isinstance',
          body: '<p><code>isinstance(obj, SomeClass)</code> asks "is this object a SomeClass?". It\'s <code>True</code> for objects of that class <b>and of its children</b>: a Sailboat <i>is</i> a Boat.</p>',
          code: `class Boat:\n    pass\nclass Sailboat(Boat):\n    pass\nclass Raft:\n    pass\n\nfor thing in [Boat(), Sailboat(), Raft()]:\n    print(type(thing).__name__, isinstance(thing, Boat), isinstance(thing, Sailboat))` },
      ],
      signs: ['Pip: "Squawk! class Child(Parent): and the child gets everything the parent has."', 'Pip: "Writing your own __init__ in a child? Don\'t forget super().__init__(...)!"', 'Pip: "The Grand Regatta is next. Classes, errors, sorting and f-strings, all at once. Deep breath!"', 'The fog is gone. The Pythonic Isles shine in the sun!'],
      terminals: ['py2_inh1', 'py2_inh2', 'py2_inh3', 'py2_inh4', 'py2_inh5', 'py2_inh6', 'py2_inh7'],
      map: (B) => {
        const m = B.MapBuilder(172, 17);
        m.fill(0, 15, 171, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'spring', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'wall', 'B');
        x = B.TR.pit(m, x + 1);
        x = B.room(m, x + 1, 3, 'climb', 'C');
        m.put(x + 2, 14, 'e');
        x = B.TR.tower(m, x + 4);
        x = B.room(m, x, 4, 'bridge', 'D');
        m.put(x + 1, 14, 'K'); m.put(x + 3, 14, '?');
        x = B.TR.mover(m, x + 5);
        x = B.room(m, x + 1, 5, 'spikes', 'E');
        m.put(x + 2, 14, 'e');
        x = B.TR.hills(m, x + 4);
        x = B.room(m, x, 6, 'lava', 'G');
        m.put(x + 3, 10, 'w');
        x = B.TR.pit(m, x + 1);
        m.put(x + 1, 14, '?');
        x = B.room(m, x + 3, 7, 'wall', 'H');
        m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
        return m;
      },
    },
  ];

  GD.addChapter2('python', {
    title: 'The Pythonic Isles',
    blurb: 'Sail to five islands and learn the tricks that make code Pythonic: comprehensions, slices, f-strings, tuples, exceptions and inheritance.',
    outro: '<p>The Boilerplate Fog drifts back out to sea. Comprehensions, slices, f-strings, tuples, dicts, exceptions and inheritance cover most of the Python people write every day.</p>',
    theme: 'isle',
    challenges,
    levels,
  });
})(typeof window !== 'undefined' ? window : globalThis);
