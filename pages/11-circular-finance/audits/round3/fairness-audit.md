# Fairness audit, round 3: "The Loop" (Ep. 11)

Method: rendered DOM text from headless Chrome (tags stripped, about 4,560 lines), plus `src/chapters/*.html`, `src/chapters/*.js` strings that appear after interaction, and `data/*.json` reader-facing fields (`reader_note`, events, history, knob rationales). Read twice, first as a long-NVDA investor (Bull), then as a short-seller (Bear). Chart colours and layout were judged from the markup and copy only, not from screenshots.

## Round-2 blockers: status

- N1 (builder and research notes shown on Ch2 deal cards): CONFIRMED FIXED. Raw notes are now `internal_notes` in `data/deals.json`, and no chapter JS prints that field. Cards show `reader_note`. A search of the rendered DOM, the chapter JS and the HTML for "re-fetch", "this pass", "from memory", "merge note", "do not chart", "not fetched" and "the research" finds nothing. Knob rationales read "We chose..." and "no source gives...". One small residue remains in M3 below.
- N2 (resignation tied to the Lucent bear case by "a leadership shock"): CONFIRMED FIXED as worded. The bear item now reads "concentrated customers and rising contingent commitments are the bear framing". The placement problem in B1 below is a different issue.
- N3 (Ch5 ratio summed nested and off-asset claims): CONFIRMED FIXED. The headline is $1.00 of ranked claims per $1 of asset on day one. The wider $1.84 figure is labelled "a wider picture, not dollars lent against this chip". The worst case is called "worst case: rent stops".
- Round-2 minors M1 to M7: M1 (column labels), M2 (Enron and bubble source titles gone), M3 (the "target 25%" is gone and 66% now sits beside 13%), M5, M6, M7 (opening scenario labelled "our starting scenario") are fixed. M4 (raw ID slugs) looks fixed: no slug-style source labels turned up in the sources list.
- Round-1 blockers B1 to B3, S1 and S2: still fixed.

Checks passed:
- "Bubble" appears once, negated ("isn't proof of a bubble either"). "Ponzi" never appears. "Fraud" appears only negated. The Ch5, Ch8, Ch9 and footer passages say layered claims are an ordinary capital structure, not double pledging, and name correlation as the issue. Nothing here implies wrongdoing.
- "Not investment advice" appears in the hero caption, the Ch9 banner and the footer.
- None of delve, robust, moreover, landscape, tapestry, crucial, pivotal or testament appears.
- Toy-model numbers carry hypothetical badges and "toy model, not a forecast" language. Ch10 keeps a separate box labelled "Our toy model, not a measurement of Nvidia".
- Bull and bear panels are paired in Ch2, 4, 6, 7, 9 and 10.

---

## BLOCKING

### B1 BLOCKING (both personas): the resignation is placed inside the Lucent failure chapter and listed beside "Does the timing rhyme?"

The facts in the box are neutral and the box says "We don't know the reason and we won't guess". The placement undercuts that.

- Location 1: Ch10 "Is this 2000 again?", box "One fact about Nvidia's leadership". It sits between the chapter intro and the Lucent ratio box, inside the Lucent comparison. The same box adds a second item directly under it: "2026-12-03: Senate Banking hearing on Nvidia and Megaspeed... It keeps scrutiny on Nvidia in December."
- Location 2: Ch10 "What we don't know yet" list (`src/chapters/10.js` line 262). Two bullets run back to back:
  - "Why did Nvidia's CEO resign? The 8-K gave no reason, and we don't speculate."
  - "Does the timing rhyme? Lucent's defaults came about a year after peak financing."
- Location 3: the epilogue "What we still don't know" puts "Who leads Nvidia from here" in the same list as guarantees, GPU life and lender behaviour. This one is milder.
- Why it fails:
  - Bull: a CEO's departure is shown in a chapter about vendors whose customers failed, then listed as an open question about financing risk. The disclaimer "not because we are linking it to anything else" is contradicted by where it is put. "Keeps scrutiny on Nvidia" next to the resignation reads as a second piece of bad news, and the export-control caveat arrives only in the next sentence.
  - Bear: this person would find it fair, but only because the page leaves them room to read it their way.
  - Both: the listing invites readers to guess a connection, which is speculation by arrangement.
