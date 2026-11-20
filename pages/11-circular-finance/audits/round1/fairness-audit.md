# Fairness audit: "The Loop" (Ep. 11, circular finance)

Scope read: rendered text (headless Chrome DOM), src/chapters/*.html and *.js strings, data/*.json (events.json, history.json). Audience: curious general readers. Read twice, once as a long-NVDA investor ("Bull persona") and once as a short-seller ("Bear persona").

## What the page does well (both personas agree)

- Fair note and "Not investment advice" in the footer; "TOY MODEL: not a forecast. Not investment advice." banner in Ch. 9.
- Ch. 5 and the footer say plainly that layered claims are an ordinary capital structure, not double pledging, and that the issue is correlation. Ch. 8 says "We aren't alleging anything improper in any deal here."
- Bull and bear readings appear side by side in most chapters (2, 3, 4, 6, 7, 9, 10) with matching headings and similar length. Ch. 10 adds a third column, "We don't know yet".
- Claims about people are attributed (Burry, Chanos, Rowan, Fed staff, Hassett, Huang). "Bubble" appears once, negated ("isn't proof of a bubble either"). "Ponzi" never appears. Promises are never added to cash.
- Contractions and "we" are present. None of the banned words (delve, robust, moreover, landscape, tapestry, crucial, pivotal, testament) appear. The voice reads like a popular science writer.

## Findings, Bull persona (long NVDA; demand is real, strategic investing is normal)

### B1. BLOCKING: Ch. 5 claims stack presents debt as non-amortising and collateral as worthless at end of life
- Location: Ch. 5 chart and list note: "Face values are constant; only the asset changes." Caption: "Claims don't shrink when the chip does." Closing text: "By the end of the chip's useful life the asset is worth about zero, so the ratio has no ceiling."
- Why: the page's own Ch. 8 and Ch. 9 describe delayed-draw term loans that amortise over five years out of contracted rent, and Ch. 9 pays that debt down. Ch. 5 ignores amortisation, residual value and the contract cash flow that repays the loan. It then shows the ratio running to infinity. A reader leaves with the idea that lenders are always underwater. That is the one-sided output of a modelling choice, not a fact.
- Rewrite: add an "amortising debt" line to the chart, or a toggle that defaults to it. Fix the copy: "Face values are held constant here to show the worst case for lenders. In real deals the senior loan is repaid from rent over the life of the chip, so the gap is smaller than this picture shows. How much smaller depends on whether the customer keeps paying." Replace "the ratio has no ceiling" with "the ratio gets very large in this simplified version".

### B2. BLOCKING: Ch. 9 "What the market is already pricing" is selected one-sidedly and uses loaded labels
- Location: Ch. 9 event list. Eight items:
  - Oracle downgrade.
  - Oracle CDS record.
  - CoreWeave CDS above 1,289 bp.
  - Fed hike.
  - Fed minutes on circular financing.
  - Banks struggling to distribute debt (marked Unverified, but shown).
  - Neocloud equities "deeply below peaks".
  - "No confirmed public default".
- Only the last item is neutral or favourable to the structure.
- Loaded text: "Distress-level pricing on the most levered neocloud". "First clear central-bank wording on circular financing".
- Missing bull-side events that are in the project's own data and sources: Nvidia Q3 revenue +103% year on year, Q3 net income $65.3B, and CoreWeave's backlog and raised guidance. events.json calls CoreWeave's quarter "bull evidence". Neither side gets equal weight here.
- Rewrite: relabel the block "What the market is saying right now, both ways". Add at least three bull-leaning items with the same dating and tagging: Nvidia Q3 results and guidance, CoreWeave Q3 backlog and guidance raise, hyperscaler record operating cash flow. Replace "Distress-level pricing" with "5-yr CDS above 1,289 bp; bond yields above 16%". Drop the Unverified Oracle-debt item from the list, or add a visible "we couldn't confirm this" note in the headline text rather than only a small badge.

### B3. BLOCKING: toy-model figure stated as present fact, with a bear-leaning default chosen quietly
- Location 1: Ch. 4 bear reading: "Right now just 12.5% of the cash moving in a lap comes from end users." The word "Right now" turns a hypothetical into a statement about the world.
- Location 2: Ch. 10 "Share of revenue from outside the loop", Now column: "Only about 12.5% is paid by end users."
- The 12.5% comes from a default of 50% outside revenue for the lab. The knob note says that default was set below the 2025 data point of about 62% "because contracted spend is growing faster than revenue", which is a judgement the reader doesn't see next to the number.
- The Ch. 10 "Now" column also sits directly beside real Lucent filings, so the toy figure looks like an equivalent datapoint.
- Rewrite: "In this toy, with the lab covering half its rent from outside revenue (a deliberately cautious setting; the reported 2025 figure is nearer 62%), only 12.5% of the cash in a lap comes from end users. Move the knob and this changes." In Ch. 10 move the toy percentages into a clearly separated box titled "Our toy model, not a measurement of Nvidia".

### B4. MINOR: hero headline chain ends on the biggest, least meaningful number
- Location: hero and "What comes out": "$100 of seed cash -> $166.7 of debt -> $160 of Nvidia revenue -> about $538.6 of paper market value". The "Market value per $1 (paper) 5.4x" line is a "multiplier" built on an arbitrary 12x multiple and 50% "recurring" share.
- Tags and "Nothing here is a forecast" are present, which helps. But the order (debt up, revenue up, value up) reads as a money machine. The title also says "AI Money Machine". The paper figure implies Nvidia's market cap is made by the loop, which the page never claims.
- Rewrite: drop the paper value from the hero and keep it in Ch. 4. Hero: "$100 of seed cash -> $166.7 of lender debt -> $160 of Nvidia revenue (toy numbers, not a forecast)." Consider "AI Money Loop" for the title.

### B5. MINOR: false precision on toy figures
- Location: sticky HUD "External $233.47 · Recycled $122.27", plus "$538.56", "$396.27" and similar.
- Cents on a made-up cluster suggest measurement. Round to whole dollars in the HUD and hero.

### B6. MINOR: "Calculated" badge on numbers that depend on assumptions
- Location: "Debt created $166.67 ƒ Calculated", "Claimants 8 ƒ Calculated".
- These follow from loan-to-cost and the model structure, not from observed data. A reader will trust "Calculated" more than "Hypothetical". Suggest a distinct badge such as "Calculated from toy inputs", or tag these Hypothetical.

### B7. MINOR: Ch. 7 intro uses a leading comparison
- Location: Ch. 7 opening: "Your landlord is also your lender, and also your biggest tenant... Most of us would call that a conflict of interest. In AI infrastructure it has a more polite name: a partnership."
- "More polite name" is a sneer. The later bull panel and "What this means" soften it.
- Rewrite: "Imagine your landlord is also your lender, your biggest tenant and a part-owner of your business. In AI infrastructure that's called a partnership, and it cuts two ways: it aligns interests, and it ties fates together."

### B8. MINOR: "quiet part" implies concealment
- Location: Ch. 10, bear reading under vendor financing: "Contingent commitments were the quiet part of the Lucent story too."
- This reads as "hidden". Rewrite: "Contingent commitments were easy to overlook in the Lucent story too: small when drawn, large when customers stumble."

## Findings, Bear persona (short-seller; the loop is fragile)

### S1. BLOCKING: Jensen Huang resignation, treatment is thin and leaks an internal editor note
- Location: Ch. 10 open items, repeated in the epilogue "What we still don't know": "Cause and consequences of Jensen Huang's Nov 12 resignation are unconfirmed; only the 8-K facts are verified. Avoid repeating unconfirmed personal allegations."
- Problems:
  - (a) "Avoid repeating unconfirmed personal allegations" is an instruction to the page's own writer, printed in reader copy. It tells readers that allegations exist and are being withheld, which is a hint without evidence. It invites exactly the speculation the page is trying to avoid.
  - (b) The page never states the plain 8-K facts (Huang resigned; the CFO is interim CEO; no reason given in the filing) anywhere readers can find. "Jensen Huang (pre-resignation)" and "interim CEO Kress" appear with no explanation.
  - (c) "A leadership shock" is listed as a bear framing in the Lucent row, in the data file, with no neutral statement of the fact.
- Rewrite: delete the editor-note sentence everywhere. Add one neutral box in the stress or history chapter: "On Nov 12 Nvidia filed an 8-K saying Jensen Huang had resigned as CEO, president and director, and that CFO Colette Kress would serve as interim CEO. The filing gave no reason. We don't know the reason and we won't guess." Keep "(pre-resignation)" only after that box.

### S2. BLOCKING: Ch. 5, the same stack issue seen from the other side, but also the bull assertions elsewhere are stated more strongly than the bear ones
- Location (asymmetry, Ch. 2 bull reading): "Every line here is a contract between companies that did their homework... real spending by real users, which has been growing."
- Location (Ch. 7 bull reading): "every one of these links is written down in a contract that lenders and auditors have read."
- The Ch. 2 map itself shows 32 of 57 lines are promises, two of them non-binding letters of intent (the $100B OpenAI LOI never became a deal). Not every line is a contract, and nobody shows that lenders and auditors read each one. The bear paragraphs are hedged ("can", "may", "many of these lines weaken"), while the bull paragraphs assert.
- Rewrite, Ch. 2 bull: "Most of these lines are signed contracts, often with large, well-resourced customers. A chipmaker with a stake in its customers shares their upside. And at the end of the chain sit paying users, and their spending has been growing." Rewrite, Ch. 7 bull: "Many of these links are written into contracts that lenders and auditors review." Make both sides use matching strength of verb.
- Note: if B1 is fixed this finding stays valid as a separate asymmetry. As written, the bull and bear columns do not match in assertiveness, and the short will call the bull side promotional.

### S3. MINOR (bear-side): an unsupported causal claim in the stress bear reading
- Location: Ch. 9 bear reading: "The customers who stop buying are the ones who were funded by its own capital."
- In the default scenario lost next-lap revenue is $0.00, and nothing in the model proves who stops first. Rewrite: "If funding tightens, the customers who lean most on vendor-sourced capital are the most exposed, and they are also the customers whose orders came with that support."

### S4. MINOR (bear-side): bear evidence in the bull/bear panels is mostly one named critic
- Location: Ch. 10 attributed arguments. Bear items cite Burry (twice), Rowan, Fed staff, Wood, Chanos, Tunguz, Rasgon, so breadth is fine. But the bull items lean on Nvidia's own disclosures and company statements (Nvidia, Kress, CoreWeave management, Huang). A short-seller will say bulls are quoting the company. Add independent bull-side voices, for example a named sell-side analyst or Hassett (already there), and label company statements as company statements.

### S5. MINOR: raw research notes are shown to readers
- Location: Ch. 10 "The research file's own open items" and the epilogue list: "(403)", "pull a consistent series (Bloomberg/ICE)", "check the indenture/8-K", "Substack/aggregator summaries", and an unverified "IMF chief reportedly says AI circular financing exceeds $1 trillion".
- Honest, but written as the author's to-do list. The IMF item is a striking unverified figure shown without a source line. Rewrite as a short "Things we couldn't confirm" list in reader voice, or remove the IMF line unless it is verified.

### S6. MINOR: source titles carry loaded words
- Location: Sources list, e.g. "off balance sheet gymnastics 24 years after enron", "Ai financing bubble nvidia openai circular deals explained", "Internet bubble vs todays ai buildout", "then nvidia lost its ceo".
- These are the outlets' own titles, and "bubble"/"Enron" come from sources rather than the page's voice. Still, Enron is a fraud association. Show a neutral label (outlet and date) and put the original headline in a tooltip, or drop that Enron-titled source.

### S7. MINOR (credit to the page): the hero says "It's not a scandal and it's not a free lunch"
- This is fair and symmetrical. Keep it. No change needed.

## Copy-rule check

- AI-speak: none of the banned words found. "Ecosystem" occurs once (a link or label), "leverage" is the finance term. Fine.
- Contractions and "we": present throughout.
- Uncertainty words: "we don't know yet" appears in every chapter's wrap-up and is used where warranted.
- Voice: mostly popular-science. Weak spots are the Ch. 10 open-items list and event-card headers ("Distress-level pricing"), which read as analyst shorthand.
- "Not investment advice": present in the footer and the Ch. 9 banner. MINOR: also add a short line under the hero toy-model caption.

## Summary by persona

- Bull persona would sign off once B1 (stack ignores amortisation and residual value), B2 (market-pricing block is all bearish) and B3 ("Right now just 12.5%" and the quietly cautious default) are fixed.
- Bear persona would sign off once S1 (the Huang note) and S2 (bull paragraphs assert, bear paragraphs hedge) are fixed.
- Both agree the structure (paired readings, never adding promises to cash, the correlation-not-fraud framing) is fair.

BLOCKING ISSUES: 5
