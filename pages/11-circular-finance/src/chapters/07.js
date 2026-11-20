Chapters["07"] = function (root, ctx) {
  var D = ctx.data;
  var slot = function (n) { return root.querySelector('[data-slot="' + n + '"]'); };
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "text") e.textContent = attrs[k]; else if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function fmtB(n) {
    if (n == null) return null;
    if (n === 0) return "$0";
    if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(2).replace(/\.?0+$/, "") + "T";
    return "$" + (Math.abs(n) < 1 ? n.toFixed(2) : n.toFixed(2).replace(/\.?0+$/, "")) + "B";
  }
  function range(lo, hi) {
    if (lo == null && hi == null) return null;
    if (lo == null) return "up to " + fmtB(hi);
    if (hi == null) return fmtB(lo) + " or more";
    return lo === hi ? fmtB(lo) : fmtB(lo) + " to " + fmtB(hi);
  }
  function amountLabel(d) {
    var hd = d.headline_usd_b != null ? fmtB(d.headline_usd_b) : "amount not disclosed";
    var ac = range(d.actual_usd_b_low, d.actual_usd_b_high);
    return hd + (ac && ac !== hd ? ", actual " + ac : "");
  }

  var ROLE = {
    I: { n: "Investor", core: true }, E: { n: "Investee (takes the equity)", passive: true },
    L: { n: "Lender", core: true }, B: { n: "Borrower", passive: true },
    S: { n: "Supplier", core: true }, C: { n: "Customer", core: true },
    G: { n: "Gives a backstop or guarantee" }, P: { n: "Is protected by a backstop or guarantee", passive: true },
    W: { n: "Grants warrants" }, H: { n: "Holds warrants", passive: true }
  };
  var TYPE = {
    equity:           { r: ["I", "E"], s: function (a, b) { return a + " invested in " + b; } },
    debt:             { r: ["L", "B"], s: function (a, b) { return a + " lent to " + b; } },
    compute_contract: { r: ["C", "S"], s: function (a, b) { return a + " contracted to buy compute from " + b; } },
    chip_purchase:    { r: ["C", "S"], s: function (a, b) { return a + " agreed to buy chips from " + b; } },
    lease:            { r: ["C", "S"], s: function (a, b) { return a + " leases from " + b; } },
    backstop:         { r: ["G", "P"], s: function (a, b) { return a + " gave " + b + " a backstop"; } },
    guarantee:        { r: ["G", "P"], s: function (a, b) { return a + " gave " + b + " a guarantee"; } },
    warrant:          { r: ["W", "H"], s: function (a, b) { return a + " granted " + b + " warrants"; } },
    loi:              { r: ["I", "E"], s: function (a, b) { return a + " signed a non-binding letter of intent to fund " + b; } },
    revenue_share:    { r: ["S", "C"], s: function (a, b) { return a + " shares revenue with " + b; } }
  };
  var LAYER_ORDER = ["supply", "neocloud", "hyperscaler", "lab", "capital"];
  var AGG = { investors_other: 1, compute_providers_all: 1, financing_platforms: 1, neocloud_group: 1 };
  var nodes = {};
  D.entities.nodes.forEach(function (n) { nodes[n.id] = n; });
  function nm(id) { return nodes[id] ? nodes[id].name : id; }
  function sn(id) { return nm(id).replace(/ \(.*$/, ""); }

  /* ---------- derive pairs ---------- */
  var pairs = {}, degree = {}, leftOut = { mixed: 0, outside: 0, other: 0 };
  D.deals.deals.forEach(function (d) {
    /* Each kind of money is handled on purpose. A mixed round is an aggregate (vendor and outside money in one line) and an outside-loop stake is
       not a loop relationship, so neither makes a pair or enters a cash total. Promises make role pairs but are never added to cash. */
    if (d.money_kind === "mixed") { leftOut.mixed++; return; }
    if (d.money_kind === "outside_loop_investment" || (d.loop_edge === false && d.money_kind !== "promise")) { leftOut.outside++; return; }
    if (d.sum_exclude || !d.loop_edge || AGG[d.from] || AGG[d.to] || !nodes[d.from] || !nodes[d.to] || !TYPE[d.type]) { leftOut.other++; return; }
    var key = [d.from, d.to].sort().join("|");
    var p = pairs[key] || (pairs[key] = { key: key, a: d.from < d.to ? d.from : d.to, b: d.from < d.to ? d.to : d.from, deals: [], roles: {}, prom: {} });
    p.deals.push(d);
    var t = TYPE[d.type];
    [[d.from, t.r[0]], [d.to, t.r[1]]].forEach(function (x) {
      var k = x[0] + ":" + x[1];
      p.roles[k] = true;
      if (d.money_kind === "external" || d.money_kind === "recycled") p.prom[k] = "cash"; else if (!p.prom[k]) p.prom[k] = "promise";
    });
  });
  var pairList = Object.keys(pairs).map(function (k) { return pairs[k]; });
  pairList.forEach(function (p) {
    var letters = {};
    Object.keys(p.roles).forEach(function (k) { letters[k.split(":")[1]] = 1; });
    p.score = Object.keys(letters).length;
    degree[p.a] = (degree[p.a] || 0) + 1; degree[p.b] = (degree[p.b] || 0) + 1;
  });
  pairList.forEach(function (p) { p.deg = degree[p.a] + degree[p.b]; p.head = p.deals.reduce(function (s, d) { return s + (d.headline_usd_b || 0); }, 0); });
  function rolesOf(p, id) {
    var out = [];
    Object.keys(ROLE).forEach(function (r) { if (p.roles[id + ":" + r]) out.push(r); });
    return out;
  }
  function pairOf(x, y) { return pairs[[x, y].sort().join("|")]; }

  var tangled = pairList.filter(function (p) { return p.score >= 3; });
  slot("counts").textContent = pairList.length + " company pairs share at least one deal line in our data. " + tangled.length + " of them play three or more distinct roles for each other." + (leftOut.mixed || leftOut.outside ? " Left out of the pairs on purpose: " + [leftOut.mixed ? leftOut.mixed + " mixed round" + (leftOut.mixed > 1 ? "s" : "") + " (vendor and outside money in one line)" : "", leftOut.outside ? leftOut.outside + " stake" + (leftOut.outside > 1 ? "s" : "") + " in companies outside the loop" : ""].filter(Boolean).join(" and ") + "." : "");
  slot("moneynote").textContent = "Money on each card comes in separate parts: cash reported as moved (the low end of the range in our sources), cash that is conditional or not yet shown as moved, and promises. They are never added together.";
  slot("explain").textContent = "Each letter is a role one company plays for another: for example I is investor and C is customer. Square letters are the giving side and round letters are the receiving side. Dashed letters are roles that exist only as promises so far. A pair that plays three or more different roles for each other is an overlapping pair. The three most tangled pairs come first below. The full grid and the list of every pair are one click further down.";

  function roleBadge(r, promiseOnly) {
    var R = ROLE[r];
    return h("span", { "class": "c7-role r-" + r + (promiseOnly ? " is-prom" : "") + (R.passive ? " passive" : ""), title: R.n + (promiseOnly ? " (promise only)" : ""), "aria-label": R.n + (promiseOnly ? ", promise only" : ""), text: r });
  }
  var key = slot("key");
  Object.keys(ROLE).forEach(function (r) { key.appendChild(h("li", null, [roleBadge(r, false), ROLE[r].n])); });
  key.appendChild(h("li", null, [h("span", { "class": "c7-role r-G is-prom", "aria-hidden": "true", text: "x" }), "dashed = promise only"]));

  /* ---------- sort / company set ---------- */
  var st = { sort: "roles", only3: false, sel: null };
  var grid = slot("grid"), tip = slot("tip");
  var cells = {};

  function companies() {
    var pool = st.only3
      ? Object.keys(degree).filter(function (id) { return pairList.some(function (p) { return p.score >= 3 && (p.a === id || p.b === id); }); })
      : Object.keys(degree).filter(function (id) { return degree[id] >= 3; });
    var tot = {};
    pool.forEach(function (id) { tot[id] = 0; });
    pairList.forEach(function (p) { if (tot[p.a] != null && tot[p.b] != null) { tot[p.a] += p.score; tot[p.b] += p.score; } });
    pool.sort(function (x, y) {
      if (st.sort === "name") return nm(x).localeCompare(nm(y));
      if (st.sort === "layer") return LAYER_ORDER.indexOf(nodes[x].layer) - LAYER_ORDER.indexOf(nodes[y].layer) || nm(x).localeCompare(nm(y));
      return tot[y] - tot[x] || nm(x).localeCompare(nm(y));
    });
    return pool;
  }

  /* Cash that moved, cash that is conditional or not yet shown as moved, and promises: three separate figures, never added together. */
  function money(deals) {
    var o = { moved: 0, cond: 0, unclear: 0, prom: 0, nCash: 0, nProm: 0, explicit: false };
    deals.forEach(function (d) {
      var m = ctx.moneyParts(d);
      if (d.money_kind === "promise") { o.nProm++; o.prom += m.promise; return; }
      o.nCash++; o.moved += m.moved; o.cond += m.conditional; o.unclear += m.unclear; if (m.explicit) o.explicit = true;
    });
    return o;
  }
  function moneyText(o) {
    var parts = [];
    if (!o.nCash) parts.push("No cash lines.");
    else {
      var bits = [];
      bits.push("reported as moved: " + (o.moved ? "at least " + fmtB(+o.moved.toFixed(2)) : "none established"));
      if (o.cond) bits.push("conditional, not yet moved: " + fmtB(+o.cond.toFixed(2)));
      if (o.unclear) bits.push("headline not yet shown as moved: " + fmtB(+o.unclear.toFixed(2)));
      parts.push("Cash lines across " + o.nCash + " deal" + (o.nCash > 1 ? "s" : "") + " (" + bits.join("; ") + ").");
    }
    parts.push(o.nProm ? "Promises on the table: " + fmtB(+o.prom.toFixed(2)) + " across " + o.nProm + ", counted separately and never added to cash." : "No promises.");
    return parts.join(" ");
  }
  function dealLine(d) {
    var row = h("div", { "class": "c7-deal" + (d.money_kind === "promise" ? " promise" : "") });
    row.appendChild(h("b", { text: TYPE[d.type].s(nm(d.from), nm(d.to)) }));
    row.appendChild(document.createTextNode(": " + amountLabel(d) + " · " + (d.date || "undated") + " · "));
    row.appendChild(ctx.tag(d.status));
    if (d.money_kind === "promise") row.appendChild(h("div", { "class": "c7-note", text: d.contingent ? "A contingent promise, not cash that has moved." : "A promise, not cash that has moved." }));
    else { var mp = ctx.moneyParts(d); if (mp.conditional) row.appendChild(h("div", { "class": "c7-note", text: fmtB(+mp.moved.toFixed(2)) + " moved; " + fmtB(+mp.conditional.toFixed(2)) + " conditional, not yet moved." })); else if (mp.unclear && mp.moved) row.appendChild(h("div", { "class": "c7-note", text: "At least " + fmtB(+mp.moved.toFixed(2)) + " reported as moved; the rest of the headline is not yet shown as moved." })); }
    return row;
  }
  function pairBody(p, rowId) {
    var box = h("div");
    var A = rowId || p.a, B = A === p.a ? p.b : p.a;
    [[A, B], [B, A]].forEach(function (x) {
      var rs = rolesOf(p, x[0]);
      var line = h("div", { "class": "c7-tag-line" });
      line.appendChild(h("span", { text: nm(x[0]) + ": " }));
      if (!rs.length) line.appendChild(document.createTextNode("(no role)"));
      rs.forEach(function (r) { line.appendChild(roleBadge(r, p.prom[x[0] + ":" + r] === "promise")); });
      line.appendChild(h("span", { "class": "c7-note", text: rs.map(function (r) { return ROLE[r].n.toLowerCase().replace(/ \(.*\)/, ""); }).join(", ") }));
      box.appendChild(line);
    });
    box.appendChild(h("h4", { text: "Deals between them" }));
    p.deals.slice().sort(function (a, b) { return (b.headline_usd_b || 0) - (a.headline_usd_b || 0); }).forEach(function (d) { box.appendChild(dealLine(d)); });
    box.appendChild(h("p", { "class": "c7-note", text: moneyText(money(p.deals)) }));
    return box;
  }
  function showTip(p, rowId) {
    tip.textContent = "";
    if (!p) { tip.appendChild(h("p", { "class": "c7-note", text: "Hover, focus or tap a cell to see the deals behind it." })); return; }
    var A = rowId, B = A === p.a ? p.b : p.a;
    tip.appendChild(h("h3", { text: nm(A) + " and " + nm(B) }));
    tip.appendChild(h("p", { "class": "c7-note", text: p.score + " distinct role" + (p.score === 1 ? "" : "s") + " in the pair" + (p.score >= 3 ? " (an overlapping pair)" : "") + ". Letters first are for " + nm(A) + "." }));
    tip.appendChild(pairBody(p, A));
  }

  function build() {
    var ids = companies();
    grid.textContent = ""; cells = {};
    var thead = h("thead"), hr = h("tr");
    hr.appendChild(h("th", { scope: "col" }, [h("span", { "class": "c7-sr", text: "Company" })]));
    ids.forEach(function (id) { var th = h("th", { scope: "col", "data-col": id }); th.appendChild(h("span", { text: sn(id), title: nm(id) })); hr.appendChild(th); });
    thead.appendChild(hr); grid.appendChild(thead);
    var tb = h("tbody");
    ids.forEach(function (r) {
      var tr = h("tr");
      tr.appendChild(h("th", { scope: "row", "data-row": r, title: nm(r), text: sn(r) }));
      ids.forEach(function (c) {
        var td = h("td", { "data-r": r, "data-c": c });
        if (r === c) { td.className = "diag"; td.setAttribute("aria-hidden", "true"); }
        else {
          var p = pairOf(r, c);
          if (p && (!st.only3 || p.score >= 3)) {
            var rs = rolesOf(p, r);
            td.className = "has" + (p.score >= 3 ? " tangled" : "");
            td.setAttribute("tabindex", "0");
            td.setAttribute("role", "button");
            td.setAttribute("aria-label", nm(r) + " relative to " + nm(c) + ": " + rs.map(function (x) { return ROLE[x].n; }).join(", ") + ". " + p.score + " distinct roles in the pair. " + p.deals.length + " deal line" + (p.deals.length > 1 ? "s" : "") + ". Press for amounts.");
            var cell = h("div", { "class": "c7-cell" });
            rs.forEach(function (x) { cell.appendChild(roleBadge(x, p.prom[r + ":" + x] === "promise")); });
            if (p.score >= 3) cell.appendChild(h("span", { "class": "c7-star", "aria-hidden": "true", text: "★" }));
            td.appendChild(cell);
            var on = function () { hl(r, c); showTip(p, r); };
            td.addEventListener("mouseenter", on);
            td.addEventListener("focus", on);
            td.addEventListener("mouseleave", function () { hl(null); selTip(); });
            td.addEventListener("blur", function () { hl(null); selTip(); });
            td.addEventListener("click", function () { st.sel = { r: r, c: c }; markSel(); on(); });
            td.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); st.sel = { r: r, c: c }; markSel(); on(); } });
          }
        }
        cells[r + "|" + c] = td;
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    grid.appendChild(tb);
    markSel(); selTip();
  }
  function hl(r, c) {
    grid.querySelectorAll(".is-hl").forEach(function (e) { e.classList.remove("is-hl"); });
    if (!r) return;
    grid.querySelectorAll('[data-row="' + r + '"],[data-col="' + c + '"]').forEach(function (e) { e.classList.add("is-hl"); });
    grid.querySelectorAll('td[data-r="' + r + '"],td[data-c="' + c + '"]').forEach(function (e) { e.classList.add("is-hl"); });
  }
  function markSel() {
    grid.querySelectorAll(".is-sel").forEach(function (e) { e.classList.remove("is-sel"); });
    if (st.sel && cells[st.sel.r + "|" + st.sel.c]) cells[st.sel.r + "|" + st.sel.c].classList.add("is-sel");
  }
  function selTip() {
    if (st.sel && pairOf(st.sel.r, st.sel.c)) showTip(pairOf(st.sel.r, st.sel.c), st.sel.r); else showTip(null);
  }

  /* ---------- pair list (all widths; the only view on mobile) ---------- */
  var pairsBox = slot("pairs");
  function buildList() {
    pairsBox.textContent = "";
    pairsBox.appendChild(h("h3", { text: "Every pair in the data" }));
    var arr = pairList.filter(function (p) { return !st.only3 || p.score >= 3; });
    arr.sort(function (x, y) {
      if (st.sort === "name") return nm(x.a).localeCompare(nm(y.a)) || nm(x.b).localeCompare(nm(y.b));
      if (st.sort === "layer") return LAYER_ORDER.indexOf(nodes[x.a].layer) - LAYER_ORDER.indexOf(nodes[y.a].layer) || nm(x.a).localeCompare(nm(y.a));
      return y.score - x.score || y.deg - x.deg || nm(x.a).localeCompare(nm(y.a));
    });
    arr.forEach(function (p) {
      var det = h("details", { "class": "c7-pair" + (p.score >= 3 ? " tangled" : "") });
      var sm = h("summary");
      sm.appendChild(document.createTextNode(nm(p.a) + " ↔ " + nm(p.b)));
      rolesOf(p, p.a).forEach(function (r) { sm.appendChild(roleBadge(r, p.prom[p.a + ":" + r] === "promise")); });
      sm.appendChild(h("span", { "aria-hidden": "true", text: "/" }));
      rolesOf(p, p.b).forEach(function (r) { sm.appendChild(roleBadge(r, p.prom[p.b + ":" + r] === "promise")); });
      sm.appendChild(h("span", { "class": "c7-n", text: p.score + (p.score === 1 ? " role" : " roles") + (p.score >= 3 ? " ★" : "") }));
      det.appendChild(sm);
      var filled = false;
      det.addEventListener("toggle", function () { if (det.open && !filled) { filled = true; var b = h("div", { "class": "c7-body" }); b.appendChild(pairBody(p, p.a)); det.appendChild(b); } });
      pairsBox.appendChild(det);
    });
    if (!arr.length) pairsBox.appendChild(h("p", { "class": "c7-note", text: "No pairs match." }));
  }

  /* ---------- callouts, written from the data ---------- */
  var top = tangled.slice().sort(function (x, y) { return y.score - x.score || y.deg - x.deg || y.head - x.head; }).slice(0, 3);
  var cbox = slot("callouts");
  top.forEach(function (p) {
    var card = h("article", { "class": "c7-card" });
    card.appendChild(h("h4", { text: nm(p.a) + " and " + nm(p.b) }));
    var rl = h("div", { "class": "c7-roles", "aria-label": "Roles in this pair" });
    [p.a, p.b].forEach(function (id) {
      rolesOf(p, id).forEach(function (r) { rl.appendChild(roleBadge(r, p.prom[id + ":" + r] === "promise")); });
      if (id === p.a) rl.appendChild(h("span", { "aria-hidden": "true", text: " / " }));
    });
    card.appendChild(rl);
    [p.a, p.b].forEach(function (id) {
      card.appendChild(h("p", { "class": "c7-note", text: nm(id) + " plays the part of: " + rolesOf(p, id).map(function (r) { return ROLE[r].n.toLowerCase().replace(/ \(.*\)/, ""); }).join(", ") + "." }));
    });
    var ds = p.deals.slice().sort(function (a, b) { return (b.headline_usd_b || 0) - (a.headline_usd_b || 0); });
    var sentences = ds.map(function (d) {
      return TYPE[d.type].s(nm(d.from), nm(d.to)) + " (" + amountLabel(d) + ", " + d.status + (d.money_kind === "promise" ? (d.contingent ? ", a contingent promise" : ", a promise") : "") + ")";
    });
    card.appendChild(h("p", { text: "On paper: " + sentences.join("; ") + "." }));
    card.appendChild(h("p", { text: moneyText(money(p.deals)) + " Each one's health feeds the other's through " + p.score + " different doors." }));
    card.appendChild(h("p", { "class": "c7-note", text: "Our data holds only deals we could source. Ties that aren't in it, such as ordinary chip sales, aren't counted here." }));
    cbox.appendChild(card);
  });
  var no = pairOf("nvidia", "openai");
  if (no && no.score < 3) {
    var c2 = h("article", { "class": "c7-card" });
    c2.appendChild(h("h4", { text: "Also worth a look: " + nm(no.a) + " and " + nm(no.b) }));
    c2.appendChild(h("p", { text: "Only " + no.score + " distinct role" + (no.score === 1 ? "" : "s") + " show up in our deal list, but the amounts tell a story: " + no.deals.map(function (d) { return TYPE[d.type].s(nm(d.from), nm(d.to)) + " (" + amountLabel(d) + ", " + d.status + ")"; }).join("; ") + ". The gap between headline and actual is the point." }));
    cbox.appendChild(c2);
  }

  /* ---------- controls ---------- */
  root.querySelectorAll("[data-sort]").forEach(function (b) {
    b.addEventListener("click", function () {
      st.sort = b.getAttribute("data-sort");
      root.querySelectorAll("[data-sort]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      build(); buildList();
    });
  });
  slot("onlytangled").addEventListener("change", function (e) { st.only3 = e.target.checked; build(); buildList(); });

  var ft = slot("fulltoggle"), full = slot("full");
  ft.addEventListener("click", function () {
    var open = full.hidden;
    full.hidden = !open;
    ft.setAttribute("aria-expanded", String(open));
    ft.textContent = open ? "Hide the full grid and pair list" : "Show every pair (grid and list)";
  });

  build(); buildList();
};
