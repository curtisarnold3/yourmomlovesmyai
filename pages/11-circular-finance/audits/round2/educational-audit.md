# Blind-reader audit: page 11 (The Loop)

Read from rendered page text plus visible chapter strings. No finance background assumed.

## Answers (own words, from the page alone)

1. **Recycled vs external cash.** External cash comes from outside the loop: customers, lenders, outside investors. Recycled cash started with a loop member (e.g. the chipmaker) and comes back to it (the chipmaker invests in a customer, the customer buys the chipmaker's chips). Lender money counts as outside but "must be repaid or earn a return", so it is not the same as customer demand. I understood this well after ch.1 and ch.3.

2. **Why a promise is not cash.** A contract/backstop/guarantee/LOI is an agreement that money might move later, possibly never or partly. Nothing has moved yet. Example: Nvidia says it has paid nothing under any guarantee; the "$100B" letter was never delivered. So promises sit in their own tally (dashed ghosts) and are never added to cash. The apartment-lease analogy helped. (I only half understood what "backstop" is: "a promise to buy unused capacity or cover rent".)

3. **Asset slab shrinks, claims don't.** The GPU wears out and rents for less, so what it is worth falls each year. The loan, equity and other claims are fixed dollar amounts, so they stay the same height. So claims per $1 of asset grows (2.05 on day one, 7.02 after 3 years). I could tell it depends on the "rent stops" toggle: with rent paying the senior loan down, the loan shrinks too and the gap is smaller. I did not fully follow why the asset line goes to about zero at end of life while the dotted line is "what it's worth at year 0".

4. **Several claimants on one GPU = double-pledging?** No. The page says layered claims (like mortgage + home-equity line + lien) are an ordinary structure; each has its own place in line. The real issue is that nearly all layers are paid from the same future AI end-user spending, so they could fail together (correlation, not wrongdoing).

5. **"Revenue counted N times".** Dinner table: $80 of sales on $20 of real money = counted 4 times; the same bill was reused. AI model: $1.6 of chipmaker revenue per $1 of seed cash. The page says this is NOT the same count: the extra 0.6x is paid by lender cash, not by the same dollar going round. Of $160 revenue, about $60 traces to the chipmaker's own cash and $100 to lenders. I got the gist but the relationship is stated as "not literally the same count" without a crisp bridge (see findings).

6. **Nvidia-OpenAI "up to $100B" letter.** A non-binding letter of intent (Sept 2025) that never became a real agreement. It was replaced in Feb 2026 by about $30B of actual equity. The page shows both because headline $100B vs actual cash moved ($0 on the letter, $30B equity) is the "promise vs cash" point. Slight muddle: ch.2 says "Actual so far: $0" for the letter, and separately $30B equity as another line. Also a stray note that a "preliminary deal" for $100B more is "unconfirmed".

7. **The one number to watch.** The share of the loop's cash paid by end customers (real users of AI). Toy estimate about 12.5% (about 13%), range about 3% to 31% one assumption at a time. Low does not mean something is wrong; it means a lot of the loop still depends on future customers showing up.

8. **Fraud? 2000 again?** Page says nothing here implies wrongdoing; layered claims are not double pledging; it is about correlation. On 2000: compares Lucent/Nortel vendor financing; some things line up, some don't, others unknown. Explicit "no verdict". Closing: cannot say whether the loop mostly stands on real demand or mostly circles. Clear.

## Confusion log

| # | Quote / passage | Chapter | Why it confused me | Plain rewrite | Severity |
|---|---|---|---|---|---|
| 1 | "Customers ~$45 · Lenders and investors ~$189 · Recycled ~$122" vs "revenue 1.6x" vs "12.5% / 53% / 34%" | Header / ch.3 / End | Three different splits of "money" with different denominators (per $100 seed vs share of one-lap cash). Hard to tell which numbers are the same pile. Also $45+$189+$122 = $356 but the ending says 12.5/53/34 %. | One line: "Of the $X of cash moving in one lap, $Y is customers, $Z lenders, $W recycled" with the same units each time. | MINOR |
| 2 | "It isn't double counting in the dinner-table sense: lenders' cash pays for the part above 1x" | Intro / ch.1 / ch.3 | Q5 hinges on this. The relation between "4.0x" and "1.6x" is told as "not literally the same" but never given the plain statement: dinner table = same bill reused; AI = new lender money plus some recycled. | "Dinner table: one bill, four sales. Here: $100 of the chipmaker's cash plus $167 of borrowed money gets $160 of revenue; the question is how much was ever new customer money." | MINOR (borderline, I could still answer) |
| 3 | "RPO", "backlog" | Ch.6 | Defined once ("remaining performance obligations") but then numbers like "Oracle RPO $664B" appear without recalling it. | "Signed contracts not yet delivered." | MINOR |
| 4 | "backstop", "guarantee", "warrant", "LOI" | Ch.2 | Defined later (ch.8 for backstop and warrant) but used in ch.2 labels (B, G, W, ?). I inferred from context. | Add one-line legend defs in the ch.2 deal-type key. | MINOR |
| 5 | "SPV", "loan-to-cost", "first-loss slice", "back-leverage", "LPs", "mark-to-market", "mezzanine / converts", "senior secured", "take-or-pay", "haircut", "CDS", "bp", "SOFR", "DDTL", "ABS/CMBS" | Ch.3-10 | Most are defined at first use in a parenthesis. Exceptions: "mezzanine / converts" (never defined), "SOFR" (never defined, appears in many cards), "mark-to-market"/"mark" and "reflexive" (used without a plain definition), "senior" (inferred from "paid first"). | mezzanine = "debt that gets paid after the senior loan"; converts = "bonds that can turn into shares"; SOFR = "the bank base interest rate"; reflexive = "price drops feed back on themselves". | MINOR |
| 6 | "Claims per $1 of hard asset 2.05" | Ch.5 | I understood the idea but the number mixes real claims with promises ("lab's contract right") and dashed slabs "not ranked against this asset". Then "counting only cash claims it's $1.00". Which one is the headline is unclear. | Lead with the cash-only figure; explain the 2.05 as including promises. | MINOR |
| 7 | "Seven layers of paperwork" (ch.5) vs "9 claims held by 8 parties" (ch.3) vs picture showing seven slabs including dashed ones | Ch.3/5 | Counting mismatch makes me doubt I understand what a "claim" is. | Say once why 9 claims become 7 layers (some are paid from elsewhere). | MINOR |
| 8 | "We'll follow it through eleven stops" while labels say "Hop 0 / 10" | Ch.3 | Count mismatch: 11 stops, 10 hops (0 to 10). Fine but jarring. | "Ten hops." | MINOR |
| 9 | Chapter 2 header "38 parties, 58 deal lines: 20 are cash..., 35 are promises, and 2 are stakes outside" | Ch.2 | 20+35+2 = 57, not 58. | Fix the count or explain. | MINOR |
| 10 | Ch.2 map: dense network, 40+ company cards with long cash/promise tables | Ch.2 | Chapter lost me as an explanation. Only the "solid vs dashed" takeaway and the OpenAI letter card worked. The card tables ("Out of Nvidia / Into Nvidia ... headline $254.8B; actual $1.56B to $155.72B") are unreadable to a newcomer. | Cut the per-company tables or collapse by default. | MINOR (but chapter is mostly skippable) |
| 11 | Ch.4 knob help text: "Q3 FY27 GAAP gross margin... Burry argues..." with long source citations | Ch.4 | A wall of research detail inside the "?" popups. The core idea (borrowing multiplies what a seed can build) is clear from the waterfall, but the ~30 knobs overwhelmed me. | Keep 5 main knobs visible; hide the rest. | MINOR |
| 12 | Ch.9 "paper markdown of neocloud stake -$58.06", "haircut", "loan-to-value 87% recovery 100%", the payment waterfall | Ch.9 | I followed "equity is paid last and takes the loss first" but could not tell whether the scenario was good or bad for Nvidia; "different kinds of effect: not added together" left me without a bottom line. | End with one plain sentence: "In this squeeze lenders are fine; equity (including Nvidia) loses about half its payout and $58 of paper value." | MINOR |
| 13 | Ch.10 "Customer-financing commitments 28% restated vs 24% original" box | Ch.10 | Detailed accounting caveat I could not use; lost me. | Cut to one sentence. | MINOR |
| 14 | "About 13%" in the end chapter vs "12.5%" elsewhere, and "paid by end customers" vs ch.4 "Outside money: end customers $44.53" and header "Customers ~$45" | End | Two different customer figures ($45 of what? vs 12.5% of cash). I assume different denominators but the page does not say. | Use one number for end customers everywhere, or label the denominator. | MINOR |

## Chapters that lost me
- Ch.2 (the network map and the per-company cards): lost the detail, kept the one lesson.
- Ch.9 (stress-test waterfall): followed the mechanics partly, not the "so what".
- Ch.4 mostly fine at the top level, too many knobs underneath.

## What I'd cut
- Per-company cards and the "Out of / Into" tables in ch.2 (collapse by default).
- Source-citation text inside knob "?" popups (move to Sources).
- Lucent restated vs original ratio box (ch.10).
- The geometric-series "Show the math" and symbols (S_{n+1}, rho, GM, r) in ch.3; the grid of 40 pairs in ch.7.

## Text that reads like internal builder notes
- Ch.2 OpenAI card: "Original Sept 2025 press release not re-fetched in this pass; the post-announcement history comes from press." (BLOCKING? No, MINOR. It is a research-pass note, not reader text.)
- "A Yahoo Finance piece describes a 'preliminary deal'... unconfirmed."
- Ch.4 knob popups: "Not in the research", "The research gives CoreWeave Q3 2026 revenue ... but not cash operating cost", "Two datapoints in the research", "Sources: ...56eec258 62fb 4929 9e93..." (raw IDs).
- Ch.8 real-example blocks: "Since then:" lines and "we could not match to a filing", "Sources disagree on the pace."
- Ch.5/ch.3: formula strings "seed_usd = 100", "D = E x L/(1-L)", "P1 x o x (1 - shortfall)" in tooltips and the stress waterfall.
- Ch.2 right-hand cards leak "(+1 undisclosed)", "(+1 unknown)".
- Source names like "Tech Times: Nvidia openai investment shrinks 100b 30b compute lock war continues" (slugified titles).

## Findings by severity
- No finding caused a wrong or missing answer on any of the 8 questions. All items above are MINOR. The closest to blocking: #2 and #14 (relation of the 1.6x to the 4x, and mismatched "customers" figures) because Q5 and Q7 depend on them; I still answered both.

SELF-ASSESSED CONFIDENCE: confident on Q1, Q2, Q4, Q6, Q7, Q8. Fairly confident on Q3 (unsure about the asset line's end-of-life behavior and the toggle). Least sure on Q5 (the bridge between the dinner-table 4x and the AI 1.6x).

BLOCKING ISSUES: 0

---
Lead grading against the answer key (round 2): Q1 1, Q2 1, Q3 1, Q4 1, Q5 0.5 (concept right; relationship to the AI-model figure still soft), Q6 1, Q7 1, Q8 1.
SCORE: 7.5/8 (lead-graded). Target >= 7: met.
