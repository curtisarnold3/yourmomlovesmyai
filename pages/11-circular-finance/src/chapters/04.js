/* Chapter 04: Leverage calculator. Sliders -> ctx.set; outputs from M.leverage / M.runLoop / M.claimsStack. */
Chapters["04"] = function (root, ctx) {
  'use strict';
  var M = ctx.M, F = ctx.fmt, NS = 'http://www.w3.org/2000/svg';
  function $(s, r) { return (r || root).querySelector(s); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function sv(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag), k;
    for (k in (attrs || {})) e.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; }
  function tv(t, kind) { var s = el('span', 'tv'); ctx.tagged(s, t, kind || 'usd'); return s; }
  function P(parts, cls) {
    var p = el('p', cls || '');
    parts.forEach(function (x) { p.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
    return p;
  }
  function fill(host, parts) { clear(host); parts.forEach(function (x) { host.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); }); }

  var defs = M.paramDefs(), byId = {}, dflt = M.defaults();
  defs.forEach(function (d) { byId[d.id] = d; });
  var docs = {};
  ((ctx.data.defaults && ctx.data.defaults.params) || []).forEach(function (p) { docs[p.id] = p; });
  var presetDocs = {};
  ((ctx.data.defaults && ctx.data.defaults.presets) || []).forEach(function (p) { presetDocs[p.id] = p; });

  var MAIN = ['loan_to_cost', 'nvidia_share_of_build_cost', 'nvidia_gross_margin', 'valuation_multiple', 'lab_outside_revenue_share', 'lab_funding_mix', 'credit_fund_back_leverage_ratio', 'gpu_useful_life_years', 'gpu_rental_decline_per_year'];
  var SHORT = {
    loan_to_cost: 'Borrowed share of the bill (loan-to-cost)', nvidia_share_of_build_cost: 'Nvidia’s share of the bill', nvidia_gross_margin: 'Nvidia’s profit margin on sales', valuation_multiple: 'Price paid per $1 of profit',
    lab_outside_revenue_share: 'Lab: rent paid from outside revenue', lab_funding_mix: 'Lab: share of its raised money that is recycled', credit_fund_back_leverage_ratio: 'Fund’s own bank borrowing', gpu_useful_life_years: 'GPU useful life', gpu_rental_decline_per_year: 'GPU rental decline per year'
  };
  /* Plain-word visible labels for the advanced knobs. The exact model terms stay in each label's hover text. */
  var PLAINLAB = {
    gross_to_net_conversion: 'Share of gross profit left as net profit', recurring_revenue_share: 'Share of new profit the market treats as repeating',
    reinvest_fraction: 'Share of Nvidia’s profit put back in next lap', contract_value_to_build_cost: 'Rental contract size versus the bill',
    contract_years: 'Rental contract length', contract_prepayment_share: 'Share of the contract paid up front', nvidia_share_of_vendor_funding: 'Nvidia’s share of vendor-sourced lab money',
    neocloud_opex_share: 'Running costs as share of contract revenue', backstop_share_of_capacity: 'Size of Nvidia’s safety-net promise', backstop_trigger_shortfall: 'Shortfall that triggers the safety net',
    mezz_ratio: 'Company bonds and convertibles per $1 of Nvidia equity', margin_loan_share: 'Share of neocloud stock bought with borrowed money', neocloud_equity_mark: 'Value of Nvidia’s neocloud stake versus cost',
    base_rate: 'Bank base interest rate', credit_spread: 'Extra interest the borrower pays over the base rate', debt_term_years: 'Years to repay the debt', floating_share: 'Share of debt whose rate moves with the base rate'
  };
  function LAB(id) { return SHORT[id] || PLAINLAB[id] || (byId[id] && byId[id].label) || id; }
  function readerWhy(doc) {
    if (doc && doc.reader_note) return cleanWhy(doc.reader_note);
    var t = String((doc && doc.rationale) || '');
    var parts = t.split(/(?<=[.;])\s+/).filter(function (x) { return !/\b(the )?research\b|builder/i.test(x); }).map(function (x) { return x.replace(/,?\s*not re-?(fetched|verified)[^)]*/i, ''); });
    var out = cleanWhy(parts.join(' ').replace(/^Hypothetical\.?\s*/i, ''));
    if (/SOFR/.test(out) && !/SOFR is/.test(out)) out += ' (SOFR is a standard bank base interest rate.)';
    if (/^Hypothetical/i.test(t) || !out) out = 'We chose this because it is a middle setting; no source gives a number. ' + out;
    return out.trim();
  }
  function cleanWhy(t) { return String(t || '').replace(/;?\s*see alt_values\.?/g, '.').replace(/\balt_values\b/g, 'the alternative values').replace(/\b[a-z]+(?:_[a-z0-9]+)+\b/g, function (m) { return byId[m] ? LAB(m) : m.replace(/_/g, ' '); }); }
  var PLAIN = {
    loan_to_cost: ['Loan-to-cost: how much of the GPU bill is borrowed. At 50% half is debt; at 80% the owners’ own money is a thin first-loss slice (the slice that takes losses first). This is the main lever on the multiplier.', 'waterfall'],
    nvidia_share_of_build_cost: ['What slice of every dollar spent on the cluster ends up as Nvidia revenue. The rest goes to networking, buildings, power and other vendors.', 'waterfall'],
    nvidia_gross_margin: ['How much of that revenue Nvidia keeps after making the chips. Higher margin means more profit per dollar of the loop.', 'waterfall'],
    valuation_multiple: ['How many dollars the market pays for a dollar of recurring profit (the price-to-earnings or P/E multiple). It turns profit into the hatched paper number, which is not cash.', 'waterfall'],
    lab_outside_revenue_share: ['How much of the lab’s rent is paid from what real customers pay the lab, rather than from money the lab raised. This is the knob that decides how much of the loop touches the outside world.', 'cash mix'],
    lab_funding_mix: ['Of the capital the lab raises, how much comes from vendors in the loop (recycled) rather than from outside investors.', 'cash mix'],
    credit_fund_back_leverage_ratio: ['Back-leverage: how much the credit fund itself borrowed from a bank per dollar of its investors’ money (its limited partners, or LPs). More back-leverage means more claimants stacked on the same loan, not more cash.', 'claims'],
    gpu_useful_life_years: ['How long the chips earn their keep. Shorter life means the collateral shrinks faster while the loan stays the same size.', 'claims'],
    gpu_rental_decline_per_year: ['How fast the market rent for these GPUs falls each year. Faster decline means less value behind the same claims.', 'claims']
  };
  var MOVES = { waterfall: 'moves the waterfall', 'cash mix': 'moves the cash mix', claims: 'moves the claims readout' };

  function fv(id, v) {
    var d = byId[id]; if (!d) return String(v);
    if (d.unit === 'fraction') return F.pct(v, { digits: (d.step < 0.01 ? 1 : 0) });
    if (d.unit === 'x') return F.x(v, { digits: d.step >= 1 ? 0 : 1 });
    if (d.unit === 'years') return v + (v === 1 ? ' year' : ' years');
    if (d.unit === 'per year') return F.pct(v, { digits: 0 }) + ' a year';
    return String(v);
  }
  function eq(a, b) { return Math.abs(a - b) < 1e-9; }
  function changed(id) { return !eq(ctx.state.params[id], dflt[id]); }

  /* ---------- knobs ---------- */
  var rows = {};
  function buildRow(id, host, main) {
    var d = byId[id], doc = docs[id] || {};
    var row = el('div', 'c4-row'); row.dataset.id = id;
    var top = el('div', 'c4-rtop');
    var lab = el('label', 'c4-lab', LAB(id)); lab.setAttribute('for', 'c4-in-' + id); lab.title = 'Model term: ' + d.label;
    var val = el('span', 'c4-val mono'), tagslot = el('span', 'c4-ts');
    var info = el('button', 'c4-i', '?'); info.type = 'button'; info.setAttribute('aria-expanded', 'false'); info.setAttribute('aria-label', 'Where does the default for ' + LAB(id) + ' come from?');
    top.appendChild(lab); top.appendChild(val); top.appendChild(tagslot); top.appendChild(info);
    var inp = el('input'); inp.type = 'range'; inp.id = 'c4-in-' + id; inp.min = d.min; inp.max = d.max; inp.step = d.step; inp.value = ctx.state.params[id];
    var why = el('div', 'c4-why'); why.id = 'c4-why-' + id; why.setAttribute('role', 'note');
    inp.setAttribute('aria-describedby', why.id);
    var ends = el('div', 'c4-ends mono'); ends.appendChild(el('span', '', fv(id, d.min))); ends.appendChild(el('span', 'c4-def', 'default ' + fv(id, d.value))); ends.appendChild(el('span', '', fv(id, d.max)));
    row.appendChild(top); row.appendChild(inp); row.appendChild(ends); row.appendChild(why);
    host.appendChild(row);
    inp.addEventListener('input', function () { var o = {}; o[id] = +inp.value; ctx.set(o); });
    info.addEventListener('click', function () { var o = row.classList.toggle('open'); info.setAttribute('aria-expanded', String(o)); });
    row.addEventListener('keydown', function (e) { if (e.key === 'Escape' && row.classList.contains('open')) { row.classList.remove('open'); info.setAttribute('aria-expanded', 'false'); } });
    // why panel content
    fill(why, [el('b', '', 'Default ' + fv(id, d.value) + '. '), readerWhy(doc) || d.label]);
    if (doc.source_ids && doc.source_ids.length) {
      var sl = el('span', 'c4-src'); sl.appendChild(document.createTextNode(' Sources: '));
      doc.source_ids.slice(0, 3).forEach(function (s, i) { if (i) sl.appendChild(document.createTextNode('; ')); sl.appendChild(ctx.sourceLink(s)); });
      why.appendChild(sl);
    }
    var chg = el('span', 'c4-chg'); why.appendChild(chg);
    rows[id] = { row: row, inp: inp, val: val, tagslot: tagslot, chg: chg };
  }
  function syncRows() {
    Object.keys(rows).forEach(function (id) {
      var r = rows[id], v = ctx.state.params[id], ch = changed(id);
      if (document.activeElement !== r.inp || +r.inp.value !== v) r.inp.value = v;
      r.val.textContent = fv(id, v);
      r.inp.setAttribute('aria-valuetext', fv(id, v) + (ch ? ', changed from default, hypothetical' : ''));
      r.row.classList.toggle('changed', ch);
      clear(r.tagslot); r.tagslot.appendChild(ctx.tag(M.effectiveStatus(id, v), { formula: ch ? 'Moved from the default of ' + fv(id, byId[id].value) + ', so it counts as hypothetical.' : '' }));
      r.chg.textContent = ch ? ' You moved this from ' + fv(id, byId[id].value) + ', so it is now hypothetical.' : '';
    });
  }

  /* ---------- outputs ---------- */
  function derived(v, status, f) { return { value: v, status: status, formula_text: f }; }
  var mkdone = false;
  function drawWaterfall(L) {
    var svg = clear($('#c4-wf')), W = 500, rowH = 48, top = 8, H = top + rowH * L.steps.length + 6, xs = 128, cw = 240;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var t = sv('title', { id: 'c4-wf-t' }); t.textContent = 'Waterfall: seed to debt to build cost, then revenue, profit and paper market value';
    var d = sv('desc', { id: 'c4-wf-d' }); d.textContent = 'Horizontal bars, one row per step, per seed dollars. Paper market value is hatched and is not cash.';
    svg.appendChild(t); svg.appendChild(d);
    var defsEl = sv('defs'); var pat = sv('pattern', { id: 'c4hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    pat.appendChild(sv('rect', { width: 6, height: 6, fill: 'rgba(185,195,220,.10)' })); pat.appendChild(sv('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#b9c3dc', 'stroke-width': 2, 'stroke-opacity': .75 }));
    defsEl.appendChild(pat); svg.appendChild(defsEl);
    var mx = 1; L.steps.forEach(function (s) { mx = Math.max(mx, s.running_total.value || 0); });
    var sc = cw / mx;
    var LAB = { seed: ['Seed', 'recycled cash'], debt: ['Lender debt', 'outside, repaid'], build_cost: ['Build cost', 'seed + debt'], revenue: ['Nvidia revenue', 'cash, both sources'], gross_profit: ['Gross profit', 'accounting'], net_profit: ['Net profit', 'accounting'], paper_value: ['Market value', 'paper, not cash'] };
    var seedV = L.steps[0].delta.value, prevEnd = 0;
    L.steps.forEach(function (s, i) {
      var y = top + i * rowH, bh = 22, by = y + 10, a = LAB[s.id] || [s.label, ''], v = s.delta.value || 0, x0 = xs, w = v * sc, label;
      var g = sv('g', { class: 'c4-bar', tabindex: 0, role: 'img', 'aria-label': a[0] + ' ' + F.usd(v) + ', ' + s.delta.status + '. ' + (s.delta.formula_text || '') });
      var tt = sv('title'); tt.textContent = a[0] + ': ' + F.usd(v) + ' (' + s.delta.status + '). ' + (s.delta.formula_text || ''); g.appendChild(tt);
      var lt = sv('text', { x: xs - 8, y: y + 20, 'text-anchor': 'end', class: 'c4-lt' }); lt.textContent = a[0]; g.appendChild(lt);
      var ls = sv('text', { x: xs - 8, y: y + 35, 'text-anchor': 'end', class: 'c4-ls' }); ls.textContent = a[1]; g.appendChild(ls);
      var end;
      if (s.id === 'seed') { g.appendChild(sv('rect', { x: x0, y: by, width: w, height: bh, class: 'c4-r-rec' })); end = x0 + w; label = F.usd(v); }
      else if (s.id === 'debt') { x0 = xs + seedV * sc; g.appendChild(sv('rect', { x: x0, y: by, width: w, height: bh, class: 'c4-r-debt' })); end = x0 + w; label = '+' + F.usd(v); }
      else if (s.id === 'build_cost') { g.appendChild(sv('rect', { x: xs, y: by, width: seedV * sc, height: bh, class: 'c4-r-rec' })); g.appendChild(sv('rect', { x: xs + seedV * sc, y: by, width: w - seedV * sc, height: bh, class: 'c4-r-debt' })); end = xs + w; label = '= ' + F.usd(v); }
      else if (s.id === 'revenue' && s.split) {
        var rv = s.split.recycled.value * sc;
        g.appendChild(sv('rect', { x: xs, y: by, width: rv, height: bh, class: 'c4-r-rec' })); g.appendChild(sv('rect', { x: xs + rv, y: by, width: w - rv, height: bh, class: 'c4-r-ext' })); end = xs + w; label = F.usd(v);
      }
      else if (s.id === 'paper_value') { g.appendChild(sv('rect', { x: xs, y: by, width: w, height: bh, class: 'c4-r-paper', fill: 'url(#c4hatch)' })); end = xs + w; label = F.usd(v); }
      else { g.appendChild(sv('rect', { x: xs, y: by, width: w, height: bh, class: 'c4-r-acct' })); end = xs + w; label = F.usd(v); }
      var vt = sv('text', { x: end + 6, y: by + 16, class: 'c4-vt' }); vt.textContent = label; g.appendChild(vt);
      svg.appendChild(g);
    });
    // connectors: seed -> debt -> build
    var xSeed = xs + seedV * sc, xB = xs + L.steps[2].delta.value * sc;
    svg.appendChild(sv('line', { x1: xSeed, x2: xSeed, y1: top + 10 + 22, y2: top + rowH + 10, class: 'c4-conn' }));
    svg.appendChild(sv('line', { x1: xB, x2: xB, y1: top + rowH + 10 + 22, y2: top + 2 * rowH + 10, class: 'c4-conn' }));
    // divider: cash side vs Nvidia side
    var ly = top + 3 * rowH - 4;
    svg.appendChild(sv('line', { x1: 8, x2: W - 8, y1: ly, y2: ly, class: 'c4-div' }));
  }
  function renderOut() {
    var p = ctx.state.params, L = M.leverage(p), h = L.headline, run = M.runLoop(p, 1), cum = run.cumulative;
    fill($('#c4-headline'), [tv(h.seed), ' of seed → ', tv(h.debt), ' of debt, ', tv(h.revenue), ' of revenue, ', tv(h.paper_value), ' of market value ', el('span', 'c4-paper', '(paper, not cash)')]);
    var m = clear($('#c4-mults'));
    [['Build cost per $1 of seed', h.leverage_multiplier], ['Debt per $1 of seed', h.debt_multiplier], ['Revenue per $1 of seed', h.revenue_multiplier], ['Market value per $1 (paper)', h.paper_multiplier]].forEach(function (x) {
      var d = el('div', 'c4-m'); d.appendChild(el('div', 'k', x[0])); var v = el('div', 'v'); v.appendChild(tv(x[1], 'x')); d.appendChild(v); m.appendChild(d);
    });
    fill($('#c4-mini'), ['Debt ', F.usd(h.debt.value), ' \u00b7 Revenue ', F.usd(h.revenue.value), ' \u00b7 Paper ', F.usd(h.paper_value.value)]);
    var n = 0; Object.keys(dflt).forEach(function (k) { if (k !== 'seed_usd' && changed(k)) n++; });
    $('#c4-changed').textContent = n ? 'You’ve moved ' + n + (n === 1 ? ' knob' : ' knobs') + ' from the defaults, so every output here is hypothetical.' : 'Knobs are at their defaults. Several of those defaults are assumptions themselves, so read the tags.';
    drawWaterfall(L);
    var lg = clear($('#c4-wf-legend')); ctx.legend(lg);
    var tb = clear($('#c4-tbody'));
    L.steps.forEach(function (s) {
      var tr = el('tr'), td;
      tr.appendChild(el('td', '', s.label));
      td = el('td', 'n'); td.appendChild(tv(s.delta)); tr.appendChild(td);
      td = el('td', 'n'); td.appendChild(tv(s.running_total)); tr.appendChild(td);
      tb.appendChild(tr);
    });
    // claims side + cash mix
    var life = p.gpu_useful_life_years, yr = Math.min(3, life), c0 = M.claimsStack(p, 0), c3 = M.claimsStack(p, yr);
    var eu = cum.external_end_user, cm = cum.cash_moved, euShare = derived(cm.value ? eu.value / cm.value : null, M.weakestStatus([eu.status, cm.status]), 'end-user cash / cash that moves = ' + F.usd(eu.value) + ' / ' + F.usd(cm.value));
    var cav = findCaveat(c3) || 'Worst case: rent stops and none of the senior debt is repaid, so the claims stay the same size while the hardware loses value.';
    fill($('#c4-claims'), ['The knobs that don’t move the waterfall: ranked claims per $1 of GPU asset (senior debt plus equity, counting the bank layer once) are ', tv(c0.ratios.claims_per_usd_asset_ranked || c0.ratios.claims_per_usd_asset, 'num'), ' on purchase day and ', tv(c3.ratios.claims_per_usd_asset_ranked || c3.ratios.claims_per_usd_asset, 'num'), ' after ', String(yr), (yr === 1 ? ' year' : ' years'),
      '. ', cav, ' Of the cash that moves in one lap, ', tv(euShare, 'pct'), ' is paid by end users and ', tv(cum.external_share, 'pct'), ' is external in all.']);
    renderBB(p, L, run, euShare);
    fill($('#c4-take-p'), ['Per ', tv(h.seed), ' of seed, with the knobs where they are now: ', tv(h.debt), ' of debt, ', tv(h.revenue), ' of Nvidia revenue and ', tv(h.paper_value), ' of paper market value. Slide the loan-to-cost up and the debt and the paper both jump; slide the multiple down and the paper shrinks while the debt doesn’t. None of it is a forecast. Whether a big multiplier is a feature or a warning depends on who ends up paying, and we don’t know that yet.']);
  }
  function findCaveat(o) {
    var r = null;
    (function walk(x, d) { if (r || !x || typeof x !== 'object' || d > 3) return; Object.keys(x).forEach(function (k) { if (r) return; var v = x[k]; if (typeof v === 'string' && /caveat|paydown|no_paydown/i.test(k)) r = v; else if (v && typeof v === 'object') walk(v, d + 1); }); })(o, 0);
    return r;
  }
  function renderBB(p, L, run, euShare) {
    var h = L.headline, v0 = run.lap_traces[0].values, cum = run.cumulative;
    var bull = clear($('#c4-bull')), bear = clear($('#c4-bear'));
    bull.appendChild(P(['Lenders put in ', tv(h.debt), ' against a ', tv(h.build_cost), ' cluster and a compute contract worth ', tv(v0.contract_value), '. That’s an ordinary secured loan, repaid from contracted cash flows from customers who can pay. The revenue Nvidia books is real revenue.']));
    bull.appendChild(P(['Layered claims on one asset are how project finance normally works, and they aren’t double pledging. Every layer has a price and a place in the line.']));
    bear.appendChild(P(['Of the ', tv(h.revenue), ' of revenue, ', tv(cum.revenue_recycled), ' traces back to Nvidia’s own cash. The ', tv(h.paper_value), ' of market value is paper: a multiple of ', tv({ value: p.valuation_multiple, status: M.effectiveStatus('valuation_multiple', p.valuation_multiple), formula_text: 'valuation_multiple' }, 'x'), ' on a profit that exists only if the loop keeps turning.']));
    var eus = null; try { eus = M.externalShare(p).headline.end_user_share; } catch (e) { }
    var hyp = derived(euShare.value, 'hypothetical', 'Toy-model output: ' + euShare.formula_text + '. It depends on the knob settings, including the lab paying part of its rent from outside revenue.');
    var rng = eus && eus.low && eus.high ? [' (range ', tv(derived(eus.low.value, 'hypothetical', 'Lowest value as each knob is swept across its full range, one at a time.'), 'pct'), ' to ', tv(derived(eus.high.value, 'hypothetical', 'Highest value as each knob is swept across its full range, one at a time.'), 'pct'), ')'] : [];
    bear.appendChild(P(['Every claim is paid from the same place, end-user spending. In this toy model, about '].concat([tv(hyp, 'pct')], rng, [' of the cash moving in a lap comes from end users. That is a model output from a deliberately cautious knob setting (the lab covering part of its rent from outside revenue; the ? on that knob shows the reported reference point), not a measurement of Nvidia or anyone else. If the share really were low, the layers would rise or fall together.'])));
  }

  function buildDl() {
    var dl = clear($('#c4-dl'));
    MAIN.forEach(function (id) {
      dl.appendChild(el('dt', '', SHORT[id])); var dd = el('dd', '', PLAIN[id][0] + ' ');
      dd.appendChild(el('span', 'c4-moves', '(' + MOVES[PLAIN[id][1]] + ')')); dl.appendChild(dd);
    });
  }

  /* ---------- presets ---------- */
  function activePreset() {
    var found = null;
    M.presetNames().forEach(function (n) {
      var pp = M.applyPreset(n), ok = true;
      Object.keys(pp).forEach(function (k) { if (!eq(pp[k], ctx.state.params[k])) ok = false; });
      if (ok) found = n;
    });
    return found;
  }
  function renderPreset() {
    var a = activePreset();
    root.querySelectorAll('[data-preset]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.preset === a)); });
    var box = clear($('#c4-preset-note'));
    if (!a) { box.appendChild(P(['Presets are analogues: they set the knobs to look like a type of deal, and aren’t those companies’ actual terms. Pick one to see why each number was chosen.'])); return; }
    var pd = presetDocs[a] || {}, ov = pd.overrides || {};
    box.appendChild(P([el('b', '', pd.label || a + ': '), ' ', pd.description || '']));
    var ul = el('ul', 'c4-ovr');
    Object.keys(ov).forEach(function (k) {
      var li = el('li'); li.appendChild(el('b', '', LAB(k) + ' = ' + fv(k, ov[k].value)));
      li.appendChild(ctx.tag(ov[k].status)); li.appendChild(document.createTextNode(' ' + cleanWhy(ov[k].rationale))); ul.appendChild(li);
    });
    box.appendChild(ul);
    if (pd.status_note) box.appendChild(el('p', 'c4-pn', cleanWhy(pd.status_note)));
  }

  function renderAll() { syncRows(); renderOut(); renderPreset(); }

  /* ---------- init ---------- */
  fill($('#c4-hook'), ['Borrowed money changes the arithmetic. (A neocloud is a newer company that rents out racks of AI chips.) Put in a little equity, add a lot of debt, and the thing you can build gets much bigger than the cash you started with. Below is a toy calculator: move a knob, and watch what one seed becomes. It isn’t a forecast, and nobody’s real deal looks like this exactly.']);
  var mainHost = $('#c4-rows'), moreHost = $('#c4-rows-more');
  MAIN.forEach(function (id) { buildRow(id, mainHost, true); });
  defs.forEach(function (d) { if (d.id !== 'seed_usd' && MAIN.indexOf(d.id) < 0) buildRow(d.id, moreHost, false); });
  buildDl();
  $('#c4-toy').textContent = 'Toy model. Every dollar figure here is per seed dollars of Nvidia cash, in a single made-up cluster. The model is built to show how the pieces connect, not to say what any real company will do.';
  root.querySelectorAll('[data-preset]').forEach(function (b) { b.addEventListener('click', function () { ctx.set({ preset: b.dataset.preset }); }); });
  $('#c4-reset').addEventListener('click', function () { ctx.reset(); });
  $('#c4-copy').addEventListener('click', function () {
    var out = $('#c4-copied'), u = $('#c4-url');
    u.value = ctx.shareUrl();
    ctx.copyShareUrl().then(function (ok) {
      out.textContent = ok ? 'Link copied.' : 'Copy failed. Select the link below.';
      u.hidden = ok;
      if (!ok) { u.select(); }
      setTimeout(function () { out.textContent = ''; }, 4000);
    });
  });
  ctx.subscribe(renderAll);
  renderAll();
};
