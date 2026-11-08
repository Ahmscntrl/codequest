/* CodeQuest — the level-map boards. Every language has its own look for each chapter:
 * a background, scenery drawn as SVG, colours for the regions and paths, and its own route layout.
 * MapArt.board(lang, chapter, n) -> { bg, back, pts, region(i), pin(i, x, y), path, walked } (all in a 1000 x 560 box). */
(function (root) {
  'use strict';

  // seeded random so each board always looks the same
  function rng(seed) {
    let a = 0; for (const ch of seed) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const R = Math.round;
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---- route layouts: n stops spread over the board, each shape different
  const LAYOUTS = {
    // gentle wave from left to right
    wave: (n) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); return [R(100 + t * 800), R(300 + Math.sin(t * Math.PI * 2.2) * 160)]; }),
    // back and forth over two rows, like a snake
    snake: (n) => { const per = Math.ceil(n / 2); return Array.from({ length: n }, (_, i) => { const row = Math.floor(i / per), k = i % per, cnt = row ? n - per : per; const t = cnt === 1 ? 0.5 : k / (cnt - 1); const x = row ? 880 - t * 760 : 120 + t * 760; return [R(x), R(row ? 400 + Math.sin(t * Math.PI) * 50 : 170 - Math.sin(t * Math.PI) * 40)]; }); },
    // climbing from the bottom-left to the top-right in zigzags
    climb: (n) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); return [R(110 + t * 780), R(460 - t * 320 + (i % 2 ? -50 : 50))]; }),
    // around a ring, starting at the bottom
    ring: (n) => Array.from({ length: n }, (_, i) => { const a = Math.PI * 0.62 + (i / Math.max(1, n)) * Math.PI * 1.9; return [R(500 + Math.cos(a) * 360), R(300 + Math.sin(a) * 175)]; }),
    // scattered islands along an S-curve
    isles: (n) => { const r = rng('isles' + n); return Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); return [R(120 + t * 760 + (r() - 0.5) * 50), R(300 - Math.cos(t * Math.PI * 1.6) * 150 + (r() - 0.5) * 40)]; }); },
    // a tower: zigzag upwards through the middle
    tower: (n) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); return [R(i % 2 ? 660 : 340), R(480 - t * 360)]; }),
    // an arch: up from the left, over the top, down to the right
    arch: (n) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); return [R(110 + t * 780), R(470 - Math.sin(t * Math.PI) * 330)]; }),
    // a diagonal road down from the top-left
    road: (n) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); return [R(120 + t * 760), R(130 + t * 300 + Math.sin(t * Math.PI * 3) * 60)]; }),
  };

  // ---- scenery helpers (each returns SVG markup)
  const S = {
    stars(r, n, color) { let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${R(r() * 1000)}" cy="${R(r() * 560)}" r="${(r() * 1.6 + 0.6).toFixed(1)}" fill="${color}" opacity="${(0.3 + r() * 0.6).toFixed(2)}"><animate attributeName="opacity" values="0.2;0.9;0.2" dur="${(2 + r() * 4).toFixed(1)}s" repeatCount="indefinite"/></circle>`; return s; },
    hills(y, amp, color, phase) { let d = `M0 560 L0 ${y}`; for (let x = 0; x <= 1000; x += 25) d += ` L${x} ${R(y - Math.sin(x / 140 + phase) * amp - Math.sin(x / 61 + phase * 2) * amp * 0.35)}`; return `<path d="${d} L1000 560 Z" fill="${color}"/>`; },
    tree(x, y, s, leaf, trunk) { return `<rect x="${x - 3 * s}" y="${y - 6 * s}" width="${6 * s}" height="${12 * s}" fill="${trunk}"/><circle cx="${x}" cy="${y - 14 * s}" r="${12 * s}" fill="${leaf}"/>`; },
    pine(x, y, s, c) { return `<polygon points="${x},${y - 34 * s} ${x - 13 * s},${y} ${x + 13 * s},${y}" fill="${c}"/>`; },
    mountain(x, y, w, h, c, cap) { return `<polygon points="${x - w / 2},${y} ${x},${y - h} ${x + w / 2},${y}" fill="${c}"/>` + (cap ? `<polygon points="${x - w * 0.14},${y - h * 0.72} ${x},${y - h} ${x + w * 0.14},${y - h * 0.72} ${x + w * 0.05},${y - h * 0.66} ${x - w * 0.04},${y - h * 0.7}" fill="${cap}"/>` : ''); },
    gear(x, y, r, c, teeth) { let d = ''; const n = teeth || 10; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.22; d += `${i ? 'L' : 'M'}${R(x + Math.cos(a) * rr)} ${R(y + Math.sin(a) * rr)} `; } return `<path d="${d}Z" fill="${c}"/><circle cx="${x}" cy="${y}" r="${R(r * 0.4)}" fill="rgba(0,0,0,.35)"/>`; },
    crystal(x, y, h, c1, c2) { const w = h * 0.32; return `<polygon points="${x},${y - h} ${x + w},${y - h * 0.62} ${x + w * 0.7},${y} ${x - w * 0.7},${y} ${x - w},${y - h * 0.62}" fill="${c1}"/><polygon points="${x},${y - h} ${x + w},${y - h * 0.62} ${x + w * 0.7},${y} ${x},${y}" fill="${c2}"/>`; },
    bean(x, y, s, rot, c) { return `<g transform="translate(${x} ${y}) rotate(${rot})"><ellipse rx="${14 * s}" ry="${10 * s}" fill="${c}"/><path d="M${-11 * s} 0 Q0 ${-5 * s} ${11 * s} 0" stroke="rgba(0,0,0,.4)" stroke-width="${2 * s}" fill="none"/></g>`; },
    steam(x, y, c) { return `<path d="M${x} ${y} q-10 -18 0 -36 t0 -36" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".35"><animate attributeName="opacity" values=".1;.45;.1" dur="3s" repeatCount="indefinite"/></path>`; },
    waves(r, n, c) { let s = ''; for (let i = 0; i < n; i++) { const x = R(r() * 980), y = R(r() * 540); s += `<path d="M${x} ${y} q12 -8 24 0 t24 0" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`; } return s; },
    cactus(x, y, s, c) { return `<rect x="${x - 5 * s}" y="${y - 40 * s}" width="${10 * s}" height="${40 * s}" rx="${5 * s}" fill="${c}"/><rect x="${x - 17 * s}" y="${y - 28 * s}" width="${8 * s}" height="${16 * s}" rx="${4 * s}" fill="${c}"/><rect x="${x + 9 * s}" y="${y - 32 * s}" width="${8 * s}" height="${14 * s}" rx="${4 * s}" fill="${c}"/>`; },
  };
  // scatter scenery but keep it away from the stops
  function scatter(r, pts, count, draw, minD) {
    let s = '', tries = 0, made = 0;
    while (made < count && tries++ < count * 30) {
      const x = R(30 + r() * 940), y = R(40 + r() * 500);
      if (pts.some(([px, py]) => Math.hypot(px - x, py - y) < (minD || 90))) continue;
      s += draw(x, y, r); made++;
    }
    return s;
  }

  // ---- the boards: [language][chapter]
  const DESIGNS = {
    python: {
      1: { name: 'Meadow Valley', layout: 'wave', bg: 'linear-gradient(180deg, #2f7a4a 0%, #1c5232 55%, #12391f 100%)', path: '#d8f5c4', walked: '#ffe36e', regions: ['#4fa565', '#3f8f56', '#5bb370'],
        scene: (r, pts) => S.hills(170, 40, '#2a6b40', 1) + S.hills(260, 35, '#246037', 3) +
          `<path d="M-20 520 C 200 430, 260 560, 480 470 S 800 380, 1020 460" stroke="#3aa0d8" stroke-width="26" fill="none" opacity=".55"/>` +
          scatter(r, pts, 22, (x, y, r) => S.tree(x, y, 0.8 + r() * 0.5, ['#3f9a50', '#56b862', '#2f7e41'][Math.floor(r() * 3)], '#6b4a2b')) },
      2: { name: 'Pythonic Isles', layout: 'isles', bg: 'radial-gradient(ellipse at 50% 55%, #1a8a9a 0%, #0d5866 55%, #062a33 100%)', path: '#fff4c8', walked: '#ffd166', island: '#f0d58c', islandEdge: '#d9b968', regions: ['#3fb0a0'],
        scene: (r, pts) => S.waves(r, 40, 'rgba(255,255,255,.18)') +
          scatter(r, pts, 6, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="11" fill="#e6c97a" opacity=".55"/>`, 120),
        pin: (x, y) => `<ellipse cx="${x}" cy="${y + 14}" rx="92" ry="44" fill="#f0d58c"/><ellipse cx="${x}" cy="${y + 20}" rx="92" ry="40" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="4"/><g transform="translate(${x + 58} ${y + 6})"><rect x="-3" y="-34" width="6" height="34" fill="#8b5a2b"/><path d="M0 -34 q-22 -6 -30 8 M0 -34 q22 -6 30 8 M0 -34 q-10 -18 -24 -18 M0 -34 q10 -18 24 -18" stroke="#2f9e5a" stroke-width="7" fill="none" stroke-linecap="round"/></g>` },
    },
    javascript: {
      1: { name: 'Amber Mesas', layout: 'road', bg: 'linear-gradient(180deg, #f2a65a 0%, #c9703a 45%, #7a3d1c 100%)', path: '#fff1c2', walked: '#fffb8a', regions: ['#b85f2c', '#a65428', '#c46c34'],
        scene: (r, pts) => `<circle cx="830" cy="90" r="54" fill="#ffe7a0" opacity=".9"/>` +
          `<polygon points="0,250 70,250 90,200 210,200 230,250 1000,250 1000,560 0,560" fill="#b5602e" opacity=".55"/><polygon points="560,250 600,180 760,180 790,250" fill="#9c4f24" opacity=".7"/>` +
          scatter(r, pts, 14, (x, y, r) => S.cactus(x, y, 0.7 + r() * 0.5, '#4f8a3a')) },
      2: { name: 'The Neon Grid', layout: 'snake', bg: 'linear-gradient(180deg, #05010f 0%, #160632 50%, #2a0a4a 100%)', path: '#ff4fd8', walked: '#4ef0ff', regions: ['#7a2fa8', '#3a1d8a'],
        scene: (r) => { let s = ''; for (let i = 0; i < 26; i++) { const x = i * 42, h = 40 + r() * 80; s += `<rect x="${x}" y="${R(110 - h)}" width="38" height="${R(h)}" fill="#1a0838"/>`; for (let w = 0; w < 4; w++) if (r() > 0.4) s += `<rect x="${x + 6 + (w % 2) * 16}" y="${R(118 - h + 12 + Math.floor(w / 2) * 18)}" width="8" height="6" fill="${r() > 0.5 ? '#ff4fd8' : '#4ef0ff'}" opacity=".7"/>`; }
          for (let i = -10; i <= 10; i++) s += `<line x1="500" y1="120" x2="${500 + i * 120}" y2="560" stroke="#ff4fd8" stroke-opacity=".22" stroke-width="2"/>`;
          for (let k = 0; k < 9; k++) { const y = R(120 + Math.pow(k / 8, 1.8) * 440); s += `<line x1="0" y1="${y}" x2="1000" y2="${y}" stroke="#4ef0ff" stroke-opacity=".18" stroke-width="2"/>`; }
          return s; } },
    },
    cpp: {
      1: { name: 'Steel Peaks', layout: 'climb', bg: 'linear-gradient(180deg, #8fb6e0 0%, #4f78a8 40%, #1d3354 100%)', path: '#eaf4ff', walked: '#7ff0ff', regions: ['#36557f', '#2d4a70', '#3d6290'],
        scene: (r, pts) => S.mountain(160, 330, 420, 260, '#5b7ea8', '#f4f8ff') + S.mountain(520, 300, 520, 290, '#4a6d96', '#f4f8ff') + S.mountain(880, 320, 460, 250, '#557aa3', '#f4f8ff') +
          S.hills(380, 30, '#2b4a6c', 2) + scatter(r, pts, 26, (x, y, r) => S.pine(x, y, 0.8 + r() * 0.6, ['#1f5a4a', '#24684f'][Math.floor(r() * 2)])) },
      2: { name: 'The Iron Forge', layout: 'arch', bg: 'radial-gradient(ellipse at 50% 85%, #7a3412 0%, #3a170a 50%, #160804 100%)', path: '#ffb36b', walked: '#ffe066', regions: ['#6b3a22', '#5a2f1a'],
        scene: (r, pts) => `<path d="M-20 545 C 200 500, 380 560, 560 520 S 860 480, 1020 530" stroke="#ff7a1a" stroke-width="22" fill="none" opacity=".7"><animate attributeName="opacity" values=".5;.85;.5" dur="2.5s" repeatCount="indefinite"/></path>` +
          scatter(r, pts, 9, (x, y, r) => S.gear(x, y, 18 + r() * 26, ['#5a4a40', '#6e5a4c', '#4a3c34'][Math.floor(r() * 3)], 8 + Math.floor(r() * 5)), 110) +
          scatter(r, pts, 30, (x, y, r) => `<circle cx="${x}" cy="${y}" r="${(1 + r() * 2).toFixed(1)}" fill="#ffb36b" opacity=".6"><animate attributeName="cy" values="${y};${y - 30};${y}" dur="${(3 + r() * 3).toFixed(1)}s" repeatCount="indefinite"/></circle>`, 40) },
    },
    csharp: {
      1: { name: 'Violet Woods', layout: 'ring', bg: 'radial-gradient(ellipse at 50% 50%, #4a2f7a 0%, #2a1850 55%, #140b28 100%)', path: '#e9d8ff', walked: '#c18cff', regions: ['#5a3a90', '#4a2f7a', '#6a46a8'],
        scene: (r, pts) => scatter(r, pts, 26, (x, y, r) => S.tree(x, y, 0.9 + r() * 0.6, ['#7a4fc0', '#6a3fb0', '#9160d8'][Math.floor(r() * 3)], '#3a2550')) +
          scatter(r, pts, 10, (x, y) => `<rect x="${x - 3}" y="${y - 8}" width="6" height="8" fill="#f3e6d0"/><ellipse cx="${x}" cy="${y - 9}" rx="10" ry="6" fill="#ff6fa8"/>`, 70) + S.stars(r, 30, '#fff3a0') },
      2: { name: 'The Crystal Spire', layout: 'tower', bg: 'linear-gradient(180deg, #050722 0%, #141a52 55%, #2d3f8a 100%)', path: '#9ff0ff', walked: '#ffffff', regions: ['#34448a', '#2a3878'],
        scene: (r, pts) => S.stars(r, 70, '#cfe8ff') + `<polygon points="500,40 560,560 440,560" fill="#3d54b0" opacity=".25"/>` +
          scatter(r, pts, 16, (x, y, r) => S.crystal(x, y, 30 + r() * 50, ['#7fd8ff', '#b59cff', '#8fe9e0'][Math.floor(r() * 3)], 'rgba(255,255,255,.35)'), 95) },
    },
    java: {
      1: { name: 'Ember Hills', layout: 'snake', bg: 'linear-gradient(180deg, #e8794a 0%, #a8412a 45%, #4f1d14 100%)', path: '#ffe2c4', walked: '#ffd166', regions: ['#8a3a24', '#7a3220', '#9a4430'],
        scene: (r, pts) => `<polygon points="760,250 850,110 880,110 970,250" fill="#5a2418"/><path d="M850 110 q15 -40 30 0" fill="#ffb347"/>` + S.steam(866, 100, '#ffffff') +
          S.hills(300, 30, '#7a3020', 0.5) + scatter(r, pts, 20, (x, y, r) => S.tree(x, y, 0.8 + r() * 0.5, ['#e0732f', '#c85a24', '#f0a040'][Math.floor(r() * 3)], '#4a2416')) },
      2: { name: 'The Coffee Works', layout: 'climb', bg: 'radial-gradient(ellipse at 50% 40%, #7a5034 0%, #4e3220 55%, #1c110a 100%)', path: '#f4d9b0', walked: '#ffe9a8', regions: ['#6e4a30', '#5e3e28'],
        scene: (r, pts) => scatter(r, pts, 26, (x, y, r) => S.bean(x, y, 0.8 + r() * 0.6, R(r() * 180), ['#3a2214', '#4a2c1a', '#2e1a10'][Math.floor(r() * 3)]), 75) +
          scatter(r, pts, 5, (x, y) => `<path d="M${x - 18} ${y - 20} h36 l-4 30 h-28 Z" fill="#e8dccb"/><path d="M${x + 18} ${y - 14} q12 2 0 14" stroke="#e8dccb" stroke-width="4" fill="none"/>` + S.steam(x - 4, y - 24, '#ffffff'), 130) },
    },
  };

  const MapArt = {
    DESIGNS,
    board(lang, ch, n) {
      const d = (DESIGNS[lang] || DESIGNS.python)[ch] || DESIGNS.python[1];
      const pts = LAYOUTS[d.layout](n);
      const r = rng(lang + ':' + ch);
      return {
        name: d.name, bg: d.bg, pts, path: d.path, walked: d.walked,
        back: d.scene(r, pts),
        region: (i) => d.regions[i % d.regions.length],
        pin: d.pin || null,
      };
    },
  };
  root.MapArt = MapArt;
})(typeof window !== 'undefined' ? window : globalThis);
