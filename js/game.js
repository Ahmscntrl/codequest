/* CodeQuest — platformer engine: physics, entities, effects, boss, rendering. */
(function (root) {
  'use strict';
  const TILE = 32, VW = 960, VH = 540;
  const T = { EMPTY: 0, GROUND: 1, WALL: 2, ONEWAY: 3, SPIKES: 4, LAVA: 5, CLAVA: 6, STONE: 7, GATE: 8, SLOT: 9, BRIDGE: 10, STEP: 11, PHANTOM: 12, CODE: 13, RSPIKE: 14, GLAVA: 15 };
  const SOLID = new Set([T.GROUND, T.WALL, T.STONE, T.GATE, T.BRIDGE, T.STEP, T.CODE]);
  const DEADLY = new Set([T.LAVA, T.CLAVA, T.GLAVA, T.RSPIKE]);
  const BUG_KINDS = ['syntax', 'name', 'type'];
  const GATE_COLORS = { A: '#4ef0ff', B: '#ff5cf4', C: '#ffd166', D: '#58ff8b', E: '#ff9f43', G: '#b07cff', H: '#ff5470' };

  const THEMES = {
    meadow: { sky: ['#6ec3ff', '#d9f2ff'], ground: '#7a5538', dark: '#5e3f28', top: '#58c96a', wall: '#8b90a8', far: '#9ed6a6', far2: '#b8e3c0', glyph: 'rgba(255,255,255,0.35)' },
    cave: { sky: ['#14112c', '#2b2756'], ground: '#4b4472', dark: '#37315a', top: '#8b7fe0', wall: '#3a335f', far: '#211d44', far2: '#2a2550', glyph: 'rgba(140,130,255,0.25)' },
    circuit: { sky: ['#041319', '#0b3340'], ground: '#1b4954', dark: '#133640', top: '#2ef2c8', wall: '#15323c', far: '#0a2a33', far2: '#0e3843', glyph: 'rgba(46,242,200,0.25)' },
    wilds: { sky: ['#ff8f7a', '#ffd9a0'], ground: '#5b3e2c', dark: '#45301f', top: '#79c850', wall: '#7c6b5e', far: '#d77a6f', far2: '#e9a07c', glyph: 'rgba(255,255,255,0.3)' },
    isle: { style: 'meadow', sky: ['#4fc3e8', '#c9f4ff'], ground: '#a07a4f', dark: '#7d5c3a', top: '#f2d98b', wall: '#7f8f99', far: '#3fa9a0', far2: '#62c4b0', glyph: 'rgba(255,255,255,0.35)' },
    neon: { style: 'circuit', sky: ['#0a0220', '#2a0a4a'], ground: '#2a1450', dark: '#1c0d38', top: '#ff4fd8', wall: '#25124a', far: '#160838', far2: '#4a1a80', glyph: 'rgba(255,79,216,0.28)' },
    forge: { style: 'lair', sky: ['#1a0d05', '#4a2410'], ground: '#4a3a32', dark: '#33281f', top: '#ff9a3c', wall: '#5a4a40', far: '#2a1a10', far2: '#3a2414', glyph: 'rgba(255,154,60,0.25)' },
    crystal: { style: 'cave', sky: ['#0b1238', '#2d3f8a'], ground: '#3d4f9a', dark: '#2a3878', top: '#9ff0ff', wall: '#34448a', far: '#1c2a66', far2: '#2a3c80', glyph: 'rgba(159,240,255,0.3)' },
    coffee: { style: 'wilds', sky: ['#c98a5a', '#f4d9b0'], ground: '#5a3a26', dark: '#40281a', top: '#d9a066', wall: '#6e5444', far: '#a0684a', far2: '#b87f5a', glyph: 'rgba(255,240,220,0.35)' },
    lair: { sky: ['#0d0108', '#3b0a1c'], ground: '#2b1022', dark: '#1f0b19', top: '#ff2d6b', wall: '#3a1830', far: '#1d0612', far2: '#290a1a', glyph: 'rgba(255,45,107,0.25)' },
  };

  function hash(x, y) { let h = (x * 374761393 + y * 668265263) >>> 0; h = (h ^ (h >> 13)) * 1274126177 >>> 0; return (h ^ (h >> 16)) >>> 0; }
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  class Game {
    constructor(canvas, app) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.app = app;
      this.keys = {};
      this.pressed = {};
      this.t = 0;
      this.running = false;
      this.frozen = true;
      this.cam = { x: 0, y: 0 };
      this.instantMode = false;
      this.bindInput();
      this.last = performance.now();
      this.acc = 0;
      const loop = (now) => {
        const dt = Math.min(100, now - this.last); this.last = now;
        if (this.running) {
          this.acc += dt;
          let steps = 0;
          while (this.acc >= 1000 / 60 && steps < 5) { if (!this.frozen) this.update(); this.acc -= 1000 / 60; steps++; this.pressed = {}; }
          if (steps >= 5) this.acc = 0;
          this.render();
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    // ------------------------------------------------------------- input
    bindInput() {
      const map = (e) => {
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'a') return 'left';
        if (k === 'arrowright' || k === 'd') return 'right';
        if (k === 'arrowup' || k === 'w' || k === ' ') return 'jump';
        if (k === 'arrowdown' || k === 's') return 'down';
        if (k === 'e' || k === 'enter') return 'interact';
        if (k === 'x' || k === 'j') return 'attack';
        if (k === 'q') return 'debug';
        if (k === 'k') return 'skills';
        if (k === 'm') return 'map';
        if (k === 'escape' || k === 'p') return 'pause';
        return null;
      };
      window.addEventListener('keydown', (e) => {
        if (this.app.inputBlocked()) return;
        const a = map(e);
        if (!a) return;
        if (!this.running) return;
        e.preventDefault();
        if (!this.keys[a]) this.pressed[a] = true;
        this.keys[a] = true;
        if (a === 'pause' && !this.frozen) this.app.pause();
        if (a === 'debug' && !this.frozen) this.app.openDebugger();
        if (a === 'skills' && !this.frozen) this.app.openSkills();
        if (a === 'map' && !this.frozen) this.app.showMap(true);
      });
      window.addEventListener('keyup', (e) => { const a = map(e); if (a) this.keys[a] = false; });
      window.addEventListener('blur', () => { this.keys = {}; });
    }
    clearKeys() { this.keys = {}; this.pressed = {}; }

    get save() { return this.app.save; }
    skill(id) { return (this.save.skills && this.save.skills[id]) || 0; }
    get maxHp() { return 3 + this.skill('vitality'); }

    // ------------------------------------------------------------- level loading
    load(index, level) {
      const L = level || GameData.LEVELS[index];
      if (root.MiniBoss && MiniBoss.has(L.id)) MiniBoss.addArena(L);
      this.levelIndex = index; this.L = L;
      this.theme = THEMES[L.theme] || THEMES.meadow;
      const rows = L.map;
      this.H = rows.length; this.W = Math.max(...rows.map(r => r.length));
      this.tiles = []; this.stepLabel = {};
      for (let y = 0; y < this.H; y++) this.tiles.push(new Array(this.W).fill(0));
      Object.assign(this, { bossSpawn: null, mini: null, miniSpawn: null, gates: [], slots: [], terminals: [], pickups: [], signs: [], bugs: [], springs: [], checkpoints: [], portal: null, shrine: null, stairOrigin: null, iFriend: null, cannonPos: null, boss: null, projectiles: [], particles: [], floaters: [], scheduled: [], zaps: [], cannonCooldown: 0, cannonQueue: 0, groups: {}, tileGroup: {}, movers: [], bits: [] });
      let signI = 0, pickI = 0, bugI = 0;
      let start = { x: 64, y: 64 };
      for (let x = 0; x < this.W; x++) for (let y = 0; y < this.H; y++) {
        const ch = rows[y][x] || '.';
        const set = (v) => { this.tiles[y][x] = v; };
        const lg = L.legend && L.legend[ch];
        if (lg) {
          const add = (kind) => { (this.groups[lg.g] = this.groups[lg.g] || []).push({ x, y, kind }); this.tileGroup[`${x},${y}`] = lg.g; };
          if (lg.type === 'phantom') { set(T.PHANTOM); add('phantom'); }
          else if (lg.type === 'rspike') { set(T.RSPIKE); add('rspike'); }
          else if (lg.type === 'glava') { set(T.GLAVA); add('glava'); }
          else if (lg.type === 'gspring') this.springs.push({ x, y, active: false, anim: 0, g: lg.g });
          else if (lg.type === 'mover') this.movers.push({ x: x * TILE, y: y * TILE, x0: x * TILE, y0: y * TILE, w: 3 * TILE, h: 12, range: (lg.range || 4) * TILE, axis: lg.g, t: x * 0.37, dx: 0, dy: 0 });
          continue;
        }
        switch (ch) {
          case '#': set(T.GROUND); break;
          case 'W': set(T.WALL); break;
          case '-': set(T.ONEWAY); break;
          case '^': set(T.SPIKES); break;
          case '~': set(T.LAVA); break;
          case '%': set(T.CLAVA); break;
          case 'A': case 'B': case 'C': case 'D': case 'E': case 'G': case 'H': set(T.GATE); this.gates.push({ x, y, g: ch, open: false, anim: 0 }); break;
          case '_': set(T.SLOT); this.slots.push({ x, y }); break;
          case 'S': this.stairOrigin = { x, y }; break;
          case 'P': start = { x: x * TILE + 6, y: (y + 1) * TILE - 30 }; break;
          case '*': { const def = L.pickups[pickI]; this.pickups.push({ x, y, def, idx: pickI, taken: false }); pickI++; break; }
          case '?': this.signs.push({ x, y, text: L.signs[signI++] || '' }); break;
          case '@': this.iFriend = { x: x * TILE + 16, y: (y + 1) * TILE }; break;
          case 'e': case 'w': this.bugs.push(this.makeBug(x, y, ch === 'w', BUG_KINDS[(bugI++ + index) % 3])); break;
          case 's': this.springs.push({ x, y, active: !L.springsLocked, anim: 0 }); break;
          case 'F': this.portal = { x, y }; break;
          case 'K': this.checkpoints.push({ x, y, active: false }); break;
          case '$': this.shrine = { x, y }; break;
          case 'Z': this.bossSpawn = { x, y }; break;
          case 'M': this.miniSpawn = { x, y }; break;
          case 'c': this.cannonPos = { x, y }; break;
          case 'o': if (!this.save.taken[`${L.id}:bit:${x},${y}`]) this.bits.push({ x, y }); break;
          default:
            if (/[1-9]/.test(ch)) this.terminals.push({ x, y, ch: L.terminals[+ch - 1], glow: 0 });
        }
      }
      this.slots.sort((a, b) => a.x - b.x);
      this.start = start;
      const p = this.player = { x: start.x, y: start.y, w: 20, h: 30, vx: 0, vy: 0, onGround: false, facing: 1, coyote: 0, jumpBuf: 0, jumps: 0, inv: 0, attackT: 0, attackCD: 0, hp: this.maxHp, dead: 0, hist: [] };
      // checkpoint restore
      // each level keeps its own checkpoint, so replaying an old level never moves your main progress
      const P = this.prog();
      const legacy = !L.chapter && this.save.checkpoint && this.save.checkpoint.level === index ? this.save.checkpoint : null;
      const cp = (P.checkpoints || {})[index] || legacy;
      if (cp) {
        p.x = cp.x * TILE + 6; p.y = (cp.y + 1) * TILE - 30;
        const k = this.checkpoints.find(k => k.x === cp.x && k.y === cp.y); if (k) k.active = true;
      }
      this.respawnPoint = { x: p.x, y: p.y };
      // pickups already taken
      for (const pk of this.pickups) if (this.save.taken[`${L.id}:${pk.idx}`]) pk.taken = true;
      if (this.save.foundI && this.iFriend) this.iFriend = null;
      // re-apply solved terminals instantly
      this.instantMode = true;
      for (const term of this.terminals) {
        const ch = GameData.CH[term.ch];
        if (this.save.solved[term.ch] !== undefined && !ch.repeatable) ch.effect(this, this.save.solved[term.ch], true);
      }
      if (L.openWorld && this.coreCount() >= 3) this.openGate('A');
      this.instantMode = false;
      if (this.bossSpawn) this.spawnBoss();
      if (this.miniSpawn && !(this.save.minis || {})[L.id]) this.spawnMini(this.miniSpawn.x, this.miniSpawn.y);
      this.cam.x = clamp(p.x - VW / 2, 0, Math.max(0, this.W * TILE - VW));
      this.cam.y = clamp(p.y - VH / 2, 0, Math.max(0, this.H * TILE - VH));
      this.followers = { pet: { x: p.x, y: p.y + p.h, facing: 1 }, i: { x: p.x, y: p.y + p.h, facing: 1 } };
      this.signText = null;
      this.t = 0;
      this.running = true;
    }
    makeBug(x, y, flyer, kind) {
      return { x: x * TILE + 6, y: (y + 1) * TILE - 22, w: 22, h: 20, vx: flyer ? 1.2 : -0.9 * (this.L && this.L.openWorld ? 1.2 : 1), vy: 0, flyer, kind, hp: flyer ? 2 : 1, hurt: 0, dead: false, baseY: (y + 1) * TILE - 30, homeX: x * TILE, ph: Math.random() * 6 };
    }

    // ------------------------------------------------------------- tile helpers
    tileAt(tx, ty) {
      if (tx < 0 || tx >= this.W) return T.WALL;
      if (ty < 0) return T.WALL;
      if (ty >= this.H) return T.EMPTY;
      return this.tiles[ty][tx];
    }
    solidAt(tx, ty) { return SOLID.has(this.tileAt(tx, ty)); }

    // ------------------------------------------------------------- effects called by challenges
    // progress record of the chapter being played (Chapter 2 keeps its own)
    prog() { return (this.app && this.app.prog) ? this.app.prog() : this.save; }
    // after you run a loop, i hops beside you once per pass, calling out the loop variable
    loopDance(loop) {
      if (!loop || !loop.values.length) return;
      this.iDance = { name: loop.name, values: loop.values.slice(0, 20), more: loop.total > 20, k: 0, t: 0 };
    }
    openGate(g) {
      for (const gate of this.gates) if (gate.g === g && !gate.open) {
        gate.open = true; gate.anim = this.instantMode ? 1 : 0;
        this.tiles[gate.y][gate.x] = T.EMPTY;
        if (!this.instantMode) this.burst(gate.x * TILE + 16, gate.y * TILE + 16, '#7df9ff', 14);
      }
      const items = (this.groups[g] || []).slice().sort((a, b) => a.x - b.x || b.y - a.y);
      const x0 = items.length ? items[0].x : 0;
      items.forEach((it, k) => {
        const doIt = () => {
          if (it.kind === 'phantom') this.tiles[it.y][it.x] = T.CODE;
          if (it.kind === 'rspike') this.tiles[it.y][it.x] = T.EMPTY;
          if (it.kind === 'glava') this.tiles[it.y][it.x] = T.STONE;
          if (!this.instantMode) this.burst(it.x * TILE + 16, it.y * TILE + 16, GATE_COLORS[g] || '#7df9ff', 5);
        };
        if (this.instantMode) doIt(); else this.schedule(8 + (it.x - x0) * 6 + k % 2, doIt);
      });
      for (const sp of this.springs) if (sp.g === g && !sp.active) { sp.active = true; if (!this.instantMode) this.burst(sp.x * TILE + 16, sp.y * TILE + 24, '#ffe066', 14); }
      this.groups[g] = [];
      if (!this.instantMode) this.app.sfx('open');
    }
    buildBridge(n) {
      const count = Math.min(n, this.slots.length);
      for (let i = 0; i < count; i++) {
        const s = this.slots[i];
        const doIt = () => { this.tiles[s.y][s.x] = T.BRIDGE; if (!this.instantMode) { this.burst(s.x * TILE + 16, s.y * TILE + 8, '#d9a066', 6); this.app.sfx('build'); } };
        if (this.instantMode) doIt(); else this.schedule(i * 8, doIt);
      }
    }
    buildStairs(n) {
      const o = this.stairOrigin; if (!o) return;
      for (let k = 0; k < n; k++) {
        const doIt = () => {
          for (let h = 0; h <= k; h++) if (this.tiles[o.y - h]) this.tiles[o.y - h][o.x + k] = T.STEP;
          this.stepLabel[`${o.x + k},${o.y - k}`] = k;
          if (!this.instantMode) {
            this.burst((o.x + k) * TILE + 16, (o.y - k) * TILE, '#7df9ff', 10);
            this.app.sfx('build');
            this.iHop = { x: (o.x + k) * TILE + 16, y: (o.y - k) * TILE, label: k, t: 40 };
          }
        };
        if (this.instantMode) doIt(); else this.schedule(k * 22, doIt);
      }
      if (!this.instantMode) this.schedule(n * 22 + 30, () => { this.iHop = null; });
    }
    coolLava() {
      let minX = Infinity;
      for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) if (this.tiles[y][x] === T.CLAVA) minX = Math.min(minX, x);
      for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) if (this.tiles[y][x] === T.CLAVA) {
        const doIt = () => { this.tiles[y][x] = T.STONE; if (!this.instantMode && y === this.firstClavaRow(x)) this.burst(x * TILE + 16, y * TILE, '#bbb', 5); };
        if (this.instantMode) doIt(); else this.schedule((x - minX) * 5, doIt);
      }
      if (!this.instantMode) this.app.sfx('build');
    }
    firstClavaRow(x) { for (let y = 0; y < this.H; y++) if (this.tiles[y][x] === T.CLAVA || this.tiles[y][x] === T.STONE) return y; return -1; }
    activateSprings() { for (const s of this.springs) { if (s.g) continue; s.active = true; if (!this.instantMode) this.burst(s.x * TILE + 16, s.y * TILE + 24, '#ffe066', 12); } }
    setWeapon(w) { this.save.weapon = w; }
    setPet(p) { this.save.pet = p; if (!this.instantMode) this.followers.pet = { x: this.player.x, y: this.player.y + this.player.h, facing: 1 }; }
    coreCount() { return ['gems', 'decoder', 'fib'].filter(id => this.save.solved[id] !== undefined).length; }
    gainCore(id, instant) {
      if (instant || this.instantMode) return;
      this.save.sp += 1;
      this.app.toast(`Core fragments: ${this.coreCount()}/3`, 'good');
      if (this.coreCount() >= 3) {
        this.schedule(60, () => { this.openGate('A'); this.app.toast('The Great Gate has opened! The Bug King awaits in the far east.', 'good'); });
      }
    }
    gainSideQuest(id, instant) { if (instant || this.instantMode) return; this.save.sp += 1; }
    fireCannon(shots) {
      this.cannonCooldown = Math.max(240, 600 - this.skill('overclock') * 150);
      this.cannonQueue = shots;
      this.cannonFireT = 20;
    }
    schedule(delay, fn) { this.scheduled.push({ t: delay, fn }); }

    // ------------------------------------------------------------- particles
    burst(x, y, color, n, speed) {
      speed = speed || 3;
      for (let i = 0; i < n; i++) this.particles.push({ x, y, vx: rand(-speed, speed), vy: rand(-speed * 1.3, speed * 0.5), life: rand(20, 45), max: 45, color, size: rand(2, 4.5) });
    }
    floater(x, y, text, color) { this.floaters.push({ x, y, text, color: color || '#fff', life: 70 }); }

    // ------------------------------------------------------------- update
    update() {
      this.t++;
      const p = this.player;
      for (let i = this.scheduled.length - 1; i >= 0; i--) { const s = this.scheduled[i]; if (--s.t <= 0) { this.scheduled.splice(i, 1); s.fn(); } }

      if (p.dead > 0) {
        p.dead--;
        if (p.dead === 0) this.respawn();
        this.updateParticles();
        return;
      }
      // -- moving platforms (carry the player)
      for (const mv of this.movers) {
        mv.t += 0.012;
        const off = mv.range * (0.5 - 0.5 * Math.cos(mv.t * Math.PI));
        const nx = mv.axis === 'v' ? mv.x0 : mv.x0 + off, ny = mv.axis === 'v' ? mv.y0 - off : mv.y0;
        mv.dx = nx - mv.x; mv.dy = ny - mv.y; mv.x = nx; mv.y = ny;
      }
      if (p.plat) { p.x += p.plat.dx; p.y += p.plat.dy; }
      const gl = this.save.glitches || {};
      // -- horizontal movement
      let dir = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
      if (gl.name) dir = -dir;
      let max = 3.4 * (1 + 0.2 * this.skill('swift'));
      if (gl.type) max *= 0.55;
      const acc = p.onGround ? 0.7 : 0.45;
      if (dir) { p.vx += dir * acc; p.facing = dir; }
      else p.vx *= p.onGround ? 0.72 : 0.92;
      if (Math.abs(p.vx) < 0.05) p.vx = 0;
      if (p.knock > 0) p.knock--; else p.vx = clamp(p.vx, -max, max);

      // -- jumping
      if (p.onGround) { p.coyote = 7; p.jumps = this.skill('double_jump') ? 1 : 0; } else if (p.coyote > 0) p.coyote--;
      if (this.pressed.jump) p.jumpBuf = 7; else if (p.jumpBuf > 0) p.jumpBuf--;
      if (p.jumpBuf > 0) {
        if (gl.syntax) {
          if (this.pressed.jump) { this.floater(p.x + 10, p.y - 10, 'SyntaxError: jump()', '#ff5470'); this.app.sfx('error'); }
          p.jumpBuf = 0;
        } else if (p.coyote > 0) { p.vy = -11; p.coyote = 0; p.jumpBuf = 0; p.onGround = false; this.app.sfx('jump'); }
        else if (p.jumps > 0 && this.pressed.jump) { p.vy = -9.5; p.jumps--; p.jumpBuf = 0; this.burst(p.x + 10, p.y + p.h, '#fff', 6, 2); this.app.sfx('jump'); }
      }
      if (p.vy >= 0) p.noCut = false;
      if (!this.keys.jump && p.vy < -4 && !p.noCut) p.vy *= 0.6;
      p.vy = Math.min(p.vy + 0.55, 11.5);

      // -- move & collide
      this.moveBody(p, true);
      if (p.y > this.H * TILE + 60) { this.hurt(1, null, null, true); }
      // -- data bits
      for (let i = this.bits.length - 1; i >= 0; i--) {
        const bt = this.bits[i];
        if (overlap(p, { x: bt.x * TILE + 8, y: bt.y * TILE + 6, w: 16, h: 20 })) {
          this.bits.splice(i, 1);
          this.save.taken[`${this.L.id}:bit:${bt.x},${bt.y}`] = true;
          this.save.bitsCollected = (this.save.bitsCollected || 0) + 1;
          this.burst(bt.x * TILE + 16, bt.y * TILE + 16, '#7df9ff', 6, 2);
          this.floater(bt.x * TILE + 16, bt.y * TILE, '+1 bit', '#7df9ff');
          this.app.sfx('bit');
          this.app.onBit();
        }
      }

      // -- hazards
      const hz = { x: p.x + 4, y: p.y + 6, w: p.w - 8, h: p.h - 6 };
      for (let ty = Math.floor(hz.y / TILE); ty <= Math.floor((hz.y + hz.h) / TILE); ty++)
        for (let tx = Math.floor(hz.x / TILE); tx <= Math.floor((hz.x + hz.w) / TILE); tx++) {
          const tt = this.tileAt(tx, ty);
          if (tt === T.SPIKES && hz.y + hz.h > ty * TILE + 14) this.hurt(1, tx * TILE + 16);
          if (tt === T.RSPIKE && hz.y + hz.h > ty * TILE + 14) this.hurt(1, null, null, true);
          else if (DEADLY.has(tt) && tt !== T.RSPIKE && hz.y + hz.h > ty * TILE + 6) this.hurt(1, null, null, true);
        }

      if (p.inv > 0) p.inv--;
      if (p.attackCD > 0) p.attackCD--;
      if (p.attackT > 0) p.attackT--;

      // -- attack
      if (this.pressed.attack) {
        if (!this.save.weapon) { if (!this.noWeaponHint) { this.app.toast('You have no weapon yet! Jump on bugs to squash them.', 'info'); this.noWeaponHint = true; } }
        else if (p.attackCD === 0) {
          p.attackT = 14; p.attackCD = 22; this.app.sfx('swing');
        }
      }
      if (p.attackT === 12) {
        const hb = { x: p.facing > 0 ? p.x + p.w - 2 : p.x - 34, y: p.y - 6, w: 36, h: p.h + 10 };
        const dmg = this.save.weapon.damage + this.skill('sharp');
        for (const b of this.bugs) if (!b.dead && overlap(hb, b)) this.damageBug(b, dmg, p.facing);
        if (this.boss && this.boss.state !== 'dying' && overlap(hb, this.boss)) this.damageBoss(dmg, 'weapon');
        if (this.mini && overlap(hb, this.mini)) this.damageMini(Math.min(3, dmg), 'weapon');
      }

      // -- interactions
      const pc = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
      let near = null;
      for (const term of this.terminals) {
        const tx = term.x * TILE + 16, ty = term.y * TILE + 16;
        term.near = Math.abs(pc.x - tx) < 30 && Math.abs(pc.y - ty) < 34;
        if (term.near) near = term;
      }
      this.nearShrine = this.shrine && Math.abs(pc.x - (this.shrine.x * TILE + 16)) < 30 && Math.abs(pc.y - (this.shrine.y * TILE + 16)) < 34;
      if (this.pressed.interact) {
        if (near) { this.clearKeys(); this.app.openTerminal(near.ch); return; }
        if (this.nearShrine) { this.clearKeys(); this.app.openSkills(true); return; }
      }
      // signs
      let sign = null;
      for (const s of this.signs) if (Math.abs(pc.x - (s.x * TILE + 16)) < 26 && Math.abs(pc.y - (s.y * TILE + 16)) < 34) sign = s;
      const st = sign ? sign.text : null;
      if (st !== this.signText) { this.signText = st; this.app.showSign(st); }
      // pickups
      for (const pk of this.pickups) {
        if (pk.taken) continue;
        const box = { x: pk.x * TILE + 4, y: pk.y * TILE + 2, w: 24, h: 26 };
        if (overlap(p, box)) {
          pk.taken = true;
          const def = pk.def;
          let val = this.save.pickupValues[`${this.L.id}:${pk.idx}`];
          if (val === undefined) { val = typeof def.value === 'function' ? def.value() : def.value; this.save.pickupValues[`${this.L.id}:${pk.idx}`] = val; }
          this.save.vars[def.name] = val;
          this.save.taken[`${this.L.id}:${pk.idx}`] = true;
          this.burst(box.x + 12, box.y + 12, '#ffe066', 18);
          this.app.toast(`Collected a variable! <code>${def.name} = ${GameData.escapeHTML(JSON.stringify(val))}</code>`, 'good');
          this.app.sfx('pickup');
          this.app.updateHUD();
        }
      }
      // the little friend i
      if (this.iFriend && overlap(p, { x: this.iFriend.x - 10, y: this.iFriend.y - 28, w: 20, h: 28 })) {
        this.save.foundI = true;
        this.burst(this.iFriend.x, this.iFriend.y - 14, '#7df9ff', 24);
        this.followers.i = { x: this.iFriend.x, y: this.iFriend.y, facing: 1 };
        this.iFriend = null;
        this.app.dialog('You found <b>i</b>!', '<p>"Hi! I\'m <b>i</b>. Every time a loop goes around, I count it for you: 0, 1, 2, 3..."</p><p>"Let\'s go build that staircase together!"</p><p><i>i will follow you from now on.</i></p>');
        this.app.sfx('friend');
        this.app.persist();
      }
      // checkpoints
      for (const k of this.checkpoints) {
        if (!k.active && overlap(p, { x: k.x * TILE + 8, y: k.y * TILE - 16, w: 16, h: 48 })) {
          this.checkpoints.forEach(o => o.active = false); k.active = true;
          const P = this.prog();
          if (!P.checkpoints) P.checkpoints = {};
          P.checkpoints[this.levelIndex] = { x: k.x, y: k.y };
          this.respawnPoint = { x: k.x * TILE + 6, y: (k.y + 1) * TILE - 30 };
          p.hp = this.maxHp;
          this.burst(k.x * TILE + 16, k.y * TILE, '#58ff8b', 14);
          this.app.toast('Checkpoint saved. HP restored.', 'info');
          this.app.sfx('pickup');
          this.app.persist();
        }
      }
      // springs
      for (const s of this.springs) {
        if (s.anim > 0) s.anim--;
        if (!s.active) continue;
        const box = { x: s.x * TILE + 4, y: s.y * TILE + 18, w: 24, h: 14 };
        if (p.vy >= 0 && overlap(p, box)) { p.vy = -16.5; p.noCut = true; p.onGround = false; s.anim = 12; p.jumps = this.skill('double_jump') ? 1 : 0; this.app.sfx('spring'); this.burst(s.x * TILE + 16, s.y * TILE + 24, '#ffe066', 8); }
      }
      // portal
      if (this.portal && !this.miniBlocksPortal() && overlap(p, { x: this.portal.x * TILE + 4, y: this.portal.y * TILE - 20, w: 24, h: 52 })) {
        this.portal = null;
        this.app.levelComplete();
        return;
      }

      this.updateBugs();
      if (this.boss) this.updateBoss();
      if (this.mini) this.updateMini();
      this.updateProjectiles();
      this.updateFollowers();
      if (this.iDance && ++this.iDance.t > this.iDance.values.length * 22 + 50) this.iDance = null;
      this.updateParticles();
      if (this.cannonCooldown > 0) this.cannonCooldown--;
      if (this.cannonQueue > 0 && --this.cannonFireT <= 0) { this.cannonQueue--; this.cannonFireT = 12; this.shootCannon(); }

      // camera
      const tx = p.x + p.w / 2 - VW / 2 + p.facing * 40, ty = p.y + p.h / 2 - VH / 2 - 30;
      this.cam.x += (clamp(tx, 0, Math.max(0, this.W * TILE - VW)) - this.cam.x) * 0.1;
      this.cam.y += (clamp(ty, 0, Math.max(0, this.H * TILE - VH)) - this.cam.y) * 0.1;
      if (this.shake > 0) this.shake--;
    }

    moveBody(b, isPlayer) {
      // X
      b.x += b.vx;
      if (b.x < 0) { b.x = 0; b.vx = 0; b.hitWall = true; }
      if (b.x + b.w > this.W * TILE) { b.x = this.W * TILE - b.w; b.vx = 0; b.hitWall = true; }
      let y1 = Math.floor(b.y / TILE), y2 = Math.floor((b.y + b.h - 1) / TILE);
      b.hitWall = false;
      if (b.vx > 0) {
        const tx = Math.floor((b.x + b.w) / TILE);
        for (let ty = y1; ty <= y2; ty++) if (this.solidAt(tx, ty)) { b.x = tx * TILE - b.w; b.vx = 0; b.hitWall = true; break; }
      } else if (b.vx < 0) {
        const tx = Math.floor(b.x / TILE);
        for (let ty = y1; ty <= y2; ty++) if (this.solidAt(tx, ty)) { b.x = (tx + 1) * TILE; b.vx = 0; b.hitWall = true; break; }
      }
      // Y
      const prevBottom = b.y + b.h;
      b.y += b.vy;
      b.onGround = false;
      const x1 = Math.floor((b.x + 1) / TILE), x2 = Math.floor((b.x + b.w - 2) / TILE);
      if (b.vy > 0) {
        const ty = Math.floor((b.y + b.h) / TILE);
        for (let tx = x1; tx <= x2; tx++) {
          const tt = this.tileAt(tx, ty);
          const oneway = tt === T.ONEWAY && prevBottom <= ty * TILE + 1 && !(isPlayer && this.keys.down);
          if (SOLID.has(tt) || oneway) { b.y = ty * TILE - b.h; b.vy = 0; b.onGround = true; break; }
        }
      } else if (b.vy < 0) {
        const ty = Math.floor(b.y / TILE);
        for (let tx = x1; tx <= x2; tx++) if (this.solidAt(tx, ty)) { b.y = (ty + 1) * TILE; b.vy = 0; break; }
      }
      if (isPlayer) {
        b.plat = null;
        if (b.vy >= 0 && !(this.keys.down)) for (const mv of this.movers) {
          if (b.x + b.w > mv.x + 2 && b.x < mv.x + mv.w - 2 && prevBottom <= mv.y + 6 && b.y + b.h >= mv.y) {
            b.y = mv.y - b.h; b.vy = 0; b.onGround = true; b.plat = mv; break;
          }
        }
      }
    }

    hurt(dmg, srcX, kind, lava) {
      const p = this.player;
      if (p.dead) return;
      if (lava) {
        // fell into lava or the void: lose a heart and go back to the respawn point
        p.hp -= dmg; this.app.sfx('hurt');
        this.burst(p.x + 10, p.y + p.h, '#ff7b00', 16);
        if (p.hp <= 0) { this.die(); return; }
        p.x = this.respawnPoint.x; p.y = this.respawnPoint.y; p.vx = 0; p.vy = 0; p.inv = 60;
        this.floater(p.x + 10, p.y - 10, 'Ouch! -1', '#ff7b00');
        this.app.updateHUD();
        return;
      }
      if (p.inv > 0) return;
      p.hp -= dmg; p.inv = 80;
      const s = srcX === null || srcX === undefined ? -p.facing : Math.sign(p.x + p.w / 2 - srcX) || 1;
      p.vx = s * 5; p.vy = -5.5; p.knock = 14;
      this.shake = 10;
      this.burst(p.x + 10, p.y + 10, '#ff5470', 12);
      this.app.sfx('hurt');
      if (kind) {
        const chance = this.skill('debugger') ? 0.5 : 1;
        if (Math.random() < chance) this.app.applyGlitch(kind);
      }
      if (p.hp <= 0) this.die();
      this.app.updateHUD();
    }
    die() {
      const p = this.player;
      p.dead = 90; p.hp = 0;
      this.burst(p.x + 10, p.y + 15, '#ff5470', 40, 5);
      this.floater(p.x + 10, p.y - 10, 'Segmentation fault (core dumped)', '#ff5470');
      this.app.sfx('die');
      this.app.updateHUD();
    }
    respawn() {
      const p = this.player;
      p.x = this.respawnPoint.x; p.y = this.respawnPoint.y; p.vx = 0; p.vy = 0; p.hp = this.maxHp; p.inv = 90;
      this.projectiles = [];
      if (this.boss && this.boss.state !== 'dying') { this.boss.state = 'rise'; this.boss.timer = 0; }
      if (this.mini) this.resetMini();
      this.app.updateHUD();
    }

    // ------------------------------------------------------------- bugs
    updateBugs() {
      const p = this.player;
      for (const b of this.bugs) {
        if (b.dead) continue;
        if (b.hurt > 0) b.hurt--;
        if (b.flyer) {
          b.ph += 0.05;
          const dx = (p.x - b.x), dist = Math.hypot(dx, p.y - b.y);
          if (dist < 220) b.vx += Math.sign(dx) * 0.03; else b.vx += Math.sign(b.homeX - b.x) * 0.02;
          b.vx = clamp(b.vx, -1.5, 1.5);
          b.x += b.vx;
          b.y = b.baseY + Math.sin(b.ph) * 26 + (dist < 220 ? clamp((p.y - b.baseY) * 0.3, -30, 50) : 0);
        } else {
          b.vy = Math.min(b.vy + 0.5, 10);
          const before = b.vx;
          this.moveBody(b);
          if (b.hitWall) b.vx = -before;
          else if (b.onGround) {
            const aheadX = b.vx > 0 ? b.x + b.w + 2 : b.x - 2;
            const tx = Math.floor(aheadX / TILE), ty = Math.floor((b.y + b.h + 4) / TILE);
            const below = this.tileAt(tx, ty);
            if (!(SOLID.has(below) || below === T.ONEWAY)) b.vx = -b.vx;
          }
          if (b.y > this.H * TILE + 40) b.dead = true;
          const tt = this.tileAt(Math.floor((b.x + b.w / 2) / TILE), Math.floor((b.y + b.h - 2) / TILE));
          if (tt === T.LAVA || tt === T.CLAVA || tt === T.GLAVA) b.dead = true;
        }
        if (p.dead) continue;
        if (overlap(p, b)) {
          const stomp = p.vy > 0 && (p.y + p.h) - p.vy <= b.y + 8;
          if (stomp) {
            this.damageBug(b, 1 + (this.save.weapon ? 0 : 1), 0);
            p.vy = this.keys.jump ? -11 : -7.5; p.jumps = this.skill('double_jump') ? 1 : 0;
            this.app.sfx('stomp');
          } else if (b.hurt <= 6) {
            this.hurt(1, b.x + b.w / 2, b.kind);
          }
        }
      }
    }
    damageBug(b, dmg, dir) {
      if (b.hurt > 6) return;
      b.hp -= dmg; b.hurt = 14;
      if (dir) b.x += dir * 10;
      this.burst(b.x + b.w / 2, b.y + b.h / 2, Art.BUG_COLORS[b.kind], 8);
      if (b.hp <= 0) {
        b.dead = true;
        this.burst(b.x + b.w / 2, b.y + b.h / 2, Art.BUG_COLORS[b.kind], 20, 4);
        this.floater(b.x + b.w / 2, b.y - 8, 'Bug fixed!', '#58ff8b');
        this.app.onBugSquashed();
      }
    }

    // ------------------------------------------------------------- pet & i
    updateFollowers() {
      const p = this.player;
      p.hist.push({ x: p.x + p.w / 2, y: p.y + p.h, f: p.facing });
      if (p.hist.length > 60) p.hist.shift();
      const follow = (f, lag, offset) => {
        const h = p.hist[Math.max(0, p.hist.length - lag)];
        if (!h) return;
        const tx = h.x - h.f * offset;
        f.moving = Math.abs(tx - f.x) > 0.5;
        f.x += (tx - f.x) * 0.15; f.y += (h.y - f.y) * 0.2;
        f.facing = h.f;
      };
      if (this.save.foundI) follow(this.followers.i, 14, 22);
      if (this.save.pet) {
        follow(this.followers.pet, 28, 40);
        const pet = this.followers.pet;
        if (this.t % 900 === 300) { pet.say = this.save.pet.speak; pet.sayT = 180; }
        if (pet.sayT > 0) pet.sayT--;
        if (this.skill('companion') && this.t % 70 === 0) {
          let best = null, bd = 170;
          for (const b of this.bugs) { if (b.dead) continue; const d = Math.hypot(b.x + b.w / 2 - pet.x, b.y + b.h / 2 - pet.y); if (d < bd) { bd = d; best = b; } }
          if (best) { this.zaps.push({ x1: pet.x, y1: pet.y - 10, x2: best.x + best.w / 2, y2: best.y + best.h / 2, life: 10 }); this.damageBug(best, 1, 0); this.app.sfx('zap'); }
          else if (this.boss && this.boss.state === 'swoop' && Math.hypot(this.boss.x + this.boss.w / 2 - pet.x, this.boss.y + this.boss.h / 2 - pet.y) < 200) {
            this.zaps.push({ x1: pet.x, y1: pet.y - 10, x2: this.boss.x + this.boss.w / 2, y2: this.boss.y + this.boss.h / 2, life: 10 }); this.damageBoss(1, 'pet');
          }
        }
      }
      for (let i = this.zaps.length - 1; i >= 0; i--) if (--this.zaps[i].life <= 0) this.zaps.splice(i, 1);
    }

    // ------------------------------------------------------------- boss
    spawnBoss() {
      const s = this.bossSpawn;
      const hp = 44;
      this.boss = { x: s.x * TILE - 48, y: -120, w: 96, h: 84, hp, max: hp, state: 'intro', timer: 140, dir: 1, cycle: 0, hurt: 0, iframes: 0, phase2: false, sweepDir: 1 };
    }
    updateBoss() {
      const b = this.boss, p = this.player;
      if (b.hurt > 0) b.hurt--;
      if (b.iframes > 0) b.iframes--;
      const minX = TILE + 4, maxX = this.W * TILE - TILE - b.w - 4;
      const hoverY = 70 + Math.sin(this.t * 0.03) * 22;
      if (b.state === 'dying') {
        b.timer--;
        if (b.timer % 6 === 0) { this.burst(b.x + rand(0, b.w), b.y + rand(0, b.h), ['#ff2d6b', '#ffcc00', '#b84dff', '#fff'][Math.floor(rand(0, 4))], 14, 5); this.shake = 6; this.app.sfx('boom'); }
        b.y += 0.4;
        if (b.timer <= 0) { this.boss = null; this.app.victory(); }
        return;
      }
      if (!b.phase2 && b.hp <= b.max / 2) {
        b.phase2 = true;
        this.app.toast('Segfault is <b>ENRAGED</b>. From now on it will corrupt your code!', 'bad');
        this.shake = 30; this.app.sfx('boom');
      }
      switch (b.state) {
        case 'intro':
          b.y += (70 - b.y) * 0.04;
          if (--b.timer <= 0) { b.state = 'hover'; b.timer = 120; }
          break;
        case 'hover':
          b.x += b.dir * (b.phase2 ? 2.4 : 1.6);
          if (b.x < minX) { b.x = minX; b.dir = 1; } if (b.x > maxX) { b.x = maxX; b.dir = -1; }
          b.y += (hoverY - b.y) * 0.08;
          if (--b.timer <= 0) {
            b.cycle++;
            if (b.cycle % 3 === 0) { b.state = 'telegraph'; b.timer = 55; this.app.sfx('warn'); }
            else if (b.phase2 && b.cycle % 3 === 1) { this.corruptAttack(); this.summon(); b.timer = 120; }
            else { this.shootBolts(b.phase2 ? 5 : 3); b.timer = b.phase2 ? 100 : 140; }
          }
          break;
        case 'telegraph':
          b.y += (hoverY - b.y) * 0.08;
          if (--b.timer <= 0) { b.state = 'swoop'; b.sweepDir = (b.x + b.w / 2) < this.W * TILE / 2 ? 1 : -1; }
          break;
        case 'swoop': {
          const lowY = 15 * TILE - b.h + 14; // body top stays below the platforms so they are safe spots
          b.y += (lowY - b.y) * 0.09;
          b.x += b.sweepDir * (b.phase2 ? 5.5 : 4.5);
          if ((b.sweepDir > 0 && b.x >= maxX) || (b.sweepDir < 0 && b.x <= minX)) { b.x = clamp(b.x, minX, maxX); b.state = 'rise'; }
          break;
        }
        case 'rise':
          b.y += (hoverY - b.y) * 0.05;
          if (Math.abs(b.y - hoverY) < 6) { b.state = 'hover'; b.timer = 90; }
          break;
      }
      // contact
      if (!p.dead) {
        const body = { x: b.x + 12, y: b.y + 10, w: b.w - 24, h: b.h - 14 };
        if (overlap(p, body)) {
          const stomp = p.vy > 0 && (p.y + p.h) - p.vy <= body.y + 16;
          if (stomp) { this.damageBoss(2, 'stomp'); p.vy = -11; this.app.sfx('stomp'); }
          else this.hurt(1, b.x + b.w / 2, BUG_KINDS[Math.floor(rand(0, 3))]);
        }
      }
    }
    damageBoss(dmg, src) {
      const b = this.boss;
      if (!b || b.state === 'dying' || b.state === 'intro' || b.iframes > 0) return;
      b.hp -= dmg; b.hurt = 16; b.iframes = src === 'cannon' ? 4 : 14;
      this.floater(b.x + b.w / 2, b.y, '-' + dmg, src === 'cannon' ? '#7df9ff' : '#ffe066');
      this.burst(b.x + b.w / 2, b.y + b.h / 2, '#ff5cf4', 10, 4);
      this.app.sfx('hit');
      if (b.hp <= 0) { b.hp = 0; b.state = 'dying'; b.timer = 200; this.projectiles.length = 0; this.bugs.forEach(x => { if (!x.dead) { x.dead = true; this.burst(x.x, x.y, '#fff', 8); } }); }
      this.app.updateHUD();
    }
    shootBolts(n) {
      const b = this.boss, p = this.player;
      const cx = b.x + b.w / 2, cy = b.y + b.h - 10;
      const base = Math.atan2(p.y + 15 - cy, p.x + 10 - cx);
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.28;
        const kind = BUG_KINDS[Math.floor(rand(0, 3))];
        this.projectiles.push({ x: cx, y: cy, vx: Math.cos(a) * 3.6, vy: Math.sin(a) * 3.6, r: 9, kind, owner: 'boss', life: 320, label: { syntax: 'SyntaxError', name: 'NameError', type: 'TypeError' }[kind] });
      }
      this.app.sfx('shoot');
    }
    corruptAttack() {
      const b = this.boss;
      const term = this.terminals[0];
      if (!term) return;
      this.projectiles.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, tx: term.x * TILE + 16, ty: term.y * TILE + 10, r: 11, owner: 'corrupt', life: 400, vx: 0, vy: 0 });
      this.app.toast('Segfault hurls a corruption orb at your cannon terminal!', 'bad');
    }
    summon() {
      for (let i = 0; i < 2; i++) {
        const bug = this.makeBug(rand(4, 25) | 0, 2, false, BUG_KINDS[Math.floor(rand(0, 3))]);
        bug.y = 60; bug.vx = (Math.random() < 0.5 ? -1 : 1) * 1.1;
        this.bugs.push(bug);
      }
    }
    shootCannon() {
      if (!this.boss || this.boss.state === 'dying') return;
      const c = this.cannonPos || { x: 2, y: 13 };
      const x = c.x * TILE + 24, y = c.y * TILE + 12;
      const b = this.boss;
      const a = Math.atan2(b.y + b.h / 2 - y, b.x + b.w / 2 - x);
      this.projectiles.push({ x, y, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, r: 7, owner: 'cannon', life: 240 });
      this.cannonRecoil = 8;
      this.burst(x, y, '#7df9ff', 8, 3);
      this.app.sfx('cannon');
    }
    updateProjectiles() {
      const p = this.player;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        if (!pr) continue; // the list can be cleared mid-loop (e.g. the boss dies)
        pr.life--;
        if (pr.owner === 'cannon' && this.boss) {
          const b = this.boss;
          const a = Math.atan2(b.y + b.h / 2 - pr.y, b.x + b.w / 2 - pr.x);
          pr.vx += Math.cos(a) * 0.6; pr.vy += Math.sin(a) * 0.6;
          const sp = Math.hypot(pr.vx, pr.vy); pr.vx *= 8 / sp; pr.vy *= 8 / sp;
        }
        if (pr.owner === 'corrupt') {
          const a = Math.atan2(pr.ty - pr.y, pr.tx - pr.x);
          pr.vx = Math.cos(a) * 4; pr.vy = Math.sin(a) * 4;
          if (Math.hypot(pr.tx - pr.x, pr.ty - pr.y) < 8) {
            this.projectiles.splice(i, 1);
            this.burst(pr.tx, pr.ty, '#b84dff', 26, 4);
            this.app.corruptCannon();
            continue;
          }
        }
        pr.x += pr.vx; pr.y += pr.vy;
        if (this.t % 2 === 0) this.particles.push({ x: pr.x, y: pr.y, vx: 0, vy: 0, life: 14, max: 14, color: pr.owner === 'cannon' ? '#7df9ff' : pr.owner === 'corrupt' ? '#b84dff' : Art.BUG_COLORS[pr.kind], size: 3 });
        let gone = pr.life <= 0 || pr.x < -50 || pr.x > this.W * TILE + 50 || pr.y > this.H * TILE + 50 || pr.y < -100;
        if (!gone && pr.owner === 'boss' && this.solidAt(Math.floor(pr.x / TILE), Math.floor(pr.y / TILE))) { gone = true; this.burst(pr.x, pr.y, Art.BUG_COLORS[pr.kind], 6); }
        if (!gone && pr.owner === 'boss' && !p.dead && overlap(p, { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 })) { this.hurt(1, pr.x, pr.kind); gone = true; }
        if (!gone && pr.owner === 'cannon' && this.boss && overlap(this.boss, { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 })) { this.damageBoss(2 + this.skill('overclock'), 'cannon'); gone = true; }
        if (gone) this.projectiles.splice(i, 1);
      }
    }
    updateParticles() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const q = this.particles[i];
        q.x += q.vx; q.y += q.vy; q.vy += 0.12; q.vx *= 0.97;
        if (--q.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.floaters.length - 1; i >= 0; i--) { const f = this.floaters[i]; f.y -= 0.6; if (--f.life <= 0) this.floaters.splice(i, 1); }
      if (this.cannonRecoil > 0) this.cannonRecoil--;
    }

    // ------------------------------------------------------------- render
    render() {
      const ctx = this.ctx;
      if (!this.tiles) return;
      ctx.save();
      const sx = this.shake > 0 ? rand(-3, 3) : 0, sy = this.shake > 0 ? rand(-3, 3) : 0;
      this.drawBackground(ctx);
      ctx.translate(Math.round(-this.cam.x + sx), Math.round(-this.cam.y + sy));
      this.drawTiles(ctx);
      this.drawEntities(ctx);
      this.drawPlayer(ctx);
      for (const pr of this.projectiles) this.drawProjectile(ctx, pr);
      for (const z of this.zaps) {
        ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(z.x1, z.y1);
        for (let k = 1; k < 6; k++) ctx.lineTo(z.x1 + (z.x2 - z.x1) * k / 6 + rand(-6, 6), z.y1 + (z.y2 - z.y1) * k / 6 + rand(-6, 6));
        ctx.lineTo(z.x2, z.y2); ctx.stroke();
      }
      for (const q of this.particles) { ctx.globalAlpha = Math.max(0, q.life / q.max); ctx.fillStyle = q.color; ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }
      ctx.globalAlpha = 1;
      ctx.font = 'bold 13px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      for (const f of this.floaters) {
        ctx.globalAlpha = Math.min(1, f.life / 30);
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      if (this.boss) this.drawBossBar(ctx);
      if (this.mini) this.drawMiniBar(ctx);
      if (this.player.dead > 0) { ctx.fillStyle = `rgba(80,0,20,${0.5 * (1 - this.player.dead / 90) + 0.15})`; ctx.fillRect(0, 0, VW, VH); }
    }
    drawBackground(ctx) {
      const th = this.theme;
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
      const theme = th.style || this.L.theme;
      // far layer
      const off1 = this.cam.x * 0.15, off2 = this.cam.x * 0.35;
      const baseY = VH - (this.cam.y - Math.max(0, this.H * TILE - VH)) * 0.2;
      if (theme === 'meadow' || theme === 'wilds') {
        if (theme === 'wilds') { ctx.fillStyle = 'rgba(255,240,200,0.8)'; ctx.beginPath(); ctx.arc(760 - off1 * 0.2, 140, 46, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 6; i++) { const cx = ((i * 260 - off1 * 0.6) % 1300 + 1300) % 1300 - 150, cy = 60 + (i * 37) % 90; ctx.beginPath(); ctx.ellipse(cx, cy, 50, 16, 0, 0, Math.PI * 2); ctx.ellipse(cx + 30, cy - 8, 30, 14, 0, 0, Math.PI * 2); ctx.fill(); } }
        this.hills(ctx, off1, baseY - 120, th.far, 220, 70);
        this.hills(ctx, off2, baseY - 60, th.far2, 160, 50);
      } else if (theme === 'cave') {
        ctx.fillStyle = th.far;
        for (let i = -1; i < 12; i++) { const x = i * 110 - (off1 % 110); const h = 60 + (hash(i + Math.floor(off1 / 110), 3) % 90); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, h); ctx.lineTo(x + 60, 0); ctx.fill(); }
        this.hills(ctx, off2, baseY - 70, th.far2, 140, 40);
        for (let i = 0; i < 30; i++) { const x = ((hash(i, 9) % 1000) - off1 * 0.5 + 2000) % 1000, y = hash(i, 4) % 400; ctx.fillStyle = `rgba(180,170,255,${0.15 + 0.15 * Math.sin(this.t * 0.03 + i)})`; ctx.fillRect(x, y, 2, 2); }
      } else if (theme === 'circuit') {
        ctx.strokeStyle = th.far2; ctx.lineWidth = 3;
        for (let i = -1; i < 14; i++) {
          const x = i * 80 - (off1 % 80); const k = hash(i + Math.floor(off1 / 80), 1);
          ctx.beginPath(); ctx.moveTo(x, VH); ctx.lineTo(x, 200 + k % 200); ctx.lineTo(x + 40, 160 + k % 200); ctx.lineTo(x + 40, 60 + k % 100); ctx.stroke();
          ctx.fillStyle = th.top; ctx.globalAlpha = 0.3 + 0.3 * Math.sin(this.t * 0.05 + i); ctx.beginPath(); ctx.arc(x + 40, 60 + k % 100, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
      } else if (theme === 'lair') {
        ctx.fillStyle = th.far;
        for (let i = 0; i < 9; i++) { const x = i * 120 - 20; ctx.fillRect(x, 120 + (i % 3) * 40, 46, VH); }
        ctx.fillStyle = `rgba(255,45,107,${0.08 + 0.05 * Math.sin(this.t * 0.05)})`; ctx.fillRect(0, 0, VW, VH);
      }
      // floating code glyphs
      ctx.font = '14px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
      ctx.fillStyle = th.glyph;
      const glyphs = ['{ }', '0', '1', ';', '=>', '()', '[ ]', '#', '//', '==', 'if', 'i++'];
      for (let i = 0; i < 18; i++) {
        const gx = ((hash(i, 1) % 1400) - off2 * 0.8 + this.t * 0.1 * ((i % 3) + 1)) % 1400;
        const gy = (hash(i, 2) % 380 + this.t * 0.15 * ((i % 2) + 1)) % 400;
        ctx.fillText(glyphs[i % glyphs.length], (gx + 1400) % 1400 - 200, gy);
      }
    }
    hills(ctx, off, y, color, w, h) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, VH);
      for (let x = -w; x <= VW + w; x += 20) {
        const wx = x + off;
        ctx.lineTo(x, y - Math.sin(wx / w) * h * 0.5 - Math.sin(wx / (w * 0.43)) * h * 0.25);
      }
      ctx.lineTo(VW, VH); ctx.fill();
    }
    drawTiles(ctx) {
      const th = this.theme;
      const x0 = Math.max(0, Math.floor(this.cam.x / TILE) - 1), x1 = Math.min(this.W - 1, Math.ceil((this.cam.x + VW) / TILE) + 1);
      const y0 = Math.max(0, Math.floor(this.cam.y / TILE) - 1), y1 = Math.min(this.H - 1, Math.ceil((this.cam.y + VH) / TILE) + 1);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const tt = this.tiles[y][x];
        if (!tt) continue;
        const px = x * TILE, py = y * TILE;
        const above = y > 0 ? this.tiles[y - 1][x] : 0;
        switch (tt) {
          case T.GROUND: case T.STONE: {
            ctx.fillStyle = tt === T.STONE ? '#6d6875' : th.ground; ctx.fillRect(px, py, TILE, TILE);
            const hsh = hash(x, y);
            ctx.fillStyle = tt === T.STONE ? '#57535e' : th.dark;
            ctx.fillRect(px + (hsh % 20) + 2, py + ((hsh >> 5) % 20) + 6, 6, 4);
            ctx.fillRect(px + ((hsh >> 9) % 18) + 4, py + ((hsh >> 13) % 14) + 2, 4, 3);
            if (!SOLID.has(above) && tt === T.GROUND) {
              ctx.fillStyle = th.top; ctx.fillRect(px, py, TILE, 7);
              ctx.fillStyle = Art.shade(th.top, -35); ctx.fillRect(px, py + 7, TILE, 2);
              ctx.fillStyle = th.top;
              for (let k = 0; k < 3; k++) { const gx = px + ((hsh >> (k * 4)) % 28) + 2; ctx.fillRect(gx, py - 3, 2, 3); }
            }
            if (tt === T.STONE && !SOLID.has(above)) { ctx.fillStyle = '#8d8896'; ctx.fillRect(px, py, TILE, 4); }
            break;
          }
          case T.WALL: {
            ctx.fillStyle = th.wall; ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.fillRect(px, py + 15, TILE, 2); ctx.fillRect(px, py + 31, TILE, 1);
            ctx.fillRect(px + (y % 2 ? 8 : 24), py, 2, 15); ctx.fillRect(px + (y % 2 ? 24 : 8), py + 17, 2, 14);
            ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(px, py, TILE, 2);
            ctx.fillStyle = 'rgba(255,80,80,0.12)'; if ((x + y + Math.floor(this.t / 20)) % 7 === 0) ctx.fillRect(px, py, TILE, TILE);
            break;
          }
          case T.ONEWAY:
            ctx.fillStyle = '#9c6b3c'; ctx.fillRect(px, py, TILE, 9);
            ctx.fillStyle = '#c48b52'; ctx.fillRect(px, py, TILE, 3);
            ctx.fillStyle = '#6e4a28'; ctx.fillRect(px + 14, py + 9, 4, 6);
            break;
          case T.SPIKES:
            ctx.fillStyle = '#c9d1d9';
            for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(px + k * 8, py + TILE); ctx.lineTo(px + k * 8 + 4, py + 14); ctx.lineTo(px + k * 8 + 8, py + TILE); ctx.fill(); }
            break;
          case T.LAVA: case T.CLAVA: case T.GLAVA: {
            const lg = ctx.createLinearGradient(0, py, 0, py + TILE);
            lg.addColorStop(0, '#ffb000'); lg.addColorStop(1, '#ff3d00');
            ctx.fillStyle = lg;
            if (above !== T.LAVA && above !== T.CLAVA && above !== T.GLAVA) {
              ctx.beginPath(); ctx.moveTo(px, py + TILE);
              for (let k = 0; k <= 8; k++) ctx.lineTo(px + k * 4, py + 6 + Math.sin(this.t * 0.08 + (px + k * 4) * 0.15) * 3);
              ctx.lineTo(px + TILE, py + TILE); ctx.fill();
              if ((hash(x, Math.floor(this.t / 40)) % 9) === 0) { ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(px + 16, py + 8 - (this.t % 40) * 0.3, 2.5, 0, Math.PI * 2); ctx.fill(); }
            } else ctx.fillRect(px, py, TILE, TILE);
            break;
          }
          case T.GATE: {
            const gate = this.gates.find(g => g.x === x && g.y === y);
            const col = GATE_COLORS[gate ? gate.g : 'A'];
            ctx.fillStyle = 'rgba(10,20,40,0.85)'; ctx.fillRect(px + 2, py, TILE - 4, TILE);
            ctx.fillStyle = col; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(this.t * 0.1 + y);
            for (let k = 0; k < 4; k++) ctx.fillRect(px + 4 + k * 7, py, 3, TILE);
            ctx.globalAlpha = 1;
            if (!this.tiles[y + 1] || this.tiles[y + 1][x] !== T.GATE) { ctx.fillStyle = col; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; this.drawLock(ctx, px + 16, py + 16, col); }
            break;
          }
          case T.PHANTOM: {
            const gc = GATE_COLORS[this.tileGroup[`${x},${y}`]] || '#7df9ff';
            ctx.strokeStyle = gc; ctx.globalAlpha = 0.35 + 0.15 * Math.sin(this.t * 0.08 + x);
            ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4); ctx.setLineDash([]);
            ctx.globalAlpha = 1;
            break;
          }
          case T.CODE: {
            const gc = GATE_COLORS[this.tileGroup[`${x},${y}`]] || '#7df9ff';
            ctx.fillStyle = '#16233f'; ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = gc; ctx.globalAlpha = 0.9; ctx.fillRect(px, py, TILE, 3); ctx.globalAlpha = 0.25; ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6); ctx.globalAlpha = 1;
            ctx.strokeStyle = gc; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
            ctx.fillStyle = gc; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText((x + y) % 2 ? '{ }' : '01', px + 16, py + 20);
            break;
          }
          case T.RSPIKE:
            ctx.fillStyle = '#ff6b85';
            for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(px + k * 8, py + TILE); ctx.lineTo(px + k * 8 + 4, py + 12); ctx.lineTo(px + k * 8 + 8, py + TILE); ctx.fill(); }
            ctx.fillStyle = '#3a1830'; ctx.fillRect(px, py + TILE - 3, TILE, 3);
            break;
          case T.SLOT:
            ctx.strokeStyle = 'rgba(255,220,150,0.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 1.5, py + 1.5, TILE - 3, 9); ctx.setLineDash([]);
            break;
          case T.BRIDGE:
            ctx.fillStyle = '#a8703e'; ctx.fillRect(px, py, TILE, 12);
            ctx.fillStyle = '#d29a5c'; ctx.fillRect(px, py, TILE, 3);
            ctx.fillStyle = '#6e4a28'; ctx.fillRect(px + 10, py, 2, 12); ctx.fillRect(px + 22, py, 2, 12);
            break;
          case T.STEP: {
            ctx.fillStyle = '#1c5d73'; ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = '#7df9ff'; ctx.globalAlpha = 0.85; ctx.fillRect(px, py, TILE, 4); ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(125,249,255,0.4)'; ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
            const lab = this.stepLabel[`${x},${y}`];
            if (lab !== undefined) { ctx.fillStyle = '#7df9ff'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillText('i=' + lab, px + 16, py + 20); }
            break;
          }
        }
      }
      // opening gates animation
      for (const g of this.gates) if (g.open && g.anim < 1) {
        g.anim += 0.03;
        const px = g.x * TILE, py = g.y * TILE + g.anim * TILE;
        ctx.globalAlpha = 1 - g.anim; ctx.fillStyle = GATE_COLORS[g.g];
        for (let k = 0; k < 4; k++) ctx.fillRect(px + 4 + k * 7, py, 3, TILE * (1 - g.anim));
        ctx.globalAlpha = 1;
      }
    }
    drawEntities(ctx) {
      const t = this.t;
      ctx.textAlign = 'center';
      // signs
      for (const s of this.signs) {
        const px = s.x * TILE, py = s.y * TILE;
        ctx.fillStyle = '#6e4a28'; ctx.fillRect(px + 14, py + 14, 4, 18);
        ctx.fillStyle = '#c48b52'; Art.rr(ctx, px + 3, py + 2, 26, 16, 3); ctx.fill();
        ctx.fillStyle = '#4a2f18'; ctx.font = 'bold 12px monospace'; ctx.fillText('?', px + 16, py + 14);
      }
      // checkpoints
      for (const k of this.checkpoints) {
        const px = k.x * TILE, py = k.y * TILE;
        ctx.fillStyle = '#ccc'; ctx.fillRect(px + 8, py - 14, 3, 46);
        ctx.fillStyle = k.active ? '#58ff8b' : '#777';
        ctx.beginPath(); ctx.moveTo(px + 11, py - 14);
        const wave = k.active ? Math.sin(t * 0.15) * 3 : 0;
        ctx.lineTo(px + 28, py - 8 + wave); ctx.lineTo(px + 11, py - 1); ctx.fill();
      }
      // springs
      for (const s of this.springs) {
        const px = s.x * TILE, py = s.y * TILE;
        const comp = s.anim > 0 ? 6 : 0;
        ctx.strokeStyle = s.active ? '#ffd166' : '#666'; ctx.lineWidth = 2.5;
        ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(px + 8, py + 30 - k * (3 - comp / 6)); ctx.lineTo(px + 24, py + 28 - k * (3 - comp / 6)); } ctx.stroke();
        ctx.fillStyle = s.active ? '#ffbe0b' : '#555';
        if (s.active) { ctx.shadowColor = '#ffbe0b'; ctx.shadowBlur = 10 + Math.sin(t * 0.2) * 5; }
        Art.rr(ctx, px + 4, py + 16 + comp, 24, 6, 2); ctx.fill(); ctx.shadowBlur = 0;
        if (!s.active) { ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText('offline', px + 16, py + 12); }
      }
      // pickups
      for (const pk of this.pickups) {
        if (pk.taken) continue;
        const px = pk.x * TILE + 16, py = pk.y * TILE + 14 + Math.sin(t * 0.08 + pk.x) * 4;
        ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 16;
        ctx.fillStyle = '#ffd166'; Art.rr(ctx, px - 10, py - 10, 20, 20, 4); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#b07d1a'; ctx.fillRect(px - 10, py - 2, 20, 3); ctx.fillRect(px - 1.5, py - 10, 3, 20);
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(pk.def.name, px, py - 16);
        ctx.fillStyle = '#ffe066'; ctx.fillText(pk.def.name, px, py - 16);
      }
      // shrine
      if (this.shrine) {
        const px = this.shrine.x * TILE + 16, py = this.shrine.y * TILE + 8 + Math.sin(t * 0.05) * 4;
        ctx.fillStyle = '#5a5a7a'; ctx.fillRect(px - 12, this.shrine.y * TILE + 24, 24, 8);
        ctx.shadowColor = '#7df9ff'; ctx.shadowBlur = 20;
        ctx.fillStyle = '#7df9ff'; ctx.beginPath(); ctx.moveTo(px, py - 14); ctx.lineTo(px + 10, py); ctx.lineTo(px, py + 14); ctx.lineTo(px - 10, py); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText('SKILLS', px, py - 20);
        if (this.nearShrine) this.prompt(ctx, px, py - 34, 'E');
      }
      // terminals
      for (const term of this.terminals) {
        const px = term.x * TILE, py = term.y * TILE;
        const solved = this.save.solved[term.ch] !== undefined && !GameData.CH[term.ch].repeatable;
        ctx.fillStyle = '#3a3f55'; ctx.fillRect(px + 13, py + 18, 6, 14); ctx.fillRect(px + 7, py + 29, 18, 3);
        ctx.fillStyle = '#23263a'; Art.rr(ctx, px + 1, py - 4, 30, 24, 3); ctx.fill();
        const scr = solved ? '#0d3b22' : '#081a2a';
        ctx.fillStyle = scr; ctx.fillRect(px + 4, py - 1, 24, 17);
        if (!solved) { ctx.shadowColor = '#4ef0ff'; ctx.shadowBlur = 8 + Math.sin(t * 0.1) * 6; }
        ctx.fillStyle = solved ? '#58ff8b' : '#4ef0ff';
        ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
        if (solved) ctx.fillText('✔', px + 11, py + 12);
        else { ctx.fillText('>', px + 6, py + 11); if (Math.floor(t / 30) % 2) ctx.fillRect(px + 14, py + 4, 6, 8); }
        ctx.shadowBlur = 0; ctx.textAlign = 'center';
        if (term.ch === 'cannon' && this.cannonCooldown > 0) {
          ctx.fillStyle = '#333'; ctx.fillRect(px + 2, py - 10, 28, 4);
          const maxCd = Math.max(240, 600 - this.skill('overclock') * 150);
          ctx.fillStyle = '#7df9ff'; ctx.fillRect(px + 2, py - 10, 28 * (1 - this.cannonCooldown / maxCd), 4);
        }
        if (term.ch === 'cannon' && this.app.cannonCorrupted()) { ctx.fillStyle = '#b84dff'; ctx.font = 'bold 9px monospace'; ctx.fillText('CORRUPTED', px + 16, py - 14); }
        if (term.near) this.prompt(ctx, px + 16, py - 24, 'E');
      }
      // cannon
      if (this.cannonPos) {
        const px = this.cannonPos.x * TILE, py = this.cannonPos.y * TILE;
        let a = -0.6; if (this.boss) a = Math.atan2(this.boss.y + this.boss.h / 2 - (py + 12), this.boss.x + this.boss.w / 2 - (px + 16));
        ctx.save(); ctx.translate(px + 16, py + 14); ctx.rotate(a);
        ctx.fillStyle = '#4a5568'; Art.rr(ctx, -6 - (this.cannonRecoil || 0), -7, 30, 14, 4); ctx.fill();
        ctx.fillStyle = '#7df9ff'; ctx.fillRect(18 - (this.cannonRecoil || 0), -5, 4, 10);
        ctx.restore();
        ctx.fillStyle = '#2d3748'; ctx.beginPath(); ctx.arc(px + 16, py + 22, 10, Math.PI, 0); ctx.fill();
      }
      // moving platforms
      for (const mv of this.movers) {
        ctx.fillStyle = '#2b3a5c'; Art.rr(ctx, mv.x, mv.y, mv.w, 12, 4); ctx.fill();
        ctx.fillStyle = '#7df9ff'; ctx.globalAlpha = 0.8; ctx.fillRect(mv.x + 4, mv.y + 2, mv.w - 8, 2); ctx.globalAlpha = 1;
        ctx.fillStyle = '#7df9ff';
        for (let k = 0; k < 3; k++) { ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 0.15 + k); ctx.fillRect(mv.x + 18 + k * 26, mv.y + 7, 8, 3); }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(125,249,255,0.18)'; ctx.setLineDash([3, 6]); ctx.beginPath();
        ctx.moveTo(mv.x0 + mv.w / 2, mv.y0 + 6); ctx.lineTo(mv.x0 + mv.w / 2 + (mv.axis === 'v' ? 0 : mv.range), mv.y0 + 6 - (mv.axis === 'v' ? mv.range : 0)); ctx.stroke(); ctx.setLineDash([]);
      }
      // data bits
      for (const bt of this.bits) {
        const bx = bt.x * TILE + 16, by = bt.y * TILE + 16 + Math.sin(t * 0.1 + bt.x * 0.7) * 3;
        ctx.shadowColor = '#7df9ff'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#7df9ff'; ctx.beginPath(); ctx.moveTo(bx, by - 9); ctx.lineTo(bx + 7, by); ctx.lineTo(bx, by + 9); ctx.lineTo(bx - 7, by); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#04131c'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText((bt.x + bt.y) % 2 ? '1' : '0', bx, by + 3);
      }
      // portal
      if (this.portal) {
        const px = this.portal.x * TILE + 16, py = this.portal.y * TILE + 8;
        for (let k = 0; k < 3; k++) {
          ctx.strokeStyle = ['#7df9ff', '#b84dff', '#ff5cf4'][k]; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(px, py, 14 - k * 3, 26 - k * 5, 0, t * 0.05 * (k + 1), t * 0.05 * (k + 1) + Math.PI * 1.5); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(184,77,255,0.25)'; ctx.beginPath(); ctx.ellipse(px, py, 14, 26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText(this.miniBlocksPortal() ? 'SEALED' : 'EXIT', px, py - 32);
        if (this.miniBlocksPortal()) { ctx.strokeStyle = 'rgba(255,84,112,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 14, py - 22); ctx.lineTo(px + 14, py + 22); ctx.moveTo(px + 14, py - 22); ctx.lineTo(px - 14, py + 22); ctx.stroke(); }
      }
      // the lost friend i
      if (this.iFriend) {
        Art.drawI(ctx, this.iFriend.x, this.iFriend.y, t, { hop: Math.abs(Math.sin(t * 0.08)) * 4 });
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('help!', this.iFriend.x, this.iFriend.y - 36);
      }
      for (const b of this.bugs) if (!b.dead) Art.drawBug(ctx, b, t + b.ph * 10);
      if (this.boss) Art.drawBoss(ctx, this.boss, t);
      if (this.mini) this.drawMini(ctx, t);
    }
    drawLock(ctx, x, y, col) {
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - 2, 4, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = col; ctx.fillRect(x - 6, y - 2, 12, 9);
      ctx.fillStyle = '#0a1428'; ctx.fillRect(x - 1, y + 1, 2, 3);
    }
    prompt(ctx, x, y, key) {
      const bob = Math.sin(this.t * 0.15) * 2;
      ctx.fillStyle = '#fff'; Art.rr(ctx, x - 10, y - 10 + bob, 20, 18, 4); ctx.fill();
      ctx.fillStyle = '#1b1b2f'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText(key, x, y + 3 + bob);
    }
    drawPlayer(ctx) {
      const p = this.player, t = this.t;
      // followers behind the player
      if (this.save.foundI) {
        const f = this.followers.i;
        if (this.iHop) Art.drawI(ctx, this.iHop.x, this.iHop.y, t, { hop: Math.abs(Math.sin(t * 0.25)) * 6, label: this.iHop.label });
        else if (this.iDance) {
          const d = this.iDance, per = 22, k = Math.floor(d.t / per), fr = (d.t % per) / per;
          const end = k >= d.values.length;
          Art.drawI(ctx, f.x + (k % 2 ? 1 : -1) * Math.sin(fr * Math.PI) * 6, f.y, t, { hop: end ? Math.abs(Math.sin(d.t * 0.3)) * 5 : Math.sin(fr * Math.PI) * 16, label: end ? (d.more ? 'and more!' : 'done!') : `${d.name} = ${d.values[k]}` });
        }
        else Art.drawI(ctx, f.x, f.y, t, { hop: f.moving ? Math.abs(Math.sin(t * 0.25)) * 4 : 0 });
      }
      if (this.save.pet) {
        const f = this.followers.pet;
        Art.drawPet(ctx, f.x, f.y, this.save.pet, t, { facing: f.facing, moving: f.moving });
        ctx.font = '10px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(this.save.pet.name, f.x, f.y + 12);
        if (f.sayT > 0) this.bubble(ctx, f.x, f.y - 30, f.say);
      }
      if (p.dead > 0) return;
      const blink = p.inv > 0 && Math.floor(p.inv / 4) % 2 === 0;
      if (blink) return;
      const gl = this.save.glitches || {};
      Art.drawHero(ctx, p.x + p.w / 2, p.y + p.h, this.save.hero, {
        facing: p.facing, t, moving: Math.abs(p.vx) > 0.3, air: !p.onGround, weapon: this.save.weapon, attack: p.attackT > 0, attackK: p.attackT / 14, hurt: p.knock > 0,
      });
      if (p.attackT > 6) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
        const cx = p.x + p.w / 2 + p.facing * 14, cy = p.y + 10;
        ctx.beginPath(); ctx.arc(cx, cy, 24, p.facing > 0 ? -1.2 : Math.PI - 0.6, p.facing > 0 ? 0.6 : Math.PI + 1.2); ctx.stroke();
      }
      // glitch indicators above head
      const kinds = Object.keys(gl);
      kinds.forEach((k, i) => {
        const G = GameData.GLITCHES[k];
        const gx = p.x + p.w / 2 + (i - (kinds.length - 1) / 2) * 14, gy = p.y - 34 + Math.sin(t * 0.2 + i) * 2;
        ctx.fillStyle = G.color; ctx.beginPath(); ctx.arc(gx, gy, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText('!', gx, gy + 3);
      });
    }
    bubble(ctx, x, y, text) {
      ctx.font = '11px "JetBrains Mono", monospace';
      const w = Math.min(200, ctx.measureText(text).width + 14);
      ctx.fillStyle = '#fff'; Art.rr(ctx, x - w / 2, y - 16, w, 20, 6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 4, y + 4); ctx.lineTo(x, y + 9); ctx.lineTo(x + 4, y + 4); ctx.fill();
      ctx.fillStyle = '#1b1b2f'; ctx.textAlign = 'center'; ctx.fillText(text, x, y - 2, w - 8);
    }
    drawProjectile(ctx, pr) {
      if (pr.owner === 'cannon') {
        ctx.fillStyle = '#7df9ff'; ctx.shadowColor = '#7df9ff'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#012'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.fillText('{}', pr.x, pr.y + 3);
        return;
      }
      if (pr.owner === 'corrupt') {
        ctx.fillStyle = '#b84dff'; ctx.shadowColor = '#b84dff'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(pr.x + rand(-1, 1), pr.y + rand(-1, 1), pr.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        return;
      }
      const col = Art.BUG_COLORS[pr.kind];
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText('!', pr.x, pr.y + 3);
      ctx.fillStyle = col; ctx.font = '9px monospace'; ctx.fillText(pr.label, pr.x, pr.y - 12);
    }
    drawBossBar(ctx) {
      const b = this.boss;
      const w = 420, x = (VW - w) / 2, y = 18;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; Art.rr(ctx, x - 6, y - 4, w + 12, 30, 6); ctx.fill();
      ctx.fillStyle = '#3a0a1c'; ctx.fillRect(x, y + 10, w, 10);
      ctx.fillStyle = b.phase2 ? '#ff2d6b' : '#b84dff'; ctx.fillRect(x, y + 10, w * Math.max(0, b.hp) / b.max, 10);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText('SEGFAULT, THE BUG KING' + (b.phase2 ? ' (ENRAGED)' : ''), VW / 2, y + 6);
    }
  }

  root.Game = Game;
  root.GameConst = { TILE, VW, VH, T };
})(window);
