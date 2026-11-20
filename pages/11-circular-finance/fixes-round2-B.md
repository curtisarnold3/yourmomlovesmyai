# Round 2 fixes, fixer B (ch03, 04, 06, 09, 10)

| Item | Action |
|---|---|
| Finance #4, ch06 Customer A 67% to 24% | Bull line now reads: "In CoreWeave's 10-Q, Customer A was 24% in Q3 2026 and 67% in Q3 2025. We can't say that is one customer shrinking" plus the caveat that letters may mean different customers. 24 and 30 come from facts; 67 is parsed from the fact label. The caveat text uses an A fact whose id starts crwv-customer and mentions letter/caveat/differ if one exists, else a built-in sentence. |
| Finance/Fairness N3, ch04 7.02 | ch04 now says "ranked claims per $1 of GPU asset (senior debt plus equity, counting the bank layer once)", reads `claims_per_usd_asset_ranked` or else `claims_per_usd_asset`, and appends A's `no_paydown_caveat` (found by key search; fallback sentence if absent). Verified: year-3 figure shows 3.43 with the caveat. |
| Fairness N2, ch10 "leadership shock" | Chapter now strips that phrase from bear arguments at render, as a safeguard until A's data change. No other leadership-shock wording in ch10. |
| Fairness M6, ch10 "rental prices firm" | Replaced with H100 rental prices up since Dec 2025 but far below 2023 (no digits typed; points to the ch04 note). |
| Fairness M1, ch09 strength list | Columns now "Signs of financial stress" and "Signs of continued demand and financing". The $105B guarantee and the negative-FCF item moved into a neutral third block "Commitments and cash flows to watch (two readings each)" with neutral titles and both framings. The strength column keeps hyperscaler capex held or raised, capex-only. |
| Fairness M5, ch03 hop 7 | Added the bull counter-note: that alignment is what lets lenders price the loan tighter. |
| Fairness M7, ch09 opening | New "What this tool does" paragraph (neutral), opening preset relabelled "Mild slowdown (our starting scenario)", says it is not a base case, points to Reset. |
| Senate Banking Dec 3 context | ch10 Huang box now appends any event whose id or title contains "hearing" or "senate" (neutral, from data). Not shown yet: no such event in events.json at time of build (A to add). ch09 does not show Huang. |
| ch04 knob tooltips "not in the research" | New `readerWhy`: uses `reader_note` if A adds it; else drops sentences naming "research", swaps a leading "Hypothetical." for "We chose this because it is a middle setting; no source gives a number." Rendered page has zero "research" strings in ch03/04/06/09/10. |
| Edu: eleven stops vs hops 0-10 | ch03 hook says "eleven stops, numbered 0 to 10"; list aria-label matches. |
| Edu: SOFR, converts, reflexive | Defined in plain English at first use in ch03 (converts, reflexive), ch04 knob notes (SOFR, appended once per note), ch09 (SOFR already defined). ch05 is A's: tell A it needs mezzanine, SOFR and reflexive definitions. ch04 labels already use "company bonds and convertibles". |
| Builder text "not re-fetched in this pass" | Not present in my chapters; ch04 filters "not re-verified" parentheticals from rationales. ch02 deal notes belong to C. |
| Finance minor #9 (ch10) | Winstar/One.Tel wording softened to "April 2001"/"2001, named in Lucent's later filings". |
| Overflow check | Playwright, system Chrome, at 1440, 1280, 1024, 860, 390: no horizontal overflow on page, ch09 or ch10; no console errors. Node tests pass. Rebuilt with tools/bundle.py. |

Not done / for others: ch04 base-rate default label ("4%" vs 3.875%) is data (A); Oracle ">300 bp" and CoreWeave CDS 1,278 vs 1,289 are data/event items; ch09 CDS cards keep dates shown from data; source-title labels (M2, M4) are shell/sources (C/A).
