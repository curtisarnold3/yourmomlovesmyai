/* illustrations.js — procedural isometric vector hardware (no text inside images).
   Every drawing is generated from geometry so the same GPU rack can recur across chapters. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ILL = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
  let uid = 0;
  const P = (x, y, z, o) => [(x - y) * C30 + o[0], (x + y) * S30 - z + o[1]];
  const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const poly = (a, attrs) => `<polygon points="${pts(a)}" ${attrs || ''}/>`;
  const line = (a, b, attrs) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" ${attrs || ''}/>`;

  /** iso box faces: top (z1), left (y = y1 face), right (x = x1 face) */
  function box(x, y, z, w, d, h, o) {
    const x1 = x + w, y1 = y + d, z1 = z + h;
    return {
      top: [P(x, y, z1, o), P(x1, y, z1, o), P(x1, y1, z1, o), P(x, y1, z1, o)],
      left: [P(x, y1, z, o), P(x1, y1, z, o), P(x1, y1, z1, o), P(x, y1, z1, o)],
      right: [P(x1, y, z, o), P(x1, y1, z, o), P(x1, y1, z1, o), P(x1, y, z1, o)]
    };
  }
  function drawBox(b, f) {
    return poly(b.right, `fill="${f.right}" stroke="${f.stroke || 'none'}" stroke-width="${f.sw || 0.6}"`) +
      poly(b.left, `fill="${f.left}" stroke="${f.stroke || 'none'}" stroke-width="${f.sw || 0.6}"`) +
      poly(b.top, `fill="${f.top}" stroke="${f.stroke || 'none'}" stroke-width="${f.sw || 0.6}"`);
  }

  function defs(id, accent) {
    return `<defs>
      <linearGradient id="${id}m1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4558"/><stop offset=".55" stop-color="#1c2433"/><stop offset="1" stop-color="#121822"/></linearGradient>
      <linearGradient id="${id}m2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#151c29"/><stop offset="1" stop-color="#0b1019"/></linearGradient>
      <linearGradient id="${id}m3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4e5b71"/><stop offset="1" stop-color="#2a3344"/></linearGradient>
      <linearGradient id="${id}bz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3546"/><stop offset=".5" stop-color="#1a2130"/><stop offset="1" stop-color="#0f141e"/></linearGradient>
      <radialGradient id="${id}glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${accent}" stop-opacity=".55"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8c77a"/><stop offset="1" stop-color="#8a6a2a"/></linearGradient>
      <linearGradient id="${id}die" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b6b86"/><stop offset=".5" stop-color="#2b3448"/><stop offset="1" stop-color="#9aa8c0"/></linearGradient>
      <linearGradient id="${id}cp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c3cfdf"/><stop offset=".45" stop-color="#8794aa"/><stop offset="1" stop-color="#5d6a80"/></linearGradient>
      <pattern id="${id}perf" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#111824"/><circle cx="2" cy="2" r=".8" fill="#05080e"/></pattern>
    </defs>`;
  }

  /** A liquid-cooled AI rack: 18 compute trays, 9 switch trays, power shelves, manifold. */
  function rack(opt) {
    opt = Object.assign({ accent: '#5fd6ff', dim: 0, glow: true, ledPhase: 0, width: 240, label: '' }, opt || {});
    const id = 'r' + (++uid) + '_';
    const o = [130, 236];
    const W = 46, Dp = 92, H = 230;
    let s = `<svg viewBox="0 0 260 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opt.label || 'Isometric illustration of a liquid-cooled AI GPU server rack'}">` + defs(id, opt.accent);
    if (opt.glow) s += `<ellipse cx="${P(W / 2, Dp / 2, 0, o)[0]}" cy="${P(W / 2, Dp / 2, 0, o)[1] + 6}" rx="110" ry="34" fill="url(#${id}glow)" class="rack-glow"/>`;
    // floor shadow
    s += poly([P(-6, -6, 0, o), P(W + 6, -6, 0, o), P(W + 6, Dp + 6, 0, o), P(-6, Dp + 6, 0, o)], 'fill="#000" opacity=".45"');
    const b = box(0, 0, 0, W, Dp, H, o);
    s += poly(b.right, `fill="url(#${id}perf)" stroke="#2b3547" stroke-width=".8"`);
    s += poly(b.right, `fill="url(#${id}m2)" opacity=".55"`);
    s += poly(b.left, `fill="url(#${id}m1)" stroke="#3c475c" stroke-width=".8"`);
    s += poly(b.top, `fill="url(#${id}m3)" stroke="#55627a" stroke-width=".8"`);
    // side panel seams
    for (let z = 40; z < H; z += 46) s += line(P(W, 2, z, o), P(W, Dp - 2, z, o), 'stroke="#0a0f17" stroke-width="1"');
    // front (y = Dp face): slots from bottom
    const slots = [];
    const pushSlot = (type, h) => slots.push({ type, h });
    pushSlot('power', 10); for (let i = 0; i < 10; i++) pushSlot('compute', 7.4);
    for (let i = 0; i < 9; i++) pushSlot('switch', 4.2);
    for (let i = 0; i < 8; i++) pushSlot('compute', 7.4); pushSlot('power', 10);
    let z = 6;
    const xa = 3.5, xb = W - 6.5;
    const ledOn = (i) => ((i * 7 + opt.ledPhase) % 5) !== 0;
    slots.forEach((sl, i) => {
      const h = sl.h - 0.8;
      const face = [P(xa, Dp, z, o), P(xb, Dp, z, o), P(xb, Dp, z + h, o), P(xa, Dp, z + h, o)];
      if (sl.type === 'compute') {
        s += poly(face, `fill="url(#${id}bz)" stroke="#2f394b" stroke-width=".5"`);
        for (let k = 0; k < 7; k++) {
          const xx = xa + 10 + k * 3.6;
          s += line(P(xx, Dp, z + 1.6, o), P(xx, Dp, z + h - 1.6, o), 'stroke="#05080d" stroke-width="1.1"');
        }
        const led = P(xa + 4, Dp, z + h / 2, o);
        s += `<circle cx="${led[0].toFixed(1)}" cy="${led[1].toFixed(1)}" r="1.1" fill="${ledOn(i) ? opt.accent : '#2a3140'}" class="led"/>`;
        const led2 = P(xa + 6.5, Dp, z + h / 2, o);
        s += `<circle cx="${led2[0].toFixed(1)}" cy="${led2[1].toFixed(1)}" r=".8" fill="#7af0c8" opacity=".8"/>`;
      } else if (sl.type === 'switch') {
        s += poly(face, `fill="#0e131c" stroke="#263042" stroke-width=".4"`);
        for (let k = 0; k < 8; k++) {
          const p0 = P(xa + 9 + k * 3.2, Dp, z + 1, o);
          s += `<rect x="${(p0[0] - 0.9).toFixed(1)}" y="${(p0[1] - 2.2).toFixed(1)}" width="1.8" height="2" fill="#28344a"/>`;
        }
      } else {
        s += poly(face, `fill="#151b27" stroke="#2f394b" stroke-width=".5"`);
        const pp = P(xa + 4, Dp, z + h / 2, o);
        s += `<circle cx="${pp[0].toFixed(1)}" cy="${pp[1].toFixed(1)}" r="1.2" fill="#ffd27a"/>`;
      }
      z += sl.h;
    });
    // liquid manifold on the front right edge (supply cool / return warm)
    s += line(P(W - 4.2, Dp + 0.5, 4, o), P(W - 4.2, Dp + 0.5, H - 6, o), 'stroke="#3a8fd8" stroke-width="2.2" stroke-linecap="round"');
    s += line(P(W - 2.2, Dp + 0.5, 4, o), P(W - 2.2, Dp + 0.5, H - 6, o), 'stroke="#d8603a" stroke-width="2.2" stroke-linecap="round" opacity=".85"');
    // glass-door sheen + top vent grille + reflection
    s += `<linearGradient id="${id}sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".13"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
    s += poly(b.left, `fill="url(#${id}sheen)"`);
    for (let k = 8; k < Dp - 6; k += 6) s += line(P(6, k, H, o), P(W - 6, k, H, o), 'stroke="#2a3344" stroke-width="1.2"');
    // frame edges highlight
    s += line(P(0, Dp, 0, o), P(0, Dp, H, o), 'stroke="#6b7a94" stroke-width=".9"');
    s += line(P(W, Dp, 0, o), P(W, Dp, H, o), 'stroke="#8b9ab4" stroke-width="1"');
    s += line(P(0, Dp, H, o), P(W, Dp, H, o), 'stroke="#9fb0cc" stroke-width="1"');
    if (opt.dim > 0) s += `<rect x="0" y="0" width="260" height="340" fill="#070b14" opacity="${Math.min(opt.dim, 0.85)}"/>`;
    return s + '</svg>';
  }

  /** Exploded compute tray: chassis, board, 4 GPU packages w/ HBM, 2 CPUs, cold plates lifted. */
  function trayExploded(opt) {
    opt = Object.assign({ accent: '#5fd6ff', explode: 1 }, opt || {});
    const id = 't' + (++uid) + '_';
    const o = [122, 68];
    const e = opt.explode;
    let s = `<svg viewBox="0 0 330 252" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Exploded view of an AI compute tray: chassis, circuit board, four GPU packages with high-bandwidth memory stacks, two CPUs and liquid cold plates">` + defs(id, opt.accent);
    // chassis
    s += drawBox(box(0, 0, 0, 220, 120, 10, o), { top: '#1a2130', left: `url(#${id}m1)`, right: '#121925', stroke: '#3a4558' });
    // front fan grilles on chassis (y = 120 face) and rear I/O cages (x = 220 face)
    const ring = (cx, cz, r, Y) => { const a = []; for (let t = 0; t < 24; t++) { const th = t / 24 * Math.PI * 2; a.push(P(cx + r * Math.cos(th), Y, cz + r * Math.sin(th) * 0.9, o)); } return a; };
    [30, 75, 145, 190].forEach(cx => { s += poly(ring(cx, 5, 4.2, 120), 'fill="#0a0e16" stroke="#4a566c" stroke-width=".5"'); s += poly(ring(cx, 5, 1.4, 120), 'fill="#3a465c"'); });
    for (let k = 0; k < 6; k++) s += poly([P(220, 10 + k * 17, 2, o), P(220, 22 + k * 17, 2, o), P(220, 22 + k * 17, 8, o), P(220, 10 + k * 17, 8, o)], 'fill="#0d131d" stroke="#56647c" stroke-width=".5"');
    // board
    const zb = 10 + 26 * e;
    s += line(P(0, 120, 10, o), P(0, 120, zb, o), `stroke="${opt.accent}" stroke-dasharray="2 3" opacity=".5"`);
    s += line(P(220, 120, 10, o), P(220, 120, zb, o), `stroke="${opt.accent}" stroke-dasharray="2 3" opacity=".5"`);
    s += drawBox(box(6, 6, zb, 208, 108, 2, o), { top: '#0f2a22', left: '#0b1f19', right: '#081712', stroke: '#1d4a3b' });
    // traces
    for (let k = 0; k < 9; k++) s += line(P(14 + k * 22, 10, zb + 2, o), P(14 + k * 22, 110, zb + 2, o), 'stroke="#1e5a46" stroke-width=".5" opacity=".8"');
    // CPUs
    [[24, 20], [24, 74]].forEach(([x, y]) => { s += drawBox(box(x, y, zb + 2, 26, 26, 3, o), { top: `url(#${id}die)`, left: '#2b3448', right: '#1d2433', stroke: '#6c7a94', sw: .5 }); });
    // GPUs with HBM
    const gpus = [[78, 14], [146, 14], [78, 66], [146, 66]].sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    gpus.forEach(([x, y]) => {
      s += drawBox(box(x, y, zb + 2, 56, 40, 2, o), { top: `url(#${id}gold)`, left: '#6b5220', right: '#4d3a16', stroke: '#b89548', sw: .4 });
      s += drawBox(box(x + 14, y + 8, zb + 4, 28, 24, 2.4, o), { top: `url(#${id}die)`, left: '#2b3448', right: '#1d2433', stroke: '#a6b4cc', sw: .5 });
      // two compute dies on the interposer + decoupling capacitors
      s += line(P(x + 28, y + 9, zb + 6.5, o), P(x + 28, y + 31, zb + 6.5, o), 'stroke="#0b0f17" stroke-width="1"');
      for (let k = 0; k < 7; k++) { const c1 = P(x + 3 + k * 8, y + 10, zb + 4, o), c2 = P(x + 3 + k * 8, y + 29, zb + 4, o); s += `<rect x="${(c1[0] - .9).toFixed(1)}" y="${(c1[1] - .7).toFixed(1)}" width="1.8" height="1.2" fill="#c9a35a"/><rect x="${(c2[0] - .9).toFixed(1)}" y="${(c2[1] - .7).toFixed(1)}" width="1.8" height="1.2" fill="#c9a35a"/>`; }
      for (let k = 0; k < 4; k++) {
        s += drawBox(box(x + 4 + k * 13, y + 2, zb + 4, 8, 5, 3, o), { top: '#3d4a62', left: '#232b3b', right: '#1a2130', stroke: '#6d7c97', sw: .3 });
        s += drawBox(box(x + 4 + k * 13, y + 33, zb + 4, 8, 5, 3, o), { top: '#3d4a62', left: '#232b3b', right: '#1a2130', stroke: '#6d7c97', sw: .3 });
      }
    });
    // cold plates lifted
    const zc = zb + 8 + 46 * e;
    gpus.forEach(([x, y]) => {
      s += line(P(x + 28, y + 20, zb + 6, o), P(x + 28, y + 20, zc, o), `stroke="${opt.accent}" stroke-dasharray="2 3" opacity=".55"`);
      s += drawBox(box(x + 6, y + 4, zc, 44, 32, 5, o), { top: `url(#${id}cp)`, left: '#4a5568', right: '#353f50', stroke: '#c5d3ea', sw: .5 });
      for (let k = 0; k < 10; k++) s += line(P(x + 9 + k * 4, y + 6, zc + 5, o), P(x + 9 + k * 4, y + 34, zc + 5, o), 'stroke="#56637a" stroke-width=".6"');
      s += line(P(x + 10, y + 12, zc + 6, o), P(x + 46, y + 12, zc + 6, o), 'stroke="#3a8fd8" stroke-width="2.2" stroke-linecap="round"');
      s += line(P(x + 10, y + 28, zc + 6, o), P(x + 46, y + 28, zc + 6, o), 'stroke="#d8603a" stroke-width="2.2" stroke-linecap="round" opacity=".9"');
    });
    return s + '</svg>';
  }

  /** Isometric data hall with rows of racks; `lit` (0..1) controls how many are powered. */
  function dataHall(opt) {
    opt = Object.assign({ rows: 4, cols: 10, lit: 1, accent: '#5fd6ff', highlight: -1 }, opt || {});
    const id = 'h' + (++uid) + '_';
    const o = [352, 96];
    let s = `<svg viewBox="0 0 660 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Isometric data hall with rows of GPU racks">` + defs(id, opt.accent);
    const FW = opt.cols * 27 + 40, FD = opt.rows * 76 + 20;
    s += poly([P(-10, -10, 0, o), P(FW, -10, 0, o), P(FW, FD, 0, o), P(-10, FD, 0, o)], 'fill="#0c121d" stroke="#1d2738"');
    for (let gx = 0; gx <= FW; gx += 20) s += line(P(gx, -10, 0, o), P(gx, FD, 0, o), 'stroke="#141c2a" stroke-width=".6"');
    for (let gy = -10; gy <= FD; gy += 20) s += line(P(-10, gy, 0, o), P(FW, gy, 0, o), 'stroke="#141c2a" stroke-width=".6"');
    const total = opt.rows * opt.cols; let n = 0;
    for (let r = 0; r < opt.rows; r++) {
      for (let c = 0; c < opt.cols; c++) {
        const lit = (n / total) < opt.lit; const isH = n === opt.highlight; n++;
        const x = 20 + c * 27, y = 10 + r * 76;
        const b = box(x, y, 0, 27, 40, 74, o);
        s += drawBox(b, { top: '#4a5770', left: `url(#${id}m1)`, right: '#18202e', stroke: isH ? opt.accent : '#38445a', sw: isH ? 1.6 : .6 });
        for (let zz = 6; zz < 70; zz += 5) {
          const a = P(x + 3, y + 40, zz, o), bb = P(x + 23, y + 40, zz, o);
          s += line(a, bb, `stroke="${lit ? '#0a0f17' : '#0a0f17'}" stroke-width="1.2"`);
          if (lit && (Math.round(zz / 5) + c * 2 + r) % 3 === 0) { const l = P(x + 5, y + 40, zz + 2, o); s += `<circle cx="${l[0].toFixed(1)}" cy="${l[1].toFixed(1)}" r=".9" fill="${opt.accent}" class="led"/>`; }
        }
      }
    }
    return s + '</svg>';
  }

  /** Isometric house for the comps analogy. */
  function house(opt) {
    opt = Object.assign({ tint: '#2fd1a8' }, opt || {});
    const o = [130, 70];
    let s = `<svg viewBox="0 0 260 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Isometric house used in the price-per-square-foot comparison">`;
    s += poly([P(-14, -14, 0, o), P(104, -14, 0, o), P(104, 104, 0, o), P(-14, 104, 0, o)], 'fill="#0c121d" stroke="#1d2738"');
    for (let g = 0; g <= 90; g += 15) { s += line(P(g, 0, 0, o), P(g, 90, 0, o), `stroke="${opt.tint}" stroke-opacity=".18"`); s += line(P(0, g, 0, o), P(90, g, 0, o), `stroke="${opt.tint}" stroke-opacity=".18"`); }
    const b = box(10, 10, 0, 70, 70, 50, o);
    s += drawBox(b, { top: '#2b3547', left: '#26334a', right: '#1a2232', stroke: '#4d5c76' });
    // roof
    const r1 = P(10, 45, 85, o), r2 = P(80, 45, 85, o);
    s += poly([P(80, 10, 50, o), P(80, 80, 50, o), r2], `fill="#1e2738" stroke="#4d5c76"`);
    s += poly([P(10, 80, 50, o), P(80, 80, 50, o), r2, r1], `fill="#3a465c" stroke="#6b7a94"`);
    // door & windows
    s += poly([P(36, 80, 0, o), P(50, 80, 0, o), P(50, 80, 24, o), P(36, 80, 24, o)], `fill="${opt.tint}" opacity=".7"`);
    [[16, 26], [58, 26]].forEach(([x, zz]) => s += poly([P(x, 80, zz, o), P(x + 12, 80, zz, o), P(x + 12, 80, zz + 12, o), P(x, 80, zz + 12, o)], 'fill="#ffd27a" opacity=".55"'));
    return s + '</svg>';
  }

  /** Small rack glyph for timelines and fleets (fast, light). state: new|prod|aging|secondary|retired */
  function glyph(state) {
    const col = { new: '#5fd6ff', prod: '#2fd1a8', aging: '#ffb547', secondary: '#a98bff', retired: '#ff6f61' }[state] || '#5fd6ff';
    const op = state === 'retired' ? .35 : 1;
    const o = [22, 54];
    let s = `<svg viewBox="0 0 48 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g opacity="${op}">`;
    s += drawBox(box(0, 0, 0, 16, 26, 48, o), { top: '#5a6882', left: '#2e3a50', right: '#1a2232', stroke: '#6b7a94', sw: .6 });
    for (let zz = 4; zz < 46; zz += 4) { const a = P(1.5, 26, zz, o), b = P(14.5, 26, zz, o); s += line(a, b, 'stroke="#0a0f17" stroke-width="1"'); const l = P(3, 26, zz + 1.6, o); s += `<circle cx="${l[0].toFixed(1)}" cy="${l[1].toFixed(1)}" r=".7" fill="${col}"/>`; }
    return s + '</g></svg>';
  }

  return { rack, trayExploded, dataHall, house, glyph };
});
