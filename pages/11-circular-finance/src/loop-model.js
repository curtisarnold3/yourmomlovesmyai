/*!
 * loop-model.js  -  Episode 11 "The Loop" model layer.
 * Pure functions, no dependencies. UMD: window.LoopModel (browser) / module.exports (Node).
 * TOY MODEL. Every number is illustrative per $100 of seed cash unless a param says otherwise.
 * Parameter defaults between the GENERATED markers are written by tools/build_data.py
 * from the same definitions that produce data/loop-defaults.json. Do not edit them by hand.
 * See src/API.md for the full contract.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoopModel = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var STATUS_ORDER = ['verified', 'reported', 'calculated', 'hypothetical', 'unverified'];

  /* BEGIN GENERATED: DEFS */
  var PARAM_DEFS = [
    {"id": "seed_usd", "group": "scale", "label": "Seed: Nvidia cash put in at lap 1", "value": 100, "min": 10, "max": 1000, "step": 10, "unit": "USD", "status": "calculated", "scale": true},
    {"id": "loan_to_cost", "group": "spv", "label": "Loan-to-cost (debt as share of GPU build cost)", "value": 0.625, "min": 0.3, "max": 0.8, "step": 0.005, "unit": "fraction", "status": "reported"},
    {"id": "nvidia_share_of_build_cost", "group": "spv", "label": "Nvidia's share of the SPV's build cost (revenue it books)", "value": 0.6, "min": 0.3, "max": 0.85, "step": 0.01, "unit": "fraction", "status": "hypothetical"},
    {"id": "nvidia_gross_margin", "group": "nvidia", "label": "Nvidia gross margin on that revenue", "value": 0.748, "min": 0.5, "max": 0.85, "step": 0.001, "unit": "fraction", "status": "verified"},
    {"id": "gross_to_net_conversion", "group": "nvidia", "label": "Net profit as share of gross profit", "value": 0.75, "min": 0.3, "max": 0.95, "step": 0.01, "unit": "fraction", "status": "calculated"},
    {"id": "recurring_revenue_share", "group": "nvidia", "label": "Share of the new profit the market treats as recurring", "value": 0.5, "min": 0.0, "max": 1.0, "step": 0.05, "unit": "fraction", "status": "hypothetical"},
    {"id": "valuation_multiple", "group": "nvidia", "label": "Valuation multiple on net profit (P/E)", "value": 12, "min": 3, "max": 40, "step": 0.5, "unit": "x", "status": "hypothetical"},
    {"id": "reinvest_fraction", "group": "loop", "label": "Share of Nvidia's gross profit reinvested as next lap's seed", "value": 0.18, "min": 0.0, "max": 0.9, "step": 0.01, "unit": "fraction", "status": "calculated"},
    {"id": "contract_value_to_build_cost", "group": "contract", "label": "Compute contract value as a multiple of build cost", "value": 1.67, "min": 1.0, "max": 3.0, "step": 0.01, "unit": "x", "status": "calculated"},
    {"id": "contract_years", "group": "contract", "label": "Contract length (years)", "value": 5, "min": 1, "max": 10, "step": 0.5, "unit": "years", "status": "reported"},
    {"id": "contract_prepayment_share", "group": "contract", "label": "Prepayment share of contract value", "value": 0.2, "min": 0.0, "max": 0.5, "step": 0.01, "unit": "fraction", "status": "reported"},
    {"id": "lab_outside_revenue_share", "group": "lab", "label": "Share of lab payments funded by outside (end-user) revenue", "value": 0.5, "min": 0.1, "max": 0.95, "step": 0.05, "unit": "fraction", "status": "hypothetical"},
    {"id": "lab_funding_mix", "group": "lab", "label": "Share of the lab's raised capital that is recycled (from vendors)", "value": 0.5, "min": 0.0, "max": 0.9, "step": 0.05, "unit": "fraction", "status": "hypothetical"},
    {"id": "nvidia_share_of_vendor_funding", "group": "lab", "label": "Nvidia's share of vendor-sourced lab capital", "value": 0.375, "min": 0.0, "max": 1.0, "step": 0.005, "unit": "fraction", "status": "calculated"},
    {"id": "neocloud_opex_share", "group": "neocloud", "label": "Neocloud operating cost as share of contract revenue", "value": 0.35, "min": 0.1, "max": 0.7, "step": 0.01, "unit": "fraction", "status": "hypothetical"},
    {"id": "backstop_share_of_capacity", "group": "backstop", "label": "Nvidia backstop cap as share of the cluster's build cost", "value": 0.15, "min": 0.0, "max": 0.5, "step": 0.01, "unit": "fraction", "status": "hypothetical"},
    {"id": "backstop_trigger_shortfall", "group": "backstop", "label": "Backstop is called when lab payments fall short by at least", "value": 0.2, "min": 0.0, "max": 0.9, "step": 0.05, "unit": "fraction", "status": "hypothetical"},
    {"id": "credit_fund_back_leverage_ratio", "group": "capital", "label": "Credit-fund back-leverage (bank debt per $1 of LP equity)", "value": 0.5, "min": 0.0, "max": 2.0, "step": 0.05, "unit": "x", "status": "hypothetical"},
    {"id": "mezz_ratio", "group": "capital", "label": "Neocloud parent bonds/converts per $1 of Nvidia equity", "value": 0.5, "min": 0.0, "max": 2.0, "step": 0.05, "unit": "x", "status": "hypothetical"},
    {"id": "margin_loan_share", "group": "capital", "label": "Share of neocloud stock held on margin", "value": 0.2, "min": 0.0, "max": 0.7, "step": 0.05, "unit": "fraction", "status": "hypothetical"},
    {"id": "neocloud_equity_mark", "group": "capital", "label": "Market value of Nvidia's neocloud stake vs cost (1.0 = at cost)", "value": 1.0, "min": 0.2, "max": 3.0, "step": 0.05, "unit": "x", "status": "hypothetical"},
    {"id": "gpu_useful_life_years", "group": "asset", "label": "GPU useful life (years)", "value": 5, "min": 3, "max": 6, "step": 0.5, "unit": "years", "status": "reported"},
    {"id": "gpu_rental_decline_per_year", "group": "asset", "label": "Annual decline in rental value of the GPUs", "value": 0.1, "min": 0.0, "max": 0.4, "step": 0.01, "unit": "per year", "status": "hypothetical"},
    {"id": "base_rate", "group": "rates", "label": "Base rate (SOFR proxy)", "value": 0.03875, "min": 0.0, "max": 0.08, "step": 0.00125, "unit": "per year", "status": "reported"},
    {"id": "credit_spread", "group": "rates", "label": "Credit spread over base rate", "value": 0.04, "min": 0.01, "max": 0.1, "step": 0.0005, "unit": "per year", "status": "reported"},
    {"id": "debt_term_years", "group": "rates", "label": "Debt amortization term (years)", "value": 5, "min": 2, "max": 10, "step": 0.5, "unit": "years", "status": "hypothetical"},
    {"id": "floating_share", "group": "rates", "label": "Share of debt that floats with the base rate", "value": 0.5, "min": 0.0, "max": 1.0, "step": 0.05, "unit": "fraction", "status": "hypothetical"}
  ];
  var PRESETS = {"coreweave_like": {"label": "CoreWeave-like", "params": {"loan_to_cost": 0.65, "gpu_useful_life_years": 6, "backstop_share_of_capacity": 0.17, "lab_outside_revenue_share": 0.7, "neocloud_equity_mark": 0.5, "credit_spread": 0.04}}, "oracle_like": {"label": "Oracle-like", "params": {"loan_to_cost": 0.75, "nvidia_share_of_build_cost": 0.45, "backstop_share_of_capacity": 0.0, "lab_outside_revenue_share": 0.45, "contract_value_to_build_cost": 2.0, "credit_spread": 0.03}}, "xai_spv_like": {"label": "xAI SPV-like", "params": {"loan_to_cost": 0.625, "backstop_share_of_capacity": 0.0, "contract_value_to_build_cost": 1.3, "lab_outside_revenue_share": 0.3, "lab_funding_mix": 0.4, "credit_spread": 0.044, "credit_fund_back_leverage_ratio": 0.0, "mezz_ratio": 0.0}}};
  /* END GENERATED: DEFS */

  // ---------------------------------------------------------------- utilities
  function rank(s) { var i = STATUS_ORDER.indexOf(s); return i < 0 ? STATUS_ORDER.length : i; }
  function weakestStatus(list) {
    var w = 'verified';
    for (var i = 0; i < list.length; i++) if (rank(list[i]) > rank(w)) w = list[i];
    return w;
  }
  var DEF = {};
  PARAM_DEFS.forEach(function (d) { DEF[d.id] = d; });
  function rebuildDefIndex() { DEF = {}; PARAM_DEFS.forEach(function (d) { DEF[d.id] = d; }); }
  rebuildDefIndex();

  function n(x) {
    if (typeof x !== 'number' || !isFinite(x)) return String(x);
    var s = Math.abs(x) >= 100 ? x.toFixed(1) : Math.abs(x) >= 1 ? x.toFixed(2) : x.toFixed(4);
    return String(parseFloat(s));
  }
  function decimals(x) {
    var s = String(x);
    if (s.indexOf('e-') >= 0) return parseInt(s.split('e-')[1], 10) + (s.split('e-')[0].split('.')[1] || '').length;
    return (s.split('.')[1] || '').length;
  }
  function near(a, b) { return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }

  function defaults() {
    var o = {};
    PARAM_DEFS.forEach(function (d) { o[d.id] = d.value; });
    return o;
  }
  function paramDefs() { return JSON.parse(JSON.stringify(PARAM_DEFS)); }
  function presetNames() { return Object.keys(PRESETS); }
  function presets() { return JSON.parse(JSON.stringify(PRESETS)); }

  function validateParams(params) {
    var errors = [];
    params = params || {};
    Object.keys(params).forEach(function (k) {
      var d = DEF[k];
      if (!d) { errors.push('unknown parameter: ' + k); return; }
      var v = params[k];
      if (typeof v !== 'number' || !isFinite(v)) { errors.push(k + ' must be a finite number'); return; }
      if (v < d.min - 1e-12 || v > d.max + 1e-12) errors.push(k + '=' + v + ' outside [' + d.min + ', ' + d.max + ']');
    });
    return { ok: errors.length === 0, errors: errors };
  }
  function resolveParams(params) {
    var v = validateParams(params);
    if (!v.ok) throw new RangeError('Invalid params: ' + v.errors.join('; '));
    var out = defaults();
    Object.keys(params || {}).forEach(function (k) { out[k] = params[k]; });
    return out;
  }
  function applyPreset(name, overrides) {
    var p = PRESETS[name];
    if (!p) throw new Error('unknown preset: ' + name);
    var out = defaults();
    Object.keys(p.params).forEach(function (k) { out[k] = p.params[k]; });
    Object.keys(overrides || {}).forEach(function (k) { out[k] = overrides[k]; });
    var v = validateParams(out);
    if (!v.ok) throw new RangeError('Invalid params: ' + v.errors.join('; '));
    return out;
  }
  // status of a parameter at its current value: user-changed values are hypothetical
  function effectiveStatus(id, value) {
    var d = DEF[id];
    if (!d) return 'unverified';
    if (d.scale) return d.status;
    return near(value, d.value) ? d.status : 'hypothetical';
  }

  // ---------------------------------------------------------------- tagged values
  // Q = internal node {v, d (dependency ids), f (formula text)}; T = public {value,status,formula_text}
  function makeCtx(P, extraStatuses) {
    var ctx = { v: P, extra: extraStatuses || {} };
    ctx.st = {};
    Object.keys(P).forEach(function (k) { ctx.st[k] = effectiveStatus(k, P[k]); });
    ctx.p = function (id) { return { v: ctx.v[id], d: [id], f: id + ' = ' + n(ctx.v[id]) + (DEF[id] ? ' (' + DEF[id].label + ')' : '') }; };
    ctx.status = function (deps, floor) {
      var arr = [];
      deps.forEach(function (id) { arr.push(ctx.st[id] || ctx.extra[id] || 'hypothetical'); });
      var w = arr.length ? weakestStatus(arr) : 'calculated';
      if (floor && rank(w) < rank('calculated')) w = 'calculated';
      return w;
    };
    return ctx;
  }
  function Q(v, f) {
    var d = [];
    for (var i = 2; i < arguments.length; i++) {
      var s = arguments[i];
      if (s === null || s === undefined) continue;
      if (typeof s === 'string') { if (d.indexOf(s) < 0) d.push(s); }
      else if (s && s.d) s.d.forEach(function (id) { if (d.indexOf(id) < 0) d.push(id); });
    }
    return { v: v, f: f, d: d };
  }
  function T(ctx, q, derived) {
    return { value: q.v, status: ctx.status(q.d, derived !== false), formula_text: q.f };
  }
  function plain(x) {
    if (Array.isArray(x)) return x.map(plain);
    if (x && typeof x === 'object') {
      var k = Object.keys(x);
      if (k.indexOf('value') >= 0 && k.indexOf('status') >= 0 && k.indexOf('formula_text') >= 0) return x.value;
      var o = {};
      k.forEach(function (key) { o[key] = plain(x[key]); });
      return o;
    }
    return x;
  }

  // ---------------------------------------------------------------- one lap
  function annuity(principal, rate, years) {
    if (years <= 0) return principal;
    if (rate <= 0) return principal / years;
    return principal * rate / (1 - Math.pow(1 + rate, -years));
  }

  var CLAIM_META = [
    { id: 'c1', n: 1, hop: 1, label: 'Nvidia equity in the neocloud', holders: ['nvidia'], kind: 'equity' },
    { id: 'c2', n: 2, hop: 2, label: 'Senior secured lender (GPU loan)', holders: ['senior_lender'], kind: 'cash_claim' },
    { id: 'c3', n: 3, hop: 5, label: 'Lab compute right and prepayment (receivables pledged to lenders)', holders: ['lab'], kind: 'promise_right' },
    { id: 'c4', n: 4, hop: 6, label: 'Nvidia stake in the lab', holders: ['nvidia'], kind: 'equity' },
    { id: 'c5', n: 5, hop: 6, label: "Lab's other investors and their lenders", holders: ['lab_investors', 'lab_investor_lenders'], kind: 'equity' },
    { id: 'c6', n: 6, hop: 7, label: 'Nvidia backstop of unused capacity (contingent)', holders: ['nvidia'], kind: 'contingent_promise' },
    { id: 'c7', n: 7, hop: 8, label: 'Bank back-leverage to the credit fund', holders: ['bank'], kind: 'cash_claim' },
    { id: 'c8', n: 8, hop: 8, label: "Credit fund's LPs", holders: ['lps'], kind: 'cash_claim' },
    { id: 'c9', n: 9, hop: 9, label: 'Neocloud stock and bond holders (some on margin)', holders: ['neocloud_holders'], kind: 'equity' }
  ];

  function lapNodes(ctx, S, opts) {
    var p = ctx.p;
    var L = p('loan_to_cost'), sN = p('nvidia_share_of_build_cost'), GM = p('nvidia_gross_margin');
    var q = p('gross_to_net_conversion'), rec = p('recurring_revenue_share'), mult = p('valuation_multiple');
    var rho = p('reinvest_fraction'), c = p('contract_value_to_build_cost'), yrs = p('contract_years');
    var pp = p('contract_prepayment_share'), o = p('lab_outside_revenue_share'), m = p('lab_funding_mix');
    var ns = p('nvidia_share_of_vendor_funding'), b = p('backstop_share_of_capacity');
    var lam = p('credit_fund_back_leverage_ratio'), mz = p('mezz_ratio'), ms = p('margin_loan_share'), mark = p('neocloud_equity_mark');

    var N = {};
    N.S = S;
    N.D = Q(S.v * L.v / (1 - L.v), 'D = E × L/(1−L) = ' + n(S.v) + ' × ' + n(L.v) + '/(1−' + n(L.v) + ')', S, L);
    N.B = Q(S.v + N.D.v, 'Build cost B = E + D = ' + n(S.v) + ' + ' + n(N.D.v), S, N.D);
    N.R = Q(sN.v * N.B.v, 'Nvidia revenue R = s_N × B = ' + n(sN.v) + ' × ' + n(N.B.v), sN, N.B);
    var recShare;
    if (opts.attribution === 'seed_first') {
      var rr = Math.min(S.v, N.R.v);
      N.Rrec = Q(rr, 'Recycled revenue = min(E, R) = min(' + n(S.v) + ', ' + n(N.R.v) + ') (seed-first attribution)', S, N.R);
    } else {
      N.Rrec = Q(N.R.v * S.v / N.B.v, 'Recycled revenue = R × E/B = ' + n(N.R.v) + ' × ' + n(S.v) + '/' + n(N.B.v) + ' (pro-rata attribution)', N.R, S, N.B);
    }
    N.Rext = Q(N.R.v - N.Rrec.v, 'External-funded revenue = R − recycled = ' + n(N.R.v) + ' − ' + n(N.Rrec.v), N.R, N.Rrec);
    N.GP = Q(N.R.v * GM.v, 'Gross profit = R × GM = ' + n(N.R.v) + ' × ' + n(GM.v), N.R, GM);
    N.NI = Q(N.GP.v * q.v, 'Net profit = GP × net conversion = ' + n(N.GP.v) + ' × ' + n(q.v), N.GP, q);
    N.Paper = Q(rec.v * N.NI.v * mult.v, 'Paper value = recurring share × net profit × multiple = ' + n(rec.v) + ' × ' + n(N.NI.v) + ' × ' + n(mult.v), rec, N.NI, mult);
    N.C = Q(c.v * N.B.v, 'Contract value C = (C/B) × B = ' + n(c.v) + ' × ' + n(N.B.v), c, N.B);
    N.P1 = Q(N.C.v / yrs.v, 'Year-1 lab payment = C / contract years = ' + n(N.C.v) + '/' + n(yrs.v), N.C, yrs);
    N.Prepay = Q(pp.v * N.C.v, 'Prepayment = prepay share × C = ' + n(pp.v) + ' × ' + n(N.C.v), pp, N.C);
    N.labExt = Q(N.P1.v * o.v, 'Paid from end-user revenue = P1 × o = ' + n(N.P1.v) + ' × ' + n(o.v), N.P1, o);
    N.labCap = Q(N.P1.v * (1 - o.v), 'Paid from capital raised = P1 × (1−o) = ' + n(N.P1.v) + ' × (1−' + n(o.v) + ')', N.P1, o);
    N.labCapRec = Q(N.labCap.v * m.v, 'Capital from vendors/recycled sources = capital × m = ' + n(N.labCap.v) + ' × ' + n(m.v), N.labCap, m);
    N.labCapExt = Q(N.labCap.v - N.labCapRec.v, 'Capital from outside investors = capital − recycled = ' + n(N.labCap.v) + ' − ' + n(N.labCapRec.v), N.labCap, N.labCapRec);
    N.nvLab = Q(N.labCapRec.v * ns.v, 'Nvidia stake in lab = recycled capital × Nvidia share = ' + n(N.labCapRec.v) + ' × ' + n(ns.v), N.labCapRec, ns);
    N.otherLab = Q(N.labCap.v - N.nvLab.v, "Lab's other investors = capital − Nvidia stake = " + n(N.labCap.v) + ' − ' + n(N.nvLab.v), N.labCap, N.nvLab);
    N.Back = Q(b.v * N.B.v, 'Backstop cap = backstop share × B = ' + n(b.v) + ' × ' + n(N.B.v), b, N.B);
    N.Bank = Q(N.D.v * lam.v / (1 + lam.v), 'Bank back-leverage = D × λ/(1+λ) = ' + n(N.D.v) + ' × ' + n(lam.v) + '/(1+' + n(lam.v) + ')', N.D, lam);
    N.LP = Q(N.D.v - N.Bank.v, 'LP money = D − bank = ' + n(N.D.v) + ' − ' + n(N.Bank.v), N.D, N.Bank);
    N.EqMV = Q(S.v * mark.v, 'Neocloud equity at market = E × mark = ' + n(S.v) + ' × ' + n(mark.v), S, mark);
    N.MTM = Q(S.v * (mark.v - 1), 'Nvidia mark-to-market gain = E × (mark − 1) = ' + n(S.v) + ' × (' + n(mark.v) + ' − 1)', S, mark);
    N.Margin = Q(ms.v * N.EqMV.v, 'Margin debt against the slice = margin share × equity at market = ' + n(ms.v) + ' × ' + n(N.EqMV.v), ms, N.EqMV);
    N.Mezz = Q(mz.v * S.v, 'Parent bonds/converts face = mezz ratio × E = ' + n(mz.v) + ' × ' + n(S.v), mz, S);
    N.Next = Q(rho.v * N.GP.v, 'Next-lap seed = reinvest fraction × gross profit = ' + n(rho.v) + ' × ' + n(N.GP.v), rho, N.GP);
    // cash tallies
    N.ext = Q(N.D.v + N.labExt.v + N.labCapExt.v, 'External cash = debt + end-user payments + outside lab capital', N.D, N.labExt, N.labCapExt);
    N.rec = Q(S.v + N.labCapRec.v, 'Recycled cash = Nvidia equity + vendor-sourced lab capital', S, N.labCapRec);
    return N;
  }

  var KEYS = ['seed_equity', 'debt_created', 'revenue_booked_total', 'revenue_external', 'revenue_recycled',
    'revenue_counted_times', 'market_value_paper', 'cash_created', 'external_cash', 'external_end_user',
    'external_capital', 'recycled_cash', 'cash_moved', 'external_share', 'recycled_share',
    'promises_outstanding', 'claims_count', 'claimants_count'];

  function claimsFor(ctx, N) {
    var faces = {
      c1: N.S, c2: N.D, c3: N.Prepay, c4: N.nvLab, c5: N.otherLab, c6: N.Back, c7: N.Bank, c8: N.LP,
      c9: Q(N.Mezz.v + N.Margin.v, 'Bonds/converts + margin debt tied to the slice = ' + n(N.Mezz.v) + ' + ' + n(N.Margin.v), N.Mezz, N.Margin)
    };
    return CLAIM_META.map(function (m) {
      var face = faces[m.id];
      // c1, c2, c3 and c9 always exist; the rest exist only if their face value is above zero
      var active = (m.id === 'c1' || m.id === 'c2' || m.id === 'c3' || m.id === 'c9') ? true : face.v > 1e-12;
      return {
        id: m.id, n: m.n, hop: m.hop, label: m.label, holders: m.holders, kind: m.kind,
        active: active, face_value: T(ctx, face), depends_on_end_user_spending: true
      };
    });
  }

  // running tallies per hop for one lap
  function lapHops(ctx, N, opts) {
    var claims = claimsFor(ctx, N);
    var run = { seed: Q(0, '0'), debt: Q(0, '0'), R: Q(0, '0'), Rext: Q(0, '0'), Rrec: Q(0, '0'), paper: Q(0, '0'),
      ext: Q(0, '0'), extUser: Q(0, '0'), extCap: Q(0, '0'), rec: Q(0, '0'), prom: Q(0, '0') };
    var activeClaims = [];
    function add(a, b, f) { return Q(a.v + b.v, f || a.f, a, b); }
    function sub(a, b, f) { return Q(a.v - b.v, f || a.f, a, b); }
    function snapshot() {
      var cm = Q(run.ext.v + run.rec.v, 'Cash moved = external + recycled', run.ext, run.rec);
      var parties = {};
      activeClaims.forEach(function (c) { c.holders.forEach(function (h) { parties[h] = 1; }); });
      var out = {
        seed_equity: T(ctx, Q(run.seed.v, 'Σ Nvidia equity put into the neocloud', run.seed)),
        debt_created: T(ctx, Q(run.debt.v, 'Σ lender debt created', run.debt)),
        revenue_booked_total: T(ctx, Q(run.R.v, 'Σ revenue booked by Nvidia', run.R)),
        revenue_external: T(ctx, Q(run.Rext.v, 'Revenue funded by outside (lender) cash', run.Rext)),
        revenue_recycled: T(ctx, Q(run.Rrec.v, "Revenue funded by Nvidia's own recycled cash", run.Rrec)),
        revenue_counted_times: T(ctx, Q(run.seed.v > 0 ? run.R.v / run.seed.v : 0, 'Revenue booked / seed equity = ' + n(run.R.v) + '/' + n(run.seed.v), run.R, run.seed)),
        market_value_paper: T(ctx, Q(run.paper.v, 'Paper market value (NOT cash)', run.paper)),
        cash_created: T(ctx, Q(run.ext.v, 'Outside money entering the loop (= external cash). Most of it is lender debt that must be repaid, so it is not "created" wealth', run.ext)),
        external_cash: T(ctx, Q(run.ext.v, 'External cash: lender debt + end-user payments + outside lab investors', run.ext)),
        external_end_user: T(ctx, Q(run.extUser.v, 'of which paid by end users via the lab', run.extUser)),
        external_capital: T(ctx, Q(run.extCap.v, 'of which lenders/outside investors (must be repaid or earn a return from future end-user money)', run.extCap)),
        recycled_cash: T(ctx, Q(run.rec.v, 'Recycled cash: Nvidia equity + vendor-sourced lab capital', run.rec)),
        cash_moved: T(ctx, cm),
        external_share: T(ctx, Q(cm.v > 0 ? run.ext.v / cm.v : 0, 'External / (external + recycled) = ' + n(run.ext.v) + '/' + n(cm.v), run.ext, cm)),
        recycled_share: T(ctx, Q(cm.v > 0 ? run.rec.v / cm.v : 0, 'Recycled / (external + recycled) = ' + n(run.rec.v) + '/' + n(cm.v), run.rec, cm)),
        promises_outstanding: T(ctx, Q(run.prom.v, 'Promises outstanding (contracts, backstops): NOT cash', run.prom)),
        claims_count: T(ctx, Q(activeClaims.length, 'Number of distinct claims created so far')),
        claimants_count: T(ctx, Q(Object.keys(parties).length, 'Distinct parties holding those claims'))
      };
      return out;
    }
    function claimsAtHop(h) {
      var ids = [];
      claims.forEach(function (c) { if (c.hop === h && c.active) { activeClaims.push(c); ids.push(c.id); } });
      return ids;
    }
    var hops = [];
    function push(h, id, title, from, to, kind, desc, amount, values, extra) {
      var ids = claimsAtHop(h);
      var hop = {
        hop: h, id: id, title: title, from: from, to: to, money_kind: kind, description: desc,
        amount: T(ctx, amount, false), values: values || {}, claims_added: ids,
        hatched: kind === 'paper', is_cash: kind === 'recycled' || kind === 'external' || kind === 'recycled+external' || kind === 'external+recycled',
        is_promise: kind === 'promise'
      };
      if (extra) Object.keys(extra).forEach(function (k) { hop[k] = extra[k]; });
      hop.running = snapshot();
      hops.push(hop);
    }
    var S = N.S;
    // hop 0
    push(0, 'nvidia-cash', 'Nvidia holds the cash', 'nvidia', 'nvidia', 'none',
      'Nvidia holds the seed dollars. Nothing has moved; no claim exists yet.', S, { nvidia_cash: T(ctx, S, false) });
    // hop 1
    run.seed = add(run.seed, S, 'Σ Nvidia equity'); run.rec = add(run.rec, S, 'Recycled cash');
    push(1, 'equity-in', 'Nvidia invests equity in the neocloud', 'nvidia', 'neocloud', 'recycled',
      "Nvidia's own cash goes into a neocloud as equity (claim #1). It is recycled: the same money will come back as Nvidia revenue.", S,
      { equity_invested: T(ctx, S, false) });
    // hop 2
    run.debt = add(run.debt, N.D, 'Σ debt'); run.ext = add(run.ext, N.D, 'External cash'); run.extCap = add(run.extCap, N.D, 'External capital');
    push(2, 'spv-debt', 'Neocloud puts the equity in a GPU SPV; lenders add debt', 'lenders', 'spv', 'external',
      'The equity is the first-loss slice of a special-purpose vehicle. Lenders add debt = E × L/(1−L) at loan-to-cost L (claim #2, senior and secured by the GPUs). This is new outside cash.', N.D,
      { spv_equity: T(ctx, S, false), debt_created: T(ctx, N.D), build_cost: T(ctx, N.B), loan_to_cost_check: T(ctx, Q(N.D.v / N.B.v, 'D/B', N.D, N.B)) });
    // hop 3
    run.R = add(run.R, N.R, 'Σ revenue'); run.Rext = add(run.Rext, N.Rext, 'ext rev'); run.Rrec = add(run.Rrec, N.Rrec, 'rec rev');
    push(3, 'servers-bought', 'SPV buys servers; Nvidia books revenue', 'spv', 'nvidia', 'recycled+external',
      "The SPV spends its whole build cost on servers. Nvidia's share of that bill comes back to Nvidia as revenue. Part is funded by Nvidia's own recycled equity, part by lender cash.", N.R,
      { revenue_booked: T(ctx, N.R), revenue_recycled: T(ctx, N.Rrec), revenue_external: T(ctx, N.Rext) });
    // hop 4
    run.paper = add(run.paper, N.Paper, 'Σ paper');
    push(4, 'paper-value', 'Nvidia books gross profit; the market capitalizes it', 'market', 'nvidia', 'paper',
      'Revenue becomes gross profit, then net profit; the market values that profit at a multiple. This is paper value (hatched): not cash, and it moves with the multiple.', N.Paper,
      { gross_profit: T(ctx, N.GP), net_profit: T(ctx, N.NI), market_value_paper: T(ctx, N.Paper) });
    // hop 5
    run.prom = add(run.prom, N.C, 'Σ promises');
    push(5, 'compute-contract', 'Neocloud signs a compute contract with a lab', 'lab', 'neocloud', 'promise',
      "The neocloud signs a multi-year contract to rent the compute to an AI lab. It is a promise, not cash. It is pledged to the lenders (receivables pledged). The lab gets a claim on the capacity (claim #3).", N.C,
      { contract_value: T(ctx, N.C), contract_years: T(ctx, ctx.p('contract_years'), false), prepayment: T(ctx, N.Prepay) });
    // hop 6
    run.prom = sub(run.prom, N.P1, 'Σ promises');
    run.ext = add(run.ext, Q(N.labExt.v + N.labCapExt.v, 'x', N.labExt, N.labCapExt), 'External cash');
    run.extUser = add(run.extUser, N.labExt, 'end user'); run.extCap = add(run.extCap, N.labCapExt, 'ext capital');
    run.rec = add(run.rec, N.labCapRec, 'Recycled cash');
    push(6, 'lab-pays', 'The lab pays: part customers, part raised capital', 'lab', 'neocloud', 'external+recycled',
      "In year 1 the lab pays 1/years of the contract. Some comes from its outside (end-user) revenue; the rest from capital it raised, including Nvidia's own stake in the lab (claim #4) and other investors and their lenders (claim #5). The paid year-1 slice converts from promise to cash.", N.P1,
      { year1_payment: T(ctx, N.P1), paid_from_end_users: T(ctx, N.labExt), paid_from_raised_capital: T(ctx, N.labCap),
        raised_capital_recycled: T(ctx, N.labCapRec), raised_capital_external: T(ctx, N.labCapExt),
        nvidia_stake_in_lab: T(ctx, N.nvLab), other_lab_investors: T(ctx, N.otherLab) });
    // hop 7
    run.prom = add(run.prom, N.Back, 'Σ promises');
    push(7, 'backstop', 'Nvidia backstops unused neocloud capacity', 'nvidia', 'neocloud', 'promise',
      "Nvidia promises to buy capacity the neocloud cannot sell, up to a cap (claim #6, contingent). Nothing is paid unless demand falls short. It is a promise, not cash.", N.Back,
      { backstop_cap: T(ctx, N.Back) });
    // hop 8
    push(8, 'credit-fund', 'The private-credit lender funds its loan with LP money plus bank back-leverage', 'lps+bank', 'senior_lender', 'none',
      "The fund that made the loan did not use only its own cash: LPs put in D/(1+λ) and a bank lends D×λ/(1+λ) against the loan (claims #7 and #8). These are claims on the same loan, nested inside claim #2. The money is not new: it is how the debt created in hop 2 was funded.", N.D,
      { bank_back_leverage: T(ctx, N.Bank), lp_money: T(ctx, N.LP) });
    // hop 9
    push(9, 'marks', 'Neocloud stock and bonds sit in portfolios, some on margin; Nvidia marks its stake to market', 'markets', 'nvidia', 'paper',
      "Neocloud stock and bonds are held by investors, some with borrowed money (claim #9). Nvidia marks its stake to market; gains or losses flow to its earnings (non-operating, and left out of its adjusted figures, which are called non-GAAP; GAAP is the standard US accounting rulebook). Falling prices hurt margin borrowers and Nvidia's earnings at once: the loop is reflexive.", N.EqMV,
      { neocloud_equity_at_market: T(ctx, N.EqMV), nvidia_mark_to_market_gain: T(ctx, N.MTM), margin_debt: T(ctx, N.Margin), parent_bonds_converts: T(ctx, N.Mezz) });
    // hop 10
    push(10, 'loop-closes', 'The loop closes: profit and market value support the next round', 'nvidia', 'neocloud', 'recycled',
      "Nvidia reinvests a fraction of its gross profit as the next lap's seed. Higher revenue and market value make the next round easier to raise.", N.Next,
      { next_lap_seed: T(ctx, N.Next), lap_ratio: T(ctx, Q(S.v > 0 ? N.Next.v / S.v : 0, 'next seed / seed = ρ × GM × s_N / (1−L)', N.Next, S)) });
    return { hops: hops, claims: claims };
  }

  function ratioNode(ctx) {
    var p = ctx.p;
    var L = p('loan_to_cost'), sN = p('nvidia_share_of_build_cost'), GM = p('nvidia_gross_margin'), rho = p('reinvest_fraction');
    var r = rho.v * GM.v * sN.v / (1 - L.v);
    return Q(r, 'r = ρ × GM × s_N / (1−L) = ' + n(rho.v) + ' × ' + n(GM.v) + ' × ' + n(sN.v) + '/(1−' + n(L.v) + ') = ' + n(r), rho, GM, sN, L);
  }

  function sumKeys(laps) {
    // laps: array of per-lap totals (T objects). returns sums with weakest status
    var out = {};
    KEYS.forEach(function (k) {
      var vals = laps.map(function (t) { return t[k]; });
      var status = weakestStatus(vals.map(function (t) { return t.status; }));
      var v = vals.reduce(function (a, t) { return a + t.value; }, 0);
      out[k] = { value: v, status: status, formula_text: 'Σ over laps of ' + k };
    });
    // ratios are not additive
    var seed = out.seed_equity.value, R = out.revenue_booked_total.value;
    out.revenue_counted_times = { value: seed > 0 ? R / seed : 0, status: weakestStatus([out.revenue_booked_total.status, out.seed_equity.status]), formula_text: 'Σ revenue booked / Σ seed equity = ' + n(R) + '/' + n(seed) };
    var cm = out.external_cash.value + out.recycled_cash.value;
    out.cash_moved = { value: cm, status: weakestStatus([out.external_cash.status, out.recycled_cash.status]), formula_text: 'Σ external + Σ recycled' };
    out.external_share = { value: cm > 0 ? out.external_cash.value / cm : 0, status: out.cash_moved.status, formula_text: 'Σ external / Σ cash moved' };
    out.recycled_share = { value: cm > 0 ? out.recycled_cash.value / cm : 0, status: out.cash_moved.status, formula_text: 'Σ recycled / Σ cash moved' };
    // counts: claims are created once (same 9 claims, bigger faces), do not sum
    out.claims_count = laps[0].claims_count;
    out.claimants_count = laps[0].claimants_count;
    // promises: outstanding stock sums across laps
    return out;
  }

  /**
   * runLoop(params, laps, opts)
   * opts.attribution: 'pro_rata' (default) | 'seed_first'
   */
  function runLoop(params, laps, opts) {
    var P = resolveParams(params);
    opts = opts || {};
    if (opts.attribution && ['pro_rata', 'seed_first'].indexOf(opts.attribution) < 0) throw new Error('bad attribution');
    laps = laps === undefined ? 1 : laps;
    if (!Number.isInteger(laps) || laps < 1 || laps > 200) throw new RangeError('laps must be an integer 1..200');
    var ctx = makeCtx(P);
    var seed = ctx.p('seed_usd');
    var lapList = [];
    var S = seed;
    var totalsList = [];
    for (var i = 1; i <= laps; i++) {
      var N = lapNodes(ctx, S, opts);
      var h = lapHops(ctx, N, opts);
      var totals = h.hops[h.hops.length - 1].running;
      lapList.push({
        lap: i, seed: T(ctx, S, false), hops: h.hops, claims: h.claims, totals: totals,
        values: {
          debt: T(ctx, N.D), build_cost: T(ctx, N.B), revenue: T(ctx, N.R), gross_profit: T(ctx, N.GP),
          net_profit: T(ctx, N.NI), paper_value: T(ctx, N.Paper), contract_value: T(ctx, N.C),
          year1_payment: T(ctx, N.P1), backstop_cap: T(ctx, N.Back), next_seed: T(ctx, N.Next)
        }
      });
      totalsList.push(totals);
      S = Q(N.Next.v, 'S_{n+1} = ρ × GP_n = ' + n(N.Next.v), N.Next);
    }
    var cumulative = sumKeys(totalsList);
    var RCT_DEF = 'Booked revenue per $1 of seed cash: Σ revenue Nvidia books ÷ Σ Nvidia seed equity. It is NOT the dinner-table figure in chapter 1, which is total sales per $1 of real (outside) money.';
    cumulative.revenue_counted_times.definition = RCT_DEF;
    var rbook = cumulative.revenue_booked_total.value, rext = cumulative.external_cash.value;
    var bridge = {
      revenue_counted_times: { value: cumulative.revenue_counted_times.value, status: cumulative.revenue_counted_times.status, formula_text: cumulative.revenue_counted_times.formula_text, definition: RCT_DEF,
        label: 'Revenue booked per $1 of seed cash' },
      revenue_per_outside_dollar: { value: rext > 0 ? rbook / rext : null, status: weakestStatus([cumulative.revenue_booked_total.status, cumulative.external_cash.status]),
        formula_text: 'Σ revenue booked ÷ Σ external (outside) cash = ' + n(rbook) + '/' + n(rext),
        definition: 'Booked revenue per $1 of outside money entering the loop (lenders, end users, outside investors). This is the same kind of denominator as the chapter 1 dinner table (sales per $1 of real money), but the toy parts differ: the dinner table has no lender debt.',
        label: 'Revenue booked per $1 of outside cash' },
      note: 'Two different ratios share the idea "revenue counted N times". Name the denominator every time: per $1 of seed cash (revenue_counted_times) or per $1 of outside money (revenue_per_outside_dollar). The dinner table in chapter 1 counts sales per $1 of real money.'
    };
    var labels = {
      external_cash: 'Outside money (lender debt + end-user payments + outside investors)',
      cash_created: 'Outside money entering (mostly borrowed, not "created": lender debt must be repaid)',
      external_end_user: 'of which paid by end users',
      external_capital: 'of which borrowed or invested from outside (must be repaid or earn a return)',
      recycled_cash: "Recycled cash (Nvidia's equity and vendor-sourced lab capital)"
    };
    // promises outstanding cumulative equals sum of each lap's end-of-lap promise stock
    // (each lap has its own contract + backstop), already summed by sumKeys.

    // geometric info
    var r = ratioNode(ctx);
    var conv = r.v < 1;
    var factorN = r.v === 1 ? laps : (1 - Math.pow(r.v, laps)) / (1 - r.v);
    var factorInf = conv ? 1 / (1 - r.v) : null;
    var lap1 = lapList[0].totals;
    var limit = {}, closedN = {};
    KEYS.forEach(function (k) {
      if (['revenue_counted_times', 'external_share', 'recycled_share', 'claims_count', 'claimants_count', 'cash_moved'].indexOf(k) >= 0) return;
      var v1 = lap1[k].value;
      limit[k] = { value: conv ? v1 * factorInf : null, status: weakestStatus([lap1[k].status, ctx.status(r.d, true)]), formula_text: conv ? 'lap-1 value × 1/(1−r) = ' + n(v1) + ' × ' + n(factorInf) : 'diverges: r ≥ 1' };
      closedN[k] = { value: v1 * factorN, status: weakestStatus([lap1[k].status, ctx.status(r.d, true)]), formula_text: 'lap-1 value × (1−r^N)/(1−r) = ' + n(v1) + ' × ' + n(factorN) };
    });
    var geometric = {
      ratio: T(ctx, r),
      converges: conv,
      laps: laps,
      sum_factor_n_laps: T(ctx, Q(factorN, 'G_N = (1−r^N)/(1−r) = ' + n(factorN), r)),
      sum_factor_limit: conv ? T(ctx, Q(factorInf, 'G_∞ = 1/(1−r) = ' + n(factorInf), r)) : { value: null, status: ctx.status(r.d, true), formula_text: 'diverges: r ≥ 1, no finite limit' },
      derivation: 'Each lap, Nvidia reinvests a fraction ρ of that lap\'s gross profit as the next lap\'s seed: S_{n+1} = ρ × GM × R_n, where R_n = s_N × S_n/(1−L). So S_{n+1} = r × S_n with r = ρ × GM × s_N / (1−L). Every flow in a lap is proportional to its seed, so cumulative totals after N laps equal lap-1 totals × (1−r^N)/(1−r). The series converges only if r < 1.',
      limit: limit,
      closed_form_cumulative: closedN
    };
    return {
      model_version: VERSION,
      toy_model_notice: 'Illustrative toy model. Outputs derived from hypothetical inputs are tagged hypothetical.',
      params: P,
      laps: laps,
      attribution: opts.attribution || 'pro_rata',
      attribution_note: 'Which dollars count as "recycled" is a choice. Pro-rata (default) spreads Nvidia\'s own cash across all revenue (recycled = revenue × seed/build cost). Seed-first says Nvidia\'s dollars come back first, so recycled = min(seed, revenue) and the recycled/external split of revenue flips (default numbers: 60/100 pro-rata vs 100/60 seed-first). Cash totals do not change.',
      bridge: bridge,
      labels: labels,
      lap_traces: lapList,
      hops: lapList[0].hops,
      claims: lapList[0].claims,
      cumulative: cumulative,
      geometric: geometric,
      checks: checkIdentities(lapList[0])
    };
  }

  function checkIdentities(lap) {
    var v = {};
    lap.hops.forEach(function (h) { v[h.id] = h; });
    var t = lap.totals;
    var tol = 1e-9;
    return {
      build_cost_equals_equity_plus_debt: Math.abs(lap.values.build_cost.value - (t.seed_equity.value + t.debt_created.value)) < tol,
      revenue_split_adds_up: Math.abs(t.revenue_booked_total.value - t.revenue_external.value - t.revenue_recycled.value) < tol,
      cash_split_adds_to_100pct: Math.abs(t.external_share.value + t.recycled_share.value - 1) < tol,
      end_user_plus_capital_equals_external: Math.abs(t.external_cash.value - t.external_end_user.value - t.external_capital.value) < tol,
      promises_not_in_cash: Math.abs(t.cash_moved.value - (t.external_cash.value + t.recycled_cash.value)) < tol
    };
  }

  // ---------------------------------------------------------------- leverage
  function leverage(params, opts) {
    var P = resolveParams(params);
    opts = opts || {};
    var ctx = makeCtx(P);
    var N = lapNodes(ctx, ctx.p('seed_usd'), opts);
    var steps = [
      { id: 'seed', label: 'Nvidia equity in the neocloud', kind: 'recycled_cash', delta: T(ctx, N.S, false), running_total: T(ctx, N.S, false), hatched: false },
      { id: 'debt', label: 'Lenders add debt (loan-to-cost)', kind: 'external_cash', delta: T(ctx, N.D), running_total: T(ctx, N.B), hatched: false },
      { id: 'build_cost', label: 'GPU build cost (equity + debt)', kind: 'total_cash', delta: T(ctx, N.B), running_total: T(ctx, N.B), hatched: false },
      { id: 'revenue', label: "Back to Nvidia as revenue (Nvidia's share of the bill)", kind: 'cash_to_nvidia', delta: T(ctx, N.R), running_total: T(ctx, N.R), hatched: false,
        split: { recycled: T(ctx, N.Rrec), external: T(ctx, N.Rext) } },
      { id: 'gross_profit', label: 'Gross profit', kind: 'accounting', delta: T(ctx, N.GP), running_total: T(ctx, N.GP), hatched: false },
      { id: 'net_profit', label: 'Net profit', kind: 'accounting', delta: T(ctx, N.NI), running_total: T(ctx, N.NI), hatched: false },
      { id: 'paper_value', label: 'Market value the profit supports (paper, not cash)', kind: 'paper', delta: T(ctx, N.Paper), running_total: T(ctx, N.Paper), hatched: true }
    ];
    var S = N.S.v;
    var headline = {
      seed: T(ctx, N.S, false), debt: T(ctx, N.D), build_cost: T(ctx, N.B), revenue: T(ctx, N.R),
      gross_profit: T(ctx, N.GP), paper_value: T(ctx, N.Paper),
      leverage_multiplier: T(ctx, Q(N.B.v / S, 'Build cost / seed = 1/(1−L) = ' + n(N.B.v / S), N.B, N.S)),
      debt_multiplier: T(ctx, Q(N.D.v / S, 'Debt / seed = ' + n(N.D.v / S), N.D, N.S)),
      revenue_multiplier: T(ctx, Q(N.R.v / S, 'Revenue / seed = ' + n(N.R.v / S), N.R, N.S)),
      paper_multiplier: T(ctx, Q(N.Paper.v / S, 'Paper value / seed = ' + n(N.Paper.v / S), N.Paper, N.S)),
      sentence: '$' + n(S) + ' of seed cash -> $' + n(N.D.v) + ' of debt -> $' + n(N.R.v) + ' of Nvidia revenue -> about $' + n(N.Paper.v) + ' of paper market value (paper value is not cash).'
    };
    return { steps: steps, headline: headline, params: P };
  }

  // ---------------------------------------------------------------- claims stack
  function assetValues(P, B, t) {
    var life = P.gpu_useful_life_years, d = P.gpu_rental_decline_per_year;
    var book = B * Math.max(0, 1 - t / life);
    var econ = book * Math.pow(1 - d, t);
    return { book: book, economic: econ };
  }
  function balanceFraction(P, t) {
    // remaining principal fraction of an annuity loan at time t
    var r = P.base_rate + P.credit_spread, N = P.debt_term_years;
    if (t >= N) return 0;
    if (r <= 0) return 1 - t / N;
    var a = Math.pow(1 + r, N), b = Math.pow(1 + r, t);
    return (a - b) / (a - 1);
  }

  /**
   * claimsStack(params, yearT, opts)  opts.amortize (bool, default false): senior face shrinks on an annuity schedule
   */
  function claimsStack(params, yearT, opts) {
    var P = resolveParams(params);
    opts = opts || {};
    yearT = yearT === undefined ? 0 : yearT;
    if (typeof yearT !== 'number' || !isFinite(yearT) || yearT < 0 || yearT > 50) throw new RangeError('yearT must be 0..50');
    var ctx = makeCtx(P);
    var N = lapNodes(ctx, ctx.p('seed_usd'), {});
    var bf = opts.amortize ? balanceFraction(P, yearT) : 1;
    var life = ctx.p('gpu_useful_life_years'), dec = ctx.p('gpu_rental_decline_per_year');
    var av = assetValues(P, N.B.v, yearT);
    var bookQ = Q(av.book, 'Book value = B × max(0, 1 − T/life) = ' + n(N.B.v) + ' × max(0, 1 − ' + n(yearT) + '/' + n(P.gpu_useful_life_years) + ')', N.B, life);
    var hwEconQ = Q(av.economic, 'Hardware economic value = book × (1 − rental decline)^T = ' + n(av.book) + ' × (1 − ' + n(P.gpu_rental_decline_per_year) + ')^' + n(yearT), bookQ, dec);
    var yrsQ = ctx.p('contract_years');
    // The lab's prepayment is treated as a PROMISE / contract right in the whole page (chapter 3 hop 5 never counts it as cash),
    // so it is NOT part of the asset value. It is shown as a separate, labelled line (prepayment_promise_unearned).
    var prepayPromise = N.Prepay.v * Math.max(0, 1 - yearT / P.contract_years);
    var prepayQ = Q(prepayPromise, 'Lab contract right tied to the prepayment, not yet earned (a promise, NOT cash, NOT in asset value) = prepayment × max(0, 1 − T/contract years) = ' + n(N.Prepay.v) + ' × max(0, 1 − ' + n(yearT) + '/' + n(P.contract_years) + ')', N.Prepay, yrsQ);
    var econQ = Q(av.economic, 'Asset value = hardware economic value (the lab prepayment is a promise and is not counted) = ' + n(av.economic), hwEconQ);
    var bookTotalQ = Q(av.book, 'Book value = straight-line hardware book (prepayment promise not counted)', bookQ);
    var senior = Q(N.D.v * bf, opts.amortize ? 'Senior face = D × remaining annuity balance fraction = ' + n(N.D.v) + ' × ' + n(bf) : 'Senior face = D (constant: no amortization)', N.D, opts.amortize ? 'base_rate' : null, opts.amortize ? 'credit_spread' : null, opts.amortize ? 'debt_term_years' : null);
    var bank = Q(N.Bank.v * bf, 'Bank back-leverage face = senior × λ/(1+λ)', N.Bank, opts.amortize ? 'base_rate' : null, opts.amortize ? 'credit_spread' : null, opts.amortize ? 'debt_term_years' : null);
    var mezz = Q(N.Mezz.v, 'Parent bonds/converts face = mezz ratio × E', N.Mezz);
    var contract = Q(N.Prepay.v, 'Lab contract right tied to its prepayment = prepay share × C (a promise to deliver compute, not cash held)', N.Prepay);
    var backstop = Q(N.Back.v, 'Backstop cap = backstop share × B', N.Back);
    var equity = N.S;
    var labInv = Q(N.labCap.v, "Capital the lab raised to make year-1 payments = P1 × (1−o)", N.labCap);
    var slabs = [
      { id: 's1_senior_secured', label: 'Senior secured lenders', holder: 'Private-credit fund (its LPs and bank sit behind it)', example: 'IREN $3.65B GPU-backed financing; CoreWeave DDTL 4.0 ($8.5B, rated A3)', q: senior, seniority: 1, kind: 'cash_claim', layer: 'direct', nested_in: null, recoverable_from_asset: true, claim_ids: ['c2'] },
      { id: 's2_fund_back_leverage', label: 'Bank back-leverage to the credit fund', holder: 'Bank lending to the fund against the loan', example: 'NAV/back-leverage facility (structure typical in private credit; not disclosed for specific deals here)', q: bank, seniority: 2, kind: 'cash_claim', layer: 'nested', nested_in: 's1_senior_secured', recoverable_from_asset: true, claim_ids: ['c7'] },
      { id: 's3_mezz_converts', label: 'Mezzanine / converts at the parent', holder: 'Convert and bond holders of the neocloud (some on margin)', example: 'CoreWeave ~$4.2B converts (Q3 2026); Nebius $5.75B converts (Aug 2026)', q: mezz, seniority: 3, kind: 'cash_claim', layer: 'indirect', nested_in: null, recoverable_from_asset: false, claim_ids: ['c9'] },
      { id: 's4_contract_rights', label: "Lab's contract right (prepayment-linked promise)", holder: 'The AI lab (customer)', example: 'IREN-Microsoft 5-year contract with 20% prepayment', q: contract, seniority: 4, kind: 'promise_right', layer: 'direct', nested_in: null, recoverable_from_asset: false, claim_ids: ['c3'] },
      { id: 's5_backstop', label: 'Backstop / guarantee holders', holder: 'Beneficiaries of the backstop (neocloud and lenders); payer is the backstopper', example: 'Nvidia-CoreWeave up to $6.3B unsold-capacity purchase; Google-Fluidstack lease backstops', q: backstop, seniority: 5, kind: 'contingent_promise', layer: 'contingent', nested_in: null, recoverable_from_asset: false, claim_ids: ['c6'] },
      { id: 's6_equity', label: 'Equity (Nvidia + other holders)', holder: 'Nvidia (claim #1) and other equity holders of the SPV/neocloud', example: 'Nvidia $2B CoreWeave stake at $87.20/share', q: equity, seniority: 6, kind: 'equity', layer: 'direct', nested_in: null, recoverable_from_asset: true, claim_ids: ['c1'] },
      { id: 's7_lab_investors', label: 'Lab investors', holder: "Nvidia's stake in the lab and the lab's other investors and their lenders", example: 'OpenAI 2026 round ($122B committed at $852B post-money)', q: labInv, seniority: 7, kind: 'equity', layer: 'indirect', nested_in: null, recoverable_from_asset: false, claim_ids: ['c4', 'c5'] }
    ];
    var activeCount = 0;
    var rankCounter = 0;
    var rankOf = {};
    slabs.forEach(function (s) {
      if (s.recoverable_from_asset && s.layer !== 'nested') { rankCounter++; rankOf[s.id] = rankCounter; }
    });
    rankOf.s2_fund_back_leverage = rankOf.s1_senior_secured; // nested inside the senior loan: same place in line
    var out = slabs.map(function (s) {
      return {
        ranked_against_asset: !!s.recoverable_from_asset, asset_rank: s.recoverable_from_asset ? rankOf[s.id] : null,
        id: s.id, label: s.label, holder: s.holder, example: s.example, face_value: T(ctx, s.q, false), seniority: s.seniority,
        status: ctx.status(s.q.d, true), kind: s.kind, layer: s.layer, nested_in: s.nested_in,
        recoverable_from_asset: s.recoverable_from_asset, claim_ids: s.claim_ids, formula_text: s.q.f
      };
    });
    function amortInfo() {
      var r = P.base_rate + P.credit_spread;
      var ds = annuity(N.D.v, r, P.debt_term_years);
      var rentNet = N.P1.v * (1 - P.neocloud_opex_share);
      var hy = function (v, f) { return { value: v, status: 'hypothetical', formula_text: f }; };
      return {
        applied: !!opts.amortize,
        schedule: 'Hypothetical level-payment (annuity) schedule: the senior loan is repaid from the lab\'s rent over debt_term_years (default 5, equal to the contract length), at base rate + spread. Bank back-leverage shrinks with it. Equity, convertible bonds, the lab contract right and the lab\'s investors are NOT repaid in this picture.',
        stress_case_note: 'The constant-face view (amortize off) is the "rent stops" case: nobody pays down anything. It is a worst case for lenders, not a forecast.',
        annual_debt_service: hy(ds, 'annuity(D, base + spread, debt_term_years) = ' + n(ds)),
        year1_rent: hy(N.P1.v, 'C / contract_years = ' + n(N.P1.v)),
        rent_after_opex: hy(rentNet, 'rent × (1 − neocloud opex share) = ' + n(rentNet)),
        rent_covers_debt_service_x: hy(ds > 1e-12 ? rentNet / ds : null, 'rent after opex / annual debt service'),
        depends_on: 'The lab (and its customers) keep paying. If rent stops, the schedule stops too.'
      };
    }
    var lapRes = lapHops(ctx, N, {});
    var claims = lapRes.claims;
    var parties = {};
    claims.forEach(function (c) { if (c.active) c.holders.forEach(function (h) { parties[h] = 1; }); });
    var asset = Math.max(econQ.v, 0);
    // Headline counts only claims RANKED on this asset (nested slabs add claimants, not dollars; slabs the page marks
    // "not ranked against this asset" stay visible but are excluded from the headline and labelled).
    var rankedSlabs = slabs.filter(function (s) { return s.recoverable_from_asset && s.layer !== 'nested'; });
    var totalRanked = rankedSlabs.reduce(function (a, s) { return a + s.q.v; }, 0);
    var totalAll = slabs.filter(function (s) { return s.layer !== 'nested'; }).reduce(function (a, s) { return a + s.q.v; }, 0); // all-in, nested slab excluded
    var totalCash = totalRanked; // senior + equity
    var allDeps = [];
    slabs.forEach(function (s) { s.q.d.forEach(function (d) { if (allDeps.indexOf(d) < 0) allDeps.push(d); }); });
    ['gpu_useful_life_years', 'gpu_rental_decline_per_year'].forEach(function (d) { if (allDeps.indexOf(d) < 0) allDeps.push(d); });
    function ratio(num, den, f) {
      return { value: den > 1e-12 ? num / den : null, status: ctx.status(allDeps, true), formula_text: f + (den > 1e-12 ? '' : ' (not shown because the asset is worth zero)') };
    }
    // recovery waterfall (cash claims, not nested, recoverable from the asset), by seniority
    var remaining = asset;
    var recovery = [];
    var sMap = {};
    slabs.forEach(function (s) { sMap[s.id] = s; });
    function payFrom(s, isResidual) {
      var face = s.q.v;
      var pay = isResidual ? remaining : Math.min(face, remaining);
      remaining -= pay;
      return pay;
    }
    var innerBank = 0, innerLP = 0;
    slabs.forEach(function (s) {
      if (!s.recoverable_from_asset || s.layer === 'nested') {
        if (s.layer === 'nested') {
          recovery.push({ slab_id: s.id, face_value: s.q.v, recovered: null, recovery_pct: null, shortfall: null, note: 'Nested in senior loan: paid out of the senior recovery, ahead of the fund\'s LPs.' });
        } else {
          recovery.push({ slab_id: s.id, face_value: s.q.v, recovered: null, recovery_pct: null, shortfall: null, note: s.kind === 'contingent_promise' ? 'Not paid from the asset: a promise by a third party. Shown as exposure.' : (s.id === 's4_contract_rights' ? 'A promise, not cash: the lab holds a contract right to compute. The prepayment is not counted as cash received, so it adds nothing to the asset value and gets no recovery here.' : s.id === 's3_mezz_converts' ? 'Claim on the neocloud parent, not on this cluster: paid from the parent\'s other assets or the equity residual, so no recovery from this asset.' : 'Claim on the lab, not on this cluster: no recovery from this asset.') });
        }
        return;
      }
      var isEq = s.id === 's6_equity';
      var got = payFrom(s, isEq);
      recovery.push({ slab_id: s.id, face_value: s.q.v, recovered: got, recovery_pct: s.q.v > 0 ? got / s.q.v : null, shortfall: Math.max(0, s.q.v - got), note: isEq ? 'Residual: receives whatever is left.' : '' });
      if (s.id === 's1_senior_secured') {
        innerBank = Math.min(sMap.s2_fund_back_leverage.q.v, got);
        innerLP = got - innerBank;
      }
    });
    recovery.forEach(function (r) {
      if (r.slab_id === 's2_fund_back_leverage') {
        r.recovered = innerBank; r.recovery_pct = r.face_value > 0 ? innerBank / r.face_value : null; r.shortfall = Math.max(0, r.face_value - innerBank);
      }
    });
    var recSum = 0;
    recovery.forEach(function (r) { if (r.slab_id !== 's2_fund_back_leverage' && r.recovered !== null) recSum += r.recovered; });
    var recT = recovery.map(function (r) {
      var s = sMap[r.slab_id];
      var st = ctx.status(s.q.d.concat(['gpu_useful_life_years', 'gpu_rental_decline_per_year']), true);
      function w(x, f) { return x === null ? null : { value: x, status: st, formula_text: f }; }
      return {
        slab_id: r.slab_id, face_value: w(r.face_value, 'face value (constant)'), recovered: w(r.recovered, 'min(face, remaining asset value) in seniority order'),
        recovery_pct: w(r.recovery_pct, 'recovered / face'), shortfall: w(r.shortfall, 'face − recovered'), note: r.note
      };
    });
    var equityRec = recovery.filter(function (r) { return r.slab_id === 's6_equity'; })[0];
    return {
      year: yearT,
      amortized: !!opts.amortize,
      amortization: amortInfo(),
      asset_value: T(ctx, econQ),
      book_value: T(ctx, bookTotalQ),
      asset_components: { hardware_economic: T(ctx, hwEconQ), hardware_book: T(ctx, bookQ), prepayment_promise_unearned: T(ctx, prepayQ) },
      asset_note: 'Asset value is hardware only. The lab prepayment is a promise (contract right), not cash, in this chapter and in chapter 3; it appears as its own dashed, labelled slab (s4) and in prepayment_promise_unearned, never in the asset.',
      slabs: out,
      ratios: {
        claims_per_usd_asset: ratio(totalRanked, asset, 'Claims ranked on this asset (senior loan + equity; the bank slice nested inside the senior loan and the slabs not ranked against this asset are not counted) / economic asset value = ' + n(totalRanked) + '/' + n(asset)),
        claims_per_usd_asset_cash: ratio(totalRanked, asset, 'Same as claims_per_usd_asset: senior + equity / asset = ' + n(totalRanked) + '/' + n(asset)),
        claims_per_usd_asset_all_in: ratio(totalAll, asset, 'All claims in the picture, including promises and claims on the parent or the lab, but NOT the nested bank slice (it adds claimants, not dollars) / asset = ' + n(totalAll) + '/' + n(asset)),
        claims_per_usd_debt: ratio(totalAll, senior.v, 'All claims in the picture (nested bank slice excluded) / senior debt face = ' + n(totalAll) + '/' + n(senior.v)),
        total_face_ranked: { value: totalRanked, status: ctx.status(allDeps, true), formula_text: 'Σ face of claims ranked on this asset: senior loan + equity (nested bank slice and non-ranked slabs excluded)' },
        total_face_all: { value: totalAll, status: ctx.status(allDeps, true), formula_text: 'Σ face of every slab except the nested bank slice (promises and parent-level claims included)' },
        total_face_cash: { value: totalCash, status: ctx.status(allDeps, true), formula_text: 'Σ face of cluster-level cash claims: senior + equity (the lab contract right is a promise and is excluded)' },
        labels: {
          headline: opts.amortize
            ? 'dollars of claims lined up against each $1 of the GPU\'s value, counting only the claims that rank against the GPU itself (senior loan after paydown from rent, plus equity)'
            : 'dollars of claims lined up against each $1 of the GPU\'s value, counting only the claims that rank against the GPU itself (senior loan plus equity, rent stops and nothing is repaid)',
          all_in: 'all claims in the picture, including promises and claims on the parent or the lab but not the nested bank slice, per $1 of the GPU\'s value',
          debt: 'all claims in the picture (nested bank slice excluded) per $1 of senior loan',
          counted: 'Counted in the headline: senior secured loan, equity. Not counted: the bank back-leverage slice (nested inside the senior loan: adds claimants, not dollars) and the slabs marked not ranked against this asset (mezzanine at the parent, lab contract right, backstop, lab investors). Those stay visible.'
        },
        no_paydown_caveat: opts.amortize ? '' : 'Worst case: rent stops and no debt is repaid, so every claim stays at full face value while the asset wears out. Real loans are repaid from rent while the customer keeps paying; with paydown the same year-' + n(yearT) + ' figure is lower.',
        note: 'Layered claims on one asset are an ordinary capital structure, not double-pledging. The point is correlation: every slab is paid from the same future AI end-user spending.'
      },
      claims: claims,
      claims_count: { value: claims.filter(function (c) { return c.active; }).length, status: 'calculated', formula_text: 'count of active numbered claims' },
      claimants_count: { value: Object.keys(parties).length, status: 'calculated', formula_text: 'distinct parties holding those claims' },
      recovery: recT,
      recovery_check: {
        asset_value: asset, total_recovered: recSum, conserved: Math.abs(asset - recSum) < 1e-9,
        equity_gets_residual: equityRec ? equityRec.recovered : 0
      },
      inner_waterfall_senior: {
        bank_recovered: T(ctx, Q(innerBank, 'bank is paid first from the senior recovery', senior)),
        lps_recovered: T(ctx, Q(innerLP, 'LPs get the rest of the senior recovery', senior))
      },
      params: P
    };
  }

  function timeline(params, opts) {
    opts = opts || {};
    var P = resolveParams(params);
    var step = opts.step || 0.5, maxY = opts.maxYear !== undefined ? opts.maxYear : Math.ceil(P.gpu_useful_life_years);
    var rows = [];
    for (var t = 0; t <= maxY + 1e-9; t += step) {
      var yr = +t.toFixed(6);
      var s = claimsStack(P, yr, { amortize: opts.amortize });
      var senior = s.slabs[0].face_value.value;
      rows.push({
        year: yr, asset_value: s.asset_value, book_value: s.book_value,
        total_claims: s.ratios.total_face_ranked, total_claims_all_in: s.ratios.total_face_all, claims_per_usd_asset: s.ratios.claims_per_usd_asset,
        senior_face: s.slabs[0].face_value,
        senior_ltv: { value: s.asset_value.value > 1e-12 ? senior / s.asset_value.value : null, status: s.asset_value.status, formula_text: 'senior face / economic asset value' },
        equity_recovery: s.recovery.filter(function (r) { return r.slab_id === 's6_equity'; })[0].recovered
      });
    }
    return rows;
  }

  // ---------------------------------------------------------------- stress
  var SCENARIO_KEYS = {
    external_revenue_shortfall_pct: [0, 100], gpu_rental_price_drop_pct: [0, 100],
    rate_shock_bps: [0, 1000], nvidia_stock_drop_pct: [0, 100]
  };
  function normalizeScenario(sc) {
    sc = sc || {};
    var out = { external_revenue_shortfall_pct: 0, gpu_rental_price_drop_pct: 0, lab_missed_payment: false, rate_shock_bps: 0, nvidia_stock_drop_pct: 0, year: 1 };
    Object.keys(sc).forEach(function (k) {
      if (k === 'lab_missed_payment') {
        if (typeof sc[k] !== 'boolean') throw new RangeError('lab_missed_payment must be boolean');
        out[k] = sc[k]; return;
      }
      if (k === 'year') {
        if (typeof sc[k] !== 'number' || sc[k] < 0 || sc[k] > 20) throw new RangeError('year must be 0..20');
        out[k] = sc[k]; return;
      }
      var r = SCENARIO_KEYS[k];
      if (!r) throw new RangeError('unknown scenario knob: ' + k);
      if (typeof sc[k] !== 'number' || !isFinite(sc[k]) || sc[k] < r[0] || sc[k] > r[1]) throw new RangeError(k + ' must be within [' + r[0] + ', ' + r[1] + ']');
      out[k] = sc[k];
    });
    return out;
  }
  function stress(params, scenario) {
    var P = resolveParams(params);
    var sc = normalizeScenario(scenario);
    var ctx = makeCtx(P, { scenario: 'hypothetical' });
    var N = lapNodes(ctx, ctx.p('seed_usd'), {});
    var x = sc.external_revenue_shortfall_pct / 100, dn = sc.nvidia_stock_drop_pct / 100, rd = sc.gpu_rental_price_drop_pct / 100;
    var sdeps = ['scenario'];
    var o = P.lab_outside_revenue_share, m = P.lab_funding_mix;
    var P1 = N.P1.v;
    var r0 = P.base_rate + P.credit_spread;
    var rEff = r0 + P.floating_share * sc.rate_shock_bps / 10000;
    var dsBase = annuity(N.D.v, r0, P.debt_term_years);
    var dsStress = annuity(N.D.v, rEff, P.debt_term_years);
    var opex = P1 * P.neocloud_opex_share;
    var bankShare = P.credit_fund_back_leverage_ratio / (1 + P.credit_fund_back_leverage_ratio);
    var eqSched = Math.max(0, P1 - opex - dsBase);

    var outside = P1 * o * (1 - x);
    var capExt = P1 * (1 - o) * (1 - m);
    var capRec = P1 * (1 - o) * m * (1 - dn);
    var labCash = sc.lab_missed_payment ? 0 : outside + capExt + capRec;
    var shortfall = P1 - labCash;
    var shortfallPct = P1 > 0 ? shortfall / P1 : 0;
    var hasBackstop = N.Back.v > 1e-12;
    var triggered = hasBackstop && (sc.lab_missed_payment || (shortfall > 1e-12 && shortfallPct >= P.backstop_trigger_shortfall));
    var backstopPaid = triggered ? Math.min(shortfall, N.Back.v) : 0;
    var cashIn = labCash + backstopPaid;

    var rem = cashIn;
    var opexPaid = Math.min(rem, opex); rem -= opexPaid;
    var bankSched = dsStress * bankShare, lpSched = dsStress - bankSched;
    var bankPaid = Math.min(rem, bankSched); rem -= bankPaid;
    var lpPaid = Math.min(rem, lpSched); rem -= lpPaid;
    var equityPaid = rem; rem = 0;
    function item(id, label, claimIds, sched, paid, f, extraDeps) {
      var hair = Math.max(0, sched - paid);
      var st = hair <= 1e-9 ? 'paid' : (paid <= 1e-9 ? 'unpaid' : 'partial');
      var node = function (v, ff) { return { value: v, status: 'hypothetical', formula_text: ff }; };
      return { id: id, label: label, claim_ids: claimIds, scheduled: node(sched, 'scheduled'), paid: node(paid, f), haircut: node(hair, 'scheduled − paid'),
        paid_pct: node(sched > 1e-12 ? paid / sched : 1, 'paid / scheduled'), state: st };
    }
    var items = [
      item('opex', 'Operating costs (power, staff, colocation)', [], opex, opexPaid, 'paid first from cash in'),
      item('senior_bank', 'Debt service to the bank behind the credit fund', ['c7'], bankSched, bankPaid, 'paid second'),
      item('senior_lps', 'Debt service to the fund (LPs)', ['c8', 'c2'], lpSched, lpPaid, 'paid third'),
      item('equity', 'Distributions to neocloud equity (Nvidia and others)', ['c1', 'c9'], eqSched, equityPaid, 'residual after senior debt service')
    ];
    // equity may receive more than scheduled (residual); haircut only counts shortfalls
    var paidSum = opexPaid + bankPaid + lpPaid + equityPaid;
    var seniorSched = bankSched + lpSched, seniorPaid = bankPaid + lpPaid;
    var seniorShortfall = Math.max(0, seniorSched - seniorPaid);
    var fundingFactor = seniorSched > 1e-12 ? seniorPaid / seniorSched : 1;
    var av = assetValues(P, N.B.v, sc.year);
    var collateral = av.economic * (1 - rd);
    var ltv = collateral > 1e-12 ? N.D.v / collateral : null;
    var seniorRecovery = N.D.v > 0 ? Math.min(1, collateral / N.D.v) : 1;
    var eqLossPct = (ltv !== null && ltv > 1) ? 1 : (eqSched > 1e-12 ? Math.min(1, Math.max(0, eqSched - equityPaid) / eqSched) : 0);
    var eqMarkdown = N.EqMV.v * eqLossPct;
    // follow-on revenue at risk: lap-2 revenue under default loop
    var lap2 = runLoop(P, 2).lap_traces[1].values.revenue.value;
    var lostFinancing = lap2 * (1 - fundingFactor);
    var lostStock = lap2 * fundingFactor * dn;
    var lap1Rev = N.R.v;
    var hy = function (v, f) { return { value: v, status: 'hypothetical', formula_text: f }; };
    var nvLabLoss = N.nvLab.v * shortfallPct;
    var promises = [
      { id: 'nvidia_backstop', label: 'Nvidia backstop of unused capacity (claim #6)', triggered: triggered, exists: hasBackstop, amount_called: hy(backstopPaid, 'min(lab shortfall, cap) if triggered'), cap: hy(N.Back.v, 'backstop share × B'),
        trigger: 'Lab shortfall ≥ ' + n(P.backstop_trigger_shortfall * 100) + '% of scheduled payment, or a missed payment' },
      { id: 'lab_contract', label: 'Lab compute contract (claim #3)', triggered: shortfall > 1e-9, state: sc.lab_missed_payment ? 'missed payment' : (shortfall > 1e-9 ? 'partially paid' : 'performing'), amount_unpaid: hy(shortfall, 'scheduled − paid by lab') },
      { id: 'receivables_pledge', label: 'Receivables pledged to lenders', triggered: seniorShortfall > 1e-9, state: seniorShortfall > 1e-9 ? 'lenders can enforce the pledge' : 'not triggered', amount_unpaid: hy(seniorShortfall, 'senior debt service shortfall') }
    ];
    return {
      toy_model_notice: 'Toy stress test of ONE year of ONE cluster per $100 seed. It shows ordering and contagion paths, not forecasts.',
      scenario: sc,
      scheduled: {
        lab_payment: hy(P1, 'year-1 lab payment'), opex: hy(opex, 'P1 × opex share'),
        debt_service_base: hy(dsBase, 'annuity at base_rate + spread'), debt_service_stressed: hy(dsStress, 'annuity at base + spread + floating share × shock'),
        equity_distribution: hy(eqSched, 'P1 − opex − base debt service'), effective_rate: hy(rEff, 'base + spread + floating share × shock')
      },
      sources_of_cash: {
        lab_pays_from_end_users: hy(sc.lab_missed_payment ? 0 : outside, 'P1 × o × (1 − shortfall)'),
        lab_pays_from_outside_capital: hy(sc.lab_missed_payment ? 0 : capExt, 'P1 × (1−o) × (1−m)'),
        lab_pays_from_recycled_capital: hy(sc.lab_missed_payment ? 0 : capRec, 'P1 × (1−o) × m × (1 − Nvidia stock drop)'),
        lab_total: hy(labCash, 'sum of lab payments'),
        backstop_payment_from_nvidia: hy(backstopPaid, 'called backstop'),
        total_cash_in: hy(cashIn, 'lab_total + backstop')
      },
      waterfall: items,
      conservation: {
        cash_in: cashIn, total_paid_out: paidSum, balanced: Math.abs(cashIn - paidSum) < 1e-9,
        note: 'Cash in = Σ paid. For every item scheduled = paid + haircut (equity can be paid above schedule when cash is plentiful).'
      },
      senior_summary: {
        scheduled: hy(seniorSched, 'bank + LP debt service'), paid: hy(seniorPaid, 'paid'), shortfall: hy(seniorShortfall, 'scheduled − paid'),
        dscr_actual: hy(seniorSched > 1e-12 ? (cashIn - opexPaid) / seniorSched : null, '(cash in − opex paid) / scheduled debt service')
      },
      collateral: {
        year: sc.year, gpu_value: hy(collateral, 'economic value at year × (1 − rental drop)'), senior_ltv: hy(ltv, 'D / collateral'),
        senior_recovery_if_foreclosed: hy(seniorRecovery, 'min(1, collateral / D)')
      },
      triggered_promises: promises,
      loop_back_to_nvidia: {
        backstop_cash_paid: { value: backstopPaid, status: 'hypothetical', formula_text: 'cash out of Nvidia if the backstop is called', money_kind: 'external-to-recycled reversal: cash leaves Nvidia' },
        equity_markdown_neocloud: hy(eqMarkdown, 'equity at market × loss fraction (flows to the reported (GAAP, standard-accounting) earnings of Nvidia)'),
        lab_stake_markdown: hy(nvLabLoss, 'Nvidia stake in lab × lab shortfall %'),
        next_lap_revenue_lost_to_financing: hy(lostFinancing, 'lap-2 Nvidia revenue × (1 − share of senior debt service paid)'),
        next_lap_revenue_lost_to_stock_drop: hy(lostStock, 'lap-2 revenue × funding factor × Nvidia stock drop'),
        next_lap_revenue_lost_total: hy(lostFinancing + lostStock, 'sum'),
        next_lap_revenue_lost_pct_of_lap1_revenue: hy(lap1Rev > 0 ? (lostFinancing + lostStock) / lap1Rev : 0, 'lost lap-2 revenue / lap-1 revenue'),
        note: 'Three different things (cash out, paper markdown, lost future revenue); they are listed separately and not summed.'
      },
      params: P
    };
  }

  // ---------------------------------------------------------------- external share epilogue
  function shareOf(P) {
    var r = runLoop(P, 1).cumulative;
    return { ext: r.external_share.value, user: r.external_end_user.value / r.cash_moved.value };
  }
  function externalShare(params) {
    var P = resolveParams(params);
    var base = shareOf(P);
    var lowE = base.ext, highE = base.ext, lowU = base.user, highU = base.user;
    var tornado = [];
    var dirE = {}, dirU = {};
    PARAM_DEFS.forEach(function (d) {
      if (d.scale) return;
      var a = Object.assign({}, P), b = Object.assign({}, P);
      a[d.id] = d.min; b[d.id] = d.max;
      var sa = shareOf(a), sb = shareOf(b);
      tornado.push({ param: d.id, label: d.label, external_share_at_min: sa.ext, external_share_at_max: sb.ext, end_user_share_at_min: sa.user, end_user_share_at_max: sb.user,
        swing: Math.abs(sa.ext - sb.ext) });
      lowE = Math.min(lowE, sa.ext, sb.ext); highE = Math.max(highE, sa.ext, sb.ext);
      lowU = Math.min(lowU, sa.user, sb.user); highU = Math.max(highU, sa.user, sb.user);
      dirE[d.id] = sb.ext >= sa.ext ? 'max' : 'min'; dirU[d.id] = sb.user >= sa.user ? 'max' : 'min';
    });
    tornado.sort(function (p, q) { return q.swing - p.swing; });
    function joint(dir, hi) {
      var q = Object.assign({}, P);
      Object.keys(dir).forEach(function (id) {
        var d = DEF[id];
        var wantMax = hi ? dir[id] === 'max' : dir[id] === 'min';
        q[id] = wantMax ? d.max : d.min;
      });
      return shareOf(q);
    }
    var jE0 = joint(dirE, false).ext, jE1 = joint(dirE, true).ext, jU0 = joint(dirU, false).user, jU1 = joint(dirU, true).user;
    var ctxStatus = 'hypothetical';
    var T1 = function (v, f) { return { value: v, status: ctxStatus, formula_text: f }; };
    return {
      headline: {
        external_share: { low: T1(lowE, 'min over one-at-a-time sweeps of every parameter across its range'), base: T1(base.ext, 'external / (external + recycled) cash, default run'), high: T1(highE, 'max over one-at-a-time sweeps'),
          joint_low: T1(jE0, 'all parameters at the bound that lowers the share'), joint_high: T1(jE1, 'all parameters at the bound that raises the share') },
        end_user_share: { note: 'TOY-MODEL RESULT, not a measurement of Nvidia or any company. With the lab covering ' + Math.round(P.lab_outside_revenue_share * 100) + '% of its rent from end-user revenue' + (near(P.lab_outside_revenue_share, 0.5) ? ' (a deliberately cautious setting; the reported 2025 figure for OpenAI is nearer 62%)' : '') + ', about ' + (base.user * 100).toFixed(1) + '% of the cash in one lap comes from end users (range ' + (lowU * 100).toFixed(1) + '-' + (highU * 100).toFixed(1) + '% moving one setting at a time). Move the setting and this changes.',
          low: T1(lowU, 'min one-at-a-time'), base: T1(base.user, 'cash paid by end users via the lab / total cash moved'), high: T1(highU, 'max one-at-a-time'),
          joint_low: T1(jU0, 'all parameters at the bound that lowers the share'), joint_high: T1(jU1, 'all parameters at the bound that raises the share') },
        recycled_share: { base: T1(1 - base.ext, 'recycled / (external + recycled)') },
        sentence: 'Of every $1 that moves through one lap of the loop, about ' + Math.round(base.ext * 100) + ' cents is external cash (range ' + Math.round(lowE * 100) + '-' + Math.round(highE * 100) + ') and ' + Math.round((1 - base.ext) * 100) + ' cents is recycled; only about ' + Math.round(base.user * 100) + ' cents is paid by end users. Promises are not counted as cash.'
      },
      end_user_sentence: 'In this toy model, about ' + Math.round(base.user * 100) + ' cents of every $1 in a lap is paid by end users (range ' + Math.round(lowU * 100) + '-' + Math.round(highU * 100) + ' cents across the knobs). It is a result of the settings, not a fact about the world.',
      tornado: tornado,
      note: 'Ranges come from the min/max of each parameter. Most parameters are hypothetical, so the range is wide and honest.'
    };
  }

  // ---------------------------------------------------------------- URL state
  var ENC_VERSION = '1';
  function encodeState(params, ui) {
    var P = resolveParams(params);
    var toks = [ENC_VERSION];
    PARAM_DEFS.forEach(function (d, idx) {
      var v = P[d.id];
      var q = Math.round((v - d.min) / d.step);
      var maxQ = Math.round((d.max - d.min) / d.step);
      if (q < 0 || q > maxQ) throw new RangeError(d.id + ' out of range');
      var snapped = +(d.min + q * d.step).toFixed(Math.max(decimals(d.step), decimals(d.min)));
      if (near(snapped, d.value) || near(v, d.value)) return;
      toks.push(idx.toString(36) + ':' + q.toString(36));
    });
    if (ui) {
      if (ui.laps !== undefined) {
        if (!Number.isInteger(ui.laps) || ui.laps < 1 || ui.laps > 200) throw new RangeError('laps');
        toks.push('L:' + ui.laps.toString(36));
      }
      if (ui.year !== undefined) {
        if (typeof ui.year !== 'number' || ui.year < 0 || ui.year > 50 || Math.round(ui.year * 2) !== ui.year * 2) throw new RangeError('year (multiples of 0.5)');
        toks.push('T:' + Math.round(ui.year * 2).toString(36));
      }
      if (ui.preset !== undefined && ui.preset !== null) {
        var pi = presetNames().indexOf(ui.preset);
        if (pi < 0) throw new RangeError('preset');
        toks.push('P:' + pi.toString(36));
      }
    }
    return toks.join('~');
  }
  function decodeState(str) {
    var fail = function (e) { return { ok: false, params: null, ui: null, errors: [e] }; };
    if (typeof str !== 'string') return fail('state must be a string');
    str = str.replace(/^#/, '');
    var toks = str.split('~');
    if (toks[0] !== ENC_VERSION) return fail('unsupported state version');
    var P = defaults(), ui = {}, seen = {}, errors = [];
    for (var i = 1; i < toks.length; i++) {
      var t = toks[i];
      var m = /^([0-9a-zA-Z]+):([0-9a-z]+)$/.exec(t);
      if (!m) { errors.push('malformed token: ' + t); continue; }
      var key = m[1], val = parseInt(m[2], 36);
      if (seen[key]) { errors.push('duplicate key: ' + key); continue; }
      seen[key] = 1;
      if (key === 'L') { if (val < 1 || val > 200) errors.push('laps out of range'); else ui.laps = val; continue; }
      if (key === 'T') { if (val > 100) errors.push('year out of range'); else ui.year = val / 2; continue; }
      if (key === 'P') { var names = presetNames(); if (val >= names.length) errors.push('unknown preset'); else ui.preset = names[val]; continue; }
      var idx = parseInt(key, 36);
      if (!/^[0-9a-z]+$/.test(key) || isNaN(idx) || idx >= PARAM_DEFS.length) { errors.push('unknown key: ' + key); continue; }
      var d = PARAM_DEFS[idx];
      var maxQ = Math.round((d.max - d.min) / d.step);
      if (val > maxQ) { errors.push(d.id + ' out of range'); continue; }
      P[d.id] = +(d.min + val * d.step).toFixed(Math.max(decimals(d.step), decimals(d.min)));
    }
    if (errors.length) return { ok: false, params: null, ui: null, errors: errors };
    return { ok: true, params: P, ui: ui, errors: [] };
  }
  function snap(params) {
    var P = resolveParams(params);
    PARAM_DEFS.forEach(function (d) {
      var q = Math.round((P[d.id] - d.min) / d.step);
      if (!near(P[d.id], d.value)) P[d.id] = +(d.min + q * d.step).toFixed(Math.max(decimals(d.step), decimals(d.min)));
    });
    return P;
  }

  return {
    VERSION: VERSION, STATUS_ORDER: STATUS_ORDER,
    defaults: defaults, paramDefs: paramDefs, presets: presets, presetNames: presetNames, applyPreset: applyPreset,
    validateParams: validateParams, resolveParams: resolveParams, effectiveStatus: effectiveStatus,
    weakestStatus: weakestStatus, plain: plain,
    runLoop: runLoop, leverage: leverage, claimsStack: claimsStack, timeline: timeline,
    stress: stress, externalShare: externalShare, encodeState: encodeState, decodeState: decodeState, snap: snap,
    _internal: { annuity: annuity, assetValues: assetValues, balanceFraction: balanceFraction }
  };
}));
