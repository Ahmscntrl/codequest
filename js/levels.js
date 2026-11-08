/* CodeQuest — level maps, terminal challenges, and glitch (bug) snippets. */
(function (root) {
  'use strict';

  // ------------------------------------------------------------ helpers
  // Map builder. Most tiles are single characters; obstacles that a terminal unlocks are tagged with a
  // group letter through a per-level legend (e.g. "phantom block of group B").
  function MapBuilder(w, h) {
    const g = Array.from({ length: h }, () => Array(w).fill('.'));
    const pool = [...'αβγδζηθικλμνξπρστυφχψωΓΔΘΛΞΠΣΦΨΩ'];
    const keys = {};
    const api = {
      w, h, legend: {},
      fill(x1, y1, x2, y2, ch) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (g[y] && x >= 0 && x < w) g[y][x] = ch; return api; },
      put(x, y, s) { for (let i = 0; i < s.length; i++) if (g[y] && x + i < w) g[y][x + i] = s[i]; return api; },
      key(type, grp, extra) {
        const id = type + ':' + grp + ':' + JSON.stringify(extra || {});
        if (!keys[id]) { const ch = pool.shift(); keys[id] = ch; api.legend[ch] = Object.assign({ type, g: grp }, extra || {}); }
        return keys[id];
      },
      mark(x1, y1, x2, y2, type, grp, extra) { return api.fill(x1, y1, x2, y2, api.key(type, grp, extra)); },
      rows() { return g.map(r => r.join('')); },
    };
    return api;
  }
  const mapOf = (m) => Array.isArray(m) ? { map: m } : { map: m.rows(), legend: m.legend };

  // ---- obstacles a terminal unlocks (each returns the x just after it)
  const OB = {
    // classic gate in a wall
    wall(m, x, g) { gate(m, x, g); return x + 1; },
    // a 6-high cliff; code blocks materialise as a staircase up it
    climb(m, x, g) {
      m.mark(x, 13, x, 14, 'phantom', g); m.mark(x + 1, 11, x + 1, 14, 'phantom', g);
      m.fill(x + 2, 9, x + 5, 14, '#');
      m.put(x + 3, 8, 'o'); m.put(x + 4, 8, 'o');
      return x + 6;
    },
    // a lava pit; a bridge of code blocks appears
    bridge(m, x, g) {
      m.fill(x, 15, x + 5, 15, '.'); m.fill(x, 16, x + 5, 16, '~');
      m.mark(x, 15, x + 5, 15, 'phantom', g);
      return x + 6;
    },
    // a low tunnel lined with spikes that retract
    spikes(m, x, g) {
      m.fill(x, 0, x + 6, 12, 'W');
      m.mark(x, 14, x + 6, 14, 'rspike', g);
      return x + 7;
    },
    // a powered-down spring in front of a tall cliff
    spring(m, x, g) {
      m.mark(x, 14, x, 14, 'gspring', g);
      m.fill(x + 2, 9, x + 4, 14, '#');
      m.put(x + 1, 6, 'o'); m.put(x + 3, 5, 'o');
      return x + 5;
    },
    // a lava lake that cools into stone
    lava(m, x, g) { m.mark(x, 15, x + 7, 16, 'glava', g); return x + 8; },
  };
  // ---- fun bits between terminals (never block progress)
  const TR = {
    hills(m, x) {
      m.fill(x + 1, 14, x + 2, 14, '#'); m.fill(x + 4, 13, x + 6, 14, '#'); m.fill(x + 7, 14, x + 7, 14, '#');
      m.put(x + 2, 12, 'o'); m.put(x + 5, 11, 'o'); m.put(x + 6, 11, 'o');
      return x + 9;
    },
    // lava pit with two wide stepping platforms
    pit(m, x) {
      m.fill(x, 15, x + 10, 15, '.'); m.fill(x, 16, x + 10, 16, '~');
      m.put(x + 2, 13, '---'); m.put(x + 6, 13, '----');
      m.put(x + 3, 11, 'o'); m.put(x + 5, 10, 'o'); m.put(x + 7, 11, 'o');
      return x + 11;
    },
    // lava pit crossed on a moving platform
    mover(m, x) {
      m.fill(x, 15, x + 9, 15, '.'); m.fill(x, 16, x + 9, 16, '~');
      m.mark(x + 1, 13, x + 1, 13, 'mover', 'h', { range: 5 });
      m.put(x + 4, 10, 'o'); m.put(x + 5, 10, 'o');
      return x + 10;
    },
    // an optional tower of one-way platforms with bits at the top
    tower(m, x) {
      m.put(x, 13, '---'); m.put(x + 3, 11, '---'); m.put(x, 9, '---'); m.put(x + 3, 7, '---');
      m.put(x + 1, 8, 'o'); m.put(x + 4, 6, 'o'); m.put(x + 5, 6, 'o');
      return x + 7;
    },
  };
  // room = a terminal on the ground, then its obstacle
  const room = (m, x, n, kind, g) => { m.put(x + 1, 14, String(n)); return OB[kind](m, x + 4, g) + 2; };
  const isJS = (ctx) => ctx.lang === 'javascript';
  const fn = (n, ctx) => Lang.fnName(n, ctx.lang);
  const c = (s) => `<code>${s}</code>`;
  const show = (v) => JSON.stringify(v);
  const hasLoop = (code, ctx) => Lang.hasLoop(code, ctx.lang);
  function stripComments(code, ctx) {
    return Lang.stripComments(code, ctx.lang);
  }
  const printFn = (ctx) => isJS(ctx) ? 'console.log' : 'print';
  const printEx = (ctx, x) => Lang.get(ctx.lang).print(x);
  const isC = (ctx) => Lang.get(ctx.lang).family === 'c';
  const selfWord = (ctx) => Lang.get(ctx.lang).self;
  const tn = (n, ctx) => Lang.testName(n, ctx.lang);
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
    check(runs, ctx) {
      const r = runs[0];
      if (!r.output.length) return { ok: false, msg: `Nothing was printed. Try ${c(printEx(ctx, '"Hello, World"'))}.` };
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
      if (!r.output.some(l => l.trim() === pw)) return { ok: false, msg: `The lock didn't hear the password. Try ${c(printEx(ctx, 'password'))}.` };
      return { ok: true, msg: `The lock whispers "<b>${escapeHTML(pw)}</b>"... <b>Unlocked!</b>` };
    },
    hints: {
      python: ['"password" (with quotes) is just text. password (no quotes) is the variable.', 'print(password)'],
      javascript: ['"password" (with quotes) is just text. password (no quotes) is the variable.', 'console.log(password);'],
    },
    effect: (game) => game.openGate('G'),
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
        if (did[0] !== t.expect) return { ok: false, msg: t.expect === 'open_gate' ? `Test ${i + 1}: <b>you</b> were at the gate but it stayed shut!` : `Test ${i + 1} (${escapeHTML(t.label)}): you let a <b>bug</b> in! ` };
      }
      return { ok: true, msg: 'All 3 visitors handled correctly. The guard bot salutes you. <b>Gate open!</b>' };
    },
    hints: {
      python: ['Inside the if block, call open_gate(). Inside the else block, call sound_alarm().', 'if visitor == my_name:\n    open_gate()\nelse:\n    sound_alarm()'],
      javascript: ['Inside the if block, call openGate(). Inside the else block, call soundAlarm().', 'if (visitor === myName) {\n  openGate();\n} else {\n  soundAlarm();\n}'],
    },
    effect: (game) => game.openGate('C'),
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
      if (!hasLoop(code, ctx)) return { ok: false, msg: 'That works... but <b>i</b> looks sad. Use a <b>loop</b> so i can help!' };
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
      return { ok: true, msg: '<b>Liftoff!</b> The launch pads are charged. Jump on a glowing spring!' };
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
    effect: (game) => game.openGate('D'),
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
    effect: (game) => game.openGate('G'),
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
      if (!calls.length) return { ok: false, msg: `Nothing was equipped. Call ${c(fn('equip', ctx) + '(...)')} with your weapon object.` };
      const o = calls[calls.length - 1].args[0];
      if (!o || !o.__obj) {
        if (o && o.__class) return { ok: false, msg: `You passed the <b>blueprint</b> (the class itself). Create an object first: ${c(ctx.lang === 'python' ? o.__class + '()' : ctx.lang === 'cpp' ? o.__class + ' my_weapon;' : 'new ' + o.__class + '()')}` };
        return { ok: false, msg: 'You can only equip an <b>object</b> made from a class.' };
      }
      const p = o.props;
      if (typeof p.name !== 'string') return { ok: false, msg: `Your weapon needs a ${c('name')} that is text, e.g. ${c(selfWord(ctx) + (ctx.lang === 'cpp' ? '->' : '.') + 'name = "Byte Blade"')}.` };
      if (typeof p.damage !== 'number') return { ok: false, msg: `Your weapon needs a ${c('damage')} number, e.g. ${c(selfWord(ctx) + (ctx.lang === 'cpp' ? '->' : '.') + 'damage = 3')}.` };
      if (p.damage > 5) return { ok: false, msg: `Damage ${p.damage}?! The forge melts. Max is <b>5</b> for now (skill points can make it stronger later).` };
      if (p.damage < 1) return { ok: false, msg: 'A weapon that does no damage is just a decoration. Use damage of at least 1.' };
      const cry = Object.entries(o.methods).map(([k, m]) => m.value).find(v => typeof v === 'string');
      return { ok: true, msg: `Forged <b>${escapeHTML(p.name)}</b> (${o.className}) with ${p.damage} damage!${cry ? ' It cries "' + escapeHTML(cry) + '"' : ''} Press <b>X</b> or <b>J</b> to attack.`, data: { weapon: { className: o.className, name: p.name.slice(0, 24), damage: p.damage, cry: cry ? String(cry).slice(0, 30) : null } } };
    },
    hints: {
      python: ['ClassName() creates a new object.', 'my_sword = Sword()\nequip(my_sword)'],
      javascript: ['new ClassName() creates a new object.', 'const mySword = new Sword();\nequip(mySword);'],
    },
    effect: (game, data) => { if (data && data.weapon) game.setWeapon(data.weapon); game.openGate('E'); },
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
      if (sp.arity) return { ok: false, msg: `${c('speak')} shouldn't need extra inputs${ctx.lang === 'python' ? ' (just self)' : ''}.` };
      if (typeof sp.value !== 'string' || sp.value === '...' || !sp.value.trim()) return { ok: false, msg: `${c('speak()')} should return something your pet says (text), like "Meow!". It returned ${escapeHTML(show(sp.value))}.` };
      const species = String(o.props.species || o.className || 'pet').toLowerCase();
      return { ok: true, msg: `<b>${escapeHTML(o.props.name)}</b> the ${escapeHTML(species)} joins you and says "<b>${escapeHTML(sp.value)}</b>"!`, data: { pet: { className: o.className, name: o.props.name.slice(0, 16), species, speak: sp.value.slice(0, 40) } } };
    },
    hints: {
      python: ['Change what speak returns, e.g. return "Meow!"', 'adopt(buddy)'],
      javascript: ['Change what speak returns, e.g. return "Meow!";', 'adopt(buddy);'],
    },
    effect: (game, data) => { if (data && data.pet) game.setPet(data.pet); game.openGate('E'); },
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
      return { ok: true, msg: 'The sorter glows. <b>Core fragment I acquired!</b> (+1 skill point)' };
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
      return { ok: true, msg: 'The mirror shatters into light. <b>Core fragment II acquired!</b> (+1 skill point)' };
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
      return { ok: true, msg: 'The spiral unlocks. <b>Core fragment III acquired!</b> (+1 skill point)' };
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
      return { ok: true, msg: 'The shrine rings 15 times. <b>+1 skill point!</b>' };
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
      return { ok: true, msg: '"A fine customer!" <b>+1 skill point!</b>' };
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
      return { ok: true, msg: `${shots} shot${shots > 1 ? 's' : ''} away!` + (loop ? '' : ' <i>(Without a loop, the cannon only fires once!)</i>'), data: { shots } };
    },
    hints: { python: ['for shot in range(5):\n    fire()'], javascript: ['for (let shot = 0; shot < 5; shot++) {\n  fire();\n}'] },
    effect: (game, data) => game.fireCannon(data ? data.shots : 1),
  };

  // ================================================================ extra lessons (gradual steps)
  const lines = (run) => run.output.map(l => l.trim());
  const lastLine = (run) => { const o = lines(run); return o.length ? o[o.length - 1] : undefined; };
  const nothing = (v) => v === undefined ? 'nothing' : escapeHTML(v);

  // ---- Level 1: print()
  CH.lines = {
    title: 'The Three Bells',
    desc: (ctx) => `<p>Every ${c(printFn(ctx) + '(...)')} puts its text on a <b>new line</b>. Computers run your code <b>from top to bottom</b>.</p>
      <p>Ring the bells in order. Print these three lines:</p><pre>Ready\nSet\nCode!</pre>`,
    starter: { python: '# One print() per line. The first one is done for you:\nprint("Ready")\n', javascript: '// One console.log() per line. The first one is done for you:\nconsole.log("Ready");\n' },
    api: [],
    check(runs) {
      const out = lines(runs[0]);
      const want = ['ready', 'set', 'code!'];
      const norm = out.map(l => l.toLowerCase().replace(/^code$/, 'code!'));
      if (out.length < 3) return { ok: false, msg: `You printed ${out.length} line${out.length === 1 ? '' : 's'} — the bells need 3: <b>Ready</b>, <b>Set</b>, <b>Code!</b>` };
      for (let i = 0; i < 3; i++) if (norm[i] !== want[i]) return { ok: false, msg: `Line ${i + 1} should be <b>${['Ready', 'Set', 'Code!'][i]}</b> but it was <b>${nothing(out[i])}</b>. Order matters!` };
      return { ok: true, msg: 'The bells ring in order. <b>Gate open!</b>' };
    },
    hints: { python: ['Add two more print lines underneath.', 'print("Ready")\nprint("Set")\nprint("Code!")'], javascript: ['Add two more console.log lines underneath.', 'console.log("Ready");\nconsole.log("Set");\nconsole.log("Code!");'] },
    effect: (game) => game.openGate('B'),
  };
  CH.math = {
    title: 'The Calculator Door',
    desc: (ctx) => `<p>Text needs quotes, but <b>numbers don't</b>. Without quotes, the computer does the math for you:</p>
      <pre>${printFn(ctx)}(2 + 3)    ${isJS(ctx) ? '//' : '#'} shows 5\n${printFn(ctx)}("2 + 3")  ${isJS(ctx) ? '//' : '#'} shows the text 2 + 3</pre>
      <p>Make the computer calculate <b>7 × 6</b> and <b>100 − 1</b>, printing each answer on its own line. (Use ${c('*')} to multiply and ${c('-')} to subtract — don't type the answers yourself!)</p>`,
    starter: { python: '# Math works inside print():\nprint(2 + 3)\n', javascript: '// Math works inside console.log():\nconsole.log(2 + 3);\n' },
    api: [],
    check(runs, ctx, code) {
      const out = lines(runs[0]);
      if (out.some(l => /7\s*\*\s*6|100\s*-\s*1/.test(l))) return { ok: false, msg: 'You printed the math as <i>text</i>. Remove the quotes so the computer calculates it!' };
      const src = stripComments(code, ctx);
      if (/\b(42|99)\b/.test(src)) return { ok: false, msg: 'No cheating — let the computer do the math with <code>*</code> and <code>-</code>!' };
      const i42 = out.indexOf('42'), i99 = out.indexOf('99');
      if (i42 < 0) return { ok: false, msg: 'I don\'t see the answer to 7 × 6 yet. Try <code>' + printEx(ctx, '7 * 6') + '</code>.' };
      if (i99 < 0) return { ok: false, msg: 'Now print the answer to 100 − 1.' };
      if (i99 < i42) return { ok: false, msg: 'Print 7 × 6 first, then 100 − 1.' };
      return { ok: true, msg: '42 and 99 — correct! <b>Gate open!</b>' };
    },
    hints: { python: ['print(7 * 6)', 'print(7 * 6)\nprint(100 - 1)'], javascript: ['console.log(7 * 6);', 'console.log(7 * 6);\nconsole.log(100 - 1);'] },
    effect: (game) => game.openGate('D'),
  };

  // ---- Level 2: variables
  CH.firstvar = {
    title: 'The Name Plate',
    desc: (ctx) => `<p>A <b>variable</b> is a labelled box that stores a value. You make one with ${isJS(ctx) ? c('let') + ' and ' : ''}an equals sign:</p>
      <pre>${isJS(ctx) ? 'let ' : ''}color = "blue"${isJS(ctx) ? ';' : ''}</pre>
      <p>Make a variable called ${c('color')} holding your favourite colour (as text), then <b>print the variable</b>.</p>`,
    starter: { python: '# name = value   (text values need quotes)\n', javascript: '// let name = value;   (text values need quotes)\n' },
    api: [],
    captureVars: ['color'],
    check(runs, ctx, code) {
      const r = runs[0];
      const v = r.vars.color;
      if (v === undefined) return { ok: false, msg: `I can't find a variable called ${c('color')}. Spell it exactly like that (all lowercase).` };
      if (typeof v !== 'string' || !v.trim()) return { ok: false, msg: `${c('color')} should hold some text, like ${c('"blue"')}.` };
      if (!Lang.printsVar(code, 'color', ctx.lang)) return { ok: false, msg: `Now print the <b>variable</b>: ${c(printEx(ctx, 'color'))} — no quotes around the name.` };
      if (!lines(r).includes(v.trim())) return { ok: false, msg: `Print the variable so it shows <b>${escapeHTML(v)}</b>.` };
      return { ok: true, msg: `The name plate glows <b>${escapeHTML(v)}</b>. <b>Gate open!</b>` };
    },
    hints: { python: ['color = "blue"', 'color = "blue"\nprint(color)'], javascript: ['let color = "blue";', 'let color = "blue";\nconsole.log(color);'] },
    effect: (game) => game.openGate('A'),
  };
  CH.area = {
    title: 'The Measuring Gate',
    desc: (ctx) => `<p>Variables can hold <b>numbers</b>, and you can do math with them. You have ${c('width')} and ${c('height')} — they're <b>different for every test</b>, so you can't just type the answer.</p>
      <p>Make a new variable ${c('area')} that equals width times height, then print it.</p>`,
    starter: { python: '# width and height change for each test!\nprint(width)\nprint(height)\n', javascript: '// width and height change for each test!\nconsole.log(width);\nconsole.log(height);\n' },
    api: [],
    tests: () => [[4, 3], [7, 2], [5, 5]].map(([w, h]) => ({ label: `width = ${w}, height = ${h}`, globals: { width: w, height: h }, expect: String(w * h) })),
    check(runs) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], got = lastLine(runs[i]);
        if (got !== t.expect) return { ok: false, msg: `Test ${i + 1} (${t.label}): the last thing printed should be <b>${t.expect}</b> but it was <b>${nothing(got)}</b>.` };
      }
      return { ok: true, msg: 'Measured perfectly, every time. <b>Gate open!</b>' };
    },
    hints: { python: ['area = width * height', 'area = width * height\nprint(area)'], javascript: ['let area = width * height;', 'let area = width * height;\nconsole.log(area);'] },
    effect: (game) => game.openGate('C'),
  };
  CH.update = {
    title: 'The Score Keeper',
    desc: (ctx) => `<p>Variables can <b>change</b>! You can give a variable a new value based on its old one:</p>
      <pre>score = score + 5    ${isJS(ctx) ? '//' : '#'} or the shortcut:  score += 5</pre>
      <p>You have a variable ${c('score')} (different each test). <b>Add 5 to it</b>, then print it.${isJS(ctx) ? ' <i>score already exists, so don\'t put <code>let</code> in front of it.</i>' : ''}</p>`,
    starter: { python: '# score already exists. Add 5 to it, then print it.\n', javascript: '// score already exists. Add 5 to it, then print it.\n' },
    api: [],
    tests: () => [10, 0, 95].map(s => ({ label: `score starts at ${s}`, globals: { score: s }, expect: String(s + 5) })),
    check(runs, ctx, code) {
      if (!/score\s*(\+=|=\s*score\s*\+)/.test(stripComments(code, ctx))) return { ok: false, msg: `Change the variable itself: ${c('score = score + 5')} or ${c('score += 5')}, then print it.` };
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], got = lastLine(runs[i]);
        if (got !== t.expect) return { ok: false, msg: `Test ${i + 1} (${t.label}): expected <b>${t.expect}</b> but got <b>${nothing(got)}</b>.` };
      }
      return { ok: true, msg: '+5 every time! <b>Gate open!</b>' };
    },
    hints: { python: ['score += 5', 'score += 5\nprint(score)'], javascript: ['score += 5;', 'score += 5;\nconsole.log(score);'] },
    effect: (game) => game.openGate('D'),
  };

  // ---- Level 3: conditions
  CH.compare = {
    title: 'The Truth Detector',
    desc: (ctx) => `<p>A <b>comparison</b> asks a yes/no question. The answer is a special value: ${c(isJS(ctx) ? 'true' : 'True')} or ${c(isJS(ctx) ? 'false' : 'False')}.</p>
      <pre>${printFn(ctx)}(5 > 3)   ${isJS(ctx) ? '// true' : '# True'}\n${printFn(ctx)}(2 > 9)   ${isJS(ctx) ? '// false' : '# False'}</pre>
      <p>Comparisons: ${c('>')} ${c('<')} ${c('>=')} ${c('<=')} ${c(isJS(ctx) ? '===' : '==')} ${c(isJS(ctx) ? '!==' : '!=')}</p>
      <p>Print whether ${c('hp')} is <b>greater than 50</b>. Tested with 3 values.</p>`,
    starter: { python: '# Print the answer to: is hp greater than 50?\n', javascript: '// Print the answer to: is hp greater than 50?\n' },
    api: [],
    tests: () => [80, 20, 50].map(h => ({ label: `hp = ${h}`, globals: { hp: h }, expect: h > 50 })),
    check(runs, ctx) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], got = lastLine(runs[i]);
        const want = Lang.boolOut(t.expect, ctx.lang);
        if (!Lang.boolOutOk(got, t.expect, ctx.lang)) return { ok: false, msg: `Test ${i + 1} (${t.label}): expected <b>${want}</b> but got <b>${nothing(got)}</b>.` + (t.globals.hp === 50 ? ' <i>Is 50 greater than 50?</i>' : '') };
      }
      return { ok: true, msg: 'The detector agrees with you every time. <b>Gate open!</b>' };
    },
    hints: { python: ['print(hp > 50)'], javascript: ['console.log(hp > 50);'] },
    effect: (game) => game.openGate('A'),
  };
  CH.heal = {
    title: 'The Healing Spring',
    desc: (ctx) => `<p>${c('if')} runs code <b>only when</b> its condition is true:</p>
      <pre>${isJS(ctx) ? 'if (hp < 30) {\n  // runs only when hp is below 30\n}' : 'if hp < 30:\n    # runs only when hp is below 30'}</pre>
      <p>If ${c('hp')} is <b>below 30</b>, call ${c(fn('heal', ctx) + '()')}. Otherwise do nothing. Tested with 4 values.</p>`,
    starter: { python: 'if hp < 30:\n    # what goes here?\n    pass\n', javascript: 'if (hp < 30) {\n  // what goes here?\n}\n' },
    api: ['heal'],
    tests: () => [10, 50, 29, 30].map(h => ({ label: `hp = ${h}`, globals: { hp: h }, expect: h < 30 })),
    check(runs, ctx) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], n = actionsOf(runs[i], 'heal').length;
        if (t.expect && n === 0) return { ok: false, msg: `Test ${i + 1} (${t.label}): you're hurt but didn't heal! Call ${c(fn('heal', ctx) + '()')} inside the if.` };
        if (!t.expect && n > 0) return { ok: false, msg: `Test ${i + 1} (${t.label}): you healed when you didn't need to.` + (t.globals.hp === 30 ? ' <i>30 is not <u>below</u> 30.</i>' : ' <i>Is the heal inside the if?</i>') };
        if (n > 1) return { ok: false, msg: 'Heal only once!' };
      }
      return { ok: true, msg: 'The spring heals only those who need it. <b>Gate open!</b>' };
    },
    hints: { python: ['if hp < 30:\n    heal()'], javascript: ['if (hp < 30) {\n  heal();\n}'] },
    effect: (game) => game.openGate('B'),
  };
  CH.bouncer = {
    title: 'The Ticket Booth',
    desc: (ctx) => `<p>Sometimes you need <b>two</b> things to be true. ${isJS(ctx) ? c('&&') + ' means "and"' : c('and')}: both sides must be true.</p>
      <p>Let the visitor in with ${c(fn('open_gate', ctx) + '()')} only if ${c('age')} is <b>12 or more</b> AND ${c(fn('has_ticket', ctx))} is true. Otherwise call ${c(fn('turn_away', ctx) + '()')}.</p>`,
    starter: { python: 'if age >= 12 and has_ticket:\n    pass\nelse:\n    pass\n', javascript: 'if (age >= 12 && hasTicket) {\n\n} else {\n\n}\n' },
    api: ['open_gate', 'turn_away'],
    tests: () => [[14, true], [14, false], [9, true], [12, true]].map(([a, t]) => ({ label: `age = ${a}, ticket = ${t}`, globals: { age: a, has_ticket: t }, expect: a >= 12 && t ? 'open_gate' : 'turn_away' })),
    check(runs, ctx) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], did = runs[i].actions.map(a => a.fn);
        if (did.length !== 1 || did[0] !== t.expect) return { ok: false, msg: `Test ${i + 1} (${t.label}): expected ${c(fn(t.expect, ctx) + '()')} but your code did ${c(did.length ? did.map(d => fn(d, ctx) + '()').join(' and ') : 'nothing')}.` };
      }
      return { ok: true, msg: 'Every visitor handled correctly. <b>Gate open!</b>' };
    },
    hints: { python: ['if age >= 12 and has_ticket:\n    open_gate()\nelse:\n    turn_away()'], javascript: ['if (age >= 12 && hasTicket) {\n  openGate();\n} else {\n  turnAway();\n}'] },
    effect: (game) => game.openGate('E'),
  };

  // ---- Level 4: loops
  CH.repeat = {
    title: 'The Cheer Machine',
    requires: (ctx) => ctx.save.foundI ? null : 'The machine blinks: <b>"COUNTER NOT FOUND."</b><br>Loops need someone to count for them... Your little friend <b>i</b> is lost somewhere up high in this level. Find them first!',
    desc: (ctx) => `<p>A <b>loop</b> repeats code. Your friend <b>i</b> counts each time it goes around:</p>
      <pre>${isJS(ctx) ? 'for (let i = 0; i < 3; i++) {\n  console.log("Hi");\n}' : 'for i in range(3):\n    print("Hi")'}</pre>
      <p>That prints "Hi" three times. Now make the machine print <b>Hooray!</b> 3 times — using a loop, not 3 prints.</p>`,
    starter: { python: 'for i in range(3):\n    print("Hi")\n', javascript: 'for (let i = 0; i < 3; i++) {\n  console.log("Hi");\n}\n' },
    api: [],
    check(runs, ctx, code) {
      const out = lines(runs[0]);
      if (out.length !== 3 || out.some(l => !/^hooray!?$/i.test(l))) return { ok: false, msg: `The machine wants exactly 3 lines of <b>Hooray!</b> — it got: <b>${escapeHTML(out.join(', ') || 'nothing')}</b>` };
      if (!hasLoop(code, ctx)) return { ok: false, msg: 'Use a loop! i wants to help count.' };
      return { ok: true, msg: 'Hooray ×3! i bounces happily. <b>Gate open!</b>' };
    },
    hints: { python: ['Just change the text inside print.', 'for i in range(3):\n    print("Hooray!")'], javascript: ['Just change the text inside console.log.', 'for (let i = 0; i < 3; i++) {\n  console.log("Hooray!");\n}'] },
    effect: (game) => game.openGate('A'),
  };
  CH.count = {
    title: 'The Number Line',
    desc: (ctx) => `<p>The counter ${c('i')} has a value you can use inside the loop! Print the numbers <b>1 to 10</b>, one per line.</p>
      <p>${isJS(ctx) ? `Start ${c('i')} at 1 and keep going while ${c('i <= 10')}.` : `${c('range(1, 11)')} counts 1, 2, ... 10 — the stop number is <b>not</b> included!`}</p>`,
    starter: { python: 'for i in range(10):\n    print(i)\n', javascript: 'for (let i = 0; i < 10; i++) {\n  console.log(i);\n}\n' },
    api: [],
    check(runs, ctx, code) {
      const out = lines(runs[0]);
      const want = Array.from({ length: 10 }, (_, k) => String(k + 1));
      if (out.join(',') !== want.join(',')) {
        if (out[0] === '0') return { ok: false, msg: 'Close! You started at <b>0</b>. Computers love counting from 0 — but this line starts at <b>1</b>.' };
        return { ok: false, msg: `Expected 1 to 10 but got: <b>${escapeHTML(out.slice(0, 12).join(', ') || 'nothing')}</b>` };
      }
      if (!hasLoop(code, ctx)) return { ok: false, msg: 'Use a loop, not 10 prints!' };
      return { ok: true, msg: '1 to 10, perfectly counted. <b>Gate open!</b>' };
    },
    hints: { python: ['for i in range(1, 11):\n    print(i)'], javascript: ['for (let i = 1; i <= 10; i++) {\n  console.log(i);\n}'] },
    effect: (game) => game.openGate('B'),
  };
  CH.charge = {
    title: 'The Battery',
    desc: (ctx) => `<p>A ${c('while')} loop keeps going <b>as long as</b> its condition is true — perfect when you don't know how many times you'll need.</p>
      <p>The battery is at ${c('charge')} percent. While it's below 100: call ${c(fn('charge_up', ctx) + '()')} and add 10 to ${c('charge')}.${isJS(ctx) ? ' <i>(charge already exists — no <code>let</code>.)</i>' : ''}</p>
      <p>If you forget to change ${c('charge')}, the loop never ends!</p>`,
    starter: { python: 'while charge < 100:\n    charge_up()\n    # don\'t forget to add 10 to charge!\n', javascript: 'while (charge < 100) {\n  chargeUp();\n  // don\'t forget to add 10 to charge!\n}\n' },
    api: ['charge_up'],
    tests: () => [0, 50, 95, 100].map(cv => ({ label: `charge = ${cv}`, globals: { charge: cv }, expect: Math.max(0, Math.ceil((100 - cv) / 10)) })),
    check(runs, ctx, code) {
      if (!/\bwhile\b/.test(stripComments(code, ctx))) return { ok: false, msg: `This battery only works with a ${c('while')} loop.` };
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], n = actionsOf(runs[i], 'charge_up').length;
        if (n !== t.expect) return { ok: false, msg: `Test ${i + 1} (${t.label}): ${c(fn('charge_up', ctx) + '()')} should be called <b>${t.expect}</b> time${t.expect === 1 ? '' : 's'}, but it was called <b>${n}</b>.` };
      }
      return { ok: true, msg: 'Fully charged, every time. <b>Gate open!</b>' };
    },
    hints: { python: ['charge += 10', 'while charge < 100:\n    charge_up()\n    charge += 10'], javascript: ['charge += 10;', 'while (charge < 100) {\n  chargeUp();\n  charge += 10;\n}'] },
    effect: (game) => game.openGate('D'),
  };
  CH.sumloop = {
    title: 'The Gem Counter',
    desc: (ctx) => `<p>Loops can <b>build up</b> an answer. Start a total at 0 and add to it each time around.</p>
      <p>Add up all the numbers from 1 to ${c('n')} (1 + 2 + ... + n) and print the total. Tested with n = 5, 10 and 1.</p>`,
    starter: { python: 'total = 0\nfor i in range(1, n + 1):\n    pass  # add i to total\nprint(total)\n', javascript: 'let total = 0;\nfor (let i = 1; i <= n; i++) {\n  // add i to total\n}\nconsole.log(total);\n' },
    api: [],
    tests: () => [5, 10, 1].map(n => ({ label: `n = ${n}`, globals: { n }, expect: String(n * (n + 1) / 2) })),
    check(runs, ctx, code) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], got = lastLine(runs[i]);
        if (got !== t.expect) return { ok: false, msg: `Test ${i + 1} (${t.label}): the total should be <b>${t.expect}</b> but you printed <b>${nothing(got)}</b>.` };
      }
      if (!hasLoop(code, ctx)) return { ok: false, msg: 'Use a loop to add them up!' };
      return { ok: true, msg: 'Counted every gem. <b>Gate open!</b>' };
    },
    hints: { python: ['total += i', 'total = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)'], javascript: ['total += i;', 'let total = 0;\nfor (let i = 1; i <= n; i++) {\n  total += i;\n}\nconsole.log(total);'] },
    effect: (game) => game.openGate('E'),
  };

  // ---- Level 5: functions
  CH.cheer = {
    title: 'The Cheer Function',
    desc: (ctx) => `<p>A <b>function</b> is a named block of code. <b>Defining</b> it doesn't run it — you have to <b>call</b> it by writing its name with ${c('()')}.</p>
      <p>The function ${c('cheer')} is already defined for you. <b>Call it twice</b>.</p>`,
    starter: { python: 'def cheer():\n    print("Go team!")\n\n# Call it twice below:\n', javascript: 'function cheer() {\n  console.log("Go team!");\n}\n\n// Call it twice below:\n' },
    api: [],
    check(runs) {
      const out = lines(runs[0]);
      if (!out.length) return { ok: false, msg: 'Nothing happened — defining a function doesn\'t run it. Write <code>cheer()</code> to call it!' };
      if (out.length !== 2 || out.some(l => l !== 'Go team!')) return { ok: false, msg: `Expected "Go team!" exactly twice, but got: <b>${escapeHTML(out.join(', '))}</b>` };
      return { ok: true, msg: 'Go team! Go team! <b>Gate open!</b>' };
    },
    hints: { python: ['cheer()\ncheer()'], javascript: ['cheer();\ncheer();'] },
    effect: (game) => game.openGate('A'),
  };
  CH.echo = {
    title: 'The Echo Chamber',
    desc: (ctx) => `<p>Functions can take <b>inputs</b> called <b>parameters</b>. Inside the function, the parameter works like a variable.</p>
      <pre>${isJS(ctx) ? 'function hello(name) {\n  console.log("Hi " + name);\n}\nhello("Ada");   // Hi Ada' : 'def hello(name):\n    print("Hi " + name)\n\nhello("Ada")   # Hi Ada'}</pre>
      <p>Write a function ${c('echo')} that takes a ${c('word')} and prints it <b>twice</b> (on two lines). The chamber will test it with different words.</p>`,
    starter: { python: 'def echo(word):\n    # print word two times\n    pass\n\necho("hello")\n', javascript: 'function echo(word) {\n  // print word two times\n}\n\necho("hello");\n' },
    api: [],
    callTests: [{ fn: 'echo', args: ['hello'] }, { fn: 'echo', args: ['Syntaxia'] }],
    check(runs, ctx) {
      for (let i = 0; i < this.callTests.length; i++) {
        const call = runs[0].calls[i], w = this.callTests[i].args[0];
        if (!call || call.error) return { ok: false, msg: call && !/not defined/.test(call.error) ? `${c('echo(' + show(w) + ')')} crashed: <b>${escapeHTML(call.error)}</b>` : `I can't find a function called ${c('echo')}.` };
        const got = (call.printed || '').split('\n').map(s => s.trim()).filter(Boolean);
        if (got.length !== 2 || got.some(x => x !== w)) return { ok: false, msg: `${c('echo(' + show(w) + ')')} should print <b>${escapeHTML(w)}</b> twice, but it printed: <b>${escapeHTML(got.join(', ') || 'nothing')}</b>` + (got.includes('word') ? ' <i>(Don\'t put quotes around word!)</i>' : '') };
      }
      return { ok: true, msg: 'hello... hello... <b>Gate open!</b>' };
    },
    hints: { python: ['def echo(word):\n    print(word)\n    print(word)'], javascript: ['function echo(word) {\n  console.log(word);\n  console.log(word);\n}'] },
    effect: (game) => game.openGate('B'),
  };
  CH.biggest = {
    title: 'The Judge',
    desc: (ctx) => `<p>Functions can use everything you've learned — including ${c('if')}. Write a function ${c('biggest')} that takes two numbers ${c('a')} and ${c('b')} and <b>returns</b> the larger one.</p>
      <pre>biggest(3, 9)   →  9\nbiggest(10, 2)  →  10</pre>`,
    starter: { python: 'def biggest(a, b):\n    if a > b:\n        return a\n    # what if a is not bigger?\n', javascript: 'function biggest(a, b) {\n  if (a > b) {\n    return a;\n  }\n  // what if a is not bigger?\n}\n' },
    api: [],
    callTests: [{ fn: 'biggest', args: [3, 9] }, { fn: 'biggest', args: [10, 2] }, { fn: 'biggest', args: [-1, -5] }, { fn: 'biggest', args: [4, 4] }],
    check(runs, ctx) { return checkCalls(runs[0], this.callTests, [9, 10, -1, 4], ctx, 'biggest'); },
    hints: { python: ['def biggest(a, b):\n    if a > b:\n        return a\n    return b'], javascript: ['function biggest(a, b) {\n  if (a > b) {\n    return a;\n  }\n  return b;\n}'] },
    effect: (game) => game.openGate('H'),
  };

  // ---- Level 6: classes
  CH.crate = {
    title: 'The Mystery Crate',
    desc: (ctx) => `<p>A <b>class</b> is a blueprint. Making something from the blueprint gives you an <b>object</b>, and objects carry data called <b>attributes</b>.</p>
      <p>The ${c('Crate')} blueprint is written for you. Create a crate object, then print its ${c('contents')} attribute using a dot: ${c(isJS(ctx) ? 'myCrate.contents' : 'my_crate.contents')}.</p>`,
    starter: {
      python: 'class Crate:\n    def __init__(self):\n        self.contents = "golden key"\n\n# 1. Make an object:   my_crate = Crate()\n# 2. Print its contents\n',
      javascript: 'class Crate {\n  constructor() {\n    this.contents = "golden key";\n  }\n}\n\n// 1. Make an object:   const myCrate = new Crate();\n// 2. Print its contents\n',
    },
    api: [],
    check(runs, ctx, code) {
      const src = stripComments(code, ctx);
      const made = ctx.lang === 'python' ? /Crate\s*\(\s*\)/ : ctx.lang === 'cpp' ? /\bCrate\s+\w+\s*[;({=]|Crate\s*\(\s*\)/ : /new\s+Crate\s*\(/;
      if (!made.test(src.replace(/class\s+Crate/, ''))) return { ok: false, msg: `First create an object from the blueprint: ${c(ctx.lang === 'python' ? 'Crate()' : ctx.lang === 'cpp' ? 'Crate my_crate;' : 'new Crate()')}.` };
      if (!lines(runs[0]).includes('golden key')) return { ok: false, msg: `Now print the object's ${c('contents')} attribute.` };
      if (!/\.contents/.test(src)) return { ok: false, msg: 'Read it from the object with <code>.contents</code> — don\'t just type it!' };
      return { ok: true, msg: 'The crate creaks open: a <b>golden key</b>! <b>Gate open!</b>' };
    },
    hints: { python: ['my_crate = Crate()\nprint(my_crate.contents)'], javascript: ['const myCrate = new Crate();\nconsole.log(myCrate.contents);'] },
    effect: (game) => game.openGate('A'),
  };
  CH.potion = {
    title: 'The Potion Brewery',
    desc: (ctx) => `<p>The real power of classes: <b>one blueprint, many different objects</b>. ${isJS(ctx) ? c('constructor') : c('__init__')} can take inputs so each object gets its own values, and <b>methods</b> are functions that belong to the object.</p>
      <p>Finish the ${c('Potion')} class: store ${c('power')} on the object, and make ${c('describe()')} return text like <b>Potion of power 3</b>.</p>
      <p>Then ${c(fn('brew', ctx))} <b>two</b> potions with <b>different</b> powers.</p>`,
    starter: {
      python: 'class Potion:\n    def __init__(self, power):\n        self.power = power\n\n    def describe(self):\n        return "..."   # use self.power here\n\nbrew(Potion(3))\n# brew a second, stronger potion\n',
      javascript: 'class Potion {\n  constructor(power) {\n    this.power = power;\n  }\n\n  describe() {\n    return "...";   // use this.power here\n  }\n}\n\nbrew(new Potion(3));\n// brew a second, stronger potion\n',
    },
    api: ['brew'],
    check(runs, ctx) {
      const pots = actionsOf(runs[0], 'brew').map(a => a.args[0]);
      if (pots.length < 2) return { ok: false, msg: `Brew <b>two</b> potions — you brewed ${pots.length}.` };
      for (const p of pots) {
        if (!p || !p.__obj) return { ok: false, msg: 'You can only brew Potion <b>objects</b>.' };
        if (typeof p.props.power !== 'number') return { ok: false, msg: `Each potion needs a number ${c('power')}.` };
        const d = p.methods.describe;
        if (!d || d.error) return { ok: false, msg: `${c('describe()')} ${d && d.error ? 'crashed: <b>' + escapeHTML(d.error) + '</b>' : 'is missing'}.` };
        if (d.value !== `Potion of power ${p.props.power}`) return { ok: false, msg: `For a potion with power ${p.props.power}, ${c('describe()')} should return <b>Potion of power ${p.props.power}</b> but returned <b>${escapeHTML(show(d.value))}</b>.` };
      }
      if (new Set(pots.map(p => p.props.power)).size < 2) return { ok: false, msg: 'Give your two potions <b>different</b> powers!' };
      return { ok: true, msg: `Brewed: ${pots.map(p => '<b>' + escapeHTML(p.methods.describe.value) + '</b>').join(' and ')}. <b>Gate open!</b>` };
    },
    hints: { python: ['return "Potion of power " + str(self.power)', 'class Potion:\n    def __init__(self, power):\n        self.power = power\n\n    def describe(self):\n        return f"Potion of power {self.power}"\n\nbrew(Potion(3))\nbrew(Potion(8))'], javascript: ['return "Potion of power " + this.power;', 'class Potion {\n  constructor(power) {\n    this.power = power;\n  }\n  describe() {\n    return `Potion of power ${this.power}`;\n  }\n}\n\nbrew(new Potion(3));\nbrew(new Potion(8));'] },
    effect: (game) => game.openGate('B'),
  };

  // ---- Open world: list & string warm-ups
  CH.backpack = {
    title: 'Side Quest — The Backpack',
    desc: (ctx) => `<p>A <b>list</b> holds many values in order. Each item has a position called an <b>index</b>, starting at <b>0</b>:</p>
      <pre>items = ["sword", "map", "apple"]\nitems[0]          → "sword"\n${isJS(ctx) ? 'items[items.length - 1]' : 'items[-1]        '} → "apple"\n${isJS(ctx) ? 'items.length' : 'len(items)'}       → 3</pre>
      <p>Print 3 lines about ${c('inventory')}: the <b>first</b> item, the <b>last</b> item, and <b>how many</b> items there are.</p>`,
    starter: { python: '# inventory is a list, e.g. ["sword", "map", "apple"]\nprint(inventory)\n', javascript: '// inventory is an array, e.g. ["sword", "map", "apple"]\nconsole.log(inventory);\n' },
    api: [],
    tests: () => [['sword', 'map', 'apple'], ['key', 'rope'], ['gem']].map(a => ({ label: `inventory = ${show(a)}`, globals: { inventory: a }, expect: [a[0], a[a.length - 1], String(a.length)] })),
    check(runs) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], out = lines(runs[i]).map(s => s.replace(/^['"]|['"]$/g, ''));
        const got = out.slice(-3);
        if (got.join('|') !== t.expect.join('|')) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): your last 3 lines should be <b>${escapeHTML(t.expect.join(', '))}</b> but were <b>${escapeHTML(got.join(', ') || 'nothing')}</b>.` };
      }
      return { ok: true, msg: 'Backpack sorted! <b>+1 skill point!</b>' };
    },
    hints: { python: ['print(inventory[0])\nprint(inventory[-1])\nprint(len(inventory))'], javascript: ['console.log(inventory[0]);\nconsole.log(inventory[inventory.length - 1]);\nconsole.log(inventory.length);'] },
    effect: (game, data, instant) => game.gainSideQuest('backpack', instant),
  };
  CH.crier = {
    title: 'Side Quest — The Town Crier',
    desc: (ctx) => `<p>Strings (text) come with built-in <b>methods</b> — tools you call with a dot:</p>
      <pre>${isJS(ctx) ? '"hi".toUpperCase()   → "HI"\n"HI".toLowerCase()   → "hi"' : '"hi".upper()   → "HI"\n"HI".lower()   → "hi"'}</pre>
      <p>The crier shouts every ${c('message')}: print it in <b>UPPERCASE</b> with an ${c('!')} on the end. ${c('"hello"')} → <b>HELLO!</b></p>`,
    starter: { python: '# message changes for each test\nprint(message)\n', javascript: '// message changes for each test\nconsole.log(message);\n' },
    api: [],
    tests: () => ['hello', 'bugs ahead', 'the gate is open'].map(m => ({ label: `message = ${show(m)}`, globals: { message: m }, expect: m.toUpperCase() + '!' })),
    check(runs) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], got = lastLine(runs[i]);
        if (got !== t.expect) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): expected <b>${escapeHTML(t.expect)}</b> but got <b>${nothing(got)}</b>.` };
      }
      return { ok: true, msg: 'HEAR YE, HEAR YE! <b>+1 skill point!</b>' };
    },
    hints: { python: ['print(message.upper() + "!")'], javascript: ['console.log(message.toUpperCase() + "!");'] },
    effect: (game, data, instant) => game.gainSideQuest('crier', instant),
  };

  // ================================================================ deeper lessons (longer levels)
  // ---- Level 1: print()
  CH.textjoin = {
    title: 'The Name Smith',
    desc: (ctx) => `<p>The ${c('+')} sign <b>glues text together</b>. It doesn't add a space — you get exactly what you glue.</p>
      <p>The smith needs the name <b>SuperCoder</b>, made by joining the text ${c('"Super"')} and ${c('"Coder"')} with ${c('+')}.</p>`,
    starter: { python: '# Glue two pieces of text with +\nprint("Super")\n', javascript: '// Glue two pieces of text with +\nconsole.log("Super");\n' },
    api: [],
    check(runs, ctx, code) {
      const src = stripComments(code, ctx);
      const out = lines(runs[0]);
      if (/SuperCoder/.test(src)) return { ok: false, msg: 'Don\'t type <b>SuperCoder</b> as one word — make the computer glue <code>"Super"</code> and <code>"Coder"</code> with <code>+</code>.' };
      if (out.includes('Super Coder')) return { ok: false, msg: 'There\'s a space in there! <code>+</code> adds nothing between the pieces — check your quotes for extra spaces.' };
      if (!out.includes('SuperCoder')) return { ok: false, msg: `The smith needs to see <b>SuperCoder</b> printed. You printed <b>${escapeHTML(out.join(' / ') || 'nothing')}</b>.` };
      if (!/["'`]\s*\+\s*["'`]/.test(src)) return { ok: false, msg: 'Join the two texts with <code>+</code>.' };
      return { ok: true, msg: '<b>SuperCoder</b>, forged from two pieces. <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('C'),
  };
  CH.order = {
    title: 'The Bracket Bridge',
    desc: (ctx) => `<p>Just like in maths class, the computer does ${c('*')} and ${c('/')} <b>before</b> ${c('+')} and ${c('-')}. Brackets ${c('( )')} go first of all.</p>
      <p>Print the answer to <b>(10 + 5) × 2</b>, then on the next line the answer to <b>10 + 5 × 2</b>. Notice how different they are!</p>`,
    starter: { python: '# Brackets are calculated first\n', javascript: '// Brackets are calculated first\n' },
    api: [],
    check(runs, ctx, code) {
      const src = stripComments(code, ctx), out = lines(runs[0]);
      if (/\b(30|20)\b/.test(src)) return { ok: false, msg: 'Let the computer work it out — don\'t type the answers!' };
      if (!/\(\s*10\s*\+\s*5\s*\)\s*\*\s*2/.test(src)) return { ok: false, msg: 'For the first one, put brackets around <code>10 + 5</code> so it happens first.' };
      const a = out.indexOf('30'), b = out.indexOf('20');
      if (a < 0) return { ok: false, msg: 'I don\'t see the answer to (10 + 5) × 2 yet.' };
      if (b < 0) return { ok: false, msg: 'Now print 10 + 5 × 2 without brackets.' };
      if (b < a) return { ok: false, msg: 'Print the bracket version first.' };
      return { ok: true, msg: '30 and 20 — brackets change everything! <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('E'),
  };
  CH.sep = {
    title: 'The Scoreboard',
    desc: (ctx) => `<p>You can give ${c(printFn(ctx))} <b>several things at once</b>, separated by commas. It puts a space between them — and they can be different kinds of values!</p>
      <pre>${printFn(ctx)}("Level", 3)   ${isJS(ctx) ? '//' : '#'} Level 3</pre>
      <p>Print <b>Score: 100</b> using a comma between the text ${c('"Score:"')} and the calculation ${c('25 * 4')}.</p>`,
    starter: { python: '# print can take several values, separated by commas\n', javascript: '// console.log can take several values, separated by commas\n' },
    api: [],
    check(runs, ctx, code) {
      const src = stripComments(code, ctx), out = lines(runs[0]);
      if (/100/.test(src)) return { ok: false, msg: 'Let the computer calculate <code>25 * 4</code>.' };
      const sepOk = ctx.lang === 'cpp' ? /["']Score:\s*["']\s*<<\s*25\s*\*\s*4/ : isC(ctx) ? /["']Score:\s*["']\s*\+\s*25\s*\*\s*4|\{\s*25\s*\*\s*4\s*\}/ : /["'`]Score:\s*["'`]\s*,\s*25\s*\*\s*4/;
      if (!sepOk.test(src)) return { ok: false, msg: ctx.lang === 'cpp' ? 'Chain the two values with <code>&lt;&lt;</code>: the text <code>"Score: "</code>, then the calculation <code>25 * 4</code>.' : isC(ctx) ? 'Join the text <code>"Score: "</code> and the calculation <code>25 * 4</code> with <code>+</code>.' : 'Put a <b>comma</b> between the text <code>"Score:"</code> and the calculation <code>25 * 4</code>.' };
      if (!out.includes('Score: 100')) return { ok: false, msg: `The scoreboard should show <b>Score: 100</b> but shows <b>${escapeHTML(out.join(' / ') || 'nothing')}</b>.` };
      return { ok: true, msg: '<b>Score: 100</b> lights up the board. <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('G'),
  };

  // ---- Level 2: variables
  CH.types = {
    title: 'The Type Scanner',
    desc: (ctx) => `<p>Variables can hold different <b>types</b> of value:</p>
      <ul><li><b>text</b> (a string) — in quotes: ${c('"Ada"')}</li><li><b>numbers</b> — no quotes: ${c('7')}</li><li><b>true/false</b> (a boolean): ${c(isJS(ctx) ? 'true' : 'True')} or ${c(isJS(ctx) ? 'false' : 'False')}</li></ul>
      <p>Make three variables: ${c('name')} holding <b>text</b>, ${c('level')} holding a <b>number</b>, and ${c('alive')} holding ${c(isJS(ctx) ? 'true' : 'True')}.</p>`,
    starter: { python: '# text, number, and True/False\n', javascript: '// text, number, and true/false\n' },
    api: [],
    captureVars: ['name', 'level', 'alive'],
    check(runs, ctx) {
      const v = runs[0].vars;
      const T = Lang.get(ctx.lang).True;
      if (v.name === undefined) return { ok: false, msg: `Make a variable called ${c('name')}.` };
      if (typeof v.name !== 'string') return { ok: false, msg: `${c('name')} should hold <b>text</b> — put it in quotes.` };
      if (v.level === undefined) return { ok: false, msg: `Make a variable called ${c('level')}.` };
      if (typeof v.level !== 'number') return { ok: false, msg: `${c('level')} should be a <b>number</b>. ${typeof v.level === 'string' ? 'Remove the quotes — <code>"5"</code> is text that looks like a number!' : ''}` };
      if (v.alive === undefined) return { ok: false, msg: `Make a variable called ${c('alive')}.` };
      if (v.alive !== true) return { ok: false, msg: `${c('alive')} should be ${c(T)}${typeof v.alive === 'string' ? ' — without quotes, and' : ''} spelled exactly like that${ctx.lang === 'python' ? ' (capital T)' : ''}.` };
      return { ok: true, msg: 'Scanner reads: text ✔ number ✔ boolean ✔. <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('B'),
  };
  CH.combine = {
    title: 'The Name Badge',
    desc: (ctx) => `<p>Let's build a sentence out of variables. The badge machine has ${c('hero')} (text) and ${c('coins')} (a number) — different for each test.</p>
      <p>Print a sentence like <b>Ada has 5 coins</b>.</p>
      <p>${isJS(ctx) ? `Tip: ${c('+')} can glue text and numbers in JavaScript, or use a template string: ${c('`${hero} has ...`')}` : `Careful: ${c('+')} can't glue text to a number! Turn the number into text with ${c('str(coins)')}, or use an f-string: ${c('f"{hero} has ..."')}`}</p>`,
    starter: { python: 'print(hero)\nprint(coins)\n', javascript: 'console.log(hero);\nconsole.log(coins);\n' },
    api: [],
    tests: () => [['Ada', 5], ['Linus', 120], ['Grace', 0]].map(([h, n]) => ({ label: `hero = ${show(h)}, coins = ${n}`, globals: { hero: h, coins: n }, expect: `${h} has ${n} coins` })),
    check(runs) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], got = lastLine(runs[i]);
        if (got !== t.expect) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): expected <b>${escapeHTML(t.expect)}</b> but got <b>${nothing(got)}</b>. Watch the spaces!` };
      }
      return { ok: true, msg: 'Badges printed for everyone. <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('E'),
  };

  // ---- Level 3: conditions
  CH.even = {
    title: 'The Even Door',
    desc: (ctx) => `<p>The ${c('%')} operator gives the <b>remainder</b> after dividing: ${c('7 % 2')} is <b>1</b>, ${c('8 % 2')} is <b>0</b>.</p>
      <p>A number is <b>even</b> when ${c('number % 2')} is 0. Print <b>even</b> or <b>odd</b> for ${c('number')}. Tested with 4 numbers.</p>`,
    starter: { python: 'print(number % 2)\n', javascript: 'console.log(number % 2);\n' },
    api: [],
    tests: () => [4, 7, 0, 13].map(n => ({ label: `number = ${n}`, globals: { number: n }, expect: n % 2 === 0 ? 'even' : 'odd' })),
    check(runs) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], got = lastLine(runs[i]);
        if (got !== t.expect) return { ok: false, msg: `Test ${i + 1} (${t.label}): expected <b>${t.expect}</b> but got <b>${nothing(got)}</b>.` + (t.globals.number === 0 ? ' <i>0 counts as even!</i>' : '') };
      }
      return { ok: true, msg: 'The door knows its evens from its odds. <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('D'),
  };
  CH.orgate = {
    title: 'The Weather Vane',
    desc: (ctx) => `<p>${isJS(ctx) ? c('||') + ' means "or"' : c('or')}: the condition is true if <b>either</b> side is true.</p>
      <p>If ${c('weather')} is ${c('"rain"')} <b>or</b> ${c('"snow"')}, call ${c(fn('umbrella', ctx) + '()')}. For any other weather, call ${c(fn('sunglasses', ctx) + '()')}.</p>`,
    starter: { python: 'if weather == "rain":\n    umbrella()\nelse:\n    sunglasses()\n', javascript: 'if (weather === "rain") {\n  umbrella();\n} else {\n  sunglasses();\n}\n' },
    api: ['umbrella', 'sunglasses'],
    tests: () => ['rain', 'snow', 'sun', 'wind'].map(w => ({ label: `weather = "${w}"`, globals: { weather: w }, expect: w === 'rain' || w === 'snow' ? 'umbrella' : 'sunglasses' })),
    check(runs, ctx) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], did = runs[i].actions.map(a => a.fn);
        if (did.length !== 1 || did[0] !== t.expect) return { ok: false, msg: `Test ${i + 1} (${t.label}): expected ${c(fn(t.expect, ctx) + '()')} but your code did ${c(did.length ? did.map(d => fn(d, ctx) + '()').join(' and ') : 'nothing')}.` + (t.globals.weather === 'snow' ? ` <i>Each side of ${ctx.lang === 'python' ? 'or' : '||'} needs its own full comparison: <code>weather ${ctx.lang === 'javascript' ? '===' : '=='} "snow"</code>.</i>` : '') };
      }
      return { ok: true, msg: 'Ready for any weather. <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('G'),
  };

  // ---- Level 4: loops
  CH.listloop = {
    title: 'The Loot Parade',
    desc: (ctx) => `<p>Loops can walk through a <b>list</b> of things, one item at a time:</p>
      <pre>${isJS(ctx) ? 'for (const fruit of ["apple", "pear"]) {\n  console.log(fruit);\n}' : 'for fruit in ["apple", "pear"]:\n    print(fruit)'}</pre>
      <p>Print every item in ${c('loot')}, one per line. The list changes for each test — it might even be empty!</p>`,
    starter: { python: '# loot is a list, e.g. ["coin", "gem", "key"]\nprint(loot)\n', javascript: '// loot is a list, e.g. ["coin", "gem", "key"]\nconsole.log(loot);\n' },
    api: [],
    tests: () => [['coin', 'gem', 'key'], ['map'], []].map(l => ({ label: `loot = ${show(l)}`, globals: { loot: l }, expect: l })),
    check(runs, ctx, code) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], out = lines(runs[i]);
        if (out.join('|') !== t.expect.join('|')) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): expected ${t.expect.length ? '<b>' + escapeHTML(t.expect.join(', ')) + '</b> on separate lines' : '<b>nothing</b> (the list is empty)'} but got <b>${escapeHTML(out.join(', ') || 'nothing')}</b>.` };
      }
      if (!hasLoop(code, ctx)) return { ok: false, msg: 'Use a loop to walk through the list.' };
      return { ok: true, msg: 'The loot marches past, one by one. <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('C'),
  };
  CH.breakloop = {
    title: 'The Mine Cart',
    desc: (ctx) => `<p>${c('break')} jumps <b>out</b> of a loop early — handy when you find what you're looking for (or hit danger!).</p>
      <p>Ride along ${c('rails')}: print each piece of track. If you reach a ${c('"gap"')}, print <b>Stop!</b> and ${c('break')} out of the loop straight away.</p>`,
    starter: { python: 'for piece in rails:\n    print(piece)\n', javascript: 'for (const piece of rails) {\n  console.log(piece);\n}\n' },
    api: [],
    tests: () => [['track', 'track', 'gap', 'track'], ['gap', 'track'], ['track', 'track']].map(r => {
      const exp = []; for (const p of r) { if (p === 'gap') { exp.push('Stop!'); break; } exp.push(p); }
      return { label: `rails = ${show(r)}`, globals: { rails: r }, expect: exp };
    }),
    check(runs, ctx, code) {
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], out = lines(runs[i]);
        if (out.join('|') !== t.expect.join('|')) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): expected <b>${escapeHTML(t.expect.join(', '))}</b> but got <b>${escapeHTML(out.join(', ') || 'nothing')}</b>.` };
      }
      if (!/\bbreak\b/.test(stripComments(code, ctx))) return { ok: false, msg: 'Use <code>break</code> to stop the cart.' };
      return { ok: true, msg: 'Stopped right at the edge! <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('G'),
  };

  // ---- Level 5: functions
  CH.square = {
    title: 'The Square Garden',
    desc: (ctx) => `<p>A returned value can be <b>used</b> like any other value — stored, printed, or even added to another returned value!</p>
      <p>Write ${c('square')} that returns ${c('n * n')}. Then print ${c('square(3) + square(4)')} (it should show 25).</p>`,
    starter: { python: 'def square(n):\n    pass  # return n times n\n', javascript: 'function square(n) {\n  // return n times n\n}\n' },
    api: [],
    callTests: [{ fn: 'square', args: [5] }, { fn: 'square', args: [0] }, { fn: 'square', args: [-3] }],
    check(runs, ctx, code) {
      const r = checkCalls(runs[0], this.callTests, [25, 0, 9], ctx, 'square');
      if (!r.ok) return r;
      const sq = tn('square', ctx);
      if (!new RegExp(sq + '\\(\\s*3\\s*\\)\\s*\\+\\s*' + sq + '\\(\\s*4\\s*\\)').test(stripComments(code, ctx))) return { ok: false, msg: `Your function works! Now print ${c(sq + '(3) + ' + sq + '(4)')}.` };
      if (!lines(runs[0]).includes('25')) return { ok: false, msg: 'Print the result of <code>square(3) + square(4)</code>.' };
      return { ok: true, msg: '9 + 16 = 25 — returned values add up! <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('C'),
  };
  CH.evenfn = {
    title: 'The Even Oracle',
    desc: (ctx) => `<p>Functions can return ${c(isJS(ctx) ? 'true' : 'True')} or ${c(isJS(ctx) ? 'false' : 'False')} — then you can use them in an ${c('if')}!</p>
      <p>Write ${c('even')} that takes a number ${c('n')} and returns ${c(isJS(ctx) ? 'true' : 'True')} if it's even, ${c(isJS(ctx) ? 'false' : 'False')} if it's odd. (Remember ${c('%')} from the Conditions level?)</p>`,
    starter: { python: 'def even(n):\n    pass\n\nprint(even(4))\n', javascript: 'function even(n) {\n\n}\n\nconsole.log(even(4));\n' },
    api: [],
    callTests: [{ fn: 'even', args: [4] }, { fn: 'even', args: [7] }, { fn: 'even', args: [0] }, { fn: 'even', args: [11] }],
    check(runs, ctx) {
      const calls = runs[0].calls;
      if (calls.some(cl => typeof cl.value === 'string')) return { ok: false, msg: `Return the value ${c(Lang.get(ctx.lang).True)} itself, not the text ${c('"' + Lang.get(ctx.lang).True + '"')} in quotes.` };
      return checkCalls(runs[0], this.callTests, [true, false, true, false], ctx, 'even');
    },
    effect: (game) => game.openGate('E'),
  };

  // ---- Level 6: classes
  CH.lamp = {
    title: 'The Magic Lamp',
    desc: (ctx) => `<p>Methods can <b>change</b> an object's attributes. The ${c('Lamp')} class is almost done — the ${c('toggle')} method should flip ${c(isJS(ctx) ? 'this.on' : 'self.on')} from off to on, or on to off.</p>
      <p>${isJS(ctx) ? c('!') + ' flips true/false: ' + c('!true') + ' is false.' : c('not') + ' flips True/False: ' + c('not True') + ' is False.'} The code at the bottom already tests it.</p>`,
    starter: {
      python: 'class Lamp:\n    def __init__(self):\n        self.on = False\n\n    def status(self):\n        return "on" if self.on else "off"\n\n    def toggle(self):\n        pass  # flip self.on\n\nlamp = Lamp()\nprint(lamp.status())\nlamp.toggle()\nprint(lamp.status())\nlamp.toggle()\nprint(lamp.status())\n',
      javascript: 'class Lamp {\n  constructor() {\n    this.on = false;\n  }\n\n  status() {\n    return this.on ? "on" : "off";\n  }\n\n  toggle() {\n    // flip this.on\n  }\n}\n\nconst lamp = new Lamp();\nconsole.log(lamp.status());\nlamp.toggle();\nconsole.log(lamp.status());\nlamp.toggle();\nconsole.log(lamp.status());\n',
    },
    api: [],
    check(runs) {
      const out = lines(runs[0]);
      if (out.join(',') !== 'off,on,off') return { ok: false, msg: `The lamp should go <b>off → on → off</b>, but it went <b>${escapeHTML(out.join(' → ') || 'nowhere')}</b>.` };
      return { ok: true, msg: 'Click, click! The lamp obeys. <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('C'),
  };
  CH.wallet = {
    title: 'The Coin Purse',
    desc: (ctx) => `<p>Methods can take <b>inputs</b> too. Finish the ${c('add')} method so it increases ${c(isJS(ctx) ? 'this.coins' : 'self.coins')} by ${c('amount')}.</p>
      <p>Notice the test code makes <b>two</b> purses — each object keeps its <b>own</b> coins.</p>`,
    starter: {
      python: 'class Wallet:\n    def __init__(self):\n        self.coins = 0\n\n    def add(self, amount):\n        pass  # increase self.coins by amount\n\nmine = Wallet()\nmine.add(5)\nmine.add(10)\nprint(mine.coins)\n\nyours = Wallet()\nyours.add(3)\nprint(yours.coins)\n',
      javascript: 'class Wallet {\n  constructor() {\n    this.coins = 0;\n  }\n\n  add(amount) {\n    // increase this.coins by amount\n  }\n}\n\nconst mine = new Wallet();\nmine.add(5);\nmine.add(10);\nconsole.log(mine.coins);\n\nconst yours = new Wallet();\nyours.add(3);\nconsole.log(yours.coins);\n',
    },
    api: [],
    check(runs) {
      const out = lines(runs[0]);
      if (out.join(',') !== '15,3') return { ok: false, msg: `Expected <b>15</b> then <b>3</b>, but got <b>${escapeHTML(out.join(', ') || 'nothing')}</b>.` + (out[1] === '18' ? ' <i>Did you store coins somewhere shared instead of on the object?</i>' : '') };
      return { ok: true, msg: '15 coins in yours, 3 in theirs — every object has its own data. <b>Gate open!</b>' };
    },
    effect: (game) => game.openGate('D'),
  };

  // ---- Open world
  CH.bag = {
    title: 'Side Quest — The Supply Bag',
    desc: (ctx) => `<p>Lists can <b>grow</b>! ${c(isJS(ctx) ? 'list.push(x)' : 'list.append(x)')} adds ${c('x')} to the end.</p>
      <p>Add ${c('"potion"')} to ${c('bag')}, then print how many items it holds, and then its last item.</p>`,
    starter: { python: '# bag is a list, e.g. ["rope", "torch"]\nprint(bag)\n', javascript: '// bag is a list, e.g. ["rope", "torch"]\nconsole.log(bag);\n' },
    api: [],
    tests: () => [['rope', 'torch'], [], ['map', 'key', 'coin']].map(b => ({ label: `bag = ${show(b)}`, globals: { bag: b }, expect: [String(b.length + 1), 'potion'] })),
    check(runs, ctx, code) {
      const addName = Lang.get(ctx.lang).append;
      if (!new RegExp('\\.' + addName + '\\s*\\(').test(stripComments(code, ctx))) return { ok: false, msg: `Add to the list with ${c('bag.' + addName + '(...)')}.` };
      for (let i = 0; i < runs.length; i++) {
        const t = runs.tests[i], got = lines(runs[i]).slice(-2).map(s => s.replace(/^['"]|['"]$/g, ''));
        if (got.join('|') !== t.expect.join('|')) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): your last two lines should be <b>${t.expect.join(', ')}</b> but were <b>${escapeHTML(got.join(', ') || 'nothing')}</b>.` };
      }
      return { ok: true, msg: 'Bag packed. <b>+1 skill point!</b>' };
    },
    effect: (game, data, instant) => game.gainSideQuest('bag', instant),
  };

  function checkCalls(run, tests, expected, ctx, name) {
    name = tn(name, ctx);
    for (let i = 0; i < tests.length; i++) {
      const call = run.calls[i];
      const args = tests[i].args.map(show).join(', ');
      if (!call) return { ok: false, msg: `Couldn't find the function ${c(name)}.` };
      if (call.error) {
        if (/is not defined/.test(call.error)) return { ok: false, msg: `There's no function called ${c(name)}. Make sure you ${ctx.lang === 'javascript' ? `wrote ${c('function ' + name + '(...)')}` : ctx.lang === 'python' ? `used ${c('def ' + name + '(...):')}` : `defined ${c(name + '(...)')} with a return type`} and spelled it exactly (capitals matter!).` };
        return { ok: false, msg: `${c(name + '(' + escapeHTML(args) + ')')} crashed: <b>${escapeHTML(call.error)}</b>` };
      }
      if (show(call.value) !== show(expected[i])) {
        const none = call.value === null ? ` <i>(${isC(ctx) ? 'Nothing' : Lang.get(ctx.lang).none} means nothing was <b>returned</b> — did you forget ${c('return')}?)</i>` : '';
        return { ok: false, msg: `${c(name + '(' + escapeHTML(args) + ')')} returned ${c(call.value === null ? Lang.get(ctx.lang).none : escapeHTML(show(call.value)))} but should return ${c(escapeHTML(show(expected[i])))}.${none}` };
      }
    }
    return { ok: true, msg: `All ${tests.length} tests pass! ✔ Your function ${c(name)} works.` };
  }

  function escapeHTML(s) { return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }

  // ------------------------------------------------------------ glitches (enemies give your code errors!)
  const GLITCHES = {
    syntax: { name: 'SyntaxError', effect: 'Jump disabled', color: '#ff5470', icon: '' },
    name: { name: 'NameError', effect: 'Controls reversed', color: '#b07cff', icon: '' },
    type: { name: 'TypeError', effect: 'Movement slowed', color: '#ffa53b', icon: '' },
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
  const gate = (m, x, g, top) => { m.fill(x, 0, x, (top || 13) - 1, 'W'); m.fill(x, top || 13, x, (top || 13) + 1, g); };
  function level1() {
    const m = MapBuilder(124, 17);
    m.fill(0, 15, 123, 16, '#');
    m.put(2, 14, 'P'); m.put(5, 14, '?');
    m.put(8, 13, '---'); m.put(12, 11, '---'); m.put(13, 10, 'o'); m.put(9, 12, 'o');
    m.put(15, 14, '?');
    let x = room(m, 16, 1, 'wall', 'A');
    x = TR.hills(m, x);
    x = room(m, x, 2, 'climb', 'B');
    x = TR.pit(m, x + 1);
    m.put(x + 1, 14, '?');
    x = room(m, x + 2, 3, 'bridge', 'C');
    x = TR.tower(m, x + 1);
    x = room(m, x, 4, 'spring', 'D');
    x = room(m, x + 1, 5, 'climb', 'E');
    x = TR.hills(m, x);
    x = room(m, x, 6, 'wall', 'G');
    m.put(x + 3, 14, 'F');
    return m;
  }
  function level2() {
    const m = MapBuilder(132, 17);
    m.fill(0, 15, 131, 16, '#');
    m.put(2, 14, 'P'); m.put(4, 14, '?');
    let x = room(m, 6, 1, 'wall', 'A');
    x = TR.hills(m, x);
    x = room(m, x, 2, 'climb', 'B');
    // the planks sit on top of a tower
    m.put(x + 1, 13, '---'); m.put(x + 4, 11, '---'); m.put(x + 1, 9, '---'); m.put(x + 2, 8, '*');
    x += 8;
    m.put(x + 1, 14, '3'); m.put(x + 2, 14, '?');
    m.fill(x + 4, 15, x + 10, 15, '_'); m.fill(x + 4, 16, x + 10, 16, '~');
    x += 13;
    x = room(m, x, 4, 'spikes', 'C');
    x = TR.mover(m, x + 1);
    x = room(m, x + 1, 5, 'spring', 'D');
    x = room(m, x + 1, 6, 'lava', 'E');
    m.put(x + 1, 14, 'K'); m.put(x + 3, 13, '---'); m.put(x + 4, 12, '*');
    x = room(m, x + 7, 7, 'wall', 'G');
    m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
    return m;
  }
  function level3() {
    const m = MapBuilder(140, 17);
    m.fill(0, 15, 139, 16, '#');
    m.put(2, 14, 'P'); m.put(5, 14, '?');
    let x = room(m, 7, 1, 'climb', 'A');
    m.put(x + 3, 14, 'e');
    x = TR.hills(m, x + 1);
    x = room(m, x, 2, 'bridge', 'B');
    x = room(m, x + 1, 3, 'wall', 'C');
    x = TR.pit(m, x + 1);
    x = room(m, x + 1, 4, 'spikes', 'D');
    m.put(x + 1, 14, '?'); m.put(x + 3, 14, '5');
    m.fill(x + 5, 15, x + 13, 16, '%');
    x += 15;
    m.put(x + 1, 14, 'K'); m.put(x + 4, 14, 'e');
    x = TR.mover(m, x + 7);
    x = room(m, x + 1, 6, 'spring', 'E');
    x = room(m, x + 1, 7, 'climb', 'G');
    m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
    return m;
  }
  function level4() {
    const m = MapBuilder(150, 17);
    m.fill(0, 15, 149, 16, '#');
    m.put(2, 14, 'P'); m.put(4, 14, '?');
    // hidden climb to find i
    m.put(7, 13, '---'); m.put(10, 11, '---'); m.put(6, 9, '---'); m.put(1, 7, '----');
    m.put(2, 6, '@');
    m.put(14, 14, '?');
    m.put(17, 14, '1'); gate(m, 20, 'A');
    m.put(23, 14, '2'); m.put(26, 14, 'S');
    // the cliff
    m.fill(32, 9, 46, 16, '#');
    m.put(34, 8, 'K'); m.put(37, 8, '3'); gate(m, 40, 'B', 7);
    m.put(42, 8, '4'); m.put(44, 8, 's');
    m.fill(47, 3, 48, 14, 'W');
    m.put(52, 14, 'e');
    let x = room(m, 54, 5, 'bridge', 'C');
    x = TR.mover(m, x + 1);
    x = room(m, x + 1, 6, 'spikes', 'D');
    x = TR.hills(m, x);
    x = room(m, x, 7, 'climb', 'E');
    x = room(m, x + 1, 8, 'lava', 'G');
    m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
    m.put(9, 10, 'o'); m.put(2, 5, 'o'); m.put(29, 9, 'o');
    return m;

  }
  function level5() {
    const m = MapBuilder(162, 17);
    m.fill(0, 15, 161, 16, '#');
    m.put(2, 14, 'P'); m.put(4, 14, '?');
    let x = room(m, 6, 1, 'climb', 'A');
    x = TR.hills(m, x);
    m.put(x + 1, 14, 'e');
    x = room(m, x + 3, 2, 'spring', 'B');
    m.put(x + 2, 14, '3');
    m.fill(x + 5, 15, x + 12, 15, '_'); m.fill(x + 5, 16, x + 12, 16, '~');
    x += 15;
    m.put(x + 2, 14, 'e');
    x = room(m, x + 4, 4, 'spikes', 'C');
    m.put(x + 1, 14, 'K');
    x = TR.tower(m, x + 3); m.put(x - 4, 9, 'w');
    x = room(m, x, 5, 'wall', 'D');
    x = TR.mover(m, x + 1);
    x = room(m, x + 1, 6, 'bridge', 'E');
    x = room(m, x + 1, 7, 'lava', 'G');
    x = room(m, x + 1, 8, 'climb', 'H');
    m.put(x + 2, 14, 'e'); m.put(x + 4, 14, '?'); m.put(x + 8, 14, 'F');
    return m;
  }
  function level6() {
    const m = MapBuilder(140, 17);
    m.fill(0, 15, 139, 16, '#');
    m.put(2, 14, 'P'); m.put(5, 14, '?');
    let x = room(m, 7, 1, 'wall', 'A');
    x = TR.hills(m, x);
    x = room(m, x, 2, 'climb', 'B');
    x = room(m, x + 1, 3, 'spring', 'C');
    x = TR.pit(m, x + 1);
    x = room(m, x + 1, 4, 'spikes', 'D');
    m.put(x + 1, 14, '?'); m.put(x + 4, 14, '5'); m.put(x + 7, 14, '?'); m.put(x + 10, 14, '6');
    x = OB.climb(m, x + 13, 'E') + 2;
    m.put(x, 14, '?');
    m.put(x + 4, 14, 'e'); m.put(x + 8, 13, '----'); m.put(x + 12, 14, 'e'); m.put(x + 15, 10, 'w');
    x = TR.mover(m, x + 18);
    m.put(x + 2, 14, '?'); m.put(x + 7, 14, 'F');
    return m;
  }
  function levelWorld() {
    const W = 176, H = 24;
    const m = MapBuilder(W, H);
    m.fill(0, 22, W - 1, 23, '#');
    m.fill(0, 0, 0, 21, 'W');
    // --- hub
    m.put(3, 21, 'P'); m.put(6, 21, 'K'); m.put(10, 21, '$'); m.put(13, 21, '?'); m.put(15, 21, '6'); m.put(20, 21, '8'); m.put(22, 21, '7');
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
      id: 'hello', name: 'Hello, World', theme: 'meadow', ...mapOf(level1()),
      intro: {
        title: 'Level 1 — Hello, World',
        python: '<p>Welcome to <b>Syntaxia</b>, a world built from code — and slowly being eaten by <b>bugs</b>.</p><p>You are a Coder. In this world, you change things by writing <b>scripts</b>. Every programmer\'s journey starts with the same two words...</p>',
        javascript: '<p>Welcome to <b>Syntaxia</b>, a world built from code — and slowly being eaten by <b>bugs</b>.</p><p>You are a Coder. In this world, you change things by writing <b>scripts</b>. Every programmer\'s journey starts with the same two words...</p>',
      },
      signs: ['Move with ← → (or A / D).  Jump with Space, W or ↑.', 'See that terminal? Walk up to it and press E to write code. Press Esc to pause.', 'Each terminal teaches one small new thing. Read the left panel, then try it!'],
      terminals: ['hello', 'lines', 'textjoin', 'math', 'order', 'sep'],
    },
    {
      id: 'vars', name: 'Variables', theme: 'meadow', ...mapOf(level2()),
      intro: {
        title: 'Level 2 — Variables',
        python: '<p>A <b>variable</b> is a named box that holds a value:</p><pre>planks = 7\nname = "Ada"</pre><p>In Syntaxia, objects you pick up become variables you can use in your code! Collect the glowing boxes.</p>',
        javascript: '<p>A <b>variable</b> is a named box that holds a value:</p><pre>let planks = 7;\nconst name = "Ada";</pre><p>In Syntaxia, objects you pick up become variables you can use in your code! Collect the glowing boxes.</p>',
      },
      signs: ['Glowing boxes are VARIABLES. Walk into one to collect it — it shows up in your Variables panel (top right).', 'Lava ahead. Better build a bridge...', 'Well done! The exit portal is just ahead.'],
      pickups: [{ name: 'planks', value: 7 }, { name: 'password', value: randomWord }],
      terminals: ['firstvar', 'types', 'bridge', 'area', 'update', 'combine', 'password'],
    },
    {
      id: 'ifs', name: 'Conditions', theme: 'cave', ...mapOf(level3()),
      intro: {
        title: 'Level 3 — Conditions',
        python: '<p>Code can make <b>decisions</b> with <code>if</code>:</p><pre>if hp < 3:\n    print("Heal!")\nelif hp == 3:\n    print("Okay")\nelse:\n    print("Strong!")</pre><p>Notice the <b>colon</b> and the <b>indent</b> — Python uses them to know what belongs inside the if.</p><p><b>Bugs</b> live here. Jump on them to squash them — if one bites you, it puts an <b>error in your code</b>!</p>',
        javascript: '<p>Code can make <b>decisions</b> with <code>if</code>:</p><pre>if (hp < 3) {\n  console.log("Heal!");\n} else if (hp === 3) {\n  console.log("Okay");\n} else {\n  console.log("Strong!");\n}</pre><p>The <b>{ curly braces }</b> hold the code that belongs inside the if.</p><p><b>Bugs</b> live here. Jump on them to squash them — if one bites you, it puts an <b>error in your code</b>!</p>',
      },
      signs: ['BUGS! Jump on top to squash them. If one bites you, you get a GLITCH (an error in your code). Press Q to open the debugger and fix it!', 'Lava! The pump terminal could turn it into stone...', 'Checkpoints (flags) save your progress.'],
      terminals: ['compare', 'heal', 'guard', 'even', 'pump', 'bouncer', 'orgate'],
    },
    {
      id: 'loops', name: 'Loops', theme: 'cave', ...mapOf(level4()),
      intro: {
        title: 'Level 4 — Loops',
        python: '<p>A <b>loop</b> repeats code so you don\'t have to:</p><pre>for i in range(3):\n    print(i)   # 0, 1, 2</pre><p>That little <b>i</b> is the loop\'s counter... Legend says a tiny creature named <b>i</b> lives in these caves. Maybe you\'ll find them!</p>',
        javascript: '<p>A <b>loop</b> repeats code so you don\'t have to:</p><pre>for (let i = 0; i < 3; i++) {\n  console.log(i); // 0, 1, 2\n}</pre><p>That little <b>i</b> is the loop\'s counter... Legend says a tiny creature named <b>i</b> lives in these caves. Maybe you\'ll find them!</p>',
      },
      signs: ['A tiny voice echoes from somewhere above: "...i\'m up here..."', 'Every loop machine in this cave needs a counter to work.', 'Almost there! Watch out for bugs.'],
      terminals: ['repeat', 'stairs', 'count', 'countdown', 'listloop', 'charge', 'sumloop', 'breakloop'],
      springsLocked: true,
    },
    {
      id: 'funcs', name: 'Functions', theme: 'circuit', ...mapOf(level5()),
      intro: {
        title: 'Level 5 — Functions',
        python: '<p>A <b>function</b> is a named recipe. Define it once with <code>def</code>, use it as often as you like:</p><pre>def square(x):\n    return x * x\n\nprint(square(4))  # 16</pre><p><code>return</code> sends the answer back to whoever called the function.</p>',
        javascript: '<p>A <b>function</b> is a named recipe. Define it once, use it as often as you like:</p><pre>function square(x) {\n  return x * x;\n}\n\nconsole.log(square(4)); // 16</pre><p><code>return</code> sends the answer back to whoever called the function.</p>',
      },
      signs: ['Each terminal here builds on the last one: call a function, give it inputs, get answers back.', 'Nearly there. Classes await...'],
      terminals: ['cheer', 'echo', 'double', 'square', 'greet', 'evenfn', 'total', 'biggest'],
    },
    {
      id: 'classes', name: 'Classes', theme: 'circuit', ...mapOf(level6()),
      intro: {
        title: 'Level 6 — Classes',
        python: '<p>A <b>class</b> is a blueprint for making objects. Each object gets its own data (<b>attributes</b>) and abilities (<b>methods</b>):</p><pre>class Dog:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return "Woof!"\n\nrex = Dog("Rex")\nprint(rex.speak())</pre><p>Forge a <b>weapon</b> or adopt a <b>pet</b> — or both! Master classes and you\'ll unlock <b>skill points</b> and the <b>open world</b>.</p>',
        javascript: '<p>A <b>class</b> is a blueprint for making objects. Each object gets its own data (<b>properties</b>) and abilities (<b>methods</b>):</p><pre>class Dog {\n  constructor(name) {\n    this.name = name;\n  }\n  speak() {\n    return "Woof!";\n  }\n}\n\nconst rex = new Dog("Rex");\nconsole.log(rex.speak());</pre><p>Forge a <b>weapon</b> or adopt a <b>pet</b> — or both! Master classes and you\'ll unlock <b>skill points</b> and the <b>open world</b>.</p>',
      },
      signs: ['First learn what an object is, then build your own classes. The last two terminals are the Forge (weapons) and the Den (pets) — either one opens the gate, but why not both?', 'The Forge: design a weapon class.', 'Want a pet too? The Den is right here!', 'Weapons: press X or J to attack. Pets follow you around and cheer you on.', 'Beyond the portal lies the open world. Skill points await!'],
      terminals: ['crate', 'potion', 'lamp', 'wallet', 'forge', 'den'],
      gateAnyOf: true,
      grantsSkills: true,
    },
    {
      id: 'world', name: 'The Wilds of Syntaxia', theme: 'wilds', map: levelWorld(), openWorld: true,
      intro: {
        title: 'The Wilds of Syntaxia',
        python: '<p>You\'ve mastered the basics. Now Syntaxia is yours to explore!</p><ul><li>Find the <b>3 Core terminals</b> to open the gate to the Bug King\'s lair.</li><li>Earn <b>skill points</b> from cores, side quests and squashing bugs (1 SP per 3 bugs).</li><li>Spend them at the <b>Skill Shrine</b> (or press K).</li></ul>',
        javascript: '<p>You\'ve mastered the basics. Now Syntaxia is yours to explore!</p><ul><li>Find the <b>3 Core terminals</b> to open the gate to the Bug King\'s lair.</li><li>Earn <b>skill points</b> from cores, side quests and squashing bugs (1 SP per 3 bugs).</li><li>Spend them at the <b>Skill Shrine</b> (or press K).</li></ul>',
      },
      signs: ['THE WILDS. Warm up with the Backpack (lists) and Town Crier (strings) quests here, then find the three Core terminals out east. Skill Shrine is right behind you!', 'The Mirror Cipher is just ahead. Strings can be sliced and reversed...', 'The Dictionary Merchant — "Prices, prices! Who\'s buying?"', 'The Great Gate. It opens only for one who carries 3 Core fragments.'],
      terminals: ['gems', 'decoder', 'fib', 'fizz', 'merchant', 'backpack', 'crier', 'bag'],
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
    { id: 'double_jump', name: 'Double Jump', icon: 'DJ', cost: 2, max: 1, desc: 'Jump again in mid-air.' },
    { id: 'swift', name: 'Swift Boots', icon: 'SPD', cost: 1, max: 2, desc: '+20% movement speed per level.' },
    { id: 'vitality', name: 'Vitality', icon: 'HP', cost: 1, max: 3, desc: '+1 max HP per level.' },
    { id: 'sharp', name: 'Sharpened Code', icon: 'ATK', cost: 1, max: 3, desc: '+1 weapon damage per level.' },
    { id: 'debugger', name: "Debugger's Eye", icon: 'DBG', cost: 1, max: 1, desc: 'Glitch errors show a hint for the fix. Bugs bite less often.' },
    { id: 'companion', name: 'Companion Strike', icon: 'PET', cost: 2, max: 1, desc: 'Your pet zaps nearby bugs. (Needs a pet.)' },
    { id: 'overclock', name: 'Overclock', icon: 'OC', cost: 1, max: 2, desc: 'Compiler Cannon recharges faster & hits harder.' },
  ];

  root.GameData = { LEVELS, CH, SKILLS, GLITCHES, SNIPPETS, escapeHTML, stripComments };
})(typeof window !== 'undefined' ? window : globalThis);
