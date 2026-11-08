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
    const LC = GD.COURSE_LEVELS && GD.COURSE_LEVELS[levelId];
    if (LC) {
      const pick = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v[lang] : v;
      return [{ title: 'The story', story: true, level: levelId }].concat((LC.tutorial || []).map(p => Object.assign({}, p, {
        title: pick(p.title), body: pick(p.body),
        code: p.code === undefined || p.code === null ? null : (typeof p.code === 'string' ? { [lang]: p.code } : p.code),
        expectError: !!pick(p.expectError),
      })));
    }
    const L2 = GD.CH2_LEVELS[levelId];
    if (L2) return [{ title: 'The story', story: true, level: levelId }].concat((L2.tutorial || []).map(p => Object.assign({}, p, { code: p.code === undefined || p.code === null ? null : { [L2.lang]: p.code } })));
    const own = GD.CONTENT[lang] && GD.CONTENT[lang].tutorials && GD.CONTENT[lang].tutorials[levelId];
    if (own) return [{ title: 'The story', story: true, level: levelId }].concat(own.map(p => Object.assign({}, p, { code: p.code === undefined || p.code === null ? null : (typeof p.code === 'string' ? { [lang]: p.code } : p.code) })));
    return GD.TUTORIALS[levelId] || [];
  };
  // ------------------------------------------------------------ Chapter 2
  // One chapter per language, each its own map and topics. See docs/CHAPTER2.md.
  GD.CHAPTER2 = GD.CHAPTER2 || {};
  GD.CH2_LEVELS = GD.CH2_LEVELS || {};
  GD.addChapter2 = function (lang, def) {
    const H = GD.helpers;
    for (const [id, t] of Object.entries(def.challenges || {})) {
      if (GD.CH[id]) throw new Error(`Chapter 2 (${lang}): challenge id "${id}" is already taken`);
      const ch = Object.assign({ api: [] }, t, {
        id, chapter: 2, lang,
        desc: typeof t.desc === 'function' ? t.desc : () => t.desc,
        starter: { [lang]: t.starter },
        hints: { [lang]: t.hints || [] },
        similar: t.similar ? { [lang]: t.similar } : {},
      });
      // shorthands: expect: ['line', ...] compares printed lines; expectCalls: [values] checks callTests
      if (!t.check && t.expect) ch.check = function (runs) {
        const got = H.lines(runs[0]), want = t.expect;
        for (let i = 0; i < want.length; i++) if (got[i] !== String(want[i])) return { ok: false, msg: `Line ${i + 1} should be ${H.c(H.escapeHTML(want[i]))} but it was ${H.c(H.nothing(got[i]))}.` };
        if (got.length > want.length) return { ok: false, msg: `Expected ${want.length} line${want.length === 1 ? '' : 's'} of output, but you printed ${got.length}.` };
        return { ok: true, msg: t.success || 'It works! <b>The way is open.</b>' };
      };
      if (!t.check && t.expectCalls) ch.check = function (runs, ctx) {
        const r = H.checkCalls(runs[0], this.callTests, t.expectCalls, ctx, this.callTests[0].fn);
        return r.ok && t.success ? { ok: true, msg: t.success } : r;
      };
      if (t.require) {
        const inner = ch.check;
        ch.check = function (runs, ctx, code) {
          const src = GD.stripComments(code || '', ctx);
          for (const [re, msg] of t.require) if (!(re instanceof RegExp ? re : new RegExp(re)).test(src)) return { ok: false, msg };
          return inner.call(this, runs, ctx, code);
        };
      }
      if (!t.effect) ch.effect = t.gate ? (game) => game.openGate(t.gate) : () => {};
      GD.CH[id] = ch;
    }
    def.levels.forEach(L => {
      if (GD.CH2_LEVELS[L.id] || GD.LEVELS.some(l => l.id === L.id)) throw new Error(`Chapter 2 (${lang}): level id "${L.id}" is already taken`);
      const m = typeof L.map === 'function' ? L.map(GD.build) : L.map;
      Object.assign(L, GD.build.mapOf(m));
      const story = L.intro;
      L.intro = { title: L.name, [lang]: story };
      L.signs = L.signs || [];
      L.chapter = 2; L.lang = lang;
      L.theme = L.theme || def.theme;
      for (const t of L.terminals) if (!GD.CH[t]) throw new Error(`Chapter 2 (${lang}): level ${L.id} uses unknown terminal "${t}"`);
      GD.CH2_LEVELS[L.id] = L;
    });
    GD.CHAPTER2[lang] = def;
  };
  // ------------------------------------------------------------ language-independent courses (Data Structures & Algorithms)
  // One save file, every language: each challenge has starter code, hints and examples for all five languages,
  // and the player can switch languages whenever they like. See docs/DSA.md.
  GD.COURSES = GD.COURSES || {};
  GD.COURSE_LEVELS = GD.COURSE_LEVELS || {};
  const ALL = ['python', 'javascript', 'cpp', 'csharp', 'java'];
  const perLang = (v) => (v && typeof v === 'object' && !Array.isArray(v) && ALL.some(l => l in v)) ? v : Object.fromEntries(ALL.map(l => [l, v]));
  GD.addCourse = function (id, def) {
    GD.COURSES[id] = Object.assign({ id, levels: [] }, def, { levels: [] });
  };
  GD.addCourseLevels = function (id, part) {
    const course = GD.COURSES[id], H = GD.helpers;
    for (const [cid, t] of Object.entries(part.challenges || {})) {
      if (GD.CH[cid]) throw new Error(`${id}: challenge id "${cid}" is already taken`);
      const ch = Object.assign({ api: [] }, t, {
        id: cid, course: id,
        desc: typeof t.desc === 'function' ? t.desc : (ctx) => perLang(t.desc)[ctx.lang],
        starter: perLang(t.starter), hints: perLang(t.hints || []), similar: t.similar ? perLang(t.similar) : {},
      });
      if (!t.check && t.expect) ch.check = function (runs, ctx) {
        const got = H.lines(runs[0]), want = perLang(t.expect)[ctx.lang];
        for (let i = 0; i < want.length; i++) if (got[i] !== String(want[i])) return { ok: false, msg: `Line ${i + 1} should be ${H.c(H.escapeHTML(want[i]))} but it was ${H.c(H.nothing(got[i]))}.` };
        if (got.length > want.length) return { ok: false, msg: `Expected ${want.length} line${want.length === 1 ? '' : 's'} of output, but you printed ${got.length}.` };
        return { ok: true, msg: t.success || 'It works. <b>The way is open.</b>' };
      };
      if (!t.check && t.expectCalls) ch.check = function (runs, ctx) {
        const r = H.checkCalls(runs[0], this.callTests, t.expectCalls, ctx, this.callTests[0].fn);
        return r.ok && t.success ? { ok: true, msg: t.success } : r;
      };
      if (t.require) {
        const inner = ch.check;
        ch.check = function (runs, ctx, code) {
          const src = GD.stripComments(code || '', ctx);
          const list = Array.isArray(t.require) ? t.require : (t.require[ctx.lang] || []);
          for (const [re, msg] of list) if (!(re instanceof RegExp ? re : new RegExp(re)).test(src)) return { ok: false, msg };
          return inner.call(this, runs, ctx, code);
        };
      }
      if (!t.effect) ch.effect = t.gate ? (game) => game.openGate(t.gate) : () => {};
      GD.CH[cid] = ch;
    }
    for (const L of part.levels || []) {
      if (GD.COURSE_LEVELS[L.id]) throw new Error(`${id}: level id "${L.id}" is already taken`);
      const m = typeof L.map === 'function' ? L.map(GD.build) : L.map;
      Object.assign(L, GD.build.mapOf(m));
      L.intro = Object.assign({ title: L.name }, perLang(L.intro));
      L.signs = L.signs || [];
      L.course = id;
      L.theme = L.theme || course.theme;
      for (const t of L.terminals) if (!GD.CH[t]) throw new Error(`${id}: level ${L.id} uses unknown terminal "${t}"`);
      GD.COURSE_LEVELS[L.id] = L;
      course.levels.push(L);
    }
  };
  GD.levelsFor = (chapter, lang, course) => course && GD.COURSES[course] ? GD.COURSES[course].levels : (chapter === 2 && GD.CHAPTER2[lang]) ? GD.CHAPTER2[lang].levels : GD.LEVELS;
  GD.hasContent = (lang) => lang === 'python' || lang === 'javascript' || !!GD.CONTENT[lang];
})(typeof window !== 'undefined' ? window : globalThis);
