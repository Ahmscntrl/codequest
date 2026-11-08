/* CodeQuest — an interpreter for the C family: C++, C# and Java.
 * One parser/evaluator with a "dialect" setting that controls printing, strings, collections,
 * entry points (main), implicit conversions and error messages.
 * Covers what the game teaches: variables with types, printing, if/else, switch, loops (for, while,
 * do, range-for/foreach), functions/methods, classes (fields, constructors, methods, inheritance),
 * arrays/vectors/lists, maps/dictionaries, strings and basic Math.
 */
(function (root) {
  'use strict';

  class CError extends Error {
    constructor(type, message, line) { super(message); this.cType = type; this.line = line; }
  }
  class Dbl { constructor(v) { this.v = v; } }
  class Chr { constructor(c) { this.c = c; } }
  class CList { constructor(kind, a, elem) { this.kind = kind; this.a = a || []; this.elem = elem || null; } }
  class CMap { constructor(kind, m) { this.kind = kind; this.m = m || new Map(); } }
  class CObj { constructor(cls) { this.cls = cls; this.f = new Map(); } }
  class CSB { constructor(s) { this.s = s || ''; } }
  class Iter { constructor(target, pos, expr) { this.target = target; this.pos = pos; this.expr = expr; } }
  class CLambda { constructor(node, scope, thisObj) { this.node = node; this.scope = scope; this.thisObj = thisObj; } }
  class CExc { constructor(type, msg) { this.type = type; this.msg = msg; } }
  class CStream { constructor(a) { this.a = a; } }
  class COpt { constructor(v) { this.v = v; } }
  const EXC_NAMES = /^(Exception|SystemException|ApplicationException|ArgumentException|ArgumentNullException|ArgumentOutOfRangeException|InvalidOperationException|NotImplementedException|IndexOutOfRangeException|DivideByZeroException|NullReferenceException|FormatException|KeyNotFoundException|OverflowException|RuntimeException|IllegalArgumentException|IllegalStateException|ArithmeticException|NullPointerException|IndexOutOfBoundsException|ArrayIndexOutOfBoundsException|NumberFormatException|UnsupportedOperationException|Throwable|Error|exception|runtime_error|logic_error|invalid_argument|out_of_range|length_error|domain_error|range_error|overflow_error|underflow_error)$/;
  const ENDL = { endl: true };
  const BOOLALPHA = { boolalpha: true };

  const KEYWORDS = new Set(('if else for while do return break continue class struct new true false null nullptr this public private protected ' +
    'static void const auto var final using namespace foreach in readonly override virtual abstract sealed internal unsigned signed ' +
    'switch case default import package extends implements super base try catch finally throw interface enum operator sizeof typedef').split(' '));
  const PRIM = new Set(['int', 'double', 'float', 'long', 'short', 'byte', 'bool', 'boolean', 'char', 'void', 'string', 'String', 'auto', 'var', 'object', 'Object', 'dynamic', 'Integer', 'Double', 'Boolean', 'Character', 'Long', 'Float', 'decimal', 'uint', 'size_t']);
  const INT_T = new Set(['int', 'long', 'short', 'byte', 'Integer', 'Long', 'uint', 'size_t', 'unsigned']);
  const DBL_T = new Set(['double', 'float', 'Double', 'Float', 'decimal']);
  const BOOL_T = new Set(['bool', 'boolean', 'Boolean']);
  const STR_T = new Set(['string', 'String']);

  // ------------------------------------------------------------------ tokenizer
  function tokenize(src, D) {
    src = src.replace(/\r\n?/g, '\n');
    const toks = [];
    let i = 0, line = 1;
    const n = src.length;
    let pendingAnn = null;   // Java: an annotation like @Override is remembered on the token that follows it
    const push = (t, v, extra) => { toks.push(Object.assign({ t, v, line }, extra || {}, pendingAnn ? { ann: pendingAnn } : {})); pendingAnn = null; };
    const OPS = ['<<=', '>>=', '...', '->', '::', '<<', '>>', '++', '--', '+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '&&', '||', '=>', '??', '&=', '|=', '^='];
    let lineStart = true;
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; lineStart = true; continue; }
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === '#' && lineStart) { while (i < n && src[i] !== '\n') i++; continue; }
      lineStart = false;
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') {
        i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
        i += 2; continue;
      }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let j = i, isFloat = false;
        while (j < n && /[0-9_']/.test(src[j])) j++;
        if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { isFloat = true; j++; while (j < n && /[0-9_]/.test(src[j])) j++; }
        if ((src[j] === 'e' || src[j] === 'E') && /[0-9+-]/.test(src[j + 1] || '')) { isFloat = true; j++; if (/[+-]/.test(src[j])) j++; while (j < n && /[0-9]/.test(src[j])) j++; }
        let text = src.slice(i, j).replace(/[_']/g, '');
        if (/[fFdDmM]/.test(src[j] || '')) { isFloat = true; j++; }
        else if (/[lLuU]/.test(src[j] || '')) { j++; if (/[lLuU]/.test(src[j] || '')) j++; }
        if (/[A-Za-z_]/.test(src[j] || '')) throw new CError('SyntaxError', D.msg.badNumber(src.slice(i, j + 1)), line);
        push('NUM', Number(text), { isFloat });
        i = j; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        const w = src.slice(i, j);
        push(KEYWORDS.has(w) ? 'KW' : 'NAME', w);
        i = j; continue;
      }
      if (c === '@' && D.id === 'java') {
        const a0 = ++i; while (i < n && /[A-Za-z0-9_.]/.test(src[i])) i++;
        pendingAnn = src.slice(a0, i);
        if (src[i] === '(') { let d = 0; do { if (src[i] === '(') d++; if (src[i] === ')') d--; i++; } while (i < n && d > 0); }
        continue;
      }
      if (c === '$' && src[i + 1] === '"' && D.id === 'csharp') { i++; const s = readIStr(); push('ISTR', s); continue; }
      if (c === '@' && src[i + 1] === '"' && D.id === 'csharp') { i++; const s = readStr(true); push('STR', s); continue; }
      if (c === '"') { const s = readStr(); push('STR', s); continue; }
      if (c === '\'') {
        const startLine = line;
        i++;
        let ch = src[i];
        if (ch === '\\') { ch = esc(src[i + 1]); i += 2; } else i++;
        if (src[i] !== '\'') {
          if (D.id === 'cpp' && ch !== '\n') { // multi-char literal: treat like a string mistake
            throw new CError('SyntaxError', D.msg.charLit, startLine);
          }
          throw new CError('SyntaxError', D.msg.charLit, startLine);
        }
        i++;
        push('CHAR', ch);
        continue;
      }
      const three = src.substr(i, 3), two = src.substr(i, 2);
      if (OPS.includes(three)) { push('OP', three); i += 3; continue; }
      if (OPS.includes(two)) { push('OP', two); i += 2; continue; }
      if ('+-*/%<>=!&|^~?:;,.(){}[]'.includes(c)) { push('OP', c); i++; continue; }
      if ('“”‘’'.includes(c)) throw new CError('SyntaxError', D.msg.curly, line);
      throw new CError('SyntaxError', D.msg.stray(c), line);
    }
    push('EOF', null);
    return toks;

    function esc(ch) { return { n: '\n', t: '\t', '\\': '\\', '"': '"', '\'': '\'', '0': '\0', r: '\r' }[ch] !== undefined ? { n: '\n', t: '\t', '\\': '\\', '"': '"', '\'': '\'', '0': '\0', r: '\r' }[ch] : ch; }
    function readStr(verbatim) {
      const startLine = line;
      i++;
      let out = '';
      while (true) {
        if (i >= n || src[i] === '\n') throw new CError('SyntaxError', D.msg.unterminated, startLine);
        const ch = src[i];
        if (ch === '"') { if (verbatim && src[i + 1] === '"') { out += '"'; i += 2; continue; } i++; break; }
        if (ch === '\\' && !verbatim) { out += esc(src[i + 1]); i += 2; continue; }
        out += ch; i++;
      }
      return out;
    }
    // C# $"..." : escapes are decoded in the text parts; inside { } holes the code is kept as written,
    // so a hole may contain its own string literal, e.g. $"{dict["key"]}"
    function readIStr() {
      const startLine = line;
      i++;
      let out = '', depth = 0;
      while (true) {
        if (i >= n || src[i] === '\n') throw new CError('SyntaxError', D.msg.unterminated, startLine);
        const ch = src[i];
        if (depth === 0) {
          if (ch === '"') { i++; break; }
          if (ch === '\\') { out += esc(src[i + 1]); i += 2; continue; }
          if (ch === '{') { if (src[i + 1] === '{') { out += '{{'; i += 2; continue; } depth = 1; }
          out += ch; i++; continue;
        }
        if (ch === '"' || ch === "'") {
          out += ch; i++;
          while (i < n && src[i] !== ch && src[i] !== '\n') { if (src[i] === '\\') { out += src[i] + (src[i + 1] || ''); i += 2; continue; } out += src[i]; i++; }
          if (src[i] === ch) { out += ch; i++; }
          continue;
        }
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        out += ch; i++;
      }
      return out;
    }
  }

  // ------------------------------------------------------------------ parser
  function parse(src, D) {
    const toks = tokenize(src, D);
    let p = 0;
    const peek = (o = 0) => toks[Math.min(p + o, toks.length - 1)];
    const next = () => toks[p++];
    const isOp = (v, o = 0) => peek(o).t === 'OP' && peek(o).v === v;
    const isKw = (v, o = 0) => peek(o).t === 'KW' && peek(o).v === v;
    const isName = (o = 0) => peek(o).t === 'NAME';
    const tokText = (t) => t.t === 'EOF' ? 'end of input' : t.t === 'STR' ? `"${t.v}"` : String(t.v);
    const err = (msg, t) => { throw new CError('SyntaxError', msg, (t || peek()).line); };
    function expectOp(v) {
      if (isOp(v)) return next();
      if (v === ';') { const prev = toks[p - 1] || peek(); throw new CError('SyntaxError', D.msg.semicolon(tokText(peek())), prev.line); }
      if (v === '}' && peek().t === 'EOF') throw new CError('SyntaxError', D.msg.eofBrace, (toks[p - 1] || peek()).line);
      if (v === ')' ) err(D.msg.expected(')', tokText(peek())));
      err(D.msg.expected(v, tokText(peek())));
    }
    function expectName() { if (!isName()) err(D.msg.expectedName(tokText(peek()))); return next().v; }

    const MODS = new Set(['public', 'private', 'protected', 'static', 'final', 'const', 'readonly', 'override', 'virtual', 'abstract', 'sealed', 'internal', 'unsigned', 'signed', 'inline', 'constexpr', 'new', 'async', 'extern', 'mutable', 'volatile', 'partial']);
    function skipMods() {
      const mods = new Set();
      while ((peek().t === 'KW' || peek().t === 'NAME') && MODS.has(peek().v) && !(peek().v === 'new' && (isName(1) || peek(1).t === 'KW'))) {
        // 'unsigned int' etc. — keep unsigned as part of type when followed by a type
        if ((peek().v === 'unsigned' || peek().v === 'signed') && (PRIM.has(peek(1).v) || isOp(';', 1) || isName(1))) { if (PRIM.has(peek(1).v)) { next(); continue; } }
        mods.add(next().v);
      }
      return mods;
    }

    // ---- types
    function tryType() {
      const save = p;
      try { const t = parseType(); return t; } catch (e) { p = save; return null; }
    }
    function parseType() {
      const t = peek();
      let name;
      if (t.t === 'NAME' || (t.t === 'KW' && (t.v === 'auto' || t.v === 'var' || t.v === 'void' || t.v === 'unsigned' || t.v === 'signed'))) {
        name = next().v;
        if (name === 'unsigned' || name === 'signed') { if (PRIM.has(peek().v)) name = next().v; else name = 'int'; }
        while ((isOp('::') || (isOp('.') && D.id !== 'cpp')) && isName(1)) { next(); name = next().v; }   // std::string -> string, Map.Entry -> Entry
        if (name === 'long' && peek().v === 'long') next();
      } else throw new CError('SyntaxError', 'type expected', t.line);
      const args = [];
      if (isOp('<')) {
        const save = p;
        next();
        if (!isOp('>')) {
          try {
            args.push(parseType());
            while (isOp(',')) { next(); args.push(parseType()); }
          } catch (e) { p = save; return { name, args: [], arr: 0 }; }
        }
        if (isOp('>')) next();
        else if (isOp('>>')) { toks.splice(p, 1, Object.assign({}, toks[p], { v: '>' }), Object.assign({}, toks[p], { v: '>' })); next(); }   // split for good, so a re-parse sees '> >'
        else if (isOp('>>=')) { toks[p] = Object.assign({}, toks[p], { v: '>=' }); }
        else { p = save; return { name, args: [], arr: 0, bad: true }; }
      }
      let arr = 0;
      while (isOp('[') && isOp(']', 1)) { next(); next(); arr++; }
      let ref = false;
      while (isOp('&') || isOp('*') || isOp('&&')) { next(); ref = true; }
      if (isOp('?') && (isName(1))) next(); // C# nullable int? x
      return { name, args, arr, ref };
    }
    const typeLooksReal = (ty) => ty && !ty.bad;
    // A declaration starts with a type followed by a name.
    function looksLikeDecl() {
      const save = p;
      if (isKw('const') || isKw('static') || isKw('final') || isKw('readonly')) next();
      const ty = tryType();
      const ok = typeLooksReal(ty) && isName() && (isOp('=', 1) || isOp(';', 1) || isOp(',', 1) || isOp('(', 1) || isOp('[', 1) || isOp('{', 1) || isOp(':', 1) || (peek(1).t === 'KW' && peek(1).v === 'in'));
      p = save;
      return ok;
    }

    // ---- program
    function parseProgram() {
      const items = [];
      while (peek().t !== 'EOF') items.push(...parseTopItem());
      return items;
    }
    function parseTopItem() {
      const t = peek();
      if (isKw('using') || isKw('import') || isKw('package')) { while (!isOp(';') && peek().t !== 'EOF') next(); if (isOp(';')) next(); return []; }
      if (isKw('namespace')) {
        next(); while (!isOp('{') && !isOp(';')) next();
        if (isOp(';')) { next(); return []; }
        next(); const out = [];
        while (!isOp('}') && peek().t !== 'EOF') out.push(...parseTopItem());
        expectOp('}');
        return out;
      }
      if (isOp(';')) { next(); return []; }
      const save = p;
      const mods = skipMods();
      if (isKw('class') || isKw('struct') || isKw('interface') || (isName() && peek().v === 'record' && isName(1))) return [parseClass(mods)];
      if (isKw('enum')) return [parseEnum()];
      // function definition?  Type name ( params ) {
      const ty = tryType();
      if (typeLooksReal(ty) && isName() && (isOp('(', 1) || (isOp('::', 1) && isName(2) && isOp('(', 3)))) {
        const save2 = p;
        let owner = null;
        let fname = next().v;
        if (isOp('::')) { next(); owner = fname; fname = next().v; }
        const params = tryParams();
        if (params && (isOp('{') || isOp('=>') || isKw('const'))) {
          if (isKw('const')) next();
          const body = parseFuncBody();
          return [{ type: 'Func', name: fname, owner, ret: ty, params, body, line: t.line, isStatic: mods.has('static') }];
        }
        p = save2;
      }
      p = save;
      // otherwise: a statement at the top level (C# top-level statements, C++/Java global variables)
      const st = parseStatement();
      st.top = true;
      return [st];
    }
    function tryParams() {
      const save = p;
      if (!isOp('(')) return null;
      next();
      const params = [];
      try {
        if (isKw('void') && isOp(')', 1)) next();
        while (!isOp(')')) {
          const pmods = skipMods();
          if (isKw('this')) next(); // C# extension
          const ty = parseType();
          if (!typeLooksReal(ty)) throw new Error('no');
          if (!isName()) throw new Error('no');
          const nm = next().v;
          let arr = ty.arr;
          while (isOp('[') && isOp(']', 1)) { next(); next(); arr++; }
          let def = null;
          if (isOp('=')) { next(); def = parseExpr(); }
          params.push({ name: nm, ty: Object.assign({}, ty, { arr }), def, isConst: D.id === 'cpp' && !!(pmods && pmods.has('const')) });
          if (isOp(',')) { next(); continue; }
          if (!isOp(')')) throw new Error('no');
        }
        next();
        return params;
      } catch (e) { p = save; return null; }
    }
    // Java: `throws A, B` after a method's parameters; returns the names (used by the checked-exception check)
    function skipThrows() { const names = []; if (isName() && peek().v === 'throws') { next(); names.push(expectName()); while (isOp(',')) { next(); names.push(expectName()); } } return names; }
    function parseFuncBody() {
      skipThrows();
      if (isOp('=>')) { const l = next().line; const e = parseExpr(); expectOp(';'); return [{ type: 'Return', value: e, line: l }]; }
      return parseBlock().body;
    }
    function parseEnum() {
      const t = next(); const name = expectName();
      expectOp('{'); const values = [];
      while (!isOp('}')) { values.push(expectName()); if (isOp('=')) { next(); parseExpr(); } if (isOp(',')) next(); }
      next(); if (isOp(';')) next();
      return { type: 'Enum', name, values, line: t.line };
    }
    function parseClass(mods) {
      const t = next();
      const name = expectName();
      if (isOp('<')) { let d = 0; do { if (isOp('<')) d++; if (isOp('>')) d--; next(); } while (d > 0 && peek().t !== 'EOF'); }
      let base = null;
      const ifaces = [];
      if (isOp(':')) {
        next(); skipMods();
        base = expectName();
        while (isOp(',')) { next(); skipMods(); ifaces.push(expectName()); }
      } else if (isKw('extends')) { next(); base = expectName(); while (isOp(',')) { next(); ifaces.push(expectName()); } }
      if (isKw('implements')) { next(); ifaces.push(expectName()); while (isOp(',')) { next(); ifaces.push(expectName()); } }
      if (isOp('(')) { // record Point(int X, int Y)
        next(); while (!isOp(')')) next(); next();
      }
      expectOp('{');
      const fields = [], methods = [], ctors = [], props = [];
      const isStruct = t.v === 'struct';
      const isIface = t.v === 'interface';
      let label = D.id === 'cpp' ? (isStruct ? 'public' : 'private') : null;
      const accessOf = (mm) => mm.has('private') ? 'private' : mm.has('protected') ? 'protected' : mm.has('public') ? 'public' : (D.id === 'cpp' ? label : D.id === 'csharp' && !isIface ? 'private' : 'public');
      while (!isOp('}')) {
        if (peek().t === 'EOF') throw new CError('SyntaxError', D.msg.eofBrace, (toks[p - 1] || peek()).line);
        // C++ access labels
        if ((isKw('public') || isKw('private') || isKw('protected')) && isOp(':', 1)) { label = next().v; next(); continue; }
        if (isOp(';')) { next(); continue; }
        const mline = peek().line, mAnn = peek().ann;
        const mm = skipMods();
        if (D.id === 'java' && isIface && isKw('default')) next();   // Java interface default method
        if (isOp('~')) { next(); expectName(); tryParams(); parseFuncBody(); continue; } // destructor
        // constructor
        if (isName() && peek().v === name && isOp('(', 1)) {
          next();
          const params = tryParams();
          if (!params) err(D.msg.expected(')', tokText(peek())));
          const inits = [];
          let superArgs = null;
          if (isOp(':')) { // C++ initializer list / C# : base(...)
            next();
            do {
              const fname = isKw('base') ? next().v : expectName();
              expectOp('(');
              const args = [];
              while (!isOp(')')) { args.push(parseExpr()); if (isOp(',')) next(); }
              next();
              if (fname === 'base' || fname === base) superArgs = args; else inits.push({ name: fname, args });
            } while (isOp(',') && next());
          }
          const cthrows = skipThrows();
          const body = parseFuncBody();
          ctors.push({ params, body, inits, superArgs, line: mline, access: accessOf(mm), throws: cthrows });
          continue;
        }
        const ty = parseType();
        if (!typeLooksReal(ty)) err(D.msg.expectedName(tokText(peek())));
        if (isOp('operator', 0) || (isKw('operator'))) { // skip operator overloads
          while (!isOp('{')) next(); parseBlock(); continue;
        }
        const mname = expectName();
        if (isOp('(')) {
          const params = tryParams();
          if (!params) err(D.msg.expected(')', tokText(peek())));
          if (isKw('const')) next();
          let mVirt = mm.has('virtual');   // C++: virtual (or override) methods are dispatched on the object's real class
          let mOver = false;
          while (isKw('override') || isKw('final')) { if (peek().v === 'override') mVirt = mOver = true; next(); }
          const cppVirt = mOver ? 'override' : mVirt;
          if (isOp('=') && peek(1).t === 'NUM') { next(); next(); expectOp(';'); methods.push({ name: mname, ret: ty, params, body: null, isStatic: false, line: mline, access: accessOf(mm), abstract: true, virtual: true }); continue; }
          const mthrows = skipThrows();
          if (isOp(';')) { next(); methods.push({ name: mname, ret: ty, params, body: null, isStatic: mm.has('static'), line: mline, access: accessOf(mm), abstract: isIface || mm.has('abstract'), throws: mthrows, virtual: cppVirt, declPublic: isIface || mm.has('public') }); continue; }
          const body = parseFuncBody();
          methods.push({ name: mname, ret: ty, params, body, isStatic: mm.has('static'), line: mline, access: isIface ? 'public' : accessOf(mm), throws: mthrows, virtual: cppVirt, override: mAnn === 'Override', declPublic: isIface || mm.has('public') });
          continue;
        }
        // C# expression-bodied property: Type Name => expr;
        if (isOp('=>')) {
          next(); const e = parseExpr(); expectOp(';');
          props.push({ name: mname, ty, get: { expr: e }, set: null, line: mline, access: accessOf(mm) });
          continue;
        }
        // C# property: Type Name { get; set; } or with accessor bodies
        if (isOp('{')) {
          next();
          let get = null, set = null, hasBody = false, getAccess = null, setAccess = null;
          while (!isOp('}')) {
            if (peek().t === 'EOF') throw new CError('SyntaxError', D.msg.eofBrace, (toks[p - 1] || peek()).line);
            const am = skipMods();
            const which = isName() ? next().v : null;
            if (which !== 'get' && which !== 'set' && which !== 'init') err(D.msg.expected('get or set', tokText(peek())));
            let acc = { auto: true };
            if (isOp(';')) next();
            else if (isOp('=>')) { next(); acc = { expr: parseExpr() }; expectOp(';'); hasBody = true; }
            else { acc = { body: parseBlock().body }; hasBody = true; }
            if (which === 'get') { get = acc; getAccess = am.has('private') ? 'private' : null; } else { set = acc; setAccess = am.has('private') ? 'private' : am.has('protected') ? 'protected' : null; }
          }
          next();
          let init = null;
          if (isOp('=')) { next(); init = parseExpr(); expectOp(';'); }
          if (hasBody) props.push({ name: mname, ty, get, set, line: mline, access: accessOf(mm) });
          else fields.push({ name: mname, ty, init, isStatic: mm.has('static'), line: mline, access: accessOf(mm), readOnly: !set, setAccess: set ? setAccess : 'private', isProp: true });
          continue;
        }
        // fields: Type a = 1, b;
        let fname = mname;
        while (true) {
          let init = null, ctorArgs = null;
          let fty = ty;
          while (isOp('[')) { next(); if (!isOp(']')) parseExpr(); expectOp(']'); fty = Object.assign({}, fty, { arr: (fty.arr || 0) + 1 }); }
          if (isOp('=')) { next(); init = isOp('{') ? parseBraceInit() : parseExpr(); }
          else if (isOp('{')) init = parseBraceInit();
          else if (isOp('(')) { next(); ctorArgs = []; while (!isOp(')')) { ctorArgs.push(parseExpr()); if (isOp(',')) next(); } next(); }
          fields.push({ name: fname, ty: fty, init, ctorArgs, isStatic: mm.has('static'), line: mline, access: accessOf(mm) });
          if (isOp(',')) { next(); fname = expectName(); continue; }
          break;
        }
        expectOp(';');
      }
      next();
      if (isOp(';')) next();
      else if (D.id === 'cpp') throw new CError('SyntaxError', D.msg.classSemi, (toks[p - 1]).line);
      return { type: 'Class', name, base, ifaces, fields, methods, ctors, props, line: t.line, isStruct, isIface, isAbstract: !!(mods && mods.has && mods.has('abstract')) };
    }

    // ---- statements
    function parseBlock() {
      const t = expectOp('{');
      const body = [];
      while (!isOp('}')) {
        if (peek().t === 'EOF') throw new CError('SyntaxError', D.msg.eofBrace, (toks[p - 1] || t).line);
        body.push(parseStatement());
      }
      next();
      return { type: 'Block', body, line: t.line };
    }
    function parseStatement() {
      const t = peek();
      if (isOp('{')) return parseBlock();
      if (isOp(';')) { next(); return { type: 'Empty', line: t.line }; }
      if (t.t === 'KW') {
        switch (t.v) {
          case 'if': {
            next(); expectOp('('); const test = parseExpr(); expectOp(')');
            const body = parseStatement();
            let orelse = null;
            if (isKw('else')) { next(); orelse = parseStatement(); }
            return { type: 'If', test, body, orelse, line: t.line };
          }
          case 'while': {
            next(); expectOp('('); const test = parseExpr(); expectOp(')');
            return { type: 'While', test, body: parseStatement(), line: t.line };
          }
          case 'do': {
            next(); const body = parseStatement();
            if (!isKw('while')) err(D.msg.expected('while', tokText(peek())));
            next(); expectOp('('); const test = parseExpr(); expectOp(')'); expectOp(';');
            return { type: 'DoWhile', test, body, line: t.line };
          }
          case 'foreach': {
            next(); expectOp('(');
            skipMods();
            const ty = parseType(); const name = expectName();
            if (!isKw('in')) err(D.msg.expected('in', tokText(peek())));
            next(); const iter = parseExpr(); expectOp(')');
            return { type: 'ForEach', ty, name, iter, body: parseStatement(), line: t.line };
          }
          case 'for': {
            next(); expectOp('(');
            // range-for:  for (Type x : expr)
            {
              const save = p;
              skipMods();
              const ty = tryType();
              if (typeLooksReal(ty) && isOp('[') && D.id === 'cpp') { // for (auto [k, v] : m)
                next(); const names = [expectName()];
                while (isOp(',')) { next(); names.push(expectName()); }
                expectOp(']'); expectOp(':');
                const iter = parseExpr(); expectOp(')');
                return { type: 'ForEach', ty, name: names[0], names, iter, body: parseStatement(), line: t.line };
              }
              if (typeLooksReal(ty) && isName() && isOp(':', 1)) {
                const name = next().v; next();
                const iter = parseExpr(); expectOp(')');
                return { type: 'ForEach', ty, name, iter, body: parseStatement(), line: t.line };
              }
              p = save;
            }
            let init = null;
            if (!isOp(';')) init = looksLikeDecl() ? parseDecl(false) : { type: 'ExprStmt', expr: parseExprList(), line: t.line };
            expectOp(';');
            const test = isOp(';') ? null : parseExpr();
            expectOp(';');
            const update = isOp(')') ? null : parseExprList();
            expectOp(')');
            return { type: 'For', init, test, update, body: parseStatement(), line: t.line };
          }
          case 'switch': {
            next(); expectOp('('); const disc = parseExpr(); expectOp(')'); expectOp('{');
            const cases = [];
            while (!isOp('}')) {
              let test = null;
              if (isKw('case')) { next(); test = parseExpr(); }
              else if (isKw('default')) next();
              else err(D.msg.expected('case', tokText(peek())));
              expectOp(':');
              const body = [];
              while (!isKw('case') && !isKw('default') && !isOp('}')) body.push(parseStatement());
              cases.push({ test, body });
            }
            next();
            return { type: 'Switch', disc, cases, line: t.line };
          }
          case 'return': {
            next(); let value = null;
            if (!isOp(';')) value = parseExpr();
            expectOp(';');
            return { type: 'Return', value, line: t.line };
          }
          case 'break': next(); expectOp(';'); return { type: 'Break', line: t.line };
          case 'continue': next(); expectOp(';'); return { type: 'Continue', line: t.line };
          case 'throw': { next(); const v = isOp(';') ? null : parseExpr(); expectOp(';'); return { type: 'Throw', value: v, line: t.line }; }
          case 'try': {
            next(); const body = parseBlock(); const handlers = [];
            while (isKw('catch')) {
              next(); let name = null, ctype = null, ctypes = null;
              if (isOp('(')) { next(); if (isOp('...')) next(); else { skipMods(); ctype = parseType().name; if (D.id === 'java' && isOp('|')) { ctypes = [ctype]; while (isOp('|')) { next(); ctypes.push(parseType().name); } } if (isName()) name = next().v; } expectOp(')'); }
              handlers.push({ name, ctype, ctypes, body: parseBlock() });
            }
            let fin = null; if (isKw('finally')) { next(); fin = parseBlock(); }
            return { type: 'Try', body, handlers, fin, line: t.line };
          }
          case 'class': case 'struct': {
            const c = parseClass(new Set()); return c;
          }
        }
      }
      if (isName() && peek().v === 'delete' && D.id === 'cpp') { while (!isOp(';')) next(); next(); return { type: 'Empty', line: t.line }; }
      if (looksLikeDecl()) { const d = parseDecl(true); expectOp(';'); return d; }
      // local function (C#/Java inside a method is not allowed in Java, fine for C#)
      const e = parseExprList();
      expectOp(';');
      return { type: 'ExprStmt', expr: e, line: t.line };
    }
    function parseDecl(allowCtor) {
      const t = peek();
      const mods = skipMods();
      const ty = parseType();
      const vars = [];
      do {
        if (vars.length) next();
        const name = expectName();
        let fty = ty;
        let size = null;
        while (isOp('[')) { next(); if (!isOp(']')) size = parseExpr(); expectOp(']'); fty = Object.assign({}, fty, { arr: (fty.arr || 0) + 1 }); }
        let init = null, ctorArgs = null;
        if (isOp('=')) { next(); init = isOp('{') ? parseBraceInit() : parseExpr(); }
        else if (isOp('{')) init = parseBraceInit();
        else if (isOp('(') && allowCtor) { next(); ctorArgs = []; while (!isOp(')')) { ctorArgs.push(parseExpr()); if (isOp(',')) next(); else if (!isOp(')')) err(D.msg.expected(')', tokText(peek()))); } next(); }
        vars.push({ name, ty: fty, init, ctorArgs, size });
      } while (isOp(','));
      return { type: 'Decl', ty, vars, isConst: mods.has('const') || mods.has('final'), line: t.line };
    }
    function parseBraceInit() {
      const t = expectOp('{');
      const items = [];
      while (!isOp('}')) {
        items.push(isOp('{') ? parseBraceInit() : parseExpr());
        if (isOp(',')) next(); else if (!isOp('}')) err(D.msg.expected('}', tokText(peek())));
      }
      next();
      return { type: 'InitList', items, line: t.line };
    }

    // ---- expressions
    function parseExprList() {
      const first = parseExpr();
      if (!isOp(',')) return first;
      const items = [first];
      while (isOp(',')) { next(); items.push(parseExpr()); }
      return { type: 'Seq', items, line: first.line };
    }
    function parseExpr() { return parseAssign(); }
    function parseAssign() {
      const left = parseTernary();
      const t = peek();
      if (t.t === 'OP' && ['=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '&=', '|=', '^='].includes(t.v)) {
        next();
        const right = isOp('{') ? parseBraceInit() : parseAssign();
        if (!['Name', 'Member', 'Index'].includes(left.type)) throw new CError('SyntaxError', D.msg.lvalue, t.line);
        return { type: 'Assign', op: t.v, target: left, value: right, line: t.line };
      }
      return left;
    }
    function parseTernary() {
      const test = parseBin(0);
      if (isOp('?')) {
        const t = next(); const a = parseAssign(); expectOp(':'); const b = parseAssign();
        return { type: 'Cond', test, a, b, line: t.line };
      }
      return test;
    }
    const LEVELS = [['??'], ['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '>', '<=', '>=', 'instanceof', 'is'], ['<<', '>>'], ['+', '-'], ['*', '/', '%']];
    function parseBin(lvl) {
      if (lvl >= LEVELS.length) return parseUnary();
      let left = parseBin(lvl + 1);
      while (true) {
        const t = peek();
        const opv = t.t === 'OP' ? t.v : (t.t === 'NAME' && (t.v === 'instanceof' || t.v === 'is') ? t.v : null);
        if (!opv || !LEVELS[lvl].includes(opv)) break;
        next();
        if (opv === 'instanceof' || opv === 'is') { const ty = parseType(); left = { type: 'InstanceOf', value: left, cls: ty.name, line: t.line }; continue; }
        const right = parseBin(lvl + 1);
        left = { type: 'Bin', op: opv, left, right, line: t.line };
      }
      return left;
    }
    const CASTABLE = new Set(['int', 'double', 'float', 'long', 'char', 'bool', 'boolean', 'string', 'String', 'short', 'byte', 'decimal']);
    function parseUnary() {
      const t = peek();
      if (t.t === 'OP' && ['!', '-', '+', '~'].includes(t.v)) { next(); return { type: 'Unary', op: t.v, operand: parseUnary(), line: t.line }; }
      if (t.t === 'OP' && (t.v === '++' || t.v === '--')) { next(); const operand = parseUnary(); return { type: 'IncDec', op: t.v, prefix: true, target: operand, line: t.line }; }
      if (t.t === 'OP' && t.v === '&') { next(); return parseUnary(); } // address-of: ignore
      if (t.t === 'OP' && t.v === '*') { next(); return { type: 'Deref', operand: parseUnary(), line: t.line }; }
      // cast: (int) x
      if (isOp('(') && (isName(1) || peek(1).t === 'KW') && CASTABLE.has(peek(1).v) && isOp(')', 2)) {
        next(); const ty = next().v; next();
        return { type: 'Cast', to: ty, value: parseUnary(), line: t.line };
      }
      return parsePostfix(parsePrimary());
    }
    function parseArgs() {
      const t = expectOp('(');
      const args = [];
      while (!isOp(')')) {
        if (peek().t === 'EOF' || isOp(';')) throw new CError('SyntaxError', D.msg.expected(')', tokText(peek())), t.line);
        if (isName() && isOp(':', 1) && D.id === 'csharp') { next(); next(); } // named args
        if (isKw('out') || isKw('ref')) next();
        args.push(isOp('{') ? parseBraceInit() : parseExpr());
        if (isOp(',')) next();
        else if (!isOp(')')) throw new CError('SyntaxError', D.msg.expected(')', tokText(peek())), peek().line);
      }
      next();
      return args;
    }
    function parsePostfix(e) {
      while (true) {
        const t = peek();
        if (isOp('(')) { const args = parseArgs(); e = { type: 'Call', callee: e, args, line: t.line }; }
        else if (isOp('[')) { next(); const idx = parseExpr(); expectOp(']'); e = { type: 'Index', obj: e, index: idx, line: t.line }; }
        else if (D.id === 'java' && isOp('::') && isName(1)) { next(); e = { type: 'MethodRef', obj: e, name: next().v, line: t.line }; }   // Java method reference: Order::getPrice
        else if (isOp('.') || isOp('->') || isOp('::') || (isOp('?') && isOp('.', 1))) {
          if (isOp('?')) next();
          next();
          if (!isName() && peek().t !== 'KW') err(D.msg.expectedName(tokText(peek())));
          const name = next().v;
          // generic method call: obj.Method<T>(...)
          e = { type: 'Member', obj: e, name, line: t.line };
        }
        else if (isOp('++') || isOp('--')) { next(); e = { type: 'IncDec', op: t.v, prefix: false, target: e, line: t.line }; }
        else if (isOp('<') && e.type === 'Name' && ['static_cast', 'stoi'].includes(e.id)) { // static_cast<int>(x)
          next(); const ty = parseType(); expectOp('>'); expectOp('(');
          const v = parseExpr(); expectOp(')');
          e = { type: 'Cast', to: ty.name, value: v, line: t.line };
        }
        else break;
      }
      return e;
    }
    function tryLambda() {
      const arrow = D.id === 'java' ? '->' : '=>';
      const t = peek();
      if (D.id !== 'cpp' && isName() && isOp(arrow, 1)) { const nm = next().v; next(); return lambdaBody([{ name: nm, ty: null }], t.line); }
      if (D.id !== 'cpp' && isOp('(')) {
        const save = p;
        next();
        const params = [];
        let ok = true;
        while (!isOp(')')) {
          if (isName() && (isOp(',', 1) || isOp(')', 1))) { params.push({ name: next().v, ty: null }); }
          else { const ty = tryType(); if (!typeLooksReal(ty) || !isName()) { ok = false; break; } params.push({ name: next().v, ty }); }
          if (isOp(',')) next(); else if (!isOp(')')) { ok = false; break; }
        }
        if (ok && isOp(')') && isOp(arrow, 1)) { next(); next(); return lambdaBody(params, t.line); }
        p = save;
        return null;
      }
      if (D.id === 'cpp' && isOp('[')) {
        const save = p;
        next();
        const captures = { all: null, val: [], ref: [], mutable: false };   // [=], [&], [x], [&x], [this]
        while (!isOp(']') && peek().t !== 'EOF') {
          if (isOp('=')) { captures.all = 'val'; next(); }
          else if (isOp('&') && !isName(1)) { captures.all = 'ref'; next(); }
          else if (isOp('&') && isName(1)) { next(); captures.ref.push(next().v); }
          else if (isName() || isKw('this')) captures.val.push(next().v);
          else next();
        }
        next();
        const params = isOp('(') ? tryParams() : [];
        const isMut = () => peek().v === 'mutable' && (peek().t === 'KW' || peek().t === 'NAME');
        if (params && (isOp('{') || isOp('->') || isMut())) {
          if (isMut()) { next(); captures.mutable = true; }
          if (isOp('->')) { next(); parseType(); }
          return { type: 'Lambda', params, block: parseBlock().body, line: t.line, captures };
        }
        p = save;
      }
      return null;
    }
    function lambdaBody(params, line) {
      if (isOp('{')) return { type: 'Lambda', params, block: parseBlock().body, line };
      return { type: 'Lambda', params, expr: parseAssign(), line };
    }
    function parsePrimary() {
      const lam = tryLambda();
      if (lam) return lam;
      const t = peek();
      if (t.t === 'NUM') { next(); return { type: 'Num', value: t.v, isFloat: t.isFloat, line: t.line }; }
      if (t.t === 'STR') { next(); let v = t.v; while (peek().t === 'STR' && D.id === 'cpp') v += next().v; return { type: 'Str', value: v, line: t.line }; }
      if (t.t === 'CHAR') { next(); return { type: 'Char', value: t.v, line: t.line }; }
      if (t.t === 'ISTR') { next(); return parseInterp(t.v, t.line); }
      if (t.t === 'KW') {
        if (t.v === 'true' || t.v === 'false') { next(); return { type: 'Bool', value: t.v === 'true', line: t.line }; }
        if (t.v === 'null' || t.v === 'nullptr') { next(); return { type: 'Null', line: t.line }; }
        if (t.v === 'this') { next(); return { type: 'This', line: t.line }; }
        if (t.v === 'super' || t.v === 'base') { next(); return { type: 'Super', line: t.line }; }
        if (t.v === 'new') return parseNew();
        if (t.v === 'auto' || t.v === 'var' || t.v === 'default') { next(); return { type: 'Null', line: t.line }; }
      }
      if (t.t === 'NAME') {
        next();
        // functional cast / constructor call with generic: vector<int>{...}, List<int>(), string(...)
        if (isOp('<') && /^[A-Z]|^(vector|map|unordered_map|set|pair)$/.test(t.v)) {
          const save = p; p--;
          const ty = tryType();
          if (typeLooksReal(ty) && (isOp('(') || isOp('{')) && ty.args.length) {
            if (isOp('{')) { const init = parseBraceInit(); return { type: 'Construct', ty, args: [], init, line: t.line }; }
            const args = parseArgs(); return { type: 'Construct', ty, args, line: t.line };
          }
          p = save;
        }
        return { type: 'Name', id: t.v, line: t.line };
      }
      if (isOp('(')) {
        next();
        // C# lambda: (a, b) => ...  -- not supported
        const e = parseExprList();
        expectOp(')');
        return e;
      }
      if (isOp('{')) return parseBraceInit();
      if (t.t === 'EOF') throw new CError('SyntaxError', D.msg.eofExpr, (toks[p - 1] || t).line);
      err(D.msg.unexpected(tokText(t)));
    }
    function parseNew() {
      const t = next();
      let ty;
      if (isOp('[')) ty = { name: 'var', args: [], arr: 0 }; // C# new[] {..}
      else {
        const save = p;
        const name = expectName();
        let qual = name;
        while (isOp('.') && isName(1)) { next(); qual = next().v; }
        p = save;
        // parse as type but stop before [n]
        ty = { name: qual, args: [], arr: 0 };
        next(); while (isOp('.') && isName(1)) { next(); next(); }
        if (isOp('<')) {
          next();
          if (!isOp('>')) { ty.args.push(parseType()); while (isOp(',')) { next(); ty.args.push(parseType()); } }
          if (isOp('>>')) toks[p] = Object.assign({}, toks[p], { v: '>' }); else expectOp('>');
        }
      }
      if (isOp('[')) {
        next();
        let size = null;
        if (!isOp(']')) size = parseExpr();
        expectOp(']');
        let dims = 1;
        const sizes = [];   // new int[rows][cols]
        while (size && isOp('[') && !isOp(']', 1)) { next(); sizes.push(parseExpr()); expectOp(']'); dims++; }
        while (isOp('[') && isOp(']', 1)) { next(); next(); dims++; }
        let init = null;
        if (isOp('{')) init = parseBraceInit();
        return { type: 'NewArray', elem: ty, size, sizes, init, dims, line: t.line };
      }
      let args = [];
      if (isOp('(')) args = parseArgs();
      let init = null;
      if (isOp('{')) init = parseBraceInit();
      return { type: 'New', ty, args, init, line: t.line };
    }
    function parseInterp(s, line) {
      const parts = [];
      let i = 0, lit = '';
      while (i < s.length) {
        if (s[i] === '{' && s[i + 1] === '{') { lit += '{'; i += 2; continue; }
        if (s[i] === '}' && s[i + 1] === '}') { lit += '}'; i += 2; continue; }
        if (s[i] === '{') {
          if (lit) { parts.push({ type: 'Str', value: lit, line }); lit = ''; }
          let d = 1, j = i + 1;
          while (j < s.length && d > 0) { if (s[j] === '{') d++; if (s[j] === '}') d--; if (d > 0) j++; }
          let inner = s.slice(i + 1, j), fmt = null;
          const ci = inner.lastIndexOf(':');
          if (ci > 0 && !/["']/.test(inner.slice(ci))) { fmt = inner.slice(ci + 1); inner = inner.slice(0, ci); }
          const sub = parse('__x = ' + inner + ';', D);
          const ex = sub[0].expr.value;
          (function fix(nd) { if (nd && typeof nd === 'object') { if (nd.line) nd.line = line; for (const k in nd) if (k !== 'line') fix(nd[k]); } })(ex);
          parts.push({ type: 'Fmt', value: ex, fmt, line });
          i = j + 1; continue;
        }
        lit += s[i]; i++;
      }
      if (lit || !parts.length) parts.push({ type: 'Str', value: lit, line });
      return { type: 'Interp', parts, line };
    }

    const prog = parseProgram();
    return prog;
  }

  // ------------------------------------------------------------------ dialects
  function makeDialect(id) {
    const base = {
      id,
      msg: {
        semicolon: (near) => `expected ';' before ${near === 'end of input' ? 'end of input' : `'${near}'`}`,
        expected: (what, near) => `expected '${what}' before '${near}'`,
        expectedName: (near) => `expected a name before '${near}'`,
        eofBrace: `expected '}' at end of input`,
        eofExpr: 'expected an expression at end of input',
        unexpected: (near) => `expected an expression before '${near}'`,
        unterminated: 'missing terminating " character',
        charLit: 'character constant too long — use double quotes "..." for text',
        curly: 'stray curly quote in program — use straight quotes " or \'',
        stray: (c) => `stray '${c}' in program`,
        badNumber: (s) => `invalid number '${s}'`,
        lvalue: 'lvalue required as left operand of assignment',
        classSemi: "expected ';' after class definition",
        undeclared: (n) => `'${n}' was not declared in this scope`,
        noMain: "undefined reference to 'main'",
        topStmt: () => 'expected unqualified-id (statements must go inside a function like int main() { ... })',
        convert: (from, to) => `cannot convert '${from}' to '${to}' in initialization`,
        operands: (op, a, b) => `no match for 'operator${op}' (operand types are '${a}' and '${b}')`,
        divZero: 'Floating point exception (division by zero)',
        index: (i, n) => `index ${i} is out of range (size is ${n})`,
        noMember: (cls, m) => `'${cls}' has no member named '${m}'`,
        args: (f, want, got) => `no matching function for call to '${f}' (it takes ${want} argument${want === 1 ? '' : 's'}, you passed ${got})`,
        missingReturn: (f) => `'${f}' must return a value`,
        nullRef: 'Segmentation fault (used an empty object)',
        keyMissing: (k) => `map::at: key '${k}' not found`,
        notFunc: (n) => `'${n}' cannot be used as a function`,
        constAssign: (n) => `assignment of read-only variable '${n}'`,
        redeclared: (n) => `redeclaration of '${n}'`,
      },
    };
    if (id === 'java') Object.assign(base.msg, {
      semicolon: () => "';' expected",
      expected: (what) => `'${what}' expected`,
      expectedName: () => '<identifier> expected',
      eofBrace: 'reached end of file while parsing (a { was never closed with })',
      eofExpr: 'illegal start of expression',
      unexpected: () => 'illegal start of expression',
      unterminated: 'unclosed string literal',
      charLit: 'unclosed character literal — use double quotes "..." for text',
      undeclared: (n) => `cannot find symbol\n  symbol: variable ${n}`,
      noMain: 'no main method found — add public static void main(String[] args) inside your class',
      topStmt: () => 'class, interface, enum, or record expected (statements must go inside main)',
      convert: (from, to) => `incompatible types: ${from} cannot be converted to ${to}`,
      lossy: (from, to) => `incompatible types: possible lossy conversion from ${from} to ${to}`,
      operands: (op, a, b) => `bad operand types for binary operator '${op}' (${a} and ${b})`,
      divZero: 'java.lang.ArithmeticException: / by zero',
      index: (i, n) => `java.lang.IndexOutOfBoundsException: Index ${i} out of bounds for length ${n}`,
      noMember: (cls, m) => `cannot find symbol\n  symbol: method or field ${m} in ${cls}`,
      args: (f, want, got) => `method ${f} cannot be applied to given types (required ${want} argument${want === 1 ? '' : 's'}, found ${got})`,
      missingReturn: () => 'missing return statement',
      nullRef: 'java.lang.NullPointerException',
      keyMissing: () => 'java.lang.NullPointerException (that key is not in the map)',
      notFunc: (n) => `cannot find symbol\n  symbol: method ${n}`,
      constAssign: (n) => `cannot assign a value to final variable ${n}`,
      redeclared: (n) => `variable ${n} is already defined`,
      classSemi: "';' expected",
    });
    if (id === 'csharp') Object.assign(base.msg, {
      semicolon: () => '; expected',
      expected: (what) => `${what} expected`,
      expectedName: () => 'Identifier expected',
      eofBrace: '} expected',
      eofExpr: 'Invalid expression term',
      unexpected: (near) => `Invalid expression term '${near}'`,
      unterminated: 'Newline in constant (a string is missing its closing ")',
      charLit: 'Too many characters in character literal — use double quotes "..." for text',
      undeclared: (n) => `The name '${n}' does not exist in the current context`,
      noMain: 'Program does not contain a static Main method',
      convert: (from, to) => `Cannot implicitly convert type '${from}' to '${to}'`,
      lossy: (from, to) => `Cannot implicitly convert type '${from}' to '${to}'. An explicit conversion exists (are you missing a cast?)`,
      operands: (op, a, b) => `Operator '${op}' cannot be applied to operands of type '${a}' and '${b}'`,
      divZero: 'System.DivideByZeroException: Attempted to divide by zero.',
      index: () => 'System.ArgumentOutOfRangeException: Index was out of range.',
      noMember: (cls, m) => `'${cls}' does not contain a definition for '${m}'`,
      args: (f, want, got) => `No overload for method '${f}' takes ${got} arguments`,
      missingReturn: (f) => `'${f}': not all code paths return a value`,
      nullRef: 'System.NullReferenceException: Object reference not set to an instance of an object.',
      keyMissing: (k) => `System.Collections.Generic.KeyNotFoundException: The given key '${k}' was not present in the dictionary.`,
      notFunc: (n) => `'${n}' is not a method`,
      constAssign: (n) => `The left-hand side of an assignment must be a variable (${n} is read-only)`,
      redeclared: (n) => `A local variable named '${n}' is already defined in this scope`,
      classSemi: '; expected',
    });
    return base;
  }

  // ------------------------------------------------------------------ interpreter
  const BREAK = { sig: 'break' }, CONTINUE = { sig: 'continue' };
  class Ret { constructor(v) { this.v = v; } }
  class Thrown { constructor(v) { this.v = v; } }

  class Scope {
    constructor(parent) { this.vars = new Map(); this.parent = parent; }
    find(name) { let s = this; while (s) { if (s.vars.has(name)) return s.vars.get(name); s = s.parent; } return null; }
    declare(name, cell) { this.vars.set(name, cell); }
  }

  function run(code, opts) {
    opts = opts || {};
    const D = makeDialect(opts.dialect || 'cpp');
    const id = D.id;
    const maxSteps = opts.maxSteps || 300000;
    let steps = 0, depth = 0, curLine = 1;
    let out = '';
    let boolalpha = false;
    const result = { output: [], error: null, vars: {}, calls: [], actions: [] };
    const E = (type, msg) => new CError(type, msg, curLine);
    const tick = () => { if (++steps > maxSteps) throw E('TimeoutError', 'your code ran too long — is there an infinite loop?'); };

    const classes = new Map();
    const funcs = new Map();       // name -> [overloads]
    const globals = new Scope(null);
    let mainScope = null;

    // ---------------- type names & formatting
    const tname = (v) => {
      if (v === null || v === undefined) return id === 'cpp' ? 'nullptr' : 'null';
      if (typeof v === 'number') return 'int';
      if (v instanceof Dbl) return 'double';
      if (typeof v === 'boolean') return id === 'java' ? 'boolean' : 'bool';
      if (v instanceof Chr) return 'char';
      if (typeof v === 'string') return id === 'java' ? 'String' : id === 'cpp' ? 'std::string' : 'string';
      if (v instanceof CList) return v.kind;
      if (v instanceof CMap) return v.kind;
      if (v instanceof CObj) return v.cls.name;
      return 'object';
    };
    const fmtDouble = (x) => {
      if (id === 'java') { if (Number.isInteger(x) && Math.abs(x) < 1e7) return x.toFixed(1); return String(x); }
      if (id === 'csharp') return String(x);
      // C++ cout default: 6 significant digits
      if (Number.isInteger(x)) return String(x);
      let s = Number(x.toPrecision(6)).toString();
      return s;
    };
    function str(v, inCollection) {
      if (v === null || v === undefined) return id === 'csharp' ? '' : 'null';
      if (typeof v === 'number') return String(v);
      if (v instanceof Dbl) return fmtDouble(v.v);
      if (typeof v === 'boolean') return id === 'csharp' ? (v ? 'True' : 'False') : (id === 'cpp' && !boolalpha ? (v ? '1' : '0') : String(v));
      if (v instanceof Chr) return v.c;
      if (typeof v === 'string') return v;
      if (v instanceof CSB) return v.s;
      if (v instanceof CList) {
        if (id === 'java') return v.kind === 'array' ? `[${v.elem === 'int' ? 'I' : 'L' + (v.elem || 'Object')}@1b6d3586` : '[' + v.a.map(x => str(x, true)).join(', ') + ']';
        if (id === 'csharp') return v.kind === 'array' ? `System.${v.elem === 'int' ? 'Int32' : v.elem === 'string' ? 'String' : 'Object'}[]` : `System.Collections.Generic.${/^(Stack|Queue)$/.test(v.kind) ? v.kind : 'List'}\`1[System.${v.elem === 'int' ? 'Int32' : v.elem === 'string' ? 'String' : 'Object'}]`;
        throw E('TypeError', D.msg.operands('<<', 'std::ostream', 'std::vector'));
      }
      if (v instanceof CMap) {
        if (id === 'java') return '{' + [...v.m.entries()].map(([k, x]) => str(k) + '=' + str(x)).join(', ') + '}';
        if (id === 'csharp') return 'System.Collections.Generic.Dictionary`2[System.String,System.Int32]';
        throw E('TypeError', D.msg.operands('<<', 'std::ostream', 'std::map'));
      }
      if (v instanceof CExc) return id === 'cpp' ? v.msg : `${id === 'java' ? 'java.lang.' : 'System.'}${v.type}: ${v.msg}`;
      if (v instanceof CLambda) return id === 'java' ? 'Main$$Lambda@1b6d3586' : id === 'csharp' ? 'System.Func`2[System.Int32,System.Int32]' : 'lambda';
      if (v instanceof CObj) {
        const ts = findMethod(v.cls, id === 'csharp' ? 'ToString' : 'toString');
        if (ts && ts.params.length === 0 && id !== 'cpp') return str(callMethod(v, ts, []));
        if (id === 'java') return `${v.cls.name}@1b6d3586`;
        if (id === 'csharp') return v.cls.name;
        throw E('TypeError', D.msg.operands('<<', 'std::ostream', v.cls.name));
      }
      if (v && v.__class) return v.__class;
      return String(v);
    }

    // ---------------- numbers
    const isNum = (v) => typeof v === 'number' || v instanceof Dbl || v instanceof Chr;
    const nv = (v) => typeof v === 'number' ? v : v instanceof Dbl ? v.v : v instanceof Chr ? v.c.charCodeAt(0) : (typeof v === 'boolean' && id === 'cpp' ? (v ? 1 : 0) : NaN);
    const isD = (v) => v instanceof Dbl;
    const mkNum = (x, dbl) => dbl ? new Dbl(x) : x;
    const truthy = (v) => {
      if (typeof v === 'boolean') return v;
      if (id === 'cpp') { if (isNum(v)) return nv(v) !== 0; if (v === null) return false; return true; }
      throw E('TypeError', D.msg.convert(tname(v), id === 'java' ? 'boolean' : 'bool'));
    };

    // ---------------- conversion to a declared type
    function coerce(v, ty, varName) {
      if (!ty) return v;
      const t = ty.name;
      if (ty.arr || t === 'auto' || t === 'var' || t === 'dynamic' || t === 'object' || t === 'Object') return v;
      const fail = (lossy) => { throw E('TypeError', lossy && D.msg.lossy ? D.msg.lossy(tname(v), t) : D.msg.convert(tname(v), t)); };
      if (INT_T.has(t)) {
        if (typeof v === 'number') return v;
        if (v instanceof Dbl) { if (id === 'cpp') return Math.trunc(v.v); fail(true); }
        if (v instanceof Chr) return v.c.charCodeAt(0);
        if (typeof v === 'boolean' && id === 'cpp') return v ? 1 : 0;
        if (v === null && (t === 'Integer' || t === 'Long')) return v;
        fail();
      }
      if (DBL_T.has(t)) { if (typeof v === 'number') return new Dbl(v); if (v instanceof Dbl) return v; if (v instanceof Chr) return new Dbl(v.c.charCodeAt(0)); fail(); }
      if (BOOL_T.has(t)) { if (typeof v === 'boolean') return v; if (id === 'cpp' && isNum(v)) return nv(v) !== 0; fail(); }
      if (t === 'char' || t === 'Character') {
        if (v instanceof Chr) return v;
        if (typeof v === 'number' && id !== 'csharp') return new Chr(String.fromCharCode(v));
        if (typeof v === 'string' && v.length === 1 && id === 'cpp') fail();
        fail();
      }
      if (STR_T.has(t)) {
        if (typeof v === 'string') return v;
        if (v === null && id !== 'cpp') return v;
        if (v instanceof CSB) fail();
        fail();
      }
      if (id === 'cpp' && v instanceof CMap && ty.args && ty.args[1]) v.vty = ty.args[1];   // map<string, vector<int>>: m[k] on a new key starts as an empty vector
      return v;
    }
    function defaultFor(ty) {
      if (!ty) return null;
      if (ty.arr) return null;
      const t = ty.name;
      if (INT_T.has(t)) return 0;
      if (DBL_T.has(t)) return new Dbl(0);
      if (BOOL_T.has(t)) return false;
      if (t === 'char') return new Chr('\0');
      if (STR_T.has(t)) return id === 'cpp' ? '' : null;
      if (id === 'cpp') {
        if (/^(stack|queue)$/.test(t)) return new CList(t, [], ty.args[0] && ty.args[0].name);
        if (/^(vector|list|deque|set)$/.test(t)) return new CList('vector', [], ty.args[0] && ty.args[0].name);
        if (/^(map|unordered_map)$/.test(t)) return new CMap('map');
        if (classes.has(t) && !ty.ref) return construct(classes.get(t), []);   // a Node* field starts out empty, not as a new Node
      }
      return null;
    }

    // ---------------- collections
    const listKind = () => id === 'cpp' ? 'vector' : id === 'java' ? 'ArrayList' : 'List';
    const mapKind = () => id === 'cpp' ? 'map' : id === 'java' ? 'HashMap' : 'Dictionary';
    const elemName = (v) => typeof v === 'number' ? 'int' : typeof v === 'string' ? 'string' : null;
    function fromHost(v) {
      if (v === null || v === undefined) return null;
      if (Array.isArray(v)) return new CList(listKind(), v.map(fromHost), v.length ? elemName(v[0]) : null);
      if (typeof v === 'object') { const m = new CMap(mapKind()); for (const k of Object.keys(v)) m.m.set(k, fromHost(v[k])); return m; }
      if (typeof v === 'number' && !Number.isInteger(v)) return new Dbl(v);
      return v;
    }
    const lowerFirst = (s) => id === 'csharp' && /^[A-Z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
    function toHost(v, d = 0) {
      if (v === null || v === undefined) return null;
      if (v instanceof Dbl) return v.v;
      if (v instanceof Chr) return v.c;
      if (typeof v !== 'object') return v;
      if (d > 4) return null;
      if (v instanceof CSB) return v.s;
      if (v instanceof CList) return v.a.map(x => toHost(x, d + 1));
      if (v instanceof CMap) { const o = {}; for (const [k, x] of v.m) o[String(toHost(k))] = toHost(x, d + 1); return o; }
      if (v instanceof CObj) {
        const props = {}, methods = {};
        for (const [k, x] of v.f) props[lowerFirst(k)] = toHost(x, d + 1);
        let c = v.cls;
        while (c) {
          for (const [k, list] of c.methods) {
            const mk = lowerFirst(k);
            if (mk in methods || /^(toString|ToString|equals|Equals|GetHashCode|hashCode)$/.test(k)) continue;
            const m = list.find(x => !x.isStatic);
            if (!m || !m.body) continue;
            if (m.params.length === 0) {
              try { methods[mk] = { value: toHost(callMethod(v, m, []), d + 1) }; }
              catch (e) { if (e instanceof CError) methods[mk] = { error: `${e.cType}: ${e.message}` }; else throw e; }
            } else methods[mk] = { arity: m.params.length };
          }
          c = c.base;
        }
        return { __obj: true, className: v.cls.name, props, methods };
      }
      if (v.__class) return { __class: v.__class };
      return null;
    }
    function clone(v) {
      if (id !== 'cpp') return v;
      if (v instanceof CList) return new CList(v.kind, v.a.map(clone), v.elem);
      if (v instanceof CMap) return Object.assign(new CMap(v.kind, new Map([...v.m].map(([k, x]) => [k, clone(x)]))), v.vty ? { vty: v.vty } : {}, v.charKeys ? { charKeys: true } : {});
      if (v instanceof CObj) { if (v.heap) return v; const o = new CObj(v.cls); for (const [k, x] of v.f) o.f.set(k, clone(x)); return o; }   // copying a pointer (from new) copies the address, not the object
      return v;
    }
    function eq(a, b) {
      if (isNum(a) && isNum(b)) return nv(a) === nv(b);
      if (a instanceof Chr && typeof b === 'string') return a.c === b;
      return a === b || (a === null && b === undefined);
    }
    const keyOf = (k, m) => k instanceof Chr ? ((m && (m.charKeys = true)), k.c) : k instanceof Dbl ? k.v : k;
    // a map with char keys hands its keys back as chars
    const outKey = (m, k) => m && m.charKeys && typeof k === 'string' ? new Chr(k) : k;

    // ---------------- classes & objects
    function findMethod(cls, name, argc, vals) {
      let c = cls;
      while (c) {
        const list = c.methods.get(name);
        if (list && vals && id === 'cpp') {   // C++ method overloads with the same number of parameters: pick by the argument types
          const same = list.filter(x => x.params.length === argc);
          if (same.length > 1) {
            const m = same.find(f => f.params.every((p, i) => { const v = vals[i], t = p.ty && p.ty.name; if (INT_T.has(t)) return typeof v === 'number'; if (DBL_T.has(t)) return v instanceof Dbl; return typeMatches(v, p.ty); })) || same.find(f => f.params.every((p, i) => typeMatches(vals[i], p.ty)));
            if (m) return m;
          }
        }
        if (list) { const m = argc === undefined ? list[0] : (list.find(x => x.params.length === argc) || list.find(x => x.params.length >= argc && x.params.slice(argc).every(p => p.def)) || list[0]); if (m) return m; }
        c = c.base;
      }
      return null;
    }
    function hasField(cls, name) { let c = cls; while (c) { if (c.fieldDecls.some(f => f.name === name)) return true; c = c.base; } return false; }
    // C++: is this method virtual in cls (declared virtual / override / = 0 here or in a base class)?
    function cppIsVirtual(cls, name) { let c = cls; while (c) { const l = c.methods.get(name); if (l && l.some(m => m.virtual || m.abstract)) return true; c = c.base; } return false; }
    // C++: the method a call through a variable of static type `ty` runs: non-virtual methods use the variable's type
    function cppStaticMethod(obj, ty, name, args) {
      if (id !== 'cpp' || !ty || !(obj instanceof CObj) || !classes.has(ty.name)) return null;
      const st = classes.get(ty.name);
      if (st === obj.cls) return null;
      let c = obj.cls; while (c && c !== st) c = c.base;
      if (!c || cppIsVirtual(st, name)) return null;
      return findMethod(st, name, args.length, args);
    }
    // C++: a class with a pure virtual method nobody overrode is abstract and can't be made into an object
    function cppAbstractLeft(cls) {
      const seen = new Set();
      for (let c = cls; c; c = c.base) for (const [n, l] of c.methods) {
        if (l.some(m => m.body)) seen.add(n);
        else if (!seen.has(n) && l.some(m => m.abstract)) return n;
      }
      return null;
    }
    function construct(cls, args, line) {
      if (id === 'cpp') { const pv = cppAbstractLeft(cls); if (pv) throw E('TypeError', `cannot create an object of abstract type '${cls.name}': its pure virtual method '${pv}' has no body (only a class that overrides it can be created)`); }
      const obj = new CObj(cls);
      const initFields = (c) => {
        if (c.base) initFields(c.base);
        for (const f of c.fieldDecls) {
          if (f.isStatic) continue;
          let v;
          if (f.init) v = evalInit(f.init, f.ty, globals);
          else if (f.ctorArgs) v = construct(classes.get(f.ty.name), f.ctorArgs.map(a => evalExpr(a, globals)));
          else v = defaultFor(f.ty);
          obj.f.set(f.name, coerce(v, f.ty, f.name));
        }
      };
      initFields(cls);
      runCtor(cls, obj, args, line);
      return obj;
    }
    function runCtor(cls, obj, args, line) {
      if (!cls.ctors.length && args.length && !cls.base) {
        // aggregate initialisation: Point p = {1, 2}; fills the fields in order
        const fds = cls.fieldDecls.filter(f => !f.isStatic);
        if (args.length <= fds.length) { args.forEach((a, i) => obj.f.set(fds[i].name, coerce(a, fds[i].ty, fds[i].name))); return; }
      }
      if (!cls.base && cls.baseName && EXC_NAMES.test(cls.baseName)) {
        // a custom exception: class MyError : Exception { MyError(string m) : base(m) {} }
        const ctor0 = cls.ctors.find(c => c.params.length === args.length);
        if (ctor0) {
          const sc = new Scope(globals); sc.thisObj = obj; sc.cls = cls;
          bindParams(ctor0.params, args, sc, cls.name);
          const sargs = ctor0.superArgs || (ctor0.body && ctor0.body[0] && isSuperCall(ctor0.body[0]) ? ctor0.body[0].expr.args : null);
          obj.excMsg = sargs && sargs.length ? str(evalExpr(sargs[0], sc)) : '';
          for (const ini of ctor0.inits) obj.f.set(ini.name, ini.args.length ? evalExpr(ini.args[0], sc) : null);
          try { execBlock(ctor0.body.filter(s2 => !isSuperCall(s2)), sc); } catch (e) { if (!(e instanceof Ret)) throw e; }
          return;
        }
        if (id === 'java' && args.length) throw E('TypeError', `constructor ${cls.name} in class ${cls.name} cannot be applied to given types (found ${args.length} argument${args.length === 1 ? '' : 's'}) — give it a constructor like ${cls.name}(String message) { super(message); }`);
        obj.excMsg = args.length ? str(args[0]) : '';
        return;
      }
      const ctor = cls.ctors.find(c => c.params.length === args.length && c.params.every((p, i) => typeMatches(args[i], p.ty))) || cls.ctors.find(c => c.params.length === args.length) || cls.ctors.find(c => c.params.length > args.length && c.params.slice(args.length).every(p => p.def));
      if (!ctor) {
        if (cls.ctors.length || args.length) {
          if (!(cls.ctors.length === 0 && args.length === 0)) throw E('TypeError', id === 'csharp' ? `'${cls.name}' does not contain a constructor that takes ${args.length} argument${args.length === 1 ? '' : 's'}` : id === 'java' ? 'constructor ' + D.msg.args(cls.name, cls.ctors.length ? cls.ctors[0].params.length : 0, args.length).replace(/^method /, '').replace(' cannot', ` in class ${cls.name} cannot`) + (args.length === 0 && cls.ctors.length ? ' — a subclass constructor has to call super(...) with them first' : '') : D.msg.args(cls.name, cls.ctors.length ? cls.ctors[0].params.length : 0, args.length));
        }
        if (cls.base) runCtor(cls.base, obj, [], line);
        return;
      }
      const scope = new Scope(globals);
      scope.thisObj = obj; scope.cls = cls;
      bindParams(ctor.params, args, scope, cls.name);
      const b0 = ctor.body && ctor.body[0];
      if (id === 'java' && b0 && b0.type === 'ExprStmt' && b0.expr.type === 'Call' && b0.expr.callee.type === 'This') {
        // Java: this(...) runs another constructor of the same class first
        runCtor(cls, obj, b0.expr.args.map(a => evalExpr(a, scope)), line);
        try { execBlock(ctor.body.slice(1), scope, cls.name); } catch (e) { if (!(e instanceof Ret)) throw e; }
        return;
      }
      if (cls.base) runCtor(cls.base, obj, ctor.superArgs ? ctor.superArgs.map(a => evalExpr(a, scope)) : (ctor.body && ctor.body[0] && isSuperCall(ctor.body[0]) ? ctor.body[0].expr.args.map(a => evalExpr(a, scope)) : []), line);
      for (const ini of ctor.inits) {
        if (id === 'cpp' && classes.has(ini.name) && !findFieldDecl(cls, ini.name)) throw E('TypeError', `type '${ini.name}' is not a base of '${cls.name}' (to build on ${ini.name}, write class ${cls.name} : public ${ini.name})`);
        const fd = findFieldDecl(cls, ini.name);
        obj.f.set(ini.name, coerce(ini.args.length === 1 ? evalExpr(ini.args[0], scope) : null, fd ? fd.ty : null, ini.name));
      }
      try { execBlock(ctor.body.filter(s => !isSuperCall(s)), scope, cls.name); }
      catch (e) { if (!(e instanceof Ret)) throw e; }
    }
    const isSuperCall = (s) => s && s.type === 'ExprStmt' && s.expr.type === 'Call' && s.expr.callee.type === 'Super';
    function findFieldDecl(cls, name) { let c = cls; while (c) { const f = c.fieldDecls.find(x => x.name === name); if (f) return f; c = c.base; } return null; }

    // ---------------- functions
    function bindParams(params, args, scope, fname, argExprs, callerScope) {
      const required = params.filter(p => !p.def).length;
      if (args.length < required || args.length > params.length) throw E('TypeError', D.msg.args(fname, params.length, args.length));
      params.forEach((p, i) => {
        const ax = argExprs && argExprs[i];
        if (id === 'cpp' && p.ty && p.ty.ref && !p.isConst && ax && ['Num', 'Str', 'Bool', 'Char'].includes(ax.type)) throw E('TypeError', `cannot bind a non-const reference '${p.name}' to the value ${ax.type === 'Str' ? JSON.stringify(ax.value) : String(ax.value)}: a & parameter needs a variable to change (or make it a const reference)`);
        if (id === 'cpp' && p.ty && p.ty.ref && ax && ['Name', 'Member', 'Index'].includes(ax.type) && !(args[i] instanceof CObj || args[i] instanceof CList || args[i] instanceof CMap)) {
          // a reference parameter: reading and writing it reads and writes the caller's variable
          scope.declare(p.name, { get v() { return evalExpr(ax, callerScope); }, set v(nv2) { assignTo(ax, nv2, callerScope); }, ty: p.ty, isConst: p.isConst });
          return;
        }
        let v = i < args.length ? args[i] : evalExpr(p.def, scope);
        if (!p.ty.ref) v = clone(v);
        if (id === 'cpp' && !p.ty.ref && v instanceof CObj && classes.has(p.ty.name) && v !== args[i]) v.cls = classes.get(p.ty.name);   // passing a Dog by value as an Animal copies only the Animal part
        scope.declare(p.name, { v: coerce(v, p.ty, p.name), ty: p.ty, isConst: p.isConst });
      });
    }
    function callFunc(f, args, thisObj, cls, argExprs, callerScope) {
      tick();
      if (!f.body) throw E('TypeError', id === 'java' ? `abstract method ${f.name}() cannot be called — a subclass has to implement it` : id === 'csharp' ? `Cannot call an abstract member: '${f.name}'` : `pure virtual method '${f.name}' called — a subclass has to override it`);
      if (++depth > 200) { depth = 0; throw E('RuntimeError', id === 'java' ? 'java.lang.StackOverflowError' : id === 'csharp' ? 'Stack overflow.' : 'Segmentation fault (too much recursion)'); }
      const scope = new Scope(globals);
      scope.thisObj = thisObj; scope.cls = cls; scope.func = f;
      const saved = curLine;
      try {
        bindParams(f.params, args, scope, f.name, argExprs, callerScope);
        execBlock(f.body, scope);
        if (f.ret && f.ret.name !== 'void' && !(f.name === 'main' || f.name === 'Main')) {
          if (id === 'cpp') return defaultFor(f.ret);
          throw new CError('TypeError', D.msg.missingReturn(f.name), f.line);
        }
        return null;
      } catch (e) {
        if (e instanceof Ret) return f.ret ? coerce(e.v, f.ret, f.name) : e.v;
        if (e === BREAK || e === CONTINUE) throw E('SyntaxError', `${e.sig} statement not within a loop`);
        throw e;
      } finally { depth--; curLine = saved; }
    }
    function callMethod(obj, m, args) { return callFunc(m, args, obj, obj.cls); }
    function typeMatches(v, ty) {
      if (!ty) return true;
      const t = ty.name;
      if (INT_T.has(t)) return typeof v === 'number' || v instanceof Chr;
      if (DBL_T.has(t)) return typeof v === 'number' || v instanceof Dbl;
      if (BOOL_T.has(t)) return typeof v === 'boolean';
      if (STR_T.has(t)) return typeof v === 'string';
      if (t === 'char') return v instanceof Chr;
      if (id === 'cpp') {   // C++ overloads: a vector parameter wants a vector, a class parameter wants an object of it (or a subclass)
        if (t === 'vector' || t === 'array' || t === 'list') return v instanceof CList;
        if (t === 'map' || t === 'unordered_map') return v instanceof CMap;
        if (classes.has(t)) { if (!(v instanceof CObj)) return false; let c = v.cls; while (c) { if (c.name === t) return true; c = c.base; } return false; }
      }
      return true;
    }
    function pickOverload(list, argExprs, scope) {
      const n = argExprs.length;
      const same = list.filter(x => x.params.length === n);
      if (same.length > 1) {
        const vals = argExprs.map(a => { try { return evalExpr(a, scope); } catch (e) { return undefined; } });
        const exact = same.find(f => f.params.every((p, i) => { const v = vals[i]; const t = p.ty && p.ty.name; if (INT_T.has(t)) return typeof v === 'number'; if (DBL_T.has(t)) return v instanceof Dbl; return typeMatches(v, p.ty); }));
        if (exact) return exact;
        const loose = same.find(f => f.params.every((p, i) => typeMatches(vals[i], p.ty)));
        if (loose) return loose;
      }
      return same[0] || list.find(x => x.params.length > n && x.params.slice(n).every(p => p.def)) || list[0];
    }
    // Java method references: Main::twice (static), Order::getPrice (called on the argument),
    // Integer::sum / String::valueOf (library), System.out::println and obj::method (bound to an object)
    function callMethodRef(r, args, scope) {
      const t = r.target, node = { line: r.line, args: [] };
      if (t && t.__class) {
        const m = findMethod(t.cls, r.name, args.length);
        if (m && m.isStatic) return callFunc(m, args, null, m.ownerCls || t.cls, null, scope);
        return callMember(args[0], r.name, args.slice(1), node, scope);
      }
      if (t && t.__ns) {
        const lib = (t.__ns === 'Integer' && /^(sum|max|min|compare|parseInt|valueOf|toString)$/.test(r.name)) || (t.__ns === 'String' && /^(valueOf|join|format)$/.test(r.name)) || t.__ns === 'Math' || (t.__ns === 'Double' && r.name === 'parseDouble');
        if (!lib && args.length) return callMember(args[0], r.name, args.slice(1), node, scope);
        return callNsFn(t.__ns + '.' + r.name, args, r.line);
      }
      return callMember(t, r.name, args, node, scope);
    }
    // C++ lambda captures: [x] copies x when the lambda is made, [&x] shares it, [=] / [&] do that for every
    // local the body uses, and a local that isn't captured can't be used inside the lambda at all.
    function cppCaptureScope(node, scope) {
      const cap = new Scope(globals), cs = node.captures;
      cap.thisObj = findThis(scope); cap.cls = findCls(scope);
      const names = new Set();
      const walk = (n) => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) { n.forEach(walk); return; } if (n.type === 'Name' && typeof n.id === 'string') names.add(n.id); for (const k in n) if (k !== 'line' && k !== 'captures') walk(n[k]); };
      walk(node.block); walk(node.expr);
      for (const n of names) {
        const cell = scope.find(n);
        if (!cell || globals.vars.get(n) === cell) continue;
        if (cs.ref.includes(n) || (cs.all === 'ref' && !cs.val.includes(n))) cap.declare(n, cell);
        else if (cs.val.includes(n) || cs.all === 'val') cap.declare(n, { v: clone(cell.v), ty: cell.ty, isConst: !cs.mutable });
        else { const no = () => { throw E('NameError', `'${n}' is not captured: put it in the lambda's [ ] to use it, like [${n}] (a copy) or [&${n}] (shared)`); }; cap.declare(n, { get v() { return no(); }, set v(x) { no(); }, ty: cell.ty }); }
      }
      return cap;
    }
    function callLambda(l, args) {
      tick();
      const node = l.node;
      if (node.ref) return callMethodRef(node, args, l.scope);
      const scope = new Scope(l.scope);
      node.params.forEach((p, i) => scope.declare(p.name, { v: p.ty ? coerce(args[i], p.ty, p.name) : args[i], ty: p.ty }));
      if (node.expr) return evalExpr(node.expr, scope);
      try { execBlock(node.block, scope); } catch (e) { if (e instanceof Ret) return e.v; throw e; }
      return null;
    }
    const fnOf = (v) => (x, y) => v instanceof CLambda ? callLambda(v, y === undefined ? [x] : [x, y]) : null;
    function findProp(cls, name) { let c = cls; while (c) { const pr = c.props && c.props.get(name); if (pr) return pr; c = c.base; } return null; }
    function propGet(obj, pr) {
      if (!pr.get) throw E('TypeError', id === 'csharp' ? `The property '${pr.name}' cannot be used in this context because it lacks the get accessor` : 'no getter');
      const scope = new Scope(globals); scope.thisObj = obj; scope.cls = pr.ownerCls;
      if (pr.get.expr) return evalExpr(pr.get.expr, scope);
      try { execBlock(pr.get.body, scope); } catch (e) { if (e instanceof Ret) return coerce(e.v, pr.ty); throw e; }
      return null;
    }
    function propSet(obj, pr, v) {
      if (!pr.set) throw E('TypeError', `Property or indexer '${pr.name}' cannot be assigned to -- it is read only`);
      const scope = new Scope(globals); scope.thisObj = obj; scope.cls = pr.ownerCls;
      scope.declare('value', { v: coerce(v, pr.ty), ty: pr.ty });
      if (pr.set.expr) { evalExpr(pr.set.expr, scope); return; }
      try { execBlock(pr.set.body, scope); } catch (e) { if (!(e instanceof Ret)) throw e; }
    }
    // private / protected members can only be used from inside the class (or subclasses, for protected)
    function memberAccess(cls, name, isCall) {
      let c = cls;
      while (c) {
        if (isCall) { const m0 = c.methods.get(name); if (m0) return { access: m0[0].access, owner: c, decl: m0[0] }; }   // a field and a method may share a name
        const f = c.fieldDecls.find(x => x.name === name); if (f) return { access: f.access, owner: c, decl: f };
        const m = c.methods.get(name); if (m) return { access: m[0].access, owner: c, decl: m[0] };
        const pr = c.props && c.props.get(name); if (pr) return { access: pr.access, owner: c, decl: pr };
        c = c.base;
      }
      return null;
    }
    function checkAccess(objCls, name, scope, writing, isCall) {
      const info = memberAccess(objCls, name, isCall);
      if (!info) return;
      let access = info.access;
      if (writing && info.decl && info.decl.isProp && info.decl.setAccess) access = info.decl.setAccess;
      if (writing && info.decl && info.decl.isProp && info.decl.readOnly) {
        const here = findCls(scope);
        if (!here || here !== info.owner) throw E('AccessError', `Property or indexer '${info.owner.name}.${name}' cannot be assigned to -- it is read only`);
      }
      if (!access || access === 'public' || access === 'internal') return;
      const here = findCls(scope);
      let ok = false;
      if (here === info.owner) ok = true;
      else if (access === 'protected' && here) { let c = here; while (c) { if (c === info.owner) ok = true; c = c.base; } }
      if (ok) return;
      const kind = info.decl.params ? 'method' : 'field';
      if (id === 'csharp' && writing && info.decl.isProp && info.access !== access) throw E('AccessError', `The property or indexer '${info.owner.name}.${name}' cannot be used in this context because the set accessor is inaccessible`);
      throw E('AccessError', id === 'java' ? `${name}${kind === 'method' ? '()' : ''} has ${access} access in ${info.owner.name}` : id === 'csharp' ? `'${info.owner.name}.${name}' is inaccessible due to its protection level` : `'${name}' is ${access} within this context (it belongs to ${info.owner.name})`);
    }

    // ---------------- statements
    function execBlock(stmts, scope) { for (const s of stmts) exec(s, scope); }
    function exec(s, scope) {
      curLine = s.line; tick();
      switch (s.type) {
        case 'Block': execBlock(s.body, new Scope(scope)); return;
        case 'Empty': return;
        case 'ExprStmt': evalExpr(s.expr, scope); return;
        case 'Decl': {
          for (const v of s.vars) {
            if (scope.vars.has(v.name) && (scope !== globals || scope.vars.get(v.name).user)) throw E('SyntaxError', D.msg.redeclared(v.name));
            let val;
            if (id === 'cpp' && v.ty.ref && v.init && ['Name', 'Member', 'Index'].includes(v.init.type)) {
              // a C++ reference variable (int &r = x;): another name for the same box
              const ax = v.init, target = evalExpr(ax, scope);
              if (target instanceof CObj || target instanceof CList || target instanceof CMap) scope.declare(v.name, { v: target, ty: v.ty.name === 'auto' ? inferType(target) : v.ty, isConst: s.isConst, user: true });
              else scope.declare(v.name, { get v() { return evalExpr(ax, scope); }, set v(nv2) { assignTo(ax, nv2, scope); }, ty: v.ty.name === 'auto' ? inferType(target) : v.ty, isConst: s.isConst, user: true });
              continue;
            }
            if (v.init) val = evalInit(v.init, v.ty, scope);
            else if (v.ctorArgs) val = evalCtorDecl(v.ty, v.ctorArgs, scope);
            else if (v.size && id === 'cpp') val = new CList('array', Array.from({ length: nv(evalExpr(v.size, scope)) }, () => defaultFor({ name: v.ty.name })), v.ty.name);
            else val = defaultFor(v.ty);
            if (v.init && v.init.type !== 'InitList') val = clone(val);
            if (id === 'cpp' && v.init && !v.ty.ref && val instanceof CObj && classes.has(v.ty.name) && val.cls !== classes.get(v.ty.name)) val.cls = classes.get(v.ty.name);   // Animal a = cat; keeps only the Animal part
            if (val === undefined) val = null;
            const ty = (v.ty.name === 'auto' || v.ty.name === 'var') ? inferType(val) : v.ty;
            scope.declare(v.name, { v: coerce(val, v.ty, v.name), ty, isConst: s.isConst, user: true });
          }
          return;
        }
        case 'If': if (truthy(evalExpr(s.test, scope))) exec(s.body, new Scope(scope)); else if (s.orelse) exec(s.orelse, new Scope(scope)); return;
        case 'While':
          while (true) {
            curLine = s.line; tick();
            if (!truthy(evalExpr(s.test, scope))) break;
            try { exec(s.body, new Scope(scope)); } catch (e) { if (e === BREAK) break; if (e === CONTINUE) continue; throw e; }
          }
          return;
        case 'DoWhile':
          do {
            curLine = s.line; tick();
            try { exec(s.body, new Scope(scope)); } catch (e) { if (e === BREAK) break; if (e === CONTINUE) continue; throw e; }
          } while (truthy(evalExpr(s.test, scope)));
          return;
        case 'For': {
          const fs = new Scope(scope);
          if (s.init) exec(s.init, fs);
          while (true) {
            curLine = s.line; tick();
            if (s.test && !truthy(evalExpr(s.test, fs))) break;
            try { exec(s.body, new Scope(fs)); } catch (e) { if (e === BREAK) break; if (e !== CONTINUE) throw e; }
            if (s.update) evalExpr(s.update, fs);
          }
          return;
        }
        case 'ForEach': {
          const coll = evalExpr(s.iter, scope);
          let items;
          if (coll instanceof CList) items = coll.a.slice();
          else if (typeof coll === 'string') items = [...coll].map(c => new Chr(c));
          else if (coll instanceof CMap) { items = [...coll.m.entries()].map(([k, v]) => ({ __pair: true, k: outKey(coll, k), v })); if (id === 'cpp') items.sort((x, y) => cmp(x.k, y.k)); }
          else if (coll && coll.__keys) items = coll.__keys;
          else throw E('TypeError', id === 'java' ? 'for-each not applicable to expression type' : id === 'csharp' ? `foreach statement cannot operate on variables of type '${tname(coll)}'` : `'begin' was not declared in this scope (cannot loop over ${tname(coll)})`);
          const byRef = id === 'cpp' && s.ty && s.ty.ref && (coll instanceof CList || typeof coll === 'string');
          const chars = typeof coll === 'string' ? [...coll] : null;
          for (let k = 0; k < items.length; k++) {
            const it = items[k];
            curLine = s.line; tick();
            const ls = new Scope(scope);
            const cell = { v: coerce(it && it.__pair ? it : it, it && it.__pair ? null : s.ty, s.name), ty: s.ty };
            if (s.names && it && it.__pair) { ls.declare(s.names[0], { v: it.k, ty: null }); ls.declare(s.names[1], { v: it.v, ty: null }); }
            else ls.declare(s.name, cell);
            let stop = false;
            try { exec(s.body, ls); } catch (e) { if (e === BREAK) stop = true; else if (e !== CONTINUE) throw e; }
            if (byRef) { if (chars) chars[k] = cell.v instanceof Chr ? cell.v.c : str(cell.v); else coll.a[k] = cell.v; }
            if (stop) break;
          }
          if (byRef && chars) assignTo(s.iter, chars.join(''), scope);
          return;
        }
        case 'Switch': {
          const v = evalExpr(s.disc, scope);
          let matched = false;
          try {
            for (const c of s.cases) {
              if (!matched && (c.test === null ? false : eq(evalExpr(c.test, scope), v))) matched = true;
              if (matched) execBlock(c.body, scope);
            }
            if (!matched) { let def = false; for (const c of s.cases) { if (c.test === null) def = true; if (def) execBlock(c.body, scope); } }
          } catch (e) { if (e !== BREAK) throw e; }
          return;
        }
        case 'Return': throw new Ret(s.value ? evalExpr(s.value, scope) : null);
        case 'Break': throw BREAK;
        case 'Continue': throw CONTINUE;
        case 'Throw': {
          let v = s.value ? evalExpr(s.value, scope) : (scope.find('__caught') ? scope.find('__caught').v : null);
          if (typeof v === 'string' || isNum(v)) v = new CExc(id === 'cpp' ? (typeof v === 'string' ? 'const char*' : 'int') : 'Exception', str(v));
          const type = v instanceof CExc ? v.type : v instanceof CObj ? v.cls.name : 'Exception';
          const msg = v instanceof CExc ? v.msg : v instanceof CObj ? (v.excMsg !== undefined ? v.excMsg : '') : '';
          const shown = id === 'java' ? `Exception in thread "main" ${/Exception$|Error$/.test(type) && !classes.has(type) ? 'java.lang.' : ''}${type}: ${msg}`
            : id === 'csharp' ? `Unhandled exception. ${classes.has(type) ? '' : 'System.'}${type}: ${msg}`
              : `terminate called after throwing an instance of '${classes.has(type) ? type : 'std::' + type}'\n  what():  ${msg}`;
          const err = new CError('RuntimeError', shown, s.line);
          err.thrown = v;
          throw err;
        }
        case 'Try': {
          try { exec(s.body, scope); }
          catch (e) {
            if (!(e instanceof CError) || e.cType !== 'RuntimeError' || !s.handlers.length) throw e;
            const ex = e.thrown || excFromError(e);
            const h = s.handlers.find(hd => (hd.ctypes || [hd.ctype]).some(ct => catches(ct, ex)));
            if (!h) throw e;
            const hs = new Scope(scope);
            if (h.name) hs.declare(h.name, { v: ex, ty: null });
            hs.declare('__caught', { v: ex, ty: null });
            exec(h.body, hs);
          } finally { if (s.fin) exec(s.fin, scope); }
          return;
        }
        case 'Class': case 'Func': case 'Enum': return;
      }
      throw E('SyntaxError', `unsupported statement ${s.type}`);
    }
    function excFromError(e) {
      const m = e.message;
      const pick = (cs, java, cpp) => id === 'csharp' ? cs : id === 'java' ? java : cpp;
      let type;
      if (/zero/i.test(m)) type = pick('DivideByZeroException', 'ArithmeticException', 'runtime_error');
      else if (/IndexOutOfRange/.test(m)) type = 'IndexOutOfRangeException';
      else if (/ArgumentOutOfRange/.test(m)) type = 'ArgumentOutOfRangeException';
      else if (/ArrayIndexOutOfBounds/.test(m)) type = 'ArrayIndexOutOfBoundsException';
      else if (/StringIndexOutOfBounds/.test(m)) type = 'StringIndexOutOfBoundsException';
      else if (/IndexOutOfBounds/.test(m)) type = 'IndexOutOfBoundsException';
      else if (/out of range|map::at/.test(m)) type = 'out_of_range';
      else if (/NullReference/.test(m)) type = 'NullReferenceException';
      else if (/NullPointer/.test(m)) type = 'NullPointerException';
      else if (/NumberFormat/.test(m)) type = 'NumberFormatException';
      else if (/FormatException/.test(m)) type = 'FormatException';
      else if (/KeyNotFound/.test(m)) type = 'KeyNotFoundException';
      else if (/invalid_argument/.test(m)) type = 'invalid_argument';
      else type = pick('Exception', 'RuntimeException', 'runtime_error');
      const msg = m.replace(/^.*?(System\.[\w.]+|java\.lang\.[\w.]+): ?/, '');
      return new CExc(type, msg);
    }
    function catches(ctype, ex) {
      if (!ctype) return true;
      const type = ex instanceof CExc ? ex.type : ex instanceof CObj ? ex.cls.name : 'Exception';
      if (ctype === type) return true;
      if (/^(Exception|exception|Throwable)$/.test(ctype)) return true;
      if (id === 'java' && ctype === 'RuntimeException') return !javaChecked(type);   // checked exceptions are not RuntimeExceptions
      if (ctype === 'RuntimeException' && !(ex instanceof CObj && !EXC_NAMES.test(rootBase(ex.cls)))) return true;
      if (ctype === 'logic_error' && /^(invalid_argument|out_of_range|length_error|domain_error)$/.test(type)) return true;
      if (ctype === 'runtime_error' && /^(range_error|overflow_error|underflow_error)$/.test(type)) return true;
      if (ctype === 'IndexOutOfBoundsException' && /IndexOutOfBounds/.test(type)) return true;
      if (ctype === 'IllegalArgumentException' && type === 'NumberFormatException') return true;
      if (ctype === 'ArgumentException' && /^Argument/.test(type)) return true;
      if (ex instanceof CObj) { let c = ex.cls; while (c) { if (c.name === ctype || c.baseName === ctype) return true; c = c.base; } }
      return false;
    }
    function rootBase(cls) { let c = cls; while (c.base) c = c.base; return c.baseName || c.name; }
    function inferType(v) {
      if (typeof v === 'number') return { name: 'int', args: [] };
      if (v instanceof Dbl) return { name: 'double', args: [] };
      if (typeof v === 'boolean') return { name: 'bool', args: [] };
      if (typeof v === 'string') return { name: 'string', args: [] };
      if (v instanceof Chr) return { name: 'char', args: [] };
      return { name: 'auto', args: [] };
    }
    function evalCtorDecl(ty, args, scope) {
      const vals = args.map(a => evalExpr(a, scope));
      if (classes.has(ty.name)) return construct(classes.get(ty.name), vals);
      if (id === 'cpp' && /^[A-Z]/.test(ty.name)) throw E('NameError', `'${ty.name}' was not declared in this scope (there is no class called ${ty.name} yet)`);
      if (/^(vector|list)$/.test(ty.name)) { const n = nv(vals[0] || 0); return new CList('vector', Array.from({ length: n }, () => vals.length > 1 ? clone(vals[1]) : defaultFor(ty.args[0])), ty.args[0] && ty.args[0].name); }
      if (STR_T.has(ty.name)) {
        if (vals.length === 2 && typeof vals[0] === 'number' && vals[1] instanceof Chr) return vals[1].c.repeat(vals[0]);
        if (vals.length === 2 && vals[0] instanceof Iter) return iterRangeString(vals[0], vals[1]);
        return vals.length ? str(vals[0]) : '';
      }
      if (vals.length === 0 && STR_T.has(ty.name)) return '';
      if (vals.length === 1) return coerce(vals[0], ty);
      throw E('TypeError', D.msg.args(ty.name, 0, vals.length));
    }
    function iterRangeString(a, b) {
      const s = a.target;
      const text = typeof s === 'string' ? s : s instanceof CList ? s.a.map(x => str(x)).join('') : '';
      if (a.pos === 'rbegin') return [...text].reverse().join('');
      return text;
    }
    function evalInit(init, ty, scope) {
      if (init.type === 'InitList') {
        const items = init.items.map(x => x.type === 'InitList' ? evalInit(x, ty && ty.args && ty.args[0], scope) : evalExpr(x, scope));
        if (ty && (/^(map|unordered_map|Dictionary|HashMap)$/.test(ty.name))) {
          const m = new CMap(id === 'cpp' ? 'map' : ty.name);
          for (const pair of items) { if (pair instanceof CList) m.m.set(keyOf(pair.a[0]), pair.a[1]); }
          return m;
        }
        if (ty && classes.has(ty.name) && !ty.arr) return construct(classes.get(ty.name), items);
        const elem = ty ? (ty.arr ? ty.name : (ty.args[0] && ty.args[0].name)) : null;
        const kind = ty && ty.arr ? 'array' : (ty && /^(List|ArrayList)$/.test(ty.name) ? ty.name : (id === 'cpp' ? 'vector' : 'array'));
        return new CList(ty && ty.name === 'vector' ? 'vector' : kind, items.map(x => elem ? coerce(x, { name: elem, args: [] }) : x), elem);
      }
      return evalExpr(init, scope);
    }

    // ---------------- names
    function lookup(name, scope, line) {
      const cell = scope.find(name);
      if (cell) return cell.v;
      const thisObj = findThis(scope);
      if (thisObj) { const pr = findProp(thisObj.cls, name); if (pr) return propGet(thisObj, pr); }
      if (thisObj && thisObj.f.has(name)) return thisObj.f.get(name);
      const cls = findCls(scope);
      if (cls) { const sf = staticField(cls, name); if (sf) return sf.v; }
      if (classes.has(name)) return { __class: name, cls: classes.get(name) };
      if (funcs.has(name)) return { __func: name };
      const bi = builtinValue(name);
      if (bi !== undefined) return bi;
      curLine = line || curLine;
      throw E('NameError', D.msg.undeclared(name));
    }
    function staticField(cls, name) { let c = cls; while (c) { if (c.statics.has(name)) return c.statics.get(name); c = c.base; } return null; }
    const findThis = (scope) => { let s = scope; while (s) { if (s.thisObj) return s.thisObj; s = s.parent; } return null; };
    const findCls = (scope) => { let s = scope; while (s) { if (s.cls) return s.cls; s = s.parent; } return null; };
    function setName(name, v, scope) {
      const cell = scope.find(name);
      if (cell) { if (cell.isConst) throw E('TypeError', D.msg.constAssign(name)); cell.v = coerce(v, cell.ty, name); return; }
      const thisObj = findThis(scope);
      if (thisObj) { const pr = findProp(thisObj.cls, name); if (pr) { propSet(thisObj, pr, v); return; } }
      if (thisObj && thisObj.f.has(name)) { const fd = findFieldDecl(thisObj.cls, name); thisObj.f.set(name, coerce(v, fd ? fd.ty : null, name)); return; }
      const cls = findCls(scope);
      if (cls) { const sf = staticField(cls, name); if (sf) { sf.v = coerce(v, sf.ty, name); return; } }
      throw E('NameError', D.msg.undeclared(name));
    }

    // ---------------- builtins per dialect
    const API = opts.api || {};
    function apiCall(name, args) {
      const hostArgs = args.map(a => toHost(a));
      result.actions.push({ fn: name, args: hostArgs, line: curLine });
      if (result.actions.length > 5000) throw E('RuntimeError', 'your code called a function thousands of times — is a loop stuck going forever?');
      return fromHost(API[name](...hostArgs));
    }
    const apiNames = {};
    for (const n of Object.keys(API)) {
      const camel = n.replace(/_([a-z])/g, (m, ch) => ch.toUpperCase());
      apiNames[n] = n; apiNames[camel] = n; apiNames[camel[0].toUpperCase() + camel.slice(1)] = n;
    }
    const NS = { std: true, System: true, Console: true, Math: true, String: true, Integer: true, Double: true, Arrays: true, Collections: true, Character: true, Convert: true, string: true, int: true, double: true, List: true, Array: true, Boolean: true, Objects: true, Thread: true };
    if (id === 'java') NS.Collectors = true;
    function builtinValue(name) {
      if (id === 'cpp') {
        if (name === 'cout' || name === 'cerr') return { __stream: true };
        if (name === 'endl') return ENDL;
        if (name === 'boolalpha') return BOOLALPHA;
        if (name === 'npos') return -1;
      }
      if (NS[name]) return { __ns: name };
      return undefined;
    }
    function nsMember(ns, name) {
      if (ns === 'std') { const b = builtinValue(name); if (b !== undefined) return b; return { __bfn: name }; }
      if (ns === 'System' && name === 'out') return { __sysout: true };
      if (ns === 'string' && name === 'Empty') return '';
      if (ns === 'Math' && (name === 'PI' || name === 'E')) return new Dbl(Math[name]);
      if (ns === 'Integer' && (name === 'MAX_VALUE' || name === 'MIN_VALUE')) return name === 'MAX_VALUE' ? 2147483647 : -2147483648;
      if (ns === 'int' && (name === 'MaxValue' || name === 'MinValue')) return name === 'MaxValue' ? 2147483647 : -2147483648;
      return { __nsfn: ns + '.' + name };
    }
    function write(s) { out += s; if (out.length > 20000) throw E('RuntimeError', 'too much output!'); }
    function fmtComposite(fmt, args) {
      return fmt.replace(/\{(\d+)(?::([^}]*))?\}/g, (m, i, f) => fmtSpec(args[+i], f));
    }
    function fmtSpec(v, f) {
      if (!f) return str(v);
      const m = /^[FfNn](\d*)$/.exec(f);
      if (m) return nv(v).toFixed(m[1] === '' ? 2 : +m[1]);
      if (/^0\.(0+)$/.test(f)) return nv(v).toFixed(f.length - 2);
      return str(v);
    }
    function printf(fmt, args) {
      let i = 0;
      return fmt.replace(/%(-?\d*)(?:\.(\d+))?([dfsnc%b])/g, (m, w, prec, k) => {
        if (k === '%') return '%'; if (k === 'n') return '\n';
        const v = args[i++];
        let s;
        if (k === 'd') s = String(Math.trunc(nv(v)));
        else if (k === 'f') s = nv(v).toFixed(prec === undefined ? 6 : +prec);
        else s = str(v);
        if (w) { const wn = +w; s = wn < 0 ? s.padEnd(-wn) : s.padStart(wn); }
        return s;
      });
    }
    function callNsFn(full, args, line) {
      const a = args;
      const [ns, fn] = full.split('.');
      const num = (x) => nv(x);
      const anyD = a.some(isD);
      // C#'s Math.Round(x, digits) rounds half to even ("banker's rounding") by default
      const csRound = (x, d) => { const f = Math.pow(10, d), y = +(x * f).toFixed(9), r = Math.round(y); return (Math.abs(y % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r) / f; };
      const mathFns = {
        max: () => mkNum(Math.max(num(a[0]), num(a[1])), anyD), min: () => mkNum(Math.min(num(a[0]), num(a[1])), anyD),
        abs: () => mkNum(Math.abs(num(a[0])), anyD), pow: () => new Dbl(Math.pow(num(a[0]), num(a[1]))), sqrt: () => new Dbl(Math.sqrt(num(a[0]))),
        floor: () => new Dbl(Math.floor(num(a[0]))), ceil: () => new Dbl(Math.ceil(num(a[0]))), round: () => id === 'java' ? Math.round(num(a[0])) : id === 'csharp' ? new Dbl(csRound(num(a[0]), a.length > 1 ? num(a[1]) : 0)) : new Dbl(Math.round(num(a[0]))),
        random: () => new Dbl(Math.random()),
      };
      if (ns === 'Math') {
        const k = fn.toLowerCase();
        if (mathFns[k]) return mathFns[k]();
      }
      if (ns === 'Console' && (fn === 'WriteLine' || fn === 'Write')) {
        let s = a.length === 0 ? '' : (a.length > 1 && typeof a[0] === 'string' ? fmtComposite(a[0], a.slice(1)) : str(a[0]));
        write(s + (fn === 'WriteLine' ? '\n' : ''));
        return null;
      }
      if (ns === 'Console' && fn === 'ReadLine') throw E('RuntimeError', 'Console.ReadLine() is not available here — use the variables you collected!');
      if (ns === 'String' || ns === 'string') {
        if (fn === 'valueOf') return str(a[0]);
        if (fn === 'format' || fn === 'Format') return id === 'java' ? printf(a[0], a.slice(1)) : fmtComposite(a[0], a.slice(1));
        if (fn === 'join' || fn === 'Join') { const items = a.length === 2 && a[1] instanceof CList ? a[1].a : a.slice(1); return items.map(x => str(x)).join(str(a[0])); }
        if (fn === 'IsNullOrEmpty') return a[0] === null || a[0] === '';
      }
      if (ns === 'Integer' && (fn === 'parseInt' || fn === 'valueOf')) { const r = parseInt(a[0], 10); if (Number.isNaN(r) || !/^\s*[+-]?\d+\s*$/.test(a[0])) throw E('RuntimeError', `java.lang.NumberFormatException: For input string: "${a[0]}"`); return r; }
      if (ns === 'Integer' && fn === 'toString') return str(a[0]);
      if (ns === 'Integer' && fn === 'sum') return nv(a[0]) + nv(a[1]);
      if (ns === 'Integer' && (fn === 'max' || fn === 'min')) return Math[fn](nv(a[0]), nv(a[1]));
      if (ns === 'Integer' && fn === 'compare') return Math.sign(nv(a[0]) - nv(a[1]));
      if (ns === 'Double' && fn === 'parseDouble') return new Dbl(parseFloat(a[0]));
      if (ns === 'int' && (fn === 'Parse')) { if (!/^\s*[+-]?\d+\s*$/.test(a[0])) throw E('RuntimeError', 'System.FormatException: The input string was not in a correct format.'); return parseInt(a[0], 10); }
      if (ns === 'double' && fn === 'Parse') return new Dbl(parseFloat(a[0]));
      if (ns === 'Convert') { if (fn === 'ToInt32') return Math.trunc(typeof a[0] === 'string' ? parseInt(a[0], 10) : num(a[0])); if (fn === 'ToString') return str(a[0]); if (fn === 'ToDouble') return new Dbl(typeof a[0] === 'string' ? parseFloat(a[0]) : num(a[0])); }
      if (ns === 'Arrays' && fn === 'stream') return new CStream(a[0].a.slice());
      if (ns === 'Collectors') return { __collect: fn, sep: a.length ? str(a[0]) : '' };
      if (ns === 'Collections' && fn === 'sort' && a[1] instanceof CLambda) { const f2 = fnOf(a[1]); a[0].a.sort((x, y) => nv(f2(x, y))); return null; }
      if (ns === 'Collections' && (fn === 'max' || fn === 'min')) return a[0].a.reduce((t, x) => (fn === 'max' ? cmp(x, t) > 0 : cmp(x, t) < 0) ? x : t);
      if (ns === 'Arrays' && fn === 'toString') return '[' + a[0].a.map(x => str(x, true)).join(', ') + ']';
      if (ns === 'Arrays' && fn === 'asList') return new CList('ArrayList', a.length === 1 && a[0] instanceof CList ? a[0].a.slice() : a.slice(), a[0] ? elemName(a[0]) : null);
      if (ns === 'Arrays' && fn === 'sort') { a[0].a.sort((x, y) => cmp(x, y)); return null; }
      if (ns === 'List' && fn === 'of') return new CList('List', a.slice(), a[0] ? elemName(a[0]) : null);
      if (ns === 'Collections' && fn === 'sort') { a[0].a.sort((x, y) => cmp(x, y)); return null; }
      if (ns === 'Collections' && fn === 'reverse') { a[0].a.reverse(); return null; }
      if (ns === 'Array' && fn === 'Reverse') { a[0].a.reverse(); return null; }
      if (ns === 'Array' && fn === 'Sort') { a[0].a.sort((x, y) => cmp(x, y)); return null; }
      if (ns === 'Character') { const c = a[0] instanceof Chr ? a[0].c : String.fromCharCode(a[0]); if (fn === 'toUpperCase') return new Chr(c.toUpperCase()); if (fn === 'toLowerCase') return new Chr(c.toLowerCase()); if (fn === 'isDigit') return /\d/.test(c); if (fn === 'isLetter') return /[A-Za-z]/.test(c); }
      if (ns === 'char') { const c = a[0] instanceof Chr ? a[0].c : ''; if (fn === 'ToUpper') return new Chr(c.toUpperCase()); if (fn === 'ToLower') return new Chr(c.toLowerCase()); if (fn === 'IsDigit') return /\d/.test(c); }
      if (ns === 'Thread' && fn === 'sleep') return null;
      throw E('NameError', id === 'java' ? `cannot find symbol\n  symbol: method ${fn} in ${ns}` : id === 'csharp' ? `'${ns}' does not contain a definition for '${fn}'` : `'${fn}' is not a member of '${ns}'`);
    }
    function iterItems(t) { return typeof t === 'string' ? [...t].map(c => new Chr(c)) : t instanceof CList ? t.a : []; }
    function iterIndex(it) { const n = iterItems(it.target).length; if (it.pos === 'end' || it.pos === 'rend') return n + (it.offset || 0); return it.offset || 0; }
    function iterRange(a, b) {
      if (!(a instanceof Iter)) throw E('TypeError', 'expected an iterator like v.begin()');
      const items = iterItems(a.target);
      if (a.pos === 'rbegin') return items.slice().reverse();
      return items.slice(iterIndex(a), b instanceof Iter ? iterIndex(b) : items.length);
    }
    function cmp(x, y) { if (isNum(x) && isNum(y)) return nv(x) - nv(y); const a = str(x), b = str(y); return a < b ? -1 : a > b ? 1 : 0; }
    function callBuiltinFn(name, args, callNode, scope) {
      const a = args;
      if (id === 'cpp') {
        const num = (x) => nv(x);
        switch (name) {
          case 'to_string': return isD(a[0]) ? a[0].v.toFixed(6) : str(a[0]);
          case 'stoi': { const r = parseInt(a[0], 10); if (Number.isNaN(r)) throw E('RuntimeError', "terminate called after throwing an instance of 'std::invalid_argument' (stoi)"); return r; }
          case 'stod': return new Dbl(parseFloat(a[0]));
          case 'toupper': return a[0] instanceof Chr ? new Chr(a[0].c.toUpperCase()) : String.fromCharCode(num(a[0])).toUpperCase().charCodeAt(0);
          case 'tolower': return a[0] instanceof Chr ? new Chr(a[0].c.toLowerCase()) : String.fromCharCode(num(a[0])).toLowerCase().charCodeAt(0);
          case 'isdigit': return /\d/.test(a[0] instanceof Chr ? a[0].c : String.fromCharCode(num(a[0])));
          case 'isalpha': return /[A-Za-z]/.test(a[0] instanceof Chr ? a[0].c : String.fromCharCode(num(a[0])));
          case 'max': return mkNum(Math.max(num(a[0]), num(a[1])), a.some(isD));
          case 'min': return mkNum(Math.min(num(a[0]), num(a[1])), a.some(isD));
          case 'abs': return mkNum(Math.abs(num(a[0])), a.some(isD));
          case 'pow': return new Dbl(Math.pow(num(a[0]), num(a[1])));
          case 'sqrt': return new Dbl(Math.sqrt(num(a[0])));
          case 'floor': return new Dbl(Math.floor(num(a[0])));
          case 'ceil': return new Dbl(Math.ceil(num(a[0])));
          case 'round': return new Dbl(Math.round(num(a[0])));
          case 'swap': {
            const [x, y] = callNode.args; const vx = evalExpr(x, scope), vy = evalExpr(y, scope);
            assignTo(x, vy, scope); assignTo(y, vx, scope); return null;
          }
          case 'reverse': case 'sort': {
            const it = a[0];
            if (!(it instanceof Iter)) throw E('TypeError', `no matching function for call to '${name}'`);
            const t = it.target;
            const order = a[2] ? (x, y) => (truthy(fnOf(a[2])(x, y)) ? -1 : truthy(fnOf(a[2])(y, x)) ? 1 : 0) : (x, y) => cmp(x, y);
            if (typeof t === 'string') {
              const chars = [...t].map(c => new Chr(c));
              if (name === 'reverse') chars.reverse(); else chars.sort(order);
              assignTo(it.expr, chars.map(c => c.c).join(''), scope);
            } else if (t instanceof CList) {
              const lo = iterIndex(a[0]), hi = iterIndex(a[1]);
              const part = t.a.slice(lo, hi);
              if (name === 'reverse') part.reverse(); else part.sort(order);
              t.a.splice(lo, part.length, ...part);
            }
            return null;
          }
          case 'for_each': { for (const x of iterRange(a[0], a[1])) fnOf(a[2])(x); return null; }
          case 'count_if': return iterRange(a[0], a[1]).filter(x => truthy(fnOf(a[2])(x))).length;
          case 'count': return iterRange(a[0], a[1]).filter(x => eq(x, a[2])).length;
          case 'any_of': return iterRange(a[0], a[1]).some(x => truthy(fnOf(a[2])(x)));
          case 'all_of': return iterRange(a[0], a[1]).every(x => truthy(fnOf(a[2])(x)));
          case 'none_of': return !iterRange(a[0], a[1]).some(x => truthy(fnOf(a[2])(x)));
          case 'accumulate': { let t = a[2]; for (const x of iterRange(a[0], a[1])) t = a[3] ? fnOf(a[3])(t, x) : arith('+', t, x); return t; }
          case 'find': case 'find_if': case 'max_element': case 'min_element': {
            const items = iterRange(a[0], a[1]); const start = iterIndex(a[0]);
            let k = -1;
            if (name === 'find') k = items.findIndex(x => eq(x, a[2]));
            else if (name === 'find_if') k = items.findIndex(x => truthy(fnOf(a[2])(x)));
            else if (a[2]) { const less = fnOf(a[2]); items.forEach((x, i) => { if (k < 0 || truthy(name === 'max_element' ? less(items[k], x) : less(x, items[k]))) k = i; }); }   // with a comparator lambda
            else items.forEach((x, i) => { if (k < 0 || (name === 'max_element' ? cmp(x, items[k]) > 0 : cmp(x, items[k]) < 0)) k = i; });
            const it = new Iter(a[0].target, 'begin', a[0].expr);
            it.offset = k < 0 ? iterItems(a[0].target).length : start + k;
            return it;
          }
          case 'transform': { const src = iterRange(a[0], a[1]).map(x => fnOf(a[3])(x)); const dst = a[2]; const t = dst.target; if (t instanceof CList) { const off = iterIndex(dst); src.forEach((x, i) => { t.a[off + i] = x; }); } return null; }
          case 'distance': return iterIndex(a[1]) - iterIndex(a[0]);
          case 'getline': throw E('RuntimeError', 'reading input is not available here — use the variables you collected!');
          case 'printf': write(printf(a[0], a.slice(1))); return null;
        }
      }
      return undefined;
    }

    // ---------------- member access
    function member(obj, name, line, node, scope) {
      curLine = line;
      if (obj instanceof CExc || (obj instanceof CObj && obj.excMsg !== undefined)) {
        const msg = obj instanceof CExc ? obj.msg : obj.excMsg;
        if (name === 'Message' || name === 'message') { if (!(obj instanceof CObj && obj.f.has(name))) return msg; }
        if (obj instanceof CExc) return { __bound: obj, name };
      }
      if (obj && obj.__typeName && name === 'Name') return obj.__typeName;
      if (obj && obj.__ns) return nsMember(obj.__ns, name);
      if (obj && obj.__sysout) return { __bound: obj, name };
      if (obj && obj.__class) {
        const cls = obj.cls;
        const sf = staticField(cls, name);
        if (sf) return sf.v;
        if (findMethod(cls, name)) return { __bound: obj, name };
        throw E('NameError', D.msg.noMember(cls.name, name));
      }
      if (obj === null || obj === undefined) throw E('RuntimeError', D.msg.nullRef);
      if (obj instanceof CObj) {
        if (scope) checkAccess(obj.cls, name, scope, false);
        const pr = findProp(obj.cls, name);
        if (pr) return propGet(obj, pr);
        if (obj.f.has(name)) return obj.f.get(name);
        if (findMethod(obj.cls, name)) return { __bound: obj, name };
        throw E('NameError', D.msg.noMember(obj.cls.name, name));
      }
      if (obj && obj.__pair) {
        if (name === 'first' || name === 'Key' || name === 'getKey') return name === 'getKey' ? { __bound: obj, name } : obj.k;
        if (name === 'second' || name === 'Value' || name === 'getValue') return name === 'getValue' ? { __bound: obj, name } : obj.v;
      }
      // properties (C#) and fields
      if (typeof obj === 'string' && name === 'Length' && id === 'csharp') return obj.length;
      if (obj instanceof CList && (name === 'Length' && id === 'csharp' || name === 'length' && id === 'java' && obj.kind === 'array')) {
        if (id === 'java' && obj.kind !== 'array') throw E('NameError', D.msg.noMember(tname(obj), name));
        return obj.a.length;
      }
      if (obj instanceof CList && name === 'Count' && id === 'csharp') return obj.a.length;
      if (obj instanceof CMap && name === 'Count' && id === 'csharp') return obj.m.size;
      if (obj instanceof CMap && name === 'Keys') return new CList('List', [...obj.m.keys()].map(k => outKey(obj, k)));
      if (obj instanceof CMap && name === 'Values') return new CList('List', [...obj.m.values()]);
      return { __bound: obj, name };
    }
    function callMember(obj, name, args, node, scope) {
      curLine = node.line;
      if (obj && obj.__sysout) {
        if (name === 'println') { write((args.length ? str(args[0]) : '') + '\n'); return null; }
        if (name === 'print') { write(str(args[0])); return null; }
        if (name === 'printf' || name === 'format') { write(printf(args[0], args.slice(1))); return null; }
      }
      if (obj && obj.__ns) {
        const v = nsMember(obj.__ns, name);
        if (v && v.__nsfn) return callNsFn(v.__nsfn, args, node.line);
        if (v && v.__bfn) { const r = callBuiltinFn(v.__bfn, args, node, scope); if (r !== undefined) return r; }
        throw E('NameError', D.msg.notFunc(name));
      }
      if (obj && obj.__class) {
        const m = findMethod(obj.cls, name, args.length);
        if (!m) throw E('NameError', D.msg.noMember(obj.cls.name, name));
        if (id === 'java' && !m.isStatic) throw E('TypeError', `non-static method ${name}() cannot be referenced from a static context — make it static, or call it on an object`);
        const me = findThis(scope);
        return callFunc(m, args, m.isStatic ? null : me, m.ownerCls || obj.cls, node.args, scope);
      }
      if (id === 'csharp' && name === 'GetType' && !args.length && (obj instanceof CExc || obj instanceof CObj)) return { __typeName: obj instanceof CExc ? obj.type : obj.cls.name };
      if (obj instanceof CLambda) {
        if (/^(apply|test|accept|get|run|compare|applyAsInt|applyAsDouble|Invoke)$/.test(name)) return callLambda(obj, args);
      }
      if (obj instanceof CExc || (obj instanceof CObj && obj.excMsg !== undefined && /^(getMessage|what|ToString|toString)$/.test(name) && !findMethod(obj.cls, name))) {
        const msg = obj instanceof CExc ? obj.msg : obj.excMsg, type = obj instanceof CExc ? obj.type : obj.cls.name;
        if (name === 'getMessage' || name === 'what') return msg;
        if (name === 'ToString' || name === 'toString') return `${type}: ${msg}`;
      }
      if (obj instanceof CStream) return streamMethod(obj, name, args);
      if (obj instanceof COpt) { if (name === 'get' || name === 'getAsInt' || name === 'getAsDouble') { if (obj.v === null) throw E('RuntimeError', 'java.util.NoSuchElementException: No value present'); return obj.v; } if (name === 'orElse') return obj.v === null ? args[0] : obj.v; if (name === 'isPresent') return obj.v !== null; }
      if (obj && obj.__super) {
        const m = findMethod(obj.cls, name, args.length);
        if (!m) throw E('NameError', D.msg.noMember(obj.cls.name, name));
        return callFunc(m, args, obj.thisObj, obj.cls);
      }
      if (obj === null || obj === undefined) throw E('RuntimeError', D.msg.nullRef);
      if (obj instanceof CObj) {
        const m = findMethod(obj.cls, name, args.length, args);
        if (!m) {
          const fv = obj.f.get(name);
          if (fv instanceof CLambda) return callLambda(fv, args);
          if (obj.f.has(name)) throw E('TypeError', D.msg.notFunc(name)); throw E('NameError', D.msg.noMember(obj.cls.name, name));
        }
        checkAccess(obj.cls, name, scope, false, true);
        return callFunc(m, args, obj, m.ownerCls || obj.cls, node.args, scope);
      }
      if (obj.__pair) { if (name === 'getKey') return obj.k; if (name === 'getValue') return obj.v; }
      if (obj instanceof Iter) { if (name === 'base') return obj; }
      if (typeof obj === 'string') return stringMethod(obj, name, args, node, scope);
      if (obj instanceof CList) return listMethod(obj, name, args, node, scope);
      if (obj instanceof CMap) return mapMethod(obj, name, args);
      if (obj instanceof CSB) {
        if (name === 'append' || name === 'Append') { obj.s += str(args[0]); return obj; }
        if (name === 'reverse') { obj.s = [...obj.s].reverse().join(''); return obj; }
        if (name === 'toString' || name === 'ToString') return obj.s;
        if (name === 'length') return obj.s.length;
      }
      if (isNum(obj) || typeof obj === 'boolean') {
        if (name === 'ToString' || name === 'toString') return args.length ? fmtSpec(obj, str(args[0])) : str(obj);
        if (name === 'Equals' || name === 'equals') return eq(obj, args[0]);
        if (name === 'CompareTo' || name === 'compareTo') return cmp(obj, args[0]);
      }
      if (obj instanceof Chr && (name === 'ToString' || name === 'toString')) return obj.c;
      throw E('NameError', D.msg.noMember(tname(obj), name));
    }
    function streamMethod(st, name, a) {
      const f1 = a[0] instanceof CLambda ? fnOf(a[0]) : null;
      switch (name) {
        case 'filter': return new CStream(st.a.filter(x => truthy(f1(x))));
        case 'map': case 'mapToInt': case 'mapToDouble': case 'mapToObj': return new CStream(st.a.map(x => f1(x)));
        case 'sorted': return new CStream(st.a.slice().sort((x, y) => f1 ? nv(fnOf(a[0])(x, y)) : cmp(x, y)));
        case 'distinct': { const out = []; for (const x of st.a) if (!out.some(y => eq(x, y))) out.push(x); return new CStream(out); }
        case 'limit': return new CStream(st.a.slice(0, nv(a[0])));
        case 'skip': return new CStream(st.a.slice(nv(a[0])));
        case 'forEach': st.a.forEach(x => f1(x)); return null;
        case 'count': return st.a.length;
        case 'sum': return mkNum(st.a.reduce((t, x) => t + nv(x), 0), st.a.some(isD));
        case 'average': return new COpt(st.a.length ? new Dbl(st.a.reduce((t, x) => t + nv(x), 0) / st.a.length) : null);
        case 'max': case 'min': { if (!st.a.length) return new COpt(null); const f2 = a[0] instanceof CLambda ? fnOf(a[0]) : null; return new COpt(st.a.reduce((t, x) => { const c = f2 ? nv(f2(x, t)) : cmp(x, t); return (name === 'max' ? c > 0 : c < 0) ? x : t; })); }
        case 'anyMatch': return st.a.some(x => truthy(f1(x)));
        case 'allMatch': return st.a.every(x => truthy(f1(x)));
        case 'noneMatch': return !st.a.some(x => truthy(f1(x)));
        case 'findFirst': return new COpt(st.a.length ? st.a[0] : null);
        case 'reduce': { if (a.length === 2) { let t = a[0]; const f2 = fnOf(a[1]); for (const x of st.a) t = f2(t, x); return t; } const f2 = fnOf(a[0]); if (!st.a.length) return new COpt(null); let t = st.a[0]; for (const x of st.a.slice(1)) t = f2(t, x); return new COpt(t); }
        case 'toList': return new CList('ArrayList', st.a.slice());
        case 'collect': { const c = a[0] || {}; if (c.__collect === 'joining') return st.a.map(x => str(x)).join(c.sep); return new CList('ArrayList', st.a.slice()); }
        case 'boxed': return st;
      }
      throw E('NameError', `cannot find symbol\n  symbol: method ${name} in Stream`);
    }
    function stringMethod(s, name, a, node, scope) {
      const bad = () => { throw E('NameError', D.msg.noMember(tname(s), name)); };
      const idx = (i) => { if (i < 0 || i >= s.length) throw E('RuntimeError', id === 'java' ? `java.lang.StringIndexOutOfBoundsException: index ${i}, length ${s.length}` : id === 'csharp' ? 'System.IndexOutOfRangeException: Index was outside the bounds of the array.' : D.msg.index(i, s.length)); return i; };
      if (id === 'cpp') {
        switch (name) {
          case 'length': case 'size': return s.length;
          case 'empty': return s.length === 0;
          case 'substr': return a.length > 1 ? s.substr(nv(a[0]), nv(a[1])) : s.substr(nv(a[0]));
          case 'find': { const i = s.indexOf(a[0] instanceof Chr ? a[0].c : a[0]); return i; }
          case 'at': return new Chr(s[idx(nv(a[0]))]);
          case 'back': return new Chr(s[s.length - 1]);
          case 'front': return new Chr(s[0]);
          case 'begin': return new Iter(s, 'begin', node.callee.obj);
          case 'end': return new Iter(s, 'end', node.callee.obj);
          case 'rbegin': return new Iter(s, 'rbegin', node.callee.obj);
          case 'rend': return new Iter(s, 'rend', node.callee.obj);
          case 'c_str': return s;
          case 'push_back': assignTo(node.callee.obj, s + str(a[0]), scope); return null;
          case 'append': assignTo(node.callee.obj, s + str(a[0]), scope); return null;
          case 'compare': return s < a[0] ? -1 : s > a[0] ? 1 : 0;
        }
        bad();
      }
      if (id === 'java') {
        switch (name) {
          case 'length': return s.length;
          case 'charAt': return new Chr(s[idx(nv(a[0]))]);
          case 'substring': return a.length > 1 ? s.substring(nv(a[0]), nv(a[1])) : s.substring(nv(a[0]));
          case 'indexOf': return s.indexOf(a[0] instanceof Chr ? a[0].c : a[0]);
          case 'toUpperCase': return s.toUpperCase();
          case 'toLowerCase': return s.toLowerCase();
          case 'equals': return s === str(a[0]);
          case 'equalsIgnoreCase': return s.toLowerCase() === str(a[0]).toLowerCase();
          case 'contains': return s.includes(str(a[0]));
          case 'isEmpty': return s.length === 0;
          case 'trim': return s.trim();
          case 'startsWith': return s.startsWith(a[0]);
          case 'endsWith': return s.endsWith(a[0]);
          case 'replace': return s.split(a[0] instanceof Chr ? a[0].c : a[0]).join(a[1] instanceof Chr ? a[1].c : a[1]);
          case 'split': return new CList('array', s.split(new RegExp(a[0])), 'String');
          case 'toCharArray': return new CList('array', [...s].map(c => new Chr(c)), 'char');
          case 'repeat': return s.repeat(nv(a[0]));
          case 'compareTo': return s < a[0] ? -1 : s > a[0] ? 1 : 0;
          case 'toString': return s;
        }
        bad();
      }
      switch (name) { // C#
        case 'ToUpper': return s.toUpperCase();
        case 'ToLower': return s.toLowerCase();
        case 'Substring': return a.length > 1 ? s.substr(nv(a[0]), nv(a[1])) : s.substr(nv(a[0]));
        case 'IndexOf': return s.indexOf(a[0] instanceof Chr ? a[0].c : a[0]);
        case 'Contains': return s.includes(a[0] instanceof Chr ? a[0].c : a[0]);
        case 'StartsWith': return s.startsWith(a[0]);
        case 'EndsWith': return s.endsWith(a[0]);
        case 'Trim': return s.trim();
        case 'Replace': return s.split(a[0] instanceof Chr ? a[0].c : a[0]).join(a[1] instanceof Chr ? a[1].c : a[1]);
        case 'Split': return new CList('array', s.split(a[0] instanceof Chr ? a[0].c : a[0]), 'string');
        case 'ToCharArray': return new CList('array', [...s].map(c => new Chr(c)), 'char');
        case 'Reverse': return new CList('array', [...s].reverse().map(c => new Chr(c)), 'char');
        case 'Equals': return s === str(a[0]);
        case 'ToString': return s;
        case 'PadLeft': return s.padStart(nv(a[0]));
        case 'PadRight': return s.padEnd(nv(a[0]));
        case 'CompareTo': return s < a[0] ? -1 : s > a[0] ? 1 : 0;
      }
      bad();
    }
    // stacks and queues: C++ stack/queue, C# Stack/Queue, Java Stack/ArrayDeque/LinkedList.
    // The top of a stack is at the end, except in C# and in a Java ArrayDeque/LinkedList, where the top/front is a[0].
    const SQ_NONE = {};
    function sqMethod(l, name, a) {
      const k = l.kind, n = l.a.length, last = l.a[n - 1], first = l.a[0];
      const empty = (what) => { throw E('RuntimeError', id === 'java' ? (k === 'Stack' ? 'java.util.EmptyStackException' : 'java.util.NoSuchElementException') : id === 'csharp' ? `System.InvalidOperationException: ${k} empty.` : `Segmentation fault (${what} on an empty ${k})`); };
      const el = (v) => l.elem ? coerce(v, { name: l.elem === 'Integer' ? 'int' : l.elem === 'Character' ? 'char' : l.elem, args: [] }) : v;
      if (id === 'cpp') {
        switch (name) {
          case 'push': case 'emplace': l.a.push(clone(el(a[0]))); return null;
          case 'pop': if (!n) empty('pop'); if (k === 'stack') l.a.pop(); else l.a.shift(); return null;
          case 'top': if (k !== 'stack') break; if (!n) empty('top'); return last;
          case 'front': if (k !== 'queue') break; if (!n) empty('front'); return first;
          case 'back': if (k !== 'queue') break; if (!n) empty('back'); return last;
          case 'empty': return n === 0;
          case 'size': return n;
        }
        throw E('NameError', D.msg.noMember('std::' + k, name));
      }
      if (id === 'csharp') {
        switch (name) {
          case 'Push': if (k !== 'Stack') break; l.a.unshift(el(a[0])); return null;
          case 'Pop': if (k !== 'Stack') break; if (!n) empty(); return l.a.shift();
          case 'Enqueue': if (k !== 'Queue') break; l.a.push(el(a[0])); return null;
          case 'Dequeue': if (k !== 'Queue') break; if (!n) empty(); return l.a.shift();
          case 'Peek': if (!n) empty(); return first;
          case 'Contains': return l.a.some(x => eq(x, a[0]));
          case 'Clear': l.a.length = 0; return null;
          case 'ToArray': return new CList('array', l.a.slice(), l.elem);
        }
        throw E('NameError', D.msg.noMember(k, name));
      }
      if (k === 'Stack') {   // java.util.Stack (a Vector: the list methods work too)
        switch (name) {
          case 'push': l.a.push(el(a[0])); return a[0];
          case 'pop': if (!n) empty(); return l.a.pop();
          case 'peek': if (!n) empty(); return last;
          case 'empty': case 'isEmpty': return n === 0;
        }
        return SQ_NONE;
      }
      switch (name) {   // Java ArrayDeque / LinkedList used as a Deque or Queue: a[0] is the front
        case 'push': case 'addFirst': l.a.unshift(el(a[0])); return null;
        case 'offerFirst': l.a.unshift(el(a[0])); return true;
        case 'addLast': l.a.push(el(a[0])); return null;
        case 'offer': case 'offerLast': l.a.push(el(a[0])); return true;
        case 'add': if (a.length === 1) { l.a.push(el(a[0])); return true; } break;
        case 'pop': case 'removeFirst': case 'element': case 'getFirst': if (!n) empty(); return name === 'element' || name === 'getFirst' ? first : l.a.shift();
        case 'remove': if (a.length === 0) { if (!n) empty(); return l.a.shift(); } break;
        case 'removeLast': case 'getLast': if (!n) empty(); return name === 'getLast' ? last : l.a.pop();
        case 'poll': case 'pollFirst': return n ? l.a.shift() : null;
        case 'pollLast': return n ? l.a.pop() : null;
        case 'peek': case 'peekFirst': return n ? first : null;
        case 'peekLast': return n ? last : null;
      }
      if (k === 'ArrayDeque' && /^(get|set|indexOf)$/.test(name)) throw E('NameError', D.msg.noMember(k, name));
      return SQ_NONE;
    }
    function listMethod(l, name, a, node) {
      if (/^(stack|queue|Stack|Queue|ArrayDeque|LinkedList)$/.test(l.kind) && (id !== 'cpp' || /^(stack|queue)$/.test(l.kind))) { const r = sqMethod(l, name, a); if (r !== SQ_NONE) return r; }
      const bad = () => { throw E('NameError', D.msg.noMember(tname(l), name)); };
      const chk = (i) => { if (!Number.isInteger(i) || i < 0 || i >= l.a.length) throw E('RuntimeError', D.msg.index(i, l.a.length)); return i; };
      const coerceElem = (v) => l.elem ? coerce(v, { name: l.elem === 'Integer' ? 'int' : l.elem, args: [] }) : v;
      if (id === 'cpp') {
        switch (name) {
          case 'push_back': case 'emplace_back': l.a.push(clone(coerceElem(a[0]))); return null;
          case 'pop_back': if (!l.a.length) throw E('RuntimeError', 'Segmentation fault (pop_back on an empty vector)'); l.a.pop(); return null;
          case 'size': return l.a.length;
          case 'empty': return l.a.length === 0;
          case 'back': if (!l.a.length) throw E('RuntimeError', D.msg.nullRef); return l.a[l.a.length - 1];
          case 'front': if (!l.a.length) throw E('RuntimeError', D.msg.nullRef); return l.a[0];
          case 'at': return l.a[chk(nv(a[0]))];
          case 'clear': l.a.length = 0; return null;
          case 'begin': return new Iter(l, 'begin', node.callee.obj);
          case 'end': return new Iter(l, 'end', node.callee.obj);
          case 'rbegin': return new Iter(l, 'rbegin', node.callee.obj);
          case 'rend': return new Iter(l, 'rend', node.callee.obj);
          case 'erase': { const it = a[0]; const i = it instanceof Iter ? (it.offset || 0) : nv(it); l.a.splice(i, 1); return null; }
          case 'insert': { const it = a[0]; const i = it instanceof Iter ? (it.pos === 'end' ? l.a.length : (it.offset || 0)) : nv(it); l.a.splice(i, 0, a[1]); return null; }
        }
        bad();
      }
      if (id === 'java') {
        if (name === 'stream') return new CStream(l.a.slice());
        if (l.kind === 'array') bad();
        if (name === 'forEach') { const f2 = fnOf(a[0]); l.a.slice().forEach(x => f2(x)); return null; }
        if (name === 'removeIf') { const f2 = fnOf(a[0]); const before = l.a.length; l.a = l.a.filter(x => !truthy(f2(x))); return before !== l.a.length; }
        if (name === 'sort') { const f2 = a[0] instanceof CLambda ? fnOf(a[0]) : null; l.a.sort((x, y) => f2 ? nv(f2(x, y)) : cmp(x, y)); return null; }
        switch (name) {
          case 'add': if (a.length === 2) { l.a.splice(nv(a[0]), 0, a[1]); return true; } l.a.push(a[0]); return true;
          case 'get': return l.a[chk(nv(a[0]))];
          case 'set': { const i = chk(nv(a[0])); const old = l.a[i]; l.a[i] = a[1]; return old; }
          case 'size': return l.a.length;
          case 'isEmpty': return l.a.length === 0;
          case 'remove': {
            if (typeof a[0] === 'number' && l.elem !== 'String') { const i = chk(a[0]); return l.a.splice(i, 1)[0]; }
            const i = l.a.findIndex(x => eq(x, a[0])); if (i >= 0) { l.a.splice(i, 1); return true; } return false;
          }
          case 'contains': return l.a.some(x => eq(x, a[0]));
          case 'indexOf': return l.a.findIndex(x => eq(x, a[0]));
          case 'clear': l.a.length = 0; return null;
          case 'toString': return str(l);
        }
        bad();
      }
      const f1 = a[0] instanceof CLambda ? fnOf(a[0]) : null;
      const key = (x) => f1 ? f1(x) : x;
      const numOf = (x) => nv(key(x));
      const anyD = () => l.a.some(x => key(x) instanceof Dbl);
      switch (name) { // C# LINQ
        case 'Where': return new CList('List', l.a.filter(x => truthy(f1(x))), l.elem);
        case 'Select': return new CList('List', l.a.map(x => f1(x)));
        case 'OrderBy': return new CList('List', l.a.slice().sort((x, y) => cmp(key(x), key(y))), l.elem);
        case 'OrderByDescending': return new CList('List', l.a.slice().sort((x, y) => cmp(key(y), key(x))), l.elem);
        case 'Any': return f1 ? l.a.some(x => truthy(f1(x))) : l.a.length > 0;
        case 'All': return l.a.every(x => truthy(f1(x)));
        case 'Count': return f1 ? l.a.filter(x => truthy(f1(x))).length : l.a.length;
        case 'First': { const r = f1 ? l.a.find(x => truthy(f1(x))) : l.a[0]; if (r === undefined) throw E('RuntimeError', 'System.InvalidOperationException: Sequence contains no matching element'); return r; }
        case 'FirstOrDefault': { const r = f1 ? l.a.find(x => truthy(f1(x))) : l.a[0]; return r === undefined ? (l.elem === 'int' ? 0 : null) : r; }
        case 'Last': { const r = f1 ? l.a.filter(x => truthy(f1(x))).pop() : l.a[l.a.length - 1]; if (r === undefined) throw E('RuntimeError', 'System.InvalidOperationException: Sequence contains no elements'); return r; }
        case 'Sum': return mkNum(l.a.reduce((t, x) => t + numOf(x), 0), anyD());
        case 'Average': if (!l.a.length) throw E('RuntimeError', 'System.InvalidOperationException: Sequence contains no elements'); return new Dbl(l.a.reduce((t, x) => t + numOf(x), 0) / l.a.length);
        case 'Max': if (f1) return l.a.map(key).reduce((t, x) => (cmp(x, t) > 0 ? x : t)); break;
        case 'Min': if (f1) return l.a.map(key).reduce((t, x) => (cmp(x, t) < 0 ? x : t)); break;
        case 'Distinct': { const out = []; for (const x of l.a) if (!out.some(y => eq(x, y))) out.push(x); return new CList('List', out, l.elem); }
        case 'Take': return new CList('List', l.a.slice(0, nv(a[0])), l.elem);
        case 'Skip': return new CList('List', l.a.slice(nv(a[0])), l.elem);
        case 'ForEach': l.a.slice().forEach(x => f1(x)); return null;
        case 'RemoveAll': { const before = l.a.length; l.a = l.a.filter(x => !truthy(f1(x))); return before - l.a.length; }
        case 'Find': { const r = l.a.find(x => truthy(f1(x))); return r === undefined ? (l.elem === 'int' ? 0 : null) : r; }
        case 'FindAll': return new CList('List', l.a.filter(x => truthy(f1(x))), l.elem);
        case 'Exists': return l.a.some(x => truthy(f1(x)));
        case 'Aggregate': { let t = a.length > 1 ? a[0] : l.a[0]; const f2 = fnOf(a.length > 1 ? a[1] : a[0]); for (const x of (a.length > 1 ? l.a : l.a.slice(1))) t = f2(t, x); return t; }
      }
      if (name === 'Sort' && a[0] instanceof CLambda) { const f2 = fnOf(a[0]); l.a.sort((x, y) => nv(f2(x, y))); return null; }
      switch (name) { // C#
        case 'Add': if (l.kind === 'array') bad(); l.a.push(coerceElem(a[0])); return null;
        case 'Insert': l.a.splice(nv(a[0]), 0, a[1]); return null;
        case 'Remove': { const i = l.a.findIndex(x => eq(x, a[0])); if (i >= 0) { l.a.splice(i, 1); return true; } return false; }
        case 'RemoveAt': l.a.splice(chk(nv(a[0])), 1); return null;
        case 'Contains': return l.a.some(x => eq(x, a[0]));
        case 'IndexOf': return l.a.findIndex(x => eq(x, a[0]));
        case 'Clear': l.a.length = 0; return null;
        case 'ToArray': return new CList('array', l.a.slice(), l.elem);
        case 'ToList': return new CList('List', l.a.slice(), l.elem);
        case 'Reverse': if (l.kind === 'array') return new CList('array', l.a.slice().reverse(), l.elem); l.a.reverse(); return null;
        case 'Sort': l.a.sort((x, y) => cmp(x, y)); return null;
        case 'Sum': return l.a.reduce((t, x) => t + nv(x), 0);
        case 'Max': return l.a.reduce((t, x) => (cmp(x, t) > 0 ? x : t));
        case 'Min': return l.a.reduce((t, x) => (cmp(x, t) < 0 ? x : t));
      }
      bad();
    }
    function mapMethod(m, name, a) {
      const bad = () => { throw E('NameError', D.msg.noMember(tname(m), name)); };
      const k = a.length ? keyOf(a[0], m) : null;
      if (id === 'cpp') {
        switch (name) {
          case 'at': if (!m.m.has(k)) throw E('RuntimeError', D.msg.keyMissing(k)); return m.m.get(k);
          case 'count': return m.m.has(k) ? 1 : 0;
          case 'size': return m.m.size;
          case 'empty': return m.m.size === 0;
          case 'erase': m.m.delete(k); return null;
          case 'find': return m.m.has(k) ? { __found: true } : { __mapend: true };
          case 'end': return { __mapend: true };
          case 'insert': return null;
        }
        bad();
      }
      if (id === 'java') {
        switch (name) {
          case 'put': m.m.set(k, a[1]); return null;
          case 'get': return m.m.has(k) ? m.m.get(k) : null;
          case 'getOrDefault': return m.m.has(k) ? m.m.get(k) : a[1];
          case 'containsKey': return m.m.has(k);
          case 'size': return m.m.size;
          case 'remove': m.m.delete(k); return null;
          case 'keySet': return new CList('ArrayList', [...m.m.keys()].map(kk => outKey(m, kk)));
          case 'values': return new CList('ArrayList', [...m.m.values()]);
          case 'entrySet': return { __keys: [...m.m.entries()].map(([kk, v]) => ({ __pair: true, k: outKey(m, kk), v })) };
          case 'forEach': { const f2 = fnOf(a[0]); for (const [kk, v] of [...m.m.entries()]) f2(kk, v); return null; }
          case 'merge': { const f2 = fnOf(a[2]); m.m.set(k, m.m.has(k) ? f2(m.m.get(k), a[1]) : a[1]); return null; }
          case 'putIfAbsent': if (!m.m.has(k)) m.m.set(k, a[1]); return null;
          case 'isEmpty': return m.m.size === 0;
        }
        bad();
      }
      switch (name) {
        case 'Add': if (m.m.has(k)) throw E('RuntimeError', 'System.ArgumentException: An item with the same key has already been added.'); m.m.set(k, a[1]); return null;
        case 'ContainsKey': return m.m.has(k);
        case 'Remove': return m.m.delete(k);
        case 'GetValueOrDefault': return m.m.has(k) ? m.m.get(k) : (a.length > 1 ? a[1] : 0);
      }
      bad();
    }

    // ---------------- expressions
    function assignTo(target, v, scope) {
      if (target.type === 'Name') { setName(target.id, v, scope); return; }
      if (target.type === 'Member') {
        const obj = evalExpr(target.obj, scope);
        if (obj instanceof CObj) {
          checkAccess(obj.cls, target.name, scope, true);
          const pr = findProp(obj.cls, target.name);
          if (pr) { propSet(obj, pr, v); return; }
          if (!obj.f.has(target.name)) throw E('NameError', D.msg.noMember(obj.cls.name, target.name));
          const fd = findFieldDecl(obj.cls, target.name);
          obj.f.set(target.name, coerce(v, fd ? fd.ty : null, target.name)); return;
        }
        if (obj && obj.__class) { const sf = staticField(obj.cls, target.name); if (sf) { sf.v = coerce(v, sf.ty); return; } }
        throw E('TypeError', D.msg.lvalue);
      }
      if (target.type === 'Index') {
        const obj = evalExpr(target.obj, scope);
        const i = evalExpr(target.index, scope);
        if (obj instanceof CList) {
          const n = nv(i);
          if (!Number.isInteger(n) || n < 0 || n >= obj.a.length) throw E('RuntimeError', id === 'csharp' && obj.kind === 'array' ? 'System.IndexOutOfRangeException: Index was outside the bounds of the array.' : D.msg.index(n, obj.a.length));
          obj.a[n] = obj.elem ? coerce(v, { name: obj.elem === 'Integer' ? 'int' : obj.elem, args: [] }) : v; return;
        }
        if (obj instanceof CMap) { obj.m.set(keyOf(i, obj), v); return; }
        if (typeof obj === 'string') {
          if (id !== 'cpp') throw E('TypeError', id === 'java' ? 'array required, but String found' : "Property or indexer 'string.this[int]' cannot be assigned to -- it is read only");
          const n = nv(i);
          if (n < 0 || n >= obj.length) throw E('RuntimeError', D.msg.index(n, obj.length));
          assignTo(target.obj, obj.slice(0, n) + (v instanceof Chr ? v.c : String.fromCharCode(nv(v))) + obj.slice(n + 1), scope); return;
        }
        throw E('TypeError', id === 'java' ? `array required, but ${tname(obj)} found` : `cannot index into ${tname(obj)}`);
      }
      throw E('SyntaxError', D.msg.lvalue);
    }
    function arith(op, a, b) {
      if (op === '+' && (typeof a === 'string' || typeof b === 'string' || a instanceof CSB)) {
        if (id === 'cpp') {
          const ok = (x) => typeof x === 'string' || x instanceof Chr;
          if (ok(a) && ok(b)) return (a instanceof Chr ? a.c : a) + (b instanceof Chr ? b.c : b);
          throw E('TypeError', D.msg.operands('+', tname(a), tname(b)) + ' — use to_string(...) to turn a number into text');
        }
        return str(a) + str(b);
      }
      if (!isNum(a) || !isNum(b)) {
        if (typeof a === 'boolean' && id === 'cpp' && isNum(b)) a = a ? 1 : 0; else if (typeof b === 'boolean' && id === 'cpp' && isNum(a)) b = b ? 1 : 0;
        else throw E('TypeError', D.msg.operands(op, tname(a), tname(b)));
      }
      const dbl = isD(a) || isD(b);
      const x = nv(a), y = nv(b);
      switch (op) {
        case '+': return mkNum(x + y, dbl);
        case '-': return mkNum(x - y, dbl);
        case '*': return mkNum(x * y, dbl);
        case '/':
          if (!dbl) { if (y === 0) throw E('RuntimeError', D.msg.divZero); return Math.trunc(x / y); }
          return new Dbl(x / y);
        case '%':
          if (!dbl) { if (y === 0) throw E('RuntimeError', D.msg.divZero); return x % y; }
          if (id === 'cpp') throw E('TypeError', D.msg.operands('%', 'double', 'double'));
          return new Dbl(x % y);
        case '<<': return x << y;
        case '>>': return x >> y;
        case '&': return x & y;
        case '|': return x | y;
        case '^': return x ^ y;
      }
      throw E('TypeError', D.msg.operands(op, tname(a), tname(b)));
    }
    function compare(op, a, b) {
      if ((op === '==' || op === '!=') && a instanceof Iter && b instanceof Iter) { const r = iterIndex(a) === iterIndex(b); return op === '==' ? r : !r; }
      if (op === '==' || op === '!=') {
        let r;
        if (a && a.__mapend !== undefined || b && b.__mapend !== undefined) r = !!(a && a.__mapend) === !!(b && b.__mapend);
        else r = eq(a, b);
        return op === '==' ? r : !r;
      }
      if (isNum(a) && isNum(b)) { const x = nv(a), y = nv(b); return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y; }
      if (typeof a === 'string' && typeof b === 'string' && id === 'cpp') return op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b : a >= b;
      throw E('TypeError', D.msg.operands(op, tname(a), tname(b)));
    }
    function evalExpr(e, scope) {
      switch (e.type) {
        case 'Num': return e.isFloat ? new Dbl(e.value) : e.value;
        case 'Str': return e.value;
        case 'Char': return new Chr(e.value);
        case 'Bool': return e.value;
        case 'Null': return null;
        case 'Interp': return e.parts.map(p => p.type === 'Fmt' ? fmtSpec(evalExpr(p.value, scope), p.fmt) : p.value).join('');
        case 'Name': return lookup(e.id, scope, e.line);
        case 'Lambda': return new CLambda(e, id === 'cpp' && e.captures ? cppCaptureScope(e, scope) : scope, findThis(scope));
        case 'MethodRef': return new CLambda({ ref: true, params: [], target: evalExpr(e.obj, scope), name: e.name, line: e.line }, scope, findThis(scope));
        case 'Deref': {
          const v = evalExpr(e.operand, scope);
          if (v instanceof Iter) { const items = iterItems(v.target); const i = iterIndex(v); if (i < 0 || i >= items.length) throw E('RuntimeError', 'Segmentation fault (dereferenced end())'); return items[i]; }
          return v;
        }
        case 'This': { const t = findThis(scope); if (!t) throw E('SyntaxError', id === 'java' ? 'non-static variable this cannot be referenced from a static context' : "invalid use of 'this'"); return t; }
        case 'Super': { const t = findThis(scope); const c = findCls(scope); return { __super: true, thisObj: t, cls: c && c.base }; }
        case 'Seq': { let v; for (const x of e.items) v = evalExpr(x, scope); return v; }
        case 'InitList': return new CList(id === 'cpp' ? 'vector' : 'array', e.items.map(x => evalExpr(x, scope)));
        case 'Assign': {
          let v = evalExpr(e.value, scope);
          if (e.op !== '=') {
            const cur = evalExpr(e.target, scope);
            const op = e.op.slice(0, -1);
            v = arith(op, cur, v);
            // compound assignment converts back to the variable's type (e.g. int += double in Java/C#)
            if (typeof cur === 'number' && v instanceof Dbl) v = Math.trunc(v.v);
          } else v = clone(v);
          assignTo(e.target, v, scope);
          return v;
        }
        case 'IncDec': {
          const cur = evalExpr(e.target, scope);
          if (!isNum(cur)) throw E('TypeError', D.msg.operands(e.op, tname(cur), 'int'));
          let nvv = nv(cur) + (e.op === '++' ? 1 : -1);
          const newV = cur instanceof Dbl ? new Dbl(nvv) : cur instanceof Chr ? new Chr(String.fromCharCode(nvv)) : nvv;
          assignTo(e.target, newV, scope);
          return e.prefix ? newV : cur;
        }
        case 'Cond': return truthy(evalExpr(e.test, scope)) ? evalExpr(e.a, scope) : evalExpr(e.b, scope);
        case 'Unary': {
          const v = evalExpr(e.operand, scope);
          if (e.op === '!') return !truthy(v);
          if (!isNum(v)) throw E('TypeError', D.msg.operands(e.op, tname(v), ''));
          if (e.op === '-') return v instanceof Dbl ? new Dbl(-v.v) : -nv(v);
          if (e.op === '~') return ~nv(v);
          return v;
        }
        case 'Cast': {
          const v = evalExpr(e.value, scope);
          const t = e.to;
          if (INT_T.has(t)) { if (typeof v === 'string') throw E('TypeError', D.msg.convert(tname(v), t)); return Math.trunc(nv(v)); }
          if (DBL_T.has(t)) return new Dbl(nv(v));
          if (t === 'char') return new Chr(String.fromCharCode(nv(v)));
          if (STR_T.has(t)) return str(v);
          if (BOOL_T.has(t)) return truthy(v);
          return v;
        }
        case 'InstanceOf': { const v = evalExpr(e.value, scope); if (id === 'csharp' && v instanceof CExc) return catches(e.cls, v); if (!(v instanceof CObj)) return false; if (id === 'java') return javaIsSub(v.cls, e.cls); let c = v.cls; while (c) { if (c.name === e.cls || (id === 'csharp' && c.baseName === e.cls)) return true; c = c.base; } return false; }
        case 'Bin': {
          if (e.op === '&&') return truthy(evalExpr(e.left, scope)) ? truthy(evalExpr(e.right, scope)) : false;
          if (e.op === '||') return truthy(evalExpr(e.left, scope)) ? true : truthy(evalExpr(e.right, scope));
          if (e.op === '??') { const l = evalExpr(e.left, scope); return l === null ? evalExpr(e.right, scope) : l; }
          if (id === 'cpp' && e.op === '+' && e.left.type === 'Str' && e.right.type === 'Str') {
            curLine = e.line;
            throw E('TypeError', `invalid operands of types 'const char[${e.left.value.length + 1}]' and 'const char[${e.right.value.length + 1}]' to binary 'operator+' — wrap the first one in string(...) to glue them`);
          }
          const a = evalExpr(e.left, scope);
          if (e.op === '<<' && a && a.__stream) {
            // cout << x << y ...
            const b = evalExpr(e.right, scope);
            if (b === ENDL) write('\n');
            else if (b === BOOLALPHA) boolalpha = true;
            else write(str(b));
            return a;
          }
          if (e.op === '>>' && a && a.__stream) throw E('RuntimeError', 'reading input is not available here — use the variables you collected!');
          const b = evalExpr(e.right, scope);
          curLine = e.line;
          if (['==', '!=', '<', '>', '<=', '>='].includes(e.op)) return compare(e.op, a, b);
          if (e.op === '+' && a instanceof Iter && typeof b === 'number') { const it = new Iter(a.target, a.pos, a.expr); it.offset = (a.offset || 0) + b; return it; }
          if (e.op === '-' && a instanceof Iter && b instanceof Iter && id === 'cpp') return iterIndex(a) - iterIndex(b);   // it - v.begin(): the position
          if ((e.op === '&' || e.op === '|' || e.op === '^') && typeof a === 'boolean') { return e.op === '&' ? a && b : e.op === '|' ? a || b : a !== b; }
          return arith(e.op, a, b);
        }
        case 'Member': {
          let obj = evalExpr(e.obj, scope);
          if (id === 'cpp' && obj instanceof Iter && e.name !== 'base') obj = evalExpr({ type: 'Deref', operand: e.obj, line: e.line }, scope);   // it->name
          const v = member(obj, e.name, e.line, e, scope);
          if (v && v.__bound && !(obj && (obj.__sysout))) {
            // property-like access to a method without call: e.g. list.size (Java) -> error
            if (obj instanceof CObj || obj instanceof CList || obj instanceof CMap || typeof obj === 'string') {
              if (typeof obj === 'string' && id === 'java' && e.name === 'length') throw E('NameError', 'cannot find symbol\n  symbol: variable length — for a String use length()');
              if (obj instanceof CList && id === 'java' && e.name === 'length') throw E('NameError', 'cannot find symbol\n  symbol: variable length — for an ArrayList use size()');
              if (obj instanceof CList && id === 'cpp' && (e.name === 'length' || e.name === 'size')) throw E('TypeError', `invalid use of member function 'size' (did you forget the () ?)`);
              if (typeof obj === 'string' && id === 'cpp' && (e.name === 'length' || e.name === 'size')) throw E('TypeError', `invalid use of member function '${e.name}' (did you forget the () ?)`);
              if (id === 'csharp' && (e.name === 'Length' || e.name === 'Count')) throw E('NameError', D.msg.noMember(tname(obj), e.name));
            }
            if (obj instanceof CObj) throw E('TypeError', id === 'csharp' ? `'${e.name}' is a method — call it with ()` : `invalid use of method '${e.name}' (did you forget the () ?)`);
            throw E('NameError', D.msg.noMember(tname(obj), e.name));
          }
          return v;
        }
        case 'Index': {
          const obj = evalExpr(e.obj, scope);
          const i = evalExpr(e.index, scope);
          curLine = e.line;
          if (obj instanceof CList) {
            if (id === 'java' && obj.kind !== 'array') throw E('TypeError', `array required, but ${obj.kind} found — use .get(${str(i)})`);
            const n = nv(i);
            if (!Number.isInteger(n) || n < 0 || n >= obj.a.length) {
              if (id === 'cpp') return defaultFor({ name: obj.elem || 'int', args: [] });
              throw E('RuntimeError', id === 'java' ? `java.lang.ArrayIndexOutOfBoundsException: Index ${n} out of bounds for length ${obj.a.length}` : id === 'csharp' ? (obj.kind === 'array' ? 'System.IndexOutOfRangeException: Index was outside the bounds of the array.' : 'System.ArgumentOutOfRangeException: Index was out of range.') : D.msg.index(n, obj.a.length));
            }
            return obj.a[n];
          }
          if (obj instanceof CMap) {
            const k = keyOf(i, obj);
            if (id === 'java') throw E('TypeError', 'array required, but HashMap found — use .get(key)');
            if (!obj.m.has(k)) { if (id === 'csharp') throw E('RuntimeError', D.msg.keyMissing(k)); obj.m.set(k, obj.vty ? defaultFor(obj.vty) : 0); }
            return obj.m.get(k);
          }
          if (typeof obj === 'string') {
            if (id === 'java') throw E('TypeError', 'array required, but String found — use .charAt(i)');
            const n = nv(i);
            if (n < 0 || n >= obj.length) { if (id === 'cpp') return new Chr('\0'); throw E('RuntimeError', 'System.IndexOutOfRangeException: Index was outside the bounds of the array.'); }
            return new Chr(obj[n]);
          }
          throw E('TypeError', `cannot index into ${tname(obj)}`);
        }
        case 'New': {
          const t = e.ty.name;
          const args = e.args.map(a => evalExpr(a, scope));
          if (classes.has(t)) {
            const kc = classes.get(t);
            if (kc.isIface || ((id === 'csharp' || id === 'java') && kc.decl && kc.decl.isAbstract)) throw E('TypeError', id === 'java' ? `${t} is abstract; cannot be instantiated` : `Cannot create an instance of the abstract type or interface '${t}'`);
            return construct(kc, args, e.line);
          }
          if ((id === 'csharp' && /^(Stack|Queue)$/.test(t)) || (id === 'java' && /^(Stack|ArrayDeque)$/.test(t))) {   // stacks and queues (see sqMethod)
            const src = args[0] instanceof CList ? args[0].a.slice() : [];
            return new CList(t, id === 'csharp' && t === 'Stack' ? src.reverse() : src, e.ty.args[0] && !e.ty.args[0].arr && e.ty.args[0].name);   // Queue<int[]> holds arrays, not ints
          }
          if (/^(ArrayList|List|LinkedList|Vector)$/.test(t)) {
            const l = new CList(id === 'java' ? (t === 'LinkedList' ? 'LinkedList' : 'ArrayList') : 'List', args[0] instanceof CList ? args[0].a.slice() : [], e.ty.args[0] && !e.ty.args[0].arr && e.ty.args[0].name);
            if (e.init) l.a = e.init.items.map(x => evalExpr(x, scope));
            return l;
          }
          if (/^(HashMap|Dictionary|TreeMap|LinkedHashMap)$/.test(t)) {
            const m = new CMap(id === 'java' ? 'HashMap' : 'Dictionary');
            if (e.init) for (const it of e.init.items) { if (it.type === 'InitList') m.m.set(keyOf(evalExpr(it.items[0], scope)), evalExpr(it.items[1], scope)); }
            return m;
          }
          if (t === 'StringBuilder') return new CSB(args.length ? str(args[0]) : '');
          if (EXC_NAMES.test(t)) return new CExc(t, args.length ? str(args[0]) : '');
          if (t === 'string' || t === 'String') {
            if (args[0] instanceof CList) return args[0].a.map(x => str(x)).join('');
            if (args.length === 2 && args[0] instanceof Chr) return args[0].c.repeat(nv(args[1]));
            return args.length ? str(args[0]) : '';
          }
          if (t === 'Random') return { __random: true };
          if (t === 'Scanner') throw E('RuntimeError', 'reading input is not available here — use the variables you collected!');
          throw E('NameError', id === 'java' ? `cannot find symbol\n  symbol: class ${t}` : id === 'csharp' ? `The type or namespace name '${t}' could not be found` : `'${t}' does not name a type`);
        }
        case 'NewArray': {
          if (e.init) return new CList('array', e.init.items.map(x => coerce(evalExpr(x, scope), e.elem.name === 'var' ? null : { name: e.elem.name, args: [] })), e.elem.name);
          const n = nv(evalExpr(e.size, scope));
          if (n < 0) throw E('RuntimeError', id === 'java' ? 'java.lang.NegativeArraySizeException' : 'System.OverflowException');
          const inner = (e.sizes || []).map(x => nv(evalExpr(x, scope)));
          const jagged = e.dims > 1 + inner.length;   // new char[rows][] leaves the rows empty (null)
          const mk = (len, i) => new CList('array', Array.from({ length: len }, () => i < inner.length ? mk(inner[i], i + 1) : jagged ? null : defaultFor({ name: e.elem.name, args: [] })), i < inner.length || jagged ? null : e.elem.name);
          return mk(n, 0);
        }
        case 'Construct': {
          if (e.init) return evalInit(e.init, e.ty, scope);
          return evalCtorDecl(e.ty, e.args, scope);
        }
        case 'Call': return evalCall(e, scope);
      }
      throw E('SyntaxError', `unsupported expression ${e.type}`);
    }
    function evalCall(e, scope) {
      const c = e.callee;
      curLine = e.line;
      if (c.type === 'Name') {
        const name = c.id;
        const args = () => e.args.map(a => evalExpr(a, scope));
        // local variable holding something callable? (not supported) -> methods of this class -> global functions -> API -> builtins
        const lamCell = scope.find(name);
        if (lamCell && lamCell.v instanceof CLambda) { const av = args(); curLine = e.line; return callLambda(lamCell.v, av); }
        const thisObj = findThis(scope);
        const cls = findCls(scope);
        if (cls) {
          // virtual dispatch: the object's real class first, then the class we're in
          const m = (id === 'cpp' && thisObj && findMethod(cls, name, e.args.length) && !cppIsVirtual(cls, name) ? findMethod(cls, name, e.args.length) : null) || (thisObj && findMethod(thisObj.cls, name, e.args.length)) || findMethod(cls, name, e.args.length);
          if (m) { const av = args(); curLine = e.line; return callFunc(m, av, m.isStatic ? null : thisObj, m.ownerCls || cls, e.args, scope); }
        }
        if (funcs.has(name)) {
          const list = funcs.get(name);
          const f = pickOverload(list, e.args, scope);
          const av = args(); curLine = e.line;
          return callFunc(f, av, null, null, e.args, scope);
        }
        if (EXC_NAMES.test(name) && id === 'cpp') { const av = args(); return new CExc(name, av.length ? str(av[0]) : ''); }
        if (apiNames[name]) { const av = args(); curLine = e.line; return apiCall(apiNames[name], av); }
        if (classes.has(name) && id === 'cpp') return construct(classes.get(name), args(), e.line);
        if (id === 'cpp' && (STR_T.has(name) || name === 'int' || name === 'double' || name === 'char')) { const av = args(); return name === 'string' ? (av.length === 0 ? '' : av.length === 2 && av[0] instanceof Iter ? iterRangeString(av[0], av[1]) : av.length === 2 && av[1] instanceof Chr ? av[1].c.repeat(nv(av[0])) : str(av[0])) : evalExpr({ type: 'Cast', to: name, value: e.args[0], line: e.line }, scope); }
        const av = args();
        const r = callBuiltinFn(name, av, e, scope);
        if (r !== undefined) return r;
        if (scope.find(name) || (thisObj && thisObj.f.has(name))) throw E('TypeError', D.msg.notFunc(name));
        throw E('NameError', id === 'java' ? `cannot find symbol\n  symbol: method ${name}` : id === 'csharp' ? `The name '${name}' does not exist in the current context` : `'${name}' was not declared in this scope`);
      }
      if (c.type === 'Member') {
        let obj = evalExpr(c.obj, scope);
        if (id === 'cpp' && obj instanceof Iter && c.name !== 'base') obj = evalExpr({ type: 'Deref', operand: c.obj, line: e.line }, scope);   // it->method()
        const args = e.args.map(a => evalExpr(a, scope));
        curLine = e.line;
        if (obj && obj.__super) return callMember(obj, c.name, args, e, scope);
        if (id === 'cpp' && c.obj.type === 'Name' && obj instanceof CObj) {   // a non-virtual method called through a base-class reference/pointer runs the base version
          const cell = scope.find(c.obj.id);
          const sm = cppStaticMethod(obj, cell && cell.ty, c.name, args);
          if (sm) { checkAccess(classes.get(cell.ty.name), c.name, scope, false); return callFunc(sm, args, obj, sm.ownerCls || obj.cls, e.args, scope); }
        }
        return callMember(obj, c.name, args, e, scope);
      }
      if (c.type === 'Super') { return null; }
      throw E('TypeError', 'that cannot be called like a function');
    }

    // ---------------- Java compile-time checks: abstract methods must be implemented, and checked
    // exceptions (Exception and its subclasses that are not RuntimeExceptions) must be caught or declared with `throws`
    function javaChecked(name) {
      let n = name;
      for (let i = 0; n && classes.has(n) && i < 50; i++) n = classes.get(n).baseName;
      return !!n && /^(Exception|Throwable|IOException|FileNotFoundException|InterruptedException|CloneNotSupportedException|TimeoutException)$/.test(n);
    }
    // does class `cls` extend or implement the type called `name`? (follows the declared extends / implements)
    function javaIsSub(cls, name) {
      const seen = [];
      const visit = (c) => {
        if (!c || seen.includes(c)) return false;
        seen.push(c);
        return c.name === name || c.baseName === name || (c.ifaces || []).includes(name) || visit(classes.get(c.baseName)) || (c.ifaces || []).some(n => visit(classes.get(n)));
      };
      return visit(cls);
    }
    function javaIsA(name, sup) {
      if (sup === 'Exception' || sup === 'Throwable') return true;
      let n = name;
      for (let i = 0; n && i < 50; i++) { if (n === sup) return true; n = classes.has(n) ? classes.get(n).baseName : null; }
      return false;
    }
    function checkJava() {
      const sig = (m) => `${m.name}(${m.params.map(q => q.ty ? q.ty.name : '').join(', ')})`;
      for (const cls of classes.values()) {
        // @Override must really override (or implement) something
        const sups = [];
        const up = (c) => { if (!c || sups.includes(c)) return; sups.push(c); if (c.baseName) up(classes.get(c.baseName)); (c.ifaces || []).forEach(n => up(classes.get(n))); };
        if (cls.baseName) up(classes.get(cls.baseName)); (cls.ifaces || []).forEach(n => up(classes.get(n)));
        const extendsLib = (cls.baseName && !classes.has(cls.baseName)) || sups.some(c => c.baseName && !classes.has(c.baseName));
        for (const list of cls.methods.values()) for (const m of list) {
          // an overriding / implementing method can't be less visible than the one it replaces
          if (!cls.isIface && !m.declPublic && !m.isStatic) {
            const weaker = (what, where) => new CError('TypeError', `${sig(m)} in ${cls.name} cannot ${what} ${where}; attempting to assign weaker access privileges; was public — add the word public in front of it`, m.line);
            if ((/^(toString|hashCode)$/.test(m.name) && !m.params.length) || (m.name === 'equals' && m.params.length === 1)) throw weaker('override', `${m.name}() in Object`);
            for (const c of sups) { const x = (c.methods.get(m.name) || []).find(y => y.params.length === m.params.length && y.declPublic); if (x) throw weaker(c.isIface ? 'implement' : 'override', `${sig(x)} in ${c.name}`); }
          }
          if (!m.override || extendsLib || /^(toString|equals|hashCode|compareTo|compare|run|apply|accept|test|get|getMessage)$/.test(m.name)) continue;
          if (!sups.some(c => (c.methods.get(m.name) || []).some(x => x.params.length === m.params.length)))
            throw new CError('TypeError', `method does not override or implement a method from a supertype: ${sig(m)} in ${cls.name}`, m.line);
        }
      }
      for (const cls of classes.values()) {
        if (cls.isIface || cls.decl.isAbstract) continue;
        // the declared supertypes (not cls.base: interfaces are spliced into that chain and it can be shared)
        const chain = [];
        const visit = (c) => { if (!c || chain.includes(c)) return; chain.push(c); if (c.baseName) visit(classes.get(c.baseName)); (c.ifaces || []).forEach(n => visit(classes.get(n))); };
        visit(cls);
        const hasBody = (n, k) => chain.some(c => (c.methods.get(n) || []).some(m => m.body && m.params.length === k));
        for (const c of chain) {
          if (c === cls || !(c.isIface || c.decl.isAbstract)) continue;
          for (const list of c.methods.values()) for (const m of list) if (!m.body && m.abstract && !hasBody(m.name, m.params.length))
            throw new CError('TypeError', `${cls.name} is not abstract and does not override abstract method ${sig(m)} in ${c.name}`, cls.decl.line);
        }
      }
      const named = (n, k) => { const r = []; for (const c of classes.values()) for (const m of c.methods.get(n) || []) if (m.params.length === k) r.push(m); return r; };
      const ctorThrows = (cn, k) => { const c = classes.get(cn); const cs = c ? c.ctors.filter(x => x.params.length === k) : []; return cs.length === 1 ? cs[0].throws || [] : []; };
      const report = (t, line, handled) => {
        if (javaChecked(t) && !handled.some(h => javaIsA(t, h))) throw new CError('TypeError', `unreported exception ${t}; must be caught or declared to be thrown`, line);
      };
      function walk(node, handled) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { for (const x of node) walk(x, handled); return; }
        if (node.type === 'Lambda' || node.type === 'Class') return;
        if (node.type === 'Try') {
          walk(node.body, handled.concat(node.handlers.flatMap(h => h.ctypes || [h.ctype || 'Throwable'])));
          for (const h of node.handlers) walk(h.body, handled);
          walk(node.fin, handled);
          return;
        }
        if (node.type === 'Throw' && node.value && node.value.type === 'New') report(node.value.ty.name, node.line, handled);
        if (node.type === 'New' && node.ty) for (const t of ctorThrows(node.ty.name, node.args.length)) report(t, node.line, handled);
        if (node.type === 'Call' && node.callee && (node.callee.type === 'Name' || node.callee.type === 'Member')) {
          const cands = named(node.callee.type === 'Name' ? node.callee.id : node.callee.name, node.args.length);
          if (cands.length) for (const t of cands[0].throws || []) if (cands.every(m => (m.throws || []).includes(t))) report(t, node.line, handled);
        }
        for (const k of Object.keys(node)) if (k !== 'ty' && k !== 'ownerCls' && k !== 'decl') walk(node[k], handled);
      }
      for (const cls of classes.values()) {
        for (const list of cls.methods.values()) for (const m of list) if (m.body) walk(m.body, m.throws || []);
        for (const ct of cls.ctors || []) walk(ct.body, ct.throws || []);
      }
    }

    // ---------------- static checks (like a compiler would do before running anything)
    function checkNames(prog) {
      const known = new Set(Object.keys(opts.globals || {}).concat(Object.keys(apiNames)));
      for (const k of classes.keys()) known.add(k);
      for (const k of funcs.keys()) known.add(k);
      const BUILTIN = new Set(['std', 'cout', 'cerr', 'cin', 'endl', 'boolalpha', 'string', 'vector', 'map', 'unordered_map', 'to_string', 'stoi', 'stod', 'toupper', 'tolower', 'isdigit', 'isalpha', 'max', 'min', 'abs', 'pow', 'sqrt', 'floor', 'ceil', 'round', 'swap', 'reverse', 'sort', 'printf', 'getline', 'npos', 'int', 'double', 'char',
        'System', 'Console', 'Math', 'String', 'Integer', 'Double', 'Arrays', 'Collections', 'Character', 'Convert', 'List', 'Array', 'Boolean', 'Objects', 'Thread', 'args', 'StringBuilder', 'ArrayList', 'HashMap', 'Dictionary', 'Random',
        'for_each', 'count_if', 'count', 'any_of', 'all_of', 'none_of', 'accumulate', 'find', 'find_if', 'max_element', 'min_element', 'transform', 'distance', 'Collectors',
        'runtime_error', 'logic_error', 'invalid_argument', 'out_of_range', 'exception', 'length_error', 'domain_error', 'range_error', 'overflow_error']);
      const scopes = [new Set()];
      const has = (n) => known.has(n) || BUILTIN.has(n) || scopes.some(s => s.has(n));
      const decl = (n) => scopes[scopes.length - 1].add(n);
      let clsFields = null;
      const push = () => scopes.push(new Set()), pop = () => scopes.pop();
      function walkStmts(list) { for (const s of list) walkStmt(s); }
      function walkStmt(s) {
        if (!s) return;
        switch (s.type) {
          case 'Block': push(); walkStmts(s.body); pop(); return;
          case 'Decl': for (const v of s.vars) { if (v.init) walkExpr(v.init); if (v.ctorArgs) v.ctorArgs.forEach(walkExpr); if (v.size) walkExpr(v.size); decl(v.name); } return;
          case 'ExprStmt': walkExpr(s.expr); return;
          case 'If': walkExpr(s.test); push(); walkStmt(s.body); pop(); push(); walkStmt(s.orelse); pop(); return;
          case 'While': case 'DoWhile': walkExpr(s.test); push(); walkStmt(s.body); pop(); return;
          case 'For': push(); walkStmt(s.init); if (s.test) walkExpr(s.test); if (s.update) walkExpr(s.update); walkStmt(s.body); pop(); return;
          case 'ForEach': walkExpr(s.iter); push(); decl(s.name); (s.names || []).forEach(decl); walkStmt(s.body); pop(); return;
          case 'Switch': walkExpr(s.disc); for (const c of s.cases) { push(); walkStmts(c.body); pop(); } return;
          case 'Return': case 'Throw': if (s.value) walkExpr(s.value); return;
          case 'Try': walkStmt(s.body); for (const h of s.handlers) { push(); if (h.name) decl(h.name); decl('__caught'); walkStmt(h.body); pop(); } walkStmt(s.fin); return;
        }
      }
      function walkExpr(e) {
        if (!e || typeof e !== 'object') return;
        switch (e.type) {
          case 'Name':
            if (!has(e.id) && !(clsFields && clsFields.has(e.id))) throw new CError('NameError', D.msg.undeclared(e.id), e.line);
            return;
          case 'Member': walkExpr(e.obj); return;
          case 'Call':
            if (e.callee.type === 'Name') {
              const n = e.callee.id;
              if (!has(n) && !(clsFields && clsFields.has(n))) throw new CError('NameError', id === 'java' ? `cannot find symbol\n  symbol: method ${n}` : id === 'csharp' ? `The name '${n}' does not exist in the current context` : `'${n}' was not declared in this scope`, e.line);
            } else walkExpr(e.callee);
            e.args.forEach(walkExpr); return;
          case 'Interp': e.parts.forEach(p => p.type === 'Fmt' && walkExpr(p.value)); return;
          case 'Lambda': push(); e.params.forEach(p => decl(p.name)); if (e.expr) walkExpr(e.expr); else walkStmts(e.block); pop(); return;
          case 'Deref': walkExpr(e.operand); return;
          case 'Fmt': walkExpr(e.value); return;
          default:
            for (const k of ['left', 'right', 'operand', 'value', 'target', 'test', 'a', 'b', 'obj', 'index', 'size']) if (e[k]) walkExpr(e[k]);
            for (const k of ['items', 'args']) if (Array.isArray(e[k])) e[k].forEach(walkExpr);
            if (e.init) walkExpr(e.init);
        }
      }
      // top-level statements first (in order), then function bodies
      for (const it of prog) if (it.type !== 'Func' && it.type !== 'Class' && it.type !== 'Enum') walkStmt(it);
      const topNames = new Set(scopes[0]);
      const walkFunc = (f, fieldSet) => {
        scopes.length = 0; scopes.push(new Set(id === 'csharp' ? [] : []));
        if (id === 'csharp') topNames.forEach(n => scopes[0].add(n)); // C# local functions can see top-level variables
        if (id === 'cpp') topNames.forEach(n => scopes[0].add(n));     // C++ global variables
        push(); f.params.forEach(p => decl(p.name)); clsFields = fieldSet;
        if (f.inits) f.inits.forEach(ini => ini.args.forEach(walkExpr));
        if (f.isSetter) decl('value');
        if (f.body) walkStmts(f.body);
        clsFields = null; pop();
      };
      for (const it of prog) {
        if (it.type === 'Func' && !it.owner) walkFunc(it, null);
        if (it.type === 'Func' && it.owner && classes.has(it.owner)) walkFunc(it, memberNames(classes.get(it.owner)));
        if (it.type === 'Class') {
          const names = memberNames(classes.get(it.name));
          for (const m of it.methods) walkFunc(m, names);
          for (const c of it.ctors) walkFunc(c, names);
          for (const pr of it.props) {
            for (const acc of [pr.get, pr.set]) {
              if (!acc) continue;
              const fake = { params: [], body: acc.body || [{ type: 'ExprStmt', expr: acc.expr, line: pr.line }], isSetter: acc === pr.set };
              if (acc.body || acc.expr) walkFunc(fake, names);
            }
          }
          for (const f of it.fields) if (f.init) { clsFields = names; walkExpr(f.init); clsFields = null; }
        }
      }
    }
    function memberNames(cls) {
      const s = new Set();
      let c = cls;
      while (c) { c.fieldDecls.forEach(f => s.add(f.name)); for (const k of c.methods.keys()) s.add(k); if (c.props) for (const k of c.props.keys()) s.add(k); c = c.base; }
      return s;
    }

    // ---------------- program setup
    try {
      const prog = parse(code, D);
      // register classes and functions
      const classDecls = [];
      const collectClasses = (items) => { for (const it of items) if (it.type === 'Class') classDecls.push(it); };
      collectClasses(prog);
      for (const cd of classDecls) {
        const cls = { name: cd.name, base: null, baseName: cd.base, ifaces: cd.ifaces || [], fieldDecls: cd.fields, methods: new Map(), ctors: cd.ctors, statics: new Map(), props: new Map(), decl: cd, isIface: cd.isIface };
        for (const m of cd.methods) { m.ownerCls = cls; if (!cls.methods.has(m.name)) cls.methods.set(m.name, []); cls.methods.get(m.name).push(m); }
        for (const pr of cd.props || []) { pr.ownerCls = cls; cls.props.set(pr.name, pr); }
        classes.set(cd.name, cls);
      }
      for (const cls of classes.values()) {
        if (cls.baseName && classes.has(cls.baseName)) {
          const b = classes.get(cls.baseName);
          // C#: class Circle : IShape names an interface, not a base class
          if (b.isIface && id === 'csharp') { cls.ifaces.unshift(cls.baseName); cls.baseName = null; } else cls.base = b;
        }
      }
      for (const cls of classes.values()) for (const iname of cls.ifaces) {
        const ic = classes.get(iname);
        if (ic && !cls.base) cls.base = ic;   // lets interface types hold the object and use instanceof
        else if (ic) { let c = cls; while (c.base && c.base !== ic) c = c.base; if (!c.base) c.base = ic; }
      }
      // C#: a non-abstract class must implement every interface member and inherited abstract member
      if (id === 'csharp') for (const cls of classes.values()) {
        if (cls.isIface || cls.decl.isAbstract) continue;
        const chain = []; for (let c = cls; c && !c.isIface; c = c.base) chain.push(c);
        const has = (n) => chain.some(c => (c.methods.get(n) || []).some(m => m.body) || c.props.has(n) || c.fieldDecls.some(f => f.name === n));
        const seen = new Set();
        const visitIface = (iname) => {
          const ic = classes.get(iname);
          if (!ic || !ic.isIface || seen.has(iname)) return; seen.add(iname);
          for (const [n, list] of ic.methods) for (const m of list) {
            const sig = `${n}(${m.params.map(q => q.ty ? q.ty.name : '').join(', ')})`;
            if (!m.body && !has(n)) throw new CError('TypeError', `'${cls.name}' does not implement interface member '${iname}.${sig}'`, cls.decl.line);
            const impl = chain.map(c => (c.methods.get(n) || []).find(x => x.body)).find(Boolean);
            if (impl && impl.access !== 'public') throw new CError('TypeError', `'${cls.name}' does not implement interface member '${iname}.${sig}'. '${impl.ownerCls.name}.${n}' cannot implement an interface member because it is not public.`, impl.line || cls.decl.line);
          }
          for (const f of ic.fieldDecls) if (!has(f.name)) throw new CError('TypeError', `'${cls.name}' does not implement interface member '${iname}.${f.name}'`, cls.decl.line);
          for (const pn of ic.props.keys()) if (!has(pn)) throw new CError('TypeError', `'${cls.name}' does not implement interface member '${iname}.${pn}'`, cls.decl.line);
          (ic.ifaces || []).forEach(visitIface); if (ic.baseName) visitIface(ic.baseName);
        };
        for (const c of chain) {
          (c.ifaces || []).forEach(visitIface);
          if (c !== cls && c.decl.isAbstract) for (const [n, list] of c.methods) for (const m of list) if (!m.body && m.abstract && !has(n)) throw new CError('TypeError', `'${cls.name}' does not implement inherited abstract member '${c.name}.${n}(${m.params.map(q => q.ty ? q.ty.name : '').join(', ')})'`, cls.decl.line);
        }
      }
      if (id === 'cpp') for (const cls of classes.values()) for (const [n, list] of cls.methods) for (const m of list) {   // 'override' needs a virtual method to override
        if (m.virtual === 'override' && !(cls.base && cppIsVirtual(cls.base, n))) throw new CError('TypeError', `'${n}' marked 'override', but does not override: the base class needs a virtual ${n}() for this to override`, m.line);
      }
      for (const it of prog) {
        if (it.type === 'Func' && it.owner && classes.has(it.owner)) {
          const cls = classes.get(it.owner);
          const list = cls.methods.get(it.name) || [];
          const i = list.findIndex(m => !m.body && m.params.length === it.params.length);
          it.ownerCls = cls;
          if (i >= 0) { if (list[i].virtual) it.virtual = true; list[i] = it; } else list.push(it);
          cls.methods.set(it.name, list);
        } else if (it.type === 'Func') {
          if (!funcs.has(it.name)) funcs.set(it.name, []);
          funcs.get(it.name).push(it);
        }
      }
      // game-provided globals
      const g = opts.globals || {};
      for (const k of Object.keys(g)) { const v = fromHost(g[k]); globals.declare(k, { v, ty: inferType(v) }); }
      checkNames(prog);
      if (id === 'java') checkJava();
      // statics
      for (const cls of classes.values()) for (const f of cls.fieldDecls) if (f.isStatic) cls.statics.set(f.name, { v: coerce(f.init ? evalInit(f.init, f.ty, globals) : defaultFor(f.ty), f.ty), ty: f.ty });
      // entry point
      const topStmts = prog.filter(it => it.type !== 'Func' && it.type !== 'Class' && it.type !== 'Enum');
      let mainFn = null, mainCls = null;
      for (const cls of classes.values()) { const m = cls.methods.get('main') || cls.methods.get('Main'); if (m && m[0].isStatic !== false) { mainFn = m[0]; mainCls = cls; } }
      if (!mainFn && funcs.has('main')) mainFn = funcs.get('main')[0];
      if (!mainFn && funcs.has('Main')) mainFn = funcs.get('Main')[0];
      if (id === 'cpp' || id === 'java') {
        const bad = topStmts.find(s => s.type !== 'Decl' || id === 'java');
        if (bad) throw new CError('SyntaxError', D.msg.topStmt(bad.type === 'ExprStmt' && bad.expr.type === 'Call' && bad.expr.callee.type === 'Name' ? bad.expr.callee.id : 'statement'), bad.line);
      }
      for (const s of topStmts) exec(s, globals);   // C++ globals, C# top-level statements
      if (id === 'csharp' && topStmts.length) mainScope = globals;
      if (mainFn) {
        const scope = new Scope(globals); scope.cls = mainCls; scope.func = mainFn;
        if (mainFn.params.length) scope.declare(mainFn.params[0].name, { v: new CList('array', [], 'String'), ty: mainFn.params[0].ty });
        mainScope = scope;
        try { execBlock(mainFn.body, scope); } catch (e) { if (!(e instanceof Ret)) throw e; }
      } else if (!(id === 'csharp' && (topStmts.length || funcs.size || !prog.length))) {
        throw new CError('SyntaxError', D.msg.noMain, 1);
      }
      // tests that call the player's functions directly
      for (const t of (opts.callTests || [])) {
        const name = t.fn;
        let f = funcs.has(name) ? funcs.get(name)[0] : null, fcls = null;
        if (!f) for (const cls of classes.values()) { const m = cls.methods.get(name); if (m && m[0].isStatic) { f = m[0]; fcls = cls; break; } }
        if (!f) { result.calls.push({ error: `NameError: ${name} is not defined` }); continue; }
        try {
          const before = out.length;
          // a test list passed to an array parameter (int[] / String[]) arrives as an array
          const targs = (t.args || []).map(fromHost).map((a, i) => { const p = f.params && f.params[i]; if (a instanceof CList && p && p.ty && p.ty.arr === 1 && id !== 'cpp') { a.kind = 'array'; a.elem = p.ty.name; } return a; });
          const v = callFunc(f, targs, null, fcls);
          result.calls.push({ value: toHost(v), printed: out.slice(before).replace(/\n$/, '') });
        } catch (e) {
          if (!(e instanceof CError)) throw e;
          result.calls.push({ error: `${e.cType}: ${e.message}`, line: e.line });
        }
      }
      for (const name of (opts.captureVars || [])) {
        const cell = (mainScope && mainScope.vars.get(name)) || globals.vars.get(name);
        if (cell) result.vars[name] = toHost(cell.v);
      }
    } catch (e) {
      if (e instanceof Ret) e = null;
      else if (e === BREAK || e === CONTINUE) e = new CError('SyntaxError', `${e.sig} statement not within a loop`, curLine);
      else if (e instanceof RangeError) e = new CError('RuntimeError', id === 'java' ? 'java.lang.StackOverflowError' : 'stack overflow', curLine);
      else if (!(e instanceof CError)) e = new CError('InternalError', String(e && e.message || e), curLine);
      if (e) result.error = { type: e.cType, message: e.message, line: e.line || curLine };
    }
    if (out.endsWith('\n')) out = out.slice(0, -1);
    result.output = out === '' ? [] : out.split('\n');
    result.steps = steps;
    return result;
  }

  const CLike = { run, parse: (code, dialect) => parse(code, makeDialect(dialect)), CError };
  if (typeof module !== 'undefined' && module.exports) module.exports = CLike;
  root.CLike = CLike;
})(typeof window !== 'undefined' ? window : globalThis);
