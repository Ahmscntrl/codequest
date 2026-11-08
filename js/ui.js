/* CodeQuest — menus, save slots, character creator, code editor, HUD, sound. */
(function () {
  'use strict';
  const { LEVELS, CH, SKILLS, GLITCHES, SNIPPETS, escapeHTML } = GameData;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const KEY = (lang) => `codequest.save.${lang}`;
  const OLD_KEY = (n) => `codequest.slot.${n}`;
  const LANGS = Lang.LANGS;
  const WORLD_INDEX = LEVELS.findIndex(l => l.openWorld);

  const FUNC_DOCS = {
    build_bridge: ['n', 'Builds a bridge using n planks.'],
    open_gate: ['', 'Opens the gate.'],
    sound_alarm: ['', 'Sounds the alarm!'],
    cool: ['', 'Cools things down.'],
    heat: ['', 'Heats things up.'],
    wait: ['', 'Does nothing (for now).'],
    build_step: ['n', 'Builds step number n of the staircase.'],
    equip: ['weapon', 'Equips a weapon object.'],
    adopt: ['pet', 'Adopts a pet object.'],
    deposit: ['gem', 'Deposits one gem.'],
    fire: ['', 'Fires one cannon shot.'],
    heal: ['', 'Heals you.'],
    umbrella: ['', 'Opens an umbrella.'],
    sunglasses: ['', 'Puts on sunglasses.'],
    turn_away: ['', 'Politely turns the visitor away.'],
    charge_up: ['', 'Charges the battery a little.'],
    brew: ['potion', 'Brews one potion object.'],
  };

  // ---------------------------------------------------------------- sound
  const Sound = {
    ctx: null, on: true,
    ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.on = false; } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    tone(f, d, type, vol, slide, delay) {
      if (!this.on || !this.ctx) return;
      const c = this.ctx, t0 = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(f, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
      g.gain.setValueAtTime(vol || 0.06, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.02);
    },
    noise(d, vol, delay) {
      if (!this.on || !this.ctx) return;
      const c = this.ctx, t0 = c.currentTime + (delay || 0);
      const buf = c.createBuffer(1, c.sampleRate * d, c.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; g.gain.value = vol || 0.08;
      s.connect(g); g.connect(c.destination); s.start(t0);
    },
    play(name) {
      if (!this.on) return;
      this.ensure();
      switch (name) {
        case 'jump': this.tone(330, 0.12, 'square', 0.04, 620); break;
        case 'pickup': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.09, 'square', 0.04, null, i * 0.06)); break;
        case 'friend': [392, 523, 659, 784, 659, 1047].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.06, null, i * 0.08)); break;
        case 'hurt': this.tone(300, 0.25, 'sawtooth', 0.06, 80); break;
        case 'die': this.tone(400, 0.6, 'sawtooth', 0.07, 40); this.noise(0.4, 0.05); break;
        case 'open': [262, 330, 392, 523].forEach((f, i) => this.tone(f, 0.15, 'triangle', 0.06, null, i * 0.07)); break;
        case 'build': this.tone(180, 0.06, 'square', 0.04, 120); break;
        case 'error': this.tone(110, 0.2, 'sawtooth', 0.05, 90); break;
        case 'stomp': this.tone(200, 0.1, 'square', 0.06, 500); break;
        case 'swing': this.noise(0.08, 0.04); break;
        case 'spring': this.tone(200, 0.3, 'triangle', 0.07, 900); break;
        case 'zap': this.tone(900, 0.08, 'sawtooth', 0.03, 300); break;
        case 'hit': this.tone(150, 0.1, 'square', 0.06, 60); break;
        case 'boom': this.noise(0.35, 0.1); this.tone(90, 0.3, 'sine', 0.1, 40); break;
        case 'cannon': this.noise(0.12, 0.06); this.tone(500, 0.15, 'square', 0.04, 150); break;
        case 'shoot': this.tone(700, 0.15, 'square', 0.03, 300); break;
        case 'warn': [600, 0, 600].forEach((f, i) => f && this.tone(f, 0.1, 'square', 0.05, null, i * 0.12)); break;
        case 'success': [523, 659, 784].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.07, null, i * 0.09)); break;
        case 'fail': this.tone(220, 0.18, 'square', 0.05, 150); break;
        case 'glitch': for (let i = 0; i < 5; i++) this.tone(200 + Math.random() * 800, 0.05, 'square', 0.04, null, i * 0.04); break;
        case 'click': this.tone(800, 0.03, 'square', 0.03); break;
        case 'bit': this.tone(1200, 0.06, 'square', 0.025, 1600); break;
        case 'victory': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.07, null, i * 0.13)); break;
      }
    },
  };

  // ---------------------------------------------------------------- syntax highlighting
  const PY_KW = new Set('and or not if elif else while for in def return class True False None break continue pass is lambda global try except finally raise with as assert import from del'.split(' '));
  const JS_KW = new Set('let const var if else while for of in function return class new this true false null undefined break continue do switch case default typeof instanceof try catch finally throw extends super'.split(' '));
  const C_KW = {
    cpp: new Set('int double float char bool void string auto const if else for while do return break continue class struct public private protected new delete true false nullptr this using namespace switch case default static vector map long unsigned'.split(' ')),
    java: new Set('public private protected static final void int double float long boolean char String class new return if else for while do break continue true false null this extends implements import switch case default'.split(' ')),
    csharp: new Set('public private protected static readonly void int double float long bool char string var class new return if else for foreach in while do break continue true false null this using namespace switch case default override'.split(' ')),
  };
  const BUILTINS = new Set('print len range str int float list dict set tuple abs min max sum round sorted reversed enumerate zip type isinstance console log Math self input cout endl std System out println Console WriteLine Write to_string'.split(' '));
  function highlight(code, lang) {
    const re = lang === 'python'
      ? /(#.*$)|((?:[fFrRbB]{1,2})?(?:"""[\s\S]*?(?:"""|$(?![\s\S]))|'''[\s\S]*?(?:'''|$(?![\s\S]))|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|([^\S\n]+|\n)|(.)/gm
      : /(\/\/.*$|\/\*[\s\S]*?(?:\*\/|$(?![\s\S]))|^[ \t]*#.*$)|(`(?:\\.|[^`\\])*`?|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([^\S\n]+|\n)|(.)/gm;
    const kw = lang === 'python' ? PY_KW : C_KW[lang] || JS_KW;
    const apiNames = new Set(Object.keys(FUNC_DOCS).flatMap(n => [n, CodeRunner.camel(n)]));
    let out = '', m;
    re.lastIndex = 0;
    while ((m = re.exec(code))) {
      if (m[0] === '') { re.lastIndex++; continue; }
      const e = escapeHTML(m[0]);
      if (m[1]) out += `<span class="t-com">${e}</span>`;
      else if (m[2]) out += `<span class="t-str">${e}</span>`;
      else if (m[3]) out += `<span class="t-num">${e}</span>`;
      else if (m[4]) {
        const w = m[4];
        const nextCh = code[re.lastIndex];
        if (kw.has(w)) out += `<span class="t-kw">${e}</span>`;
        else if (apiNames.has(w)) out += `<span class="t-api">${e}</span>`;
        else if (BUILTINS.has(w)) out += `<span class="t-bi">${e}</span>`;
        else if (nextCh === '(') out += `<span class="t-fn">${e}</span>`;
        else if (/^[A-Z]/.test(w)) out += `<span class="t-cls">${e}</span>`;
        else out += e;
      } else out += e;
    }
    return out + '\n';
  }

  // ---------------------------------------------------------------- friendly error explanations
  function explain(err, lang) {
    const py = lang === 'python';
    if (Lang.get(lang).family === 'c') return explainC(err, lang);
    const t = err.type;
    if (t === 'SyntaxError') {
      if (/never closed|unterminated|missing \)|expected '\)'|missing \) after/i.test(err.message)) return 'Something was opened but never closed. Check your brackets ( ) [ ] { } and quotes.';
      if (/expected ':'/.test(err.message)) return 'Lines that start a block (if, for, while, def, class) must end with a colon <code>:</code>';
      return py ? 'Python couldn\'t understand this line. Look for a missing bracket, quote, comma or colon.' : 'JavaScript couldn\'t understand this. Look for missing brackets ( ), braces { }, quotes or commas.';
    }
    if (t === 'IndentationError') return 'Python uses indentation (spaces at the start of a line) to know which lines belong inside an if/for/def. Make sure they line up!';
    if (t === 'ReferenceError' && /before initialization/.test(err.message)) return 'You used <code>let</code> (or <code>const</code>) on a variable that <b>already exists</b>, so JavaScript made a brand-new empty one. Remove the <code>let</code> and just write <code>name = ...</code>.';
    if (t === 'NameError' || t === 'ReferenceError') return 'You used a name that doesn\'t exist. Check the spelling, and remember that capital letters matter.' + (py ? '' : ' (Did you declare it with <code>let</code> or <code>const</code>?)');
    if (t === 'TypeError') return py ? 'You used a value in a way its type doesn\'t allow, like adding text and a number. <code>str(5)</code> turns a number into text, <code>int("5")</code> turns text into a number.' : 'You used a value in a way it doesn\'t allow, like calling something that isn\'t a function, reading a property of <code>null</code>, or changing a <code>const</code>.';
    if (t === 'TimeoutError') return 'Your code never finished! A loop that never stops is called an <b>infinite loop</b>. Make sure your loop condition eventually becomes false.';
    if (t === 'ZeroDivisionError') return 'You can\'t divide by zero, not even in Syntaxia.';
    if (t === 'IndexError') return 'You asked for a position that isn\'t in the list. Remember: the first item is at index 0!';
    if (t === 'KeyError') return 'That key isn\'t in the dictionary. Check the spelling.';
    if (t === 'AttributeError') return 'That object doesn\'t have that attribute or method. Check the spelling. Or did you forget to set it in <code>__init__</code>?';
    if (t === 'ValueError') return 'The value has the right type but a wrong value, e.g. <code>int("abc")</code>.';
    if (t === 'RecursionError' || t === 'RangeError') return 'A function kept calling itself forever!';
    if (t === 'ImportError') return 'No imports needed here. Everything you need is built in.';
    return 'Read the error message carefully. It usually tells you what went wrong.';
  }

  function explainC(err, lang) {
    const L = Lang.get(lang), t = err.type, m = err.message;
    const types = lang === 'java' ? '<code>int</code> for whole numbers, <code>double</code> for decimals, <code>boolean</code> for true/false and <code>String</code> for text'
      : lang === 'csharp' ? '<code>int</code> for whole numbers, <code>double</code> for decimals, <code>bool</code> for true/false and <code>string</code> for text'
        : '<code>int</code> for whole numbers, <code>double</code> for decimals, <code>bool</code> for true/false and <code>string</code> for text';
    if (t === 'SyntaxError') {
      if (/;/.test(m) && /expected/.test(m)) return `In ${L.label}, every statement ends with a <b>semicolon</b> <code>;</code>, like a full stop at the end of a sentence. Check the end of the line the error points to (or the line just before it).`;
      if (/end of (input|file)|\} expected/.test(m)) return 'A <code>{</code> was opened but never closed with a matching <code>}</code>. Count your braces!';
      if (/string|constant|literal/.test(m)) return 'A piece of text is missing its closing quote <code>"</code>.';
      if (/main/.test(m)) return lang === 'java' ? 'Java code runs from <code>public static void main(String[] args)</code>, which must be inside a class. Keep your code inside main.' : 'C++ code runs from <code>int main() { ... }</code>. Statements have to go inside a function like main.';
      return `${L.label} couldn't understand this line. Look for a missing semicolon <code>;</code>, bracket <code>( )</code>, brace <code>{ }</code> or quote.`;
    }
    if (t === 'NameError') return `You used a name ${L.label} doesn't know. Check the spelling (capital letters matter), and remember a variable must be <b>declared with a type</b> before you use it (like <code>${lang === 'java' ? 'String' : 'string'} color = "red";</code>).`;
    if (t === 'TypeError') return `In ${L.label}, every variable has a <b>type</b> and only holds values of that type: ${types}.` + (lang === 'cpp' && /operator\+/.test(m) ? ' To glue a number onto text, turn it into text first with <code>to_string(n)</code>.' : '');
    if (t === 'TimeoutError') return 'Your code never finished! A loop that never stops is called an <b>infinite loop</b>. Make sure your loop condition eventually becomes false.';
    if (t === 'RuntimeError') {
      if (/zero/i.test(m)) return 'You can\'t divide by zero, not even in Syntaxia.';
      if (/index|range|bounds/i.test(m)) return 'You asked for a position that isn\'t in the list or text. The first item is at index 0, and the last is at size − 1.';
      if (/null|Segmentation/i.test(m)) return 'You used an object that doesn\'t exist yet (it\'s empty / null). Make sure you created it first.';
      return 'Your code compiled, but crashed while running. The message says what went wrong.';
    }
    return 'Read the error message carefully. It usually tells you what went wrong.';
  }

  function corruptCode(code, lang) {
    const muts = lang === 'python'
      ? [c => c.replace(/:(\s*(#.*)?)$/m, '$1'), c => c.replace(/\bfire\(/, 'fier('), c => c.replace(/\brange\(/, 'rnage('), c => c.replace(/\(([^()\n]*)\)(\s*:)/, '($1$2'), c => c.replace(/^(\s+)fire/m, 'fire')]
      : [c => c.replace(/\b([Ff])ire\(/, '$1ier('), c => c.replace(/;(\s*\n)/, '$1'), c => c.replace(/\blet\b/, 'lett'), c => c.replace(/\)\s*\{/, ' {'), c => c.replace(/\bfor\b/, 'fro')];
    const order = muts.sort(() => Math.random() - 0.5);
    for (const m of order) { const n = m(code); if (n !== code) return n; }
    return (lang === 'python' ? 'fier()\n' : 'fier();\n') + code;
  }

  // ---------------------------------------------------------------- the app
  class App {
    constructor() {
      this.screen = 'title';
      this.modalOpen = false;
      this.editorOpen = false;
      this.save = null;
      this.slot = null;
      this.game = new Game($('#game'), this);
      this.bindEditor();
      $('#map-back').onclick = () => { Sound.play('click'); this.showScreen('game'); this.game.running = true; this.updateHUD(); };
      $('#map-title').onclick = () => { Sound.play('click'); this.persist(); this.showTitle(); };
      this.bindTouch();
      this.fit();
      window.addEventListener('resize', () => this.fit());
      setInterval(() => { if (this.save && this.screen === 'game' && !this.game.frozen) this.save.playtime = (this.save.playtime || 0) + 1; }, 1000);
      document.addEventListener('pointerdown', () => Sound.ensure(), { once: true });
      document.addEventListener('keydown', () => Sound.ensure(), { once: true });
      try { Sound.on = localStorage.getItem('codequest.sound') !== 'off'; } catch (e) { /* ignore */ }
      this.showTitle();
    }
    fit() {
      const stage = $('#stage');
      const w = window.innerWidth, h = window.innerHeight;
      const scale = Math.min(w / 960, h / 540);
      stage.style.width = Math.floor(960 * scale) + 'px';
      stage.style.height = Math.floor(540 * scale) + 'px';
      stage.style.setProperty('--s', scale);
    }
    sfx(n) { Sound.play(n); }
    inputBlocked() { return this.screen !== 'game' || this.modalOpen || this.editorOpen || this.tutOpen; }
    setFrozen() { this.game.frozen = this.inputBlocked(); if (this.game.frozen) this.game.clearKeys(); }
    chapter() { return (this.save && !this.save.course && this.save.chapter === 2 && GameData.CHAPTER2[this.save.lang]) ? 2 : 1; }
    levels() { return GameData.levelsFor(this.chapter(), this.save.lang, this.save.course); }
    // progress for the chapter being played: level, maxLevel, completed, checkpoints
    prog() {
      if (this.chapter() === 2) { const c = this.save.ch2 || (this.save.ch2 = { level: 0, maxLevel: 0, completed: false, checkpoints: {} }); if (!c.checkpoints) c.checkpoints = {}; return c; }
      return this.save;
    }
    levelsOf(ch) { return GameData.levelsFor(ch, this.save.lang, this.save.course); }
    progOf(ch) {
      if (ch !== 2) return this.save;
      const c = this.save.ch2 || (this.save.ch2 = { level: 0, maxLevel: 0, completed: false, checkpoints: {} }); if (!c.checkpoints) c.checkpoints = {}; return c;
    }
    chUnlocked(ch) { return ch === 1 || this.ch2Unlocked(); }
    ch2Unlocked() { return !!(this.save && !this.save.course && this.save.completed && GameData.CHAPTER2[this.save.lang]); }
    ctx() { return { lang: this.save.lang, save: this.save, vars: this.save.vars, name: this.save.hero.name, game: this.game }; }

    // ------------------------------------------------------------ persistence
    readSlot(lang) { try { const s = localStorage.getItem(KEY(lang)); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
    // Saves used to be 3 numbered slots. Move each language's most recent one into its language save file.
    migrateOldSlots() {
      try {
        if (localStorage.getItem('codequest.migrated')) return;
        localStorage.setItem('codequest.migrated', '1');
        const old = [1, 2, 3].map(n => { const raw = localStorage.getItem(OLD_KEY(n)); return raw ? { n, s: JSON.parse(raw) } : null; }).filter(Boolean);
        old.sort((a, b) => (b.s.updated || 0) - (a.s.updated || 0));
        for (const o of old) {
          const lang = o.s.lang || 'python';
          if (!localStorage.getItem(KEY(lang))) { localStorage.setItem(KEY(lang), JSON.stringify(o.s)); localStorage.removeItem(OLD_KEY(o.n)); }
        }
      } catch (e) { /* storage may be unavailable */ }
    }
    persist() {
      if (!this.save) return;
      this.save.updated = Date.now();
      try { localStorage.setItem(KEY(this.slot || this.save.course || this.save.lang), JSON.stringify(this.save)); } catch (e) { /* storage may be unavailable */ }
    }
    newSave(hero, lang, course) {
      return { v: 1, course: course || null, created: Date.now(), updated: Date.now(), playtime: 0, hero, lang, level: 0, maxLevel: 0, solved: {}, code: {}, vars: {}, taken: {}, pickupValues: {}, foundI: false, weapon: null, pet: null, sp: 0, spUnlocked: false, skills: {}, bugs: 0, glitches: {}, checkpoint: null, checkpoints: {}, completed: false, chapter: 1, ch2: { level: 0, maxLevel: 0, completed: false, checkpoints: {} }, seenIntro: {}, cannonCorrupt: false, minis: {}, ...(course ? { spUnlocked: true, foundI: true } : {}) };
    }

    // ------------------------------------------------------------ screens
    showScreen(name) {
      this.screen = name;
      $$('.screen').forEach(s => s.classList.toggle('hidden', s.id !== 'screen-' + name));
      $('#stage').classList.toggle('hidden', name !== 'game');
      this.setFrozen();
    }
    showTitle() {
      this.game.running = false;
      this.save = null;
      this.showScreen('title');
      this.migrateOldSlots();
      const wrap = $('#slots');
      wrap.innerHTML = '';
      const COURSE = GameData.COURSES && GameData.COURSES.dsa && GameData.COURSES.dsa.levels.length ? GameData.COURSES.dsa : null;
      for (const lang of Lang.ORDER.concat(COURSE ? ['dsa'] : [])) {
        const isCourse = lang === 'dsa';
        const L = isCourse ? { badge: 'DSA', label: COURSE.title, blurb: COURSE.blurb, hello: 'binary_search(items, target)' } : LANGS[lang];
        const s = this.readSlot(lang);
        const ready = isCourse || GameData.hasContent(lang);
        const card = document.createElement('div');
        card.className = 'slot lang-slot' + (isCourse ? ' course-slot' : '') + (s ? '' : ' empty');
        const head = `<div class="slot-lang"><span class="lang-badge">${L.badge}</span><b>${L.label}</b></div>`;
        if (s) {
          const inCh2 = s.chapter === 2 && GameData.CHAPTER2[lang] && s.ch2;
          const lvls = isCourse ? COURSE.levels : inCh2 ? GameData.CHAPTER2[lang].levels : LEVELS;
          const lvl = lvls[inCh2 ? s.ch2.level : s.level] || lvls[0];
          const mins = Math.floor((s.playtime || 0) / 60);
          card.innerHTML = `${head}<canvas width="80" height="90"></canvas>
            <div class="slot-info"><div class="slot-name">${escapeHTML(s.hero.name)}</div>
            <div class="slot-meta">${inCh2 ? 'Chapter 2 · ' : ''}Level ${(inCh2 ? s.ch2.level : s.level) + 1}: ${escapeHTML(lvl.topic)}${isCourse ? ` · in ${LANGS[s.lang].label}` : s.completed && !inCh2 ? ' · Chapter 1 complete' : ''}</div>
            <div class="slot-meta">${mins} min · ${s.bugs || 0} bugs fixed</div></div>
            <div class="slot-btns"><button class="btn primary" data-act="play">Continue</button><button class="btn ghost small" data-act="del">Delete</button></div>`;
          this.drawMini($('canvas', card), s.hero);
        } else {
          card.innerHTML = `${head}<div class="slot-empty-label"><span>${escapeHTML(L.blurb)}</span><code>${escapeHTML(L.hello)}</code></div>
            <button class="btn primary" data-act="new" ${ready ? '' : 'disabled'}>${ready ? 'New Game' : 'Coming soon'}</button>`;
        }
        card.addEventListener('click', (e) => {
          const act = e.target.dataset.act;
          if (!act) return;
          Sound.play('click');
          if (act === 'new') this.showCreator(lang);
          if (act === 'play') this.startGame(lang, s);
          if (act === 'del') {
            this.dialog('Delete save?', `<p>Delete <b>${escapeHTML(s.hero.name)}</b>'s ${L.label} adventure? This can't be undone.</p>`, [{ label: 'Cancel' }, { label: 'Delete', cls: 'danger', fn: () => { try { localStorage.removeItem(KEY(lang)); } catch (er) { /* ignore */ } this.showTitle(); } }]);
          }
        });
        wrap.appendChild(card);
      }
      this.animateTitle();
    }
    drawMini(cv, hero) {
      const c = cv.getContext('2d');
      c.clearRect(0, 0, cv.width, cv.height);
      Art.drawHero(c, cv.width / 2, cv.height - 8, hero, { scale: 1.6, t: 0 });
    }
    animateTitle() {
      const cv = $('#title-canvas'); const c = cv.getContext('2d');
      let t = 0;
      const hero = { skin: Art.SKIN[1], shirt: Art.CLOTH[0], pants: Art.CLOTH[6], hat: 'wizard', hatColor: Art.CLOTH[4], eyes: 'dots' };
      const step = () => {
        if (this.screen !== 'title') return;
        t++;
        c.clearRect(0, 0, cv.width, cv.height);
        c.fillStyle = 'rgba(88,201,106,0.9)'; c.fillRect(0, 96, cv.width, 4);
        const x = (t * 1.2) % (cv.width + 160) - 60;
        Art.drawI(c, x - 34, 96, t, { hop: Math.abs(Math.sin(t * 0.25)) * 4 });
        Art.drawHero(c, x, 96, hero, { t, moving: true, facing: 1 });
        Art.drawBug(c, { x: x + 70, y: 76, w: 22, h: 20, vx: 1, kind: ['syntax', 'name', 'type'][Math.floor(t / 300) % 3], flyer: false, hurt: 0 }, t);
        requestAnimationFrame(step);
      };
      step();
    }

    // ------------------------------------------------------------ character creator
    showCreator(lang) {
      this.creatorSlot = lang;
      this.showScreen('creator');
      const look = this.look = { name: '', skin: Art.SKIN[0], shirt: Art.CLOTH[0], pants: Art.CLOTH[6], hat: 'cap', hatColor: Art.CLOTH[1], eyes: 'dots' };
      const sw = (id, list, key) => {
        const el = $(id); el.innerHTML = '';
        list.forEach(col => {
          const b = document.createElement('button');
          b.className = 'swatch' + (look[key] === col ? ' on' : ''); b.style.background = col; b.title = col;
          b.onclick = () => { look[key] = col; $$('.swatch', el).forEach(x => x.classList.remove('on')); b.classList.add('on'); Sound.play('click'); };
          el.appendChild(b);
        });
      };
      const opts = (id, list, key) => {
        const el = $(id); el.innerHTML = '';
        list.forEach(v => {
          const b = document.createElement('button');
          b.className = 'opt' + (look[key] === v ? ' on' : ''); b.textContent = v;
          b.onclick = () => { look[key] = v; $$('.opt', el).forEach(x => x.classList.remove('on')); b.classList.add('on'); Sound.play('click'); };
          el.appendChild(b);
        });
      };
      const build = () => {
        sw('#cc-skin', Art.SKIN, 'skin'); sw('#cc-shirt', Art.CLOTH, 'shirt'); sw('#cc-pants', Art.CLOTH, 'pants');
        opts('#cc-hat', Art.HATS, 'hat'); sw('#cc-hatcolor', Art.CLOTH, 'hatColor'); opts('#cc-eyes', Art.EYES, 'eyes');
      };
      build();
      $('#cc-name').value = '';
      $('#cc-name').oninput = (e) => { look.name = e.target.value; };
      const isCourse = lang === 'dsa';
      look.lang = isCourse ? 'python' : lang;
      const langPick = () => {
        $('#cc-lang').innerHTML = `<div class="lang-switch">${this.dsaLangs().map(l => `<button class="ls-btn ${l === look.lang ? 'on' : ''}" data-lang="${l}">${LANGS[l].badge} ${LANGS[l].label}</button>`).join('')}</div><span class="muted">Data Structures &amp; Algorithms works in every language. Pick one to start; you can switch later.</span>`;
        $$('#cc-lang .ls-btn').forEach(b => b.onclick = () => { look.lang = b.dataset.lang; Sound.play('click'); langPick(); });
      };
      if (isCourse) langPick();
      else $('#cc-lang').innerHTML = `<span class="lang-badge">${LANGS[lang].badge}</span> <b>${LANGS[lang].label}</b> <span class="muted">(this save file learns ${LANGS[lang].label})</span>`;
      $('#cc-random').onclick = () => {
        const pick = (a) => a[Math.floor(Math.random() * a.length)];
        Object.assign(look, { skin: pick(Art.SKIN), shirt: pick(Art.CLOTH), pants: pick(Art.CLOTH), hat: pick(Art.HATS), hatColor: pick(Art.CLOTH), eyes: pick(Art.EYES) });
        build(); Sound.play('click');
      };
      $('#cc-back').onclick = () => { Sound.play('click'); this.showTitle(); };
      $('#cc-start').onclick = () => {
        const name = (look.name || '').trim().slice(0, 14);
        if (!name) { $('#cc-name').focus(); $('#cc-name').classList.add('shake'); setTimeout(() => $('#cc-name').classList.remove('shake'), 500); return; }
        const hero = { name, skin: look.skin, shirt: look.shirt, pants: look.pants, hat: look.hat, hatColor: look.hatColor, eyes: look.eyes };
        const save = this.newSave(hero, look.lang, isCourse ? 'dsa' : null);
        this.slot = lang; this.save = save; this.persist();
        Sound.play('success');
        this.startGame(lang, save);
      };
      const cv = $('#cc-preview'), c = cv.getContext('2d');
      let t = 0;
      const step = () => {
        if (this.screen !== 'creator') return;
        t++;
        c.clearRect(0, 0, cv.width, cv.height);
        const g = c.createRadialGradient(cv.width / 2, cv.height - 30, 10, cv.width / 2, cv.height - 30, 120);
        g.addColorStop(0, 'rgba(125,249,255,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
        const walking = Math.floor(t / 180) % 2 === 1;
        Art.drawHero(c, cv.width / 2, cv.height - 24, look, { scale: 4, t, moving: walking, facing: Math.floor(t / 360) % 2 ? -1 : 1 });
        c.fillStyle = '#fff'; c.font = 'bold 18px "JetBrains Mono", monospace'; c.textAlign = 'center';
        c.fillText(look.name || '???', cv.width / 2, 30);
        requestAnimationFrame(step);
      };
      step();
      setTimeout(() => $('#cc-name').focus(), 50);
    }

    // ------------------------------------------------------------ game flow
    startGame(slot, save) {
      this.slot = slot; this.save = save;
      this.mapSel = null;
      // migrate older/partial saves
      const fresh = this.newSave(save.hero, save.lang, save.course);
      for (const k of Object.keys(fresh)) if (save[k] === undefined) save[k] = fresh[k];
      save.maxLevel = Math.max(save.maxLevel || 0, save.level || 0);
      if (!save.ch2) save.ch2 = { level: 0, maxLevel: 0, completed: false, checkpoints: {} };
      if (save.chapter === 2 && !this.ch2Unlocked()) save.chapter = 1;
      this.persist();
      this.showMap(false);
    }
    loadLevel(index) {
      const P = this.prog();
      P.level = index;
      P.maxLevel = Math.max(P.maxLevel || 0, index);
      this.showScreen('game');
      this.game.load(index, this.levels()[index]);
      this.updateHUD();
      this.showSign(null);
      const L = this.levels()[index];
      if (!this.save.seenIntro[L.id]) {
        this.save.seenIntro[L.id] = true;
        this.persist();
        this.openTutorial(index);
      } else {
        this.toast(`${escapeHTML(L.name)}`, 'info');
      }
    }
    levelComplete() {
      const LV = this.levels(), P = this.prog();
      const L = LV[P.level];
      const next = P.level + 1;
      Sound.play('success');
      if ((this.chapter() === 2 || this.save.course) && next >= LV.length) { this.chapter2Complete(); return; }
      let extra = '';
      if (L.grantsSkills && !this.save.spUnlocked) {
        this.save.spUnlocked = true; this.save.sp += 2;
        extra = '<div class="unlock"><b>SKILL POINTS UNLOCKED!</b> <br>You earned <b>2 SP</b>. Spend them at a Skill Shrine or press <b>K</b> anytime.<br>Next stop: the <b>open world</b>.</div>';
      }
      delete P.checkpoints[P.level];
      P.level = Math.min(next, LV.length - 1);
      P.maxLevel = Math.max(P.maxLevel || 0, P.level);
      if (this.chapter() === 1) this.save.checkpoint = null;
      this.persist();
      const nextL = LV[P.level];
      this.dialog(`Level ${LV.indexOf(L) + 1} complete!`, `<p class="big-check">✔</p><p><b>${escapeHTML(L.topic)}</b>: ${escapeHTML(L.name)} cleared.</p>${extra}<p class="muted">Up next: <b>Level ${P.level + 1} · ${escapeHTML(nextL.topic)}</b></p>`,
        [{ label: 'Map', fn: () => this.showMap(false) }, { label: 'Next level ▶', cls: 'primary', fn: () => this.loadLevel(P.level) }], { noClose: true });
    }
    chapter2Complete() {
      const P = this.prog(), def = this.save.course ? GameData.COURSES[this.save.course] : GameData.CHAPTER2[this.save.lang];
      const first = !P.completed;
      P.completed = true;
      delete P.checkpoints[P.level];
      if (first) this.save.sp += 3;
      this.persist();
      Sound.play('victory');
      this.dialog(`${escapeHTML(def.title)} complete!`, `<p class="big-check">✔</p><p>You finished ${this.save.course ? `<b>${escapeHTML(def.title)}</b>` : `<b>Chapter 2</b> of ${LANGS[this.save.lang].label}`}: ${def.levels.map(l => '<b>' + escapeHTML(l.topic) + '</b>').join(', ')}.</p>${def.outro ? `<p>${def.outro}</p>` : ''}<p class="muted">${first ? '+3 SP bonus. ' : ''}You can replay any level from the map.</p>`,
        [{ label: 'Title screen', fn: () => this.showTitle() }, { label: 'Map', cls: 'primary', fn: () => this.showMap(false) }], { noClose: true, wide: true });
    }
    victory() {
      Sound.play('victory');
      const firstWin = !this.save.completed;
      this.save.completed = true;
      delete this.save.checkpoints[this.save.level];
      this.save.level = WORLD_INDEX;
      this.save.checkpoint = null;
      if (firstWin) this.save.sp += 3;
      this.persist();
      const s = this.save;
      const mins = Math.floor((s.playtime || 0) / 60);
      const lang = LANGS[s.lang];
      this.dialog('Segfault is defeated!', `
        <p>With one last blast of compiled code, the Bug King dissolves into harmless comments. Syntaxia is <b>bug-free</b>... for now.</p>
        <div class="credits">
          <div><span>Hero</span><b>${escapeHTML(s.hero.name)}</b></div>
          <div><span>Language</span><b>${lang.label}</b></div>
          <div><span>Bugs squashed</span><b>${s.bugs}</b></div>
          <div><span>Terminals solved</span><b>${Object.keys(s.solved).length}</b></div>
          <div><span>Companions</span><b>i${s.pet ? ', ' + escapeHTML(s.pet.name) : ''}</b></div>
          <div><span>Weapon</span><b>${s.weapon ? escapeHTML(s.weapon.name) : 'None (pure code!)'}</b></div>
          <div><span>Time</span><b>${mins} min</b></div>
        </div>
        <p>You learned: <b>print</b>, <b>variables</b>, <b>if/else</b>, <b>loops</b>, <b>functions</b>, <b>classes</b>, <b>lists</b>, <b>strings</b> and <b>dictionaries</b>.</p>
        ${GameData.CHAPTER2[s.lang] ? `<div class="unlock"><b>CHAPTER 2 UNLOCKED:</b> ${escapeHTML(GameData.CHAPTER2[s.lang].title)}<br>${escapeHTML(GameData.CHAPTER2[s.lang].blurb)}<br>Open the map and pick the <b>Chapter 2</b> tab.</div>` : ''}
        <p class="muted">${firstWin ? '+3 SP bonus. ' : ''}Return to the Wilds to finish any side quests.</p>`,
        [{ label: 'Title screen', fn: () => this.showTitle() }, { label: 'Map', fn: () => this.showMap(false) }, { label: 'Return to the Wilds', cls: 'primary', fn: () => this.loadLevel(WORLD_INDEX) }], { noClose: true, wide: true });
    }
    // ------------------------------------------------------------ level map
    // Where "Continue" takes you: the furthest level you've unlocked (or the Wilds once the game is beaten).
    frontier(ch) {
      ch = ch || this.chapter();
      const LV = this.levelsOf(ch), P = this.progOf(ch);
      if (ch === 2 || this.save.course) return P.completed ? LV.length - 1 : Math.min(P.maxLevel || 0, LV.length - 1);
      return this.save.completed ? WORLD_INDEX : Math.min(this.save.maxLevel || 0, LEVELS.length - 1);
    }
    levelDone(i, ch) {
      ch = ch || this.chapter();
      const LV = this.levelsOf(ch), P = this.progOf(ch);
      if (ch === 2 || this.save.course) return !!P.completed || i < (P.maxLevel || 0);
      return LV[i].boss ? !!this.save.completed : i < (this.save.maxLevel || 0);
    }
    showMap(fromGame) {
      if (this.screen === 'game' && this.game.running) this.persist();
      this.mapFromGame = !!fromGame && !!this.game.tiles;
      this.game.running = false;
      this.mapCh = this.chapter();
      this.mapSel = this.frontier(this.mapCh);
      this.showScreen('map');
      this.renderMap();
    }
    // The map shows any chapter and any level, even locked ones, so you can see what's coming.
    // Only unlocked levels can be played.
    renderMap() {
      const s = this.save, ch = this.mapCh || this.chapter(), LV = this.levelsOf(ch), P = this.progOf(ch);
      const open = this.chUnlocked(ch);
      const max = open ? (P.maxLevel || 0) : -1, front = open ? this.frontier(ch) : -1;
      if (this.mapSel === null || this.mapSel === undefined || this.mapSel >= LV.length) this.mapSel = Math.max(0, front);
      $('#map-back').classList.toggle('hidden', !this.mapFromGame);
      $('#map-lang').textContent = LANGS[s.lang].label;
      // chapter tabs: every chapter can be opened; locked ones are a preview
      const def2 = GameData.CHAPTER2[s.lang];
      const course = s.course && GameData.COURSES[s.course];
      $('#map-tabs').innerHTML = course ? `<button class="map-tab on" data-ch="1">${escapeHTML(course.title)}<small>Any language</small></button>${this.langSwitchHTML()}` : `<button class="map-tab ${ch === 1 ? 'on' : ''}" data-ch="1">Chapter 1<small>${escapeHTML(LANGS[s.lang].label)} basics</small></button>` +
        (def2 ? `<button class="map-tab ${ch === 2 ? 'on' : ''} ${this.ch2Unlocked() ? '' : 'locked'}" data-ch="2">Chapter 2<small>${escapeHTML(def2.title)}</small></button>` : '');
      this.bindLangSwitch($('#map-tabs'), () => this.renderMap());
      $$('#map-tabs .map-tab').forEach(b => b.onclick = () => {
        const want = +b.dataset.ch;
        Sound.play('click');
        if (want === ch) return;
        this.mapCh = want;
        this.mapSel = this.chUnlocked(want) ? this.frontier(want) : 0;
        this.renderMap();
      });
      // this language's board for this chapter: its own scenery, colours and route
      const board = MapArt.board(s.course || s.lang, ch, LV.length);
      const pts = board.pts;
      const brd = $('#map-board');
      brd.className = 'map-board' + (open ? '' : ' preview');
      brd.style.background = board.bg;
      let svg = board.back;
      LV.forEach((L, i) => { const [x, y] = pts[i]; svg += board.pin ? board.pin(x, y) : `<ellipse cx="${x}" cy="${y + 8}" rx="100" ry="66" fill="${board.region(i)}" opacity="0.45"/>`; });
      for (let i = 0; i < LV.length - 1; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
        const cx = (x1 + x2) / 2 + (y2 - y1) * 0.25, cy = (y1 + y2) / 2 - (x2 - x1) * 0.25;
        const walked = i + 1 <= max;
        svg += `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" class="map-path ${walked ? 'walked' : ''}" style="stroke:${walked ? board.walked : board.path}"/>`;
      }
      const nodes = LV.map((L, i) => {
        const [x, y] = pts[i];
        const unlocked = i <= max, done = open && this.levelDone(i, ch);
        const cls = ['map-node', unlocked ? '' : 'locked', done ? 'done' : '', i === front ? 'current' : '', i === this.mapSel ? 'sel' : ''].join(' ');
        return `<button class="${cls}" data-i="${i}" style="left:${x / 10}%;top:${y / 5.6}%">
          <span class="mn-dot">${i + 1}</span>
          <span class="mn-label">${escapeHTML(L.topic)}</span>${MiniBoss.has(L.id) ? `<span class="mn-mini" title="Miniboss: ${escapeHTML(MiniBoss.DEFS[L.id].name)}">BOSS</span>` : ''}</button>`;
      }).join('');
      const banner = open ? '' : `<div class="map-preview">Preview · ${ch === 2 ? 'defeat <b>Segfault</b> at the end of Chapter 1 to unlock this chapter' : 'locked'}</div>`;
      brd.innerHTML = `<svg viewBox="0 0 1000 560" preserveAspectRatio="none">${svg}</svg>${nodes}
        ${open ? `<canvas id="map-hero" width="60" height="70" style="left:${pts[front][0] / 10}%;top:${pts[front][1] / 5.6}%"></canvas>` : ''}
        <div class="map-ch-label">${escapeHTML(ch === 2 && def2 ? def2.title : board.name)}</div>${banner}`;
      if (open) Art.drawHero($('#map-hero').getContext('2d'), 30, 66, s.hero, { scale: 1.3, t: 0 });
      $$('#map-board .map-node').forEach(b => b.onclick = () => {
        Sound.play('click');
        this.mapSel = +b.dataset.i; this.renderMap();
      });
      // selected level panel: what the level teaches and its terminals, playable or not
      const i = this.mapSel, L = LV[i];
      const locked = i > max, done = open && this.levelDone(i, ch);
      const why = !open ? (ch === 2 ? 'Defeat Segfault in Chapter 1 to unlock' : 'Locked') : `Finish ${i > 0 ? LV[i - 1].topic : 'the previous level'} to unlock`;
      const label = locked ? 'Locked' : i === front && !done ? (L.terminals.some(id => s.solved[id] !== undefined) || P.checkpoints[i] ? 'Continue ▶' : 'Start ▶') : done ? '↺ Replay' : 'Play ▶';
      const terms = L.terminals.map(id => {
        const t = CH[id]; const solved = s.solved[id] !== undefined;
        return `<span class="mp-term ${solved ? 'solved' : ''}">${solved ? '✔ ' : ''}${escapeHTML(t.title.replace(/^Side Quest — /, ''))}</span>`;
      }).join('');
      $('#map-panel').innerHTML = `
        <div><div class="mp-kicker">${course ? '' : `Chapter ${ch} · `}Level ${i + 1}${locked ? ' · locked' : done ? ' · ✔ complete' : i === front ? ' · you are here' : ''}</div>
        <div class="mp-title">${escapeHTML(L.topic)}</div>
        <div class="mp-sub">${L.name !== L.topic ? escapeHTML(L.name) + ': ' : ''}${escapeHTML(L.blurb)}</div>
        <div class="mp-terms">${terms}</div>
        ${MiniBoss.has(L.id) ? `<div class="mp-mini">Miniboss at the end: <b>${escapeHTML(MiniBoss.DEFS[L.id].name)}</b>${s.minis && s.minis[L.id] ? ' (beaten)' : ''}</div>` : ''}
        ${locked ? `<div class="mp-why">${escapeHTML(why)}. You can still read the tutorial.</div>` : ''}</div>
        <div class="mp-btns"><button class="btn" id="mp-tut">${locked ? 'Preview tutorial' : 'Tutorial'}</button><button class="btn primary big" id="mp-go" ${locked ? `disabled title="${escapeHTML(why)}"` : ''}>${label}</button></div>`;
      $('#mp-go').onclick = () => { if (locked) return; Sound.play('click'); this.save.chapter = ch; this.loadLevel(i); };
      $('#mp-tut').onclick = () => { Sound.play('click'); this.openTutorial(i, 0, ch); };
    }

    onBit() {
      const n = this.save.bitsCollected;
      if (n % 20 === 0) {
        if (this.save.spUnlocked) { this.save.sp += 1; this.toast(`${n} data bits collected: <b>+1 skill point!</b>`, 'good'); }
        else this.toast(`${n} data bits collected. Once skill points unlock, every 20 bits earns one.`, 'info');
      }
      this.updateHUD();
    }
    onMiniDefeated(d) {
      const L = this.game.L;
      if (!this.save.minis) this.save.minis = {};
      const first = !this.save.minis[L.id];
      this.save.minis[L.id] = true;
      if (first && this.save.spUnlocked) { this.save.sp += 1; this.toast(`<b>${escapeHTML(d.name)}</b> is beaten. +1 skill point, and the portal is open.`, 'good'); }
      else this.toast(`<b>${escapeHTML(d.name)}</b> is beaten. The portal is open.`, 'good');
      Sound.play('success');
      this.persist();
      this.updateHUD();
    }
    onBugSquashed() {
      this.save.bugs = (this.save.bugs || 0) + 1;
      if (this.save.spUnlocked && this.save.bugs % 3 === 0) { this.save.sp += 1; this.toast('3 bugs squashed: <b>+1 skill point!</b>', 'good'); }
      this.updateHUD();
    }
    applyGlitch(kind) {
      if (!this.save.glitches) this.save.glitches = {};
      if (this.save.glitches[kind]) return;
      const i = Math.floor(Math.random() * SNIPPETS[kind][this.save.lang].length);
      this.save.glitches[kind] = { i };
      const G = GLITCHES[kind];
      Sound.play('glitch');
      this.toast(`A bug corrupted your code! <b>${G.name}</b>: ${G.effect.toLowerCase()}. Press <b>Q</b> to debug.`, 'bad');
      this.updateHUD();
      this.persist();
    }
    cannonCorrupted() { return !!(this.save && this.save.cannonCorrupt); }
    corruptCannon() {
      const lang = this.save.lang;
      const cur = this.codeStore(lang).cannon || CH.cannon.starter[lang];
      this.codeStore(lang).cannon = corruptCode(cur, lang);
      this.save.cannonCorrupt = true;
      Sound.play('glitch');
      this.toast('Segfault <b>corrupted your cannon code</b>! Open the terminal and debug it.', 'bad');
    }

    // ------------------------------------------------------------ HUD
    updateHUD() {
      if (!this.save || !this.game.player) return;
      const g = this.game, s = this.save;
      const hp = Math.max(0, g.player.hp), max = g.maxHp;
      let hearts = '';
      for (let i = 0; i < max; i++) hearts += `<span class="heart ${i < hp ? '' : 'empty'}">♥</span>`;
      $('#hud-hearts').innerHTML = hearts;
      const L = this.levels()[this.prog().level];
      const done = L.terminals.filter(id => s.solved[id] !== undefined).length;
      $('#hud-level').innerHTML = `<button class="topic-chip" data-act="map" title="Level map (M)"><span class="tc-ch">${this.chapter() === 2 ? 'CH2 · ' : ''}LV ${this.prog().level + 1}</span><span class="tc-topic">${escapeHTML(L.topic)}</span>${L.boss ? '' : `<span class="tc-prog">${done}/${L.terminals.length}</span>`}<span class="tc-map">MAP</span></button>`;
      const extras = [];
      if (s.spUnlocked) extras.push(`<button class="chip sp" data-act="skills">${s.sp} SP <kbd>K</kbd></button>`);
      if (L.openWorld) extras.push(`<span class="chip">Cores ${g.coreCount()}/3</span>`);
      extras.push(`<span class="chip">Bugs ${s.bugs || 0}</span>`);
      extras.push(`<span class="chip" title="Data bits: every 20 earn a skill point">Bits ${s.bitsCollected || 0}</span>`);
      $('#hud-extra').innerHTML = extras.join('');
      const gl = Object.keys(s.glitches || {});
      $('#hud-glitches').innerHTML = gl.map(k => `<button class="chip glitch" data-act="debug" style="--c:${GLITCHES[k].color}">${GLITCHES[k].name} <small>${GLITCHES[k].effect}</small></button>`).join('') + (gl.length ? '<span class="chip hint">press <kbd>Q</kbd> to debug</span>' : '');
      $$('#hud [data-act]').forEach(b => b.onclick = () => { if (b.dataset.act === 'skills') this.openSkills(); else if (b.dataset.act === 'map') this.showMap(true); else this.openDebugger(); });
      // variables panel
      const vars = Object.entries(s.vars);
      const comp = [];
      if (s.foundI) comp.push('<span class="comp">i</span>');
      if (s.pet) comp.push(`<span class="comp">${escapeHTML(s.pet.name)}</span>`);
      if (s.weapon) comp.push(`<span class="comp">${escapeHTML(s.weapon.name)} <small>dmg ${s.weapon.damage + (s.skills.sharp || 0)}</small></span>`);
      $('#hud-vars').innerHTML = (vars.length ? `<div class="vars-title">Variables</div>` + vars.map(([k, v]) => `<div class="var"><span class="vn">${escapeHTML(this.save.lang === 'javascript' ? CodeRunner.camel(k) : k)}</span> = <span class="vv">${escapeHTML(JSON.stringify(v))}</span></div>`).join('') : '') + (comp.length ? `<div class="comps">${comp.join('')}</div>` : '');
      $('#hud-vars').classList.toggle('hidden', !vars.length && !comp.length);
    }
    showSign(text) {
      const el = $('#sign');
      if (!text) { el.classList.add('hidden'); return; }
      el.innerHTML = escapeHTML(text);
      el.classList.remove('hidden');
    }
    toast(html, kind) {
      const el = document.createElement('div');
      el.className = 'toast ' + (kind || 'info');
      el.innerHTML = html;
      $('#toasts').appendChild(el);
      while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove();
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 4800);
    }

    // ------------------------------------------------------------ generic modal
    dialog(title, html, buttons, opt) {
      opt = opt || {};
      buttons = buttons || [{ label: 'OK', cls: 'primary' }];
      const m = $('#modal');
      $('#modal-panel').className = 'panel' + (opt.wide ? ' wide' : '');
      $('#modal-title').innerHTML = title;
      $('#modal-body').innerHTML = html;
      const bar = $('#modal-btns');
      bar.innerHTML = '';
      const close = (fn) => {
        m.classList.add('hidden');
        this.modalOpen = false;
        this.setFrozen();
        document.removeEventListener('keydown', onKey, true);
        if (fn) fn();
      };
      this.closeModal = () => close();
      buttons.forEach((b, i) => {
        const el = document.createElement('button');
        el.className = 'btn ' + (b.cls || '');
        el.innerHTML = b.label;
        el.onclick = () => { Sound.play('click'); if (b.keepOpen) { b.fn && b.fn(); return; } close(b.fn); };
        bar.appendChild(el);
        if (i === buttons.length - 1) setTimeout(() => el.focus(), 30);
      });
      const onKey = (e) => {
        if (e.key === 'Escape' && !opt.noClose) { e.preventDefault(); e.stopPropagation(); close(buttons.length === 1 ? buttons[0].fn : null); }
      };
      document.addEventListener('keydown', onKey, true);
      m.classList.remove('hidden');
      this.modalOpen = true;
      this.setFrozen();
      if (opt.onOpen) opt.onOpen($('#modal-body'));
    }

    // languages a course save can switch between: the game's playable languages that the course has content for
    dsaLangs() {
      const course = GameData.COURSES[(this.save && this.save.course) || 'dsa'];
      const has = (l) => !course || course.levels.every(L => L.terminals.every(id => GameData.CH[id].starter[l]));
      return Lang.ORDER.filter(l => GameData.hasContent(l) && has(l));
    }
    langSwitchHTML() {
      const s = this.save;
      return `<div class="lang-switch">${this.dsaLangs().map(l => `<button class="ls-btn ${l === s.lang ? 'on' : ''}" data-lang="${l}" title="Code in ${LANGS[l].label}">${LANGS[l].badge}</button>`).join('')}</div>`;
    }
    bindLangSwitch(root, after) {
      $$('.lang-switch .ls-btn', root).forEach(b => b.onclick = (e) => { e.stopPropagation(); this.switchLanguage(b.dataset.lang); if (after) after(); });
    }
    // only course saves (DSA) can change language; code is stored per language
    switchLanguage(lang) {
      const s = this.save;
      if (!s || !s.course || !this.dsaLangs().includes(lang) || lang === s.lang) return;
      if (this.editorOpen) this.closeEditor();
      s.lang = lang;
      s.glitches = {};
      this.persist();
      Sound.play('click');
      this.toast(`Now coding in <b>${LANGS[lang].label}</b>.`, 'info');
      if ($('#map-lang')) $('#map-lang').textContent = LANGS[lang].label;
      this.updateHUD();
    }
    pause() {
      const s = this.save;
      this.dialog('Paused', `
        <div class="pause-grid">
          <div><h4>Language</h4>${s.course ? `<p class="muted">This course works in every language. Switch any time; your code is kept for each one.</p>${this.langSwitchHTML()}` : `<p><span class="lang-badge">${LANGS[s.lang].badge}</span> <b>${LANGS[s.lang].label}</b></p><p class="muted">Each save file learns one language. To try another, pick its save file on the title screen.</p>`}</div>
          <div><h4>Controls</h4><table class="keys">
            <tr><td><kbd>←</kbd><kbd>→</kbd> / <kbd>A</kbd><kbd>D</kbd></td><td>Move</td></tr>
            <tr><td><kbd>Space</kbd> / <kbd>W</kbd> / <kbd>↑</kbd></td><td>Jump</td></tr>
            <tr><td><kbd>↓</kbd> / <kbd>S</kbd></td><td>Drop through platforms</td></tr>
            <tr><td><kbd>E</kbd></td><td>Use terminal / shrine</td></tr>
            <tr><td><kbd>X</kbd> / <kbd>J</kbd></td><td>Attack (with a weapon)</td></tr>
            <tr><td><kbd>Q</kbd></td><td>Debugger (fix glitches)</td></tr>
            <tr><td><kbd>K</kbd></td><td>Skills</td></tr>
            <tr><td><kbd>M</kbd></td><td>Level map</td></tr>
            <tr><td><kbd>Ctrl</kbd>+<kbd>Enter</kbd></td><td>Run code</td></tr>
          </table></div>
        </div>`,
        [{ label: Sound.on ? 'Sound on' : 'Sound off', keepOpen: true, fn: () => { Sound.on = !Sound.on; try { localStorage.setItem('codequest.sound', Sound.on ? 'on' : 'off'); } catch (e) { /* ignore */ } $$('#modal-btns .btn')[0].innerHTML = Sound.on ? 'Sound on' : 'Sound off'; } },
          { label: 'Save & quit', fn: () => { this.persist(); this.showTitle(); } },
          { label: 'Map', fn: () => this.showMap(true) },
          { label: 'Resume ▶', cls: 'primary', fn: () => this.persist() }],
        { wide: true });
      if (s.course) this.bindLangSwitch($('#modal'), () => { this.closeModal ? this.closeModal() : null; this.pause(); });
    }

    openSkills(fromShrine) {
      if (!this.save.spUnlocked) { this.toast('Skill points unlock after <b>Classes</b> (Level 6).', 'info'); return; }
      const render = (body) => {
        const s = this.save;
        body.innerHTML = `<p class="sp-big"><b>${s.sp}</b> skill point${s.sp === 1 ? '' : 's'} available</p>
          <p class="muted">Earn more from Core terminals, side quests, and squashing bugs (1 SP per 3).</p>
          <div class="skills">${SKILLS.map(k => {
            const lvl = s.skills[k.id] || 0;
            const maxed = lvl >= k.max;
            const locked = k.id === 'companion' && !s.pet;
            const can = !maxed && !locked && s.sp >= k.cost;
            return `<div class="skill ${maxed ? 'maxed' : ''}">
              <div class="sk-icon">${k.icon}</div>
              <div class="sk-body"><div class="sk-name">${k.name} <span class="sk-lvl">${'●'.repeat(lvl)}${'○'.repeat(k.max - lvl)}</span></div><div class="sk-desc">${k.desc}</div></div>
              <button class="btn small ${can ? 'primary' : ''}" data-skill="${k.id}" ${can ? '' : 'disabled'}>${maxed ? 'MAX' : locked ? 'Need pet' : k.cost + ' SP'}</button></div>`;
          }).join('')}</div>`;
        $$('[data-skill]', body).forEach(b => b.onclick = () => {
          const k = SKILLS.find(x => x.id === b.dataset.skill);
          if (this.save.sp < k.cost) return;
          this.save.sp -= k.cost;
          this.save.skills[k.id] = (this.save.skills[k.id] || 0) + 1;
          if (k.id === 'vitality') this.game.player.hp += 1;
          Sound.play('success');
          this.persist(); this.updateHUD(); render(body);
        });
      };
      this.dialog(fromShrine ? 'Skill Shrine' : 'Skills', '', [{ label: 'Done', cls: 'primary' }], { wide: true, onOpen: render });
    }

    // ------------------------------------------------------------ code editor
    bindEditor() {
      const ta = $('#code'), pre = $('#code-hl'), gutter = $('#gutter');
      const sync = () => {
        pre.innerHTML = highlight(ta.value, this.save ? this.save.lang : 'python');
        const lines = ta.value.split('\n').length;
        let g = ''; for (let i = 1; i <= lines; i++) g += `<div class="${this.ed && this.ed.errLine === i ? 'err' : ''}">${i}</div>`;
        gutter.innerHTML = g;
        scroll();
      };
      const scroll = () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gutter.scrollTop = ta.scrollTop; $('#err-line').style.transform = `translateY(${-ta.scrollTop}px)`; };
      this.syncEditor = sync;
      ta.addEventListener('input', () => { if (this.ed) { this.ed.errLine = null; $('#err-line').classList.add('hidden'); } sync(); });
      ta.addEventListener('scroll', scroll);
      ta.addEventListener('keydown', (e) => {
        const unit = this.save && this.save.lang === 'javascript' ? '  ' : '    ';
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this.runEditor(); return; }
        if (e.key === 'Escape') { e.preventDefault(); this.closeEditor(); return; }
        if (e.key === 'Tab') {
          e.preventDefault();
          const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
          const lineStart = v.lastIndexOf('\n', s - 1) + 1;
          if (e.shiftKey) {
            const line = v.slice(lineStart);
            const m = line.match(new RegExp('^ {1,' + unit.length + '}'));
            if (m) { ta.value = v.slice(0, lineStart) + v.slice(lineStart + m[0].length); ta.selectionStart = ta.selectionEnd = Math.max(lineStart, s - m[0].length); }
          } else if (s !== en && v.slice(s, en).includes('\n')) {
            const block = v.slice(lineStart, en).replace(/^/gm, unit);
            ta.value = v.slice(0, lineStart) + block + v.slice(en);
            ta.selectionStart = lineStart; ta.selectionEnd = lineStart + block.length;
          } else {
            ta.setRangeText(unit, s, en, 'end');
          }
          sync(); return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const s = ta.selectionStart, v = ta.value;
          const lineStart = v.lastIndexOf('\n', s - 1) + 1;
          const line = v.slice(lineStart, s);
          let indent = (line.match(/^\s*/) || [''])[0];
          const trimmed = line.replace(/(#|\/\/).*$/, '').trimEnd();
          if (/[:{[(]$/.test(trimmed)) indent += unit;
          let insert = '\n' + indent;
          // split braces: {|} -> {\n  |\n}
          if (/[{[(]$/.test(trimmed) && /^[}\])]/.test(v.slice(s))) insert += '\n' + indent.slice(unit.length);
          ta.setRangeText(insert, s, ta.selectionEnd, 'end');
          if (insert.split('\n').length > 2) ta.selectionStart = ta.selectionEnd = s + 1 + indent.length;
          sync(); return;
        }
        if (e.key === 'Backspace' && ta.selectionStart === ta.selectionEnd) {
          const s = ta.selectionStart, v = ta.value;
          const lineStart = v.lastIndexOf('\n', s - 1) + 1;
          const before = v.slice(lineStart, s);
          if (before.length && /^ +$/.test(before) && before.length % unit.length === 0) {
            e.preventDefault();
            ta.setRangeText('', s - unit.length, s, 'end'); sync();
          }
        }
        if (e.key === '}' && ta.selectionStart === ta.selectionEnd) {
          const s = ta.selectionStart, v = ta.value;
          const lineStart = v.lastIndexOf('\n', s - 1) + 1;
          const before = v.slice(lineStart, s);
          if (/^ +$/.test(before) && before.length >= unit.length) { e.preventDefault(); ta.setRangeText(before.slice(unit.length) + '}', lineStart, s, 'end'); sync(); }
        }
      });
      $('#ed-run').onclick = () => this.runEditor();
      $('#ed-close').onclick = () => this.closeEditor();
      $('#ed-reset').onclick = () => {
        if (!this.ed) return;
        ta.value = this.defaultCode(); sync(); Sound.play('click');
      };
      $('#ed-hint').onclick = () => this.showHint();
      $('#ed-tut').onclick = () => {
        if (!this.ed) return;
        const li = this.ed.mode === 'terminal' ? this.levels().findIndex(l => l.terminals.includes(this.ed.chId)) : this.prog().level;
        this.openTutorial(li < 0 ? this.prog().level : li, 1);
      };
      $('#tut-prev').onclick = () => { if (this.tut && this.tut.page > 0) { this.tut.code[this.tut.page] = $('#tut-code').value; this.tut.page--; this.renderTutorial(); Sound.play('click'); } };
      $('#tut-next').onclick = () => {
        const T = this.tut; if (!T) return;
        T.code[T.page] = $('#tut-code').value;
        if (T.page < T.pages.length - 1) { T.page++; this.renderTutorial(); Sound.play('click'); } else { Sound.play('success'); this.closeTutorial(); }
      };
      $('#tut-close').onclick = () => this.closeTutorial();
      $('#tut-run').onclick = () => this.runTutorial();
      $('#tut-reset').onclick = () => { const T = this.tut; if (!T) return; delete T.code[T.page]; this.renderTutorial(); };
      $('#tut-code').addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this.runTutorial(); }
        if (e.key === 'Tab') { e.preventDefault(); e.target.setRangeText(this.save.lang === 'javascript' ? '  ' : '    ', e.target.selectionStart, e.target.selectionEnd, 'end'); }
        e.stopPropagation();
      });
      document.addEventListener('keydown', (e) => {
        if (!this.tutOpen || e.target === $('#tut-code')) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.closeTutorial(); }
        if (e.key === 'ArrowRight') $('#tut-next').click();
        if (e.key === 'ArrowLeft') $('#tut-prev').click();
      }, true);
    }
    codeStore(lang) { if (!this.save.code) this.save.code = {}; return this.save.code[lang] || (this.save.code[lang] = {}); }
    codeKey() { const ed = this.ed; return ed.mode === 'debug' ? `glitch:${ed.kind}:${this.save.glitches[ed.kind].i}` : ed.chId; }
    defaultCode() {
      const ed = this.ed, lang = this.save.lang;
      if (ed.mode === 'debug') return SNIPPETS[ed.kind][lang][this.save.glitches[ed.kind].i % SNIPPETS[ed.kind][lang].length].code;
      return CH[ed.chId].starter[lang];
    }
    storeCode() {
      if (!this.ed) return;
      if (this.ed.mode === 'debug' && !(this.save.glitches || {})[this.ed.kind]) return;
      this.codeStore(this.save.lang)[this.codeKey()] = $('#code').value;
      this.persist();
    }
    openTerminal(chId) {
      const ch = CH[chId];
      const req = ch.requires && ch.requires(this.ctx());
      if (req) { Sound.play('error'); this.dialog(ch.title, `<p>${req}</p>`); return; }
      this.ed = { mode: 'terminal', chId, hints: 0 };
      this.openEditorUI();
    }
    openDebugger(kind) {
      const gl = Object.keys(this.save.glitches || {});
      if (!gl.length) { this.toast('Debugger: no glitches. Your code is clean!', 'info'); return; }
      kind = kind && gl.includes(kind) ? kind : gl[0];
      this.ed = { mode: 'debug', kind, hints: 0 };
      this.openEditorUI();
    }
    openEditorUI() {
      this.editorOpen = true;
      this.setFrozen();
      $('#editor').classList.remove('hidden');
      this.renderEditor();
      setTimeout(() => $('#code').focus(), 30);
    }
    renderEditor() {
      const ed = this.ed, lang = this.save.lang, ctx = this.ctx();
      $('#ed-lang').innerHTML = `<span class="lang-badge">${LANGS[lang].badge}</span> ${LANGS[lang].label}`;
      $('#console').innerHTML = '<div class="c-dim">Output will appear here. Press <b>Run</b> or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>.</div>';
      $('#feedback').innerHTML = ''; $('#feedback').className = 'feedback';
      $('#hints').innerHTML = '';
      $('#err-line').classList.add('hidden');
      ed.errLine = null;
      $('#ed-hint').classList.remove('hidden');
      $('#ed-hint').disabled = false;
      $('#ed-hint').innerHTML = 'Hint';
      if (ed.mode === 'terminal') {
        const ch = CH[ed.chId];
        const solved = this.save.solved[ed.chId] !== undefined && !ch.repeatable;
        const LVs = this.levels().some(l => l.terminals.includes(ed.chId)) ? this.levels() : LEVELS;
        const li = LVs.findIndex(l => l.terminals.includes(ed.chId));
        const Lv = LVs[li];
        $('#ed-kicker').textContent = `${LVs === LEVELS ? '' : 'CH2 · '}LEVEL ${li + 1} · ${Lv.topic.toUpperCase()} · TERMINAL ${Lv.terminals.indexOf(ed.chId) + 1}/${Lv.terminals.length}` + (solved ? ' · SOLVED ✔' : '');
        $('#ed-title').textContent = ch.title;
        let html = GameData.descFor(ed.chId, ctx);
        if (solved) html += '<p class="solved-note">✔ Already solved. Experiment all you like, nothing will break.</p>';
        if (ed.chId === 'cannon' && this.save.cannonCorrupt) html += '<p class="corrupt-note">Segfault <b>corrupted</b> this code! Find and fix the error, then fire.</p>';
        $('#ed-desc').innerHTML = html;
        // variables + functions
        const g = this.globalsFor(ch, null, true);
        const varRows = Object.entries(g).map(([k, v]) => `<div class="var"><span class="vn">${escapeHTML(k)}</span> = <span class="vv">${escapeHTML(JSON.stringify(v))}</span></div>`);
        const testNote = ch.tests ? `<div class="muted small">Some of these change for each test.</div>` : '';
        const fnRows = [`<div class="fn"><code>${escapeHTML(Lang.get(lang).print('value'))}</code><span>Shows a value in the output.</span></div>`]
          .concat((ch.api || []).map(n => `<div class="fn"><code>${CodeRunner.fnName(n, lang)}(${FUNC_DOCS[n][0]})</code><span>${FUNC_DOCS[n][1]}</span></div>`));
        $('#ed-side').innerHTML = `<h4>Your variables</h4>${varRows.join('') || '<div class="muted small">none yet</div>'}${testNote}<h4>Functions you can call</h4>${fnRows.join('')}`;
      } else {
        const G = GLITCHES[ed.kind];
        const sn = SNIPPETS[ed.kind][lang][this.save.glitches[ed.kind].i % SNIPPETS[ed.kind][lang].length];
        $('#ed-kicker').textContent = 'DEBUGGER';
        $('#ed-title').innerHTML = `${G.name} glitch`;
        const others = Object.keys(this.save.glitches).filter(k => k !== ed.kind);
        $('#ed-desc').innerHTML = `<p>A <b style="color:${G.color}">${G.name.replace('Error', '')}Bug</b> bit you and scrambled some of your code. Effect: <b>${G.effect}</b>.</p>
          <p>Fix the code so it runs without errors and prints:</p><pre class="expect">${escapeHTML(sn.expect)}</pre>
          ${others.length ? `<p class="muted">Other glitches: ${others.map(k => `<button class="btn small" data-glitch="${k}">${GLITCHES[k].name}</button>`).join(' ')}</p>` : ''}`;
        $$('[data-glitch]').forEach(b => b.onclick = () => { this.storeCode(); this.ed = { mode: 'debug', kind: b.dataset.glitch, hints: 0 }; this.renderEditor(); });
        const eye = this.save.skills.debugger;
        $('#ed-side').innerHTML = `<h4>How to debug</h4><ol class="small"><li>Press <b>Run</b> to see the error.</li><li>Read the error type and the <b>line number</b>.</li><li>Fix that line and run again.</li></ol>` +
          (eye ? `<h4>Debugger's Eye</h4><div class="small">${escapeHTML(sn.hint || { syntax: 'Look for a missing bracket, quote, colon or brace.', name: 'A name is misspelled. Compare it letter by letter, capitals too.', type: 'A value is the wrong type for what the code does with it.' }[ed.kind])}</div>` : '<div class="muted small">Tip: the <b>Debugger\'s Eye</b> skill shows hints here.</div>');
        $('#ed-hint').classList.add('hidden');
      }
      const saved = this.codeStore(lang)[this.codeKey()];
      $('#code').value = saved !== undefined ? saved : this.defaultCode();
      this.syncEditor();
    }
    showHint() {
      const ed = this.ed; if (!ed || ed.mode !== 'terminal') return;
      const ch = CH[ed.chId], lang = this.save.lang;
      const hints = ch.hints[lang], sim = ch.similar && ch.similar[lang];
      const max = hints.length + (sim ? 1 : 0);
      if (ed.hints >= max) return;
      ed.hints++;
      this.renderHints();
      Sound.play('click');
    }
    renderHints() {
      const ed = this.ed, ch = CH[ed.chId], lang = this.save.lang;
      const hints = ch.hints[lang], sim = ch.similar && ch.similar[lang];
      const shown = Math.min(ed.hints, hints.length);
      let html = hints.slice(0, shown).map((h, i) => `<div class="hint"><b>Hint ${i + 1}:</b> ${escapeHTML(h)}</div>`).join('');
      if (sim && ed.hints > hints.length) {
        html += `<div class="hint similar"><b>A similar problem, solved</b><p>${escapeHTML(sim.task)}</p><pre>${highlight(sim.code, lang)}</pre>
          <p class="muted small">Same idea, different problem. Work out how to change it to fit <i>your</i> task.</p></div>`;
      }
      $('#hints').innerHTML = html;
      const max = hints.length + (sim ? 1 : 0);
      const btn = $('#ed-hint');
      btn.disabled = ed.hints >= max;
      btn.innerHTML = ed.hints >= max ? 'No more hints' : ed.hints === hints.length && sim ? 'Similar example' : `Hint ${ed.hints + 1}/${hints.length}`;
    }
    // ------------------------------------------------------------ tutorials
    openTutorial(levelIndex, startPage, ch) {
      ch = ch || this.chapter();
      const L = this.levelsOf(ch)[levelIndex];
      const pages = GameData.tutorialFor(L.id, this.save.lang);
      if (!pages.length) return;
      this.tut = { level: levelIndex, ch, page: startPage || 0, pages, code: {} };
      this.tutOpen = true;
      this.setFrozen();
      $('#tutorial').classList.remove('hidden');
      this.renderTutorial();
    }
    closeTutorial() {
      if (!this.tutOpen) return;
      $('#tutorial').classList.add('hidden');
      this.tutOpen = false;
      this.tut = null;
      this.setFrozen();
      if (this.editorOpen) setTimeout(() => $('#code').focus(), 30);
    }
    renderTutorial() {
      const T = this.tut, lang = this.save.lang, L = this.levelsOf(T.ch || this.chapter())[T.level];
      const p = T.pages[T.page];
      const fill = (h) => GameData.fillTutorial(h, lang);
      $('#tut-kicker').textContent = `Level ${T.level + 1} tutorial · ${L.topic}`;
      $('#tut-title').innerHTML = fill(p.story ? (L.intro.title ? L.intro.title.replace(/^.*?— /, '') : L.name) : p.title);
      $('#tut-dots').innerHTML = T.pages.map((_, i) => `<button class="tdot ${i === T.page ? 'on' : i < T.page ? 'seen' : ''}" data-p="${i}" title="Page ${i + 1}"></button>`).join('');
      $$('#tut-dots .tdot').forEach(b => b.onclick = () => { T.page = +b.dataset.p; this.renderTutorial(); });
      $('#tut-body').innerHTML = p.story ? L.intro[lang] : fill(p.body);
      const hasCode = !!p.code;
      $('#tut-try').classList.toggle('hidden', !hasCode);
      if (hasCode) {
        const key = T.page;
        $('#tut-code').value = T.code[key] !== undefined ? T.code[key] : p.code[lang];
        $('#tut-code').rows = Math.min(12, Math.max(3, $('#tut-code').value.split('\n').length + 1));
        $('#tut-out').innerHTML = '<div class="c-dim">Press ▶ Run to see what this code does.</div>';
      }
      $('#tut-prev').disabled = T.page === 0;
      const last = T.page === T.pages.length - 1;
      $('#tut-next').innerHTML = last ? (this.editorOpen ? 'Back to the terminal ▶' : this.screen === 'map' ? 'Back to the map' : 'Start the level ▶') : 'Next ▶';
      $('#tut-count').textContent = `${T.page + 1} / ${T.pages.length}`;
    }
    async runTutorial() {
      const T = this.tut; if (!T) return;
      const code = $('#tut-code').value;
      T.code[T.page] = code;
      const r = await CodeRunner.run(this.save.lang, code, { globals: {}, api: {} });
      this.playLoop($('#tut-i-stage'), r.loop);
      let html = r.output.slice(0, 100).map(l => `<div class="c-out">${escapeHTML(l) || '&nbsp;'}</div>`).join('');
      if (r.error) html += `<div class="c-err">${r.error.line ? 'Line ' + r.error.line + ': ' : ''}<b>${escapeHTML(r.error.type)}</b>: ${escapeHTML(r.error.message)}</div><div class="c-dim">${explain(r.error, this.save.lang)}</div>`;
      if (!html) html = '<div class="c-dim">(nothing printed)</div>';
      $('#tut-out').innerHTML = html;
      Sound.play(r.error ? 'error' : 'click');
    }
    closeEditor() {
      if (!this.ed) return;
      this.storeCode();
      $('#editor').classList.add('hidden');
      this.editorOpen = false;
      this.ed = null;
      this.setFrozen();
      if (this.pendingEffect) { const f = this.pendingEffect; this.pendingEffect = null; f(); }
      if (this.lastLoop && this.save.foundI && this.game.loopDance) this.game.loopDance(this.lastLoop);
      this.lastLoop = null;
      if (this.loopAnim) { cancelAnimationFrame(this.loopAnim.raf); this.loopAnim = null; }
      $$('.i-stage').forEach(c => c.classList.add('hidden'));
      this.updateHUD();
    }
    globalsFor(ch, test, display) {
      const lang = this.save.lang;
      const g = {};
      const conv = (k) => Lang.varName(k, lang);
      for (const [k, v] of Object.entries(this.save.vars)) g[conv(k)] = v;
      if (ch === CH.guard) g[conv('my_name')] = this.save.hero.name;
      const t = test || (ch && ch.tests ? ch.tests(this.ctx())[0] : null);
      if (t) for (const [k, v] of Object.entries(t.globals)) g[conv(k)] = v;
      return g;
    }
    async runEditor() {
      const ed = this.ed;
      if (!ed || this.running) return;
      const code = $('#code').value;
      this.storeCode();
      const lang = this.save.lang;
      const con = $('#console'), fb = $('#feedback');
      con.innerHTML = '<div class="c-dim">Running...</div>';
      fb.className = 'feedback'; fb.innerHTML = '';
      this.running = true;
      $('#ed-run').disabled = true;
      try {
        if (ed.mode === 'debug') await this.runDebug(code);
        else await this.runTerminal(code);
      } catch (e) {
        con.innerHTML = `<div class="c-err">Internal error: ${escapeHTML(e.message)}</div>`;
        console.error(e);
      } finally {
        this.running = false;
        $('#ed-run').disabled = false;
      }
    }
    showError(err, label) {
      const lang = this.save.lang;
      const con = $('#console');
      const where = err.line ? `Line ${err.line}: ` : '';
      con.innerHTML += `<div class="c-err">${label ? `<span class="c-label">${escapeHTML(label)}</span> ` : ''}${escapeHTML(where)}<b>${escapeHTML(err.type)}</b>: ${escapeHTML(err.message)}</div>`;
      if (err.line) {
        this.ed.errLine = err.line;
        const el = $('#err-line');
        el.style.top = `calc(${(err.line - 1)} * var(--lh) + var(--pad))`;
        el.classList.remove('hidden');
        this.syncEditor();
      }
      const fb = $('#feedback');
      fb.className = 'feedback bad';
      fb.innerHTML = `<b>${escapeHTML(err.type)}</b>: ${explain(err, lang)}`;
      Sound.play('error');
    }
    // The i friend acts out the first for loop of a run: one hop per pass, holding up the loop variable.
    playLoop(canvas, loop) {
      if (this.loopAnim) { cancelAnimationFrame(this.loopAnim.raf); this.loopAnim = null; }
      $$('.i-stage').forEach(c => c.classList.add('hidden'));
      if (!loop || !loop.values.length || !this.save || !this.save.foundI) return;
      canvas.classList.remove('hidden');
      const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
      const vals = loop.values, n = vals.length;
      const per = Math.max(10, Math.min(26, Math.floor(360 / n)));     // frames per pass: long loops go faster
      const box = Math.min(56, Math.max(30, Math.floor((W - 120) / Math.min(n, 10))));
      const show = Math.min(n, Math.floor((W - 120) / box));               // boxes that fit; the row scrolls past the rest
      const A = { t: 0, raf: 0 };
      this.loopAnim = A;
      const total = n * per + 70;
      const step = () => {
        if (this.loopAnim !== A) return;
        A.t++;
        const k = Math.min(n - 1, Math.floor(A.t / per)), f = (A.t % per) / per, done = A.t >= n * per;
        const first = Math.max(0, Math.min(n - show, k - show + 2));
        c.clearRect(0, 0, W, H);
        c.font = 'bold 12px "JetBrains Mono", monospace'; c.textAlign = 'left'; c.fillStyle = 'rgba(207,213,255,.8)';
        c.fillText(`for ${loop.name}`, 10, 18);
        c.fillStyle = 'rgba(207,213,255,.55)'; c.font = '11px "JetBrains Mono", monospace';
        c.fillText(done ? `${loop.total} pass${loop.total === 1 ? '' : 'es'}${loop.total > n ? ` (showing ${n})` : ''}` : `pass ${k + 1}`, 10, 34);
        const x0 = 100, gy = H - 14;
        for (let j = first; j < Math.min(n, first + show); j++) {
          const x = x0 + (j - first) * box;
          const lit = j < k || (j === k && !done) || done;
          c.fillStyle = j === k && !done ? 'rgba(125,249,255,.35)' : lit ? 'rgba(125,249,255,.14)' : 'rgba(255,255,255,.05)';
          c.strokeStyle = j === k && !done ? '#7df9ff' : 'rgba(125,249,255,.35)'; c.lineWidth = 2;
          c.beginPath(); c.roundRect ? c.roundRect(x + 3, gy - 16, box - 6, 18, 4) : c.rect(x + 3, gy - 16, box - 6, 18); c.fill(); c.stroke();
          c.fillStyle = lit ? '#fff' : 'rgba(255,255,255,.35)'; c.textAlign = 'center'; c.font = 'bold 11px "JetBrains Mono", monospace';
          c.fillText(vals[j].length > 6 ? vals[j].slice(0, 5) + '…' : vals[j], x + box / 2, gy - 3);
        }
        // i hops from box to box
        const from = x0 + (Math.max(k, first) - first) * box + box / 2;
        let ix = from, iy = gy - 18, hop = 0, label = `${loop.name} = ${vals[k]}`;
        if (!done) { hop = Math.sin(f * Math.PI) * 18; }
        else { const d = A.t - n * per; hop = Math.abs(Math.sin(d * 0.25)) * 10; label = d < 40 ? 'done!' : label; }
        Art.drawI(c, ix, iy, A.t, { hop, label });
        if (A.t < total) A.raf = requestAnimationFrame(step);
      };
      step();
      Sound.play('click');
    }
    printOutput(lines, label) {
      const con = $('#console');
      if (label) con.innerHTML += `<div class="c-label">▸ ${escapeHTML(label)}</div>`;
      if (!lines.length) con.innerHTML += '<div class="c-dim">(nothing printed)</div>';
      con.innerHTML += lines.slice(0, 200).map(l => `<div class="c-out">${escapeHTML(l) || '&nbsp;'}</div>`).join('');
      con.scrollTop = con.scrollHeight;
    }
    async runTerminal(code) {
      const ed = this.ed, ch = CH[ed.chId], lang = this.save.lang, ctx = this.ctx();
      const req = ch.requires && ch.requires(ctx);
      const con = $('#console'), fb = $('#feedback');
      if (req) { con.innerHTML = ''; fb.className = 'feedback bad'; fb.innerHTML = req; Sound.play('fail'); return; }
      const tests = ch.tests ? ch.tests(ctx) : [{ globals: {} }];
      const runs = []; runs.tests = tests;
      con.innerHTML = '';
      const api = Object.fromEntries((ch.api || []).map(n => [n, true]));
      for (let i = 0; i < tests.length; i++) {
        const t = tests[i];
        const r = await CodeRunner.run(lang, code, { globals: this.globalsFor(ch, t), api, callTests: ch.callTests || [], captureVars: ch.captureVars || [] });
        runs.push(r);
        if (i === 0) { this.playLoop($('#i-stage'), r.loop); this.lastLoop = r.loop; }
        const label = tests.length > 1 ? `Test ${i + 1}: ${t.label}` : null;
        this.printOutput(r.output, label);
        if (r.error) { this.showError(r.error, label); return; }
        const callErr = (r.calls || []).find(c => c.error && c.line);
        void callErr;
      }
      const res = ch.check(runs, ctx, code);
      fb.className = 'feedback ' + (res.ok ? 'good' : 'bad');
      fb.innerHTML = res.msg;
      if (!res.ok) { Sound.play('fail'); return; }
      Sound.play('success');
      const first = this.save.solved[ed.chId] === undefined;
      if (ch.repeatable) {
        if (ed.chId === 'cannon') this.save.cannonCorrupt = false;
        this.pendingEffect = () => ch.effect(this.game, res.data);
        fb.innerHTML += '<div class="closing">Closing terminal...</div>';
        setTimeout(() => { if (this.ed && this.ed.chId === ed.chId) this.closeEditor(); }, 1100);
        return;
      }
      if (!first) { fb.innerHTML += '<div class="muted">(Already solved, but nice work!)</div>'; return; }
      this.save.solved[ed.chId] = res.data === undefined ? true : res.data;
      this.persist();
      this.pendingEffect = () => { ch.effect(this.game, res.data); this.persist(); this.updateHUD(); };
      fb.innerHTML += '<div class="closing">✔ Solved! Closing terminal...</div>';
      setTimeout(() => { if (this.ed && this.ed.chId === ed.chId) this.closeEditor(); }, 1500);
    }
    async runDebug(code) {
      const ed = this.ed, lang = this.save.lang;
      const sn = SNIPPETS[ed.kind][lang][this.save.glitches[ed.kind].i % SNIPPETS[ed.kind][lang].length];
      const con = $('#console'), fb = $('#feedback');
      con.innerHTML = '';
      const r = await CodeRunner.run(lang, code, { globals: {}, api: {} });
      this.printOutput(r.output);
      if (r.error) { this.showError(r.error); return; }
      const got = r.output.join('\n').trim();
      if (got !== sn.expect) {
        fb.className = 'feedback bad';
        fb.innerHTML = `No errors, but it printed <b>${escapeHTML(got || 'nothing')}</b> instead of <b>${escapeHTML(sn.expect)}</b>.`;
        Sound.play('fail');
        return;
      }
      const G = GLITCHES[ed.kind];
      delete this.codeStore(lang)[this.codeKey()];
      delete this.save.glitches[ed.kind];
      this.persist();
      Sound.play('success');
      fb.className = 'feedback good';
      fb.innerHTML = `✔ <b>${G.name} fixed!</b> ${G.effect.replace('disabled', 'restored').replace('reversed', 'back to normal').replace('slowed', 'back to full speed')}.`;
      this.toast(`Glitch fixed: <b>${G.name}</b>`, 'good');
      const remaining = Object.keys(this.save.glitches);
      setTimeout(() => {
        if (!this.ed || this.ed.mode !== 'debug') return;
        if (remaining.length) { this.ed = { mode: 'debug', kind: remaining[0], hints: 0 }; this.renderEditor(); }
        else this.closeEditor();
      }, 1300);
    }

    // ------------------------------------------------------------ touch controls
    bindTouch() {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (!isTouch) return;
      document.body.classList.add('touch');
      $$('#touch [data-k]').forEach(b => {
        const k = b.dataset.k;
        const down = (e) => { e.preventDefault(); Sound.ensure(); if (this.inputBlocked()) return; this.game.virtualKey(k, true); b.classList.add('on'); };
        const up = (e) => { e.preventDefault(); this.game.virtualKey(k, false); b.classList.remove('on'); };
        b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
      });
    }
  }

  window.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
})();
