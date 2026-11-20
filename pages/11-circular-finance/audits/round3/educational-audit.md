# Blind-reader audit: 11 Circular Finance

Reader: intelligent adult, no finance background. Source: rendered page text, plus the explanatory strings in src/chapters/*.js that appear after interaction. I did not watch the animations or SVG pictures, only read their captions and text.

## My answers (from the page alone)

1. **Recycled cash vs external cash.** External cash comes from outside the loop: customers, lenders, outside investors. Recycled cash starts with someone in the loop (e.g. the chipmaker) and returns to that same source, as when a chipmaker invests in a customer who then buys the chipmaker's chips. The dinner table shows it: one $20 bill going round is "recycled". A guest paying real money is "external". Lenders count as external, but the page says that money must be repaid, so it is not the same as customer demand.

2. **Why a promise isn't cash.** A promise (backlog, backstop, guarantee, letter of intent) is a contract about money that may move later. Nothing has been paid. The page uses the lease analogy: signing $4,000/month rent proves nothing about whether you will earn it. Backstops and guarantees are also conditional, so they pay only if something goes wrong. Promises can also shrink. The $1.4T headline reportedly dropped to $600B. So the page keeps them in a separate tally and never adds them to cash.

3. **Why the asset slab shrinks but the claims don't.** The chip wears out and loses value, because of its useful life and falling rental prices. The paper claims (loan, equity and so on) stay at the face value of what was put in. In the "rent stops" case nobody pays the loan down, so the claims stay the same while the asset shrinks. The ratio of claims to asset therefore climbs. With "paydown on", the senior loan does shrink as rent pays it. I only got this from the toggle text. The headline for the picture itself doesn't say it outright.

4. **Several claimants on one GPU vs double-pledging.** No, per the page. Several layers (senior lender, equity and so on) on one asset is an ordinary stacked structure with a place in line for each, like a mortgage plus a home-equity loan. The page's concern is correlation: all the claims are paid from the same future AI spending, so they wobble together. It never defines "double-pledging". I guessed it means promising the same thing to two people with no ranking.

5. **"Revenue counted N times" and the dinner-table vs AI number.** At the table, four sales of $20 on $20 of real money means revenue is counted 4.0 times: $80 of sales divided by $20 of real money. Nobody lied, but the sales aren't new demand. For the AI model, $100 of seed cash gives $160 of chipmaker revenue, so 1.6x. The page says that is not the same count. The part above 1x is paid by lender cash, which is new outside money. The open question is how much of the rest started with the chipmaker ($60 of the $160 in the toy). Both are the ratio "sales on the books vs real money that entered", but the AI one isn't literal double counting.

6. **The "up to $100B" letter of intent.** Nvidia's Sept 2025 non-binding letter of intent said "up to $100B" for OpenAI. It never became a signed deal, so $0 moved under it. In Feb 2026 it was replaced by about $30B of actual equity, and a Huang quote says the $100B was "probably not in the cards". The page shows both (headline $100B, actual $0 / $30B) to show the gap between a headline promise and money that actually moved. That gap is the point.

7. **The one number to watch.** The share of the loop's cash that is paid by end customers, meaning the people and businesses actually using AI. The toy estimate is about 13%, with a range of 3% to 31%. It tells you how much of the loop still depends on future customers showing up. A low number doesn't mean anything is wrong. Lenders' money is outside money but isn't end-user demand, because it must be repaid.

8. **Fraud? 2000 again?** No verdict either way. The page says nothing implies wrongdoing, and layered claims are ordinary. Some things rhyme with 2000, such as vendors funding their customers and contingent promises. Some don't: the buyers are richer, Nvidia's cash flow is large, and chips last a shorter time than fiber. Others it can't know yet, because the ending isn't written. It repeats "we don't know yet" and says it would rather say that than give a verdict.

## Confusing terms and passages

| # | Quote | Chapter | Why | Plain-English rewrite | Severity |
|---|---|---|---|---|---|
| 1 | "ranked claims per $1 of hard asset" and "claims per $1 of senior debt" | 5 | Jargon stacked on a ratio, and the page itself says "(constant)" and "a very large number". | "For every $1 the chip is worth, how many dollars of people have a first claim on it?" | BLOCKING (Q3 core idea) |
| 2 | "reaches a very large number at the end of its useful life" | 5 | Reads like a placeholder. It's a divide-by-near-zero case. | "...becomes enormous, because the chip is worth almost nothing but the claims are unchanged." | BLOCKING (same, because Q3 hinges on it) |
| 3 | "double-pledging" | 5, 4 | Used repeatedly as the thing it is "not". It is never defined. | "Promising the same asset in full to two different lenders who don't know about each other." | MINOR |
| 4 | "(the nine claims from chapter 3 become seven layers here: the fund's investors sit inside the senior loan layer...)" | 5 | Reconciling 9 vs 7 is dense. Looks like a note to the builder. | Cut, or "Some claims are grouped, so you see 7 layers." | MINOR |
| 5 | "Outside money", "outside money brought in (not all of it customers)", "revenue funded by outside money $100" vs "outside money: end customers $44.53" | 3 | "Outside" means lenders in one place and customers in another. Reader sees $100, $233 and $44 and can't tell them apart. | Name them "new money from lenders/investors" and "money from end customers". Never use bare "outside". | MINOR (mostly clear once Q7 explained) |
| 6 | "Revenue funded by recycled cash $60 / outside $100" | 3 | Conflicts with the later "13% from customers" number unless you read carefully. | One sentence tying $100 lender-funded to the later 13%. | MINOR |
| 7 | "RPO (remaining performance obligations)" | 6 | Defined as "a signed promise to buy later", but the acronym text still appears in many lines (Microsoft RPO, Oracle RPO...). | Use "backlog" throughout. | MINOR |
| 8 | "back-leverage", "LPs", "first-loss slice", "haircut", "SPV", "DDTL", "SOFR" | 3, 4, 8, 9 | All glossed once. Several are glossed only in the chapter after they first appear. | Fine. Repeat the gloss on first use in each chapter. | MINOR |
| 9 | "loan-to-cost", "mezzanine / converts", "margin debt", "reflexive" | 3, 5 | Explained briefly but heavy. | "Share of the bill that is borrowed", "in-between debt that can turn into shares". | MINOR |
| 10 | Chapter 4: about 30 knobs with source-note paragraphs | 4 | The chapter lost me. I could follow the idea ("borrowing makes $100 build $267") but not what each knob does. | Hide all but 4-5 headline knobs behind "advanced". | MINOR (core idea survived) |
| 11 | Chapter 2 network of 38 parties and dozens of company cards ("none / none / headline $X; actual $Y to $Z") | 2 | Lost me as a map. The legend and the Nvidia/OpenAI card carried the lesson. | Show 3 flagship deals, not the full grid. | MINOR |
| 12 | "headline $254.8B (+1 undisclosed); actual $1.56B to $155.72B" | 2 | Ranges and "+1 undisclosed" are unreadable to a lay reader. | "Announced $255B. Confirmed so far: between $1.6B and $156B." | MINOR |
| 13 | "Claim c7... scheduled / paid / haircut (hypothetical: P1 × o × (1 − shortfall))" | 9 | Formula strings and variable names (P1, o, m) shown to reader. | Remove the formulas from visible text, or show them in a "math" fold. | MINOR |
| 14 | "Revenue basis 1, run-rate, company statement (at least) / Revenue basis 2, gross" | 6 | Two revenue bases, and the reader can't tell which one to trust. | "Anthropic says $30B a year. Another count that includes partner sales says $65B." | MINOR |
| 15 | "DDTL 4.0: non-recourse delayed-draw term loan, matures Mar 2032, rated A3..." and "[SOFR is a benchmark...]" repeated verbatim 4+ times | 8 | Source-note strings leak onto the page. They are repetitive and truncated ("percentage..."). | Show only the plain-English line below. | MINOR |
| 16 | "source describes it as: Nvidia total maximum guarantee exposure at Oct 25, 2026 (company statement: $3.5B land/power/shell...)" | 6 | Raw dataset text on page. | Cut, keep "$118B ceiling, nothing paid." | MINOR |
| 17 | "Hop 8: 'No money has moved' / 'adds claimants, not dollars'" | 3 | Idea is good but the label sits oddly next to $111 and $56 figures. | Keep. Add "(just how the $167 loan was funded)". | MINOR |
| 18 | "Jensen Huang resigns... The filing gave no reason." Also Senate hearing note. | 10, End | Dropped in with "we don't know" and doesn't connect to the argument. | Cut, or one line on why it matters. | MINOR |
| 19 | "We left out one report about banks struggling to sell some Oracle-linked debt because we couldn't confirm it." | 9 | Reads as a builder note. | Cut. | MINOR |
| 20 | "Cash, outside-loop stakes and promises are shown separately and never added together." printed on every card | 2 | Repeated on 30+ cards. | Say once. | MINOR |

## Chapters that lost me
- **Chapter 4 (leverage calculator)** and **Chapter 2 (the network and cards)** lost me partly. The main ideas survived, and I recorded them under MINOR.
- **Chapter 5**: the picture's message ("claims stay, asset shrinks") is only clear if you click the toggle. The text around it is a ratio puzzle. I rate this BLOCKING for Q3.
- The rest (1, 3, 6, 7, 9, 10, End) were followable.

## Cut candidates
- The Chapter 2 company-by-company cards.
- The "Sources" strings that appear inside body text (DDTL, SOFR repetitions, "source describes it as").
- Formula text (P1 × o × ...) in Chapter 9.
- The CEO resignation and Senate hearing notes.
- The "Show the math: geometric series" block in Chapter 3. It is fine for experts but adds nothing for a lay reader.

## Text that looks like internal builder notes
- "(the nine claims from chapter 3 become seven layers here...)"
- "We left out one report about banks struggling to sell some Oracle-linked debt because we couldn't confirm it."
- "The first two lists use the same layout and the same rules for dates and status tags."
- "Autoplay is off because your device asks for reduced motion."
- "38 parties, 60 deal lines... The counts come straight from the data."
- "Claim c7 / c8, c2", "hypothetical: P1 × o × ..."
- "no source gives the exact number" and "(secondary reading of Meta's annual report)"
- "Kind of money", "Hide company cards / Pause pulses" (UI labels left in the text flow)
- Mismatched figures: 12.5% in Chapter 4 and 13% at the end. They are the same number rounded differently, but the reader sees two numbers.

## SELF-ASSESSED CONFIDENCE
1. Recycled vs external: high
2. Promise is not cash: high
3. Slab shrinks, claims don't: medium (only from toggle text, and the ratio wording is confusing)
4. Several claimants vs double-pledging: medium (the page never defines double-pledging)
5. Revenue counted N times and dinner-table link: medium-high
6. $100B LOI to $30B, why both: high
7. The one number: high
8. Fraud / 2000 conclusion: high

BLOCKING ISSUES: 2 (both in Chapter 5, items 1 and 2)
