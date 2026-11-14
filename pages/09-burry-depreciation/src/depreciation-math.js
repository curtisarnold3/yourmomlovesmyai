/* depreciation-math.js — book and tax depreciation schedules.
   UMD: works as a Node module (tests) and as a browser global (window.BD). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BD = Object.assign(root.BD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EPS = 1e-9;
  // 5-year MACRS, 200% DB, half-year convention (IRS Pub. 946, Table A-1)
  const MACRS5 = [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576];

  function num(x, name) {
    const v = Number(x);
    if (!Number.isFinite(v)) throw new RangeError(name + ' must be a finite number');
    return v;
  }

  function validateAsset(cost, residual, life) {
    cost = num(cost, 'Asset cost');
    residual = num(residual, 'Residual value');
    life = num(life, 'Useful life');
    if (cost < 0) throw new RangeError('Asset cost cannot be negative');
    if (residual < 0) throw new RangeError('Residual value cannot be negative');
    if (residual > cost) throw new RangeError('Residual value cannot exceed asset cost');
    if (life <= 0) throw new RangeError('Useful life must be greater than zero');
    if (life > 50) throw new RangeError('Useful life above 50 years is outside this model');
    return { cost, residual, life };
  }

  /** Straight-line: (cost - residual) / life per full year; a fractional life
   *  produces a final partial-year charge. Returns rows for each year. */
  function straightLine(cost, residual, life) {
    ({ cost, residual, life } = validateAsset(cost, residual, life));
    const depreciable = cost - residual;
    const annual = depreciable / life;
    const years = Math.ceil(life - EPS);
    const rows = [];
    let acc = 0;
    for (let t = 1; t <= years; t++) {
      const opening = cost - acc;
      const dep = Math.min(annual, depreciable - acc);
      acc += dep;
      rows.push({ year: t, opening, depreciation: dep, accumulated: acc, closing: cost - acc });
    }
    return { method: 'straight-line', cost, residual, life, depreciable, annual, yearsToFull: life, rows };
  }

  /** Double-declining balance with switch to straight-line, floored at residual. */
  function doubleDeclining(cost, residual, life) {
    ({ cost, residual, life } = validateAsset(cost, residual, life));
    const rate = 2 / life;
    const years = Math.ceil(life - EPS);
    const rows = [];
    let nbv = cost;
    let acc = 0;
    for (let t = 1; t <= years; t++) {
      const remainingLife = Math.max(life - (t - 1), EPS);
      const ddb = nbv * rate;
      const sl = (nbv - residual) / remainingLife;
      let dep = Math.max(ddb, sl);
      dep = Math.min(dep, nbv - residual);
      if (t === years) dep = nbv - residual; // close out exactly
      const opening = nbv;
      nbv -= dep; acc += dep;
      rows.push({ year: t, opening, depreciation: dep, accumulated: acc, closing: nbv });
    }
    return { method: 'double-declining', cost, residual, life, depreciable: cost - residual, annual: null, yearsToFull: life, rows };
  }

  function bookSchedule(method, cost, residual, life) {
    return method === 'double-declining' ? doubleDeclining(cost, residual, life) : straightLine(cost, residual, life);
  }

  /** Tax depreciation: bonus % of basis in year 1, remaining basis on 5-yr MACRS. */
  function taxSchedule(cost, bonusPct, rates) {
    cost = num(cost, 'Tax basis');
    bonusPct = num(bonusPct, 'Bonus percentage');
    if (cost < 0) throw new RangeError('Tax basis cannot be negative');
    if (bonusPct < 0 || bonusPct > 1) throw new RangeError('Bonus percentage must be between 0 and 1');
    rates = rates || MACRS5;
    const bonus = cost * bonusPct;
    const rest = cost - bonus;
    const rows = [];
    let acc = 0;
    for (let i = 0; i < rates.length; i++) {
      const dep = (i === 0 ? bonus : 0) + rest * rates[i];
      acc += dep;
      rows.push({ year: i + 1, depreciation: dep, accumulated: acc, basisRemaining: cost - acc });
    }
    return { bonusPct, cost, rows };
  }

  /** Expand a schedule into a fixed-length array of per-year depreciation (index 0 = year 1). */
  function toArray(schedule, horizon, startYear) {
    startYear = startYear || 1;
    const out = new Array(horizon).fill(0);
    schedule.rows.forEach(r => {
      const idx = startYear - 1 + r.year - 1;
      if (idx >= 0 && idx < horizon) out[idx] += r.depreciation;
    });
    return out;
  }

  function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
  function round(x, dp) { const f = Math.pow(10, dp == null ? 2 : dp); return Math.round((x + Number.EPSILON) * f) / f; }

  return { MACRS5, validateAsset, straightLine, doubleDeclining, bookSchedule, taxSchedule, toArray, sum, round };
});
