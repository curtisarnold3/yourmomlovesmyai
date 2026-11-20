# Fairness audit, round 2: "The Loop" (Ep. 11)

Scope: rendered DOM text (headless Chrome, tags stripped, 4,657 lines), plus src/chapters html/js strings and data/*.json copy that surfaces after interaction (deal-card notes, knob rationales, history.json). Read twice: as a long-NVDA investor (Bull) and as a short-seller (Bear).

## Round-1 blockers: status

- B1 (Ch5 debt shown as non-amortising, "no ceiling"): CONFIRMED FIXED. Paydown toggle, "gets very large in this simplified version", and "In real deals the senior loan is repaid from rent" are present. (But see new finding N3.)
- B2 (Ch9 market block one-sided): CONFIRMED FIXED. Now "both ways", six stress items and six strength items, Nvidia Q3, CoreWeave Q3, tighter loan pricing. "Distress-level" wording is gone. The unverified Oracle-debt item is dropped with a stated note. (Label issue in M1.)
- B3 (toy 12.5% stated as fact): CONFIRMED FIXED. Ch4, Ch10 and the epilogue say "In this toy model", "deliberately cautious setting", and give the 62% reported reference point. Ch10 has a separate "Our toy model, not a measurement of Nvidia" box.
- S1 (Huang note leak, no 8-K facts): MOSTLY FIXED. The editor-note sentence is gone. A neutral 8-K box exists ("The filing gave no reason. We don't know the reason and we won't guess."). One residue remains: N2.
- S2 (bull asserts, bear hedges): CONFIRMED FIXED. Ch2 and Ch7 bull text now uses "most of", "many of", "often".

Also fixed: hero chain no longer ends on paper value; Ch7 intro "more polite name" removed; "quiet part" replaced; Ch9 bear causal claim hedged; raw IMF/"(403)" to-do lines removed from the page body.

## Findings, Bear persona (short-seller)

### N1 [shared with Bull] BLOCKING: builder and research notes visible to readers (Ch2 deal cards)
- Location: Ch2, click any line; `src/chapters/02.js` line 350 prints `d.notes` under a "Notes" heading. The default card (Nvidia to OpenAI) shows: "Original Sept 2025 press release not re-fetched in this pass; the post-announcement history comes from press. A Yahoo Finance piece describes a 'preliminary deal'... unconfirmed. Non-binding LOI. Headline up to $100B vs actual $0".
- 19 of 58 deals in `data/deals.json` carry notes of this kind. Examples: "Do not chart as a completed deal." (xai-gpu-spv), "Merge note: Research left actual null. Set low 15..." (amazon-openai-equity), "fetch SEC original before publishing as 'verified'" (meta-coreweave-compute), "Fetch the Sept 2025 Nebius 6-K to upgrade to verified." (msft-nebius-compute), "from memory in the research and unconfirmed" (blackstone-magnetar-coreweave), "filing itself not fetched. Upgrade to verified once read." (nvda-coreweave-capacity-backstop), "we read only search summaries" (google-fluidstack-terawulf-backstop).
- Why: these are the builder's to-do list. Both personas will read "from memory" and "not fetched" as a sign the numbers are unchecked, and "Do not chart as a completed deal" is an instruction to staff.
- Rewrite: render a reader-facing field instead of raw notes. For example, "How sure we are: reported by press; the primary filing has not been checked." Strip "Merge note", "Do not chart", "fetch", "upgrade to verified", "from memory", "this pass". Same cleanup for the knob rationales ("Not in the research", "The research gives", "no ... data is in the research"): say "We don't have a figure for this" and "Our sources give...".

### N2 BLOCKING: the resignation is tied to the Lucent bear case ("a leadership shock")
- Location: Ch10 "What each side actually says", Bear reading, last item: "concentrated customers, rising contingent commitments and a leadership shock are the bear framing (framing, not a tested conclusion)." Source: `data/history.json` line 572.
- Why: the page promises (Ch10 box) that the resignation is shown "not because we are linking it to anything else". This line links it to the failure story, and gives it a causal role in the bear case. That is speculation about an individual's departure, and it contradicts the neutral 8-K box. The Bull persona will also read it as the page importing the resignation into the bear narrative.
- Rewrite: "The Lucent/Nortel parallel: vendor lent to or guaranteed customers who later failed; concentrated customers and rising contingent commitments are the bear framing (framing, not a tested conclusion)." Delete "and a leadership shock".

### N3 BLOCKING: Ch5 headline ratio sums nested and off-asset claims, so it overstates the stack
- Location: Ch5 "$2.05 of claims on every $1 of hard asset" and "gap: +$279" at year 0 (also Ch4: "claims per $1 of GPU asset are 2.05 on purchase day and 7.02 after 3 years").
- Why: $2.05 = (167 + 55.6 + 50 + 89 + 40 + 100 + 44.5) / 266.7 = 546 / 267. Ch8 and hop 8 say the $55.6 bank back-leverage "nest[s] inside claim #2 and add[s] claimants, not dollars", yet Ch5 adds it on top of the $167 it funds. The mezzanine at the parent, the lab's contract right, the backstop and lab investors are drawn dashed and labelled "not ranked against this asset", yet they are included in the headline ratio and in the "gap". The page's own list says "recovers 100% now" for every ranked layer. The effect is the very double-counting the page warns about, and it points in one direction. The honest cash-claims figure ($1.00) is shown only in a small subline. Ch4 states 7.02 with no mention that senior debt is repaid from rent.
- Rewrite: make the headline the ranked claims on this asset (senior debt plus equity, not the nested bank layer) and show the all-in figure as "if you also count promises and claims on other entities: 2.05". In Ch4 add: "(worst case: rent stops and no debt is repaid)" after the 7.02.

### M1 MINOR: "Signs of strength" holds items a skeptic would not call strength
- Location: Ch9 market block, strength list: "Nvidia agrees to guarantee up to $105B of OpenAI Ohio lease payments" (cites a Burry "red flag" piece; text is only Nvidia's framing, "paid nothing"), and "Hyperscaler Q3 earnings: combined free cash flow negative; no capex cuts".
- Rewrite: rename the columns "Signs of financial stress" and "Signs of continued demand and financing". Move the $105B guarantee to a neutral "Commitments to watch" item with both framings, or to the stress column with the Nvidia statement attached.

### M2 MINOR: loaded source titles still shown
- Location: Sources: "off balance sheet gymnastics 24 years after enron" (ifre.com), "Ai financing bubble nvidia openai circular deals explained", "Internet bubble vs todays ai buildout", "then nvidia lost its ceo" (tikr.com). Round-1 S6 not acted on.
- Rewrite: show outlet and date as the label ("IFRE, Oct 2025"), keep the original headline in a tooltip, or drop the Enron-titled item. The "lost its ceo" title sits next to the Huang box and invites a reading the page disclaims.

### M3 MINOR: epilogue "number to watch" and "target 25%"
- Location: Epilogue bar "Paid by end customers ~13% (the number to watch)" and "target 25%". The cautious-knob result is the page's headline and the 25% target is arbitrary, so the low number looks like a shortfall. The page does say "A low end-customer share doesn't mean anything is wrong" and that lenders' money is outside money, which helps.
- Rewrite: label the marker "example threshold, ours" and give "all outside money ~66%" equal visual weight beside the 13%.

### M4 MINOR: raw ID slugs in source labels
- Location: "IREN IR: 56eec258 62fb 4929 9e93 02c816693da2", "Seeking Alpha: 4523396", "tokenpost.com: Business". Looks like unfinished work. Give each a readable title.

## Findings, Bull persona (long NVDA)

(N1 and N2 apply here too.)

### M5 MINOR: Ch3 hop 7 line is bear-only
- Quote: "Nvidia, in turn, is now exposed to the same demand it helped create." Other hops pair it with "The revenue is real." Suggest adding: "That alignment is also what lets lenders price the loan tighter."

### M6 MINOR: Ch10 bull line conflicts with Ch4 data
- Quote (Collateral life, Bull): "rental prices have been firm." Ch4 shows H100 rent down about 28% a year from 2023, with a 2026 rebound. Rewrite: "rental prices have stabilised and recently risen from their 2025 low" or cite the index. This one favours the bull more than the data supports, so the Bear persona will notice.

### M7 MINOR: Ch9 default scenario is a stress already applied
- The page opens on "Mild slowdown" (20% shortfall) rather than "no stress", and the equity haircut ($9.46) and Nvidia stake markdown ($58.06) show at first view. The page says it is a toy and offers "Reset to no stress". Suggest labelling the opening state "Mild slowdown (our starting scenario)" so readers do not take the first picture as a base case.

## Checks passed (both personas)

- Fraud/double-pledging: Ch5 ("This is not double-pledging... nobody calls that fraud... a point about correlation, not wrongdoing"), Ch8 ("We aren't alleging anything improper"), Ch4, Ch9 and the footer all state it. Only N3 undercuts it in numbers, not words.
- "Bubble" appears only in negation ("isn't proof of a bubble either") and in source titles. "Ponzi" never. "Scandal" and "fraud" are negated.
- Bull and bear panels are paired and similar in length in Ch2, 4, 6, 7, 9, 10; Ch10 adds a "We don't know yet" row each time.
- Toy numbers carry Hypothetical badges, "toy model" language and rounded HUD values. "Not investment advice" appears in the hero caption, Ch9 banner and footer.
- Voice: no delve, robust, moreover, landscape, tapestry, crucial, pivotal or testament in page copy. Contractions and "we" present. Analyst shorthand is mostly gone.
- No leaked internal notes in page body outside N1 and M4.

BLOCKING ISSUES: 3
