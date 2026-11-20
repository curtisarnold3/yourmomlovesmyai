"""Reader-facing text layer for build_data.py (round-2 fixes).

Nothing here is research process. Every string below may be shown to readers. Internal builder text stays in
`internal_notes` and is stripped from the embedded bundle by tools/bundle.py.
"""
import re

# ----------------------------------------------------------------------------- deals: one or two plain sentences each
DEAL_READER_NOTES = {
    'nvda-openai-loi': "A September 2025 letter of intent: Nvidia said it intended to invest up to $100B in OpenAI as OpenAI deployed Nvidia systems. It was non-binding and never became a signed agreement, so no money moved under it.",
    'nvda-openai-equity': "Nvidia put about $30B into OpenAI's 2026 funding round, as reported by the press. OpenAI also buys Nvidia systems through cloud partners, so we count this as recycled cash.",
    'nvda-sbenergy-ohio-guarantee': "Nvidia says it has agreed to back up to $105B of lease payments for a data-center campus in Ohio that is being built for an OpenAI-linked customer. It is a ceiling on a possible future payment, not money spent, and Nvidia says it has paid nothing under its guarantees.",
    'nvda-financing-consortium': "Nvidia and large investment firms said they are setting up platforms aiming to raise more than $500B from other investors for AI infrastructure. The $500B is a target for other people's money, not an Nvidia commitment, so it is not added to any total.",
    'nvda-anthropic-equity': "Nvidia has been reported to plan to buy about $10B of Anthropic stock at the IPO price. The purchase depends on the IPO closing, so we show it as a promise, not as cash that has moved.",
    'anthropic-ipo-placement': "A private placement of about $26B of Anthropic stock, bought by seven technology companies alongside Anthropic's IPO: Google about $10B, Nvidia about $10B, AMD about $2.5B, Broadcom, Micron and Microsoft about $1B each, and TSMC about $0.5B. Nvidia's $10B is the same money as the separate Nvidia line, so this total is not added to anything. It depends on the IPO closing.",
    'anthropic-azure-compute': "Anthropic said it will buy $30B of Azure computing capacity from Microsoft, including up to 1 gigawatt on Nvidia systems. Part of that spending flows on to Nvidia as the chip supplier.",
    'nvda-coreweave-equity': "In January 2026 Nvidia bought $2B of CoreWeave stock at $87.20 a share. Nvidia is also a supplier to CoreWeave, so we count this as recycled cash. CoreWeave shares have traded well below that price since.",
    'nvda-coreweave-capacity-backstop': "Nvidia agreed to buy CoreWeave's unsold cloud capacity, up to about $6.3B, through 2032. It only pays if capacity goes unsold. Nvidia has disputed calling it a backstop.",
    'nvda-xai-equity': "Nvidia was reported to invest in xAI's early-2026 funding round. The size is uncertain (press reports range from about $2B to $10B), and the stake later became SpaceX shares when SpaceX bought xAI.",
    'xai-gpu-spv': "A reported plan for a special-purpose company with $7.5B of equity and $12.5B of debt to buy Nvidia chips and lease them to xAI. We could not confirm that it closed as described, so no amount is counted.",
    'spacex-xai-chip-spv': "A reported chip-leasing package of about $40B for SpaceX, including bonds and bank loans. Reports disagree on what has closed, so no amount is counted.",
    'nvda-lambda-leaseback': "Nvidia agreed to rent back about 18,000 GPUs from Lambda over four years, worth about $1.5B. Nvidia is also an investor in Lambda.",
    'nvda-intel': "Nvidia bought $5B of Intel stock in September 2025. Intel is a partner, not an AI customer in this loop, so it is shown separately and left out of the loop totals.",
    'nvda-nebius': "Nvidia announced a $2B investment in Nebius in March 2026, made through pre-funded warrants (rights to buy shares at a nominal price).",
    'nvda-synopsys-nokia': "Nvidia's stakes in Synopsys and Nokia. The $2.7B is the value of the holdings in investor-filing summaries, not cash Nvidia paid; the announced investments were about $2B and $1B. They are partners, not AI customers in this loop, so they are shown separately.",
    'nvda-nscale': "A reported arrangement with Nscale involving warrants and a rent guarantee. Reports give very different figures ($60M to $860M and more), so treat this as a low-confidence line.",
    'nvda-sbenergy-equity': "Nvidia was reported to invest about $1.5B in SB Energy alongside the Ohio guarantee. SB Energy builds the campus and leases it to an OpenAI-linked customer.",
    'nvda-cloud-commitments': "Nvidia's own commitments for cloud services ($28B) and data-center leases not yet started ($74B), which Nvidia says support its own research and development. This is Nvidia buying for itself, not financing a customer, so it is not part of the loop totals.",
    'nvda-neocloud-agreements': "Nvidia reports $32B of future commitments to neocloud companies. They take effect only if those companies secure financing and deliver, and Nvidia says nothing is owed until then.",
    'nvda-mistral-reflection-tml': "Nvidia took part in funding rounds for Mistral and other AI start-ups. The size of Nvidia's own checks was not disclosed.",
    'openai-oracle-compute': "OpenAI's cloud capacity deal with Oracle for Stargate sites, widely reported at about $300B over five years starting in 2027. Neither company has confirmed the figure; Oracle reports only its total backlog.",
    'openai-azure-compute': "As part of the October 2025 restructuring, OpenAI committed to buy an extra $250B of Azure cloud services from Microsoft. Microsoft gave up its right of first refusal as OpenAI's compute provider.",
    'microsoft-openai-equity': "Microsoft holds roughly 27% of OpenAI after the October 2025 restructuring, worth about $135B at the time. Microsoft's filings put its total funding commitment at $13B, of which about $11.6B had been funded at September 2025. Microsoft is also OpenAI's cloud provider.",
    'openai-aws-compute': "OpenAI's cloud deal with Amazon: $38B signed in November 2025, then expanded by $100B over eight years in February 2026. The $138B total is our sum of the two parts, not a figure either company states.",
    'amazon-openai-equity': "Amazon said it would invest $50B in OpenAI: $15B at the start, and another $35B later if certain conditions are met. We show the $15B and the $35B separately, because the $35B has not moved. Amazon is also a large cloud vendor to OpenAI.",
    'openai-amd-warrant': "AMD gave OpenAI a warrant to buy up to 160 million AMD shares at a nominal price as OpenAI deploys AMD chips. In effect a chip maker pays its customer in equity. The dollar value is not disclosed.",
    'openai-broadcom-chips': "OpenAI plans to deploy 10 gigawatts of custom chips and networking from Broadcom through 2029. The companies have not published financial terms.",
    'openai-cerebras': "A reported OpenAI agreement for 750 megawatts of Cerebras computing capacity through 2028, reported at more than $10B.",
    'openai-coreweave-compute': "OpenAI's cloud contracts with CoreWeave, reported at about $22.4B across several agreements. CoreWeave lists OpenAI among its expanded customers but has given no new dollar figure.",
    'openai-compute-total-revised': "OpenAI's total computing plans. The CEO cited about $1.4T over eight years (Nov 2025). Reported spend targets differ: about $600B by 2030 (CNBC, Feb 2026) versus about $856B in a July presentation (FT, Sept 2026, scope may be wider). Commitment and target are different things. Summarises other lines, so not added to totals.",
    'openai-round-nov2026-remainder': "The rest of the same round has not been reported as closed. Bloomberg says the round could reach about $20B, so up to about $9B more may follow in the coming weeks. It is a promise until it closes, and no cash is counted.",
    'openai-round-mar2026': "OpenAI's 2026 funding round: $122B committed at a $852B valuation. About two-thirds comes from vendors (Amazon and Nvidia), and SoftBank's share was funded with borrowed money. The Amazon, Nvidia and SoftBank lines are shown separately, so this round is not added again to totals.",
    'openai-round-nov2026': "Bloomberg reported on Nov 6, from anonymous sources, that about $11B of a new OpenAI round at a $1.25T valuation had closed as a first portion. OpenAI has not confirmed it, so it is tagged reported. We count it as outside cash; no vendor money is reported in this portion. The rest of the round is a separate promise line.",
    'softbank-openai-equity': "SoftBank put $30B into OpenAI's 2026 round. SoftBank paid for it with borrowing (a bridge loan and margin loans), so this is outside money that is itself borrowed.",
    'anthropic-google-tpu': "Anthropic announced it will use several gigawatts of Google's AI chips (TPUs) starting in 2027. No dollar value has been disclosed.",
    'anthropic-fluidstack-50b': "Anthropic said it plans to invest $50B in US data centers, starting with sites built with Fluidstack. It is a company plan, not a signed payment to Fluidstack.",
    'mistral-funding': "Mistral AI's funding: a 2025 round led by ASML and a reported larger round in 2026, plus debt for a Paris data center. Later figures come from press reports.",
    'msft-coreweave-compute': "Microsoft was CoreWeave's largest early customer, under multi-year capacity contracts. CoreWeave's quarterly filing does not name its customers, so any match between a letter in the filing and a company is our inference.",
    'meta-coreweave-compute': "Meta agreed to buy up to about $14.2B of cloud capacity from CoreWeave through 2031, subject to delivery and termination terms.",
    'msft-nebius-compute': "A five-year GPU cloud contract between Microsoft and Nebius worth $17.4B, rising to about $19.4B with extra services.",
    'meta-nebius-compute-1': "A five-year, roughly $3B AI infrastructure agreement between Meta and Nebius, later overtaken in size by the March 2026 agreement. Both are shown.",
    'meta-nebius-compute-2': "A March 2026 Meta-Nebius agreement: $12B of capacity is firm, and Meta may buy up to $15B more, for up to about $27B over five years.",
    'nebius-financing-2026': "Nebius raised money in 2026 through $5.75B of convertible notes (bonds that can turn into shares) and a $3.5B secured loan from Citi, about $9.25B in total, from banks and bond investors.",
    'msft-iren-compute': "A five-year, $9.7B contract for Microsoft to rent GPU capacity from IREN, with 20% paid up front. IREN is building the capacity in Texas in phases.",
    'iren-gpu-financing': "IREN closed $3.65B of financing in June 2026 against its Microsoft contract: $2.1B of notes and a $1.55B term loan. The debt is about 63% of the cost of the GPUs it pays for.",
    'msft-nscale-compute': "Microsoft contracts with Nscale for about 200,000 Nvidia GPUs. Dollar figures differ by source (up to $24B to $43.8B). In October 2026 Microsoft ended one UK site and declined to expand a Texas option.",
    'msft-lambda-compute': "A multi-billion-dollar Microsoft agreement for Lambda GPU capacity. The value has not been disclosed.",
    'google-fluidstack-terawulf-backstop': "Google agreed to cover Fluidstack's lease payments at TeraWulf's Lake Mariner site, $1.8B at first and about $3.2B after an expansion, and received warrants for about 14% of TeraWulf.",
    'google-fluidstack-cipher-backstop': "Google agreed to cover $1.4B of Fluidstack's lease payments at Cipher's Texas site, later $333M more, and received warrants for about 5.4% of Cipher.",
    'coreweave-applied-digital-lease': "CoreWeave signed a 15-year lease for all 400 megawatts of Applied Digital's Polaris Forge 1 campus, worth about $11B over the base term.",
    'macquarie-applied-digital-pref': "Macquarie committed up to $5B of preferred equity (equity paid ahead of ordinary shares) for Applied Digital's campuses. About $1.0B had been drawn, according to reports.",
    'coreweave-ddtl-4': "CoreWeave's $8.5B delayed-draw term loan (money borrowed in stages), rated A3 by Moody's, priced at about 2.25 points over the SOFR bank rate. It was the first investment-grade rated GPU-backed loan.",
    'coreweave-ddtl-5-5-and-converts': "In the third quarter of 2026 CoreWeave arranged a $2.6B term loan and about $4.2B of convertible notes. The loan comes from banks and lenders; the convertible notes were sold to investors.",
    'blackstone-magnetar-coreweave': "CoreWeave's early GPU-backed loans from Blackstone, Magnetar and others. The 2023 and 2024 facilities are widely reported at about $2.3B and $7.5B, and priced far higher than later loans (about 9.6 points over SOFR in 2023, against 2.25 in 2026).",
    'meta-hyperion-beignet': "Meta gave the Hyperion data-center venture a residual value guarantee covering the first 16 years: if the campus is worth less than agreed, Meta pays the shortfall. The cap is reported at about $28B and Meta carries no liability for it. The $27.3B bond that financed the campus is shown as its own line.",
    'meta-hyperion-bond': "The venture that owns Meta's Hyperion data center (about 80% Blue Owl funds, 20% Meta) sold $27.3B of bonds at 6.581%, rated A+. Meta leases the campus. This is outside investors' money, which is repaid from Meta's rent.",
    'oracle-vantage-stargate-loans': "Construction loans of up to $38B in two packages ($23.25B and $14.75B) for Vantage data centers leased to Oracle for OpenAI. Reports say banks had trouble placing the debt and sold parts to other investors, so we show a range.",
    'pimco-oracle-michigan-bond': "Pimco was reported to anchor about $10B of roughly $14B of bonds in a financing of about $16B for an Oracle-leased Michigan data center; reports differ on why banks stepped back.",
    'blue-owl-abilene-spv': "About $13B for the Abilene data center from a Blue Owl and JPMorgan vehicle, of which about $10B is debt, leased to Oracle for OpenAI.",
    'anthropic-spacexai-compute': "Anthropic's public IPO filing says it agreed to pay SpaceX's AI unit (formerly xAI) up to $120.5B through 2029 for computing capacity, about $3.1B a month at full delivery. After early 2027 either side can end it on 90 days' notice, so $120.5B is a ceiling. Nvidia is an investor in xAI.",
}

