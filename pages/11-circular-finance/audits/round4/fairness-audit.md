# Fairness audit, round 4: "The Loop" (Ep. 11)

Method: rendered DOM text from headless Chrome (tags stripped, about 4,250 lines), plus `src/chapters/*.html`, chapter-JS strings seen after interaction, and reader-facing data copy (`reader_note`, events, knob rationales). Read twice: first as a long-NVDA investor ("Bull"), then as a short-seller ("Bear"). Round 3 was used only to confirm earlier blockers.

## Round-3 blockers: status

- R3-B1 (resignation inside the Lucent chapter, paired with "Does the timing rhyme?"): CONFIRMED FIXED. The Ch10 Huang box and both Ch10 "why did he resign / does the timing rhyme" bullets are gone. The Lucent comparison no longer mentions him. The resignation now appears only as a dated event (Ch9 events list, "Nvidia news in this period (dated; no conclusion drawn)") and in the epilogue unknowns list. Residual placement points are M1 and M2 below.
- R3-B2 (Ch8 "what to watch" items hinting at accounting irregularity): CONFIRMED FIXED. The Lambda item now reads "How the earlier sale and the later lease are each reported in the filings"; the xAI item reads "How the lease and the purchase option are each reported". "Reportedly failed lease accounting" and "counted as a sale and as a lease commitment" are gone. Two leftover phrases are in M3.
- Round-3 minors M1 ("When the music stops" now "What if payments slow down?"), M3 (Customer A sentence and "Source describes it as" leaks gone), M4 ("tangled" is now "overlapping", "ghosts" is now "dashed bars/outlines", "Nvidia's CEO" gone from the CoreWeave card) and M5 (bull/bear lists in Ch10 are now 6 and 6): confirmed fixed.
- Round-1 and round-2 blockers: still fixed. Nothing here implies fraud or double pledging; "bubble" appears once, negated; "Ponzi" never appears; "not investment advice" appears in hero caption, Ch9 banner and footer.

## Checks passed

- Double-pledging/fraud: Ch5 has an explicit "This is not double-pledging" box and a repeated correlation-not-wrongdoing line; Ch8 says "We aren't alleging anything improper"; Ch9 and the footer repeat it.
- Banned words (delve, robust, moreover, landscape, tapestry, crucial, pivotal, testament): none in the rendered text.
- Builder/research notes ("re-fetch", "this pass", "from memory", "merge note", "do not chart"): none visible. The only "research" hits are source-title strings ("456xresearch.substack.com", "SFA Research Corner") and Nvidia's own "research and development".
- Toy numbers carry Hypothetical badges, "toy model, not a forecast", and the epilogue says the 13% is "a toy assumption, not a finding" and shows the 1% to 71% stress bracket and 66% all-outside-money figure beside it.
- Bull/bear panels are paired in Ch2, 4, 6, 7, 9 and 10. Ch10 per-row panels each add "We don't know yet". The Ch10 "what each side says" lists are 6 and 6.
- Huang: the event text is neutral ("The filing gives no reason, and we draw no conclusion from it").

---

## BLOCKING

None found.

---

## MINOR

### M1 MINOR (Bull, also Bear): an export-control inquiry sits directly under the resignation, in a financing page
- Location: Ch9 events, group "Nvidia news in this period (dated; no conclusion drawn)": "2026-11-12 Jensen Huang resigns as Nvidia CEO, president and director; CFO Colette Kress named interim CEO" followed immediately by "2026-12-03 Senate Banking hearing on Nvidia and Megaspeed tentatively Dec 3; House interviews Dec 1". The Senate item's sources (Fortune, Al Jazeera, The Next Web headlines naming Huang, Lutnick and "summoned to testify") also appear in the Sources list.
- Why: each line is a dated fact and the detail text says the inquiry "is about Nvidia's dealings with Megaspeed International and export controls, not about circular financing". But that topic has nothing to do with the loop, and putting it one line under a CEO departure invites a reader to link the two. The "summoned to testify" source titles make it worse. The Bull reader sees an insinuation by adjacency; the Bear reader loses nothing if it is removed.
- Rewrite: drop the Senate/House item from this page (it is off-topic). If it stays, give it its own group ("Other Nvidia news, unrelated to financing") separated from the resignation, and keep only: "Congressional committees have scheduled inquiries into Nvidia's export-control dealings with Megaspeed International (dates tentative)."

### M2 MINOR (Bull): epilogue lists the CEO change among the loop's financial unknowns
- Quote: "Who leads Nvidia from here. In a filing, the company said Jensen Huang resigned as chief executive, president and director and that Colette Kress is interim chief executive. The filing gives no reason, and we don't add one." (epilogue "What we still don't know", fifth bullet, after guarantees, GPU life and lender behaviour).
- Why: wording is neutral, but "who leads Nvidia from here" in a list of financing risks frames a leadership change as a risk factor. Same issue the round-3 audit raised as "milder".
- Rewrite: move it out of the unknowns list into a one-line note under "Data as of 2026-11-20": "Also in the news: on Nov 12, 2026 Nvidia filed an 8-K saying Jensen Huang resigned as CEO, president and director and that CFO Colette Kress is interim CEO. The filing gives no reason." Remove "Who leads Nvidia from here."

