Chapters["10"] = function (root, ctx) {
  "use strict";
  var M = ctx.M, F = ctx.fmt, H = ctx.data.history;
  var $ = function (s) { return root.querySelector(s); };

  /* attributed source link: if the outlet's own headline carries loaded words, show outlet + date and keep the headline in the tooltip */
  var SRC = {}; ((ctx.data.sources && ctx.data.sources.sources) || []).forEach(function (x) { SRC[x.id] = x; });
  function srcLink(sid) {
    var a = ctx.sourceLink(sid), x = SRC[sid];
    if (x && a.tagName === "A" && /enron|bubble|gymnastics/i.test(x.title || "")) {
      a.textContent = (x.publisher || "Source") + (x.date ? " (" + x.date + ")" : "");
      a.title = "Original headline: " + x.title;
    }
    return a;
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function add(parent, parts) { parts.forEach(function (p) { if (p == null) return; parent.appendChild(typeof p === "string" ? document.createTextNode(p) : p); }); return parent; }
  function bil(v) { return "$" + (Math.round(v * 10) / 10).toLocaleString("en-US") + "B"; }
  function bil3(v) { return "$" + (Math.round(v * 1000) / 1000).toLocaleString("en-US") + "B"; }
  function mil(v) { return "$" + Math.round(v).toLocaleString("en-US") + "M"; }
  function pc0(v) { return (Math.round(v * 10) / 10) + "%"; }
  function sgn(v) { return "−" + (Math.round(Math.abs(v) * 10) / 10) + "%"; }

  /* ---------- data lookup ---------- */
  var facts = {};
  H.lucent_facts.forEach(function (f) { facts[f.id] = f; });
  H.derived.forEach(function (f) { facts[f.id] = f; });
  var used = [];  // source ids collected for the cell being built
  function note(f) { (f.source_ids || []).forEach(function (s) { if (used.indexOf(s) < 0) used.push(s); }); }
  function tv(value, status, formula) { return { value: value, status: status, formula_text: formula }; }
  function numSpan(t, fm) {
    var s = el("span", "num"); s.appendChild(document.createTextNode(fm(t.value))); s.appendChild(ctx.tag(t.status));
    s.title = t.status + ": " + (t.formula_text || ""); return s;
  }
  // N(id, formatter): tagged number straight from a data fact
  function N(id, fm) {
    var f = facts[id]; if (!f) throw new Error("missing fact " + id);
    note(f);
    var st = f.status;
    return numSpan(tv(f.value, st, (f.formula_text || f.label) + (f.period ? " (" + f.period + ")" : "")), fm);
  }
  function C(value, status, formula, fm) { return numSpan(tv(value, status, formula), fm); }
  function plain(id) { var f = facts[id]; note(f); return f; }

  /* ---------- the caveat box (Lucent revenue basis) ---------- */
  (function () {
    var box = $(".caveat-box .cav-text");
    var rs = facts["lu-commit-share-restated"], og = facts["lu-commit-share-original"];
    var cav = H.caveats.filter(function (c) { return c.id === "lu-revenue-basis"; })[0];
    var p1 = el("p");
    add(p1, ["Lucent's customer-financing commitments were ", numSpan(tv(8.1, facts["lu-fy00-total"].status, facts["lu-fy00-total"].label + " (" + facts["lu-fy00-total"].period + ")"), bil),
      ". Compared with its FY2000 revenue, that ratio depends on which revenue number you use (the company later restated its revenue). We name the basis every time and default to the restated one."]);
    box.appendChild(p1);
    var ogM = /\$([\d.]+)B/.exec(og.basis || og.label || ""), ogRev = ogM ? +ogM[1] : null;
    var rsRev = facts["lu-rev-restated"];
    var bases = el("div", "bases");
    [[rs, "Restated basis (default)", "Revenue as restated in Lucent's own FY2002 10-K, continuing operations: " + bil3(rsRev ? rsRev.value : 28.904)],
     [og, "Original basis", ogRev ? "Revenue as first reported, about " + bil(ogRev) + " (see the status tag on the percentage)" : "Revenue as first reported"]].forEach(function (b) {
      var d = el("div", "basis");
      var big = el("b"); big.appendChild(numSpan(tv(b[0].value, b[0].status, b[0].formula_text || b[0].label), function (v) { return Math.round(v) + "%"; }));
      d.appendChild(big); d.appendChild(el("span", null, b[1])); d.appendChild(el("br")); d.appendChild(el("span", "fine", b[2]));
      bases.appendChild(d);
    });
    box.appendChild(bases);
  })();

  /* ---------- the rows ---------- */
  var ex = null;
  try { ex = M.externalShare(ctx.state.params).headline; } catch (e) { }

  function lis(items) { var ul = el("ul"); items.forEach(function (it) { var li = el("li"); add(li, it.parts || it); if (it.dk) li.className = "dk"; ul.appendChild(li); }); return ul; }

  var ROWS = [
    {
      id: "size", title: "Vendor financing vs revenue", q: "How big was the vendor's promise to customers, next to what it sold?",
      then: function () { return [
        ["Lucent's total customer financing commitments (loans plus guarantees): ", N("lu-fy00-total", bil), " at Sep 2000, ", N("lu-fy01-total", bil), " at Sep 2001, ", N("lu-fy02-total", bil), " at Sep 2002."],
        ["About ", C(facts["lu-commit-share-restated"].value, "calculated", facts["lu-commit-share-restated"].formula_text, function (v) { return Math.round(v) + "%"; }), " of FY2000 revenue ", el("strong", null, "on the restated basis"), "; ", C(facts["lu-commit-share-original"].value, facts["lu-commit-share-original"].status, facts["lu-commit-share-original"].formula_text || facts["lu-commit-share-original"].label, function (v) { return "about " + v + "%"; }), " on the original basis (see the box above)."],
        ["Nortel: undrawn customer financing commitments of up to about ", N("no-undrawn", bil), " at Dec 2000, against revenue of ", N("no-rev", bil), " for the year."]
      ]; },
      now: function () { return [
        ["Nvidia's guarantee of OpenAI Ohio lease payments: a ceiling of ", N("nv-guar", bil), ". It's undrawn, and Nvidia says it has paid nothing under it."],
        ["One analyst estimate puts the OpenAI arrangement at up to ", N("nv-ubs", function (v) { return v + "%"; }), " of Nvidia's projected 2026 revenue."],
        ["Nvidia's latest quarter: revenue of ", N("nv-rev", bil), " (one quarter), and investment assets of ", N("nv-invest-assets", bil), "."],
        { parts: ["We don't compute a like-for-like ratio. A guarantee ceiling over multi-year leases and one year of Lucent revenue are different yardsticks."], dk: true }
      ]; },
      unk: "We don't know yet how much of the ceiling could ever be drawn. The guarantee is tied to lease payments that start later, and total exposure figures differ across sources.",
      bull: "Then, Lucent had loaned and guaranteed against a far weaker cash position. Now, the support is a conditional ceiling, undrawn, next to very large quarterly cash generation.",
      bear: "Contingent commitments were easy to overlook in the Lucent story too: small when drawn, large when customers stumble. The ceiling matters most if the customer's credit weakens."
    },
    {
      id: "customers", title: "Customer quality", q: "Who was on the other end of the financing?",
      then: function () { return [
        ["Top customers were established carriers: Verizon about 13% and AT&T about 10% of FY2000 revenue, together ", N("lu-concentration", function (v) { return "about " + v + "%"; }), "."],
        ["Some financed customers were young, leveraged startups. Winstar filed for bankruptcy in April 2001 and One.Tel went into administration in 2001 (both named in Lucent's later filings)."],
        { parts: ["How much of Lucent's revenue came from startups and CLECs isn't disclosed in the filings we read: ", C(null, "unverified", "not disclosed in the filings reviewed", function () { return "we don't know"; }), "."], dk: true }
      ]; },
      now: function () { return [
        ["Buyers include some of the largest companies in the world, and also smaller, heavily indebted names. Market pricing of default risk differs a lot: ", el("span", "num", plain("nv-cds").label), " ", ctx.tag(plain("nv-cds").status), " (sources differ on exact levels)."],
        ["The Ohio guarantee backs leases to an OpenAI-affiliated customer. Critics say that matters because OpenAI doesn't have an investment-grade credit rating (attributed to Michael Burry)."]
      ]; },
      unk: "We don't know yet how the weakest counterparties would behave if funding tightened, and the counterparties today are a much more mixed group than a single label suggests.",
      bull: "Then, the buyers that failed were mostly new entrants with little cash flow. Now, many of the buyers are among the richest companies on earth, with their own operating cash.",
      bear: "The sturdy buyers aren't the ones who need the support. The counterparties who might lean on a backstop are the leveraged ones, and Marc Rowan of Apollo has described neoclouds as dependent on Nvidia as 'the bank'."
    },
    {
      id: "collateral", title: "Collateral life", q: "How long does the thing being financed last?",
      then: function () { var f = plain("tel-fiber"); return [
        ["Fiber is a long-lived asset: decades. The famous '2.7% of fiber used' figure is disputed. Lit fiber was about 2-5% in 2002 per the FDIC. ", ctx.tag(f.status)],
        ["Telecom carrier capex peaked at about ", N("tel-capex", bil), " (2000), then fell."]
      ]; },
      now: function () {
        var life = ctx.state.params.gpu_useful_life_years;
        return [
          ["GPU useful life is disputed. The toy model assumes ", C(life, "reported", "gpu_useful_life_years parameter in the loop model", function (v) { return v + " years"; }), " as its base case."],
          ["Michael Burry argues depreciation schedules are too long, so the collateral wears out faster than books say. Others point to GPUs still being rented out. No figure is verified here."],
          [ctx.siteLink("/burry-depreciation/", "The GPU life debate, in detail")]
        ]; },
      unk: "We don't know yet how fast GPUs lose value. It depends on how quickly newer chips make older ones less useful, which nobody can verify today.",
      bull: "A GPU can be rented out again if a customer walks away, and rental prices for a popular chip (the H100) have risen since December 2025, though they remain far below 2023 levels (see the rental-price note in Chapter 4). Idle fiber just sat there waiting for traffic.",
      bear: "Even if fiber was idle, it lasted decades. If chips lose value in a few years, the debt behind them can outlive the collateral."
    },
    {
      id: "outside", title: "Share of revenue from outside the loop", q: "How much of the vendor's growth came from money that did not start with the vendor?",
      then: function () { return [
        ["Established carriers (Verizon, AT&T) were about ", N("lu-concentration", function (v) { return v + "%"; }), " of FY2000 revenue."],
        { parts: ["The startup and CLEC share isn't disclosed in what we read: ", C(null, "unverified", "not disclosed in the filings reviewed", function () { return "we don't know"; }), "."], dk: true }
      ]; },
      now: function () { return [
        ["We don't have Nvidia's actual revenue mix by who funded the buyer, so we can't put a real number here."],
        { parts: ["Our toy loop gives an illustrative split. It's in the separate box below, labelled as a model output, and it isn't a measurement of Nvidia."], dk: true }
      ]; },
      unk: "We don't know yet how much of today's demand would exist without the financing around it. Neither the old nor the new disclosures give a clean number.",
      bull: "In the toy, most of the cash comes from outside the vendor, and real demand is backlogged. Outside lenders and customers are putting their own money in.",
      bear: "'Outside' isn't the same as 'end user'. Lenders have to be repaid from future end-user spending, and the toy's end-user share depends on a cautious setting."
    },
    {
      id: "trough", title: "Peak to trough", q: "How far did the market's valuation fall?",
      then: function () { return [
        ["Lucent's stock fell about ", C(plain("lu-stock").value, plain("lu-stock").status, plain("lu-stock").label, sgn), " from its Dec 1999 peak to Oct 2002."],
        ["Nortel's stock fell about ", C(plain("no-stock").value, plain("no-stock").status, plain("no-stock").label, sgn), " from its Jul 2000 peak to Oct 2002."],
        ["CLEC sector market value fell from ", bil(86.4), " in 1999 to ", bil(3.77), " in Feb 2002: about ", C(((3.77 - 86.4) / 86.4) * 100, "calculated", "(3.77 − 86.4) / 86.4, both reported (" + plain("tel-clec-mcap").label + ")", sgn), "."]
      ]; },
      now: function () {
        var ev = (ctx.data.events.events || ctx.data.events).filter(function (e) { return e.id === "ev-neocloud-drawdowns"; })[0];
        return [
          ["No trough yet that we can verify. Recent reporting says neocloud and AI-credit equities are well below their peaks ", ev ? ctx.tag(ev.status) : "", "."],
          ["Nvidia's drawdown from its October high is reported at different sizes by different sources, and we haven't verified it."],
          { parts: ["A trough, if there is one, can't be known in advance."], dk: true }
        ]; },
      unk: "We don't know yet whether today is a peak, a pause or the middle. Peak-to-trough can only be measured afterward.",
      bull: "Then, the collapse followed collapsing demand. Now, Nvidia's reported sales and guidance are still rising (Q3 FY27 revenue up 103% year on year, verified), and prices have so far fallen in the weaker, more leveraged names.",
      bear: "Prices in the most levered corner have already fallen a long way. In 2000, the first big price drops came before the defaults, not after."
    },
    {
      id: "outcome", title: "Outcome", q: "What happened to the financing itself?",
      then: function () { return [
        ["Lucent's provisions for bad debts and customer financing: ", N("lu-bad-debt", function () { return mil(505) + " in FY2000, " + mil(2249) + " in FY2001, " + mil(1253) + " in FY2002"; }), "."],
        ["Restated revenue fell ", N("lu-rev-chg-fy01", function (v) { return "−" + Math.abs(Math.round(v)) + "%"; }), " in FY2001 and ", N("lu-rev-chg-fy02", function (v) { return "−" + Math.abs(Math.round(v)) + "%"; }), " in FY2002."],
        ["Customer defaults came in 2001, about a year after financing peaked."]
      ]; },
      now: function () { return [
        ["No confirmed public default on a GPU-backed loan had been found as of October 2026 ", ctx.tag("reported"), "."],
        ["Nvidia says no payments have been made under its guarantees ", ctx.tag("reported"), "."],
        { parts: ["The outcome: we don't know yet."], dk: true }
      ]; },
      unk: "We don't know yet. The rhyme is only an analogy, and it has not yet been tested.",
      bull: "No defaults so far, guarantees undrawn, strong cash flow at the center. The structure has held up so far.",
      bear: "Lucent's defaults came about a year after its peak, so 'none yet' says little in either direction. A quiet year is not evidence the structure is safe."
    }
  ];
  function pcFrac(v) { return Math.round(v * 1000) / 10 + "%"; }

  var rowsEl = $(".cmp-rows");
  ROWS.forEach(function (r) {
    var row = el("div", "row"); row.dataset.dim = r.id;
    var dim = el("div", "dim"); dim.appendChild(el("h3", null, r.title)); dim.appendChild(el("p", null, r.q));
    row.appendChild(dim);
    ["then", "now"].forEach(function (side) {
      var cell = el("div", "cell " + side);
      cell.appendChild(el("p", "cell-lab", side === "then" ? "Then: 1999-2001" : "Now: 2026"));
      used = [];
      cell.appendChild(lis(r[side]()));
      if (used.length) {
        var s = el("div", "fine"); s.appendChild(document.createTextNode("Sources: "));
        used.forEach(function (sid) { try { var a = srcLink(sid); a.style.marginRight = ".5rem"; s.appendChild(a); } catch (e) { } });
        cell.appendChild(s);
      }
      row.appendChild(cell);
    });
    [["bull", "Bull reading", r.bull], ["bear", "Bear reading", r.bear], ["unk", "We don't know yet", r.unk]].forEach(function (x) {
      var d = el("div", "reframe " + x[0]); d.appendChild(el("b", null, x[1])); d.appendChild(document.createTextNode(x[2])); row.appendChild(d);
    });
    rowsEl.appendChild(row);
  });

  /* ---------- toy-model box, kept apart from the filings ---------- */
  (function () {
    var host = $(".toy-out"); if (!host) return;
    if (!ex) { host.appendChild(el("p", null, "The model couldn't compute this just now.")); return; }
    var e = ex.external_share, u = ex.end_user_share, p = el("p");
    add(p, ["In the toy loop, about ", numSpan(e.base, pcFrac), " of the cash that moves in one lap is outside money (lenders, outside investors and end users together; range across the model's settings roughly ", numSpan(e.low, pcFrac), " to ", numSpan(e.high, pcFrac), "). Lenders still have to be repaid. The part paid by end customers is about ", numSpan(u.base, pcFrac), (u.low && u.high ? [" (range ", numSpan(u.low, pcFrac), " to ", numSpan(u.high, pcFrac), ")"] : []), "."].reduce(function (a, b) { return a.concat(b); }, []));
    host.appendChild(p);
    host.appendChild(el("p", "fine", "These come from the knobs in Chapter 4, including a deliberately cautious setting for how much of the lab's rent is covered by outside revenue (the ? on that knob shows the reported reference point). Move the knob and they change. They are hypothetical and are not comparable with the filings above."));
  })();

  /* ---------- toggles ---------- */
  var cmp = $(".cmp");
  var NOTES = {
    neutral: "Showing the documented facts only. Switch the reading to see how each side frames the same facts.",
    bull: "Bull reading: the same facts, framed by someone who thinks the structure is sturdier this time. The numbers don't change.",
    bear: "Bear reading: the same facts, framed by someone who thinks the parallel is close. The numbers don't change."
  };
  function seg(sel, opts, cur, onPick) {
    var box = $(sel);
    opts.forEach(function (o) {
      var b = el("button", null, o[1]); b.type = "button"; b.dataset.v = o[0];
      b.setAttribute("aria-pressed", String(o[0] === cur));
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(box.children, function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        onPick(o[0]);
      });
      box.appendChild(b);
    });
  }
  seg("[data-ctl=view]", [["then", "Then"], ["now", "Now"], ["both", "Both"]], "both", function (v) { cmp.dataset.view = v; });
  seg("[data-ctl=reading]", [["neutral", "Facts only"], ["bull", "Bull reading"], ["bear", "Bear reading"]], "neutral", function (v) { cmp.dataset.reading = v; $(".reframe-note").textContent = NOTES[v]; });
  $(".reframe-note").textContent = NOTES.neutral;

  /* ---------- attributed arguments ---------- */
  function args(sel, list) {
    var ul = $(sel + " ul");
    list.forEach(function (a) {
      var li = el("li"); li.appendChild(document.createTextNode(String(a.claim).replace(/,?\s*(rising contingent commitments)?,?\s*and a leadership shock are/, ' and rising contingent commitments are')));
      var w = el("span", "who"); w.appendChild(document.createTextNode("Who: " + a.who + ". "));
      (a.source_ids || []).forEach(function (sid) { try { w.appendChild(srcLink(sid)); } catch (e) { } });
      li.appendChild(w); ul.appendChild(li);
    });
  }
  args(".args-col.bull", H.bull_arguments);
  args(".args-col.bear", H.bear_arguments);

  /* ---------- open questions ---------- */
  var mine = [
    "Will the guarantees ever be drawn, and by how much? Nothing has been paid so far. We can't tell from the outside.",
    "How fast do GPUs lose value in real life? That decides whether the collateral outlasts the debt.",
    "How much of today's demand would show up without the financing around it? Nobody has published a clean split.",
    "What would a real stress look like? Not the toy in Chapter 9, but real contracts, real covenants, real counterparties."
  ];
  mine.forEach(function (t) { $(".oq-main").appendChild(el("li", null, t)); });

  /* ---------- footer ---------- */
  var lr = $(".links-row");
  lr.appendChild(ctx.siteLink("/burry-depreciation/", "GPU useful life: the depreciation debate"));
  lr.appendChild(ctx.siteLink("/neocloud-contagion/", "Market-price version: neocloud contagion"));
  $(".means-text").textContent = "The comparison gives each side something. Some things line up: vendors supporting their own customers, and contingent promises behind the growth. Some don't: who the buyers are, how much cash the vendor makes, and how long the collateral lasts. Others we can't know yet, because the ending hasn't been written. We'd rather say that than hand you a verdict.";
};
