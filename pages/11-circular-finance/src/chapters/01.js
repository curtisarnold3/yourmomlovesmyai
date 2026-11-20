Chapters["01"] = function(root, ctx){
  var M = ctx.M, fmt = ctx.fmt, svg = ctx.svg, BILL = 20, STEP_MS = 650;
  var NAMES = ['Ana','Ben','Cy','Dee','Eli','Fay','Gus','Hal'];
  var THINGS = ['a haircut','a lasagna','a logo','a guitar lesson','a bike tune-up','a sourdough loaf','a photo shoot','a tax chat'];
  var $ = function(id){ return root.querySelector('#ch01-' + id); };
  var S = { n: 4, laps: 1, guest: false, h: 0, prog: 0, playing: false, raf: 0, t0: 0 };

  ctx.legend($('legend'));

  /* local pure arithmetic for this toy */
  function calc(n, laps, guest){
    var sales = BILL * n * laps + (guest ? BILL : 0);
    var real = BILL + (guest ? BILL : 0);
    return {sales: sales, real: real, times: sales / real};
  }
  function tv(value, formula){ return {value: value, status: 'calculated', formula_text: formula}; }

  var NS = 'http://www.w3.org/2000/svg', W = 520, H = 440, CX = 260, CY = 215, R = 140;
  var svgEl = $('svg'), gSeats, bill, extraBill, seatEls = [], guestEl;
  function seatPos(i, n){ var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [CX + R * Math.cos(a), CY + R * Math.sin(a)]; }
  var GUEST = [455, 60];

  function total(){ return S.n * S.laps + (S.guest ? 1 : 0); }
  function offset(){ return S.guest ? 1 : 0; }

  function buildScene(){
    while (svgEl.lastChild && svgEl.lastChild.nodeName !== 'title') svgEl.removeChild(svgEl.lastChild);
    seatEls = [];
    svgEl.appendChild(svg('circle', {'class':'table-top', cx:CX, cy:CY, r:88}));
    svgEl.appendChild(svg('text', {x:CX, y:CY - 2, 'text-anchor':'middle', fill:'#8590ad', 'font-size':17, 'font-family':'sans-serif', text:'one bill'}));
    svgEl.appendChild(svg('text', {x:CX, y:CY + 16, 'text-anchor':'middle', fill:'#8590ad', 'font-size':17, 'font-family':'sans-serif', text:'on the table'}));
    for (var i = 0; i < S.n; i++){
      var p = seatPos(i, S.n);
      var amt = svg('text', {'class':'amt', x:p[0], y:p[1] + 50, 'text-anchor':'middle', text:'$0'});
      var g = svg('g', {'class':'seat'}, [
        svg('circle', {cx:p[0], cy:p[1], r:30}),
        svg('text', {x:p[0], y:p[1] + 5, 'text-anchor':'middle', 'font-size':17, text:NAMES[i]}),
        amt]);
      svgEl.appendChild(g); seatEls.push({g: g, amt: amt});
    }
    guestEl = null;
    if (S.guest){
      var ga = svg('text', {'class':'amt', x:GUEST[0], y:GUEST[1] + 46, 'text-anchor':'middle', text:'pays real $'});
      guestEl = svg('g', {'class':'guest seat'}, [svg('circle', {cx:GUEST[0], cy:GUEST[1], r:30}),
        svg('text', {x:GUEST[0], y:GUEST[1] + 5, 'text-anchor':'middle', 'font-size':17, text:'Guest'}), ga]);
      svgEl.appendChild(guestEl);
    }
    extraBill = svg('g', {display:'none'}, [svg('rect', {x:-20, y:-11, width:40, height:22, rx:4, fill:ctx.colorHex.external, stroke:'#fff3d6', 'stroke-width':1.5}),
      svg('text', {y:5, 'text-anchor':'middle', 'font-size':17, 'font-weight':700, fill:'#2a1a00', 'font-family':'sans-serif', text:'$20'})]);
    bill = svg('g', {}, [svg('rect', {x:-20, y:-11, width:40, height:22, rx:4, fill:ctx.colorHex.recycled, stroke:'#d8f3fd', 'stroke-width':1.5}),
      svg('text', {y:5, 'text-anchor':'middle', 'font-size':17, 'font-weight':700, fill:'#06222f', 'font-family':'sans-serif', text:'$20'})]);
    svgEl.appendChild(extraBill); svgEl.appendChild(bill);
  }

  function place(g, x, y, rot){ g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + (rot || 0).toFixed(1) + ')'); }
  function lerp(a, b, t){ return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function ease(t){ return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function render(){
    var n = S.n, T = total(), off = offset(), h = S.h;
    var booked = []; for (var i = 0; i < n; i++) booked.push(0);
    var salesSoFar = 0, realSoFar = BILL;
    for (var e = 0; e < h; e++){
      if (S.guest && e === 0){ booked[0] += BILL; realSoFar += BILL; }
      else { booked[((e - off) + 1) % n] += BILL; }
      salesSoFar += BILL;
    }
    seatEls.forEach(function(s, i){ s.amt.textContent = '$' + booked[i]; s.g.classList.toggle('hit', booked[i] > 0 && (h > 0)); });
    if (guestEl) guestEl.querySelector('.amt').textContent = h > 0 ? 'paid real $20' : 'will pay $20';
    // bill positions
    var moving = h < T, t = S.playing || S.prog > 0 ? ease(S.prog) : 0;
    var seedAt = Math.max(0, h - off) % n, pos, extra = false;
    if (S.guest){
      var p0 = seatPos(0, n);
      if (h === 0 && moving){ var pe = lerp(GUEST, p0, t); extra = true; place(extraBill, pe[0], pe[1] - 42 + 42 * 0, 0); place(bill, p0[0], p0[1] - 44, 0); }
      else { extra = true; place(extraBill, p0[0] + 26, p0[1] - 44, 8); }
    }
    if (!(S.guest && h === 0 && moving)){
      var a = seatPos(seedAt, n);
      if (moving && h >= off){ var b = seatPos((seedAt + 1) % n, n); pos = lerp(a, b, t); } else pos = a;
      place(bill, pos[0], pos[1] - 44 + (moving && h >= off ? -Math.sin(Math.PI * t) * 14 : 0), 0);
    }
    extraBill.setAttribute('display', extra ? 'inline' : 'none');
    // caption
    var cap;
    if (h === 0 && !S.playing && S.prog === 0) cap = S.guest ? 'A guest at the next table pays Ana $20 for dinner. That one is real money from outside. Press Play.' : NAMES[0] + ' is holding the one $20. Press Play, or step through it.';
    else {
      var ev = (S.playing && h < T) ? h : Math.min(h, T) - 1;
      if (S.guest && ev === 0) cap = 'The guest pays ' + NAMES[0] + ' $20 of new money. ' + NAMES[0] + ' books $20 of income.';
      else { var j = ev - off, f = j % n, to = (j + 1) % n; cap = NAMES[f] + ' pays ' + NAMES[to] + ' $20 for ' + THINGS[to] + '. ' + NAMES[to] + ' books $20 of income.'; }
      if (h >= T) cap += ' The bill is back where it started.';
    }
    $('caption').textContent = cap;
    // stats
    var c = calc(n, S.laps, S.guest), ratioNow = salesSoFar / realSoFar;
    var f1 = salesSoFar / BILL + ' sale' + (salesSoFar / BILL === 1 ? '' : 's') + ' x $' + BILL + ' = $' + salesSoFar + ' of income booked so far';
    ctx.tagged($('sales'), tv(salesSoFar, f1), 'usd');
    ctx.tagged($('real'), tv(realSoFar, '$' + BILL + ' seed bill' + (S.guest && h > 0 ? ' + $' + BILL + ' from the outside diner' : '') + ' = $' + realSoFar + ' of real money'), 'usd');
    ctx.tagged($('ratio'), tv(ratioNow, 'Sales booked / real money in = $' + salesSoFar + ' / $' + realSoFar + ' = ' + ratioNow.toFixed(2) + 'x'), 'x');
    $('nout').textContent = n; $('lout').textContent = S.laps;
    $('note').textContent = 'When the bill finishes: $' + c.sales + ' of sales on $' + c.real + ' of real money, so every real dollar shows up as ' + c.times.toFixed(1) + ' dollars of sales (“revenue counted ' + c.times.toFixed(1) + ' times”).' + ' Cyan is the bill going round; amber is new money from outside.';
    $('play').textContent = S.playing ? 'Pause' : (h >= T ? 'Replay' : 'Play');
    $('step').disabled = h >= T; $('end').disabled = h >= T;
    var take = root.querySelector('#ch01-take p');
    take.textContent = 'On the table it’s ' + c.times.toFixed(1) + ' times the sales for the same money. In AI finance the pattern is subtler: a chip company invests in a customer, and the customer spends that money back on chips. Both sides book honest numbers. The question to keep asking isn’t "is revenue real?" It’s "how much of it came from outside the loop?" That’s the number the rest of this episode tries to measure.';
  }

  function stop(){ S.playing = false; if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; S.prog = 0; }
  function frame(ts){
    if (!S.playing) return;
    if (!S.t0) S.t0 = ts;
    S.prog = Math.min(1, (ts - S.t0) / STEP_MS);
    if (S.prog >= 1){
      S.h++; S.prog = 0; S.t0 = 0;
      if (S.h >= total()){ S.playing = false; render(); return; }
    }
    render(); S.raf = requestAnimationFrame(frame);
  }
  function play(){
    if (S.h >= total()) S.h = 0;
    if (ctx.reducedMotion){ stepOnce(); return; }
    S.playing = true; S.t0 = 0; S.raf = requestAnimationFrame(frame); render();
  }
  function stepOnce(){ if (S.playing) stop(); if (S.h < total()) S.h++; S.prog = 0; render(); }
  function restart(autoplay){ stop(); S.h = 0; buildScene(); render(); if (autoplay && !ctx.reducedMotion) play(); }

  $('play').addEventListener('click', function(){ if (S.playing){ stop(); render(); } else play(); });
  $('step').addEventListener('click', stepOnce);
  $('end').addEventListener('click', function(){ stop(); S.h = total(); render(); });
  $('reset').addEventListener('click', function(){ restart(false); });
  $('n').addEventListener('input', function(){ S.n = +this.value; restart(true); });
  $('l').addEventListener('input', function(){ S.laps = +this.value; stop(); S.h = 0; render(); if (!ctx.reducedMotion) play(); });
  $('guest').addEventListener('click', function(){ S.guest = !S.guest; this.setAttribute('aria-pressed', String(S.guest)); restart(true); });
  $('n').value = S.n; $('l').value = S.laps;

  // bridge to the main model, built from data
  try {
    var cum = M.runLoop(ctx.state.params, ctx.state.laps).cumulative, br = $('bridge');
    br.appendChild(document.createTextNode('On the table, "counted N times" is literal: sales divided by real money. The AI version has more seats and the same question, but the arithmetic means something a little different. In our toy model, each $1 of seed cash is followed by '));
    var sp = document.createElement('span'); ctx.tagged(sp, cum.revenue_counted_times, 'x'); br.appendChild(sp);
    br.appendChild(document.createTextNode(' of chipmaker revenue. We call that revenue booked per $1 of seed cash. It isn’t double counting in the dinner-table sense: lenders’ cash pays for the part above 1x, and the question is how much of the rest started with the chipmaker. We’ll get there in a few chapters.'));
  } catch (e) { /* bridge is optional */ }

  buildScene(); render();
  if (!ctx.reducedMotion) ctx.onVisible(svgEl, function(){ if (S.h === 0 && !S.playing) play(); });
};
