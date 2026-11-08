/* CodeQuest — Chapter 2 for JavaScript: The Neon Grid.
 * Modern JavaScript in depth: array methods, destructuring & spread, objects & JSON,
 * closures & callbacks, and class inheritance. See docs/CHAPTER2.md for the format.
 */
(function (root) {
  'use strict';
  const GD = root.GameData;
  const { c, lines, escapeHTML } = GD.helpers;
  const H = GD.helpers;

  // ---------------------------------------------------------------- check helpers
  const TEST_MARK = "// tests (don't change these)";
  const squash = (s) => s.replace(/\s+/g, '');
  // the test lines at the bottom of a starter (everything after the marker comment)
  const testLinesOf = (starter) => {
    const i = starter.indexOf(TEST_MARK);
    if (i < 0) return [];
    return starter.slice(i + TEST_MARK.length).split('\n').map(s => s.replace(/\/\/.*$/, '').trim()).filter(Boolean);
  };
  // compare printed lines; opts: { keep: starter, forbid: [[re, msg]], tip(got, i) => html|null, success }
  function printed(want, opts) {
    opts = opts || {};
    return function (runs, ctx, code) {
      const src = GD.stripComments(code || '', ctx);
      if (opts.keep) {
        const flat = squash(src);
        for (const t of testLinesOf(opts.keep)) {
          if (!flat.includes(squash(t))) return { ok: false, msg: `Please keep the test lines at the bottom just as they were. This one is missing or changed: ${c(escapeHTML(t))}` };
        }
      }
      for (const [re, msg] of opts.forbid || []) if (re.test(src)) return { ok: false, msg };
      const got = lines(runs[0]);
      for (let i = 0; i < want.length; i++) {
        if (got[i] !== want[i]) {
          const tip = opts.tip ? opts.tip(got, i) : null;
          return { ok: false, msg: `Line ${i + 1} should be ${c(escapeHTML(want[i]))} but it was ${c(H.nothing(got[i]))}.` + (tip ? ' ' + tip : '') };
        }
      }
      if (got.length > want.length) return { ok: false, msg: `Expected ${want.length} lines of output, but you printed ${got.length}. Remove any extra ${c('console.log')} lines.` };
      return { ok: true, msg: opts.success || 'It works! <b>The way is open.</b>' };
    };
  }
  // check callTests like expectCalls does, plus an extra tip based on what the calls did
  function calls(tip) {
    return function (runs, ctx) {
      const r = H.checkCalls(runs[0], this.callTests, this.expectCalls, ctx, this.callTests[0].fn);
      if (r.ok) return { ok: true, msg: this.success || r.msg };
      const t = tip ? tip(runs[0].calls || []) : null;
      return t ? { ok: false, msg: r.msg + ' ' + t } : r;
    };
  }
  const crashed = (cs, re) => cs.some(x => x && x.error && re.test(x.error));
  const returned = (cs, i, v) => cs[i] && !cs[i].error && JSON.stringify(cs[i].value) === JSON.stringify(v);

  // ---------------------------------------------------------------- challenges
  const S = {}; // starters (some checks need to see them)

  S.js2_shapes = `class Shape {
  constructor(name) {
    this.name = name;
  }
  area() {
    return 0;
  }
  describe() {
    return \`\${this.name}: \${this.area()}\`;
  }
}

class Rect extends Shape {
  constructor(width, height) {
    super("rect");
    this.width = width;
    this.height = height;
  }
  area() {
    return this.width * this.height;
  }
}

class Square extends Rect {
  // constructor(side): call super(side, side), then set this.name = "square"
}

class Triangle extends Shape {
  // constructor(base, height): call super("triangle"), then save base and height
  // area(): base * height / 2
}

// tests (don't change these)
const shapes = [new Rect(2, 5), new Square(3), new Triangle(4, 6)];
shapes.forEach((s) => console.log(s.describe()));

// print the total area of all the shapes, like "total: 99"
`;

  S.js2_final = `const teamData = '[{"type":"knight","name":"Ada","hp":12,"power":3},{"type":"mage","name":"Bo","hp":0,"power":5},{"type":"mage","name":"Cy","hp":7},{"type":"knight","name":"Dee","hp":4}]';

class Hero {
  constructor(data) {
    // unpack name, hp and power (power defaults to 1) from data,
    // then store each one on this
  }
  attack() {
    return this.power * 10;
  }
  // get alive() ...
  // static from(data) ...
}

class Mage extends Hero {
  // attack() is double the hero's attack: use super.attack()
}

// 1. parse teamData and turn every entry into a hero with Hero.from
const team = [];
// 2. keep the heroes who are alive, and add up their attack() with reduce
const damage = 0;

// final strike (don't change anything below)
for (const hero of team) {
  console.log(\`\${hero.name} (\${hero.constructor.name}): alive \${hero.alive}, attack \${hero.attack()}\`);
}
console.log(\`Total damage: \${damage}\`);
if (damage >= 60) {
  console.log("The Undefined is defeated!");
} else {
  console.log("Not enough power. The Undefined laughs.");
}
`;

  const challenges = {
    // ============================================================ Level 1: array methods
    js2_arrow: {
      title: 'The Arrow Gate',
      desc: `<p>The gate only opens for functions written the modern way. Make an <b>arrow function</b> called ${c('triple')} that takes a number ${c('n')} and returns ${c('n * 3')}.</p>
        <pre>const triple = (n) => ...;</pre>
        <p>The gate will test it with a few different numbers.</p>`,
      starter: '// Make triple an arrow function that returns n * 3\nconst triple = (n) => 0;\n',
      callTests: [{ fn: 'triple', args: [2] }, { fn: 'triple', args: [5] }, { fn: 'triple', args: [0] }, { fn: 'triple', args: [-4] }],
      expectCalls: [6, 15, 0, -12],
      check: calls((cs) => cs.every(x => x && !x.error && x.value === null) ? 'If you used curly braces after the arrow, you need the word <code>return</code> inside them. Without braces, the value comes back by itself.' : null),
      require: [[/=>/, `Write ${c('triple')} as an <b>arrow function</b>, with ${c('=&gt;')}.`]],
      hints: ['The part after the arrow is what the function gives back.', 'If you skip the curly braces, you do not need the word return.'],
      similar: { task: 'An arrow function that halves a number', code: 'const half = (n) => n / 2;\nconsole.log(half(10));\nconsole.log(half(7));' },
      gate: 'A',
      success: 'The arrow flies true. <b>The cliff steps light up!</b>',
    },
    js2_map: {
      title: 'The Sign Shop',
      desc: `<p>The neon sign shop writes every sign in capitals. Write a function ${c('shoutAll(words)')} that returns a <b>new array</b> with every word in UPPER CASE.</p>
        <p>Use ${c('words.map(...)')} with an arrow function. For example, ${c('shoutAll(["neon", "grid"])')} returns ${c('["NEON", "GRID"]')}.</p>`,
      starter: 'function shoutAll(words) {\n  // return words.map(...)\n  return words;\n}\n',
      callTests: [{ fn: 'shoutAll', args: [['neon', 'grid']] }, { fn: 'shoutAll', args: [['glow']] }, { fn: 'shoutAll', args: [[]] }, { fn: 'shoutAll', args: [['Lumen', 'is', 'here']] }],
      expectCalls: [['NEON', 'GRID'], ['GLOW'], [], ['LUMEN', 'IS', 'HERE']],
      require: [[/\.map\s*\(/, `Use ${c('words.map(...)')} to change every word.`]],
      hints: ['map calls your arrow function once for every word and collects what it returns into a new array.', 'Strings have a method that turns them into capitals: toUpperCase().'],
      similar: { task: 'Turn a list of words into their lengths', code: 'function lengths(words) {\n  return words.map((w) => w.length);\n}\nconsole.log(lengths(["neon", "grid", "a"]));' },
      gate: 'B',
      success: 'Every sign blazes in capitals. <b>A bridge of light appears!</b>',
    },
    js2_filter: {
      title: 'The Speed Trap',
      desc: `<p>Only fast riders may use the express lane. Write ${c('fastOnly(speeds)')} that returns a new array with just the speeds that are <b>greater than 60</b>, in the same order.</p>
        <p>Use ${c('speeds.filter(...)')}. For example, ${c('fastOnly([40, 75, 90])')} returns ${c('[75, 90]')}.</p>`,
      starter: 'function fastOnly(speeds) {\n  // keep only the speeds above 60\n  return speeds;\n}\n',
      callTests: [{ fn: 'fastOnly', args: [[40, 75, 90]] }, { fn: 'fastOnly', args: [[61, 60, 59, 100]] }, { fn: 'fastOnly', args: [[10, 20]] }, { fn: 'fastOnly', args: [[]] }],
      expectCalls: [[75, 90], [61, 100], [], []],
      check: calls((cs) => returned(cs, 1, [61, 60, 100]) ? 'Exactly 60 is not <i>greater than</i> 60. Use <code>&gt;</code>, not <code>&gt;=</code>.' : null),
      require: [[/\.filter\s*\(/, `Use ${c('speeds.filter(...)')} to keep only the fast ones.`]],
      hints: ['filter keeps an item when your arrow function returns true for it.', 'Exactly 60 is not greater than 60, so it should be left out.'],
      similar: { task: 'Keep only the even numbers', code: 'function evensOnly(nums) {\n  return nums.filter((n) => n % 2 === 0);\n}\nconsole.log(evensOnly([1, 2, 3, 4]));' },
      gate: 'C',
      success: 'The slowpokes are waved aside. <b>The spring powers up!</b>',
    },
    js2_reduce: {
      title: 'The Power Meter',
      desc: `<p>Each power cell in the meter holds some charge. Write ${c('totalPower(cells)')} that adds them all up with ${c('cells.reduce(...)')}.</p>
        <p>Careful: the meter also tests an <b>empty</b> array, which should give ${c('0')}. Remember to give ${c('reduce')} a starting value!</p>`,
      starter: 'function totalPower(cells) {\n  // add up every cell with cells.reduce((total, c) => ..., start)\n  return 0;\n}\n',
      callTests: [{ fn: 'totalPower', args: [[5, 10, 20]] }, { fn: 'totalPower', args: [[7]] }, { fn: 'totalPower', args: [[]] }, { fn: 'totalPower', args: [[1, 2, 3, 4, 5]] }],
      expectCalls: [35, 7, 0, 15],
      check: calls((cs) => crashed(cs, /empty array/i) ? 'That crash happens when <code>reduce</code> has no starting value and the array is empty. Add <code>, 0</code> after your arrow function.' : null),
      require: [[/\.reduce\s*\(/, `Use ${c('cells.reduce(...)')} to add the cells up.`]],
      hints: ['reduce carries a running total. Your arrow function gets (total, c) and returns the new total.', 'The second thing you give reduce, after the arrow function, is where the total starts.'],
      similar: { task: 'Multiply all the numbers together', code: 'function product(nums) {\n  return nums.reduce((acc, n) => acc * n, 1);\n}\nconsole.log(product([2, 3, 4]));' },
      gate: 'D',
      success: 'The meter needle swings all the way up. <b>The spikes retract!</b>',
    },
    js2_find: {
      title: 'The Lost Courier',
      desc: `<p>A courier has gone missing! Each courier is an object like ${c('{ name: "Zip", lane: 3 }')}.</p>
        <p>Write ${c('findCourier(couriers, lane)')} that returns the <b>name</b> of the first courier in that lane. If nobody is in that lane, return ${c('"nobody"')}.</p>
        <p>Use ${c('couriers.find(...)')}. Remember: ${c('find')} gives back the whole object, or ${c('undefined')} when nothing matches.</p>`,
      starter: 'function findCourier(couriers, lane) {\n  // use couriers.find(...) to get the first courier in that lane\n  return "nobody";\n}\n',
      callTests: (() => {
        const list = [{ name: 'Zip', lane: 3 }, { name: 'Bolt', lane: 1 }, { name: 'Nova', lane: 3 }];
        return [{ fn: 'findCourier', args: [list, 3] }, { fn: 'findCourier', args: [list, 1] }, { fn: 'findCourier', args: [list, 7] }, { fn: 'findCourier', args: [[], 1] }];
      })(),
      expectCalls: ['Zip', 'Bolt', 'nobody', 'nobody'],
      check: calls((cs) => crashed(cs, /undefined/) ? 'When nobody is in the lane, <code>find</code> gives <code>undefined</code>, and <code>undefined.name</code> crashes. Check for <code>undefined</code> before reading <code>.name</code>.' : null),
      require: [[/\.find\s*\(/, `Use ${c('couriers.find(...)')} to look for the courier.`]],
      hints: ['find stops at the first courier where your arrow function returns true, such as when its lane matches.', 'Check whether find gave you undefined before you read .name from it.'],
      similar: { task: 'Find the first long word, or "none"', code: 'function firstLong(words) {\n  const w = words.find((w) => w.length > 4);\n  if (w === undefined) {\n    return "none";\n  }\n  return w;\n}\nconsole.log(firstLong(["hi", "glowing"]));\nconsole.log(firstLong(["a"]));' },
      gate: 'E',
      success: 'Found them! The courier was just taking a shortcut. <b>The lava cools.</b>',
    },
    js2_scan: {
      title: 'The Grid Scanner',
      desc: `<p>The scanner checks a street of lights. Each number is a light's brightness, and ${c('0')} means it is off. Write ${c('gridStatus(lights)')} that returns:</p>
        <ul><li>${c('"ALL ON"')} if <b>every</b> light is above 0</li><li>${c('"DARK"')} if <b>no</b> light is above 0</li><li>${c('"FLICKER"')} in any other case</li></ul>
        <p>Use ${c('lights.every(...)')} and ${c('lights.some(...)')}, which each answer ${c('true')} or ${c('false')}.</p>`,
      starter: 'function gridStatus(lights) {\n  // lights.every(...) and lights.some(...) answer true or false\n  return "FLICKER";\n}\n',
      callTests: [[80, 95, 100], [0, 0, 0], [50, 0, 20], [0, 1], [3]].map(a => ({ fn: 'gridStatus', args: [a] })),
      expectCalls: ['ALL ON', 'DARK', 'FLICKER', 'FLICKER', 'ALL ON'],
      require: [[/\.every\s*\(/, `Use ${c('lights.every(...)')} to check whether all the lights are on.`], [/\.some\s*\(/, `Use ${c('lights.some(...)')} to check whether any light is on.`]],
      hints: ['every is true only when your arrow function is true for all the lights.', 'If not even some light is above 0, the street is dark. The ! operator flips true and false.'],
      similar: { task: 'Report on a list of test scores', code: 'function checkScores(scores) {\n  if (scores.every((s) => s >= 50)) {\n    return "all passed";\n  }\n  if (scores.some((s) => s === 100)) {\n    return "someone is perfect";\n  }\n  return "keep going";\n}\nconsole.log(checkScores([60, 70]));\nconsole.log(checkScores([10, 100]));' },
      gate: 'G',
      success: 'Scan complete. Every street reports in. <b>The gate slides open!</b>',
    },
    js2_highway: {
      title: 'The Data Highway',
      desc: `<p>The highway toll booth needs the value of everything still in stock. Each item in the cart looks like ${c('{ name: "visor", price: 30, qty: 2, inStock: true }')}.</p>
        <p>Write ${c('stockValue(cart)')} that returns the total of ${c('price * qty')} for the items where ${c('inStock')} is ${c('true')}.</p>
        <p>Chain three methods, one per line: ${c('filter')} the in-stock items, ${c('map')} each one to ${c('price * qty')}, then ${c('reduce')} to add it all up.</p>`,
      starter: 'function stockValue(cart) {\n  return cart\n    // .filter(...)\n    // .map(...)\n    // .reduce(...)\n    .length;\n}\n',
      callTests: [
        [{ name: 'visor', price: 30, qty: 2, inStock: true }, { name: 'gloves', price: 8, qty: 5, inStock: false }, { name: 'boots', price: 45, qty: 1, inStock: true }],
        [{ name: 'chip', price: 3, qty: 10, inStock: true }],
        [{ name: 'cape', price: 99, qty: 1, inStock: false }],
        [],
      ].map(a => ({ fn: 'stockValue', args: [a] })),
      expectCalls: [105, 30, 0, 0],
      check: calls((cs) => returned(cs, 0, 145) ? 'That total includes the gloves, which are out of stock. Filter first!' : crashed(cs, /empty array/i) ? 'Give <code>reduce</code> a starting value of 0, so an empty cart works.' : null),
      require: [[/\.filter\s*\(/, `Start the chain with ${c('.filter(...)')} to keep the in-stock items.`], [/\.map\s*\(/, `Use ${c('.map(...)')} to turn each item into ${c('price * qty')}.`], [/\.reduce\s*\(/, `Finish with ${c('.reduce(...)')} to add up the values.`]],
      hints: ['Filter first, so the out-of-stock items never reach the later steps.', 'After the map step you have an array of plain numbers. Give reduce a starting value of 0.'],
      similar: { task: 'List the names of the unpaid bills', code: 'function unpaidNames(bills) {\n  return bills\n    .filter((b) => !b.paid)\n    .map((b) => b.name)\n    .join(", ");\n}\nconsole.log(unpaidNames([{ name: "rent", paid: false }, { name: "power", paid: true }, { name: "food", paid: false }]));' },
      gate: 'H',
      success: 'Data flows down the highway like a river of light. <b>The final cliff steps appear. The exit is open!</b>',
    },

    // ============================================================ Level 2: destructuring & spread
    js2_tmpl: {
      title: 'The Billboard',
      desc: `<p>The giant billboard shows a message for every racer. Write ${c('banner(name, place)')} that returns text like ${c('"Volt finished in place 2!"')}.</p>
        <p>Build it with a <b>template literal</b>: text inside backticks, with ${c('${name}')} and ${c('${place}')} dropped in. No ${c('+')} needed.</p>`,
      starter: 'function banner(name, place) {\n  // return `...` with ${name} and ${place} inside\n  return "";\n}\n',
      callTests: [{ fn: 'banner', args: ['Volt', 2] }, { fn: 'banner', args: ['Ada', 1] }, { fn: 'banner', args: ['Bo', 10] }],
      expectCalls: ['Volt finished in place 2!', 'Ada finished in place 1!', 'Bo finished in place 10!'],
      check: calls((cs) => cs[0] && typeof cs[0].value === 'string' && cs[0].value.includes('${') ? 'The <code>${...}</code> was not filled in. Template literals need <b>backticks</b> ` around them, not quotes.' : null),
      require: [[/`[^`]*\$\{[^`]*`/, `Use a template literal: text in <b>backticks</b> with ${c('${name}')} inside.`]],
      hints: ['Template literals use backticks, the key usually found to the left of 1, not quotes.', 'Anything inside ${ } is worked out and dropped into the text.'],
      similar: { task: 'A score line for a team', code: 'function scoreLine(team, points) {\n  return `${team} has ${points} points`;\n}\nconsole.log(scoreLine("Cyan", 12));' },
      gate: 'A',
      success: 'Your name glows forty metres high. <b>The spring hums to life!</b>',
    },
    js2_swap: {
      title: 'The Coordinate Flip',
      desc: `<p>The dock's map has its coordinates backwards. Write ${c('flip(point)')} that takes an array ${c('[x, y]')} and returns ${c('[y, x]')}.</p>
        <p>Unpack the array with <b>destructuring</b> first: ${c('const [x, y] = point;')}</p>`,
      starter: 'function flip(point) {\n  // unpack point into x and y, then return them the other way round\n  return point;\n}\n',
      callTests: [[3, 8], [0, 5], [10, 1], [-2, 7]].map(p => ({ fn: 'flip', args: [p] })),
      expectCalls: [[8, 3], [5, 0], [1, 10], [7, -2]],
      require: [[/\[\s*\w+\s*,\s*\w+\s*\]\s*(=[^=>]|\))/, `Unpack the array with destructuring, like ${c('const [x, y] = point;')}`]],
      hints: ['const [x, y] = point; puts the first item in x and the second in y.', 'Then build a new array with the two values in the other order.'],
      similar: { task: 'Show the first and last item of an array', code: 'function ends(arr) {\n  const [first] = arr;\n  const last = arr[arr.length - 1];\n  return `${first} ... ${last}`;\n}\nconsole.log(ends(["a", "b", "c"]));' },
      gate: 'B',
      success: 'The map snaps the right way round. <b>The lava cools into stone.</b>',
    },
    js2_objd: {
      title: 'The ID Scanner',
      desc: `<p>The scanner reads rider ID cards like ${c('{ name: "Nova", bike: "Pulse 9", lane: 4 }')}. Write ${c('scan(card)')} that returns ${c('"Nova rides a Pulse 9 in lane 4"')}.</p>
        <p>Unpack the card with <b>object destructuring</b>: either ${c('const { name, bike, lane } = card;')} inside the function, or right in the parameters: ${c('function scan({ name, bike, lane })')}.</p>`,
      starter: 'function scan(card) {\n  // unpack name, bike and lane from card\n  return "";\n}\n',
      callTests: [{ name: 'Nova', bike: 'Pulse 9', lane: 4 }, { name: 'Zip', bike: 'Comet', lane: 1 }, { lane: 2, bike: 'Arc', name: 'Ray' }].map(o => ({ fn: 'scan', args: [o] })),
      expectCalls: ['Nova rides a Pulse 9 in lane 4', 'Zip rides a Comet in lane 1', 'Ray rides a Arc in lane 2'],
      require: [[/(const|let|var)\s*\{[^}]*\}\s*=[^=>]|\(\s*\{[^}]*\}\s*[,)]/, `Unpack the card with object destructuring, like ${c('const { name, bike, lane } = card;')}`]],
      hints: ['The names inside the curly braces must match the property names on the card exactly.', 'Once unpacked, name, bike and lane are ordinary variables you can drop into a template literal.'],
      similar: { task: 'A weather report from an object', code: 'function weather({ city, temp }) {\n  return `${city}: ${temp} degrees`;\n}\nconsole.log(weather({ city: "Neon City", temp: 21 }));' },
      gate: 'C',
      success: 'ID accepted. <b>The climbing blocks materialise!</b>',
    },
    js2_defaults: {
      title: 'The Light Rig',
      desc: `<p>Light rigs come with settings, but people often leave the power setting out. Write ${c('rig(settings)')} that unpacks ${c('color')} and ${c('power')}, where ${c('power')} <b>defaults to 100</b> when it is missing. Return text like ${c('"pink at 100%"')}.</p>
        <pre>rig({ color: "pink" })            // "pink at 100%"\nrig({ color: "cyan", power: 40 }) // "cyan at 40%"</pre>`,
      starter: 'function rig(settings) {\n  const { color, power } = settings; // give power a default value\n  return `${color} at ${power}%`;\n}\n',
      callTests: [{ color: 'pink' }, { color: 'cyan', power: 40 }, { power: 0, color: 'lime' }].map(o => ({ fn: 'rig', args: [o] })),
      expectCalls: ['pink at 100%', 'cyan at 40%', 'lime at 0%'],
      check: calls((cs) => returned(cs, 2, 'lime at 100%') ? 'A power of 0 was turned into 100! <code>||</code> replaces 0 too. A destructuring default only kicks in when the value is really missing.' : (cs[0] && /undefined/.test(String(cs[0].value)) ? 'See the <code>undefined</code>? That is what you get when a property is missing. Give it a default.' : null)),
      require: [[/\bpower\s*=\s*100\b/, `Give ${c('power')} a default inside the destructuring: ${c('{ color, power = 100 }')}.`]],
      hints: ['In destructuring, name = value means "use this value if the property is missing".', 'Defaults only kick in for missing values, so a power of 0 stays 0.'],
      similar: { task: 'Greet someone, or a stranger', code: 'function greet({ name = "stranger" }) {\n  return `Hello, ${name}`;\n}\nconsole.log(greet({}));\nconsole.log(greet({ name: "Ada" }));' },
      gate: 'D',
      success: 'The rig blazes at full power. <b>The gate opens!</b>',
    },
    js2_rest: {
      title: 'The Fare Collector',
      desc: `<p>The fare machine accepts any number of coins at once. Write ${c('collect(...coins)')} that takes <b>any number of arguments</b> and returns their total.</p>
        <pre>collect(5, 10, 20) // 35\ncollect(2)         // 2\ncollect()          // 0</pre>
        <p>The rest parameter ${c('...coins')} gathers all the arguments into an array, so you can use ${c('reduce')} on it.</p>`,
      starter: 'function collect(coins) {\n  // turn coins into a rest parameter: ...coins\n  return 0;\n}\n',
      callTests: [[5, 10, 20], [2], [], [1, 1, 1, 1]].map(a => ({ fn: 'collect', args: a })),
      expectCalls: [35, 2, 0, 4],
      check: calls((cs) => crashed(cs, /empty array/i) ? 'For <code>collect()</code> the array is empty. Give <code>reduce</code> a starting value of 0.' : null),
      require: [[/\(\s*\.\.\.\s*\w+\s*\)/, `Use a rest parameter, ${c('...coins')}, so the function accepts any number of coins.`]],
      hints: ['With ...coins in the brackets, coins becomes a real array of everything that was passed in.', 'You added up an array with reduce in the Lambda Lanes. Do not forget the starting value for collect().'],
      similar: { task: 'Count how many things were passed in', code: 'function countArgs(...things) {\n  return things.length;\n}\nconsole.log(countArgs("a", "b", "c"));\nconsole.log(countArgs());' },
      gate: 'E',
      success: 'Clink, clink, clink. Fare paid. <b>A bridge slides across the lava!</b>',
    },
    js2_merge: {
      title: 'The Settings Merger',
      desc: `<p>Every rider has default settings and some saved changes. Merge them, without breaking the originals:</p>
        <ol><li>Make ${c('settings')}: a <b>new object</b> with everything from ${c('defaults')}, then everything from ${c('saved')} on top (saved values win). Use spread. Print it.</li>
        <li>Make ${c('playlist')}: a <b>new array</b> with all of ${c('songs')} followed by all of ${c('newSongs')}. Use spread. Print it.</li>
        <li>Unpack ${c('theme')} and ${c('volume')} from ${c('settings')}, and the first song from ${c('playlist')}, with destructuring. Print ${c('Theme neon, volume 9, now playing Pulse')} with a template literal.</li></ol>
        <p>The last line checks that ${c('defaults')} was not changed.</p>`,
      starter: `const defaults = { theme: "dark", volume: 5, music: true };
const saved = { volume: 9, theme: "neon" };
const songs = ["Pulse", "Glow"];
const newSongs = ["Static", "Drift"];

// 1. settings = defaults with saved on top (spread), then print it

// 2. playlist = songs followed by newSongs (spread), then print it

// 3. unpack theme, volume and the first song, then print the sentence

// tests (don't change these)
console.log(defaults.volume);
`,
      check: printed(['{ theme: "neon", volume: 9, music: true }', '["Pulse", "Glow", "Static", "Drift"]', 'Theme neon, volume 9, now playing Pulse', '5'], {
        keep: "// tests (don't change these)\nconsole.log(defaults.volume);",
        tip: (got, i) => (i === 3 && got[3] === '9') ? 'Oh no, <code>defaults</code> was changed! Spread into a brand new object <code>{ ... }</code> instead of changing defaults.'
          : (i === 0 && got[0] === '{ theme: "dark", volume: 5, music: true }') ? 'Spread <code>saved</code> <i>after</i> <code>defaults</code>: the one on the right wins.'
            : (i === 1 && /\[\[/.test(got[1] || '')) ? 'Those are arrays inside an array. Put <code>...</code> in front of each one to spread its items.' : null,
        success: 'Settings merged, playlist queued, originals safe. <b>The exit is open!</b>',
      }),
      require: [[/\.\.\.\s*defaults\b/, `Spread ${c('defaults')} into the new object: ${c('{ ...defaults, ... }')}`], [/\.\.\.\s*songs\b/, `Spread ${c('songs')} into the new array: ${c('[...songs, ...]')}`],
        [/(const|let)\s*\{[^}]*\}\s*=/, `Unpack ${c('theme')} and ${c('volume')} with object destructuring: ${c('const { theme, volume } = settings;')}`],
        [/(const|let)\s*\[[^\]]*\]\s*=/, `Unpack the first song with array destructuring: ${c('const [firstSong] = playlist;')}`],
        [/`[^`]*\$\{[^`]*`/, 'Print the sentence with a template literal (backticks).']],
      hints: ['In an object, ...defaults copies every property. Later properties replace earlier ones with the same name.', 'const [first] = playlist; takes just the first item and ignores the rest.'],
      similar: { task: 'Merge a base robot with upgrades', code: 'const base = { name: "Bolt", armor: 1 };\nconst upgraded = { ...base, armor: 5, laser: true };\nconsole.log(upgraded);\nconst parts = [...["wheel", "arm"], "antenna"];\nconst [firstPart] = parts;\nconsole.log(`${upgraded.name} starts with a ${firstPart}`);' },
      gate: 'G',
    },

    // ============================================================ Level 3: objects & JSON
    js2_keys: {
      title: 'The Index Card',
      desc: `<p>The vault's index lists the fields of every record. Write ${c('fieldList(record)')} that returns the record's <b>keys</b> joined with ${c('", "')}.</p>
        <p>For example, ${c('fieldList({ hero: "Ada", level: 3 })')} returns ${c('"hero, level"')}. Use ${c('Object.keys')} and ${c('join')}.</p>`,
      starter: 'function fieldList(record) {\n  // Object.keys(record) gives an array of the keys\n  return "";\n}\n',
      callTests: [{ hero: 'Ada', level: 3 }, { a: 1 }, {}, { x: 1, y: 2, z: 3 }].map(o => ({ fn: 'fieldList', args: [o] })),
      expectCalls: ['hero, level', 'a', '', 'x, y, z'],
      require: [[/Object\.keys\s*\(/, `Use ${c('Object.keys(record)')} to get the keys.`]],
      hints: ['Object.keys gives you an array of strings, one per property.', 'Arrays have a join method that glues the items together with whatever text you give it.'],
      similar: { task: 'Add up all the values of an object', code: 'function valueTotal(obj) {\n  return Object.values(obj).reduce((t, v) => t + v, 0);\n}\nconsole.log(valueTotal({ a: 2, b: 3 }));' },
      gate: 'A',
      success: 'The index card is rewritten. <b>The gate opens!</b>',
    },
    js2_entries: {
      title: 'The Inventory Readout',
      desc: `<p>The vault's readout is blank. Print the inventory, one item per line, like ${c('chips: 3')}.</p>
        <p>Loop over ${c('Object.entries(inventory)')} with ${c('for...of')}, and unpack each entry straight into ${c('[item, count]')}. Add each count to ${c('total')}, so the last line shows ${c('total: 10')}.</p>`,
      starter: 'const inventory = { chips: 3, cables: 5, fuses: 2 };\nlet total = 0;\n\n// for (const [item, count] of Object.entries(inventory)) { ... }\n\nconsole.log(`total: ${total}`);\n',
      expect: ['chips: 3', 'cables: 5', 'fuses: 2', 'total: 10'],
      require: [[/Object\.entries\s*\(/, `Loop over ${c('Object.entries(inventory)')}.`], [/for\s*\(\s*(const|let)\s*\[/, `Unpack each entry in the loop: ${c('for (const [item, count] of ...)')}`]],
      hints: ['Each entry is a small array: [key, value].', 'Inside the loop, add count to total as well as printing the line.'],
      similar: { task: 'Print everyone\'s age', code: 'const ages = { Ada: 12, Bo: 9 };\nfor (const [name, age] of Object.entries(ages)) {\n  console.log(`${name} is ${age}`);\n}' },
      gate: 'B',
      success: 'The readout flickers back on. <b>The spikes slide away!</b>',
    },
    js2_surge: {
      title: 'The Price Surge',
      desc: `<p>Rush hour! Every price in the vault doubles. Write ${c('surge(prices)')} that returns a <b>new object</b> with the same keys, but every value times 2.</p>
        <pre>surge({ chips: 3, fuses: 5 }) // { chips: 6, fuses: 10 }</pre>
        <p>Turn the object into entries, ${c('map')} each ${c('[name, price]')} pair to a new pair, then rebuild an object with ${c('Object.fromEntries')}.</p>`,
      starter: 'function surge(prices) {\n  // Object.entries -> map -> Object.fromEntries\n  return prices;\n}\n',
      callTests: [{ chips: 3, fuses: 5 }, { a: 1 }, {}, { visor: 30, key: 0, cape: 12 }].map(o => ({ fn: 'surge', args: [o] })),
      expectCalls: [{ chips: 6, fuses: 10 }, { a: 2 }, {}, { visor: 60, key: 0, cape: 24 }],
      check: calls((cs) => cs[0] && Array.isArray(cs[0].value) ? 'That is an array of pairs. Wrap it in <code>Object.fromEntries(...)</code> to turn it back into an object.' : null),
      require: [[/Object\.fromEntries\s*\(/, `Rebuild the object with ${c('Object.fromEntries(...)')}.`]],
      hints: ['In map, you can unpack the pair right in the parameters: ([name, price]) => ...', 'Your arrow function should return a new pair: an array holding the name and the doubled price.'],
      similar: { task: 'Make every key upper case', code: 'function upperKeys(obj) {\n  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toUpperCase(), v]));\n}\nconsole.log(upperKeys({ a: 1, b: 2 }));' },
      gate: 'C',
      success: 'Prices doubled, the city groans. <b>A stone path forms over the lava.</b>',
    },
    js2_json: {
      title: 'The Save Crystal',
      desc: `<p>Save crystals store game data as <b>JSON text</b>.</p>
        <ol><li>Turn ${c('save')} into JSON text with ${c('JSON.stringify')} and print it.</li>
        <li>Then read the old crystal: ${c('JSON.parse(oldCrystal)')} gives you back an object. Use its ${c('hero')} and ${c('level')} to print ${c('Bo is level 5')}.</li></ol>`,
      starter: 'const save = { hero: "Ada", level: 3, items: ["visor", "key"] };\nconst oldCrystal = \'{"hero":"Bo","level":5}\';\n\n// 1. print save as JSON text\n\n// 2. parse oldCrystal and print "Bo is level 5"\n',
      check: printed(['{"hero":"Ada","level":3,"items":["visor","key"]}', 'Bo is level 5'], {
        tip: (got, i) => (i === 0 && /^\{ hero/.test(got[0] || '')) ? 'That is how <code>console.log</code> shows an object. Turn it into JSON text first with <code>JSON.stringify(save)</code>.'
          : (i === 1 && /undefined/.test(got[1] || '')) ? '<code>oldCrystal</code> is just text, so it has no <code>.hero</code>. Parse it with <code>JSON.parse</code> first.' : null,
        success: 'The crystal glows: your progress is safe. <b>The spring powers up!</b>',
      }),
      require: [[/JSON\.stringify\s*\(/, `Use ${c('JSON.stringify(save)')} to make the JSON text.`], [/JSON\.parse\s*\(/, `Use ${c('JSON.parse(oldCrystal)')} to read the old crystal.`]],
      hints: ['JSON.stringify(something) gives back a string. Print that string.', 'oldCrystal is just text. After JSON.parse you can use .hero and .level on the result.'],
      similar: { task: 'Round-trip some data through JSON', code: 'const text = JSON.stringify([1, 2, 3]);\nconsole.log(text);\nconst back = JSON.parse(\'{"color":"pink"}\');\nconsole.log(back.color);' },
      gate: 'D',
    },
    js2_optional: {
      title: 'The Broken Index',
      desc: `<p>The Undefined chewed holes in the vault's records. Some users have no ${c('address')}, and some records are ${c('null')} altogether. Write ${c('cityOf(user)')} that returns ${c('user.address.city')}, or ${c('"unknown"')} when any part is missing.</p>
        <p>Use optional chaining ${c('?.')} and the ${c('??')} operator, so it never crashes.</p>`,
      starter: 'function cityOf(user) {\n  return user.address.city;\n}\n',
      callTests: [{ name: 'Ada', address: { city: 'Neon City' } }, { name: 'Bo' }, null, { name: 'Cy', address: {} }, { address: { city: 'Glowtown' } }].map(u => ({ fn: 'cityOf', args: [u] })),
      expectCalls: ['Neon City', 'unknown', 'unknown', 'unknown', 'Glowtown'],
      check: calls((cs) => crashed(cs, /Cannot read/i) ? 'That is the classic "reading a property of undefined" crash. Use <code>?.</code> instead of <code>.</code> where something might be missing.' : (cs[1] && !cs[1].error && cs[1].value === null) ? 'Now it returns <code>undefined</code> instead of crashing. Use <code>?? "unknown"</code> to swap that for a real answer.' : null),
      require: [[/\?\./, `Use optional chaining, ${c('?.')}, where a part might be missing.`], [/\?\?/, `Use ${c('??')} to give ${c('"unknown"')} when the city is missing.`]],
      hints: ['a?.b gives undefined instead of crashing when a is null or undefined.', 'x ?? "unknown" uses "unknown" only when x is null or undefined.'],
      similar: { task: 'The first tag of a post, or "untagged"', code: 'function firstTag(post) {\n  return post?.tags?.[0] ?? "untagged";\n}\nconsole.log(firstTag({ tags: ["neon"] }));\nconsole.log(firstTag(null));' },
      gate: 'E',
      success: 'No more crashes: missing data is handled gracefully. <b>The gate opens!</b>',
    },
    js2_leaders: {
      title: 'The Leaderboard',
      desc: `<p>The arena sends its scores as JSON text, like this:</p>
        <pre>'[{"name":"Ada","score":90},{"name":"Bo","score":30},{"name":"Cy","score":50}]'</pre>
        <p>Write ${c('leaders(json)')} that parses the text and returns an <b>object</b> mapping each player with a score of <b>50 or more</b> to their score. For the text above that is ${c('{ Ada: 90, Cy: 50 }')}.</p>
        <p>Everything you need is here: ${c('JSON.parse')}, ${c('filter')}, ${c('map')} to ${c('[name, score]')} pairs, and ${c('Object.fromEntries')}.</p>`,
      starter: 'function leaders(json) {\n  // 1. JSON.parse the text into an array of players\n  // 2. keep the players with a score of 50 or more\n  // 3. turn them into [name, score] pairs and build an object\n  return {};\n}\n',
      callTests: ['[{"name":"Ada","score":90},{"name":"Bo","score":30},{"name":"Cy","score":50}]', '[]', '[{"name":"Dee","score":49}]', '[{"name":"Eli","score":77,"team":"cyan"},{"name":"Fay","score":100,"team":"pink"}]'].map(j => ({ fn: 'leaders', args: [j] })),
      expectCalls: [{ Ada: 90, Cy: 50 }, {}, {}, { Eli: 77, Fay: 100 }],
      check: calls((cs) => crashed(cs, /not a function/i) ? 'The JSON text is just a string. Parse it with <code>JSON.parse(json)</code> before using array methods on it.' : (cs[0] && Array.isArray(cs[0].value)) ? 'You returned an array. Build an object from <code>[name, score]</code> pairs with <code>Object.fromEntries</code>.' : null),
      require: [[/JSON\.parse\s*\(/, `Start by parsing the text with ${c('JSON.parse(json)')}.`]],
      hints: ['After JSON.parse you have an ordinary array of objects, so filter and map work on it.', 'Map each player to a [name, score] pair, then Object.fromEntries turns the list of pairs into an object.'],
      similar: { task: 'List the player names from JSON text', code: 'function teamNames(json) {\n  return JSON.parse(json).map(({ name }) => name).join(", ");\n}\nconsole.log(teamNames(\'[{"name":"Ada"},{"name":"Bo"}]\'));' },
      gate: 'G',
      success: 'The leaderboard lights up the vault. <b>The way out is open!</b>',
    },

    // ============================================================ Level 4: closures & callbacks
    js2_pass: {
      title: 'The Relay Switch',
      desc: `<p>A relay switch sends a signal through a machine <b>twice</b>. Write ${c('applyTwice(fn, x)')}: call the function ${c('fn')} on ${c('x')}, then call ${c('fn')} again on that result, and return the final answer.</p>
        <p>The test lines at the bottom are already written, and each one passes in a different arrow function. Don't change them!</p>`,
      starter: 'function applyTwice(fn, x) {\n  // call fn on x, then call fn on the result\n  return x;\n}\n\n' + TEST_MARK + '\nconsole.log(applyTwice((n) => n + 3, 10));\nconsole.log(applyTwice((n) => n * n, 3));\nconsole.log(applyTwice((s) => s + "!", "go"));\n',
      hints: ['fn is an ordinary function stored in a parameter. Call it like any other function: fn(x).', 'Store the first result in a variable, then pass that variable to fn again.'],
      similar: { task: 'Call a function with the number 5', code: 'function callWith5(fn) {\n  return fn(5);\n}\nconsole.log(callWith5((n) => n * 10));' },
      gate: 'A',
    },
    js2_mymap: {
      title: 'The Pattern Loom',
      desc: `<p>The loom weaves patterns by doing the same thing to every thread. Write your <b>own</b> version of ${c('map')}: ${c('myMap(arr, fn)')} returns a new array holding ${c('fn(item)')} for every item, in order.</p>
        <p>Use a ${c('for...of')} loop and ${c('push')}. No ${c('.map')} allowed: you are building it!</p>`,
      starter: 'function myMap(arr, fn) {\n  const result = [];\n  // for each item, push fn(item) into result\n  return result;\n}\n\n' + TEST_MARK + '\nconsole.log(myMap([1, 2, 3], (n) => n * 10));\nconsole.log(myMap(["a", "b"], (s) => s.toUpperCase()));\nconsole.log(myMap([], (n) => n + 1));\n',
      hints: ['Loop over arr, and for every item call fn(item).', 'Push each answer into result, and return result after the loop.'],
      similar: { task: 'Your own forEach', code: 'function myForEach(arr, fn) {\n  for (const item of arr) {\n    fn(item);\n  }\n}\nmyForEach(["x", "y"], (s) => console.log("got", s));' },
      gate: 'B',
    },
    js2_booster: {
      title: 'The Booster Factory',
      desc: `<p>The factory builds speed boosters. Write ${c('makeBooster(amount)')} that <b>returns a new function</b>. That new function takes a ${c('speed')} and returns ${c('speed + amount')}.</p>
        <pre>const turbo = makeBooster(50);\nturbo(10) // 60</pre>
        <p>The returned function still remembers ${c('amount')}, even after ${c('makeBooster')} has finished. That memory is called a <b>closure</b>.</p>`,
      starter: 'function makeBooster(amount) {\n  // return an arrow function that adds amount to speed\n  return (speed) => speed;\n}\n\n' + TEST_MARK + '\nconst turbo = makeBooster(50);\nconst nudge = makeBooster(1);\nconsole.log(turbo(10));\nconsole.log(nudge(10));\nconsole.log(turbo(nudge(0)));\n',
      hints: ['The function you return can use amount, because it was created inside makeBooster.', 'Only the body of the returned arrow function needs to change.'],
      similar: { task: 'A factory for text taggers', code: 'function makeTagger(tag) {\n  return (text) => `[${tag}] ${text}`;\n}\nconst warn = makeTagger("WARN");\nconsole.log(warn("low power"));' },
      gate: 'C',
    },
    js2_counter: {
      title: 'The Turnstile',
      desc: `<p>Every turnstile counts its <b>own</b> visitors. ${c('makeCounter()')} returns a function, and each call of that function returns the next number: ${c('1')}, then ${c('2')}, then ${c('3')}...</p>
        <p>Right now there is a bug: both turnstiles share one ${c('count')}. Fix it by keeping the count in a variable <b>inside</b> ${c('makeCounter')}, so each counter it makes has a private count of its own.</p>`,
      starter: 'let count = 0; // this count is shared by every turnstile!\n\nfunction makeCounter() {\n  return () => {\n    count += 1;\n    return count;\n  };\n}\n\n' + TEST_MARK + '\nconst north = makeCounter();\nconst south = makeCounter();\nconsole.log(north());\nconsole.log(north());\nconsole.log(south());\nconsole.log(north());\n',
      hints: ['Every call to makeCounter should create a fresh count variable.', 'A variable declared inside makeCounter can only be reached by the function it returns.'],
      similar: { task: 'A logger that remembers how many messages it got', code: 'function makeLogger() {\n  const lines = [];\n  return (msg) => {\n    lines.push(msg);\n    return lines.length;\n  };\n}\nconst log = makeLogger();\nconsole.log(log("a"));\nconsole.log(log("b"));' },
      gate: 'D',
    },
    js2_locker: {
      title: 'The Private Locker',
      desc: `<p>Arcade lockers keep their coins private. ${c('makeLocker()')} returns an object with two methods:</p>
        <ul><li>${c('deposit(amount)')} adds coins</li><li>${c('balance()')} returns how many coins are inside</li></ul>
        <p>Right now the coins sit on the object, where anyone can read or change them. Store them in a variable <b>inside</b> ${c('makeLocker')} instead, so ${c('locker.coins')} is ${c('undefined')}.</p>
        <p>(Methods in an object can be written as ${c('deposit(amount) { ... }')} or as ${c('deposit: (amount) => { ... }')}.)</p>`,
      starter: 'function makeLocker() {\n  return {\n    coins: 0,\n    deposit(amount) {\n      this.coins += amount;\n    },\n    balance() {\n      return this.coins;\n    },\n  };\n}\n\n' + TEST_MARK + '\nconst locker = makeLocker();\nlocker.deposit(5);\nlocker.deposit(20);\nconsole.log(locker.balance());\nconsole.log(locker.coins);\nconst other = makeLocker();\nconsole.log(other.balance());\n',
      hints: ['Start makeLocker with let coins = 0; then return the object without a coins property.', 'The methods can use coins directly, with no this, because they were created inside makeLocker.'],
      similar: { task: 'A secret word that can be checked but not read', code: 'function makeSecret(word) {\n  return {\n    hint: () => word[0] + "...",\n    check: (guess) => guess === word,\n  };\n}\nconst s = makeSecret("neon");\nconsole.log(s.hint());\nconsole.log(s.check("grid"));\nconsole.log(s.word);' },
      gate: 'E',
    },
    js2_events: {
      title: 'The Event Board',
      desc: `<p>The arcade's event board lets machines <b>subscribe</b> to news. Build a tiny event system with closures and callbacks:</p>
        <ul><li>${c('makeBoard()')} returns an object with ${c('on(fn)')} and ${c('emit(message)')}.</li>
        <li>${c('on(fn)')} remembers the callback ${c('fn')} in the private ${c('listeners')} array.</li>
        <li>${c('emit(message)')} calls <b>every</b> remembered callback with the message, in the order they subscribed.</li></ul>
        <p>Each board must have its own listeners: the ${c('quiet')} board has none, so nobody hears it.</p>`,
      starter: 'function makeBoard() {\n  const listeners = [];\n  return {\n    on(fn) {\n      // remember fn\n    },\n    emit(message) {\n      // call every listener with message\n    },\n  };\n}\n\n' + TEST_MARK + '\nconst board = makeBoard();\nboard.on((msg) => console.log("Screen: " + msg));\nboard.emit("doors open");\nboard.on((msg) => console.log("Speaker: " + msg.toUpperCase()));\nboard.emit("high score!");\nconst quiet = makeBoard();\nquiet.emit("nobody hears this");\n',
      hints: ['on only needs to push fn into listeners.', 'In emit, loop over listeners (forEach works nicely) and call each one with message.'],
      similar: { task: 'Run a value through a list of steps', code: 'function runSteps(steps, start) {\n  return steps.reduce((value, step) => step(value), start);\n}\nconsole.log(runSteps([(n) => n + 1, (n) => n * 10], 4));' },
      gate: 'G',
    },

    // ============================================================ Level 5: classes, deeper
    js2_extends: {
      title: 'The Drone Hangar',
      desc: `<p>The hangar already has a ${c('Robot')} class. Make a class ${c('Drone')} that <b>extends</b> ${c('Robot')} and adds a method ${c('fly()')}, which returns the drone's name followed by ${c('" takes off!"')}.</p>
        <p>Drones should still be able to use ${c('hello()')} from ${c('Robot')}, without you writing it again.</p>`,
      starter: 'class Robot {\n  constructor(name) {\n    this.name = name;\n  }\n  hello() {\n    return `Beep, I am ${this.name}`;\n  }\n}\n\n// make class Drone here (it extends Robot)\n\n' + TEST_MARK + '\nconst d = new Drone("Lumen");\nconsole.log(d.hello());\nconsole.log(d.fly());\nconsole.log(d instanceof Robot);\n',
      require: [[/class\s+Drone\s+extends\s+Robot\b/, `Write ${c('class Drone extends Robot { ... }')}`]],
      hints: ['class Drone extends Robot { ... } gives Drone everything Robot has.', 'Inside fly, this.name is the name that the Robot constructor stored.'],
      similar: { task: 'A Cat that is a kind of Animal', code: 'class Animal {\n  constructor(name) {\n    this.name = name;\n  }\n}\nclass Cat extends Animal {\n  meow() {\n    return `${this.name} says meow`;\n  }\n}\nconsole.log(new Cat("Pix").meow());' },
      gate: 'A',
    },
    js2_super: {
      title: 'The Upgrade Bay',
      desc: `<p>A ${c('Racer')} is a ${c('Bike')} with a ${c('boost')}. Finish the ${c('Racer')} constructor: first call ${c('super(name)')} so the ${c('Bike')} part gets set up, then store ${c('boost')} on the object.</p>
        <p>Then add a method ${c('topSpeed()')} that returns ${c('speed + boost')}.</p>`,
      starter: 'class Bike {\n  constructor(name) {\n    this.name = name;\n    this.speed = 10;\n  }\n}\n\nclass Racer extends Bike {\n  constructor(name, boost) {\n    // call super(name), then save boost\n  }\n}\n\n' + TEST_MARK + '\nconst zip = new Racer("Zip", 5);\nconsole.log(zip);\nconsole.log(zip.topSpeed());\n',
      require: [[/super\s*\(\s*name\s*\)/, `Call ${c('super(name)')} at the start of the constructor.`]],
      hints: ['super(name) runs the Bike constructor, which sets name and speed.', 'You can only use this after super has been called.'],
      similar: { task: 'A Lamp that is a kind of Light', code: 'class Light {\n  constructor(color) {\n    this.color = color;\n    this.on = false;\n  }\n}\nclass Lamp extends Light {\n  constructor(color, room) {\n    super(color);\n    this.room = room;\n  }\n}\nconsole.log(new Lamp("pink", "hall"));' },
      gate: 'B',
    },
    js2_override: {
      title: 'The Voice Module',
      desc: `<p>${c('Guard')} robots describe themselves like any ${c('Robot')}, but they add a warning. Override ${c('describe()')} in ${c('Guard')} so it returns the <b>parent's</b> description followed by ${c('" Keep out!"')}.</p>
        <p>Use ${c('super.describe()')} to get the parent's text, instead of copying it.</p>`,
      starter: 'class Robot {\n  constructor(name) {\n    this.name = name;\n  }\n  describe() {\n    return `${this.name} is a robot.`;\n  }\n}\n\nclass Guard extends Robot {\n  // override describe() here\n}\n\n' + TEST_MARK + '\nconsole.log(new Robot("Bolt").describe());\nconsole.log(new Guard("Rex").describe());\n',
      require: [[/super\.describe\s*\(/, `Call ${c('super.describe()')} inside your new method to reuse the parent's text.`]],
      hints: ['A method in Guard with the same name, describe, replaces the one from Robot.', 'super.describe() calls the Robot version, so you only need to add the extra words.'],
      similar: { task: 'A Square that names its parent shape', code: 'class Shape {\n  name() {\n    return "shape";\n  }\n}\nclass Square extends Shape {\n  name() {\n    return "square, a kind of " + super.name();\n  }\n}\nconsole.log(new Square().name());' },
      gate: 'C',
    },
    js2_thermo: {
      title: 'The Thermostat',
      desc: `<p>The tower's thermostat must stay between <b>10</b> and <b>30</b> degrees. The temperature is stored in ${c('this._temp')} (the underscore means "please don't touch this directly").</p>
        <ul><li>Add a <b>getter</b> ${c('get temp()')} that returns ${c('this._temp')}.</li>
        <li>Add a <b>setter</b> ${c('set temp(value)')} that stores the value, but never below 10 or above 30.</li></ul>
        <p>With these, ${c('t.temp = 50')} looks like a normal assignment, but your setter runs.</p>`,
      starter: 'class Thermostat {\n  constructor() {\n    this._temp = 20;\n  }\n  // add get temp() and set temp(value) here\n}\n\n' + TEST_MARK + '\nconst t = new Thermostat();\nconsole.log(t.temp);\nt.temp = 25;\nconsole.log(t.temp);\nt.temp = 50;\nconsole.log(t.temp);\nt.temp = -5;\nconsole.log(t.temp);\n',
      require: [[/\bget\s+temp\s*\(/, `Add a getter: ${c('get temp() { ... }')}`], [/\bset\s+temp\s*\(/, `Add a setter: ${c('set temp(value) { ... }')}`]],
      hints: ['Inside the setter, compare value with 10 and 30 before saving it to this._temp.', 'Math.min and Math.max can clamp a number, or you can use if and else if.'],
      similar: { task: 'A getter that builds a full name', code: 'class Player {\n  constructor(first, last) {\n    this.first = first;\n    this.last = last;\n  }\n  get fullName() {\n    return `${this.first} ${this.last}`;\n  }\n}\nconsole.log(new Player("Ada", "Lovelace").fullName);' },
      gate: 'D',
    },
    js2_static: {
      title: 'The ID Factory',
      desc: `<p>The factory stamps a serial number on every unit it builds. Finish the ${c('Unit')} class:</p>
        <ul><li>A <b>static field</b> ${c('static built = 0;')} counts how many units exist. It belongs to the class itself, not to each unit.</li>
        <li>The constructor adds 1 to ${c('Unit.built')} and gives the unit ${c('this.id')}, equal to the new count.</li>
        <li>A <b>static method</b> ${c('report()')} returns text like ${c('"3 units built"')} (with the real count). It is called on the class: ${c('Unit.report()')}.</li></ul>`,
      starter: 'class Unit {\n  // static built = 0;\n  constructor(name) {\n    this.name = name;\n  }\n}\n\n' + TEST_MARK + '\nconst a = new Unit("alpha");\nconst b = new Unit("beta");\nconst c = new Unit("gamma");\nconsole.log(a.id, b.id, c.id);\nconsole.log(Unit.report());\nconsole.log(a.built);\n',
      require: [[/\bstatic\s+built\b/, `Add the static field: ${c('static built = 0;')}`], [/\bstatic\s+report\s*\(/, `Add the static method: ${c('static report() { ... }')}`]],
      hints: ['Inside the constructor, reach the static field through the class name: Unit.built.', 'Static fields are not copied onto each object, which is why a.built is undefined.'],
      similar: { task: 'A class used only for its static helpers', code: 'class Tools {\n  static VERSION = 2;\n  static double(n) {\n    return n * 2;\n  }\n}\nconsole.log(Tools.double(21));\nconsole.log(Tools.VERSION);' },
      gate: 'E',
    },
    js2_shapes: {
      title: 'The Hologram Array',
      desc: `<p>The hologram projector shows a family of shapes. ${c('Shape')} and ${c('Rect')} are done. Finish the other two:</p>
        <ul><li>${c('Square')} extends ${c('Rect')}: its constructor takes one ${c('side')}, calls ${c('super(side, side)')}, then sets ${c('this.name')} to ${c('"square"')}.</li>
        <li>${c('Triangle')} extends ${c('Shape')}: its constructor takes ${c('base')} and ${c('height')} (call ${c('super("triangle")')} first), and its ${c('area()')} returns ${c('base * height / 2')}.</li></ul>
        <p>Notice that ${c('describe()')} lives in ${c('Shape')}, but ${c('this.area()')} runs the right version for each shape. Finally, use ${c('map')} and ${c('reduce')} to print the total area of all the shapes: ${c('total: 31')}.</p>`,
      starter: S.js2_shapes,
      require: [[/class\s+Square\s+extends\s+Rect\b/, `Keep ${c('class Square extends Rect')}.`], [/class\s+Triangle\s+extends\s+Shape\b/, `Keep ${c('class Triangle extends Shape')}.`], [/\.reduce\s*\(/, `Add up the areas with ${c('reduce')}.`]],
      hints: ['In Square, the constructor only needs super(side, side), and then this.name = "square".', 'For the total, map each shape to its area, then reduce the numbers with a starting value of 0.'],
      similar: { task: 'Pets that each make their own sound', code: 'class Pet {\n  sound() {\n    return "...";\n  }\n  speak() {\n    return `It says ${this.sound()}`;\n  }\n}\nclass Duck extends Pet {\n  sound() {\n    return "quack";\n  }\n}\nconst pets = [new Pet(), new Duck()];\npets.forEach((p) => console.log(p.speak()));' },
      gate: 'G',
    },
    js2_final: {
      title: 'The Undefined',
      desc: `<p><b>The Undefined</b> is coiled around the top of the tower, draining your team! Lumen has the team's data as JSON text in ${c('teamData')}. Use everything you learned in the Grid:</p>
        <ol><li>Finish ${c('class Hero')}: its constructor unpacks ${c('{ name, hp, power = 1 }')} from ${c('data')} (power <b>defaults</b> to 1) and stores each one on ${c('this')}. Add a <b>getter</b> ${c('alive')} that is ${c('true')} when ${c('hp &gt; 0')}.</li>
        <li>Add a <b>static</b> method ${c('Hero.from(data)')}: it returns ${c('new Mage(data)')} when ${c('data.type')} is ${c('"mage"')}, and ${c('new Hero(data)')} otherwise.</li>
        <li>Finish ${c('class Mage extends Hero')}: its ${c('attack()')} is double the hero's attack. Use ${c('super.attack()')}.</li>
        <li>${c('JSON.parse')} the team data and ${c('map')} every entry through ${c('Hero.from')} to make ${c('team')}.</li>
        <li>${c('filter')} the heroes who are ${c('alive')} and add up their ${c('attack()')} with ${c('reduce')} to get ${c('damage')}.</li></ol>
        <p>You need at least 60 damage, and the fallen heroes can't help.</p>`,
      starter: S.js2_final,
      check: printed(['Ada (Hero): alive true, attack 30', 'Bo (Mage): alive false, attack 100', 'Cy (Mage): alive true, attack 20', 'Dee (Hero): alive true, attack 10', 'Total damage: 60', 'The Undefined is defeated!'], {
        keep: S.js2_final.slice(S.js2_final.indexOf('// final strike')).replace("// final strike (don't change anything below)", TEST_MARK),
        tip: (got, i) => {
          const g = got[i] || '';
          if (/attack NaN/.test(g)) return 'An attack came out as <code>NaN</code>. Did you give <code>power</code> a default of 1 and store it on <code>this</code>?';
          if (/alive undefined/.test(g)) return 'Add the getter <code>get alive()</code> to Hero.';
          if (/^Total damage: 160/.test(g)) return 'Bo has fallen (0 hp) and can\'t attack. Filter out the heroes who are not alive.';
          if (/^Total damage: 0/.test(g) && i === 0) return 'The team is still empty. Parse <code>teamData</code> and map it through <code>Hero.from</code>.';
          if (/\(Hero\)/.test(g) && i === 1) return 'Bo should be a Mage. Check <code>Hero.from</code>.';
          return null;
        },
        success: 'Your team strikes as one: 60 damage! The Undefined shrinks, flickers, and becomes a single harmless <code>undefined</code>. <b>The Neon Grid is saved!</b>',
      }),
      require: [[/class\s+Mage\s+extends\s+Hero\b/, `Keep ${c('class Mage extends Hero')}.`], [/power\s*=\s*1\b/, `Unpack ${c('power')} with a default: ${c('{ name, hp, power = 1 }')}`], [/\bget\s+alive\s*\(/, `Add a getter to Hero: ${c('get alive() { ... }')}`], [/\bstatic\s+from\s*\(/, `Add a static method to Hero: ${c('static from(data) { ... }')}`], [/super\.attack\s*\(/, `Mage's ${c('attack()')} should use ${c('super.attack()')}.`], [/JSON\.parse\s*\(/, `Parse the team data with ${c('JSON.parse(teamData)')}.`], [/\.filter\s*\(/, `Use ${c('filter')} to keep only the heroes who are alive.`], [/\.reduce\s*\(/, `Add up the damage with ${c('reduce')}.`]],
      hints: ['In the constructor: const { name, hp, power = 1 } = data; then copy each one onto this.', 'JSON.parse(teamData) gives an array of plain objects. map turns each into a hero with Hero.from, then filter by alive and reduce the attacks.'],
      similar: { task: 'An item class that loads itself from JSON', code: 'class Item {\n  constructor({ name, price = 0 }) {\n    this.name = name;\n    this.price = price;\n  }\n  get label() {\n    return `${this.name}: ${this.price} coins`;\n  }\n  static fromJSON(text) {\n    return new Item(JSON.parse(text));\n  }\n}\nconsole.log(Item.fromJSON(\'{"name":"visor","price":30}\').label);\nconsole.log(Item.fromJSON(\'{"name":"pebble"}\').label);' },
      gate: 'H',
    },
  };

  // terminals whose test lines live in the starter: check the printed lines and that the tests were kept
  const printedTests = {
    js2_pass: [['16', '81', 'go!!'], { success: 'The signal rings through the relay twice. <b>The cliff steps appear!</b>' }],
    js2_mymap: [['[10, 20, 30]', '["A", "B"]', '[]'], {
      forbid: [[/\.map\s*\(/, `No ${c('.map')} here: build it yourself with a loop and ${c('push')}.`]],
      tip: (got, i) => i === 0 && got[0] === '[]' ? 'The result is still empty. Push <code>fn(item)</code> into it inside a loop.' : null,
      success: 'Your loom weaves exactly like the real <code>map</code>. Now you know its secret! <b>The lava cools.</b>',
    }],
    js2_booster: [['60', '11', '51'], { success: 'Each booster remembers its own amount. That is a closure! <b>The spring powers up!</b>' }],
    js2_counter: [['1', '2', '1', '3'], {
      tip: (got, i) => i === 2 && got[2] === '3' ? 'The south turnstile started at 3: both counters still share one count. Move <code>let count = 0;</code> inside <code>makeCounter</code>.' : null,
      success: 'Each turnstile keeps its own private count. <b>The gate opens!</b>',
    }],
    js2_locker: [['25', 'undefined', '0'], {
      tip: (got, i) => i === 1 && got[1] === '25' ? 'Anyone can still read <code>locker.coins</code>. Keep the coins in a <code>let</code> variable inside <code>makeLocker</code> instead of on the object.' : (i === 2 && got[2] === '25' ? 'The other locker sees the same coins! Each call of makeLocker needs its own variable.' : null),
      success: 'The coins are safe inside the closure, where nobody else can reach. <b>The spikes retract!</b>',
    }],
    js2_events: [['Screen: doors open', 'Screen: high score!', 'Speaker: HIGH SCORE!'], {
      tip: (got) => got.includes('Screen: nobody hears this') ? 'The quiet board should have no listeners. Keep the listeners inside makeBoard.' : null,
      success: 'Every machine in the arcade hears the news. You built an event system! <b>The way is open.</b>',
    }],
    js2_extends: [['Beep, I am Lumen', 'Lumen takes off!', 'true'], { success: 'The drone lifts off, still able to say hello. <b>The wall opens!</b>' }],
    js2_super: [['Racer { name: "Zip", speed: 10, boost: 5 }', '15'], {
      tip: (got, i) => i === 0 && /speed/.test(got[0] || '') === false && got[0] ? 'The Bike part is missing. Call <code>super(name)</code> first.' : null,
      success: 'Upgrade complete: top speed 15! <b>The climbing blocks appear!</b>',
    }],
    js2_override: [['Bolt is a robot.', 'Rex is a robot. Keep out!'], { success: 'KEEP OUT! booms from the speakers. <b>The bridge appears!</b>' }],
    js2_thermo: [['20', '25', '30', '10'], {
      tip: (got, i) => i === 0 && got[0] === 'undefined' ? 'Reading <code>t.temp</code> needs a getter: <code>get temp() { ... }</code>.' : (i === 2 && got[2] === '50' ? 'The setter must not let the temperature go above 30.' : (i === 3 && got[3] === '-5' ? 'The setter must not let the temperature go below 10.' : null)),
      success: 'A perfect 10 to 30 degrees, whatever anyone tries. <b>The spring powers up!</b>',
    }],
    js2_static: [['1 2 3', '3 units built', 'undefined'], { success: 'Serial numbers stamped, report filed. <b>The lava cools.</b>' }],
    js2_shapes: [['rect: 10', 'square: 9', 'triangle: 12', 'total: 31'], {
      tip: (got, i) => i === 1 && got[1] === 'rect: 9' ? 'Almost! Set <code>this.name = "square"</code> after calling super.' : null,
      success: 'Three holograms spin in the air, each computing its own area. <b>The gate opens!</b>',
    }],
  };
  for (const [id, [want, opts]] of Object.entries(printedTests)) challenges[id].check = printed(want, Object.assign({ keep: challenges[id].starter }, opts));

  // ---------------------------------------------------------------- levels
  const levels = [
    // ------------------------------------------------------------ 1. array methods
    {
      id: 'js2_lanes', name: 'Lambda Lanes', topic: 'Array Methods',
      blurb: 'Transform whole arrays at once with arrow functions, map, filter, reduce, find, some and every.',
      intro: `<p>The portal drops you onto a rooftop. Below you, the <b>Neon Grid</b> hums: a city where data races along glowing light-lanes like traffic.</p>
        <p>A little courier drone zips up to you. "Name's <b>Lumen</b>. You're the Coder who beat Segfault? Good. Something called <b>The Undefined</b> is loose in the Grid, and everywhere it goes, values turn into <code>undefined</code>."</p>
        <p>"Down here, nobody writes a whole loop for every little job. We hand the array a tiny function and let it do the work:"</p>
        <pre>const speeds = [40, 75, 90];\nconst fast = speeds.filter((s) => s > 60);\nconsole.log(fast); // [75, 90]</pre>`,
      tutorial: [
        { title: 'Arrow functions', body: '<p>An <b>arrow function</b> is a shorter way to write a function. These two do exactly the same job:</p><pre>function double(n) { return n * 2; }\nconst double = (n) => n * 2;</pre><p>When the body is a single value, you can skip the braces <b>and</b> the <code>return</code>: the value after <code>=&gt;</code> comes back automatically. If you do use braces, you need <code>return</code> again.</p>', code: 'const double = (n) => n * 2;\nconst add = (a, b) => a + b;\nconst greet = (name) => {\n  const msg = "Hi, " + name;\n  return msg;\n};\nconsole.log(double(4));\nconsole.log(add(2, 3));\nconsole.log(greet("Lumen"));' },
        { title: 'map: change every item', body: '<p><code>array.map(fn)</code> calls your function on <b>every item</b> and collects the answers into a <b>new array</b> of the same length.</p><p>The original array is not changed. Run it and compare the two lines.</p>', code: 'const prices = [3, 10, 25];\nconst doubled = prices.map((p) => p * 2);\nconsole.log(doubled);\nconsole.log(prices);\nconst names = ["ada", "bo"];\nconsole.log(names.map((n) => n.toUpperCase()));' },
        { title: 'filter: keep some items', body: '<p><code>array.filter(fn)</code> keeps only the items where your function returns <code>true</code>. The new array can be shorter, or even empty.</p>', code: 'const speeds = [40, 75, 90, 12];\nconst fast = speeds.filter((s) => s > 60);\nconsole.log(fast);\nconst words = ["neon", "a", "grid", "of"];\nconsole.log(words.filter((w) => w.length > 2));' },
        { title: 'reduce: boil it down to one value', body: '<p><code>array.reduce(fn, start)</code> walks through the array carrying a running result. Your function gets the result so far and the next item, and returns the new result.</p><p>The second argument is the <b>starting value</b>. Always give one: without it, <code>reduce</code> crashes on an empty array.</p>', code: 'const coins = [5, 10, 20];\nconst sum = coins.reduce((total, c) => total + c, 0);\nconsole.log(sum);\nconst none = [];\nconsole.log(none.reduce((total, c) => total + c, 0));' },
        { title: 'find, some and every', body: '<table class="cheat"><tr><td><code>find(fn)</code></td><td>the first item that matches, or <code>undefined</code></td></tr><tr><td><code>some(fn)</code></td><td><code>true</code> if <b>at least one</b> item matches</td></tr><tr><td><code>every(fn)</code></td><td><code>true</code> if <b>all</b> the items match</td></tr></table><p>They all stop early as soon as they know the answer.</p>', code: 'const lights = [80, 0, 100, 45];\nconsole.log(lights.find((l) => l > 90));\nconsole.log(lights.find((l) => l > 500));\nconsole.log(lights.some((l) => l === 0));\nconsole.log(lights.every((l) => l > 10));' },
        { title: 'Chaining', body: '<p><code>map</code> and <code>filter</code> give back arrays, so you can call the next method straight away. Put each step on its own line and read it top to bottom, like a recipe.</p>', code: 'const orders = [\n  { item: "visor", price: 30 },\n  { item: "gloves", price: 8 },\n  { item: "boots", price: 45 },\n];\nconst total = orders\n  .filter((o) => o.price > 10)\n  .map((o) => o.price)\n  .reduce((sum, p) => sum + p, 0);\nconsole.log(total);' },
      ],
      signs: [
        'Lumen: "Every terminal in the Lanes wants an array method. Reach for map, filter and reduce before you reach for a for loop."',
        'Lumen: "Curly braces after => mean you need a return. No braces, and the value comes back by itself."',
        'Lumen: "The Data Highway is just ahead. Chain the methods together, one step per line."',
      ],
      terminals: ['js2_arrow', 'js2_map', 'js2_filter', 'js2_reduce', 'js2_find', 'js2_scan', 'js2_highway'],
      map: (B) => {
        const m = B.MapBuilder(146, 17);
        m.fill(0, 15, 145, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'climb', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'bridge', 'B');
        m.put(x + 1, 14, 'e');
        x = B.room(m, x + 3, 3, 'spring', 'C');
        x = B.TR.pit(m, x + 1);
        m.put(x + 1, 14, '?'); m.put(x + 3, 14, 'K');
        x = B.room(m, x + 5, 4, 'spikes', 'D');
        x = B.TR.mover(m, x + 1);
        x = B.room(m, x + 1, 5, 'lava', 'E');
        m.put(x + 1, 10, 'w');
        x = B.room(m, x + 1, 6, 'wall', 'G');
        m.put(x + 2, 14, 'e'); m.put(x + 5, 14, '?');
        x = B.room(m, x + 7, 7, 'climb', 'H');
        m.put(x + 4, 14, 'F');
        return m;
      },
    },
    // ------------------------------------------------------------ 2. destructuring & spread
    {
      id: 'js2_docks', name: 'The Unpacking Docks', topic: 'Destructuring & Spread',
      blurb: 'Pull values out of arrays and objects in one line, collect leftovers with rest, and spread them into new ones.',
      intro: `<p>Lumen leads you down to the <b>Unpacking Docks</b>, where cargo drones drop crates of data all day long.</p>
        <p>"The Undefined has been here," Lumen buzzes. "The dock workers keep typing <code>crate.name</code>, <code>crate.size</code>, <code>crate.color</code>, one property at a time, and half of them come back <code>undefined</code>. Let me show you how the pros unpack."</p>
        <pre>const crate = { name: "chips", size: 3 };\nconst { name, size } = crate;\nconsole.log(\`\${name} x\${size}\`); // chips x3</pre>`,
      tutorial: [
        { title: 'Template literals', body: '<p>Text written between <b>backticks</b> <code>`like this`</code> is a <b>template literal</b>. Anything inside <code>${ }</code> is worked out and dropped into the text. No more gluing with <code>+</code>!</p>', code: 'const name = "Lumen";\nconst level = 4;\nconsole.log(`${name} is level ${level}`);\nconsole.log(`Next level: ${level + 1}`);' },
        { title: 'Unpacking arrays', body: '<p><b>Array destructuring</b> takes items out of an array by position, and puts each into its own variable. Leave a gap with a comma to skip an item.</p><p>It can even swap two variables in one line.</p>', code: 'const colors = ["pink", "cyan", "lime"];\nconst [first, second] = colors;\nconsole.log(first, second);\nconst [, , third] = colors;\nconsole.log(third);\nlet a = 1;\nlet b = 2;\n[a, b] = [b, a];\nconsole.log(a, b);' },
        { title: 'Unpacking objects', body: '<p><b>Object destructuring</b> takes properties out by <b>name</b>. The order does not matter, only the names.</p><ul><li><code>{ name: rider }</code> renames: it puts <code>name</code> into a variable called <code>rider</code>.</li><li><code>{ lights = 2 }</code> sets a <b>default</b>, used when the property is missing.</li></ul>', code: 'const bike = { name: "Zip", speed: 9 };\nconst { speed, name } = bike;\nconsole.log(name, speed);\nconst { name: rider } = bike;\nconsole.log(rider);\nconst { lights = 2 } = bike;\nconsole.log(lights);' },
        { title: 'Unpacking in the parameters', body: '<p>You can destructure right where a function receives its arguments. This is very common for functions that take a settings object.</p>', code: 'function describe({ name, speed = 1 }) {\n  return `${name} goes ${speed}`;\n}\nconsole.log(describe({ name: "Zip", speed: 9 }));\nconsole.log(describe({ name: "Slowpoke" }));' },
        { title: 'Rest: collect the leftovers', body: '<p>Three dots in a parameter list, <code>...nums</code>, <b>collect</b> all the remaining arguments into an array. The same works in destructuring, to grab "everything else".</p>', code: 'function sum(...nums) {\n  return nums.reduce((t, n) => t + n, 0);\n}\nconsole.log(sum(1, 2, 3));\nconsole.log(sum());\nconst [leader, ...others] = ["Ada", "Bo", "Cy"];\nconsole.log(leader);\nconsole.log(others);' },
        { title: 'Spread: unpack into something new', body: '<p>Anywhere else, the three dots <b>spread</b> things out: the items of an array into a new array, or the properties of an object into a new object.</p><p>When two objects share a property, the one written <b>last</b> wins. The originals are not changed.</p>', code: 'const a = [1, 2];\nconst b = [3, 4];\nconsole.log([...a, ...b, 5]);\nconst base = { color: "pink", speed: 5 };\nconst fast = { ...base, speed: 12 };\nconsole.log(fast);\nconsole.log(base);\nconsole.log(Math.max(...a, ...b));' },
      ],
      signs: [
        'Lumen: "Backticks, not quotes! Only text in `backticks` understands ${...}."',
        'Lumen: "Three dots do two jobs. In a parameter list they COLLECT (rest). Everywhere else they SPREAD."',
        'Lumen: "When you spread two objects together, the one on the right wins."',
      ],
      terminals: ['js2_tmpl', 'js2_swap', 'js2_objd', 'js2_defaults', 'js2_rest', 'js2_merge'],
      map: (B) => {
        const m = B.MapBuilder(148, 17);
        m.fill(0, 15, 147, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'spring', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'lava', 'B');
        m.put(x + 1, 14, 'e');
        x = B.TR.mover(m, x + 3);
        x = B.room(m, x + 1, 3, 'climb', 'C');
        m.put(x + 1, 14, '?'); m.put(x + 4, 14, 'K');
        x = B.TR.pit(m, x + 6);
        x = B.room(m, x + 1, 4, 'wall', 'D');
        x = B.TR.tower(m, x); m.put(x - 4, 5, 'w');
        x = B.room(m, x, 5, 'bridge', 'E');
        m.put(x + 2, 14, 'e');
        x = B.room(m, x + 4, 6, 'spikes', 'G');
        m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
        return m;
      },
    },
    // ------------------------------------------------------------ 3. objects & JSON
    {
      id: 'js2_vault', name: 'The JSON Vault', topic: 'Objects & JSON',
      blurb: 'Loop over objects with Object.entries, save and load data as JSON text, and read missing data safely.',
      intro: `<p>Deep under the Grid lies the <b>JSON Vault</b>, where the city keeps its memories: every save file, every score and every message, stored as plain text.</p>
        <p>"The Undefined chewed through the vault's index," Lumen says. "Half the records point at properties that aren't there any more. We need to walk through objects carefully, and turn them into text and back again."</p>
        <pre>const save = { hero: "Ada", level: 3 };\nconsole.log(JSON.stringify(save)); // {"hero":"Ada","level":3}</pre>`,
      tutorial: [
        { title: 'Keys and values', body: '<p><code>Object.keys(obj)</code> gives you an array of an object\'s property names. <code>Object.values(obj)</code> gives you an array of its values.</p><p>Once you have an array, all your array methods work on it!</p>', code: 'const stock = { chips: 3, cables: 5, fuses: 2 };\nconsole.log(Object.keys(stock));\nconsole.log(Object.values(stock));\nconsole.log(Object.keys(stock).length);' },
        { title: 'Entries: keys and values together', body: '<p><code>Object.entries(obj)</code> gives you an array of <b>pairs</b>: <code>[key, value]</code>. Loop over it with <code>for...of</code> and unpack each pair straight away with array destructuring.</p>', code: 'const stock = { chips: 3, cables: 5 };\nconsole.log(Object.entries(stock));\nfor (const [item, count] of Object.entries(stock)) {\n  console.log(`${item} -> ${count}`);\n}' },
        { title: 'From pairs back to an object', body: '<p><code>Object.fromEntries(pairs)</code> does the opposite: it builds an object from an array of <code>[key, value]</code> pairs.</p><p>Together with <code>map</code> that gives a neat recipe for changing every value of an object.</p>', code: 'const pairs = [["pink", 1], ["cyan", 2]];\nconsole.log(Object.fromEntries(pairs));\nconst stock = { chips: 3, cables: 5 };\nconst more = Object.fromEntries(Object.entries(stock).map(([k, v]) => [k, v + 10]));\nconsole.log(more);' },
        { title: 'Shorthand properties', body: '<p>When a variable has the same name as the property you want, you can write it once: <code>{ name, level }</code> means <code>{ name: name, level: level }</code>.</p>', code: 'const name = "Ada";\nconst level = 3;\nconst hero = { name, level };\nconsole.log(hero);' },
        { title: 'JSON: objects as text', body: '<p><b>JSON</b> is a way to write data as plain text, so it can be saved to a file or sent across the internet.</p><ul><li><code>JSON.stringify(value)</code> turns a value into JSON text.</li><li><code>JSON.parse(text)</code> turns JSON text back into a value.</li></ul><p>In JSON, keys and strings always use double quotes.</p>', code: 'const save = { hero: "Ada", level: 3, items: ["visor"] };\nconst text = JSON.stringify(save);\nconsole.log(text);\nconst back = JSON.parse(text);\nconsole.log(back.items[0]);\nconsole.log(JSON.parse("[1, 2, 3]").length);' },
        { title: 'Safe reading with ?. and ??', body: '<p>Reading a property of <code>undefined</code> crashes. <b>Optional chaining</b> <code>a?.b</code> stops and gives <code>undefined</code> instead, if <code>a</code> is missing.</p><p>The <code>??</code> operator then swaps <code>null</code> or <code>undefined</code> for a fallback value.</p>', code: 'const ada = { name: "Ada", pet: { name: "Byte" } };\nconst bo = { name: "Bo" };\nconsole.log(ada.pet?.name);\nconsole.log(bo.pet?.name);\nconsole.log(bo.pet?.name ?? "no pet");' },
      ],
      signs: [
        'Lumen: "Objects are not arrays, but Object.keys, Object.values and Object.entries turn them into arrays. Then every array trick works."',
        'Lumen: "JSON is just text. You can\'t use .name on text until you JSON.parse it."',
        'Lumen: "Records with holes in them? Read them with ?. and you\'ll never crash."',
      ],
      terminals: ['js2_keys', 'js2_entries', 'js2_surge', 'js2_json', 'js2_optional', 'js2_leaders'],
      map: (B) => {
        const m = B.MapBuilder(152, 17);
        m.fill(0, 15, 151, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'wall', 'A');
        x = B.TR.hills(m, x);
        m.put(x + 1, 14, 'e');
        x = B.room(m, x + 3, 2, 'spikes', 'B');
        x = B.TR.mover(m, x + 1);
        x = B.room(m, x + 1, 3, 'lava', 'C');
        m.put(x + 1, 14, '?'); m.put(x + 4, 14, 'K');
        x = B.TR.tower(m, x + 6); m.put(x - 3, 5, 'w');
        x = B.room(m, x, 4, 'spring', 'D');
        x = B.TR.pit(m, x + 1);
        x = B.room(m, x + 1, 5, 'wall', 'E');
        m.put(x + 2, 14, 'e'); m.put(x + 5, 14, '?');
        x = B.room(m, x + 7, 6, 'climb', 'G');
        x = B.TR.hills(m, x);
        m.put(x + 4, 14, 'F');
        return m;
      },
    },
    // ------------------------------------------------------------ 4. closures & callbacks
    {
      id: 'js2_arcade', name: 'The Echo Arcade', topic: 'Closures & Callbacks',
      blurb: 'Pass functions around, build functions that make functions, and hide private state inside closures.',
      intro: `<p>The <b>Echo Arcade</b> is the loudest place in the Grid. Every machine calls out to another machine, which calls another, which calls you back.</p>
        <p>"In JavaScript, a function is a <b>value</b>, just like a number," Lumen explains. "You can keep one in a variable, hand it to another function, or build a brand new function and send it back. And a function never forgets the place where it was made."</p>
        <pre>function makeGreeter(greeting) {\n  return (name) => \`\${greeting}, \${name}!\`;\n}\nconst hi = makeGreeter("Hi");\nconsole.log(hi("Ada")); // Hi, Ada!</pre>
        <p>"The Undefined's trail runs straight through here. Follow it."</p>`,
      tutorial: [
        { title: 'Functions are values', body: '<p>A function can be stored in a variable, just like a number or a string. Without brackets, <code>shout</code> means "the function itself". With brackets, <code>shout("hey")</code> means "run it".</p>', code: 'function shout(text) {\n  return text.toUpperCase() + "!";\n}\nconst yell = shout;\nconsole.log(yell("hey"));\nconsole.log(shout);' },
        { title: 'Callbacks', body: '<p>A <b>callback</b> is a function you hand to another function, so that it can call it later. You have already used callbacks: the arrow functions you gave to <code>map</code> and <code>filter</code>!</p>', code: 'function doTwice(action) {\n  action();\n  action();\n}\ndoTwice(() => console.log("beep"));\n["a", "b"].forEach((x) => console.log("item", x));' },
        { title: 'Writing a higher-order function', body: '<p>A function that takes (or returns) another function is called a <b>higher-order function</b>. Here <code>repeat</code> decides <i>how often</i>, and the callback decides <i>what happens</i>.</p>', code: 'function repeat(times, fn) {\n  for (let i = 1; i <= times; i++) {\n    fn(i);\n  }\n}\nrepeat(3, (i) => console.log(`round ${i}`));' },
        { title: 'Functions that make functions', body: '<p>A function can build a new function and <b>return</b> it. Each one it builds remembers the values it was made with.</p>', code: 'function makeAdder(amount) {\n  return (n) => n + amount;\n}\nconst add5 = makeAdder(5);\nconst add100 = makeAdder(100);\nconsole.log(add5(1));\nconsole.log(add100(1));' },
        { title: 'Closures remember', body: '<p>A function remembers the variables around the place where it was created, even after the outer function has finished. That is a <b>closure</b>.</p><p>Here <code>count</code> lives inside <code>makeCounter</code>. Nobody outside can touch it, and each counter gets its own.</p>', code: 'function makeCounter() {\n  let count = 0;\n  return () => {\n    count += 1;\n    return count;\n  };\n}\nconst a = makeCounter();\nconst b = makeCounter();\nconsole.log(a(), a(), a());\nconsole.log(b());' },
        { title: 'Common mistake: calling instead of passing', body: '<p>To pass a function, write its name <b>without</b> brackets. <code>doTwice(sayHi())</code> runs <code>sayHi</code> straight away and passes its result (<code>undefined</code>), so <code>doTwice</code> crashes.</p><p>Run it to see the error, then remove the <code>()</code> after <code>sayHi</code>.</p>', code: 'function sayHi() {\n  console.log("hi");\n}\nfunction doTwice(action) {\n  action();\n  action();\n}\ndoTwice(sayHi());', expectError: true },
      ],
      signs: [
        'Lumen: "In this arcade the test lines are already written at the bottom of each terminal. Leave them alone and make them work!"',
        'Lumen: "A variable made INSIDE a function is private to the functions created there. That is how closures keep secrets."',
        'Lumen: "The Event Board is the last machine. Callbacks stored now, called later: that is how real apps react to clicks."',
      ],
      terminals: ['js2_pass', 'js2_mymap', 'js2_booster', 'js2_counter', 'js2_locker', 'js2_events'],
      map: (B) => {
        const m = B.MapBuilder(158, 17);
        m.fill(0, 15, 157, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'climb', 'A');
        x = B.TR.pit(m, x + 1);
        x = B.room(m, x + 1, 2, 'lava', 'B');
        m.put(x + 1, 14, 'e');
        x = B.TR.hills(m, x + 3);
        x = B.room(m, x, 3, 'spring', 'C');
        m.put(x + 1, 14, '?'); m.put(x + 4, 14, 'K');
        x = B.TR.mover(m, x + 6);
        x = B.room(m, x + 1, 4, 'wall', 'D');
        x = B.TR.tower(m, x); m.put(x - 4, 5, 'w');
        x = B.room(m, x, 5, 'spikes', 'E');
        m.put(x + 2, 14, 'e');
        x = B.TR.hills(m, x + 4);
        m.put(x + 1, 14, '?');
        x = B.room(m, x + 3, 6, 'bridge', 'G');
        m.put(x + 2, 10, 'w');
        m.put(x + 6, 14, 'F');
        return m;
      },
    },
    // ------------------------------------------------------------ 5. classes, deeper (final)
    {
      id: 'js2_tower', name: 'The Core Tower', topic: 'Classes, Deeper',
      blurb: 'Extend classes, call super, add getters, setters and static members, then use the whole Grid to defeat The Undefined.',
      intro: `<p>At the centre of the Grid stands the <b>Core Tower</b>, a skyscraper of pure light. The Undefined is coiled around the top, and one by one the tower's machines are going dark.</p>
        <p>"Every machine in the tower is built from <b>classes</b>," Lumen says. "Not single blueprints like the ones you made in Syntaxia: whole families of them. A <code>Drone</code> is a kind of <code>Robot</code>. It gets everything a Robot has, then adds its own tricks."</p>
        <pre>class Robot {\n  constructor(name) {\n    this.name = name;\n  }\n}\nclass Drone extends Robot {\n  fly() {\n    return \`\${this.name} takes off!\`;\n  }\n}\nconsole.log(new Drone("Lumen").fly());</pre>
        <p>"Climb the tower, use everything you've learned in the Grid, and send that thing back to <code>undefined</code> where it belongs."</p>`,
      tutorial: [
        { title: 'extends: a class based on another', body: '<p><code>class Drone extends Robot</code> makes <code>Drone</code> a <b>child class</b> of <code>Robot</code>. A drone gets every method a robot has, plus the new ones you add.</p><p><code>instanceof</code> checks whether an object was made from a class (or one of its children).</p>', code: 'class Robot {\n  constructor(name) {\n    this.name = name;\n  }\n  hello() {\n    return `Beep, I am ${this.name}`;\n  }\n}\n\nclass Drone extends Robot {\n  fly() {\n    return `${this.name} takes off!`;\n  }\n}\n\nconst d = new Drone("Lumen");\nconsole.log(d.hello());\nconsole.log(d.fly());\nconsole.log(d instanceof Robot);' },
        { title: 'super(): the parent constructor', body: '<p>If a child class has its own <code>constructor</code>, it must call <code>super(...)</code> first. That runs the parent\'s constructor, so the parent\'s part of the object gets set up. Only after that can you use <code>this</code>.</p>', code: 'class Bike {\n  constructor(name) {\n    this.name = name;\n    this.speed = 10;\n  }\n}\n\nclass Racer extends Bike {\n  constructor(name, boost) {\n    super(name);\n    this.boost = boost;\n  }\n}\n\nconsole.log(new Racer("Zip", 5));' },
        { title: 'Overriding methods', body: '<p>If a child class has a method with the <b>same name</b> as the parent, the child\'s version wins. Inside it, <code>super.method()</code> still calls the parent\'s version, so you can build on it instead of copying it.</p>', code: 'class Robot {\n  speak() {\n    return "Beep.";\n  }\n}\n\nclass Singer extends Robot {\n  speak() {\n    return super.speak() + " La la la!";\n  }\n}\n\nconsole.log(new Robot().speak());\nconsole.log(new Singer().speak());' },
        { title: 'Getters and setters', body: '<p>A <b>getter</b> (<code>get</code>) looks like a property from outside, but runs a method when you read it. A <b>setter</b> (<code>set</code>) runs when you assign to it, so it can check the value first.</p><p>The real value is usually kept in a property with an underscore, like <code>_hp</code>.</p>', code: 'class Hero {\n  constructor() {\n    this._hp = 10;\n  }\n  get hp() {\n    return this._hp;\n  }\n  set hp(value) {\n    if (value < 0) {\n      value = 0;\n    }\n    this._hp = value;\n  }\n  get alive() {\n    return this._hp > 0;\n  }\n}\n\nconst h = new Hero();\nh.hp = -7;\nconsole.log(h.hp);\nconsole.log(h.alive);' },
        { title: 'Static: belongs to the class', body: '<p>A <code>static</code> field or method belongs to the <b>class itself</b>, not to the objects made from it. You use it through the class name: <code>Robot.count</code>, <code>Robot.make()</code>.</p><p>Static methods are great as "factories" that build objects for you.</p>', code: 'class Robot {\n  static count = 0;\n  constructor(name) {\n    this.name = name;\n    Robot.count += 1;\n  }\n  static make(name) {\n    return new Robot(name.toUpperCase());\n  }\n}\n\nconst r = Robot.make("bolt");\nnew Robot("zip");\nconsole.log(r.name);\nconsole.log(Robot.count);\nconsole.log(r.count);' },
        { title: 'Common mistake: forgetting super()', body: '<p>A child constructor that uses <code>this</code> before calling <code>super()</code> crashes. Run it to see the error, then add <code>super();</code> as the first line of the <code>B</code> constructor.</p>', code: 'class A {\n  constructor() {\n    this.x = 1;\n  }\n}\n\nclass B extends A {\n  constructor() {\n    this.y = 2;\n  }\n}\n\nconsole.log(new B());', expectError: true },
      ],
      signs: [
        'Lumen: "Each floor of the tower adds one class trick. The top floor needs all of them at once."',
        'Lumen: "A child constructor must call super() before it touches this. Remember that, and the tower is yours."',
        'Lumen: "The Undefined is just above. Parse, map, filter, reduce, and strike with your whole team!"',
        'Lumen: "You did it! The Neon Grid is shining again. Step into the portal, Coder."',
      ],
      terminals: ['js2_extends', 'js2_super', 'js2_override', 'js2_thermo', 'js2_static', 'js2_shapes', 'js2_final'],
      map: (B) => {
        const m = B.MapBuilder(164, 17);
        m.fill(0, 15, 163, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'wall', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'climb', 'B');
        m.put(x + 3, 14, 'e');
        x = B.TR.mover(m, x + 7);
        x = B.room(m, x + 1, 3, 'bridge', 'C');
        x = B.room(m, x + 1, 4, 'spring', 'D');
        m.put(x + 1, 14, '?'); m.put(x + 4, 14, 'K');
        x = B.TR.pit(m, x + 6);
        x = B.room(m, x + 1, 5, 'lava', 'E');
        m.put(x + 2, 10, 'w');
        x = B.TR.hills(m, x + 1);
        x = B.room(m, x, 6, 'wall', 'G');
        m.put(x + 2, 14, 'e'); m.put(x + 5, 14, '?');
        x = B.room(m, x + 7, 7, 'spikes', 'H');
        m.put(x + 1, 14, '?'); m.put(x + 5, 14, 'F');
        return m;
      },
    },
  ];

  GD.addChapter2('javascript', {
    title: 'The Neon Grid',
    blurb: 'Race through a glowing city of data and master modern JavaScript: array methods, destructuring, JSON, closures and class families.',
    outro: '<p>The last light-lane flickers back on. With a final crackle, The Undefined shrinks into one tiny, harmless <code>undefined</code>, and Lumen sweeps it into the recycle bin.</p><p>"Look at you," Lumen beeps. "Arrow functions, <code>map</code>, <code>filter</code> and <code>reduce</code>. Destructuring and spread. JSON. Closures. Class families with <code>super</code>, getters and statics. That is how real JavaScript is written, out there in the real world."</p><p><b>The Neon Grid is saved.</b> Its lights will keep shining for you, any time you want to come back.</p>',
    theme: 'neon',
    challenges,
    levels,
  });
})(typeof window !== 'undefined' ? window : globalThis);
