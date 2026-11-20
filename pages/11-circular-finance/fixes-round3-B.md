# Round 3 fixes, fixer B (item -> action)

- BLOCKING 1 axe label-content-name-mismatch on .tag: runtime.js glyph now rendered by CSS ::before (data-g), so visible text = label and aria-label starts with it. Also fixed ch02 map nodes (aria-label now starts with visible name + ticker/lines text; SVG name text gets a trailing space so axe sees separate words) and ch03 Back/Next buttons (aria-label starts with visible word). axe at 1440, 1280, 390 and reduced motion: only 3 nodes remain, all ch05 `g.slab` (fixer A's chapter).
- BLOCKING 2 ch04 waterfall clipping: viewBox width 460->500, bar scale 256->240, svg overflow visible; all 7 value labels verified inside the svg box at 1440.
- Tallies bar focus off-screen: focusin on the bar scrolls it into view.
- ch03 play hint under reduced motion: already present (#c3-playhint), verified visible with reduced motion.
- ch02 mobile: defaults to list view at <=700px; view toggle buttons hidden on mobile (map is never shown there). Verified list height > 0.
- FINANCE #4 ch02: panel for aggregates with data `parties` shows "Placement participants" and names from data, plus one "Includes Nvidia's $10B (own line, not added again)" derived from the deal list. No typed names. Verified against A's updated data.
- FAIRNESS ch08: xAI card -> "How the lease and the purchase option are each reported in the company's filings and the financing documents"; Lambda card -> "How the earlier sale and the later lease are each reported in the filings..."; "reportedly" removed.
- "tangled" -> "overlapping" (ch07 visible text); "ghosted/ghost lines" -> dashed outline/lines (ch02, ch03). ch06 "dashed ghosts" is A's.
- ch11 epilogue: hook now "one question worth keeping in mind ... not the only question", heading text "One number worth tracking", caveat sentence leads the knob note ("our default is a toy assumption with no source"), and the headline sentence carries "(a toy assumption, not a finding)" beside the number.
- "Nvidia's CEO" (CoreWeave card): text is in data/deals.json reader_note (line ~509), not in my files; for A.
