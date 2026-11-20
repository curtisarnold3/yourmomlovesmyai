# Fairness audit, round 5 (independent critic)

Method: rendered DOM text (headless Chrome, tags stripped), src/chapters/*.html, data copy (events.json reader fields, deals.json reader_note), plus keyword sweeps. Read once as a long-NVDA investor, once as a short-seller.

## Earlier blockers: confirmed fixed
- No sentence accuses Nvidia or anyone of fraud, deceit, irregular accounting or double-pledging. "Nothing here implies wrongdoing" and "not double pledging" appear in ch3, ch5, ch8, ch9 and the epilogue.
- Huang resignation: neutral dated 8-K facts, "no reason given, no conclusion drawn." No speculation. Not paired with Lucent. Lucent appears only in ch10 and Huang only in ch9 events and the epilogue unknowns.
- Toy numbers carry Hypothetical or toy labels, with "toy assumption, not a finding" on the 13% figure.
- "Bubble" appears once, as "isn't proof of a bubble either". "Ponzi" does not appear.
- "Not investment advice" appears in the hero, ch9 and the epilogue.
- Bull and bear panels are matched. Ch3 has one bull and one bear paragraph and ch7 has one of each. The ch10 "What each side says" list has 6 and 6, all attributed to named people or filings.
- Builder-note sweep (re-fetch, this pass, from memory, research, merge note, do not chart, TODO) found nothing in rendered text, chapters or reader fields. The runtime also carries a BUILDER regex guard.
- AI-speak sweep (delve, robust, moreover, landscape, tapestry, crucial, pivotal, testament) found zero hits.

## BLOCKING
None.

## MINOR, investor persona (long NVDA)
I1. Ch9 event card, directly under the Huang resignation. Quote: "Senate Banking hearing on Nvidia and Megaspeed tentatively Dec 3; House interviews Dec 1 / The inquiry is about Nvidia's dealings with Megaspeed International and export controls." This is round-4 M1, still present. It has nothing to do with the financing loop. It sits one line below the resignation, on a page about financing risk, so the adjacency invites a causal reading. The clause "not about circular financing" exists in events.json but not in the visible card text. Rewrite: remove the card from ch9, or keep it and restore the visible clause. Suggested: "Unrelated to the financing loop: a congressional inquiry into export controls. Shown only so readers aren't surprised by the headlines." Preferably move it to the Sources or news footer.
I2. Ch7 intro. Quote: "In AI infrastructure that is called a partnership". The phrasing reads as a euphemism. Rewrite: "In AI infrastructure this is common, and it is called a partnership."
I3. Ch1. Quote: "That's the whole trick, and it's the idea behind this entire episode." and "Sales are not the same thing as money from outside the table." The lead analogy sets up "counted one bill over and over" before the later clarification ("It isn't double counting in the dinner-table sense", "Nobody lied"). The mitigation exists but comes after the framing. Rewrite: "That's the idea behind this episode" (drop "trick"). Ch2 has "The trick is telling them apart" and should say "The task is telling them apart."
I4. Ch9 intro. Quote: "a row of dominoes where every domino is made of the same wood." The metaphor asserts the correlation thesis before the model runs. Rewrite: "Picture a row of dominoes. Whether they fall together depends on whether they stand on the same floor."
I5. Ch6. Quote: "That flexibility favors the buyer, and it means the seller's backlog is softer than the headline." and "If it stalls, the contracts get renegotiated, as the reported cut suggests." These are stated as conclusions with no matching bull line. Rewrite: "That flexibility favors the buyer, so how firm the seller's backlog is depends on the contract terms." and "If it stalls, contracts could be renegotiated, as one reported cut shows. We don't know yet which."
I6. Epilogue (round-4 M6, still present). Quote: "Our toy estimate is about 13%, anywhere from 3% to 31%…" The closing paragraph leads with a toy figure, and the preceding pages hold no equal-weight observed numbers. Rewrite: lead with the open question ("how much of the loop's cash is paid by end customers is not published") and put the toy figure second, labelled "toy illustration only."
I7. Ch9 and ch10 titles (round-4 M4, still present): "What if payments slow down?" and "Is this 2000 again?" Both are downside-only. Rewrite: "What if payments slow down, or speed up?" or "Stress-testing one cluster". For ch10, "How 2000 and today compare."
I8. Ch9 market panel. The event list has 6 stress items (Oracle downgrade, Oracle CDS, CoreWeave CDS, Fed hike, Fed minutes, equities below peaks) against 5 demand items (Nvidia Q3, CoreWeave Q3, tighter loan pricing, hyperscaler capex, no confirmed GPU-loan default). With the 2 Nvidia-news items (resignation, hearing) and the downside-leaning commitments list, the section tilts bear. Rewrite: add one demand item (for example Anthropic or OpenAI revenue run-rate, or a hyperscaler cash-flow positive item), or drop the Fed-minutes duplicate of the Fed-hike card. This is round-4 M5, still present.

## MINOR, short-seller persona
S1. Defensive disclaimers outnumber risk statements in places. "Not double pledging" or "not wrongdoing" appears 6 times (ch3, ch5 twice, ch8, ch9, epilogue). A bear can read the repetition as the page protecting Nvidia. A bull can read it as planting the idea. Rewrite: keep the ch5 explanation and the epilogue line, and cut the ch3, ch8 and ch9 repeats to a single cross-reference.
S2. Ch8 close. Quote: "every one is also a way for risk to sit somewhere you can't see from the headline number." This is round-4 M3, still present. It reads as hiding and sounds opaque-leaning. Ch8 also says "find the footnote and add the pieces back up." The bear gets "can't see", the bull gets implied concealment, so it is unfair in both directions. Rewrite: "…also a way for risk to sit in a different place than the headline number, which is why we point to the filing for each one."
S3. Ch8, Meta card. Quote: "Meta carries no liability for it." It is a factual note, but it stands alone beside a $28B guarantee with no accounting context, and it is shown without the "per Meta's filing" attribution a bear would want. Rewrite: "Per Meta's filing, Meta records no liability for the guarantee."
S4. Ch10 "Now" cards carry evenly sourced statements, but "In 2000, the first big price drops came before the defaults, not after." is a pointed bear analogy with no bull equivalent in that card. Rewrite: add "Today's drops are in the most leveraged names; the largest vendor's sales are still rising", or soften to "In 2000, price drops came before the defaults."
S5. Hero strip and ch3 tags. "Debt created ~$167" and "Claimants 8" are tagged "Calculated", while the other toy outputs are tagged "Hypothetical". A reader skimming the strip could take "Calculated" to mean measured. Rewrite: tag every toy-derived output "Hypothetical".
S6. Epilogue unknowns (round-4 M2, still present). Quote: "Who leads Nvidia from here." Listing a CEO transition among the "what we don't know" items beside default risk and GPU lives lets the reader infer risk from the change. The wording is neutral but the placement is not. Rewrite: move it to a separate "Dated company news" line, or drop it. It is already covered in ch9.

## Round-4 minors still open
M1 (export-control line under resignation): remains, as I1.
M2 (epilogue unknowns "Who leads Nvidia"): remains, as S6.
M3 (ch8 opaque-leaning phrases): remains, as S2.
M4 (downside-only ch9 and ch10 titles): remains, as I7.
M5 (ch9 event list 6 stress against 5 demand): remains, as I8.
M6 (epilogue leads with the 13% toy figure): remains, as I6.
M7, M8: not separately identifiable from the brief. No new regression seen in the areas they likely cover (hero, ch1, ch2 trick wording is flagged as I3).

Overall: both personas would call the page fair. Remaining items are tone and placement, not substance. No accusation, no speculation about Huang, no toy figure presented as fact.

BLOCKING ISSUES: 0
