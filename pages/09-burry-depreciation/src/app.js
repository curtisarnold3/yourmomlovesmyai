/* app.js — wires the shared engine (window.BD) to the scrolling documentary. */
(function () {
  'use strict';
  const BD = window.BD, ILL = window.ILL, CH = window.CH, DATA = window.BD_DATA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const COL = { acct: '#1b98cc', cash: '#c98018', val: '#9b7cf2', gen: '#14a17c', risk: '#ec5b4f', acctHi: '#5fd6ff', ink3: '#8090a8' };
  const SRC = DATA['source-example'];
  const TAX = DATA['tax-scenarios'];
  const ECON = DATA['economic-life-scenarios'];

  // ---------- formatting ----------
  const fB = (v, d = 1) => (v < -1e-9 ? '−$' : '$') + Math.abs(v).toFixed(d) + 'B';
  const fB0 = v => fB(v, 0);
  const fUSD = (v, d = 2) => (v < -1e-9 ? '−$' : '$') + Math.abs(v).toFixed(d);
  const fN = (v, d = 1) => (v < -1e-9 ? '−' : '') + Math.abs(v).toFixed(d);
  const fPct = v => (v * 100).toFixed(0) + '%';
  const yrs = n => Array.from({ length: n }, (_, i) => 'Y' + (i + 1));

  // ---------- shared state (one source of truth for the core inputs) ----------
  const DEF = { assetCost: SRC.assetCost, revenue: SRC.revenue, otherOpex: SRC.otherOperatingExpenses, residual: SRC.residualValue, taxRate: SRC.taxRate, shares: SRC.sharesOutstanding, life: 5, pe: 20 };
  const S = Object.assign({}, DEF);
  const subs = [];
  function set(patch) { Object.assign(S, patch); subs.forEach(f => safe(f)); }
  function safe(f) { try { f(); } catch (e) { console.error(e); } }

  // ---------- reduced motion ----------
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = mq.matches;
  function applyMotion() { document.body.classList.toggle('reduce', reduce); document.documentElement.classList.toggle('reduce', reduce); $('#motionBtn').setAttribute('aria-pressed', String(reduce)); }
  $('#motionBtn').addEventListener('click', () => { reduce = !reduce; applyMotion(); });
  applyMotion();

  // ---------- control builders ----------
  function slider(parent, o) {
    const id = o.id;
    const w = document.createElement('div'); w.className = 'ctl';
    w.innerHTML = `<label for="${id}">${o.label} <output id="${id}O" for="${id}"></output></label><input type="range" id="${id}" min="${o.min}" max="${o.max}" step="${o.step}" ${o.desc ? `aria-describedby="${id}D"` : ''}>${o.desc ? `<div class="mini" id="${id}D">${o.desc}</div>` : ''}`;
    parent.appendChild(w);
    const inp = $('#' + id, w);
    inp.addEventListener('input', () => { o.set(Number(inp.value)); });
    const sync = () => { const v = o.get(); inp.value = v; $('#' + id + 'O', w).textContent = o.fmt(v); inp.setAttribute('aria-valuetext', o.fmt(v)); paint(inp); };
    return { el: inp, sync };
  }
  function paint(inp) { const p = (inp.value - inp.min) / (inp.max - inp.min) * 100; inp.style.setProperty('--p', p + '%'); }
  function numberInput(parent, o) {
    const w = document.createElement('div'); w.className = 'ctl';
    w.innerHTML = `<label for="${o.id}">${o.label}</label><input type="number" id="${o.id}" step="${o.step || 'any'}" inputmode="decimal">`;
    parent.appendChild(w);
    const inp = $('#' + o.id, w);
    inp.addEventListener('change', () => {
      const v = Number(inp.value);
      const err = o.validate ? o.validate(v, inp.value) : null;
      inp.setAttribute('aria-invalid', err ? 'true' : 'false');
      if (o.err) $(o.err).textContent = err || '';
      if (!err) o.set(v);
    });
    return { el: inp, sync: () => { if (document.activeElement !== inp) inp.value = o.get(); } };
  }
  function selectCtl(parent, o) {
    const w = document.createElement('div'); w.className = 'ctl';
    w.innerHTML = `<label for="${o.id}">${o.label}</label><select id="${o.id}">${o.options.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>`;
    parent.appendChild(w);
    const el = $('#' + o.id, w); el.addEventListener('change', () => o.set(el.value));
    return { el, sync: () => { el.value = o.get(); } };
  }
  function segPressed(group, attr, val) { $$('button', group).forEach(b => b.setAttribute('aria-pressed', String(b.dataset[attr] === String(val)))); }

  // ---------- HUD, rail, progress ----------
  $('#hudGlyph').innerHTML = ILL.glyph('new');
  const hudColors = { acct: '#5fd6ff', cash: '#ffb547', val: '#b9a2ff', gen: '#38e0b4', risk: '#ff8b80' };
  const secs = $$('[data-hud]');
  const railLinks = $$('.rail a');
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const s = e.target;
      $('#hudText').textContent = s.dataset.hud;
      $('#hudDot').style.background = hudColors[s.dataset.hudc] || '#5fd6ff';
      $('#hudAs').style.borderColor = hudColors[s.dataset.hudc] || '';
      railLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + s.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => io.observe(s));
  let ticking = false;
  addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { const h = document.documentElement; $('#progress').style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%'; ticking = false; }); }, { passive: true });

  // ---------- hero ----------
  $('#heroRackA').innerHTML = ILL.rack({ accent: '#5fd6ff', label: 'GPU rack labeled with a five-year assumed accounting life' });
  $('#heroRackB').innerHTML = ILL.rack({ accent: '#ff8b80', ledPhase: 2, label: 'Identical GPU rack labeled with a two-year assumed accounting life' });

  // ---------- scrollytelling ----------
  const stepRender = {};
  const mobileMQ = window.matchMedia('(max-width: 980px)');
  // On narrow screens the chapter visual moves into the active step so it is always next to its text and never clipped.
  function placeStage(ch) {
    const stage = $('.stage', ch); if (!stage) return;
    if (mobileMQ.matches) {
      const st = $('.step.active', ch) || $('.step', ch);
      if (stage.parentElement !== st) st.insertBefore(stage, st.firstChild);
    } else {
      const home = $('.sticky', ch);
      if (stage.parentElement !== home) home.appendChild(stage);
    }
  }
  mobileMQ.addEventListener('change', () => $$('.chapter').forEach(placeStage));
  const stepIO = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const st = e.target, ch = st.closest('.chapter');
      $$('.step', ch).forEach(x => x.classList.toggle('active', x === st));
      placeStage(ch);
      const f = stepRender[ch.id]; if (f) safe(() => f(Number(st.dataset.step)));
    });
  }, { rootMargin: '-40% 0px -40% 0px' });
  $$('.step').forEach(s => stepIO.observe(s));
  $$('.chapter').forEach(ch => { const f = $('.step', ch); if (f) f.classList.add('active'); placeStage(ch); });

  // =====================================================================
  // CH 1
  // =====================================================================
  const DISC = [
    { co: 'Microsoft', life: 6, txt: 'Servers & network 4 → 6 yrs (FY2023); policy range 2–6' },
    { co: 'Alphabet', life: 6, txt: 'Servers 4 → 6 yrs (2023)' },
    { co: 'Oracle', life: 6, txt: 'Servers & networking 5 → 6 yrs (FY2025)' },
    { co: 'Meta', life: 5.5, txt: 'Most servers & network → 5.5 yrs (Jan 2025)' },
    { co: 'Amazon', life: 5, txt: '5 → 6 yrs (2024), then subset 6 → 5 (2025); range 5–6' },
    { co: "Burry's product cycle", life: 2.5, lo: 2, hi: 3, alleg: true, txt: '~2–3 yr Nvidia product cycle — an allegation, not a stated useful life' }
  ];
  function stripHTML(life, cost, color) {
    const sch = BD.straightLine(cost, 0, life);
    return `<div class="strip" aria-hidden="true">${sch.rows.map(r => `<div style="flex:${r.depreciation};background:${color}" title="Year ${r.year}: ${fB(r.depreciation)}">${r.depreciation / cost > 0.09 ? fN(r.depreciation, r.depreciation % 1 ? 1 : 0) : ''}</div>`).join('')}</div>`;
  }
  (function ch1() {
    const v = $('#v1');
    v.innerHTML = `<div class="twin-rack">
      <div class="col"><div class="rk">${ILL.rack({ accent: '#5fd6ff' })}</div><span class="tag"><i style="background:var(--acct)"></i>5-year life</span><div style="width:100%" class="fade" id="v1s1">${stripHTML(5, 100, COL.acct)}<div class="mini" style="text-align:center">$20B × 5 years</div></div></div>
      <div class="col"><div class="rk">${ILL.rack({ accent: '#ff8b80', ledPhase: 2 })}</div><span class="tag"><i style="background:var(--risk)"></i>2-year life</span><div style="width:100%" class="fade" id="v1s2">${stripHTML(2, 100, COL.risk)}<div class="mini" style="text-align:center">$50B × 2 years</div></div></div>
    </div>
    <div class="fade" id="v1disc" style="margin-top:10px"><div class="disclose">${DISC.slice(0, 5).map(d => `<div class="d"><b>${d.co}</b>${d.txt}</div>`).join('')}</div></div>
    <div class="fade caveat" id="v1est" style="margin-top:10px"><b>Estimate, not fact:</b> GAAP useful life = expected period of economic benefit. Revisions are changes in estimate (applied prospectively), not errors.</div>`;
    stepRender.ch1 = st => {
      $('#v1s1').classList.toggle('hidden-s', st < 1); $('#v1s2').classList.toggle('hidden-s', st < 1);
      $('#v1disc').style.display = st === 2 ? '' : 'none';
      $('#v1est').style.display = st >= 3 ? '' : 'none';
    };
    stepRender.ch1(0);
    // lab 1
    const l = $('#l1life');
    l.addEventListener('input', () => set({ life: Number(l.value) }));
    $$('#lab1 [data-life]').forEach(b => b.addEventListener('click', () => set({ life: Number(b.dataset.life) })));
    subs.push(() => {
      l.value = S.life; paint(l); $('#l1lifeO').textContent = S.life + ' yrs'; l.setAttribute('aria-valuetext', S.life + ' years');
      segPressed($('#lab1 .seg'), 'life', S.life);
      const e = BD.sourceEarnings({ assetCost: 100, revenue: 100, otherOpex: 0, residual: 0, taxRate: 0.25, shares: 10, life: S.life });
      $('#l1dep').textContent = fB(e.depreciation, 2); $('#l1eps').textContent = fUSD(e.eps);
      $('#l1strip').innerHTML = stripHTML(S.life, 100, S.life <= 3 ? COL.risk : COL.acct) + `<div class="mini">${BD.straightLine(100, 0, S.life).rows.map(r => 'Y' + r.year + ' ' + fB(r.depreciation)).join(' · ')}</div>`;
      $('#l1disc').innerHTML = DISC.map(d => { const hit = d.lo != null ? (S.life >= d.lo && S.life <= d.hi) : Math.abs(S.life - d.life) < 0.26; return `<div class="d ${hit ? 'hit' : ''}" ${d.alleg ? 'style="border-style:dashed;border-color:rgba(236,91,79,.6)"' : ''}><b>${d.co}</b>${d.txt}</div>`; }).join('');
      const base = BD.sourceEarnings({ assetCost: 100, revenue: 100, residual: 0, taxRate: 0.25, shares: 10, life: 5 });
      const diff = (e.eps / base.eps - 1) * 100;
      $('#l1msg').innerHTML = `At ${S.life} years, year-1 EPS is <b>${fUSD(e.eps)}</b> — ${Math.abs(diff) < 0.05 ? 'this is the source\'s 5-year case.' : (diff > 0 ? fN(diff) + '% higher than' : fN(-diff) + '% lower than') + ' the 5-year case.'} The cash paid for the hardware is $100B either way. Whether a given life is <em>right</em> depends on how long the equipment is expected to produce economic benefits — the subject of Chapter 9.`;
    });
  })();

  // =====================================================================
  // CH 2
  // =====================================================================
  (function ch2() {
    const v = $('#v2');
    v.innerHTML = `<div class="two" style="align-items:center"><div>${ILL.house({})}</div><div id="v2r"></div></div><div id="v2b" style="margin-top:8px"></div>`;
    stepRender.ch2 = st => {
      const r = $('#v2r');
      if (st === 0) r.innerHTML = `<div class="formula"><span class="t">$500</span> / sq ft × <span class="t">2,000</span> sq ft</div><div class="kpi big" style="--c:var(--gen);margin-top:10px"><div class="t">Implied home value</div><div class="v">$${BD.comparableValue(500, 2000).toLocaleString()}</div></div>`;
      else r.innerHTML = `<div class="formula"><span class="v">P/E</span> × <span class="c">EPS</span> = <span class="v">price</span></div><div class="three" style="margin-top:10px;font-size:0"><div class="kpi" style="--c:var(--val)"><div class="t">P/E</div><div class="v" style="font-size:17px">20×</div></div><div class="kpi" style="--c:var(--acct)"><div class="t">EPS</div><div class="v" style="font-size:17px">${st >= 2 ? '$6.00 / $3.75' : '$6.00'}</div></div><div class="kpi" style="--c:var(--val)"><div class="t">Price</div><div class="v" style="font-size:17px">${st >= 2 ? '$120 / $75' : '$120'}</div></div></div>`;
      const b = $('#v2b');
      if (st >= 2) CH.bars(b, { cats: ['5-yr life · EPS $6.00', '2-yr life · EPS $3.75'], series: [{ name: 'Implied price at 20×', values: [BD.peValuation(6, 20), BD.peValuation(3.75, 20)], color: COL.val }], h: 170, fmt: v => '$' + v.toFixed(0), label: 'all', desc: 'Implied share price at a constant 20 times multiple: $120 for EPS $6.00 and $75 for EPS $3.75.' });
      else b.innerHTML = '';
      if (st === 3) b.insertAdjacentHTML('beforeend', '<p class="caveat"><b>Not a market price:</b> the multiple itself can change when investors adjust for earnings quality.</p>');
    };
    stepRender.ch2(0);
    let eps = 6;
    const e = $('#l2eps'), p = $('#l2pe'), en = $('#l2epsN');
    e.addEventListener('input', () => { eps = Number(e.value); r2(); });
    p.addEventListener('input', () => set({ pe: Number(p.value) }));
    en.addEventListener('change', () => { const v = Number(en.value); if (!Number.isFinite(v) || en.value === '' || v < -50 || v > 100) { en.setAttribute('aria-invalid', 'true'); $('#l2err').textContent = 'Enter an EPS between −$50 and $100.'; return; } en.setAttribute('aria-invalid', 'false'); $('#l2err').textContent = ''; eps = v; r2(); });
    $$('#lab2 [data-eps]').forEach(b => b.addEventListener('click', () => { eps = Number(b.dataset.eps); r2(); }));
    function r2() {
      e.value = Math.max(0, Math.min(10, eps)); paint(e); $('#l2epsO').textContent = fUSD(eps); e.setAttribute('aria-valuetext', fUSD(eps));
      p.value = S.pe; paint(p); $('#l2peO').textContent = S.pe + '×'; p.setAttribute('aria-valuetext', S.pe + ' times');
      if (document.activeElement !== en) en.value = eps;
      segPressed($('#lab2 .seg'), 'eps', eps);
      const price = BD.peValuation(eps, S.pe), base = BD.peValuation(6, S.pe);
      $('#l2price').textContent = fUSD(price); $('#l2delta').textContent = (price - base >= 0 ? '+' : '−') + fUSD(Math.abs(price - base)).slice(1).replace(/^/, '$') + ` (${fN((price / base - 1) * 100)}%)`;
      CH.bars($('#l2chart'), { cats: ['EPS $6.00 (5-yr)', 'EPS $3.75 (2-yr)', 'Your EPS ' + fUSD(eps)], series: [{ name: 'Implied price at ' + S.pe + '×', values: [base, BD.peValuation(3.75, S.pe), price], color: COL.val }], h: 190, fmt: v => '$' + v.toFixed(0), label: 'all', desc: `Implied prices at ${S.pe} times: $${base.toFixed(0)}, $${BD.peValuation(3.75, S.pe).toFixed(0)} and $${price.toFixed(0)}.` });
      $('#l2note').textContent = `Holding the multiple at ${S.pe}×, every $1 of EPS moves the implied price by $${S.pe}. A ${fN((1 - 3.75 / 6) * 100)}% EPS drop is a ${fN((1 - 3.75 / 6) * 100)}% price drop — but only if the multiple doesn't change.`;
    }
    subs.push(r2);
  })();

  // =====================================================================
  // CH 3
  // =====================================================================
  (function ch3() {
    const v = $('#v3');
    v.innerHTML = `<div class="two" style="align-items:center;grid-template-columns:1.25fr 1fr"><div id="v3hall"></div><div id="v3bs"></div></div><div id="v3low" style="margin-top:8px"></div>`;
    function bsCol(title, blocks) {
      return `<div style="flex:1;text-align:center"><div class="mini">${title}</div><div style="height:180px;display:flex;flex-direction:column-reverse;border-bottom:1px solid var(--line2)">${blocks.map(b => `<div style="height:${b.v / 100 * 170}px;background:${b.c};border-radius:6px;margin:1px 8px;display:grid;place-items:center;font-size:12px;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 8px 18px -8px ${b.c}">${b.t}<br>${fB0(b.v)}</div>`).join('')}</div></div>`;
    }
    stepRender.ch3 = st => {
      $('#v3hall').innerHTML = st === 0 ? ILL.trayExploded({}) + '<p class="mini" style="text-align:center">What the money buys, one tray at a time: GPU packages ringed by HBM memory stacks, CPUs, and liquid cold plates (shown lifted). Thousands of trays fill the hall.</p>' : ILL.dataHall({ lit: 1, highlight: 13 });
      const bs = $('#v3bs');
      bs.innerHTML = `<h4>Balance sheet (exact scale)</h4><div style="display:flex;gap:6px">${bsCol('Before', [{ v: 100, c: COL.cash, t: 'Cash' }])}${bsCol(st >= 1 ? 'In service' : 'Paid, installing', st >= 1 ? [{ v: 100, c: COL.acct, t: 'PP&E' }] : [{ v: 100, c: 'rgba(27,152,204,.45)', t: 'Equipment<br>not yet in service' }])}</div><div class="mini" style="margin-top:6px">Total assets: $100B → $100B</div>`;
      const low = $('#v3low');
      if (st === 2) { const s5 = BD.straightLine(100, 0, 5); CH.bars(low, { cats: yrs(5), series: [{ name: 'Book value at year end', values: s5.rows.map(r => r.closing), color: COL.acct, outline: true }, { name: 'Depreciation expense (noncash)', values: s5.rows.map(r => r.depreciation), color: COL.acct }], h: 150, fmt: v => v.toFixed(0), desc: '5-year life: book value falls from 80 to 0 while depreciation of 20 is expensed each year.' }); }
      else if (st === 3) { low.innerHTML = `<div class="scroll-x"><table class="data"><thead><tr><th>Cash-flow statement</th><th>Y1</th><th>Y2</th><th>Y3</th><th>Y4</th><th>Y5</th></tr></thead><tbody><tr><td>Investing: capital expenditure</td><td style="color:var(--cash-hi)">(100)</td><td>—</td><td>—</td><td>—</td><td>—</td></tr><tr><td>Operating: + depreciation added back</td><td>20</td><td>20</td><td>20</td><td>20</td><td>20</td></tr></tbody></table></div><p class="mini">5-year life shown; the capex line is identical under a 2-year life.</p>`; }
      else low.innerHTML = st === 0 ? '<p class="mini">Amber = actual cash. Paying swaps $100B of cash for $100B of equipment; nothing has been expensed yet.</p>' : '';
    };
    stepRender.ch3(0);
    let view = 'cash', life = 5;
    $$('#lab3 [data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; r3(); }));
    $$('#lab3 [data-l3]').forEach(b => b.addEventListener('click', () => { life = Number(b.dataset.l3); r3(); }));
    // keyboard arrows for tabs
    $('#lab3 [role=tablist]').addEventListener('keydown', ev => { if (!['ArrowRight', 'ArrowLeft'].includes(ev.key)) return; const tabs = $$('#lab3 [role=tab]'); let i = tabs.findIndex(t => t.dataset.view === view); i = (i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; view = tabs[i].dataset.view; r3(); tabs[i].focus(); });
    function r3() {
      $$('#lab3 [role=tab]').forEach(t => { const on = t.dataset.view === view; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      segPressed($('#lab3 [aria-label="Book useful life"]'), 'l3', life);
      const m = BD.fleetModel({ horizon: 5, assetCost: 100, bookLife: life, economicLife: 5, revenue: 100, taxRate: 0.25, shares: 10, taxScenario: 'bonus100' });
      const out = $('#l3view'); out.innerHTML = '<div id="l3c"></div><p class="callout" id="l3m"></p>';
      const c = $('#l3c'), msg = $('#l3m');
      if (view === 'cash') { CH.bars(c, { cats: yrs(5), series: [{ name: 'Cash paid for hardware', values: m.years.map(y => y.capex), color: COL.cash }], h: 200, fmt: v => v.toFixed(0), label: 'nonzero', desc: 'Cash paid for hardware: 100 in year 1, zero afterwards.' }); msg.innerHTML = `The <b>only</b> cash payment for this hardware: $100B in Year 1. Book life (${life} yrs) doesn't change it.`; }
      if (view === 'bs') { CH.bars(c, { cats: ['Start', ...yrs(5)], series: [{ name: 'Net book value (PP&E)', values: [100, ...m.years.map(y => y.netBookValue)], color: COL.acct }, { name: 'Accumulated depreciation', values: [0, ...m.years.map((y, i) => 100 - y.netBookValue)], color: COL.acct, outline: true }], h: 200, fmt: v => v.toFixed(0), desc: 'Net book value declines while accumulated depreciation rises; they always sum to the 100 cost.' }); msg.innerHTML = `Net book value + accumulated depreciation = $100B cost, every year. With a ${life}-year life the asset reaches zero book value in year ${life}.`; }
      if (view === 'dep') { CH.bars(c, { cats: yrs(5), series: [{ name: 'Book depreciation expense', values: m.years.map(y => y.bookDepreciation), color: COL.acct }], h: 200, fmt: v => v.toFixed(0), label: 'nonzero', desc: 'Annual book depreciation by year.' }); msg.innerHTML = `Depreciation is an <b>expense without a payment</b>: ${m.years.map(y => fB0(y.bookDepreciation)).join(', ')} — summing to ${fB0(m.totals.bookDepreciation)}.`; }
      if (view === 'fcf') { c.innerHTML = '<div class="scroll-x">' + tbl(['', ...yrs(5), 'Total'], [['Net income', ...m.years.map(y => y.netIncome), m.totals.netIncome], ['+ Depreciation', ...m.years.map(y => y.bookDepreciation), m.totals.bookDepreciation], ['+ Deferred tax', ...m.years.map(y => y.deferredTax), m.years.reduce((a, y) => a + y.deferredTax, 0)], ['= Operating cash flow', ...m.years.map(y => y.ocf), m.totals.ocf], ['− Capex', ...m.years.map(y => -y.capex), -m.totals.capex], ['= Free cash flow', ...m.years.map(y => y.fcf), m.totals.fcf]], [3, 5]) + '</div>'; msg.innerHTML = `FCF counts the $100B once, in Year 1. Switch the book life between 5 and 2: net income and depreciation rows change, OCF and FCF rows don't.`; }
    }
    r3();
  })();

  function tbl(head, rows, totalRows) {
    return `<table class="data"><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr class="${(totalRows || []).includes(i) ? 'tot' : ''}">${r.map((c, j) => j === 0 ? `<th scope="row" style="text-align:left;font-weight:400">${c}</th>` : `<td>${typeof c === 'number' ? fN(c) : c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  // =====================================================================
  // CH 4
  // =====================================================================
  (function ch4() {
    const v = $('#v4');
    v.innerHTML = `<h4>Annual depreciation ($B, exact scale)</h4><div id="v4a"></div><h4 style="margin-top:6px">Remaining book value ($B)</h4><div id="v4b"></div><h4 style="margin-top:6px"><span class="k cash"></span>Cash paid for the hardware ($B) — identical under both</h4><div id="v4c"></div><div id="v4d"></div>`;
    const a5 = BD.straightLine(100, 0, 5), a2 = BD.straightLine(100, 0, 2);
    const d5 = BD.toArray(a5, 5), d2 = BD.toArray(a2, 5);
    stepRender.ch4 = st => {
      const ser = [];
      ser.push({ name: '5-year life', values: st >= 1 ? d5 : d5.map(() => 0), color: COL.acct });
      ser.push({ name: '2-year life', values: st >= 2 ? d2 : d2.map(() => 0), color: COL.risk });
      CH.bars($('#v4a'), { cats: yrs(5), series: ser, h: 170, yMax: 60, fmt: v => v.toFixed(0), label: 'nonzero', desc: '5-year life: 20 per year for 5 years. 2-year life: 50 in years 1 and 2.' });
      const n5 = [100, ...a5.rows.map(r => r.closing)], n2 = [100, 50, 0, 0, 0, 0];
      CH.lines($('#v4b'), { cats: ['Start', ...yrs(5)], series: [{ name: '5-year life', values: st >= 1 ? n5 : [100, null, null, null, null, null], color: COL.acct }, { name: '2-year life', values: st >= 2 ? n2 : [100, null, null, null, null, null], color: COL.risk, dash: '5 4' }], h: 130, yMax: 100, fmt: v => v.toFixed(0), desc: 'Remaining book value declines to zero after 5 or 2 years.' });
      CH.bars($('#v4c'), { cats: yrs(5), series: [{ name: 'Cash (both lives)', values: [100, 0, 0, 0, 0], color: COL.cash }], h: 90, yMax: 100, fmt: v => v.toFixed(0), label: 'nonzero', desc: 'Cash paid: 100 in year 1 for both lives.' });
      $('#v4d').innerHTML = st >= 3 ? `<div class="three" style="margin-top:8px"><div class="kpi" style="--c:var(--acct)"><div class="t">Σ 5-year</div><div class="v">${fB0(BD.sum(d5))}</div></div><div class="kpi" style="--c:var(--risk)"><div class="t">Σ 2-year</div><div class="v">${fB0(BD.sum(d2))}</div></div><div class="kpi" style="--c:var(--cash)"><div class="t">Cash paid</div><div class="v">$100B</div></div></div>` : '';
    };
    stepRender.ch4(0);
    const box = $('#lab4 .controls');
    const life = $('#l4life'), res = $('#l4res'), cost = $('#l4cost');
    life.addEventListener('input', () => set({ life: Number(life.value) }));
    res.addEventListener('input', () => { const r = Number(res.value); if (r > S.assetCost) { $('#l4err').textContent = 'Residual value cannot exceed asset cost.'; return; } set({ residual: r }); });
    cost.addEventListener('change', () => {
      const c = Number(cost.value);
      let err = null; if (cost.value === '' || !Number.isFinite(c)) err = 'Enter a number.'; else if (c <= 0) err = 'Cost must be above zero.'; else if (c > 1000) err = 'Keep cost at or below $1,000B.'; else if (c < S.residual) err = 'Cost must be at least the residual value ($' + S.residual + 'B).';
      cost.setAttribute('aria-invalid', err ? 'true' : 'false'); $('#l4err').textContent = err || ''; if (!err) set({ assetCost: c });
    });
    subs.push(() => {
      life.value = S.life; paint(life); $('#l4lifeO').textContent = S.life + ' yrs'; life.setAttribute('aria-valuetext', S.life + ' years');
      res.max = Math.min(40, S.assetCost); res.value = S.residual; paint(res); $('#l4resO').textContent = fB0(S.residual);
      if (document.activeElement !== cost) cost.value = S.assetCost;
      let s; try { s = BD.straightLine(S.assetCost, S.residual, S.life); $('#l4err').textContent = ''; } catch (e) { $('#l4err').textContent = e.message; return; }
      const last = s.rows[s.rows.length - 1];
      $('#l4a').textContent = fB(s.annual, 2); $('#l4b').textContent = fB(last.accumulated); $('#l4c').textContent = fB(last.closing); $('#l4d').textContent = S.life + ' yrs';
      CH.bars($('#l4chart'), { cats: s.rows.map(r => 'Y' + r.year), series: [{ name: 'Depreciation', values: s.rows.map(r => r.depreciation), color: COL.acct }, { name: 'Book value (end of year)', values: s.rows.map(r => r.closing), color: COL.acct, outline: true }], h: 210, fmt: v => v.toFixed(1), label: 'none', desc: `Straight-line schedule: ${s.rows.length} years, ${fB(s.annual, 2)} per full year, ending book value ${fB(last.closing)}.` });
      $('#l4table').innerHTML = tbl(['Year', 'Opening BV', 'Depreciation', 'Accumulated', 'Closing BV'], [...s.rows.map(r => ['Year ' + r.year, r.opening, r.depreciation, r.accumulated, r.closing]), ['Check: Σ depreciation = cost − residual', '', BD.sum(s.rows.map(r => r.depreciation)), '', fN(S.assetCost - S.residual)]], [s.rows.length]);
    });
  })();

  // =====================================================================
  // CH 5
  // =====================================================================
  function earningsSteps(e, upto) {
    const st = [{ label: 'Revenue', short: 'Rev.', value: e.revenue, kind: 'total', color: COL.gen }];
    if (e.otherOpex) st.push({ label: 'Other costs', short: 'Other', value: -e.otherOpex, kind: 'delta', color: COL.risk });
    if (upto >= 1) { st.push({ label: 'Depreciation', short: 'Dep.', value: -e.depreciation, kind: 'delta', color: COL.acct }); st.push({ label: 'Pretax', value: e.pretax, kind: 'total', color: COL.acct }); }
    if (upto >= 2) { st.push({ label: 'Tax', value: -e.tax, kind: 'delta', color: COL.acct, hatch: true }); st.push({ label: 'Net income', value: e.netIncome, kind: 'total', color: COL.acct }); }
    return st;
  }
  (function ch5() {
    const v = $('#v5');
    v.innerHTML = `<div class="two"><div><h4><span class="k acct"></span>5-year life</h4><div id="v5a"></div><div id="v5ea"></div></div><div><h4><span class="k risk"></span>2-year life</h4><div id="v5b"></div><div id="v5eb"></div></div></div>`;
    const e5 = BD.sourceEarnings({ assetCost: 100, revenue: 100, residual: 0, taxRate: 0.25, shares: 10, life: 5 });
    const e2 = BD.sourceEarnings({ assetCost: 100, revenue: 100, residual: 0, taxRate: 0.25, shares: 10, life: 2 });
    stepRender.ch5 = st => {
      CH.waterfall($('#v5a'), { steps: earningsSteps(e5, st), h: 230, yMax: 100, fmt: v => v.toFixed(1), desc: 'Five-year life: revenue 100, depreciation 20, pretax 80, tax 20, net income 60.' });
      CH.waterfall($('#v5b'), { steps: earningsSteps(e2, st).map(s => s.label.startsWith('Depreciation') ? Object.assign({}, s, { color: COL.risk }) : s), h: 230, yMax: 100, fmt: v => v.toFixed(1), desc: 'Two-year life: revenue 100, depreciation 50, pretax 50, tax 12.5, net income 37.5.' });
      $('#v5ea').innerHTML = st >= 3 ? `<div class="kpi big" style="--c:var(--acct)"><div class="t">EPS = $60B ÷ 10B</div><div class="v">${fUSD(e5.eps)}</div></div>` : '';
      $('#v5eb').innerHTML = st >= 3 ? `<div class="kpi big" style="--c:var(--risk)"><div class="t">EPS = $37.5B ÷ 10B</div><div class="v">${fUSD(e2.eps)}</div></div>` : '';
    };
    stepRender.ch5(0);
    const box = $('#l5ctl'); const ctl = [];
    ctl.push(slider(box, { id: 'l5rev', label: 'Revenue ($B)', min: 0, max: 200, step: 1, get: () => S.revenue, set: v => set({ revenue: v }), fmt: fB0 }));
    ctl.push(slider(box, { id: 'l5opex', label: 'Other operating costs ($B)', min: 0, max: 150, step: 1, get: () => S.otherOpex, set: v => set({ otherOpex: v }), fmt: fB0 }));
    ctl.push(slider(box, { id: 'l5cost', label: 'Asset cost ($B)', min: 10, max: 300, step: 5, get: () => S.assetCost, set: v => set({ assetCost: v, residual: Math.min(S.residual, v) }), fmt: fB0 }));
    ctl.push(slider(box, { id: 'l5life', label: 'Useful life (years)', min: 1, max: 8, step: 0.5, get: () => S.life, set: v => set({ life: v }), fmt: v => v + ' yrs' }));
    ctl.push(slider(box, { id: 'l5res', label: 'Residual value ($B)', min: 0, max: 40, step: 1, get: () => S.residual, set: v => set({ residual: Math.min(v, S.assetCost) }), fmt: fB0 }));
    ctl.push(slider(box, { id: 'l5tax', label: 'Illustrative tax rate', min: 0, max: 0.5, step: 0.01, get: () => S.taxRate, set: v => set({ taxRate: v }), fmt: fPct, desc: 'U.S. federal statutory rate is 21%; the source uses 25%.' }));
    ctl.push(slider(box, { id: 'l5sh', label: 'Shares outstanding (B)', min: 1, max: 30, step: 0.5, get: () => S.shares, set: v => set({ shares: v }), fmt: v => v + 'B' }));
    box.insertAdjacentHTML('beforeend', '<p class="mini">Simplification: tax = rate × pretax income, as if taxable income tracked book earnings. A pretax loss produces a tax benefit (assumes other group income). Chapter 6 separates the tax books.</p>');
    subs.push(() => {
      ctl.forEach(c => c.sync());
      let e; try { e = BD.sourceEarnings({ assetCost: S.assetCost, revenue: S.revenue, otherOpex: S.otherOpex, residual: S.residual, taxRate: S.taxRate, shares: S.shares, life: S.life }); $('#l5err').textContent = ''; } catch (er) { $('#l5err').textContent = er.message; return; }
      $('#l5dep').textContent = fB(e.depreciation, 2); $('#l5pt').textContent = fB(e.pretax, 2); $('#l5ni').textContent = fB(e.netIncome, 2); $('#l5eps').textContent = fUSD(e.eps);
      CH.waterfall($('#l5chart'), { steps: earningsSteps(e, 2), h: 240, fmt: v => v.toFixed(1), desc: `Revenue ${fN(e.revenue)}, depreciation ${fN(e.depreciation)}, pretax ${fN(e.pretax)}, tax ${fN(e.tax)}, net income ${fN(e.netIncome)}.` });
      const s5 = BD.sourceEarnings({ assetCost: 100, revenue: 100, residual: 0, taxRate: 0.25, shares: 10, life: 5 }), s2 = BD.sourceEarnings({ assetCost: 100, revenue: 100, residual: 0, taxRate: 0.25, shares: 10, life: 2 });
      $('#l5table').innerHTML = tbl(['$B', 'Source · 5 yr', 'Source · 2 yr', 'Your scenario'], [['Revenue', s5.revenue, s2.revenue, e.revenue], ['Other operating costs', 0, 0, e.otherOpex], ['Depreciation', s5.depreciation, s2.depreciation, e.depreciation], ['Pretax income', s5.pretax, s2.pretax, e.pretax], ['Illustrative tax', s5.tax, s2.tax, e.tax], ['Net income', s5.netIncome, s2.netIncome, e.netIncome], ['EPS ($)', fUSD(s5.eps), fUSD(s2.eps), fUSD(e.eps)]], [5, 6]);
    });
  })();

  // =====================================================================
  // CH 6
  // =====================================================================
  function booksModel(life, scen) { return BD.fleetModel({ horizon: 6, assetCost: 100, bookLife: life, economicLife: 6, replace: false, revenue: 100, taxRate: 0.25, shares: 10, taxScenario: scen }); }
  (function ch6() {
    const v = $('#v6');
    v.innerHTML = `<div style="display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:center"><div>${ILL.rack({ accent: '#5fd6ff', glow: false })}</div><div class="ledger"><div class="book"><h4><span class="k acct"></span>Financial statements</h4><div class="mini">Goal: transparency · Rule: estimate a life, straight-line</div><div id="v6a"></div></div><div class="book"><h4><span class="k tax"></span>Tax books</h4><div class="mini">Goal: set policy · Rule: 100% bonus (if qualifying)</div><div id="v6b"></div></div></div></div><div id="v6c" style="margin-top:8px"></div>`;
    stepRender.ch6 = st => {
      const m = booksModel(5, 'bonus100');
      CH.bars($('#v6a'), { cats: yrs(6), series: [{ name: 'Book depreciation', values: st >= 1 ? m.years.map(y => y.bookDepreciation) : m.years.map(() => 0), color: COL.acct }], h: 130, yMax: 100, fmt: v => v.toFixed(0), label: 'nonzero', desc: 'Book depreciation 20 per year for 5 years.' });
      CH.bars($('#v6b'), { cats: yrs(6), series: [{ name: 'Tax depreciation', values: st >= 2 ? m.years.map(y => y.taxDepreciation) : m.years.map(() => 0), color: COL.acct, pattern: true }], h: 130, yMax: 100, fmt: v => v.toFixed(0), label: 'nonzero', desc: 'Tax depreciation of 100 in year 1 under 100% bonus depreciation.' });
      if (st >= 3) CH.lines($('#v6c'), { cats: yrs(6), series: [{ name: 'Deferred tax liability (balance, $B)', values: m.years.map(y => y.deferredTaxLiability), color: COL.acctHi }], h: 120, fmt: v => v.toFixed(0), desc: 'Deferred tax liability: 20 after year 1, then 15, 10, 5, 0.' });
      else $('#v6c').innerHTML = '';
    };
    stepRender.ch6(0);
    let life = 5, scen = 'bonus100';
    $('#l6tax').addEventListener('change', e => { scen = e.target.value; r6(); });
    $$('#lab6 [data-l6]').forEach(b => b.addEventListener('click', () => { life = Number(b.dataset.l6); r6(); }));
    function r6() {
      segPressed($('#lab6 [aria-label="Book useful life"]'), 'l6', life);
      $('#l6tax').value = scen;
      const m = booksModel(life, scen);
      $('#l6legal').textContent = TAX.scenarios[scen].legalAssumption;
      $('#l6a').textContent = fB(m.years[0].bookDepreciation); $('#l6b').textContent = fB(m.years[0].taxDepreciation); $('#l6c').textContent = fB(m.years[0].currentTax); const dts = m.years.map(y => y.deferredTaxLiability); const big = dts.reduce((a, v) => Math.abs(v) > Math.abs(a) ? v : a, 0);
      $('#l6d').textContent = Math.abs(big) < 0.05 ? '$0.0B' : (big > 0 ? 'Liability ' + fB(big) : 'Asset ' + fB(-big));
      CH.bars($('#l6chart3'), { cats: yrs(6), series: [{ name: 'Deferred tax balance (end of year)', values: dts, color: COL.acctHi }], h: 150, fmt: v => v.toFixed(1), label: 'nonzero', desc: 'Deferred tax balance by year: positive is a liability (tax postponed), negative is an asset (tax paid early).' });
      CH.bars($('#l6chart1'), { cats: yrs(6), series: [{ name: 'Book (financial statements)', values: m.years.map(y => y.bookDepreciation), color: COL.acct }, { name: 'Tax return', values: m.years.map(y => y.taxDepreciation), color: COL.acct, pattern: true }], h: 200, fmt: v => v.toFixed(1), desc: 'Book versus tax depreciation by year.' });
      CH.bars($('#l6chart2'), { cats: yrs(6), series: [{ name: 'Income-tax expense (book)', values: m.years.map(y => y.bookTax), color: COL.acct }, { name: 'Cash tax paid', values: m.years.map(y => y.currentTax), color: COL.cash }], h: 200, fmt: v => v.toFixed(1), desc: 'Income tax expense versus cash tax paid by year.' });
      const tb = m.totals.currentTax, bk = m.years.reduce((a, y) => a + y.bookTax, 0);
      $('#l6msg').innerHTML = scen === 'bookConform'
        ? `Hypothetical only: if tax depreciation copied the book life, cash taxes would follow the book choice (Year 1 cash tax ${fB(m.years[0].currentTax)}). U.S. law doesn't work this way for this property — which is why the book life normally doesn't reach cash taxes.`
        : `Over six years, total book tax expense (${fB(bk)}) equals total cash tax (${fB(tb)}). The books differ only in <em>timing</em>. When tax deductions run ahead of book depreciation, tax is postponed and a deferred tax <b>liability</b> builds; when book depreciation runs ahead (e.g. a 2-year book life against 5-year MACRS), tax is effectively paid early and a deferred tax <b>asset</b> appears. Either way it unwinds to ${fB(m.years[5].deferredTaxLiability)} by year 6. A deduction lowers taxable income; it saves cash only to the extent the company has taxable income and pays tax at that rate. Try switching the book life — the cash-tax bars don't move.`;
    }
    r6();
  })();

  // =====================================================================
  // CH 7
  // =====================================================================
  (function ch7() {
    const v = $('#v7');
    v.innerHTML = `<h4><span class="k acct"></span>Accounting track · net income ($B)</h4><div id="v7a"></div><h4 style="margin-top:4px"><span class="k gen"></span>Cash track · operating cash flow ($B)</h4><div id="v7b"></div><h4 style="margin-top:4px"><span class="k cash"></span>Cash paid for hardware ($B)</h4><div id="v7c"></div><div id="v7d"></div>`;
    const m5 = BD.fleetModel({ horizon: 5, bookLife: 5 }), m2 = BD.fleetModel({ horizon: 5, bookLife: 2 });
    stepRender.ch7 = st => {
      const ni = [{ name: 'Book life 5', values: m5.years.map(y => y.netIncome), color: COL.acct }, { name: 'Book life 2', values: m2.years.map(y => y.netIncome), color: COL.risk }];
      CH.bars($('#v7a'), { cats: yrs(5), series: st >= 1 ? ni : ni.map(s => Object.assign({}, s, { values: s.values.map(() => 0) })), h: 140, yMax: 100, fmt: v => v.toFixed(1), label: st >= 1 ? 'all' : 'none', desc: 'Net income: 60 each year with a 5-year life; 37.5, 37.5, 75, 75, 75 with a 2-year life.' });
      const oc = [{ name: 'Book life 5', values: m5.years.map(y => y.ocf), color: COL.gen }, { name: 'Book life 2', values: m2.years.map(y => y.ocf), color: COL.gen, outline: true }];
      CH.bars($('#v7b'), { cats: yrs(5), series: st >= 2 ? oc : oc.map(s => Object.assign({}, s, { values: s.values.map(() => 0) })), h: 140, yMax: 100, fmt: v => v.toFixed(0), label: st >= 2 ? 'all' : 'none', desc: 'Operating cash flow identical under both lives: 100, 75, 75, 75, 75.' });
      CH.bars($('#v7c'), { cats: yrs(5), series: [{ name: 'Both lives', values: m5.years.map(y => y.capex), color: COL.cash }], h: 80, yMax: 100, fmt: v => v.toFixed(0), label: 'nonzero', desc: 'Capex 100 in year 1 under both lives.' });
      $('#v7d').innerHTML = st >= 3 ? `<div class="formula" style="margin-top:6px">Y1, 2-yr life: <span class="c">37.5</span> + <span class="c">50</span> dep + <span class="c">12.5</span> deferred tax = <span class="t">100</span> OCF</div>` : st >= 4 ? '' : '';
      if (st >= 4) $('#v7d').innerHTML += `<div class="caveat" style="margin-top:6px"><b>Where cash can still change:</b> tax depreciation tied to book life (not U.S. law here) · real replacement needs · financing covenants or terms keyed to reported earnings.</div>`;
    };
    stepRender.ch7(0);
    let yr = 1, scen = 'bonus100', wc = 0, opex = 0;
    const yI = $('#l7yr'), wI = $('#l7wc'), oI = $('#l7opex');
    yI.addEventListener('input', () => { yr = Number(yI.value); r7(); });
    wI.addEventListener('input', () => { wc = Number(wI.value); r7(); });
    oI.addEventListener('input', () => { opex = Number(oI.value); r7(); });
    $('#l7tax').addEventListener('change', e => { scen = e.target.value; r7(); });
    function wf(el, y, color) {
      const r = BD.reconcile(y);
      CH.waterfall(el, { steps: [
        { label: 'Net income', short: 'NI', value: y.netIncome, kind: 'total', color },
        { label: '+Dep', value: y.bookDepreciation, kind: 'delta', color: COL.acct },
        { label: '+Deferred tax', short: '+Def. tax', value: y.deferredTax, kind: 'delta', color: COL.acct, hatch: true },
        { label: '−ΔWC', value: -y.deltaWC, kind: 'delta', color: COL.cash },
        { label: 'OCF', value: y.ocf, kind: 'total', color: COL.gen },
        { label: '−Capex', value: -y.capex, kind: 'delta', color: COL.cash },
        { label: 'FCF', value: y.fcf, kind: 'total', color: COL.gen }
      ], h: 230, fmt: v => v.toFixed(1), desc: r.map(x => x.label + ' ' + fN(x.value)).join('; ') });
    }
    function r7() {
      yI.value = yr; paint(yI); $('#l7yrO').textContent = 'Year ' + yr;
      wI.value = wc; paint(wI); $('#l7wcO').textContent = fB0(wc);
      oI.value = opex; paint(oI); $('#l7opexO').textContent = fB0(opex);
      const p = { horizon: 5, revenue: 100, otherOpex: opex, deltaWC: wc, taxScenario: scen };
      const a = BD.fleetModel(Object.assign({ bookLife: 5 }, p)), b = BD.fleetModel(Object.assign({ bookLife: 2 }, p));
      const ya = a.years[yr - 1], yb = b.years[yr - 1];
      wf($('#l7a'), ya, COL.acct); wf($('#l7b'), yb, COL.risk);
      const same = Math.abs(ya.ocf - yb.ocf) < 1e-6;
      const negT = a.years.some(y => y.currentTax < -0.01) || b.years.some(y => y.currentTax < -0.01);
      $('#l7msg').innerHTML = (negT ? '<b>Note:</b> a negative cash tax here assumes the tax loss offsets other company income (otherwise it would be carried forward, not refunded). ' : '') + (same
        ? `Year ${yr}: net income differs (${fB(ya.netIncome)} vs ${fB(yb.netIncome)}) but operating cash flow is <b>identical</b> at ${fB(ya.ocf)}, and FCF is ${fB(ya.fcf)} in both. Cash taxes come from the tax books, which ignore the book life.`
        : `With the hypothetical "tax = book" setting, Year ${yr} OCF differs (${fB(ya.ocf)} vs ${fB(yb.ocf)}) because cash taxes now follow the book life. Over five years the totals match (${fB(a.totals.ocf)} vs ${fB(b.totals.ocf)}) — only timing moves.`);
    }
    r7();
  })();

  // =====================================================================
  // CH 8
  // =====================================================================
  (function ch8() {
    const v = $('#v8');
    const ocf = SRC.dcfExcelExample.operatingCashFlow;
    stepRender.ch8 = st => {
      const r = 0.10;
      const capex = st >= 2 ? [100, 0, 100, 0, 100] : [100, 0, 0, 0, 0];
      const fcf = ocf.map((o, i) => o - capex[i]);
      const pvs = fcf.map((f, i) => f / Math.pow(1 + r, i + 1));
      const sumPV = pvs.reduce((a, b) => a + b, 0);
      const W = 660, H = 420, x0 = 84, dx = 102, base = 286, k = 0.72; // ONE exact scale for every bar: 1 unit = 0.72 px
      const F = 'font-family="JetBrains Mono"';
      const T = (x, y, t, o) => `<text x="${x}" y="${y}" text-anchor="${(o && o.a) || 'middle'}" fill="${(o && o.c) || '#e8eef7'}" font-size="${(o && o.s) || 14}" ${F}>${t}</text>`;
      let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${st === 0 ? 'Operating cash flows of 100, 110, 120, 130 and 140 in years 1 to 5, drawn to scale.' : 'Each year: operating cash flow up, capex down, and the present value of free cash flow; the total present value is drawn to the same scale at today.'}">`;
      s += `<line x1="20" y1="${base}" x2="${W - 10}" y2="${base}" stroke="rgba(140,170,220,.55)"/>`;
      s += T(x0, base + 22, 'today');
      const ramp = ['#0f7a5e', '#14a17c', '#2fc29a', '#5fd6b4', '#93e6cd'];
      ocf.forEach((o, i) => {
        const x = x0 + (i + 1) * dx, bw = 44;
        s += T(x, base + 22, 'Y' + (i + 1), { c: '#b4c0d3' });
        if (st === 0) {
          const ho = o * k;
          s += `<rect x="${x - bw / 2}" y="${base - ho}" width="${bw}" height="${ho}" rx="4" fill="#14a17c" fill-opacity=".85"/>` + T(x, base - ho - 8, o);
        } else {
          const known = i === 0 || st >= 2;
          if (known && capex[i]) s += `<rect x="${x - bw / 2}" y="${base + 30}" width="${bw}" height="${capex[i] * k}" fill="#c98018" fill-opacity=".9"/>` + T(x, base + 30 + capex[i] * k + 15, '−' + capex[i] + ' capex', { s: 12, c: '#ffb547' });
          if (!known) s += T(x, base + 52, '?', { c: '#ffb547', s: 22 });
          const hp = Math.max(pvs[i], 0) * k;
          if (hp > 0) s += `<rect x="${x - bw / 2}" y="${base - hp}" width="${bw}" height="${hp}" rx="3" fill="${ramp[i]}"/>`;
          s += T(x, base - hp - 9, Math.max(pvs[i], 0).toFixed(0), { s: 16 });
        }
      });
      if (st >= 1) {
        let y = base;
        pvs.forEach((pv, i) => { if (pv <= 0.5) return; const h = pv * k; y -= h; s += `<rect x="${x0 - 26}" y="${y}" width="52" height="${h}" fill="${ramp[i]}" stroke="#0d1424" stroke-width="1.5"/>` + T(x0 - 32, y + h / 2 + 4, 'Y' + (i + 1), { s: 12, c: '#b4c0d3', a: 'end' }); });
        s += T(x0, y - 10, sumPV.toFixed(0), { s: 22 }) + T(x0, y - 34, 'value today', { s: 11, c: '#b4c0d3' });
        s += `<defs><marker id="ah8" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#38e0b4"/></marker></defs><path d="M${W - 24},${base - 196} L${x0 + 62},${base - 196}" stroke="#38e0b4" stroke-width="3" marker-end="url(#ah8)"/>`;
        s += T((W + x0) / 2 + 30, base - 208, 'discount each year back to today, then add up', { s: 15, c: '#38e0b4' });
      } else s += T((W + x0) / 2, 40, 'projected operating cash flow (example units)', { s: 13, c: '#b4c0d3' });
      s += '</svg>';
      const legend = st >= 1 ? `<div class="legend"><span><span class="k cash"></span>capex paid that year (already netted out of the green bars) ${st >= 2 ? '— one scenario: re-buy every 2 yrs' : '— source: year 1; later "?" treated as 0 for now'}</span><span><span class="k gen"></span>present value of FCF (OCF − capex) — same color in the stack</span><span class="mini">bars = present value at 10%; one exact scale for all bars</span></div>` : '';
      v.innerHTML = legend + s + (st >= 3 ? `<div class="formula" style="margin-top:6px"><span class="v">Enterprise value</span> − net debt − other claims = <span class="v">equity value</span> → ÷ shares</div>` : '');
    };
    stepRender.ch8(0);
    const st8 = { initialCapex: 100, ocf: 100, ocfGrowth: 10, annualCapex: 0, replaceEvery: 0, r: 0.10, years: 5, term: 'none', g: 0, mult: 8, netDebt: 0, shares: 10 };
    const box = $('#l8ctl'); const c = [];
    const upd = p => { Object.assign(st8, p); r8(); };
    c.push(slider(box, { id: 'l8cap', label: 'Initial capital expenditure', min: 0, max: 300, step: 5, get: () => st8.initialCapex, set: v => upd({ initialCapex: v }), fmt: v => v }));
    c.push(slider(box, { id: 'l8ocf', label: 'Year-1 operating cash flow', min: 0, max: 300, step: 5, get: () => st8.ocf, set: v => upd({ ocf: v }), fmt: v => v }));
    c.push(slider(box, { id: 'l8gr', label: 'OCF change per year', min: -30, max: 40, step: 1, get: () => st8.ocfGrowth, set: v => upd({ ocfGrowth: v }), fmt: v => (v >= 0 ? '+' : '') + v }));
    c.push(slider(box, { id: 'l8ann', label: 'Annual capital expenditures', min: 0, max: 100, step: 5, get: () => st8.annualCapex, set: v => upd({ annualCapex: v }), fmt: v => v }));
    c.push(slider(box, { id: 'l8rep', label: 'Re-buy hardware every (yrs)', min: 0, max: 6, step: 1, get: () => st8.replaceEvery, set: v => upd({ replaceEvery: v }), fmt: v => v === 0 ? 'never' : v + ' yrs', desc: 'Repeats the initial capex at this interval (0 = never).' }));
    c.push(slider(box, { id: 'l8r', label: 'Discount rate', min: 0.04, max: 0.2, step: 0.005, get: () => st8.r, set: v => upd({ r: v }), fmt: v => (v * 100).toFixed(1) + '%' }));
    c.push(slider(box, { id: 'l8n', label: 'Forecast duration (yrs)', min: 1, max: 15, step: 1, get: () => st8.years, set: v => upd({ years: v }), fmt: v => v + ' yrs' }));
    c.push(selectCtl(box, { id: 'l8t', label: 'Terminal value', options: [['none', 'None (forecast years only)'], ['gordon', 'Perpetual growth (Gordon)'], ['multiple', 'Exit multiple of FCF']], get: () => st8.term, set: v => upd({ term: v }) }));
    c.push(slider(box, { id: 'l8g', label: 'Terminal growth g (disclosed)', min: -0.02, max: 0.04, step: 0.005, get: () => st8.g, set: v => upd({ g: v }), fmt: v => (v * 100).toFixed(1) + '%' }));
    c.push(slider(box, { id: 'l8m', label: 'Exit multiple (× FCF)', min: 2, max: 25, step: 0.5, get: () => st8.mult, set: v => upd({ mult: v }), fmt: v => v + '×' }));
    c.push(numberInput(box, { id: 'l8nd', label: 'Net debt (units)', get: () => st8.netDebt, set: v => upd({ netDebt: v }), err: '#l8err', validate: (v, raw) => raw === '' || !Number.isFinite(v) ? 'Net debt must be a number.' : Math.abs(v) > 1e5 ? 'Net debt is out of range.' : null }));
    c.push(numberInput(box, { id: 'l8sh', label: 'Shares (units)', get: () => st8.shares, set: v => upd({ shares: v }), err: '#l8err', validate: (v, raw) => raw === '' || !Number.isFinite(v) || v <= 0 ? 'Shares must be greater than zero.' : null }));
    box.insertAdjacentHTML('beforeend', '<button class="btn" id="l8src" type="button">Load source example (100…140, capex 100)</button>');
    $('#l8src').addEventListener('click', () => upd({ initialCapex: 100, ocf: 100, ocfGrowth: 10, annualCapex: 0, replaceEvery: 0, r: 0.10, years: 5, term: 'none' }));
    function r8() {
      c.forEach(x => x.sync());
      $('#l8g').closest('.ctl').style.display = st8.term === 'gordon' ? '' : 'none';
      $('#l8m').closest('.ctl').style.display = st8.term === 'multiple' ? '' : 'none';
      let rows, d;
      try {
        rows = BD.simpleForecast({ years: st8.years, ocf: st8.ocf, ocfGrowth: st8.ocfGrowth, initialCapex: st8.initialCapex, replaceEvery: st8.replaceEvery, annualCapex: st8.annualCapex });
        const last = rows[rows.length - 1];
        const avgCapex = st8.annualCapex + (st8.replaceEvery > 0 ? st8.initialCapex / st8.replaceEvery : 0);
        const base = last.ocf - avgCapex;
        const terminal = st8.term === 'gordon' ? { type: 'gordon', baseFCF: base, g: st8.g } : st8.term === 'multiple' ? { type: 'multiple', baseFCF: base, multiple: st8.mult } : { type: 'none' };
        d = BD.dcf({ fcfs: rows.map(r => r.fcf), r: st8.r, terminal, netDebt: st8.netDebt, shares: st8.shares });
        $('#l8err').textContent = '';
        $('#l8note').innerHTML = st8.term === 'none' ? 'No terminal value: the business is valued on the forecast years alone.' : `Terminal base FCF = final-year OCF (${fN(last.ocf)}) − average annual capex (${fN(avgCapex)}) = ${fN(base)}. ${st8.term === 'gordon' ? `TV = base × (1 + ${(st8.g * 100).toFixed(1)}%) ÷ (${(st8.r * 100).toFixed(1)}% − ${(st8.g * 100).toFixed(1)}%) = ${fN(d.tv)}` : `TV = ${fN(base)} × ${st8.mult} = ${fN(d.tv)}`}, discounted ${st8.years} years. Terminal value is ${fN(d.tvShare * 100, 0)}% of enterprise value — every assumption here matters.`;
      } catch (e) { $('#l8err').textContent = e.message; return; }
      if (st8.term !== 'none' && st8.replaceEvery === 0 && st8.initialCapex > 0) $('#l8note').innerHTML = '<b style="color:var(--risk-hi)">Warning:</b> the terminal value assumes cash flows continue forever, but the hardware is never replaced — that values chips that never wear out. Set "Re-buy hardware every" to a realistic interval. ' + $('#l8note').innerHTML;
      $('#l8a').textContent = fN(d.sumPV); $('#l8b').textContent = fN(d.pvTV); $('#l8c').textContent = fN(d.enterpriseValue); $('#l8d').innerHTML = fN(d.equityValue) + (d.perShare != null ? `<div class="mini">${fN(d.perShare, 2)} per share</div>` : '');
      CH.bars($('#l8chart'), { cats: rows.map(r => 'Y' + r.year), series: [{ name: 'FCF', values: rows.map(r => r.fcf), color: COL.gen, outline: true }, { name: 'Present value', values: d.rows.map(r => r.pv), color: COL.gen }], h: 210, fmt: v => v.toFixed(0), desc: 'Free cash flow and its present value by year.' });
      $('#l8table').innerHTML = tbl(['', ...rows.map(r => 'Y' + r.year)], [['Operating cash flow', ...rows.map(r => r.ocf)], ['− CapEx', ...rows.map(r => -r.capex)], ['= FCF', ...rows.map(r => r.fcf)], ['Discount factor', ...d.rows.map(r => r.factor.toFixed(3))], ['PV of FCF', ...d.rows.map(r => r.pv)]], [2, 4]);
    }
    r8();
  })();

  // =====================================================================
  // CH 9
  // =====================================================================
  (function ch9() {
    const v = $('#v9');
    const stages = [['new', 'New hardware'], ['prod', 'Productive service'], ['aging', 'Less competitive'], ['secondary', 'Secondary use'], ['aging', 'Reduced revenue'], ['retired', 'Retire / replace']];
    v.innerHTML = `<div class="stagefleet">${stages.map((s, i) => `<div class="s" data-i="${i}">${ILL.glyph(s[0])}<div>${s[1]}</div></div>`).join('')}</div><div id="v9c" style="margin-top:10px"></div><p class="note" id="v9n"></p>`;
    stepRender.ch9 = st => {
      const on = [[0, 1], [1, 2], [2, 4], [3, 5]][st] || [0, 0];
      $$('.stagefleet .s', v).forEach((el, i) => el.classList.toggle('on', i >= on[0] && i <= on[1]));
      const p = st >= 3 ? ECON.presets.redeploy : ECON.presets.periodic;
      const sim = BD.hardwareLife({ cost: 100, bookLife: 5, serviceLife: 3, replaceEvery: 3, revenue: 60, revenueDecayPct: 20, opex: 15, residualPct: 5 });
      CH.lines($('#v9c'), { cats: sim.ages.map(a => 'Age ' + a.age), series: [{ name: 'Book value (5-yr straight line)', values: sim.ages.map(a => a.nbvStart), color: COL.acct }, { name: 'Economic value (scenario)', values: sim.ages.map(a => a.economicValueStart), color: COL.risk, dash: '6 4' }], h: 200, yMax: 140, fmt: v => v.toFixed(0), desc: 'Book value declines in a straight line; illustrative economic value falls faster when hardware becomes less competitive.' });
      $('#v9n').innerHTML = `<b>One illustrative scenario (not a forecast):</b> $60B/yr revenue potential falling 20% a year as newer chips arrive, $15B/yr running cost, retired after 3 years with 5% resale, 10% discount rate. Book value (5-year life) sits above what the hardware can still earn — the gap Burry's argument is about.`;
    };
    stepRender.ch9(0);
    const st9 = Object.assign({ cost: 100, bookLife: 5, serviceLife: 5, revenue: 60, revenueDecayPct: 15, opex: 15, opexGrowthPct: 0, replaceEvery: 5, residualPct: 5, replacementCostPct: 100, redeploy: false, secondaryYears: 2, secondaryRevenuePct: 35, horizon: 10, r: 0.10 });
    const box = $('#l9ctl'); const c = [];
    const upd = p => { Object.assign(st9, p); r9(); };
    $('#l9presets').innerHTML = Object.entries(ECON.presets).map(([k, p]) => `<button data-p="${k}" aria-pressed="false">${p.label}</button>`).join('');
    $$('#l9presets button').forEach(b => b.addEventListener('click', () => { const p = ECON.presets[b.dataset.p]; upd({ serviceLife: p.economicLife, replaceEvery: p.economicLife, revenueDecayPct: p.revenueDecayPct, opexGrowthPct: p.opexGrowthPct, residualPct: p.residualPct, redeploy: p.redeploy, secondaryYears: p.secondaryYears || st9.secondaryYears, secondaryRevenuePct: p.secondaryRevenuePct || st9.secondaryRevenuePct, replacementCostPct: p.replacementCostPct, preset: b.dataset.p }); }));
    c.push(slider(box, { id: 'l9cost', label: 'Asset cost ($B)', min: 10, max: 300, step: 5, get: () => st9.cost, set: v => upd({ cost: v, preset: null }), fmt: fB0 }));
    c.push(slider(box, { id: 'l9bl', label: 'Accounting useful life', min: 1, max: 8, step: 0.5, get: () => st9.bookLife, set: v => upd({ bookLife: v, preset: null }), fmt: v => v + ' yrs' }));
    c.push(slider(box, { id: 'l9sl', label: 'Economic service life', min: 1, max: 10, step: 1, get: () => st9.serviceLife, set: v => upd({ serviceLife: v, preset: null }), fmt: v => v + ' yrs' }));
    c.push(slider(box, { id: 'l9rev', label: 'Year-1 revenue potential ($B/yr)', min: 0, max: 150, step: 1, get: () => st9.revenue, set: v => upd({ revenue: v, preset: null }), fmt: fB0 }));
    c.push(slider(box, { id: 'l9dec', label: 'Revenue decline per year (competitiveness)', min: 0, max: 60, step: 1, get: () => st9.revenueDecayPct, set: v => upd({ revenueDecayPct: v, preset: null }), fmt: v => v + '%' }));
    c.push(slider(box, { id: 'l9op', label: 'Year-1 operating cost ($B/yr: power, cooling, ops)', min: 0, max: 80, step: 1, get: () => st9.opex, set: v => upd({ opex: v, preset: null }), fmt: fB0 }));
    c.push(slider(box, { id: 'l9og', label: 'Operating cost trend per year', min: -10, max: 20, step: 1, get: () => st9.opexGrowthPct, set: v => upd({ opexGrowthPct: v, preset: null }), fmt: v => (v >= 0 ? '+' : '') + v + '%' }));
    c.push(slider(box, { id: 'l9re', label: 'Replacement interval', min: 1, max: 10, step: 1, get: () => st9.replaceEvery, set: v => upd({ replaceEvery: v, preset: null }), fmt: v => v + ' yrs' }));
    c.push(slider(box, { id: 'l9res', label: 'Residual / resale value', min: 0, max: 50, step: 1, get: () => st9.residualPct, set: v => upd({ residualPct: v, preset: null }), fmt: v => v + '% of cost' }));
    c.push(slider(box, { id: 'l9rc', label: 'Hardware replacement cost', min: 50, max: 200, step: 5, get: () => st9.replacementCostPct, set: v => upd({ replacementCostPct: v, preset: null }), fmt: v => v + '% of original' }));
    box.insertAdjacentHTML('beforeend', '<div class="ctl"><label><span><input type="checkbox" id="l9rd"> Redeploy retired chips to secondary work</span></label></div>');
    $('#l9rd').addEventListener('change', e => upd({ redeploy: e.target.checked, preset: null }));
    c.push(slider(box, { id: 'l9sy', label: 'Secondary-use years', min: 0, max: 5, step: 1, get: () => st9.secondaryYears, set: v => upd({ secondaryYears: v, preset: null }), fmt: v => v + ' yrs' }));
    c.push(slider(box, { id: 'l9sr', label: 'Secondary revenue (% of frontier)', min: 0, max: 80, step: 1, get: () => st9.secondaryRevenuePct, set: v => upd({ secondaryRevenuePct: v, preset: null }), fmt: v => v + '%' }));
    function r9() {
      c.forEach(x => x.sync()); $('#l9rd').checked = st9.redeploy;
      $('#l9sy').closest('.ctl').style.display = st9.redeploy ? '' : 'none'; $('#l9sr').closest('.ctl').style.display = st9.redeploy ? '' : 'none';
      $$('#l9presets button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === st9.preset)));
      let s; try { s = BD.hardwareLife(st9); $('#l9err').textContent = ''; } catch (e) { $('#l9err').textContent = e.message; return; }
      $('#l9a').textContent = fB0(s.totalCapex); $('#l9b').textContent = fB(s.npv); $('#l9c').textContent = s.optimalEAV < 0 ? 'None — no cycle recovers cost' : s.optimalCycle + ' yrs';
      const gap = Math.max(...s.ages.map(a => a.gap)); $('#l9d').textContent = gap > 0.05 ? fB(gap) : 'none';
      CH.lines($('#l9chart1'), { cats: s.ages.map(a => 'Age ' + a.age), series: [{ name: 'Book value (straight line)', values: s.ages.map(a => a.nbvStart), color: COL.acct }, { name: 'Economic value (PV of remaining earnings + resale)', values: s.ages.map(a => a.economicValueStart), color: COL.risk, dash: '6 4' }], h: 200, fmt: v => v.toFixed(0), desc: 'Book value vs economic value of one hardware cohort by age.' });
      CH.bars($('#l9chart2'), { cats: s.fleet.map(f => 'Y' + f.year), series: [{ name: 'Revenue', values: s.fleet.map(f => f.revenue), color: COL.gen }, { name: 'Replacement capex', values: s.fleet.map(f => f.capex), color: COL.cash }], h: 210, fmt: v => v.toFixed(0), desc: 'Fleet revenue and capex by year.' });
      const life = Math.min(st9.serviceLife, st9.replaceEvery);
      const msgs = [];
      if (gap > st9.cost * 0.05) msgs.push(`Book value runs up to ${fB(gap)} above the scenario's economic value. A gap like that is the kind of signal that can prompt a shorter useful-life estimate (a change in estimate, applied going forward) or an impairment review (ASC 360 tests recoverability at the asset-group level using undiscounted cash flows).`);
      else if (gap > 0.05) msgs.push(`Book value runs slightly above economic value (by up to ${fB(gap)}) — close to these economics, but not conservative.`);
      else msgs.push('Book value stays at or below this scenario\'s economic value — the accounting life looks conservative relative to these economics.');
      msgs.push(s.optimalEAV < 0
        ? `Under these assumptions <b>no replacement cycle recovers the hardware cost</b> (best case loses ${fB(-s.optimalEAV)} a year in equivalent annual terms) — the investment only works if revenue potential is higher or decays more slowly.`
        : `If replacement chips earn what the originals did when new, replacing every ${s.optimalCycle} yrs maximizes equivalent annual value (${fB(s.optimalEAV)}/yr). Faster-improving new chips would shorten this. Contribution only turns negative at ${s.breakEvenAge ? 'age ' + s.breakEvenAge : 'over 30 yrs'} — running at a cash loss is a much later signal than economic obsolescence.`);
      if (st9.replaceEvery > st9.serviceLife) msgs.push(`Replacement every ${st9.replaceEvery} yrs but service life is ${st9.serviceLife}: the fleet sits idle in between.`);
      if (life < st9.bookLife) msgs.push(`Hardware is retired after ${life} yrs while the book life is ${st9.bookLife}. This simulator writes the remaining book value off at retirement (noncash) to show where it lands; under GAAP the life would normally be shortened going forward once the shorter use is evident.`);
      msgs.push(`Over ${st9.horizon} years the company buys hardware ${s.fleet.filter(f => f.capex > 0).length}×, spending ${fB0(s.totalCapex)}.`);
      $('#l9msg').innerHTML = msgs.join(' ');
    }
    r9();
  })();

  // =====================================================================
  // CH 10
  // =====================================================================
  const SC = ECON.labScenarios;
  const L = { bookLife: 5, economicLife: 5, bookMethod: 'straight-line', taxScenario: 'bonus100', r: 0.10, horizon: 5, terminal: 'gordon', g: 0, exitMultiple: 8, replacementCost: 100, epsYear: 1, netDebt: 0, redeployYears: 0, secondaryRevenuePct: 0, scen: 'base', revise: true };
  function labInputs(o) { return Object.assign({ assetCost: S.assetCost, revenue: S.revenue, otherOpex: S.otherOpex, taxRate: S.taxRate, shares: S.shares, pe: S.pe, bookResidualPct: 0 }, L, o || {}); }
  (function ch10() {
    const v = $('#v10');
    function scenRun(k) { const d = SC[k]; return BD.lab(labInputs({ bookLife: d.bookLife, economicLife: d.economicLife, redeployYears: d.redeploy ? d.secondaryYears : 0, secondaryRevenuePct: d.redeploy ? d.secondaryRevenuePct : 0, replacementCost: S.assetCost })); }
    stepRender.ch10 = st => {
      const base = BD.lab(labInputs({ bookLife: 5, economicLife: 5, redeployYears: 0, secondaryRevenuePct: 0, replacementCost: S.assetCost }));
      if (st === 4) {
        const a = BD.lab(labInputs({ bookLife: 5, economicLife: 5, replacementCost: S.assetCost })), b = BD.lab(labInputs({ bookLife: 2, economicLife: 5, replacementCost: S.assetCost })), bb = scenRun('B');
        v.innerHTML = `<div class="twin-rack"><div class="col"><div class="rk" style="width:min(100%,190px)">${ILL.rack({ accent: '#5fd6ff' })}</div><span class="tag"><i style="background:var(--acct)"></i>Book life 5</span></div><div class="col"><div class="rk" style="width:min(100%,190px)">${ILL.rack({ accent: '#ff8b80', ledPhase: 2 })}</div><span class="tag"><i style="background:var(--risk)"></i>Book life 2</span></div></div>
        <div class="badge-row" style="margin-top:10px"><div class="badge"><span class="k acct"></span>Year-1 depreciation<b>${fB0(a.years[0].bookDepreciation)} vs ${fB0(b.years[0].bookDepreciation)}</b></div><div class="badge"><span class="k acct"></span>Year-1 EPS<b>${fUSD(a.years[0].eps)} vs ${fUSD(b.years[0].eps)}</b></div><div class="badge"><span class="k val"></span>P/E value at ${S.pe}× (Y${a.epsYear} EPS)<b>${fUSD(a.peValue, 0)} vs ${fUSD(b.peValue, 0)}</b></div><div class="badge"><span class="k cash"></span>Year-1 cash outlay<b>${fB0(a.years[0].capex)} = ${fB0(b.years[0].capex)}</b></div><div class="badge"><span class="k gen"></span>DCF/share · label only (book 5 vs 2)<b>${fUSD(a.dcfPerShare)} = ${fUSD(b.dcfPerShare)}</b></div><div class="badge"><span class="k risk"></span>DCF/share · chips really replaced every 2 yrs<b>${fUSD(a.dcfPerShare)} vs ${fUSD(bb.dcfPerShare)}</b></div></div>`;
        return;
      }
      const runs = { 'Baseline': base, 'A': scenRun('A'), 'B': scenRun('B'), 'C': scenRun('C') };
      const keys = Object.keys(runs);
      const show = st === 0 ? ['Baseline', 'A'] : st === 1 ? ['Baseline', 'A'] : st === 2 ? ['Baseline', 'A', 'B'] : keys;
      v.innerHTML = `<div class="two"><div class="pathway pe"><h4><span class="k val"></span>P/E pathway: implied price at ${S.pe}× year-1 EPS</h4><div id="v10a"></div></div><div class="pathway dcf"><h4><span class="k gen"></span>DCF pathway: equity value per share</h4><div id="v10b"></div></div></div><p class="mini">DCF: ${(L.r * 100).toFixed(1)}% discount rate, ${L.horizon}-year forecast, terminal value: ${L.terminal === 'gordon' ? `the replacement cycle continuing forever at ${(L.g * 100).toFixed(1)}% growth` : L.terminal === 'multiple' ? `${L.exitMultiple}× steady-state FCF` : 'none (forecast years only)'} (uses Tool 10's current settings). P/E at ${S.pe}× on year-1 EPS. Levels differ (P/E bakes in growth; DCF also subtracts the $${S.assetCost}B purchase) — compare the changes, not the heights.</p>`;
      const labels = show.map(k => k === 'Baseline' ? 'Base' : k);
      CH.bars($('#v10a'), { cats: labels, series: [{ name: 'P/E value', values: show.map(k => runs[k].peValue), color: COL.val }], h: 190, fmt: v => '$' + v.toFixed(0), label: 'all', desc: 'P/E implied price by scenario.' });
      CH.bars($('#v10b'), { cats: labels, series: [{ name: 'DCF equity / share', values: show.map(k => st === 0 ? (k === 'Baseline' ? runs[k].dcfPerShare : NaN) : runs[k].dcfPerShare), color: COL.gen }], h: 190, fmt: v => '$' + v.toFixed(0), label: 'all', desc: 'DCF value per share by scenario.' });
    };
    stepRender.ch10(0);

    const box = $('#l10ctl'); const c = [];
    const upd = p => { Object.assign(L, p); r10(); };
    $$('#l10scen button').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.scen;
      Object.assign(S, { assetCost: DEF.assetCost, revenue: DEF.revenue, otherOpex: DEF.otherOpex, taxRate: DEF.taxRate, shares: DEF.shares });
      Object.assign(L, { replacementCost: DEF.assetCost, taxScenario: 'bonus100', bookMethod: 'straight-line', r: 0.10, horizon: 5, terminal: 'gordon', g: 0, epsYear: 1, netDebt: 0 });
      if (k === 'base') upd({ bookLife: 5, economicLife: 5, redeployYears: 0, secondaryRevenuePct: 0, scen: k });
      else { const d = SC[k]; upd({ bookLife: d.bookLife, economicLife: d.economicLife, redeployYears: d.redeploy ? d.secondaryYears : 0, secondaryRevenuePct: d.redeploy ? d.secondaryRevenuePct : 0, scen: k }); }
    }));
    const u = p => upd(Object.assign(p, { scen: null }));
    c.push(slider(box, { id: 'x1', label: 'Asset cost ($B)', min: 10, max: 300, step: 5, get: () => S.assetCost, set: v => { L.replacementCost = v; set({ assetCost: v, residual: Math.min(S.residual, v) }); }, fmt: fB0 }));
    c.push(slider(box, { id: 'x2', label: 'Book useful life', min: 1, max: 8, step: 0.5, get: () => L.bookLife, set: v => u({ bookLife: v }), fmt: v => v + ' yrs' }));
    c.push(slider(box, { id: 'x3', label: 'Economic useful life (replace every)', min: 1, max: 8, step: 1, get: () => L.economicLife, set: v => u({ economicLife: v }), fmt: v => v + ' yrs' }));
    c.push(selectCtl(box, { id: 'x4', label: 'Book depreciation method', options: [['straight-line', 'Straight-line'], ['double-declining', 'Double-declining balance']], get: () => L.bookMethod, set: v => u({ bookMethod: v }) }));
    c.push(slider(box, { id: 'x5', label: 'Revenue ($B/yr)', min: 0, max: 200, step: 1, get: () => S.revenue, set: v => set({ revenue: v }), fmt: fB0 }));
    c.push(slider(box, { id: 'x6', label: 'Other operating expenses ($B/yr)', min: 0, max: 150, step: 1, get: () => S.otherOpex, set: v => set({ otherOpex: v }), fmt: fB0 }));
    c.push(slider(box, { id: 'x7', label: 'Tax rate', min: 0, max: 0.5, step: 0.01, get: () => S.taxRate, set: v => set({ taxRate: v }), fmt: fPct }));
    c.push(selectCtl(box, { id: 'x8', label: 'Tax depreciation', options: [['bonus100', '100% bonus (acquired & placed in service after Jan 19, 2025)'], ['bonus40', '40% bonus on initial purchase (acquired pre-Jan 20, 2025; in service 2025), later 100%'], ['macrs5', '5-yr MACRS, no bonus (nonqualifying / elected out)'], ['bookConform', 'Hypothetical: tax = book (not U.S. law)']], get: () => L.taxScenario, set: v => u({ taxScenario: v }) }));
    box.insertAdjacentHTML('beforeend', '<p class="mini" id="x8legal"></p>');
    c.push(selectCtl(box, { id: 'x8b', label: 'When a shorter economic life becomes evident', options: [['prospective', 'Revise the life going forward (GAAP change in estimate)'], ['retire', 'Keep the life; write off at retirement (simplified)']], get: () => L.revise ? 'prospective' : 'retire', set: v => u({ revise: v === 'prospective' }) }));
    c.push(slider(box, { id: 'x9', label: 'P/E multiple', min: 5, max: 40, step: 0.5, get: () => S.pe, set: v => set({ pe: v }), fmt: v => v + '×' }));
    c.push(slider(box, { id: 'x10', label: 'EPS year used for P/E', min: 1, max: 5, step: 1, get: () => Math.min(L.epsYear, L.horizon), set: v => u({ epsYear: v }), fmt: v => 'Year ' + v }));
    c.push(slider(box, { id: 'x11', label: 'Discount rate', min: 0.05, max: 0.2, step: 0.005, get: () => L.r, set: v => u({ r: v }), fmt: v => (v * 100).toFixed(1) + '%' }));
    c.push(slider(box, { id: 'x12', label: 'Replacement capex per purchase ($B)', min: 10, max: 300, step: 5, get: () => L.replacementCost, set: v => u({ replacementCost: v }), fmt: fB0 }));
    c.push(slider(box, { id: 'x13', label: 'Forecast duration', min: 2, max: 15, step: 1, get: () => L.horizon, set: v => u({ horizon: v, epsYear: Math.min(L.epsYear, v) }), fmt: v => v + ' yrs' }));
    c.push(selectCtl(box, { id: 'x14', label: 'Terminal value', options: [['gordon', 'Replacement cycle continues forever, growing at g'], ['multiple', 'Exit multiple × steady-state FCF'], ['none', 'None']], get: () => L.terminal, set: v => u({ terminal: v }) }));
    c.push(slider(box, { id: 'x15', label: 'Terminal growth g', min: -0.02, max: 0.04, step: 0.005, get: () => L.g, set: v => u({ g: v }), fmt: v => (v * 100).toFixed(1) + '%' }));
    c.push(slider(box, { id: 'x16', label: 'Exit multiple (× FCF)', min: 2, max: 25, step: 0.5, get: () => L.exitMultiple, set: v => u({ exitMultiple: v }), fmt: v => v + '×' }));
    c.push(slider(box, { id: 'x17', label: 'Redeployed years (secondary use)', min: 0, max: 4, step: 1, get: () => L.redeployYears, set: v => u({ redeployYears: v }), fmt: v => v + ' yrs' }));
    c.push(slider(box, { id: 'x18', label: 'Secondary contribution (% of frontier revenue, net of its own running costs)', min: 0, max: 80, step: 1, get: () => L.secondaryRevenuePct, set: v => u({ secondaryRevenuePct: v }), fmt: v => v + '%' }));
    c.push(numberInput(box, { id: 'x19', label: 'Net debt ($B) — EV → equity', get: () => L.netDebt, set: v => u({ netDebt: v }), err: '#l10err', validate: (v, raw) => raw === '' || !Number.isFinite(v) ? 'Net debt must be a number.' : Math.abs(v) > 5000 ? 'Net debt out of range.' : null }));
    function r10() {
      c.forEach(x => x.sync());
      $('#x15').closest('.ctl').style.display = L.terminal === 'gordon' ? '' : 'none';
      $('#x16').closest('.ctl').style.display = L.terminal === 'multiple' ? '' : 'none';
      $('#x10').max = L.horizon;
      $('#x8legal').textContent = TAX.scenarios[L.taxScenario].legalAssumption;
      $$('#l10scen button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scen === L.scen)));
      let r, b;
      try {
        r = BD.lab(labInputs());
        b = BD.lab(labInputs({ bookLife: 5, economicLife: 5, bookMethod: 'straight-line', redeployYears: 0, secondaryRevenuePct: 0, replacementCost: S.assetCost }));
        $('#l10err').textContent = '';
      } catch (e) { $('#l10err').textContent = e.message; return; }
      const y1 = r.years[0];
      const repl = r.totals.capex - r.years[0].capex;
      const k = [
        ['Book depreciation (Y1)', fB(y1.bookDepreciation), 'acct'], ['EPS (Y' + r.epsYear + ')', fUSD(r.epsUsed), 'acct'], ['Implied P/E value', fUSD(r.peValue), 'val'],
        ['Operating cash flow (Y1)', fB(y1.ocf), 'gen'], ['Free cash flow (Σ ' + L.horizon + ' yrs)', fB(r.totals.fcf), 'gen'], ['DCF enterprise value', fB(r.dcf.enterpriseValue), 'val'],
        ['DCF equity / share', fUSD(r.dcfPerShare), 'val'], ['Replacement capex (after Y1)', fB0(repl), 'cash']
      ];
      $('#l10kpis').innerHTML = k.map(([t, v, c]) => `<div class="kpi" style="--c:var(--${c})"><div class="t">${t}</div><div class="v">${v}</div></div>`).join('');
      const cats = yrs(L.horizon);
      CH.bars($('#l10eps'), { cats, series: [{ name: 'Baseline (5/5)', values: b.years.map(y => y.eps), color: COL.ink3, outline: true }, { name: 'Current', values: r.years.map(y => y.eps), color: COL.val }], h: 200, fmt: v => v.toFixed(2), desc: 'EPS by year, current vs baseline.' });
      CH.bars($('#l10fcf'), { cats, series: [{ name: 'Baseline (5/5)', values: b.years.map(y => y.fcf), color: COL.ink3, outline: true }, { name: 'Current', values: r.years.map(y => y.fcf), color: COL.gen }], h: 200, fmt: v => v.toFixed(0), desc: 'Free cash flow by year, current vs baseline.' });
      CH.bars($('#l10cmp'), { cats: ['P/E value', 'DCF equity/share'], series: [{ name: 'Baseline', values: [b.peValue, b.dcfPerShare], color: COL.ink3, outline: true }, { name: 'Current', values: [r.peValue, r.dcfPerShare], color: COL.val }], h: 190, fmt: v => '$' + v.toFixed(0), label: 'all', desc: 'Value per share vs baseline under each framework.' });
      const dPE = (r.peValue / b.peValue - 1) * 100, dDCF = (r.dcfPerShare / b.dcfPerShare - 1) * 100;
      const msgs = [];
      const same = BD.lab(labInputs({ bookLife: L.economicLife + L.redeployYears }));
      const acctOnly = Math.abs(r.dcf.enterpriseValue - same.dcf.enterpriseValue) < 1e-6 && Math.abs(r.peValue - same.peValue) > 0.005;
      const chg = (cur, bas, d) => Math.abs(cur - bas) < 0.005 ? 'unchanged' : (bas > 0 ? (d > 0 ? 'up ' : 'down ') + fN(Math.abs(d)) + '%' : (cur > bas ? 'up ' : 'down ') + fUSD(Math.abs(cur - bas)) + '/share');
      msgs.push(`P/E value ${chg(r.peValue, b.peValue, dPE)}; DCF value ${chg(r.dcfPerShare, b.dcfPerShare, dDCF)} vs. a 5/5 baseline with these same inputs. Scenario buttons restore the source economics ($100B revenue, 25% tax).`);
      if (acctOnly) msgs.push(`Versus a book life matched to the economic life (${L.economicLife + L.redeployYears} yrs), the book-life choice moves P/E value to ${fUSD(r.peValue)} from ${fUSD(same.peValue)} but leaves DCF value identical — that difference is purely an <b>accounting estimate</b>.`);
      if (L.economicLife < 5) msgs.push(`The <b>economic forecast</b> (replace every ${L.economicLife} yrs) is what moves DCF: ${fB0(repl)} of extra hardware spending after Year 1.`);
      if (L.taxScenario === 'bookConform') msgs.push('Hypothetical tax setting: book life now leaks into cash taxes.');
      if (r.years.some(y => y.disposalLoss > 0.01)) msgs.push(`Early retirements create ${fB(r.totals.disposalLoss)} of noncash disposal losses that year-1 EPS never showed.`);
      const avgE = r.years.reduce((a, y) => a + y.eps, 0) / r.years.length, avgB = b.years.reduce((a, y) => a + y.eps, 0) / b.years.length;
      if (Math.abs(avgE - r.epsUsed) > 0.05) msgs.push(`Year-${r.epsYear} EPS is ${fUSD(r.epsUsed)}, but average EPS over the forecast is ${fUSD(avgE)} (baseline ${fUSD(avgB)}) — a P/E on one year can hide what comes later.`);
      if (r.years.some(y => y.currentTax < -0.01)) msgs.push('<b>Negative cash tax</b> in some years assumes the tax loss offsets other company income; a standalone company would carry it forward (NOL, usable against up to 80% of later taxable income) instead of getting cash back.');
      if (L.terminal !== 'none') msgs.push(`Terminal value method: ${r.tvMethod}${L.terminal === 'gordon' ? `, g = ${(L.g * 100).toFixed(1)}%` : ''}.`);
      msgs.push('Neither number is a forecast of the stock price; the actual <b>capital-spending decision</b> is management\'s, and markets set multiples. Convention: all flows, including hardware purchases, are discounted as end-of-year amounts (discounting a start-of-year purchase one period less would lower DCF value about 1–2%).');
      $('#l10msg').innerHTML = msgs.join(' ');
    }
    subs.push(r10);
  })();

  // ---------- reset, resize ----------
  $('#resetBtn').addEventListener('click', () => { Object.assign(L, { bookLife: 5, economicLife: 5, bookMethod: 'straight-line', taxScenario: 'bonus100', r: 0.10, horizon: 5, terminal: 'gordon', g: 0, exitMultiple: 8, replacementCost: 100, epsYear: 1, netDebt: 0, redeployYears: 0, secondaryRevenuePct: 0, scen: 'base', revise: true }); set(Object.assign({}, DEF)); });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { subs.forEach(f => safe(f)); $$('.step.active').forEach(s => { const f = stepRender[s.closest('.chapter').id]; if (f) safe(() => f(Number(s.dataset.step))); }); }, 200); });

  set({});
  window.__APP_READY__ = true;
})();