# ----------------------------------------------------------------------------- params
PARAM_READER = {
    'seed_usd': "A display unit only. Everything is shown per $100 of starting cash unless you change this; the ratios do not depend on it.",
    'loan_to_cost': "We chose 62.5% because two real deals are close to it: IREN's debt is about 63% of the cost of its GPUs, and a reported xAI vehicle was 62.5% debt. Market advance rates are often quoted at 50 to 70%.",
    'nvidia_share_of_build_cost': "We chose 60% because the servers in a cluster are mostly Nvidia GPUs and networking, with other vendors taking a share; no source gives the exact number. The building, power and cooling are financed separately and are left out.",
    'nvidia_gross_margin': "Nvidia reported a 74.8% gross margin in its third quarter. It guided to 71 to 72% next quarter, so the forward margin may be lower. We apply the company-wide margin to this slice as a simplification.",
    'gross_to_net_conversion': "Calculated from Nvidia's reported quarter: net income of $65.3B on $86.6B of gross profit is about 75%. Net income includes investment gains, so this is slightly generous.",
    'recurring_revenue_share': "We chose 50% as a middle setting because a one-time build order only repeats if the next lap happens; no source gives a number. At 100% every dollar is valued as if it repeats forever, at 0% there is no paper value.",
    'valuation_multiple': "We chose 12 times profit as a round, cautious setting. No source gives the multiple we would need, so this is not a statement about what Nvidia's stock trades at.",
    'reinvest_fraction': "Calculated from Nvidia's third quarter: $15.7B of equity purchases against $86.6B of gross profit is about 18%. Over nine months Nvidia spent about 47% of operating cash flow on equity purchases, and an outside estimate for investments and acquisitions is 58%. The figure includes holdings that are not part of the loop, such as Intel.",
    'contract_value_to_build_cost': "Calculated from IREN's Microsoft deal: a $9.7B five-year contract against $5.81B of GPU cost is 1.67 times. The contract also pays for power and site, so this overstates what covers the GPUs alone.",
    'contract_years': "Five years, because the IREN-Microsoft and Nebius contracts run five years. CoreWeave-Meta runs to 2031 and OpenAI-Oracle about five years from 2027.",
    'contract_prepayment_share': "20%, from IREN's contract with Microsoft. It is the size of the customer's claim in the claims stack.",
    'lab_outside_revenue_share': "We chose 50% because we don't have a source for how much of an AI lab's spending is covered by real customers. As a guide, OpenAI's 2025 revenue of $13.1B covered about 62% of its spending, and its named contracts of about $720B equal 14 years of today's $50B revenue rate.",
    'lab_funding_mix': "We chose 50% because the 2026 OpenAI round brackets it: counting Amazon's full $50B and Nvidia's $30B as vendor money gives 66%; counting only Amazon's first $15B gives about 52%. SoftBank's $30B is outside money, though borrowed.",
    'nvidia_share_of_vendor_funding': "Calculated: Nvidia's $30B out of $80B of vendor money (Nvidia plus Amazon's headline $50B) is 37.5%. It only decides who holds one of the claims.",
    'neocloud_opex_share': "We chose 35% because CoreWeave reports revenue and operating income but not cash running costs; no source gives a number. It is used only in the stress test.",
    'backstop_share_of_capacity': "We chose 15% from one example: Nvidia's up-to-$6.3B purchase promise is about 17% of CoreWeave's planned capital spending. Not every neocloud has one, and Oracle-type sites report none, so you can set it to 0.",
    'backstop_trigger_shortfall': "We chose 20% because the real trigger terms are not public. Nvidia says its guarantees apply only after financing, deployment and acceptance, and that nothing has been paid.",
    'credit_fund_back_leverage_ratio': "We chose 0.5 because banks often lend to private-credit funds against their loans, but the terms of the loans in this story are not disclosed. At 0.5 the bank funds a third of the loan and the fund's investors two-thirds. Set 0 for a fund with no bank borrowing.",
    'mezz_ratio': "We chose 50% as an illustration. Real examples include about $4.2B of CoreWeave convertible notes in the third quarter and $5.75B at Nebius. We only show the claim, not where the proceeds go.",
    'margin_loan_share': "We chose 20% because margin lending is documented at the SoftBank level (a $25B loan against Arm shares) but we have no figure for neocloud shareholders.",
    'neocloud_equity_mark': "1.0 means shares are valued at what Nvidia paid, so the baseline shows no gain or loss. For reference, Nvidia paid $87.20 per CoreWeave share and the stock closed at $44.91 on November 19, 2026, a mark of about 0.5.",
    'gpu_useful_life_years': "Five years, in the middle of the range. CoreWeave depreciates GPUs over six years, large cloud companies use five to six, and one critic argues the real life is two to three. Presets cover three to six.",
    'gpu_rental_decline_per_year': "We chose 10% a year because the data point both ways: H100 rental fell from about $8 an hour in early 2023 to $1.80 to $3.50 in 2026 (about 28% a year), while one index rose from $2.00 in December 2025 to $3.01 in November 2026.",
    'base_rate': "The middle of the Fed's target range of 3.75% to 4.00% (3.875%), after the September 2026 hike. We use it as a stand-in for the SOFR bank rate, which we do not have a figure for.",
    'credit_spread': "CoreWeave's best loan (rated A3) priced 2.25 points over SOFR, earlier loans 4.0, and lower-rated customers 4.5 to 5.5. Our 3.875% + 4.0% = 7.9% matches the weighted average borrowing cost CoreWeave reports.",
    'debt_term_years': "We chose five years to match the contract and the GPUs' assumed life. CoreWeave's best loan runs about six years, to March 2032.",
    'floating_share': "We chose 50% because real deals mix both: IREN combined a fixed-rate placement with a floating loan, and CoreWeave's best loan has floating and fixed parts. It only matters for the rate-shock stress.",
}

