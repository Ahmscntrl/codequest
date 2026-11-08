// Every terminal, in every language: the reference solution passes, the starter code alone does not,
// and every glitch snippet really contains an error.
const { LANGS, SOL, runChallenge, GameData } = require('./langs.js');
const { CH, LEVELS, SNIPPETS } = GameData;
let fails = 0;
const fail = (...a) => { fails++; console.log('FAIL', ...a); };
(async () => {
  for (const lang of LANGS) {
    let n = 0;
    for (const L of LEVELS) for (const id of L.terminals) {
      const ch = CH[id];
      if (!SOL[id] || !SOL[id][lang]) { fail(lang, id, 'no reference solution'); continue; }
      if (!ch.starter[lang]) { fail(lang, id, 'no starter code'); continue; }
      const res = await runChallenge(id, lang, SOL[id][lang]);
      if (!res.ok) fail(lang, id, res.error ? `${res.error.type}: ${res.error.message} (line ${res.error.line})` : String(res.msg).replace(/<[^>]+>/g, ''));
      if (id !== 'cannon') {
        const st = await runChallenge(id, lang, ch.starter[lang]);
        if (st.ok) fail(lang, id, 'STARTER CODE ALREADY PASSES');
      }
      n++;
    }
    for (const kind of Object.keys(SNIPPETS)) {
      const list = SNIPPETS[kind][lang];
      if (!list || list.length < 3) { fail(lang, kind, 'needs at least 3 glitch snippets'); continue; }
      for (const sn of list) {
        const r = await globalThis.CodeRunner.run(lang, sn.code, { globals: {}, api: {} });
        if (!r.error) fail(lang, kind, 'snippet has no error:', JSON.stringify(sn.code));
      }
    }
    console.log(`  ${lang.padEnd(10)} ${n} terminals checked`);
  }
  console.log(fails ? `${fails} FAILURES` : 'ALL CHALLENGES OK');
  if (fails) process.exitCode = 1;
})();
