# Fixes, round 4 (blockers 3-6; 1-2 fixed by lead)

| Item | Action |
|---|---|
| 3 OpenAI $600B | Verified by search: FT (Sept 2026, via The Next Web) reports about $856B compute and infrastructure spend 2026-2030 in the July presentation that also gives -$278B FCF. Data: `openai-compute-total-revised` keeps headline $1.4T and `actual_usd_b_low` 600, and adds `alt_reports` (CNBC ~$600B Feb 2026; FT ~$856B Sept 2026, scope may be wider), both tagged reported with sources; reader note, what-changed text updated. ch06: "Reportedly cut to" bar and gauge rows replaced by two separate rows ($600B CNBC, $856B FT); bull line says "target reported by CNBC"; bear line states both figures and that the sources differ ("cut by more than half" removed). |
| 4 ch02 list rows | List `<summary>` now appends (promise) / (mixed round) / (outside-loop stake) via shared `kindSuffix`. Mixed round is named from `parties` ("Mixed round: Amazon, Nvidia, SoftBank, other investors") instead of "Other investors"; detail heading "Mixed round". |
| 5 ch08 bond | Intro `data-bond`, step 2 text and first example now read `meta-hyperion-bond` ($27.3B); guarantee read separately from `meta-hyperion-beignet` (step 4 "reported cap", own example). |
| 6 AWS $138B | `openai-aws-compute` status calculated, `formula_text` "$38B + $100B expansion", `components` (each verified, own sources). ch02 detail shows the parts; ch06 bar tooltip shows the formula; ch06/ch07 tags follow status. |

Minor items fixed: #10 (Pimco wording: ~$10B of ~$14B bonds, ~$16B financing; motive hedged, reader note and build text), #13 (ch06 shows $120.5B, not $121B; Mistral text not changed).

Left (logged only): #7 Fluidstack type, #8 Anthropic $30B dating and OpenAI $50B vs ~$70B note, #9 cash source, #11 xAI headline, #12 tag consistency ch10, #14 CDS source label, #15 substack source, #16 recycled labels, Mistral EUR text.

Checks: build_data OK; node tests 44/44; bundle OK; Playwright ch02/ch06/ch08 at 1280 and 390: no console errors, no NaN; axe_final prints [] for all four viewports.
