# Round-1 fixes, fixer B (chapters 03, 04, 06, 09, 10)

| Item | Action |
|---|---|
| Finance #1 (ch06 CoreWeave customers) | Bull line now shows Customer A and Customer B together (both read from `crwv-customer-a/b`, sum computed), "broadening" removed. Added a neutral bear line on concentration. |
| Finance #2 (ch06 guarantee) | Removed the typed stale fallback (108.5). Row reads value, period, tag, source and label from `ctx.data` (`nvda-guarantee-total`, else `guarantees-total`); relabelled "maximum guarantee exposure", "ceiling, not a payment", shows the source's own description. |
| Fairness B2 (ch09 market block) | Renamed "What the market is saying right now, both ways". Two equal columns of 6 cards: stress (Oracle rating and CDS, CoreWeave CDS, Fed hike, Fed minutes, neocloud equities) and strength (Nvidia Q3, CoreWeave backlog and guidance, senior-loan spread ladder from `coreweave-ddtl-4`, hyperscaler capex, undrawn guarantee, no confirmed defaults). Loaded text ("Distress-level pricing", "spikes") replaced; unconfirmed bank-debt item dropped with a visible note. |
| Fairness B3 (ch04 bear panel) | "Right now just X%" replaced by "In this toy model, about X% (range a to b)", tagged hypothetical, from `M.externalShare` `end_user_share`, with a note that it depends on a cautious knob and is not a measurement. |
| Fairness B3 (ch10) | Toy percentages moved out of the Now column into a separate dashed box "Our toy model, not a measurement of Nvidia"; Now cell says no real mix is available. |
| Fairness S1 (ch10 Huang) | Removed editor note and the data open-items list. Added neutral box built from event `ev-huang-resigns`: 8-K, interim CEO, no reason given, we don't speculate. Added matching open question. |
| Fairness minor | Removed "quiet part" and the research note text; ch09 bear S3 causal claim softened; source links whose headline contains Enron/bubble/gymnastics show outlet and date, headline in tooltip. Ch07 "more polite name" belongs to C. |
| Education BLOCKING (ch03) | Tally and lap totals use "Revenue booked per $1 of seed cash"; hop 3 text and a lap-section bridge sentence tie it to the dinner table ("same idea: sales on the books vs real money that entered"). Definition matches API.md `revenue_counted_times`. |
| Education: external cash (ch03) | Split into "Outside money: end customers" and "Outside money: lenders and investors (must be repaid or earn a return)" in step tallies, lap totals and math table. |
| Education: jargon | Defined at first use: neocloud (ch03, 04, 06, 09), SPV, first-loss slice, loan-to-cost, LPs, back-leverage (ch03, 04), haircut, CDS, bp (ch09), P/E and SOFR glossed. |
| Education ch04 | "More knobs" is a collapsed "Show advanced settings"; visible labels use plain words (exact model term in hover); `alt_values` and other snake_case names scrubbed from "?" text. |
| Education ch10 | Research open-items block and research note removed; the bull/bear argument list is kept once here. |
| Browser: ch10 overflow | `.num` now wraps, grid columns use `minmax(0,1fr)`. scrollWidth equals viewport at 1440, 1280, 1024, 860, 820, 390. |
| Browser: `#c3-lapnums` | Now `role="group"` with a label, no list roles. |
| Browser: ch03 Play | Visible hint appears under reduced motion. |
| Browser: small SVG text | ch03 lap chart sizes to its container (12px axis text); ch04 waterfall and ch09 diagram fonts raised; remaining minimum about 9.3px at 390. |

## Handoffs
- Epilogue (ch11, C) still shows the bull/bear block, the raw `history.open_questions` list (includes the Huang note, 403, Bloomberg/ICE lines) and the old "External cash" legend in `runtime.js`; those need dedup and cleanup by their owner, or A can clean `history.json` `open_questions`.
- Ch06 row "Cloud service agreements + leases not yet started" reads label from deal `nvda-cloud-commitments`; it follows A's reclassification only if the label is changed in data.
