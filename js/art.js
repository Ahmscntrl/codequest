/* CodeQuest — procedural pixel-ish art for characters and creatures. */
(function (root) {
  'use strict';

  const SKIN = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e', '#a8e6cf', '#b4a7ff'];
  const CLOTH = ['#4f8cff', '#ff5470', '#2ec4b6', '#ffbe0b', '#8338ec', '#fb5607', '#3a3a3a', '#f4f4f4', '#06d6a0', '#ef476f'];
  const HATS = ['none', 'cap', 'wizard', 'crown', 'beanie', 'headphones', 'antenna', 'bow'];
  const EYES = ['dots', 'happy', 'glasses', 'visor'];

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function shade(hex, amt) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const n = parseInt(c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, r + amt)); g = Math.max(0, Math.min(255, g + amt)); b = Math.max(0, Math.min(255, b + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /** Draw the hero. (x, y) is the bottom-centre of the feet. s = scale. */
  function drawHero(ctx, x, y, look, opt) {
    opt = opt || {};
    const s = opt.scale || 1;
    const facing = opt.facing || 1;
    const t = opt.t || 0;
    const moving = opt.moving;
    const air = opt.air;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * facing, s);
    if (opt.alpha !== undefined) ctx.globalAlpha = opt.alpha;
    const skin = look.skin || SKIN[0], shirt = look.shirt || CLOTH[0], pants = look.pants || CLOTH[6];
    // legs
    const swing = moving && !air ? Math.sin(t * 0.35) * 3 : 0;
    ctx.fillStyle = shade(pants, -20);
    rr(ctx, -6 + swing, -10, 5, 10, 2); ctx.fill();
    ctx.fillStyle = pants;
    rr(ctx, 1 - swing, -10, 5, 10, 2); ctx.fill();
    if (air) { ctx.fillStyle = pants; rr(ctx, -6, -11, 12, 6, 2); ctx.fill(); }
    // body
    const bob = moving && !air ? Math.abs(Math.sin(t * 0.35)) * 1 : 0;
    ctx.translate(0, -bob);
    ctx.fillStyle = shirt;
    rr(ctx, -8, -20, 16, 12, 4); ctx.fill();
    ctx.fillStyle = shade(shirt, -30);
    ctx.fillRect(-8, -11, 16, 2);
    // arm (with weapon: held low and forward; on attack it sweeps from overhead to the front)
    let armA = moving ? Math.sin(t * 0.35) * 0.5 : 0.1;
    if (opt.weapon) armA = opt.attack ? -2.9 + (1 - (opt.attackK || 0)) * 2.3 : (moving ? -0.25 + Math.sin(t * 0.35) * 0.12 : -0.25);
    ctx.save(); ctx.translate(2, -17); ctx.rotate(armA);
    ctx.fillStyle = shade(shirt, -15); rr(ctx, -2, 0, 4, 9, 2); ctx.fill();
    if (opt.weapon) drawWeaponInHand(ctx, opt.weapon, opt.attack);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, 9, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // head
    ctx.fillStyle = skin;
    rr(ctx, -9, -35, 18, 16, 5); ctx.fill();
    ctx.fillStyle = shade(skin, -25);
    ctx.fillRect(-9, -22, 18, 2);
    drawEyes(ctx, look.eyes || 'dots', t, opt.hurt);
    drawHat(ctx, look.hat || 'none', look.hatColor || CLOTH[1], t);
    ctx.restore();
  }
  function drawWeaponInHand(ctx, w, attacking) {
    ctx.save();
    ctx.translate(0, 9);
    ctx.rotate(attacking ? Math.PI : 1.05);
    const name = (w.name + ' ' + w.className).toLowerCase();
    if (/axe/.test(name)) {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-1, -16, 2.5, 18);
      ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.moveTo(1, -16); ctx.quadraticCurveTo(9, -13, 1, -7); ctx.fill();
    } else if (/staff|wand|rod/.test(name)) {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-1, -18, 2.5, 22);
      ctx.fillStyle = '#7cf'; ctx.beginPath(); ctx.arc(0, -19, 3.5, 0, Math.PI * 2); ctx.fill();
    } else if (/hammer/.test(name)) {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-1, -14, 2.5, 18);
      ctx.fillStyle = '#90a4ae'; ctx.fillRect(-5, -19, 10, 6);
    } else {
      ctx.fillStyle = '#5d4037'; ctx.fillRect(-1.5, -2, 3, 5);
      ctx.fillStyle = '#ffd166'; ctx.fillRect(-4, -3, 8, 2);
      const g = ctx.createLinearGradient(0, -20, 0, -3);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#9ad1ff');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(-2, -17); ctx.lineTo(0, -21); ctx.lineTo(2, -17); ctx.lineTo(2, -3); ctx.fill();
    }
    ctx.restore();
  }
  function drawEyes(ctx, style, t, hurt) {
    const blink = (Math.floor(t / 6) % 50) === 0;
    ctx.fillStyle = '#1b1b2f';
    if (hurt) {
      ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 1.5;
      [[-1, -28], [5, -28]].forEach(([ex, ey]) => { ctx.beginPath(); ctx.moveTo(ex - 2, ey - 2); ctx.lineTo(ex + 2, ey + 2); ctx.moveTo(ex + 2, ey - 2); ctx.lineTo(ex - 2, ey + 2); ctx.stroke(); });
      return;
    }
    if (style === 'visor') {
      ctx.fillStyle = '#1b1b2f'; rr(ctx, -6, -31, 15, 6, 3); ctx.fill();
      ctx.fillStyle = '#4ef0ff'; ctx.fillRect(-3 + (Math.sin(t * 0.05) + 1) * 4, -29, 3, 2);
      return;
    }
    if (style === 'happy') {
      ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(-1, -27, 2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, -27, 2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else if (blink) {
      ctx.fillRect(-3, -28, 4, 1.5); ctx.fillRect(3, -28, 4, 1.5);
    } else {
      ctx.fillRect(-2, -30, 3, 4); ctx.fillRect(4, -30, 3, 4);
      ctx.fillStyle = '#fff'; ctx.fillRect(-1, -30, 1, 1); ctx.fillRect(5, -30, 1, 1);
    }
    if (style === 'glasses') {
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1.2;
      ctx.strokeRect(-4, -31, 6, 6); ctx.strokeRect(3, -31, 6, 6);
      ctx.beginPath(); ctx.moveTo(2, -29); ctx.lineTo(3, -29); ctx.stroke();
    }
    // mouth
    ctx.fillStyle = '#c0392b'; ctx.fillRect(1, -24, 4, 1.5);
  }
  function drawHat(ctx, hat, color, t) {
    ctx.fillStyle = color;
    switch (hat) {
      case 'cap':
        ctx.beginPath(); ctx.arc(0, -34, 9.5, Math.PI, 0); ctx.fill();
        ctx.fillStyle = shade(color, -30); rr(ctx, 2, -36, 12, 3, 1.5); ctx.fill();
        break;
      case 'wizard':
        ctx.beginPath(); ctx.moveTo(-11, -33); ctx.lineTo(11, -33); ctx.lineTo(2, -54); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffe066';
        ctx.beginPath(); ctx.arc(1, -42, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-3, -37, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = shade(color, -30); ctx.fillRect(-11, -35, 22, 3);
        break;
      case 'crown':
        ctx.beginPath(); ctx.moveTo(-8, -34); ctx.lineTo(-8, -42); ctx.lineTo(-4, -38); ctx.lineTo(0, -44); ctx.lineTo(4, -38); ctx.lineTo(8, -42); ctx.lineTo(8, -34); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff5470'; ctx.beginPath(); ctx.arc(0, -37, 1.6, 0, Math.PI * 2); ctx.fill();
        break;
      case 'beanie':
        ctx.beginPath(); ctx.arc(0, -33, 10, Math.PI, 0); ctx.fill();
        ctx.fillStyle = shade(color, -30); ctx.fillRect(-10, -35, 20, 4);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -44, 3, 0, Math.PI * 2); ctx.fill();
        break;
      case 'headphones':
        ctx.strokeStyle = shade(color, -20); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, -30, 11, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        ctx.fillStyle = color; rr(ctx, -12, -31, 5, 8, 2); ctx.fill(); rr(ctx, 7, -31, 5, 8, 2); ctx.fill();
        break;
      case 'antenna':
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(0, -44); ctx.stroke();
        ctx.fillStyle = (Math.floor(t / 20) % 2) ? color : shade(color, 60);
        ctx.beginPath(); ctx.arc(0, -45, 2.6, 0, Math.PI * 2); ctx.fill();
        break;
      case 'bow':
        ctx.beginPath(); ctx.moveTo(4, -36); ctx.lineTo(-2, -40); ctx.lineTo(-2, -32); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, -36); ctx.lineTo(10, -40); ctx.lineTo(10, -32); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(color, -30); ctx.beginPath(); ctx.arc(4, -36, 1.8, 0, Math.PI * 2); ctx.fill();
        break;
    }
  }

  /** The little friend "i" — a living letter i. (x,y) = bottom centre. */
  function drawI(ctx, x, y, t, opt) {
    opt = opt || {};
    ctx.save();
    ctx.translate(x, y);
    const hop = opt.hop || 0;
    ctx.translate(0, -hop);
    const glow = 0.5 + Math.sin(t * 0.08) * 0.2;
    ctx.shadowColor = '#7df9ff'; ctx.shadowBlur = 8 * glow;
    // stem
    ctx.fillStyle = '#7df9ff';
    rr(ctx, -4, -16, 8, 16, 3); ctx.fill();
    // dot (floating head)
    const dy = Math.sin(t * 0.1) * 1.5;
    ctx.beginPath(); ctx.arc(0, -22 + dy, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // face on stem
    ctx.fillStyle = '#123';
    ctx.fillRect(-2.5, -12, 1.6, 2.2); ctx.fillRect(1, -12, 1.6, 2.2);
    ctx.fillRect(-1.2, -8.5, 2.4, 1);
    if (opt.label !== undefined && opt.label !== null) {
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.strokeText(String(opt.label), 0, -30); ctx.fillText(String(opt.label), 0, -30);
    }
    ctx.restore();
  }

  function drawPet(ctx, x, y, pet, t, opt) {
    opt = opt || {};
    const sp = (pet.species || '').toLowerCase();
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(opt.facing || 1, 1);
    const bob = Math.abs(Math.sin(t * 0.2)) * (opt.moving ? 2 : 0.6);
    ctx.translate(0, -bob);
    const col = pet.color || colorFor(pet.name || 'pet');
    if (/cat|kitt/.test(sp)) {
      ctx.fillStyle = col; rr(ctx, -8, -10, 16, 10, 4); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2, -16); ctx.lineTo(3, -22); ctx.lineTo(6, -17); ctx.fill();
      ctx.beginPath(); ctx.moveTo(7, -17); ctx.lineTo(10, -22); ctx.lineTo(11, -15); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(-14, -10 + Math.sin(t * 0.15) * 3, -12, -16); ctx.stroke();
      eyes(5, -13);
    } else if (/dog|pup/.test(sp)) {
      ctx.fillStyle = col; rr(ctx, -9, -11, 17, 11, 4); ctx.fill();
      ctx.beginPath(); ctx.arc(7, -13, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(col, -40); rr(ctx, 2, -17, 4, 9, 2); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(13, -12, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(-13, -13 + Math.sin(t * 0.5) * 2); ctx.stroke();
      eyes(7, -15);
    } else if (/bird|owl|parrot|duck/.test(sp)) {
      ctx.translate(0, -8 - Math.sin(t * 0.15) * 3);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -6, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(col, -30); ctx.beginPath(); ctx.ellipse(-3, -6 + Math.sin(t * 0.6) * 2, 5, 2.5, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb703'; ctx.beginPath(); ctx.moveTo(6, -7); ctx.lineTo(10, -6); ctx.lineTo(6, -5); ctx.fill();
      eyes(3, -8);
    } else if (/robot|bot|droid/.test(sp)) {
      ctx.fillStyle = '#9aa5b1'; rr(ctx, -7, -14, 14, 12, 3); ctx.fill();
      ctx.fillStyle = '#1b1b2f'; rr(ctx, -5, -12, 10, 5, 2); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(-3, -11, 2, 2); ctx.fillRect(2, -11, 2, 2);
      ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -19); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -20, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(0, -1.5, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (/dragon|lizard|dino/.test(sp)) {
      ctx.fillStyle = col; rr(ctx, -9, -11, 16, 10, 4); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -14, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(col, -30); ctx.beginPath(); ctx.moveTo(-3, -11); ctx.lineTo(-8, -20 + Math.sin(t * 0.3) * 3); ctx.lineTo(2, -11); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-9, -6); ctx.lineTo(-15, -4); ctx.lineTo(-9, -3); ctx.fill();
      eyes(9, -15);
    } else {
      // slime / blob / anything else
      const squish = 1 + Math.sin(t * 0.2) * 0.08;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0, -7 * squish, 9 / squish, 7 * squish, 0, Math.PI, 0); ctx.lineTo(9, 0); ctx.lineTo(-9, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-3, -10, 2.5, 1.5, -0.5, 0, Math.PI * 2); ctx.fill();
      eyes(1, -7);
    }
    ctx.restore();
    function eyes(ex, ey) {
      ctx.fillStyle = '#111';
      ctx.fillRect(ex - 2.5, ey - 1, 1.8, 2.4); ctx.fillRect(ex + 1, ey - 1, 1.8, 2.4);
    }
  }
  function colorFor(str) {
    let h = 0; for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const pal = ['#ff9f1c', '#f15bb5', '#9b5de5', '#00bbf9', '#00f5d4', '#fee440', '#ef476f', '#8ac926', '#c0c0c0', '#e07a5f'];
    return pal[h % pal.length];
  }

  const BUG_COLORS = { syntax: '#ff5470', name: '#b07cff', type: '#ffa53b' };
  function drawBug(ctx, b, t) {
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h);
    const col = BUG_COLORS[b.kind] || '#ff5470';
    const flash = b.hurt > 0 && Math.floor(b.hurt / 3) % 2 === 0;
    ctx.scale(b.vx < 0 ? -1 : 1, 1);
    if (b.flyer) {
      const wing = Math.sin(t * 0.8) * 0.5;
      ctx.fillStyle = 'rgba(220,240,255,0.7)';
      ctx.save(); ctx.translate(-2, -16); ctx.rotate(-0.6 + wing); ctx.beginPath(); ctx.ellipse(0, -6, 4, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(4, -16); ctx.rotate(0.4 - wing); ctx.beginPath(); ctx.ellipse(0, -6, 4, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // legs
    ctx.strokeStyle = '#2b2b3b'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const lx = -7 + i * 6, ph = Math.sin(t * 0.4 + i * 2) * 2;
      ctx.beginPath(); ctx.moveTo(lx, -6); ctx.lineTo(lx - 2 + ph, 0); ctx.stroke();
    }
    // body
    ctx.fillStyle = flash ? '#fff' : col;
    ctx.beginPath(); ctx.ellipse(-1, -10, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(col, -50);
    ctx.fillRect(-2, -18, 1.5, 16);
    // dots
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.arc(-6, -11, 2, 0, Math.PI * 2); ctx.arc(4, -12, 2, 0, Math.PI * 2); ctx.fill();
    // head
    ctx.fillStyle = '#2b2b3b';
    ctx.beginPath(); ctx.arc(10, -9, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(10, -11, 2.5, 2.5);
    ctx.fillStyle = '#f00'; ctx.fillRect(11, -10, 1.3, 1.3);
    // antennae
    ctx.strokeStyle = '#2b2b3b'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(11, -13); ctx.quadraticCurveTo(14, -20, 17, -19); ctx.stroke();
    ctx.restore();
    // label
    ctx.save();
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = col; ctx.globalAlpha = 0.9;
    const label = { syntax: 'Syntax', name: 'Name', type: 'Type' }[b.kind] + 'Bug';
    ctx.fillText(label, b.x + b.w / 2, b.y - 4);
    ctx.restore();
  }

  function drawBoss(ctx, boss, t) {
    const x = boss.x + boss.w / 2, y = boss.y + boss.h / 2;
    ctx.save();
    ctx.translate(x, y);
    const flash = boss.hurt > 0 && Math.floor(boss.hurt / 3) % 2 === 0;
    const jit = boss.phase2 ? 1.5 : 0.5;
    ctx.translate((Math.random() - 0.5) * jit, (Math.random() - 0.5) * jit);
    if (boss.state === 'telegraph') ctx.translate((Math.random() - 0.5) * 4, 0);
    // aura
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 80);
    g.addColorStop(0, boss.phase2 ? 'rgba(255,0,80,0.35)' : 'rgba(160,60,255,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill();
    // wings
    const wing = Math.sin(t * 0.25) * 0.4;
    ctx.fillStyle = 'rgba(120,40,160,0.7)';
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.scale(sd, 1); ctx.rotate(-0.3 + wing * sd * 0.2);
      ctx.beginPath(); ctx.moveTo(10, -10); ctx.quadraticCurveTo(60, -60, 75, -10); ctx.quadraticCurveTo(55, 0, 60, 15); ctx.quadraticCurveTo(35, 5, 10, 5); ctx.fill();
      ctx.restore();
    }
    // legs
    ctx.strokeStyle = '#1a0a24'; ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) {
      const ph = Math.sin(t * 0.2 + i) * 4;
      ctx.beginPath(); ctx.moveTo(sd * (8 + i * 6), 18); ctx.lineTo(sd * (20 + i * 8), 34 + ph); ctx.lineTo(sd * (24 + i * 9), 42 + ph); ctx.stroke();
    }
    // body
    const bodyG = ctx.createLinearGradient(0, -40, 0, 40);
    bodyG.addColorStop(0, flash ? '#fff' : '#3d0f4f'); bodyG.addColorStop(1, flash ? '#fff' : '#12051a');
    ctx.fillStyle = bodyG;
    ctx.beginPath(); ctx.ellipse(0, 6, 34, 30, 0, 0, Math.PI * 2); ctx.fill();
    // glitch stripes
    ctx.fillStyle = boss.phase2 ? '#ff2d6b' : '#b84dff';
    for (let i = 0; i < 4; i++) {
      const w = 20 + ((t * 3 + i * 37) % 30);
      ctx.globalAlpha = 0.5; ctx.fillRect(-w / 2 + Math.sin(t * 0.1 + i) * 6, -10 + i * 8, w, 2); ctx.globalAlpha = 1;
    }
    // head
    ctx.fillStyle = flash ? '#fff' : '#1a0a24';
    ctx.beginPath(); ctx.arc(0, -26, 18, 0, Math.PI * 2); ctx.fill();
    // crown
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath(); ctx.moveTo(-14, -38); ctx.lineTo(-14, -52); ctx.lineTo(-7, -44); ctx.lineTo(0, -56); ctx.lineTo(7, -44); ctx.lineTo(14, -52); ctx.lineTo(14, -38); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff2d6b'; ctx.beginPath(); ctx.arc(0, -44, 2.5, 0, Math.PI * 2); ctx.fill();
    // eyes
    const eyeCol = boss.phase2 ? '#ff2d6b' : '#ff5cf4';
    ctx.fillStyle = eyeCol; ctx.shadowColor = eyeCol; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(-7, -27, 4, 5.5, -0.3, 0, Math.PI * 2); ctx.ellipse(7, -27, 4, 5.5, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // mandibles
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2.5;
    const m = Math.sin(t * 0.3) * 0.2;
    ctx.beginPath(); ctx.moveTo(-6, -12); ctx.quadraticCurveTo(-12, -2, -4 - m * 10, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -12); ctx.quadraticCurveTo(12, -2, 4 + m * 10, 0); ctx.stroke();
    // antennae
    ctx.strokeStyle = '#1a0a24'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, -40); ctx.quadraticCurveTo(-25, -70, -38 + Math.sin(t * 0.1) * 4, -64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -40); ctx.quadraticCurveTo(25, -70, 38 + Math.sin(t * 0.1) * 4, -64); ctx.stroke();
    ctx.restore();
  }

  root.Art = { drawHero, drawI, drawPet, drawBug, drawBoss, rr, shade, SKIN, CLOTH, HATS, EYES, BUG_COLORS, colorFor };
})(typeof window !== 'undefined' ? window : globalThis);
