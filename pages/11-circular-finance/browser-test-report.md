# Browser/QA report, round 4

Page: `pages/11-circular-finance/index.html` (file://, system Chrome via Playwright). Harness: `tests/browser_test.py` (shots in `/private/tmp/claude-501/gauntlet/shots4/`, log `/private/tmp/claude-501/gauntlet/run4.log`). Harness fix this round: the ch02 company-cards toggle step is skipped on mobile, where the list is the only view and the toggle is hidden by design.

## Per-viewport results

| Viewport | Console/page errors | Overflow | Interactions (all chapters) | Popovers | Keyboard Tab | axe critical/serious |
|---|---|---|---|---|---|---|
| 1440x900 | none | none | all pass | hover/focus/click ok | n/a | 0 critical, 1 serious (label-content-name-mismatch x3) |
| 1280x800 | none | none | all pass | ok | no trap; focus-visible issue below | 0 / 1 serious |
| 820x1180 | none | none | all pass (tallies toggle correctly hidden) | ok | n/a | 0 / 1 serious |
| 390x844 | none | none | all pass incl. bottom sheet, share-hash round trip | tap ok | no trap, 598 stops, 0 without ring | 0 / 1 serious |
| 1280x800 reduced-motion | none | none | all pass | ok | n/a | 0 / 1 serious |
| Width sweep (320-1600, 40+ widths, collapses open) | n/a | none | n/a | n/a | n/a | n/a |

Other checks:
- Share-hash round trip passes. A copy of index.html in another directory opens with no errors and 7 slabs.
- `dist/circular-finance.html` is identical to `index.html` (cmp).
- Lighthouse accessibility via http://127.0.0.1 is 100 (>= 90). Its only failing audit is `label-content-name-mismatch`, on the same 3 slabs.
- Screenshots reviewed: ch04 (waterfall labels no longer clipped) and ch05 at 1280 and 390. No clipped or overlapping labels found.
- The mobile ch02 default shows the list. The map is not reachable on phones (design choice, MINOR note).

## Bugs

1. **BLOCKING** (serious axe violation, every viewport): `label-content-name-mismatch` on `#ch05 g.slab` for s1_senior_secured, s2_fund_back_leverage and s6_equity. These are the slabs with a rank digit. Their visible text is the child `<title>` ("Senior secured lenders ($167)") plus the digit ("1"/"2"). The aria-label does not contain it contiguously: "Senior secured lenders. Place 1 in line..., face value $167". The round-3 blocker was only half fixed, because the label now starts with the visible label but not the full visible string. Fix: put aria-hidden on the slab `<title>` and the rank `<text>`, or make the aria-label begin with the exact visible string, e.g. "Senior secured lenders ($167)1". Source: index.html around lines 4782-4795 (ch05).
2. **MINOR** (keyboard, ch03, 1280x800): the sticky `.c3-stage` is about 735px tall below a 157px sticky global tallies strip. The in-stage tallies' tag badges (`#c3-tallies .tag`) take focus at y of about 807-932px, below the 800px viewport, and the browser cannot scroll them into view. Repro: Tab through ch03 at 1280x800. Also seen once in ch05 (`ch05-val` tag at y 814). Suggest a shorter global strip or stage on short viewports, or `scroll-margin`/non-sticky stage below about 900px height.
3. **MINOR**: on a phone, the ch02 map is unreachable (the toggle is hidden and only the list shows).

Round-3 blockers fixed: tag glyph in CSS, ch04 waterfall labels, tallies-bar focus behavior (no trap, no off-screen focus apart from bug 2), ch02 mobile default, and no console errors or overflow. Not fully fixed: the slab aria-label mismatch (bug 1).

BLOCKING ISSUES: 1
