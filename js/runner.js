/* CodeQuest — runs player scripts in the language of their choice.
 *   Python      -> our own interpreter (js/python.js), synchronous with a step limit.
 *   JavaScript  -> the browser's real JS engine inside a Web Worker with a timeout.
 * Both return the same result shape:
 *   { output: [lines], error: {type, message, line} | null, actions: [{fn, args}], calls: [...], vars: {...} }
 */
(function (root) {
  'use strict';

  const camel = (n) => n.replace(/_([a-z])/g, (m, c) => c.toUpperCase());

  // Code that runs inside the worker (or as a fallback on the main thread).
  function workerMain(d, post) {
    const out = [];
    const actions = [];
    const G = (typeof self !== 'undefined') ? self : globalThis;

    function fmt(v, nested, seen) {
      seen = seen || new Set();
      if (v === undefined) return 'undefined';
      if (v === null) return 'null';
      if (typeof v === 'string') return nested ? JSON.stringify(v) : v;
      if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
      if (typeof v === 'function') return /^class\s/.test(Function.prototype.toString.call(v)) ? `[class ${v.name}]` : `[Function: ${v.name || 'anonymous'}]`;
      if (seen.has(v)) return '[Circular]';
      seen.add(v);
      let s;
      if (Array.isArray(v)) s = '[' + v.map(x => fmt(x, true, seen)).join(', ') + ']';
      else if (v instanceof Map) s = 'Map {' + [...v].map(([k, x]) => fmt(k, true, seen) + ' => ' + fmt(x, true, seen)).join(', ') + '}';
      else if (v instanceof Set) s = 'Set {' + [...v].map(x => fmt(x, true, seen)).join(', ') + '}';
      else if (v instanceof Error) s = `${v.name}: ${v.message}`;
      else {
        const name = v.constructor && v.constructor !== Object ? v.constructor.name + ' ' : '';
        const keys = Object.keys(v);
        s = name + (keys.length ? '{ ' + keys.map(k => k + ': ' + fmt(v[k], true, seen)).join(', ') + ' }' : '{}');
      }
      seen.delete(v);
      return s;
    }
    function norm(v, depth) {
      depth = depth || 0;
      if (v === undefined || v === null) return null;
      const t = typeof v;
      if (t === 'number' || t === 'string' || t === 'boolean') return v;
      if (t === 'bigint') return Number(v);
      if (t === 'function') {
        const isClass = /^class\s/.test(Function.prototype.toString.call(v));
        return isClass ? { __class: v.name } : { __func: v.name };
      }
      if (depth > 4) return null;
      if (Array.isArray(v)) return v.map(x => norm(x, depth + 1));
      if (v instanceof Map) { const o = {}; for (const [k, x] of v) o[String(k)] = norm(x, depth + 1); return o; }
      if (v instanceof Set) return [...v].map(x => norm(x, depth + 1));
      const proto = Object.getPrototypeOf(v);
      if (proto === Object.prototype || proto === null) {
        const o = {};
        for (const k of Object.keys(v)) o[k] = norm(v[k], depth + 1);
        return o;
      }
      const props = {}, methods = {};
      for (const k of Object.keys(v)) {
        if (typeof v[k] === 'function') {
          if (v[k].length === 0) { try { methods[k] = { value: norm(v[k].call(v), depth + 1) }; } catch (e) { methods[k] = { error: e.name + ': ' + e.message }; } }
          else methods[k] = { arity: v[k].length };
        } else props[k] = norm(v[k], depth + 1);
      }
      let p = proto;
      while (p && p !== Object.prototype) {
        for (const k of Object.getOwnPropertyNames(p)) {
          if (k === 'constructor' || k in methods || k in props) continue;
          const desc = Object.getOwnPropertyDescriptor(p, k);
          if (desc.get) { try { props[k] = norm(desc.get.call(v), depth + 1); } catch (e) { /* ignore */ } continue; }
          if (typeof desc.value === 'function') {
            if (desc.value.length === 0) {
              try { methods[k] = { value: norm(desc.value.call(v), depth + 1) }; }
              catch (e) { methods[k] = { error: e.name + ': ' + e.message }; }
            } else methods[k] = { arity: desc.value.length };
          }
        }
        p = Object.getPrototypeOf(p);
      }
      return { __obj: true, className: v.constructor ? v.constructor.name : 'Object', props, methods };
    }

    // Figure out how many lines the Function wrapper adds, so errors point at the player's line.
    let offset = 0;
    try { new Function('"use strict";\nthrow new Error("probe")')(); }
    catch (e) { const m = /(?:<anonymous>|Function|eval):(\d+):(\d+)/.exec(e.stack || '') || /line (\d+)/.exec(e.stack || ''); if (m) offset = (+m[1]) - 2; }
    function lineOf(e) {
      const stack = String(e && e.stack || '');
      const re = /(?:<anonymous>|Function|eval):(\d+):(\d+)/g;
      let m;
      while ((m = re.exec(stack))) { const l = (+m[1]) - offset - 1; if (l >= 1) return l; }
      return null;
    }

    const print = (...a) => { out.push(a.map(x => fmt(x, false)).join(' ')); if (out.length > 3000) throw new RangeError('too much output!'); };
    G.print = print;
    G.console = { log: print, info: print, warn: print, error: print, debug: print };
    G.input = G.prompt = () => { throw new Error("input() isn't available here — use the variables you collected instead!"); };
    G.alert = (x) => print(x);
    for (const k of Object.keys(d.globals || {})) G[k] = d.globals[k];
    for (const n of (d.api || [])) {
      const f = function (...args) {
        actions.push({ fn: n, args: args.map(a => norm(a)) });
        if (actions.length > 5000) throw new RangeError('your code called a function thousands of times — is a loop stuck going forever?');
        const r = (d.apiReturns || {})[n];
        return r === undefined ? undefined : r;
      };
      G[n] = f;
      const c = n.replace(/_([a-z])/g, (m, ch) => ch.toUpperCase());
      if (c !== n) G[c] = f;
    }

    const capNames = [...new Set([...(d.captureVars || []), ...(d.callTests || []).map(t => t.fn)])];
    const epilogue = '\n;return {' + capNames.map(n => `${JSON.stringify(n)}: (typeof ${n} !== "undefined" ? ${n} : undefined)`).join(',') + '};';
    const result = { output: out, error: null, actions, calls: [], vars: {} };
    try {
      let fn;
      try { new Function('"use strict";\n' + d.code); fn = new Function('"use strict";\n' + d.code + epilogue); }
      catch (e) { result.error = { type: e.name || 'SyntaxError', message: e.message, line: null, syntax: true }; post(result); return; }
      const cap = fn() || {};
      for (const t of (d.callTests || [])) {
        const f = cap[t.fn];
        if (typeof f !== 'function') { result.calls.push({ error: `ReferenceError: ${t.fn} is not defined` }); continue; }
        try {
          const before = out.length;
          const v = f(...(t.args || []));
          result.calls.push({ value: norm(v), printed: out.slice(before).join('\n') });
        } catch (e) { result.calls.push({ error: `${e.name}: ${e.message}`, line: lineOf(e) }); }
      }
      for (const n of (d.captureVars || [])) if (cap[n] !== undefined) result.vars[n] = norm(cap[n]);
    } catch (e) {
      const isRange = e instanceof RangeError && /call stack/i.test(e.message);
      result.error = { type: isRange ? 'RangeError' : (e && e.name) || 'Error', message: isRange ? 'Maximum call stack size exceeded (infinite recursion?)' : String(e && e.message !== undefined ? e.message : e), line: lineOf(e) };
    }
    post(result);
  }

  let workerURL = null;
  function getWorkerURL() {
    if (!workerURL) workerURL = URL.createObjectURL(new Blob(['self.onmessage = function (e) { (' + workerMain.toString() + ')(e.data, function (r) { self.postMessage(r); }); };'], { type: 'text/javascript' }));
    return workerURL;
  }

  // Ask the browser where a syntax error is by loading the code in a <script> tag (never executed: it's wrapped in a function expression).
  function findSyntaxLine(code) {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') return resolve(null);
      let done = false, url = null, s = null;
      const finish = (l, msg) => { if (done) return; done = true; window.removeEventListener('error', handler, true); if (s) s.remove(); if (url) URL.revokeObjectURL(url); resolve(l ? { line: l, message: msg } : null); };
      const handler = (ev) => { if (ev.filename === url) { ev.preventDefault(); ev.stopImmediatePropagation(); finish(ev.lineno - 1, ev.message); } };
      try {
        url = URL.createObjectURL(new Blob(['function __codequest_check__(){\n' + code + '\n}'], { type: 'text/javascript' }));
        window.addEventListener('error', handler, true);
        s = document.createElement('script');
        s.src = url;
        s.onload = () => setTimeout(() => finish(null), 0);
        s.onerror = () => finish(null);
        document.head.appendChild(s);
        setTimeout(() => finish(null), 800);
      } catch (e) { finish(null); }
    });
  }

  function runJS(code, opts) {
    const msg = { code, globals: opts.globals || {}, api: Object.keys(opts.api || {}), apiReturns: opts.apiReturns || {}, callTests: opts.callTests || [], captureVars: opts.captureVars || [] };
    const timeout = opts.timeoutMs || 2000;
    return new Promise((resolve) => {
      let worker;
      try { worker = new Worker(getWorkerURL()); }
      catch (e) {
        // Fallback: run on the main thread (no infinite-loop protection). Restore globals afterwards.
        const G = globalThis, keep = {};
        const names = ['console', 'print', 'input', 'prompt', 'alert', ...Object.keys(msg.globals), ...msg.api, ...msg.api.map(camel)];
        names.forEach(n => { keep[n] = Object.getOwnPropertyDescriptor(G, n); });
        const restore = () => names.forEach(n => { try { if (keep[n]) Object.defineProperty(G, n, keep[n]); else delete G[n]; } catch (e) { /* ignore */ } });
        try { workerMain(JSON.parse(JSON.stringify(msg)), (r) => { restore(); resolve(r); }); }
        catch (e) { restore(); throw e; }
        return;
      }
      const timer = setTimeout(() => {
        worker.terminate();
        resolve({ output: [], actions: [], calls: [], vars: {}, error: { type: 'TimeoutError', message: 'your code ran too long — is there an infinite loop?', line: null } });
      }, timeout);
      worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); resolve(e.data); };
      worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); e.preventDefault && e.preventDefault(); resolve({ output: [], actions: [], calls: [], vars: {}, error: { type: 'Error', message: e.message || 'unknown error', line: null } }); };
      worker.postMessage(msg);
    }).then(async (r) => {
      if (r.error && r.error.syntax) {
        const bare = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, '""');
        const count = (ch) => bare.split(ch).length - 1;
        if (count('{') > count('}')) r.error.message = 'Unexpected end of input — a { was opened but never closed with }';
        else if (count('(') > count(')') && /\)/.test(r.error.message)) r.error.message = 'missing ) — a ( was opened but never closed';
        const info = await findSyntaxLine(code);
        if (info) r.error.line = info.line;
      }
      return r;
    });
  }

  function runPython(code, opts) {
    const api = {};
    for (const n of Object.keys(opts.api || {})) api[n] = () => (opts.apiReturns || {})[n];
    const r = root.PyInterp.run(code, { globals: opts.globals, api, callTests: opts.callTests, captureVars: opts.captureVars, maxSteps: opts.maxSteps });
    return Promise.resolve(r);
  }

  const CodeRunner = {
    run(lang, code, opts) { return lang === 'javascript' ? runJS(code, opts || {}) : runPython(code, opts || {}); },
    camel,
    fnName(n, lang) { return lang === 'javascript' ? camel(n) : n; },
  };
  root.CodeRunner = CodeRunner;
})(typeof window !== 'undefined' ? window : globalThis);
