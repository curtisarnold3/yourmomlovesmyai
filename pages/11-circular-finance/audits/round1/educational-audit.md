# Educational audit: Chapter 11, "The Loop" (blind reader)

Method: read the rendered page text (headless Chrome DOM, tags stripped, 4,500 lines) and skimmed src/chapters/05.js for the on-interaction detail text. The page text already contained the per-chapter explanatory strings. I did not read research data, audits, API.md or tests.

## Step 1: my answers, from the page alone

1. **Recycled vs external cash.** Recycled cash started with a member of the loop and comes back to it. Example: a chipmaker invests in a customer, and the customer spends that money on the chipmaker's chips. External cash comes from outside the loop: lenders, outside investors, and real end customers. The page adds that lender money has to be repaid or earn a return from someone's future spending, so "external" does not mean "safe" or "real demand".

2. **Why a promise is not cash.** A backlog, backstop, guarantee or letter of intent is a signed agreement to pay or buy later. No money has moved. Backstops pay only if something goes wrong. Contracts can be renegotiated: the page says OpenAI's headline was "reportedly cut by more than half", and the Nvidia-OpenAI letter of intent shrank. Cash is money that exists or arrives. The lease analogy ($4,000 rent on $2,000 income) made this clear. So promises sit in their own dashed tally and are never added to cash.

3. **Why the asset slab shrinks but the claims don't.** The asset is the GPU, and a chip loses value as it ages (the page shows 3 to 6 year lives and falling rental prices). The claims are face-value amounts that were written down on day one, and they stay the same size. So the ratio of claims to asset value rises over time, with "no ceiling" once the chip is worth about zero.

4. **Several claimants on one GPU: same as double-pledging?** No. The page says layered claims are an ordinary capital structure, like a mortgage plus a home-equity line plus a contractor's lien, each with its own place in line. The real issue is correlation: nearly every layer is paid from the same future AI end-user spending, so they could all wobble together. Page says "not wrongdoing".

5. **"Revenue counted N times."** In the dinner table, one $20 bill passed around four people produced $80 of sales. Each sale is honest, but the real money is $20, so revenue was counted 4.0 times. In the AI toy model, each seed dollar shows up as 1.6x of Nvidia revenue, with about $60 of the $160 tracing back to Nvidia's own cash. I'm less sure how the 1.6x maps onto "counted 1.6 times". It looks like revenue per seed dollar, not literal double counting. The question to keep asking is how much came from outside the loop.

6. **The "up to $100B" Nvidia-OpenAI letter of intent.** It was a non-binding letter of intent from September 2025, with a headline of up to $100B, paid out gradually as each gigawatt was deployed. It never became a definitive agreement, so the actual amount is $0. In Feb 2026 it was replaced by a $30B equity investment in OpenAI's funding round. Reports in March 2026 quote Huang saying the full $100B was "probably not in the cards". The page shows both numbers because the gap between headline and actual is the point: headlines are promises, and they can shrink.

7. **The one number to watch.** The external share: of the cash moving around the loop, how much came from outside it. The toy estimate is 65.6% external and about 34% recycled. The plausible range is 41% to 79%, and only about 13% is paid by end users. I couldn't tell which of "external share" or "end-user share" the page really wants me to treat as the key number. It says external share, but then says lenders count as external and still need repaying.

8. **Fraud? Is it 2000 again?** The page says nothing implies wrongdoing. Layered claims are normal, and the point is correlation. It gives no verdict on 2000. Some things line up (vendors supporting their own customers, contingent promises behind growth). Some don't (buyers are richer, Nvidia makes far more cash, collateral life is unclear). Others "we don't know yet". It says it would rather say that than hand a verdict. It also presents the bull and bear readings side by side.

## Step 2: grading against edu_key.md

