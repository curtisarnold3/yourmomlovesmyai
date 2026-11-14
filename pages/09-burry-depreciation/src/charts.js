/* charts.js — tiny exact-scale SVG chart helpers (zero baseline, one y-axis, hover tooltips, sr tables). */
(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const tip = () => document.getElementById('tip');
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return m * p;
  }
  function ticks(lo, hi, n) {
    const span = hi - lo; const step = niceMax(span / (n || 4));
    const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function bindTips(svg) {
    svg.querySelectorAll('[data-tip]').forEach(m => {
      const show = e => { const t = tip(); if (!t) return; t.innerHTML = m.getAttribute('data-tip'); t.style.opacity = 1; const x = (e.touches ? e.touches[0].clientX : e.clientX), y = (e.touches ? e.touches[0].clientY : e.clientY); t.style.left = Math.min(x + 12, innerWidth - 250) + 'px'; t.style.top = (y + 14) + 'px'; };
      m.addEventListener('mousemove', show); m.addEventListener('touchstart', show, { passive: true });
      m.addEventListener('mouseleave', () => { const t = tip(); if (t) t.style.opacity = 0; });
    });
  }
  function srTable(cats, series, fmt) {
    let h = '<div class="sr-only"><table><thead><tr><th>Category</th>' + series.map(s => `<th>${esc(s.name)}</th>`).join('') + '</tr></thead><tbody>';
    cats.forEach((c, i) => { h += `<tr><td>${esc(c)}</td>` + series.map(s => `<td>${Number.isFinite(s.values[i]) ? fmt(s.values[i]) : "—"}</td>`).join('') + '</tr>'; });
    return h + '</tbody></table></div>';
  }
  function legend(series) {
    if (series.length < 2) return '';
    return '<div class="legend">' + series.map(s => `<span><span class="k" style="${s.outline ? `border:1.5px solid ${s.color};background:transparent` : s.pattern ? `background:repeating-linear-gradient(45deg,${s.color} 0 2px,transparent 2px 4px);border:1px solid ${s.color}` : `background:${s.color}`}"></span>${esc(s.name)}</span>`).join('') + '</div>';
  }

  /** Grouped bar chart. opts: cats, series[{name,values,color,outline,pattern}], h, fmt, yMax, yMin, label ('last'|'all'|'none'), desc */
  function bars(el, o) {
    const W = Math.max(300, el.clientWidth || 600), H = o.h || 220;
    const m = { l: 48, r: 10, t: 14, b: 28 };
    const fmt = o.fmt || (v => v.toFixed(1));
    const all = o.series.flatMap(s => s.values.filter(v => Number.isFinite(v)));
    let hi = o.yMax != null ? o.yMax : niceMax(Math.max(0, ...all) * 1.08);
    let lo = o.yMin != null ? o.yMin : Math.min(0, ...all) < 0 ? -niceMax(-Math.min(...all) * 1.08) : 0;
    if (hi === lo) hi = lo + 1;
    const y = v => m.t + (hi - v) / (hi - lo) * (H - m.t - m.b);
    const n = o.cats.length, gw = (W - m.l - m.r) / n, ns = o.series.length;
    const bw = Math.max(4, Math.min(46, (gw - 10) / ns - 2));
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${esc(o.desc || '')}" preserveAspectRatio="none">`;
    ticks(lo, hi, 4).forEach(t => { s += `<line class="gr" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${fmt(t)}</text>`; });
    s += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
    o.cats.forEach((c, i) => {
      const gx = m.l + i * gw + (gw - ns * (bw + 2)) / 2;
      s += `<text x="${m.l + i * gw + gw / 2}" y="${H - 8}" text-anchor="middle">${esc(c)}</text>`;
      o.series.forEach((se, j) => {
        const v = se.values[i]; if (!Number.isFinite(v)) return;
        const x = gx + j * (bw + 2), y0 = y(Math.max(v, 0)), hgt = Math.abs(y(v) - y(0));
        const r = Math.min(4, bw / 2, hgt);
        const tipTxt = `${esc(se.name)} · ${esc(c)}: <b>${fmt(v)}</b>`;
        const fill = se.outline ? 'transparent' : se.pattern ? `url(#pat${j})` : se.color;
        // rounded data-end only (away from baseline)
        const top = v >= 0;
        const d = hgt < 0.5 ? '' : top
          ? `M${x},${y0 + hgt} V${y0 + r} Q${x},${y0} ${x + r},${y0} H${x + bw - r} Q${x + bw},${y0} ${x + bw},${y0 + r} V${y0 + hgt} Z`
          : `M${x},${y(0)} V${y(0) + hgt - r} Q${x},${y(0) + hgt} ${x + r},${y(0) + hgt} H${x + bw - r} Q${x + bw},${y(0) + hgt} ${x + bw},${y(0) + hgt - r} V${y(0)} Z`;
        if (d) s += `<path class="m" d="${d}" fill="${fill}" stroke="${se.outline || se.pattern ? se.color : 'none'}" stroke-width="${se.outline ? 1.5 : 1}" stroke-dasharray="${se.dash || ''}" data-tip="${tipTxt}"/>`;
        s += `<rect x="${x - 1}" y="${m.t}" width="${bw + 2}" height="${H - m.t - m.b}" fill="transparent" data-tip="${tipTxt}"/>`;
        const lab = o.label === 'all' || (o.label === 'nonzero' && Math.abs(v) > 1e-9);
        if (lab && hgt > 0) s += `<text class="vl" x="${x + bw / 2}" y="${top ? y0 - 4 : y(v) + 13}" text-anchor="middle">${fmt(v)}</text>`;
      });
    });
    let defs = '<defs>' + o.series.map((se, j) => `<pattern id="pat${j}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="${se.color}" opacity=".18"/><line x1="0" y1="0" x2="0" y2="5" stroke="${se.color}" stroke-width="2.2"/></pattern>`).join('') + '</defs>';
    s = s.replace('preserveAspectRatio="none">', 'preserveAspectRatio="none">' + defs);
    s += '</svg>';
    el.innerHTML = legend(o.series) + s + srTable(o.cats, o.series, fmt);
    bindTips(el.querySelector('svg'));
  }

  /** Line chart (2px lines, >=8px markers). */
  function lines(el, o) {
    const W = Math.max(300, el.clientWidth || 600), H = o.h || 200;
    const m = { l: 48, r: 12, t: 14, b: 28 };
    const fmt = o.fmt || (v => v.toFixed(1));
    const all = o.series.flatMap(s => s.values.filter(v => Number.isFinite(v)));
    const hi = o.yMax != null ? o.yMax : niceMax(Math.max(0, ...all) * 1.08);
    const lo = o.yMin != null ? o.yMin : Math.min(0, ...all) < 0 ? -niceMax(-Math.min(...all) * 1.08) : 0;
    const n = o.cats.length;
    const x = i => m.l + (n === 1 ? 0.5 : i / (n - 1)) * (W - m.l - m.r);
    const y = v => m.t + (hi - v) / (hi - lo || 1) * (H - m.t - m.b);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${esc(o.desc || '')}">`;
    ticks(lo, hi, 4).forEach(t => { s += `<line class="gr" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${fmt(t)}</text>`; });
    s += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
    o.cats.forEach((c, i) => s += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(c)}</text>`);
    o.series.forEach(se => {
      const pts = se.values.map((v, i) => Number.isFinite(v) ? [x(i), y(v)] : null).filter(Boolean);
      if (se.step) {
        let d = ''; se.values.forEach((v, i) => { if (!Number.isFinite(v)) return; d += (d ? 'L' : 'M') + x(i) + ',' + y(v); });
        s += `<path class="m" d="${d}" fill="none" stroke="${se.color}" stroke-width="2" stroke-dasharray="${se.dash || ''}"/>`;
      } else s += `<polyline class="m" points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${se.color}" stroke-width="2" stroke-dasharray="${se.dash || ''}"/>`;
      se.values.forEach((v, i) => { if (!Number.isFinite(v)) return; s += `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${se.color}" stroke="#0d1424" stroke-width="2" data-tip="${esc(se.name)} · ${esc(o.cats[i])}: <b>${fmt(v)}</b>"/><circle cx="${x(i)}" cy="${y(v)}" r="12" fill="transparent" data-tip="${esc(se.name)} · ${esc(o.cats[i])}: <b>${fmt(v)}</b>"/>`; });
    });
    s += '</svg>';
    el.innerHTML = legend(o.series) + s + srTable(o.cats, o.series, fmt);
    bindTips(el.querySelector('svg'));
  }

  /** Vertical waterfall. steps: [{label, value, kind:'total'|'delta', color}] */
  function waterfall(el, o) {
    const W = Math.max(300, el.clientWidth || 600), H = o.h || 240;
    const m = { l: 48, r: 10, t: 18, b: 40 };
    const fmt = o.fmt || (v => v.toFixed(1));
    let run = 0; const bars = [];
    o.steps.forEach(st => {
      if (st.kind === 'total') { bars.push({ st, a: 0, b: st.value }); run = st.value; }
      else { bars.push({ st, a: run, b: run + st.value }); run += st.value; }
    });
    const vals = bars.flatMap(b => [b.a, b.b]);
    const hi = o.yMax != null ? o.yMax : niceMax(Math.max(0, ...vals) * 1.08);
    const lo = Math.min(0, ...vals) < 0 ? -niceMax(-Math.min(...vals) * 1.1) : 0;
    const y = v => m.t + (hi - v) / (hi - lo) * (H - m.t - m.b);
    const n = bars.length, gw = (W - m.l - m.r) / n, bw = Math.min(64, gw * 0.62);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${esc(o.desc || '')}">`;
    ticks(lo, hi, 4).forEach(t => { s += `<line class="gr" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${fmt(t)}</text>`; });
    s += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
    bars.forEach((b, i) => {
      const x = m.l + i * gw + (gw - bw) / 2; const top = y(Math.max(b.a, b.b)), h = Math.max(Math.abs(y(b.a) - y(b.b)), 0.0);
      const v = b.st.kind === 'total' ? b.b : b.st.value;
      if (h > 0.4) s += `<rect class="m" x="${x}" y="${top}" width="${bw}" height="${h}" rx="3" fill="${b.st.color}" ${b.st.hatch ? `fill-opacity=".35" stroke="${b.st.color}"` : ''} data-tip="${esc(b.st.label)}: <b>${fmt(v)}</b>"/>`;
      else s += `<line x1="${x}" x2="${x + bw}" y1="${top}" y2="${top}" stroke="${b.st.color}" stroke-width="2"/>`;
      if (i < n - 1 && bars[i + 1].st.kind !== 'total') s += `<line x1="${x + bw}" x2="${x + gw}" y1="${y(b.b)}" y2="${y(b.b)}" stroke="rgba(180,192,211,.4)" stroke-dasharray="2 3"/>`;
      s += `<text class="vl" x="${x + bw / 2}" y="${top - 5}" text-anchor="middle">${b.st.kind === 'delta' && v > 0 ? '+' : ''}${fmt(v)}</text>`;
      const full = (b.st.short && b.st.label.length * 6.9 > gw - 4) ? b.st.short : b.st.label;
      const words = full.split(' ');
      const l1 = words.slice(0, Math.ceil(words.length / 2)).join(' '), l2 = words.slice(Math.ceil(words.length / 2)).join(' ');
      s += `<text x="${x + bw / 2}" y="${H - 24}" text-anchor="middle">${esc(l1)}</text><text x="${x + bw / 2}" y="${H - 11}" text-anchor="middle">${esc(l2)}</text>`;
    });
    s += '</svg>';
    el.innerHTML = s + srTable(o.steps.map(s => s.label), [{ name: 'Value', values: o.steps.map(s => s.value) }], fmt);
    bindTips(el.querySelector('svg'));
  }

  root.CH = { bars, lines, waterfall, niceMax, esc };
})(typeof self !== 'undefined' ? self : this);
