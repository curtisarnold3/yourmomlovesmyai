# Browser/QA report, round 5

Page: `pages/11-circular-finance/index.html` (file://, system Chrome via Playwright). Harness: `tests/browser_test.py` (shots in `/private/tmp/claude-501/gauntlet/shots5/`, log `/private/tmp/claude-501/gauntlet/run5.log`).

Harness additions this round: a bad-text scan (`/NaN|undefined|\[object|— of seed/` over every text node plus aria-label/title/alt/aria-valuetext) at load, after every step and at end of session; value-change assertions (the observed outputs must differ after the interaction) for ch01 friends/laps sliders, ch03 laps slider, ch04 every slider, ch05 year/life/mode, ch06 growth slider (gauge values, label "150%", return to baseline), ch09 every knob/preset/checkbox, ch10 toggles, ch11 explorer slider and apply. The ch06 step now targets `[data-ch06-growth]`.

## Results

| Viewport | Console/page errors | Overflow | Interactions and value changes | NaN/undefined text | Popovers | Keyboard Tab | axe critical/serious |
|---|---|---|---|---|---|---|---|
| 1440x900 | none | none | all pass, values change | none visible (1 tooltip-prose hit, see Minor 1) | hover/focus/click ok | n/a | 0 / 0 (no violations at all) |
| 1280x800 | none | none | all pass | same | ok | no trap; Minor 2 | 0 / 0 |
| 820x1180 | none | none | all pass (tallies toggle hidden by design) | same | ok | n/a | 0 / 0 |
| 390x844 | none | none | all pass incl. bottom sheet, share-hash round trip | same | tap ok | no trap, no stop without ring | 0 / 0 |
| 1280x800 reduced-motion | none | none | all pass | same | ok | n/a | 0 / 0 |
| Width sweep (320-1600, ~40 widths, collapses open) | n/a | none | n/a | n/a | n/a | n/a | n/a |

Other checks:
- ch06 growth slider is alive. At 150% the output reads "150% a year" and OpenAI's headline gauge goes from 28 yrs to 4.1 yrs with a dotted "no growth" ghost marker. It returns to baseline at 0%. No NaN anywhere (also checked in the screenshot at 1280 and 390).
- ch04: no slider is dead. The four main sliders move the headline, waterfall and table. The advanced ones (lab_outside_revenue_share, gpu_useful_life_years, base_rate and so on) change the right-hand panel (multipliers, "changed" note, claims, definition list, bull/bear). They do not change the waterfall at default state, which is expected. The first run of the new harness flagged them as dead because it only watched headline, waterfall and table. I confirmed with a probe on the full panel (0 dead) and widened the harness selectors. That edit was not re-run end to end.
- ch05 year slider, ratio-mode toggle and life buttons change the ratio panel and figure (year 5: asset $0, ratio ">100 to 1", wider figure "n/a"). The ch05 debt-paydown toggle flips aria-pressed.
- ch09 (every knob, 4 presets, missed-payment checkbox), ch10 (Then/Now/Both/Facts only/Bull/Bear), ch11 (explorer slider, apply, reset, copy link) and ch01/ch03 sliders all change visible values.
- Share-hash round trip passes. A copy of index.html in another directory (`/private/tmp/claude-501/gauntlet/otherdir5/copy.html`) opens with no errors, 7 slabs and no overflow.
- `dist/circular-finance.html` is identical to `index.html` (cmp).
- Lighthouse accessibility (http://127.0.0.1:8765, system Chrome): 100, with no failing audits.
- Screenshots viewed: ch06 at 1280 and after growth at 1280 and 390, ch04 advanced at 1280, ch05 at year 5. No clipped labels. One minor overlap (Minor 3).

## Round-4 blockers

- ch05 slab `label-content-name-mismatch` (serious axe): fixed. axe returns zero violations at all five viewports and Lighthouse returns no failures.
- Round-4 minor, mobile ch02 map unreachable: unchanged and by design.
- Round-4 minor, off-screen tag focus in ch03/ch05 at 1280x800: still present (Minor 2).

## Bugs

BLOCKING: none.

MINOR:
1. **Word "undefined" in ch05 ratio tooltips.** The `.ch05-val` spans carry a `title` ending "/0 (asset value is zero: undefined)". It is present at load, because the "end of useful life" ratio in the ch05 paragraph is >100 to 1, and it stays after interaction. This is intentional explanatory prose, not a rendering bug, but it trips the strict regex. Suggested wording: "asset value is zero, so the ratio has no finite value". The harness downgrades this exact string to MINOR.
2. **Keyboard, ch03 and ch05 at 1280x800.** The sticky global tallies strip is about 208px tall and the sticky ch03 stage is tall. Five `.tag` badges (the ch03 in-stage tallies, one in ch05) take focus at y of about 807-880, below the 800px viewport, and cannot be scrolled into view. There is no trap. This is the same as round 4. Fix: a shorter strip or a non-sticky stage when the viewport is under about 900px tall.
3. **ch05 year 5, label overlap.** The callout "ranked claims minus asset: +$100" is drawn across the dashed slab edges. It is still legible but touches the outline. Repro: ch05, year slider at max.

BLOCKING ISSUES: 0
