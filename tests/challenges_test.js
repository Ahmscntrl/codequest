// Runs every terminal challenge with a reference solution in both languages.
require('../js/python.js');
require('../js/runner.js');
require('../js/levels.js');
const { CH, SNIPPETS } = globalThis.GameData;

const SOL = require('./solutions.js');
const camel = (k) => k.replace(/_([a-z])/g, (m, c) => c.toUpperCase());
let fails = 0;
(async () => {
  for (const lang of ['python', 'javascript']) {
    for (const id of Object.keys(CH)) {
      const ch = CH[id];
      const save = { foundI: true, vars: { planks: 7, password: 'kazumi42' } };
      const ctx = { lang, save, vars: save.vars, name: 'Ada', game: { cannonCooldown: 0 } };
      const tests = ch.tests ? ch.tests(ctx) : [{ globals: {} }];
      const runs = []; runs.tests = tests;
      for (const t of tests) {
        const g = {};
        for (const [k, v] of Object.entries({ ...save.vars, ...(id === 'guard' ? { my_name: 'Ada' } : {}), ...t.globals })) g[lang === 'javascript' ? camel(k) : k] = v;
        const r = await CodeRunner.run(lang, SOL[id][lang], { globals: g, api: Object.fromEntries((ch.api || []).map(n => [n, true])), callTests: ch.callTests || [], captureVars: ch.captureVars || [] });
        runs.push(r);
        if (r.error) break;
      }
      const err = runs.find(r => r.error);
      const res = err ? { ok: false, msg: 'ERROR ' + JSON.stringify(err.error) } : ch.check(runs, ctx, SOL[id][lang]);
      if (!res.ok) { fails++; console.log('FAIL', lang, id, res.msg); }
      // starter code should NOT pass (except cannon)
      if (id !== 'cannon') {
        const r2 = []; r2.tests = tests;
        for (const t of tests) { const g = {}; for (const [k, v] of Object.entries({ ...save.vars, ...(id === 'guard' ? { my_name: 'Ada' } : {}), ...t.globals })) g[lang === 'javascript' ? camel(k) : k] = v; r2.push(await CodeRunner.run(lang, ch.starter[lang], { globals: g, api: Object.fromEntries((ch.api || []).map(n => [n, true])), callTests: ch.callTests || [], captureVars: ch.captureVars || [] })); }
        const e2 = r2.find(r => r.error);
        const res2 = e2 ? { ok: false } : ch.check(r2, ctx, ch.starter[lang]);
        if (res2.ok) { fails++; console.log('STARTER PASSES (bad)', lang, id); }
        else if (e2) console.log('  starter errors', lang, id, e2.error.type, e2.error.message);
      }
    }
    for (const kind of Object.keys(SNIPPETS)) {
      for (const sn of SNIPPETS[kind][lang]) {
        const r = await CodeRunner.run(lang, sn.code, { globals: {}, api: {} });
        if (!r.error) { fails++; console.log('SNIPPET DOES NOT ERROR', lang, kind, JSON.stringify(sn.code), r.output); }
        else console.log(`  ${lang} ${kind}: ${r.error.type}: ${r.error.message} (line ${r.error.line})`);
      }
    }
  }
  console.log(fails ? `${fails} FAILURES` : 'ALL CHALLENGES OK'); if (fails) process.exitCode = 1;
})();
