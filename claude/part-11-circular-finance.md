# Part 11: The Loop (circular finance)

Live at https://yourmomlovesmyai.com/circular-finance/ (pushed in commit d92c811). Source: `pages/11-circular-finance/`.

## Sections
Ten chapters and an epilogue: the $20 dinner table; the ecosystem map; follow the $100 (11 hops, laps, geometric series); leverage calculator; the claims stack; promises vs cash; who is on both sides; off the balance sheet; a payment-slowdown stress tool; "is this 2000 again?"; the one number to watch.

## Key findings (toy model, per $100 of seed cash, default parameters)
- Debt created: about $167. Nvidia revenue booked: about $160, of which about $60 is Nvidia's own cash coming back and about $100 is lender money. Paper market value: about $539 (hypothetical, hatched).
- Claims: 9 claims held by 8 parties. Ranked claims per $1 of GPU value: about 1.00 at purchase (about 1.84 counting the nested bank slice), rising as the GPU depreciates unless rent pays the loan down.
- External share of cash moved: about 66% (range roughly 41-79% one knob at a time). Only about 12.5% is paid by end customers in the default run.
Every one of these depends on hypothetical knobs; the page says so next to each number.

## Caveats
- Toy model, not a forecast, not investment advice. No verdict on fairness or fraud; bull and bear readings are shown side by side.
- Several inputs are press-reported rather than primary (tagged `reported`). Customer letters in CoreWeave's 10-Q may refer to different customers each period.
- Facts are as of 2026-11-20 and several are moving (Nvidia leadership, OpenAI funding round, Anthropic IPO).
- Critic gauntlet: five rounds run. Round 5 was clean for fairness, blind reader and browser; its three finance blockers were fixed afterward without a fresh finance re-audit. Two consecutive fully clean rounds were not reached (see the fixes logs).

## Artifact preview
No separate artifact was published; the live page is the phone preview: https://yourmomlovesmyai.com/circular-finance/ (single-file build also at `pages/11-circular-finance/dist/circular-finance.html`).
