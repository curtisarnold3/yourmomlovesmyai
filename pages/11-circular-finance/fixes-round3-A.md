# Round 3 fixes, fixer A (item -> action)

Finance
- #1 OpenAI Nov round: verified by search (Bloomberg Nov 6, ~$11B first portion wired at $1.25T, round up to ~$20B, OpenAI no comment). `openai-round-nov2026` is now the closed first portion (external cash, status reported, $11B, SoftBank/MGX parties, no vendor money reported); new `openai-round-nov2026-remainder` is a contingent promise ($0 to ~$9B). reader_note and structure rewritten; "no close reported" removed. Deal count 60 -> 61 (meta is data-driven).
- #2 ch06 Anthropic gauge: two views, "named contracts" ($80B) and "including the reported SpaceX AI ceiling" (read from data, $200.5B), each on both revenue bases; note says the ceiling is cancellable on 90 days' notice after early 2027. xAI card points to the SpaceX figure; OpenAI card notes unpriced chip deals.
- #3 `nv-invest-assets` now computed in build_data from the two verified lines, tagged calculated, formula shown. Also lu-concentration (23%) calculated; new calculated facts lu-rev-chg-fy01/fy02 (-26.3, -42.1) used by ch10; `nv-guar` verified citing Nvidia CFO commentary.
- #4 anthropic-ipo-placement now comes from new helper node `placement_buyers` (Google, Nvidia, AMD, Broadcom, Micron, Microsoft, TSMC); text states Nvidia's $10B is the same money as the separate Nvidia line. B: ch07 AGG list may want `placement_buyers` (the deal is sum_exclude so currently skipped anyway).
- Minor: Oracle CDS event retitled "near 300 bp" (Nov 6), 288 bp "record" claim demoted; Nscale relabelled "total contract value" (Anthropic part depends on financing); Synopsys/Nokia headline now announced $3B with 13F $2.7B as low end and reader note; mixed-row summary text label is in ch02 (B's file, not touched).

Fairness
- Ch10 Huang box deleted; "why did the CEO resign" and "timing rhyme" questions deleted. Resignation and Senate/House inquiry now appear only as a neutral "Nvidia news in this period" list in ch09 (events reworded, "keeps scrutiny" dropped). Epilogue "Who leads Nvidia" is in ch11 (B).
- Bull/bear lists equal (6/6): added sourced bull item (Microsoft OCF vs capex, Meta capex outlook, read from facts). "pre-resignation" wording removed.
- ch06: Customer A sentence and "Source describes it as" leak cleaned; ch09 retitled "What if payments slow down?" (nav updates from the h2); "ghosts" -> "dashed bars/outlines"; "Nvidia's CEO" removed from CoreWeave reader_note.

Education (ch05)
- Ratio labels rewritten in plain English; toggle buttons renamed; >100 to 1 cap display with explanation replaces "very large number"; double-pledging defined in the callout; "How to read the picture" text plus a live default-state sentence above the slabs; builder note about nine vs seven claims cut. Model label strings updated.

Checks: build_data OK, 44/44 node tests, bundle built, headless Chrome (ch05/06/09/10) no console errors.
