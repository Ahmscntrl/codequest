// Teaching content, in every language: tutorials run, every level has an intro, and hints /
// "similar problem" examples never solve the terminal they belong to.
const { LANGS, runChallenge, GameData } = require('./langs.js');
const { CH, LEVELS } = GameData;
let fails = 0;
const fail = (...a) => { fails++; console.log('FAIL', ...a); };
(async () => {
  for (const lang of LANGS) {
    for (const L of LEVELS) {
      if (!L.intro[lang]) fail(lang, L.id, 'no level intro');
      const pages = GameData.tutorialFor(L.id, lang);
      if (!pages || pages.length < 2) { fail(lang, L.id, 'no tutorial'); continue; }
      for (const p of pages) {
        if (!p.code) continue;
        const code = p.code[lang];
        if (!code) { fail(lang, L.id, p.title, 'tutorial page has no code for this language'); continue; }
        const r = await globalThis.CodeRunner.run(lang, code, { globals: {}, api: {} });
        if (p.expectError && !r.error) fail(lang, L.id, p.title, 'should show an error');
        if (!p.expectError && r.error) fail(lang, L.id, p.title, r.error.type, r.error.message);
        if (!p.expectError && !r.output.length) fail(lang, L.id, p.title, 'prints nothing');
      }
      for (const id of L.terminals) {
        const ch = CH[id];
        const ctx = { lang, save: { foundI: true, vars: { planks: 7, password: 'kazumi42' } }, vars: { planks: 7, password: 'kazumi42' }, name: 'Ada', game: { cannonCooldown: 0 } };
        const desc = GameData.descFor(id, ctx);
        if (!desc || desc.length < 40) fail(lang, id, 'missing description');
        if (lang !== 'python' && /\bprint\(|\bdef |self\.|elif\b/.test(desc)) fail(lang, id, 'description shows Python code');
        if (!ch.hints || !ch.hints[lang] || !ch.hints[lang].length) { fail(lang, id, 'no hints'); continue; }
        if (!ch.similar || !ch.similar[lang]) { fail(lang, id, 'no similar example'); continue; }
        const sim = ch.similar[lang];
        const r = await globalThis.CodeRunner.run(lang, sim.code, { globals: {}, api: {} });
        if (r.error) fail(lang, id, 'similar example errors:', r.error.type, r.error.message, '(line ' + r.error.line + ')');
        if ((await runChallenge(id, lang, sim.code)).ok) fail(lang, id, 'similar example SOLVES the terminal');
        for (const h of ch.hints[lang]) if ((await runChallenge(id, lang, h)).ok) fail(lang, id, 'a hint SOLVES the terminal:', h);
      }
    }
    console.log(`  ${lang.padEnd(10)} checked`);
  }
  console.log(fails ? `${fails} FAILURES` : 'TEACHING CONTENT OK');
  if (fails) process.exitCode = 1;
})();