### M3 MINOR (Bull): Ch8 still has a few opacity-leaning phrases
- Quotes: "Related-party links: seller, investor and customer in one deal." (sale-leaseback card, "What to watch"); "Whether disclosure makes the whole loop visible." (same card); "The chip maker is an investor, a seller and sometimes a backer all at once." (xAI card); and the Ch8 closing line "every one is also a way for risk to sit somewhere you can't see from the headline number."
- Why: "related-party" is an accounting term that signals scrutiny, and "can't see" and "whether disclosure makes... visible" imply concealment, which the chapter's own disclaimer says it does not allege. The "what to watch" bullets also carry no per-item source.
- Rewrite: "That Nvidia is seller, investor and customer in one arrangement, which each company's filings describe." / "Whether the filings let a reader add the pieces back up." / "every one is also a way for risk to sit somewhere the headline number doesn't show." Add one source line under each card's "What to watch" (the company filing or financing document it points to).

### M4 MINOR (Bull): two chapter titles ask only downside questions
- Quotes: Ch9 "What if payments slow down?"; Ch10 "Is this 2000 again?" Nav labels follow ("9 What if payments slow down?", "10 Is this 2000 again?").
- Why: the bodies are balanced (bull and bear panels, "we don't know yet"), but no chapter title poses the upside question, and Ch10's title adopts the bear analogy as the frame. Ch9's opening scenario also applies a 20% shortfall and 100 bp rate shock.
- Rewrite: Ch9 "What if payments slow down, or keep growing?" (the "Reset to no stress" state already exists and the Ch6 slider models growth). Ch10 "Is this 2000 again, or different this time?"

### M5 MINOR (Bull): events lists are 6 versus 5, stress first
- Location: Ch9 "What the market is saying right now": "Signs of financial stress" has six items (Oracle downgrade, Oracle CDS, CoreWeave CDS, Fed hike, Fed minutes, depressed neocloud equities); "Signs of continued demand and financing" has five (Nvidia Q3, CoreWeave Q3, tighter contract-backed loans, hyperscaler capex held or raised, no confirmed GPU-loan default). The stress list is first. The Nvidia Q3 item also carries "stock falls" in its headline.
- Rewrite: add one dated, sourced demand item (for example the Microsoft operating cash flow versus capital additions line already used in Ch10), or fold the Fed hike into a neutral "rates" group. Optionally title the Nvidia item "revenue $115.8B (+103% y/y); Q4 guide $130B; Rubin ships" and keep the stock reaction in the detail line.

### M6 MINOR (Bull): epilogue headline is the low number
- Quote: "about 12.5% (a toy assumption, not a finding) is paid by end customers" with the bar showing "13%" first and largest label, then 53% and 34%.
- Why: caveats are strong and 66% outside money is shown. The bar still leads with the smallest, unsourced-default slice. The page's own knob note cites a 62% reference point for lab revenue cover.
- Rewrite: lead the sentence with the outside-money figure ("about 66% of the cash is outside money; about 13% of it is paid by end customers on a deliberately cautious default"), or show the 62% reference case beside the 50% default.

### M7 MINOR (functional, not fairness): "NaN%" in the Ch6 growth gauge in the rendered DOM
- Quote: "If the lab's revenue grows NaN% a year", with rows reading "n/a". The input (`#ch06-g`) has value 0, so this may be a headless-load timing artefact. Verify in a normal browser. If real, readers see a broken gauge for the OpenAI row, which is the page's central promises-versus-cash exhibit.

### M8 MINOR (Bear): Nvidia leadership quote sits on the bull side with no counterpart on the same point
- Quote: "Jensen Huang's public stance: 'circular financing' fears are overstated ('If that is, let's do more of that')." Attributed and correctly dated context; the counterpart bear item (Burry, "Circular flows inflate reported demand") is attributed to a named person too. Fine as is, but if "interim CEO Kress says..." is kept in the bull item, label it with the date, since the quote's author is no longer CEO. No change required beyond dating.

---

## Per-persona summary

- Bull (long NVDA): would accept the page as fair. Demand is shown as real (+103% revenue, backlogs, undrawn guarantees, Nvidia says it has paid nothing). Remaining irritants are M1 to M4: the Senate item next to the resignation, the CEO line in the unknowns list, the Ch8 opacity phrasing, and downside-only chapter titles.
- Bear (short-seller): would accept the page as fair. Concentration, circular equity, the $105B ceiling, GPU life, CDS pricing, Fed staff concerns and "a quiet year is not evidence the structure is safe" all appear, and the page declines to call the loop safe or fraudulent.

BLOCKING ISSUES: 0
