Chapters["09"] = function (root, ctx) {
  "use strict";
  var M = ctx.M, F = ctx.fmt;
  var $ = function (s) { return root.querySelector(s); };

  /* ---------- local helpers ---------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function S(tag, attrs, text) {
    var e = ctx.svg(tag, attrs || {});
    if (text != null) e.textContent = text;
    return e;
  }
  function usd(n) { return F.usd(n, { digits: Math.abs(n) >= 100 ? 0 : 2 }); }
  function pct(n) { return F.pct(n); }
  // inline number span: value text + status badge + math in title
  function nv(t, f) {
    var span = el("span", "num");
    var txt = el("span", "num-v", (f || usd)(t.value));
    span.appendChild(txt);
    span.appendChild(ctx.tag(t.status));
    span.title = t.status + ": " + (t.formula_text || "");
    return span;
  }
  function add(parent, parts) {
    parts.forEach(function (p) {
      parent.appendChild(typeof p === "string" ? document.createTextNode(p) : p);
    });
    return parent;
  }
  function stat(tagged) { return tagged.status + ": " + (tagged.formula_text || ""); }
  function signed(n) { return (n < 0 ? "−" : "+") + usd(Math.abs(n)); }
  function minus(n) { return "−" + usd(Math.abs(n)); }

  /* ---------- scenario state ---------- */
  var KNOBS = [
    { id: "external_revenue_shortfall_pct", label: "End-user revenue shortfall at the lab", min: 0, max: 100, step: 5, unit: "%", hint: "How much less than planned the lab earns from outside customers." },
    { id: "gpu_rental_price_drop_pct", label: "GPU rental price drop", min: 0, max: 100, step: 5, unit: "%", hint: "Cuts what the hardware is worth as collateral." },
    { id: "rate_shock_bps", label: "Rate shock (floating share only)", min: 0, max: 1000, step: 25, unit: " bp", hint: "Added to the floating-rate part of the debt. bp = basis point, one hundredth of a percentage point (100 bp = 1 point)." },
    { id: "nvidia_stock_drop_pct", label: "Nvidia stock drop", min: 0, max: 100, step: 5, unit: "%", hint: "Shrinks vendor-sourced lab capital and next-lap reinvestment." }
  ];
  var ZERO = { external_revenue_shortfall_pct: 0, gpu_rental_price_drop_pct: 0, lab_missed_payment: false, rate_shock_bps: 0, nvidia_stock_drop_pct: 0 };
  var PRESETS = [
    { id: "mild", label: "Mild slowdown (our starting scenario)", sc: { external_revenue_shortfall_pct: 20, rate_shock_bps: 100 } },
    { id: "rental", label: "Rental price crash", sc: { gpu_rental_price_drop_pct: 40 } },
    { id: "lab", label: "One lab misses", sc: { lab_missed_payment: true } },
    { id: "all", label: "All of the above", sc: { external_revenue_shortfall_pct: 40, gpu_rental_price_drop_pct: 40, lab_missed_payment: true, rate_shock_bps: 200, nvidia_stock_drop_pct: 40 } }
  ];
  var sc = Object.assign({}, ZERO, PRESETS[0].sc);
  var activePreset = "mild";

  /* ---------- controls ---------- */
  var presetBox = $(".presets"), knobBox = $(".knobs");
  var inputs = {}, outputs = {};

  PRESETS.forEach(function (p) {
    var b = el("button", null, p.label);
    b.type = "button";
    b.setAttribute("aria-pressed", String(p.id === activePreset));
    b.dataset.preset = p.id;
    b.addEventListener("click", function () {
      sc = Object.assign({}, ZERO, p.sc);
      activePreset = p.id;
      syncControls(); render();
    });
    presetBox.appendChild(b);
  });

  KNOBS.forEach(function (k) {
    var wrap = el("div", "knob");
    var id = "ch09-" + k.id;
    var lab = el("label"); lab.setAttribute("for", id);
    var name = el("span", null, k.label);
    var out = el("output"); out.setAttribute("for", id);
    lab.appendChild(name); lab.appendChild(out);
    var inp = el("input"); inp.type = "range"; inp.id = id;
    inp.min = k.min; inp.max = k.max; inp.step = k.step;
    inp.addEventListener("input", function () {
      sc[k.id] = Number(inp.value); activePreset = null;
      syncControls(); render();
    });
    wrap.appendChild(lab); wrap.appendChild(inp); wrap.appendChild(el("p", "hint", k.hint));
    knobBox.appendChild(wrap);
    inputs[k.id] = inp; outputs[k.id] = out;
  });
  (function () {
    var wrap = el("div", "knob check");
    var id = "ch09-lab_missed_payment";
    var lab = el("label"); lab.setAttribute("for", id);
    var inp = el("input"); inp.type = "checkbox"; inp.id = id;
    inp.addEventListener("change", function () { sc.lab_missed_payment = inp.checked; activePreset = null; syncControls(); render(); });
    lab.appendChild(inp); lab.appendChild(el("span", null, "The lab misses its payment entirely this year"));
    wrap.appendChild(lab);
    knobBox.appendChild(wrap);
    inputs.lab_missed_payment = inp;
  })();
  $(".btn-reset").addEventListener("click", function () { sc = Object.assign({}, ZERO); activePreset = null; syncControls(); render(); });

  function syncControls() {
    KNOBS.forEach(function (k) {
      inputs[k.id].value = sc[k.id];
      outputs[k.id].textContent = sc[k.id] + k.unit;
      inputs[k.id].setAttribute("aria-valuetext", sc[k.id] + (k.unit === "%" ? " percent" : " basis points"));
    });
    inputs.lab_missed_payment.checked = !!sc.lab_missed_payment;
    Array.prototype.forEach.call(presetBox.children, function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.preset === activePreset));
    });
  }

  /* ---------- legend ---------- */
  (function () {
    var lg = $(".viz-legend");
    function item(style, text) {
      var s = el("span"); var i = el("i"); i.style.cssText = style; s.appendChild(i); s.appendChild(document.createTextNode(text)); lg.appendChild(s);
    }
    item("background:var(--c-external,#f0a32e)", "Outside cash");
    item("background:var(--c-recycled,#3bc4f2)", "Recycled cash");
    item("background:rgba(154,125,240,.35);border:1px dashed var(--c-promise,#9a7df0)", "Promise (not cash)");
    item("background:var(--teal,#2ec4b6)", "Paid");
    item("background:repeating-linear-gradient(45deg,var(--coral,#ff6b6b) 0 2px,transparent 2px 5px);border-color:var(--coral,#ff6b6b)", "Haircut (−)");
  })();

  /* ---------- SVG waterfall ---------- */
  var W = 460, X0 = 14, BARW = 400;
  function addTitle(node, text) { node.appendChild(S("title", {}, text)); return node; }
  function focusable(node, label) { node.setAttribute("tabindex", "0"); node.setAttribute("role", "img"); node.setAttribute("aria-label", label); return node; }

  function drawSvg(r) {
    var svg = S("svg", { viewBox: "0 0 " + W + " 760", role: "group", "aria-labelledby": "ch09-svg-t ch09-svg-d", preserveAspectRatio: "xMidYMin meet" });
    svg.appendChild(S("title", { id: "ch09-svg-t" }, "Stress-test payment waterfall (hypothetical)"));
    svg.appendChild(S("desc", { id: "ch09-svg-d" }, "Cash in, who is paid in order, promises triggered, and the loop back to Nvidia. All values hypothetical."));
    var defs = S("defs");
    var mk = S("marker", { id: "ch09-arr", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
    mk.appendChild(S("path", { d: "M0 0L10 5L0 10z", "class": "arrowhead" }));
    defs.appendChild(mk); svg.appendChild(defs);

    var src = r.sources_of_cash, wf = r.waterfall;
    var sumSched = 0, maxPaid = 0;
    wf.forEach(function (w) { sumSched += w.scheduled.value; maxPaid += Math.max(w.paid.value, 0); });
    var maxAll = Math.max(src.total_cash_in.value, sumSched, maxPaid, 1);
    var perRowMax = 0; wf.forEach(function (w) { perRowMax = Math.max(perRowMax, w.scheduled.value, w.paid.value); });
    var k = BARW / Math.max(src.total_cash_in.value, perRowMax, 1);  // one $ scale for the whole chart
    var y = 0;

    /* 1. cash in */
    svg.appendChild(S("text", { x: X0, y: 16, "class": "t-hd" }, "1. Cash in this year"));
    var nvNode = S("g");
    nvNode.appendChild(S("rect", { x: 320, y: 2, width: 126, height: 22, rx: 6, "class": "node" }));
    nvNode.appendChild(S("text", { x: 383, y: 17, "text-anchor": "middle", "class": "t-sm" }, "Nvidia revenue"));
    svg.appendChild(nvNode);
    var parts = [
      { v: src.lab_pays_from_end_users, cls: "seg-ext", label: "From the lab's end customers", kind: "outside cash" },
      { v: src.lab_pays_from_outside_capital, cls: "seg-ext2", label: "From the lab's outside investors", kind: "outside cash" },
      { v: src.lab_pays_from_recycled_capital, cls: "seg-rec", label: "From vendor-sourced lab capital", kind: "recycled cash" },
      { v: src.backstop_payment_from_nvidia, cls: "seg-prom", label: "Nvidia backstop, called (a promise turned into cash)", kind: "promise paid out" }
    ];
    var x = X0, by = 32;
    parts.forEach(function (p) {
      var w = Math.max(0, p.v.value) * k;
      if (w > 0.4) {
        var rect = S("rect", { x: x, y: by, width: w, height: 24, "class": p.cls });
        addTitle(rect, p.label + ": " + usd(p.v.value) + " (" + stat(p.v) + ")");
        svg.appendChild(rect);
      }
      x += w;
    });
    svg.appendChild(S("rect", { x: X0, y: by, width: BARW, height: 24, fill: "none", stroke: "currentColor", "stroke-opacity": ".25" }));
    y = by + 42;
    parts.forEach(function (p, i) {
      var sw = S("rect", { x: X0, y: y - 9, width: 12, height: 10, "class": p.cls });
      svg.appendChild(sw);
      var t = S("text", { x: X0 + 18, y: y, "class": "t-sm" }, p.label + ": " + usd(p.v.value));
      addTitle(t, stat(p.v));
      svg.appendChild(t);
      y += 17;
    });
    svg.appendChild(S("text", { x: X0, y: y + 4, "class": "t-md", "font-weight": "700" }, "Total cash in: " + usd(src.total_cash_in.value)));
    y += 34;

    /* 2. waterfall */
    svg.appendChild(S("text", { x: X0, y: y, "class": "t-hd" }, "2. Who gets paid, in order"));
    y += 12;
    wf.forEach(function (w, i) {
      var isDebt = w.id.indexOf("senior") === 0;
      svg.appendChild(S("text", { x: X0, y: y + 14, "class": "t-md" }, (i + 1) + ". " + w.label));
      var g = S("g");
      var sw = Math.max(0, w.scheduled.value) * k, pw = Math.max(0, w.paid.value) * k;
      g.appendChild(S("rect", { x: X0, y: y + 22, width: sw, height: 20, "class": "sched" }));
      g.appendChild(S("rect", { x: X0, y: y + 22, width: Math.min(pw, sw) , height: 20, "class": "paid" + (isDebt ? " debt" : "") }));
      if (pw > sw) g.appendChild(S("rect", { x: X0 + sw, y: y + 22, width: pw - sw, height: 20, "class": "paid" + (isDebt ? " debt" : ""), "fill-opacity": ".6" }));
      if (w.haircut.value > 0.005) g.appendChild(S("rect", { x: X0 + pw, y: y + 22, width: Math.max(0, sw - pw), height: 20, "class": "cut" }));
      var lab = "Claim " + w.claim_ids.join(", ") + " " + w.label + ": scheduled " + usd(w.scheduled.value) + ", paid " + usd(w.paid.value) + ", haircut " + usd(w.haircut.value);
      focusable(g, w.state + ". " + lab + ". hypothetical.");
      addTitle(g, lab + " (" + stat(w.paid) + ")");
      svg.appendChild(g);
      var stateWord = w.state === "paid" ? "paid in full" : w.state === "partial" ? "partly paid" : "unpaid";
      var line = "Paid " + usd(w.paid.value) + " of " + usd(w.scheduled.value) + " (" + Math.round(w.paid_pct.value * 100) + "%), " + stateWord;
      svg.appendChild(S("text", { x: X0, y: y + 57, "class": "t-sm" }, line + (w.haircut.value > 0.005 ? "; haircut " + minus(w.haircut.value) : "")));
      y += 68;
    });

    /* 3. promises */
    y += 6;
    svg.appendChild(S("text", { x: X0, y: y + 4, "class": "t-hd" }, "3. Promises: which ones got triggered"));
    y += 14;
    r.triggered_promises.forEach(function (p) {
      var hot = !!p.triggered;
      var g = S("g");
      g.appendChild(S("rect", { x: X0, y: y, width: BARW, height: 46, rx: 8, "class": "promise" + (hot ? " hot" : "") }));
      var head = p.label + (hot ? ": TRIGGERED" : ": not triggered");
      g.appendChild(S("text", { x: X0 + 10, y: y + 18, "class": "t-sm", "font-weight": "700" }, head));
      var det;
      if (p.id === "nvidia_backstop") det = p.exists ? "Called " + usd(p.amount_called.value) + " of a " + usd(p.cap.value) + " cap" : "No backstop in this setup (cap is zero)";
      else if (p.id === "lab_contract") det = "State: " + p.state + (p.amount_unpaid && p.amount_unpaid.value > 0.005 ? "; unpaid " + usd(p.amount_unpaid.value) : "");
      else det = "State: " + p.state + (p.amount_unpaid && p.amount_unpaid.value > 0.005 ? "; senior shortfall " + usd(p.amount_unpaid.value) : "");
      g.appendChild(S("text", { x: X0 + 10, y: y + 36, "class": "t-sm" }, det));
      focusable(g, head + ". " + det + ". Promise, not cash. hypothetical.");
      addTitle(g, "Promise (not cash). " + (p.trigger || ""));
      svg.appendChild(g);
      y += 56;
    });

    /* 4. loop back */
    y += 10;
    var lb = r.loop_back_to_nvidia;
    var boxTop = y;
    svg.appendChild(S("text", { x: X0, y: y + 4, "class": "t-hd" }, "4. Back to Nvidia: the feedback"));
    y += 14;
    var g4 = S("g");
    g4.appendChild(S("rect", { x: X0, y: y, width: BARW - 10, height: 128, rx: 8, "class": "loopbox" }));
    var rows = [
      ["Cash out of Nvidia (backstop paid)", minus(lb.backstop_cash_paid.value), lb.backstop_cash_paid],
      ["Paper markdown of neocloud stake", minus(lb.equity_markdown_neocloud.value), lb.equity_markdown_neocloud],
      ["Paper markdown of lab stake", minus(lb.lab_stake_markdown.value), lb.lab_stake_markdown],
      ["Lost next-lap Nvidia revenue", minus(lb.next_lap_revenue_lost_total.value) + " (" + F.pct(lb.next_lap_revenue_lost_pct_of_lap1_revenue.value) + " of lap 1)", lb.next_lap_revenue_lost_total]
    ];
    rows.forEach(function (rw, i) {
      var ty = y + 22 + i * 26;
      var t1 = S("text", { x: X0 + 10, y: ty, "class": "t-sm" }, rw[0]);
      var t2 = S("text", { x: X0 + BARW - 20, y: ty, "text-anchor": "end", "class": "t-sm", "font-weight": "700" }, rw[1]);
      addTitle(t1, stat(rw[2])); addTitle(t2, stat(rw[2]));
      g4.appendChild(t1); g4.appendChild(t2);
    });
    g4.appendChild(S("text", { x: X0 + 10, y: y + 120, "class": "t-sm", "fill-opacity": ".75" }, "Different kinds of effect: not added together."));
    focusable(g4, "Loop back to Nvidia. Cash out " + usd(lb.backstop_cash_paid.value) + ", paper markdowns, and lost next-lap revenue " + usd(lb.next_lap_revenue_lost_total.value) + ". hypothetical.");
    svg.appendChild(g4);
    var ymid = y + 64;
    // feedback arrow up the right edge to the Nvidia revenue node
    svg.appendChild(S("path", { d: "M" + (X0 + BARW - 10) + " " + ymid + " H" + (W - 8) + " V13 H" + 448, "class": "loop-arrow", "marker-end": "url(#ch09-arr)", fill: "none" }));
    var lt = S("text", { x: W - 14, y: 300, "class": "t-sm", "text-anchor": "middle", transform: "rotate(-90 " + (W - 14) + " 300)", "fill-opacity": ".85" }, "feeds Nvidia’s next-lap revenue");
    svg.appendChild(lt);
    y += 140;
    svg.setAttribute("viewBox", "0 0 " + W + " " + y);
    return svg;
  }

  /* ---------- readout ---------- */
  function li(list, parts) { var e = el("li"); add(e, parts); list.appendChild(e); return e; }

  function drawReadout(r) {
    var list = $(".readout-list"); list.textContent = "";
    var s = r.scheduled, src = r.sources_of_cash, wf = {}, i;
    r.waterfall.forEach(function (w) { wf[w.id] = w; });
    var bs = r.triggered_promises.filter(function (p) { return p.id === "nvidia_backstop"; })[0];
    var lb = r.loop_back_to_nvidia;
    var shortfall = Math.max(0, s.lab_payment.value - src.lab_total.value);

    var first = ["The lab owes ", nv(s.lab_payment), " this year. Only ", nv(src.lab_total), " of it actually arrives"];
    if (shortfall > 0.005) first.push(": a gap of ", nv({ value: shortfall, status: "hypothetical", formula_text: "scheduled lab payment \u2212 lab payments received" }), ".");
    else first.push(".");
    li(list, first);

    if (bs && bs.triggered && bs.exists) {
      li(list, ["That gap is big enough to call the backstop. Nvidia pays ", nv(bs.amount_called), " of a ", nv(bs.cap), " cap. This is a promise turning into real cash leaving Nvidia."]);
    } else if (bs && !bs.exists) {
      li(list, ["This setup has no backstop, so nothing is called and the whole gap lands on the payment waterfall."]);
    } else {
      li(list, ["The gap is below the backstop's trigger, so Nvidia's promise stays a promise this year. Cash called: ", nv(bs ? bs.amount_called : { value: 0, status: "hypothetical", formula_text: "not triggered" }), "."]);
    }

    var sen = r.senior_summary, eq = wf.equity;
    li(list, [
      "Operating costs get paid first (", nv(wf.opex.paid), "). The senior lenders are next: ",
      sen.shortfall.value > 0.005
        ? ["they collect ", nv(sen.paid), " of ", nv(sen.scheduled), ", a haircut of ", nv({ value: sen.shortfall.value, status: sen.shortfall.status, formula_text: sen.shortfall.formula_text }, minus), "."]
        : ["they are paid in full (", nv(sen.paid), ")."]
    ].reduce(function (a, b) { return a.concat(b); }, []));
    li(list, [
      "Equity, which includes Nvidia's stake, is paid last from what's left: ", nv(eq.paid), " of ", nv(eq.scheduled), " scheduled (",
      nv(eq.paid_pct, function (v) { return Math.round(v * 100) + "%"; }), "). ",
      eq.state === "unpaid" ? "Nothing is left for equity." : eq.state === "partial" ? "It takes a haircut so lenders don't have to." : "It is whole."
    ]);

    var col = r.collateral;
    li(list, [
      "If lenders ever had to take the GPUs back, the hardware would be worth about ", nv(col.gpu_value), " against ", nv({ value: s.debt_service_base.value ? col.gpu_value.value * col.senior_ltv.value : 0, status: "hypothetical", formula_text: col.senior_ltv.formula_text }), " of senior debt. That's a loan-to-value of ",
      nv(col.senior_ltv, function (v) { return Math.round(v * 100) + "%"; }), " and a recovery of ",
      nv(col.senior_recovery_if_foreclosed, function (v) { return Math.round(v * 100) + "%"; }), "."
    ]);

    li(list, [
      "Now the loop. Back at Nvidia: cash out ", nv(lb.backstop_cash_paid), ", paper markdowns of ", nv(lb.equity_markdown_neocloud), " (neocloud stake) and ", nv(lb.lab_stake_markdown),
      " (lab stake), and next-lap revenue lost of ", nv(lb.next_lap_revenue_lost_total), " (", nv(lb.next_lap_revenue_lost_pct_of_lap1_revenue, pct), " of lap-1 revenue). That's three kinds of hit. We don't add them up."
    ]);
    var last = list.lastChild;

    // numbers table
    var tb = $(".num-table tbody"); tb.textContent = "";
    r.waterfall.forEach(function (w) {
      var tr = el("tr");
      [el("th", null, w.label + (w.claim_ids.length ? " (claim " + w.claim_ids.join(" + ") + ")" : "")), nv(w.scheduled), nv(w.paid), nv(w.haircut), el("span", null, w.state)].forEach(function (c, idx) {
        var td = idx === 0 ? c : el("td"); if (idx === 0) c.setAttribute("scope", "row"); else td.appendChild(c); tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    return { sen: sen, eq: eq, col: col, lb: lb, bs: bs, s: s, src: src };
  }

  /* bull / bear */
  function drawReadings(r) {
    var sen = r.senior_summary, col = r.collateral, src = r.sources_of_cash, s = r.scheduled;
    var bs = r.triggered_promises.filter(function (p) { return p.id === "nvidia_backstop"; })[0];
    var lb = r.loop_back_to_nvidia;
    var bull = $(".reading.bull"), bear = $(".reading.bear");
    var bl = bull.querySelector(".reading-lead"), bli = bull.querySelector(".reading-list");
    var rl = bear.querySelector(".reading-lead"), rli = bear.querySelector(".reading-list");
    bl.textContent = ""; bli.textContent = ""; rl.textContent = ""; rli.textContent = "";
    add(bl, ["Contracted cash flows, a senior position and strong customers are what the structure is built on. Even in this squeeze, senior lenders are paid ", nv(sen.paid), " of ", nv(sen.scheduled), "."]);
    li(bli, ["Senior debt sits ahead of equity, so equity absorbs the first loss: it gets ", nv(r.waterfall[3].paid), " of ", nv(r.waterfall[3].scheduled), " while seniors are paid ", nv(sen.paid_pct || { value: sen.scheduled.value ? sen.paid.value / sen.scheduled.value : 1, status: "hypothetical", formula_text: "paid / scheduled" }, function (v) { return Math.round(v * 100) + "%"; }), "."]);
    li(bli, ["The backstop exists to absorb exactly this kind of gap" + (bs && bs.triggered ? ": it is called for " : ". Called this year: "), nv(bs ? bs.amount_called : { value: 0, status: "hypothetical", formula_text: "n/a" }), "."]);
    li(bli, ["Foreclosure recovery on the GPUs: ", nv(col.senior_recovery_if_foreclosed, function (v) { return Math.round(v * 100) + "%"; }), ". Real contracts with big, creditworthy customers are not in this toy, so it may understate how steady the cash is."]);

    add(rl, ["Every claim is paid from the same future customer spending, so one shock reaches all of them at once. Here the lab's real end-user cash is ", nv(src.lab_pays_from_end_users), " of ", nv(s.lab_payment), " owed."]);
    li(rli, ["The backstop shifts the hit back onto Nvidia: cash out ", nv(lb.backstop_cash_paid), ", plus paper markdowns of ", nv(lb.equity_markdown_neocloud), "."]);
    li(rli, ["The collateral shrinks while the claims stay put. GPU value is ", nv(col.gpu_value), " and the senior loan-to-value is ", nv(col.senior_ltv, function (v) { return Math.round(v * 100) + "%"; }), "."]);
    li(rli, ["Nvidia's next-lap revenue is where the loop closes: lost revenue of ", nv(lb.next_lap_revenue_lost_total), " in this scenario. If funding tightens, the customers who lean most on vendor-sourced capital are the most exposed, and their orders came with that support."]);
  }

  /* ---------- static bits: events, links, means ---------- */
  /* Both columns get the same card layout, dating and status tags. Dates, tags, sources and figures come from the data;
     where an event's own "why it matters" line is one-sided we show a neutral line instead. */
  var STRESS = [
    { id: "ev-sp-oracle-bbb-minus" },
    { id: "ev-oracle-cds-record" },
    { id: "ev-ai-bond-wave-cds-spike", fix: [/ spikes above/, " above"], why: "The market price of insuring this company's debt, and the yield on its bonds, both rose sharply in one week. Both are prices people are paying right now, not losses that have happened." },
    { id: "ev-fed-hike" },
    { id: "ev-fed-minutes-circular", why: "Fed staff named leasing commitments and circular financing arrangements among AI-related firms as something that could amplify losses if conditions turn." },
    { id: "ev-neocloud-drawdowns", why: "Share prices of the most financing-dependent AI companies are far below their highs. Their operating numbers, such as backlog, are still growing." }
  ];
  var WATCH = [
    { id: "ev-nvda-105b-guarantee", title: "Nvidia's conditional lease guarantee for an OpenAI campus", why: "The guarantee is a ceiling, not a payment. It is conditional and building by building, and Nvidia says it has paid nothing under any guarantee. One reading: it helps the project borrow. The other: it ties Nvidia's balance sheet to a customer's lease. The reports do not settle which matters more." },
    { id: "ev-hyperscaler-q3-capex", title: "Hyperscalers' combined free cash flow after capital spending (Q3 earnings)", why: "Free cash flow is what is left after investment. Reports say the combined figure was negative that quarter. One reading: companies are choosing to invest ahead of demand. The other: spending is now larger than the cash coming in. Both readings fit the same number." }
  ];
  var NVNEWS = [
    { id: "ev-huang-resigns", why: "Dated company news, shown for context. The filing gives no reason, and we draw no conclusion from it." },
    { id: "ev-congress-huang-hearings", why: "The inquiry is about Nvidia's dealings with Megaspeed International and export controls. The date is tentative." }
  ];
  var STRENGTH = [
    { id: "ev-nvda-q3fy27", why: "Revenue, profit and next-quarter guidance all came in above what analysts expected. The stock still fell, which shows markets are weighing more than one quarter's results." },
    { id: "ev-coreweave-q3", why: "Contracted backlog and the 2026 guidance both went up. The same quarter showed a net loss and higher interest costs." },
    { deal: "coreweave-ddtl-4", title: "Contract-backed senior loans to a neocloud have priced tighter over time", lead: "Borrowing cost on senior loans secured by customer contracts has fallen from its first facilities (SOFR is a standard bank base interest rate). The most recent deal for a lower-rated customer priced wider again. " },
    { id: "ev-hyperscaler-q3-capex", title: "Hyperscalers held or raised their capital-spending plans in Q3 earnings", why: "The big cloud companies, whose spending is the demand at the start of the chain, held or raised their plans for capital spending; one trimmed. That keeps orders coming for the chips and data centers at the start of the loop." },
    { id: "ev-no-defaults", why: "So far the stress shows up in prices and borrowing costs. We found no confirmed default on a GPU-backed loan as of that date." }
  ];
  var NVNEWS = [
    { id: "ev-huang-resigns", why: "Dated company news, shown for context. The filing gives no reason, and we draw no conclusion from it." },
    { id: "ev-congress-huang-hearings", why: "The inquiry is about Nvidia's dealings with Megaspeed International and export controls. The date is tentative." }
  ];
  (function () {
    var byId = {}, DL = ctx.data.deals; DL = Array.isArray(DL) ? DL : (DL && DL.deals) || [];
    (ctx.data.events.events || ctx.data.events).forEach(function (e) { byId[e.id] = e; });
    function card(ul, it) {
      var e = it.deal ? (function () { var d = DL.filter(function (x) { return x.id === it.deal; })[0]; return d && { date: d.date, status: d.status, title: it.title, why_it_matters: it.lead + (d.structure || "") + (d.what_changed_since_announcement ? " " + d.what_changed_since_announcement : ""), source_ids: d.source_ids }; })() : byId[it.id];
      if (!e) return;
      var item = el("li");
      var meta = el("div", "ev-date"); meta.appendChild(el("span", null, e.date)); meta.appendChild(ctx.tag(e.status));
      item.appendChild(meta);
      item.appendChild(el("div", "ev-title", it.title && !it.deal ? it.title : (it.fix ? e.title.replace(it.fix[0], it.fix[1]) : e.title)));
      item.appendChild(el("div", "ev-why", it.why || e.why_it_matters));
      var srcs = el("div", "ev-src"); srcs.appendChild(document.createTextNode("Sources: "));
      (e.source_ids || []).forEach(function (sid) { try { srcs.appendChild(ctx.sourceLink(sid)); } catch (x) { } });
      item.appendChild(srcs);
      ul.appendChild(item);
    }
    STRESS.forEach(function (it) { card($(".events.stress"), it); });
    STRENGTH.forEach(function (it) { card($(".events.strength"), it); });
    WATCH.forEach(function (it) { card($(".events.watch"), it); });
    NVNEWS.forEach(function (it) { card($(".events.nvnews"), it); });
    var lr = $(".links-row");
    lr.appendChild(ctx.siteLink("/neocloud-contagion/", "Market-price version of this question: neocloud contagion"));
    lr.appendChild(ctx.siteLink("/burry-depreciation/", "How long GPUs really last: the depreciation debate"));
    $(".means-text").textContent = "A stress test doesn't tell us whether payments will slow. It tells us the order people would get hurt in. In this toy, operating costs and senior lenders are first in line, equity and Nvidia's backstop sit behind them, and the hit loops back to Nvidia's own revenue. We don't know yet how real contracts would behave, and nobody here is predicting anything.";
  })();

  /* ---------- render ---------- */
  function render() {
    var r;
    try { r = M.stress(ctx.state.params, sc); } catch (err) {
      $(".svg-wrap").textContent = "That combination is outside the model's ranges: " + err.message; return;
    }
    var wrap = $(".svg-wrap"); wrap.textContent = "";
    wrap.appendChild(drawSvg(r));
    drawReadout(r);
    drawReadings(r);
  }

  syncControls();
  render();
  ctx.subscribe(function () { render(); });
};
