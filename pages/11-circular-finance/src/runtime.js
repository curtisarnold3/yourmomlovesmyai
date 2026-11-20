/* Episode 11 runtime: builds window.Ctx, shell UI (nav, tallies, footer) and boots chapters. Plain JS, file:// safe. */
(function(){
'use strict';
var M = window.LoopModel;
window.Chapters = window.Chapters || {};

var STATUS = {
  verified:    {label:'Verified',    glyph:'✓', text:'Backed by a primary source such as a filing or a company release.'},
  reported:    {label:'Reported',    glyph:'❝', text:'Reported by credible press or secondary sources. Not checked against a primary filing.'},
  calculated:  {label:'Calculated',  glyph:'ƒ', text:'Our arithmetic from the inputs. Never better than its weakest input. In the toy model many inputs are hypothetical, so a calculated figure there is calculated from hypothetical inputs.'},
  hypothetical:{label:'Hypothetical',glyph:'◇', text:'A scenario assumption, or a number built from one. A what-if, not a fact.'},
  unverified:  {label:'Unverified',  glyph:'⚠', text:"We couldn't confirm this. Treat it with caution."}
};

function el(tag, attrs, kids){
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs){
    if (k === 'text') e.textContent = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
  }
  add(e, kids); return e;
}
function add(e, kids){
  if (kids == null) return e;
  if (!Array.isArray(kids)) kids = [kids];
  kids.forEach(function(c){ if (c == null || c === false) return; e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); });
  return e;
}
var SVGNS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs, kids){
  var e = document.createElementNS(SVGNS, tag);
  if (attrs) for (var k in attrs){
    if (attrs[k] == null) continue;
    if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]);
  }
  add(e, kids); return e;
}

/* ---------- formatting ---------- */
function isn(n){ return typeof n === 'number' && isFinite(n); }
function grp(n, d){ return n.toLocaleString('en-US', {minimumFractionDigits:d, maximumFractionDigits:d}); }
var fmt = {
  usd: function(n, o){ o = o || {}; if (!isn(n)) return '—';
    var d = o.digits != null ? o.digits : (Math.abs(n) >= 1000 || Math.round(n) === n ? 0 : 2);
    var s = grp(Math.abs(n), d); var sign = n < 0 ? '-' : (o.sign && n > 0 ? '+' : '');
    return sign + '$' + s; },
  pct: function(n, o){ o = o || {}; if (!isn(n)) return '—'; var d = o.digits != null ? o.digits : 1;
    return (o.sign && n > 0 ? '+' : '') + grp(n * 100, d) + '%'; },
  x: function(n, o){ o = o || {}; if (!isn(n)) return '—'; return grp(n, o.digits != null ? o.digits : 1) + 'x'; },
  compact: function(n, o){ o = o || {}; if (!isn(n)) return '—'; var v = o.unit === 'b' ? n * 1e9 : n; var a = Math.abs(v), s = v < 0 ? '-' : '';
    var u = a >= 1e12 ? [1e12,'T'] : a >= 1e9 ? [1e9,'B'] : a >= 1e6 ? [1e6,'M'] : a >= 1e3 ? [1e3,'K'] : [1,''];
    var q = a / u[0]; return s + '$' + grp(q, q >= 100 || u[1] === '' && Math.round(q) === q ? 0 : 1) + u[1]; },
  num: function(n, o){ o = o || {}; if (!isn(n)) return '—'; var d = o.digits != null ? o.digits : (Math.round(n) === n ? 0 : 2); return grp(n, d); }
};

/* ---------- data ---------- */
function readData(){
  var out = {}, map = {deals:'deals', entities:'entities', defaults:'loop-defaults', events:'events', history:'history', sources:'sources', 'source-claims':'source-claims', meta:'meta'};
  Object.keys(map).forEach(function(k){
    var n = document.getElementById('data-' + map[k]);
    try { out[k] = n ? JSON.parse(n.textContent) : {}; } catch(e){ out[k] = {}; console.error('Bad JSON for ' + k, e); }
  });
  return out;
}

