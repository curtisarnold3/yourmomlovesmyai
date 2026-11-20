# Fixes, round 5 (item -> action)

Note: financial-audit.md round 5 was not on disk (only audits/round1-4); BLOCKING items were taken from the brief.

- BLOCKING 1 (ch02 false "Includes" lines): `src/chapters/02.js` detailEl now prints "Placement participants" and the participant list only when the deal has `placement: true`, and prints "Includes" lines only from an explicit `includes` id list. build_data.py emits `placement` and `includes` (only `anthropic-ipo-placement`, includes `nvda-anthropic-equity`). Verified in Chrome by opening all 61 deal rows (both lists, 122 panels): only the placement panel has Participants/Includes; no other panel prints either.
- BLOCKING 2 (nvda-cloud-commitments $102B): status now calculated, formula "$28B + $74B", components keep verified tag and the Nvidia CFO commentary source.
- BLOCKING 3 (coreweave-ddtl-5-5-and-converts $6.8B): status calculated, components $2.6B (verified) and about $4.2B (reported), both cited to the CoreWeave Q3 release.
- Scan of other verified amounts: none of the remaining 9 verified deals is a sum (openai-aws-compute was already calculated). New test asserts the three calculated deals, their component sums, and that no verified deal has components.
- ch05 "asset value is zero: undefined" -> "not shown because the asset is worth zero"; literal "n/a" in the ratio readouts -> "not defined".
- Epilogue unknowns: "Who leads Nvidia" item removed (leadership news stays in ch09 dated events).
- ch09 hearing card: both copies now start "This inquiry is about export controls, not about circular financing."
- "trick" (ch01, ch02, ch08) -> "idea" / "task" / "scheme"; "dominoes" (ch09) -> neutral chain with the floor framing.
- ch06 "softer than the headline" -> "depends on the contract terms"; "get renegotiated, as the reported cut suggests" -> "could be renegotiated, as one reported cut shows".
- ch07 "is called a partnership" -> "is described as a partnership".
- Plain-English definitions: hyperscaler (ch02 intro, ch08), CLEC (ch10, both uses), GAAP (loop-model text, events text).
- Vague source labels (Benzinga, Yahoo Finance, Crypto Briefing, Cycle Desk, Vantage Markets) now name the reporter and subject via reader_text.py OTHER_MAP.
- Left alone as instructed: dense layout, titles, 6-vs-5 items.
- Checks: build_data OK, node tests 45/45 pass, bundle built, axe_final prints [] for all four widths.
