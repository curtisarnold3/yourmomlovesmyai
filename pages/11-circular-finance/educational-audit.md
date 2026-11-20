# Educational audit: blind reader, page 11 (The Loop)

Read from the rendered page text plus chapter explanatory strings. Answers are in my own words, from the page alone.

## Answers

1. **Recycled vs external cash.** External (outside) cash comes from people or institutions that are not part of the chipmaker/cloud/lab circle: customers, lenders, outside investors. Recycled cash started with a member of the loop and comes back to it, e.g. a chipmaker invests in a customer and the customer spends it on the chipmaker's chips. Lenders' money counts as outside, but it must be repaid, so it is not the same as customers paying. I could not tell exactly how the page treats a mixed round beyond "shown as a split."

2. **Why a promise is not cash.** A promise (backlog, backstop, guarantee, letter of intent) is a signed or stated plan to pay later. No money has moved, and it may never be paid in full. A backstop only pays if someone else fails. A letter of intent commits nothing. Promises can also shrink (the page says OpenAI's headline reportedly fell from $1.4T to $600B). The lease analogy ($4,000 rent on a $2,000 income) makes the point: real contract, not money in the bank.

3. **Why the asset slab shrinks but claims don't.** The GPU wears out and rents fall, so it is worth less each year. The debts and ownership claims stay at their original face value unless rent keeps paying the loan down. If rent stops, claims stay full while the chip's value heads toward zero, so claims per $1 of chip rise past 100 to 1. With "debt paydown" on, the senior loan does shrink, so the gap is smaller. The claims that never shrink are equity and the dashed ones.

4. **Several claimants on one GPU vs double-pledging.** No. Double-pledging is promising the same thing to two lenders without telling them. Layered claims, each with its own place in line and visible to all, are an ordinary capital structure, like a mortgage plus a home-equity loan. The page's real worry is that all of them are paid from the same future AI user spending, so they could fail together (correlation).

5. **"Revenue counted N times."** At the dinner table one $20 bill makes four sales, so $80 of sales on $20 of real money is 4.0x. The AI version is 1.6x: $160 of chipmaker revenue per $100 of seed cash. About $60 of it traces to the chipmaker's own money and $100 to lender cash. So it is not literal double counting; lenders' cash explains the part above 1x. Both ask how much of booked revenue came from outside. I could only partly tell how the two numbers should be compared. The page says they are "not literally the same count."

6. **The $100B Nvidia-OpenAI letter of intent.** It was a non-binding Sept 2025 letter saying Nvidia intended to invest up to $100B as OpenAI deployed its systems. It never became a signed deal and $0 moved under it. In Feb 2026 it was replaced by about $30B of actual equity in a funding round. Both numbers are shown because the gap between headline and actual is the lesson: a promise versus cash.

7. **The one number to watch.** The share of the loop's cash paid by end customers (people and businesses actually using AI). The toy model says about 13% (range 3% to 31%). A low share means much of the loop still depends on future customers showing up. It does not mean anything is wrong. It is a toy assumption, not a measurement.

8. **Fraud? 2000 again?** The page says nothing implies wrongdoing: layered claims are ordinary, and "nobody lied" in the dinner table story. It gives no verdict on 2000. Some things line up (vendors financing customers, contingent promises), some differ (buyers are richer, the vendor has far more cash, collateral life is different), and some are unknown ("we don't know yet").

## Jargon and confusing passages

| # | Quote | Chapter | Why | Plain rewrite | Severity |
|---|---|---|---|---|---|
| 1 | "revenue counted N times" / "Revenue counted 0.0x" vs "1.6x ... isn't double counting in the dinner-table sense" | 1, 3 | Same phrase means two different things (4.0x literal vs 1.6x with lender cash). The reader has to hold both. | "On the table, $80 of sales from $20 of money. In the AI model, $160 of revenue from $100 of seed, and $100 of that is borrowed money, not repeat counting." | BLOCKING (core idea of Q5 muddy) |
| 2 | "loan-to-cost 62.5%", "first-loss slice" | 3, 4 | Used before being plainly explained (the gloss is a parenthetical) | "Lenders cover 62.5% of the bill. The owners' own money takes the first losses." | MINOR |
| 3 | "SOFR bank rate" (ch 4 knob) | 4 | Defined only later in ch 8 | "A standard short-term bank interest rate" | MINOR |
| 4 | "back-leverage" / "Fund's own bank borrowing" knob | 4 | Defined in ch 3 hop 8; the ch 4 knob assumes you remember | "The fund borrowed from a bank too, so more parties claim the same loan" | MINOR |
| 5 | "SPV", "DDTL", "non-recourse", "ABS/CMBS", "residual value guarantee", "take-or-pay", "haircut", "bp", "CDS" | 3, 8, 9 | All defined in context, but ch 8 is very dense, with seven structures at once | Fine, but ch 8 is heavy | MINOR |
| 6 | "reflexive", "mark-to-market", "paper value" | 3 | Explained, but in a rush | "Prices and borrowing push each other down" | MINOR |
| 7 | "Claims / claimants 9 / 8", "claim #6", "c7", "c8, c2" | 3, 9 | Internal claim IDs shown to the reader | Drop the c-codes | MINOR |
| 8 | Badges Reported / Verified / Hypothetical / Calculated / Unverified | all | The hero says "tap a badge", but I never learned what each means in a sentence | Add a one-line legend | MINOR |
| 9 | "Share of new profit the market treats as repeating", "Rental contract size versus the bill" | 4 | Knobs with no plain meaning | Cut from the default view | MINOR |
| 10 | "NaN%" in "If the lab's revenue grows NaN% a year", and "n/a" gauges | 6 | A visible bug, or an extraction-timing artifact; I can't tell | Fix or confirm | MINOR (uncertain) |
| 11 | "— of seed cash → ~— of lender debt → ~— of Nvidia revenue" | hero | Placeholder dashes in the headline sentence; may fill in later | Fill in or hide until ready | MINOR (uncertain) |
| 12 | 12.5% (ch 4, 10) vs "about 13%" (epilogue) vs 65.6% / "66%" | 4, 10, End | Rounding differs between places | Pick one form | MINOR |
| 13 | Outside money 66% vs end-customer 13% | 10, End | Easy to confuse. Handled, but the reader needs the distinction twice. | Keep both labels visible together | MINOR |

## Chapters that lost me

- **Ch 8 (off the balance sheet)** and **ch 7 (pair grid)** are too much detail for a newcomer. The core idea survived (risk hides in separate legal boxes; roles overlap) but I skimmed.
- **Ch 2** is a 39-company map. The ideas (cash lines vs dashed promise lines) came through, but the hidden company cards are about a thousand lines of near-duplicate text.
- Ch 4's 30-plus knobs.

## What I'd cut

- Ch 2 company cards (collapse by default). Ch 4 advanced knobs. Ch 7 full pair list. Ch 8 "real example" blocks (SOFR spreads, CB-5, tranche detail).
- Ch 9 news feed. Items such as the Nvidia CEO resignation and the Senate hearing are off the topic of the loop and read as gossip.
- Ch 10 long list of named quotes. The 190-source list is fine for a footer.

## Text that reads like internal builder notes

- "We chose 12 times profit ... No source gives the multiple", "no source gives a number", "Our data holds only deals we could source", "The counts come straight from the data", "We left out one report ... because we couldn't confirm it", "The first two lists use the same layout and the same rules for dates and status tags."
- Formula strings: "P1 × o × (1 − shortfall)", "seed_usd = 100", "D = E × L/(1−L)". Claim IDs "c7", "c8, c2". "Autoplay is off because your device asks for reduced motion."
- Source labels such as "Yahoo Finance: Yahoo Finance article, Nov 19, 2026 (1 of 2)", "X (The Information post): Status", "SEC EDGAR: Q3fy27pr", "T26083ke10 k405.txt", "cryptobriefing.com: Cryptobriefing.com article", "Benzinga: Benzinga article".

All of these are MINOR.

## SELF-ASSESSED CONFIDENCE

1. Recycled vs external: medium-high
2. Why promises aren't cash: high
3. Slab shrinks, claims don't: medium-high
4. Several claimants vs double-pledging: high
5. Revenue counted N times, dinner table vs AI: medium
6. $100B letter of intent vs $30B: high
7. One number to watch: high
8. Fraud / 2000: high

BLOCKING ISSUES: 1