/* ---------- popover (hover, focus, tap) ---------- */
var pop = null, popOwner = null, popPinned = false, popTime = 0;
function popShow(t, pin){
  if (!pop) return;
  var info = t._info; if (!info) return;
  var s = STATUS[info.status];
  pop.innerHTML = '';
  add(pop, [el('b', {text: s.label + '. '}), s.text]);
  if (info.formula) pop.appendChild(el('span', {'class':'f', text: info.formula}));
  pop.hidden = false; popOwner = t; popPinned = !!pin; popTime = Date.now();
  t.setAttribute('aria-expanded', 'true'); t.setAttribute('aria-describedby', 'popover');
  var r = t.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
  var x = Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 8);
  var y = r.bottom + 8; if (y + ph > window.innerHeight - 8) y = Math.max(8, r.top - ph - 8);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
}
function popHide(){
  if (!pop) return; pop.hidden = true;
  if (popOwner){ popOwner.setAttribute('aria-expanded', 'false'); popOwner.removeAttribute('aria-describedby'); }
  popOwner = null; popPinned = false;
}
function initPopover(){
  pop = document.getElementById('popover');
  var tg = function(e){ return e.target && e.target.closest ? e.target.closest('.tag') : null; };
  document.addEventListener('mouseover', function(e){ var t = tg(e); if (t && !popPinned) popShow(t, false); });
  document.addEventListener('mouseout', function(e){ var t = tg(e); if (t && !popPinned) popHide(); });
  document.addEventListener('focusin', function(e){ var t = tg(e); if (!t) return;
    var touchy = false; try { touchy = window.matchMedia('(pointer:coarse)').matches || window.innerWidth <= 700; } catch(x){}
    popShow(t, touchy); });
  document.addEventListener('focusout', function(e){ var t = tg(e); if (t && !popPinned) popHide(); });
  document.addEventListener('click', function(e){
    var t = tg(e);
    if (t){ if (popOwner === t && popPinned){ if (Date.now() - popTime > 450) popHide(); } else popShow(t, true); e.preventDefault(); e.stopPropagation(); }
    else if (popOwner) popHide();
  }, true);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') popHide();
    var t = tg(e);
    if (t && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); if (popOwner === t && popPinned) popHide(); else popShow(t, true); }
  });
  window.addEventListener('scroll', function(){ if (popOwner && !popPinned && Date.now() - popTime > 700) popHide(); }, {passive:true});
}

