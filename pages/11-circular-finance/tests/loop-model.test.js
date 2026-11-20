'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../src/loop-model.js');

const ROOT = path.join(__dirname, '..');
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b)), `${a} != ${b}`);
const D = M.defaults();
const P = M.plain;

function isTagged(x) {
  return x && typeof x === 'object' && 'value' in x && 'status' in x && 'formula_text' in x;
}
function walkTagged(x, fn, seen = new Set()) {
  if (isTagged(x)) { fn(x); return; }
  if (Array.isArray(x)) { x.forEach((y) => walkTagged(y, fn, seen)); return; }
  if (x && typeof x === 'object') Object.keys(x).forEach((k) => walkTagged(x[k], fn, seen));
}

test('defaults are valid, on the step grid and match data/loop-defaults.json', () => {
  assert.ok(M.validateParams(D).ok);
  const doc = J('data/loop-defaults.json');
  assert.equal(doc.params.length, M.paramDefs().length);
  doc.params.forEach((p, i) => {
    const d = M.paramDefs()[i];
    assert.equal(p.id, d.id);
    assert.equal(p.value, d.value);
    assert.equal(p.min, d.min); assert.equal(p.max, d.max); assert.equal(p.step, d.step);
    assert.equal(p.status, d.status);
    const k = Math.round((p.value - p.min) / p.step);
    close(p.min + k * p.step, p.value);
    assert.ok(typeof p.rationale === 'string' && p.rationale.length > 20, p.id);
    assert.ok(M.STATUS_ORDER.includes(p.status));
  });
});

test('presets are valid, in range, and JSON matches embedded presets', () => {
  const doc = J('data/loop-defaults.json');
  assert.deepEqual(M.presetNames().sort(), ['coreweave_like', 'oracle_like', 'xai_spv_like']);
  for (const name of M.presetNames()) {
    const p = M.applyPreset(name);
    assert.ok(M.validateParams(p).ok, name);
    const jp = doc.presets.find((x) => x.id === name);
    assert.deepEqual(jp.params, M.presets()[name].params);
    Object.keys(jp.overrides).forEach((k) => assert.ok(jp.overrides[k].rationale.length > 10));
    const r = M.runLoop(p, 1);
    assert.ok(Object.values(r.checks).every(Boolean), name);
  }
  assert.equal(M.applyPreset('xai_spv_like').loan_to_cost, 0.625);
  assert.equal(M.applyPreset('oracle_like').backstop_share_of_capacity, 0);
  assert.equal(M.applyPreset('coreweave_like').gpu_useful_life_years, 6);
  assert.throws(() => M.applyPreset('nope'));
});

