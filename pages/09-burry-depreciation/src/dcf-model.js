/* dcf-model.js — discounting, terminal value, enterprise-to-equity bridge. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BD = Object.assign(root.BD || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function num(x, name) {
    const v = Number(x);
    if (!Number.isFinite(v)) throw new RangeError(name + ' must be a finite number');
    return v;
  }

  /** PV(FCF_t) = FCF_t / (1 + r)^t  (end-of-year discounting). */
  function presentValue(cf, r, t) {
    cf = num(cf, 'Cash flow'); r = num(r, 'Discount rate'); t = num(t, 'Period');
    if (r <= -1) throw new RangeError('Discount rate must be greater than -100%');
    return cf / Math.pow(1 + r, t);
  }

  /** Terminal value at year N.
   *  gordon: TV = FCF_{N+1} / (r - g), FCF_{N+1} = baseFCF x (1 + g)
   *  multiple: TV = baseFCF x multiple
   *  none: 0 */
  function terminalValue(t) {
    if (!t || t.type === 'none') return 0;
    const base = num(t.baseFCF, 'Terminal base FCF');
    if (t.type === 'gordon') {
      const r = num(t.r, 'Discount rate'); const g = num(t.g, 'Terminal growth');
      if (g >= r) throw new RangeError('Terminal growth must be below the discount rate');
      return base * (1 + g) / (r - g);
    }
    if (t.type === 'multiple') {
      const m = num(t.multiple, 'Exit multiple');
      if (m < 0) throw new RangeError('Exit multiple cannot be negative');
      return base * m;
    }
    throw new RangeError('Unknown terminal type');
  }

  /** DCF value = sum of discounted FCFs + discounted terminal value. fcfs[0] is year 1. */
  function dcf(p) {
    const r = num(p.r, 'Discount rate');
    if (r <= 0 || r >= 1) throw new RangeError('Discount rate must be between 0% and 100%');
    const fcfs = (p.fcfs || []).map((v, i) => num(v, 'FCF year ' + (i + 1)));
    if (!fcfs.length) throw new RangeError('At least one forecast year is required');
    const N = fcfs.length;
    const rows = fcfs.map((f, i) => ({ year: i + 1, fcf: f, factor: 1 / Math.pow(1 + r, i + 1), pv: presentValue(f, r, i + 1) }));
    const sumPV = rows.reduce((a, b) => a + b.pv, 0);
    const term = Object.assign({ type: 'none' }, p.terminal || {}, { r });
    const tv = term.type === 'given' ? num(term.value, 'Terminal value') : terminalValue(term);
    const pvTV = presentValue(tv, r, N);
    const enterpriseValue = sumPV + pvTV;
    const netDebt = num(p.netDebt || 0, 'Net debt');
    const otherClaims = num(p.otherClaims || 0, 'Other claims');
    const equityValue = enterpriseValue - netDebt - otherClaims;
    const shares = p.shares == null ? null : num(p.shares, 'Shares');
    if (shares != null && shares <= 0) throw new RangeError('Shares must be greater than zero');
    return { r, rows, sumPV, terminal: term, tv, pvTV, enterpriseValue, netDebt, otherClaims, equityValue, perShare: shares ? equityValue / shares : null, tvShare: enterpriseValue ? pvTV / enterpriseValue : 0 };
  }

  /** Simple DCF calculator (Ch. 8): FCF = OCF - capex, with initial capex and a replacement interval. */
  function simpleForecast(p) {
    const n = Math.round(num(p.years, 'Forecast duration'));
    if (n < 1 || n > 30) throw new RangeError('Forecast duration must be 1-30 years');
    const ocf0 = num(p.ocf, 'Operating cash flow');
    const growth = num(p.ocfGrowth || 0, 'OCF growth step');
    const initial = num(p.initialCapex || 0, 'Initial capex');
    const interval = Math.round(num(p.replaceEvery || 0, 'Replacement interval'));
    const maint = num(p.annualCapex || 0, 'Annual capex');
    if (initial < 0 || maint < 0) throw new RangeError('Capex cannot be negative');
    const out = [];
    for (let t = 1; t <= n; t++) {
      const ocf = ocf0 + growth * (t - 1);
      let capex = maint;
      if (t === 1) capex += initial;
      else if (interval > 0 && (t - 1) % interval === 0) capex += initial;
      out.push({ year: t, ocf, capex, fcf: ocf - capex });
    }
    return out;
  }

  return { presentValue, terminalValue, dcf, simpleForecast };
});
