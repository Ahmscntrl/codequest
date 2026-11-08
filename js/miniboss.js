/* CodeQuest — minibosses. A few levels end in a small arena with a miniboss guarding the exit portal.
 * At most two per chapter. Beat it by jumping on its head (or hitting it with your weapon);
 * touching it bites you and glitches your code, like any bug. */
(function (root) {
  'use strict';
  const TILE = 32;
  const KINDS = ['syntax', 'name', 'type'];
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // level id -> miniboss. hp is in stomps-worth of damage (a stomp does 2 without a weapon, 1 with one).
  const DEFS = {
    // Chapter 1 (every language)
    ifs: { name: 'Branch Beetle', hp: 6, color: '#ffb02e', kind: 'type', speed: 1.3, horns: true },
    funcs: { name: 'Overflow Mantis', hp: 8, color: '#58ff8b', kind: 'name', speed: 1.6, spits: true },
    // Chapter 2
    py2_slice: { name: 'The Indent Eel', hp: 9, color: '#3fd0c0', kind: 'syntax', speed: 1.7, spits: true },
    py2_inh: { name: 'The Boilerplate Kraken', hp: 12, color: '#7a8cff', kind: 'type', speed: 1.5, spits: true, horns: true },
    js2_docks: { name: 'The NaN Wasp', hp: 9, color: '#ffe14f', kind: 'type', speed: 1.8, spits: true },
    js2_tower: { name: 'The Undefined', hp: 12, color: '#ff4fd8', kind: 'name', speed: 1.7, spits: true, horns: true },
    cpp2_enc: { name: 'Dangling Pointer Crab', hp: 9, color: '#ff7a3c', kind: 'name', speed: 1.6, horns: true },
    cpp2_virt: { name: 'The Memory Leak', hp: 12, color: '#c0c8d8', kind: 'type', speed: 1.5, spits: true },
    cs2_linq: { name: 'The Lazy Query', hp: 9, color: '#9ff0ff', kind: 'syntax', speed: 1.6, spits: true },
    cs2_exc: { name: 'The Null Wraith', hp: 12, color: '#b59cff', kind: 'name', speed: 1.8, spits: true, horns: true },
    java2_brewline: { name: 'NullPointer Moth', hp: 9, color: '#e8dccb', kind: 'name', speed: 1.7, spits: true },
    java2_boiler: { name: 'The Unchecked Exception', hp: 12, color: '#ff6a3c', kind: 'type', speed: 1.6, spits: true, horns: true },
    // Data Structures & Algorithms
    dsa_stack: { name: 'Stack Overflow', hp: 10, color: '#ffa94d', kind: 'syntax', speed: 1.7, spits: true },
    dsa_graph: { name: 'The Big O', hp: 14, color: '#4fd0a0', kind: 'type', speed: 1.8, spits: true, horns: true },
  };

  // Add the arena to the end of a level's map: checkpoint, a few platforms, the miniboss, then the portal.
  function addArena(L) {
    if (L.arenaAt) return;
    const rows = L.map.map(r => r.split(''));
    const H = rows.length, W = Math.max(...rows.map(r => r.length));
    for (const r of rows) { while (r.length < W) r.push('.'); const f = r.indexOf('F'); if (f >= 0) r[f] = '.'; }
    const add = 36, gy = H - 2; // ground rows are the last two
    for (let y = 0; y < H; y++) for (let k = 0; k < add; k++) rows[y].push(y >= gy ? '#' : '.');
    const put = (x, y, s) => { for (let i = 0; i < s.length; i++) rows[y][W + x + i] = s[i]; };
    put(2, gy - 1, 'K');
    put(10, gy - 3, '---'); put(23, gy - 3, '---'); put(15, gy - 5, '-----');
    put(17, gy - 6, 'o'); put(18, gy - 6, 'o');
    put(26, gy - 1, 'M');
    put(32, gy - 1, 'F');
    for (let y = 0; y < gy; y++) rows[y][W + add - 1] = 'W';
    L.map = rows.map(r => r.join(''));
    L.arenaAt = W + 6; // the fight starts when you walk past this column
  }

  const P = root.Game.prototype;
  P.spawnMini = function (sx, sy) {
    const d = DEFS[this.L.id];
    const hp = d.hp;
    this.mini = { d, x: sx * TILE - 14, y: (sy + 1) * TILE - 44, w: 60, h: 44, vx: 0, vy: 0, hp, max: hp, state: 'sleep', timer: 0, hurt: 0, iframes: 0, homeX: sx * TILE - 14, homeY: (sy + 1) * TILE - 44, facing: -1, onGround: false };
  };
  P.updateMini = function () {
    const m = this.mini, p = this.player;
    if (!m) return;
    if (m.hurt > 0) m.hurt--;
    if (m.iframes > 0) m.iframes--;
    if (m.state === 'dying') {
      if (--m.timer <= 0) { this.mini = null; }
      else if (m.timer % 6 === 0) this.burst(m.x + Math.random() * m.w, m.y + Math.random() * m.h, m.d.color, 6, 3);
      return;
    }
    if (m.state === 'sleep') {
      if (p.x > this.L.arenaAt * TILE && !p.dead) {
        m.state = 'intro'; m.timer = 70;
        this.app.toast(`<b>${m.d.name}</b> blocks the portal. Jump on its head!`, 'bad');
        this.app.sfx('glitch');
      }
      return;
    }
    const enraged = m.hp <= m.max / 2;
    const speed = m.d.speed * (enraged ? 1.35 : 1);
    m.timer--;
    if (m.state === 'intro') { if (m.timer <= 0) { m.state = 'walk'; m.timer = 120; } }
    else if (m.state === 'walk') {
      const dir = Math.sign(p.x + p.w / 2 - (m.x + m.w / 2)) || 1;
      m.facing = dir;
      m.vx += (dir * speed - m.vx) * 0.08;
      if (m.timer <= 0 && m.onGround) {
        if (m.d.spits && Math.random() < 0.5) { m.state = 'spit'; m.timer = 40; m.vx = 0; }
        else { m.state = 'leap'; m.vy = -10.5; m.vx = dir * (3 + (enraged ? 1 : 0)); m.onGround = false; m.timer = 30; }
      }
    } else if (m.state === 'spit') {
      m.vx *= 0.8;
      if (m.timer === 20) {
        const cx = m.x + m.w / 2, cy = m.y + 12;
        const base = Math.atan2(p.y + 15 - cy, p.x + 10 - cx);
        const n = enraged ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.3, kind = KINDS[(i + this.t) % 3];
          this.projectiles.push({ x: cx, y: cy, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, r: 8, kind, owner: 'boss', life: 240, label: { syntax: 'SyntaxError', name: 'NameError', type: 'TypeError' }[kind] });
        }
        this.app.sfx('shoot');
      }
      if (m.timer <= 0) { m.state = 'walk'; m.timer = 100 + Math.floor(Math.random() * 60); }
    } else if (m.state === 'leap') {
      if (m.onGround && m.timer <= 0) { m.state = 'walk'; m.timer = 110 + Math.floor(Math.random() * 60); this.shake = 6; this.burst(m.x + m.w / 2, m.y + m.h, m.d.color, 10); }
    }
    // physics: walls and ground, never leaves the arena
    m.vy = Math.min(m.vy + 0.5, 10);
    this.moveBody(m);
    if (m.hitWall) m.vx = -m.vx * 0.5;
    if (m.x < (this.L.arenaAt - 2) * TILE) { m.x = (this.L.arenaAt - 2) * TILE; m.vx = Math.abs(m.vx); }
    // contact
    if (p.dead) return;
    const body = { x: m.x + 6, y: m.y + 6, w: m.w - 12, h: m.h - 6 };
    if (overlap(p, body)) {
      const stomp = p.vy > 0 && (p.y + p.h) - p.vy <= body.y + 14;
      if (stomp) {
        this.damageMini(this.save.weapon ? 1 : 2, 'stomp');
        p.vy = this.keys.jump ? -12 : -9; p.jumps = this.skill('double_jump') ? 1 : 0;
        this.app.sfx('stomp');
      } else if (m.hurt <= 10) this.hurt(1, m.x + m.w / 2, m.d.kind);
    }
  };
  P.damageMini = function (dmg, src) {
    const m = this.mini;
    if (!m || m.state === 'dying' || m.state === 'sleep' || m.iframes > 0) return;
    m.hp -= dmg; m.hurt = 18; m.iframes = src === 'weapon' ? 12 : 24;
    this.floater(m.x + m.w / 2, m.y - 6, '-' + dmg, '#ffe066');
    this.burst(m.x + m.w / 2, m.y + m.h / 2, m.d.color, 12, 4);
    this.app.sfx('hit');
    if (m.hp <= 0) {
      m.hp = 0; m.state = 'dying'; m.timer = 70;
      this.projectiles = this.projectiles.filter(pr => pr.owner !== 'boss');
      this.floater(m.x + m.w / 2, m.y - 20, 'Defeated!', '#58ff8b');
      this.app.onMiniDefeated(m.d);
    }
  };
  // the miniboss heals and goes back to sleep if you lose
  P.resetMini = function () {
    const m = this.mini;
    if (!m || m.state === 'dying') return;
    Object.assign(m, { x: m.homeX, y: m.homeY, vx: 0, vy: 0, hp: m.max, state: 'sleep', timer: 0 });
    this.projectiles = this.projectiles.filter(pr => pr.owner !== 'boss');
  };
  P.miniBlocksPortal = function () { return !!(this.mini && this.mini.state !== 'dying'); };

  P.drawMini = function (ctx, t) {
    const m = this.mini; if (!m) return;
    const flash = m.hurt > 0 && Math.floor(m.hurt / 3) % 2 === 0;
    const col = m.d.color, dark = root.Art.shade(col, -60);
    ctx.save();
    ctx.translate(m.x + m.w / 2, m.y + m.h);
    if (m.state === 'dying') ctx.globalAlpha = Math.max(0, m.timer / 70);
    ctx.scale(m.facing < 0 ? -1 : 1, 1);
    const sleepy = m.state === 'sleep';
    const bob = sleepy ? Math.sin(t * 0.05) * 1.5 : Math.sin(t * 0.25) * 1.2;
    // legs
    ctx.strokeStyle = '#1d1d2b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const lx = -18 + i * 14, ph = sleepy ? 0 : Math.sin(t * 0.35 + i * 2) * 4; ctx.beginPath(); ctx.moveTo(lx, -12); ctx.lineTo(lx - 5 + ph, 0); ctx.stroke(); }
    // shell
    ctx.fillStyle = flash ? '#fff' : col;
    ctx.beginPath(); ctx.ellipse(-4, -22 + bob, 26, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark; ctx.fillRect(-5, -39 + bob, 3, 34);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.arc(-15, -24 + bob, 4, 0, Math.PI * 2); ctx.arc(7, -27 + bob, 4, 0, Math.PI * 2); ctx.arc(-9, -13 + bob, 3, 0, Math.PI * 2); ctx.fill();
    // head
    ctx.fillStyle = '#1d1d2b';
    ctx.beginPath(); ctx.arc(22, -20 + bob, 11, 0, Math.PI * 2); ctx.fill();
    if (sleepy) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(21, -23 + bob); ctx.lineTo(27, -23 + bob); ctx.stroke(); }
    else { ctx.fillStyle = '#fff'; ctx.fillRect(22, -26 + bob, 6, 6); ctx.fillStyle = m.hp <= m.max / 2 ? '#ff2d2d' : '#f00'; ctx.fillRect(25, -24 + bob, 3, 3); }
    // horns or antennae
    ctx.strokeStyle = m.d.horns ? '#f4e9d0' : '#1d1d2b'; ctx.lineWidth = m.d.horns ? 4 : 2;
    ctx.beginPath(); ctx.moveTo(20, -29 + bob); ctx.quadraticCurveTo(22, -42 + bob, 30, -44 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(26, -28 + bob); ctx.quadraticCurveTo(32, -38 + bob, 38, -37 + bob); ctx.stroke();
    ctx.restore();
    if (sleepy) {
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 14px monospace';
      ctx.fillText('z', m.x + m.w - 4, m.y - 6 - (t % 60) * 0.3); ctx.restore();
    }
    // name tag
    ctx.save(); ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = col;
    ctx.fillText(m.d.name, m.x + m.w / 2, m.y - 10); ctx.restore();
  };
  P.drawMiniBar = function (ctx) {
    const m = this.mini; if (!m || m.state === 'sleep') return;
    const VW = root.GameConst.VW;
    const w = 320, x = (VW - w) / 2, y = 18;
    ctx.save();
    ctx.globalAlpha = m.state === 'dying' ? Math.max(0, m.timer / 70) : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; root.Art.rr(ctx, x - 6, y - 4, w + 12, 30, 6); ctx.fill();
    ctx.fillStyle = '#2a1030'; ctx.fillRect(x, y + 10, w, 9);
    ctx.fillStyle = m.d.color; ctx.fillRect(x, y + 10, w * Math.max(0, m.hp) / m.max, 9);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText(m.d.name.toUpperCase(), VW / 2, y + 6);
    ctx.restore();
  };

  root.MiniBoss = { DEFS, addArena, has: (id) => !!DEFS[id] };
})(window);