/* ---------- Ctx ---------- */
function buildCtx(){
  var data = readData();
  var D = M.defaults();
  var defs = {}; M.paramDefs().forEach(function(d){ defs[d.id] = d; });
  var subs = [];
  var lastHash = null;
  var rm = false;
  try { rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  var ctx = { M: M, data: data, reducedMotion: rm, fmt: fmt, el: el };
  ctx.colors = {external:'--c-external', recycled:'--c-recycled', promise:'--c-promise', debt:'--c-debt', paper:'--c-paper'};
  ctx.colorHex = {external:'#f0a32e', recycled:'#3bc4f2', promise:'#9a7df0', debt:'#ff5a36', paper:'#b9c3dc'};
  ctx.svg = svg;
  ctx.state = { params: M.defaults(), laps: 1, yearT: 0, ui: {} };

  function uiForHash(){
    var u = {}; var s = ctx.state;
    if (s.laps !== 1) u.laps = s.laps;
    if (s.yearT) u.year = s.yearT;
    if (s.ui && s.ui.preset) u.preset = s.ui.preset;
    return u;
  }
  function writeHash(){
    var h = '';
    try {
      var enc = M.encodeState(ctx.state.params, uiForHash());
      h = enc === '1' ? '' : '#' + enc;
    } catch(e){ return; }
    lastHash = h;
    try {
      var base = location.href.split('#')[0];
      history.replaceState(null, '', base + h);
    } catch(e){ /* file:// or sandbox: ignore */ }
  }
  function notify(){
    subs.slice().forEach(function(fn){ try { fn(ctx.state); } catch(e){ console.error('subscriber error', e); } });
  }
  function clampParam(id, v){
    var d = defs[id]; if (!d || !isn(+v)) return null; v = +v;
    return Math.min(d.max, Math.max(d.min, v));
  }
  ctx.set = function(patch){
    patch = patch || {}; var s = ctx.state, np = Object.assign({}, s.params);
    if (patch.preset && M.presetNames().indexOf(patch.preset) >= 0){ np = M.applyPreset(patch.preset); s.ui = Object.assign({}, s.ui, {preset: patch.preset}); }
    Object.keys(patch).forEach(function(k){
      if (k === 'laps'){ var l = Math.round(+patch.laps); if (isn(l)) s.laps = Math.min(200, Math.max(1, l)); }
      else if (k === 'yearT'){ var y = Math.round(+patch.yearT * 2) / 2; if (isn(y)) s.yearT = Math.min(50, Math.max(0, y)); }
      else if (k === 'ui'){ s.ui = Object.assign({}, s.ui, patch.ui); }
      else if (k === 'preset'){ /* handled */ }
      else if (defs[k]){ var c = clampParam(k, patch[k]); if (c != null) np[k] = c; }
    });
    var v = M.validateParams(np);
    if (v.ok) s.params = np; else console.warn('Ctx.set rejected params', v.errors);
    writeHash(); notify(); return s;
  };
  ctx.reset = function(){ var s = ctx.state; s.params = M.defaults(); s.laps = 1; s.yearT = 0; s.ui = {}; writeHash(); notify(); return s; };
  ctx.subscribe = function(fn){ subs.push(fn); return function(){ var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; };
  ctx.shareUrl = function(){
    var base = location.href.split('#')[0], enc;
    try { enc = M.encodeState(ctx.state.params, uiForHash()); } catch(e){ enc = '1'; }
    return enc === '1' ? base : base + '#' + enc;
  };
  ctx.copyShareUrl = function(){
    var url = ctx.shareUrl();
    function fallback(){
      var ta = el('textarea', {'aria-hidden':'true', style:'position:fixed;left:-999px;top:0'}); ta.value = url; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch(e){} document.body.removeChild(ta); return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(url).then(function(){ return true; }, function(){ return fallback(); });
    }
    return Promise.resolve(fallback());
  };

  /* initial state from hash */
  function applyHash(){
    var h = location.hash;
    if (!h || h.length < 2 || h === lastHash) return false;
    var r = M.decodeState(h);
    if (!r.ok) return false;
    var s = ctx.state; s.params = r.params; var u = r.ui || {};
    s.laps = u.laps || 1; s.yearT = u.year || 0; s.ui = u.preset ? {preset: u.preset} : {};
    lastHash = h; return true;
  }
  applyHash();
  window.addEventListener('hashchange', function(){ if (applyHash()) notify(); });

  /* tags */
  ctx.tag = function(status, opts){
    opts = opts || {}; if (!STATUS[status]) status = 'unverified'; var s = STATUS[status];
    var t = el('span', {'class':'tag t-' + status, tabindex:'0', role:'button', 'aria-expanded':'false',
      'aria-label': s.label + ': ' + s.text + (opts.formula ? ' ' + opts.formula : '')}, [
      el('span', {'class':'g', 'aria-hidden':'true', 'data-g':s.glyph}), el('span', {'class':'lbl', text:s.label})]);
    t._info = {status: status, formula: opts.formula || ''};
    return t;
  };
  ctx.tagged = function(node, tv, kind, o){
    node.textContent = ''; node.classList.add('tv');
    if (tv == null || typeof tv !== 'object' || !('status' in tv)){ node.appendChild(el('span', {'class':'val', text: tv == null ? '—' : String(tv)})); return node; }
    var f = typeof kind === 'function' ? kind : (fmt[kind] || (tv.fmt && fmt[tv.fmt]) || fmt.num), v = tv.value, txt;
    if (typeof v === 'boolean') txt = v ? 'yes' : 'no';
    else if (kind === 'toyusd') txt = (tv.status === 'hypothetical' || tv.status === 'calculated' ? '~' : '') + fmt.usd(isn(v) ? Math.round(v) : v, {digits:0});
    else txt = f(v, o);
    node.appendChild(el('span', {'class':'val', text: txt}));
    node.appendChild(ctx.tag(tv.status, {formula: tv.formula_text}));
    if (tv.formula_text) node.setAttribute('title', tv.formula_text);
    node.setAttribute('data-status', tv.status);
    return node;
  };

  ctx.colorHex.outside = '#8fa3c7';
  var legendUid = 0;
  /* opts.extended adds the two kinds of money that only the deal chapters use: a mixed round and an outside-loop stake. */
  ctx.legend = function(host, opts){
    opts = opts || {};
    var items = [
      ['external', 'External cash', 'from customers, lenders and outside investors'],
      ['recycled', 'Recycled cash', 'comes back to its source'],
      ['promise', 'Promise', 'contract, not cash; never added to cash totals'],
      ['debt', 'Debt', 'must be repaid'],
      ['paper', 'Paper value', 'market value, not cash']
    ];
    if (opts.extended){
      items.splice(3, 0,
        ['mixed', 'Mixed round', 'vendor money and outside money in one line; shown as a split and never added to the cash totals'],
        ['outside', 'Outside-loop stake', 'the chipmaker’s cash into a company outside the loop; not external, not recycled']);
    }
    var ul = el('ul', {'class':'legend', 'aria-label':'Kinds of money'});
    items.forEach(function(it){
      var sw = svg('svg', {'class':'sw', viewBox:'0 0 22 14', 'aria-hidden':'true'});
      var c = ctx.colorHex[it[0]];
      if (it[0] === 'promise') sw.appendChild(svg('rect', {x:1,y:1,width:20,height:12,rx:3,fill:c,'fill-opacity':.35,stroke:c,'stroke-dasharray':'3 2','stroke-width':1.5}));
      else if (it[0] === 'paper') sw.appendChild(svg('rect', {x:1,y:1,width:20,height:12,rx:3,fill:'url(#hatch)',stroke:c,'stroke-width':1}));
      else if (it[0] === 'mixed'){
        var gid = 'lgmix' + (++legendUid);
        sw.appendChild(svg('defs', null, [svg('linearGradient', {id:gid, x1:0, y1:0, x2:1, y2:0}, [
          svg('stop', {offset:'0', 'stop-color':ctx.colorHex.recycled}), svg('stop', {offset:'.5', 'stop-color':ctx.colorHex.recycled}),
          svg('stop', {offset:'.5', 'stop-color':ctx.colorHex.external}), svg('stop', {offset:'1', 'stop-color':ctx.colorHex.external})])]));
        sw.appendChild(svg('rect', {x:0,y:0,width:22,height:14,rx:3,fill:'url(#' + gid + ')'}));
      }
      else if (it[0] === 'outside') sw.appendChild(svg('rect', {x:1,y:1,width:20,height:12,rx:3,fill:'none',stroke:c,'stroke-width':2,'stroke-dasharray':'1 3','stroke-linecap':'round'}));
      else sw.appendChild(svg('rect', {x:0,y:0,width:22,height:14,rx:3,fill:c}));
      ul.appendChild(el('li', null, [sw, el('span', null, [it[1] + ' ', el('small', {text:'(' + it[2] + ')'})])]));
    });
    host.appendChild(ul); return ul;
  };

  /* ---------- reader-facing text helpers ---------- */
  /* The only free-text note a reader ever sees about a deal, fact, event or parameter is its reader_note. Raw builder notes are never shown. */
  ctx.readerNote = function(o){
    var n = o && typeof o.reader_note === 'string' ? o.reader_note.trim() : '';
    return n || null;
  };
  /* Defensive filter for other free-text fields (structure, what_changed, labels): returns null when the text reads like a builder or research to-do. */
  var BUILDER = /re-?fetch|this pass|merge note|do not chart|fetch (the |sec|sept|original)|upgrade to verified|from memory|not confirmed in (this|the) (pass|retrieved)|retrieved (filing|text)|filing (text|itself)|search summar|not in the research|the research|our research|research (left|gives|has)|to-do|todo|\bwe (could|couldn)'?t (not )?(match|confirm|find)|could not match|before publishing|I retrieved|we retrieved/i;
  ctx.clean = function(t){
    if (typeof t !== 'string') return null; t = t.trim(); if (!t) return null;
    if (!BUILDER.test(t)) return t;
    /* drop only the offending sentences or clauses, keep the rest */
    var keep = t.split(/(?<=[.;])\s+/).filter(function(x){ return !BUILDER.test(x); });
    if (keep.length === 0) return null;
    var out = keep.join(' ').replace(/[,;:]\s*$/, '').trim();
    return out && !/[.!?)]$/.test(out) ? out + '.' : out;
  };
  /* Plain definitions for jargon that can surface in data text. Each applies once per call, appended in brackets. */
  var TERMS = [
    [/\bSOFR\b/, 'SOFR is a benchmark short-term interest rate; a loan priced at “SOFR+2%” pays that rate plus two percentage points.'],
    [/\bmezz(anine)?\b/i, 'Mezzanine debt ranks below senior loans and above equity, so it is paid after the senior lenders and before shareholders.'],
    [/\breflexive\b/i, 'Reflexive means feeding back on itself: a price move changes the very thing that set the price.'],
    [/\bconverts?\b/i, 'Converts are bonds that can turn into shares.'],
    [/\bDDTL\b/, 'A DDTL is a delayed-draw term loan: the lender commits up front and the borrower takes the money in pieces.'],
    [/\bCDS\b/, 'A CDS (credit default swap) is insurance against a borrower defaulting; a higher price means the market sees more risk.'],
    [/\b\d+(\.\d+)?\s?bps?\b/i, 'A bp (basis point) is a hundredth of a percentage point.']
  ];
  ctx.terms = function(t){
    if (typeof t !== 'string') return t;
    var defs = []; TERMS.forEach(function(x){ if (x[0].test(t)) defs.push(x[1]); });
    return defs.length ? t + ' [' + defs.join(' ') + ']' : t;
  };
  /* Splits a deal's headline into cash that moved, cash that is conditional or not yet shown as moved, and promises. Reads A's explicit
     fields if present (cash_usd_b / conditional_usd_b, or money_split items), otherwise infers from the actual range. */
  ctx.moneyParts = function(d){
    var h = typeof d.headline_usd_b === 'number' ? d.headline_usd_b : null, k = d.money_kind, o = {kind:k, moved:0, conditional:0, unclear:0, promise:0, explicit:false};
    if (k === 'promise'){ o.promise = h || 0; return o; }
    if (k !== 'external' && k !== 'recycled') return o;
    if (typeof d.cash_usd_b === 'number' || typeof d.conditional_usd_b === 'number'){
      o.moved = d.cash_usd_b || 0; o.conditional = d.conditional_usd_b || 0; o.explicit = true; return o;
    }
    if (h == null) return o;
    var lo = d.actual_usd_b_low, hi = d.actual_usd_b_high;
    if (d.contingent){ o.conditional = h; return o; }
    if (typeof lo === 'number' && lo < h){ o.moved = lo; o.unclear = h - lo; }
    else if (typeof lo === 'number' || typeof hi === 'number'){ o.moved = h; }
    else o.unclear = h;
    return o;
  };

  ctx.onVisible = function(node, fn){
    if (!('IntersectionObserver' in window)){ fn(); return; }
    var done = false, io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting && !done){ done = true; io.disconnect(); try { fn(); } catch(err){ console.error(err); } } });
    }, {threshold: .15});
    io.observe(node);
  };
  var srcById = null, srcLabels = null;
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function niceDate(d){ var m = /^(\d{4})-(\d{2})/.exec(d || ''); return m ? MONTHS[+m[2] - 1] + ' ' + m[1] : (d || ''); }
  /* Headlines the page does not want to carry as unattributed labels. They are never shown as a source title. */
  var LOADED = /enron|bubble|gymnastics|lost its ceo|collapse|crash|alarm|circular|web with|scam|ponzi|doom|meltdown|warns?\b/i;
  function buildLabels(){
    srcById = {}; srcLabels = {}; var seen = {};
    ((data.sources && data.sources.sources) || []).forEach(function(s){ srcById[s.id] = s; });
    Object.keys(srcById).forEach(function(id){
      var s = srcById[id], neutral = s.display_title || s.neutral_title || s.reader_title || s.short_title, t;
      if (neutral) t = neutral;
      else if (s.title && !s.title_is_derived && !LOADED.test(s.title)) t = (s.publisher ? s.publisher + ': ' : '') + s.title.charAt(0).toUpperCase() + s.title.slice(1);
      else t = (s.publisher || 'Source') + (s.date ? ', ' + niceDate(s.date) : '') + (s.type === 'primary' ? ' (primary source)' : '');
      seen[t] = (seen[t] || 0) + 1; srcLabels[id] = {t: t, n: seen[t]};
    });
    Object.keys(srcLabels).forEach(function(id){ var l = srcLabels[id]; if (seen[l.t] > 1) l.t += ' (' + l.n + ' of ' + seen[l.t] + ')'; });
  }
  ctx.sourceLabel = function(id){ if (!srcById) buildLabels(); return srcLabels[id] ? srcLabels[id].t : 'Source'; };
  ctx.sourceLink = function(id){
    if (!srcById) buildLabels();
    var s = srcById[id];
    if (!s) return el('span', {text: 'Source'});
    return el('a', {href:s.url, target:'_blank', rel:'noopener', text: ctx.sourceLabel(id),
      title: (s.type === 'primary' ? 'Primary source' : 'Press') + (s.date ? ', ' + s.date : '')});
  };
  ctx.siteLink = function(path, text){ return el('a', {href:path, target:'_top', text: text || path}); };
  ctx.cumulative = function(){ return M.runLoop(ctx.state.params, ctx.state.laps).cumulative; };
  return ctx;
}

