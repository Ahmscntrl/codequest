/* CodeQuest — level maps, terminal challenges, and glitch (bug) snippets. */
(function (root) {
  'use strict';

  // ------------------------------------------------------------ helpers
  function MapBuilder(w, h) {
    const g = Array.from({ length: h }, () => Array(w).fill('.'));
    const api = {
      w, h,
      fill(x1, y1, x2, y2, ch) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (g[y] && x >= 0 && x < w) g[y][x] = ch; return api; },
      put(x, y, s) { for (let i = 0; i < s.length; i++) if (g[y] && x + i < w) g[y][x + i] = s[i]; return api; },
      rows() { return g.map(r => r.join('')); },
    };
    return api;
  }
  const isJS = (ctx) => ctx.lang === 'javascript';
  const fn = (n, ctx) => (isJS(ctx) ? CodeRunner.camel(n) : n);
  const c = (s) => `<code>${s}</code>`;
  const show = (v) => JSON.stringify(v);
  const hasLoop = (code, ctx) => isJS(ctx) ? /\b(for|while)\s*\(|\.forEach\s*\(|\.map\s*\(/.test(stripComments(code, ctx)) : /\b(for|while)\b/.test(stripComments(code, ctx));
  function stripComments(code, ctx) {
    return isJS(ctx) ? code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '') : code.replace(/#.*$/gm, '');
  }
  const printFn = (ctx) => isJS(ctx) ? 'console.log' : 'print';
  const actionsOf = (run, name) => run.actions.filter(a => a.fn === name);
  const firstErr = (runs) => runs.find(r => r.error);
  function randomWord() {
    const syl = ['ka', 'zu', 'mi', 'ro', 'tek', 'byt', 'lo', 'qua', 'nix', 'vo', 'pi', 'xel'];
    let s = '';
    for (let i = 0; i < 3; i++) s += syl[Math.floor(Math.random() * syl.length)];
    return s + Math.floor(Math.random() * 90 + 10);
  }

  // ------------------------------------------------------------ challenges
  // Each challenge: title, desc(ctx), starter, api, globals(ctx), tests(ctx), callTests, check(runs, ctx, code) -> {ok, msg}, hints
  const CH = {};

  CH.hello = {
    title: 'The Greeting Gate',
    desc: (ctx) => `<p>This old gate only opens for programmers. Every programmer's first words are <b>"Hello, World"</b>.</p>
      <p>Use ${c(printFn(ctx) + '(...)')} to make the computer say it.</p>`,
    starter: { python: '# Make the computer say hello!\n# Text goes inside quotes, like "this".\n\n', javascript: '// Make the computer say hello!\n// Text goes inside quotes, like "this".\n\n' },
    api: [],
    check(runs) {
      const r = runs[0];
      if (!r.output.length) return { ok: false, msg: `Nothing was printed. Try ${c('print("Hello, World")')}.` };
      const ok = r.output.some(l => /^\s*hello\s*,?\s*world\s*[!.]?\s*$/i.test(l));
      if (!ok) return { ok: false, msg: `The gate heard <b>${escapeHTML(r.output.join(' / '))}</b>, but it's listening for <b>Hello, World</b>.` };
      return { ok: true, msg: 'The gate recognises a fellow programmer. <b>Gate unlocked!</b>' };
    },
    hints: {
      python: ['print is a function: it needs parentheses ( ).', 'Text needs quotes around it: "Hello, World"', 'print("Hello, World")'],
      javascript: ['In JavaScript you print with console.log(...).', 'Text needs quotes around it: "Hello, World"', 'console.log("Hello, World");'],
    },
    effect: (game) => game.openGate('A'),
  };

  CH.bridge = {
    title: 'The Bridge Builder',
    requires: (ctx) => ctx.vars.planks === undefined ? 'The builder needs materials! Go collect the glowing <b>planks</b> box first.' : null,
    desc: (ctx) => `<p>You collected a variable! ${c('planks')} now holds the number <b>${ctx.vars.planks}</b>.</p>
      <p>A variable is a <b>named box</b> that stores a value. Instead of typing the number, use the box's name.</p>
      <p>Call ${c(fn('build_bridge', ctx) + '(planks)')} to build a bridge over the lava.</p>`,
    starter: { python: '# planks is a variable you collected.\n# Print it to peek inside:\nprint(planks)\n\n# Now build the bridge with it!\n', javascript: '// planks is a variable you collected.\n// Print it to peek inside:\nconsole.log(planks);\n\n// Now build the bridge with it!\n' },
    api: ['build_bridge'],
    check(runs, ctx, code) {
      const r = runs[0];
      const calls = actionsOf(r, 'build_bridge');
      if (!calls.length) return { ok: false, msg: `The bridge wasn't built. Call ${c(fn('build_bridge', ctx) + '(planks)')}.` };
      const n = calls[calls.length - 1].args[0];
      if (typeof n !== 'number') return { ok: false, msg: `${c(fn('build_bridge', ctx))} needs a number of planks, but got ${escapeHTML(show(n))}.` };
      if (n < ctx.vars.planks) return { ok: false, msg: `Only ${n} planks — the gap needs ${ctx.vars.planks}. Use the variable ${c('planks')}!` };
      if (n > ctx.vars.planks) return { ok: false, msg: `You don't have ${n} planks! You only collected ${ctx.vars.planks}.` };
      const tip = /\bplanks\b/.test(stripComments(code, ctx).replace(/print\s*\(\s*planks\s*\)|console\.log\s*\(\s*planks\s*\)/g, '')) ? '' : ' <i>(Tip: next time pass the variable name <code>planks</code> instead of the number.)</i>';
      return { ok: true, msg: 'Planks fly into place. <b>Bridge built!</b>' + tip, data: { n } };
    },
    hints: {
      python: ['Functions are called with parentheses: name(value)', 'You can pass a variable into a function: build_bridge(planks)'],
      javascript: ['Functions are called with parentheses: name(value)', 'You can pass a variable into a function: buildBridge(planks);'],
    },
    effect: (game, data) => game.buildBridge((data && data.n) || 99),
  };

  CH.password = {
    title: 'The Whispering Lock',
    requires: (ctx) => ctx.vars.password === undefined ? 'This lock wants a <b>password</b>. One is glowing somewhere nearby — collect it!' : null,
    desc: (ctx) => `<p>The lock needs the secret stored in your ${c('password')} variable.</p>
      <p>The password is different for every adventurer, so don't type it — <b>print the variable</b>!</p>`,
    starter: { python: '# Print the variable password (no quotes around a variable name!)\n', javascript: '// Print the variable password (no quotes around a variable name!)\n' },
    api: [],
    check(runs, ctx, code) {
      const r = runs[0];
      const pw = ctx.vars.password;
      if (stripComments(code, ctx).includes(pw)) return { ok: false, msg: "Sneaky! But the lock only trusts the variable. Print <code>password</code> instead of typing the secret." };
      if (r.output.some(l => l.trim() === 'password')) return { ok: false, msg: 'You printed the <i>word</i> "password". Remove the quotes so you print what is <i>inside</i> the variable.' };
      if (!r.output.some(l => l.trim() === pw)) return { ok: false, msg: `The lock didn't hear the password. Try ${c(printFn(ctx) + '(password)')}.` };
      return { ok: true, msg: `The lock whispers "<b>${escapeHTML(pw)}</b>"... <b>Unlocked!</b>` };
    },
    hints: {
      python: ['"password" (with quotes) is just text. password (no quotes) is the variable.', 'print(password)'],
      javascript: ['"password" (with quotes) is just text. password (no quotes) is the variable.', 'console.log(password);'],
    },
    effect: (game) => game.openGate('A'),
  };

  CH.guard = {
    title: 'The Guard Bot',
    desc: (ctx) => `<p>The guard bot lets friends in and keeps bugs out. The variable ${c('visitor')} holds the name of whoever is at the gate, and ${c(fn('my_name', ctx))} holds <b>your</b> name.</p>
      <p>If the visitor is you, call ${c(fn('open_gate', ctx) + '()')}. Otherwise call ${c(fn('sound_alarm', ctx) + '()')}.</p>
      <p>The bot will test your code with <b>3 different visitors</b>.</p>`,
    starter: {
      python: '# Compare with == (two equals signs)\nif visitor == my_name:\n    # what should happen here?\n    pass\nelse:\n    pass\n',
      javascript: '// Compare with === (three equals signs)\nif (visitor === myName) {\n  // what should happen here?\n} else {\n\n}\n',
    },
    api: ['open_gate', 'sound_alarm'],
    tests: (ctx) => [ctx.name, 'Bug', 'Glitchy McVirus'].map(v => ({ label: `visitor = ${show(v)}`, globals: { visitor: v }, expect: v === ctx.name ? 'open_gate' : 'sound_alarm' })),
    check(runs, ctx) {
      for (let i = 0; i < runs.length; i++) {
        const r = runs[i], t = runs.tests[i];
        const did = r.actions.map(a => a.fn);
        if (!did.length) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): nothing happened. Call ${c(fn(t.expect, ctx) + '()')} inside your if/else.` };
        if (did.includes('open_gate') && did.includes('sound_alarm')) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): you opened the gate <i>and</i> sounded the alarm! Only one should happen.` };
        if (did[0] !== t.expect) return { ok: false, msg: t.expect === 'open_gate' ? `Test ${i + 1}: <b>you</b> were at the gate but it stayed shut!` : `Test ${i + 1} (${escapeHTML(t.label)}): you let a <b>bug</b> in! 🐛` };
      }
      return { ok: true, msg: 'All 3 visitors handled correctly. The guard bot salutes you. <b>Gate open!</b>' };
    },
    hints: {
      python: ['Inside the if block, call open_gate(). Inside the else block, call sound_alarm().', 'if visitor == my_name:\n    open_gate()\nelse:\n    sound_alarm()'],
      javascript: ['Inside the if block, call openGate(). Inside the else block, call soundAlarm().', 'if (visitor === myName) {\n  openGate();\n} else {\n  soundAlarm();\n}'],
    },
    effect: (game) => game.openGate('A'),
  };

  CH.pump = {
    title: 'The Lava Pump',
    desc: (ctx) => `<p>The lava pump reads ${c('temperature')} and must react:</p>
      <ul><li>above <b>100</b> → ${c(fn('cool', ctx) + '()')}</li><li>below <b>0</b> → ${c(fn('heat', ctx) + '()')}</li><li>anything else → ${c(fn('wait', ctx) + '()')}</li></ul>
      <p>Use ${c('if')}, ${c(isJS(ctx) ? 'else if' : 'elif')} and ${c('else')}. It will be tested with 5 temperatures. Get it right and the lava turns to stone!</p>`,
    starter: {
      python: 'if temperature > 100:\n    cool()\n# add an elif for below 0...\n# ...and an else for everything else\n',
      javascript: 'if (temperature > 100) {\n  cool();\n}\n// add an else if for below 0...\n// ...and an else for everything else\n',
    },
    api: ['cool', 'heat', 'wait'],
    tests: () => [150, -20, 50, 100, 0].map(t => ({ label: `temperature = ${t}`, globals: { temperature: t }, expect: t > 100 ? 'cool' : t < 0 ? 'heat' : 'wait' })),
    check(runs, ctx) {
      for (let i = 0; i < runs.length; i++) {
        const r = runs[i], t = runs.tests[i];
        const did = r.actions.map(a => a.fn);
        if (did.length !== 1 || did[0] !== t.expect) {
          const what = did.length ? did.map(d => fn(d, ctx) + '()').join(' and ') : 'nothing';
          return { ok: false, msg: `Test ${i + 1} (<b>${t.label}</b>): expected ${c(fn(t.expect, ctx) + '()')} but your code did ${c(what)}.` + (t.globals.temperature === 100 ? ' <i>Careful: 100 is not <u>above</u> 100.</i>' : '') };
        }
      }
      return { ok: true, msg: 'The pump hums. The lava cools into solid stone! <b>Path clear.</b>' };
    },
    hints: {
      python: ['elif means "else if": it is only checked if the first condition was False.', 'if temperature > 100:\n    cool()\nelif temperature < 0:\n    heat()\nelse:\n    wait()'],
      javascript: ['"else if" is only checked if the first condition was false.', 'if (temperature > 100) {\n  cool();\n} else if (temperature < 0) {\n  heat();\n} else {\n  wait();\n}'],
    },
    effect: (game) => game.coolLava(),
  };

  CH.stairs = {
    title: 'The Staircase Engine',
    requires: (ctx) => ctx.save.foundI ? null : 'The engine blinks: <b>"COUNTER NOT FOUND."</b><br>Loops need a counter to keep track... Your little friend <b>i</b> is lost somewhere in this level. Find them first!',
    desc: (ctx) => `<p>The cliff is 6 blocks high. ${c(fn('build_step', ctx) + '(n)')} builds the step at position ${c('n')} (0 is the first step).</p>
      <p>You <i>could</i> write it 6 times... or let your friend <b>i</b> count for you with a <b>loop</b>!</p>
      <p>${isJS(ctx) ? c('for (let i = 0; i < 6; i++) { ... }') : c('for i in range(6):')} runs the code inside 6 times, with ${c('i')} = 0, 1, 2, 3, 4, 5.</p>`,
    starter: {
      python: '# i will count 0, 1, 2, 3, 4, 5 for you\nfor i in range(6):\n    print("i is", i)\n    # build a step here!\n',
      javascript: '// i will count 0, 1, 2, 3, 4, 5 for you\nfor (let i = 0; i < 6; i++) {\n  console.log("i is", i);\n  // build a step here!\n}\n',
    },
    api: ['build_step'],
    check(runs, ctx, code) {
      const r = runs[0];
      const ks = new Set(actionsOf(r, 'build_step').map(a => a.args[0]));
      if (!ks.size) return { ok: false, msg: `No steps were built. Call ${c(fn('build_step', ctx) + '(i)')} inside the loop.` };
      const missing = [0, 1, 2, 3, 4, 5].filter(k => !ks.has(k));
      if (missing.length) return { ok: false, msg: `Steps missing at positions ${missing.join(', ')}. You need steps 0 through 5.` };
      if (!hasLoop(code, ctx)) return { ok: false, msg: 'That works... but <b>i</b> looks sad. 🥺 Use a <b>loop</b> so i can help!' };
      return { ok: true, msg: 'i hops up each step as it appears. <b>Staircase built!</b>' };
    },
    hints: {
      python: ['Code indented under the for line runs once per loop.', 'for i in range(6):\n    build_step(i)'],
      javascript: ['Code inside the { } runs once per loop.', 'for (let i = 0; i < 6; i++) {\n  buildStep(i);\n}'],
    },
    effect: (game) => game.buildStairs(6),
  };

  CH.countdown = {
    title: 'The Launch Pad',
    desc: (ctx) => `<p>The launch pad needs a countdown! Print:</p><pre>5\n4\n3\n2\n1\nLiftoff!</pre>
      <p>Use a loop that counts <b>down</b>. ${isJS(ctx) ? `Hint: ${c('i--')} subtracts 1.` : `Hint: ${c('range(5, 0, -1)')} counts 5, 4, 3, 2, 1. Or use a ${c('while')} loop.`}</p>`,
    starter: {
      python: '# Count down from 5 to 1, then print "Liftoff!"\n',
      javascript: '// Count down from 5 to 1, then print "Liftoff!"\n',
    },
    api: [],
    check(runs, ctx, code) {
      const out = runs[0].output.map(s => s.trim());
      const want = ['5', '4', '3', '2', '1'];
      const nums = out.slice(0, 5);
      if (want.some((w, i) => nums[i] !== w)) return { ok: false, msg: `Expected the countdown 5, 4, 3, 2, 1 (one per line) but got: <b>${escapeHTML(out.slice(0, 6).join(', ') || 'nothing')}</b>` };
      if (!out[5] || !/^lift\s*off!?$/i.test(out[5])) return { ok: false, msg: 'Great countdown! Now print <b>Liftoff!</b> after the loop.' };
      if (!hasLoop(code, ctx)) return { ok: false, msg: 'The pad wants a real loop, not 5 separate prints!' };
      return { ok: true, msg: '🚀 <b>Liftoff!</b> The launch pads are charged. Jump on a glowing spring!' };
    },
    hints: {
      python: ['range(start, stop, step) — the stop number is NOT included.', 'for i in range(5, 0, -1):\n    print(i)\nprint("Liftoff!")'],
      javascript: ['Start at 5, keep going while i >= 1, and do i-- each time.', 'for (let i = 5; i >= 1; i--) {\n  console.log(i);\n}\nconsole.log("Liftoff!");'],
    },
    effect: (game) => game.activateSprings(),
  };

  CH.double = {
    title: 'The Doubling Forge',
    desc: (ctx) => `<p>A <b>function</b> is a reusable mini-program. You give it inputs and it <b>returns</b> an answer.</p>
      <p>Define a function ${c('double')} that takes a number ${c('n')} and returns ${c('n * 2')}. The forge will test it with several numbers, then build the bridge.</p>`,
    starter: {
      python: 'def double(n):\n    # give back n times 2\n    pass\n\nprint(double(4))  # should be 8\n',
      javascript: 'function double(n) {\n  // give back n times 2\n}\n\nconsole.log(double(4)); // should be 8\n',
    },
    api: [],
    callTests: [{ fn: 'double', args: [3] }, { fn: 'double', args: [10] }, { fn: 'double', args: [-4] }, { fn: 'double', args: [0] }],
    check(runs, ctx) { return checkCalls(runs[0], this.callTests, [6, 20, -8, 0], ctx, 'double'); },
    hints: {
      python: ['Use the return keyword to give a value back.', 'def double(n):\n    return n * 2'],
      javascript: ['Use the return keyword to give a value back.', 'function double(n) {\n  return n * 2;\n}'],
    },
    effect: (game) => game.buildBridge(99),
  };

  CH.greet = {
    title: 'The Polite Door',
    desc: (ctx) => `<p>This door only opens for well-mannered code. Write a function ${c('greet')} that takes a ${c('name')} and returns a greeting like this:</p>
      <pre>greet("Ada")  →  "Hello, Ada!"</pre>
      <p>Tip: join text with ${c('+')}${isJS(ctx) ? ` or use a template string ${c('`Hello, ${name}!`')}` : ` or use an f-string ${c('f"Hello, {name}!"')}`}.</p>`,
    starter: {
      python: 'def greet(name):\n    return "Hello"\n\nprint(greet("Ada"))\n',
      javascript: 'function greet(name) {\n  return "Hello";\n}\n\nconsole.log(greet("Ada"));\n',
    },
    api: [],
    callTests: [{ fn: 'greet', args: ['Ada'] }, { fn: 'greet', args: ['Linus'] }, { fn: 'greet', args: ['Grace'] }],
    check(runs, ctx) { return checkCalls(runs[0], this.callTests, ['Hello, Ada!', 'Hello, Linus!', 'Hello, Grace!'], ctx, 'greet'); },
    hints: {
      python: ['"Hello, " + name + "!"', 'def greet(name):\n    return "Hello, " + name + "!"'],
      javascript: ['"Hello, " + name + "!"', 'function greet(name) {\n  return "Hello, " + name + "!";\n}'],
    },
    effect: (game) => game.openGate('A'),
  };

  CH.total = {
    title: 'The Counting Vault',
    desc: (ctx) => `<p>Write a function ${c('total')} that takes a <b>list</b> of numbers and returns their sum.</p>
      <pre>total([1, 2, 3])  →  6\ntotal([])         →  0</pre>
      <p>Functions + loops = power. Start a running total at 0 and add each number.</p>`,
    starter: {
      python: 'def total(nums):\n    result = 0\n    for n in nums:\n        pass  # add n to result\n    return result\n\nprint(total([1, 2, 3]))\n',
      javascript: 'function total(nums) {\n  let result = 0;\n  for (const n of nums) {\n    // add n to result\n  }\n  return result;\n}\n\nconsole.log(total([1, 2, 3]));\n',
    },
    api: [],
    callTests: [{ fn: 'total', args: [[1, 2, 3]] }, { fn: 'total', args: [[10, 20]] }, { fn: 'total', args: [[]] }, { fn: 'total', args: [[5, -2, 7, 1]] }],
    check(runs, ctx) { return checkCalls(runs[0], this.callTests, [6, 30, 0, 11], ctx, 'total'); },
    hints: {
      python: ['result += n adds n to result.', 'def total(nums):\n    result = 0\n    for n in nums:\n        result += n\n    return result'],
      javascript: ['result += n adds n to result.', 'function total(nums) {\n  let result = 0;\n  for (const n of nums) {\n    result += n;\n  }\n  return result;\n}'],
    },
    effect: (game) => game.openGate('B'),
  };

  CH.forge = {
    title: 'The Weapon Forge',
    desc: (ctx) => `<p>A <b>class</b> is a blueprint. From one blueprint you can make many <b>objects</b>.</p>
      <p>Design a weapon class with a ${c('name')} (text) and ${c('damage')} (a number from 1 to 5). Then create one and ${c(fn('equip', ctx) + '(...)')} it!</p>
      <p>Bonus: give it a method like ${c(isJS(ctx) ? 'swing()' : 'swing(self)')} that returns a battle cry.</p>`,
    starter: {
      python: 'class Sword:\n    def __init__(self):\n        self.name = "Byte Blade"\n        self.damage = 3\n\n    def swing(self):\n        return "Slash!"\n\n# Create a Sword object from the blueprint, then equip it\nmy_sword = Sword()\n',
      javascript: 'class Sword {\n  constructor() {\n    this.name = "Byte Blade";\n    this.damage = 3;\n  }\n\n  swing() {\n    return "Slash!";\n  }\n}\n\n// Create a Sword object from the blueprint, then equip it\nconst mySword = new Sword();\n',
    },
    api: ['equip'],
    check(runs, ctx) {
      const calls = actionsOf(runs[0], 'equip');
      if (!calls.length) return { ok: false, msg: `Nothing was equipped. Call ${c(fn('equip', ctx) + (isJS(ctx) ? '(mySword)' : '(my_sword)'))}.` };
      const o = calls[calls.length - 1].args[0];
      if (!o || !o.__obj) {
        if (o && o.__class) return { ok: false, msg: `You passed the <b>blueprint</b> (the class itself). Create an object first: ${c(isJS(ctx) ? 'new ' + o.__class + '()' : o.__class + '()')}` };
        return { ok: false, msg: 'You can only equip an <b>object</b> made from a class.' };
      }
      const p = o.props;
      if (typeof p.name !== 'string') return { ok: false, msg: `Your weapon needs a ${c('name')} that is text, e.g. ${c(isJS(ctx) ? 'this.name = "Byte Blade"' : 'self.name = "Byte Blade"')}.` };
      if (typeof p.damage !== 'number') return { ok: false, msg: `Your weapon needs a ${c('damage')} number, e.g. ${c(isJS(ctx) ? 'this.damage = 3' : 'self.damage = 3')}.` };
      if (p.damage > 5) return { ok: false, msg: `Damage ${p.damage}?! The forge melts. Max is <b>5</b> for now (skill points can make it stronger later).` };
      if (p.damage < 1) return { ok: false, msg: 'A weapon that does no damage is just a decoration. Use damage of at least 1.' };
      const cry = Object.entries(o.methods).map(([k, m]) => m.value).find(v => typeof v === 'string');
      return { ok: true, msg: `⚔️ Forged <b>${escapeHTML(p.name)}</b> (${o.className}) with ${p.damage} damage!${cry ? ' It cries "' + escapeHTML(cry) + '"' : ''} Press <b>X</b> or <b>J</b> to attack.`, data: { weapon: { className: o.className, name: p.name.slice(0, 24), damage: p.damage, cry: cry ? String(cry).slice(0, 30) : null } } };
    },
    hints: {
      python: ['ClassName() creates a new object.', 'my_sword = Sword()\nequip(my_sword)'],
      javascript: ['new ClassName() creates a new object.', 'const mySword = new Sword();\nequip(mySword);'],
    },
    effect: (game, data) => { if (data && data.weapon) game.setWeapon(data.weapon); game.openGate('A'); },
  };

  CH.den = {
    title: 'The Pet Den',
    desc: (ctx) => `<p>Lonely? Write a class for a <b>pet</b>! It needs a ${c('name')} and a method ${c(isJS(ctx) ? 'speak()' : 'speak(self)')} that returns what it says.</p>
      <p>Optionally add a ${c('species')} like "cat", "dog", "bird", "slime" or "robot". Then ${c(fn('adopt', ctx) + '(...)')} your pet!</p>`,
    starter: {
      python: 'class Pet:\n    def __init__(self, name, species):\n        self.name = name\n        self.species = species\n\n    def speak(self):\n        return "..."\n\n# Make a pet object (pick your own name!)\nbuddy = Pet("Pixel", "cat")\n',
      javascript: 'class Pet {\n  constructor(name, species) {\n    this.name = name;\n    this.species = species;\n  }\n\n  speak() {\n    return "...";\n  }\n}\n\n// Make a pet object (pick your own name!)\nconst buddy = new Pet("Pixel", "cat");\n',
    },
    api: ['adopt'],
    check(runs, ctx) {
      const calls = actionsOf(runs[0], 'adopt');
      if (!calls.length) return { ok: false, msg: `No pet adopted yet. Call ${c(fn('adopt', ctx) + '(buddy)')}.` };
      const o = calls[calls.length - 1].args[0];
      if (!o || !o.__obj) {
        if (o && o.__class) return { ok: false, msg: 'That\'s the blueprint! Create a pet object from the class first.' };
        return { ok: false, msg: 'You can only adopt an <b>object</b> made from a class.' };
      }
      if (typeof o.props.name !== 'string' || !o.props.name) return { ok: false, msg: `Your pet needs a ${c('name')}!` };
      const sp = o.methods.speak;
      if (!sp) return { ok: false, msg: `Your pet needs a ${c('speak')} method.` };
      if (sp.error) return { ok: false, msg: `${c('speak()')} crashed: <b>${escapeHTML(sp.error)}</b>` };
      if (sp.arity) return { ok: false, msg: `${c('speak')} shouldn't need extra inputs${isJS(ctx) ? '' : ' (just self)'}.` };
      if (typeof sp.value !== 'string' || sp.value === '...' || !sp.value.trim()) return { ok: false, msg: `${c('speak()')} should return something your pet says (text), like "Meow!". It returned ${escapeHTML(show(sp.value))}.` };
      const species = String(o.props.species || o.className || 'pet').toLowerCase();
      return { ok: true, msg: `🐾 <b>${escapeHTML(o.props.name)}</b> the ${escapeHTML(species)} joins you and says "<b>${escapeHTML(sp.value)}</b>"!`, data: { pet: { className: o.className, name: o.props.name.slice(0, 16), species, speak: sp.value.slice(0, 40) } } };
    },
    hints: {
      python: ['Change what speak returns, e.g. return "Meow!"', 'adopt(buddy)'],
      javascript: ['Change what speak returns, e.g. return "Meow!";', 'adopt(buddy);'],
    },
    effect: (game, data) => { if (data && data.pet) game.setPet(data.pet); game.openGate('A'); },
  };

  // ---- open world
  CH.gems = {
    title: 'Core I — The Gem Sorter',
    desc: (ctx) => `<p>${c('gems')} is a <b>list</b> of gem sizes. Deposit only the <b>big</b> ones: call ${c(fn('deposit', ctx) + '(gem)')} for every gem <b>bigger than 5</b>, in order.</p>
      <p>Loop over the list and use an ${c('if')} inside. Tested with 3 different lists.</p>`,
    starter: { python: '# gems is a list, e.g. [3, 8, 1, 9, 6]\nfor gem in gems:\n    pass\n', javascript: '// gems is an array, e.g. [3, 8, 1, 9, 6]\nfor (const gem of gems) {\n\n}\n' },
    api: ['deposit'],
    tests: () => [[3, 8, 1, 9, 6], [10, 2, 7], [1, 2, 3, 5]].map(g => ({ label: `gems = ${show(g)}`, globals: { gems: g }, expect: g.filter(x => x > 5) })),
    check(runs) {
      for (let i = 0; i < runs.length; i++) {
        const got = actionsOf(runs[i], 'deposit').map(a => a.args[0]);
        const t = runs.tests[i];
        if (show(got) !== show(t.expect)) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): expected deposits ${escapeHTML(show(t.expect))} but got ${escapeHTML(show(got))}.` };
      }
      return { ok: true, msg: '💎 The sorter glows. <b>Core fragment I acquired!</b> (+1 skill point)' };
    },
    hints: { python: ['if gem > 5:\n    deposit(gem)'], javascript: ['if (gem > 5) {\n  deposit(gem);\n}'] },
    effect: (game, data, instant) => game.gainCore('gems', instant),
  };

  CH.decoder = {
    title: 'Core II — The Mirror Cipher',
    desc: (ctx) => `<p>The message in ${c('secret')} was written in a mirror — it's <b>backwards</b>! Print it the right way around.</p>
      <pre>secret = "olleh"   →   prints  hello</pre>
      <p>${isJS(ctx) ? `Strings can be split into arrays: ${c('secret.split("")')}. Arrays have ${c('.reverse()')} and ${c('.join("")')}.` : `Python slices can step backwards: ${c('secret[::-1]')}. Or build a new string with a loop.`}</p>`,
    starter: { python: '# secret is a backwards string\nprint(secret)\n', javascript: '// secret is a backwards string\nconsole.log(secret);\n' },
    api: [],
    tests: () => ['syaw krow ruoy fo lla', 'edoc eht esu', 'racecar!'].map(m => ({ label: `secret = ${show(m)}`, globals: { secret: m }, expect: [...m].reverse().join('') })),
    check(runs) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i];
        const out = runs[i].output;
        if (!out.length || out[out.length - 1] !== t.expect) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): expected to print <b>${escapeHTML(t.expect)}</b> but the last line printed was <b>${escapeHTML(out[out.length - 1] || 'nothing')}</b>.` };
      }
      return { ok: true, msg: '🪞 The mirror shatters into light. <b>Core fragment II acquired!</b> (+1 skill point)' };
    },
    hints: { python: ['print(secret[::-1])'], javascript: ['console.log(secret.split("").reverse().join(""));'] },
    effect: (game, data, instant) => game.gainCore('decoder', instant),
  };

  CH.fib = {
    title: 'Core III — The Spiral Vault',
    desc: (ctx) => `<p>The vault opens with the <b>Fibonacci sequence</b>: start with 0 and 1, and each next number is the sum of the two before it.</p>
      <pre>0, 1, 1, 2, 3, 5, 8, 13, ...</pre>
      <p>Print the first ${c('n')} numbers (one per line). Tested with n = 5, 8 and 1. ${isJS(ctx) ? '' : `Tip: ${c('a, b = b, a + b')} updates two variables at once.`}</p>`,
    starter: { python: 'a = 0\nb = 1\n# print the first n Fibonacci numbers\n', javascript: 'let a = 0;\nlet b = 1;\n// print the first n Fibonacci numbers\n' },
    api: [],
    tests: () => [5, 8, 1].map(n => { const seq = []; let a = 0, b = 1; for (let i = 0; i < n; i++) { seq.push(a); [a, b] = [b, a + b]; } return { label: `n = ${n}`, globals: { n }, expect: seq }; }),
    check(runs) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i];
        const nums = (runs[i].output.join(' ').match(/-?\d+/g) || []).map(Number);
        if (show(nums) !== show(t.expect)) return { ok: false, msg: `Test ${i + 1} (${t.label}): expected ${escapeHTML(t.expect.join(', '))} but got ${escapeHTML(nums.join(', ') || 'nothing')}.` };
      }
      return { ok: true, msg: '🌀 The spiral unlocks. <b>Core fragment III acquired!</b> (+1 skill point)' };
    },
    hints: { python: ['for i in range(n):\n    print(a)\n    a, b = b, a + b'], javascript: ['for (let i = 0; i < n; i++) {\n  console.log(a);\n  [a, b] = [b, a + b];\n}'] },
    effect: (game, data, instant) => game.gainCore('fib', instant),
  };

  CH.fizz = {
    title: 'Side Quest — The FizzBuzz Shrine',
    desc: (ctx) => `<p>An ancient programmer ritual. Print the numbers <b>1 to 15</b>, but:</p>
      <ul><li>multiples of 3 → <b>Fizz</b></li><li>multiples of 5 → <b>Buzz</b></li><li>multiples of both → <b>FizzBuzz</b></li></ul>
      <p>${c('%')} gives the remainder: ${c('9 % 3')} is 0, so 9 is a multiple of 3.</p>`,
    starter: { python: 'for i in range(1, 16):\n    print(i)\n', javascript: 'for (let i = 1; i <= 15; i++) {\n  console.log(i);\n}\n' },
    api: [],
    check(runs) {
      const want = []; for (let i = 1; i <= 15; i++) want.push(i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i));
      const out = runs[0].output.map(s => s.trim());
      for (let i = 0; i < 15; i++) if (out[i] !== want[i]) return { ok: false, msg: `Line ${i + 1}: expected <b>${want[i]}</b> but got <b>${escapeHTML(out[i] === undefined ? 'nothing' : out[i])}</b>.` + (i === 14 ? ' <i>Check FizzBuzz first!</i>' : '') };
      return { ok: true, msg: '🔔 The shrine rings 15 times. <b>+1 skill point!</b>' };
    },
    hints: { python: ['Check i % 15 == 0 FIRST, then 3, then 5.'], javascript: ['Check i % 15 === 0 FIRST, then 3, then 5.'] },
    effect: (game, data, instant) => game.gainSideQuest('fizz', instant),
  };

  CH.merchant = {
    title: 'Side Quest — The Dictionary Merchant',
    desc: (ctx) => `<p>The merchant keeps prices in a <b>dictionary</b>: ${c('prices')} maps item names to costs. ${c('cart')} is a list of item names.</p>
      <p>Print the <b>total cost</b> of everything in the cart. Look up a price with ${c('prices["potion"]')}.</p>`,
    starter: { python: '# prices = {"potion": 5, "shield": 12, ...}\n# cart = ["potion", "potion", ...]\n', javascript: '// prices = {potion: 5, shield: 12, ...}\n// cart = ["potion", "potion", ...]\n' },
    api: [],
    tests: () => {
      const prices = { potion: 5, shield: 12, map: 3, boots: 20, key: 7 };
      return [['potion', 'potion', 'map'], ['boots', 'shield', 'key', 'potion'], []].map(cart => ({ label: `cart = ${show(cart)}`, globals: { prices, cart }, expect: cart.reduce((s, k) => s + prices[k], 0) }));
    },
    check(runs) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i];
        const out = runs[i].output;
        const nums = (out.join(' ').match(/-?\d+(\.\d+)?/g) || []).map(Number);
        if (!nums.length || nums[nums.length - 1] !== t.expect) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): the total should be <b>${t.expect}</b> but you printed <b>${escapeHTML(out.join(' / ') || 'nothing')}</b>.` };
      }
      return { ok: true, msg: '💰 "A fine customer!" <b>+1 skill point!</b>' };
    },
    hints: { python: ['total = 0\nfor item in cart:\n    total += prices[item]\nprint(total)'], javascript: ['let total = 0;\nfor (const item of cart) {\n  total += prices[item];\n}\nconsole.log(total);'] },
    effect: (game, data, instant) => game.gainSideQuest('merchant', instant),
  };

  CH.cannon = {
    title: 'The Compiler Cannon',
    repeatable: true,
    requires: (ctx) => ctx.game && ctx.game.cannonCooldown > 0 ? `The cannon is recharging... <b>${Math.ceil(ctx.game.cannonCooldown / 60)}s</b>` : null,
    desc: (ctx) => `<p>Each call to ${c(fn('fire', ctx) + '()')} launches a compiled blast at Segfault. The cannon only accepts <b>burst fire from a loop</b> — up to <b>5 shots</b> per run.</p>
      <p>After firing, it needs time to recharge. Watch out — Segfault may <b>corrupt your cannon code</b>! If it does, debug it before firing again.</p>`,
    starter: { python: '# Fire a burst!\nfor shot in range(5):\n    fire()\n', javascript: '// Fire a burst!\nfor (let shot = 0; shot < 5; shot++) {\n  fire();\n}\n' },
    api: ['fire'],
    check(runs, ctx, code) {
      const n = actionsOf(runs[0], 'fire').length;
      if (!n) return { ok: false, msg: `The cannon didn't fire. Call ${c(fn('fire', ctx) + '()')}.` };
      const loop = hasLoop(code, ctx);
      const shots = loop ? Math.min(n, 5) : 1;
      return { ok: true, msg: `💥 ${shots} shot${shots > 1 ? 's' : ''} away!` + (loop ? '' : ' <i>(Without a loop, the cannon only fires once!)</i>'), data: { shots } };
    },
    hints: { python: ['for shot in range(5):\n    fire()'], javascript: ['for (let shot = 0; shot < 5; shot++) {\n  fire();\n}'] },
    effect: (game, data) => game.fireCannon(data ? data.shots : 1),
  };

  function checkCalls(run, tests, expected, ctx, name) {
    for (let i = 0; i < tests.length; i++) {
      const call = run.calls[i];
      const args = tests[i].args.map(show).join(', ');
      if (!call) return { ok: false, msg: `Couldn't find the function ${c(name)}.` };
      if (call.error) {
        if (/is not defined/.test(call.error)) return { ok: false, msg: `There's no function called ${c(name)}. Make sure you ${isJS(ctx) ? `wrote ${c('function ' + name + '(...)')}` : `used ${c('def ' + name + '(...):')}`} and spelled it exactly.` };
        return { ok: false, msg: `${c(name + '(' + escapeHTML(args) + ')')} crashed: <b>${escapeHTML(call.error)}</b>` };
      }
      if (show(call.value) !== show(expected[i])) {
        const none = call.value === null ? ` <i>(${isJS(ctx) ? 'undefined' : 'None'} means nothing was <b>returned</b> — did you forget ${c('return')}?)</i>` : '';
        return { ok: false, msg: `${c(name + '(' + escapeHTML(args) + ')')} returned ${c(escapeHTML(show(call.value)))} but should return ${c(escapeHTML(show(expected[i])))}.${none}` };
      }
    }
    return { ok: true, msg: `All ${tests.length} tests pass! ✔ Your function ${c(name)} works.` };
  }

  function escapeHTML(s) { return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }

  // ------------------------------------------------------------ glitches (enemies give your code errors!)
  const GLITCHES = {
    syntax: { name: 'SyntaxError', effect: 'Jump disabled', color: '#ff5470', icon: '⛔' },
    name: { name: 'NameError', effect: 'Controls reversed', color: '#b07cff', icon: '🔀' },
    type: { name: 'TypeError', effect: 'Movement slowed', color: '#ffa53b', icon: '🐌' },
  };
  const SNIPPETS = {
    syntax: {
      python: [
        { code: 'print("Jump power restored!"', expect: 'Jump power restored!' },
        { code: 'if True\n    print("Legs online")', expect: 'Legs online' },
        { code: 'message = "Spring loaded\nprint(message)', expect: 'Spring loaded' },
        { code: 'for n in range(3):\nprint(n)', expect: '0\n1\n2' },
      ],
      javascript: [
        { code: 'console.log("Jump power restored!";', expect: 'Jump power restored!' },
        { code: 'if (true) {\n  console.log("Legs online");\n', expect: 'Legs online' },
        { code: 'let message = "Spring loaded;\nconsole.log(message);', expect: 'Spring loaded' },
        { code: 'for (let n = 0; n < 3; n++ {\n  console.log(n);\n}', expect: '0\n1\n2' },
      ],
    },
    name: {
      python: [
        { code: 'direction = "forward"\nprint(directon)', expect: 'forward' },
        { code: 'pirnt("Left is left again")', expect: 'Left is left again' },
        { code: 'def turn():\n    return "right"\n\nprint(trun())', expect: 'right' },
        { code: 'Score = 10\nprint(score)', expect: '10' },
      ],
      javascript: [
        { code: 'let direction = "forward";\nconsole.log(directon);', expect: 'forward' },
        { code: 'consle.log("Left is left again");', expect: 'Left is left again' },
        { code: 'function turn() {\n  return "right";\n}\nconsole.log(trun());', expect: 'right' },
        { code: 'let Score = 10;\nconsole.log(score);', expect: '10' },
      ],
    },
    type: {
      python: [
        { code: 'speed = 8\nprint("Speed: " + speed)', expect: 'Speed: 8' },
        { code: 'boost = "5"\nprint(boost + 5)', expect: '10' },
        { code: 'legs = ["left", "right"]\nprint(legs + "!")', expect: "['left', 'right', '!']" },
        { code: 'def run(steps):\n    return steps * 2\n\nprint(run())', expect: '20', hint: 'run() needs a number of steps — 10 should do it.' },
      ],
      javascript: [
        { code: 'const speed = 5;\nspeed = speed + 5;\nconsole.log(speed);', expect: '10' },
        { code: 'let legs = "fast";\nconsole.log(legs.toUppercase());', expect: 'FAST' },
        { code: 'let boots = null;\nconsole.log(boots.name);', expect: 'Swift Boots', hint: 'boots should be an object like { name: "Swift Boots" }' },
        { code: 'let run = 20;\nconsole.log(run());', expect: '20' },
      ],
    },
  };

  // ------------------------------------------------------------ levels
  function level1() {
    const m = MapBuilder(42, 17);
    m.fill(0, 15, 41, 16, '#');
    m.put(2, 14, 'P'); m.put(5, 14, '?');
    m.put(11, 13, '---'); m.put(15, 11, '----');
    m.put(19, 14, '?');
    m.fill(22, 14, 23, 14, '#');
    m.put(26, 14, '1');
    m.fill(31, 0, 31, 12, 'W'); m.fill(31, 13, 31, 14, 'A');
    m.put(37, 14, 'F');
    return m.rows();
  }
  function level2() {
    const m = MapBuilder(52, 17);
    m.fill(0, 15, 51, 16, '#');
    m.put(2, 14, 'P'); m.put(4, 14, '?');
    m.put(7, 13, '----'); m.put(8, 12, '*');
    m.put(13, 14, '1'); m.put(14, 14, '?');
    m.fill(16, 15, 22, 15, '_'); m.fill(16, 16, 22, 16, '~');
    m.put(27, 14, '*');
    m.put(30, 13, '---');
    m.put(33, 14, '2');
    m.fill(37, 0, 37, 12, 'W'); m.fill(37, 13, 37, 14, 'A');
    m.put(41, 14, '?');
    m.put(46, 14, 'F');
    return m.rows();
  }
  function level3() {
    const m = MapBuilder(60, 17);
    m.fill(0, 15, 59, 16, '#');
    m.put(2, 14, 'P'); m.put(5, 14, '?');
    m.put(9, 13, '---'); m.put(13, 14, 'e');
    m.put(18, 14, '1');
    m.fill(22, 0, 22, 12, 'W'); m.fill(22, 13, 22, 14, 'A');
    m.put(26, 14, '2'); m.put(24, 14, '?');
    m.fill(28, 15, 36, 16, '%');
    m.put(40, 14, 'e'); m.put(44, 13, '----'); m.put(46, 14, 'K');
    m.put(50, 14, '?');
    m.put(55, 14, 'F');
    return m.rows();
  }
  function level4() {
    const m = MapBuilder(62, 17);
    m.fill(0, 15, 61, 16, '#');
    m.put(2, 14, 'P'); m.put(4, 14, '?');
    // hidden climb to find i
    m.put(7, 13, '---'); m.put(10, 11, '---'); m.put(6, 9, '---'); m.put(1, 7, '----');
    m.put(2, 6, '@');
    m.put(14, 14, '?');
    m.put(18, 14, '1');
    m.put(21, 14, 'S');
    // the cliff
    m.fill(27, 9, 41, 16, '#');
    m.put(30, 8, 'K'); m.put(34, 8, '2'); m.put(39, 8, 's');
    m.fill(42, 3, 43, 14, 'W');
    m.put(47, 14, 'e'); m.put(52, 14, '?');
    m.put(57, 14, 'F');
    return m.rows();
  }
  function level5() {
    const m = MapBuilder(62, 17);
    m.fill(0, 15, 61, 16, '#');
    m.put(2, 14, 'P'); m.put(4, 14, '?');
    m.put(9, 14, '1');
    m.fill(12, 15, 19, 15, '_'); m.fill(12, 16, 19, 16, '~');
    m.put(23, 14, 'e');
    m.put(26, 14, '2');
    m.fill(30, 0, 30, 12, 'W'); m.fill(30, 13, 30, 14, 'A');
    m.put(33, 14, 'K'); m.put(35, 13, '---'); m.put(37, 10, 'w');
    m.put(40, 14, '3');
    m.fill(44, 0, 44, 12, 'W'); m.fill(44, 13, 44, 14, 'B');
    m.put(48, 14, 'e'); m.put(50, 14, '?');
    m.put(56, 14, 'F');
    return m.rows();
  }
  function level6() {
    const m = MapBuilder(60, 17);
    m.fill(0, 15, 59, 16, '#');
    m.put(2, 14, 'P'); m.put(5, 14, '?');
    m.put(10, 14, '1'); m.put(13, 14, '?'); m.put(17, 14, '2');
    m.fill(24, 0, 24, 12, 'W'); m.fill(24, 13, 24, 14, 'A');
    m.put(27, 14, '?');
    m.put(32, 14, 'e'); m.put(36, 13, '----'); m.put(40, 14, 'e'); m.put(43, 10, 'w');
    m.put(47, 14, '?');
    m.put(54, 14, 'F');
    return m.rows();
  }
  function levelWorld() {
    const W = 176, H = 24;
    const m = MapBuilder(W, H);
    m.fill(0, 22, W - 1, 23, '#');
    m.fill(0, 0, 0, 21, 'W');
    // --- hub
    m.put(3, 21, 'P'); m.put(6, 21, 'K'); m.put(10, 21, '$'); m.put(14, 21, '?');
    m.put(17, 20, '---'); m.put(21, 18, '---');
    // --- section 1: hills + gem sorter
    m.fill(24, 20, 34, 21, '#'); m.fill(27, 18, 31, 19, '#');
    m.put(29, 17, '1');
    m.put(37, 21, 'e'); m.put(43, 21, 'e');
    // fizzbuzz shrine up high
    m.put(38, 20, '---'); m.put(42, 18, '---'); m.put(45, 16, '---'); m.put(48, 14, '-----'); m.put(50, 13, '4');
    m.put(54, 21, '^^^'); m.put(58, 21, 'K');
    // --- section 2: plateau with decoder
    m.fill(62, 18, 84, 21, '#');
    m.put(59, 20, '---');
    m.put(66, 17, 'e'); m.put(72, 17, '?'); m.put(76, 17, '2');
    m.put(80, 14, 'w');
    m.fill(85, 22, 92, 23, '~'); m.put(86, 19, '--'); m.put(90, 19, '--');
    m.fill(93, 20, 99, 21, '#'); m.put(96, 19, 'K');
    // --- section 3: lava fields & fib vault
    m.fill(100, 22, 118, 23, '~');
    m.put(101, 19, '---'); m.put(106, 17, '---'); m.put(111, 19, '---'); m.put(115, 17, '---');
    m.put(108, 13, 'w');
    m.fill(119, 20, 128, 21, '#'); m.put(122, 19, '3'); m.put(126, 19, 'e');
    m.put(132, 21, '5'); m.put(134, 21, '?');
    m.put(138, 21, 'e'); m.put(141, 18, 'w');
    m.put(145, 21, 'K'); m.put(147, 21, '?');
    // --- the core gate & portal
    m.fill(151, 0, 151, 19, 'W'); m.fill(151, 20, 151, 21, 'A');
    m.put(156, 19, '---');
    m.put(162, 21, 'F');
    m.fill(W - 1, 0, W - 1, 21, 'W');
    return m.rows();
  }
  function levelBoss() {
    const m = MapBuilder(30, 17);
    m.fill(0, 15, 29, 16, '#');
    m.fill(0, 0, 0, 14, 'W'); m.fill(29, 0, 29, 14, 'W');
    m.put(3, 14, 'P');
    m.put(1, 14, '1'); m.put(2, 13, 'c');
    m.put(5, 13, '-----'); m.put(20, 13, '-----');
    m.put(12, 11, '------');
    m.put(15, 4, 'Z');
    return m.rows();
  }

  const LEVELS = [
    {
      id: 'hello', name: 'Hello, World', theme: 'meadow', map: level1(),
      intro: {
        title: 'Level 1 — Hello, World',
        python: '<p>Welcome to <b>Syntaxia</b>, a world built from code — and slowly being eaten by <b>bugs</b>.</p><p>You are a Coder. In this world, you change things by writing <b>scripts</b>. Every programmer\'s journey starts with the same two words...</p>',
        javascript: '<p>Welcome to <b>Syntaxia</b>, a world built from code — and slowly being eaten by <b>bugs</b>.</p><p>You are a Coder. In this world, you change things by writing <b>scripts</b>. Every programmer\'s journey starts with the same two words...</p>',
      },
      signs: [
        'Move with ← → (or A / D).  Jump with Space, W or ↑.',
        'See that terminal? Walk up to it and press E to write code. Press Esc to pause.',
      ],
      terminals: ['hello'],
    },
    {
      id: 'vars', name: 'Variables', theme: 'meadow', map: level2(),
      intro: {
        title: 'Level 2 — Variables',
        python: '<p>A <b>variable</b> is a named box that holds a value:</p><pre>planks = 7\nname = "Ada"</pre><p>In Syntaxia, objects you pick up become variables you can use in your code! Collect the glowing boxes.</p>',
        javascript: '<p>A <b>variable</b> is a named box that holds a value:</p><pre>let planks = 7;\nconst name = "Ada";</pre><p>In Syntaxia, objects you pick up become variables you can use in your code! Collect the glowing boxes.</p>',
      },
      signs: ['Glowing boxes are VARIABLES. Walk into one to collect it — it shows up in your Variables panel (top right).', 'Lava ahead. Better build a bridge...', 'Well done! The exit portal is just ahead.'],
      pickups: [{ name: 'planks', value: 7 }, { name: 'password', value: randomWord }],
      terminals: ['bridge', 'password'],
    },
    {
      id: 'ifs', name: 'Conditions', theme: 'cave', map: level3(),
      intro: {
        title: 'Level 3 — Conditions',
        python: '<p>Code can make <b>decisions</b> with <code>if</code>:</p><pre>if hp < 3:\n    print("Heal!")\nelif hp == 3:\n    print("Okay")\nelse:\n    print("Strong!")</pre><p>Notice the <b>colon</b> and the <b>indent</b> — Python uses them to know what belongs inside the if.</p><p>⚠️ <b>Bugs</b> live here. Jump on them to squash them — if one bites you, it puts an <b>error in your code</b>!</p>',
        javascript: '<p>Code can make <b>decisions</b> with <code>if</code>:</p><pre>if (hp < 3) {\n  console.log("Heal!");\n} else if (hp === 3) {\n  console.log("Okay");\n} else {\n  console.log("Strong!");\n}</pre><p>The <b>{ curly braces }</b> hold the code that belongs inside the if.</p><p>⚠️ <b>Bugs</b> live here. Jump on them to squash them — if one bites you, it puts an <b>error in your code</b>!</p>',
      },
      signs: ['BUGS! Jump on top to squash them. If one bites you, you get a GLITCH (an error in your code). Press Q to open the debugger and fix it!', 'Lava! The pump terminal could turn it into stone...', 'Checkpoints (flags) save your progress.'],
      terminals: ['guard', 'pump'],
    },
    {
      id: 'loops', name: 'Loops', theme: 'cave', map: level4(),
      intro: {
        title: 'Level 4 — Loops',
        python: '<p>A <b>loop</b> repeats code so you don\'t have to:</p><pre>for i in range(3):\n    print(i)   # 0, 1, 2</pre><p>That little <b>i</b> is the loop\'s counter... Legend says a tiny creature named <b>i</b> lives in these caves. Maybe you\'ll find them!</p>',
        javascript: '<p>A <b>loop</b> repeats code so you don\'t have to:</p><pre>for (let i = 0; i < 3; i++) {\n  console.log(i); // 0, 1, 2\n}</pre><p>That little <b>i</b> is the loop\'s counter... Legend says a tiny creature named <b>i</b> lives in these caves. Maybe you\'ll find them!</p>',
      },
      signs: ['A tiny voice echoes from somewhere above: "...i\'m up here..."', 'The Staircase Engine needs a loop counter to work.', 'Almost there! Watch out for bugs.'],
      terminals: ['stairs', 'countdown'],
      springsLocked: true,
    },
    {
      id: 'funcs', name: 'Functions', theme: 'circuit', map: level5(),
      intro: {
        title: 'Level 5 — Functions',
        python: '<p>A <b>function</b> is a named recipe. Define it once with <code>def</code>, use it as often as you like:</p><pre>def square(x):\n    return x * x\n\nprint(square(4))  # 16</pre><p><code>return</code> sends the answer back to whoever called the function.</p>',
        javascript: '<p>A <b>function</b> is a named recipe. Define it once, use it as often as you like:</p><pre>function square(x) {\n  return x * x;\n}\n\nconsole.log(square(4)); // 16</pre><p><code>return</code> sends the answer back to whoever called the function.</p>',
      },
      signs: ['Each terminal here TESTS your function with different inputs. Make sure it works for all of them!', 'Nearly there. Classes await...'],
      terminals: ['double', 'greet', 'total'],
    },
    {
      id: 'classes', name: 'Classes', theme: 'circuit', map: level6(),
      intro: {
        title: 'Level 6 — Classes',
        python: '<p>A <b>class</b> is a blueprint for making objects. Each object gets its own data (<b>attributes</b>) and abilities (<b>methods</b>):</p><pre>class Dog:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return "Woof!"\n\nrex = Dog("Rex")\nprint(rex.speak())</pre><p>Forge a <b>weapon</b> or adopt a <b>pet</b> — or both! Master classes and you\'ll unlock <b>skill points</b> and the <b>open world</b>.</p>',
        javascript: '<p>A <b>class</b> is a blueprint for making objects. Each object gets its own data (<b>properties</b>) and abilities (<b>methods</b>):</p><pre>class Dog {\n  constructor(name) {\n    this.name = name;\n  }\n  speak() {\n    return "Woof!";\n  }\n}\n\nconst rex = new Dog("Rex");\nconsole.log(rex.speak());</pre><p>Forge a <b>weapon</b> or adopt a <b>pet</b> — or both! Master classes and you\'ll unlock <b>skill points</b> and the <b>open world</b>.</p>',
      },
      signs: ['Two terminals: the Forge (weapons) and the Den (pets). Either one opens the gate — but why not both?', 'Want a pet too? The Den is right there!', 'Weapons: press X or J to attack. Pets follow you around and cheer you on.', 'Beyond the portal lies the open world. Skill points await!'],
      terminals: ['forge', 'den'],
      gateAnyOf: true,
      grantsSkills: true,
    },
    {
      id: 'world', name: 'The Wilds of Syntaxia', theme: 'wilds', map: levelWorld(), openWorld: true,
      intro: {
        title: 'The Wilds of Syntaxia',
        python: '<p>You\'ve mastered the basics. Now Syntaxia is yours to explore!</p><ul><li>Find the <b>3 Core terminals</b> to open the gate to the Bug King\'s lair.</li><li>Earn <b>skill points</b> from cores, side quests and squashing bugs (1 SP per 3 bugs).</li><li>Spend them at the <b>Skill Shrine</b> 🔷 (or press K).</li></ul>',
        javascript: '<p>You\'ve mastered the basics. Now Syntaxia is yours to explore!</p><ul><li>Find the <b>3 Core terminals</b> to open the gate to the Bug King\'s lair.</li><li>Earn <b>skill points</b> from cores, side quests and squashing bugs (1 SP per 3 bugs).</li><li>Spend them at the <b>Skill Shrine</b> 🔷 (or press K).</li></ul>',
      },
      signs: ['THE WILDS. Three Core terminals are hidden out east. Bring all three cores to the Great Gate. Skill Shrine is right behind you!', 'The Mirror Cipher is just ahead. Strings can be sliced and reversed...', 'The Dictionary Merchant — "Prices, prices! Who\'s buying?"', 'The Great Gate. It opens only for one who carries 3 Core fragments.'],
      terminals: ['gems', 'decoder', 'fib', 'fizz', 'merchant'],
    },
    {
      id: 'boss', name: 'Segfault\'s Lair', theme: 'lair', map: levelBoss(), boss: true,
      intro: {
        title: 'Final Boss — Segfault, the Bug King',
        python: '<p>The source of all the bugs. <b>Segfault</b> has corrupted the core of Syntaxia.</p><p>Use the <b>Compiler Cannon</b> terminal to blast it with loops. Hit it with your weapon when it swoops low. Jump on its head if you dare.</p><p>It will throw <b>errors</b> at you and corrupt your code. Stay calm and debug!</p>',
        javascript: '<p>The source of all the bugs. <b>Segfault</b> has corrupted the core of Syntaxia.</p><p>Use the <b>Compiler Cannon</b> terminal to blast it with loops. Hit it with your weapon when it swoops low. Jump on its head if you dare.</p><p>It will throw <b>errors</b> at you and corrupt your code. Stay calm and debug!</p>',
      },
      signs: [],
      terminals: ['cannon'],
    },
  ];

  // Map info: the topic each level teaches and a short description.
  const CHAPTERS = {
    hello: { topic: 'print()', blurb: 'Write your very first line of code and make the computer talk.' },
    vars: { topic: 'Variables', blurb: 'Store values in named boxes. Objects you collect in the world become variables in your code.' },
    ifs: { topic: 'Conditions', blurb: 'Make decisions with if / else. Your code is tested against several different cases.' },
    loops: { topic: 'Loops', blurb: 'Repeat code with for and while loops — and find your little friend i.' },
    funcs: { topic: 'Functions', blurb: 'Package code into reusable functions that take inputs and return answers.' },
    classes: { topic: 'Classes & Objects', blurb: 'Design blueprints with attributes and methods. Forge a weapon or adopt a pet.' },
    world: { topic: 'Lists, Strings & Dictionaries', blurb: 'Explore the open world, earn skill points, and recover the 3 Core fragments.' },
    boss: { topic: 'Final Boss', blurb: 'Debug under pressure and defeat Segfault with looped cannon fire.' },
  };
  LEVELS.forEach(l => Object.assign(l, CHAPTERS[l.id]));

  const SKILLS = [
    { id: 'double_jump', name: 'Double Jump', icon: '🦘', cost: 2, max: 1, desc: 'Jump again in mid-air.' },
    { id: 'swift', name: 'Swift Boots', icon: '👟', cost: 1, max: 2, desc: '+20% movement speed per level.' },
    { id: 'vitality', name: 'Vitality', icon: '❤️', cost: 1, max: 3, desc: '+1 max HP per level.' },
    { id: 'sharp', name: 'Sharpened Code', icon: '🗡️', cost: 1, max: 3, desc: '+1 weapon damage per level.' },
    { id: 'debugger', name: "Debugger's Eye", icon: '🔍', cost: 1, max: 1, desc: 'Glitch errors show a hint for the fix. Bugs bite less often.' },
    { id: 'companion', name: 'Companion Strike', icon: '⚡', cost: 2, max: 1, desc: 'Your pet zaps nearby bugs. (Needs a pet.)' },
    { id: 'overclock', name: 'Overclock', icon: '⏱️', cost: 1, max: 2, desc: 'Compiler Cannon recharges faster & hits harder.' },
  ];

  root.GameData = { LEVELS, CH, SKILLS, GLITCHES, SNIPPETS, escapeHTML, stripComments };
})(typeof window !== 'undefined' ? window : globalThis);
