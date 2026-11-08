// Tutorials run, and hints / "similar problem" examples never solve the actual terminal.
require('../js/python.js');
require('../js/runner.js');
require('../js/levels.js');
require('../js/teach.js');
const { CH, LEVELS, TUTORIALS } = globalThis.GameData;
const camel = (k) => k.replace(/_([a-z])/g, (m, c) => c.toUpperCase());
let fails = 0;
const fail = (...a) => { fails++; console.log('FAIL', ...a); };

async function passes(id, lang, code) {
  const ch = CH[id];
  const save = { foundI: true, vars: { planks: 7, password: 'kazumi42' } };
  const ctx = { lang, save, vars: save.vars, name: 'Ada', game: { cannonCooldown: 0 } };
  const tests = ch.tests ? ch.tests(ctx) : [{ globals: {} }];
  const runs = []; runs.tests = tests;
  for (const t of tests) {
    const g = {};
    for (const [k, v] of Object.entries({ ...save.vars, ...(id === 'guard' ? { my_name: 'Ada' } : {}), ...t.globals })) g[lang === 'javascript' ? camel(k) : k] = v;
    const r = await CodeRunner.run(lang, code, { globals: g, api: Object.fromEntries((ch.api || []).map(n => [n, true])), callTests: ch.callTests || [], captureVars: ch.captureVars || [] });
    runs.push(r);
    if (r.error) return false;
  }
  return ch.check(runs, ctx, code).ok;
}

(async () => {
  for (const lang of ['python', 'javascript']) {
    // every level has a tutorial and every tutorial example runs
    for (const L of LEVELS) {
      const pages = TUTORIALS[L.id];
      if (!pages || pages.length < 2) { fail('no tutorial for', L.id); continue; }
      for (const p of pages) {
        if (!p.code) continue;
        const r = await CodeRunner.run(lang, p.code[lang], { globals: {}, api: {} });
        if (p.expectError && !r.error) fail(lang, L.id, p.title, 'should show an error');
        if (!p.expectError && r.error) fail(lang, L.id, p.title, r.error.type, r.error.message);
        if (!p.expectError && !r.output.length) fail(lang, L.id, p.title, 'prints nothing');
      }
    }
    for (const L of LEVELS) for (const id of L.terminals) {
      const ch = CH[id];
      if (!ch.hints || !ch.hints[lang] || !ch.hints[lang].length) { fail('no hints', id); continue; }
      if (!ch.similar || !ch.similar[lang]) { fail('no similar example', id); continue; }
      const sim = ch.similar[lang];
      const r = await CodeRunner.run(lang, sim.code, { globals: {}, api: {} });
      if (r.error) fail(lang, id, 'similar example errors:', r.error.type, r.error.message);
      if (await passes(id, lang, sim.code)) fail(lang, id, 'similar example SOLVES the terminal');
      for (const h of ch.hints[lang]) if (await passes(id, lang, h)) fail(lang, id, 'a hint SOLVES the terminal:', h);
    }
  }
  console.log(fails ? `${fails} FAILURES` : 'TEACHING CONTENT OK');
  if (fails) process.exitCode = 1;
})();