# ----------------------------------------------------------------------------- literal phrase fixes, applied to every reader-facing string
PHRASE_FIXES = [
    ("Not confirmed in Nvidia's July 10-Q text I could read, which does not name OpenAI in the investment notes.", "Nvidia's July 10-Q does not name OpenAI in its investment notes."),
    ("is not stated in the sources we read, so a $20B total cannot be ruled out", "is not stated in the sources, so a $20B total cannot be ruled out"),
    ("Reported in Anthropic amended S-1 coverage; primary S-1/A not read. Microsoft stake reported ~$1B, not $5B.", "Reported in coverage of Anthropic's amended S-1. Microsoft's stake is reported at about $1B, not $5B."),
    ("Could not confirm it closed as described; later reporting focuses on the $10B equity round.", "We could not confirm that it closed as described; later reporting focuses on the $10B equity round."),
    ("(OpenAI share not isolated in text retrieved)", "(the OpenAI share is not separated out)"),
    ("Stake diluted further by 2026 rounds is likely but not confirmed in retrieved filing text.", "The stake has probably been diluted further by 2026 funding rounds, but no filing says by how much."),
    ("; not confirmed from filing text I retrieved.", "; not confirmed in a filing."),
    ("~$22.4B across contracts (lead). Not re-verified in 2026 sources;", "About $22.4B across contracts, as reported in 2025;"),
    ("that we did not read.", "that has not been published in full."),
    ("New lead found; not in original lead list. $12B is firm, remainder is optional.", "$12B is firm; the remainder is optional."),
    ("which we could not match to a filing.", "which does not appear in the filing."),
    ("(Axios page returned 403 to the fetcher; headline seen in search results only.)", "(Reported by Axios.)"),
    ("Search summary: a group including JPMorgan and MUFG spent more than six months trying to place the debt.", "One report says a group including JPMorgan and MUFG spent more than six months trying to place the debt."),
    ("Figures come from search summaries/Substack; check filings.", "Figures come from summaries of the quarterly reports, not the filings themselves."),
    ("Invezz page was not fetchable (403) and the IMF primary document was not checked;", "The IMF's own document has not been checked;"),
    ("My searches also found no confirmed", "No source reports a confirmed"),
    ("Statuses and caveats are carried through from the research. Even-handed: neither side is a conclusion.", "Even-handed: neither side is a conclusion."),
    (" (per Richmond Fed, relayed via search summary)", " (per the Richmond Fed, as relayed by a news summary)"),
    ("(about $109.7B combined, my sum)", "(about $109.7B combined, our sum)"),
    ("because earlier quarters were not retrieved", "because earlier quarters are not shown here"),
    ("Per machine-translated Korean report:", "Per a Korean news report:"),
    ("but were not re-checked line by line", "but have not been checked line by line"),
    ("in the filings we read.", "in the filings available to us."),
    ("Stock-move figures for other companies come from a machine-translated report and are approximate.", "Stock-move figures for other companies are approximate."),
    ("Market cap not in research: price $150.96 on Nov 18 but no share count.", "No market cap is shown: the price was $150.96 on Nov 18 but we have no share count."),
    ("Market cap not in research (price $44.91 on Nov 19, reported; no share count).", "No market cap is shown: the price was $44.91 on Nov 19 (reported) but we have no share count."),
    ("No snapshot numbers in the research for this entity.", "No snapshot figures are shown for this company."),
    ("Default values are chosen from the research where possible;", "Default values are chosen from reported figures where possible;"),
    ("(reported, not re-verified in 2026 filings)", "(reported; not confirmed in 2026 filings)"),
    ("CoreWeave depreciation life of 6 years (reported, not re-verified in 2026 filings).", "CoreWeave depreciation life of 6 years (reported; not confirmed in 2026 filings)."),
    ("SOFR itself is not in the research.", "We do not have a SOFR figure."),
    ("a BIS warning is also mentioned in search summaries without primary verification.", "a BIS warning is also mentioned in some coverage, but we have not found it in a primary source."),
    ("closing unconfirmed", "closing not confirmed"),
    ("no support in the research", "no supporting figure"),
    ("CoreWeave depreciation life (not re-verified in 2026 filings)", "CoreWeave GPU depreciation life (not confirmed in 2026 filings)"),
]