- Rewrite:
  - Remove the Huang box and the Senate item from Ch10. Put both in one neutral "Nvidia news in this period" item with other dated company events, for example Ch9's list of dated events or the epilogue footer.
  - Show the resignation there as: "Nov 12, 2026: Nvidia filed an 8-K saying Jensen Huang resigned as CEO, president and director and that CFO Colette Kress is interim CEO. The filing gives no reason."
  - Show the hearing as a separate line: "Dec 2026: Senate Banking and House committees have scheduled inquiries into Nvidia's dealings with Megaspeed International and export controls."
  - Delete "Why did Nvidia's CEO resign?" from the Ch10 list. In the epilogue, move "Who leads Nvidia from here" out of the financing unknowns into an "Also in the news" line.
  - Drop "It keeps scrutiny on Nvidia in December."

### B2 BLOCKING (Bull; Bear would also object): the Ch8 "what to watch" items hint at accounting irregularity at Nvidia and xAI

- Location: Ch8, the Nvidia and Lambda leaseback card, "What to watch" (`src/chapters/08.js` line 153): "Whether the same chips are counted as a sale and as a lease commitment."
- Second location: Ch8, the xAI card (line 140): "Whether the lease counts as a lease or as debt on the company's books. One earlier xAI arrangement reportedly failed lease accounting."
- Why it fails:
  - Bull: the first item asks a reader to wonder whether Nvidia counts the same chips twice. It is the only Nvidia-specific accounting insinuation on the page. It also echoes the dinner-table "counted four times" device from Ch1. In a sale-leaseback, the chips being both sold and leased is the normal structure, so the item sets up a problem the structure does not have.
  - Bull: the Ch8 intro disclaimer ("We aren't alleging anything improper") is far above these items, and the cards do not repeat it.
  - Bear: "reportedly failed lease accounting" names no source and no company. A named company is implied to have had an accounting failure.
- Rewrite:
  - Lambda item: "How the leaseback is shown in each company's filings: as a sale, a lease, or both, which is normal for sale-leasebacks. Nvidia's filings list its cloud service agreements and leases not yet started (see the example)."
  - xAI item: "Whether the lease counts as a lease or as debt on the company's books, which depends on the purchase option and the terms."
  - If the "failed lease accounting" report is kept, name its source and say whether the company disputed it. Otherwise cut it.
  - Add the line "Ordinary structure; the question is disclosure, not wrongdoing" to the "What to watch" block of each card.

---

## MINOR

### M1 MINOR (Bull): Ch9 title presumes the outcome
- Quote: "When the music stops" (chapter title and nav entry "9 When the music stops").
- Why: the body is careful ("A stress test doesn't tell us whether the music stops"), but the title and nav label assume it does.
- Rewrite: "If funding tightens: a stress test".

### M2 MINOR (Bull): the epilogue elevates one toy number
- Quote: "here's the one question that cuts through them... the share of the loop's cash that is paid by end customers" and "about 13% is paid by end customers".
- Why: the 13% comes from a knob the page says has no source and is set "deliberately cautious" at 50%. The page's own reference point is 62%. The metric also counts any lender-funded or hyperscaler-funded purchase as "not end-user", so it is low by construction. The text says "A low end-customer share doesn't mean anything is wrong" and shows 66% for all outside money, which helps a lot.
- Rewrite: call it "one measure to track" rather than "the one question that cuts through". Add one sentence: "Hyperscalers that pay from operating cash flow are outside money too, and this toy does not model them." Show the 62% reference case next to the 50% default.

### M3 MINOR (both): leftover source-label text in Ch6
- Quote A, Ch6 bull panel: "We can't say that is one customer shrinking: coreWeave 'Customer A' share of revenue: 24% in Q3 2026 and 67% in Q3 2025 (the letter may not refer to the same customer in both periods) Revenue is still concentrated:..."
  - Cause: a data label spliced into the sentence (`src/chapters/06.js` line 191, `data/source-claims.json` line 810). The splice leaves lowercase "coreWeave", a pasted parenthetical and no full stop.
  - Rewrite: "Customer A was 24% of CoreWeave's revenue in Q3 2026 and 67% in Q3 2025, though the filing's letters may not refer to the same customer in both periods. Revenue is still concentrated: Customer B was 30%, so the two together were 54%."
- Quote B, Ch6 Nvidia guarantee row: "Source describes it as: Nvidia total maximum guarantee exposure at Oct 25, 2026 (company statement: $3.5B land/power/shell...)" (`06.js` line 178).
  - Rewrite: "Nvidia total maximum guarantee exposure at Oct 25, 2026: $3.5B land/power/shell for neoclouds, $105.0B SB Energy credit support and $9.5B power and systems credit support."
