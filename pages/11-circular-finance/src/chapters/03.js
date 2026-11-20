/* Chapter 03: Follow the $100. Scrollytelling trace + laps + math drawer. */
Chapters["03"] = function (root, ctx) {
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
  function n2(v, d) { return (v == null || isNaN(v)) ? '-' : Number(v).toFixed(d == null ? 2 : d); }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; }

  /* tagged value helpers. usd goes through ctx.tagged; other kinds are rendered here with ctx.tag. */
  function tv(t, kind) {
    var s = el('span', 'tv');
    if (!t) { s.textContent = '-'; return s; }
    if (!kind || kind === 'usd' || kind === 'pct' || kind === 'x' || kind === 'num') { ctx.tagged(s, t, kind || 'usd'); return s; }
    var v = t.value, txt;
    if (v == null) txt = 'n/a';
    else if (kind === 'sgn') txt = (v > 0 ? '+' : v < 0 ? '\u2212' : '') + F.usd(Math.abs(v));
    else if (kind === 'yrs') txt = F.num(v) + ' years';
    else txt = F.num(v);
    s.appendChild(el('span', 'val', txt));
    s.appendChild(ctx.tag(t.status, { formula: t.formula_text }));
    if (t.formula_text) s.title = t.formula_text;
    return s;
  }
  function P(parts, cls) {
    var p = el('p', cls || '');
    parts.forEach(function (x) { p.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
    return p;
  }
  function derived(value, status, formula) { return { value: value, status: status, formula_text: formula }; }

  var chartW = 0, run, hops, claims, cur = 0, lapsMode = '1', nLaps = 12, playing = false, playTimer = null, lockUntil = 0, io = null;
  var KINDS = {
    'none': ['No money has moved', 'k-none'], 'recycled': ['Recycled cash', 'k-recycled'], 'external': ['Outside money', 'k-external'],
    'recycled+external': ['Recycled + outside money', 'k-mixed'], 'external+recycled': ['Outside + recycled money', 'k-mixed'], 'promise': ['Promise, not cash', 'k-promise'], 'paper': ['Paper value, not cash', 'k-paper']
  };

  function compute() {
    run = M.runLoop(ctx.state.params, 1);
    hops = run.hops; claims = run.claims;
    if (cur > hops.length - 1) cur = hops.length - 1;
  }

  /* ---------- story copy, every figure from hops[i] ---------- */
  function claimLine(h) {
    if (!h.claims_added || !h.claims_added.length) return null;
    var p = el('p', 'c3-claims');
    p.appendChild(document.createTextNode(h.claims_added.length > 1 ? 'New claims: ' : 'New claim: '));
    h.claims_added.forEach(function (id, i) {
      var c = claims.filter(function (x) { return x.id === id; })[0];
      if (!c) return;
      if (i) p.appendChild(document.createTextNode('; '));
      var b = el('b', '', '#' + c.n);
      p.appendChild(b); p.appendChild(document.createTextNode(' ' + c.label));
    });
    return p;
  }
  function stepBody(h) {
    var v = h.values, out = [], L = ctx.state.params;
    var a = h.amount;
    switch (h.hop) {
      case 0:
        out.push(P(['Meet our seed: ', tv(v.nvidia_cash), '. Nvidia has it in cash. (A neocloud, which shows up next, is a newer company that rents out racks of AI chips.) Nothing has moved and nobody has a claim on it yet. Scroll, or press Next, and watch it go.']));
        break;
      case 1:
        out.push(P(['Nvidia puts ', tv(v.equity_invested), ' into a neocloud as equity. That’s a real investment and a real cash transfer. We call it ', el('b', '', 'recycled'), ': it started inside the loop, and we’re about to see it come home as Nvidia revenue.']));
        break;
      case 2:
        out.push(P(['The neocloud drops that equity into a special-purpose vehicle (SPV), a separate legal box that will own the GPUs. The equity is the first-loss slice, the slice that takes losses first. Lenders add ', tv(v.debt_created), ' at a loan-to-cost of ', tv({ value: L.loan_to_cost, status: M.effectiveStatus('loan_to_cost', L.loan_to_cost), formula_text: 'loan_to_cost' }, 'pct'), ' (the share of the bill the lenders cover). The box now holds ', tv(v.build_cost), ' to spend.']));
        out.push(P(['That lender money is ', el('b', '', 'outside money'), ': it comes from outside the loop, but it has to be repaid or earn a return from someone’s future spending. It’s secured by the GPUs.']));
        break;
      case 3:
        out.push(P(['The SPV buys servers. Nvidia’s share of that bill, ', tv(v.revenue_booked), ', lands as Nvidia revenue. About ', tv(v.revenue_recycled), ' of it traces to Nvidia’s own equity and ', tv(v.revenue_external), ' to lender cash.']));
        out.push(P(['The revenue is real. The interesting part is where it came from: ', tv(h.running.revenue_counted_times, 'x'), ' of revenue has been booked for every $1 of seed cash. It’s the same idea as the dinner table in chapter 1: sales on the books versus real money that entered. Here, the extra comes from lender cash.']));
        break;
      case 4:
        out.push(P(['Revenue becomes ', tv(v.gross_profit), ' of gross profit, then ', tv(v.net_profit), ' of net profit. A market that pays a multiple for recurring profit values that at ', tv(v.market_value_paper), '.']));
        out.push(P([el('b', '', 'Paper, not cash.'), ' It’s drawn hatched on the map and it doesn’t enter any cash tally. It moves with the multiple, up or down.']));
        break;
      case 5:
        out.push(P(['The neocloud signs a multi-year contract worth ', tv(v.contract_value), ' over ', tv(v.contract_years, 'yrs'), ' to rent the compute to an AI lab, with a prepayment of ', tv(v.prepayment), '. It’s pledged to the lenders.']));
        out.push(P(['A contract is a ', el('b', '', 'promise'), '. It’s drawn as a dashed outline here, and it sits in its own tally, never in the cash rows.']));
        break;
      case 6:
        out.push(P(['In year one the lab pays ', tv(v.year1_payment), '. Of that, ', tv(v.paid_from_end_users), ' comes from the lab’s own outside revenue and ', tv(v.paid_from_raised_capital), ' from capital it raised. Part of the raised capital, ', tv(v.raised_capital_recycled), ', is vendor-sourced, so it’s recycled; ', tv(v.raised_capital_external), ' is from outside investors.']));
        out.push(P(['This is the moment a slice of the promise turns into cash: ', tv(v.year1_payment), ' moves from the promises tally to the cash tallies. Nvidia’s stake in the lab is ', tv(v.nvidia_stake_in_lab), '; other lab investors hold ', tv(v.other_lab_investors), '.']));
        break;
      case 7:
        out.push(P(['Nvidia promises to buy capacity the neocloud can’t sell, up to ', tv(v.backstop_cap), '. Nothing is paid unless demand falls short. It’s contingent, so it’s a ', el('b', '', 'promise'), ' and not cash.']));
        out.push(P(['The lenders can lean on it, and that alignment is also what lets them price the loan tighter. Nvidia, in turn, is now exposed to the same demand it helped create.']));
        break;
      case 8:
        out.push(P(['The fund that made the senior loan didn’t use only its own money. Its limited partners (LPs, the investors in the fund) put in ', tv(v.lp_money), ' and a bank lent ', tv(v.bank_back_leverage), ' against the loan. That second layer is called back-leverage: the fund itself borrowed.']));
        out.push(P(['That’s not new cash. It’s how the ', tv(h.running.debt_created), ' of debt from hop 2 was funded, so the claims nest inside claim #2 and add claimants, not dollars.']));
        break;
      case 9:
        out.push(P(['Investors hold neocloud stock and bonds, some bought with borrowed money (', tv(v.margin_debt), ' of margin debt, ', tv(v.parent_bonds_converts), ' of parent bonds and converts, meaning bonds the holder can swap for shares). At the current mark the neocloud equity is worth ', tv(v.neocloud_equity_at_market), ' and Nvidia books a mark-to-market change of ', tv(v.nvidia_mark_to_market_gain, 'sgn'), '.']));
        out.push(P(['It’s paper, and it cuts both ways. If prices fall, margin borrowers and Nvidia’s earnings feel it together. That’s what we mean by reflexive: prices and financing feed each other, so a fall in one can push the other down too.']));
        break;
      default:
        out.push(P(['The loop closes. Nvidia reinvests part of its gross profit: ', tv(v.next_lap_seed), ' becomes lap two’s seed, which is ', tv(v.lap_ratio, 'num'), ' times lap one’s.']));
        out.push(P(['One lap, in all: ', tv(h.running.claims_count, 'num'), ' claims held by ', tv(h.running.claimants_count, 'num'), ' parties, on the same future end-user spending. Below, we run the laps.']));
    }
    var cl = claimLine(h); if (cl) out.push(cl);
    if (h.is_promise || h.money_kind === 'promise') out.push(el('p', 'c3-flag c3-flag-p', 'Note: this is a promise. It is not added to the cash tallies.'));
    else if (h.money_kind === 'paper' || h.hatched) out.push(el('p', 'c3-flag c3-flag-v', 'Note: this is paper value. It is not added to the cash tallies.'));
    return out;
  }

  function buildSteps() {
    var ol = clear($('#c3-steps'));
    hops.forEach(function (h, i) {
      var li = el('li', 'c3-step'); li.dataset.hop = i; li.tabIndex = 0;
      li.setAttribute('aria-label', 'Hop ' + i + ' of ' + (hops.length - 1) + ': ' + h.title);
      var k = KINDS[h.money_kind] || KINDS.none;
      var head = el('div', 'c3-sh');
      head.appendChild(el('span', 'c3-hn mono', 'Hop ' + i + ' / ' + (hops.length - 1)));
      var chip = el('span', 'c3-kind'); chip.appendChild(el('i', 'c3-sw ' + k[1])); chip.appendChild(document.createTextNode(k[0]));
      head.appendChild(chip);
      li.appendChild(head);
      li.appendChild(el('h3', '', h.title));
      stepBody(h).forEach(function (n) { li.appendChild(n); });
      li.addEventListener('focus', function () { if (Date.now() > lockUntil) setCur(i, false); });
      li.addEventListener('click', function () { setCur(i, false); });
      ol.appendChild(li);
    });
    observe();
  }

  /* ---------- map ---------- */
  var LAYOUTS = {
    wide: { vb: [880, 440], w: 176, h: 56, fs: 17,
      n: { nv: [110, 110], nc: [330, 110], sp: [550, 110], rev: [770, 110], pub: [110, 340], bs: [330, 225], cf: [550, 340], lab: [770, 340], ln: [550, 30] } },
    tall: { vb: [420, 340], w: 124, h: 52, fs: 15,
      n: { nv: [70, 75], nc: [210, 75], sp: [350, 75], rev: [350, 185], bs: [210, 185], pub: [70, 185], cf: [210, 295], lab: [350, 295], ln: [350, 17] } }
  };
  var LABELS = { nv: ['Nvidia', ''], nc: ['Neocloud', ''], sp: ['GPU SPV', '+ lenders'], rev: ['Nvidia', 'revenue'], pub: ['Public', 'investors'], bs: ['Nvidia', 'backstop'], cf: ['Credit fund', 'bank + LPs'], lab: ['AI lab', ''], ln: ['Lenders', ''] };
  var FIRST = { nv: 0, nc: 1, sp: 2, ln: 2, rev: 3, lab: 5, bs: 7, cf: 8, pub: 9 };
  /* per hop: token waypoints and the edges to light (a, b, kind override) */
  var ROUTE = [
    { path: ['nv'], edges: [] },
    { path: ['nc'], edges: [['nv', 'nc']] },
    { path: ['sp'], edges: [['nc', 'sp', 'recycled'], ['ln', 'sp', 'debt']] },
    { path: ['rev'], edges: [['sp', 'rev']] },
    { path: ['rev'], edges: [], halo: 'rev' },
    { path: ['lab'], edges: [['lab', 'nc']] },
    { path: ['nc'], edges: [['lab', 'nc']] },
    { path: ['bs'], edges: [['nv', 'bs'], ['bs', 'nc']] },
    { path: ['cf'], edges: [['cf', 'sp', 'debt']] },
    { path: ['pub'], edges: [['nc', 'pub']], halo: 'pub' },
    { path: ['nv'], edges: [['pub', 'nv']] }
  ];
  var layoutName = null, pos = {}, nodeEls = {}, edgeEls = [], tokenG, tokenCirc, tokenTxt, haloEls = {}, tokenXY = null, anim = null;

  function tpos(id) { var L = LAYOUTS[layoutName], p = pos[id]; return [p[0] + L.w / 2 - 8, p[1] - L.h / 2 + 2]; }
  function chooseLayout() { return root.clientWidth && root.clientWidth < 640 ? 'tall' : 'wide'; }
  function kindColor(k) {
    return { recycled: 'var(--c-recycled)', external: 'var(--c-external)', debt: 'var(--c-debt)', promise: 'var(--c-promise)', paper: 'var(--c-paper)', none: 'var(--ink-2)', mixed: 'var(--c-external)' }[k] || 'var(--ink-2)';
  }
  function hopKind(h) {
    var k = h.money_kind;
    if (k === 'recycled+external' || k === 'external+recycled') return 'mixed';
    return k;
  }
  function edgeKind(hopIdx, over) { return over || hopKind(hops[hopIdx]); }

  function buildMap() {
    layoutName = chooseLayout();
    var L = LAYOUTS[layoutName], svg = $('#c3-svg');
    clear(svg);
    svg.setAttribute('viewBox', '0 0 ' + L.vb[0] + ' ' + L.vb[1]);
    svg.setAttribute('class', 'c3-map c3-' + layoutName);
    var t = sv('title', { id: 'c3-svg-t' }); t.textContent = 'Route map of the seed dollars through the loop';
    var d = sv('desc', { id: 'c3-svg-d' }); d.textContent = 'Nodes: Nvidia, Neocloud, GPU SPV and lenders, Nvidia revenue, AI lab, Nvidia backstop, credit fund with bank and LPs, public investors. A glowing token marks the current hop.';
    svg.appendChild(t); svg.appendChild(d);
    pos = L.n; nodeEls = {}; edgeEls = []; haloEls = {};
    var underlay = sv('g', { class: 'c3-under' }), edgeLayer = sv('g', { class: 'c3-edges' }), nodeLayer = sv('g', { class: 'c3-nodes' });
    var seen = {};
    ROUTE.forEach(function (r, hi) {
      r.edges.forEach(function (e) {
        var key = e[0] + e[1];
        if (!seen[key]) {
          seen[key] = 1;
          underlay.appendChild(sv('line', { x1: pos[e[0]][0], y1: pos[e[0]][1], x2: pos[e[1]][0], y2: pos[e[1]][1], class: 'c3-map-edge' }));
        }
        var ln = sv('line', { x1: pos[e[0]][0], y1: pos[e[0]][1], x2: pos[e[1]][0], y2: pos[e[1]][1], class: 'c3-edge', 'data-hop': hi });
        edgeEls.push({ hop: hi, el: ln, over: e[2] });
        edgeLayer.appendChild(ln);
        if (hi === 3) { /* mixed funding: a thinner cool line on top of the warm one */
          var ln2 = sv('line', { x1: pos[e[0]][0], y1: pos[e[0]][1], x2: pos[e[1]][0], y2: pos[e[1]][1], class: 'c3-edge c3-edge-in', 'data-hop': hi });
          edgeEls.push({ hop: hi, el: ln2, over: 'recycled', inner: true }); edgeLayer.appendChild(ln2);
        }
      });
    });
    Object.keys(pos).forEach(function (id) {
      var p = pos[id], w = id === 'ln' ? L.w * .62 : L.w, h = id === 'ln' ? L.h * .55 : L.h;
      var g = sv('g', { class: 'c3-node' + (id === 'ln' ? ' c3-small' : ''), 'data-node': id, transform: 'translate(' + p[0] + ',' + p[1] + ')' });
      g.appendChild(sv('rect', { class: 'c3-nbg', x: -w / 2, y: -h / 2, width: w, height: h, rx: 14 }));
      var halo = sv('rect', { class: 'c3-halo', x: -w / 2, y: -h / 2, width: w, height: h, rx: 14, fill: 'url(#hatch)' });
      g.appendChild(halo); haloEls[id] = halo;
      var lb = LABELS[id];
      if (lb[1]) {
        g.appendChild(sv('text', { class: 'c3-nt', y: -L.fs * .15, 'text-anchor': 'middle', 'font-size': L.fs }, [document.createTextNode(lb[0])]));
        g.appendChild(sv('text', { class: 'c3-nt c3-nt2', y: L.fs * 1.1, 'text-anchor': 'middle', 'font-size': L.fs * .96 }, [document.createTextNode(lb[1])]));
      } else {
        g.appendChild(sv('text', { class: 'c3-nt', y: L.fs * .35, 'text-anchor': 'middle', 'font-size': id === 'ln' ? L.fs * .9 : L.fs }, [document.createTextNode(lb[0])]));
      }
      nodeEls[id] = g; nodeLayer.appendChild(g);
    });
    svg.appendChild(underlay); svg.appendChild(edgeLayer); svg.appendChild(nodeLayer);
    tokenG = sv('g', { class: 'c3-token' });
    tokenCirc = sv('circle', { r: layoutName === 'wide' ? 20 : 17, class: 'c3-tok' });
    tokenTxt = sv('text', { class: 'c3-tl', y: layoutName === 'wide' ? -27 : -23, 'text-anchor': 'middle', 'font-size': layoutName === 'wide' ? 17 : 15 });
    tokenG.appendChild(tokenCirc); tokenG.appendChild(sv('text', { class: 'c3-ts', y: 5, 'text-anchor': 'middle', 'font-size': 14 }, [document.createTextNode('$')]));
    tokenG.appendChild(tokenTxt);
    svg.appendChild(tokenG);
    var tp = tpos(ROUTE[cur].path[ROUTE[cur].path.length - 1]); tokenXY = [tp[0], tp[1]];
    tokenG.setAttribute('transform', 'translate(' + tokenXY[0] + ',' + tokenXY[1] + ')');
    paintMap(true);
  }

  function tokenKindClass(h) { return 'c3-tok k-' + (hopKind(h) === 'none' ? 'none' : hopKind(h)); }
  function paintMap(instant) {
    var h = hops[cur];
    Object.keys(nodeEls).forEach(function (id) {
      var g = nodeEls[id];
      g.classList.toggle('on', cur >= FIRST[id]);
      g.classList.toggle('here', ROUTE[cur].path[ROUTE[cur].path.length - 1] === id);
    });
    ['rev', 'pub'].forEach(function (id) {
      var need = id === 'rev' ? 4 : 9;
      nodeEls[id].classList.toggle('paper', cur >= need);
    });
    edgeEls.forEach(function (e) {
      var on = e.hop <= cur && e.hop > 0, now = e.hop === cur;
      var k = edgeKind(e.hop, e.over);
      e.el.setAttribute('class', 'c3-edge' + (e.inner ? ' c3-edge-in' : '') + ' k-' + k + (on ? ' on' : '') + (now ? ' now' : ''));
    });
    tokenCirc.setAttribute('class', tokenKindClass(h));
    tokenG.setAttribute('class', 'c3-token' + (h.money_kind === 'promise' ? ' ghost' : ''));
    var a = h.amount && h.amount.value;
    tokenTxt.textContent = a == null ? '' : F.usd(a);
    moveToken(ROUTE[cur].path, instant);
  }
  function moveToken(path, instant) {
    if (anim) { cancelAnimationFrame(anim); anim = null; }
    var pts = [tokenXY.slice()].concat(path.map(function (id) { return tpos(id); }));
    var last = pts[pts.length - 1];
    if (instant || ctx.reducedMotion || (pts.length === 2 && pts[0][0] === last[0] && pts[0][1] === last[1])) {
      tokenXY = last.slice();
      tokenG.setAttribute('transform', 'translate(' + last[0] + ',' + last[1] + ')');
      return;
    }
    var segs = [], total = 0, i;
    for (i = 1; i < pts.length; i++) { var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); total += l; }
    var dur = Math.min(1100, Math.max(450, total * 1.6)), t0 = null;
    function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
    function frame(ts) {
      if (t0 == null) t0 = ts;
      var u = Math.min(1, (ts - t0) / dur), d = ease(u) * total, j = 0;
      while (j < segs.length - 1 && d > segs[j]) { d -= segs[j]; j++; }
      var f = segs[j] ? Math.min(1, d / segs[j]) : 1;
      var x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f, y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f;
      tokenXY = [x, y];
      tokenG.setAttribute('transform', 'translate(' + x + ',' + y + ')');
      if (u < 1) anim = requestAnimationFrame(frame); else { anim = null; tokenXY = last.slice(); }
    }
    anim = requestAnimationFrame(frame);
  }

  /* ---------- tallies ---------- */
  var TALLY = [
    ['seed_equity', 'Seed equity', 'Seed'], ['debt_created', 'Debt created', 'Debt'],
    ['revenue_booked_total', 'Revenue booked, all companies', 'Revenue'], ['revenue_counted_times', 'Revenue booked per $1 of seed cash', 'Rev per $1'],
    ['external_end_user', 'Outside money: end customers', 'End cust.'], ['external_capital', 'Outside money: lenders and investors (must be repaid or earn a return)', 'Lenders'],
    ['recycled_cash', 'Recycled cash', 'Recycled'], ['promises_outstanding', 'Promises outstanding (not cash)', 'Promises'],
    ['claims', 'Claims / claimants', 'Claims']
  ];
  var tallyEls = {}, lastVals = {};
  function buildTallies() {
    var box = clear($('#c3-tallies')); tallyEls = {};
    TALLY.forEach(function (t) {
      var d = el('div', 'c3-t'); d.dataset.k = t[0]; d.setAttribute('role', 'listitem'); d.title = t[1];
      var k = el('div', 'k'); k.appendChild(el('span', 'long', t[1])); k.appendChild(el('span', 'short', t[2]));
      var v = el('div', 'v'); d.appendChild(k); d.appendChild(v); box.appendChild(d); tallyEls[t[0]] = v;
    });
    $('#c3-notecash').textContent = 'The cash rows (outside money and recycled) never include promises. Promises and paper value are kept apart on purpose.';
  }
  function updateTallies() {
    var r = hops[cur].running;
    TALLY.forEach(function (t) {
      var v = tallyEls[t[0]], key = t[0], sig;
      clear(v);
      if (key === 'claims') {
        sig = r.claims_count.value + '/' + r.claimants_count.value;
        var s = el('span', 'tv');
        s.appendChild(el('span', 'val', r.claims_count.value + ' / ' + r.claimants_count.value));
        s.appendChild(ctx.tag(r.claims_count.status, { formula: r.claims_count.formula_text }));
        s.title = (r.claims_count.formula_text || '') + ' | ' + (r.claimants_count.formula_text || '');
        v.appendChild(s);
      } else {
        sig = r[key].value; v.appendChild(tv(r[key], key === 'revenue_counted_times' ? 'x' : undefined));
      }
      if (lastVals[key] !== undefined && lastVals[key] !== sig && !ctx.reducedMotion) {
        v.parentNode.classList.remove('bump'); void v.parentNode.offsetWidth; v.parentNode.classList.add('bump');
      }
      lastVals[key] = sig;
    });
  }

  /* ---------- stepping ---------- */
  function setCur(i, scroll) {
    i = Math.max(0, Math.min(hops.length - 1, i));
    var changed = i !== cur;
    cur = i;
    if (changed || scroll) {
      paintMap(false); updateTallies(); updateBar();
    }
    $('#c3-steps').querySelectorAll('.c3-step').forEach(function (s, j) { s.classList.toggle('active', j === cur); });
    if (scroll) scrollToStep(i);
  }
  function scrollToStep(i) {
    var s = $('#c3-steps').children[i]; if (!s) return;
    var rect = s.getBoundingClientRect(), vh = window.innerHeight;
    var narrow = window.matchMedia('(max-width:1000px)').matches, dy;
    if (narrow) dy = rect.top - (stageBottom() + 14);
    else dy = rect.top + rect.height / 2 - vh * .5;
    lockUntil = Date.now() + 900;
    window.scrollBy({ top: dy, behavior: ctx.reducedMotion ? 'auto' : 'smooth' });
  }
  function updateBar() {
    $('#c3-count').textContent = 'Hop ' + cur + ' of ' + (hops.length - 1) + ': ' + hops[cur].title;
    $('#c3-prev').disabled = cur === 0; $('#c3-next').disabled = cur === hops.length - 1;
  }
  function stageBottom() { var st = $('#c3-stage'); return (parseFloat(getComputedStyle(st).top) || 0) + st.offsetHeight; }
  function bandNarrow() {
    var vh = window.innerHeight, sb = Math.round(stageBottom());
    sb = Math.max(120, Math.min(vh - 140, sb + 10));
    return '-' + sb + 'px 0px -' + (vh - sb - 70) + 'px 0px';
  }
  function observe() {
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window)) return;
    var narrow = window.matchMedia('(max-width:1000px)').matches;
    io = new IntersectionObserver(function (ents) {
      if (Date.now() < lockUntil) return;
      ents.forEach(function (e) { if (e.isIntersecting) setCur(+e.target.dataset.hop, false); });
    }, { rootMargin: narrow ? bandNarrow() : '-42% 0px -42% 0px' });
    $('#c3-steps').querySelectorAll('.c3-step').forEach(function (s) { io.observe(s); });
  }
  function stopPlay() { playing = false; clearInterval(playTimer); var b = $('#c3-play'); b.setAttribute('aria-pressed', 'false'); b.innerHTML = '&#9654; Play'; }
  function startPlay() {
    if (ctx.reducedMotion) return;
    playing = true; var b = $('#c3-play'); b.setAttribute('aria-pressed', 'true'); b.innerHTML = '&#10074;&#10074; Pause';
    if (cur >= hops.length - 1) setCur(0, true);
    playTimer = setInterval(function () { if (cur >= hops.length - 1) { stopPlay(); return; } setCur(cur + 1, true); }, 3200);
  }

  /* ---------- laps ---------- */
  function lapCount() { return lapsMode === 'n' ? nLaps : +lapsMode; }
  function seriesFor(res) {
    var cr = 0, cd = 0, out = [];
    res.lap_traces.forEach(function (t, i) {
      cr += t.totals.revenue_booked_total.value; cd += t.totals.debt_created.value;
      out.push({ lap: i + 1, rev: cr, debt: cd });
    });
    return out;
  }
  function drawChart(res) {
    var wrapW = $('#c3-chart').parentNode.clientWidth || 560, W = Math.max(300, Math.min(560, wrapW)), H = Math.round(W * (W < 440 ? .72 : .54)), svg = clear($('#c3-chart')), m = { l: 52, r: 14, t: 14, b: 40 };
    chartW = W;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var t = sv('title', { id: 'c3-chart-t' }); t.textContent = 'Cumulative revenue booked and debt created, by lap'; svg.appendChild(t);
    var S = seriesFor(res), N = S.length, g = res.geometric;
    var limR = g.converges && g.limit.revenue_booked_total ? g.limit.revenue_booked_total.value : null;
    var limD = g.converges && g.limit.debt_created ? g.limit.debt_created.value : null;
    var ymax = Math.max(S[N - 1].rev, S[N - 1].debt, limR || 0, limD || 0, 1) * 1.1;
    function X(i) { return N === 1 ? (m.l + (W - m.r)) / 2 : m.l + (W - m.l - m.r) * (i - 1) / (N - 1); }
    function Y(v) { return H - m.b - (H - m.t - m.b) * v / ymax; }
    var k, ticks = 4;
    for (k = 0; k <= ticks; k++) {
      var yv = ymax * k / ticks, y = Y(yv);
      svg.appendChild(sv('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'c3-grid' }));
      var tx = sv('text', { x: m.l - 8, y: y + 4, 'text-anchor': 'end', class: 'c3-ax' }); tx.textContent = F.compact(yv); svg.appendChild(tx);
    }
    var step = N <= 6 ? 1 : N <= 14 ? 2 : N <= 30 ? 5 : 10;
    S.forEach(function (p, i) {
      if (p.lap === 1 || p.lap % step === 0 || p.lap === N) {
        var tx2 = sv('text', { x: X(p.lap), y: H - m.b + 20, 'text-anchor': 'middle', class: 'c3-ax' }); tx2.textContent = p.lap; svg.appendChild(tx2);
      }
    });
    var ax = sv('text', { x: (m.l + W - m.r) / 2, y: H - 4, 'text-anchor': 'middle', class: 'c3-ax' }); ax.textContent = 'Lap'; svg.appendChild(ax);
    function line(key, cls, lim) {
      if (lim != null) svg.appendChild(sv('line', { x1: m.l, x2: W - m.r, y1: Y(lim), y2: Y(lim), class: 'c3-limit ' + cls }));
      var d = S.map(function (p, i) { return (i ? 'L' : 'M') + X(p.lap).toFixed(1) + ' ' + Y(p[key]).toFixed(1); }).join('');
      svg.appendChild(sv('path', { d: d, class: 'c3-line ' + cls, fill: 'none' }));
      if (N <= 15) S.forEach(function (p) { svg.appendChild(sv('circle', { cx: X(p.lap), cy: Y(p[key]), r: 3.5, class: 'c3-dot ' + cls })); });
    }
    line('debt', 'k-debt', limD); line('rev', 'k-rev', limR);
    var key = $('#c3-chartkey'); clear(key);
    [['k-rev', 'Revenue booked, cumulative'], ['k-debt', 'Debt created, cumulative']].forEach(function (x) { var li = el('li'); li.appendChild(el('i', 'c3-ks ' + x[0])); li.appendChild(document.createTextNode(x[1])); key.appendChild(li); });
    if (limR != null) { var li2 = el('li'); li2.appendChild(el('i', 'c3-ks c3-ks-lim')); li2.appendChild(document.createTextNode('Dashed: the limit as laps go on')); key.appendChild(li2); }
  }
  function renderLaps() {
    var n = lapCount(), res = M.runLoop(ctx.state.params, n), g = res.geometric, c = res.cumulative;
    root.querySelectorAll('[data-laps]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.laps === lapsMode)); });
    $('#c3-nout').textContent = 'N = ' + nLaps;
    $('#c3-n').value = nLaps;
    drawChart(res);
    var box = clear($('#c3-lapnums'));
    var rows = [['seed_equity', 'Seed equity, all laps'], ['debt_created', 'Debt created'], ['revenue_booked_total', 'Revenue booked, all companies'], ['external_end_user', 'Outside money: end customers'], ['external_capital', 'Outside money: lenders and investors (must be repaid or earn a return)'], ['recycled_cash', 'Recycled cash'], ['promises_outstanding', 'Promises outstanding (not cash)']];
    rows.forEach(function (r) {
      var d = el('div', 'c3-t'); d.dataset.k = r[0];
      d.appendChild(el('div', 'k', r[1])); var v = el('div', 'v'); v.appendChild(tv(c[r[0]])); d.appendChild(v); box.appendChild(d);
    });
    var cnt = el('div', 'c3-t c3-t-plain'); cnt.appendChild(el('div', 'k', 'Revenue booked per $1 of seed cash'));
    var cv = el('div', 'v'); cv.appendChild(tv(c.revenue_counted_times, 'x')); cnt.appendChild(cv); box.appendChild(cnt);

    var says = $('#c3-lap-says'); clear(says);
    var rt = g.ratio;
    if (n === 1) {
      says.appendChild(P(['One lap: ', tv(c.seed_equity), ' of seed cash produced ', tv(c.revenue_booked_total), ' of Nvidia revenue and ', tv(c.debt_created), ' of lender debt. Promises (', tv(c.promises_outstanding), ') are shown here for scale and are not part of any cash row.']));
    } else if (g.converges) {
      says.appendChild(P(['After ', String(n), ' laps: ', tv(c.revenue_booked_total), ' of revenue booked on ', tv(c.debt_created), ' of debt. Each lap’s seed is ', tv(rt, 'num'), ' times the last, so the laps shrink fast and the totals head for a ceiling instead of exploding. The cash rows count only cash; ', tv(c.promises_outstanding), ' of promises sit apart from them.']));
    } else {
      says.appendChild(P(['After ', String(n), ' laps: ', tv(c.revenue_booked_total), ' of revenue booked on ', tv(c.debt_created), ' of debt. Here each lap’s seed is ', tv(rt, 'num'), ' times the last, which is at least 1. In this toy model the totals keep growing and have no limit. That’s a property of these settings, not a prediction. Promises (', tv(c.promises_outstanding), ') stay out of the cash rows.']));
    }
    renderMath(res);
    clear($('#c3-bridge')).appendChild(P(['Revenue booked per $1 of seed cash: ', tv(c.revenue_counted_times, 'x'), '. Compare the dinner table: there, “counted N times” divided the sales by the new money that came in from outside. Here we divide Nvidia’s revenue by the seed cash instead. Of that revenue, ', tv(c.revenue_recycled), ' is Nvidia’s own cash coming back, and ', tv(c.revenue_external), ' is lender money. Same question (how much is on the books versus how much real new money showed up), different arithmetic.']));
    $('#c3-lap-lead').textContent = 'One lap ends with a reinvestment. Nvidia puts part of its gross profit back in as the next lap’s seed, so we can ask what happens if it goes around again.';
  }
  function renderMath(res) {
    var g = res.geometric, n = res.laps, b = clear($('#c3-mathbody')), r = g.ratio.value;
    var steps = [], ol = el('ol', 'c3-mathlist');
    function li(parts) { var x = el('li'); parts.forEach(function (p) { x.appendChild(typeof p === 'string' ? document.createTextNode(p) : p); }); ol.appendChild(x); return x; }
    li([el('b', '', 'The ratio. '), 'Each lap’s seed is a fixed fraction r of the lap before: ', el('span', 'mono', g.ratio.formula_text), ' ', tv(g.ratio, 'num')]);
    li([el('b', '', 'After N laps. '), 'Every flow in a lap scales with its seed, so the N-lap total is lap one times G', el('sub', '', 'N'), ' = (1 − r', el('sup', '', 'N'), ') / (1 − r). With the numbers in: ',
      el('span', 'mono', '(1 − ' + n2(r, 4) + '^' + n + ') / (1 − ' + n2(r, 4) + ') = ' + n2(g.sum_factor_n_laps.value, 4)), ' ', tv(g.sum_factor_n_laps, 'num')]);
    if (g.converges) {
      li([el('b', '', 'The ceiling. '), 'Because r is below 1, going round forever multiplies lap one by 1 / (1 − r): ', el('span', 'mono', '1 / (1 − ' + n2(r, 4) + ') = ' + n2(g.sum_factor_limit.value, 4)), ' ', tv(g.sum_factor_limit, 'num')]);
    } else {
      li([el('b', '', 'No ceiling. '), 'Here r = ' + n2(r, 4) + ' is 1 or more, so each lap is at least as big as the last and the series never settles. We don’t know whether anything like that could happen in practice; it’s just what these settings do.']);
    }
    b.appendChild(ol);
    var tbl = el('table', 'c3-mtable');
    var thead = el('thead'); var hr = el('tr');
    ['Tally', 'Lap 1', '× G (' + n + ' laps)', '= ' + n + '-lap total', g.converges ? 'Limit' : 'Limit'].forEach(function (h) { hr.appendChild(el('th', '', h)); });
    thead.appendChild(hr); tbl.appendChild(thead);
    var tb = el('tbody');
    var names = { seed_equity: 'Seed equity', debt_created: 'Debt created', revenue_booked_total: 'Revenue booked', revenue_external: 'Revenue funded by outside money', revenue_recycled: 'Revenue funded by recycled cash', market_value_paper: 'Paper market value', cash_created: 'Outside money brought in (not all of it customers)', external_cash: 'Outside money, total', external_end_user: 'Outside money: end customers', external_capital: 'Outside money: lenders and investors (must be repaid or earn a return)', recycled_cash: 'Recycled cash', promises_outstanding: 'Promises (not cash)' };
    var lap1 = res.lap_traces[0].hops[10].running;
    Object.keys(g.closed_form_cumulative).forEach(function (k) {
      var tr = el('tr'), td;
      tr.appendChild(el('td', '', names[k] || k));
      td = el('td', 'n'); td.appendChild(tv(lap1[k])); tr.appendChild(td);
      td = el('td', 'n', '× ' + n2(g.sum_factor_n_laps.value, 4)); tr.appendChild(td);
      td = el('td', 'n'); td.appendChild(tv(g.closed_form_cumulative[k])); tr.appendChild(td);
      td = el('td', 'n'); if (g.limit[k]) td.appendChild(tv(g.limit[k])); else td.textContent = 'no limit'; tr.appendChild(td);
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    var wrap = el('div', 'c3-tablewrap'); wrap.appendChild(tbl); b.appendChild(wrap);
    b.appendChild(el('p', 'c3-deriv', g.derivation));
    b.appendChild(el('p', 'c3-deriv', 'The promises row is a running total of contracts and backstops, not a cash flow. It is shown in the table for completeness and is never summed with the cash rows.'));
  }

  /* ---------- hook / close ---------- */
  function renderCopy() {
    var h = $('#c3-hook'); clear(h);
    var r10 = hops[10].running;
    [ 'Take ', tv(hops[0].values.nvidia_cash), ' of Nvidia’s cash and hand it to one neocloud. We’ll follow it through eleven stops, numbered 0 to 10, until it’s back where it started. Here’s the twist we want you to see: it doesn’t stay one pile of money. Some of it comes home. Some of it is joined by cash from outside. Some of it turns into promises. Some of it turns into paper.'
    ].forEach(function (x) { h.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
    var tk = clear($('#c3-take-p'));
    var ext = r10.external_cash, rec = r10.recycled_cash;
    [ 'Follow ', tv(r10.seed_equity), ' once around and you get ', tv(r10.debt_created), ' of lender money, ', tv(r10.revenue_booked_total), ' of Nvidia revenue (about ', tv(r10.revenue_recycled), ' of it Nvidia’s own cash coming home), and ', tv(r10.promises_outstanding), ' of promises that we have not counted as cash. ',
      tv(r10.claims_count, 'num'), ' claims end up with ', tv(r10.claimants_count, 'num'), ' parties. ',
      'The bull reading: the claims are layered on real assets and real contracts, and layering isn’t double-counting. The bear reading: the claims all get paid from the same future end-user spending, so they’re correlated. We don’t know which reading wins. The next chapter lets you turn the knobs.'
    ].forEach(function (x) { tk.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
  }

  /* ---------- wiring ---------- */
  function renderAll() {
    compute();
    renderCopy(); buildSteps(); buildTallies(); updateTallies(); buildMap(); updateBar();
    $('#c3-steps').querySelectorAll('.c3-step').forEach(function (s, j) { s.classList.toggle('active', j === cur); });
    renderLaps();
  }

  ctx.legend($('#c3-legend-intro'));
  ctx.legend($('#c3-legend-stage'));
  var play = $('#c3-play');
  if (ctx.reducedMotion) { play.disabled = true; play.title = 'Autoplay is off because your system asks for reduced motion. Use Next and Back.'; var hint = $('#c3-playhint'); if (hint) hint.hidden = false; }
  play.addEventListener('click', function () { playing ? stopPlay() : startPlay(); });
  $('#c3-prev').addEventListener('click', function () { stopPlay(); setCur(cur - 1, true); });
  $('#c3-next').addEventListener('click', function () { stopPlay(); setCur(cur + 1, true); });
  function onKey(e) {
    var k = e.key, nav = e.currentTarget === $('#c3-stage') ? ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'] : ['ArrowRight', 'ArrowLeft'];
    if (nav.indexOf(k) < 0 || e.target.tagName === 'INPUT') return;
    e.preventDefault(); stopPlay();
    setCur(cur + (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1), true);
    if (e.currentTarget !== $('#c3-stage')) { var s = $('#c3-steps').children[cur]; if (s) s.focus({ preventScroll: true }); }
  }
  $('#c3-stage').addEventListener('keydown', onKey);
  $('#c3-steps').addEventListener('keydown', onKey);
  root.querySelectorAll('[data-laps]').forEach(function (b) {
    b.addEventListener('click', function () { ctx.set({ laps: b.dataset.laps === 'n' ? nLaps : +b.dataset.laps }); });
  });
  $('#c3-n').addEventListener('input', function (e) { ctx.set({ laps: +e.target.value }); });

  function syncLaps() {
    var L = ctx.state.laps || 1;
    if (L <= 3) lapsMode = String(L); else { lapsMode = 'n'; nLaps = Math.min(50, L); }
  }
  var lastParams = JSON.stringify(ctx.state.params), lastLaps = ctx.state.laps;
  ctx.subscribe(function () {
    var now = JSON.stringify(ctx.state.params);
    if (now !== lastParams) { lastParams = now; lastLaps = ctx.state.laps; syncLaps(); renderAll(); return; }
    if (ctx.state.laps !== lastLaps) { lastLaps = ctx.state.laps; syncLaps(); renderLaps(); }
  });
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt); rt = setTimeout(function () { if (chooseLayout() !== layoutName) buildMap(); observe(); var cw = $('#c3-chart').parentNode.clientWidth; if (cw && Math.abs(Math.max(300, Math.min(560, cw)) - chartW) > 20) renderLaps(); }, 150);
  });
  syncLaps();
  renderAll();
  setCur(0, false);
};