/* ---------- shell UI ---------- */
var TALLIES = [
  ['debt_created','Debt created','toyusd','Money lenders put in on top of the seed cash.'],
  ['revenue_booked_total','Revenue booked','toyusd','Nvidia sales that follow from the seed cash and the debt.'],
  ['revenue_counted_times','Revenue booked per $1 of seed cash','x','Each seed dollar shows up as this many dollars of Nvidia revenue. Lender money funds the part above 1x. Not literal double counting.'],
  ['external_end_user','Outside money: customers','toyusd','Cash paid by end customers of the AI lab.'],
  ['external_capital','Outside money: lenders and investors (must be repaid or earn a return)','toyusd','Cash from lenders and outside investors. It is outside the loop but it is not demand: it has to be repaid or earn a return.'],
  ['recycled_cash','Recycled cash','toyusd','Cash that started with a loop member and comes back to it.'],
  ['promises_outstanding','Promises (not cash)','toyusd','Contracts, backstops and guarantees. Never added to cash.'],
  ['claimants_count','Claimants','num','Distinct parties with a claim on the same cluster of chips.']
];
function initTallies(ctx){
  var grid = document.getElementById('talliesGrid'), sum = document.getElementById('talliesSum'),
      root = document.getElementById('tallies'), tog = document.getElementById('talliesToggle');
  var cells = {};
  TALLIES.forEach(function(t){
    var v = el('div', {'class':'v'}), c = el('div', {'class':'tally', 'data-k':t[0], role:'listitem'}, [el('div', {'class':'k', text:t[1], title:t[1] + '. ' + t[3]}), v]);
    grid.appendChild(c); cells[t[0]] = v;
  });
  var sumC = el('span'), sumL = el('span'), sumR = el('span'); add(sum, [el('span', {text:'Customers '}), sumC, el('span', {text:' · Lenders and investors '}), sumL, el('span', {text:' · Recycled '}), sumR]);
  var note = document.getElementById('talliesNote');
  function render(){
    var cum; try { cum = M.runLoop(ctx.state.params, ctx.state.laps).cumulative; } catch(e){ console.error(e); return; }
    TALLIES.forEach(function(t){ ctx.tagged(cells[t[0]], cum[t[0]], t[2]); });
    function r0(tv){ return (tv.status === 'hypothetical' || tv.status === 'calculated' ? '~' : '') + fmt.usd(Math.round(tv.value), {digits:0}); }
    sumC.textContent = r0(cum.external_end_user); sumL.textContent = r0(cum.external_capital); sumR.textContent = r0(cum.recycled_cash);
    note.textContent = 'Toy model, per ' + fmt.usd(ctx.state.params.seed_usd) + ' of seed cash, cumulative over ' + ctx.state.laps + (ctx.state.laps === 1 ? ' lap' : ' laps') +
      '. ~ marks a rounded hypothetical value. Promises are never counted as cash. Tap a badge to see how far to trust a number.';
    document.getElementById('talliesHead').textContent = ctx.state.laps + (ctx.state.laps === 1 ? ' lap' : ' laps');
    var tz = document.getElementById('heroTeaser');
    if (tz){ tz.textContent = ''; try { var h = M.leverage(ctx.state.params).headline; var vv = function(x){ return x && typeof x === 'object' ? x.value : x; }; var rd = function(n){ return '~' + fmt.usd(Math.round(vv(n)), {digits:0}); };
      tz.appendChild(document.createTextNode(fmt.usd(Math.round(vv(h.seed)), {digits:0}) + ' of seed cash \u2192 ' + rd(h.debt) + ' of lender debt \u2192 ' + rd(h.revenue) + ' of Nvidia revenue (toy numbers, not a forecast). ')); tz.appendChild(ctx.tag('hypothetical', {formula:'Toy-model run per $100 of seed. Nvidia’s share of the bill is an assumption, so the revenue figure is hypothetical.'})); } catch(e){} }
  }
  ctx.subscribe(render); render();
  tog.addEventListener('click', function(){
    var o = root.getAttribute('data-open') !== 'true'; root.setAttribute('data-open', String(o)); tog.setAttribute('aria-expanded', String(o));
  });
  document.getElementById('talliesReset').addEventListener('click', function(){ ctx.reset(); });
  root.addEventListener('focusin', function(){ try { var r = root.getBoundingClientRect(); if (r.top < 0 || r.bottom > window.innerHeight) root.scrollIntoView({block:'nearest'}); } catch(e){} });
  function pad(){ document.documentElement.style.setProperty('--tally-h', root.offsetHeight + 'px'); }
  pad(); window.addEventListener('resize', pad);
}