- Quote C: source titles such as "Benzinga: Benzinga article", "TokenPost news report" and "Yahoo Finance article, Nov 19, 2026 (2 of 2)" look unfinished. Give each a readable title.
- Quote D, Ch9 events and Ch8: "We left out one report about banks struggling to sell some Oracle-linked debt because we couldn't confirm it." Ch8 still says "Reports say banks had trouble placing the debt" for the Vantage loans, and the Pimco card says "after banks pulled back". Either keep the report in both places with a "reported" tag, or drop it from both.
- Quote E: "(secondary source)", "secondary reading of Meta's annual report" and "which does not appear in the filing" are process-sounding. Rephrase as "reported by [outlet]".

### M4 MINOR (Bull): stale and loaded phrasing in deal cards and Ch2
- "Nvidia's CEO has disputed calling it a backstop" (CoreWeave card): Huang resigned on Nov 12 and Kress is interim CEO, so write "Nvidia's then-CEO, Jensen Huang, disputed..." with a date. The same card's deal-type chip still counts it under "Backstop", so say in the legend or card that Nvidia disputes the label.
- "The gap between headline and actual is the point" (Ch7, Nvidia and OpenAI pair): this implies the headline misled. It was a non-binding "up to" letter of intent. Rewrite: "The letter of intent said 'up to $100B'; the equity actually invested is about $30B."
- "tangled pair" and "tangled" (Ch7): loaded. Suggest "multi-role pair".
- "dashed ghosts" for promises (Ch6 chart copy): "ghost" casts real contracts as unreal, while the same chapter says "A promise is a real contract". Suggest "dashed bars".
- "Off the balance sheet" (nav label and Ch8 title): the Ch8 body correctly says the structures are "often legal, often disclosed". Suggest "Off-balance-sheet structures".

### M5 MINOR (Bear): bull/bear lists in Ch10 "What each side actually says" are not equal
- Bull list: 5 items. Bear list: 6 items, with heavier named sources (Burry twice, Rowan, Fed staff, Wood, Chanos, Tunguz, Rasgon).
- Bear item: "Circular flows inflate reported demand... Who: Michael Burry" is the strongest claim on the page. It is attributed, which is correct, but Nvidia's rebuttal sits only in a different bullet.
- Fix: add one more bull item (for example hyperscaler capex held or raised in Q3, which the page already reports in Ch9). Put Huang's quote ("If that is, let's do more of that") directly under the Burry item rather than as a separate bull bullet. Also pair the Rowan "the bank" claim with the 8-K fact that Nvidia says it has paid nothing under any guarantee.

### M6 MINOR (Bull): the Ch9 default scenario's first view is bear-weighted
- With "Mild slowdown" active, the first view shows "Paper markdown of neocloud stake −$58.06" as the largest Nvidia effect, and the bull panel has no equal-sized number. The page labels this "our starting scenario, not a base case".
- Fix: in the bull panel add the matching fact that the senior lenders are paid in full ($42.16 of $42.16) and the GPU recovery is 100%. This is already there, but the markdown is the only number repeated in both the output list and the bear panel. Consider showing the no-stress state first, or a small "no stress: $0" comparison row.

### M7 MINOR (Bear): ordering and weight
- Ch9 "Signs of financial stress" is listed before "Signs of continued demand and financing". Both have six items, which is fair. The Ch10 "Peak to trough" row shows −98.5% and −99.4% for Lucent and Nortel directly above "No trough yet that we can verify". The disclaimers are present and the row is labelled "A comparison, not a prediction".
- Fix: none required. Optionally open that row with the Nvidia Q3 revenue and guidance facts as the "Now" column header, so the first Nvidia number is the sales figure.

### M8 MINOR (voice): the repeated "not X, it's Y" opener
- Examples: "It's not a scandal and it's not a free lunch." "Nobody lied." "That's the whole trick." "A comparison, not a prediction." "Neither is a verdict." It is clean prose but used often enough to feel formulaic. Trim two or three. No banned AI-speak words appear.

---

## Per-persona summary

- Bull (long NVDA): would accept the page as fair after B1 and B2. Demand is shown as real (+103% revenue, backlogs), guarantees are shown as undrawn with Nvidia saying it has paid nothing, and the bull case leads in the Ch10 history rows. The two hits are the resignation placement and the sale-and-lease insinuation.
- Bear (short-seller): would accept the page as fair. Concentration, circular equity, the $105B ceiling, GPU life and stress pricing all appear, and the page declines to call the loop safe ("A quiet year is not evidence the structure is safe"). The Ch8 xAI line is the only item they would call unsourced.

BLOCKING ISSUES: 2
