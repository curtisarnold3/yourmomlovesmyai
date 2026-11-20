# Educational audit: blind reader, page 11 (The Loop)

Reader profile: intelligent adult, no finance background. Source: rendered page text plus chapter strings revealed after interaction. Answers are from the page alone, in my own words.

## Answers

**1. Recycled cash vs external cash.**
External cash is money that comes from outside the group of companies in the loop: customers, lenders, outside investors. Recycled cash is money that started with a loop member (e.g. the chipmaker) and returns to it, like Nvidia investing in a customer who then buys Nvidia chips. One wrinkle I had to work out: "outside" includes lenders, but the page says lenders' money is not end-customer demand because it must be repaid. So there are really three piles (end customers, lenders/investors, recycled), and the word "external/outside" covers the first two.

**2. Why a promise is not cash.**
A promise (backlog, backstop, guarantee, letter of intent) is a contract about money that might move later. Nothing has been paid. A backstop only pays if something goes wrong, a letter of intent commits nothing, and a backlog is future rent. The page uses a lease analogy: you can sign for a $4,000 apartment on $2,000 income. It is not a lie, but it is not money in the bank. So promises get dashed lines and their own tally, never added to cash.

**3. Why the asset slab shrinks but the claims don't.**
The GPU wears out and its rental value falls, so the dotted "asset now" line drops each year. The claims are fixed face amounts (what each party is owed or put in), so they stay the same height unless someone pays them down. With "debt paydown" on, the senior loan shrinks as rent pays it. With it off ("rent stops"), claims stay full while the chip is worth almost nothing, so claims per $1 of asset balloons (>100 to 1). I understood this once I toggled paydown; the base picture alone doesn't say it.

**4. Several claimants on one GPU = double-pledging?**
No. The page says double-pledging means promising the same thing to two lenders without telling them. Layered claims, each with a known place in line, are normal (like a house with a mortgage plus a home-equity loan). The concern is correlation: nearly all layers are paid from the same future AI customer spending, so they rise and fall together.

**5. "Revenue counted N times," and dinner table vs AI model.**
Dinner table: four friends pass one $20 bill around, each books a $20 sale, so $80 of sales on $20 of real money = counted 4.0 times (sales divided by real money). AI model: the page divides Nvidia's revenue by the $100 seed cash and gets 1.6x ($160 revenue; $60 is Nvidia's own cash returning, $100 is lender money). The page itself says this is not double counting in the dinner sense and that the arithmetic differs. I understood both numbers separately; the relationship is "same question (how much is on the books vs how much real new money came in), different arithmetic." I found that bridge thin.

**6. The "up to $100B" Nvidia-OpenAI letter of intent.**
It was a non-binding Sept 2025 letter of intent (up to $100B as OpenAI deployed Nvidia systems). It never became a signed agreement, no money moved under it, and in Feb 2026 it was replaced by about $30B of actual equity, not tied to deployments. Both numbers are shown to separate headline from actual, a promise from cash. The page says "the gap between headline and actual is the point" (ch. 7) but never states in one sentence why that matters to a reader.

**7. The one number to watch.**
The share of the loop's cash that is paid by end customers, the people and businesses actually using AI. Toy estimate about 13% (range 3% to 31% one assumption at a time). It means how much of the loop still depends on real customers showing up. A low share is not proof anything is wrong. It says how much rests on future demand. It comes from a toy model with an assumed 50% knob, not a measurement.

**8. Fraud? 2000 again?**
Not alleged. The page says nothing implies wrongdoing; layered claims are ordinary and not double-pledging. On 2000: some things line up (vendors supporting customers, contingent promises), some differ (buyers are richer, vendor has large cash flow, collateral may be shorter-lived), and others are "we don't know yet." Explicitly no verdict.

## Confusions

