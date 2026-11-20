# Browser / QA report: 11-circular-finance

Tool: Playwright (Python) driving system Google Chrome (channel=chrome), file:// load. Test: `tests/browser_test.py` (run with `/private/tmp/claude-501/gauntlet/venv/bin/python tests/browser_test.py`). Screenshots: `/private/tmp/claude-501/gauntlet/shots/`. Raw results: `/private/tmp/claude-501/gauntlet/results.json`.
A11y tool: axe-core (npm, wcag2a/aa, 21a/aa, best-practice). Lighthouse over a local http server was attempted but the run was denied by the sandbox policy, so there is no Lighthouse number. Estimated Lighthouse a11y score is about 85-88. This is an estimate, not a measurement: axe reports one critical failure (`aria-required-children`, weight 10) and `nested-interactive` (weight 3), and Lighthouse scores those heavily.

## Per-viewport results (final run)

| Viewport | Console/page errors | Horizontal overflow | Chapter interactions | Keyboard / focus | Notes |
|---|---|---|---|---|---|
| 1440x900 | none | none | all pass | n/a | pass |
| 1280x800 | none | **FAIL: scrollWidth 1345 > 1280** | all pass | pass (no trap, ring on every stop) | ch10 text clipped/overflowing |
| 820x1180 | none | none | all pass | n/a | tallies bottom sheet is not shown at this width (by design) |
| 390x844 | none | none | all pass (ch02 map and ch07 matrix are replaced by lists on mobile, by design) | pass | tag popover does not open on programmatic focus (MINOR) |
| 1280x800 reduced-motion | none | **FAIL: 1345 > 1280** | all pass (ch03 Play is disabled under reduced motion) | n/a | same ch10 overflow |

Extra widths probed: 1366 gives 1388, 1200 gives 1305, 1100 gives 1255, 1024 gives 1217, 900 gives 1155 (all overflow). 1440 and 820 and below are clean.

Verified working: ch01 sliders, guest toggle and play/step/end/reset. ch02 all 12 chips (type and kind filters change visible edges), search, edge select, node focus, clear focus, list view, pause pulses. ch03 next/back/play, laps and N, math drawer. ch04 all sliders, 3 presets, reset, copy link. ch05 slabs, life, year, ratio. ch06 slider. ch07 sort, 3+ roles, cell hover and focus. ch08 all diagram steps. ch09 presets, sliders, missed payment, reset. ch10 six toggles (aria-pressed correct). ch11 target slider, apply, reset, copy link (gives a confirmation message). Tag popover works on hover, focus and tap at desktop, and on tap at mobile. Mobile tallies bottom sheet toggles `aria-expanded`. Share-state hash round-trips: a slider change gives a hash, and reloading with that hash restores the same value.
Keyboard Tab traversal covered 850+ stops at 1280 and 390 with no trap and no off-screen focus. SVG elements (ch02 edges, nodes, ch05 slabs) use custom `:focus-visible` stroke styles, which I confirmed in the CSS and a screenshot. Legends were present on every chart I viewed (ch01, ch03, ch05, ch09, ch11 and others).

## Bugs

### BLOCKING

1. **Horizontal page overflow from about 861px to 1439px wide, including the required 1280x800 viewport** (scrollWidth 1345 at 1280).
   - Repro: open at 1280 wide, scroll to ch10, "Now" column. `document.documentElement.scrollWidth` is greater than `innerWidth`, and the right-hand text is cut off ("...vs CoreWeav", the VERIFIED tag is clipped).
   - Cause: `#ch10 .num{white-space:nowrap}` (CSS around line 905) is only reset to `normal` inside `@media (max-width:860px)` (line 929). Long `.num` spans in the "now" cell (e.g. "Nvidia 5-yr CDS about 139 bp vs Oracle...") are 574px wide nowrap.
   - Fix direction: allow wrapping for `.num` in ch10 at all widths, or add `min-width:0` and `overflow-wrap:anywhere`.
2. **A11y score estimated below 90, with a critical axe violation.**
   - `aria-required-children` (critical): `#c3-lapnums` has `role="list"` but contains `role=button` children. Chapter 3.
   - `nested-interactive` (serious, 8 nodes): the ch05 `svg` and the `.ch05-row[data-slab]` buttons contain focusable tag badges (`.tag[role=button][tabindex=0]` inside a button or `role=button`). Chapter 5, also the isometric SVG.
   - `label-content-name-mismatch` (serious, 109 nodes): every `.tag` badge has `aria-label="Status: ... formula ... text"`, which does not include the visible text (the label and glyph). Source: runtime `ctx.tag` (index.html around line 2758).
   - Minor: `empty-table-header` on `th[aria-label="Company"]` (ch07 matrix).

### MINOR

3. Tag popover does not open on keyboard focus at a mobile emulated viewport (390, touch). Tap works, and focus works at desktop. Possibly an intended touch-only mode. Source: popover logic in runtime.
4. ch03 Play button is `disabled` with no explanation under `prefers-reduced-motion` (no title or aria-label hint). Step and Next still work.
5. ch11 "Try it in the model" is disabled when the target is already reached or unreachable (for example at the default 80% target it is enabled, but at 90%+ or 60% and below it is disabled). The explanatory sentence is shown, so this is acceptable, but a disabled-reason cue on the button is missing.
6. Very small SVG text on mobile: ch11 range bar renders about 6.4px, and the ch08 diagrams and ch04 waterfall about 7.7-7.9px at 390 wide.
7. The sticky top nav and bottom tallies bar overlap content in element screenshots and sit over page content at the bottom of the viewport on mobile. They are fixed UI, not clipping, so no action.

False positives removed from the test: the off-screen skip link ("Skip to the story" at -999px, intentional), and smooth-scroll lag in the first kbd run (the page uses `scroll-behavior:smooth`, which made focus look out of view).

BLOCKING ISSUES: 2
