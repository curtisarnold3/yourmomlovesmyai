# Round-1 fixes, fixer A (model, data build, API, chapter 5)

Finance
- #2 Guarantees: `nvda-guarantee-total` is now $118.0B at Oct 25 (Nvidia's own Q3 CFO commentary, read at the hosted copy; tagged verified with an `attribution` "company statement"; that URL is registered as a primary company-statement source). Split into $3.5B land/power/shell for neoclouds, $105.0B SB Energy credit support, $9.5B power and systems credit support (no further description in the source); $108.5B at Jul 26 kept as its own fact. "Land, power and shell" is no longer used for the total. "Unconfirmed / Substack" removed from events.json (`ev-nvda-105b-guarantee`), history open questions and the deal merge note.
- #3 `nvda-cloud-commitments` ($102B = $28B cloud service + $74B leases, Nvidia's own R&D): `loop_edge:false`, `sum_exclude:true`, new entity `cloud_dc_providers`, excluded from loop totals. New promise edge `nvda-neocloud-agreements` ($32B, actual 0-32, takes effect only after partner financing, deployment and acceptance).
- #4 `nvda-anthropic-equity` and `anthropic-ipo-placement`: `money_kind:promise` + `contingent:true`, actual 0-10, not in cash tallies; "became the 2025 commitment" removed, a $20B total is flagged as not excludable.
- #5 `openai-round-mar2026`: new kind `mixed` with `money_split` (vendor $80B recycled, other $42B external).
- #6 New kind `outside_loop_investment` for `nvda-intel`, `nvda-synopsys-nokia` (never external cash). Note for fixer C appended to src/API.md ("money_kind values"): chapter 2 node panel must be data-driven and handle all five kinds (KINDS lookups need a fallback or new entries, or ch02/07 will break on `mixed` / `outside_loop_investment`).
- #7 Prepayment: one treatment, a promise/contract right, not cash, in ch3 and ch5. Removed from asset value; slab s4 is `promise_right`, dashed, not in the waterfall or cash ratio. Headline claims per $1 of asset 1.53 -> 2.05 (cash-only ratio 1.00, by construction); flows through data/model only.
- Minor: Lucent original FY2000 revenue is $33.813B (10-K405), the 24% is now calculated on it; Lucent FY2000 loans/guarantees/customer shares upgraded to verified (10-K405). SpaceX $32B at 8.26% tagged unverified and removed from the credit-spread rationale and xAI preset (now hypothetical). xAI equity range 2-10. Nebius upgraded to verified (Nvidia release). Vantage loans range 14.75-38. Anthropic-Google 3.5 GW detail moved out of the verified text. IREN 5.96% flagged. CoreWeave total debt retagged calculated. about.fb.com added as a primary domain.

Fairness
- B1 `claimsStack(..., {amortize:true})` documented as a hypothetical annuity paydown from rent; `result.amortization` added (debt service, rent, coverage); constant-face view documented as the "rent stops" stress case. Chapter 5 gets a "Show debt paydown from rent" toggle (default on), draws both claim lines, and the "no ceiling" wording is replaced.
- B3 `externalShare().headline.end_user_share.note` (toy-model label, 50% setting, 62% gloss, range) and `end_user_sentence`; documented in API.md for fixers B and C.
- Bridge: `runLoop().bridge`, `cumulative.revenue_counted_times.definition`, `labels`, `attribution_note` (also addresses finance #18, #19 at the model level; chapters must adopt the wording).
- S1/S5 data side: Huang event rewritten to 8-K facts only (press detail in `reported_detail`), editor-note sentence removed, `huang_note` in history.json, open questions rewritten in reader voice (IMF/403/Bloomberg items dropped).

Browser (ch05)
- Tag badges moved out of list buttons (siblings in a wrapper); slab SVG is `role=group` not `img`. Slab numbers now show asset rank only (finance #20). "alt_values" removed from the visible rationale; kind/layer labels made plain.

Tests: 38 pass (10 new). Rebuilt data, ran bundle.py.
