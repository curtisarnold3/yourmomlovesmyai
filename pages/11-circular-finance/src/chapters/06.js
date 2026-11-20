Chapters["06"] = function (root, ctx) {
  var M = ctx.M;
  var q = function (s) { return root.querySelector(s); };
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (k === "text") el.textContent = attrs[k]; else el.setAttribute(k, attrs[k]); });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null) continue; el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }
    return el;
  }
  // Fallback copy of the few facts this chapter reads (from data/source-claims.json + research files).
  // runtime does not yet pass source-claims into ctx.data; when ctx.data.facts exists it wins.
  var FB = {"openai-runrate":{"label":"OpenAI annualized revenue","value":50,"unit":"USD B","period":"end Sep 2026","status":"reported","source_ids":["s_3c1e62d5","s_83526201"]},"openai-cash":{"label":"OpenAI cash after Q1 2026 (secondary; no later figure found)","value":73,"unit":"USD B","period":"Q1 2026","status":"reported","source_ids":["s_7297b7ff"]},"openai-2025-rev":{"label":"OpenAI 2025 revenue","value":13.1,"unit":"USD B","period":"2025","status":"reported","source_ids":["s_0fc221ed"]},"openai-burn-plan":{"label":"OpenAI projected 2026-2030 negative FCF (FT-reported plan)","value":278,"unit":"USD B","period":"2026-2030","status":"reported","source_ids":["s_af5ae7a3"]},"anthropic-runrate":{"label":"Anthropic run-rate revenue (company statement)","value":30,"unit":"USD B (surpassed)","period":"Apr 2026","status":"verified","source_ids":["s_63b83b32"]},"anthropic-runrate-late":{"label":"Anthropic reported run-rate incl. partner sales (gross)","value":65,"unit":"USD B","period":"end Jul 2026","status":"reported","source_ids":["s_6f68d40c"]},"oracle-rpo":{"label":"Oracle RPO","value":664,"unit":"USD B","period":"31 Aug 2026","status":"reported","source_ids":["s_61feaacc"]},"msft-rpo":{"label":"Microsoft commercial RPO (+73% y/y)","value":677,"unit":"USD B","period":"Sep 2026","status":"verified","source_ids":["s_971d55fd"]},"crwv-backlog":{"label":"CoreWeave revenue backlog (RPO $132.3B per 10-Q)","value":132.5,"unit":"USD billions","period":"2026-09-30","status":"verified","source_ids":["s_f30d204e","s_80ea2f53"]},"crwv-cash":{"label":"CoreWeave cash and equivalents (excl. $2.3B restricted)","value":4.122,"unit":"USD billions","period":"2026-09-30","status":"verified","source_ids":["s_f30d204e"]},"crwv-customer-a":{"label":"CoreWeave 'Customer A' share of revenue (Q3 2026; vs 67% in Q3 2025)","value":24,"unit":"percent","period":"Q3 2026","status":"verified","source_ids":["s_80ea2f53"]},"crwv-customer-b":{"label":"CoreWeave 'Customer B' share of revenue","value":30,"unit":"percent","period":"Q3 2026","status":"verified","source_ids":["s_80ea2f53"]},"nebius-rpo":{"label":"Nebius remaining performance obligations (Substack analysis)","value":38.7,"unit":"USD billions","period":"Q3 2026","status":"reported","source_ids":["s_31463fd6"]},"nscale-backlog":{"label":"Nscale total contract value per IPO filing coverage (Microsoft and Anthropic about 85%)","value":103.4,"unit":"USD billions","period":"2026-10","status":"reported","source_ids":["s_a0aac226","s_d034479a"]},"supply-commitments":{"label":"Supply and capacity commitments","value":390,"unit":"USD B","period":"Q3 FY27 (279 prior), mostly multi-year memory","status":"reported","source_ids":["s_c429436a"]},"equity-commitments":{"label":"Future equity investment commitments","value":20,"unit":"USD B","period":"Q3 FY27 (25 at Jul 26)","status":"verified","source_ids":["s_c429436a","s_7c4c573c"]},"neocloud-contingent":{"label":"Neocloud agreements (contingent future commitments)","value":32,"unit":"USD B","period":"Q3 FY27","status":"reported","source_ids":["s_c429436a"]},"q3-ocf":{"label":"Operating cash flow","value":48.3,"unit":"USD B","period":"Q3 FY27 (9M: 122.7)","status":"verified","source_ids":["s_55e7265b"]},"oracle-rating":{"label":"S&P rating BBB- (one notch above junk), downgraded Jul 2026","value":null,"unit":"rating","period":"Jul 2026","status":"reported","source_ids":["s_b31346dd"]},"oracle-debt":{"label":"Oracle long-term/senior debt","value":125,"unit":"USD B","period":"31 Aug 2026","status":"reported","source_ids":["s_61feaacc"]},"dc-abs-cmbs-ytd":{"label":"Data-center ABS+CMBS issuance YTD 2026 (ABS $15.3B, CMBS $6.6B); another CREFC weekly shows YTD behind 2025, sources disagree","value":21.9,"unit":"USD billions","period":"YTD Oct 2026","status":"reported","source_ids":["s_27ee4781","s_88c6a89e"]},"dc-securitized-outstanding":{"label":"Data-center securitization outstanding (Barclays via SFA): $4B (2020) to $61B YTD 2026","value":61,"unit":"USD billions","period":"2026","status":"reported","source_ids":["s_6ab19cce"]},"crwv-total-debt":{"label":"CoreWeave total debt (recourse $41.6B + non-recourse $5.3B; computed from balance sheet, excl. finance leases)","value":46.9,"unit":"USD billions","period":"2026-09-30","status":"verified","source_ids":["s_f30d204e","s_80ea2f53"]}};
  function F(id) { var d = ctx.data.facts || (ctx.data["source-claims"] || {}).facts, f = d && d[id] && d[id].value != null ? d[id] : null; if (f && f.period == null && FB[id]) f = Object.assign({}, f, { period: FB[id].period }); return f || FB[id] || null; }
  /* Guarantee exposure: read the current figure, label, date and tag from data (never typed). Prefer the corrected fact if the data has one. */
  function fGuar() { return F("nvda-guarantee-total") || F("guarantees-total"); }
  var DL = ctx.data.deals; DL = Array.isArray(DL) ? DL : (DL && DL.deals) || [];
  function D(id) { for (var i = 0; i < DL.length; i++) if (DL[i].id === id) return DL[i]; return null; }

  function fB(n) { if (n == null) return "not disclosed"; if (n >= 1000) return "$" + +(n / 1000).toFixed(2) + "T"; return "$" + +n.toFixed(1) + "B"; }
  function yrs(n) { return n == null || !isFinite(n) ? "n/a" : (n >= 10 ? n.toFixed(0) : n.toFixed(1)) + " yrs"; }
  function derived(list) { return M.weakestStatus(list.concat(["calculated"])); }
  function T(text, status, formula) { var s = h("span", { "class": "ch06-t", title: formula || "" }); s.appendChild(document.createTextNode(text)); if (status) s.appendChild(ctx.tag(status)); return s; }
  function srcLink(ids) { if (!ids || !ids[0]) return null; var a = ctx.sourceLink(ids[0]); a.className = "src"; a.textContent = "source"; return a; }
  function li(parts) { var e = h("li"); parts.forEach(function (p) { e.appendChild(typeof p === "string" ? document.createTextNode(p) : p); }); return e; }

  // ---- data
  var fRun = F("openai-runrate"), fCash = F("openai-cash"), fAnthRun = F("anthropic-runrate"), fAnthGross = F("anthropic-runrate-late");
  var dTotal = D("openai-compute-total-revised");
  function oaiAlt(i) { var a = dTotal && dTotal.alt_reports && dTotal.alt_reports[i]; return a || { usd_b: i ? null : (dTotal && dTotal.actual_usd_b_low), status: dTotal && dTotal.status }; }
  var oaiNamed = ["openai-oracle-compute", "openai-azure-compute", "openai-aws-compute", "openai-coreweave-compute", "openai-cerebras"].map(D).filter(Boolean);
  var namedSum = oaiNamed.reduce(function (a, d) { return a + (d.headline_usd_b || 0); }, 0);
  var namedStatus = derived(oaiNamed.map(function (d) { return d.status; }));
  var dAz = D("anthropic-azure-compute"), dFl = D("anthropic-fluidstack-50b");
  var anthC = (dAz ? dAz.headline_usd_b : 0) + (dFl ? dFl.headline_usd_b : 0);
  var anthCStatus = derived([dAz && dAz.status, dFl && dFl.status].filter(Boolean));
  var dXai = D("spacex-xai-chip-spv"), dSx = D("anthropic-spacexai-compute");
  var anthWithSx = anthC + (dSx ? dSx.headline_usd_b : 0);
  var anthWithSxStatus = derived([anthCStatus, dSx && dSx.status].filter(Boolean));

  // ---- generic bar row
  function bar(host, o) {
    var row = h("div", { "class": "ch06-row" });
    var lab = h("div", { "class": "ch06-lab" }, o.label);
    if (o.sub) lab.appendChild(h("small", { text: o.sub }));
    var track = h("div", { "class": "ch06-track" });
    var fill = h("div", { "class": "ch06-fill " + (o.value == null ? "na" : o.kind) });
    if (o.value != null) fill.style.width = Math.max(0.6, o.value / o.max * 100) + "%";
    track.appendChild(fill);
    var val = h("div", { "class": "ch06-val" });
    if (o.value == null) val.appendChild(h("span", { "class": "ch06-nd", text: "not disclosed" }));
    else { val.appendChild(T(fB(o.value), o.status, o.formula)); }
    var s = srcLink(o.src); if (s) val.appendChild(s);
    row.appendChild(lab); row.appendChild(track); row.appendChild(val);
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", o.label + ": " + (o.value == null ? "not disclosed" : fB(o.value) + (o.kind === "promise" ? ", a promise, not cash" : "")));
    host.appendChild(row);
  }
  function head(host, text) { host.appendChild(h("h4", { text: text, style: "margin:10px 0 0;font-size:13px;font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)" })); }

  // ---- panel A: OpenAI
  var A = q("[data-bars-openai]");
  var maxA = dTotal ? dTotal.headline_usd_b : 1400;
  head(A, "Cash and revenue (solid)");
  if (fCash) bar(A, { label: "Cash on hand", sub: "after Q1 2026, the latest we found", kind: "cash", value: fCash.value, status: fCash.status, src: fCash.source_ids, max: maxA });
  if (fRun) bar(A, { label: "Revenue per year", sub: "annualized run-rate, end Sep 2026", kind: "rev", value: fRun.value, status: fRun.status, src: fRun.source_ids, max: maxA });
  head(A, "Named, priced promises (dashed bars)");
  oaiNamed.forEach(function (d) { bar(A, { label: "To " + d.to.replace(/^./, function (c) { return c.toUpperCase(); }), sub: "compute contract, " + d.date, kind: "promise", value: d.headline_usd_b, status: d.status, src: d.source_ids, formula: d.formula_text && d.components ? d.formula_text + " (" + d.components.map(function (x) { return fB(x.usd_b) + " " + x.status; }).join(", ") + ")" : undefined, max: maxA }); });
  bar(A, { label: "AMD, Broadcom, Nvidia chip deals", sub: "priced terms unpublished", kind: "promise", value: null, max: maxA });
  head(A, "Totals people quote (also promises)");
  bar(A, { label: "Named, priced contracts added up", sub: "our sum of the five above", kind: "promise", value: namedSum, status: namedStatus, formula: "Sum of the five priced headline figures above. Excludes unpriced deals.", max: maxA });
  if (dTotal) {
    bar(A, { label: "Headline total commitment", sub: "~$1.4T over ~8 years, Altman, Nov 2025", kind: "promise", value: dTotal.headline_usd_b, status: dTotal.status, src: dTotal.source_ids, max: maxA });
    (dTotal.alt_reports || []).forEach(function (a, i) { bar(A, { label: i === 0 ? "Reported target: $" + a.usd_b + "B (CNBC, Feb 2026)" : "Reported, later: $" + a.usd_b + "B (FT, Sept 2026)", sub: i === 0 ? "compute spend target by 2030, anonymous sources" : "company presentation, 2026-2030, scope may be wider than compute", kind: "promise", value: a.usd_b, status: a.status, src: a.source_ids, max: maxA }); });
  }
  q("[data-noadd]").textContent = "Cash and promises are never added together here. A commitment is a promise to pay over several years, and a spend target is not the same thing as a contract. The two totals above are both reported, and we show them separately.";

  // ---- panel B: gauges
  var labs = [
    { name: "OpenAI", cash: fCash, bases: [{ label: "annualized revenue, end Sep 2026", value: fRun && fRun.value, status: fRun && fRun.status, src: fRun && fRun.source_ids }],
      rows: [
        { label: "Headline: " + (dTotal ? fB(dTotal.headline_usd_b) : ""), C: dTotal && dTotal.headline_usd_b, st: dTotal && dTotal.status },
        { label: "Named, priced contracts: " + fB(namedSum), C: namedSum, st: namedStatus },
        { label: "Reported target, CNBC Feb 2026: " + fB(oaiAlt(0).usd_b), C: oaiAlt(0).usd_b, st: oaiAlt(0).status },
        { label: "Reported spend, FT Sept 2026 (scope may be wider): " + fB(oaiAlt(1).usd_b), C: oaiAlt(1).usd_b, st: oaiAlt(1).status }
      ], note: "The AMD, Broadcom and Nvidia chip deals have no published price, so the named-contracts row leaves them out." },
    { name: "Anthropic", cash: null, bases: [
        { label: "run-rate, company statement (at least)", value: fAnthRun && fAnthRun.value, status: fAnthRun && fAnthRun.status, src: fAnthRun && fAnthRun.source_ids },
        { label: "run-rate incl. partner sales, gross (end Jul 2026)", value: fAnthGross && fAnthGross.value, status: fAnthGross && fAnthGross.status, src: fAnthGross && fAnthGross.source_ids }],
      rows: [
        { label: "View 1, named contracts: " + fB(anthC) + " (Azure + data centers)", C: anthC, st: anthCStatus, baseIdx: 0 },
        { label: "View 1, on the gross revenue figure", C: anthC, st: anthCStatus, baseIdx: 1 },
        { label: "View 2, including the reported SpaceX AI ceiling: " + fB(anthWithSx), C: anthWithSx, st: anthWithSxStatus, baseIdx: 0 },
        { label: "View 2, on the gross revenue figure", C: anthWithSx, st: anthWithSxStatus, baseIdx: 1 }
      ], note: "The Google TPU deal has no published price, so both views are understated. The SpaceX AI figure (" + (dSx ? fB(dSx.headline_usd_b) : "") + ") is a ceiling, not a fixed price, and it can be cancelled on 90 days' notice after early 2027, so View 2 is the upper reading." },
    { name: "xAI (now part of SpaceX)", cash: null, bases: [{ label: "revenue", value: null }],
      rows: [
        { label: "Chip-lease package headline: " + (dXai ? fB(dXai.headline_usd_b) : ""), C: dXai && dXai.headline_usd_b, st: dXai && dXai.status },
        { label: "Reported low end: " + (dXai ? fB(dXai.actual_usd_b_low) : ""), C: dXai && dXai.actual_usd_b_low, st: dXai && dXai.status }
      ], note: "No revenue or cash figure in our data, so no years-of-revenue number. We'd rather show a gap than guess. Separately, Anthropic has agreed to spend up to " + (dSx ? fB(dSx.headline_usd_b) : "an undisclosed amount") + " on compute from SpaceX's AI unit; that is a promise made to this lab, shown on the Anthropic card." }
  ];
  function yearsNeeded(C, R, g) { if (!(R > 0)) return null; if (g <= 0) return C / R; return Math.log(1 + C * g / R) / Math.log(1 + g); }
  var MAXY = 30, updaters = [];
  var host = q("[data-labs]");
  labs.forEach(function (lab) {
    var card = h("article", { "class": "ch06-lab-card" }, h("h4", { text: lab.name }));
    var kv = h("p", { "class": "ch06-kv" }); kv.appendChild(document.createTextNode("Cash on hand: "));
    if (lab.cash) { kv.appendChild(T(fB(lab.cash.value), lab.cash.status)); if (lab.cash.period) kv.appendChild(document.createTextNode(" (" + lab.cash.period + ")")); } else kv.appendChild(h("span", { "class": "ch06-nd", text: "not disclosed" }));
    card.appendChild(kv);
    lab.bases.forEach(function (b, i) {
      if (lab.bases.length > 1 || b.value == null) {
        var p = h("p", { "class": "ch06-kv" }); p.appendChild(document.createTextNode("Revenue basis " + (lab.bases.length > 1 ? (i + 1) + ", " : "") + b.label + ": "));
        if (b.value == null) p.appendChild(h("span", { "class": "ch06-nd", text: "not disclosed" })); else p.appendChild(T(fB(b.value) + "/yr", b.status));
        card.appendChild(p);
      } else {
        var p2 = h("p", { "class": "ch06-kv" }); p2.appendChild(document.createTextNode("Revenue, " + b.label + ": ")); p2.appendChild(T(fB(b.value) + "/yr", b.status)); var sl = srcLink(b.src); if (sl) p2.appendChild(sl); card.appendChild(p2);
      }
    });
    lab.rows.forEach(function (r) {
      var base = lab.bases[r.baseIdx || 0], R = base.value;
      var g = h("div", { "class": "ch06-g", role: "group" });
      g.appendChild(h("div", { "class": "ch06-gl", text: r.label }));
      var track = h("div", { "class": "ch06-track" }), fill = h("div", { "class": "ch06-fill " + (R == null ? "na" : "promise") }), ghost = h("div", { "class": "ch06-ghost", hidden: "" });
      track.appendChild(fill); track.appendChild(ghost); g.appendChild(track);
      var out = h("div", { "class": "ch06-yrs" }); g.appendChild(out);
      g.appendChild(h("div", { "class": "ch06-ticks", "aria-hidden": "true" }, h("span", { text: "0" }), h("span", { text: "10" }), h("span", { text: "20" }), h("span", { text: MAXY + "+ yrs" })));
      card.appendChild(g);
      updaters.push(function (gr) {
        out.innerHTML = "";
        if (R == null || r.C == null) { out.appendChild(h("span", { "class": "ch06-nd", text: "needs revenue, not disclosed" })); g.setAttribute("aria-label", r.label + ": cannot compute, revenue not disclosed"); return; }
        var n = yearsNeeded(r.C, R, gr), n0 = r.C / R;
        fill.style.width = Math.min(n, MAXY) / MAXY * 100 + "%";
        var st = gr > 0 ? "hypothetical" : derived([r.st, base.status].filter(Boolean));
        var formula = gr > 0 ? "Toy what-if: smallest n with R x ((1+g)^n - 1)/g >= C. R = " + fB(R) + ", C = " + fB(r.C) + ", g = " + Math.round(gr * 100) + "% a year. Revenue only, not profit."
          : "Commitments / current annual revenue = " + fB(r.C) + " / " + fB(R);
        out.appendChild(T(yrs(n), st, formula));
        if (gr > 0) { ghost.hidden = false; ghost.style.left = Math.min(n0, MAXY) / MAXY * 100 + "%"; out.appendChild(h("small", { text: "  (" + yrs(n0) + " with no growth, dotted)", style: "font-size:12px;color:var(--ink-3)" })); } else ghost.hidden = true;
        g.setAttribute("aria-label", r.label + ": " + yrs(n) + " of revenue needed" + (gr > 0 ? ", assuming " + Math.round(gr * 100) + "% yearly growth, hypothetical" : ""));
      });
    });
    if (lab.note) card.appendChild(h("p", { "class": "ch06-note", text: lab.note }));
    host.appendChild(card);
  });
  var gIn = q("[data-ch06-growth]"), gOut = q("[data-gout]"), gNote = q("[data-gnote]");
  function setG() {
    var gp = +gIn.value, gr = gp / 100; gOut.textContent = gp + "%";
    gIn.setAttribute("aria-valuetext", gp + " percent a year");
    updaters.forEach(function (u) { u(gr); });
    gNote.innerHTML = "";
    if (gp === 0) gNote.appendChild(document.createTextNode("Flat revenue: just the commitments divided by one year of revenue. "));
    else { gNote.appendChild(document.createTextNode("A what-if, not a forecast. It assumes revenue keeps growing at this rate every year until the cumulative revenue covers the promise. ")); gNote.appendChild(ctx.tag("hypothetical")); gNote.appendChild(document.createTextNode(" ")); }
    var r25 = F("openai-2025-rev");
    if (r25 && fRun) {
      gNote.appendChild(document.createTextNode("For scale, OpenAI reported " + fB(r25.value) + " of 2025 revenue and a " + fB(fRun.value) + " annualized run-rate by Sep 2026, about "));
      gNote.appendChild(T((fRun.value / r25.value).toFixed(1) + "x", "calculated", fB(fRun.value) + " / " + fB(r25.value) + ". Different periods: annualized run-rate versus a full year."));
      gNote.appendChild(document.createTextNode(". We don't know if that pace lasts."));
    }
  }
  gIn.addEventListener("input", setG);
  setG();

  // ---- panel C: holders
  var C = q("[data-bars-holders]"), dCl = D("nvda-cloud-commitments");
  var rowsC = [
    ["h", "Backlog and RPO at the builders and renters (promises)"],
    ["Microsoft commercial RPO", "all commercial customers, not only AI", "msft-rpo"],
    ["Oracle RPO", "31 Aug 2026", "oracle-rpo"],
    ["CoreWeave revenue backlog", "30 Sep 2026", "crwv-backlog"],
    ["Nscale total contract value", "per IPO filing coverage; the Anthropic part depends on Nscale getting financing", "nscale-backlog"],
    ["Nebius remaining performance obligations", "analysis, Q3 2026", "nebius-rpo"],
    ["h", "Nvidia's own commitments (promises)"],
    ["Supply and capacity commitments", "what Nvidia has promised suppliers", "supply-commitments"],
    ["Nvidia's maximum guarantee exposure", "ceiling, not a payment; Nvidia says it has paid nothing under any guarantee", "nvda-guarantee-total"],
    ["Cloud service agreements + leases not yet started", dCl ? dCl.date : "", null, dCl],
    ["Neocloud agreements, contingent", "only take effect after partner financing and deployment", "neocloud-contingent"],
    ["Future equity investment commitments", "", "equity-commitments"],
    ["h", "Cash, for scale (solid)"],
    ["Nvidia operating cash flow, one quarter", "Q3 FY27", "q3-ocf", null, "cash"],
    ["CoreWeave cash and equivalents", "30 Sep 2026", "crwv-cash", null, "cash"]
  ];
  var maxC = Math.max.apply(null, rowsC.filter(function (r) { return r[0] !== "h"; }).map(function (r) { var f = r[3] ? { value: r[3].headline_usd_b } : (r[2] === "nvda-guarantee-total" ? fGuar() : F(r[2])); return f ? f.value : 0; }));
  rowsC.forEach(function (r) {
    if (r[0] === "h") { head(C, r[1]); return; }
    var f = r[3] ? { value: r[3].headline_usd_b, status: r[3].status, source_ids: r[3].source_ids } : (r[2] === "nvda-guarantee-total" ? fGuar() : F(r[2]));
    if (r[2] === "nvda-guarantee-total" && f) { r[1] = (f.period ? f.period + "; " : "") + r[1]; }
    bar(C, { label: r[0], sub: r[1], kind: r[4] || "promise", value: f ? f.value : null, status: f && f.status, src: f && f.source_ids, max: maxC });
  });

  // ---- bull / bear
  var fCw = F("crwv-customer-a"), fCwB = F("crwv-customer-b"), fBurn = F("openai-burn-plan"), dApp = D("coreweave-applied-digital-lease"), dCon = F("neocloud-contingent");
  var n100 = dTotal ? yearsNeeded(dTotal.actual_usd_b_low, fRun.value, 1) : null;
  var bull = q("[data-bull]"), bear = q("[data-bear]");
  bull.appendChild(li(["Growth is real so far. OpenAI reported ", T(fB(F("openai-2025-rev").value), F("openai-2025-rev").status), " of revenue in 2025 and a ", T(fB(fRun.value), fRun.status), " annualized run-rate by September 2026. Anthropic says it passed ", T(fB(fAnthRun.value), fAnthRun.status), " run-rate in April."]));
  bull.appendChild(li(["Growth shrinks the gauge fast. If revenue doubled every year, the ", T(fB(oaiAlt(0).usd_b), oaiAlt(0).status), " target reported by CNBC would be covered in about ", T(yrs(n100), "hypothetical", "Toy what-if at 100% yearly growth."), " of revenue, not the " + yrs(dTotal.actual_usd_b_low / fRun.value) + " it takes at today's pace."]));
  var prevA = /vs\s+(\d+)%/.exec(fCw.label || ""), prevAv = prevA ? prevA[1] + "%" : null;
  var cwCaveat = "The filing's customer letters may not refer to the same customer in both periods.";
  bull.appendChild(li(["Counterparties are often big, established companies. In CoreWeave's 10-Q, \u201cCustomer A\u201d was ", T(fCw.value + "%", fCw.status), " of revenue in Q3 2026", prevAv ? " and " + prevAv + " in Q3 2025" : "", ". We can't say that is one customer shrinking, because " + cwCaveat.charAt(0).toLowerCase() + cwCaveat.slice(1) + " Revenue is still concentrated: \u201cCustomer B\u201d was ", T(fCwB.value + "%", fCwB.status), ", so the two together were ", T((fCw.value + fCwB.value) + "%", derived([fCw.status, fCwB.status]), fCw.value + "% + " + fCwB.value + "%"), "."]));
  bull.appendChild(li(["Some contracts are firm. The CoreWeave lease with Applied Digital is a 15-year take-or-pay for about ", T(fB(dApp.headline_usd_b), dApp.status), ", meaning the tenant pays whether or not it needs the space."]));
  bear.appendChild(li(["On today's revenue, OpenAI's named priced contracts equal ", T(yrs(namedSum / fRun.value), derived([namedStatus, fRun.status]), fB(namedSum) + " / " + fB(fRun.value)), " of revenue, and the headline equals ", T(yrs(dTotal.headline_usd_b / fRun.value), derived([dTotal.status, fRun.status])), ". Revenue is not profit."]));
  bear.appendChild(li(["Cash is small next to promises. The last cash figure we found, ", T(fB(fCash.value), fCash.status), ", is about ", T(Math.round(fCash.value / dTotal.headline_usd_b * 100) + "%", "calculated", fB(fCash.value) + " / " + fB(dTotal.headline_usd_b)), " of the headline, and a reported plan shows ", T("-" + fB(fBurn.value), fBurn.status), " of negative free cash flow in 2026 to 2030."]));
  bear.appendChild(li(["Promises can move. The headline total has been reported at different levels: about "+fB(oaiAlt(0).usd_b)+" (CNBC, Feb 2026, anonymous sources) and about "+fB(oaiAlt(1).usd_b)+" in a July presentation (FT, Sept 2026, scope may be wider). Neither is an official statement, and the sources differ. That flexibility favors the buyer, so how firm the seller's backlog is depends on the contract terms."]));
  bear.appendChild(li(["Revenue at CoreWeave rests on very few customers. Two unnamed customers made up ", T((fCw.value + fCwB.value) + "%", derived([fCw.status, fCwB.status]), fCw.value + "% + " + fCwB.value + "%"), " of Q3 2026 revenue, so one of them changing course would move the whole business."]));
  bear.appendChild(li(["Several backlogs lean on the same few labs. Oracle's ", T(fB(F("oracle-rpo").value), F("oracle-rpo").status), " RPO and CoreWeave's ", T(fB(F("crwv-backlog").value), F("crwv-backlog").status), " backlog both include OpenAI work, so one revenue stream has to cover several promises. Nvidia also lists ", T(fB(dCon.value), dCon.status), " of neocloud agreements that depend on partners financing and deploying first."]));

  // ---- closing
  var means = q("[data-means]");
  [ "A promise is a real contract, and it's still not cash. ", "OpenAI's five named, priced contracts add up to ", T(fB(namedSum), namedStatus), ". Against that sit ", T(fB(fCash.value), fCash.status), " of cash (the latest figure we found) and ", T(fB(fRun.value) + " a year", fRun.status), " of revenue. ",
    "If revenue keeps compounding, that gap closes. If it stalls, contracts could be renegotiated, as one reported cut shows. We don't know yet which." ].forEach(function (p) { means.appendChild(typeof p === "string" ? document.createTextNode(p) : p); });
  ctx.legend(q("[data-legend]"));
};
