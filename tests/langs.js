// Shared test setup: loads the game's language files and every language's reference solutions.
const fs = require('fs');
const path = require('path');
require('../js/python.js');
require('../js/clike.js');
require('../js/langs.js');
require('../js/runner.js');
require('../js/levels.js');
require('../js/teach.js');
require('../js/content.js');
const LANGS = ['python', 'javascript'];
for (const lang of ['cpp', 'csharp', 'java']) {
  const f = path.join(__dirname, '../js/content', lang + '.js');
  if (fs.existsSync(f)) { require(f); LANGS.push(lang); }
}
// Chapter 2: one file per language
for (const lang of ['python', 'javascript', 'cpp', 'csharp', 'java']) {
  const f = path.join(__dirname, '../js/chapter2', lang + '.js');
  if (fs.existsSync(f)) require(f);
}
// the Data Structures & Algorithms course (every language)
for (const f of ['course.js', 'part1.js', 'part2.js']) {
  const p = path.join(__dirname, '../js/dsa', f);
  if (fs.existsSync(p)) require(p);
}
const only = process.env.LANGS ? process.env.LANGS.split(',') : null;
const SOL = require('./solutions.js');
for (const lang of ['cpp', 'csharp', 'java']) {
  const f = path.join(__dirname, 'solutions', lang + '.js');
  if (!fs.existsSync(f)) continue;
  const extra = require(f);
  for (const [id, code] of Object.entries(extra)) { SOL[id] = SOL[id] || {}; SOL[id][lang] = code; }
}
for (const lang of ['python', 'javascript', 'cpp', 'csharp', 'java']) {
  const f = path.join(__dirname, 'solutions', 'ch2', lang + '.js');
  if (!fs.existsSync(f)) continue;
  for (const [id, code] of Object.entries(require(f))) { SOL[id] = SOL[id] || {}; SOL[id][lang] = code; }
}
for (const lang of ['python', 'javascript', 'cpp', 'csharp', 'java']) {
  const f = path.join(__dirname, 'solutions', 'dsa', lang + '.js');
  if (!fs.existsSync(f)) continue;
  for (const [id, code] of Object.entries(require(f))) { SOL[id] = SOL[id] || {}; SOL[id][lang] = code; }
}
// the levels to test in a language: Chapter 1, that language's Chapter 2, and the DSA course
const levelsOf = (lang) => {
  const GD = globalThis.GameData;
  let out = GD.LEVELS.concat(GD.CHAPTER2[lang] ? GD.CHAPTER2[lang].levels : []);
  if (process.env.ONLY_DSA) out = [];
  if (GD.COURSES && GD.COURSES.dsa) out = out.concat(GD.COURSES.dsa.levels);
  return out;
};
// game-provided variables use each language's naming style (my_name -> myName ...)
function globalsFor(id, lang, testGlobals, vars) {
  const g = {};
  for (const [k, v] of Object.entries({ ...vars, ...(id === 'guard' ? { my_name: 'Ada' } : {}), ...testGlobals })) g[globalThis.Lang.varName(k, lang)] = v;
  return g;
}
async function runChallenge(id, lang, code) {
  const ch = globalThis.GameData.CH[id];
  const save = { foundI: true, vars: { planks: 7, password: 'kazumi42' } };
  const ctx = { lang, save, vars: save.vars, name: 'Ada', game: { cannonCooldown: 0 } };
  const tests = ch.tests ? ch.tests(ctx) : [{ globals: {} }];
  const runs = []; runs.tests = tests;
  for (const t of tests) {
    const r = await globalThis.CodeRunner.run(lang, code, { globals: globalsFor(id, lang, t.globals, save.vars), api: Object.fromEntries((ch.api || []).map(n => [n, true])), callTests: ch.callTests || [], captureVars: ch.captureVars || [] });
    runs.push(r);
    if (r.error) return { ok: false, error: r.error, runs };
  }
  const res = ch.check(runs, ctx, code);
  return Object.assign({ runs }, res);
}
module.exports = { levelsOf, LANGS: only ? LANGS.filter(l => only.includes(l)) : LANGS, SOL, runChallenge, GameData: globalThis.GameData };