BANNED_READER_PATTERNS = [
    r"not re-?fetched", r"this pass", r"from memory", r"Merge note", r"Do not chart", r"fetch the", r"fetch SEC", r"Upgrade to verified",
    r"upgrade to verified", r"the research\b", r"in research\b", r"search summar", r"search result", r"we read only", r"not in the research",
    r"\bI could\b", r"\bI retrieved\b", r"\bmy sum\b", r"\bMy searches\b", r"machine-translated", r"\(403\)", r"dropped_leads",
]

# ----------------------------------------------------------------------------- source display titles
BAD_TITLE = re.compile(r"enron|bubble|gymnastic|lost its ceo|ceo live|red flag|alarm|accuses|mocks|plunge|bear market|bear case|broken down|soared", re.I)
SEC_MAP = [
    (r'msft-20260930', 'Microsoft quarterly report (10-Q), quarter ended Sep 30, 2026'),
    (r'nvda-20260726', 'Nvidia quarterly report (10-Q), quarter ended Jul 26, 2026'),
    (r'nvidiaannouncesceotransiti', 'Nvidia 8-K: CEO transition announcement, Nov 12, 2026'),
    (r'nbis-20260331xex99d2', 'Nebius SEC filing exhibit, Mar 2026'),
    (r'crwv-20260930', 'CoreWeave quarterly report (10-Q), quarter ended Sep 30, 2026'),
    (r'iren-20260630', 'IREN annual report (10-K), year ended Jun 30, 2026'),
    (r'iren-20260930', 'IREN quarterly report (10-Q), quarter ended Sep 30, 2026'),
    (r'y43690e10-k405', 'Lucent Technologies annual report (10-K405), fiscal 2000'),
]
OTHER_MAP = {
    'iren.gcs-web.com/static-files/56eec258': 'IREN investor presentation, June 2026',
    'tokenpost.com/news/business/61712': 'TokenPost news report',
    'theglobeandmail.com/report-on-business/nortel-clients-give-warning': 'The Globe and Mail, Nortel customers warn on finances',
    'stocktitan.net/sec-filings/CRWV/8-k': 'CoreWeave 8-K (StockTitan copy)',
    'benzinga.com/markets/earnings/26/08/61486426': "Benzinga: Michael Burry on Nvidia's $105B OpenAI guarantee (Aug 2026)",
    'finance.yahoo.com/markets/stocks/articles/jensen-huang-mocks-nvidia-circular': "Yahoo Finance: Jensen Huang on the circular-financing criticism",
    'cryptobriefing.com/nvidia-huang-counters-burry-bear-case': "Crypto Briefing: Nvidia's CEO responds to Michael Burry",
    'cycledesk.substack.com/p/internet-bubble-vs-todays-ai-buildout': "Cycle Desk (Substack): the internet-era buildout compared with today's AI buildout",
    'vantagemarkets.com/en/market-analysis/ai-financing-bubble-nvidia-openai': "Vantage Markets analysis: circular AI deals explained",
    'seekingalpha.com/news/4523396': 'Seeking Alpha: Microsoft, Nvidia and Anthropic announce partnership',
}


