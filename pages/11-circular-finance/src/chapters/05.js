Chapters["05"] = function (root, ctx) {
  var M = ctx.M, NS = "http://www.w3.org/2000/svg";
  var q = function (s) { return root.querySelector(s); };
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (k === "text") el.textContent = attrs[k]; else el.setAttribute(k, attrs[k]); });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null) continue; el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }
    return el;
  }
  function usd(n, d) {
    if (n == null || !isFinite(n)) return "not defined";
    var digits = d == null ? (Math.abs(n) >= 100 ? 0 : 1) : d;
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function usdB(n) { return n == null ? "not disclosed" : (n >= 1000 ? "$" + (n / 1000).toFixed(2).replace(/\.?0+$/, "") + "T" : "$" + (+n.toFixed(2)) + "B"); }
  function tagged(tv, fmt) {
    var s = h("span", { "class": "ch05-val", title: tv && tv.formula_text ? tv.formula_text : "" });
    s.appendChild(document.createTextNode(fmt(tv ? tv.value : null) + " "));
    if (tv && tv.status) s.appendChild(ctx.tag(tv.status));
    return s;
  }
  var DL = ctx.data.deals; DL = Array.isArray(DL) ? DL : (DL && DL.deals) || [];
  var dealById = {}; DL.forEach(function (d) { dealById[d.id] = d; });

  // seniority colour + example deals (from data/deals.json) per slab
  var STYLE = {
    s1_senior_secured: { rgb: "255,90,54", deals: ["iren-gpu-financing", "coreweave-ddtl-4"] },
    s2_fund_back_leverage: { rgb: "205,60,45", deals: [] },
    s3_mezz_converts: { rgb: "240,163,46", deals: ["coreweave-ddtl-5-5-and-converts", "nebius-financing-2026"] },
    s4_contract_rights: { rgb: "154,125,240", deals: ["msft-iren-compute"] },
    s5_backstop: { rgb: "154,125,240", deals: ["nvda-coreweave-capacity-backstop", "google-fluidstack-cipher-backstop"] },
    s6_equity: { rgb: "47,209,181", deals: ["nvda-coreweave-equity"] },
    s7_lab_investors: { rgb: "190,195,225", deals: ["openai-round-mar2026", "nvda-anthropic-equity"] }
  };
  var state = { yearT: Math.min(+ctx.state.yearT || 0, 6), mode: "asset", sel: null, amortize: true };
  var KIND_TXT = { cash_claim: "cash claim", equity: "equity", promise_right: "promise (not cash)", contingent_promise: "contingent promise" };
  var LAYER_TXT = { direct: "direct claim", nested: "nested inside layer 1", indirect: "claim on someone else", contingent: "paid by a third party" };

  var svgWrap = q("[data-svg]"), detail = q("[data-detail]"), listEl = q("[data-list]"), ratioEl = q("[data-ratio]");
  var yearIn = q("[data-year]"), yearLbl = q("[data-yearlabel]");
  var lifeBox = q("[data-life]"), modeBox = q("[data-mode]"), amortBtn = q("[data-amort]"), amortNote = q("[data-amortnote]"), listNote = q("[data-listnote]");
  amortBtn.addEventListener("click", function () { state.amortize = !state.amortize; render(); });

  function life() { return ctx.state.params.gpu_useful_life_years; }

  // ---------- life buttons + burry link
  [3, 4, 5, 6].forEach(function (n) {
    var b = h("button", { type: "button", "class": "btn", "data-life": n, text: n + " years" });
    b.addEventListener("click", function () { ctx.set({ gpu_useful_life_years: n }); });
    lifeBox.appendChild(b);
  });
  var burry = q("[data-burry]");
  burry.appendChild(document.createTextNode("How long does a GPU really last? Analysts disagree. "));
  burry.appendChild(ctx.siteLink("/burry-depreciation/", "Read the depreciation debate"));
  burry.appendChild(document.createTextNode("."));

  yearIn.addEventListener("input", function () { state.yearT = +yearIn.value; render(); });
  modeBox.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-m]"); if (!b) return;
    state.mode = b.getAttribute("data-m"); render();
  });

  // ---------- iso helpers (local)
  function Iso(s) {
    var C = Math.cos(Math.PI / 6);
    var bb = [1e9, 1e9, -1e9, -1e9];
    function P(x, y, z) {
      var a = (x - y) * C * s, b = (x + y) * 0.5 * s - z * s;
      if (a < bb[0]) bb[0] = a; if (b < bb[1]) bb[1] = b; if (a > bb[2]) bb[2] = a; if (b > bb[3]) bb[3] = b;
      return [a, b];
    }
    function pts(arr) { return arr.map(function (p) { return P(p[0], p[1], p[2]).map(function (v) { return v.toFixed(1); }).join(","); }).join(" "); }
    function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (parent) parent.appendChild(e); return e; }
    function poly(parent, arr, attrs) { attrs = attrs || {}; attrs.points = pts(arr); return el("polygon", attrs, parent); }
    function box(parent, x, y, z, w, d, hh, fills, stroke, sw, dash) {
      var a = { stroke: stroke, "stroke-width": sw || 1, "stroke-linejoin": "round" }; if (dash) a["stroke-dasharray"] = dash;
      function A(f) { var o = {}; for (var k in a) o[k] = a[k]; o.fill = f; return o; }
      poly(parent, [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + hh], [x, y + d, z + hh]], A(fills[0]));
      poly(parent, [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + hh], [x + w, y, z + hh]], A(fills[1]));
      poly(parent, [[x, y, z + hh], [x + w, y, z + hh], [x + w, y + d, z + hh], [x, y + d, z + hh]], A(fills[2]));
    }
    return { P: P, pts: pts, el: el, poly: poly, box: box, bb: bb };
  }

  function placeTxt(s) { return s.asset_rank == null ? "Not ranked against this asset" : "Place " + s.asset_rank + " in line for this asset"; }
  var W = 5, D = 3.5, GZ = 0.35, STACK_H = 10.5;
  function build(stack) {
    var iso = Iso(38), svg = document.createElementNS(NS, "svg");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "Isometric GPU with claim slabs stacked on top (the bank slice sits inside the senior loan slab), and a dotted line showing the asset's current value. Each slab is a button.");
    var P = iso.P, E = iso.el;
    // plate
    iso.box(svg, -0.8, -0.8, -0.25, W + 1.6, D + 1.6, 0.25, ["#141d33", "#10172a", "#121a2e"], "rgba(160,190,255,.2)", 0.8);
    // GPU card
    iso.box(svg, 0, 0, 0, W, D, GZ, ["#1d2640", "#10172a", "#27324f"], "#4a5a88", 1);
    var g = E("g", {}, svg);
    [[1.5, 1.7], [3.4, 1.7]].forEach(function (c) {
      var pp = []; for (var i = 0; i < 28; i++) { var a = i / 28 * Math.PI * 2; pp.push([c[0] + Math.cos(a) * 0.8, c[1] + Math.sin(a) * 0.8, GZ]); }
      iso.poly(g, pp, { fill: "#0f1527", stroke: "#5a6a95", "stroke-width": 1 });
      for (var k = 0; k < 6; k++) { var a2 = k / 6 * Math.PI * 2; iso.poly(g, [[c[0], c[1], GZ], [c[0] + Math.cos(a2) * 0.75, c[1] + Math.sin(a2) * 0.75, GZ], [c[0] + Math.cos(a2 + 0.5) * 0.7, c[1] + Math.sin(a2 + 0.5) * 0.7, GZ]], { fill: "rgba(59,196,242,.25)", stroke: "none" }); }
    });
    for (var f = 0; f < 6; f++) { var p0 = P(0.4 + f * 0.8, D, 0.05), p1 = P(0.4 + f * 0.8, D, GZ - 0.05); E("line", { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: "#3bc4f2", "stroke-opacity": ".5", "stroke-width": 1.5 }, g); }
    // slabs
    // Height scale: all slabs except the nested bank slice (it sits inside the senior loan and adds no dollars).
    var total = stack.ratios.total_face_all.value, sc = STACK_H / (total0 || total), z = GZ, zTop, zRankedTop = GZ;
    var slabs = stack.slabs, byId = {};
    slabs.forEach(function (s) { byId[s.id] = s; });
    // draw order: ranked slabs first (senior loan, equity), nested bank slice inside the senior loan, then the unranked dashed slabs
    var order = ["s1_senior_secured", "s6_equity", "s3_mezz_converts", "s4_contract_rights", "s5_backstop", "s7_lab_investors"];
    var zStart = {};
    order.forEach(function (id) {
      var s = byId[id], st = STYLE[s.id], hh = Math.max(0.25, s.face_value.value * sc), solid = s.recoverable_from_asset;
      var al = solid ? 0.2 : 0.1;
      zStart[id] = z;
      var gr = E("g", { "class": "slab" + (state.sel === s.id ? " sel" : ""), tabindex: 0, role: "button", "data-slab": s.id, "aria-label": s.label + ". " + placeTxt(s) + ", face value " + usd(s.face_value.value) + (solid ? ", counted in the headline" : ", not paid from this asset, not counted in the headline"), "aria-pressed": state.sel === s.id ? "true" : "false" }, svg);
      iso.box(gr, 0, 0, z, W, D, hh, ["rgba(" + st.rgb + "," + al + ")", "rgba(" + st.rgb + "," + al * 0.7 + ")", "rgba(" + st.rgb + "," + al * 1.5 + ")"], "rgba(" + st.rgb + "," + (solid ? 0.95 : 0.8) + ")", 1.5, solid ? null : "5 4");
      var tp = P(W / 2, D, z + hh / 2);
      var t = E("text", { x: tp[0], y: tp[1] + 5, "text-anchor": "middle", "font-size": 17, "font-weight": 800, fill: "#fff", stroke: "#0b1020", "stroke-width": 3, "paint-order": "stroke", "pointer-events": "none", "aria-hidden": "true" }, gr);
      t.textContent = s.asset_rank == null ? "–" : s.asset_rank;
      z += hh;
      if (solid) zRankedTop = z;
      if (id === "s1_senior_secured") {
        // nested bank slice: a narrower box inside the senior slab, adds no height
        var nb = byId.s2_fund_back_leverage, nst = STYLE[nb.id], nh = Math.min(hh - 0.05, Math.max(0.2, nb.face_value.value * sc));
        var g2 = E("g", { "class": "slab" + (state.sel === nb.id ? " sel" : ""), tabindex: 0, role: "button", "data-slab": nb.id, "aria-label": nb.label + ". Nested inside the senior loan, face value " + usd(nb.face_value.value) + ", adds claimants not dollars, not counted again in the headline", "aria-pressed": state.sel === nb.id ? "true" : "false" }, svg);
        iso.box(g2, 0.45, 0.35, zStart[id], W - 0.9, D - 0.7, nh, ["rgba(" + nst.rgb + ",.35)", "rgba(" + nst.rgb + ",.25)", "rgba(" + nst.rgb + ",.5)"], "rgba(" + nst.rgb + ",1)", 1.5, "2 3");
        var tp2 = P(W / 2, D - 0.35, zStart[id] + nh / 2);
        var t3 = E("text", { x: tp2[0], y: tp2[1] + 5, "text-anchor": "middle", "font-size": 15, "font-weight": 800, fill: "#fff", stroke: "#0b1020", "stroke-width": 3, "paint-order": "stroke", "pointer-events": "none", "aria-hidden": "true" }, svg);
        t3.textContent = "1";
      }
    });
    zTop = z;
    // asset line
    var zA = GZ + Math.max(0, stack.asset_value.value) * sc;
    var ex = 0.45;
    iso.poly(svg, [[-ex, -ex, zA], [W + ex, -ex, zA], [W + ex, D + ex, zA], [-ex, D + ex, zA]], { fill: "rgba(59,196,242,.07)", stroke: "#f6f8ff", "stroke-width": 2.4, "stroke-dasharray": "2 7", "stroke-linecap": "round", "class": "dotline", "pointer-events": "none" });
    var lp = P(-ex, D + ex, zA);
    var lt = E("text", { x: lp[0] - 8, y: lp[1] + 4, "text-anchor": "end", "font-size": 17, "font-weight": 700, fill: "#f6f8ff", "pointer-events": "none" }, svg);
    lt.textContent = "asset now: " + usd(stack.asset_value.value, 0);
    // gap bracket
    if (zRankedTop > zA + 0.2) {
      var bx = W + 0.9, by = -0.3, a = P(bx, by, zA), b = P(bx, by, zRankedTop);
      E("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "#ff5a36", "stroke-width": 2.5, "pointer-events": "none" }, svg);
      [a, b].forEach(function (p) { E("line", { x1: p[0] - 6, y1: p[1], x2: p[0] + 6, y2: p[1], stroke: "#ff5a36", "stroke-width": 2.5, "pointer-events": "none" }, svg); });
      var gt = E("text", { x: b[0] + 10, y: (a[1] + b[1]) / 2, "font-size": 17, "font-weight": 700, fill: "#ff8a6e", "pointer-events": "none" }, svg);
      var gap = stack.ratios.total_face_ranked.value - stack.asset_value.value;
      gt.textContent = "ranked claims minus asset: +" + usd(gap, 0);
    }
    var bb = iso.bb;
    svg.setAttribute("viewBox", [bb[0] - 150, bb[1] - 16, bb[2] - bb[0] + 285, bb[3] - bb[1] + 36].map(function (v) { return v.toFixed(0); }).join(" "));
    return svg;
  }

  var total0 = null;
  function rowFor(stack, id) { for (var i = 0; i < stack.recovery.length; i++) if (stack.recovery[i].slab_id === id) return stack.recovery[i]; return null; }

  function renderDetail(stack) {
    detail.innerHTML = "";
    if (!state.sel) { detail.appendChild(h("p", { text: "Pick a layer, on the picture or in the list, to see who holds it, a real example, and how much of it the asset could pay back right now." })); return; }
    var s = stack.slabs.filter(function (x) { return x.id === state.sel; })[0];
    var rec = rowFor(stack, s.id);
    detail.appendChild(h("h4", { text: s.label }));
    var dl = h("dl");
    function row(k, v) { dl.appendChild(h("dt", { text: k })); var dd = h("dd"); if (typeof v === "string") dd.textContent = v; else dd.appendChild(v); dl.appendChild(dd); }
    row("Who holds it", s.holder);
    row("Place in line", s.asset_rank == null ? "Not ranked against this asset: it is paid by someone else or from another source, so it has no place in this asset's line." : s.nested_in ? "Place 1, inside the senior loan: the bank is paid ahead of the fund's own investors." : "Place " + s.asset_rank + " of 2 claims that are paid from this asset (senior loan, then equity).");
    row("Kind", (KIND_TXT[s.kind] || s.kind) + ", " + (LAYER_TXT[s.layer] || s.layer));
    row("Face value", tagged(s.face_value, function (v) { return usd(v, 1); }));
    row("Status", ctx.tag(s.status));
    var yr = state.yearT === 0 ? "today" : "in year " + state.yearT;
    if (rec && rec.recovery_pct) {
      var pct = rec.recovery_pct.value;
      row("Recovery " + yr, tagged(rec.recovery_pct, function (v) { return Math.round(v * 100) + "% (" + usd(rec.recovered.value, 1) + " of " + usd(rec.face_value.value, 1) + ")"; }));
      if (rec.shortfall && rec.shortfall.value > 0.05) row("Shortfall", tagged(rec.shortfall, function (v) { return "-" + usd(v, 1); }));
    } else {
      row("Recovery " + yr, rec && rec.note ? rec.note : "Not paid from this asset.");
    }
    detail.appendChild(dl);
    if (rec && rec.note && rec.recovery_pct) detail.appendChild(h("p", { "class": "ch05-note", text: rec.note }));
    detail.appendChild(h("p", { "class": "ch05-note", text: "Recovery waterfall: senior lenders first (the bank behind the fund before the fund's own investors), then equity gets whatever is left. The lab's contract right is a promise, not cash, so it is not part of the asset or the waterfall. Toy model, hypothetical numbers." }));
    detail.appendChild(h("strong", { text: "Real-world example" }));
    var ul = h("ul", { "class": "ch05-ex" });
    ul.appendChild(h("li", { text: s.example }));
    STYLE[s.id].deals.forEach(function (id) {
      var d = dealById[id]; if (!d) return;
      var li = h("li");
      li.appendChild(document.createTextNode(d.from + " to " + d.to + ", " + d.date + ". Headline " + (d.headline_usd_b == null ? "not disclosed" : usdB(d.headline_usd_b)) + " "));
      li.appendChild(ctx.tag(d.status));
      if (d.source_ids && d.source_ids[0]) { li.appendChild(document.createTextNode(" ")); li.appendChild(ctx.sourceLink(d.source_ids[0])); }
      ul.appendChild(li);
    });
    detail.appendChild(ul);
  }

  var CAP_TXT = ">100 to 1";
  function renderRatio(stack) {
    var r = stack.ratios, tv = state.mode === "asset" ? r.claims_per_usd_asset : r.claims_per_usd_debt;
    ratioEl.innerHTML = "";
    var lab = state.mode === "asset" ? "of claims are lined up against each $1 of the GPU's value (counting only the claims that rank against the GPU itself)" : "of claims in the picture for each $1 of senior loan (every slab except the nested bank slice)";
    var big = h("div", { "class": "ch05-big" });
    if (tv.value == null) { big.appendChild(document.createTextNode(CAP_TXT + " ")); big.appendChild(h("small", { text: "The GPU is worth almost nothing, so the ratio has no meaningful ceiling. We show it as \u201c" + CAP_TXT + "\u201d (more than $100 of claims for each $1 of the GPU)." })); }
    else { big.appendChild(tagged(tv, function (v) { return usd(v, 2); })); big.appendChild(h("small", { text: " " + lab })); }
    ratioEl.appendChild(big);
    if (tv.value != null) {
      var mx = Math.max(1, tv.value);
      ratioEl.appendChild(h("div", { "class": "ch05-bars", "aria-hidden": "true" },
        h("span", { text: "$1" }), h("div", { "class": "ch05-bar unit", style: "width:" + (100 / mx).toFixed(1) + "%" }),
        h("span", { text: usd(tv.value, 2) + " of claims" }), h("div", { "class": "ch05-bar claims", style: "width:100%" })));
    }
    if (state.mode === "asset") {
      ratioEl.appendChild(h("p", { "class": "ch05-note", text: "What is counted: " + r.labels.headline + ". " + r.labels.counted }));
      var p = h("p", { "class": "ch05-note" });
      p.appendChild(document.createTextNode("If you also count the promises and the claims on the parent or the lab (the dashed slabs), but still not the nested bank slice: "));
      p.appendChild(tagged(r.claims_per_usd_asset_all_in, function (v) { return v == null ? "not defined" : usd(v, 2); }));
      p.appendChild(document.createTextNode(". That is a wider picture, not dollars lent against this chip."));
      ratioEl.appendChild(p);
      if (r.no_paydown_caveat) ratioEl.appendChild(h("p", { "class": "ch05-note", text: r.no_paydown_caveat }));
    } else {
      var p2 = h("p", { "class": "ch05-note" }); p2.appendChild(document.createTextNode("Senior debt face value: "));
      p2.appendChild(tagged(stack.slabs[0].face_value, function (v) { return usd(v, 1); })); ratioEl.appendChild(p2);
      ratioEl.appendChild(h("p", { "class": "ch05-note", text: "This view divides every slab except the nested bank slice by the senior loan. It includes promises and claims on other entities, so read it as a picture of how much sits around the loan, not as a recovery figure." }));
    }
    ratioEl.appendChild(h("p", { "class": "ch05-note", text: r.note }));
    ratioEl.appendChild(spark());
    ratioEl.appendChild(h("div", { "class": "ch05-key" },
      h("span", null, h("i", { style: "border-color:#ff5a36;border-top-style:dashed" }), "claims if rent stops (constant)"),
      h("span", null, h("i", { style: "border-color:#f0a32e" }), "claims with debt paid down from rent"),
      h("span", null, h("i", { style: "border-color:#3bc4f2" }), "asset value")));
    ratioEl.appendChild(h("p", { "class": "ch05-note", text: "Dotted vertical: the year you picked. The picture and the big number follow the toggle above." }));
  }

  function spark() {
    var rows = M.timeline(ctx.state.params, { step: 0.5 }), rowsA = M.timeline(ctx.state.params, { step: 0.5, amortize: true }), Wd = 300, Ht = 90, pad = 8;
    var svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 " + Wd + " " + Ht);
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Small chart: total claims stay flat if rent stops, or fall as the loan is paid down from rent, while the asset's value falls over the years.");
    svg.style.width = "100%"; svg.style.maxWidth = "420px";
    var mx = Math.max.apply(null, rows.map(function (r) { return Math.max(r.total_claims.value, r.asset_value.value); }));
    var mY = rows[rows.length - 1].year || 1;
    function X(y) { return pad + y / mY * (Wd - 2 * pad); } function Y(v) { return Ht - pad - v / mx * (Ht - 2 * pad); }
    function line(key, stroke, dash, src) { var d = (src || rows).map(function (r, i) { return (i ? "L" : "M") + X(r.year).toFixed(1) + " " + Y(r[key].value).toFixed(1); }).join(" "); var p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("fill", "none"); p.setAttribute("stroke", stroke); p.setAttribute("stroke-width", 2.5); if (dash) p.setAttribute("stroke-dasharray", dash); svg.appendChild(p); }
    line("total_claims", "#ff5a36", "6 4"); line("total_claims", "#f0a32e", null, rowsA); line("asset_value", "#3bc4f2");
    var m = document.createElementNS(NS, "line"); var xx = X(Math.min(state.yearT, mY)); m.setAttribute("x1", xx); m.setAttribute("x2", xx); m.setAttribute("y1", 2); m.setAttribute("y2", Ht - 2); m.setAttribute("stroke", "#f6f8ff"); m.setAttribute("stroke-dasharray", "2 4"); svg.appendChild(m);
    return svg;
  }

  function renderList(stack) {
    listEl.innerHTML = "";
    stack.slabs.forEach(function (s) {
      var rec = rowFor(stack, s.id), st = STYLE[s.id];
      var b = h("button", { type: "button", "class": "ch05-row", "aria-pressed": state.sel === s.id ? "true" : "false", "data-slab": s.id });
      var sw = h("span", { "class": "ch05-sw" + (s.recoverable_from_asset ? "" : " dashed"), style: "background:rgba(" + st.rgb + ",.9)", text: s.asset_rank == null ? "–" : String(s.asset_rank), "aria-hidden": "true" });
      var mid = h("span", null, h("strong", { text: s.label }), h("br"));
      var rtxt = rec && rec.recovery_pct ? "recovers " + Math.round(rec.recovery_pct.value * 100) + "% now" : "not ranked against this asset";
      mid.appendChild(h("span", { "class": "ch05-rec", text: rtxt + (s.recoverable_from_asset ? "" : " (dashed on picture)") }));
      // tag badge is a SIBLING of the button, never inside it (no nested interactive controls)
      var rt = h("span", { "class": "ch05-tagrow ch05-amt" }); rt.appendChild(document.createTextNode(usd(s.face_value.value, 0))); rt.appendChild(ctx.tag(s.status));
      b.appendChild(sw); b.appendChild(mid);
      listEl.appendChild(h("li", { "class": "ch05-item" + (state.sel === s.id ? " sel" : "") }, b, rt));
    });
  }

  function select(id) { state.sel = state.sel === id ? null : id; render(); var f = root.querySelector('.slab[data-slab="' + id + '"]'); if (f && document.activeElement && document.activeElement.closest && document.activeElement.closest(".slab")) f.focus(); }
  svgWrap.addEventListener("click", function (e) { var g = e.target.closest(".slab"); if (g) { var id = g.getAttribute("data-slab"); state.sel = id; render(); var n = root.querySelector('.slab[data-slab="' + id + '"]'); if (n && e.detail === 0) n.focus(); } });
  svgWrap.addEventListener("keydown", function (e) { if (e.key !== "Enter" && e.key !== " ") return; var g = e.target.closest && e.target.closest(".slab"); if (!g) return; e.preventDefault(); state.sel = g.getAttribute("data-slab"); render(); var n = root.querySelector('.slab[data-slab="' + state.sel + '"]'); if (n) n.focus(); });
  listEl.addEventListener("click", function (e) { var b = e.target.closest("button[data-slab]"); if (b) { state.sel = b.getAttribute("data-slab"); render(); var n = listEl.querySelector('[data-slab="' + state.sel + '"]'); if (n) n.focus(); } });

  function render() {
    var L = life(); yearIn.max = L; if (state.yearT > L) state.yearT = L;
    yearIn.value = state.yearT; ctx.state.yearT = state.yearT;
    yearIn.setAttribute("aria-valuetext", "year " + state.yearT);
    yearLbl.textContent = "Time passes: year " + state.yearT + " of " + L;
    [].forEach.call(lifeBox.children, function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-life") === L)); });
    [].forEach.call(modeBox.children, function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-m") === state.mode)); });
    amortBtn.setAttribute("aria-pressed", String(state.amortize));
    var stack = M.claimsStack(ctx.state.params, state.yearT, { amortize: state.amortize });
    var am = stack.amortization;
    amortNote.textContent = state.amortize
      ? "On: the senior loan is paid down from the lab's rent on a made-up schedule (a level payment over " + ctx.state.params.debt_term_years + " years). That is the case where the lab keeps paying: rent covers the loan payment about " + (am.rent_covers_debt_service_x.value == null ? "not defined" : am.rent_covers_debt_service_x.value.toFixed(1)) + " times after running costs. Equity and the other layers are not paid down."
      : "Off: every claim stays at its full face value. This is the 'rent stops' case: a worst case for lenders, not a forecast. Real loans are repaid from rent while the customer keeps paying.";
    listNote.textContent = state.amortize ? "Senior loan amounts shrink as rent pays them down (hypothetical schedule); the other layers stay at face value." : "Face values are held constant here to show the worst case, where rent stops; only the asset changes.";
    if (total0 == null) total0 = M.claimsStack(ctx.state.params, 0).ratios.total_face_all.value;
    svgWrap.innerHTML = ""; svgWrap.appendChild(build(stack));
    var a = stack.asset_value, cap = q("[data-figcap]"); cap.innerHTML = "";
    cap.appendChild(document.createTextNode("Per $100 of seed cash (toy model). Slab height is face value; dashed slabs are claims paid by someone else or from the parent, not from this asset. The dotted line is what the asset is worth at year " + state.yearT + ": "));
    cap.appendChild(tagged(a, function (v) { return usd(v, 1); })); cap.appendChild(document.createTextNode(state.amortize ? ". The chip loses value, but in this view the senior loan is being repaid from rent. Switch paydown off to see the 'rent stops' case." : ". With rent stopped, claims don't shrink when the chip does. In real deals the senior loan is repaid from rent, so the real gap is smaller if the customer keeps paying."));
    var rd = q("[data-readme]");
    if (rd) {
      rd.innerHTML = "";
      var rk = stack.ratios.total_face_ranked, yrTxt = state.yearT === 0 ? "Today" : "In year " + state.yearT;
      rd.appendChild(document.createTextNode(yrTxt + ": the GPU (dotted line) is worth "));
      rd.appendChild(tagged(a, function (v) { return usd(v, 0); }));
      rd.appendChild(document.createTextNode(", and the claims that rank against it add up to "));
      rd.appendChild(tagged(rk, function (v) { return usd(v, 0); }));
      rd.appendChild(document.createTextNode(state.amortize ? " (the senior loan shrinks as rent pays it down)." : " (all claims held at full face value, the 'rent stops' case)."));
    }
    renderRatio(stack); renderDetail(stack); renderList(stack);
  }

  var lastLife = life();
  ctx.subscribe(function () { var L = life(); if (L !== lastLife) { lastLife = L; total0 = null; } render(); });

  // legend, hook-linked stat sentences, closing line (all numbers from the model)
  ctx.legend(q("[data-legend]"));
  var s0 = M.claimsStack(ctx.state.params, 0), sL = M.claimsStack(ctx.state.params, life());
  var mp = q("[data-means-p]");
  mp.appendChild(document.createTextNode("Seven layers of claims is normal. What's worth noticing is the shared dependency. We count only claims that are paid from this chip: the senior loan and the equity. (The bank slice sits inside the senior loan, so it adds a claimant but no dollars; the dashed slabs are paid by someone else, so they stay on the picture but are not in the ratio.) On day one that is "));
  mp.appendChild(tagged(s0.ratios.claims_per_usd_asset, function (v) { return usd(v, 2); }));
  mp.appendChild(document.createTextNode(" of claims per $1 of the GPU's value, because the cluster was bought with exactly that money. Counting the dashed slabs too (still not the nested bank slice) it is "));
  mp.appendChild(tagged(s0.ratios.claims_per_usd_asset_all_in, function (v) { return usd(v, 2); }));
  mp.appendChild(document.createTextNode(". If rent stops and every claim stays at full face value, the chip wears out and the ranked-claims figure reaches "));
  mp.appendChild(tagged(sL.ratios.claims_per_usd_asset, function (v) { return v == null ? CAP_TXT : usd(v, 2); }));
  mp.appendChild(document.createTextNode(" of claims per $1 of the GPU at the end of its useful life (the chip is then worth almost nothing, so the ratio has no meaningful ceiling and we cap the display at " + CAP_TXT + "). In real deals the senior loan is repaid from rent over the life of the chip, so the gap is smaller than that worst case. How much smaller depends on whether the customer keeps paying. We don't know yet."));
  render();
};
