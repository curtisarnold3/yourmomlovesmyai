# Round-1 fixes, owner C (ch 01, 02, 07, 08, 11, runtime, base.css, shell, bundle)

| Item | Action |
|---|---|
| Finance #6 ch02 node panel mislabels stakes | Panel/chips/edges now use a data-driven `kindOf(deal)`: `money_kind: outside_loop_investment`, or any cash deal with `loop_edge:false` (works before A's data lands), is shown as "Outside-loop investment" (own row, own chip, dotted grey line), never external or recycled. Promises stay on a separate row; no totals add promises. |
| Neocloud definition | Defined in shell lede and ch02 hook ("a newer company that rents out racks of AI chips"). |
| ch02 cards | Company cards hidden by default behind a "Show company cards" / "Hide company cards" toggle (desktop and mobile). |
| ch02 LOI caption | Caption under the map and in the edge detail, built from `nvda-openai-loi.headline_usd_b` and `nvda-openai-equity.actual_usd_b_high`. |
| ch07 | Role-letter legend plus the three tangled pairs come first (with role names per card); grid and full pair list behind a toggle; empty `th` now has sr-only "Company". |
| ch08 | Real examples behind "Show a real example"; plain-word glosses for SPV, delayed-draw term loan, non-recourse, residual value guarantee, sale-leaseback, backstop, warrants, ABS/CMBS; "$27 billion data center" reworded to a bond. |
| Shell tallies | "Revenue booked per $1 of seed cash" (x); External cash split into "Outside money: customers" (external_end_user) and "Outside money: lenders and investors (must be repaid or earn a return)" (external_capital); whole dollars with ~ for hypothetical/calculated; hero teaser drops paper value and cents; ch01 bridge explains dinner-table "counted N times" versus the AI ratio. |
| ch11 epilogue | Headline is share of cash paid by end customers (`end_user_share`, with a runLoop fallback), range shown, lenders explained as outside money but not demand, recycled share shown, target solver now on the end-user share. Research/builder open items and bull/bear duplicate removed (link to ch10); reader-voice open questions incl. neutral Huang 8-K line. Also notes the cautious lab-revenue default (B3). |
| Fairness S2 | ch02 and ch07 bull/bear rewritten as "Backers point to" / "Skeptics point to", equal hedging and length. |
| Minor wording | Title/h1 "Money Machine" became "Money Loop"; "more polite name" removed; "Calculated" badge text says calculated from hypothetical inputs. Not in my files: "quiet part" (ch10, owner B). |
| Browser | `ctx.tag` aria-label now starts with the visible text (0 mismatches). Tag popover opens on focus under touch/narrow (pinned), scroll no longer closes it right after opening. SVG text now at least 10px effective at 390 in ch01, 08, 11. |

Notes: tests/browser_test.py ch07 steps and the ch02 mobile-list step assume the old always-visible grid/list; update them to click the new toggles first. Legend label for External cash changed in runtime.
