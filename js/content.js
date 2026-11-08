/* CodeQuest — per-language content for languages beyond Python/JavaScript.
 * A language file calls GameData.addLanguageContent(lang, {
 *   intro:     { levelId: html },                       // the story/intro page of each level
 *   tutorials: { levelId: [ { title, body, code, expectError? }, ... ] },
 *   terminals: { terminalId: { desc, starter, hints: [..], similar: { task, code } } },
 *   snippets:  { syntax: [ {code, expect, hint?} x4 ], name: [...], type: [...] },
 * })
 * `desc` may use {planks}, {password} (collected variables) and {name} (the hero's name).
 */
(function (root) {
  'use strict';
  const GD = root.GameData;
  GD.CONTENT = GD.CONTENT || {};
  GD.addLanguageContent = function (lang, c) {
    GD.CONTENT[lang] = c;
    for (const [id, t] of Object.entries(c.terminals || {})) {
      const ch = GD.CH[id];
      if (!ch) continue;
      ch.starter[lang] = t.starter;
      ch.hints = ch.hints || {}; ch.hints[lang] = t.hints;
      ch.similar = ch.similar || {}; ch.similar[lang] = t.similar;
      ch.descByLang = ch.descByLang || {}; ch.descByLang[lang] = t.desc;
    }
    for (const [lid, html] of Object.entries(c.intro || {})) {
      const L = GD.LEVELS.find(l => l.id === lid);
      if (L) L.intro[lang] = html;
    }
    for (const kind of Object.keys(c.snippets || {})) GD.SNIPPETS[kind][lang] = c.snippets[kind];
  };
  GD.descFor = function (id, ctx) {
    const ch = GD.CH[id];
    const d = ch.descByLang && ch.descByLang[ctx.lang];
    if (!d) return ch.desc(ctx);
    return d.replace(/\{(planks|password|name)\}/g, (m, k) => GD.escapeHTML(k === 'name' ? ctx.name : String(ctx.vars[k] !== undefined ? ctx.vars[k] : '?')));
  };
  // tutorial pages for a level in a language (the story page comes first)
  GD.tutorialFor = function (levelId, lang) {
    const own = GD.CONTENT[lang] && GD.CONTENT[lang].tutorials && GD.CONTENT[lang].tutorials[levelId];
    if (own) return [{ title: 'The story', story: true, level: levelId }].concat(own.map(p => Object.assign({}, p, { code: p.code === undefined || p.code === null ? null : (typeof p.code === 'string' ? { [lang]: p.code } : p.code) })));
    return GD.TUTORIALS[levelId] || [];
  };
  GD.hasContent = (lang) => lang === 'python' || lang === 'javascript' || !!GD.CONTENT[lang];
})(typeof window !== 'undefined' ? window : globalThis);