function heroArt(ctx){
  var host = document.getElementById('heroArt'); if (!host) return;
  var s = svg('svg', {viewBox:'0 0 480 400', role:'img', 'aria-label':'A ring of five boxes (chipmaker, neocloud, lenders, lab, investors) with arrows running clockwise and a dollar chip travelling around it.'});
  var cx = 240, cy = 200, R = 140;
  var names = ['Chipmaker','Neocloud','Lenders','AI lab','Investors'], cols = [ctx.colorHex.recycled, ctx.colorHex.external, ctx.colorHex.debt, ctx.colorHex.promise, ctx.colorHex.paper];
  var pts = names.map(function(n, i){ var a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  var d = ''; pts.forEach(function(p, i){ d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }); d += 'Z';
  s.appendChild(svg('path', {d:d, fill:'none', stroke:'rgba(160,190,255,.35)', 'stroke-width':2, 'stroke-dasharray':'6 6'}));
  names.forEach(function(n, i){
    var p = pts[i];
    s.appendChild(svg('rect', {x:p[0]-48, y:p[1]-18, width:96, height:36, rx:10, fill:'rgba(10,18,38,.9)', stroke:cols[i], 'stroke-width':2, 'stroke-dasharray': i === 3 ? '5 3' : null}));
    s.appendChild(svg('text', {x:p[0], y:p[1]+5, 'text-anchor':'middle', fill:'#eef2fb', 'font-size':14, 'font-family':'sans-serif', text:n}));
  });
  s.appendChild(svg('text', {x:cx, y:cy-4, 'text-anchor':'middle', fill:'#f0a32e', 'font-size':34, 'font-weight':700, 'font-family':'sans-serif', text:'$100'}));
  s.appendChild(svg('text', {x:cx, y:cy+20, 'text-anchor':'middle', fill:'#8590ad', 'font-size':13, 'font-family':'sans-serif', text:'goes around'}));
  var dot = svg('g', null, [svg('circle', {r:11, fill:'#f0a32e'}), svg('text', {y:4, 'text-anchor':'middle', 'font-size':12, 'font-weight':700, fill:'#2a1a00', 'font-family':'sans-serif', text:'$'})]);
  if (!ctx.reducedMotion){
    dot.appendChild(svg('animateMotion', {dur:'12s', repeatCount:'indefinite', path:d}));
  } else dot.setAttribute('transform', 'translate(' + pts[0][0] + ',' + pts[0][1] + ')');
  s.appendChild(dot); host.appendChild(s);
}

function footer(ctx){
  var d = ctx.data, list = document.getElementById('srcList'), srcs = (d.sources && d.sources.sources) || [];
  srcs.forEach(function(s){
    list.appendChild(el('li', null, [ctx.sourceLink(s.id)]));
  });
  document.getElementById('srcSummary').textContent = 'Sources (' + srcs.length + ')';
  var asOf = (d.sources && d.sources.as_of) || (d.defaults && d.defaults.as_of) || '';
  var toy = 'Illustrative toy model.';
  try { toy = M.runLoop(M.defaults(), 1).toy_model_notice || toy; } catch(e){}
  var n = document.getElementById('footNotes');
  add(n, [
    el('p', null, [el('strong', {text:'Not investment advice. '}), 'This is education and arithmetic, not a recommendation to buy, sell or hold anything. We don’t know your situation and we don’t make forecasts.']),
    el('p', null, [el('strong', {text:'A fairness note. '}), 'Nothing here implies wrongdoing. Layered claims on one asset are an ordinary capital structure, and they are not double pledging. The point is correlation: every claim is ultimately paid from the same future AI end-user spending. Bulls and bears can both read the same numbers.']),
    el('p', null, [el('strong', {text:'Toy model. '}), toy + ' All figures are per $100 of seed cash and tagged by how much we trust them.']),
    el('p', null, [el('strong', {text:'Data as of '}), asOf || 'the build date', '. Sources are linked below; press-only items are tagged reported at best.'])
  ]);
}

function chapterNav(){
  var nav = document.getElementById('chapnav'); nav.textContent = '';
  var secs = [].slice.call(document.querySelectorAll('section.chapter'));
  secs.forEach(function(s){
    var h = s.querySelector('h2'), n = s.getAttribute('data-chapter') || '';
    var label = h ? h.textContent.trim() : 'Chapter ' + n; if (label.length > 20) label = label.slice(0, 19).trim() + '…';
    var num = n === '11' ? 'End' : String(parseInt(n, 10));
    var a = el('a', {href:'#' + s.id, 'data-target':s.id, title: h ? h.textContent.trim() : '', text: num + ' ' + label});
    nav.appendChild(a);
  });
  nav.appendChild(el('a', {href:'#sources', 'data-target':'sources', text:'Sources'}));
  nav.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a'); if (!a) return;
    var t = document.getElementById(a.getAttribute('data-target')); if (!t) return;
    e.preventDefault(); t.scrollIntoView({behavior: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
  });
}
function scrollSpy(){
  var bar = document.getElementById('progress'), tick = false;
  function upd(){
    tick = false;
    var h = document.documentElement, max = h.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + '%';
    var cur = null; document.querySelectorAll('#chapnav a').forEach(function(a){
      var t = document.getElementById(a.getAttribute('data-target')); a.removeAttribute('aria-current');
      if (t && t.getBoundingClientRect().top < window.innerHeight * .4) cur = a;
    });
    if (cur){ cur.setAttribute('aria-current', 'true'); try { var nv = document.getElementById('chapnav'); if (nv.scrollWidth > nv.clientWidth) nv.scrollLeft = cur.offsetLeft - nv.clientWidth / 3; } catch(e){} }
  }
  window.addEventListener('scroll', function(){ if (!tick){ tick = true; requestAnimationFrame(upd); } }, {passive:true});
  window.addEventListener('resize', upd); upd();
}

function boot(){
  if (!M){ document.body.insertBefore(el('div', {'class':'chapter-error', text:'Model failed to load.'}), document.body.firstChild); return; }
  var ctx = window.Ctx = buildCtx();
  initPopover();
  try { heroArt(ctx); } catch(e){ console.error(e); }
  try { footer(ctx); } catch(e){ console.error(e); }
  try { initTallies(ctx); } catch(e){ console.error(e); }
  Object.keys(window.Chapters).sort().forEach(function(key){
    var root = document.getElementById('ch' + key);
    if (!root){ console.warn('No section for chapter ' + key); return; }
    try { window.Chapters[key](root, ctx); }
    catch(e){
      console.error('Chapter ' + key + ' failed', e);
      root.appendChild(el('div', {'class':'chapter-error', role:'note', text:'Chapter ' + key + ' hit a snag and could not draw its figure. The rest of the page still works. (' + (e && e.message || e) + ')'}));
    }
  });
  chapterNav(); scrollSpy();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
