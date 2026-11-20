# Episode 11 "The Loop": data + model API

Everything here is a **toy model, per $100 of seed cash**. Nothing is a forecast. No fraud is implied: layered claims on one asset are an ordinary capital structure; the point is **correlation** (every claim is paid from the same future AI end-user spending).

Files (all under `pages/11-circular-finance/`):

| File | What |
|---|---|
| `src/loop-model.js` | Pure UMD module. `window.LoopModel` in the browser, `require()` in Node. No dependencies. |
| `data/loop-defaults.json` | Parameter definitions (id, label, value, min, max, step, unit, status, source_ids, rationale), presets, and the default-run headline. Same definitions are embedded in `loop-model.js` (generated block). |
| `data/deals.json` | 60 merged edges (read the count from `data/meta.json`, never type it) + `sources` + `totals` + `merge_log` (builder-only). |
| `data/meta.json` | Embedded counts: `deal_count`, `deal_count_by_money_kind`, `cash_in_loop_count`, `promise_count`, `mixed_count`, `outside_loop_count`, `parties_with_deal_lines`, `event_count`, `source_count`, `hops`, `deal_line_sentence`, `money_kind_labels`. Chapters print these, never typed numbers. |
| `data/entities.json` | 44 nodes (33 requested + 11 `extra_node:true` helper nodes). |
| `data/events.json`, `data/history.json` | Timeline events; Lucent/Nortel facts, `caveats`, `bull_arguments`, `bear_arguments`. |
| `data/sources.json`, `data/source-claims.json` | Source registry; fact/deal/event/param to source-id skeleton. |
| `tools/build_data.py` | Regenerates all of the above from `data/research/*.json` and asserts invariants. |
| `tests/loop-model.test.js` | `node --test tests/*.test.js` (43 tests). |

Never edit the `GENERATED` block in `loop-model.js` by hand; edit `tools/build_data.py` and re-run it.

## 1. Conventions

### Status tags (exact strings)
`verified` < `reported` < `calculated` < `hypothetical` < `unverified` (increasing weakness).
* **Output status = weakest status among the inputs it used**, and a derived number is **never better than `calculated`**.
* A parameter value changed away from its default is treated as **`hypothetical`** (`effectiveStatus`). `seed_usd` is exempt (display scale).
* Stress-test outputs are always `hypothetical` (scenario knobs are hypotheticals).
* `verified` is only used where a primary source (SEC filing, company release/blog) backs it; `build_data.py` downgrades press-only "verified" research tags to `reported` and records `status_adjusted_from`.

### Tagged value
Every model output is `{ "value": number|bool|null, "status": "<tag>", "formula_text": "string with the numbers substituted" }`. Show `status` as a badge and `formula_text` on hover or in the "show the math" drawer. `LoopModel.plain(x)` deep-strips tags to bare values (handy for charts/tests). `null` means "undefined" (for example a ratio over a zero asset).

### Three kinds of money
`external` cash (from outside the loop: lenders, outside investors, end customers; still must be repaid or earn a return from future end-user money), `recycled` cash (started with a loop participant and returns to it, for example Nvidia equity in a customer that buys Nvidia systems), `promise` (contracts, backlog, RPO, backstops, guarantees, warrants, leases, LOIs: **not cash**, never in cash totals). `hatched`/`paper` = market value, not cash.

