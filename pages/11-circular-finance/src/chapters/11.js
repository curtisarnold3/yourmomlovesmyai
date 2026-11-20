Chapters["11"] = function(root, ctx){
  var M = ctx.M, fmt = ctx.fmt, svg = ctx.svg, $ = function(id){ return root.querySelector('#ch11-' + id); };
  var DEFS = {}; M.paramDefs().forEach(function(d){ DEFS[d.id] = d; });
  var target = null, last = null; // the what-if share is set from the data on first render (top of the one-at-a-time range), never typed

  /* The headline number is the share of one lap's cash that end customers pay (A's end_user_share). If a model build lacks it,
     it is computed from runLoop's external_end_user and cash_moved. */
  function share(p){
    var c = M.runLoop(p, 1).cumulative;
    return c.external_end_user.value / c.cash_moved.value;
  }
  function tv(v, f){ return {value: v, status: 'hypothetical', formula_text: f}; }
  function headline(base, r){
    var h = r.headline, eu = h.end_user_share;
    if (!eu || !eu.base){
      var b = share(base), lo = b, hi = b;
      (r.tornado || []).forEach(function(t){ [t.end_user_share_at_min, t.end_user_share_at_max].forEach(function(x){ if (typeof x === 'number'){ lo = Math.min(lo, x); hi = Math.max(hi, x); } }); });
      eu = {base: tv(b, 'end-user cash / cash moved'), low: tv(lo, 'min one-at-a-time'), high: tv(hi, 'max one-at-a-time'), joint_low: tv(lo, 'min one-at-a-time'), joint_high: tv(hi, 'max one-at-a-time')};
    }
    return {eu: eu, ext: h.external_share, rec: h.recycled_share && h.recycled_share.base ? h.recycled_share.base.value : 1 - h.external_share.base.value};
  }
  function swing(t){
    if (typeof t.end_user_share_at_min === 'number' && typeof t.end_user_share_at_max === 'number') return Math.abs(t.end_user_share_at_max - t.end_user_share_at_min);
    return t.swing || 0;
  }
  function fmtParam(id, v){
    var u = DEFS[id].unit;
    if (u === 'fraction' || u === 'per year') return fmt.pct(v, {digits: 1});
    if (u === 'x') return fmt.x(v, {digits: 2});
    if (u === 'years') return fmt.num(v, {digits: 1}) + ' yrs';
    if (u === 'USD') return fmt.usd(v);
    return fmt.num(v);
  }
  function withP(base, patch){ return Object.assign({}, base, patch); }
  function bisect(f, lo, hi){ // smallest x between lo and hi with f(x) >= target (f rises toward hi)
    for (var i = 0; i < 40; i++){ var mid = (lo + hi) / 2; if (f(mid) >= target) hi = mid; else lo = mid; }
    return hi;
  }
  function favorable(base, id){
    var d = DEFS[id], lo = share(withP(base, (function(o){ o[id] = d.min; return o; })({}))), hi = share(withP(base, (function(o){ o[id] = d.max; return o; })({})));
    return hi >= lo ? d.max : d.min;
  }
  function solveOne(base, id){
    var cur = base[id], bound = favorable(base, id), cs = share(base);
    if (cs >= target) return {id: id, status: 'there', value: cur};
    var f = function(v){ var o = {}; o[id] = v; return share(withP(base, o)); };
    if (f(bound) < target) return {id: id, status: 'no', bound: bound, reach: f(bound)};
    return {id: id, status: 'ok', value: bisect(f, cur, bound)};
  }
  function solveTwo(base, ids){
    var b = ids.map(function(id){ return favorable(base, id); });
    var f = function(t){ var o = {}; ids.forEach(function(id, i){ o[id] = base[id] + t * (b[i] - base[id]); }); return share(withP(base, o)); };
    if (share(base) >= target) return {status: 'there'};
    if (f(1) < target) return {status: 'no', reach: f(1), bounds: b};
    var t = bisect(f, 0, 1), vals = {}; ids.forEach(function(id, i){ vals[id] = base[id] + t * (b[i] - base[id]); });
    return {status: 'ok', vals: vals, t: t};
  }

  function drawBar(H, base){
    var s = $('bar'), ext0 = H.ext.base.value; while (s.lastChild && s.lastChild.nodeName !== 'title') s.removeChild(s.lastChild);
    var x0 = 34, w = 532, X = function(v){ return x0 + Math.max(0, Math.min(1, v)) * w; };
    var eu = H.eu, bs = eu.base.value, ext = ext0, lend = Math.max(0, ext - bs), rec = Math.max(0, 1 - ext);
    s.appendChild(svg('rect', {x:x0, y:26, width:w * bs, height:38, fill:ctx.colorHex.external}));
    s.appendChild(svg('rect', {x:x0 + w * bs, y:26, width:w * lend, height:38, fill:ctx.colorHex.debt}));
    s.appendChild(svg('rect', {x:x0 + w * (bs + lend), y:26, width:w * rec, height:38, fill:ctx.colorHex.recycled}));
    if (lend > .25) s.appendChild(svg('text', {x:x0 + w * (bs + lend / 2), y:51, 'text-anchor':'middle', fill:'#1d0700', 'font-size':20, 'font-weight':700, 'font-family':'sans-serif', text:'Lenders ' + fmt.pct(lend, {digits:0})}));
    if (rec > .22) s.appendChild(svg('text', {x:x0 + w * (bs + lend + rec / 2), y:51, 'text-anchor':'middle', fill:'#06222f', 'font-size':20, 'font-weight':700, 'font-family':'sans-serif', text:'Recycled ' + fmt.pct(rec, {digits:0})}));
    s.appendChild(svg('text', {x:x0 + w * bs / 2, y:51, 'text-anchor':'middle', fill:'#2a1a00', 'font-size':bs > .22 ? 20 : 15, 'font-weight':700, 'font-family':'sans-serif', text:(bs > .22 ? 'End customers ' : '') + fmt.pct(bs, {digits:0})}));
    // equal-weight bracket: all outside money (end customers plus lenders and investors)
    s.appendChild(svg('path', {d:'M' + X(0) + ' 70 V76 H' + X(ext) + ' V70', fill:'none', stroke:'#b9c3dc', 'stroke-width':2}));
    s.appendChild(svg('text', {'class':'bar-t', x:Math.max(x0 + 10, X(ext) / 2 + x0 / 2), y:98, 'text-anchor':'middle', text:'All outside money ' + fmt.pct(ext, {digits:0}) + ' (customers plus lenders and investors)'}));
    var jl = eu.joint_low.value, jh = eu.joint_high.value, lo = eu.low.value, hi = eu.high.value;
    s.appendChild(svg('text', {'class':'bar-t', x:x0, y:18, text:'0%'}));
    s.appendChild(svg('text', {'class':'bar-t', x:x0 + w, y:18, 'text-anchor':'end', text:'100%'}));
    var G = svg('g', {transform:'translate(0,40)'}); s.appendChild(G); var sAll = s; s = G;
    // one-at-a-time range of the end-customer share (solid)
    s.appendChild(svg('rect', {x:X(lo), y:100, width:Math.max(2, X(hi) - X(lo)), height:8, rx:2, fill:'#eef2fb'}));
    s.appendChild(svg('text', {'class':'bar-v', x:X(lo), y:92, 'text-anchor':'middle', text:fmt.pct(lo, {digits:0})}));
    s.appendChild(svg('text', {'class':'bar-v', x:X(hi), y:92, 'text-anchor':'middle', text:fmt.pct(hi, {digits:0})}));
    s.appendChild(svg('text', {'class':'bar-t', x:Math.max(x0 + 50, Math.min(x0 + w - 50, X(bs))), y:132, 'text-anchor':'middle', text:'▲ base ' + fmt.pct(bs, {digits:0})}));
    var right = X(hi) + 34 + 250 < x0 + w;
    s.appendChild(svg('text', {'class':'bar-t', x:right ? X(hi) + 34 : X(lo) - 34, y:110, 'text-anchor':right ? 'start' : 'end', text:'one assumption at a time'}));
    // extreme whisker (dashed)
    s.appendChild(svg('line', {x1:X(jl), x2:X(jh), y1:154, y2:154, stroke:'#b9c3dc', 'stroke-width':2, 'stroke-dasharray':'5 4'}));
    [jl, jh].forEach(function(v){ s.appendChild(svg('line', {x1:X(v), x2:X(v), y1:151, y2:165, stroke:'#b9c3dc', 'stroke-width':2})); });
    s.appendChild(svg('text', {'class':'bar-t', x:X(jl), y:188, 'text-anchor':'middle', text:fmt.pct(jl, {digits:0})}));
    s.appendChild(svg('text', {'class':'bar-t', x:X(jh), y:188, 'text-anchor':'middle', text:fmt.pct(jh, {digits:0})}));
    s.appendChild(svg('text', {'class':'bar-t', x:x0 + w / 2, y:210, 'text-anchor':'middle', text:'every assumption pushed to the same extreme'}));
    // what-if marker (a place to explore, not a goal)
    s.appendChild(svg('line', {x1:X(target), x2:X(target), y1:-14, y2:172, stroke:'#ffd37a', 'stroke-width':2, 'stroke-dasharray':'2 3'}));
    s.appendChild(svg('text', {x:Math.max(x0 + 60, Math.min(x0 + w - 60, X(target))), y:242, 'text-anchor':'middle', fill:'#ffd37a', 'font-size':20, 'font-family':'sans-serif', text:'what-if ' + fmt.pct(target, {digits:0})}));
    s = sAll;
  }

  function el(tag, text, cls){ var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
  function list(ul, items){ ul.textContent = ''; items.forEach(function(i){ ul.appendChild(i); }); }
  function swatch(color, dash){
    var sw = svg('svg', {'class':'sw', viewBox:'0 0 22 14', 'aria-hidden':'true'});
    sw.appendChild(svg('rect', {x:0, y:0, width:22, height:14, rx:3, fill:color}));
    return sw;
  }

  // lab outside-revenue reference point, read from the parameter's own rationale
  (function(){
    var p = ((ctx.data.defaults && ctx.data.defaults.params) || []).filter(function(x){ return x.id === 'lab_outside_revenue_share'; })[0];
    var m = p && p.rationale && p.rationale.match(/covers about (\d+)%/);
    var n = $('cautious');
    n.textContent = 'Caveat: our default is a toy assumption with no source behind it. It has the AI lab covering ' + fmt.pct(ctx.state.params.lab_outside_revenue_share, {digits: 0}) + ' of its payments from end-user revenue, a deliberately cautious choice, not a measurement' + (m ? ' (the reported 2025 figure is nearer ' + m[1] + '%)' : '') + '. Move that knob and the headline moves with it.';
  })();

  function render(){
    var base = ctx.state.params, r = M.externalShare(base), H = headline(base, r), eu = H.eu;
    if (target == null) { target = Math.min(.7, Math.max(.05, Math.round(eu.high.value * 100) / 100)); $('target').value = Math.round(target * 100); }
    var lend = Math.max(0, H.ext.base.value - eu.base.value);
    $('tout').textContent = fmt.pct(target, {digits:0});
    // key
    var key = $('key'); key.textContent = '';
    [[ctx.colorHex.external, 'Paid by end customers', eu.base.value, 'paid for using AI: end-user demand'],
     [ctx.colorHex.debt, 'Lenders and investors', lend, 'outside money, but it must be repaid or earn a return, so it is not end-user demand'],
     [ctx.colorHex.recycled, 'Recycled', H.rec, 'started with a loop member and came back to it'],
     ['#b9c3dc', 'All outside money', H.ext.base.value, 'end customers plus lenders and investors']].forEach(function(k){
      var li = el('li'); li.appendChild(swatch(k[0]));
      var sp = el('span'); sp.appendChild(el('b', k[1] + ' ~' + fmt.pct(k[2], {digits:0}) + ' ')); sp.appendChild(el('small', '(' + k[3] + ')')); li.appendChild(sp); key.appendChild(li);
    });
    // sentence
    var sen = $('sentence'); sen.textContent = '';
    var sp = el('span'); ctx.tagged(sp, eu.base, 'pct');
    sen.appendChild(document.createTextNode('In our toy model, of the cash that moves in one lap, about '));
    sen.appendChild(sp);
    sen.appendChild(document.createTextNode(' (a toy assumption, not a finding) is paid by end customers, about ' + fmt.pct(lend, {digits:0}) + ' comes from lenders and investors, and about ' + fmt.pct(H.rec, {digits:0}) + ' is recycled. Lenders’ money counts as outside money, but it is not end-user demand. Promises are not counted as cash.'));
    var rg = $('range'); rg.textContent = '';
    [['Low', eu.low], ['Base', eu.base], ['High', eu.high]].forEach(function(p, i){ var b = el('b', p[0] + ' '); var s = el('span'); ctx.tagged(s, p[1], 'pct'); rg.appendChild(b); rg.appendChild(s); if (i < 2) rg.appendChild(document.createTextNode('  ·  ')); });
    rg.appendChild(document.createElement('br'));
    rg.appendChild(document.createTextNode('Changing one assumption at a time across its full range puts the end-customer share between ' + fmt.pct(eu.low.value, {digits:0}) + ' and ' + fmt.pct(eu.high.value, {digits:0}) + '. Pushing every assumption to the same extreme gives ' + fmt.pct(eu.joint_low.value, {digits:0}) + ' to ' + fmt.pct(eu.joint_high.value, {digits:0}) + ', which is a stress bracket, not a forecast. For reference, all outside money together (customers plus lenders and investors) is about ' + fmt.pct(H.ext.base.value, {digits:0}) + ', range ' + fmt.pct(H.ext.low.value, {digits:0}) + ' to ' + fmt.pct(H.ext.high.value, {digits:0}) + '.'));
    drawBar(H, base);

    // what would have to change
    var tbl = $('table'); tbl.textContent = '';
    var thead = document.createElement('thead'), hr = document.createElement('tr');
    ['Assumption', 'Now', 'End-customer share across its range', 'Value that would give the what-if share (alone)'].forEach(function(t){ hr.appendChild(el('th', t)); }); thead.appendChild(hr); tbl.appendChild(thead);
    var tb = document.createElement('tbody'), top = (r.tornado || []).slice().sort(function(a, b){ return swing(b) - swing(a); }).filter(function(t){ return swing(t) > 0; }).slice(0, 4);
    top.forEach(function(t){
      var sol = solveOne(base, t.param), tr = document.createElement('tr'), td = el('td', null, 'n');
      tr.appendChild(el('td', ctx.terms ? DEFS[t.param].label : DEFS[t.param].label)); tr.appendChild(el('td', fmtParam(t.param, base[t.param]), 'n'));
      tr.appendChild(el('td', (typeof t.end_user_share_at_min === 'number' && typeof t.end_user_share_at_max === 'number') ? fmt.pct(Math.min(t.end_user_share_at_min, t.end_user_share_at_max), {digits:0}) + ' to ' + fmt.pct(Math.max(t.end_user_share_at_min, t.end_user_share_at_max), {digits:0}) : '—', 'n'));
      if (sol.status === 'there') td.textContent = 'Already at or above it';
      else if (sol.status === 'no'){ td.textContent = 'Not enough alone (best ' + fmt.pct(sol.reach, {digits:0}) + ' at ' + fmtParam(t.param, sol.bound) + ')'; td.className = 'n ch11-miss'; }
      else { td.textContent = fmtParam(t.param, sol.value); td.appendChild(ctx.tag('hypothetical', {formula: 'Value of ' + DEFS[t.param].label + ' at which the end-customer share would equal the what-if share of ' + fmt.pct(target, {digits:0}) + ', all else at current settings.'})); }
      tr.appendChild(td); tb.appendChild(tr);
    });
    tbl.appendChild(tb);

    var ids = top.slice(0, 2).map(function(t){ return t.param; }), cb = $('combo'); cb.textContent = '';
    last = null;
    if (ids.length < 2){ $('apply').disabled = true; }
    else {
      var two = solveTwo(base, ids), names = ids.map(function(i){ return DEFS[i].label; });
      if (two.status === 'there') cb.textContent = 'With your current settings end customers already pay at least the what-if share of ' + fmt.pct(target, {digits:0}) + ' of the cash.';
      else if (two.status === 'no') cb.textContent = 'Even with ' + names[0] + ' and ' + names[1] + ' both pushed to their limits, the end-customer share only reaches ' + fmt.pct(two.reach, {digits:0}) + '. A what-if share of ' + fmt.pct(target, {digits:0}) + ' would take changes in several assumptions at once, which is a different loop from the one we modeled.';
      else {
        cb.appendChild(document.createTextNode('Move two knobs together: '));
        ids.forEach(function(id, i){ cb.appendChild(el('b', DEFS[id].label)); cb.appendChild(document.createTextNode(' from ' + fmtParam(id, base[id]) + ' to about ' + fmtParam(id, two.vals[id]) + (i === 0 ? ', and ' : '. '))); });
        cb.appendChild(document.createTextNode('That would put the end-customer share at about ' + fmt.pct(target, {digits:0}) + ', the what-if share you picked. '));
        cb.appendChild(ctx.tag('hypothetical', {formula: 'Both assumptions moved toward the bound that raises the end-customer share by the same fraction of their range until the share equals the target.'}));
        cb.appendChild(document.createTextNode(' In plain terms, that is a loop leaning more on paying customers and less on borrowed money and on vendors funding their own buyers. Whether any of that happens is an open question, and this is arithmetic on a toy model, not a goal or a forecast.'));
        last = two.vals;
      }
      $('apply').disabled = !last;
    }
    $('apply').title = last ? '' : 'Nothing to apply: the what-if share is already met or can’t be reached with these two knobs.';
    $('take').textContent = 'One measure worth tracking is the share of the loop’s cash that is paid by end customers. Our toy estimate is about ' + fmt.pct(eu.base.value, {digits:0}) + ', anywhere from ' + fmt.pct(eu.low.value, {digits:0}) + ' to ' + fmt.pct(eu.high.value, {digits:0}) + ' depending on one assumption at a time, so we can’t say whether the loop mostly stands on real demand or mostly circles. Lenders’ money is outside money, but it is a loan against that same future demand. The companies and lenders involved can see the contracts. Ask them, or wait for the filings to say.';
  }

    $('target').addEventListener('input', function(){ target = (+this.value) / 100; render(); });
  $('apply').addEventListener('click', function(){ if (last) ctx.set(last); });
  $('resetm').addEventListener('click', function(){ ctx.reset(); });

  // open questions, written for readers
  list($('open'), [
    'How much of AI companies’ revenue comes from end customers, and how much was funded by the chip and cloud companies that sell to them? Filings rarely split it.',
    'How long AI chips stay useful, and what they are worth when the loans against them come due.',
    'Which of the promises (contracts, backstops, guarantees) are firm, how many will actually be drawn, and when.',
    'Whether lenders keep lending on today’s terms if credit ratings or markets move. A few market prices, such as the cost of insuring some neocloud and Oracle debt, are already moving.'
  ].map(function(t){ return el('li', t); }));

  // go deeper
  var links = [['/nvidia-dollar/', 'Tracing $1 of Nvidia sales', 'where the chipmaker’s revenue goes'], ['/neoclouds/', 'The neoclouds', 'who rents out the chips'],
    ['/neocloud-contagion/', 'Neocloud contagion', 'how stress could travel'], ['/burry-depreciation/', 'The depreciation debate', 'how long a GPU really lasts'],
    ['/sector-pulse/', 'Sector pulse', 'the market’s temperature']];
  list($('deeper'), links.map(function(l){ var li = document.createElement('li'); li.appendChild(ctx.siteLink(l[0], l[1])); li.appendChild(document.createTextNode(' — ' + l[2])); return li; }));

  $('share').addEventListener('click', function(){
    ctx.copyShareUrl().then(function(ok){ $('sharemsg').textContent = ok ? 'Link copied.' : 'Could not copy. The address bar has your link.'; });
  });

  render(); ctx.subscribe(render);
};