| # | Quote / passage | Chapter | Why confusing | Plain rewrite | Severity |
|---|---|---|---|---|---|
| 1 | "Outside money" for both customers and lenders, vs "outside" cash | Hops 2/6, ch 4, epilogue, ch 10 | Two meanings. Ch 10 bull reading "most of the cash comes from outside the vendor" sits next to 13% customers. | Use "money from outside the loop" only for customer+lender, and always say "of which customers ~13%." | MINOR |
| 2 | "It isn't double counting in the dinner-table sense... how much of the rest started with the chipmaker. We'll get there in a few chapters" | Ch 1 | Q5 bridge is vague; the promised payoff is never clearly delivered. | "Dinner table: 4.0x sales per real dollar. AI: 1.6x. Of the $160, $60 is Nvidia's own money coming back." | MINOR |
| 3 | "loan-to-cost 62.5%", "first-loss slice", "SPV" | Hop 2 | Defined inline, OK, but fast. "Special-purpose vehicle" is a legal-box idea a lay reader may not hold. | "a separate company set up just to own the chips" | MINOR |
| 4 | "back-leverage... claims nest inside claim #2 and add claimants, not dollars" | Hop 8, ch 5 | Hard to grasp. | "The fund borrowed against its loan, so one loan now has two sets of lenders behind it." | MINOR |
| 5 | "paper value", "price-to-earnings multiple", "recurring share" | Hop 4, ch 4 | "Paper value" is explained, but the $538 number is unintuitive; knobs ("Share of new profit the market treats as repeating") are opaque. | Fine for core idea; hide advanced knobs. | MINOR |
| 6 | "Seven layers (some of chapter 3's nine claims are grouped)" | Ch 5 | Nine vs seven vs eight claimants is confusing. | Show one count. | MINOR |
| 7 | "claims ... per $1 of GPU: 1.00 ... $1.84 ... >100 to 1" | Ch 5 | Three different ratios; the ">100 to 1" worst case is startling and a reader may not trust it. Core idea needs the toggle to be understood. | Lead with a sentence: "If rent stops, the chip is worth ~0 but the debts are still owed." | MINOR |
| 8 | "RPO", "backlog", "take-or-pay" | Ch 6 | Defined well. | none | none |
| 9 | "hyperscaler", "neocloud" | Ch 2-8 | Neocloud defined repeatedly; "hyperscaler" never defined. | "hyperscaler = a giant cloud company like Microsoft or Amazon" | MINOR |
| 10 | "LOI to fund:", "Warrant", "CDS", "bp", "SOFR", "DDTL", "ABS/CMBS", "capex", "P/E", "GAAP", "residual value guarantee", "haircut", "mezzanine/converts" | Company cards, ch 8-10 | Most defined at point of use. SOFR/DDTL defined in ch 8 only; ch 9 mentions "SOFR bank rate" in knob; "mezzanine" appears in the claims list with no gloss; "GAAP" and "CLEC" appear unexplained. | Gloss "mezzanine = debt that ranks below the senior loan", "CLEC = small upstart phone carrier". | MINOR |
| 11 | Company cards (about 40) of "Out of X / Into X, External cash none..." | Ch 2 | Dense, repetitive "headline $X; actual $A to $B (+1 undisclosed)" strings. Unreadable to a lay reader. | Cut or collapse behind a toggle. | MINOR |
| 12 | Stress-test waterfall: "claim c7", "P1 × o × (1 − shortfall)", "Paper markdown of neocloud stake" | Ch 9 | Variable-style formulas and claim codes in tooltips; the plain-words paragraph is OK. | Remove formulas from reader tooltips. | MINOR |
| 13 | Market-events list (Oracle BBB-, CoreWeave CDS 1,280 bp, Huang resigns, Senate hearing) | Ch 9 | Not inputs to the model, many jargon items, and the Huang/Senate items feel off-topic. | Cut or trim to 3 headline items. | MINOR |
| 14 | "Hop 1... Recycled", Hop 3 "$60 of it traces to Nvidia's own equity and $100 to lender cash" with total $160 but seed is $100 | Ch 3 | I stumbled that $100 seed yields $160 revenue before reading the lender part. Resolved on a re-read. | Add one line: "Nvidia's own $100 plus lenders' $166.67 = $266.67 spent; 60% goes to Nvidia = $160." | MINOR |
| 15 | Toggle-dependent explanation for shrinking asset (Q3) | Ch 5 | Without interaction, text says only "chip loses value" and the claims point is made in the worst case line. | Add a static sentence near the picture. | MINOR |

## Chapters that lost me
- Ch 2 company cards (data dump). Not blocking since the intro, legend and key example (Nvidia-OpenAI) taught the point.
- Ch 8 (seven structures): each card is understandable on its own via the "Plain English" analogy, but I couldn't tell how they connect to the loop beyond the closing line.
- Ch 9 market-events list.

## Would cut
- The 40 company cards' "none/headline/actual" rows.
- The pair grid and every-pair list in ch 7 (the three examples suffice).
- Ch 9 market-event lists, especially the CEO resignation and Senate hearing items.
- Advanced knobs in ch 4.

## Internal builder-note look
Nothing visible reads as raw builder notes. Close calls: "source" link labels such as "Benzinga: Benzinga article", "cryptobriefing.com article", "Vantagemarkets.com article" (MINOR, unhelpful source labels); the "Reported/Calculated/Hypothetical/Verified/Unverified" badges are explained by the header line but not strictly defined anywhere I saw. The status tag "source" repeated with no content. Sentence in ch 4: "no source gives the exact number" (reader-facing, fine).

## NaN / undefined / em-dash numbers
None found in the rendered text (no NaN, undefined, null, Infinity). Cards that say "none" or "not disclosed" are intentional. Ch 5 ">100 to 1" is a deliberate cap.

## Blocking assessment
No question left me without an answer. Q5's bridge and Q3 were the weakest; I got both, but Q3 needed the toggle semantics and Q5 needed the "different arithmetic" caveat. None rises to BLOCKING in my judgment.

## SELF-ASSESSED CONFIDENCE
- Q1 recycled vs external: 85% (the "outside" naming overlap is the risk)
- Q2 promise not cash: 95%
- Q3 slab shrinks / claims don't: 75%
- Q4 several claimants vs double-pledging: 95%
- Q5 revenue counted N times / dinner vs AI: 70%
- Q6 $100B LOI to $30B, why both: 85% (the "why both" is partly inferred)
- Q7 one number to watch: 90%
- Q8 fraud / 2000: 90%

BLOCKING ISSUES: 0
