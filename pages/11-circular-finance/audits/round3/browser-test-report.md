# Browser / QA report, round 3: 11-circular-finance

Tool: Playwright (Python) driving system Chrome (`executable_path`), file:// load. Test: `tests/browser_test.py` (run: `/private/tmp/claude-501/gauntlet/venv/bin/python tests/browser_test.py`; updated this round for ch05 renamed ratio buttons, ch03 autoplay tolerance, focus-context reporting, shots3 output). Screenshots and `results.json`: `/private/tmp/claude-501/gauntlet/shots3/`. Final run log: `/private/tmp/claude-501/gauntlet/run3b.log`.

## Per-viewport results (final run)

| Viewport | Console/page errors | Horizontal overflow | Interactions (all chapters, toggles, popovers, sheet) | Keyboard Tab | axe critical / serious |
|---|---|---|---|---|---|
| 1440x900 | none | none | all pass | n/a | 0 / 1 rule (105 nodes) |
| 1280x800 | none | none | all pass | 643 stops, no trap; 4 MINOR off-screen focus stops (see bug 3) | 0 / 1 rule (105) |
| 820x1180 | none | none | all pass (tallies bottom sheet not shown at this width, by design) | n/a | 0 / 1 rule (105) |
| 390x844 | none | none | all pass | 549 stops, no trap, all with ring and in view | 0 / 1 rule (56) |
| 1280x800 reduced-motion | none | none | all pass (ch03 Play disabled, as designed) | n/a | 0 / 1 rule (105) |

Width sweep (320 to 1600, 861-1439 in 40px steps incl. 1024, 1366, with every collapse toggle opened): no overflow at any width. The ch10 overflow from round 1 is fixed (verified at 1280, 1366, 1024).

Covered and passing: ch01 slider/laps/guest/play/step/end/reset; ch02 all 12 chips (edge counts change), search, edge select, node focus, clear focus, company-cards toggle (and mobile list view), pause pulses; ch03 next/back/play, laps, math drawer; ch04 sliders, more-knobs toggle (inner sliders), 3 presets, copy link, reset; ch05 all slabs, life buttons, year slider, hard-asset/senior-debt toggle, debt-paydown toggle (aria-pressed flips); ch06; ch07 callouts, full-list toggle (expand/collapse, aria-expanded), sort, 3+ roles, cell hover and focus tooltip; ch08 diagram steps and all real-example toggles; ch09; ch10 six toggles (aria-pressed); ch11 slider, apply, reset, copy link message; tag popover hover/focus/tap (desktop and mobile); mobile bottom sheet; share-hash round trip. Copy of index.html opened from `/tmp/cfcheck/` loads with no errors and no failed requests (no external references). `dist/circular-finance.html` is byte-identical to `index.html` (`cmp`).

## Accessibility

- axe-core (wcag2a/aa, 21a/aa, best-practice), every viewport: zero critical. One serious rule only: `label-content-name-mismatch`, 105 nodes (56 on mobile). No moderate or minor violations. `aria-required-children`, `nested-interactive` and `empty-table-header` from round 1 are all gone.
- Lighthouse: ran `npx lighthouse` (CHROME_PATH set) against a local http server (file:// is refused by Lighthouse). It was permitted this time. Accessibility score: **100** (1.0). Only failing audit is `label-content-name-mismatch` (56 items, zero weight in Lighthouse scoring). Bar of >= 90 met.
- The axe serious count still fails the "zero serious axe violations" bar, so it is listed as BLOCKING below.

## Round-1 blockers

1. ch10 horizontal overflow at 861-1439px: FIXED.
2. Critical `aria-required-children` (ch03 `#c3-lapnums`): FIXED. `nested-interactive` (ch05): FIXED. Estimated a11y score >= 90: met (Lighthouse 100). `label-content-name-mismatch`: NOT fixed (below).
3. Round-1 MINOR items: mobile focus popover now opens (focus check passes at 390); ch03 Play disabled under reduced-motion still has no explanatory hint (still MINOR).

## Bugs

### BLOCKING

1. **axe `label-content-name-mismatch` (serious), all `.tag` badges, every chapter (105 nodes desktop, 56 mobile).**
   - Repro: run axe on any viewport. Example `#ch01-sales > .t-calculated.tag[role=button]`. Visible text is a glyph plus a word (for example `ƒCalculated`, `◇Hypothetical`); the aria-label begins "Calculated: Our arithmetic..." so the accessible name does not contain the visible string (the glyph prefix is the likely mismatch).
   - Likely fix: wrap the glyph in an `aria-hidden` span (and confirm axe ignores it), or begin aria-label with the exact visible text including the glyph, or drop the glyph from textContent and draw it with CSS `::before`. Chapter: runtime `ctx.tag` (shared, appears in all chapters).
2. **ch04 waterfall value label clipped on the right.** At 1440x900 (also in the 1280 element shot) the "Build cost" row reads "= $266.6" where the value is $266.67; the final digit is cut by the SVG edge. Information is hidden (value truncated). Repro: scroll to ch04 with defaults and advanced section opened (screenshot `1440x900-ch04-advanced.png`, right chart, third bar). Fix: widen the SVG viewBox or reduce bar scale so the longest label has room. Chapter: ch04. (Classified BLOCKING under "information hidden"; downgrade if the editor judges one digit minor.)

### MINOR

3. Keyboard focus lands on `.tag` badges in the bottom tallies bar at 1280x800 while the bar is below the viewport (rect top 807-879 vs innerHeight 800), 4 stops, so the focus ring is off-screen. Repro: Tab traversal at 1280x800 around y 5900-7400. Chapter: shell (tallies bar).
4. ch03 Play button disabled under reduced-motion with no hint (aria-label/title). Chapter: ch03.
5. ch02 at 390 wide: map and company cards are both hidden until "Show company cards" is tapped (the page works; the user sees only filters first). Possibly intended. Chapter: ch02.
6. ch03 autoplay on mobile can reach the last hop before a user clicks Next (Next then disabled); behaviour is correct but the test now tolerates it. Chapter: ch03.

BLOCKING ISSUES: 2