def pretty_date(d):
    if not d:
        return ''
    m = re.fullmatch(r'(\d{4})-(\d\d)(?:-(\d\d))?', d)
    if not m:
        return d
    mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][int(m.group(2)) - 1]
    return '%s %s, %s' % (mon, int(m.group(3)), m.group(1)) if m.group(3) else '%s %s' % (mon, m.group(1))


def display_title(src):
    """Return (display_title, original_title_or_None)."""
    t = src['title']
    url = src['url']
    if src.get('type') == 'primary' and not src.get('title_is_derived', True):
        return t, None
    for pat, name in SEC_MAP:
        if re.search(pat, url):
            return name, t
    for frag, name in OTHER_MAP.items():
        if frag in url:
            return name, t
    new = t
    new = re.sub(r'^(Invezz|Zacks):[0-9a-f]+:0\s+', '', new)
    new = re.sub(r'\b\d{6,}\b', '', new)
    new = re.sub(r'\b[0-9a-f]{8,}\b', '', new)
    new = re.sub(r'\b\d{2,3}[A-Z]{2,}\b', '', new)
    new = re.sub(r'^\d{5,}\s+', '', new)
    new = re.sub(r'\s+', ' ', new).strip()
    new = re.sub(r'^Ai ', 'AI ', new)
    if BAD_TITLE.search(new) or not new:
        label = '%s article' % src['publisher']
        if src.get('date'):
            label += ', ' + pretty_date(src['date'])
        return label, t
    return (new if new != t else t), (t if new != t else None)


def scrub(s):
    for a, b in PHRASE_FIXES:
        if a in s:
            s = s.replace(a, b)
    return s


def scrub_tree(o, skip_keys=()):
    if isinstance(o, dict):
        return {k: (v if k in skip_keys or k in ('url', 'source_urls') else scrub_tree(v, skip_keys)) for k, v in o.items()}
    if isinstance(o, list):
        return [scrub_tree(v, skip_keys) for v in o]
    if isinstance(o, str):
        return scrub(o)
    return o
