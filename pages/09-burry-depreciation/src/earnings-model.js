/* earnings-model.js — simplified income statement, EPS and P/E valuation. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./depreciation-math.js'));
  else root.BD = Object.assign(root.BD || {}, factory(root.BD));
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  function num(x, name) {
    const v = Number(x);
    if (!Number.isFinite(v)) throw new RangeError(name + ' must be a finite number');
    return v;
  }

  function validateTaxRate(r) {
    r = num(r, 'Tax rate');
    if (r < 0 || r >= 1) throw new RangeError('Tax rate must be between 0% and 99%');
    return r;
  }

  /** Teaching convention from the source: illustrative income-tax expense = rate x pretax income.
   *  One convention is used everywhere in this project: a pretax loss produces a tax benefit
   *  (negative tax), i.e. we assume the company has other income the loss can offset. */
  function incomeStatement(p) {
    const revenue = num(p.revenue, 'Revenue');
    const otherOpex = num(p.otherOpex || 0, 'Other operating costs');
    const depreciation = num(p.depreciation, 'Depreciation');
    const otherNoncash = num(p.otherNoncash || 0, 'Other noncash charges');
    const taxRate = validateTaxRate(p.taxRate);
    const shares = num(p.shares, 'Shares outstanding');
    if (revenue < 0) throw new RangeError('Revenue cannot be negative');
    if (otherOpex < 0) throw new RangeError('Other operating costs cannot be negative');
    if (depreciation < 0) throw new RangeError('Depreciation cannot be negative');
    if (shares <= 0) throw new RangeError('Shares outstanding must be greater than zero');
    const pretax = revenue - otherOpex - depreciation - otherNoncash;
    const tax = pretax * taxRate;
    const netIncome = pretax - tax;
    const eps = netIncome / shares;
    return { revenue, otherOpex, depreciation, otherNoncash, pretax, tax, netIncome, shares, eps, taxRate };
  }

  /** Year-1 income statement from asset inputs (the source model). */
  function sourceEarnings(p) {
    const sched = D.bookSchedule(p.method || 'straight-line', p.assetCost, p.residual || 0, p.life);
    const dep = sched.rows[0].depreciation;
    return Object.assign(incomeStatement({ revenue: p.revenue, otherOpex: p.otherOpex, depreciation: dep, taxRate: p.taxRate, shares: p.shares }), { schedule: sched });
  }

  /** Implied share price = P/E x EPS. One valuation approach, not a market price. */
  function peValuation(eps, pe) {
    eps = num(eps, 'EPS'); pe = num(pe, 'P/E multiple');
    if (pe < 0) throw new RangeError('P/E multiple cannot be negative');
    if (pe > 500) throw new RangeError('P/E multiple above 500 is outside this model');
    return eps * pe;
  }

  /** Real-estate comps analogy: price per square foot x square feet. */
  function comparableValue(unitPrice, units) {
    unitPrice = num(unitPrice, 'Price per unit'); units = num(units, 'Units');
    if (unitPrice < 0 || units < 0) throw new RangeError('Inputs cannot be negative');
    return unitPrice * units;
  }

  return { validateTaxRate, incomeStatement, sourceEarnings, peValuation, comparableValue };
});