Graded by the lead (the critic's key read was denied): Q1 1, Q2 1, Q3 1, Q4 1, Q5 0.5 (1.6x vs 4.0x ambiguity), Q6 1, Q7 0.5 (66% external vs 13% end-user), Q8 1 = 7.0/8.

(Original note: NOT DONE. The attempt to read /private/tmp/claude-501/gauntlet/edu_key.md was denied by the permission classifier (reason given: unauthorized access). I did not try to work around the denial. The key was not read, so none of the 8 answers is graded. Self-assessment only (not a score): confident on Q1, Q2, Q3, Q4, Q6, Q8. Less sure on Q5 (mapping of 1.6x to "counted N times") and Q7 (which number is "the" number).

## Step 3: confusing terms and passages

Findings are provisional because the answers were not checked against the key.

| # | Chapter | Quote | Why | Plain-English rewrite | Severity |
|---|---|---|---|---|---|
| 1 | Ch1 to Ch3, header | "Revenue booked $160" vs "External cash $233.47" ; "Counted how many times 1.6x" | The dinner table makes "counted 4.0 times" literal. The AI version says 1.6x but this is revenue per seed dollar, and part of it is lender cash. External cash ($233) is also bigger than revenue ($160), which looks wrong until you realize it includes debt. Nothing bridges the two meanings of "N times". | "For every $100 Nvidia put in, $160 of Nvidia sales followed. $60 of that is Nvidia's own money coming back; $100 is lender money." | BLOCKING (Q5 core idea) |
| 2 | Ch3, Ch7, epilogue | "External cash (from outside the loop)" includes the $166.67 loan | A reader assumes external means real customers. The page only says later that only 13% is end users. | Split the label: "outside money, must be repaid" vs "paid by actual customers". | MINOR (affects Q7) |
| 3 | Epilogue | "Watch the share of revenue and cash that comes from outside the loop" | "Revenue" and "cash" are used interchangeably; there are two candidate numbers (66% external, 13% end users). | Pick one: "The share of cash that comes from outside the loop (66% in our toy)." | MINOR |
| 4 | Ch2 onward | "neocloud" | Used in headers and every chapter, never defined in one sentence. I only inferred "cloud landlord". | "A neocloud is a newer company that rents out racks of AI chips." | MINOR (high priority) |
| 5 | Ch2 | the 37 company cards with 16 lines of "Out of / Into" tallies each | Wall of text; I lost the thread. The takeaways (solid vs dashed lines) were clear without it. | Collapse the cards behind the map by default. | MINOR, "chapter lost me", cut |
| 6 | Ch3 | "special-purpose vehicle (SPV)", "first-loss slice", "loan-to-cost", "back-leverage", "LPs" | Defined in passing or only in knob tooltips. | SPV = "a separate legal box that owns the chips"; first-loss = "the slice that eats losses first"; back-leverage = "the fund itself borrowed from a bank". | MINOR |
| 7 | Ch4 | the 25-knob list with sourced footnotes (SOFR, DDTL, P/E, "Q3 FY27", "alt_values") | Too dense for a general reader; "SOFR", "DDTL", "P/E" unexplained. "alt_values" is a leaked code name. | Hide "More knobs" behind a toggle. Replace SOFR with "the bank base interest rate". | MINOR |
| 8 | Ch5 | "Mezzanine / converts", "recovers 100% now", "gap: +$190" | Jargon, and "gap" is not explained. | "Mezzanine = loans that rank below the senior lender"; "gap = how much the asset is worth minus all claims". | MINOR |
| 9 | Ch6 | "take-or-pay", "RPO", "backlog" | Well explained (gym membership). No change needed. | | none |
| 10 | Ch7 | letter codes I/E/L/B/S/C/G/P/W/H grid | Needs a legend lookup for every cell; heavy for a layperson. The bull/bear and "most tangled pairs" text carried the idea. | Lead with the three tangled pairs. | MINOR |
| 11 | Ch8 | "delayed-draw term loan", "non-recourse", "residual value guarantee", "ABS/CMBS", "sale-leaseback", "warrants" | The "Plain English" analogy per card helps, but the real-example paragraphs are acronym-dense (e.g. "SOFR+2.25%, rated A3 / A (low) DBRS"). | Move examples behind "Show real example". | MINOR |
| 12 | Ch9 | "haircut", "basis points / bp", "CDS", "P1 × o × (1 − shortfall)" | "Haircut" is never defined; the formulas show in the text. | "Haircut = the part you don't get paid." "CDS = insurance price on a company's debt; higher means more worried." | MINOR |
| 13 | Ch9, Ch10, epilogue | "Research note: Lucent revenue basis ... The page must name one basis"; "Avoid repeating unconfirmed personal allegations"; "(403)"; "pull a consistent series (Bloomberg/ICE)" | Builder and research to-do notes are visible to readers. The Huang "Nov 12 resignation" appears with no context. This undermines trust. | Delete the "research file's own open items" blocks and the research note box. | MINOR but should be fixed before ship |
| 14 | Ch10 / epilogue | Bull and bear lists appear twice, verbatim | Repetition; epilogue has a third copy. | Cut one copy. | MINOR |
| 15 | Ch1 vs Ch2 | "Actual so far: $0" for the Nvidia-OpenAI LOI next to "$30B Equity" | I could work it out (the $30B replaced it) but it takes the detail panel to see. | A one-line caption: "Replaced by $30B of actual equity." | MINOR (Q6) |

What I would cut: Ch2 per-company cards, Ch4 "More knobs", Ch7 full pair list, Ch10 research open items, the epilogue's duplicate bull/bear block.

Chapter that lost me: Ch2 (data dump), and partly Ch7 (letter grid) and Ch8's real-example paragraphs.

SCORE: 7/8 (lead-graded; two partial answers, both traced to blocking issue #1 and the epilogue ambiguity)
BLOCKING ISSUES: 1
