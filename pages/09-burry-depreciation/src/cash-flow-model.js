/* cash-flow-model.js — multi-year fleet model linking book accounting, tax books and cash.
   Key identity: OCF = NI + book depreciation + disposal loss + deferred tax - dWC
                     = revenue - cash opex - current (cash) tax - dWC
   so the BOOK useful life never reaches operating cash flow unless tax depreciation is tied to it. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./depreciation-math.js'), require('./earnings-model.js'));
  else root.BD = Object.assign(root.BD || {}, factory(root.BD, root.BD));
})(typeof self !== 'undefined' ? self : this, function (D, E) {
  'use strict';

  const TAX_BONUS = { bonus100: 1.0, bonus40: 0.4, macrs5: 0.0 };

  function num(x, name, min, max) {
    const v = Number(x);
    if (!Number.isFinite(v)) throw new RangeError(name + ' must be a finite number');
    if (min != null && v < min) throw new RangeError(name + ' must be at least ' + min);
    if (max != null && v > max) throw new RangeError(name + ' must be at most ' + max);
    return v;
  }

  function normalize(p) {
    const q = {
      horizon: Math.round(num(p.horizon == null ? 5 : p.horizon, 'Forecast years', 1, 200)),
      assetCost: num(p.assetCost == null ? 100 : p.assetCost, 'Asset cost', 0),
      replacementCost: p.replacementCost == null ? null : num(p.replacementCost, 'Replacement cost', 0),
      bookMethod: p.bookMethod || 'straight-line',
      bookLife: num(p.bookLife == null ? 5 : p.bookLife, 'Book useful life', 0.5, 50),
      bookResidualPct: num(p.bookResidualPct || 0, 'Book residual %', 0, 100),
      economicLife: Math.round(num(p.economicLife == null ? 5 : p.economicLife, 'Economic life', 1, 30)),
      replace: p.replace !== false,
      redeployYears: Math.round(num(p.redeployYears || 0, 'Redeployment years', 0, 20)),
      secondaryRevenuePct: num(p.secondaryRevenuePct || 0, 'Secondary revenue %', 0, 100), // NET contribution after the redeployed chips' own power/cooling/ops
      salvagePct: num(p.salvagePct || 0, 'Resale value %', 0, 100),
      revenue: num(p.revenue == null ? 100 : p.revenue, 'Revenue', 0),
      otherOpex: num(p.otherOpex || 0, 'Other operating costs', 0),
      taxRate: E.validateTaxRate(p.taxRate == null ? 0.25 : p.taxRate),
      taxScenario: p.taxScenario || 'bonus100',
      shares: num(p.shares == null ? 10 : p.shares, 'Shares outstanding', 1e-9),
      deltaWC: num(p.deltaWC || 0, 'Change in working capital'),
      revise: !!p.revise
    };
    if (q.replacementCost == null) q.replacementCost = q.assetCost;
    if (!(q.taxScenario in TAX_BONUS) && q.taxScenario !== 'bookConform') throw new RangeError('Unknown tax scenario: ' + q.taxScenario);
    if (q.bookMethod !== 'straight-line' && q.bookMethod !== 'double-declining') throw new RangeError('Unknown depreciation method');
    return q;
  }

  /** Build purchase cohorts. Cohort k bought at START of its year (cash out that year). */
  function cohorts(q) {
    const out = [];
    const cycle = q.economicLife;
    for (let start = 1; start <= q.horizon; start += cycle) {
      const cost = start === 1 ? q.assetCost : q.replacementCost;
      out.push({ start, cost, frontierEnd: start + cycle - 1, lastYear: start + cycle - 1 + q.redeployYears });
      if (!q.replace) break;
    }
    return out;
  }

  function fleetModel(p) {
    const q = normalize(p);
    const N = q.horizon;
    const z = () => new Array(N).fill(0);
    const rev = z(), opex = z(), bookDep = z(), disposal = z(), taxDep = z(), taxGain = z(), capex = z(), proceeds = z();
    const nbvEnd = z(), frontier = z(), secondary = z();
    const cs = cohorts(q);

    const service = q.economicLife + q.redeployYears;
    cs.forEach((c, ci) => {
      const residual = c.cost * q.bookResidualPct / 100;
      let book = D.bookSchedule(q.bookMethod, c.cost, residual, q.bookLife);
      if (q.revise && service < q.bookLife) {
        // GAAP-consistent response once the shorter service life is evident (ASC 250 change in estimate):
        // the first cohort keeps its Year-1 charge, then the remaining depreciable amount is spread over the
        // remaining service life; later purchases are depreciated over the shorter life from day one.
        if (ci === 0 && service > 1) {
          const y1 = book.rows[0].depreciation;
          const rest = D.bookSchedule(q.bookMethod, c.cost - y1, residual, service - 1);
          book = { rows: [book.rows[0]].concat(rest.rows.map(r => Object.assign({}, r, { year: r.year + 1 }))) };
        } else {
          book = D.bookSchedule(q.bookMethod, c.cost, residual, service);
        }
      }
      const salvage = c.cost * q.salvagePct / 100;
      capex[c.start - 1] += c.cost;
      let nbv = c.cost;
      // book depreciation until retirement
      for (let y = c.start; y <= Math.min(c.lastYear, N); y++) {
        const row = book.rows[y - c.start];
        const d = row ? row.depreciation : 0;
        bookDep[y - 1] += d; nbv -= d;
        if (y <= c.frontierEnd) frontier[y - 1] += 1; else secondary[y - 1] += 1;
        nbvEnd[y - 1] += nbv;
      }
      // tax depreciation until retirement
      let taxBasis = c.cost;
      if (q.taxScenario === 'bookConform') {
        for (let y = c.start; y <= Math.min(c.lastYear, N); y++) {
          const row = book.rows[y - c.start]; const d = row ? row.depreciation : 0;
          taxDep[y - 1] += d; taxBasis -= d;
        }
      } else {
        // 40% applies only to property acquired before Jan 20, 2025 and placed in service in 2025:
        // only the initial purchase can qualify; later purchases are assumed to get 100% bonus.
        const pct = q.taxScenario === 'bonus40' && ci > 0 ? 1.0 : TAX_BONUS[q.taxScenario];
        const tax = D.taxSchedule(c.cost, pct);
        for (let y = c.start; y <= Math.min(c.lastYear, N); y++) {
          const row = tax.rows[y - c.start]; const d = row ? row.depreciation : 0;
          taxDep[y - 1] += d; taxBasis -= d;
        }
      }
      // retirement at end of lastYear (inside horizon)
      if (c.lastYear <= N) {
        const i = c.lastYear - 1;
        proceeds[i] += salvage;
        disposal[i] += nbv - salvage;          // book loss (+) or gain (-), noncash
        taxGain[i] += salvage - taxBasis;      // taxable gain (+) or deductible loss (-)
        nbvEnd[i] -= nbv;                      // asset leaves the balance sheet
      }
    });

    for (let i = 0; i < N; i++) {
      rev[i] = q.revenue * (frontier[i] > 0 ? 1 : 0) + q.revenue * (q.secondaryRevenuePct / 100) * secondary[i];
      opex[i] = (frontier[i] + secondary[i]) > 0 ? q.otherOpex : 0;
    }

    const years = [];
    let dtl = 0;
    for (let i = 0; i < N; i++) {
      const pretax = rev[i] - opex[i] - bookDep[i] - disposal[i];
      const bookTax = pretax * q.taxRate;
      const taxable = rev[i] - opex[i] - taxDep[i] + taxGain[i];
      const currentTax = taxable * q.taxRate;
      const deferredTax = bookTax - currentTax;
      dtl += deferredTax;
      const netIncome = pretax - bookTax;
      const ocf = netIncome + bookDep[i] + disposal[i] + deferredTax - q.deltaWC;
      const fcf = ocf - capex[i] + proceeds[i];
      years.push({
        year: i + 1, revenue: rev[i], otherOpex: opex[i], bookDepreciation: bookDep[i], disposalLoss: disposal[i],
        pretax, bookTax, taxDepreciation: taxDep[i], taxableGain: taxGain[i], taxableIncome: taxable,
        currentTax, deferredTax, deferredTaxLiability: dtl, netIncome, eps: netIncome / q.shares,
        deltaWC: q.deltaWC, ocf, capex: capex[i], proceeds: proceeds[i], fcf, netBookValue: nbvEnd[i],
        frontierCohorts: frontier[i], secondaryCohorts: secondary[i]
      });
    }
    const totals = {};
    ['revenue', 'bookDepreciation', 'disposalLoss', 'taxDepreciation', 'netIncome', 'currentTax', 'ocf', 'capex', 'proceeds', 'fcf'].forEach(k => {
      totals[k] = years.reduce((a, y) => a + y[k], 0);
    });

    // Steady-state (normalized) annual FCF for a terminal value, assuming the replacement cycle repeats forever.
    // Over a full cycle every cohort deducts its whole cost for tax and pays tax on resale proceeds, so
    // normalized FCF = (1 - t) x (revenue + avg secondary revenue - opex - cost/E + proceeds/E).
    let normalizedFCF = 0;
    if (q.replace) {
      const E2 = q.economicLife;
      const avgRev = q.revenue * (1 + (q.secondaryRevenuePct / 100) * (q.redeployYears / E2));
      const avgCapex = q.replacementCost / E2;
      const avgProceeds = q.replacementCost * q.salvagePct / 100 / E2;
      normalizedFCF = (1 - q.taxRate) * (avgRev - q.otherOpex - avgCapex + avgProceeds);
    }
    return { inputs: q, cohorts: cs, years, totals, normalizedFCF };
  }

  /** Terminal value at the end of the forecast (year N) as the present value of the replacement cycle
   *  continuing forever — starting from when the next purchase actually falls (not an averaged FCF).
   *  Post-horizon flows grow at g. Simulates until the cycle is periodic, then sums the periodic block
   *  as a geometric series: TV = sum(transient PVs) + block / (1 - ((1+g)/(1+r))^E). */
  function cycleTerminalValue(p, r, g) {
    const q = normalize(p);
    if (!(r > g)) throw new RangeError('Terminal growth must be below the discount rate');
    if (r <= 0) throw new RangeError('Discount rate must be positive');
    const N = q.horizon, E = q.economicLife;
    const settle = E + q.redeployYears + 8;            // cohort life + 6-yr MACRS + slack
    if (!q.replace) {
      const ext = fleetModel(Object.assign({}, p, { horizon: Math.min(N + settle, 60) }));
      let tv = 0; for (let t = N + 1; t <= ext.years.length; t++) tv += ext.years[t - 1].fcf * Math.pow((1 + g) / (1 + r), t - N);
      return { tv, method: 'run-off (no replacement)' };
    }
    const m = Math.ceil(settle / E);
    const S = N + E * m;                                // periodic from S+1 onward
    const ext = fleetModel(Object.assign({}, p, { horizon: S + E }));
    const k = (1 + g) / (1 + r);
    let trans = 0; for (let t = N + 1; t <= S; t++) trans += ext.years[t - 1].fcf * Math.pow(k, t - N);
    let block = 0; for (let t = S + 1; t <= S + E; t++) block += ext.years[t - 1].fcf * Math.pow(k, t - N);
    return { tv: trans + block / (1 - Math.pow(k, E)), method: 'repeating replacement cycle' };
  }

  /** Single-year reconciliation (Ch. 7). */
  function reconcile(y) {
    return [
      { label: 'Net income', value: y.netIncome, kind: 'accounting' },
      { label: '+ Book depreciation (noncash)', value: y.bookDepreciation, kind: 'noncash' },
      { label: '+ Loss on disposal (noncash)', value: y.disposalLoss, kind: 'noncash' },
      { label: '+ Deferred tax (book tax not paid in cash)', value: y.deferredTax, kind: 'tax' },
      { label: '− Increase in working capital', value: -y.deltaWC, kind: 'cash' },
      { label: '= Operating cash flow', value: y.ocf, kind: 'total' },
      { label: '− Capital expenditures', value: -y.capex, kind: 'cash' },
      { label: '+ Hardware sale proceeds', value: y.proceeds, kind: 'cash' },
      { label: '= Free cash flow', value: y.fcf, kind: 'total' }
    ];
  }

  return { TAX_BONUS, normalizeFleet: normalize, cohorts, fleetModel, cycleTerminalValue, reconcile };
});
