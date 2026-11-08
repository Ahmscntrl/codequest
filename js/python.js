/* CodeQuest — a small Python interpreter written in JavaScript.
 * Supports the subset of Python that the game teaches: variables, print,
 * if/elif/else, while, for, range, functions, classes (with inheritance),
 * lists, dicts, strings, f-strings, comprehensions, slicing, and friendly
 * Python-style errors (SyntaxError, NameError, TypeError, ...).
 */
(function (root) {
  'use strict';

  class PyError extends Error {
    constructor(type, message, line) {
      super(message);
      this.pyType = type;
      this.line = line;
    }
  }

  const KEYWORDS = new Set(['and', 'or', 'not', 'if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return',
    'class', 'True', 'False', 'None', 'break', 'continue', 'pass', 'is', 'lambda', 'global', 'nonlocal',
    'import', 'from', 'del', 'try', 'except', 'finally', 'raise', 'with', 'as', 'assert', 'yield']);

  // ---------------------------------------------------------------- tokenizer
  function tokenize(src) {
    src = src.replace(/\r\n?/g, '\n');
    const toks = [];
    let i = 0, line = 1, depth = 0, atLineStart = true;
    const indents = [0];
    const push = (t, v, l) => toks.push({ t, v, line: l === undefined ? line : l });
    const last = () => toks[toks.length - 1];
    const n = src.length;

    while (i < n) {
      if (atLineStart && depth === 0) {
        let col = 0;
        while (i < n && (src[i] === ' ' || src[i] === '\t')) { col += src[i] === '\t' ? 4 : 1; i++; }
        if (i >= n) break;
        if (src[i] === '\n') { i++; line++; continue; }
        if (src[i] === '#') { while (i < n && src[i] !== '\n') i++; continue; }
        const top = indents[indents.length - 1];
        if (col > top) {
          indents.push(col); push('INDENT');
        } else if (col < top) {
          while (col < indents[indents.length - 1]) { indents.pop(); push('DEDENT'); }
          if (col !== indents[indents.length - 1]) {
            throw new PyError('IndentationError', 'unindent does not match any outer indentation level', line);
          }
        }
        atLineStart = false;
      }
      const c = src[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === '#') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '\\' && src[i + 1] === '\n') { i += 2; line++; continue; }
      if (c === '\n') {
        if (depth === 0) {
          const lt = last();
          if (lt && lt.t !== 'NEWLINE' && lt.t !== 'INDENT' && lt.t !== 'DEDENT') {
            const nl = { t: 'NEWLINE', line, colon: lt.t === 'OP' && lt.v === ':' };
            toks.push(nl);
          }
          atLineStart = true;
        }
        i++; line++; continue;
      }
      // numbers
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let j = i; let isFloat = false;
        while (j < n && /[0-9_]/.test(src[j])) j++;
        if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { isFloat = true; j++; while (j < n && /[0-9_]/.test(src[j])) j++; }
        else if (src[j] === '.' && !/[A-Za-z_]/.test(src[j + 1] || '')) { isFloat = true; j++; }
        if ((src[j] === 'e' || src[j] === 'E') && /[0-9+-]/.test(src[j + 1] || '')) {
          isFloat = true; j++; if (src[j] === '+' || src[j] === '-') j++;
          while (j < n && /[0-9]/.test(src[j])) j++;
        }
        const text = src.slice(i, j).replace(/_/g, '');
        if (/[A-Za-z_]/.test(src[j] || '')) throw new PyError('SyntaxError', 'invalid decimal literal', line);
        push('NUM', { value: Number(text), isFloat });
        i = j; continue;
      }
      // names / string prefixes
      if (/[A-Za-z_]/.test(c)) {
        let j = i;
        while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        const word = src.slice(i, j);
        if ((src[j] === '"' || src[j] === "'") && /^(f|r|b|rb|br|fr|rf|u)$/i.test(word)) {
          i = j;
          const res = readString(word.toLowerCase());
          push(word.toLowerCase().includes('f') ? 'FSTR' : 'STR', res.value, res.line);
          continue;
        }
        push(KEYWORDS.has(word) ? 'KW' : 'NAME', word);
        i = j; continue;
      }
      if (c === '"' || c === "'") {
        const res = readString('');
        push('STR', res.value, res.line);
        continue;
      }
      const three = src.substr(i, 3), two = src.substr(i, 2);
      if (['**=', '//=', '...'].includes(three)) { push('OP', three); i += 3; continue; }
      if (['**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '->', '<>'].includes(two)) {
        if (two === '<>') throw new PyError('SyntaxError', 'invalid syntax', line);
        push('OP', two); i += 2; continue;
      }
      if ('+-*/%<>=()[]{},:.;@'.includes(c)) {
        if ('([{'.includes(c)) depth++;
        if (')]}'.includes(c)) { depth = Math.max(0, depth - 1); }
        push('OP', c); i++; continue;
      }
      if (c === '!') throw new PyError('SyntaxError', "invalid syntax ('!' — did you mean 'not' or '!='?)", line);
      if (c === '&' || c === '|') throw new PyError('SyntaxError', `invalid syntax ('${c}' — use 'and' / 'or')`, line);
      if (c === '“' || c === '”' || c === '‘' || c === '’') throw new PyError('SyntaxError', 'invalid character (curly quote) — use straight quotes " or \'', line);
      throw new PyError('SyntaxError', `invalid character '${c}'`, line);
    }
    if (depth > 0) throw new PyError('SyntaxError', "'(' was never closed", line);
    const lt = last();
    if (lt && lt.t !== 'NEWLINE' && lt.t !== 'INDENT' && lt.t !== 'DEDENT') toks.push({ t: 'NEWLINE', line, colon: lt.t === 'OP' && lt.v === ':' });
    while (indents.length > 1) { indents.pop(); push('DEDENT'); }
    push('EOF');
    return toks;

    function readString(prefix) {
      const raw = prefix.includes('r');
      const q = src[i];
      const startLine = line;
      const triple = src.substr(i, 3) === q + q + q;
      i += triple ? 3 : 1;
      let out = '';
      while (true) {
        if (i >= n) throw new PyError('SyntaxError', 'unterminated string literal', startLine);
        const ch = src[i];
        if (triple && src.substr(i, 3) === q + q + q) { i += 3; break; }
        if (!triple && ch === q) { i++; break; }
        if (!triple && ch === '\n') throw new PyError('SyntaxError', 'unterminated string literal (missing closing quote)', startLine);
        if (ch === '\n') line++;
        if (ch === '\\' && !raw) {
          const nx = src[i + 1];
          const map = { n: '\n', t: '\t', '\\': '\\', "'": "'", '"': '"', '0': '\0', r: '\r' };
          if (nx === '\n') { i += 2; line++; continue; }
          if (nx in map) { out += map[nx]; i += 2; continue; }
          out += '\\'; i++; continue;
        }
        out += ch; i++;
      }
      return { value: out, line: startLine };
    }
  }

  // ---------------------------------------------------------------- parser
  function parse(src) {
    const toks = tokenize(src);
    let p = 0;
    const peek = (o = 0) => toks[p + o];
    const next = () => toks[p++];
    const isOp = (v, o = 0) => peek(o).t === 'OP' && peek(o).v === v;
    const isKw = (v, o = 0) => peek(o).t === 'KW' && peek(o).v === v;
    const describe = (t) => t.t === 'EOF' ? 'end of code' : t.t === 'NEWLINE' ? 'end of line' : t.t === 'INDENT' ? 'indent' : t.t === 'DEDENT' ? 'dedent' : `'${typeof t.v === 'object' ? t.v.value : t.v}'`;
    function err(msg, t) { throw new PyError('SyntaxError', msg, (t || peek()).line); }
    function expectOp(v, msg) {
      if (!isOp(v)) err(msg || `expected '${v}'`);
      return next();
    }
    function expectName() {
      if (peek().t !== 'NAME') err(`expected a name but found ${describe(peek())}`);
      return next().v;
    }

    function parseFile() {
      const body = [];
      while (peek().t !== 'EOF') {
        if (peek().t === 'NEWLINE') { next(); continue; }
        if (peek().t === 'INDENT') throw new PyError('IndentationError', 'unexpected indent', peek().line);
        body.push(...parseStatement());
      }
      return body;
    }

    function parseBlock(what) {
      if (!isOp(':')) err(`expected ':' at the end of the ${what} line`);
      next();
      if (peek().t === 'NEWLINE') {
        const nl = next();
        if (peek().t !== 'INDENT') throw new PyError('IndentationError', `expected an indented block after '${what}' on line ${nl.line}`, peek().line);
        next();
        const body = [];
        while (peek().t !== 'DEDENT' && peek().t !== 'EOF') {
          if (peek().t === 'NEWLINE') { next(); continue; }
          body.push(...parseStatement());
        }
        if (peek().t === 'DEDENT') next();
        return body;
      }
      return parseSimpleLine();
    }

    function parseStatement() {
      const t = peek();
      if (t.t === 'KW') {
        switch (t.v) {
          case 'if': return [parseIf()];
          case 'while': {
            next(); const test = parseExpr();
            const body = parseBlock('while');
            let orelse = [];
            if (isKw('else')) { next(); orelse = parseBlock('else'); }
            return [{ type: 'While', test, body, orelse, line: t.line }];
          }
          case 'for': {
            next();
            const target = parseTargetList();
            if (!isKw('in')) err("expected 'in' in for loop (for x in ...)");
            next();
            const iter = parseExprList();
            const body = parseBlock('for');
            let orelse = [];
            if (isKw('else')) { next(); orelse = parseBlock('else'); }
            return [{ type: 'For', target, iter, body, orelse, line: t.line }];
          }
          case 'def': return [parseDef()];
          case 'class': {
            next(); const name = expectName();
            let base = null;
            if (isOp('(')) {
              next();
              if (!isOp(')')) base = parseExpr();
              expectOp(')', "expected ')' after class base");
            }
            const body = parseBlock('class');
            return [{ type: 'Class', name, base, body, line: t.line }];
          }
          case 'try': {
            next();
            const body = parseBlock('try');
            const handlers = [];
            while (isKw('except')) {
              const et = next();
              let etype = null, ename = null;
              if (!isOp(':')) { etype = parseExpr(); if (isKw('as')) { next(); ename = expectName(); } }
              handlers.push({ etype, ename, body: parseBlock('except'), line: et.line });
            }
            let orelse = [], fin = [];
            if (isKw('else')) { next(); orelse = parseBlock('else'); }
            if (isKw('finally')) { next(); fin = parseBlock('finally'); }
            if (!handlers.length && !fin.length) err("expected 'except' or 'finally' block");
            return [{ type: 'Try', body, handlers, orelse, fin, line: t.line }];
          }
          case 'elif': err("'elif' without a matching 'if' (check your indentation)");
          case 'else': err("'else' without a matching 'if' (check your indentation)");
          case 'import': case 'from':
            throw new PyError('ImportError', 'imports are not available in CodeQuest — everything you need is built in!', t.line);
        }
      }
      return parseSimpleLine();
    }

    function parseSimpleLine() {
      const stmts = [parseSimple()];
      while (isOp(';')) { next(); if (peek().t === 'NEWLINE' || peek().t === 'EOF') break; stmts.push(parseSimple()); }
      if (peek().t === 'NEWLINE') next();
      else if (peek().t !== 'EOF' && peek().t !== 'DEDENT') {
        const t = peek();
        if (t.t === 'STR' || t.t === 'NAME' || t.t === 'NUM') err('invalid syntax. Perhaps you forgot a comma or an operator?', t);
        err(`invalid syntax near ${describe(t)}`, t);
      }
      return stmts;
    }

    function parseIf() {
      const t = next();
      const test = parseExpr();
      const body = parseBlock(t.v);
      let orelse = [];
      if (isKw('elif')) orelse = [parseIf()];
      else if (isKw('else')) { next(); orelse = parseBlock('else'); }
      return { type: 'If', test, body, orelse, line: t.line };
    }

    function parseDef() {
      const t = next();
      const name = expectName();
      expectOp('(', `expected '(' after function name '${name}'`);
      const params = parseParams(')');
      expectOp(')', "expected ')' to close the parameter list");
      if (isOp('->')) { next(); parseExpr(); }
      const body = parseBlock('def');
      return { type: 'Def', name, params, body, line: t.line };
    }

    function parseParams(end) {
      const params = [];
      while (!isOp(end)) {
        let star = false;
        if (isOp('*')) { next(); star = true; }
        const name = expectName();
        let def = null;
        if (isOp(':') && end === ')') { next(); parseExpr(); }
        if (isOp('=')) { next(); def = parseExpr(); }
        params.push({ name, def, star });
        if (!isOp(',')) break;
        next();
      }
      return params;
    }

    function parseSimple() {
      const t = peek();
      if (t.t === 'KW') {
        switch (t.v) {
          case 'pass': next(); return { type: 'Pass', line: t.line };
          case 'break': next(); return { type: 'Break', line: t.line };
          case 'continue': next(); return { type: 'Continue', line: t.line };
          case 'return': {
            next();
            let value = null;
            if (peek().t !== 'NEWLINE' && peek().t !== 'EOF' && !isOp(';') && peek().t !== 'DEDENT') value = parseExprList();
            return { type: 'Return', value, line: t.line };
          }
          case 'global': case 'nonlocal': {
            next(); const names = [expectName()];
            while (isOp(',')) { next(); names.push(expectName()); }
            return { type: 'Global', names, line: t.line };
          }
          case 'del': {
            next(); const target = parseExpr();
            return { type: 'Del', target, line: t.line };
          }
          case 'yield': {
            next(); let value = null;
            if (peek().t !== 'NEWLINE' && peek().t !== 'EOF' && peek().t !== 'DEDENT') value = parseExprList();
            return { type: 'Yield', value, line: t.line };
          }
          case 'raise': {
            next(); let exc = null;
            if (peek().t !== 'NEWLINE' && peek().t !== 'EOF') exc = parseExpr();
            return { type: 'Raise', exc, line: t.line };
          }
          case 'assert': {
            next(); const test = parseExpr(); let msg = null;
            if (isOp(',')) { next(); msg = parseExpr(); }
            return { type: 'Assert', test, msg, line: t.line };
          }
        }
      }
      // Detect the classic "print 'hi'" (Python 2) mistake.
      if (t.t === 'NAME' && t.v === 'print' && (peek(1).t === 'STR' || peek(1).t === 'NAME' || peek(1).t === 'NUM')) {
        err("Missing parentheses in call to 'print'. Did you mean print(...)?");
      }
      const expr = parseExprList();
      if (isOp('=')) {
        const targets = [expr];
        let value;
        while (isOp('=')) {
          next();
          value = parseExprList();
          if (isOp('=')) targets.push(value);
        }
        targets.forEach(checkTarget);
        return { type: 'Assign', targets, value, line: t.line };
      }
      const t2 = peek();
      if (t2.t === 'OP' && ['+=', '-=', '*=', '/=', '%=', '//=', '**='].includes(t2.v)) {
        next(); checkTarget(expr);
        const value = parseExprList();
        return { type: 'AugAssign', target: expr, op: t2.v.slice(0, -1), value, line: t.line };
      }
      if (isOp(':') ) {
        // annotated assignment: x: int = 5
        if (expr.type === 'Name') {
          next(); parseExpr();
          if (isOp('=')) { next(); const value = parseExprList(); return { type: 'Assign', targets: [expr], value, line: t.line }; }
          return { type: 'Pass', line: t.line };
        }
      }
      if (t2.t === 'OP' && t2.v === '==' ) { /* fallthrough – comparisons are expressions */ }
      return { type: 'Expr', expr, line: t.line };
    }

    function checkTarget(e) {
      if (e.type === 'Name' || e.type === 'Attr' || e.type === 'Sub') return;
      if (e.type === 'Tuple' || e.type === 'List') { e.items.forEach(checkTarget); return; }
      if (e.type === 'Starred') { checkTarget(e.value); return; }
      if (e.type === 'Call') throw new PyError('SyntaxError', "cannot assign to function call here. Maybe you meant '==' instead of '='?", e.line);
      if (e.type === 'Const') throw new PyError('SyntaxError', "cannot assign to literal here. Maybe you meant '==' instead of '='?", e.line);
      throw new PyError('SyntaxError', 'cannot assign to expression', e.line);
    }

    function parseTargetList() {
      const line = peek().line;
      const items = [parseOr(true)];
      while (isOp(',')) { next(); if (isKw('in')) break; items.push(parseOr(true)); }
      items.forEach(checkTarget);
      return items.length === 1 ? items[0] : { type: 'Tuple', items, line };
    }

    function parseExprList() {
      const line = peek().line;
      const first = isOp('*') ? (() => { const st = next(); return { type: 'Starred', value: parseOr(), line: st.line }; })() : parseExpr();
      if (!isOp(',')) return first;
      const items = [first];
      while (isOp(',')) {
        next();
        if (peek().t === 'NEWLINE' || peek().t === 'EOF' || isOp('=') || isOp(')') || isOp(':')) break;
        if (isOp('*')) { const st = next(); items.push({ type: 'Starred', value: parseOr(), line: st.line }); continue; }
        items.push(parseExpr());
      }
      return { type: 'Tuple', items, line };
    }

    function parseExpr() {
      if (isKw('lambda')) {
        const t = next();
        const params = parseParams(':');
        expectOp(':', "expected ':' in lambda");
        const body = parseExpr();
        return { type: 'Lambda', params, body, line: t.line };
      }
      const line = peek().line;
      const e = parseOr();
      if (isKw('if')) {
        // ternary: a if cond else b
        const save = p;
        next();
        const test = parseOr();
        if (!isKw('else')) { err("expected 'else' in conditional expression"); }
        next();
        const orelse = parseExpr();
        void save;
        return { type: 'IfExp', test, body: e, orelse, line };
      }
      return e;
    }

    function parseOr(noIn) {
      let left = parseAnd(noIn);
      while (isKw('or')) { const t = next(); left = { type: 'BoolOp', op: 'or', left, right: parseAnd(noIn), line: t.line }; }
      return left;
    }
    function parseAnd(noIn) {
      let left = parseNot(noIn);
      while (isKw('and')) { const t = next(); left = { type: 'BoolOp', op: 'and', left, right: parseNot(noIn), line: t.line }; }
      return left;
    }
    function parseNot(noIn) {
      if (isKw('not')) { const t = next(); return { type: 'Unary', op: 'not', operand: parseNot(noIn), line: t.line }; }
      return parseCompare(noIn);
    }
    function parseCompare(noIn) {
      const line = peek().line;
      const first = parseArith();
      const ops = [], rights = [];
      while (true) {
        const t = peek();
        let op = null;
        if (t.t === 'OP' && ['<', '>', '==', '>=', '<=', '!='].includes(t.v)) { next(); op = t.v; }
        else if (!noIn && isKw('in')) { next(); op = 'in'; }
        else if (isKw('not') && peek(1).t === 'KW' && peek(1).v === 'in') { next(); next(); op = 'not in'; }
        else if (isKw('is')) { next(); if (isKw('not')) { next(); op = 'is not'; } else op = 'is'; }
        else if (t.t === 'OP' && t.v === '=' && false) { }
        if (!op) break;
        ops.push(op); rights.push(parseArith());
      }
      if (!ops.length) return first;
      return { type: 'Compare', left: first, ops, rights, line };
    }
    function parseArith() {
      let left = parseTerm();
      while (isOp('+') || isOp('-')) { const t = next(); left = { type: 'BinOp', op: t.v, left, right: parseTerm(), line: t.line }; }
      return left;
    }
    function parseTerm() {
      let left = parseFactor();
      while (isOp('*') || isOp('/') || isOp('//') || isOp('%') || isOp('@')) { const t = next(); left = { type: 'BinOp', op: t.v, left, right: parseFactor(), line: t.line }; }
      return left;
    }
    function parseFactor() {
      if (isOp('-') || isOp('+')) { const t = next(); return { type: 'Unary', op: t.v, operand: parseFactor(), line: t.line }; }
      return parsePower();
    }
    function parsePower() {
      const base = parsePostfix();
      if (isOp('**')) { const t = next(); return { type: 'BinOp', op: '**', left: base, right: parseFactor(), line: t.line }; }
      return base;
    }
    function parsePostfix() {
      let e = parseAtom();
      while (true) {
        if (isOp('(')) {
          const t = next();
          const args = [], kwargs = [];
          while (!isOp(')')) {
            if (peek().t === 'NEWLINE' || peek().t === 'EOF') err("'(' was never closed", t);
            if (isOp('*')) { next(); args.push({ type: 'Star', value: parseExpr(), line: t.line }); }
            else if (peek().t === 'NAME' && isOp('=', 1)) {
              const name = next().v; next();
              kwargs.push({ name, value: parseExpr() });
            } else {
              const a = parseExpr();
              if (isKw('for')) { args.push(parseComprehension(a, 'Gen', t.line)); }
              else args.push(a);
            }
            if (isOp(',')) { next(); continue; }
            if (!isOp(')')) {
              const bad = peek();
              if (bad.t === 'NEWLINE' || bad.t === 'EOF') err("'(' was never closed", t);
              err('invalid syntax. Perhaps you forgot a comma?', bad);
            }
          }
          next();
          e = { type: 'Call', func: e, args, kwargs, line: t.line };
        } else if (isOp('[')) {
          const t = next();
          let index;
          if (isOp(':') || !isOp(']')) index = parseSliceOrExpr();
          expectOp(']', "expected ']'");
          e = { type: 'Sub', value: e, index, line: t.line };
        } else if (isOp('.')) {
          const t = next();
          if (peek().t !== 'NAME' && peek().t !== 'KW') err('expected a name after "."');
          const name = next().v;
          e = { type: 'Attr', value: e, name, line: t.line };
        } else break;
      }
      return e;
    }
    function parseSliceOrExpr() {
      const line = peek().line;
      let lo = null, hi = null, step = null;
      if (!isOp(':')) lo = parseExpr();
      if (!isOp(':')) return lo;
      next();
      if (!isOp(']') && !isOp(':')) hi = parseExpr();
      if (isOp(':')) { next(); if (!isOp(']')) step = parseExpr(); }
      return { type: 'Slice', lo, hi, step, line };
    }
    function parseComprehension(elt, kind, line, valueElt) {
      const gens = [];
      while (isKw('for')) {
        next();
        const target = parseTargetList();
        if (!isKw('in')) err("expected 'in' in comprehension");
        next();
        const iter = parseOr();
        const ifs = [];
        while (isKw('if')) { next(); ifs.push(parseOr()); }
        gens.push({ target, iter, ifs });
      }
      return { type: 'Comp', kind, elt, valueElt, gens, line };
    }
    function parseAtom() {
      const t = peek();
      if (t.t === 'NUM') { next(); return { type: 'Const', value: t.v.value, isFloat: t.v.isFloat, line: t.line }; }
      if (t.t === 'STR' || t.t === 'FSTR') {
        const parts = [];
        while (peek().t === 'STR' || peek().t === 'FSTR') {
          const s = next();
          if (s.t === 'STR') parts.push({ type: 'Const', value: s.v, line: s.line });
          else parts.push(parseFString(s.v, s.line));
        }
        if (parts.length === 1) return parts[0];
        return { type: 'JoinStr', parts, line: t.line };
      }
      if (t.t === 'NAME') { next(); return { type: 'Name', id: t.v, line: t.line }; }
      if (t.t === 'KW') {
        if (t.v === 'True') { next(); return { type: 'Const', value: true, line: t.line }; }
        if (t.v === 'False') { next(); return { type: 'Const', value: false, line: t.line }; }
        if (t.v === 'None') { next(); return { type: 'Const', value: null, line: t.line }; }
        err(`invalid syntax: unexpected keyword '${t.v}'`);
      }
      if (t.t === 'OP') {
        if (t.v === '(') {
          next();
          if (isOp(')')) { next(); return { type: 'Tuple', items: [], line: t.line }; }
          const first = parseExpr();
          if (isKw('for')) { const c = parseComprehension(first, 'Gen', t.line); expectOp(')', "'(' was never closed"); return c; }
          if (isOp(')')) { next(); return first; }
          const items = [first];
          while (isOp(',')) { next(); if (isOp(')')) break; items.push(parseExpr()); }
          if (!isOp(')')) err("'(' was never closed", t);
          next();
          return { type: 'Tuple', items, line: t.line };
        }
        if (t.v === '[') {
          next();
          const items = [];
          if (!isOp(']')) {
            const first = parseExpr();
            if (isKw('for')) { const c = parseComprehension(first, 'List', t.line); expectOp(']', "'[' was never closed"); return c; }
            items.push(first);
            while (isOp(',')) { next(); if (isOp(']')) break; items.push(parseExpr()); }
          }
          if (!isOp(']')) err(peek().t === 'NEWLINE' || peek().t === 'EOF' ? "'[' was never closed" : 'invalid syntax. Perhaps you forgot a comma?', peek().t === 'NEWLINE' ? t : undefined);
          next();
          return { type: 'List', items, line: t.line };
        }
        if (t.v === '{') {
          next();
          const keys = [], values = [];
          if (isOp('}')) { next(); return { type: 'Dict', keys, values, line: t.line }; }
          const k = parseExpr();
          if (!isOp(':')) {
            // set literal -> treat as list of unique items
            const items = [k];
            if (isKw('for')) { const c = parseComprehension(k, 'Set', t.line); expectOp('}', "'{' was never closed"); return c; }
            while (isOp(',')) { next(); if (isOp('}')) break; items.push(parseExpr()); }
            expectOp('}', "'{' was never closed");
            return { type: 'SetLit', items, line: t.line };
          }
          next();
          const v = parseExpr();
          if (isKw('for')) { const c = parseComprehension(k, 'Dict', t.line, v); expectOp('}', "'{' was never closed"); return c; }
          keys.push(k); values.push(v);
          while (isOp(',')) {
            next(); if (isOp('}')) break;
            keys.push(parseExpr()); expectOp(':', "expected ':' in dictionary"); values.push(parseExpr());
          }
          expectOp('}', "'{' was never closed");
          return { type: 'Dict', keys, values, line: t.line };
        }
      }
      if (t.t === 'NEWLINE' || t.t === 'EOF') err('invalid syntax: the line ended too early');
      if (t.t === 'INDENT') throw new PyError('IndentationError', 'unexpected indent', t.line);
      err(`invalid syntax near ${describe(t)}`);
    }

    function parseFString(s, line) {
      const parts = [];
      let i = 0, lit = '';
      while (i < s.length) {
        const c = s[i];
        if (c === '{' && s[i + 1] === '{') { lit += '{'; i += 2; continue; }
        if (c === '}' && s[i + 1] === '}') { lit += '}'; i += 2; continue; }
        if (c === '{') {
          if (lit) { parts.push({ type: 'Const', value: lit, line }); lit = ''; }
          let depthB = 1, j = i + 1, quote = null;
          while (j < s.length && depthB > 0) {
            const ch = s[j];
            if (quote) { if (ch === quote) quote = null; }
            else if (ch === '"' || ch === "'") quote = ch;
            else if (ch === '{') depthB++;
            else if (ch === '}') depthB--;
            if (depthB > 0) j++;
          }
          if (depthB > 0) throw new PyError('SyntaxError', "f-string: expecting '}'", line);
          let inner = s.slice(i + 1, j);
          let spec = null, conv = null;
          // find top-level ':' for format spec (ignoring inside brackets/strings)
          let d = 0, q = null;
          for (let k = 0; k < inner.length; k++) {
            const ch = inner[k];
            if (q) { if (ch === q) q = null; continue; }
            if (ch === '"' || ch === "'") q = ch;
            else if ('([{'.includes(ch)) d++;
            else if (')]}'.includes(ch)) d--;
            else if (ch === ':' && d === 0) { spec = inner.slice(k + 1); inner = inner.slice(0, k); break; }
            else if (ch === '!' && d === 0 && inner[k + 1] !== '=') {
              const rest = inner.slice(k + 1), ci = rest.indexOf(':');
              conv = (ci < 0 ? rest : rest.slice(0, ci)).trim();
              if (!['r', 's', 'a'].includes(conv)) throw new PyError('SyntaxError', "f-string: invalid conversion character (expected 'r' or 's')", line);
              if (ci >= 0) spec = rest.slice(ci + 1);
              inner = inner.slice(0, k); break;
            }
          }
          // a format spec can itself contain {fields}, e.g. f"{name:<{width}}"
          const specNode = spec && spec.includes('{') ? parseFString(spec, line) : null;
          let selfDoc = false;
          if (/=\s*$/.test(inner) && !/[=!<>]=\s*$/.test(inner)) { selfDoc = true; }
          const exprSrc = selfDoc ? inner.replace(/=\s*$/, '') : inner;
          if (!exprSrc.trim()) throw new PyError('SyntaxError', 'f-string: empty expression not allowed', line);
          let sub;
          try { sub = parseExpressionString(exprSrc, line); } catch (e) { if (e instanceof PyError) { e.line = line; } throw e; }
          if (selfDoc) parts.push({ type: 'Const', value: inner, line });
          parts.push({ type: 'FValue', value: sub, spec, specNode, conv: conv || (selfDoc && !spec ? 'r' : null), line });
          i = j + 1; continue;
        }
        if (c === '}') throw new PyError('SyntaxError', "f-string: single '}' is not allowed", line);
        lit += c; i++;
      }
      if (lit || !parts.length) parts.push({ type: 'Const', value: lit, line });
      return { type: 'JoinStr', parts, line };
    }

    return parseFile();
  }

  function parseExpressionString(src, line) {
    const body = parse('(' + src + ')\n');
    if (body.length !== 1 || body[0].type !== 'Expr') throw new PyError('SyntaxError', 'invalid f-string expression', line);
    const fix = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(fix); return; }
      if (node.line) node.line = line;
      for (const k in node) if (k !== 'line') fix(node[k]);
    };
    fix(body[0].expr);
    return body[0].expr;
  }

  // ---------------------------------------------------------------- runtime values
  class PyDict {
    constructor() { this.map = new Map(); }
    static key(k) {
      if (typeof k === 'boolean') return k ? 1 : 0;
      if (k && typeof k === 'object' && !(k instanceof PyTuple || Array.isArray(k)) && !(k instanceof PyInstance)) throw new PyError('TypeError', `unhashable type: '${typeName(k)}'`);
      if (Array.isArray(k) && !k.isTuple) throw new PyError('TypeError', "unhashable type: 'list'");
      if (Array.isArray(k)) return 'T:' + k.map(x => JSON.stringify(PyDict.key(x))).join(',');
      return k;
    }
    get(k) { const e = this.map.get(PyDict.key(k)); return e ? e[1] : undefined; }
    has(k) { return this.map.has(PyDict.key(k)); }
    set(k, v) { this.map.set(PyDict.key(k), [k, v]); }
    delete(k) { return this.map.delete(PyDict.key(k)); }
    keys() { return [...this.map.values()].map(e => e[0]); }
    values() { return [...this.map.values()].map(e => e[1]); }
    items() { return [...this.map.values()].map(e => tuple([e[0], e[1]])); }
    get size() { return this.map.size; }
  }
  class PyTuple { }
  function tuple(arr) { arr.isTuple = true; return arr; }
  class PyFunc { constructor(name, params, body, closure, isLambda) { Object.assign(this, { name, params, body, closure, isLambda }); } }
  class PyClass { constructor(name, base, attrs) { Object.assign(this, { name, base, attrs }); } lookup(n) { let c = this; while (c) { if (c.attrs.has(n)) return c.attrs.get(n); c = c.base; } return undefined; } }
  class PyInstance { constructor(cls) { this.cls = cls; this.attrs = new Map(); } }
  class PyBound { constructor(self, func) { this.self = self; this.func = func; } }
  class PyRange { constructor(start, stop, step) { Object.assign(this, { start, stop, step }); } toArray() { const out = []; if (this.step > 0) for (let i = this.start; i < this.stop; i += this.step) out.push(i); else for (let i = this.start; i > this.stop; i += this.step) out.push(i); return out; } get length() { return Math.max(0, Math.ceil((this.stop - this.start) / this.step)); } }
  class PyFloat { constructor(v) { this.v = v; } }
  void PyTuple; void PyFloat;

  function builtin(name, fn) { fn._pyname = name; fn._builtin = true; return fn; }

  function typeName(v) {
    if (v === null || v === undefined) return 'NoneType';
    if (typeof v === 'boolean') return 'bool';
    if (typeof v === 'number') return Number.isInteger(v) && !isFloatVal(v) ? 'int' : 'float';
    if (typeof v === 'string') return 'str';
    if (Array.isArray(v)) return v.isTuple ? 'tuple' : 'list';
    if (v instanceof PyDict) return 'dict';
    if (v instanceof PyRange) return 'range';
    if (v instanceof PyInstance) return v.cls.name;
    if (v instanceof PyClass) return 'type';
    if (v instanceof PyFunc || v instanceof PyBound || typeof v === 'function') return v instanceof PyBound ? 'method' : (typeof v === 'function' ? 'builtin_function_or_method' : 'function');
    if (v instanceof Set) return 'set';
    return 'object';
  }
  // floats are tracked through a WeakSet-less trick: we box floats that are integral.
  const floatMarks = new Set();
  function isFloatVal() { return false; }
  void floatMarks;

  function fmtNum(v, isFloat) {
    if (Number.isNaN(v)) return 'nan';
    if (v === Infinity) return 'inf';
    if (v === -Infinity) return '-inf';
    if (isFloat && Number.isInteger(v)) return v.toFixed(1);
    if (!Number.isInteger(v)) {
      let s = String(v);
      if (s.includes('e')) return s.replace('e+', 'e+').replace(/e(-?)(\d)$/, 'e$10$2');
      // mimic Python's repr: shortest roundtrip (JS already does this)
      return s;
    }
    return String(v);
  }

  // ---------------------------------------------------------------- interpreter
  const BREAK = { sig: 'break' }, CONTINUE = { sig: 'continue' };
  class ReturnSig { constructor(v) { this.value = v; } }
  class Scope {
    constructor(parent, kind) { this.vars = new Map(); this.parent = parent; this.kind = kind; this.globals = null; }
    lookup(name) {
      let s = this;
      while (s) {
        if (s.vars.has(name)) return { found: true, value: s.vars.get(name) };
        s = s.parent;
        while (s && s.kind === 'class') s = s.parent; // class scopes are not visible from methods
      }
      return { found: false };
    }
  }

  function run(code, opts) {
    opts = opts || {};
    const maxSteps = opts.maxSteps || 300000;
    let steps = 0;
    let outBuf = '';
    let curLine = 1;
    let depth = 0;
    const result = { output: [], error: null, vars: {}, calls: [], actions: [] };

    const globalScope = new Scope(null, 'global');
    const builtins = new Scope(null, 'builtins');
    globalScope.parent = builtins;

    function E(type, msg) { return new PyError(type, msg, curLine); }
    function tick() { if (++steps > maxSteps) throw E('TimeoutError', 'your code ran too long — is there an infinite loop?'); }

    // ---------------- conversions between host (plain JS) values and Python values
    function fromHost(v) {
      if (v === undefined || v === null) return null;
      if (Array.isArray(v)) return v.map(fromHost);
      if (typeof v === 'object') {
        const d = new PyDict();
        for (const k of Object.keys(v)) d.set(k, fromHost(v[k]));
        return d;
      }
      return v;
    }
    function toHost(v, depthH = 0) {
      if (v === undefined || v === null) return null;
      if (typeof v !== 'object' && typeof v !== 'function') return v;
      if (depthH > 4) return null;
      if (Array.isArray(v)) return v.map(x => toHost(x, depthH + 1));
      if (v instanceof PyDict) { const o = {}; for (const [k, val] of v.items()) o[String(k)] = toHost(val, depthH + 1); return o; }
      if (v instanceof PyRange) return v.toArray();
      if (v instanceof PyInstance) {
        const props = {}, methods = {};
        for (const [k, val] of v.attrs) if (!(val instanceof PyFunc) && !(val instanceof PyBound)) props[k] = toHost(val, depthH + 1);
        let c = v.cls;
        while (c) {
          for (const [k, val] of c.attrs) {
            if (k in methods || k in props || k.startsWith('__')) continue;
            if (val instanceof PyFunc) {
              const required = val.params.filter(p => !p.def && !p.star).length;
              if (required <= 1 && !k.startsWith('__')) {
                try { methods[k] = { value: toHost(callValue(new PyBound(v, val), [], {}), depthH + 1) }; }
                catch (e) { if (e instanceof PyError) methods[k] = { error: `${e.pyType}: ${e.message}` }; else throw e; }
              } else methods[k] = { arity: required - 1 };
            } else if (!k.startsWith('__')) props[k] = toHost(val, depthH + 1);
          }
          c = c.base;
        }
        return { __obj: true, className: v.cls.name, props, methods };
      }
      if (v instanceof PyClass) return { __class: v.name };
      if (v instanceof PyFunc) return { __func: v.name };
      if (v instanceof Set) return [...v].map(x => toHost(x, depthH + 1));
      if (typeof v === 'function') return { __func: v._pyname || 'builtin' };
      return null;
    }

    // ---------------- formatting
    function repr(v, seen) {
      if (v === null || v === undefined) return 'None';
      if (v === true) return 'True';
      if (v === false) return 'False';
      if (typeof v === 'number') return fmtNum(v);
      if (typeof v === 'string') {
        const q = v.includes("'") && !v.includes('"') ? '"' : "'";
        return q + v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(new RegExp(q, 'g'), '\\' + q) + q;
      }
      seen = seen || new Set();
      if (seen.has(v)) return Array.isArray(v) ? '[...]' : '{...}';
      if (Array.isArray(v)) {
        seen.add(v);
        const inner = v.map(x => repr(x, seen)).join(', ');
        seen.delete(v);
        if (v.isTuple) return '(' + inner + (v.length === 1 ? ',' : '') + ')';
        return '[' + inner + ']';
      }
      if (v instanceof PyDict) { seen.add(v); const s = '{' + v.items().map(([k, val]) => repr(k, seen) + ': ' + repr(val, seen)).join(', ') + '}'; seen.delete(v); return s; }
      if (v instanceof Set) return v.size ? '{' + [...v].map(x => repr(x, seen)).join(', ') + '}' : 'set()';
      if (v instanceof PyRange) return `range(${v.start}, ${v.stop}${v.step !== 1 ? ', ' + v.step : ''})`;
      if (v instanceof PyInstance) {
        const r = v.cls.lookup('__repr__');
        if (r instanceof PyFunc) return str(callValue(new PyBound(v, r), [], {}));
        if (v.isException || isExcClass(v.cls)) { const a = v.attrs.get('args') || []; return `${v.cls.name}(${a.map(x => repr(x, seen)).join(', ')})`; }
        return `<${v.cls.name} object>`;
      }
      if (v instanceof PyClass) return `<class '${v.name}'>`;
      if (v instanceof PyFunc) return `<function ${v.name}>`;
      if (v instanceof PyBound) return `<bound method ${v.func.name || v.func._pyname}>`;
      if (typeof v === 'function') return v._typeName ? `<class '${v._typeName}'>` : `<built-in function ${v._pyname}>`;
      return String(v);
    }
    function str(v) {
      if (typeof v === 'string') return v;
      if (v instanceof PyInstance) {
        const s = v.cls.lookup('__str__');
        if (s instanceof PyFunc) { const r = callValue(new PyBound(v, s), [], {}); if (typeof r !== 'string') throw E('TypeError', '__str__ returned non-string'); return r; }
        if (v.isException || isExcClass(v.cls)) { const a = v.attrs.get('args'); return a && a.length ? (a.length === 1 ? (isSubclassName(v, builtins.vars.get('KeyError')) ? repr(a[0]) : str(a[0])) : repr(a)) : ''; }
      }
      return repr(v);
    }
    function truthy(v) {
      if (v === null || v === undefined || v === false || v === 0 || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      if (v instanceof PyDict) return v.size > 0;
      if (v instanceof Set) return v.size > 0;
      if (v instanceof PyRange) return v.length > 0;
      if (v instanceof PyInstance) {
        const b = v.cls.lookup('__bool__') || v.cls.lookup('__len__');
        if (b instanceof PyFunc) return truthy(callValue(new PyBound(v, b), [], {}));
      }
      return true;
    }
    function eq(a, b) {
      if (a === b) return true;
      if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
      if (typeof a === 'boolean' && typeof b === 'number') return (a ? 1 : 0) === b;
      if (typeof b === 'boolean' && typeof a === 'number') return (b ? 1 : 0) === a;
      if (Array.isArray(a) && Array.isArray(b)) {
        if (!!a.isTuple !== !!b.isTuple || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (!eq(a[i], b[i])) return false;
        return true;
      }
      if (a instanceof PyDict && b instanceof PyDict) {
        if (a.size !== b.size) return false;
        for (const [k, v] of a.items()) { if (!b.has(k) || !eq(v, b.get(k))) return false; }
        return true;
      }
      if (a instanceof PyInstance) {
        const f = a.cls.lookup('__eq__');
        if (f instanceof PyFunc) return truthy(callValue(new PyBound(a, f), [b], {}));
      }
      return false;
    }
    function iterate(v) {
      if (typeof v === 'string') return [...v];
      if (Array.isArray(v)) return v.slice();
      if (v instanceof PyRange) return v.toArray();
      if (v instanceof PyDict) return v.keys();
      if (v instanceof Set) return [...v];
      if (v && v.isGenerator) return v.items;
      throw E('TypeError', `'${typeName(v)}' object is not iterable`);
    }
    const isNum = (v) => typeof v === 'number' || typeof v === 'boolean';
    const num = (v) => typeof v === 'boolean' ? (v ? 1 : 0) : v;

    function binop(op, a, b) {
      if (isNum(a) && isNum(b)) {
        a = num(a); b = num(b);
        switch (op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': if (b === 0) throw E('ZeroDivisionError', 'division by zero'); return a / b;
          case '//': if (b === 0) throw E('ZeroDivisionError', 'integer division or modulo by zero'); return Math.floor(a / b);
          case '%': if (b === 0) throw E('ZeroDivisionError', 'integer modulo by zero'); return ((a % b) + b) % b;
          case '**': return Math.pow(a, b);
        }
      }
      if (op === '+') {
        if (typeof a === 'string' && typeof b === 'string') return a + b;
        if (Array.isArray(a) && Array.isArray(b) && !!a.isTuple === !!b.isTuple) { const r = a.concat(b); if (a.isTuple) tuple(r); return r; }
        if (typeof a === 'string') throw E('TypeError', `can only concatenate str (not "${typeName(b)}") to str`);
        if (Array.isArray(a)) throw E('TypeError', `can only concatenate ${typeName(a)} (not "${typeName(b)}") to ${typeName(a)}`);
      }
      if (op === '*') {
        if (typeof a === 'string' && Number.isInteger(num(b))) return num(b) > 0 ? a.repeat(num(b)) : '';
        if (typeof b === 'string' && Number.isInteger(num(a))) return num(a) > 0 ? b.repeat(num(a)) : '';
        if (Array.isArray(a) && Number.isInteger(num(b))) { let r = []; for (let i = 0; i < b; i++) r = r.concat(a); return a.isTuple ? tuple(r) : r; }
        if (Array.isArray(b) && Number.isInteger(num(a))) { let r = []; for (let i = 0; i < a; i++) r = r.concat(b); return b.isTuple ? tuple(r) : r; }
        if (typeof a === 'string' || typeof b === 'string') throw E('TypeError', `can't multiply sequence by non-int of type '${typeName(typeof a === 'string' ? b : a)}'`);
      }
      if (op === '%' && typeof a === 'string') {
        const args = Array.isArray(b) && b.isTuple ? b.slice() : [b];
        return a.replace(/%([sdif]|\.\d+f)/g, (m, f) => { const v = args.shift(); if (f === 's') return str(v); if (f === 'd' || f === 'i') return String(Math.trunc(v)); if (f === 'f') return Number(v).toFixed(6); return Number(v).toFixed(Number(f.slice(1, -1))); });
      }
      if (a instanceof PyInstance) {
        const names = { '+': '__add__', '-': '__sub__', '*': '__mul__', '/': '__truediv__' };
        const f = a.cls.lookup(names[op]);
        if (f instanceof PyFunc) return callValue(new PyBound(a, f), [b], {});
      }
      throw E('TypeError', `unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`);
    }
    function compare(op, a, b) {
      switch (op) {
        case '==': return eq(a, b);
        case '!=': return !eq(a, b);
        case 'is': return a === b || (a == null && b == null);
        case 'is not': return !(a === b || (a == null && b == null));
        case 'in': case 'not in': {
          let r;
          if (typeof b === 'string') { if (typeof a !== 'string') throw E('TypeError', `'in <string>' requires string as left operand, not ${typeName(a)}`); r = b.includes(a); }
          else if (b instanceof PyDict) r = b.has(a);
          else r = iterate(b).some(x => eq(x, a));
          return op === 'in' ? r : !r;
        }
      }
      const ok = (isNum(a) && isNum(b)) || (typeof a === 'string' && typeof b === 'string') || (Array.isArray(a) && Array.isArray(b));
      if (!ok) throw E('TypeError', `'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`);
      if (Array.isArray(a)) { const c = cmpSeq(a, b); return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0; }
      a = num(a); b = num(b);
      switch (op) { case '<': return a < b; case '>': return a > b; case '<=': return a <= b; case '>=': return a >= b; }
    }
    function cmpSeq(a, b) {
      for (let i = 0; i < Math.min(a.length, b.length); i++) { if (eq(a[i], b[i])) continue; return compare('<', a[i], b[i]) ? -1 : 1; }
      return a.length - b.length;
    }
    function sortKey(a, b) { if (eq(a, b)) return 0; return compare('<', a, b) ? -1 : 1; }

    // ---------------- builtins
    const typeFns = {};
    function defType(name, fn) { const f = builtin(name, fn); f._typeName = name; typeFns[name] = f; builtins.vars.set(name, f); return f; }
    const B = (name, fn) => builtins.vars.set(name, builtin(name, fn));

    B('print', (args, kw) => {
      const sep = kw.sep !== undefined ? str(kw.sep) : ' ';
      const end = kw.end !== undefined ? str(kw.end) : '\n';
      outBuf += args.map(str).join(sep) + end;
      if (outBuf.length > 20000) throw E('OutputError', 'too much output!');
      return null;
    });
    B('len', (args) => {
      const v = args[0];
      if (typeof v === 'string' || Array.isArray(v)) return v.length;
      if (v instanceof PyDict || v instanceof Set) return v.size;
      if (v instanceof PyRange) return v.length;
      if (v instanceof PyInstance) { const f = v.cls.lookup('__len__'); if (f) return callValue(new PyBound(v, f), [], {}); }
      throw E('TypeError', `object of type '${typeName(v)}' has no len()`);
    });
    B('range', (args) => {
      args.forEach(a => { if (!Number.isInteger(num(a))) throw E('TypeError', `'${typeName(a)}' object cannot be interpreted as an integer`); });
      if (args.length === 0) throw E('TypeError', 'range expected at least 1 argument, got 0');
      if (args.length === 1) return new PyRange(0, num(args[0]), 1);
      const step = args.length > 2 ? num(args[2]) : 1;
      if (step === 0) throw E('ValueError', 'range() arg 3 must not be zero');
      return new PyRange(num(args[0]), num(args[1]), step);
    });
    defType('str', (args) => args.length ? str(args[0]) : '');
    defType('int', (args) => {
      if (!args.length) return 0;
      const v = args[0];
      if (typeof v === 'number') return Math.trunc(v);
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'string') {
        const base = args[1] || 10;
        const s = v.trim().replace(/_/g, '');
        const ok = base === 10 ? /^[+-]?\d+$/.test(s) : true;
        const r = parseInt(s, base);
        if (!ok || Number.isNaN(r)) throw E('ValueError', `invalid literal for int() with base ${base}: ${repr(v)}`);
        return r;
      }
      throw E('TypeError', `int() argument must be a string or a number, not '${typeName(v)}'`);
    });
    defType('float', (args) => {
      if (!args.length) return 0;
      const v = args[0];
      if (isNum(v)) return num(v);
      if (typeof v === 'string') { const r = Number(v.trim()); if (v.trim() === '' || Number.isNaN(r)) { if (/^[+-]?inf(inity)?$/i.test(v.trim())) return v.trim().startsWith('-') ? -Infinity : Infinity; throw E('ValueError', `could not convert string to float: ${repr(v)}`); } return r; }
      throw E('TypeError', `float() argument must be a string or a number, not '${typeName(v)}'`);
    });
    defType('bool', (args) => args.length ? truthy(args[0]) : false);
    defType('list', (args) => args.length ? iterate(args[0]) : []);
    defType('tuple', (args) => tuple(args.length ? iterate(args[0]) : []));
    defType('dict', (args, kw) => {
      const d = new PyDict();
      if (args.length) { if (args[0] instanceof PyDict) for (const [k, v] of args[0].items()) d.set(k, v); else for (const pair of iterate(args[0])) { const p = iterate(pair); d.set(p[0], p[1]); } }
      for (const k in kw) d.set(k, kw[k]);
      return d;
    });
    defType('set', (args) => { const s = new Set(); const seen = []; if (args.length) for (const x of iterate(args[0])) if (!seen.some(y => eq(x, y))) { seen.push(x); s.add(x); } return s; });
    B('abs', (args) => { if (!isNum(args[0])) throw E('TypeError', `bad operand type for abs(): '${typeName(args[0])}'`); return Math.abs(num(args[0])); });
    const minmax = (name, pick) => (args, kw) => {
      let items = args.length === 1 ? iterate(args[0]) : args;
      if (!items.length) { if ('default' in kw) return kw.default; throw E('ValueError', `${name}() arg is an empty sequence`); }
      const key = kw.key;
      let best = items[0], bestK = key ? callValue(key, [best], {}) : best;
      for (const x of items.slice(1)) { const k = key ? callValue(key, [x], {}) : x; if (pick(k, bestK)) { best = x; bestK = k; } }
      return best;
    };
    B('min', minmax('min', (a, b) => compare('<', a, b)));
    B('max', minmax('max', (a, b) => compare('>', a, b)));
    B('sum', (args) => { let t = args[1] || 0; for (const x of iterate(args[0])) t = binop('+', t, x); return t; });
    B('round', (args) => {
      const v = num(args[0]); const d = args[1] ? num(args[1]) : 0;
      const f = Math.pow(10, d); const x = v * f;
      let r = Math.round(x);
      if (Math.abs(x % 1) === 0.5) r = 2 * Math.round(x / 2); // banker's rounding like Python
      return r / f;
    });
    B('sorted', (args, kw) => {
      const items = iterate(args[0]);
      const key = kw.key;
      const keyed = items.map(x => ({ x, k: key ? callValue(key, [x], {}) : x }));
      // reverse=True keeps equal items in their original order, like Python's stable sort
      const rev = kw.reverse && truthy(kw.reverse) ? -1 : 1;
      keyed.sort((a, b) => rev * sortKey(a.k, b.k));
      return keyed.map(o => o.x);
    });
    B('reversed', (args) => iterate(args[0]).reverse());
    B('enumerate', (args, kw) => { const start = args[1] || kw.start || 0; return iterate(args[0]).map((x, i) => tuple([i + start, x])); });
    B('zip', (args) => { const lists = args.map(iterate); const n = Math.min(...lists.map(l => l.length)); const out = []; for (let i = 0; i < n; i++) out.push(tuple(lists.map(l => l[i]))); return out; });
    B('type', (args) => {
      const v = args[0];
      if (v instanceof PyInstance) return v.cls;
      const tn = typeName(v);
      if (typeFns[tn]) return typeFns[tn];
      const f = builtin(tn, () => { throw E('TypeError', `cannot create '${tn}' instances`); }); f._typeName = tn; return f;
    });
    B('isinstance', (args) => {
      const v = args[0];
      const classes = Array.isArray(args[1]) ? args[1] : [args[1]];
      return classes.some(c => {
        if (c instanceof PyClass) { if (!(v instanceof PyInstance)) return false; let k = v.cls; while (k) { if (k === c) return true; k = k.base; } return false; }
        if (typeof c === 'function' && c._typeName) { const tn = typeName(v); return tn === c._typeName || (c._typeName === 'int' && tn === 'bool') || (c._typeName === 'float' && tn === 'int' && false); }
        return false;
      });
    });
    B('hasattr', (args) => { try { getAttr(args[0], args[1]); return true; } catch (e) { if (e instanceof PyError) return false; throw e; } });
    B('getattr', (args) => { try { return getAttr(args[0], args[1]); } catch (e) { if (e instanceof PyError && args.length > 2) return args[2]; throw e; } });
    B('setattr', (args) => { setAttr(args[0], args[1], args[2]); return null; });
    B('chr', (args) => String.fromCharCode(num(args[0])));
    B('ord', (args) => { if (typeof args[0] !== 'string' || args[0].length !== 1) throw E('TypeError', 'ord() expected a character'); return args[0].charCodeAt(0); });
    B('any', (args) => iterate(args[0]).some(truthy));
    B('all', (args) => iterate(args[0]).every(truthy));
    B('repr', (args) => repr(args[0]));
    B('next', (args) => { const g = args[0]; if (!g || !g.isGenerator) throw E('TypeError', `'${typeName(g)}' object is not an iterator`); if (g.pos >= g.items.length) { if (args.length > 1) return args[1]; throw E('StopIteration', ''); } return g.items[g.pos++]; });
    B('input', () => { throw E('InputError', "input() isn't available here — use the variables you collected instead!"); });
    B('pow', (args) => Math.pow(num(args[0]), num(args[1])));
    B('divmod', (args) => tuple([Math.floor(args[0] / args[1]), ((args[0] % args[1]) + args[1]) % args[1]]));
    B('map', (args) => iterate(args[1]).map(x => callValue(args[0], [x], {})));
    B('filter', (args) => iterate(args[1]).filter(x => args[0] === null ? truthy(x) : truthy(callValue(args[0], [x], {}))));
    B('id', (args) => { void args; return Math.floor(Math.random() * 1e9); });
    B('super', () => {
      // resolved specially in Call for zero-arg super()
      throw E('RuntimeError', 'super() must be used inside a method');
    });
    const excBase = new PyClass('Exception', null, new Map());
    excBase.isException = true;
    excBase.attrs.set('__init__', builtin('__init__', (args) => { args[0].attrs.set('args', tuple(args.slice(1))); args[0].isException = true; return null; }));
    builtins.vars.set('Exception', excBase);
    // built-in exceptions, with their real family tree (KeyError is a LookupError, ...)
    for (const [exc, parent] of [['ArithmeticError'], ['LookupError'], ['RuntimeError'], ['ValueError'], ['TypeError'], ['NameError'], ['AttributeError'], ['StopIteration'], ['AssertionError'], ['ImportError'],
      ['KeyError', 'LookupError'], ['IndexError', 'LookupError'], ['ZeroDivisionError', 'ArithmeticError'], ['OverflowError', 'ArithmeticError'], ['NotImplementedError', 'RuntimeError'], ['RecursionError', 'RuntimeError'], ['UnboundLocalError', 'NameError']]) {
      const cls = new PyClass(exc, parent ? builtins.vars.get(parent) : excBase, new Map());
      cls.isException = true;
      builtins.vars.set(exc, cls);
    }
    B('format', (args) => formatSpec(args[0], args.length > 1 ? str(args[1]) : ''));
    B('issubclass', (args) => {
      const classes = Array.isArray(args[1]) ? args[1] : [args[1]];
      if (!(args[0] instanceof PyClass)) return classes.some(c => c === args[0]);
      return classes.some(c => { let k = args[0]; while (k) { if (k === c) return true; k = k.base; } return false; });
    });
    function isExcClass(c) { while (c) { if (c.isException) return true; c = c.base; } return false; }

    // host API functions (game actions)
    const api = opts.api || {};
    for (const name of Object.keys(api)) {
      B(name, (args, kw) => {
        const hostArgs = args.map(a => toHost(a));
        if (Object.keys(kw).length) hostArgs.push(Object.fromEntries(Object.entries(kw).map(([k, v]) => [k, toHost(v)])));
        result.actions.push({ fn: name, args: hostArgs, line: curLine });
        if (result.actions.length > 5000) throw E('RuntimeError', 'your code called a function thousands of times — is a loop stuck going forever?');
        return fromHost(api[name](...hostArgs));
      });
    }
    // global variables provided by the game (collected items etc.)
    const g = opts.globals || {};
    for (const k of Object.keys(g)) globalScope.vars.set(k, fromHost(g[k]));

    // ---------------- method tables
    function strMethod(s, name) {
      const m = {
        upper: () => s.toUpperCase(), lower: () => s.toLowerCase(),
        strip: (a) => a[0] ? trimChars(s, a[0], 3) : s.trim(), lstrip: (a) => a[0] ? trimChars(s, a[0], 1) : s.replace(/^\s+/, ''), rstrip: (a) => a[0] ? trimChars(s, a[0], 2) : s.replace(/\s+$/, ''),
        split: (a, kw) => { const sep = a[0] !== undefined && a[0] !== null ? a[0] : kw.sep; let parts = sep === undefined || sep === null ? s.trim().split(/\s+/).filter(x => x !== '') : s.split(sep); const max = a[1] !== undefined ? a[1] : kw.maxsplit; if (max !== undefined && max >= 0 && parts.length > max + 1) { parts = parts.slice(0, max).concat([parts.slice(max).join(sep === undefined || sep === null ? ' ' : sep)]); } return parts; },
        join: (a) => iterate(a[0]).map(x => { if (typeof x !== 'string') throw E('TypeError', `sequence item: expected str instance, ${typeName(x)} found`); return x; }).join(s),
        replace: (a) => s.split(a[0]).join(a[1]),
        startswith: (a) => s.startsWith(a[0]), endswith: (a) => s.endsWith(a[0]),
        find: (a) => s.indexOf(a[0]), index: (a) => { const i = s.indexOf(a[0]); if (i < 0) throw E('ValueError', 'substring not found'); return i; },
        count: (a) => a[0] === '' ? s.length + 1 : s.split(a[0]).length - 1,
        isdigit: () => /^\d+$/.test(s), isalpha: () => /^[A-Za-z]+$/.test(s), isalnum: () => /^[A-Za-z0-9]+$/.test(s), isspace: () => /^\s+$/.test(s),
        isupper: () => /[A-Z]/.test(s) && s === s.toUpperCase(), islower: () => /[a-z]/.test(s) && s === s.toLowerCase(),
        title: () => s.replace(/[A-Za-z]+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()),
        capitalize: () => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s,
        swapcase: () => [...s].map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''),
        center: (a) => { const w = a[0], f = a[1] || ' '; if (s.length >= w) return s; const tot = w - s.length, l = Math.floor(tot / 2); return f.repeat(l) + s + f.repeat(tot - l); },
        ljust: (a) => s.padEnd(a[0], a[1] || ' '), rjust: (a) => s.padStart(a[0], a[1] || ' '), zfill: (a) => s.padStart(a[0], '0'),
        format: (a, kw) => { let i = 0; return s.replace(/\{([^}]*)\}/g, (m, k) => { const [key, spec] = k.split(':'); let v = key === '' ? a[i++] : /^\d+$/.test(key) ? a[+key] : kw[key]; return formatSpec(v, spec); }); },
      }[name];
      return m;
    }
    function trimChars(s, chars, mode) { let a = 0, b = s.length; if (mode & 1) while (a < b && chars.includes(s[a])) a++; if (mode & 2) while (b > a && chars.includes(s[b - 1])) b--; return s.slice(a, b); }
    function listMethod(l, name) {
      return {
        append: (a) => { if (l.isTuple) throw E('AttributeError', "'tuple' object has no attribute 'append'"); l.push(a[0]); return null; },
        extend: (a) => { l.push(...iterate(a[0])); return null; },
        pop: (a) => { if (!l.length) throw E('IndexError', 'pop from empty list'); if (a.length) { let i = a[0]; if (i < 0) i += l.length; if (i < 0 || i >= l.length) throw E('IndexError', 'pop index out of range'); return l.splice(i, 1)[0]; } return l.pop(); },
        insert: (a) => { let i = a[0]; if (i < 0) i = Math.max(0, l.length + i); l.splice(i, 0, a[1]); return null; },
        remove: (a) => { const i = l.findIndex(x => eq(x, a[0])); if (i < 0) throw E('ValueError', 'list.remove(x): x not in list'); l.splice(i, 1); return null; },
        index: (a) => { const i = l.findIndex(x => eq(x, a[0])); if (i < 0) throw E('ValueError', `${repr(a[0])} is not in list`); return i; },
        count: (a) => l.filter(x => eq(x, a[0])).length,
        reverse: () => { l.reverse(); return null; },
        sort: (a, kw) => { const key = kw.key; const keyed = l.map(x => ({ x, k: key ? callValue(key, [x], {}) : x })); const rev = kw.reverse && truthy(kw.reverse) ? -1 : 1; keyed.sort((p, q) => rev * sortKey(p.k, q.k)); l.splice(0, l.length, ...keyed.map(o => o.x)); return null; },
        copy: () => l.slice(), clear: () => { l.length = 0; return null; },
      }[name];
    }
    function dictMethod(d, name) {
      return {
        keys: () => d.keys(), values: () => d.values(), items: () => d.items(),
        get: (a) => d.has(a[0]) ? d.get(a[0]) : (a.length > 1 ? a[1] : null),
        pop: (a) => { if (!d.has(a[0])) { if (a.length > 1) return a[1]; throw E('KeyError', repr(a[0])); } const v = d.get(a[0]); d.delete(a[0]); return v; },
        update: (a, kw) => { if (a[0]) for (const [k, v] of a[0].items()) d.set(k, v); for (const k in kw) d.set(k, kw[k]); return null; },
        setdefault: (a) => { if (!d.has(a[0])) d.set(a[0], a.length > 1 ? a[1] : null); return d.get(a[0]); },
        copy: () => { const n = new PyDict(); for (const [k, v] of d.items()) n.set(k, v); return n; },
        clear: () => { d.map.clear(); return null; },
      }[name];
    }
    function setMethod(s, name) {
      return {
        add: (a) => { if (![...s].some(x => eq(x, a[0]))) s.add(a[0]); return null; },
        remove: (a) => { for (const x of s) if (eq(x, a[0])) { s.delete(x); return null; } throw E('KeyError', repr(a[0])); },
        discard: (a) => { for (const x of s) if (eq(x, a[0])) s.delete(x); return null; },
      }[name];
    }
    function formatSpec(v, spec) {
      if (!spec) return str(v);
      // [[fill]align][sign][#][0][width][grouping][.precision][type]
      const m = /^(?:([^{}])?([<>^=]))?([+\- ]?)(#?)(0?)(\d*)([,_]?)(?:\.(\d+))?([bcdeEfFgGosxX%]?)$/.exec(spec);
      if (!m) throw E('ValueError', `Invalid format specifier '${spec}' — the part after ':' looks like [fill][align][width][.precision][type], e.g. {x:>8.2f}`);
      let [, fill, align, sign, alt, zero, width, group, prec, kind] = m;
      if (typeof v === 'boolean' && !kind) v = str(v);
      const numeric = typeof v === 'number' || typeof v === 'boolean';
      if (kind && kind !== 's' && !numeric) throw E('ValueError', `Unknown format code '${kind}' for object of type '${typeName(v)}' (format codes like :${kind} need a number)`);
      if (kind === 's' && numeric) throw E('ValueError', `Unknown format code 's' for object of type '${typeName(v)}'`);
      let s, neg = false;
      if (numeric) {
        let n = +v;
        neg = n < 0 || Object.is(n, -0); n = Math.abs(n);
        const p = prec !== undefined ? +prec : 6;
        if ('fF'.includes(kind) && kind) s = n.toFixed(p);
        else if (kind === '%') s = (n * 100).toFixed(p) + '%';
        else if (kind === 'e' || kind === 'E') { s = n.toExponential(p).replace(/e([+-])(\d)$/, 'e$10$2'); if (kind === 'E') s = s.toUpperCase(); }
        else if ('dxXbo'.includes(kind) && kind) {
          if (!Number.isInteger(n)) throw E('ValueError', `Unknown format code '${kind}' for object of type 'float' (use :.0f to show a float without decimals)`);
          const base = { d: 10, x: 16, X: 16, b: 2, o: 8 }[kind];
          s = n.toString(base); if (kind === 'X') s = s.toUpperCase();
          if (alt && base !== 10) s = '0' + { 16: 'x', 2: 'b', 8: 'o' }[base] + s;
        } else if (kind === 'c') s = String.fromCharCode(n);
        else if (prec !== undefined) s = fmtNum(Number(n.toPrecision(Math.max(1, p))));
        else s = fmtNum(n);
        if (group) { const parts = s.split('.'); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, group); s = parts.join('.'); }
        if (neg && !/^0(\.0*)?%?$/.test(s)) s = '-' + s; else if (sign === '+') s = '+' + s; else if (sign === ' ') s = ' ' + s;
      } else {
        s = str(v);
        if (prec !== undefined) s = s.slice(0, +prec);
      }
      if (zero && !align) { fill = '0'; align = numeric ? '=' : '<'; }
      if (width && s.length < +width) {
        const w = +width, f = fill || ' ', pad = (k) => f.repeat(k);
        if (!align) align = numeric ? '>' : '<';
        const tot = w - s.length;
        if (align === '<') s = s + pad(tot);
        else if (align === '>') s = pad(tot) + s;
        else if (align === '^') { const l = Math.floor(tot / 2); s = pad(l) + s + pad(tot - l); }
        else { const sg = /^[+\- ]/.test(s) ? s[0] : ''; s = sg + pad(tot) + s.slice(sg.length); }
      }
      return s;
    }

    function getAttr(obj, name) {
      if (obj instanceof PyInstance) {
        if (obj.attrs.has(name)) return obj.attrs.get(name);
        const v = obj.cls.lookup(name);
        if (v !== undefined) return v instanceof PyFunc ? new PyBound(obj, v) : v;
        throw E('AttributeError', `'${obj.cls.name}' object has no attribute '${name}'`);
      }
      if (obj instanceof PyClass) {
        const v = obj.lookup(name);
        if (v !== undefined) return v;
        if (name === '__name__') return obj.name;
        throw E('AttributeError', `type object '${obj.name}' has no attribute '${name}'`);
      }
      let m = null;
      if (typeof obj === 'string') m = strMethod(obj, name);
      else if (Array.isArray(obj)) m = listMethod(obj, name);
      else if (obj instanceof PyDict) m = dictMethod(obj, name);
      else if (obj instanceof Set) m = setMethod(obj, name);
      if (m) return builtin(name, m);
      if (typeof obj === 'function' && name === '__name__') return obj._pyname;
      if (obj instanceof PyFunc && name === '__name__') return obj.name;
      let hint = '';
      if (Array.isArray(obj) && name === 'length') hint = " (use len(...) to get the length)";
      if (Array.isArray(obj) && name === 'push') hint = " (did you mean .append?)";
      if (typeof obj === 'string' && name === 'length') hint = " (use len(...) to get the length)";
      if (typeof obj === 'string' && (name === 'toUpperCase' || name === 'toLowerCase')) hint = ` (in Python use .${name === 'toUpperCase' ? 'upper' : 'lower'}())`;
      throw E('AttributeError', `'${typeName(obj)}' object has no attribute '${name}'${hint}`);
    }
    function setAttr(obj, name, val) {
      if (obj instanceof PyInstance) { obj.attrs.set(name, val); return; }
      if (obj instanceof PyClass) { obj.attrs.set(name, val); return; }
      throw E('AttributeError', `'${typeName(obj)}' object attribute '${name}' is read-only`);
    }

    function normIndex(i, len, what) {
      if (typeof i === 'boolean') i = i ? 1 : 0;
      if (!Number.isInteger(i)) throw E('TypeError', `${what} indices must be integers, not ${typeName(i)}`);
      const j = i < 0 ? i + len : i;
      if (j < 0 || j >= len) throw E('IndexError', `${what} index out of range`);
      return j;
    }
    function sliceBounds(len, lo, hi, step) {
      step = step === null || step === undefined ? 1 : step;
      if (step === 0) throw E('ValueError', 'slice step cannot be zero');
      const clamp = (v, def, lowB, highB) => { if (v === null || v === undefined) return def; if (v < 0) v += len; return Math.min(Math.max(v, lowB), highB); };
      if (step > 0) return { start: clamp(lo, 0, 0, len), stop: clamp(hi, len, 0, len), step };
      return { start: clamp(lo, len - 1, -1, len - 1), stop: clamp(hi, -1, -1, len - 1), step };
    }
    function doSlice(v, sl) {
      const seq = typeof v === 'string' ? [...v] : v;
      if (!Array.isArray(seq)) throw E('TypeError', `'${typeName(v)}' object is not subscriptable`);
      const { start, stop, step } = sliceBounds(seq.length, sl.lo, sl.hi, sl.step);
      const out = [];
      if (step > 0) for (let i = start; i < stop; i += step) out.push(seq[i]);
      else for (let i = start; i > stop; i += step) out.push(seq[i]);
      if (typeof v === 'string') return out.join('');
      if (v.isTuple) tuple(out);
      return out;
    }
    function getItem(v, idx) {
      if (idx && idx.isSlice) return doSlice(v, idx);
      if (typeof v === 'string') return v[normIndex(idx, v.length, 'string')];
      if (Array.isArray(v)) return v[normIndex(idx, v.length, v.isTuple ? 'tuple' : 'list')];
      if (v instanceof PyDict) { if (!v.has(idx)) throw E('KeyError', repr(idx)); return v.get(idx); }
      if (v instanceof PyRange) return v.toArray()[normIndex(idx, v.length, 'range object')];
      if (v instanceof PyInstance) { const f = v.cls.lookup('__getitem__'); if (f) return callValue(new PyBound(v, f), [idx], {}); }
      throw E('TypeError', `'${typeName(v)}' object is not subscriptable`);
    }
    function setItem(v, idx, val) {
      if (Array.isArray(v)) {
        if (v.isTuple) throw E('TypeError', "'tuple' object does not support item assignment");
        if (idx && idx.isSlice) { const { start, stop } = sliceBounds(v.length, idx.lo, idx.hi, 1); v.splice(start, Math.max(0, stop - start), ...iterate(val)); return; }
        v[normIndex(idx, v.length, 'list assignment')] = val; return;
      }
      if (v instanceof PyDict) { v.set(idx, val); return; }
      if (typeof v === 'string') throw E('TypeError', "'str' object does not support item assignment");
      if (v instanceof PyInstance) { const f = v.cls.lookup('__setitem__'); if (f) { callValue(new PyBound(v, f), [idx, val], {}); return; } }
      throw E('TypeError', `'${typeName(v)}' object does not support item assignment`);
    }

    // ---------------- calls
    function callValue(f, args, kwargs, node) {
      if (typeof f === 'function') {
        try { return f(args, kwargs); } catch (e) { if (e instanceof PyError && !e.line) e.line = curLine; throw e; }
      }
      if (f instanceof PyBound) {
        if (typeof f.func === 'function') return f.func([f.self, ...args], kwargs);
        return callFunc(f.func, [f.self, ...args], kwargs, f.self);
      }
      if (f instanceof PyFunc) return callFunc(f, args, kwargs, null);
      if (f instanceof PyClass) {
        if (f.isException && !(f.lookup('__init__') instanceof PyFunc)) { const inst = new PyInstance(f); inst.attrs.set('args', tuple(args)); inst.isException = true; return inst; }
        const inst = new PyInstance(f);
        if (isExcClass(f)) { inst.attrs.set('args', tuple(args.slice())); inst.isException = true; }
        const init = f.lookup('__init__');
        if (init instanceof PyFunc) {
          const r = callFunc(init, [inst, ...args], kwargs, inst);
          if (r !== null && r !== undefined) throw E('TypeError', '__init__() should return None');
        } else if (args.length) throw E('TypeError', `${f.name}() takes no arguments`);
        return inst;
      }
      if (f instanceof PyInstance) {
        const c = f.cls.lookup('__call__');
        if (c) return callFunc(c, [f, ...args], kwargs, f);
      }
      throw E('TypeError', `'${typeName(f)}' object is not callable`);
      void node;
    }
    function callFunc(fn, args, kwargs, selfObj) {
      tick();
      if (++depth > 180) { depth = 0; throw E('RecursionError', 'maximum recursion depth exceeded'); }
      const scope = new Scope(fn.closure, 'function');
      scope.selfObj = selfObj; scope.func = fn;
      const params = fn.params;
      const fname = fn.name || '<lambda>';
      let ai = 0;
      for (let pi = 0; pi < params.length; pi++) {
        const prm = params[pi];
        if (prm.star) { scope.vars.set(prm.name, tuple(args.slice(ai))); ai = args.length; continue; }
        if (ai < args.length) {
          if (prm.name in kwargs) throw E('TypeError', `${fname}() got multiple values for argument '${prm.name}'`);
          scope.vars.set(prm.name, args[ai++]);
        } else if (prm.name in kwargs) scope.vars.set(prm.name, kwargs[prm.name]);
        else if (prm.def) scope.vars.set(prm.name, prm.defValue);
        else {
          const missing = params.slice(pi).filter(p => !p.def && !p.star && !(p.name in kwargs)).map(p => `'${p.name}'`);
          const isMethod = selfObj && params[0] && params[0].name === 'self';
          void isMethod;
          throw E('TypeError', `${fname}() missing ${missing.length} required positional argument${missing.length > 1 ? 's' : ''}: ${missing.join(' and ')}`);
        }
      }
      if (ai < args.length) {
        const adj = selfObj && params.length > 0 ? 1 : 0;
        const given = args.length - adj, takes = params.length - adj;
        let extra = '';
        if (selfObj && params.length === 0) extra = " (did you forget 'self' in the method definition?)";
        throw E('TypeError', `${fname}() takes ${takes} positional argument${takes === 1 ? '' : 's'} but ${given} ${given === 1 ? 'was' : 'were'} given${extra}`);
      }
      for (const k in kwargs) if (!params.some(p => p.name === k)) throw E('TypeError', `${fname}() got an unexpected keyword argument '${k}'`);
      const savedLine = curLine;
      try {
        if (fn.isLambda) return evalExpr(fn.body, scope);
        if (fn.isGen) {
          scope.yields = [];
          try { execBlock(fn.body, scope); } catch (e) { if (!(e instanceof ReturnSig)) throw e; }
          return { isGenerator: true, items: scope.yields, pos: 0 };
        }
        execBlock(fn.body, scope);
        return null;
      } catch (e) {
        if (e instanceof ReturnSig) return e.value;
        if (e === BREAK || e === CONTINUE) throw E('SyntaxError', `'${e.sig}' outside loop`);
        throw e;
      } finally { depth--; curLine = savedLine; }
    }

    // ---------------- assignment
    function lookupName(name, scope) {
      const r = scope.lookup(name);
      if (r.found) return r.value;
      let hint = '';
      const all = new Set();
      let s = scope; while (s) { for (const k of s.vars.keys()) all.add(k); s = s.parent; }
      const maxD = name.length <= 3 ? 0 : name.length > 6 ? 2 : 1;
      const close = [...all].find(k => k !== name && !k.startsWith('_') && (k.toLowerCase() === name.toLowerCase() || editDistance(k, name) <= maxD));
      if (close) hint = `. Did you mean: '${close}'?`;
      if (name === 'true' || name === 'false') hint = `. Did you mean: '${name[0].toUpperCase() + name.slice(1)}'?`;
      if (name === 'null' || name === 'undefined') hint = ". Did you mean: 'None'?";
      if (name === 'console' || name === 'let' || name === 'const' || name === 'var' || name === 'function') hint = ' (that looks like JavaScript — you are writing Python here!)';
      if (name === 'self') hint = " (is 'self' the first parameter of your method?)";
      throw E('NameError', `name '${name}' is not defined${hint}`);
    }
    function assignName(name, val, scope) {
      if (scope.globals && scope.globals.has(name)) { globalScope.vars.set(name, val); return; }
      scope.vars.set(name, val);
    }
    function assign(target, val, scope) {
      switch (target.type) {
        case 'Name': assignName(target.id, val, scope); return;
        case 'Attr': setAttr(evalExpr(target.value, scope), target.name, val); return;
        case 'Sub': setItem(evalExpr(target.value, scope), evalIndex(target.index, scope), val); return;
        case 'Tuple': case 'List': {
          const items = iterate(val);
          const si = target.items.findIndex(t => t.type === 'Starred');
          if (si >= 0) {
            const after = target.items.length - si - 1;
            if (items.length < target.items.length - 1) throw E('ValueError', `not enough values to unpack (expected at least ${target.items.length - 1}, got ${items.length})`);
            target.items.slice(0, si).forEach((t, i) => assign(t, items[i], scope));
            assign(target.items[si].value, items.slice(si, items.length - after), scope);
            target.items.slice(si + 1).forEach((t, i) => assign(t, items[items.length - after + i], scope));
            return;
          }
          if (items.length !== target.items.length) throw E('ValueError', items.length > target.items.length ? `too many values to unpack (expected ${target.items.length})` : `not enough values to unpack (expected ${target.items.length}, got ${items.length})`);
          target.items.forEach((t, i) => assign(t, items[i], scope));
          return;
        }
      }
      throw E('SyntaxError', 'cannot assign');
    }
    function evalIndex(idx, scope) {
      if (idx && idx.type === 'Slice') return { isSlice: true, lo: idx.lo ? evalExpr(idx.lo, scope) : null, hi: idx.hi ? evalExpr(idx.hi, scope) : null, step: idx.step ? evalExpr(idx.step, scope) : null };
      return evalExpr(idx, scope);
    }

    // ---------------- statements
    function execBlock(stmts, scope) { for (const s of stmts) exec(s, scope); }
    function exec(s, scope) {
      curLine = s.line; tick();
      switch (s.type) {
        case 'Expr': evalExpr(s.expr, scope); return;
        case 'Assign': { const v = evalExpr(s.value, scope); for (const t of s.targets) assign(t, v, scope); return; }
        case 'AugAssign': {
          let cur;
          if (s.target.type === 'Name') {
            const r = scope.lookup(s.target.id);
            if (!r.found || (scope.kind === 'function' && !scope.vars.has(s.target.id) && !(scope.globals && scope.globals.has(s.target.id)) && globalScope.vars.has(s.target.id) && scope !== globalScope)) {
              if (!r.found) lookupName(s.target.id, scope);
              throw E('UnboundLocalError', `cannot access local variable '${s.target.id}' — add 'global ${s.target.id}' at the top of the function to change it`);
            }
            cur = r.value;
          } else cur = evalExpr(s.target, scope);
          const v = evalExpr(s.value, scope);
          let nv;
          if (s.op === '+' && Array.isArray(cur) && !cur.isTuple) { cur.push(...iterate(v)); nv = cur; }
          else nv = binop(s.op, cur, v);
          assign(s.target, nv, scope);
          return;
        }
        case 'If': {
          if (truthy(evalExpr(s.test, scope))) execBlock(s.body, scope);
          else execBlock(s.orelse, scope);
          return;
        }
        case 'While': {
          let broke = false;
          while (true) {
            curLine = s.line; tick();
            if (!truthy(evalExpr(s.test, scope))) break;
            try { execBlock(s.body, scope); }
            catch (e) { if (e === BREAK) { broke = true; break; } if (e === CONTINUE) continue; throw e; }
          }
          if (!broke) execBlock(s.orelse, scope);
          return;
        }
        case 'For': {
          const items = iterate(evalExpr(s.iter, scope));
          let broke = false;
          for (const it of items) {
            curLine = s.line; tick();
            assign(s.target, it, scope);
            try { execBlock(s.body, scope); }
            catch (e) { if (e === BREAK) { broke = true; break; } if (e === CONTINUE) continue; throw e; }
          }
          if (!broke) execBlock(s.orelse, scope);
          return;
        }
        case 'Break': throw BREAK;
        case 'Continue': throw CONTINUE;
        case 'Pass': return;
        case 'Return':
          if (scope.kind !== 'function') throw E('SyntaxError', "'return' outside function");
          throw new ReturnSig(s.value ? evalExpr(s.value, scope) : null);
        case 'Yield': {
          let sc = scope; while (sc && !sc.yields) sc = sc.parent;
          if (!sc) throw E('SyntaxError', "'yield' outside function");
          sc.yields.push(s.value ? evalExpr(s.value, scope) : null);
          if (sc.yields.length > 100000) throw E('TimeoutError', 'your generator never stops — is there an infinite loop?');
          return;
        }
        case 'Def': {
          const params = s.params.map(p => ({ ...p, defValue: p.def ? evalExpr(p.def, scope) : undefined }));
          const fn = new PyFunc(s.name, params, s.body, scope.kind === 'class' ? scope.parent : scope, false);
          fn.isGen = (function hasYield(list) { return list.some(st => st.type === 'Yield' || (st.type !== 'Def' && st.type !== 'Class' && ['body', 'orelse', 'fin'].some(k => Array.isArray(st[k]) && hasYield(st[k])) || (st.handlers && st.handlers.some(h => hasYield(h.body))))); })(s.body);
          fn.defScope = scope;
          assignName(s.name, fn, scope);
          return;
        }
        case 'Class': {
          let base = null;
          if (s.base) { base = evalExpr(s.base, scope); if (!(base instanceof PyClass)) { if (typeof base === 'function' && base._typeName === 'object') base = null; else throw E('TypeError', 'a class can only inherit from another class'); } }
          const cscope = new Scope(scope, 'class');
          execBlock(s.body, cscope);
          const cls = new PyClass(s.name, base, cscope.vars);
          if (base && base.isException) cls.isException = true;
          for (const v of cscope.vars.values()) if (v instanceof PyFunc) v.ownerClass = cls;
          assignName(s.name, cls, scope);
          return;
        }
        case 'Global': { if (!scope.globals) scope.globals = new Set(); s.names.forEach(n => scope.globals.add(n)); return; }
        case 'Del': {
          const t = s.target;
          if (t.type === 'Name') { scope.vars.delete(t.id); return; }
          if (t.type === 'Sub') { const c = evalExpr(t.value, scope); const i = evalExpr(t.index, scope); if (Array.isArray(c)) c.splice(normIndex(i, c.length, 'list'), 1); else if (c instanceof PyDict) { if (!c.delete(i)) throw E('KeyError', repr(i)); } return; }
          return;
        }
        case 'Raise': {
          if (!s.exc) {
            // a bare `raise` inside an except block re-raises the exception being handled
            if (scope.handling && scope.handling.length) throw scope.handling[scope.handling.length - 1];
            throw E('RuntimeError', 'No active exception to re-raise (a bare raise only works inside an except block)');
          }
          let exc = evalExpr(s.exc, scope);
          if (exc instanceof PyClass) exc = callValue(exc, [], {});
          if (!(exc instanceof PyInstance) || !isExcClass(exc.cls)) throw E('TypeError', 'exceptions must derive from Exception (you can only raise an exception, like raise ValueError("message"))');
          const err = E(exc.cls.name, str(exc));
          err.pyValue = exc;
          throw err;
        }
        case 'Assert': {
          if (!truthy(evalExpr(s.test, scope))) throw E('AssertionError', s.msg ? str(evalExpr(s.msg, scope)) : '');
          return;
        }
        case 'Try': {
          try {
            try { execBlock(s.body, scope); }
            catch (e) {
              if (!(e instanceof PyError) || e.pyType === 'TimeoutError') throw e;
              let handled = false;
              for (const h of s.handlers) {
                let match = !h.etype;
                if (h.etype) {
                  const t = evalExpr(h.etype, scope);
                  const list = Array.isArray(t) ? t : [t];
                  const own = e.pyValue ? null : builtins.vars.get(e.pyType);
                  match = list.some(c => c instanceof PyClass && (c.name === 'Exception' || c.name === e.pyType || isSubclassName(e.pyValue, c) || (own instanceof PyClass && isSubclassName({ cls: own }, c))));
                }
                if (match) {
                  if (!e.pyValue) { const inst = new PyInstance(builtins.vars.get(e.pyType) || builtins.vars.get('Exception')); inst.attrs.set('args', tuple(e.pyType === 'KeyError' && /^'.*'$/.test(e.message) ? [e.message.slice(1, -1)] : [e.message])); inst.isException = true; e.pyValue = inst; }
                  if (h.ename) assignName(h.ename, e.pyValue, scope);
                  (scope.handling = scope.handling || []).push(e);
                  try { execBlock(h.body, scope); } finally { scope.handling.pop(); }
                  handled = true; break;
                }
              }
              if (!handled) throw e;
              return;
            }
            execBlock(s.orelse, scope);
          } finally { if (s.fin.length) execBlock(s.fin, scope); }
          return;
        }
      }
      throw E('SyntaxError', `unsupported statement ${s.type}`);
    }
    function isSubclassName(inst, cls) { if (!inst || !inst.cls) return false; let c = inst.cls; while (c) { if (c === cls) return true; c = c.base; } return false; }

    // ---------------- expressions
    function evalExpr(e, scope) {
      switch (e.type) {
        case 'Const': return e.value;
        case 'Name': return lookupName(e.id, scope);
        case 'JoinStr': return e.parts.map(p => {
          if (p.type !== 'FValue') return str(evalExpr(p, scope));
          let v = evalExpr(p.value, scope);
          if (p.conv === 'r' || p.conv === 'a') v = repr(v); else if (p.conv === 's') v = str(v);
          return formatSpec(v, p.specNode ? evalExpr(p.specNode, scope) : p.spec);
        }).join('');
        case 'List': return e.items.map(x => evalExpr(x, scope));
        case 'Tuple': return tuple(e.items.map(x => evalExpr(x, scope)));
        case 'SetLit': { const s = new Set(); const seen = []; for (const x of e.items) { const v = evalExpr(x, scope); if (!seen.some(y => eq(y, v))) { seen.push(v); s.add(v); } } return s; }
        case 'Dict': { const d = new PyDict(); e.keys.forEach((k, i) => d.set(evalExpr(k, scope), evalExpr(e.values[i], scope))); return d; }
        case 'BoolOp': {
          const l = evalExpr(e.left, scope);
          if (e.op === 'and') return truthy(l) ? evalExpr(e.right, scope) : l;
          return truthy(l) ? l : evalExpr(e.right, scope);
        }
        case 'Unary': {
          const v = evalExpr(e.operand, scope);
          if (e.op === 'not') return !truthy(v);
          if (!isNum(v)) throw E('TypeError', `bad operand type for unary ${e.op}: '${typeName(v)}'`);
          return e.op === '-' ? -num(v) : num(v);
        }
        case 'BinOp': return binop(e.op, evalExpr(e.left, scope), evalExpr(e.right, scope));
        case 'Compare': {
          let l = evalExpr(e.left, scope);
          for (let i = 0; i < e.ops.length; i++) {
            const r = evalExpr(e.rights[i], scope);
            if (!compare(e.ops[i], l, r)) return false;
            l = r;
          }
          return true;
        }
        case 'IfExp': return truthy(evalExpr(e.test, scope)) ? evalExpr(e.body, scope) : evalExpr(e.orelse, scope);
        case 'Attr': return getAttr(evalExpr(e.value, scope), e.name);
        case 'Sub': return getItem(evalExpr(e.value, scope), evalIndex(e.index, scope));
        case 'Lambda': {
          const params = e.params.map(p => ({ ...p, defValue: p.def ? evalExpr(p.def, scope) : undefined }));
          return new PyFunc('<lambda>', params, e.body, scope, true);
        }
        case 'Comp': {
          const out = e.kind === 'Dict' ? new PyDict() : [];
          const cscope = new Scope(scope, 'function');
          cscope.kind = 'comp';
          const loop = (gi) => {
            if (gi === e.gens.length) {
              if (e.kind === 'Dict') out.set(evalExpr(e.elt, cscope), evalExpr(e.valueElt, cscope));
              else out.push(evalExpr(e.elt, cscope));
              return;
            }
            const g = e.gens[gi];
            for (const it of iterate(evalExpr(g.iter, gi === 0 ? scope : cscope))) {
              tick();
              assign(g.target, it, cscope);
              if (g.ifs.every(c => truthy(evalExpr(c, cscope)))) loop(gi + 1);
            }
          };
          loop(0);
          if (e.kind === 'Set') { const s = new Set(); const seen = []; for (const v of out) if (!seen.some(y => eq(y, v))) { seen.push(v); s.add(v); } return s; }
          return out;
        }
        case 'Call': {
          // zero-argument super()
          if (e.func.type === 'Name' && e.func.id === 'super') {
            let s = scope; while (s && !s.selfObj) s = s.parent;
            let fs = scope; while (fs && !fs.func) fs = fs.parent;
            if (!s || !fs || !fs.func.ownerClass) throw E('RuntimeError', 'super(): no arguments — use it inside a method');
            const self = s.selfObj, base = fs.func.ownerClass.base;
            if (!base) throw E('TypeError', 'super(): this class has no parent class');
            return { __super: true, self, base };
          }
          let f;
          if (e.func.type === 'Attr') {
            const obj = evalExpr(e.func.value, scope);
            if (obj && obj.__super) {
              const m = obj.base.lookup(e.func.name);
              if (!m) throw E('AttributeError', `'super' object has no attribute '${e.func.name}'`);
              f = (m instanceof PyFunc || typeof m === 'function') ? new PyBound(obj.self, m) : m;
            } else f = getAttr(obj, e.func.name);
          } else f = evalExpr(e.func, scope);
          const args = [];
          for (const a of e.args) {
            if (a.type === 'Star') args.push(...iterate(evalExpr(a.value, scope)));
            else if (a.type === 'Comp' && a.kind === 'Gen') { const lst = evalExpr({ ...a, kind: 'List' }, scope); args.push(lst); }
            else args.push(evalExpr(a, scope));
          }
          const kwargs = {};
          for (const k of e.kwargs) kwargs[k.name] = evalExpr(k.value, scope);
          curLine = e.line;
          const r = callValue(f, args, kwargs, e);
          curLine = e.line;
          return r;
        }
      }
      throw E('SyntaxError', `unsupported expression ${e.type}`);
    }

    // ---------------- go
    try {
      const ast = parse(code);
      execBlock(ast, globalScope);
      for (const t of (opts.callTests || [])) {
        const r = globalScope.vars.get(t.fn);
        if (r === undefined) { result.calls.push({ error: `NameError: name '${t.fn}' is not defined` }); continue; }
        try {
          const before = outBuf.length;
          const v = callValue(r, (t.args || []).map(fromHost), {});
          result.calls.push({ value: toHost(v), printed: outBuf.slice(before) });
        } catch (e) {
          if (!(e instanceof PyError)) throw e;
          result.calls.push({ error: `${e.pyType}: ${e.message}`, line: e.line });
        }
      }
      for (const name of (opts.captureVars || [])) {
        if (globalScope.vars.has(name)) result.vars[name] = toHost(globalScope.vars.get(name));
      }
    } catch (e) {
      if (e === BREAK || e === CONTINUE) e = new PyError('SyntaxError', `'${e.sig}' outside loop`, curLine);
      if (e instanceof ReturnSig) e = new PyError('SyntaxError', "'return' outside function", curLine);
      if (e instanceof RangeError) e = new PyError('RecursionError', 'maximum recursion depth exceeded', curLine);
      if (!(e instanceof PyError)) { e = new PyError('InternalError', String(e && e.message || e), curLine); }
      result.error = { type: e.pyType, message: e.message, line: e.line || curLine };
    }
    if (outBuf.endsWith('\n')) outBuf = outBuf.slice(0, -1);
    result.output = outBuf === '' ? [] : outBuf.split('\n');
    result.steps = steps;
    return result;
  }

  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  }

  const PyInterp = { run, parse, tokenize, PyError };
  if (typeof module !== 'undefined' && module.exports) module.exports = PyInterp;
  root.PyInterp = PyInterp;
})(typeof window !== 'undefined' ? window : globalThis);