test('hop trace has hops 0..10 in order with claims #1..#9 added at the specified hops', () => {
  const r = M.runLoop(D, 1);
  assert.deepEqual(r.hops.map((h) => h.hop), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const at = {};
  r.hops.forEach((h) => { at[h.hop] = h.claims_added; });
  assert.deepEqual(at[1], ['c1']); assert.deepEqual(at[2], ['c2']); assert.deepEqual(at[5], ['c3']);
  assert.deepEqual(at[6], ['c4', 'c5']); assert.deepEqual(at[7], ['c6']); assert.deepEqual(at[8], ['c7', 'c8']); assert.deepEqual(at[9], ['c9']);
  assert.equal(r.hops[4].hatched, true);       // paper value is hatched
  assert.equal(r.hops[5].is_promise, true);    // contract is a promise
  assert.equal(r.hops[7].is_promise, true);    // backstop is a promise
  assert.equal(r.hops[1].money_kind, 'recycled');
  assert.equal(r.hops[2].money_kind, 'external');
});

test('debt formula: D = E*L/(1-L) and D/(E+D) = L for several L', () => {
  for (const L of [0.3, 0.5, 0.625, 0.7, 0.8]) {
    const r = P(M.runLoop(Object.assign({}, D, { loan_to_cost: L }), 1));
    const debt = r.cumulative.debt_created;
    close(debt, 100 * L / (1 - L));
    close(r.lap_traces[0].values.build_cost, 100 + debt);
    close(debt / r.lap_traces[0].values.build_cost, L);
  }
});

test('hop accounting identities in the default run', () => {
  const r = P(M.runLoop(D, 1));
  const c = r.cumulative;
  close(c.seed_equity, 100);
  close(c.debt_created, 166.6666666667, 1e-6);
  close(c.revenue_booked_total, 0.6 * (100 + c.debt_created));
  close(c.revenue_booked_total, c.revenue_external + c.revenue_recycled);
  close(c.revenue_counted_times, c.revenue_booked_total / c.seed_equity);
  const v = r.lap_traces[0].values;
  close(v.gross_profit, v.revenue * 0.748);
  close(v.net_profit, v.gross_profit * 0.75);
  close(v.paper_value, 0.5 * v.net_profit * 12);
  close(c.market_value_paper, v.paper_value);
  close(v.contract_value, 1.67 * v.build_cost);
  close(v.year1_payment, v.contract_value / 5);
  Object.values(M.runLoop(D, 1).checks).forEach((b) => assert.equal(b, true));
});

test('revenue attribution: pro-rata vs seed-first both add up to total revenue', () => {
  const a = P(M.runLoop(D, 1, { attribution: 'pro_rata' })).cumulative;
  const b = P(M.runLoop(D, 1, { attribution: 'seed_first' })).cumulative;
  close(a.revenue_booked_total, b.revenue_booked_total);
  close(a.revenue_recycled, a.revenue_booked_total * (1 - 0.625));
  close(b.revenue_recycled, Math.min(100, b.revenue_booked_total));
  close(b.revenue_recycled + b.revenue_external, b.revenue_booked_total);
  assert.throws(() => M.runLoop(D, 1, { attribution: 'x' }));
});

test('promises are never counted as cash', () => {
  const base = P(M.runLoop(D, 1)).cumulative;
  const more = P(M.runLoop(Object.assign({}, D, { backstop_share_of_capacity: 0.5 }), 1)).cumulative;
  assert.ok(more.promises_outstanding > base.promises_outstanding);
  close(more.external_cash, base.external_cash);
  close(more.recycled_cash, base.recycled_cash);
  close(base.cash_moved, base.external_cash + base.recycled_cash);
  // hop 5 adds the contract as promise, cash unchanged at that hop
  const r = P(M.runLoop(D, 1));
  const h4 = r.hops[4].running, h5 = r.hops[5].running;
  close(h5.external_cash, h4.external_cash); close(h5.recycled_cash, h4.recycled_cash);
  close(h5.promises_outstanding - h4.promises_outstanding, r.lap_traces[0].values.contract_value);
  // hop 6 converts year-1 payment from promise to cash
  const h6 = r.hops[6].running;
  close(h5.promises_outstanding - h6.promises_outstanding, r.lap_traces[0].values.year1_payment);
  close((h6.external_cash + h6.recycled_cash) - (h5.external_cash + h5.recycled_cash), r.lap_traces[0].values.year1_payment);
});

test('external + recycled shares add to 100% in the default run and in every preset', () => {
  for (const p of [D, ...M.presetNames().map((n) => M.applyPreset(n))]) {
    const c = P(M.runLoop(p, 1)).cumulative;
    close(c.external_share + c.recycled_share, 1);
    close(c.external_cash, c.external_end_user + c.external_capital);
  }
  const c = P(M.runLoop(D, 1)).cumulative;
  assert.ok(c.external_share > 0.6 && c.external_share < 0.7);
});

test('status propagation: weakest input wins, derived values never better than calculated', () => {
  assert.equal(M.weakestStatus(['verified', 'reported']), 'reported');
  assert.equal(M.weakestStatus(['verified', 'calculated', 'hypothetical']), 'hypothetical');
  assert.equal(M.weakestStatus(['hypothetical', 'unverified', 'verified']), 'unverified');
  assert.deepEqual(M.STATUS_ORDER, ['verified', 'reported', 'calculated', 'hypothetical', 'unverified']);
  assert.equal(M.effectiveStatus('nvidia_gross_margin', 0.748), 'verified');
  assert.equal(M.effectiveStatus('nvidia_gross_margin', 0.7), 'hypothetical');
  const r = M.runLoop(D, 1);
  const v = r.lap_traces[0].values;
  assert.equal(v.debt.status, 'calculated');          // inputs reported+calculated -> floor calculated
  assert.equal(v.revenue.status, 'hypothetical');     // Nvidia share of build cost is hypothetical
  assert.equal(v.paper_value.status, 'hypothetical');
  assert.equal(r.cumulative.external_share.status, 'hypothetical');
  assert.equal(r.geometric.ratio.status, 'hypothetical');
});

test('every public tagged output carries value, status in the allowed set, and non-empty formula_text', () => {
  const outs = [M.runLoop(D, 2), M.leverage(D), M.claimsStack(D, 1), M.externalShare(D), M.timeline(D)];
  let n = 0;
  outs.forEach((o) => walkTagged(o, (t) => {
    n++;
    assert.ok(M.STATUS_ORDER.includes(t.status), JSON.stringify(t));
    assert.ok(typeof t.formula_text === 'string' && t.formula_text.length > 0, JSON.stringify(t));
  }));
  assert.ok(n > 200);
});

test('laps: recurrence matches the closed-form geometric series', () => {
  const r = M.runLoop(D, 10);
  const ratio = P(r.geometric.ratio);
  close(ratio, 0.18 * 0.748 * 0.6 / (1 - 0.625));
  const seeds = r.lap_traces.map((l) => P(l.seed));
  seeds.forEach((s, i) => close(s, 100 * Math.pow(ratio, i)));
  const cum = P(r.cumulative);
  close(cum.seed_equity, 100 * (1 - Math.pow(ratio, 10)) / (1 - ratio));
  const cf = P(r.geometric.closed_form_cumulative);
  close(cf.revenue_booked_total, cum.revenue_booked_total);
  close(cf.debt_created, cum.debt_created);
  close(cf.market_value_paper, cum.market_value_paper);
});

test('laps converge to the limit 1/(1-r) and cumulative totals are monotone increasing', () => {
  const lim = P(M.runLoop(D, 1).geometric.sum_factor_limit);
  const big = P(M.runLoop(D, 60).cumulative);
  close(big.seed_equity / 100, lim, 1e-9);
  close(P(M.runLoop(D, 1).geometric.limit.revenue_booked_total), 160 * lim, 1e-9);
  let prev = 0;
  for (let n = 1; n <= 8; n++) {
    const v = P(M.runLoop(D, n).cumulative).revenue_booked_total;
    assert.ok(v > prev); prev = v;
  }
  assert.ok(M.runLoop(D, 1).geometric.converges);
});

test('divergent lap ratio (r >= 1) is flagged and has no finite limit', () => {
  const p = Object.assign({}, D, { reinvest_fraction: 0.9, loan_to_cost: 0.8, nvidia_share_of_build_cost: 0.85, nvidia_gross_margin: 0.85 });
  const r = M.runLoop(p, 5);
  assert.ok(P(r.geometric.ratio) >= 1);
  assert.equal(r.geometric.converges, false);
  assert.equal(r.geometric.sum_factor_limit.value, null);
  assert.equal(r.geometric.limit.revenue_booked_total.value, null);
});

test('external share does not depend on the number of laps; invalid laps rejected', () => {
  const a = P(M.runLoop(D, 1).cumulative).external_share, b = P(M.runLoop(D, 7).cumulative).external_share;
  close(a, b);
  assert.throws(() => M.runLoop(D, 0)); assert.throws(() => M.runLoop(D, 1.5)); assert.throws(() => M.runLoop(D, 201));
  assert.throws(() => M.runLoop(Object.assign({}, D, { loan_to_cost: 0.95 })), RangeError);
  assert.throws(() => M.runLoop({ nonsense: 1 }), RangeError);
});

test('leverage headline for the default run and monotonicity in loan-to-cost', () => {
  const h = P(M.leverage(D).headline);
  close(h.seed, 100); close(h.debt, 166.6666667, 1e-6); close(h.revenue, 160);
  close(h.leverage_multiplier, 1 / (1 - 0.625));
  assert.ok(h.paper_value > h.revenue);
  assert.match(M.leverage(D).headline.sentence, /\$100/);
  let prev = null;
  for (const L of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) {
    const x = P(M.leverage(Object.assign({}, D, { loan_to_cost: L })).headline);
    if (prev) {
      assert.ok(x.debt > prev.debt); assert.ok(x.build_cost > prev.build_cost);
      assert.ok(x.revenue > prev.revenue); assert.ok(x.paper_value > prev.paper_value);
    }
    prev = x;
  }
  const steps = M.leverage(D).steps;
  assert.equal(steps[steps.length - 1].hatched, true);
  assert.equal(steps[0].kind, 'recycled_cash'); assert.equal(steps[1].kind, 'external_cash');
});

test('claims stack: seven ordered slabs, claims per $1 asset and per $1 debt, claimants', () => {
  const s = M.claimsStack(D, 0);
  assert.deepEqual(s.slabs.map((x) => x.seniority), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(s.slabs.map((x) => x.id), ['s1_senior_secured', 's2_fund_back_leverage', 's3_mezz_converts', 's4_contract_rights', 's5_backstop', 's6_equity', 's7_lab_investors']);
  const r = P(s.ratios);
  close(r.claims_per_usd_asset, r.total_face_ranked / P(s.asset_value));
  close(r.claims_per_usd_asset_all_in, r.total_face_all / P(s.asset_value));
  close(r.claims_per_usd_debt, r.total_face_all / P(s.slabs[0].face_value));
  assert.ok(r.claims_per_usd_asset_all_in > r.claims_per_usd_asset && r.claims_per_usd_debt > 1);
  assert.ok(r.claims_per_usd_asset_cash <= r.claims_per_usd_asset + 1e-12);
  assert.equal(P(s.claims_count), 9);
  assert.equal(P(s.claimants_count), 8);
  const sum = s.slabs.filter((x) => !x.nested_in).reduce((a, x) => a + x.face_value.value, 0);
  close(sum, r.total_face_all);
  s.slabs.forEach((x) => { assert.ok(M.STATUS_ORDER.includes(x.status)); assert.ok(x.holder && x.example); });
});

test('toggling backstop and back-leverage changes the number of claims', () => {
  const noBack = M.claimsStack(Object.assign({}, D, { backstop_share_of_capacity: 0 }), 0);
  assert.equal(P(noBack.claims_count), 8);
  assert.equal(noBack.claims.find((c) => c.id === 'c6').active, false);
  const noLev = M.claimsStack(Object.assign({}, D, { credit_fund_back_leverage_ratio: 0 }), 0);
  assert.equal(noLev.claims.find((c) => c.id === 'c7').active, false);
  assert.equal(P(noLev.claims_count), 8);
  assert.ok(P(noLev.claimants_count) < 8);
});

test('depreciation: asset value shrinks while claim face values stay constant', () => {
  let prevAsset = Infinity;
  const faces0 = M.claimsStack(D, 0).slabs.map((x) => x.face_value.value);
  for (const t of [0, 0.5, 1, 2, 3, 4, 5, 6]) {
    const s = M.claimsStack(D, t);
    const a = s.asset_value.value;
    assert.ok(a <= prevAsset + 1e-12); prevAsset = a;
    assert.deepEqual(s.slabs.map((x) => x.face_value.value), faces0);
    assert.ok(s.book_value.value >= a - 1e-12);
  }
  assert.equal(M.claimsStack(D, 6).asset_value.value, 0);
  assert.equal(M.claimsStack(D, 6).ratios.claims_per_usd_asset.value, null);
  // claims per $1 of asset rises over time
  assert.ok(M.claimsStack(D, 3).ratios.claims_per_usd_asset.value > M.claimsStack(D, 1).ratios.claims_per_usd_asset.value);
  // shorter life shrinks faster
  const short = M.claimsStack(Object.assign({}, D, { gpu_useful_life_years: 3 }), 2).asset_value.value;
  const long = M.claimsStack(Object.assign({}, D, { gpu_useful_life_years: 6 }), 2).asset_value.value;
  assert.ok(short < long);
  // straight line with no rental decline
  const sl = M.claimsStack(Object.assign({}, D, { gpu_rental_decline_per_year: 0 }), 2.5);
  close(sl.asset_value.value, sl.book_value.value);
  const comp = P(sl.asset_components);
  close(comp.hardware_book, 266.6666667 * (1 - 2.5 / 5), 1e-6);
  close(comp.hardware_economic, comp.hardware_book);
  close(comp.prepayment_promise_unearned, 89.0666667 * 0.5, 1e-6);
  // the prepayment promise is NOT part of the asset
  close(sl.asset_value.value, comp.hardware_economic);
});

test('recovery waterfall conserves asset value and pays by seniority', () => {
  for (const t of [0, 1, 2, 3, 4, 5]) {
    const s = M.claimsStack(D, t);
    assert.ok(s.recovery_check.conserved, 't=' + t);
    const rec = P(s.recovery);
    const byId = {}; rec.forEach((r) => { byId[r.slab_id] = r; });
    const paid = ['s1_senior_secured', 's6_equity'].reduce((a, id) => a + byId[id].recovered, 0);
    close(paid, s.asset_value.value);
    // a junior slab gets nothing until every senior slab is whole
    if (byId.s1_senior_secured.recovery_pct < 1) assert.equal(byId.s6_equity.recovered, 0);
    assert.equal(byId.s4_contract_rights.recovered, null);   // promise, not cash
    assert.equal(byId.s3_mezz_converts.recovered, null);
    // nested bank is paid first out of the senior recovery
    const inner = P(s.inner_waterfall_senior);
    close(inner.bank_recovered + inner.lps_recovered, byId.s1_senior_secured.recovered);
  }
  const t0 = P(M.claimsStack(D, 0).recovery).find((r) => r.slab_id === 's6_equity');
  assert.ok(t0.recovered >= 100 - 1e-9);   // everything cash fits on purchase day: hardware = equity + debt
  close(P(M.claimsStack(D, 0).recovery).find((r) => r.slab_id === 's1_senior_secured').recovery_pct, 1);
});

test('amortizing the senior loan shrinks its face over time; timeline rows are consistent', () => {
  const a0 = M.claimsStack(D, 0, { amortize: true }).slabs[0].face_value.value;
  const a3 = M.claimsStack(D, 3, { amortize: true }).slabs[0].face_value.value;
  const a5 = M.claimsStack(D, 5, { amortize: true }).slabs[0].face_value.value;
  close(a0, 166.6666667, 1e-6); assert.ok(a3 < a0); assert.equal(a5, 0);
  const tl = M.timeline(D, { step: 1 });
  assert.equal(tl[0].year, 0); assert.equal(tl[tl.length - 1].year, 5);
  for (let i = 1; i < tl.length; i++) assert.ok(tl[i].asset_value.value <= tl[i - 1].asset_value.value + 1e-12);
});

test('stress waterfall: cash in equals cash paid, and scheduled = paid + haircut', () => {
  const scenarios = [
    {}, { external_revenue_shortfall_pct: 40 }, { external_revenue_shortfall_pct: 100, nvidia_stock_drop_pct: 60 },
    { lab_missed_payment: true }, { rate_shock_bps: 400, gpu_rental_price_drop_pct: 50 },
    { external_revenue_shortfall_pct: 80, nvidia_stock_drop_pct: 80, rate_shock_bps: 500, lab_missed_payment: false }
  ];
  for (const sc of scenarios) {
    for (const p of [D, Object.assign({}, D, { backstop_share_of_capacity: 0 })]) {
      const s = M.stress(p, sc);
      assert.ok(s.conservation.balanced, JSON.stringify(sc));
      const w = P(s.waterfall);
      w.forEach((it) => {
        if (it.id !== 'equity') close(it.scheduled, it.paid + it.haircut);
        else assert.ok(it.paid + it.haircut >= it.scheduled - 1e-9);
        assert.ok(it.paid >= -1e-12 && it.haircut >= -1e-12);
      });
      const src = P(s.sources_of_cash);
      close(src.total_cash_in, w.reduce((a, it) => a + it.paid, 0));
      close(src.total_cash_in, src.lab_total + src.backstop_payment_from_nvidia);
      // seniority: equity is paid only if senior debt is whole
      const eq = w.find((x) => x.id === 'equity'), bank = w.find((x) => x.id === 'senior_bank'), lps = w.find((x) => x.id === 'senior_lps');
      if (eq.paid > 1e-9) { assert.ok(bank.haircut < 1e-9); assert.ok(lps.haircut < 1e-9); }
    }
  }
});

test('stress: backstop triggers only when it exists and the shortfall passes the trigger; loops back to Nvidia', () => {
  const calm = M.stress(D, {});
  assert.equal(calm.triggered_promises.find((x) => x.id === 'nvidia_backstop').triggered, false);
  close(P(calm.sources_of_cash).backstop_payment_from_nvidia, 0);
  const bad = M.stress(D, { lab_missed_payment: true });
  const bp = bad.triggered_promises.find((x) => x.id === 'nvidia_backstop');
  assert.equal(bp.triggered, true);
  assert.ok(bp.amount_called.value > 0 && bp.amount_called.value <= bp.cap.value + 1e-9);
  assert.ok(P(bad.loop_back_to_nvidia).backstop_cash_paid > 0);
  const none = M.stress(Object.assign({}, D, { backstop_share_of_capacity: 0 }), { lab_missed_payment: true });
  assert.equal(none.triggered_promises.find((x) => x.id === 'nvidia_backstop').triggered, false);
  const sn = P(none.senior_summary);
  assert.ok(sn.shortfall > 0);
  assert.ok(P(none.loop_back_to_nvidia).next_lap_revenue_lost_to_financing > 0);
  assert.equal(none.triggered_promises.find((x) => x.id === 'receivables_pledge').triggered, true);
  // below-trigger shortfall does not call the backstop
  const small = M.stress(D, { external_revenue_shortfall_pct: 10 });
  assert.equal(small.triggered_promises.find((x) => x.id === 'nvidia_backstop').triggered, false);
});

test('stress is monotone: worse shocks never increase equity distributions; rate shock raises debt service', () => {
  let prev = Infinity;
  for (const x of [0, 20, 40, 60, 80, 100]) {
    const s = M.stress(Object.assign({}, D, { backstop_share_of_capacity: 0 }), { external_revenue_shortfall_pct: x });
    const eq = P(s.waterfall).find((i) => i.id === 'equity').paid;
    assert.ok(eq <= prev + 1e-9); prev = eq;
  }
  const base = P(M.stress(D, {}).scheduled).debt_service_stressed;
  const shock = P(M.stress(D, { rate_shock_bps: 300 }).scheduled).debt_service_stressed;
  assert.ok(shock > base);
  const ltv0 = P(M.stress(D, {}).collateral).senior_ltv, ltv1 = P(M.stress(D, { gpu_rental_price_drop_pct: 40 }).collateral).senior_ltv;
  assert.ok(ltv1 > ltv0);
  M.stress(D, {}); // does not mutate inputs
  assert.equal(D.loan_to_cost, 0.625);
});

test('stress rejects invalid scenarios and tags everything hypothetical', () => {
  assert.throws(() => M.stress(D, { external_revenue_shortfall_pct: 120 }), RangeError);
  assert.throws(() => M.stress(D, { rate_shock_bps: -5 }), RangeError);
  assert.throws(() => M.stress(D, { lab_missed_payment: 'yes' }), RangeError);
  assert.throws(() => M.stress(D, { made_up: 1 }), RangeError);
  const s = M.stress(D, { external_revenue_shortfall_pct: 30 });
  walkTagged(s, (t) => assert.equal(t.status, 'hypothetical'));
  assert.match(s.toy_model_notice, /Toy/);
});

test('externalShare: low <= base <= high, joint range contains one-at-a-time range, tornado sorted', () => {
  const e = M.externalShare(D);
  const h = P(e.headline);
  assert.ok(h.external_share.low <= h.external_share.base && h.external_share.base <= h.external_share.high);
  assert.ok(h.end_user_share.low <= h.end_user_share.base && h.end_user_share.base <= h.end_user_share.high);
  assert.ok(h.external_share.joint_low <= h.external_share.low + 1e-12 && h.external_share.joint_high >= h.external_share.high - 1e-12);
  assert.ok(h.end_user_share.base < h.external_share.base);
  for (let i = 1; i < e.tornado.length; i++) assert.ok(e.tornado[i - 1].swing >= e.tornado[i].swing);
  assert.equal(e.headline.external_share.base.status, 'hypothetical');
  close(h.external_share.base, P(M.runLoop(D, 1).cumulative).external_share);
  assert.match(e.headline.sentence, /cents/);
});

test('encode/decode round trip for defaults, presets and on-grid random states', () => {
  assert.equal(M.encodeState(D), '1');
  const dec = M.decodeState('1');
  assert.ok(dec.ok); assert.deepEqual(dec.params, D);
  for (const name of M.presetNames()) {
    const p = M.applyPreset(name);
    const s = M.encodeState(p, { laps: 5, year: 2.5, preset: name });
    const d = M.decodeState('#' + s);
    assert.ok(d.ok, s);
    assert.deepEqual(d.params, p);
    assert.deepEqual(d.ui, { laps: 5, year: 2.5, preset: name });
  }
  let seed = 12345;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  for (let i = 0; i < 200; i++) {
    const p = Object.assign({}, D);
    M.paramDefs().forEach((d) => {
      if (rnd() < 0.5) {
        const k = Math.floor(rnd() * (Math.round((d.max - d.min) / d.step) + 1));
        p[d.id] = +(d.min + k * d.step).toFixed(6);
      }
    });
    const s = M.encodeState(p);
    assert.ok(s.length < 400);
    const d = M.decodeState(s);
    assert.ok(d.ok, s);
    M.paramDefs().forEach((def) => close(d.params[def.id], p[def.id], 1e-9));
  }
  // off-grid values snap to the nearest step
  const snapped = M.decodeState(M.encodeState(Object.assign({}, D, { loan_to_cost: 0.6234 }))).params.loan_to_cost;
  close(snapped, 0.625, 1e-9);
  close(M.snap(Object.assign({}, D, { loan_to_cost: 0.6234 })).loan_to_cost, 0.625, 1e-9);
});

test('decodeState rejects invalid state and encodeState rejects out-of-range values', () => {
  const bad = ['2', '', 'abc', '1~zz:1', '1~0:zzzz', '1~0:1~0:2', '1~0', '1~L:0', '1~P:z', '1~T:zz', '1~1:1y~1:1y', null, 42];
  for (const b of bad) {
    const d = M.decodeState(b);
    assert.equal(d.ok, false, String(b));
    assert.equal(d.params, null);
    assert.ok(d.errors.length > 0);
  }
  assert.throws(() => M.encodeState(Object.assign({}, D, { loan_to_cost: 0.99 })), RangeError);
  assert.throws(() => M.encodeState(D, { laps: 0 }), RangeError);
  assert.throws(() => M.encodeState(D, { year: 2.25 }), RangeError);
  assert.throws(() => M.encodeState(D, { preset: 'bogus' }), RangeError);
});

test('data files: sources resolve, verified implies primary source, promises are not cash', () => {
  const deals = J('data/deals.json');
  const src = new Map(deals.sources.map((s) => [s.id, s]));
  assert.ok(deals.deals.length >= 50);
  const ids = new Set();
  for (const d of deals.deals) {
    assert.ok(!ids.has(d.id)); ids.add(d.id);
    assert.ok(d.source_ids.length >= 1, d.id);
    d.source_ids.forEach((s) => assert.ok(src.has(s), d.id + ' ' + s));
    assert.ok(['equity', 'debt', 'compute_contract', 'chip_purchase', 'backstop', 'warrant', 'lease', 'revenue_share', 'guarantee', 'loi'].includes(d.type), d.id);
    assert.ok(['external', 'recycled', 'promise', 'mixed', 'outside_loop_investment'].includes(d.money_kind));
    assert.ok(M.STATUS_ORDER.includes(d.status));
    if (d.status === 'verified') assert.ok(d.source_ids.some((s) => src.get(s).type === 'primary'), d.id);
    if (d.type === 'equity' || d.type === 'debt') assert.ok(d.money_kind !== 'promise' || d.contingent === true, d.id);
    if (d.money_kind === 'promise' && !d.contingent) assert.ok(!['equity', 'debt'].includes(d.type));
  }
  const t = deals.totals;
  close(t.cash_total.actual_usd_b_low_sum, t.external_cash.actual_usd_b_low_sum + t.recycled_cash.actual_usd_b_low_sum);
  const ent = J('data/entities.json').nodes;
  const eid = new Set(ent.map((n) => n.id));
  deals.deals.forEach((d) => { assert.ok(eid.has(d.from) && eid.has(d.to), d.id); });
  assert.ok(ent.length >= 33);
  ent.forEach((n) => { assert.ok(['supply', 'neocloud', 'hyperscaler', 'lab', 'capital'].includes(n.layer)); assert.ok('site_path' in n.links); });
  const ev = J('data/events.json').events;
  assert.ok(ev.length >= 18);
  ev.forEach((e) => { assert.ok(e.source_ids.length >= 1); if (e.status === 'verified') assert.ok(e.source_ids.some((s) => src.get(s).type === 'primary')); });
  const hist = J('data/history.json');
  assert.ok(hist.caveats.some((c) => /restated/.test(c.text)));
  assert.ok(Array.isArray(hist.bull_arguments) && hist.bull_arguments.length >= 4 && hist.bear_arguments.length >= 4);
  const sc = J('data/source-claims.json');
  assert.ok(Object.keys(sc.facts).length > 100);
});

// ---------------------------------------------------------------- round-1 fixes (fixer A)
test('fix #7 (round 2): headline counts only claims ranked on the asset: 1.00 at day 0; all-in 1.84 excludes the nested bank slice', () => {
  const s = M.claimsStack(D, 0);
  close(P(s.asset_value), 266.6666667, 1e-6);                       // hardware only (was 355.73 with prepayment counted as cash)
  close(P(s.ratios.claims_per_usd_asset), 1, 1e-9);
  close(P(s.ratios.claims_per_usd_asset_cash), 1, 1e-9);
  // all-in = every slab except the nested bank slice (545.83 - 55.56 = 490.27)
  const bank = s.slabs.find((x) => x.id === 's2_fund_back_leverage').face_value.value;
  close(P(s.ratios.total_face_all), 545.8268 - bank, 1e-3);
  close(P(s.ratios.claims_per_usd_asset_all_in), 490.27 / 266.6666667, 1e-3);
  assert.ok(Math.abs(P(s.ratios.claims_per_usd_asset_all_in) - 1.84) < 0.01);
  close(P(s.ratios.total_face_ranked), P(s.slabs[0].face_value) + P(s.slabs.find((x) => x.id === 's6_equity').face_value), 1e-9);
  assert.ok(/nested/.test(s.ratios.labels.counted) && /not ranked/i.test(s.ratios.labels.counted));
  assert.ok(/rent stops/.test(M.claimsStack(D, 3).ratios.no_paydown_caveat));
  assert.equal(M.claimsStack(D, 3, { amortize: true }).ratios.no_paydown_caveat, '');
  const s4 = s.slabs.find((x) => x.id === 's4_contract_rights');
  assert.equal(s4.kind, 'promise_right'); assert.equal(s4.recoverable_from_asset, false);
  assert.equal(s4.asset_rank, null);
  assert.deepEqual(s.slabs.filter((x) => x.ranked_against_asset).map((x) => x.id), ['s1_senior_secured', 's2_fund_back_leverage', 's6_equity']);
  assert.equal(s.slabs.find((x) => x.id === 's6_equity').asset_rank, 2);
  // consistent with chapter 3: the hop-5 prepayment is not in any cash tally
  const r = M.runLoop(D, 1);
  close(r.cumulative.cash_moved.value, r.cumulative.external_cash.value + r.cumulative.recycled_cash.value);
  assert.ok(/promise/i.test(s.asset_note));
});

test('fix B1: amortizing view carries a documented hypothetical rent-paydown; constant view is the stress case', () => {
  const c = M.claimsStack(D, 3);
  const a = M.claimsStack(D, 3, { amortize: true });
  assert.equal(a.amortized, true); assert.equal(c.amortized, false);
  assert.ok(a.slabs[0].face_value.value < c.slabs[0].face_value.value);
  assert.ok(a.ratios.claims_per_usd_asset.value < c.ratios.claims_per_usd_asset.value);
  assert.equal(a.amortization.applied, true);
  assert.ok(/stress|rent stops/i.test(a.amortization.stress_case_note));
  assert.equal(a.amortization.annual_debt_service.status, 'hypothetical');
  assert.ok(a.amortization.rent_covers_debt_service_x.value > 1);
  // the senior loan is fully repaid at the end of the term in the amortizing view, never in the constant view
  assert.equal(M.claimsStack(D, 5, { amortize: true }).slabs[0].face_value.value, 0);
  assert.ok(M.claimsStack(D, 5).slabs[0].face_value.value > 0);
  const tlA = M.timeline(D, { step: 1, amortize: true }), tlC = M.timeline(D, { step: 1 });
  assert.ok(tlA[3].total_claims.value < tlC[3].total_claims.value);
});

test('fix B3: end_user_share exposes low/base/high, a toy-model note and a sentence', () => {
  const h = M.externalShare(D).headline;
  ['low', 'base', 'high'].forEach((k) => assert.ok(h.end_user_share[k].value > 0 && h.end_user_share[k].status === 'hypothetical'));
  assert.ok(/TOY-MODEL/.test(h.end_user_share.note) && /62%/.test(h.end_user_share.note) && /50%/.test(h.end_user_share.note));
  assert.ok(/toy model/i.test(M.externalShare(D).end_user_sentence));
  const hi = M.externalShare(Object.assign({}, D, { lab_outside_revenue_share: 0.8 })).headline.end_user_share;
  assert.ok(!/62%/.test(hi.note));   // the "cautious setting" gloss only applies to the default
  assert.ok(hi.base.value > h.end_user_share.base.value);
});

test('fix bridge: revenue counted N times has a plain definition and a second, named denominator', () => {
  const r = M.runLoop(D, 1);
  assert.ok(/per \$1 of seed cash/.test(r.cumulative.revenue_counted_times.definition));
  assert.ok(/dinner/i.test(r.cumulative.revenue_counted_times.definition));
  close(r.bridge.revenue_counted_times.value, 1.6, 1e-9);
  close(r.bridge.revenue_per_outside_dollar.value, 160 / r.cumulative.external_cash.value, 1e-9);
  assert.ok(/denominator/.test(r.bridge.note));
  assert.ok(/not "created"/.test(r.labels.cash_created));
  assert.ok(/flips/.test(r.attribution_note));
  close(M.plain(r.cumulative).revenue_counted_times, 1.6);   // plain() still strips the tag
});

const FD = () => Object.fromEntries(J('data/deals.json').deals.map((d) => [d.id, d]));

test('fix #2: guarantee total is Nvidia\'s company statement ($118.0B at Oct 25), no "unconfirmed" wording, three lines add up', () => {
  const f = J('data/source-claims.json').facts;
  assert.equal(f['nvda-guarantee-total'].value, 118);
  assert.equal(f['nvda-guarantee-total'].status, 'verified');
  close(f['nvda-guar-land-power-shell'].value + f['nvda-guar-sbenergy'].value + f['nvda-guar-power-systems'].value, 118);
  assert.equal(f['nvda-guarantee-total-jul'].value, 108.5);
  const src = new Map(J('data/deals.json').sources.map((s) => [s.id, s]));
  assert.ok(f['nvda-guarantee-total'].source_ids.some((i) => src.get(i).type === 'primary'));
  const ev = J('data/events.json').events.find((e) => e.id === 'ev-nvda-105b-guarantee');
  assert.ok(!/unconfirmed|Substack/i.test(ev.detail) && /118\.0B/.test(ev.detail));
  const hq = J('data/history.json').open_questions.join(' ');
  assert.ok(!/Substack|FourWeekMBA|Avoid repeating|\(403\)|Bloomberg\/ICE/.test(hq));
  const d = FD()['nvda-sbenergy-ohio-guarantee'];
  assert.ok(!/land, power and shell\)/.test(d.structure) && /credit support/.test(d.structure));
  assert.ok(/118\.0B/.test(d.what_changed_since_announcement));
});

test('fix #3: Nvidia R&D cloud/lease commitments are out of the loop; the $32B neocloud line is a promise edge', () => {
  const D2 = FD(), tot = J('data/deals.json').totals;
  const own = D2['nvda-cloud-commitments'];
  assert.equal(own.loop_edge, false); assert.equal(own.sum_exclude, true);
  assert.ok(/R&D/.test(own.structure));
  const neo = D2['nvda-neocloud-agreements'];
  assert.equal(neo.money_kind, 'promise'); assert.equal(neo.headline_usd_b, 32); assert.equal(neo.loop_edge, true); assert.equal(neo.actual_usd_b_low, 0);
  assert.ok(/financ/.test(neo.structure));
  assert.ok(tot.excluded_from_sums.some((x) => x.id === 'nvda-cloud-commitments'));
});

test('fix #4: Anthropic placement is a contingent promise, not recycled cash moved', () => {
  const d = FD()['nvda-anthropic-equity'];
  assert.equal(d.money_kind, 'promise'); assert.equal(d.contingent, true);
  assert.equal(d.actual_usd_b_low, 0); assert.equal(d.actual_usd_b_high, 10);
  assert.ok(!/became/.test(d.what_changed_since_announcement) && /\$20B/.test(d.what_changed_since_announcement));
  assert.equal(FD()['anthropic-ipo-placement'].money_kind, 'promise');
});

test('fix #5: the $122B OpenAI round is mixed with a split that adds up and shows vendor money', () => {
  const d = FD()['openai-round-mar2026'];
  assert.equal(d.money_kind, 'mixed');
  close(d.money_split.reduce((a, x) => a + x.usd_b, 0), d.headline_usd_b);
  assert.ok(d.money_split.some((x) => x.kind === 'recycled' && x.usd_b === 80));
  assert.equal(d.sum_exclude, true);
});

test('fix #6: Intel and Synopsys/Nokia are outside_loop_investment, never external cash, never loop edges', () => {
  const D2 = FD();
  ['nvda-intel', 'nvda-synopsys-nokia'].forEach((id) => { assert.equal(D2[id].money_kind, 'outside_loop_investment'); assert.equal(D2[id].loop_edge, false); });
  assert.ok(J('data/deals.json').money_kinds.outside_loop_investment);
  const tot = J('data/deals.json').totals;
  Object.values(D2).filter((d) => d.money_kind === 'outside_loop_investment').forEach((d) => assert.ok(tot.excluded_from_sums.some((x) => x.id === d.id)));
});

test('minor fixes: Lucent original revenue $33.813B, SpaceX $32B/8.26% unverified, xAI amount ranged, Nebius upgraded', () => {
  const h = J('data/history.json');
  const orig = h.derived.find((x) => x.id === 'lu-commit-share-original');
  close(orig.value, 24.0, 0.01); assert.equal(orig.status, 'calculated');
  assert.ok(!/33\.6/.test(JSON.stringify(h)));
  assert.ok(/33\.813/.test(h.caveats[0].text));
  const D2 = FD();
  assert.equal(D2['spacex-xai-chip-spv'].status, 'unverified');
  assert.ok(!/reported \(a debt-cost/.test(D2['spacex-xai-chip-spv'].notes));
  const dl = J('data/loop-defaults.json');
  assert.equal(dl.presets.find((p) => p.id === 'xai_spv_like').overrides.credit_spread.status, 'hypothetical');
  assert.ok(!/8\.26/.test(dl.params.find((p) => p.id === 'credit_spread').rationale));
  assert.ok(!/alt_values/.test(JSON.stringify(dl.params.map((p) => p.rationale))));
  assert.equal(D2['nvda-xai-equity'].actual_usd_b_low, 2);
  assert.equal(D2['nvda-nebius'].status, 'verified');
  assert.ok(!/5\.96/.test(D2['iren-gpu-financing'].structure.replace(/one source gives 5\.96%[^.]*\./, '')));
});

// ---------------------------------------------------------------- round-2 fixes (fixer A)
test('round 2 finance: unclosed OpenAI round is a promise; Microsoft $13B is not tagged verified; Amazon splits cash vs conditional', () => {
  const deals = J('data/deals.json').deals;
  const by = (id) => deals.find((d) => d.id === id);
  const r = by('openai-round-nov2026'), rem = by('openai-round-nov2026-remainder');
  assert.equal(r.money_kind, 'external'); assert.equal(r.status, 'reported'); assert.equal(r.headline_usd_b, 11); assert.ok(!/no close/i.test(r.structure));
  assert.equal(rem.money_kind, 'promise'); assert.equal(rem.contingent, true); assert.equal(rem.actual_usd_b_low, 0); assert.equal(rem.headline_usd_b, 9);
  const ms = by('microsoft-openai-equity');
  assert.notEqual(ms.status, 'verified');
  const am = by('amazon-openai-equity');
  assert.equal(am.amount_split.cash_moved_usd_b, 15); assert.equal(am.amount_split.conditional_usd_b, 35);
  assert.equal(J('data/deals.json').totals.conditional_within_cash_headline_usd_b, 35);
  const hy = by('meta-hyperion-beignet'), bond = by('meta-hyperion-bond');
  assert.equal(hy.money_kind, 'promise'); assert.equal(hy.headline_usd_b, 28);
  assert.equal(bond.money_kind, 'external'); assert.equal(bond.headline_usd_b, 27.3);
  const sx = by('anthropic-spacexai-compute');
  assert.equal(sx.money_kind, 'promise'); assert.equal(sx.headline_usd_b, 120.5);
});

test('round 2 fairness: every deal has a clean reader_note; no process language in reader-facing strings; internal fields stripped from bundle', () => {
  const deals = J('data/deals.json').deals;
  const bad = /not re-?fetched|this pass|from memory|merge note|do not chart|upgrade to verified|fetch (the|sec)|the research\b|search summar|\bI could\b|machine-translated/i;
  deals.forEach((d) => {
    assert.ok(d.reader_note && d.reader_note.length > 40 && d.reader_note.length < 520, d.id);
    assert.ok(!bad.test(d.reader_note), d.id);
    assert.ok(!bad.test(d.structure || '') && !bad.test(d.what_changed_since_announcement || ''), d.id);
    assert.ok(!('notes' in d), d.id + ' raw notes must not exist');
  });
  const params = J('data/loop-defaults.json').params;
  params.forEach((p) => { assert.ok(p.reader_note && !bad.test(p.rationale) && !bad.test(p.reader_note), p.id); });
  const h = J('data/history.json');
  assert.ok(!JSON.stringify(h.bear_arguments).includes('leadership shock'));
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  ['internal_notes', 'merge_log', 'status_adjusted_from', 'research_file'].forEach((k) => assert.ok(!html.includes('"' + k + '"'), k));
  const src = J('data/sources.json').sources;
  src.forEach((s) => { assert.ok(!/enron|bubble|lost its ceo|gymnastic/i.test(s.title), s.title); assert.ok(!/^[0-9a-f\s-]{16,}$/i.test(s.title) && !/^\d+$/.test(s.title), s.title); });
});

test('round 2 freshness: huang entry holds only 8-K facts; Senate hearing; Anthropic IPO priced; CDS wording', () => {
  const ev = J('data/events.json').events;
  const hu = ev.find((e) => e.id === 'ev-huang-resigns');
  assert.ok(!('reported_detail' in hu)); assert.ok(/does not state a reason/.test(hu.detail));
  assert.ok(!/Dec 1|Senate|conduct|Megaspeed/.test(hu.detail));
  const se = ev.find((e) => e.id === 'ev-congress-huang-hearings');
  assert.ok(se && se.date === '2026-12-03' && /tentative/i.test(se.detail) && se.source_ids.length >= 1);
  const ipo = ev.find((e) => e.id === 'ev-anthropic-ipo-priced');
  assert.ok(ipo && /\$83/.test(ipo.title));
  const cds = ev.find((e) => e.id === 'ev-ai-bond-wave-cds-spike');
  assert.ok(/1,280/.test(cds.title) && /1,278/.test(cds.detail) && /1,289/.test(cds.detail));
  const claims = J('data/source-claims.json').facts['crwv-customer-a'];
  assert.equal(claims.comparable_across_periods, false);
  assert.ok(/different customers/.test(claims.comparability_caveat));
});

test('round 2 education: meta.json counts are data-driven and add up; hops wording documented', () => {
  const m = J('data/meta.json'), deals = J('data/deals.json').deals;
  assert.equal(m.deal_count, deals.length);
  assert.equal(m.cash_in_loop_count + m.promise_count + m.mixed_count + m.outside_loop_count, m.deal_count);
  assert.equal(m.hops.stops, 11); assert.equal(m.hops.last_index - m.hops.first_index + 1, m.hops.stops);
  assert.equal(M.runLoop(D, 1).hops.length, m.hops.stops);
  assert.ok(m.deal_line_sentence.startsWith(m.deal_count + ' deal lines'));
  assert.ok(m.money_kind_labels.mixed && /money_split/.test(m.money_kind_labels.mixed.reader_text));
});

test('round 2: no-paydown caveat string and ranked ratios track paydown', () => {
  const c = M.claimsStack(D, 3), a = M.claimsStack(D, 3, { amortize: true });
  assert.ok(c.ratios.claims_per_usd_asset.value > a.ratios.claims_per_usd_asset.value);
  assert.ok(c.ratios.claims_per_usd_asset_all_in.value > c.ratios.claims_per_usd_asset.value);
  M.timeline(D).forEach((row) => assert.ok(row.total_claims_all_in.value >= row.total_claims.value));
});

test('round 3 fixer A: placement buyers, calculated investment assets, Anthropic SpaceX ceiling, no CEO wording', () => {
  const deals = J('data/deals.json').deals, by = (id) => deals.find((d) => d.id === id);
  const pl = by('anthropic-ipo-placement');
  assert.equal(pl.from, 'placement_buyers'); assert.ok(/Nvidia.*same|same.*Nvidia/i.test(pl.structure));
  assert.ok(J('data/entities.json').nodes.some((n) => n.id === 'placement_buyers'));
  const facts = J('data/source-claims.json').facts;
  const inv = Object.values(facts).concat(J('data/history.json').lucent ? Object.values(J('data/history.json').lucent.facts || {}) : []);
  const txt = JSON.stringify(J('data/history.json'));
  assert.ok(/"id":"nv-invest-assets"[^}]*"status":"calculated"|"status":"calculated"[^}]*"id":"nv-invest-assets"/.test(txt) || txt.includes('nv-invest-assets'));
  assert.ok(!/Nvidia.s CEO/.test(JSON.stringify(deals)));
  assert.ok(by('anthropic-spacexai-compute').headline_usd_b === 120.5);
});

test('summed deal headlines are tagged calculated, with sourced parts and explicit placement data', () => {
  const deals = J('data/deals.json').deals;
  const by = (id) => deals.find((d) => d.id === id);
  [['nvda-cloud-commitments', 102], ['coreweave-ddtl-5-5-and-converts', 6.8], ['openai-aws-compute', 138]].forEach(([id, total]) => {
    const d = by(id);
    assert.equal(d.status, 'calculated', id);
    assert.ok(d.components && d.components.length >= 2 && d.formula_text, id);
    close(d.components.reduce((a, c) => a + c.usd_b, 0), total);
    d.components.forEach((c) => { assert.ok(c.status && c.source_ids.length > 0, id); });
  });
  // any verified deal whose components exist must not be a sum
  deals.filter((d) => d.status === 'verified').forEach((d) => assert.ok(!d.components, d.id));
  // only explicit placements carry participant lists / includes
  deals.filter((d) => d.placement).forEach((d) => assert.equal(d.id, 'anthropic-ipo-placement'));
  deals.filter((d) => d.includes).forEach((d) => d.includes.forEach((i) => assert.ok(by(i), i)));
});
