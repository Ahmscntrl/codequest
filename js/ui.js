/* CodeQuest — menus, save slots, character creator, code editor, HUD, sound. */
(function () {
  'use strict';
  const { LEVELS, XP, BOSS_XP, CH, SKILLS, GLITCHES, SNIPPETS, escapeHTML } = GameData;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const SLOTS = 3;
  const KEY = (n) => `codequest.slot.${n}`;
  const LANGS = { python: { label: 'Python', icon: '🐍' }, javascript: { label: 'JavaScript', icon: '⚡' } };
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
        case 'victory': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.07, null, i * 0.13)); break;
      }
    },
  };

  // ---------------------------------------------------------------- syntax highlighting
  const PY_KW = new Set('and or not if elif else while for in def return class True False None break continue pass is lambda global try except finally raise with as assert import from del'.split(' '));
  const JS_KW = new Set('let const var if else while for of in function return class new this true false null undefined break continue do switch case default typeof instanceof try catch finally throw extends super'.split(' '));
  const BUILTINS = new Set('print len range str int float list dict set tuple abs min max sum round sorted reversed enumerate zip type isinstance console log Math self input'.split(' '));
  function highlight(code, lang) {
    const re = lang === 'python'
      ? /(#.*$)|((?:[fFrRbB]{1,2})?(?:"""[\s\S]*?(?:"""|$(?![\s\S]))|'''[\s\S]*?(?:'''|$(?![\s\S]))|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|([^\S\n]+|\n)|(.)/gm
      : /(\/\/.*$|\/\*[\s\S]*?(?:\*\/|$(?![\s\S])))|(`(?:\\.|[^`\\])*`?|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([^\S\n]+|\n)|(.)/gm;
    const kw = lang === 'python' ? PY_KW : JS_KW;
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
    const t = err.type;
    if (t === 'SyntaxError') {
      if (/never closed|unterminated|missing \)|expected '\)'|missing \) after/i.test(err.message)) return 'Something was opened but never closed — check your brackets ( ) [ ] { } and quotes.';
      if (/expected ':'/.test(err.message)) return 'Lines that start a block (if, for, while, def, class) must end with a colon <code>:</code>';
      return py ? 'Python couldn\'t understand this line. Look for a missing bracket, quote, comma or colon.' : 'JavaScript couldn\'t understand this. Look for missing brackets ( ), braces { }, quotes or commas.';
    }
    if (t === 'IndentationError') return 'Python uses indentation (spaces at the start of a line) to know which lines belong inside an if/for/def. Make sure they line up!';
    if (t === 'NameError' || t === 'ReferenceError') return 'You used a name that doesn\'t exist. Check the spelling — and capital letters matter!' + (py ? '' : ' (Did you declare it with <code>let</code> or <code>const</code>?)');
    if (t === 'TypeError') return py ? 'You used a value in a way its type doesn\'t allow — like adding text and a number. <code>str(5)</code> turns a number into text, <code>int("5")</code> turns text into a number.' : 'You used a value in a way it doesn\'t allow — like calling something that isn\'t a function, reading a property of <code>null</code>, or changing a <code>const</code>.';
    if (t === 'TimeoutError') return 'Your code never finished! A loop that never stops is called an <b>infinite loop</b>. Make sure your loop condition eventually becomes false.';
    if (t === 'ZeroDivisionError') return 'You can\'t divide by zero — not even in Syntaxia.';
    if (t === 'IndexError') return 'You asked for a position that isn\'t in the list. Remember: the first item is at index 0!';
    if (t === 'KeyError') return 'That key isn\'t in the dictionary. Check the spelling.';
    if (t === 'AttributeError') return 'That object doesn\'t have that attribute or method. Check the spelling — or did you forget to set it in <code>__init__</code>?';
    if (t === 'ValueError') return 'The value has the right type but a wrong value, e.g. <code>int("abc")</code>.';
    if (t === 'RecursionError' || t === 'RangeError') return 'A function kept calling itself forever!';
    if (t === 'ImportError') return 'No imports needed here — everything you need is built in.';
    return 'Read the error message carefully — it usually tells you exactly what went wrong.';
  }

  function corruptCode(code, lang) {
    const muts = lang === 'python'
      ? [c => c.replace(/:(\s*(#.*)?)$/m, '$1'), c => c.replace(/\bfire\(/, 'fier('), c => c.replace(/\brange\(/, 'rnage('), c => c.replace(/\(([^()\n]*)\)(\s*:)/, '($1$2'), c => c.replace(/^(\s+)fire/m, 'fire')]
      : [c => c.replace('{', ''), c => c.replace(/\bfire\(/, 'fier('), c => c.replace(/\blet\b/, 'lett'), c => c.replace(/\)\s*\{/, ' {'), c => c.replace(/\bfor\b/, 'fro')];
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
      $('#map-langbtn').onclick = () => { Sound.play('click'); this.save.lang = this.save.lang === 'python' ? 'javascript' : 'python'; this.persist(); this.renderMap(); };
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
    inputBlocked() { return this.screen !== 'game' || this.modalOpen || this.editorOpen; }
    setFrozen() { this.game.frozen = this.inputBlocked(); if (this.game.frozen) this.game.clearKeys(); }
    ctx() { return { lang: this.save.lang, save: this.save, vars: this.save.vars, name: this.save.hero.name, game: this.game }; }

    // ------------------------------------------------------------ persistence
    readSlot(n) { try { const s = localStorage.getItem(KEY(n)); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
    persist() {
      if (!this.save) return;
      this.save.updated = Date.now();
      try { localStorage.setItem(KEY(this.slot), JSON.stringify(this.save)); } catch (e) { /* storage may be unavailable */ }
    }
    newSave(hero, lang) {
      return { v: 1, created: Date.now(), updated: Date.now(), playtime: 0, hero, lang, level: 0, maxLevel: 0, solved: {}, code: { python: {}, javascript: {} }, vars: {}, taken: {}, pickupValues: {}, foundI: false, weapon: null, pet: null, sp: 0, spUnlocked: false, skills: {}, bugs: 0, glitches: {}, checkpoint: null, checkpoints: {}, completed: false, seenIntro: {}, cannonCorrupt: false };
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
      const wrap = $('#slots');
      wrap.innerHTML = '';
      for (let n = 1; n <= SLOTS; n++) {
        const s = this.readSlot(n);
        const card = document.createElement('div');
        card.className = 'slot' + (s ? '' : ' empty');
        if (s) {
          const lvl = LEVELS[s.level] || LEVELS[0];
          const mins = Math.floor((s.playtime || 0) / 60);
          card.innerHTML = `<canvas width="80" height="90"></canvas>
            <div class="slot-info"><div class="slot-name">${escapeHTML(s.hero.name)} ${s.completed ? '👑' : ''}</div>
            <div class="slot-meta">${LANGS[s.lang].icon} ${LANGS[s.lang].label}</div>
            <div class="slot-meta">📍 ${escapeHTML(lvl.name)}</div>
            <div class="slot-meta">⏱ ${mins} min · 🐛 ${s.bugs || 0}</div></div>
            <div class="slot-btns"><button class="btn primary" data-act="play">Continue</button><button class="btn ghost small" data-act="del">Delete</button></div>`;
          const cv = $('canvas', card);
          this.drawMini(cv, s.hero);
        } else {
          card.innerHTML = `<div class="slot-empty-label">Slot ${n}<br><span>— empty —</span></div><button class="btn primary" data-act="new">New Game</button>`;
        }
        card.addEventListener('click', (e) => {
          const act = e.target.dataset.act;
          if (!act) return;
          Sound.play('click');
          if (act === 'new') this.showCreator(n);
          if (act === 'play') this.startGame(n, s);
          if (act === 'del') {
            this.dialog('Delete save?', `<p>Delete <b>${escapeHTML(s.hero.name)}</b>'s adventure in slot ${n}? This can't be undone.</p>`, [{ label: 'Cancel' }, { label: 'Delete', cls: 'danger', fn: () => { try { localStorage.removeItem(KEY(n)); } catch (er) { /* ignore */ } this.showTitle(); } }]);
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
    showCreator(slot) {
      this.creatorSlot = slot;
      this.showScreen('creator');
      const look = this.look = { name: '', skin: Art.SKIN[0], shirt: Art.CLOTH[0], pants: Art.CLOTH[6], hat: 'cap', hatColor: Art.CLOTH[1], eyes: 'dots' };
      let lang = 'python';
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
      $$('.lang-card').forEach(card => {
        card.classList.toggle('on', card.dataset.lang === lang);
        card.onclick = () => { lang = card.dataset.lang; $$('.lang-card').forEach(c => c.classList.toggle('on', c === card)); Sound.play('click'); };
      });
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
        const save = this.newSave(hero, lang);
        this.slot = slot; this.save = save; this.persist();
        Sound.play('success');
        this.startGame(slot, save);
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
      this.mapOpen = null;
      // migrate older/partial saves
      const fresh = this.newSave(save.hero, save.lang);
      for (const k of Object.keys(fresh)) if (save[k] === undefined) save[k] = fresh[k];
      save.maxLevel = Math.max(save.maxLevel || 0, save.level || 0);
      this.persist();
      this.showMap(false);
    }
    loadLevel(index) {
      this.save.level = index;
      this.save.maxLevel = Math.max(this.save.maxLevel || 0, index);
      this.showScreen('game');
      this.game.load(index);
      this.updateHUD();
      this.showSign(null);
      const L = LEVELS[index];
      if (!this.save.seenIntro[L.id]) {
        this.save.seenIntro[L.id] = true;
        this.persist();
        this.dialog(L.intro.title, L.intro[this.save.lang], [{ label: "Let's go! ▶", cls: 'primary' }], { wide: true });
      } else {
        this.toast(`📍 ${escapeHTML(L.name)}`, 'info');
      }
    }
    levelComplete() {
      const L = LEVELS[this.save.level];
      const next = this.save.level + 1;
      Sound.play('success');
      let extra = '';
      if (L.grantsSkills && !this.save.spUnlocked) {
        this.save.spUnlocked = true; this.save.sp += 2;
        extra = '<div class="unlock">✨ <b>SKILL POINTS UNLOCKED!</b> ✨<br>You earned <b>2 SP</b>. Spend them at a Skill Shrine or press <b>K</b> anytime.<br>The <b>open world</b> awaits!</div>';
      }
      const firstClear = next > (this.save.maxLevel || 0);
      delete this.save.checkpoints[this.save.level];
      this.save.level = Math.min(next, LEVELS.length - 1);
      this.save.maxLevel = Math.max(this.save.maxLevel || 0, this.save.level);
      this.save.checkpoint = null;
      this.persist();
      const badge = firstClear ? `<div class="badge-earned"><span>${L.badge[0]}</span><div>Badge earned<br><b>${escapeHTML(L.badge[1])}</b></div></div>` : '';
      const nextL = LEVELS[this.save.level];
      this.dialog(`Chapter ${LEVELS.indexOf(L) + 1} complete!`, `<p class="big-check">✔</p><p><b>${escapeHTML(L.topic)}</b> — ${escapeHTML(L.name)} cleared.</p>${badge}${extra}<p class="muted">Up next: <b>Chapter ${this.save.level + 1} · ${escapeHTML(nextL.topic)}</b></p>`,
        [{ label: '🗺 Quest Map', fn: () => this.showMap(false) }, { label: 'Next chapter ▶', cls: 'primary', fn: () => this.loadLevel(this.save.level) }], { noClose: true });
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
      this.dialog('🏆 Segfault is defeated!', `
        <p>With one last blast of compiled code, the Bug King dissolves into harmless comments. Syntaxia is <b>bug-free</b>... for now.</p>
        <div class="credits">
          <div><span>Hero</span><b>${escapeHTML(s.hero.name)}</b></div>
          <div><span>Language</span><b>${lang.icon} ${lang.label}</b></div>
          <div><span>Bugs squashed</span><b>${s.bugs}</b></div>
          <div><span>Terminals solved</span><b>${Object.keys(s.solved).length}</b></div>
          <div><span>Companions</span><b>i${s.pet ? ', ' + escapeHTML(s.pet.name) : ''}</b></div>
          <div><span>Weapon</span><b>${s.weapon ? escapeHTML(s.weapon.name) : '— (pure code!)'}</b></div>
          <div><span>Time</span><b>${mins} min</b></div>
        </div>
        <p>You learned: <b>print</b>, <b>variables</b>, <b>if/else</b>, <b>loops</b>, <b>functions</b>, <b>classes</b>, <b>lists</b>, <b>strings</b> and <b>dictionaries</b>. That's real programming. 🎉</p>
        <p class="muted">${firstWin ? '+3 SP bonus. ' : ''}Return to the Wilds to finish any side quests.</p>`,
        [{ label: 'Title screen', fn: () => this.showTitle() }, { label: '🗺 Quest Map', fn: () => this.showMap(false) }, { label: 'Return to the Wilds', cls: 'primary', fn: () => this.loadLevel(WORLD_INDEX) }], { noClose: true, wide: true });
    }
    // ------------------------------------------------------------ quest map
    progress() {
      const s = this.save;
      const allTerms = LEVELS.flatMap(l => l.terminals.filter(id => XP[id]));
      const solvedTerms = allTerms.filter(id => s.solved[id] !== undefined);
      const xp = solvedTerms.reduce((t, id) => t + XP[id], 0) + (s.completed ? BOSS_XP : 0);
      const maxXp = allTerms.reduce((t, id) => t + XP[id], 0) + BOSS_XP;
      const chapterDone = (i) => LEVELS[i].boss ? !!s.completed : i < (s.maxLevel || 0);
      const chaptersDone = LEVELS.filter((l, i) => chapterDone(i)).length;
      const lvl = Math.floor(xp / 150) + 1;
      const titles = ['Newbie', 'Script Kid', 'Apprentice', 'Coder', 'Hacker', 'Engineer', 'Wizard', 'Legend'];
      return { xp, maxXp, terms: solvedTerms.length, totalTerms: allTerms.length, chaptersDone, chapterDone, lvl, title: titles[Math.min(lvl - 1, titles.length - 1)], lvlPct: (xp % 150) / 150 };
    }
    showMap(fromGame) {
      if (this.screen === 'game' && this.game.running) this.persist();
      this.mapFromGame = !!fromGame && !!this.game.tiles;
      this.game.running = false;
      this.showScreen('map');
      this.renderMap();
    }
    // Where "Continue" takes you: the furthest chapter you've unlocked (or the Wilds once the game is beaten).
    frontier() { return this.save.completed ? WORLD_INDEX : Math.min(this.save.maxLevel || 0, LEVELS.length - 1); }
    renderMap() {
      const s = this.save, P = this.progress();
      const max = s.maxLevel || 0;
      const front = this.frontier();
      {
        const L = LEVELS[front];
        const nextId = L.terminals.find(id => s.solved[id] === undefined);
        const what = L.boss ? 'Defeat Segfault, the Bug King' : nextId ? CH[nextId].title : (L.openWorld ? 'Explore the Wilds and finish side quests' : 'Reach the exit portal');
        const fresh = !L.terminals.some(id => s.solved[id] !== undefined) && !s.checkpoints[front];
        $('#map-continue').innerHTML = `
          <canvas width="60" height="70"></canvas>
          <div class="mc-text"><div class="mc-kicker">${fresh && front === 0 ? 'Start your quest' : 'Continue where you left off'}</div>
            <div class="mc-title">Chapter ${front + 1} · ${escapeHTML(L.topic)}</div>
            <div class="mc-sub">Next up: <b>${escapeHTML(what)}</b></div></div>
          <button class="btn primary big" id="mc-go">${fresh ? 'Start' : 'Continue'} ▶</button>`;
        Art.drawHero($('#map-continue canvas').getContext('2d'), 30, 66, s.hero, { scale: 1.4, t: 0 });
        $('#mc-go').onclick = () => { Sound.play('click'); this.loadLevel(front); };
      }
      const lang = LANGS[s.lang];
      $('#map-back').classList.toggle('hidden', !this.mapFromGame);
      $('#map-lang').textContent = `${lang.icon} ${lang.label}`;
      const open = this.mapOpen || (this.mapOpen = new Set([front]));
      const rows = (L, i, unlocked) => {
        const items = L.terminals.map((id, k) => ({ id, label: (L.openWorld ? (XP[id] && ['gems', 'decoder', 'fib'].includes(id) ? 'Core' : 'Side quest') : 'Terminal ' + (k + 1)), title: CH[id].title.replace(/^(Core [IV]+|Side Quest) — /, ''), done: s.solved[id] !== undefined }));
        if (L.boss) items.splice(0, items.length, { label: 'Boss', title: 'Defeat Segfault, the Bug King', done: !!s.completed });
        if (L.id === 'loops') items.unshift({ label: 'Secret', title: 'Find your friend i', done: !!s.foundI });
        let nextMarked = false;
        return items.map(it => {
          let st;
          if (!unlocked) st = `<span class="ex-btn locked">???</span>`;
          else if (it.done) st = `<span class="ex-btn done">✔ Done</span>`;
          else if (!nextMarked) { nextMarked = true; st = `<button class="ex-btn next" data-play="${i}">Start</button>`; }
          else st = `<span class="ex-btn todo">○</span>`;
          return `<div class="ex-row ${it.done ? 'is-done' : ''}"><span class="ex-label">${it.label}</span><span class="ex-title">${unlocked ? escapeHTML(it.title) : '???'}</span>${st}</div>`;
        }).join('');
      };
      $('#chapters').innerHTML = LEVELS.map((L, i) => {
        const unlocked = i <= max;
        const done = P.chapterDone(i);
        const current = i === front;
        const isOpen = open.has(i);
        const nDone = L.terminals.filter(id => s.solved[id] !== undefined).length;
        const playLabel = !unlocked ? `🔒 Finish Chapter ${i} to unlock` : i === front && !done ? ((nDone || s.checkpoints[i]) ? 'Continue ▶' : 'Start ▶') : done ? '↺ Replay' : 'Play ▶';
        return `<div class="chapter ${unlocked ? '' : 'locked'} ${done ? 'done' : ''} ${current ? 'current' : ''} ${isOpen ? 'open' : ''}" ${unlocked ? '' : `title="Locked — finish Chapter ${i} first"`}>
          <div class="ch-node">${done ? '✔' : unlocked ? i + 1 : '🔒'}</div>
          <div class="ch-card">
            <button class="ch-head" data-toggle="${i}">
              <span class="ch-titles"><span class="ch-kicker">Chapter ${i + 1}${L.openWorld ? ' · Open world' : L.boss ? ' · Final' : ''}</span><span class="ch-title">${escapeHTML(L.topic)}</span></span>
              ${unlocked && !L.boss ? `<span class="ch-count">${nDone}/${L.terminals.length}</span>` : ''}
              <span class="ch-chev">${isOpen ? '▴' : '▾'}</span>
            </button>
            <div class="ch-body">
              <p class="ch-blurb"><b>${escapeHTML(L.name)}.</b> ${escapeHTML(L.blurb)}</p>
              ${unlocked ? '' : `<p class="ch-locked-note">🔒 This chapter is locked. Finish <b>Chapter ${i}: ${escapeHTML(LEVELS[i - 1].topic)}</b> to unlock it.</p>`}
              <div class="ex-list">${rows(L, i, unlocked)}</div>
              <div class="ch-foot">
                <span class="ch-badge ${done ? 'got' : ''}" title="${escapeHTML(L.badge[1])}">${L.badge[0]} ${done ? escapeHTML(L.badge[1]) : 'Complete to earn a badge'}</span>
                <button class="btn ${unlocked && !done ? 'primary' : ''}" data-play="${i}" ${unlocked ? '' : 'disabled'}>${playLabel}</button>
              </div>
            </div>
          </div>
        </div>`;
      }).join('');
      $$('#chapters [data-toggle]').forEach(b => b.onclick = () => { const i = +b.dataset.toggle; open.has(i) ? open.delete(i) : open.add(i); Sound.play('click'); this.renderMap(); });
      $$('#chapters [data-play]').forEach(b => b.onclick = (e) => { e.stopPropagation(); Sound.play('click'); this.loadLevel(+b.dataset.play); });
      // sidebar
      const bar = (v, m) => `<div class="pbar"><div style="width:${m ? Math.round(100 * v / m) : 0}%"></div></div>`;
      $('#map-side').innerHTML = `
        <div class="side-card hero-card">
          <canvas id="map-hero" width="70" height="80"></canvas>
          <div><div class="hc-name">${escapeHTML(s.hero.name)}</div><div class="hc-lvl">Level ${P.lvl} · ${P.title}</div>${bar(P.lvlPct, 1)}</div>
        </div>
        <div class="side-card">
          <h3>Quest Progress</h3>
          <div class="prog"><span class="pi">🖥️</span><div><div class="pl"><b>Terminals</b><span>${P.terms} / ${P.totalTerms}</span></div>${bar(P.terms, P.totalTerms)}</div></div>
          <div class="prog"><span class="pi">📖</span><div><div class="pl"><b>Chapters</b><span>${P.chaptersDone} / ${LEVELS.length}</span></div>${bar(P.chaptersDone, LEVELS.length)}</div></div>
          <div class="prog"><span class="pi">✨</span><div><div class="pl"><b>XP Earned</b><span>${P.xp} / ${P.maxXp}</span></div>${bar(P.xp, P.maxXp)}</div></div>
        </div>
        <div class="side-card">
          <h3>Badges <span class="muted">${P.chaptersDone} / ${LEVELS.length}</span></h3>
          <p class="muted small">Complete a chapter to earn its badge.</p>
          <div class="badges">${LEVELS.map((L, i) => `<span class="bdg ${P.chapterDone(i) ? 'got' : ''}" title="${escapeHTML(L.badge[1])}${P.chapterDone(i) ? '' : ' (locked)'}">${L.badge[0]}</span>`).join('')}</div>
        </div>
        <div class="side-card">
          <h3>Party & Gear</h3>
          <div class="gear"><span>${s.foundI ? '✔' : '○'}</span> i <span class="muted">— loop companion</span></div>
          <div class="gear"><span>${s.pet ? '✔' : '○'}</span> ${s.pet ? '🐾 ' + escapeHTML(s.pet.name) : 'Pet'} <span class="muted">${s.pet ? '— ' + escapeHTML(s.pet.species) : '— adopt one in Ch. 6'}</span></div>
          <div class="gear"><span>${s.weapon ? '✔' : '○'}</span> ${s.weapon ? '⚔️ ' + escapeHTML(s.weapon.name) : 'Weapon'} <span class="muted">${s.weapon ? '— dmg ' + s.weapon.damage : '— forge one in Ch. 6'}</span></div>
          <div class="gear"><span>⭐</span> ${s.spUnlocked ? `${s.sp} skill points` : '<span class="muted">Skill points unlock in Ch. 6</span>'}</div>
          <div class="gear"><span>🐛</span> ${s.bugs || 0} bugs squashed</div>
        </div>`;
      const c = $('#map-hero').getContext('2d');
      Art.drawHero(c, 35, 74, s.hero, { scale: 1.6, t: 0 });
    }

    onBugSquashed() {
      this.save.bugs = (this.save.bugs || 0) + 1;
      if (this.save.spUnlocked && this.save.bugs % 3 === 0) { this.save.sp += 1; this.toast('🐛 3 bugs squashed: <b>+1 skill point!</b>', 'good'); }
      this.updateHUD();
    }
    applyGlitch(kind) {
      if (!this.save.glitches) this.save.glitches = {};
      if (this.save.glitches[kind]) return;
      const i = Math.floor(Math.random() * SNIPPETS[kind][this.save.lang].length);
      this.save.glitches[kind] = { i };
      const G = GLITCHES[kind];
      Sound.play('glitch');
      this.toast(`${G.icon} A bug corrupted your code! <b>${G.name}</b>: ${G.effect.toLowerCase()}. Press <b>Q</b> to debug.`, 'bad');
      this.updateHUD();
      this.persist();
    }
    cannonCorrupted() { return !!(this.save && this.save.cannonCorrupt); }
    corruptCannon() {
      const lang = this.save.lang;
      const cur = this.save.code[lang].cannon || CH.cannon.starter[lang];
      this.save.code[lang].cannon = corruptCode(cur, lang);
      this.save.cannonCorrupt = true;
      Sound.play('glitch');
      this.toast('☠️ Segfault <b>corrupted your cannon code</b>! Open the terminal and debug it.', 'bad');
    }

    // ------------------------------------------------------------ HUD
    updateHUD() {
      if (!this.save || !this.game.player) return;
      const g = this.game, s = this.save;
      const hp = Math.max(0, g.player.hp), max = g.maxHp;
      let hearts = '';
      for (let i = 0; i < max; i++) hearts += `<span class="heart ${i < hp ? '' : 'empty'}">♥</span>`;
      $('#hud-hearts').innerHTML = hearts;
      const L = LEVELS[s.level];
      const done = L.terminals.filter(id => s.solved[id] !== undefined).length;
      $('#hud-level').innerHTML = `<button class="topic-chip" data-act="map" title="Quest Map (M)"><span class="tc-ch">CH ${s.level + 1}</span><span class="tc-topic">${escapeHTML(L.topic)}</span>${L.boss ? '' : `<span class="tc-prog">${done}/${L.terminals.length}</span>`}<span class="tc-map">🗺</span></button>`;
      const extras = [];
      if (s.spUnlocked) extras.push(`<button class="chip sp" data-act="skills">⭐ ${s.sp} SP <kbd>K</kbd></button>`);
      if (LEVELS[s.level].openWorld) extras.push(`<span class="chip">💠 Cores ${g.coreCount()}/3</span>`);
      extras.push(`<span class="chip">🐛 ${s.bugs || 0}</span>`);
      $('#hud-extra').innerHTML = extras.join('');
      const gl = Object.keys(s.glitches || {});
      $('#hud-glitches').innerHTML = gl.map(k => `<button class="chip glitch" data-act="debug" style="--c:${GLITCHES[k].color}">${GLITCHES[k].icon} ${GLITCHES[k].name} <small>${GLITCHES[k].effect}</small></button>`).join('') + (gl.length ? '<span class="chip hint">press <kbd>Q</kbd> to debug</span>' : '');
      $$('#hud [data-act]').forEach(b => b.onclick = () => { if (b.dataset.act === 'skills') this.openSkills(); else if (b.dataset.act === 'map') this.showMap(true); else this.openDebugger(); });
      // variables panel
      const vars = Object.entries(s.vars);
      const comp = [];
      if (s.foundI) comp.push('<span class="comp">i</span>');
      if (s.pet) comp.push(`<span class="comp">🐾 ${escapeHTML(s.pet.name)}</span>`);
      if (s.weapon) comp.push(`<span class="comp">⚔️ ${escapeHTML(s.weapon.name)} <small>dmg ${s.weapon.damage + (s.skills.sharp || 0)}</small></span>`);
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

    pause() {
      const s = this.save;
      const langBtns = Object.entries(LANGS).map(([k, v]) => `<button class="opt ${s.lang === k ? 'on' : ''}" data-lang="${k}">${v.icon} ${v.label}</button>`).join('');
      this.dialog('Paused', `
        <div class="pause-grid">
          <div><h4>Language</h4><div class="row" id="pause-lang">${langBtns}</div><p class="muted">Switch any time — every terminal works in both.</p></div>
          <div><h4>Controls</h4><table class="keys">
            <tr><td><kbd>←</kbd><kbd>→</kbd> / <kbd>A</kbd><kbd>D</kbd></td><td>Move</td></tr>
            <tr><td><kbd>Space</kbd> / <kbd>W</kbd> / <kbd>↑</kbd></td><td>Jump</td></tr>
            <tr><td><kbd>↓</kbd> / <kbd>S</kbd></td><td>Drop through platforms</td></tr>
            <tr><td><kbd>E</kbd></td><td>Use terminal / shrine</td></tr>
            <tr><td><kbd>X</kbd> / <kbd>J</kbd></td><td>Attack (with a weapon)</td></tr>
            <tr><td><kbd>Q</kbd></td><td>Debugger (fix glitches)</td></tr>
            <tr><td><kbd>K</kbd></td><td>Skills</td></tr>
            <tr><td><kbd>M</kbd></td><td>Quest Map</td></tr>
            <tr><td><kbd>Ctrl</kbd>+<kbd>Enter</kbd></td><td>Run code</td></tr>
          </table></div>
        </div>`,
        [{ label: Sound.on ? '🔊 Sound on' : '🔇 Sound off', keepOpen: true, fn: () => { Sound.on = !Sound.on; try { localStorage.setItem('codequest.sound', Sound.on ? 'on' : 'off'); } catch (e) { /* ignore */ } $$('#modal-btns .btn')[0].innerHTML = Sound.on ? '🔊 Sound on' : '🔇 Sound off'; } },
          { label: 'Save & quit', fn: () => { this.persist(); this.showTitle(); } },
          { label: '🗺 Quest Map', fn: () => this.showMap(true) },
          { label: 'Resume ▶', cls: 'primary', fn: () => this.persist() }],
        {
          wide: true,
          onOpen: (body) => {
            $$('#pause-lang .opt', body).forEach(b => b.onclick = () => {
              this.save.lang = b.dataset.lang;
              $$('#pause-lang .opt', body).forEach(x => x.classList.toggle('on', x === b));
              this.updateHUD(); this.persist(); Sound.play('click');
            });
          },
        });
    }

    openSkills(fromShrine) {
      if (!this.save.spUnlocked) { this.toast('Skill points unlock once you master <b>Classes</b> (Level 6).', 'info'); return; }
      const render = (body) => {
        const s = this.save;
        body.innerHTML = `<p class="sp-big">⭐ <b>${s.sp}</b> skill point${s.sp === 1 ? '' : 's'} available</p>
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
      this.dialog(fromShrine ? '🔷 Skill Shrine' : '⭐ Skills', '', [{ label: 'Done', cls: 'primary' }], { wide: true, onOpen: render });
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
      $('#ed-lang').onchange = (e) => {
        this.storeCode();
        this.save.lang = e.target.value;
        this.persist();
        this.renderEditor();
        this.updateHUD();
      };
    }
    codeKey() { const ed = this.ed; return ed.mode === 'debug' ? `glitch:${ed.kind}:${this.save.glitches[ed.kind].i}` : ed.chId; }
    defaultCode() {
      const ed = this.ed, lang = this.save.lang;
      if (ed.mode === 'debug') return SNIPPETS[ed.kind][lang][this.save.glitches[ed.kind].i % SNIPPETS[ed.kind][lang].length].code;
      return CH[ed.chId].starter[lang];
    }
    storeCode() {
      if (!this.ed) return;
      if (this.ed.mode === 'debug' && !(this.save.glitches || {})[this.ed.kind]) return;
      this.save.code[this.save.lang][this.codeKey()] = $('#code').value;
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
      if (!gl.length) { this.toast('🔍 Debugger: no glitches. Your code is clean!', 'info'); return; }
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
      $('#ed-lang').value = lang;
      $('#ed-lang-icon').textContent = LANGS[lang].icon;
      $('#console').innerHTML = '<div class="c-dim">Output will appear here. Press <b>Run</b> or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>.</div>';
      $('#feedback').innerHTML = ''; $('#feedback').className = 'feedback';
      $('#hints').innerHTML = '';
      $('#err-line').classList.add('hidden');
      ed.errLine = null;
      $('#ed-hint').classList.remove('hidden');
      if (ed.mode === 'terminal') {
        const ch = CH[ed.chId];
        const solved = this.save.solved[ed.chId] !== undefined && !ch.repeatable;
        const li = LEVELS.findIndex(l => l.terminals.includes(ed.chId));
        const Lv = LEVELS[li];
        $('#ed-kicker').textContent = `CH ${li + 1} · ${Lv.topic.toUpperCase()} · TERMINAL ${Lv.terminals.indexOf(ed.chId) + 1}/${Lv.terminals.length}` + (solved ? ' · SOLVED ✔' : '');
        $('#ed-title').textContent = ch.title;
        let html = ch.desc(ctx);
        if (solved) html += '<p class="solved-note">✔ Already solved! Feel free to experiment — nothing will break.</p>';
        if (ed.chId === 'cannon' && this.save.cannonCorrupt) html += '<p class="corrupt-note">☠️ Segfault <b>corrupted</b> this code! Find and fix the error, then fire.</p>';
        $('#ed-desc').innerHTML = html;
        // variables + functions
        const g = this.globalsFor(ch, null, true);
        const varRows = Object.entries(g).map(([k, v]) => `<div class="var"><span class="vn">${escapeHTML(k)}</span> = <span class="vv">${escapeHTML(JSON.stringify(v))}</span></div>`);
        const testNote = ch.tests ? `<div class="muted small">Some of these change for each test.</div>` : '';
        const fnRows = [`<div class="fn"><code>${lang === 'python' ? 'print' : 'console.log'}(value)</code><span>Shows a value in the output.</span></div>`]
          .concat((ch.api || []).map(n => `<div class="fn"><code>${CodeRunner.fnName(n, lang)}(${FUNC_DOCS[n][0]})</code><span>${FUNC_DOCS[n][1]}</span></div>`));
        $('#ed-side').innerHTML = `<h4>Your variables</h4>${varRows.join('') || '<div class="muted small">none yet</div>'}${testNote}<h4>Functions you can call</h4>${fnRows.join('')}`;
      } else {
        const G = GLITCHES[ed.kind];
        const sn = SNIPPETS[ed.kind][lang][this.save.glitches[ed.kind].i % SNIPPETS[ed.kind][lang].length];
        $('#ed-kicker').textContent = 'DEBUGGER';
        $('#ed-title').innerHTML = `${G.icon} ${G.name} glitch`;
        const others = Object.keys(this.save.glitches).filter(k => k !== ed.kind);
        $('#ed-desc').innerHTML = `<p>A <b style="color:${G.color}">${G.name.replace('Error', '')}Bug</b> bit you and scrambled some of your code. Effect: <b>${G.effect}</b>.</p>
          <p>Fix the code so it runs without errors and prints:</p><pre class="expect">${escapeHTML(sn.expect)}</pre>
          ${others.length ? `<p class="muted">Other glitches: ${others.map(k => `<button class="btn small" data-glitch="${k}">${GLITCHES[k].icon} ${GLITCHES[k].name}</button>`).join(' ')}</p>` : ''}`;
        $$('[data-glitch]').forEach(b => b.onclick = () => { this.storeCode(); this.ed = { mode: 'debug', kind: b.dataset.glitch, hints: 0 }; this.renderEditor(); });
        const eye = this.save.skills.debugger;
        $('#ed-side').innerHTML = `<h4>How to debug</h4><ol class="small"><li>Press <b>Run</b> to see the error.</li><li>Read the error type and the <b>line number</b>.</li><li>Fix that line and run again.</li></ol>` +
          (eye ? `<h4>🔍 Debugger's Eye</h4><div class="small">${escapeHTML(sn.hint || { syntax: 'Look for a missing bracket, quote, colon or brace.', name: 'A name is misspelled — compare it letter by letter (capitals too!).', type: 'A value is the wrong type for what the code does with it.' }[ed.kind])}</div>` : '<div class="muted small">Tip: the <b>Debugger\'s Eye</b> skill shows hints here.</div>');
        $('#ed-hint').classList.add('hidden');
      }
      const saved = this.save.code[lang][this.codeKey()];
      $('#code').value = saved !== undefined ? saved : this.defaultCode();
      this.syncEditor();
    }
    showHint() {
      const ed = this.ed; if (!ed || ed.mode !== 'terminal') return;
      const hints = CH[ed.chId].hints[this.save.lang];
      if (ed.hints >= hints.length) return;
      ed.hints++;
      $('#hints').innerHTML = hints.slice(0, ed.hints).map((h, i) => `<div class="hint"><b>Hint ${i + 1}${i === hints.length - 1 ? ' (spoiler!)' : ''}:</b><pre>${escapeHTML(h)}</pre></div>`).join('');
      Sound.play('click');
    }
    closeEditor() {
      if (!this.ed) return;
      this.storeCode();
      $('#editor').classList.add('hidden');
      this.editorOpen = false;
      this.ed = null;
      this.setFrozen();
      if (this.pendingEffect) { const f = this.pendingEffect; this.pendingEffect = null; f(); }
      this.updateHUD();
    }
    globalsFor(ch, test, display) {
      const lang = this.save.lang;
      const g = {};
      const conv = (k) => lang === 'javascript' ? CodeRunner.camel(k) : k;
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
      fb.innerHTML = `<b>🐛 ${escapeHTML(err.type)}</b> — ${explain(err, lang)}`;
      Sound.play('error');
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
        const r = await CodeRunner.run(lang, code, { globals: this.globalsFor(ch, t), api, callTests: ch.callTests || [], captureVars: [] });
        runs.push(r);
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
      if (!first) { fb.innerHTML += '<div class="muted">(Already solved — but nice work!)</div>'; return; }
      this.save.solved[ed.chId] = res.data === undefined ? true : res.data;
      this.persist();
      if (XP[ed.chId]) setTimeout(() => this.toast(`✨ +${XP[ed.chId]} XP — <b>${escapeHTML(CH[ed.chId].title)}</b> complete`, 'good'), 1600);
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
        fb.innerHTML = `No errors — but it printed <b>${escapeHTML(got || 'nothing')}</b> instead of <b>${escapeHTML(sn.expect)}</b>.`;
        Sound.play('fail');
        return;
      }
      const G = GLITCHES[ed.kind];
      delete this.save.code[lang][this.codeKey()];
      delete this.save.glitches[ed.kind];
      this.persist();
      Sound.play('success');
      fb.className = 'feedback good';
      fb.innerHTML = `✔ <b>${G.name} fixed!</b> ${G.effect.replace('disabled', 'restored').replace('reversed', 'back to normal').replace('slowed', 'back to full speed')}.`;
      this.toast(`🔧 Glitch fixed: <b>${G.name}</b>`, 'good');
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
