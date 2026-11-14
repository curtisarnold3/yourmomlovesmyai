/* valuation-model.js — integrated lab (P/E vs DCF), scenarios A/B/C, and the GPU economic-life simulator. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./depreciation-math.js'), require('./earnings-model.js'), require('./cash-flow-model.js'), require('./dcf-model.js'));
  else root.BD = Object.assign(root.BD || {}, factory(root.BD, root.BD, root.BD, root.BD));
})(typeof self !== 'undefined' ? self : this, function (D, E, C, F) {
  'use strict';

  function num(x, name, min, max) {
    const v = Number(x);
    if (!Number.isFinite(v)) throw new RangeError(name + ' must be a finite number');
    if (min != null && v < min) throw new RangeError(name + ' must be at least ' + min);
    if (max != null && v > max) throw new RangeError(name + ' must be at most ' + max);
    return v;
  }

  const LAB_DEFAULTS = {
    assetCost: 100, bookLife: 5, bookMethod: 'straight-line', bookResidualPct: 0, economicLife: 5,
    revenue: 100, otherOpex: 0, taxRate: 0.25, taxScenario: 'bonus100', shares: 10,
    pe: 20, epsYear: 1, r: 0.10, horizon: 5, terminal: 'gordon', g: 0, exitMultiple: 8,
    replacementCost: 100, salvagePct: 0, redeployYears: 0, secondaryRevenuePct: 0, netDebt: 0, replace: true, revise: true
  };

  /** Integrated valuation laboratory: one set of inputs -> book, tax, cash, P/E and DCF outputs. */
  function lab(p) {
    const q = Object.assign({}, LAB_DEFAULTS, p || {});
    const fleet = C.fleetModel(q);
    const yrs = fleet.years;
    const epsYear = Math.round(num(q.epsYear, 'EPS year', 1, yrs.length));
    const epsUsed = yrs[epsYear - 1].eps;
    const peValue = E.peValuation(epsUsed, q.pe);
    let terminal = { type: 'none' };
    let tvMethod = 'none';
    if (q.terminal === 'gordon') { const ct = C.cycleTerminalValue(q, num(q.r, 'Discount rate'), num(q.g, 'Terminal growth')); terminal = { type: 'given', value: ct.tv }; tvMethod = ct.method; }
    else if (q.terminal === 'multiple') { terminal = { type: 'multiple', baseFCF: fleet.normalizedFCF, multiple: num(q.exitMultiple, 'Exit multiple', 0) }; tvMethod = 'exit multiple x steady-state FCF'; }
    const val = F.dcf({ fcfs: yrs.map(y => y.fcf), r: q.r, terminal, netDebt: q.netDebt, shares: q.shares });
    return {
      inputs: q, fleet, years: yrs, epsYear, epsUsed, peValue, tvMethod,
      dcf: val, dcfPerShare: val.perShare,
      totals: fleet.totals,
      avgEPS: yrs.reduce((a, y) => a + y.eps, 0) / yrs.length
    };
  }

  /** Scenarios A/B/C against a common baseline (book 5, economic 5). */
  function scenarios(base, defs) {
    const b = Object.assign({}, LAB_DEFAULTS, base || {});
    const baseline = lab(Object.assign({}, b, { bookLife: 5, economicLife: 5, redeployYears: 0, secondaryRevenuePct: 0 }));
    const out = { baseline };
    Object.keys(defs).forEach(k => {
      const d = defs[k];
      out[k] = lab(Object.assign({}, b, {
        bookLife: d.bookLife, economicLife: d.economicLife,
        redeployYears: d.redeploy ? (d.secondaryYears || 0) : 0,
        secondaryRevenuePct: d.redeploy ? (d.secondaryRevenuePct || 0) : 0
      }));
    });
    return out;
  }

  /** GPU economic-life simulator (Ch. 9): single-cohort economics plus a replacement fleet. */
  function hardwareLife(p) {
    const q = {
      cost: num(p.cost == null ? 100 : p.cost, 'Asset cost', 0.01),
      bookLife: num(p.bookLife == null ? 5 : p.bookLife, 'Accounting life', 0.5, 20),
      serviceLife: Math.round(num(p.serviceLife == null ? 5 : p.serviceLife, 'Economic service life', 1, 15)),
      revenue: num(p.revenue == null ? 60 : p.revenue, 'Annual revenue potential', 0),
      revenueDecayPct: num(p.revenueDecayPct == null ? 15 : p.revenueDecayPct, 'Revenue decline %', 0, 95),
      opex: num(p.opex == null ? 15 : p.opex, 'Operating cost', 0),
      opexGrowthPct: num(p.opexGrowthPct || 0, 'Operating cost trend %', -50, 100),
      replaceEvery: Math.round(num(p.replaceEvery == null ? 5 : p.replaceEvery, 'Replacement interval', 1, 15)),
      residualPct: num(p.residualPct || 0, 'Residual / resale value %', 0, 100),
      replacementCostPct: num(p.replacementCostPct == null ? 100 : p.replacementCostPct, 'Replacement cost %', 1, 300),
      redeploy: !!p.redeploy,
      secondaryYears: Math.round(num(p.secondaryYears || 0, 'Secondary years', 0, 10)),
      secondaryRevenuePct: num(p.secondaryRevenuePct || 0, 'Secondary revenue %', 0, 100),
      horizon: Math.round(num(p.horizon == null ? 10 : p.horizon, 'Horizon', 2, 20)),
      r: num(p.r == null ? 0.10 : p.r, 'Discount rate', 0.001, 0.5)
    };
    // One cohort, age a = 1..serviceLife (+ secondary years if redeployed)
    const contrib = a => q.revenue * Math.pow(1 - q.revenueDecayPct / 100, a - 1) - q.opex * Math.pow(1 + q.opexGrowthPct / 100, a - 1);
    const life = Math.min(q.serviceLife, q.replaceEvery);
    const ages = [];
    const book = D.straightLine(q.cost, 0, q.bookLife);
    for (let a = 1; a <= Math.max(life, Math.ceil(q.bookLife)); a++) {
      const inService = a <= life;
      const c = inService ? contrib(a) : 0;
      // economic value at START of age a = PV of remaining contributions (if retired at `life`) + PV of resale
      let ev = 0;
      if (a <= life) {
        for (let k = a; k <= life; k++) ev += contrib(k) / Math.pow(1 + q.r, k - a + 1);
        ev += q.cost * q.residualPct / 100 / Math.pow(1 + q.r, life - a + 1);
      }
      const bookRow = book.rows[a - 1];
      const nbvStart = bookRow ? bookRow.opening : 0;
      ages.push({ age: a, inService, contribution: c, economicValueStart: Math.max(ev, 0), nbvStart, gap: nbvStart - Math.max(ev, 0) });
    }
    // Value-maximizing replacement cycle: the L that maximizes the equivalent annual value of a cohort,
    // EAV(L) = NPV(L) x r / (1 - (1+r)^-L), NPV(L) = -cost + sum contrib(a)/(1+r)^a + resale/(1+r)^L.
    // A new chip is assumed to restart at full revenue potential, so this captures "replace when a newer chip earns more".
    let bestL = 1, bestEAV = -Infinity;
    for (let Lc = 1; Lc <= 15; Lc++) {
      let npvL = -q.cost; for (let a = 1; a <= Lc; a++) npvL += contrib(a) / Math.pow(1 + q.r, a);
      npvL += q.cost * q.residualPct / 100 / Math.pow(1 + q.r, Lc);
      const eav = npvL * q.r / (1 - Math.pow(1 + q.r, -Lc));
      if (eav > bestEAV + 1e-9) { bestEAV = eav; bestL = Lc; }
    }
    // first age whose contribution is negative (would rationally retire before it)
    let breakEvenAge = null;
    for (let a = 1; a <= 30; a++) { if (contrib(a) <= 0) { breakEvenAge = a; break; } }

    // Fleet over horizon with periodic replacement
    const N = q.horizon;
    const fleet = [];
    for (let t = 1; t <= N; t++) fleet.push({ year: t, revenue: 0, opex: 0, capex: 0, resale: 0, bookDep: 0, activeAge: null, secondary: 0 });
    for (let start = 1; start <= N; start += q.replaceEvery) {
      const cost = start === 1 ? q.cost : q.cost * q.replacementCostPct / 100;
      fleet[start - 1].capex += cost;
      const bk = D.straightLine(cost, 0, q.bookLife);
      const frontierEnd = start + life - 1;
      const lastYear = q.redeploy ? frontierEnd + q.secondaryYears : frontierEnd;
      for (let t = start; t <= Math.min(lastYear, N); t++) {
        const a = t - start + 1;
        const f = fleet[t - 1];
        if (t <= frontierEnd) {
          // replacement buys equivalent capacity: revenue/opex do not scale with its price
          f.revenue += q.revenue * Math.pow(1 - q.revenueDecayPct / 100, a - 1);
          f.opex += q.opex * Math.pow(1 + q.opexGrowthPct / 100, a - 1);
          f.activeAge = a;
        } else {
          // redeployed chips still draw power and occupy space: they pay their own running cost
          f.revenue += q.revenue * q.secondaryRevenuePct / 100;
          f.opex += q.opex * Math.pow(1 + q.opexGrowthPct / 100, a - 1);
          f.secondary += 1;
        }
      }
      // book depreciation until retirement; any remaining NBV is written off at retirement (noncash)
      let nbv = cost;
      for (let t = start; t <= Math.min(lastYear, N); t++) {
        const row = bk.rows[t - start]; const d = row ? row.depreciation : 0;
        fleet[t - 1].bookDep += d; nbv -= d;
      }
      if (lastYear <= N) { const res = cost * q.residualPct / 100; fleet[lastYear - 1].resale += res; fleet[lastYear - 1].disposalLoss = (fleet[lastYear - 1].disposalLoss || 0) + (nbv - res); }
    }
    let cum = 0;
    fleet.forEach(f => {
      f.preTaxCash = f.revenue - f.opex - f.capex + f.resale;
      cum += f.preTaxCash; f.cumulativeCash = cum;
      f.disposalLoss = f.disposalLoss || 0;
      f.bookProfit = f.revenue - f.opex - f.bookDep - f.disposalLoss;
    });
    const npv = fleet.reduce((a, f) => a + f.preTaxCash / Math.pow(1 + q.r, f.year), 0);
    return { inputs: q, ages, breakEvenAge, optimalCycle: bestL, optimalEAV: bestEAV, fleet, npv, totalCapex: fleet.reduce((a, f) => a + f.capex, 0) };
  }

  return { LAB_DEFAULTS, lab, scenarios, hardwareLife };
});
