Chapters["02"] = function (root, ctx) {
  var D = ctx.data;
  var NS = "http://www.w3.org/2000/svg";
  var $ = function (sel) { return root.querySelector(sel); };
  var slot = function (n) { return root.querySelector('[data-slot="' + n + '"]'); };

  /* ---------- helpers ---------- */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "text") e.textContent = attrs[k]; else if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function s(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) { if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function fmtB(n) {
    if (n == null) return null;
    if (n === 0) return "$0";
    if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(2).replace(/\.?0+$/, "") + "T";
    var t = Math.abs(n) < 1 ? n.toFixed(2) : n.toFixed(2).replace(/\.?0+$/, "");
    return "$" + t + "B";
  }
  function range(lo, hi) {
    if (lo == null && hi == null) return null;
    if (lo == null) return "up to " + fmtB(hi);
    if (hi == null) return fmtB(lo) + " or more";
    if (lo === hi) return fmtB(lo);
    return fmtB(lo) + " to " + fmtB(hi);
  }
  var TYPES = {
    equity:           { label: "Equity",           g: "E", dash: "",              out: "Invests in",          inn: "Takes equity from" },
    debt:             { label: "Debt",             g: "D", dash: "",              out: "Lends to",            inn: "Borrows from" },
    compute_contract: { label: "Compute contract", g: "C", dash: "9 5",           out: "Customer of",         inn: "Supplier to" },
    chip_purchase:    { label: "Chip purchase",    g: "$", dash: "2 5",           out: "Buys chips from",     inn: "Sells chips to" },
    backstop:         { label: "Backstop",         g: "B", dash: "14 4 2 4",      out: "Backstops",           inn: "Backstopped by" },
    guarantee:        { label: "Guarantee",        g: "G", dash: "14 4 2 4 2 4",  out: "Guarantees for",      inn: "Guaranteed by" },
    warrant:          { label: "Warrant",          g: "W", dash: "1 6",           out: "Grants warrants to",  inn: "Holds warrants from" },
    lease:            { label: "Lease",            g: "L", dash: "6 3 1 3",       out: "Leases from",         inn: "Leases to" },
    revenue_share:    { label: "Revenue share",    g: "R", dash: "10 3 3 3",      out: "Shares revenue with", inn: "Gets revenue share from" },
    loi:              { label: "Letter of intent", g: "?", dash: "4 8",           out: "LOI to fund",         inn: "LOI from" }
  };
  var KINDS = {
    external: { label: "External cash", note: "from customers, lenders or outside investors" },
    recycled: { label: "Recycled cash", note: "returns to a loop participant" },
    promise:  { label: "Promise",       note: "not cash" },
    mixed: { label: "Mixed round", note: "one line holding both vendor money and outside money, shown as a split and never added to the cash totals" },
    outside_loop_investment: { label: "Outside-loop investment", note: "a stake in a company outside the loop: not external cash, not recycled" }
  };
  var LAYERS = [
    { id: "supply", label: "Chips and supply" },
    { id: "neocloud", label: "Neoclouds and hosts" },
    { id: "hyperscaler", label: "Hyperscalers" },
    { id: "lab", label: "AI labs" },
    { id: "capital", label: "Capital" }
  ];
  var nodes = {}, nodeList = D.entities.nodes;
  nodeList.forEach(function (n) { nodes[n.id] = n; });
  var deals = D.deals.deals.filter(function (d) { return nodes[d.from] && nodes[d.to]; });
  /* The kind of money is read from the data. A stake in a company that is not part of the loop is never external cash and never recycled,
     whether the data says so with money_kind 'outside_loop_investment' or only with loop_edge:false on a cash deal. */
  function kindOf(d) {
    if (d.money_kind === "outside_loop_investment") return "outside_loop_investment";
    if (d.money_kind !== "promise" && d.loop_edge === false) return "outside_loop_investment";
    return d.money_kind;
  }
  function kindInfo(k) { return KINDS[k] || { label: String(k).replace(/_/g, " "), note: "" }; }
  function isCashKind(k) { return k === "external" || k === "recycled"; }
  function movesCash(k) { return isCashKind(k) || k === "mixed"; }
  deals.forEach(function (d) { d._k = kindOf(d); });
  var dealById = {};
  deals.forEach(function (d) { dealById[d.id] = d; });
  var linked = {};
  deals.forEach(function (d) { (linked[d.from] = linked[d.from] || []).push(d); (linked[d.to] = linked[d.to] || []).push(d); });
  function name(id) { return nodes[id] ? nodes[id].name : id; }
  // mixed rounds: name the participants from the data instead of the generic aggregate node
  function endName(d, id) {
    if (d._k === "mixed" && Array.isArray(d.parties)) {
      var ps = d.parties.filter(function (x) { return x !== d.to; }).map(function (x) { return x === "investors_other" ? "other investors" : name(x); });
      return "Mixed round: " + ps.join(", ");
    }
    return name(id);
  }
  function kindSuffix(d) { return d._k === "promise" ? " (promise)" : d._k === "mixed" ? " (mixed round)" : d._k === "outside_loop_investment" ? " (outside-loop stake)" : ""; }

  var state = { types: {}, kinds: {}, q: "", focus: null, sel: null, paused: false };
  Object.keys(TYPES).forEach(function (t) { state.types[t] = true; });
  Object.keys(KINDS).forEach(function (k) { state.kinds[k] = true; });
  deals.forEach(function (d) { state.kinds[d._k] = true; });
  state.sel = dealById["nvda-openai-loi"] ? "nvda-openai-loi" : null;

  /* ---------- header counts (from data) ---------- */
  var cash = deals.filter(function (d) { return isCashKind(d._k); }).length;
  var mixN = deals.filter(function (d) { return d._k === "mixed"; }).length;
  var outs = deals.filter(function (d) { return d._k === "outside_loop_investment"; }).length;
  var prom = deals.filter(function (d) { return d._k === "promise"; }).length;
  var withEdges = nodeList.filter(function (n) { return linked[n.id]; }).length;
  slot("counts").textContent = withEdges + " parties, " + deals.length + " deal lines: " + cash + " are cash inside the loop (equity or debt), " + prom + " are promises" + (mixN ? ", " + mixN + (mixN === 1 ? " is a mixed round" : " are mixed rounds") + " holding both vendor and outside money" : "") + (outs ? ", and " + outs + (outs === 1 ? " is a stake" : " are stakes") + " in companies outside the loop" : "") + ". The counts come straight from the data. Click a company to focus on it, click a line for the fine print.";

  /* ---------- layout ---------- */
  var ZW = 190, ZG = 50, X0 = 10, NW = 150, NH = 34, ROW = 44, TOP = 46;
  var pos = {};
  var svg = slot("svg");
  var gZones = s("g"), gEdges = s("g"), gNodes = s("g");
  svg.appendChild(gZones); svg.appendChild(gEdges); svg.appendChild(gNodes);
  var maxRows = 0;
  LAYERS.forEach(function (L, i) {
    var ns = nodeList.filter(function (n) { return n.layer === L.id; });
    ns.sort(function (a, b) {
      var da = (linked[a.id] || []).length, db = (linked[b.id] || []).length;
      return (a.extra_node ? 1 : 0) - (b.extra_node ? 1 : 0) || db - da || a.name.localeCompare(b.name);
    });
    maxRows = Math.max(maxRows, ns.length);
    var zx = X0 + i * (ZW + ZG);
    L.zx = zx; L.n = ns.length;
    ns.forEach(function (n, j) { pos[n.id] = { x: zx + (ZW - NW) / 2, y: TOP + j * ROW, w: NW, h: NH, col: i }; });
  });
  var H = TOP + maxRows * ROW + 14;
  svg.setAttribute("viewBox", "0 0 1230 " + H);
  LAYERS.forEach(function (L) {
    gZones.appendChild(s("g", { "class": "c2-zone" }, [
      s("rect", { x: L.zx, y: 6, width: ZW, height: H - 12, rx: 14 }),
      s("text", { x: L.zx + 14, y: 28, text: L.label })
    ]));
  });

  /* ---------- edges ---------- */
  var pairIdx = {};
  deals.forEach(function (d) {
    var k = [d.from, d.to].sort().join("|");
    (pairIdx[k] = pairIdx[k] || []).push(d.id);
  });
  var edgeEls = {};
  function geom(d) {
    var a = pos[d.from], b = pos[d.to];
    var k = [d.from, d.to].sort().join("|"), arr = pairIdx[k];
    var off = (arr.indexOf(d.id) - (arr.length - 1) / 2) * 7;
    var x1, x2, y1 = a.y + a.h / 2 + off, y2 = b.y + b.h / 2 + off, p;
    if (a.col === b.col) {
      x1 = a.x + a.w; x2 = b.x + b.w;
      var bulge = 38 + Math.min(60, Math.abs(y2 - y1) * 0.25);
      p = ["M", x1, y1, "C", x1 + bulge, y1, x2 + bulge, y2, x2, y2];
      return { d: p.join(" "), mx: (x1 + 3 * (x1 + bulge) + 3 * (x2 + bulge) + x2) / 8, my: (y1 + y2) / 2 };
    }
    if (a.col < b.col) { x1 = a.x + a.w; x2 = b.x; } else { x1 = a.x; x2 = b.x + b.w; }
    var dx = Math.max(50, Math.abs(x2 - x1) * 0.5) * (x2 > x1 ? 1 : -1);
    p = ["M", x1, y1, "C", x1 + dx, y1, x2 - dx, y2, x2, y2];
    return { d: p.join(" "), mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
  }
  function amountLabel(d) {
    var hd = d.headline_usd_b != null ? fmtB(d.headline_usd_b) : "amount not disclosed";
    var ac = range(d.actual_usd_b_low, d.actual_usd_b_high);
    return hd + (ac && ac !== hd ? ", actual " + ac : "");
  }
  deals.forEach(function (d) {
    var T = TYPES[d.type] || { label: d.type, g: "·", dash: "3 3" };
    var g = geom(d);
    var wd = d.headline_usd_b ? 1.6 + 3 * Math.sqrt(Math.min(d.headline_usd_b, 500) / 500) : 1.6;
    var grp = s("g", {
      "class": "c2-e k-" + d._k + " t-" + d.type, tabindex: "0", role: "button",
      "aria-label": name(d.from) + " to " + name(d.to) + ", " + T.label + ", " + kindInfo(d._k).label + ", " + amountLabel(d) + ", status " + d.status
    });
    var vis = s("path", { "class": "vis", d: g.d, "stroke-width": wd.toFixed(2) });
    if (d._k === "promise") vis.setAttribute("stroke-dasharray", T.dash || "6 4");
    else if (d._k === "outside_loop_investment") vis.setAttribute("stroke-dasharray", "1 5");
    var vis2 = d._k === "mixed" ? s("path", { "class": "vis2", d: g.d, "stroke-width": wd.toFixed(2), "stroke-dasharray": "7 7" }) : null;
    var hit = s("path", { "class": "hit", d: g.d });
    var gl = s("g", { "class": "glyph", transform: "translate(" + g.mx.toFixed(1) + "," + g.my.toFixed(1) + ")" }, [s("circle", { r: 8 }), s("text", { text: T.g })]);
    grp.appendChild(hit); grp.appendChild(vis); if (vis2) grp.appendChild(vis2); grp.appendChild(gl);
    if (!ctx.reducedMotion && movesCash(d._k)) {
      var dur = 3.2 + (d.id.length % 7) * 0.4;
      var pulse = s("circle", { "class": "c2-pulse", r: 3.6 });
      var am = s("animateMotion", { dur: dur + "s", repeatCount: "indefinite", path: g.d, begin: "-" + ((d.id.charCodeAt(0) % 9) * 0.37).toFixed(2) + "s" });
      pulse.appendChild(am); grp.appendChild(pulse);
    }
    grp.addEventListener("click", function () { selectEdge(d.id, true); });
    grp.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); selectEdge(d.id, true); } });
    gEdges.appendChild(grp);
    edgeEls[d.id] = grp;
  });

  /* ---------- nodes ---------- */
  var nodeEls = {};
  nodeList.forEach(function (n) {
    var p = pos[n.id]; if (!p) return;
    var cnt = (linked[n.id] || []).length;
    var vis = (n.name.length > 20 ? n.name.slice(0, 19) + "…" : n.name) + " " + (cnt ? (n.ticker ? n.ticker + " · " : "") + cnt + (cnt === 1 ? " line" : " lines") : (n.ticker ? n.ticker + " · " : "") + "no deal lines");
    var g = s("g", {
      "class": "c2-node" + (n.extra_node ? " helper" : ""), tabindex: "0", role: "button", "aria-pressed": "false",
      "aria-label": vis + ". Press to focus on " + n.name + ".", transform: "translate(" + p.x + "," + p.y + ")"
    });
    g.appendChild(s("rect", { width: p.w, height: p.h, rx: 9 }));
    g.appendChild(s("text", { x: 10, y: 15, text: (n.name.length > 20 ? n.name.slice(0, 19) + "…" : n.name) + " " }));
    g.appendChild(s("text", { "class": "sub", x: 10, y: 28, text: cnt ? (n.ticker ? n.ticker + " · " : "") + cnt + (cnt === 1 ? " line" : " lines") : (n.ticker ? n.ticker + " · " : "") + "no deal lines" }));
    if (!cnt) g.querySelector("text.sub").setAttribute("y", 28);
    g.addEventListener("click", function (ev) { ev.stopPropagation(); setFocus(state.focus === n.id ? null : n.id); });
    g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setFocus(state.focus === n.id ? null : n.id); } });
    gNodes.appendChild(g);
    nodeEls[n.id] = g;
  });
  svg.addEventListener("click", function (ev) { if (ev.target === svg) setFocus(null); });
  root.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { state.sel = null; setFocus(null); } });

  /* ---------- filter chips ---------- */
  function sampleLine(t, kind) {
    var T = TYPES[t];
    var colors = { external: "var(--c-external,#f0a32e)", recycled: "var(--c-recycled,#3bc4f2)", promise: "var(--c-promise,#9a7df0)" };
    var isCash = t === "equity" || t === "debt";
    var col = t === "debt" ? "var(--c-debt,#ff5a36)" : isCash ? "var(--c-recycled,#3bc4f2)" : colors.promise;
    var l = s("line", { x1: 2, y1: 5, x2: 28, y2: 5, stroke: col, "stroke-width": 3, "stroke-linecap": "round", opacity: isCash ? 1 : 0.6 });
    if (T.dash) l.setAttribute("stroke-dasharray", T.dash);
    return s("svg", { viewBox: "0 0 30 10", "aria-hidden": "true" }, [l]);
  }
  var typeChips = slot("typechips");
  Object.keys(TYPES).forEach(function (t) {
    if (!deals.some(function (d) { return d.type === t; })) return;
    var n = deals.filter(function (d) { return d.type === t; }).length;
    var b = h("button", { type: "button", "class": "c2-chip", "aria-pressed": "true", title: TYPES[t].label + (t === "equity" || t === "debt" ? " (cash)" : " (a promise, not cash)") });
    b.appendChild(sampleLine(t));
    b.appendChild(document.createTextNode(TYPES[t].g + " " + TYPES[t].label + " " + n));
    b.addEventListener("click", function () { state.types[t] = !state.types[t]; b.setAttribute("aria-pressed", String(state.types[t])); refresh(); });
    typeChips.appendChild(b);
  });
  var kindChips = slot("kindchips");
  ["external", "recycled", "mixed", "promise", "outside_loop_investment"].forEach(function (k) {
    if (!deals.some(function (d) { return d._k === k; })) return;
    var b = h("button", { type: "button", "class": "c2-chip", "aria-pressed": "true", title: KINDS[k].note });
    var dot = k === "mixed" ? s("circle", { cx: 5, cy: 5, r: 3.6, fill: "var(--c-external,#f0a32e)", stroke: "var(--c-recycled,#3bc4f2)", "stroke-width": 1.6, "stroke-dasharray": "2.4 2" }) : s("circle", { cx: 5, cy: 5, r: 4, fill: k === "external" ? "var(--c-external,#f0a32e)" : k === "recycled" ? "var(--c-recycled,#3bc4f2)" : "none", stroke: k === "promise" ? "var(--c-promise,#9a7df0)" : k === "outside_loop_investment" ? "#8fa3c7" : "none", "stroke-width": k === "outside_loop_investment" ? 1.5 : 1, "stroke-dasharray": k === "promise" ? "2 2" : k === "outside_loop_investment" ? "1 2" : "" });
    b.appendChild(s("svg", { viewBox: "0 0 10 10", style: "width:12px;height:12px", "aria-hidden": "true" }, [dot]));
    b.appendChild(document.createTextNode(KINDS[k].label));
    b.addEventListener("click", function () { state.kinds[k] = !state.kinds[k]; b.setAttribute("aria-pressed", String(state.kinds[k])); refresh(); });
    kindChips.appendChild(b);
  });
  var search = slot("search");
  search.addEventListener("input", function () { state.q = search.value.trim().toLowerCase(); refresh(); });
  root.querySelectorAll("[data-view]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-view");
      root.setAttribute("data-view", v);
      root.querySelectorAll("[data-view]").forEach(function (x) { x.hidden = x.getAttribute("data-view") === v; });
      var open = v === "list", btn = root.querySelector('[data-view="' + (open ? "map" : "list") + '"]');
      if (btn && btn.focus) btn.focus();
    });
  });
  var pauseBtn = slot("pause");
  if (ctx.reducedMotion) pauseBtn.hidden = true;
  pauseBtn.addEventListener("click", function () {
    state.paused = !state.paused; pauseBtn.setAttribute("aria-pressed", String(state.paused));
    pauseBtn.textContent = state.paused ? "Resume pulses" : "Pause pulses";
    applyPause();
  });
  function applyPause() { try { if (state.paused || ctx.reducedMotion) svg.pauseAnimations(); else svg.unpauseAnimations(); } catch (e) {} }
  if (ctx.reducedMotion) applyPause();
  else if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (state.paused) return; try { e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations(); } catch (x) {} }); }).observe(svg);
  }
  slot("clear").addEventListener("click", function () { state.sel = null; search.value = ""; state.q = ""; setFocus(null); });
  slot("caption").textContent = "Solid lines are cash. Dashed lines are promises. Amber-and-blue striped lines are mixed rounds (vendor and outside money together). Fine dotted grey lines are stakes in companies outside the loop. Letter dots mark the deal type. Line thickness follows the headline amount, not the actual one. Pulses run only along cash lines, because a promise doesn't move anything yet.";
  ctx.legend(slot("legend"), { extended: true });

  /* ---------- visibility ---------- */
  function haystack(d) { return (name(d.from) + " " + name(d.to) + " " + d.id + " " + d.type + " " + (d.structure || "") + " " + (ctx.readerNote(d) || "")).toLowerCase(); }
  function nameMatch(id) { return state.q && name(id).toLowerCase().indexOf(state.q) >= 0; }
  function edgeVisible(d) {
    if (!state.types[d.type] || !state.kinds[d._k]) return false;
    if (!state.q) return true;
    return nameMatch(d.from) || nameMatch(d.to) || haystack(d).indexOf(state.q) >= 0;
  }
  function connectedTo(id, d) { return d.from === id || d.to === id; }

  function refresh() {
    var f = state.focus, vis = {}, anyVis = {};
    deals.forEach(function (d) {
      var v = edgeVisible(d); vis[d.id] = v;
      if (v) { anyVis[d.from] = true; anyVis[d.to] = true; }
      var el = edgeEls[d.id];
      el.classList.toggle("is-off", !v);
      el.classList.toggle("is-dim", !!(f && !connectedTo(f, d)));
      el.classList.toggle("is-sel", state.sel === d.id);
      el.setAttribute("aria-pressed", String(state.sel === d.id));
      el.setAttribute("tabindex", v ? "0" : "-1");
    });
    var nb = {};
    if (f) { nb[f] = 1; (linked[f] || []).forEach(function (d) { if (vis[d.id]) { nb[d.from] = 1; nb[d.to] = 1; } }); }
    nodeList.forEach(function (n) {
      var el = nodeEls[n.id]; if (!el) return;
      el.classList.toggle("is-focus", f === n.id);
      el.classList.toggle("is-dim", !!(f && !nb[n.id]));
      el.classList.toggle("is-quiet", !f && !anyVis[n.id] && !nameMatch(n.id));
      el.classList.toggle("is-match", nameMatch(n.id));
      el.setAttribute("aria-pressed", String(f === n.id));
    });
    // list view
    root.querySelectorAll(".c2-le").forEach(function (le) { le.hidden = !vis[le.getAttribute("data-deal")]; });
    root.querySelectorAll(".c2-co").forEach(function (co) {
      var id = co.getAttribute("data-co");
      co.hidden = !(linked[id] || []).some(function (d) { return vis[d.id]; });
      co.classList.toggle("is-focus", f === id);
    });
    renderPanel();
  }

  function setFocus(id) {
    state.focus = id;
    refresh();
    if (id) { var co = root.querySelector('.c2-co[data-co="' + id + '"]'); if (co && window.innerWidth <= 700) co.open = true; }
  }
  function selectEdge(id, fromUser) {
    state.sel = id;
    refresh();
    if (fromUser && window.innerWidth <= 1000 && window.innerWidth > 700) { var p = slot("panel"); if (p.scrollIntoView) p.scrollIntoView({ block: "nearest", behavior: ctx.reducedMotion ? "auto" : "smooth" }); }
  }

  /* ---------- the Nvidia-OpenAI letter of intent, read from the data ---------- */
  function edgeCaption(d) {
    if (!d || d.id !== "nvda-openai-loi") return null;
    var eq = dealById["nvda-openai-equity"];
    if (d.headline_usd_b == null || !eq || eq.actual_usd_b_high == null) return null;
    return "The up-to-" + fmtB(d.headline_usd_b) + " letter of intent was replaced by about " + fmtB(eq.actual_usd_b_high) + " of actual equity.";
  }
  (function () { var c = edgeCaption(dealById["nvda-openai-loi"]), n = slot("edgecap"); if (c) n.textContent = "Nvidia to OpenAI: " + c; else n.hidden = true; })();

  /* ---------- detail builders ---------- */
  function detailEl(d) {
    var T = TYPES[d.type] || { label: d.type };
    var box = h("div", { "class": "c2-detail" });
    /* only explicit placements list participants; only an explicit `includes` list prints "Includes" lines */
    var parts = d.placement === true && Array.isArray(d.parties) ? d.parties.filter(function (x) { return nodes[x] && x !== d.to; }) : [];
    box.appendChild(h("h3", { text: (d._k === "mixed" ? "Mixed round" : parts.length ? "Placement participants" : name(d.from)) + " → " + name(d.to) }));
    if (parts.length) box.appendChild(h("p", { "class": "c2-note", text: "Participants named in our data: " + parts.map(name).join(", ") + "." }));
    (Array.isArray(d.includes) ? d.includes : []).forEach(function (id) {
      var x = dealById[id];
      if (x && x.headline_usd_b != null) box.appendChild(h("p", { "class": "c2-note", text: "Includes " + name(x.from) + "’s " + fmtB(x.headline_usd_b) + " (shown on its own line, so it is not added again)." }));
    });
    var line = h("p");
    line.appendChild(h("span", { "class": "c2-pill k-" + d._k, text: kindInfo(d._k).label }));
    line.appendChild(document.createTextNode(" " + T.label + " · "));
    line.appendChild(ctx.tag(d.status));
    box.appendChild(line);

    var hd = d.headline_usd_b != null ? fmtB(d.headline_usd_b) : null;
    var ac = range(d.actual_usd_b_low, d.actual_usd_b_high);
    var amt = h("div", { "class": "c2-amt" });
    if (hd && ac && hd !== ac) {
      amt.appendChild(document.createTextNode("Headline " + hd));
      amt.appendChild(h("small", { text: "Actual so far: " + ac + (d._k === "promise" ? " (a promise, not cash moved)" : "") }));
    } else if (hd) {
      amt.appendChild(document.createTextNode(hd));
      amt.appendChild(h("small", { text: ac ? "Headline and actual agree" : "Actual amount not established in our sources" }));
    } else if (ac) {
      amt.appendChild(document.createTextNode("Actual " + ac));
      amt.appendChild(h("small", { text: "No headline figure announced" }));
    } else {
      amt.appendChild(document.createTextNode("Amount not disclosed"));
      amt.appendChild(h("small", { text: "We found the deal but no figure we can stand behind" }));
    }
    box.appendChild(amt);
    if (Array.isArray(d.components) && d.components.length) {
      var cul = h("ul", { "class": "c2-split" });
      d.components.forEach(function (x) { var li2 = h("li", { text: x.label + " " + fmtB(x.usd_b) + " " }); li2.appendChild(ctx.tag(x.status)); cul.appendChild(li2); });
      box.appendChild(h("p", { "class": "c2-note", text: "The headline is our sum" + (d.formula_text ? " (" + d.formula_text + ")" : "") + ", not a figure the companies state. The parts:" }));
      box.appendChild(cul);
    }
    if (Array.isArray(d.alt_reports) && d.alt_reports.length) {
      var aul = h("ul", { "class": "c2-split" });
      d.alt_reports.forEach(function (x) { var li3 = h("li", { text: x.label + " " }); li3.appendChild(ctx.tag(x.status)); aul.appendChild(li3); });
      box.appendChild(h("p", { "class": "c2-note", text: "Sources differ on the later figure:" }));
      box.appendChild(aul);
    }
    if (d._k === "mixed") {
      var split = Array.isArray(d.money_split) ? d.money_split : [];
      box.appendChild(h("p", { "class": "c2-note", text: "A mixed round: one headline line that holds both vendor money and outside money. It is shown as a split and is never added to the cash totals, so nothing is counted twice." }));
      if (split.length) {
        var sul = h("ul", { "class": "c2-split" });
        split.forEach(function (x) { sul.appendChild(h("li", { text: (kindInfo(x.kind).label) + " " + (fmtB(x.usd_b) || "") + (x.label ? ": " + x.label : "") })); });
        box.appendChild(sul);
      }
    }
    if (d.contingent && d._k === "promise") box.appendChild(h("p", { "class": "c2-note", text: d.type === "equity" ? "A contingent purchase, not cash moved: it closes only if a stated condition is met." : "Contingent: it depends on a stated condition, so it is a promise, not cash moved." }));
    if (d._k === "outside_loop_investment") box.appendChild(h("p", { "class": "c2-note", text: "This is a stake in a company that is not part of the loop. It is the chipmaker's own cash going out, so we count it as neither external cash nor recycled cash, and it is left out of the loop totals." }));
    else if (d.sum_exclude) box.appendChild(h("p", { "class": "c2-note", text: "This line is an aggregate or sits outside the customer loop, so we leave it out of every total." }));
    var cap = edgeCaption(d); if (cap) box.appendChild(h("p", { "class": "c2-edgecap-in", text: cap }));

    var kv = h("dl", { "class": "c2-kv" });
    kv.appendChild(h("dt", { text: "Date" })); kv.appendChild(h("dd", { text: d.date || "unknown" }));
    var st = ctx.clean(d.structure);
    kv.appendChild(h("dt", { text: "Structure" })); kv.appendChild(h("dd", { text: st ? ctx.terms(st) : "not described" }));
    box.appendChild(kv);
    var wc = ctx.clean(d.what_changed_since_announcement);
    box.appendChild(h("h4", { text: "What changed since announced" }));
    box.appendChild(h("p", { text: wc ? ctx.terms(wc) : "Nothing we can document." }));
    var rn = ctx.readerNote(d);
    if (rn) { box.appendChild(h("h4", { text: "In plain terms" })); box.appendChild(h("p", { "class": "c2-note", text: ctx.terms(rn) })); }
    box.appendChild(h("h4", { text: "Sources" }));
    var ul = h("ul", { "class": "c2-srcs" });
    (d.source_ids || []).forEach(function (id) { var li = h("li"); li.appendChild(ctx.sourceLink(id)); ul.appendChild(li); });
    if (!(d.source_ids || []).length) ul.appendChild(h("li", { text: "none listed" }));
    box.appendChild(ul);
    return box;
  }

  function sumSet(list) {
    var o = { n: 0, head: 0, lo: 0, hi: 0, hUnk: 0, aUnk: 0 };
    list.forEach(function (d) {
      o.n++;
      if (d.headline_usd_b == null) o.hUnk++; else o.head += d.headline_usd_b;
      var lo = d.actual_usd_b_low, hi = d.actual_usd_b_high;
      if (lo == null && hi == null) o.aUnk++; else { o.lo += lo != null ? lo : hi; o.hi += hi != null ? hi : lo; }
    });
    return o;
  }
  function sumText(o) {
    if (!o.n) return "none";
    var parts = ["headline " + fmtB(+o.head.toFixed(2)) + (o.hUnk ? " (+" + o.hUnk + " undisclosed)" : "")];
    var knownA = o.n - o.aUnk;
    parts.push(knownA ? "actual " + (o.lo === o.hi ? fmtB(+o.lo.toFixed(2)) : fmtB(+o.lo.toFixed(2)) + " to " + fmtB(+o.hi.toFixed(2))) + (o.aUnk ? " (+" + o.aUnk + " unknown)" : "") : "actual unknown");
    return parts.join("; ") + " · " + o.n + (o.n === 1 ? " deal" : " deals");
  }
  function totalsTable(id) {
    var mine = (linked[id] || []).filter(function (d) { return d._k === "outside_loop_investment" || !d.sum_exclude; });
    mine = mine.filter(function (d) { return d._k !== "mixed"; });
    var excl = (linked[id] || []).length - mine.length;
    var tbl = h("table", { "class": "c2-tot" });
    var hdr = h("tr"); ["", "Out of " + name(id), "Into " + name(id)].forEach(function (t) { hdr.appendChild(h("th", { text: t, scope: "col" })); });
    tbl.appendChild(h("thead", null, [hdr]));
    var tb = h("tbody");
    var rowsDef = [["external", "External cash"], ["recycled", "Recycled cash"], ["outside_loop_investment", "Outside-loop investment (not cash from or to the loop)"], ["promise", "Promises (not cash)"]];
    rowsDef = rowsDef.filter(function (k) { return k[0] !== "outside_loop_investment" || mine.some(function (d) { return d._k === k[0]; }); });
    rowsDef.forEach(function (k) {
      var tr = h("tr", { "class": k[0] === "promise" ? "promise" : "" });
      tr.appendChild(h("th", { text: k[1], scope: "row" }));
      tr.appendChild(h("td", { text: sumText(sumSet(mine.filter(function (d) { return d.from === id && d._k === k[0]; }))) }));
      tr.appendChild(h("td", { text: sumText(sumSet(mine.filter(function (d) { return d.to === id && d._k === k[0]; }))) }));
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    return { el: tbl, excl: excl };
  }
  function rolesList(id) {
    var out = {}, inn = {};
    (linked[id] || []).forEach(function (d) {
      var T = TYPES[d.type]; if (!T) return;
      if (d.from === id) (out[d.type] = out[d.type] || []).push(d.to);
      if (d.to === id) (inn[d.type] = inn[d.type] || []).push(d.from);
    });
    var ul = h("ul", { "class": "c2-conn" });
    Object.keys(TYPES).forEach(function (t) {
      [[out, "out"], [inn, "inn"]].forEach(function (pr) {
        var arr = pr[0][t]; if (!arr) return;
        var uniq = arr.filter(function (x, i) { return arr.indexOf(x) === i; }).map(name);
        var isP = !(t === "equity" || t === "debt");
        ul.appendChild(h("li", { text: TYPES[t][pr[1]] + ": " + uniq.join(", ") + (isP ? " (promise)" : "") }));
      });
    });
    return ul;
  }
  function focusSection(id) {
    var n = nodes[id], sec = h("div", { "class": "c2-sec" });
    sec.appendChild(h("h3", { text: n.name + (n.ticker ? " (" + n.ticker + ")" : "") }));
    var L = LAYERS.filter(function (x) { return x.id === n.layer; })[0];
    sec.appendChild(h("p", { "class": "c2-note", text: (L ? L.label : n.layer) + (n.extra_node ? " · helper node (a group or vehicle, not a company we profile)" : "") }));
    if (!(linked[id] || []).length) { sec.appendChild(h("p", { text: "No deal lines for this name in our dataset. That's a gap in what we've sourced, not a statement that none exist." })); return sec; }
    sec.appendChild(h("h4", { text: "Roles in the data" }));
    sec.appendChild(rolesList(id));
    sec.appendChild(h("h4", { text: "Money in and out" }));
    var t = totalsTable(id);
    sec.appendChild(t.el);
    sec.appendChild(h("p", { "class": "c2-note", text: "Cash, outside-loop stakes and promises sit on separate rows and are never added together. Headline and actual are summed on their own and mix dates and scopes, so treat them as scale only." + (t.excl ? " " + t.excl + " aggregate or non-loop line" + (t.excl > 1 ? "s" : "") + " left out." : "") }));
    var mixedHere = (linked[id] || []).filter(function (d) { return d._k === "mixed"; });
    mixedHere.forEach(function (d) {
      var parts = (Array.isArray(d.money_split) ? d.money_split : []).map(function (x) { return kindInfo(x.kind).label.toLowerCase() + " " + fmtB(x.usd_b); }).join(" and ");
      sec.appendChild(h("p", { "class": "c2-note", text: "Mixed round touching " + n.name + ": " + name(d.from) + " to " + name(d.to) + ", headline " + (fmtB(d.headline_usd_b) || "undisclosed") + (parts ? ", of which " + parts : "") + ". Shown on its own and never added to the rows above." }));
    });
    sec.appendChild(h("h4", { text: "Connections (press to open)" }));
    var ul = h("ul", { "class": "c2-conn" });
    (linked[id] || []).slice().sort(function (a, b) { return (b.headline_usd_b || 0) - (a.headline_usd_b || 0); }).forEach(function (d) {
      var other = d.from === id ? d.to : d.from;
      var b = h("button", { type: "button", "class": edgeVisible(d) ? "" : "is-off", text: (d.from === id ? "→ " : "← ") + endName(d, other) + " · " + (TYPES[d.type] ? TYPES[d.type].label : d.type) + " · " + amountLabel(d) + (d._k === "promise" ? " (promise)" : d._k === "mixed" ? " (mixed round)" : d._k === "outside_loop_investment" ? " (outside-loop stake)" : "") });
      b.addEventListener("click", function () { selectEdge(d.id, false); });
      ul.appendChild(h("li", null, [b]));
    });
    sec.appendChild(ul);
    return sec;
  }
  function renderPanel() {
    var p = slot("panel"); p.textContent = "";
    if (state.focus) p.appendChild(focusSection(state.focus));
    if (state.sel && dealById[state.sel]) { var sec = h("div", { "class": "c2-sec" }); sec.appendChild(detailEl(dealById[state.sel])); p.appendChild(sec); }
    if (!state.focus && !state.sel) p.appendChild(h("p", { "class": "c2-note", text: "Click a line to see its amount, date, status and sources. Click a company to dim everything it isn't connected to and see its money in and out." }));
  }

  /* ---------- list view (mobile default) ---------- */
  var list = slot("list"); list.hidden = false;
  var order = nodeList.filter(function (n) { return linked[n.id]; }).sort(function (a, b) {
    var la = LAYERS.map(function (x) { return x.id; }).indexOf(a.layer), lb = LAYERS.map(function (x) { return x.id; }).indexOf(b.layer);
    return la - lb || (linked[b.id].length - linked[a.id].length) || a.name.localeCompare(b.name);
  });
  order.forEach(function (n) {
    var co = h("details", { "class": "c2-co", "data-co": n.id });
    var L = LAYERS.filter(function (x) { return x.id === n.layer; })[0];
    co.appendChild(h("summary", null, [n.name, h("small", { text: (L ? L.label : "") + " · " + linked[n.id].length + " lines" })]));
    var body = h("div", { "class": "c2-co-body" });
    var sum = h("div", { "class": "c2-sec" });
    sum.appendChild(rolesList(n.id));
    var t = totalsTable(n.id); sum.appendChild(t.el);
    sum.appendChild(h("p", { "class": "c2-note", text: "Cash, outside-loop stakes and promises are shown separately and never added together." }));
    body.appendChild(sum);
    linked[n.id].slice().sort(function (a, b) { return (b.headline_usd_b || 0) - (a.headline_usd_b || 0); }).forEach(function (d) {
      var other = d.from === n.id ? d.to : d.from;
      var le = h("details", { "class": "c2-le k-" + d._k, "data-deal": d.id });
      le.appendChild(h("summary", { text: (d.from === n.id ? "→ " : "← ") + endName(d, other) + " · " + (TYPES[d.type] ? TYPES[d.type].label : d.type) + " · " + amountLabel(d) + kindSuffix(d) }));
      var filled = false;
      le.addEventListener("toggle", function () { if (le.open && !filled) { filled = true; le.appendChild(detailEl(d)); } });
      body.appendChild(le);
    });
    co.appendChild(body);
    list.appendChild(co);
  });

  var startView = window.innerWidth <= 700 ? "list" : "map";
  root.setAttribute("data-view", startView);
  root.querySelectorAll("[data-view]").forEach(function (x) { x.hidden = x.getAttribute("data-view") === startView; });
  refresh();
};
