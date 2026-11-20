# Episode 11 "The Loop": progress (paused 2026-11-20)

Status: built, round 1 fixed, round 2 critics mostly done, **round 2 fixes not started**. Nothing committed or pushed; not yet in episodes.json.

## Done
- Research (4 files in data/research/), data + model (38 tests pass), 11 chapters, single-file bundle (`python3 tools/bundle.py` -> index.html, dist/circular-finance.html).
- Round 1 critics (audits/round1/) and fixes (fixes-round1-A/B/C.md).
- Round 2: finance (5 blocking), fairness (3 blocking), blind reader (7.5/8, 0 blocking, lead-graded), freshness (0 blocking, 4 updates). **Browser critic round 2 was stopped before it reported** (re-run it).

## Round 2 fix list
Finance (financial-audit.md): ch05 claims-per-$1 double counts bank slab nested in senior loan and includes slabs "not ranked against this asset" (also fairness N3; ch04 repeats 7.02); openai-round-nov2026 counted as external cash though not closed; microsoft-openai-equity $13B tagged verified but source doesn't state it; ch06 implies CoreWeave Customer A 67%->24% (letters may change each period); ch07 Amazon-OpenAI "$50B moved" includes $35B conditional.
Fairness (fairness-audit.md): ch02 deal cards print raw builder notes from deals.json (19 of 58; also knob tooltips "not in the research"); ch10 bear item "a leadership shock" (history.json ~line 572) contradicts no-link rule; minors M1-M7.
Blind reader: counts (57 vs 58 deal lines; "eleven stops" vs hops 0-10), define SOFR / mezzanine / reflexive, remove "not re-fetched in this pass" notes.
Freshness (freshness-check.md): keep Huang line to the 8-K facts; add Senate Banking hearing tentatively Dec 3; verify Anthropic IPO (priced Nov 18?) vs the contingent Nvidia placement wording; CoreWeave CDS peak 1,278 vs 1,289; Oracle "above 300 bp".

## Remaining plan
1. Fix pass for the list above (data/model first, then chapters), rebuild, run `node --test tests/*.test.js` and `python3 tools/build_data.py`.
2. Round 3 critics (all five); need two consecutive clean rounds (cap 4 rounds; log leftovers).
3. Deliverables not yet written: source-map.md, progress.html dashboard, claude/part-11-circular-finance.md, README section, thumbnail assets/thumbs/circular-finance.jpg, episodes.json entry (num "11", short "The Loop", slug circular-finance, dir 11-circular-finance), optional scripts/refresh/circular_finance.py.
4. Integrate into site (copy dist single file to pages/11-circular-finance/index.html is already the layout; run scripts/build.py), push, verify live, publish artifact preview.