### money_kind values (deals.json, round-1 fix)
`external`, `recycled`, `promise` as above, plus two new kinds. **Chapters must handle all five; do not index a label table by `money_kind` without a fallback.**
* `mixed`: an aggregate round holding both vendor and outside money (only `openai-round-mar2026`). Has `money_split: [{kind, usd_b, label}]` that adds to `headline_usd_b`. Always `sum_exclude`. **Chapters must never show the bare word "mixed"**: show the label from `deals.json -> money_kind_labels` ("Mixed round") with the `money_split` parts (vendor money vs other investors), add a Mixed legend entry and a `meta.mixed_count` count, and do not draw it from "Other investors" as if all outside money.
* `outside_loop_investment`: Nvidia's own cash into companies that are not loop customers (`nvda-intel`, `nvda-synopsys-nokia`). Always `loop_edge:false`. It is NOT external cash. **Chapter 2 Nvidia node panel:** drive the cash rows from `deals.json -> money_kinds` and `money_kind`; show these deals on a separate row "Investments outside the loop", never under "External cash".
* `deals.json -> money_kind_labels` = `{kind: {label, reader_text}}` for all five kinds (use it for legends, aria and detail text).
* `amount_split` (on a few deals, else `null`): `{cash_moved_usd_b, conditional_usd_b, not_yet_funded_usd_b, label}`. **Show cash moved and conditional separately; never sum `headline_usd_b` into "cash that moved" for a deal with a split.** `amazon-openai-equity`: $15B moved, $35B conditional. `microsoft-openai-equity`: $11.6B funded of a $13B commitment (reported, from Microsoft filings via press). `totals.conditional_within_cash_headline_usd_b` = 35. Pair sums on ch07 must use `external`/`recycled` kinds only and `cash_moved_usd_b` where a split exists.
* `openai-round-nov2026` is a `promise` (contingent, actual $0 to $30B, not closed). `meta-hyperion-beignet` is the guarantee edge (reported cap about $28B, actual 0 to 28); the $27.3B bond is its own external edge `meta-hyperion-bond`. `anthropic-spacexai-compute` ($120.5B ceiling, promise, reported, cancellable on 90 days' notice after early 2027) links `anthropic` to `xai` (SpaceX AI unit).
* Deals also carry `contingent: true|false`. A contingent equity/debt deal (`nvda-anthropic-equity`, `anthropic-ipo-placement`: closes only if the IPO closes) has `money_kind:'promise'` and is never counted as cash moved. For `promise` kind with equity type, say "a contingent purchase, not cash moved".
* `nvda-cloud-commitments` ($102B) is Nvidia's own R&D cloud and data-center lease commitments: `loop_edge:false`, `sum_exclude:true`, to entity `cloud_dc_providers`. The real neocloud line is `nvda-neocloud-agreements` ($32B, promise, contingent on partner financing, actual 0-32).
* Facts (source-claims.json `facts`): `nvda-guarantee-total` = $118.0B at Oct 25 (Nvidia CFO commentary, a company statement, status verified, `attribution` field says so), `nvda-guarantee-total-jul` = $108.5B (10-Q), split `nvda-guar-land-power-shell` 3.5, `nvda-guar-sbenergy` 105.0, `nvda-guar-power-systems` 9.5 (the $9.5B has no further description in the source), `nvda-own-rd-commitments` $102B. Only $3.5B of the total is "land, power and shell for neoclouds"; the SB Energy line is "credit support on the land, power, and shell buildout".

### Param object
Plain `{ param_id: number }`. Missing ids take defaults; unknown ids or out-of-range numbers throw `RangeError` (use `validateParams` first for UI). Statuses and ids are listed in section 8.

## 2. Exports

```
VERSION, STATUS_ORDER
defaults() -> params
paramDefs() -> [{id, group, label, value, min, max, step, unit, status, scale?}]
presets() -> {name: {label, params}}      presetNames() -> ['coreweave_like','oracle_like','xai_spv_like']
applyPreset(name, overrides?) -> full params
validateParams(params) -> {ok, errors[]}  resolveParams(params) -> full params (throws RangeError)
effectiveStatus(id, value) -> status      weakestStatus([status]) -> status      plain(x)
runLoop(params, laps=1, opts?)            leverage(params, opts?)
claimsStack(params, yearT=0, opts?)       timeline(params, opts?)
stress(params, scenario)                  externalShare(params)
encodeState(params, ui?) -> string        decodeState(string) -> {ok, params, ui, errors}      snap(params)
```

## 3. `runLoop(params, laps = 1, opts = {})`

* `laps`: integer 1..200. `opts.attribution`: `'pro_rata'` (default) or `'seed_first'` (see below).
* Returns `{ model_version, toy_model_notice, params, laps, attribution, lap_traces[], hops[], claims[], cumulative, geometric, checks }`. `hops` and `claims` are aliases of `lap_traces[0]`.

### Hops (11 stops, numbered hop 0 to hop 10, so ten moves; `hops[i].hop === i`)
Wording (also in `data/meta.json -> hops.wording`): "11 stops, numbered hop 0 to hop 10: hop 0 is where the cash starts and hop 10 is where the loop closes, so the money makes ten moves." Never say "eleven hops" or "ten stops".

| hop | id | money_kind | what |
|---|---|---|---|
| 0 | `nvidia-cash` | none | Nvidia holds the seed cash |
| 1 | `equity-in` | recycled | Nvidia invests E=seed equity in a neocloud. **claim #1** (Nvidia) |
| 2 | `spv-debt` | external | Neocloud puts E into a GPU SPV; lenders add `D = E*L/(1-L)` at loan-to-cost L. **claim #2** senior lender. `B = E + D` |
| 3 | `servers-bought` | recycled+external | SPV buys servers; Nvidia books revenue `R = s_N*B`. Split below |
| 4 | `paper-value` | paper (hatched) | `GP = R*GM`, `NI = GP*q`, `paper = recurring_share*NI*multiple`. Not cash |
| 5 | `compute-contract` | promise | Neocloud signs contract `C = c*B` with a lab, pledged to lenders. **claim #3** lab compute right (face = prepayment) |
| 6 | `lab-pays` | external+recycled | Year-1 payment `P1 = C/years`: `P1*o` from end users, `P1*(1-o)` from raised capital, of which share `m` is vendor-sourced (recycled). Converts P1 from promise to cash. **claim #4** Nvidia stake in lab, **#5** lab's other investors and lenders |
| 7 | `backstop` | promise | Nvidia backstop cap `b*B`. **claim #6** (contingent) |
| 8 | `credit-fund` | none | The fund behind claim #2 is funded by LPs `D/(1+lam)` and bank `D*lam/(1+lam)`. **#7 bank, #8 LPs** (nested in #2, not new cash) |
| 9 | `marks` | paper | Neocloud stock/bonds held by investors, some on margin; Nvidia marks its stake: gain `E*(mark-1)`. **claim #9** |
| 10 | `loop-closes` | recycled | Next lap's seed `= reinvest_fraction * GP` |

Each hop object: `{hop, id, title, from, to, money_kind, description, amount: Tagged, values: {name: Tagged}, claims_added: ['c1'...], hatched, is_cash, is_promise, running: {...tallies}}`.
`running` = tallies **cumulative within the lap up to and including that hop** (use it to scrub/animate). Keys (all Tagged):
`seed_equity, debt_created, revenue_booked_total, revenue_external, revenue_recycled, revenue_counted_times, market_value_paper, cash_created, external_cash, external_end_user, external_capital, recycled_cash, cash_moved, external_share, recycled_share, promises_outstanding, claims_count, claimants_count`.

Definitions:
* `external_cash` = lender debt + lab payments from end users + outside lab investors. `external_end_user` + `external_capital` = `external_cash` (end users vs lenders/outside investors).
* `recycled_cash` = Nvidia equity + vendor-sourced lab capital. `cash_moved` = external + recycled. `external_share + recycled_share = 1` always. `cash_created` = `external_cash` (new money from outside the loop).
* `promises_outstanding` never enters cash. (+contract at hop 5, minus P1 at hop 6, +backstop cap at hop 7.)
* `revenue_counted_times` = `revenue_booked_total / seed_equity`: **booked revenue per $1 of seed cash** (each seed dollar shows up as this many dollars of Nvidia revenue; lender cash funds the excess). `cumulative.revenue_counted_times.definition` carries the plain wording. It is NOT the chapter 1 dinner-table figure (total sales per $1 of real outside money). `runLoop(...).bridge` gives both: `bridge.revenue_counted_times` and `bridge.revenue_per_outside_dollar` (revenue / external cash), each with `definition` and `label`, plus a `note`: always name the denominator.
* `runLoop(...).labels`: plain labels for the sticky header/drawer ("Outside money (lender debt + end-user payments + outside investors)"; `cash_created` is "Outside money entering ... mostly borrowed, not created"). `runLoop(...).attribution_note`: one sentence on the pro-rata vs seed-first choice (it flips the recycled/external revenue split).
* Revenue attribution: `pro_rata` (default): recycled = `R*E/B = R*(1-L)`, external = `R*L`. `seed_first`: Nvidia's own dollars come back first: recycled = `min(E, R)`. Both always sum to R.
* `claims_count` = numbered claims active so far; `claimants_count` = distinct parties holding them. Claims c4-c8 vanish (inactive) if their amount is 0 (for example `backstop_share_of_capacity = 0` removes c6; `credit_fund_back_leverage_ratio = 0` removes c7).

### Laps and convergence
Each lap, Nvidia reinvests a fraction of that lap's gross profit as the next lap's seed: `S_{n+1} = rho * GP_n = rho*GM*s_N*S_n/(1-L)`, so `S_{n+1} = r*S_n` with **`r = reinvest_fraction * nvidia_gross_margin * nvidia_share_of_build_cost / (1 - loan_to_cost)`**. All flows scale with the seed, so N-lap cumulative = lap-1 value x `(1-r^N)/(1-r)`. Converges only if `r < 1`.

`lap_traces[i]`: `{lap, seed, hops[], claims[], totals (= hop 10 running), values: {debt, build_cost, revenue, gross_profit, net_profit, paper_value, contract_value, year1_payment, backstop_cap, next_seed}}`.
`cumulative`: same keys as `running` summed over laps (ratios recomputed; claims counts not summed).
`geometric`: `{ratio, converges, laps, sum_factor_n_laps, sum_factor_limit (value null if r>=1), derivation (text for the drawer), limit: {key: Tagged|null}, closed_form_cumulative: {key: Tagged}}`.
`checks`: booleans, all `true` (build cost = E+D, revenue split adds up, shares add to 100%, external split adds up, promises not in cash).

### Default run (lap 1; `runLoop(defaults(), 1)`)
```json
{
 "cumulative": {
  "seed_equity": {"value":100,"status":"calculated"},
  "debt_created": {"value":166.67,"status":"calculated","formula_text":"Σ lender debt created"},
  "revenue_booked_total": {"value":160,"status":"hypothetical"},
  "revenue_recycled": {"value":60}, "revenue_external": {"value":100}, "revenue_counted_times": {"value":1.6},
  "market_value_paper": {"value":538.56,"status":"hypothetical"},
  "external_cash": {"value":233.47}, "external_end_user": {"value":44.53}, "external_capital": {"value":188.93},
  "recycled_cash": {"value":122.27}, "cash_moved": {"value":355.73},
  "external_share": {"value":0.6563,"status":"hypothetical"}, "recycled_share": {"value":0.3437},
  "promises_outstanding": {"value":396.27,"status":"hypothetical"},
  "claims_count": {"value":9}, "claimants_count": {"value":8}
 },
 "geometric": {"ratio": {"value":0.2154,"status":"hypothetical","formula_text":"r = ρ × GM × s_N / (1−L) = 0.18 × 0.748 × 0.6/(1−0.625) = 0.2154"},
               "sum_factor_limit": {"value":1.2746}}
}
```
(Values elided of `status`/`formula_text` for space; every value has them.) Hop 2 example: `{"hop":2,"id":"spv-debt","money_kind":"external","amount":{"value":166.67,"status":"calculated","formula_text":"D = E × L/(1−L) = 100 × 0.625/(1−0.625)"}, "values":{"spv_equity":..., "debt_created":..., "build_cost":..., "loan_to_cost_check":...}, "claims_added":["c2"], "running":{...}}`.

Claims (`claims[]`): `{id:'c1'..'c9', n, hop, label, holders:[party ids], kind, active, face_value: Tagged, depends_on_end_user_spending:true}`. Parties: `nvidia, senior_lender, lab, lab_investors, lab_investor_lenders, bank, lps, neocloud_holders`.

## 4. `leverage(params)`
Returns `{steps[], headline, params}`.
* `steps[]` (waterfall): `{id, label, kind, delta: Tagged, running_total: Tagged, hatched}` for ids `seed` (recycled_cash), `debt` (external_cash), `build_cost` (total_cash), `revenue` (cash_to_nvidia; has `split:{recycled, external}`), `gross_profit`, `net_profit`, `paper_value` (`hatched:true`).
* `headline`: `{seed, debt, build_cost, revenue, gross_profit, paper_value, leverage_multiplier (=B/E=1/(1-L)), debt_multiplier, revenue_multiplier, paper_multiplier, sentence}`.

**Default headline:** $100 seed -> **$166.67 debt** -> **$266.67 build cost** -> **$160.00 Nvidia revenue** (status `hypothetical`, since Nvidia's share of the bill is hypothetical) -> gross profit $119.68 -> **about $538.56 paper market value** (hypothetical, hatched). Multipliers: leverage 2.67x, debt 1.67x, revenue 1.60x, paper 5.39x. `sentence` is ready-to-print: "$100 of seed cash -> $166.7 of debt -> $160 of Nvidia revenue -> about $538.6 of paper market value (paper value is not cash)."

## 5. `claimsStack(params, yearT = 0, opts = {})`
`yearT` 0..50. `opts.amortize` (default false): senior face (and the bank slice) shrinks on an annuity schedule; otherwise **all face values are constant** (that is the point: claims stay, the asset shrinks).

Asset value is **hardware only**: book `B*max(0, 1 - T/life)` (straight line), economic `book*(1-decline)^T`. The lab's prepayment is a **promise / contract right, not cash**, here and in chapter 3 (it never enters an asset or cash tally). It is shown as slab `s4` (kind `promise_right`, dashed, `recoverable_from_asset:false`) and as `asset_components.prepayment_promise_unearned` (informational, not in `asset_value`). `asset_note` says so in words.

**Amortizing view (`opts.amortize:true`, default false).** Hypothetical level-payment (annuity) paydown of the senior loan and bank slice from the lab's rent, term `debt_term_years` (default 5 = contract length), rate base+spread. Equity, mezz, the lab contract right and lab investors do NOT amortize. `result.amortization` (always present) = `{applied, schedule, stress_case_note, annual_debt_service, year1_rent, rent_after_opex, rent_covers_debt_service_x, depends_on}` (all hypothetical). The constant-face view (amortize off) is the **"rent stops" stress case**, a worst case for lenders and not a forecast. Chapter 5 defaults to the paydown view and always draws both lines. Never say "the ratio has no ceiling"; say it "gets very large in this simplified version".

Slabs also have `ranked_against_asset` and `asset_rank` (1 = senior loan, bank slice also 1 as it sits inside it, 2 = equity; `null` for slabs not paid from this asset). Number only ranked slabs on the page; `seniority` 1-7 is just list order.

Returns `{year, amortized, asset_value, book_value, asset_components, slabs[7], ratios, claims[9], claims_count, claimants_count, recovery[], recovery_check, inner_waterfall_senior, params}`.

`slabs[]` (fixed order, `seniority` 1-7) each `{id, label, holder, example, face_value: Tagged, seniority, status, kind, layer, nested_in, recoverable_from_asset, claim_ids, formula_text}`:
1. `s1_senior_secured` Senior secured lenders (direct, cash_claim)
2. `s2_fund_back_leverage` Bank back-leverage to the credit fund (**nested** in s1)
3. `s3_mezz_converts` Mezzanine / converts at the parent (indirect; not paid from this asset)
4. `s4_contract_rights` Contract counterparty rights = lab prepayment refund (direct)
5. `s5_backstop` Backstop / guarantee holders (**contingent_promise**; paid by a third party, not from the asset)
6. `s6_equity` Equity, Nvidia + others (residual)
7. `s7_lab_investors` Lab investors (indirect; claim on the lab, not this cluster)

`ratios` (round 2: the headline counts only claims **ranked on this asset**):
* `claims_per_usd_asset` = ranked claims / asset = (s1 senior + s6 equity) / economic asset value. The nested bank slice (s2) is **not** counted (it adds claimants, not dollars) and neither are slabs with `ranked_against_asset:false` (s3 mezzanine at the parent, s4 lab contract right, s5 backstop, s7 lab investors); those stay visible on the picture, dashed and labelled. `claims_per_usd_asset_cash` is the same number (kept for compatibility).
* `claims_per_usd_asset_all_in` = every slab except nested s2 / asset (promises and parent/lab-level claims included). Always label it "all claims in the picture, including promises and claims on other entities".
* `claims_per_usd_debt` = all-in total (nested s2 excluded) / senior debt face. Label it the same way.
* `total_face_ranked` (s1+s6), `total_face_all` (all except nested s2; also the stack height scale), `total_face_cash` (= ranked).
* `labels.headline | all_in | debt | counted`: ready-to-print strings saying what is counted. `labels.counted` names what is in and out.
* `no_paydown_caveat`: non-empty string when `opts.amortize` is false: "Worst case: rent stops and no debt is repaid ... Real loans are repaid from rent...". **Chapter 4 must print it next to the no-paydown year-3 figure** (or call `claimsStack(P, 3, {amortize:true})` for the paydown figure).
* `note`: "ordinary capital structure, correlation is the point". Division by a zero asset gives `value: null`.

`recovery[]`: `{slab_id, face_value, recovered, recovery_pct, shortfall, note}` (Tagged; `null` for slabs not paid from the asset). Waterfall pays s1 (bank first, then LPs, see `inner_waterfall_senior`), then s6 gets the residual (s4 is a promise: `recovered` null); `recovery_check = {asset_value, total_recovered, conserved:true, equity_gets_residual}`.

**Default, T=0:** asset $266.67 (hardware only); **claims ranked on this asset per $1 of asset: 1.00** (senior $166.67 + equity $100 = $266.67, bought with exactly that money); **all-in** (every slab except the nested bank slice: $490.27, includes promises and parent/lab claims) **1.84**; per $1 of senior debt (all-in basis) 2.94; all seven slabs including the nested bank slice would be $545.83 (2.05 per $1 asset: the old, double-counting headline, no longer used); 9 claims, 8 claimants. At T=3 with constant faces (rent stops): asset $77.8, ranked ratio 3.43, all-in 6.30; equity recovers 0. With paydown (`amortize:true`) the senior balance falls and the ranked ratio is 2.24 (all-in 5.12). The old 7.02 and 5.44 year-3 figures are gone.

`timeline(params, {step=0.5, maxYear=ceil(life), amortize})` -> rows `{year, asset_value, book_value, total_claims (= ranked claims), total_claims_all_in, claims_per_usd_asset (ranked), senior_face, senior_ltv, equity_recovery}` for charts.

## 6. `stress(params, scenario)`  (toy; labelled)
`scenario` (all optional): `external_revenue_shortfall_pct` 0-100, `gpu_rental_price_drop_pct` 0-100, `lab_missed_payment` (boolean: lab pays nothing this year), `rate_shock_bps` 0-1000 (applies to the floating share only), `nvidia_stock_drop_pct` 0-100 (shrinks vendor-sourced lab capital and next-lap reinvestment), `year` 0-20 (collateral date, default 1). Invalid values throw `RangeError`.

One year of one cluster per $100 seed. Returns:
* `scheduled`: lab payment, opex, base and stressed debt service, scheduled equity distribution, effective rate.
* `sources_of_cash`: lab payments by source, `backstop_payment_from_nvidia`, `total_cash_in`.
* `waterfall[]`: items `opex`, `senior_bank` (c7), `senior_lps` (c8/c2), `equity` (c1/c9), each `{id, label, claim_ids, scheduled, paid, haircut, paid_pct, state: 'paid'|'partial'|'unpaid'}`. Paid in that order. For every non-equity item `scheduled = paid + haircut`; equity is residual and can exceed schedule.
* `conservation`: `{cash_in, total_paid_out, balanced}` (always balanced).
* `senior_summary` (scheduled/paid/shortfall/dscr_actual), `collateral` (`gpu_value`, `senior_ltv`, `senior_recovery_if_foreclosed`).
* `triggered_promises[]`: `nvidia_backstop` (`triggered`, `exists`, `amount_called`, `cap`, `trigger` text), `lab_contract` (`state`), `receivables_pledge`. Backstop is called when the lab shortfall is at least `backstop_trigger_shortfall` of the scheduled payment, or on a missed payment, up to the cap; it never triggers if the cap is 0.
* `loop_back_to_nvidia`: `backstop_cash_paid`, `equity_markdown_neocloud` (paper, flows to Nvidia GAAP earnings), `lab_stake_markdown`, `next_lap_revenue_lost_to_financing`, `..._to_stock_drop`, `next_lap_revenue_lost_total`, `..._pct_of_lap1_revenue`. Three different kinds of effect; do not sum them.
All Tagged, all `hypothetical`.

Example default with `{external_revenue_shortfall_pct: 40, rate_shock_bps: 200}`: backstop called ~$17.8 of its $40 cap; senior debt service fully paid; equity paid 93% of schedule (waterfall item `equity`: scheduled 16.29, paid 15.18, haircut 1.10).

## 7. `externalShare(params)`
Epilogue headline. `headline.external_share` and `headline.end_user_share` each `{low, base, high, joint_low, joint_high}` (Tagged, `hypothetical`; `end_user_share` also has a `note` string: a TOY-MODEL RESULT label with the 50% setting, the "cautious setting, reported 2025 figure nearer 62%" gloss (only at the default), and the range). Top-level `end_user_sentence` is ready-to-print. **State the 12.5% (default) as a toy-model result with its range (about 2.5% to 31%), never as "right now" or a fact about Nvidia; Chapter 10 should put it in a box titled "Our toy model, not a measurement of Nvidia".**: `low/high` = min/max over one-at-a-time sweeps of every parameter across its full range; `joint_*` = every parameter at the bound that lowers/raises the share. Also `headline.recycled_share.base`, `headline.sentence`, and `tornado[]` sorted by swing (`{param, label, external_share_at_min/max, end_user_share_at_min/max, swing}`).

**Default:** external share **65.6%** of the cash that moves in one lap (range 41%-79% one-at-a-time; 29%-95% joint); recycled 34.4%; **only 12.5% is paid by end users** (range 2.5%-31%). Sentence: "Of every $1 that moves through one lap of the loop, about 66 cents is external cash (range 41-79) and 34 cents is recycled; only about 13 cents is paid by end users. Promises are not counted as cash." External share does not depend on lap count.

## 8. URL state
`encodeState(params, ui?) -> string` e.g. defaults -> `"1"`; xAI preset with `{laps:3, year:2, preset:'xai_spv_like'}` -> `1~8:u~b:4~c:8~f:0~h:0~i:0~o:1w~L:3~T:4~P:2`. Format: version `1`, then `~`-separated tokens `<paramIndexBase36>:<stepIndexBase36>` for params that differ from default; `L:<laps>`, `T:<year*2>`, `P:<presetIndex>`. Values snap to the parameter step grid (round-trip exact for on-grid values; `snap(params)` previews the snapped state). `ui` = `{laps (1..200), year (multiples of 0.5, 0..50), preset (name)}`. Throws `RangeError` for out-of-range input.
`decodeState(str)` (leading `#` ok) -> `{ok:true, params (full), ui, errors:[]}` or `{ok:false, params:null, ui:null, errors:[...]}` for bad version, malformed/duplicate/unknown tokens or out-of-range values. Never throws.

## 9. Parameters (id: default, range, status)
Authoritative: `data/loop-defaults.json` (labels, units, source ids, rationale).

`seed_usd` 100 (scale, calculated); `loan_to_cost` 0.625 [0.3-0.8] reported (IREN 63%, xAI SPV 62.5%); `nvidia_share_of_build_cost` 0.60 [0.3-0.85] hypothetical; `nvidia_gross_margin` 0.748 [0.5-0.85] **verified** (Q3 FY27 GAAP; Q4 guide 71-72% is kept as an alternative value); `gross_to_net_conversion` 0.75 calculated; `recurring_revenue_share` 0.5 hypothetical; `valuation_multiple` 12x P/E hypothetical (research has price but no share count, so no market multiple is claimed); `reinvest_fraction` 0.18 calculated (Q3 equity purchases $15.7B / gross profit $86.6B); `contract_value_to_build_cost` 1.67 calculated (IREN $9.7B/$5.81B); `contract_years` 5 reported; `contract_prepayment_share` 0.20 reported (IREN); `lab_outside_revenue_share` 0.5 hypothetical; `lab_funding_mix` 0.5 hypothetical (recycled share of lab capital; bracketed 52-66% by calculation on the OpenAI round); `nvidia_share_of_vendor_funding` 0.375 calculated; `neocloud_opex_share` 0.35 hypothetical; `backstop_share_of_capacity` 0.15 hypothetical (CoreWeave analogue 17%); `backstop_trigger_shortfall` 0.20 hypothetical; `credit_fund_back_leverage_ratio` 0.5 hypothetical; `mezz_ratio` 0.5 hypothetical; `margin_loan_share` 0.20 hypothetical; `neocloud_equity_mark` 1.0 hypothetical (CoreWeave about 0.5: $44.91 vs $87.20); `gpu_useful_life_years` 5 [3-6] reported (presets 3/4/5/6 in the JSON `presets` array); `gpu_rental_decline_per_year` 0.10 hypothetical; `base_rate` 3.875% reported; `credit_spread` 4.0% reported (7.9% all-in = CoreWeave reported average); `debt_term_years` 5 hypothetical; `floating_share` 0.5 hypothetical.

Presets (`applyPreset`): `coreweave_like`, `oracle_like`, `xai_spv_like`. Overrides and a per-override rationale and status are in `loop-defaults.json -> presets[].overrides`. Preset values are analogues, not those companies' actual parameters.

## 10. Data file schemas
* **deals.json** `deals[]`: `{id, from, to, type (equity|debt|compute_contract|chip_purchase|backstop|warrant|lease|revenue_share|guarantee|loi), money_kind (external|recycled|promise), headline_usd_b, actual_usd_b_low, actual_usd_b_high, date, structure, status, what_changed_since_announcement, source_ids[], reader_note (1-2 plain sentences, THE text readers see), internal_notes (builder-only; stripped from the bundle), amount_split, parties[], loop_edge, sum_exclude, merged_from[], status_adjusted_from?}`. Equity/debt are never `promise`; every other type is always `promise`. Show **headline vs actual** side by side (for example the Nvidia-OpenAI LOI: headline $100B, actual $0; replaced by $30B equity). `null` = no support in research. Arrow direction: payer to payee; grantor to beneficiary for backstops/guarantees/warrants. `totals` keys: `external_cash`, `recycled_cash`, `promises` (kept apart), `cash_total` (= external + recycled only), `excluded_from_sums` (aggregates such as the $122B round, and non-loop edges such as Intel). `sources[]`: `{id, title (derived from URL), title_is_derived, publisher, url, type: primary|press, date}`. `cash_total` (loop edges, non-aggregate) headline $270.9B, actual $170.0B-$237.2B vs promise headline $1,313.4B, but these mix dates and scopes: use as scale only.
* **entities.json** `nodes[]`: `{id, name, layer (supply|neocloud|hyperscaler|lab|capital), ticker, snapshot:{marketcap_usd_b, debt_usd_b, valuation_usd_b, as_of, status, field_status, source_urls, source_ids, note}, links:{site_path}, extra_node, facts[] (ids into source-claims facts), no_verified_deals}`. Market caps are all `null`: the research gives no share counts. Snapshot numbers exist only for Nvidia debt ($32.4B verified), CoreWeave debt ($46.9B verified), Oracle debt ($125B reported), Meta debt ($80.92B verified), OpenAI valuation ($852B post-money, verified).
* **events.json** `events[]`: `{id, date, title, detail, why_it_matters, status, source_ids[]}` (20 events: includes `ev-congress-huang-hearings` Dec 3 tentative / Dec 1 House, and `ev-anthropic-ipo-priced` Nov 18).
* **history.json**: `lucent_facts[]`, `derived[]` (Lucent commitments 28.0% of restated FY2000 revenue, `calculated`; 24% on original basis is `unverified`), `caveats[]` (includes the **revenue-basis caveat**: name one basis, default restated), `bull_arguments[]`, `bear_arguments[]`, `open_questions[]`.
* **source-claims.json**: `facts`, `deals`, `events`, `params`, `entity_snapshots` -> `{status, source_ids, quote_anchor: null}` skeleton.


## 11. Reader text vs internal text (round 2)
* **Never render `notes`** (the field no longer exists). Deal cards print `reader_note`, `structure` and `what_changed_since_announcement`. Params carry `reader_note` (also copied into `rationale`): "We chose X because ...; no source gives a number".
* `internal_notes`, `merge_log`, `status_adjusted_from`, `status_adjustment_reason`, `research_file`, `merged_from` stay in `data/*.json` for audit but `tools/bundle.py` strips them from the embedded JSON. `tools/build_data.py` fails if banned process phrases ("not re-fetched", "from memory", "Merge note", "search summary", "the research"...) reach a reader-facing field (list in `tools/reader_text.py`).
* `sources[].title` is a neutral display title. When the page-derived headline was loaded (enron, bubble, "lost its ceo", slugs and IDs) the original is kept as `original_title` with `original_title_attribution`; show it only as an attributed tooltip.
* Facts carry optional `comparable_across_periods` / `comparability_caveat` in `source-claims.json -> facts`. `crwv-customer-a` has `comparable_across_periods:false`, `prior_period_value:67` and the 10-Q Note 2 warning that customer letters A-D may refer to different customers each period: **ch06 must show 24% (Q3 2026) and 67% (Q3 2025) with that caveat, not as one customer falling.** `crwv-share-price` is now $44.91 on Nov 19, 2026.
* Oracle CDS is "about 295 to 305 bp in mid-November (CNBC: above 300 bp)", dated; CoreWeave's CDS peak is "about 1,280 bp" (1,289 per CNBC/Deutsche Bank, 1,278 elsewhere).
