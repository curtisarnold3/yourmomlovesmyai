Chapters["08"] = function (root, ctx) {
  var M = ctx.M, NS = "http://www.w3.org/2000/svg";
  var q = function (s) { return root.querySelector(s); };
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (k === "text") el.textContent = attrs[k]; else el.setAttribute(k, attrs[k]); });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null) continue; el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }
    return el;
  }
  function S(tag, attrs, parent) { var e = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (parent) parent.appendChild(e); return e; }
  function F(id) { var d = ctx.data.facts || (ctx.data["source-claims"] || {}).facts; return d && d[id] && d[id].value != null ? d[id] : null; }
  var DL = ctx.data.deals; DL = Array.isArray(DL) ? DL : (DL && DL.deals) || [];
  function D(id) { for (var i = 0; i < DL.length; i++) if (DL[i].id === id) return DL[i]; return null; }
  function fB(n) { if (n == null) return "an undisclosed amount"; if (n >= 1000) return "$" + +(n / 1000).toFixed(2) + "T"; return "$" + +(n >= 100 ? n.toFixed(0) : n.toFixed(2).replace(/\.?0+$/, "")) + "B"; }
  function amt(id, field) { var d = D(id); return d ? fB(d[field || "headline_usd_b"]) : "an undisclosed amount"; }
  function clip(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n).replace(/[\s,;.]+\S*$/, "") + "..." : s; }

  var COL = { cash: "#f0a32e", recycled: "#3bc4f2", debt: "#ff5a36", promise: "#9a7df0" };
  var pid = 0;

  // ---------- diagram engine: nodes + edges + steps (s = step at which an edge first appears)
  function diagram(spec, host) {
    var uid = "ch08m" + (++pid);
    var svg = S("svg", { viewBox: "0 0 460 240", role: "img", tabindex: "0", "aria-label": spec.title + " diagram. " + spec.steps.length + " steps. Use the Next button to step through, or press Enter on the diagram." });
    var defs = S("defs", {}, svg);
    Object.keys(COL).forEach(function (k) {
      var m = S("marker", { id: uid + k, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, defs);
      S("path", { d: "M0 0 L10 5 L0 10 z", fill: COL[k] }, m);
    });
    var NW = 108, NH = 42, nodes = {}, els = [];
    spec.nodes.forEach(function (n) { n.x = n.x * 1.1 + 8; n.w = Math.min(148, Math.max(104, Math.max.apply(null, n.t.split("|").map(function (l) { return l.length; })) * 7.9 + 14)); });
    var eg = S("g", {}, svg), ng = S("g", {}, svg);
    spec.nodes.forEach(function (n) {
      var g = S("g", { "class": "n", "data-id": n.id }, ng);
      S("rect", { "class": "nbox " + (n.kind || ""), x: n.x - n.w / 2, y: n.y - NH / 2, width: n.w, height: NH, rx: 10 }, g);
      var lines = n.t.split("|");
      lines.forEach(function (ln, i) { var t = S("text", { "class": "nt", x: n.x, y: n.y + 4 + (i - (lines.length - 1) / 2) * 14 }, g); t.textContent = ln; });
      nodes[n.id] = { g: g, n: n, used: n.s != null ? n.s : 99 };
    });
    function edgePt(a, b, ox, oy) { // point on rect a toward b
      var dx = b.x - a.x, dy = b.y - a.y, hw = a.w / 2 + 3, hh = NH / 2 + 3, t = Math.min(dx ? hw / Math.abs(dx) : 1e9, dy ? hh / Math.abs(dy) : 1e9);
      return [a.x + dx * t + ox, a.y + dy * t + oy];
    }
    spec.edges.forEach(function (e) {
      var a = nodes[e.from].n, b = nodes[e.to].n, dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var off = e.o || 0, ox = -dy / len * off, oy = dx / len * off;
      var p = edgePt(a, b, ox, oy), r = edgePt(b, a, ox, oy);
      var g = S("g", { "class": "e off", "data-s": e.s }, eg);
      var prom = e.kind === "promise";
      S("path", { "class": "ln", d: "M" + p[0].toFixed(1) + " " + p[1].toFixed(1) + " L" + r[0].toFixed(1) + " " + r[1].toFixed(1), fill: "none", stroke: COL[e.kind], "stroke-width": 2.4, "stroke-dasharray": prom ? "6 5" : "", "stroke-opacity": prom ? 0.95 : 1, "marker-end": "url(#" + uid + e.kind + ")" }, g);
      var t = S("text", { "class": "el", x: (p[0] + r[0]) / 2, y: (p[1] + r[1]) / 2 - 5 }, g); t.textContent = e.l + (prom ? " (promise)" : "");
      els.push({ g: g, e: e, path: g.firstChild });
      if (nodes[e.from].used > e.s) nodes[e.from].used = e.s; if (nodes[e.to].used > e.s) nodes[e.to].used = e.s;
    });
    host.appendChild(svg);
    var step = 0;
    function dot(el) {
      if (ctx.reducedMotion || el.e.kind === "promise") return;
      var c = S("circle", { r: 4, fill: COL[el.e.kind] }, svg), am = S("animateMotion", { dur: "1.1s", repeatCount: "2", path: el.path.getAttribute("d"), fill: "freeze" }, c);
      setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 2400);
    }
    function render(prev) {
      els.forEach(function (el) {
        var on = el.e.s <= step; el.g.setAttribute("class", "e" + (on ? "" : " off") + (el.e.s === step && step > 0 ? " new" : ""));
        if (on && el.e.s === step && step > prev) dot(el);
      });
      Object.keys(nodes).forEach(function (k) { var n = nodes[k]; n.g.setAttribute("class", "n" + (n.used > step ? " off" : (n.used === step && step > 0 ? " lit" : ""))); });
    }
    return { svg: svg, get: function () { return step; }, set: function (s) { var p = step; step = s; render(p); } };
  }

  // ---------- deal-backed example list
  function exItem(d, lead, srcCount) {
    var li = h("li");
    li.appendChild(h("b", { text: lead + ". " }));
    var st = ctx.clean(d.structure);
    li.appendChild(document.createTextNode((st ? clip(ctx.terms(st), 520) : "Details are in the source.") + " "));
    li.appendChild(ctx.tag(d.status));
    (d.source_ids || []).slice(0, srcCount || 1).forEach(function (sid) { var a = ctx.sourceLink(sid); a.className = "src"; a.textContent = "source"; li.appendChild(a); });
    var wc = ctx.readerNote(d) || ctx.clean(d.what_changed_since_announcement);
    if (wc && !/^no update/i.test(wc)) li.appendChild(h("div", { text: (ctx.readerNote(d) ? "" : "Since then: ") + clip(ctx.terms(wc), 360), style: "color:var(--ink-3);font-size:12.5px" }));
    return li;
  }
  function factItem(f, lead, text) {
    var li = h("li"); li.appendChild(h("b", { text: lead + ". " })); li.appendChild(document.createTextNode(text + " ")); li.appendChild(ctx.tag(f.status));
    var fn = ctx.readerNote(f); if (fn && text.indexOf(fn) < 0) li.appendChild(h("div", { text: ctx.terms(fn), style: "color:var(--ink-3);font-size:12.5px" }));
    if (f.source_ids && f.source_ids[0]) { var a = ctx.sourceLink(f.source_ids[0]); a.className = "src"; a.textContent = "source"; li.appendChild(a); }
    return li;
  }

  // ---------- the seven cards
  var defsP = (ctx.data.defaults && ctx.data.defaults.params) || [];
  var backLev = defsP.filter(function (p) { return p.id === "credit_fund_back_leverage_ratio"; })[0];
  var stackNow = M.claimsStack(M.defaults(), 0);
  var bankSlice = stackNow.slabs.filter(function (s) { return s.id === "s2_fund_back_leverage"; })[0];

  var cards = [
    { id: "ddtl", gloss: "An SPV (special-purpose vehicle) is a separate legal box that owns the chips. A delayed-draw term loan is a loan where the lender promises up to a set amount and the borrower takes the money in pieces, as it needs it. Non-recourse means that if the project fails, the lender can claim the chips and the contract but can't go after the borrower's other assets.", title: "GPU-backed SPVs and delayed-draw term loans",
      ana: "Like a car loan secured by the car and by the buyer's job contract, where the bank hands over money in installments as the car gets built.",
      nodes: [{ id: "lab", t: "AI lab or|hyperscaler", x: 60, y: 50 }, { id: "neo", t: "Neocloud|(operator)", x: 60, y: 190 }, { id: "spv", t: "GPU SPV|owns the chips", x: 200, y: 120, kind: "spv" }, { id: "len", t: "Lenders|private credit", x: 340, y: 50, kind: "lender" }, { id: "nv", t: "Chip maker", x: 340, y: 190 }],
      edges: [{ from: "lab", to: "neo", kind: "promise", l: "multi-year contract", s: 1, o: 0 },
        { from: "neo", to: "spv", kind: "promise", l: "contract pledged", s: 2 }, { from: "len", to: "spv", kind: "promise", l: "will lend as drawn", s: 2, o: 6 },
        { from: "len", to: "spv", kind: "debt", l: "draw", s: 3, o: -6 }, { from: "spv", to: "nv", kind: "cash", l: "buys chips", s: 3 },
        { from: "lab", to: "spv", kind: "cash", l: "rent", s: 4 }, { from: "spv", to: "len", kind: "debt", l: "repays", s: 4, o: 14 }],
      steps: ["Start with a contract. The lab signs a multi-year deal to rent compute from the neocloud. That's a promise, not cash.",
        "The neocloud sets up a special-purpose vehicle (SPV) and pledges the contract to it. Lenders commit to lend, but only as needed. That's the delayed draw.",
        "Chips arrive in batches. The SPV draws cash from lenders as each batch lands and pays for the GPUs.",
        "The lab's rent goes to the SPV first, and lenders get paid before anyone else. The chips and the contract are the collateral."],
      why: ["Lenders get a claim on specific chips and a specific contract, so the loan can be cheaper than a loan to the whole company.", "The neocloud pays interest only on money it has drawn.", "If the project struggles, the rest of the company isn't automatically pulled in."],
      watch: ["How long the contract runs compared with how long the chips last.", "How good the customer's credit is. The loan is only as safe as the rent.", "Whether the loan is non-recourse and how the spread has moved."],
      ex: [["iren-gpu-financing", "IREN"], ["coreweave-ddtl-4", "CoreWeave DDTL 4.0"], ["blackstone-magnetar-coreweave", "CoreWeave's earlier loans"]] },

    { id: "hyperion", gloss: "A residual value guarantee is a promise to make up the difference if a building or machine is worth less than expected when a lease ends.", title: "Joint ventures with residual value guarantees (Meta Hyperion and Blue Owl)",
      ana: "Like a landlord who builds your office, rents it to you, and says, \"if the building is worth less in 16 years, you make me whole.\"",
      nodes: [{ id: "meta", t: "Meta|(tenant)", x: 60, y: 60, kind: "guarantor" }, { id: "jv", t: "Joint venture|owns the campus", x: 200, y: 120, kind: "spv" }, { id: "owl", t: "Blue Owl funds|(equity)", x: 60, y: 190 }, { id: "inv", t: "Bond investors", x: 340, y: 190, kind: "lender" }, { id: "dc", t: "Data center|campus", x: 340, y: 50, kind: "asset" }],
      edges: [{ from: "owl", to: "jv", kind: "cash", l: "most of equity", s: 1 }, { from: "meta", to: "jv", kind: "cash", l: "minority equity", s: 1, o: 10 },
        { from: "inv", to: "jv", kind: "debt", l: "buys bonds", s: 2 }, { from: "jv", to: "dc", kind: "cash", l: "builds", s: 2 },
        { from: "meta", to: "jv", kind: "cash", l: "lease rent", s: 3, o: -10 },
        { from: "meta", to: "inv", kind: "promise", l: "residual value guarantee", s: 4, o: 0 }],
      steps: ["A joint venture forms. Blue Owl funds put in most of the equity and Meta puts in a minority stake.",
        "The venture sells " + amt("meta-hyperion-bond") + " of rated, amortizing bonds to investors and uses the cash to build the campus.",
        "Meta leases the campus from the venture and pays rent over time.",
        "Meta also provides a residual value guarantee: if the campus is worth less than expected when the lease ends, Meta covers part of the gap (reported cap " + amt("meta-hyperion-beignet") + "). It's a promise, so it's drawn dashed. Sources differ on how the guarantee is accounted for."],
      why: ["Long-term fixed-rate money from bond buyers is cheap for a high-quality tenant.", "The sponsor keeps its balance sheet flexible and shares construction risk.", "Investors like long, contracted, rated income."],
      watch: ["How the guarantee is accounted for. Check the company's 10-K and 10-Q and the bond documents.", "How big the guarantee is compared with what the campus may be worth as hardware ages.", "Whether more of the buildout follows the same pattern."],
      ex: [["meta-hyperion-bond", "Meta Hyperion bond"], ["meta-hyperion-beignet", "Meta Hyperion guarantee"], ["blue-owl-abilene-spv", "Abilene, leased to Oracle"]] },

    { id: "xai", title: "SPVs that buy GPUs and lease them back (xAI-style)",
      ana: "Like a friend who buys a delivery truck for your new business, rents it to you, and lets you buy it at the end.",
      nodes: [{ id: "eq", t: "Equity investors|(incl. chip maker)", x: 60, y: 50 }, { id: "ln", t: "Lenders|bonds + loans", x: 60, y: 190, kind: "lender" }, { id: "spv", t: "GPU SPV|owns the chips", x: 200, y: 120, kind: "spv" }, { id: "nv", t: "Chip seller", x: 340, y: 190 }, { id: "xai", t: "xAI / SpaceX|(lessee)", x: 340, y: 50 }],
      edges: [{ from: "eq", to: "spv", kind: "cash", l: "equity", s: 1 }, { from: "ln", to: "spv", kind: "debt", l: "debt", s: 1 },
        { from: "spv", to: "nv", kind: "cash", l: "buys GPUs", s: 2 },
        { from: "spv", to: "xai", kind: "promise", l: "lease + purchase option", s: 3 },
        { from: "xai", to: "spv", kind: "cash", l: "lease payments", s: 4, o: 8 }, { from: "spv", to: "ln", kind: "debt", l: "debt service", s: 4, o: 10 }],
      steps: ["Investors and lenders fund a new SPV. One reported structure is " + amt("xai-gpu-spv") + " in total, part equity and part debt.",
        "The SPV uses the money to buy Nvidia GPUs.",
        "The SPV leases the GPUs to the company that wants them, with an option to buy. The lease is a promise, so it's dashed.",
        "Lease payments go to the SPV and service the debt. The chips are the collateral. A reported later package is " + amt("spacex-xai-chip-spv") + "."],
      why: ["A fast-growing company with a short credit history can get chips without raising corporate debt.", "Debt stays tied to the chips instead of the whole company.", "The chip seller gets a buyer."],
      watch: ["How the lease and the purchase option are each reported in the company's filings and the financing documents.", "What the purchase option costs.", "The chip maker is an investor, a seller and sometimes a backer all at once."],
      ex: [["xai-gpu-spv", "xAI GPU SPV"], ["spacex-xai-chip-spv", "SpaceX / xAI chip package"]] },

    { id: "leaseback", gloss: "A sale-leaseback means you sell something and then rent it straight back from the buyer.", title: "Sale-leasebacks (Nvidia renting back GPUs it sold)",
      ana: "Like an airline that sells you a jet and then leases some of the seats' worth of flying time back from you.",
      nodes: [{ id: "nv", t: "Nvidia", x: 70, y: 70 }, { id: "lam", t: "Lambda|(GPU cloud)", x: 330, y: 70 }, { id: "bk", t: "Lender|leveraged loan", x: 330, y: 190, kind: "lender" }],
      edges: [{ from: "nv", to: "lam", kind: "cash", l: "sells GPUs", s: 1, o: -8 }, { from: "bk", to: "lam", kind: "debt", l: "loan helps pay", s: 2 },
        { from: "lam", to: "nv", kind: "promise", l: "leases GPUs back", s: 3, o: 8 }, { from: "nv", to: "lam", kind: "cash", l: "pays rent", s: 4, o: -8 }, { from: "lam", to: "bk", kind: "debt", l: "repays", s: 4 }],
      steps: ["Nvidia sells GPUs to Lambda, a GPU cloud company in which it is also an investor.",
        "Lambda funds part of the purchase with a leveraged loan.",
        "Nvidia agrees to lease a block of those GPUs back. The lease is a promise to pay rent, so it's dashed.",
        "Nvidia's rent helps Lambda repay its lender. Nvidia gets capacity without owning it, and Lambda gets a customer that pays."],
      why: ["The buyer gets a steady rent stream to support its loan.", "The seller gets a sale and access to compute.", "Sale-leasebacks are common in equipment finance, with planes, trucks and buildings."],
      watch: ["How the earlier sale and the later lease are each reported in the filings. Nvidia's filings list cloud service agreements and leases not yet started; see the example below.", "Related-party links: seller, investor and customer in one deal.", "Whether disclosure makes the whole loop visible."],
      ex: [["nvda-lambda-leaseback", "Nvidia and Lambda"], ["nvda-cloud-commitments", "Nvidia's own cloud commitments"]] },

    { id: "backstop", gloss: "A backstop is a promise to step in and pay if the tenant can't. A warrant is the right to buy a company's shares later at a price fixed today.", title: "Google backstops Fluidstack leases at bitcoin-miner sites",
      ana: "Like a parent co-signing a young renter's lease so the landlord can borrow against the rent, and getting a small piece of the landlord's business in return.",
      nodes: [{ id: "fl", t: "Fluidstack|(tenant)", x: 60, y: 60 }, { id: "host", t: "Miner-turned-host|TeraWulf, Cipher", x: 200, y: 190, kind: "asset" }, { id: "goog", t: "Google|(backstop)", x: 340, y: 60, kind: "guarantor" }, { id: "bond", t: "Note buyers", x: 340, y: 190, kind: "lender" }],
      edges: [{ from: "fl", to: "host", kind: "promise", l: "long lease", s: 1 },
        { from: "goog", to: "host", kind: "promise", l: "backstops lease", s: 2 }, { from: "host", to: "goog", kind: "promise", l: "warrants", s: 3, o: 12 },
        { from: "bond", to: "host", kind: "debt", l: "buys notes", s: 4 }],
      steps: ["Fluidstack, a young company that builds sites for AI labs, signs a long lease with a bitcoin miner that now hosts data centers.",
        "Google agrees to backstop Fluidstack's lease payments: " + amt("google-fluidstack-terawulf-backstop") + " at TeraWulf and " + amt("google-fluidstack-cipher-backstop") + " at Cipher. A backstop is a promise, so it's dashed.",
        "In return, Google receives warrants, the right to buy shares in the host company later.",
        "With Google behind the lease, the host can sell notes at a lower rate than it could alone and use the cash to build."],
      why: ["Fluidstack has little credit history. Google's credit lets the host borrow on better terms.", "Google gets capacity access and upside through the warrants.", "Miners turn power-ready sites into data centers fast."],
      watch: ["A backstop is capped and has conditions. Read what triggers it.", "Warrant counts differ across sources, so check the filings.", "Hosts leasing straight to a hyperscaler have borrowed more cheaply, which shows how much credit the tenant matters."],
      ex: [["google-fluidstack-terawulf-backstop", "TeraWulf"], ["google-fluidstack-cipher-backstop", "Cipher"]] },

    { id: "abs", gloss: "ABS and CMBS are bonds backed by a pool of payments. ABS (asset-backed securities) are backed by things like equipment or lease payments, and CMBS (commercial mortgage-backed securities) by mortgages on commercial buildings. Different layers of the bond get paid in a set order.", title: "Data-center ABS and CMBS",
      ana: "Like a landlord who bundles a hundred leases into a bond, sells slices to different buyers, and lets the safest slice get paid first.",
      nodes: [{ id: "own", t: "Data center|owner", x: 60, y: 50, kind: "asset" }, { id: "ten", t: "Tenants|long leases", x: 60, y: 190 }, { id: "trust", t: "Securitization|trust", x: 200, y: 120, kind: "spv" }, { id: "sen", t: "Senior bonds|(paid first)", x: 340, y: 60, kind: "lender" }, { id: "jun", t: "Junior bonds|(paid last)", x: 340, y: 190, kind: "lender" }],
      edges: [{ from: "ten", to: "own", kind: "promise", l: "long leases", s: 1 }, { from: "own", to: "trust", kind: "promise", l: "leases / mortgage", s: 2 },
        { from: "sen", to: "trust", kind: "debt", l: "buys", s: 3, o: 0 }, { from: "jun", to: "trust", kind: "debt", l: "buys", s: 3, o: 0 },
        { from: "ten", to: "trust", kind: "cash", l: "rent", s: 4, o: 8 }, { from: "trust", to: "sen", kind: "cash", l: "paid first", s: 4, o: -8 }],
      steps: ["A data center is leased to tenants for years. The leases are promises of future rent.",
        "The owner puts the lease income, or a mortgage on the building, into a trust.",
        "The trust sells bonds in layers. Safer layers get a lower rate and are paid first. Riskier layers get a higher rate.",
        "Rent flows in and pays the senior layer first, then the layers below it. The owner gets cash up front to build the next hall."],
      why: ["Insurers and pension funds want long, steady income, and this packages it for them.", "The owner recycles capital into new buildings faster.", "Layering lets different buyers pick their own risk."],
      watch: ["How concentrated the tenants are. A few labs sit behind many leases.", "How the lease term compares with the bond term, and what happens when a hall must be re-leased.", "Whether older buildings and hardware hold their value."],
      ex: [["pimco-oracle-michigan-bond", "Bond market for a Stargate site"], ["oracle-vantage-stargate-loans", "Construction loans for Stargate campuses"]], facts: [["dc-abs-cmbs-ytd", "Issuance this year", function (f) { return "Data-center ABS and CMBS issuance of about " + fB(f.value) + " so far in 2026."; }], ["dc-securitized-outstanding", "Size of the market", function (f) { return (ctx.readerNote(f) || ctx.clean(f.label) || "Size of the data-center securitized market.").replace(/[.\s]+$/, "") + "."; }]] },

    { id: "backlev", title: "Private-credit funds financed with bank back-leverage",
      ana: "Like a mortgage broker who lends out money from friends, then borrows more from a bank against those mortgages, so she can lend even more.",
      nodes: [{ id: "lp", t: "Fund investors|(LPs)", x: 60, y: 50 }, { id: "fund", t: "Credit fund", x: 200, y: 120, kind: "spv" }, { id: "bank", t: "Bank|back-leverage", x: 60, y: 190, kind: "lender" }, { id: "bor", t: "GPU SPV or|neocloud", x: 340, y: 120, kind: "asset" }],
      edges: [{ from: "lp", to: "fund", kind: "cash", l: "commit money", s: 1 }, { from: "fund", to: "bor", kind: "debt", l: "senior loan", s: 2 },
        { from: "fund", to: "bank", kind: "promise", l: "loans pledged", s: 3, o: 8 }, { from: "bank", to: "fund", kind: "debt", l: "lends to fund", s: 3, o: -8 },
        { from: "fund", to: "bor", kind: "debt", l: "more loans", s: 4, o: 12 }],
      steps: ["Investors commit money to a private-credit fund.",
        "The fund makes senior loans, for example to a GPU SPV like the ones in card 1.",
        "The fund pledges those loans to a bank and borrows against them. That's back-leverage. The bank's claim sits ahead of the fund's own investors.",
        "With the extra money the fund makes more loans. Returns to investors rise in good times, and so do losses in bad times."],
      why: ["It lets a fund lend more per dollar its investors put in.", "It can lift investor returns when loans perform.", "Banks get a lower-risk way to lend to the sector."],
      watch: ["How much leverage sits behind each loan, and how quickly it's called if collateral values fall.", "Margin-call and valuation terms, which are rarely public.", "Who ultimately holds the risk if chips lose value faster than expected."],
      ex: [["blackstone-magnetar-coreweave", "GPU-collateralized loans from private-credit lenders"]], custom: function (ul) {
        var li = h("li"); li.appendChild(h("b", { text: "Our toy model. " }));
        var txt = "We assume the fund borrows from a bank at a back-leverage ratio of " + (backLev ? backLev.value : "n/a") + " and, per $100 of seed cash, that gives a bank claim of about $" + (bankSlice ? bankSlice.face_value.value.toFixed(1) : "n/a") + " sitting inside the senior loan (see Chapter 5). The actual back-leverage on specific AI deals isn't disclosed in our data. ";
        li.appendChild(document.createTextNode(txt)); li.appendChild(ctx.tag(bankSlice ? bankSlice.face_value.status : "hypothetical")); ul.appendChild(li);
      } }
  ];

  // ---------- build cards
  var host = q("[data-cards]");
  cards.forEach(function (c, ci) {
    var art = h("article", { "class": "ch08-card", "aria-labelledby": "ch08-c" + ci });
    var statuses = (c.ex || []).map(function (e) { var d = D(e[0]); return d && d.status; }).filter(Boolean);
    var tt = h("h3", { id: "ch08-c" + ci, text: (ci + 1) + ". " + c.title });
    art.appendChild(tt);
    var ana = h("p", { "class": "ch08-ana" }, h("b", { text: "Plain English: " }), c.ana); art.appendChild(ana);
    if (c.gloss) art.appendChild(h("p", { "class": "ch08-gloss", text: c.gloss }));
    var dia = h("div", { "class": "ch08-dia" }); art.appendChild(dia);
    var dg = diagram({ title: c.title, nodes: c.nodes, edges: c.edges, steps: c.steps }, dia);
    var cap = h("p", { "class": "ch08-cap", "aria-live": "polite" }); art.appendChild(cap);
    var prev = h("button", { type: "button", "class": "btn small", text: "Back" }), next = h("button", { type: "button", "class": "btn small", text: "Next" }), reset = h("button", { type: "button", "class": "btn small", text: "Reset" }), cnt = h("span", { "class": "ch08-step" });
    art.appendChild(h("div", { "class": "ch08-ctl", role: "group", "aria-label": "Step through diagram " + (ci + 1) }, prev, next, reset, cnt));
    function upd() {
      var s = dg.get(), n = c.steps.length;
      cap.textContent = s === 0 ? "Press Next to walk through it, one step at a time. Dashed purple lines are promises, not cash." : c.steps[s - 1];
      cnt.textContent = "step " + s + " of " + n;
      prev.disabled = s === 0; next.textContent = s >= n ? "Replay" : "Next";
    }
    function go(d) { var n = c.steps.length, s = dg.get() + d; if (s > n) s = 0; if (s < 0) s = 0; dg.set(s); upd(); }
    next.addEventListener("click", function () { go(1); }); prev.addEventListener("click", function () { go(-1); }); reset.addEventListener("click", function () { dg.set(0); upd(); });
    dg.svg.addEventListener("click", function () { go(1); });
    dg.svg.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } else if (e.key === "ArrowRight") { e.preventDefault(); go(1); } });
    upd();
    art.appendChild(h("div", { "class": "ch08-cols" },
      h("div", null, h("h4", { text: "Why companies do it" }), (function () { var u = h("ul"); c.why.forEach(function (w) { u.appendChild(h("li", { text: w })); }); return u; })()),
      h("div", null, h("h4", { text: "What to watch" }), (function () { var u = h("ul"); c.watch.forEach(function (w) { u.appendChild(h("li", { text: w })); }); return u; })())));
    var ex = h("details", { "class": "ch08-ex" }, h("summary", { text: "Show a real example" })), ul = h("ul");
    (c.ex || []).forEach(function (e) { var d = D(e[0]); if (d) ul.appendChild(exItem(d, e[1])); });
    (c.facts || []).forEach(function (f) { var fo = F(f[0]); if (fo) ul.appendChild(factItem(fo, f[1], f[2](fo))); });
    if (c.custom) c.custom(ul);
    ex.appendChild(ul); art.appendChild(ex);
    host.appendChild(art);
  });

  var bondEl = q("[data-bond]"); if (bondEl && D("meta-hyperion-bond") && D("meta-hyperion-bond").headline_usd_b != null) bondEl.textContent = fB(D("meta-hyperion-bond").headline_usd_b);
  // ---------- closing
  var means = q("[data-means]");
  means.appendChild(document.createTextNode("Every structure above has a sensible reason behind it, and every one is also a way for risk to sit somewhere you can't see from the headline number. Put the cards together and you get one pattern: nearly every claim depends on the same future spending by people who use AI. Where the debt sits matters less than whether that spending shows up. And that, today, is something we don't know yet."));
  ctx.legend(q("[data-legend]"));
};
