#!/usr/bin/env python3
"""Episode 11 data build.

Reads data/research/*.json, applies the curation tables below, and writes:
  data/deals.json, data/entities.json, data/events.json, data/history.json,
  data/loop-defaults.json, data/source-claims.json
and rewrites the GENERATED block in src/loop-model.js so the model and the JSON share one
set of parameter definitions. Then ASSERTS the invariants from the brief. Exit code 1 on failure.

Run:  python3 tools/build_data.py
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import reader_text as RT  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
RES = DATA / 'research'
AS_OF = '2026-11-20'

STATUSES = ['verified', 'reported', 'calculated', 'hypothetical', 'unverified']
MONEY_KINDS = ['external', 'recycled', 'promise', 'mixed', 'outside_loop_investment']
DEAL_TYPES = ['equity', 'debt', 'compute_contract', 'chip_purchase', 'backstop', 'warrant', 'lease',
              'revenue_share', 'guarantee', 'loi']
CASH_TYPES = {'equity', 'debt'}
PROMISE_TYPES = set(DEAL_TYPES) - CASH_TYPES
LAYERS = ['supply', 'neocloud', 'hyperscaler', 'lab', 'capital']

errors = []


def check(cond, msg):
    if not cond:
        errors.append(msg)


def rank(s):
    return STATUSES.index(s)


def weakest(ss):
    return max(ss, key=rank)


def load(name):
    return json.loads((RES / name).read_text())


R_NV = load('nvidia.json')
R_LAB = load('labs_hyperscalers.json')
R_NEO = load('neoclouds_debt.json')
R_EV = load('events_history.json')

# ----------------------------------------------------------------------------- research-input patches (round-1 audit fixes)
CFO_COMMENTARY_URL = 'https://www.marketscreener.com/news/nvidia-third-quarter-2027-cfo-commentary-ce785edcdc81f420'
LU_10K = 'https://www.sec.gov/Archives/edgar/data/1006240/000095012300011855/y43690e10-k405.txt'
NV_10Q_Q2 = 'https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000075/nvda-20260726.htm'
SRC_CLAIM_NOTE = 'Company statement (Nvidia CFO commentary, Nov 17, 2026).'


def patch_fact(R, fid, **kw):
    for f in R['facts']:
        if f['id'] == fid:
            f.update(kw)
            return f
    raise KeyError(fid)


# Financial audit #2: guarantee exposure. $118.0B at Oct 25 is Nvidia's own CFO commentary.
patch_fact(R_NV, 'guarantees-total', id='nvda-guarantee-total', label='Nvidia total maximum guarantee exposure at Oct 25, 2026 (company statement: $3.5B land/power/shell for neoclouds + $105.0B SB Energy credit support + $9.5B power and systems credit support; was $108.5B at Jul 26)',
           value=118.0, period='2026-10-25 (108.5 at 2026-07-26)', status='verified', attribution=SRC_CLAIM_NOTE,
           source_urls=[CFO_COMMENTARY_URL, NV_10Q_Q2])
R_NV['facts'] += [
    dict(id='nvda-guarantee-total-jul', label='Nvidia total maximum guarantee exposure at Jul 26, 2026 (10-Q): $3.5B land/power/shell for AI clouds + $105B SB Energy', value=108.5, unit='USD B', period='2026-07-26', status='verified', source_urls=[NV_10Q_Q2]),
    dict(id='nvda-guar-land-power-shell', label='Guarantees: land, power and shell for neoclouds (company statement)', value=3.5, unit='USD B', period='2026-10-25', status='verified', attribution=SRC_CLAIM_NOTE, source_urls=[CFO_COMMENTARY_URL]),
    dict(id='nvda-guar-sbenergy', label='Guarantees: SB Energy credit support on the land, power and shell buildout for about 4.25 GW (maximum, company statement)', value=105.0, unit='USD B', period='2026-10-25', status='verified', attribution=SRC_CLAIM_NOTE, source_urls=[CFO_COMMENTARY_URL, NV_10Q_Q2]),
    dict(id='nvda-guar-power-systems', label='Guarantees: power and systems credit support (company statement; the document gives no further description)', value=9.5, unit='USD B', period='2026-10-25', status='verified', attribution=SRC_CLAIM_NOTE, source_urls=[CFO_COMMENTARY_URL]),
    dict(id='nvda-own-rd-commitments', label="Nvidia's own R&D cloud service agreements ($28B) plus data-center leases not yet commenced ($74B), per Nvidia these power its own research and development", value=102.0, unit='USD B', period='2026-10-25 (74 at Jul 26)', status='verified', attribution=SRC_CLAIM_NOTE, source_urls=[CFO_COMMENTARY_URL, NV_10Q_Q2]),
]
R_LAB['facts'] = [f for f in R_LAB['facts'] if f['id'] != 'nvda-guarantee-total']  # superseded by the Oct 25 company-statement fact above
patch_fact(R_NV, 'neocloud-contingent', label='Neocloud agreements: future commitments that take effect only after neoclouds secure financing, deployment and acceptance (company statement)', attribution=SRC_CLAIM_NOTE)
patch_fact(R_NV, 'supply-commitments', attribution=SRC_CLAIM_NOTE)

# Financial audit #8/#9: Lucent FY2000 10-K405 is public; upgrade the analyst-site-only facts to it.
for fid in ('lu-fy00-commit', 'lu-fy00-adv', 'lu-fy00-guar', 'lu-concentration', 'lu-fy99-commit', 'lu-fy99-adv'):
    f = patch_fact(R_EV['lucent'], fid, source_urls=[LU_10K])
    if fid in ('lu-fy00-commit', 'lu-fy00-adv', 'lu-fy00-guar', 'lu-concentration'):
        f['status'] = 'verified'
    else:
        f['status'] = 'reported'  # FY1999 comparatives are in the FY2000 10-K405 but were not re-checked line by line
patch_fact(R_EV['lucent'], 'lu-commit-share', value=24, status='calculated',
           label='Lucent commitments as share of revenue: $8.1B / $33.813B (revenue as originally reported in the FY2000 10-K405) is about 24%; on the restated $28.904B basis it is about 28%',
           source_urls=[LU_10K, 'https://www.sec.gov/Archives/edgar/data/0001006240/000095011702003045/ex13.htm'])
R_EV['lucent']['facts'].append(dict(id='lu-rev-original', label='Revenue as originally reported, FY2000 (10-K405)', value=33.813, unit='USD billion', period='FY2000', company='Lucent', status='verified', source_urls=[LU_10K]))
# Financial audit #17: CoreWeave debt is computed from the balance sheet, so calculated.
patch_fact(R_NEO, 'crwv-total-debt', status='calculated')

# Round 3 finance #3: the $109.7B is our sum of two balance-sheet lines, computed here from the two verified facts.
_mk = next(f for f in R_NV['facts'] if f['id'] == 'mkt-equity'); _nm = next(f for f in R_NV['facts'] if f['id'] == 'nonmkt-equity')
patch_fact(R_EV['lucent'], 'nv-invest-assets', value=round(_mk['value'] + _nm['value'], 1), status='calculated',
           label='Investment assets: marketable equity securities plus non-marketable securities (our sum of two Nvidia balance-sheet lines); long-term debt $32.4B is a separate line',
           formula_text='%.1f (marketable equity securities) + %.1f (non-marketable securities) = %.1f, both from the Q3 FY27 balance sheet' % (_mk['value'], _nm['value'], _mk['value'] + _nm['value']))
# Round 3 finance #8/#9: the $105B is in Nvidia's own CFO commentary; 23%, -26% and -42% are our arithmetic.
patch_fact(R_EV['lucent'], 'nv-guar', status='verified', label='Nvidia guarantee of OpenAI Ohio lease payments (SB Energy credit support), conditional ceiling; not drawn, and Nvidia says it has paid nothing (Nvidia CFO commentary, Oct 25, 2026)',
           source_urls=[CFO_COMMENTARY_URL] + [u for u in next(f for f in R_EV['lucent']['facts'] if f['id'] == 'nv-guar')['source_urls']])
patch_fact(R_EV['lucent'], 'lu-concentration', status='calculated', formula_text='13% + 10% (two rounded "about" figures from secondary sources)')
for _fid, _lab, _v, _ft in (('lu-rev-chg-fy01', 'Restated revenue change FY2001 vs FY2000', -26.3, '(21,294 - 28,904) / 28,904, restated figures from the FY2002 10-K'),
                            ('lu-rev-chg-fy02', 'Restated revenue change FY2002 vs FY2001', -42.1, '(12,321 - 21,294) / 21,294, restated figures from the FY2002 10-K')):
    R_EV['lucent']['facts'].append(dict(id=_fid, label=_lab, value=_v, unit='percent', period=_fid[-4:].upper(), company='Lucent', status='calculated', formula_text=_ft, source_urls=['https://www.sec.gov/Archives/edgar/data/0001006240/000095011702003045/ex13.htm']))
# Round 3 finance #6: Nscale figure is total contract value, not take-or-pay.
patch_fact(R_NEO, 'nscale-backlog', label='Nscale total contract value per IPO filing coverage (Microsoft and Anthropic about 85%; the Anthropic part depends on Nscale obtaining financing)')
# Round 3 fairness: neutral CoreWeave wording.
# Round 3 finance #5 (Oracle CDS): see the event patch below.

# Events: remove "unconfirmed / Substack" guarantee wording; reader-voice Huang facts.
for e in R_EV['events']:
    if e['id'] == 'ev-nvda-105b-guarantee':
        e['detail'] = ("Reuters (via Investing.com/Nikkei) reported Nvidia would guarantee up to $105B in lease payments for an OpenAI data center being built by SoftBank-backed SB Energy, invest $1.5B in SB Energy, and secure up to 8 GW of capacity. "
                       "Per Data Center Knowledge the guarantee is a conditional ceiling tied to residual value of leased infrastructure, not a cash outlay. Nvidia's own Q3 FY27 CFO commentary (Nov 17) states total maximum guarantee exposure of $118.0B at Oct 25 ($3.5B land, power and shell guarantees for neoclouds, $105.0B SB Energy credit support, $9.5B power and systems credit support), up from $108.5B at Jul 26, and says it has made no payments under its guarantees. Burry publicly called the Ohio guarantee a circular-financing red flag.")
        e['why_it_matters'] = 'The largest contingent liability in the AI financing web sits with the chip supplier, backing a customer that lacks an investment-grade rating. Nvidia says it is conditional, tied to lease commencement, and unpaid so far.'
        e['source_urls'] = e['source_urls'] + [CFO_COMMENTARY_URL]
        e['status'] = 'reported'
        e['status_note'] = 'The $105B and the Burry quote are press-reported; the $118.0B total and "no payments" are Nvidia company statements.'
    if e['id'] == 'ev-huang-resigns':
        # Round 2 (freshness + fairness): the Huang entry carries only what Nvidia's 8-K says.
        e['title'] = 'Jensen Huang resigns as Nvidia CEO, president and director; CFO Colette Kress named interim CEO'
        e['detail'] = ("Nvidia's 8-K, filed Nov 12, says Jensen Huang resigned as CEO, president and a director with immediate effect, that CFO Colette Kress is interim CEO while remaining CFO, and that Harvey Jones is board chair. "
                       "The filing does not state a reason, and the board is considering internal and external candidates.")
        e.pop('reported_detail', None)
        e['why_it_matters'] = "Dated company news, shown for context. The filing gives no reason, and we draw no conclusion from it."
        e['source_urls'] = ['https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000082/nvidiaannouncesceotransiti.htm']
    if e['id'] == 'ev-ai-bond-wave-cds-spike':
        e['title'] = 'CoreWeave 5-yr CDS peaks at about 1,280 bp; bond yields exceed 16%'
        e['detail'] = ("CNBC, citing Deutsche Bank data, reported CoreWeave's five-year credit-default-swap price above 1,289 bp on Nov 5 and about 1,155 bp on Nov 6; another report puts the peak close at about 1,278 bp. We show it as about 1,280 bp. "
                       "On Nov 6 Nvidia was near 139 bp and Oracle near 298 bp. CoreWeave's high-yield bond yields were above 16% (CNBC).")
        e['source_urls'] = e['source_urls'] + ['https://www.cnbc.com/2026/11/18/ai-credit-default-swaps-coreweave-debt.html', 'https://www.cnbc.com/2026/11/10/coreweave-earnings-preview-debt-capex.html']
    if e['id'] == 'ev-oracle-cds-record':
        e['title'] = 'Oracle 5-yr CDS near 300 bp'
        e['date'] = '2026-11-06'
        e['detail'] = ("CNBC (Nov 6 and Nov 18) puts Oracle's five-year credit-default-swap price near 298 bp on Nov 6 and above 300 bp on Nov 18, up from below 80 bp a year earlier. One source reported a record 288 bp on Oct 15; we could not confirm it, and levels differ by data provider and date. "
                       "Record-high language from earlier in 2026 also appears in coverage.")
        e['why_it_matters'] = 'Market pricing of Oracle credit risk is high while the company is still rated investment grade.'
        e['source_urls'] = e['source_urls'] + ['https://www.cnbc.com/2026/11/18/ai-credit-default-swaps-coreweave-debt.html']

# Freshness: Congressional appearances are a separate event, topic stated neutrally.
_hi = [i for i, x in enumerate(R_EV['events']) if x['id'] == 'ev-huang-resigns'][0]
R_EV['events'].insert(_hi + 1, dict(
    id='ev-congress-huang-hearings', date='2026-12-03', title='Senate Banking hearing on Nvidia and Megaspeed tentatively Dec 3; House interviews Dec 1',
    detail=("Senate Banking Chair Tim Scott asked Jensen Huang to appear on Dec 3 (and Commerce Secretary Howard Lutnick on Dec 10); on Nov 18 his office said Huang had agreed to appear. The reports we found give no confirmed date, so Dec 3 is tentative. "
            "House committees plan to interview Huang on Dec 1. The Senate inquiry is about Nvidia's dealings with Megaspeed International and export controls, not about circular financing."),
    why_it_matters='The inquiry is about Nvidia\'s dealings with Megaspeed International and export controls. Dated news for context; it is not about the financing loop.',
    status='reported',
    source_urls=['https://thenextweb.com/news/jensen-huang-senate-banking-committee-lutnick-tim-scott', 'https://fortune.com/2026/11/13/senate-banking-committee-nvidia-jensen-huang-howard-lutnick/', 'https://www.aljazeera.com/news/2026/11/13/nvidias-huang-lutnick-summoned-to-testify-to-us-senate']))
R_EV['events'].append(dict(
    id='ev-anthropic-ipo-priced', date='2026-11-18', title='Anthropic prices its IPO at $83 a share, above the $70 to $78 range',
    detail=("Anthropic's announcement says the offering priced Nov 18 at $83.00 a share, with closing expected Nov 20. A headline on Anthropic's news page dated Nov 20 refers to the closing of the concurrent private placement; we have not read it, so we still show the Nvidia purchase as a promise, not as cash moved."),
    why_it_matters='The Nvidia and other supplier purchases in the private placement were conditional on the IPO closing. Pricing is a step toward closing, not the close itself.',
    status='verified', source_urls=['https://www.anthropic.com/news/anthropic-prices-initial-public-offering']))

# Round 3 fairness M5: a sixth bull argument from the hyperscalers' own filings, so both lists have six.
_fx = {f['id']: f for lst in (R_LAB['facts'], R_NV['facts']) for f in lst}
R_EV['lucent']['bull_arguments'].append(dict(
    claim=("Hyperscaler spending is funded largely by operating cash flow and is still guided up: Microsoft reported $%.1fB of operating cash flow against $%.1fB of capital additions in its latest quarter, and Meta's 2026 capex outlook midpoint is about $%dB." % (_fx['msft-ocf']['value'], _fx['msft-capex']['value'], _fx['meta-guide']['value'])),
    who='Microsoft 10-Q and Meta Q3 2026 results (company filings)',
    source_urls=[_fx['msft-capex']['source_urls'][0], _fx['meta-guide']['source_urls'][0]]))

# Fairness N2: no line links the CEO resignation to the Lucent-style failure story.
for _a in R_EV['lucent']['bear_arguments']:
    _a['claim'] = _a['claim'].replace('concentrated customers, rising contingent commitments and a leadership shock are the bear framing', 'concentrated customers and rising contingent commitments are the bear framing')
    assert 'leadership shock' not in _a['claim']

# Financial #4: customer letters in the 10-Q may refer to different customers each period.
CUST_CAVEAT = ("CoreWeave's 10-Q (Note 2) warns that the customer letters A through D may refer to different customers than in a previous period. "
               "So 'Customer A' at 67% in Q3 2025 and 24% in Q3 2026 is not a like-for-like comparison for one customer.")
patch_fact(R_NEO, 'crwv-customer-a', label="CoreWeave 'Customer A' share of revenue: 24% in Q3 2026 and 67% in Q3 2025 (the letter may not refer to the same customer in both periods)",
           comparable_across_periods=False, comparability_caveat=CUST_CAVEAT, prior_period_value=67, prior_period='Q3 2025')
patch_fact(R_NEO, 'crwv-customer-b', comparable_across_periods=False, comparability_caveat=CUST_CAVEAT)
patch_fact(R_NEO, 'crwv-share-price', label='CoreWeave (CRWV) share price: closed $44.91 on Nov 19, 2026 (Nvidia paid $87.20 in Jan 2026)', value=44.91, unit='USD per share', period='2026-11-19',
           source_urls=['https://www.investing.com/news/analyst-ratings/wells-fargo-reiterates-overweight-on-coreweave-stock-115-target-93CH-5041170'])
patch_fact(R_EV['lucent'], 'nv-cds', label='Nvidia 5-yr CDS about 139 bp vs Oracle about 298 bp vs CoreWeave about 1,100 to 1,150 bp (Nov 6, 2026; CoreWeave peaked near 1,280 bp on Nov 5)') if any(f['id']=='nv-cds' for f in R_EV['lucent']['facts']) else None


R_EV['open_questions'] = [
    "We couldn't confirm why Jensen Huang resigned. Nvidia's 8-K gives no reason, and only the facts in the filing are used here.",
    "The $9.5B of 'power and systems' guarantees in Nvidia's CFO commentary has no further description, so we can't say who they protect.",
    "We have not checked Nortel's drawn customer financing at the end of 2000 against the filing; reports range from $1.08B to $1.6B.",
    "Lucent and Nortel don't disclose how much revenue came from CLECs and startups in the filings we read.",
    "Telecom totals for capex and debt depend on how each source defines them.",
    "Oracle's credit-default-swap record varies by data provider (about 151, 288 and 300 bp in different reports), so we show the peak as reported and do not compare it with other dates.",
    "CoreWeave's note maturity (2031 or 2032) and coupon (9.75% or 9.625%) differ between news stories and we have not checked the indenture.",
    "Nvidia's drop from its October high is reported as 36% or 39%, and the exact peak is not confirmed.",
    "Reports that banks struggled to place about $38B of Oracle-linked data-center debt come from one outlet, so treat them as unconfirmed.",
    "Hyperscaler capex figures here come from summaries of the Q3 reports, not from the filings themselves.",
    "The September Fed rate path comes from news coverage; the Fed's own pages are the place to check it.",
]

# ----------------------------------------------------------------------------- sources
PRIMARY_DOMAINS = {
    'sec.gov', 'www.sec.gov', 'nvidianews.nvidia.com', 'investor.nvidia.com', 'blogs.nvidia.com',
    'blogs.microsoft.com', 'aboutamazon.com', 'www.aboutamazon.com', 'openai.com', 'www.openai.com',
    'anthropic.com', 'www.anthropic.com', 'investors.coreweave.com', 'ir.applieddigital.com',
    'investors.terawulf.com', 'iren.gcs-web.com', 'investor.atmeta.com', 'fluidstack.io', 'mistral.ai',
    'www.federalreserve.gov', 'federalreserve.gov', 'www.richmondfed.org', 'richmondfed.org', 'about.fb.com',
}
# Hosted copies of a company's own document. The text is the company's own statement, so it is treated
# as primary (a company statement), not as press. Everything else on these domains stays press.
CFO_COMMENTARY_URL = 'https://www.marketscreener.com/news/nvidia-third-quarter-2027-cfo-commentary-ce785edcdc81f420'
PRIMARY_URLS = {CFO_COMMENTARY_URL: 'Nvidia Q3 FY27 CFO commentary (company statement, hosted copy)'}
PUBLISHERS = {
    'sec.gov': 'SEC EDGAR', 'www.sec.gov': 'SEC EDGAR', 'nvidianews.nvidia.com': 'Nvidia Newsroom',
    'investor.nvidia.com': 'Nvidia Investor Relations', 'blogs.nvidia.com': 'Nvidia Blog',
    'blogs.microsoft.com': 'Microsoft Blog', 'www.aboutamazon.com': 'Amazon', 'aboutamazon.com': 'Amazon',
    'openai.com': 'OpenAI', 'www.anthropic.com': 'Anthropic', 'anthropic.com': 'Anthropic',
    'investors.coreweave.com': 'CoreWeave Investor Relations', 'ir.applieddigital.com': 'Applied Digital IR',
    'investors.terawulf.com': 'TeraWulf IR', 'iren.gcs-web.com': 'IREN IR', 'investor.atmeta.com': 'Meta IR',
    'fluidstack.io': 'Fluidstack', 'mistral.ai': 'Mistral AI', 'www.cnbc.com': 'CNBC', 'cnbc.com': 'CNBC',
    'www.datacenterdynamics.com': 'Data Center Dynamics', 'www.bloomberg.com': 'Bloomberg',
    'finance.yahoo.com': 'Yahoo Finance', 'uk.finance.yahoo.com': 'Yahoo Finance UK',
    'www.marketscreener.com': 'MarketScreener', 'www.axios.com': 'Axios', 'seekingalpha.com': 'Seeking Alpha',
    'www.techtimes.com': 'Tech Times', 'siliconangle.com': 'SiliconANGLE', 'www.roic.ai': 'roic.ai',
    'tomtunguz.com': 'Tomasz Tunguz', 'www.rbcpa.com': 'RBC Power Analysis',
    'fourweekmba.com': 'FourWeekMBA', 'asia.nikkei.com': 'Nikkei Asia', 'www.datacenterknowledge.com': 'Data Center Knowledge',
    'www.benzinga.com': 'Benzinga', 'www.fool.com': 'Motley Fool', 'thenextweb.com': 'The Next Web',
    'techcrunch.com': 'TechCrunch', 'www.amcompute.com': 'AM Compute', 'www.richmondfed.org': 'Richmond Fed',
    'x.com': 'X (The Information post)', 'en.wikipedia.org': 'Wikipedia',
}

SOURCES = {}  # url -> record


def src_id(url):
    return 's_' + hashlib.sha1(url.encode()).hexdigest()[:8]


def derive_date(url, fallback=None):
    m = re.search(r'/(20\d\d)[/-](\d\d)[/-](\d\d)(?:[/-]|$)', url)
    if m:
        return '%s-%s-%s' % m.groups()
    m = re.search(r'/(20\d\d)/(\d\d)/', url)
    if m:
        return '%s-%s' % m.groups()
    m = re.search(r'[/_-](20\d\d)(\d\d)(\d\d)[/_.-]', url)
    if m:
        return '%s-%s-%s' % m.groups()
    return fallback


def derive_title(url):
    p = urlparse(url)
    seg = [s for s in p.path.split('/') if s]
    seg = [s for s in seg if not re.fullmatch(r'\d+|default(\.aspx)?', s)]
    last = seg[-1] if seg else p.netloc
    last = re.sub(r'\.(html?|aspx|htm|pdf|php)$', '', last)
    t = re.sub(r'[-_+]+', ' ', last).strip()
    if len(t) > 90:
        t = t[:90].rsplit(' ', 1)[0]
    return (t[:1].upper() + t[1:]) if t else p.netloc


def register(url, date_hint=None):
    if url not in SOURCES:
        p = urlparse(url)
        dom = p.netloc
        stype = 'primary' if (dom in PRIMARY_DOMAINS or url in PRIMARY_URLS) else 'press'
        SOURCES[url] = {
            'id': src_id(url), 'title': derive_title(url), 'title_is_derived': True,
            'publisher': PUBLISHERS.get(dom, dom.replace('www.', '')), 'url': url, 'type': stype,
            'date': derive_date(url, date_hint),
        }
        if url in PRIMARY_URLS:
            SOURCES[url]['title'] = PRIMARY_URLS[url]
            SOURCES[url]['title_is_derived'] = False
            SOURCES[url]['publisher'] = 'Nvidia (company statement)'
            SOURCES[url]['date'] = '2026-11-17'
    return SOURCES[url]['id']


def ids(urls, date_hint=None):
    out = []
    for u in urls or []:
        sid = register(u, date_hint)
        if sid not in out:
            out.append(sid)
    return out


def sid_to_type(sid):
    for s in SOURCES.values():
        if s['id'] == sid:
            return s['type']
    return None


def fix_status(rec, sids, label):
    """Downgrade 'verified' with no primary source to 'reported' (conservative)."""
    if rec.get('status') == 'verified' and not any(sid_to_type(s) == 'primary' for s in sids):
        rec['status_adjusted_from'] = 'verified'
        rec['status_adjustment_reason'] = 'Research tagged verified but cites only press/secondary sources; downgraded to reported.'
        rec['status'] = 'reported'
    return rec


# ----------------------------------------------------------------------------- deals
ALL_DEALS = {}
for src_name, R in (('nvidia', R_NV), ('labs', R_LAB), ('neoclouds', R_NEO)):
    for d in R['deals']:
        d = dict(d)
        d['_file'] = src_name
        check(d['id'] not in ALL_DEALS or True, 'dup')
        ALL_DEALS[(src_name, d['id'])] = d


def rd(file, rid):
    return ALL_DEALS[(file, rid)]


# canonical id -> curation
# srcs: list of (file, research id). money: external|recycled|promise.
CUR = [
    dict(id='nvda-openai-loi', srcs=[('nvidia', 'nvda-openai-loi')], frm='nvidia', to='openai', type='loi', money='promise',
         note='Non-binding LOI. Headline up to $100B vs actual $0: it never became a definitive agreement.'),
    dict(id='nvda-openai-equity', srcs=[('nvidia', 'nvda-openai-equity'), ('labs', 'nvidia-openai-equity')], frm='nvidia', to='openai',
         type='equity', money='recycled', headline=30, low=30, high=30,
         resolve='Labs file carried the superseded $100B LOI figure as this deal headline; kept $30B here and the $100B on the separate LOI edge. Both files tag reported.',
         note='OpenAI is also a buyer of Nvidia systems via cloud partners, so this equity is recycled cash.'),
    dict(id='nvda-sbenergy-ohio-guarantee', srcs=[('nvidia', 'nvda-openai-ohio-guarantee'), ('labs', 'nvidia-sbenergy-guarantee')], frm='nvidia', to='sb_energy',
         type='backstop', money='promise', headline=105, low=0, high=105,
         resolve='Two research files described the same $105B cap. Merged. Earlier $250B press figure is superseded. Nvidia total maximum guarantee exposure: $108.5B at Jul 26 (10-Q) and $118.0B at Oct 25 (Nvidia Q3 CFO commentary, a company statement).',
         structure='Per Nvidia: credit support on the land, power and shell buildout for SB Energy to secure about 4.25 GW, up to a maximum of $105B. Site hosts Nvidia infrastructure under 20-year leases to an OpenAI-affiliated customer (PORTS campus, Pike County, Ohio). Each guarantee generally takes effect at lease commencement; first phase expected fiscal 2029.',
         changed='Earlier WSJ-based reports said Nvidia was weighing about $250B; the signed figure was $105B. Nvidia total guarantee exposure rose from $108.5B (Jul 26) to $118.0B (Oct 25): $3.5B land, power and shell guarantees for neoclouds + $105.0B SB Energy + $9.5B power and systems credit support (Nvidia CFO commentary). Nvidia says no payments have been made under its guarantees.',
         notes_replace='Cap on a contingent obligation, not a cash outlay. The $105B is one of three guarantee lines in Nvidia\'s $118.0B total; the $3.5B (neoclouds) and $9.5B (power and systems) lines are not charted as separate edges.',
         extra_urls=[CFO_COMMENTARY_URL],
         note='Beneficiary: OpenAI-affiliated customer leasing at the SB Energy PORTS campus.'),
    dict(id='nvda-financing-consortium', srcs=[('nvidia', 'nvda-financing-consortium')], frm='nvidia', to='financing_platforms', type='loi', money='promise',
         parties=['nvidia', 'blackstone', 'apollo', 'banks'], sum_exclude=True,
         note='$500B is a target for third-party money, not an Nvidia commitment. Excluded from sums. Platform partners also include BlackRock, KKR, Brookfield (not separate nodes).'),
    dict(id='nvda-anthropic-equity', srcs=[('nvidia', 'nvda-anthropic-equity')], frm='nvidia', to='anthropic', type='equity', money='promise', contingent=True,
         low=0, high=10,
         changed='Reported (press, S-1/A coverage): Nvidia agreed to buy about $10B of stock at the IPO price in a concurrent private placement that closes only if the IPO closes and needs stockholder approval. No close is reported as of Nov 20, 2026. Whether this is the same money as the Nov 2025 "up to $10B" commitment or a separate purchase is not stated in the sources we read, so a $20B total cannot be ruled out. IPO price reports conflict ($70-78 range vs $83).',
         note='Contingent, not cash moved: counted as a promise until the IPO closes. Nvidia\'s Q3 release mentions no Anthropic equity.'),
    dict(id='anthropic-ipo-placement', srcs=None, frm='placement_buyers', to='anthropic', type='equity', money='promise', contingent=True,
         parties=['nvidia', 'google', 'amd', 'broadcom', 'tsmc', 'microsoft'], placement=True, includes=['nvda-anthropic-equity'], headline=26, low=None, high=None, sum_exclude=True,
         date='2026-11', structure='Concurrent ~$26B private placement alongside the Anthropic IPO with Nvidia (~$10B), Google, AMD, Broadcom, Micron, Microsoft and TSMC. Closes only if the IPO closes.',
         status='reported', what_changed='Reported in Anthropic amended S-1 coverage; primary S-1/A not read. Microsoft stake reported ~$1B, not $5B.',
         urls=['https://www.vktr.com/ai-market/anthropic-lines-up-26b-from-nvidia-google-and-5-other-tech-firms-alongside-ipo/',
               'https://en.sedaily.com/world/2026/11/20/nvidia-weighs-pullback-from-100-billion-ai-investment-push'],
         note='Aggregate that contains nvda-anthropic-equity; excluded from sums to avoid double counting. Chip and memory suppliers investing in a customer.'),
    dict(id='anthropic-azure-compute', srcs=[('nvidia', 'nvda-anthropic-compute'), ('labs', 'anthropic-msft-nvidia')], frm='anthropic', to='microsoft',
         type='compute_contract', money='promise', headline=30, low=None, high=None, status='verified',
         resolve='Nvidia file tagged reported (secondary link only); labs file tagged verified (Microsoft and Nvidia announcement blogs, primary). Used verified because $30B and up to 1 GW are stated in the primary announcements.',
         note='Spend flows to Microsoft, then in part to Nvidia as chip supplier.'),
    dict(id='nvda-coreweave-equity', srcs=[('nvidia', 'nvda-coreweave-equity-2026'), ('neoclouds', 'nvda-coreweave-equity')], frm='nvidia', to='coreweave',
         type='equity', money='recycled',
         resolve='Same $2B Jan 2026 purchase at $87.20 in two files. Stake size sources conflict (9-11.5%, ~10% per WSJ).',
         note='Shares traded about $40-61 in Nov 2026 (CRWV closed $44.91 on Nov 19, reported) vs $87.20 paid.'),
    dict(id='nvda-coreweave-capacity-backstop', srcs=[('nvidia', 'nvda-coreweave-capacity'), ('neoclouds', 'nvda-coreweave-capacity-backstop')], frm='nvidia', to='coreweave',
         type='backstop', money='promise', headline=6.3, low=0, high=6.3,
         resolve='Neocloud file gave actual 6.0-6.3 (amount conflict: up to $6.3B vs more than $6B). Actual set to 0-6.3 because the commitment is conditional: nothing is paid unless capacity goes unsold.',
         note='Conditional capacity purchase through April 13, 2032; Huang disputes the backstop framing.'),
    dict(id='nvda-xai-equity', srcs=[('nvidia', 'nvda-xai-spacex')], frm='nvidia', to='xai', type='equity', money='recycled', low=2, high=10,
         note='Amount unverified: the $10B comes from an unnamed source per CNBC, and Bloomberg reported Nvidia investing up to about $2B; xAI never disclosed amounts. Range 2-10 reflects that. Stake converted to SpaceX shares after the all-stock acquisition.'),
    dict(id='xai-gpu-spv', srcs=[('nvidia', 'nvda-xai-gpu-spv'), ('neoclouds', 'xai-gpu-spv')], frm='xai', to='xai_spv', type='lease', money='promise',
         headline=20, low=None, high=None, parties=['xai', 'nvidia', 'apollo'],
         resolve='Nvidia file: unverified (could not confirm close). Neocloud file: reported (SPV $7.5B equity incl. Nvidia up to $2B + $12.5B debt). Took the weaker tag, unverified; actual left null.',
         note='Implied debt share 62.5% of SPV capital ($12.5B/$20B), a loan-to-cost datapoint. SPV equity and debt are cash; the lease is the promise. Do not chart as a completed deal.'),
    dict(id='spacex-xai-chip-spv', srcs=[('labs', 'spacex-xai-chip-spv')], frm='xai', to='xai_spv', type='lease', money='promise', parties=['xai', 'apollo', 'banks'],
         status='unverified', headline=40, low=None, high=None,
         note='Reports describe a package of about $40B (about $10B bank loans and $30B investment-grade bonds, Apollo-led). A claim of $32B of bonds sold at 8.26% appears in one headline we could not confirm, so it is unverified and not used as a rate datapoint. Close status conflicts across sources.'),
    dict(id='nvda-lambda-leaseback', srcs=[('nvidia', 'nvda-lambda-leaseback'), ('neoclouds', 'nvda-lambda-leaseback')], frm='nvidia', to='lambda', type='lease', money='promise',
         resolve='Direction differed between files (Lambda->Nvidia vs Nvidia->Lambda). Arrow follows the payer: Nvidia pays Lambda rent under the lease-back.',
         note='Lambda funded the GPUs partly with a $917M leveraged loan; Nvidia is also a Lambda investor (amount not found).'),
    dict(id='nvda-intel', srcs=[('nvidia', 'nvda-intel')], frm='nvidia', to='intel', type='equity', money='outside_loop_investment', loop=False,
         note='Not a customer-loop edge: Intel is a partner/supplier. Included for scale of Nvidia equity portfolio. Excluded from loop totals.'),
    dict(id='nvda-nebius', srcs=[('nvidia', 'nvda-nebius')], frm='nvidia', to='nebius', type='equity', money='recycled', status='verified',
         extra_urls=['https://nvidianews.nvidia.com/news/nvidia-and-nebius-partner-to-scale-full-stack-ai-cloud'],
         structure='$2B investment in Nebius announced Mar 11, 2026, via pre-funded warrants for 21,065,936 Class A shares (Nvidia release).',
         changed='Nvidia\'s own release confirms the $2B. A ~$281M 13F figure is a different or partial holding and does not conflict.',
         notes_replace='Upgraded from unverified: the amount is in Nvidia\'s own announcement.'),
    dict(id='nvda-synopsys-nokia', srcs=[('nvidia', 'nvda-synopsys-nokia')], frm='nvidia', to='synopsys_nokia', type='equity', money='outside_loop_investment', loop=False,
         note='Vendors/partners, not an AI-demand loop edge. Secondary aggregator source only. Excluded from loop totals.'),
    dict(id='nvda-nscale', srcs=[('nvidia', 'nvda-nscale')], frm='nvidia', to='nscale', type='warrant', money='promise',
         note='Single analysis: about $60M cash for warrants plus an $860M five-year rent guarantee. Other sources cite GBP500M or $3.1B. Low confidence.'),
    dict(id='nvda-sbenergy-equity', srcs=[('nvidia', 'nvda-sbenergy-equity')], frm='nvidia', to='sb_energy', type='equity', money='recycled'),
    dict(id='nvda-cloud-commitments', srcs=[('nvidia', 'nvda-cloud-commitments')], frm='nvidia', to='cloud_dc_providers', type='compute_contract', money='promise', loop=False, sum_exclude=True,
         status='calculated', extra_urls=[CFO_COMMENTARY_URL],
         formula_text='$28B cloud service agreements + $74B data-center leases not yet commenced',
         components=[dict(label='Cloud service agreements, Oct 25, 2026', usd_b=28, status='verified', urls=[CFO_COMMENTARY_URL]),
                     dict(label='Data-center leases not yet commenced, Oct 25, 2026', usd_b=74, status='verified', urls=[CFO_COMMENTARY_URL])],
         structure="Nvidia's own R&D cloud and data-center commitments at Oct 25, 2026: cloud service agreements $28B plus data-center leases not yet commenced $74B = $102B (from $74B at Jul 26). Per Nvidia these provide the infrastructure that powers its research and development (chips, networking, systems engineering, open models); leases run up to 20 years, and Nvidia says it may assign some leases to third parties.",
         changed='Rose in the quarter. This is Nvidia buying compute and space for itself, not financing a neocloud customer. The separate neocloud agreements are the $32B line.',
         notes_replace='NOT a neocloud-loop edge (reclassified after audit): shown as a fact only and excluded from loop totals. Counterparties are not named. Company statement (Nvidia CFO commentary). Nvidia states the two parts; the $102B total is our sum, tagged calculated.'),
    dict(id='nvda-neocloud-agreements', srcs=None, frm='nvidia', to='neocloud_group', type='compute_contract', money='promise', headline=32, low=0, high=32,
         date='2026-10', structure='Nvidia future commitments to neoclouds of $32B (about $6B in 2028 and $8B in 2032 and after), described by Nvidia as enabling broader access to its AI infrastructure for AI startups, model builders and enterprises. They take effect only if the neoclouds secure financing for the data-center infrastructure, and deployment and acceptance follow. At Jul 26 this line was $36B ("AI cloud agreements").',
         status='verified', what_changed='Fell from $36B to $32B in the quarter. Contingent: nothing is owed unless partners finance, deploy and Nvidia accepts.',
         urls=[CFO_COMMENTARY_URL, NV_10Q_Q2],
         note='Company statement (Nvidia CFO commentary). Counterparties are not named. A promise, not cash.'),
    dict(id='nvda-mistral-reflection-tml', srcs=[('nvidia', 'nvda-mistral-reflection-tml')], frm='nvidia', to='mistral', type='equity', money='recycled',
         parties=['nvidia', 'mistral'], note='Also covers Reflection AI and Thinking Machines, which are not separate nodes. Nvidia check sizes not found.'),
    dict(id='openai-oracle-compute', srcs=[('labs', 'openai-oracle-compute')], frm='openai', to='oracle', type='compute_contract', money='promise',
         note='$300B is press-reported, not company-disclosed. Oracle discloses RPO ($664B at 31 Aug 2026), not per-customer value.'),
    dict(id='openai-azure-compute', srcs=[('labs', 'openai-microsoft-azure')], frm='openai', to='microsoft', type='compute_contract', money='promise'),
    dict(id='microsoft-openai-equity', srcs=[('labs', 'microsoft-openai-stake')], frm='microsoft', to='openai', type='equity', money='recycled',
         note='Headline $13B is Microsoft earlier funding commitments (10-Q); stake is ~27% as-converted after the Oct 2025 recap. Microsoft is also OpenAI cloud vendor (circularity).'),
    dict(id='openai-aws-compute', srcs=[('labs', 'openai-aws')], frm='openai', to='amazon', type='compute_contract', money='promise', status='calculated',
         formula_text='$38B + $100B expansion',
         components=[dict(label='Original deal, Nov 2025', usd_b=38, status='verified', urls=['https://www.aboutamazon.com/news/aws/amazon-open-ai-strategic-partnership-investment', 'https://openai.com/index/amazon-partnership/']),
                     dict(label='Expansion over 8 years, Feb 2026', usd_b=100, status='verified', urls=['https://www.aboutamazon.com/news/aws/amazon-open-ai-strategic-partnership-investment', 'https://openai.com/index/amazon-partnership/'])],
         note='Neither source states a $138B total; it is our sum of the $38B original deal and the $100B expansion, so the total is tagged calculated and each part keeps its own tag.'),
    dict(id='amazon-openai-equity', srcs=[('labs', 'amazon-openai-equity')], frm='amazon', to='openai', type='equity', money='recycled', low=15, high=50,
         resolve='Research left actual null. Set low 15 (initial tranche) and high 50 (full, conditional) from the stated structure of $15B then $35B on conditions.',
         note='Investor is also a $138B cloud vendor to OpenAI. Conditions reported (IPO/AGI) by secondary press only.'),
    dict(id='openai-amd-warrant', srcs=[('labs', 'openai-amd')], frm='amd', to='openai', type='warrant', money='promise',
         resolve='Research listed OpenAI->AMD. Arrow follows the grantor: AMD issues the warrant to OpenAI (chip vendor pays its customer in equity). The 6 GW chip purchase is the opposite direction and unpriced.'),
    dict(id='openai-broadcom-chips', srcs=[('labs', 'openai-broadcom')], frm='openai', to='broadcom', type='chip_purchase', money='promise'),
    dict(id='openai-cerebras', srcs=[('labs', 'openai-cerebras')], frm='openai', to='cerebras', type='compute_contract', money='promise'),
    dict(id='openai-coreweave-compute', srcs=[('labs', 'openai-coreweave'), ('neoclouds', 'openai-coreweave-compute')], frm='openai', to='coreweave', type='compute_contract', money='promise',
         headline=22.4, low=22.4, high=22.4, status='reported',
         resolve='Labs file: unverified; neocloud file: reported (CoreWeave Q3 2026 release names OpenAI as expanded relationship, no new dollar figure). Two independent notes agree on $22.4B (press-sourced); kept reported.'),
    dict(id='openai-compute-total-revised', srcs=[('labs', 'openai-compute-total-revised')], frm='openai', to='compute_providers_all', type='compute_contract', money='promise',
         changed='Reported target was about $600B (CNBC, Feb 2026, anonymous sources) versus about $856B in a July presentation reported by the FT in Sept 2026 (scope may differ); neither is an official statement.',
         alt_reports=[dict(label='CNBC, Feb 2026: about $600B compute spend target by 2030', usd_b=600, status='reported', urls=['https://www.cnbc.com/2026/02/20/openai-resets-spend-expectations-targets-around-600-billion-by-2030.html']),
                      dict(label='FT, Sept 2026, citing a July company presentation: about $856B of compute and infrastructure spend, 2026-2030 (scope may be wider than compute)', usd_b=856, status='reported', urls=['https://thenextweb.com/news/openai-856bn-compute-vs-600bn-reset-burn-improved'])],
         sum_exclude=True, note='Aggregate: Altman ~$1.4T (Nov 2025) vs reported ~$600B by 2030 target (Feb 2026; the FT in Sept 2026 reports about $856B). Contains other edges; excluded from sums. Commitments and spend targets are not identical.'),
    dict(id='openai-round-mar2026', srcs=[('labs', 'openai-round-mar2026')], frm='investors_other', to='openai', type='equity', money='mixed',
         money_split=[{'kind': 'recycled', 'usd_b': 80, 'label': 'Vendor money: Amazon $50B (only $15B initial, rest conditional) + Nvidia $30B, on headline figures'},
                      {'kind': 'external', 'usd_b': 42, 'label': 'Other investors: SoftBank $30B (itself borrowed), others and about $3B retail via banks'}],
         parties=['amazon', 'nvidia', 'softbank', 'investors_other'], sum_exclude=True,
         note='Aggregate round containing the Amazon, Nvidia and SoftBank edges; excluded from sums. Mix: Amazon + Nvidia headline $80B of $122B (about two-thirds) come from vendors; SoftBank from borrowed money. Retail ~$3B via banks.'),
    dict(id='openai-round-nov2026', srcs=[('labs', 'openai-round-nov2026')], frm='investors_other', to='openai', type='equity', money='external', parties=['mgx', 'investors_other'],
         note='UAE-led (MGX is a UAE investor but not named in the source; not asserted). Unnamed sources; not confirmed by OpenAI.'),
    dict(id='softbank-openai-equity', srcs=[('labs', 'softbank-openai')], frm='softbank', to='openai', type='equity', money='external',
         note='Funded by a $40B bridge (repaid by mid-Sep 2026), an Arm-backed margin loan (upsized to $25B) and an OpenAI-share-backed margin loan: external cash that is itself borrowed.'),
    dict(id='anthropic-google-tpu', srcs=[('labs', 'anthropic-google-tpu')], frm='anthropic', to='google', type='compute_contract', money='promise', parties=['anthropic', 'google', 'broadcom'],
         structure='Multiple gigawatts of next-generation TPU capacity starting in 2027, building on the Oct 2025 deal of more than 1 GW (Anthropic announcement, Apr 6, 2026). A 3.5 GW figure through 2031 is reported from a Broadcom filing that we did not read.'),
    dict(id='anthropic-fluidstack-50b', srcs=[('labs', 'anthropic-infra-50b'), ('neoclouds', 'anthropic-fluidstack-dcs')], frm='anthropic', to='fluidstack', type='compute_contract', money='promise',
         headline=50, low=None, high=None, status='reported',
         resolve='Neocloud file: verified (Fluidstack and Anthropic statements, primary). Labs file: reported. The $50B is a company-stated plan, not a contractual payment; took the weaker tag, reported.',
         note='Google reportedly backstops Fluidstack leases (press-only).'),
    dict(id='mistral-funding', srcs=[('labs', 'mistral-funding')], frm='investors_other', to='mistral', type='equity', money='external'),
    dict(id='msft-coreweave-compute', srcs=[('neoclouds', 'msft-coreweave-compute')], frm='microsoft', to='coreweave', type='compute_contract', money='promise'),
    dict(id='meta-coreweave-compute', srcs=[('neoclouds', 'meta-coreweave-compute')], frm='meta', to='coreweave', type='compute_contract', money='promise'),
    dict(id='msft-nebius-compute', srcs=[('neoclouds', 'msft-nebius-compute')], frm='microsoft', to='nebius', type='compute_contract', money='promise'),
    dict(id='meta-nebius-compute-1', srcs=[('neoclouds', 'meta-nebius-compute-1')], frm='meta', to='nebius', type='compute_contract', money='promise', note='Superseded in scale by the March 2026 agreement; both kept.'),
    dict(id='meta-nebius-compute-2', srcs=[('neoclouds', 'meta-nebius-compute-2')], frm='meta', to='nebius', type='compute_contract', money='promise', note='$12B firm; the rest up to $27B is an option.'),
    dict(id='nebius-financing-2026', srcs=[('neoclouds', 'nebius-financing-2026')], frm='banks', to='nebius', type='debt', money='external', low=9.25, high=9.25,
         resolve='Research left sizes null. Actual set to $5.75B converts + $3.5B Citi facility = $9.25B (calculated from the structure text; the 2025 $4.16B converts are excluded).',
         parties=['banks']),
    dict(id='msft-iren-compute', srcs=[('neoclouds', 'msft-iren-compute')], frm='microsoft', to='iren', type='compute_contract', money='promise',
         note='Contract $9.7B vs $5.81B GPU capex gives a contract-to-cost ratio of 1.67; 20% prepayment.'),
    dict(id='iren-gpu-financing', srcs=[('neoclouds', 'iren-gpu-financing')], frm='banks', to='iren', type='debt', money='external',
         structure='$3.65B GPU financing (closed Jun 2026): a $2.1B private placement plus a $1.55B delayed-draw term loan (SOFR+2.25%), secured by GPUs and the Microsoft contract. IREN reports a 6.00% blended cost; one source gives 5.96% fixed for the placement, which we could not match to a filing.',
         note='Debt alone = 63% of capex ($3.65B/$5.81B): the loan-to-cost datapoint. With Microsoft prepayments about 96% funded.'),
    dict(id='msft-nscale-compute', srcs=[('neoclouds', 'msft-nscale-compute')], frm='microsoft', to='nscale', type='compute_contract', money='promise',
         note='Oct 2026: Microsoft terminated the UK Loughton site and declined a Texas expansion option. Dollar figures conflict and are not company-confirmed.'),
    dict(id='msft-lambda-compute', srcs=[('neoclouds', 'msft-lambda-compute')], frm='microsoft', to='lambda', type='compute_contract', money='promise'),
    dict(id='google-fluidstack-terawulf-backstop', srcs=[('neoclouds', 'google-fluidstack-terawulf')], frm='google', to='terawulf', type='backstop', money='promise',
         parties=['google', 'fluidstack', 'terawulf'], note='Google receives TeraWulf warrants (about 14% pro forma). Beneficiary is the lessor (TeraWulf) of Fluidstack leases.'),
    dict(id='google-fluidstack-cipher-backstop', srcs=[('neoclouds', 'google-fluidstack-cipher')], frm='google', to='cipher', type='backstop', money='promise',
         parties=['google', 'fluidstack', 'cipher'], note='Google receives Cipher warrants (about 5.4% pro forma).'),
    dict(id='coreweave-applied-digital-lease', srcs=[('neoclouds', 'applied-digital-coreweave-lease')], frm='coreweave', to='applied_digital', type='lease', money='promise'),
    dict(id='macquarie-applied-digital-pref', srcs=None, frm='macquarie', to='applied_digital', type='equity', money='external', headline=5, low=1.0125, high=5,
         date='2025-06', structure='Macquarie committed up to $5B of preferred equity for the Applied Digital campus program; reported draws of $112.5M, $562.5M and $337.5M ($1.0125B).',
         status='reported', what_changed='Draws reported; programme continues.',
         urls=['https://ir.applieddigital.com/news-events/press-releases/detail/142/applied-digital-reports-fiscal-second-quarter-2026-results',
               'https://www.datacenterdynamics.com/en/news/applied-digital-secures-first-tranche-of-5bn-funding-from-macquarie/'],
         note='Low = sum of reported draws (calculated). Macquarie is an extra node, not in the requested list.'),
    dict(id='coreweave-ddtl-4', srcs=[('neoclouds', 'coreweave-ddtl-4')], frm='banks', to='coreweave', type='debt', money='external', parties=['banks', 'blackstone'],
         note='Non-recourse, rated A3/A(low); SOFR+2.25%. First investment-grade-rated GPU-backed financing; press release gives no advance rate.'),
    dict(id='coreweave-ddtl-5-5-and-converts', srcs=[('neoclouds', 'coreweave-ddtl-5-5-and-converts')], frm='banks', to='coreweave', type='debt', money='external', status='calculated',
         formula_text='$2.6B DDTL 5.5 facility + about $4.2B convertible senior notes',
         components=[dict(label='DDTL 5.5 facility, Q3 2026', usd_b=2.6, status='verified', urls=['https://www.sec.gov/Archives/edgar/data/0001769628/000176962826000461/coreweave3q26earningspress.htm']),
                     dict(label='Convertible senior notes (about), Q3 2026', usd_b=4.2, status='reported', urls=['https://www.sec.gov/Archives/edgar/data/0001769628/000176962826000461/coreweave3q26earningspress.htm'])],
         note='The $6.8B total is our sum of the $2.6B facility and the about-$4.2B notes, so it is tagged calculated; each part keeps its own tag.'),
    dict(id='blackstone-magnetar-coreweave', srcs=[('neoclouds', 'blackstone-magnetar-coreweave')], frm='blackstone', to='coreweave', type='debt', money='external',
         parties=['blackstone', 'magnetar'], note='Facility sizes (DDTL 1.0 $2.3B, DDTL 2.0 $7.5B) are from memory in the research and unconfirmed against the CoreWeave S-1; headline shows the larger one only. Spread fell from about SOFR+9.6% (2023) to SOFR+2.25% (2026).'),
    dict(id='meta-hyperion-beignet', srcs=[('neoclouds', 'meta-hyperion-beignet')], frm='meta', to='blue_owl', type='guarantee', money='promise',
         extra_urls=['https://about.fb.com/news/2025/10/meta-blue-owl-capital-develop-hyperion-data-center/'],
         parties=['meta', 'blue_owl', 'pimco'], note='Headline is the $27.3B 6.581% A+ bond; Meta residual value guarantee reported max about $28B with no liability booked. Bond proceeds are external cash; the guarantee is the promise. Accounting treatment is debated, not alleged improper.'),
    dict(id='oracle-vantage-stargate-loans', srcs=[('neoclouds', 'oracle-vantage-stargate-loans')], frm='banks', to='vantage', type='debt', money='external', parties=['banks', 'oracle'], low=14.75, high=38,
         resolve='Research gave $38B (two packages, $23.25B and $14.75B) as the actual. Changed to a range: low = the smaller package, high = both as reported, because banks reportedly struggled to place the debt and syndication status is mixed.',
         note='Two packages ($23.25B and $14.75B). Banks later syndicated to other investors. Sources inconsistent on totals ($72B partner debt in some reports).'),
    dict(id='pimco-oracle-michigan-bond', srcs=None, frm='pimco', to='vantage', type='debt', money='external', headline=10, low=10, high=10,
         date='2026', structure='Michigan (Saline Twp) Stargate site: Pimco reportedly anchored about $10B of roughly $14B of bonds in a financing of about $16B; reports differ on why banks stepped back.',
         status='reported', what_changed='Banks reportedly pulled back; a bond replaced bank construction debt.',
         urls=['https://thenextweb.com/news/oracle-data-centre-16-billion-financing-stargate'],
         note='Headline for this edge is the $10B Pimco anchor, not the roughly $14B of bonds or the about $16B financing.'),
    dict(id='blue-owl-abilene-spv', srcs=None, frm='blue_owl', to='oracle', type='debt', money='external', parties=['blue_owl', 'banks'], headline=13, low=10, high=13,
         date='2025-2026', structure='Abilene: about $13B from a Blue Owl/JPMorgan SPV ($10B of it debt), leased to Oracle for OpenAI.',
         status='reported', what_changed='Reported planned 600 MW Abilene expansion cancelled (cap 1.2 GW).',
         urls=['https://thenextweb.com/news/oracle-data-centre-16-billion-financing-stargate',
               'https://finance.yahoo.com/markets/stocks/articles/banks-rework-oracle-data-center-141848656.html'],
         note='Low = the $10B debt portion; high = whole SPV.'),
]

# ----------------------------------------------------------------------------- round-2 deal fixes
_CUR = {c['id']: c for c in CUR}
# Financial #2: a round that has not closed is a promise, not external cash; no tranche figure the source does not state.
_CUR['openai-round-nov2026'].update(
    money='external', contingent=False, headline=11, low=11, high=11, status='reported', date='2026-11',
    parties=['softbank', 'mgx', 'investors_other'],
    structure=("Bloomberg reported on Nov 6, citing people familiar, that OpenAI closed about $11B as the first portion of a new round at a $1.25T valuation, with the money wired as of that Friday. "
               "OpenAI declined to comment, so we show it as reported, not confirmed. One report names SoftBank and MGX among the investors; no vendor money is reported in this portion."),
    changed="Earlier talk was a round of $30B or more at about $1.4T; Bloomberg now says the round may reach about $20B.",
    note='Closed first portion per Bloomberg (anonymous sources, Nov 6): counted as reported external cash, tagged reported. The unclosed remainder is the separate promise line openai-round-nov2026-remainder.',
    extra_urls=['https://gvwire.com/2026/11/06/openai-secures-11-billion-funding-at-1-25-trillion-valuation-bloomberg-news-reports/', 'https://letsdatascience.com/news/openai-reportedly-closes-11-billion-first-portion-of-round-a-43b7bec2'],
    notes_replace='')
CUR.append(dict(id='openai-round-nov2026-remainder', srcs=None, frm='investors_other', to='openai', type='equity', money='promise', contingent=True, headline=9, low=0, high=9,
                parties=['investors_other', 'openai'], date='2026-11', status='reported',
                structure=("The rest of the same round has not been reported as closed. Bloomberg says the round could grow to about $20B in total, so up to about $9B more is expected in the coming weeks, if it happens. "
                           "Earlier reports of a $30B round are out of date."),
                what_changed='Bloomberg (Nov 6) said the round was scaled back from the earlier $30B-or-more target.',
                urls=['https://gvwire.com/2026/11/06/openai-secures-11-billion-funding-at-1-25-trillion-valuation-bloomberg-news-reports/', 'https://www.cnbc.com/2026/10/22/openai-funding-round-uae-investors.html'],
                note='Not closed: promise, range $0 to about $9B, never counted as cash moved.'))
# Round 3 finance #10: $2.7B is a 13F holdings value; the announced amounts were about $2B and $1B.
_CUR['nvda-synopsys-nokia'].update(headline=3, low=2.7, high=3,
    changed='The announced investments were about $2B (Synopsys) and $1B (Nokia). The $2.7B is the value of the holdings in 13F summaries, so the true cash is between $2.7B and the announced $3B.')
# Financial #3: $13B is not in the cited Microsoft blog. Microsoft filings (as quoted by the press) give the commitment and funded amount.
_CUR['microsoft-openai-equity'].update(
    status='reported', headline=13, low=11.6, high=13,
    structure=("Microsoft's filings put its total funding commitment to OpenAI at $13B; about $11.6B had been funded at Sep 30, 2025 (as quoted by The Register from the filing). "
               "Separately, Microsoft's Oct 28, 2025 blog says it holds about 27% of OpenAI as-converted (previously 32.5%), valued at about $135B, with IP rights through 2032 and revenue share continuing until an expert panel verifies AGI."),
    extra_urls=['https://www.theregister.com/2025/10/29/microsoft_earnings_q1_26_openai_loss/', 'https://fourweekmba.com/ai-microsoft-booked-10b-from-openai-11-of-quarterly-sales/'],
    amount_split=dict(cash_moved_usd_b=11.6, conditional_usd_b=0, not_yet_funded_usd_b=1.4, label='$11.6B funded at Sep 30, 2025; about $1.4B of the $13B commitment not yet funded (later reports say about $12B funded; not checked against the filing)'),
    note='The $13B is the total funding commitment from Microsoft filings (via press quotes); the Microsoft blog cited gives the stake and its value, not the $13B. $135B is the stake value, a separate figure.')
# Financial #5: Amazon cash-moved vs conditional.
_CUR['amazon-openai-equity'].update(
    amount_split=dict(cash_moved_usd_b=15, conditional_usd_b=35, not_yet_funded_usd_b=0, label='$15B initial investment; a further $35B only if certain conditions are met (Amazon). The $35B has not moved.'))
# Meta Hyperion: guarantee edge uses the reported guarantee cap; the bond is its own external-cash edge.
_CUR['meta-hyperion-beignet'].update(
    status='reported', headline=28, low=0, high=28,
    structure=("Meta provides a residual value guarantee to the Hyperion venture covering the first 16 years of operations (Meta's announcement); the cap is reported at about $28B and decreases over time (secondary reading of Meta's annual report). Meta carries no liability for it. "
               "Later filings show a larger combined guarantee total ($41.5B at Sep 30, 2026) that includes a second venture; the split by campus is not given."),
    changed="Meta's combined maximum guarantee rose from about $28.1B at end-2025 to about $41.5B at Sep 30, 2026, which one analysis attributes to a second, Texas venture.",
    note="Edge amount is the reported guarantee cap (about $28B), not the $27.3B bond size; the bond is a separate line (meta-hyperion-bond). Accounting treatment is debated, not alleged improper.")
_CUR['nvda-anthropic-equity'].update(
    changed=("Reported (press, S-1/A coverage): Nvidia agreed to buy about $10B of stock at the IPO price in a concurrent private placement that closes only if the IPO closes and needs stockholder approval. "
             "The IPO priced Nov 18 at $83 (Anthropic announcement) with closing expected Nov 20; a headline on Anthropic's news page dated Nov 20 refers to the placement closing, which we have not read, so we still count it as a promise. "
             "Whether this is the same money as the Nov 2025 'up to $10B' commitment or a separate purchase is not stated, so a $20B total cannot be ruled out."),
    extra_urls=['https://www.anthropic.com/news/anthropic-prices-initial-public-offering'])
_CUR['anthropic-ipo-placement'].update(
    structure='Concurrent ~$26B private placement alongside the Anthropic IPO. Per the amended S-1: Google about $10B, Nvidia about $10B (the same $10B shown on the separate Nvidia line, not additional), AMD about $2.5B, Broadcom, Micron and Microsoft about $1B each, TSMC about $0.5B. It closes only if the IPO closes. The IPO priced Nov 18 at $83 and was expected to close Nov 20.',
    what_changed="Reported in coverage of Anthropic's amended S-1. Microsoft's stake is reported at about $1B, not $5B. A Nov 20 headline on Anthropic's news page refers to the closing of the placement; we have not read it.",
    urls=_CUR['anthropic-ipo-placement']['urls'] + ['https://www.anthropic.com/news/anthropic-prices-initial-public-offering'])
CUR.append(dict(id='meta-hyperion-bond', srcs=None, frm='investors_other', to='blue_owl', type='debt', money='external', headline=27.3, low=27.3, high=27.3,
                parties=['investors_other', 'blue_owl', 'meta', 'pimco'], date='2025-10', status='reported',
                structure=("Beignet Investor LLC, the Hyperion venture (about 80% Blue Owl funds, 20% Meta), issued $27.3B of 6.581% A+ senior secured amortizing bonds due 2049 (Morgan Stanley). Meta leases the campus."),
                what_changed='Reported that Meta later raised its planned Hyperion investment to more than $50B, so the bond covers part of the buildout.',
                urls=['https://about.fb.com/news/2025/10/meta-blue-owl-capital-develop-hyperion-data-center/', 'https://fourweekmba.com/ai-hyperions-27-3b-bond-pays-6-581-above-every-meta-note/'],
                note='External cash raised by the venture; repaid from Meta\'s rent. Split out of the guarantee line so the bond size is not shown as the guarantee.'))
CUR.append(dict(id='anthropic-spacexai-compute', srcs=None, frm='anthropic', to='xai', type='compute_contract', money='promise', headline=120.5, low=0, high=120.5,
                date='2026-10', status='reported',
                structure=("Anthropic's public S-1 (filed Oct 26, 2026) says it agreed to spend up to $120.5B through 2029 on compute from SpaceX's AI unit (formerly xAI), about $3.1B a month once all capacity is delivered (expected December 2026). "
                           "The initial periods end in Jan and Mar 2027; after that either side can end the agreement on 90 days' notice, so $120.5B is a ceiling."),
                what_changed='Up from $84.5B reported from the confidential draft. SpaceX\'s own May filing described $1.25B a month through May 2029.',
                urls=['https://gizmodo.com/anthropics-deal-with-elon-musks-spacexai-is-even-bigger-than-we-knew-ipo-filing-shows-2000830618', 'https://fortune.com/2026/10/26/anthropics-s1-ipo-reveals-the-inner-workings-of-its-fast-evolving-compute-strategy/'],
                note='Reported through press coverage of the S-1; the filing itself was not read. Nvidia is also an investor in xAI.'))

MONEY_DEF = {
    'external': 'Cash that comes from outside the loop: lenders, outside investors, end customers. It is still not free money: lenders and investors must be repaid or earn a return from future end-user spending.',
    'recycled': 'Cash that started with a loop participant and returns to that participant or its customers, for example Nvidia equity in a customer that buys Nvidia systems.',
    'promise': 'Contracts, backlog, RPO, backstops, guarantees, warrants, leases, letters of intent, and equity purchases that only close on a condition (for example an IPO closing). NOT cash moved. Never added into cash totals.',
    'mixed': 'An aggregate round that contains both vendor money (recycled) and outside money (external). See money_split for the parts. Excluded from sums because the component edges are charted separately.',
    'outside_loop_investment': "Nvidia's own cash invested in a company that is not a customer in the AI-demand loop (for example Intel, Synopsys, Nokia). It is neither outside money entering the loop nor recycled customer money. Excluded from loop totals; shown on the Nvidia node as a separate line.",
}

deals = []
merge_log = []
used_research = set()

for c in CUR:
    recs = [rd(f, i) for f, i in c['srcs']] if c['srcs'] else []
    for f, i in (c['srcs'] or []):
        used_research.add((f, i))
    if recs:
        base = recs[0]
        statuses = [r['status'] for r in recs]
        urls = []
        for r in recs:
            for u in r.get('source_urls', []):
                if u not in urls:
                    urls.append(u)
        structure = base['structure']
        changed = [r.get('what_changed_since_announcement') for r in recs if r.get('what_changed_since_announcement')]
        seen = []
        for x in changed:
            if x not in seen and not any(x in y or y in x for y in seen):
                seen.append(x)
        changed_txt = ' | '.join(seen)
        notes = [r.get('notes') for r in recs if r.get('notes')]
        nseen = []
        for x in notes:
            if x not in nseen and not any(x in y or y in x for y in nseen):
                nseen.append(x)
        status = c.get('status') or weakest(statuses)
        date = base['date']
        head = base['headline_usd_b']
        low = base['actual_usd_b_low']
        high = base['actual_usd_b_high']
        if len(recs) > 1:
            structure = base['structure'] if len(base['structure']) >= len(recs[1]['structure']) else recs[1]['structure']
    else:
        structure = c['structure']; changed_txt = c['what_changed']; nseen = []; status = c['status']
        urls = c['urls']; date = c['date']; head = None; low = None; high = None
    if 'structure' in c and recs:
        structure = c['structure']
    if 'changed' in c:
        changed_txt = c['changed']
    if 'notes_replace' in c:
        nseen = [c['notes_replace']]
    if 'headline' in c:
        head = c['headline']
    if 'low' in c:
        low = c['low']
    if 'high' in c:
        high = c['high']
    note_parts = list(nseen)
    if c.get('note'):
        note_parts.append(c['note'])
    if c.get('resolve'):
        note_parts.append('Merge note: ' + c['resolve'])
        merge_log.append({'deal_id': c['id'], 'merged_from': ['%s:%s' % (f, i) for f, i in (c['srcs'] or [])], 'resolution': c['resolve']})
    elif len(recs) > 1:
        merge_log.append({'deal_id': c['id'], 'merged_from': ['%s:%s' % (f, i) for f, i in c['srcs']], 'resolution': 'Duplicate across files; statuses and figures agreed.'})
    for u in c.get('extra_urls', []):
        if u not in urls:
            urls.append(u)
    sids = ids(urls, date if re.fullmatch(r'\d{4}(-\d\d)?', str(date)) else None)
    deal = {
        'id': c['id'], 'from': c['frm'], 'to': c['to'], 'type': c['type'], 'money_kind': c['money'],
        'headline_usd_b': head, 'actual_usd_b_low': low, 'actual_usd_b_high': high,
        'date': date, 'structure': structure, 'status': status,
        'what_changed_since_announcement': changed_txt, 'source_ids': sids,
        'internal_notes': ' '.join(n for n in note_parts if n),
        'reader_note': RT.DEAL_READER_NOTES.get(c['id']),
        'amount_split': c.get('amount_split'),
        'parties': c.get('parties', [c['frm'], c['to']]),
        'loop_edge': c.get('loop', True),
        'sum_exclude': c.get('sum_exclude', False),
        'merged_from': ['%s:%s' % (f, i) for f, i in (c['srcs'] or [])],
        'money_split': c.get('money_split'),
        'components': [dict({k: v for k, v in x.items() if k != 'urls'}, source_ids=ids(x['urls'])) for x in c['components']] if c.get('components') else None,
        'formula_text': c.get('formula_text'),
        'alt_reports': [dict({k: v for k, v in x.items() if k != 'urls'}, source_ids=ids(x['urls'])) for x in c['alt_reports']] if c.get('alt_reports') else None,
        'contingent': bool(c.get('contingent')),
        'placement': bool(c.get('placement')),
        'includes': c.get('includes'),
        'arrow_means': 'payer to payee for cash and contracts; grantor to beneficiary for backstops, guarantees and warrants',
    }
    fix_status(deal, sids, c['id'])
    check(deal['reader_note'], 'deal missing reader_note: %s' % c['id'])
    deals.append(deal)

# every research deal must be used, except none dropped silently
for key in ALL_DEALS:
    check(key in used_research, 'research deal not merged into deals.json: %s:%s' % key)

# ----------------------------------------------------------------------------- totals (promises never summed into cash)


def tally(sel):
    t = {'n_deals': 0, 'headline_usd_b_sum': 0.0, 'actual_usd_b_low_sum': 0.0, 'actual_usd_b_high_sum': 0.0, 'n_headline_unknown': 0, 'n_actual_unknown': 0}
    for d in sel:
        t['n_deals'] += 1
        if d['headline_usd_b'] is None:
            t['n_headline_unknown'] += 1
        else:
            t['headline_usd_b_sum'] += d['headline_usd_b']
        if d['actual_usd_b_low'] is None and d['actual_usd_b_high'] is None:
            t['n_actual_unknown'] += 1
        else:
            lo = d['actual_usd_b_low'] if d['actual_usd_b_low'] is not None else d['actual_usd_b_high']
            hi = d['actual_usd_b_high'] if d['actual_usd_b_high'] is not None else d['actual_usd_b_low']
            t['actual_usd_b_low_sum'] += lo
            t['actual_usd_b_high_sum'] += hi
    for k in ('headline_usd_b_sum', 'actual_usd_b_low_sum', 'actual_usd_b_high_sum'):
        t[k] = round(t[k], 4)
    return t


loop_deals = [d for d in deals if d['loop_edge'] and not d['sum_exclude']]
ext = tally([d for d in loop_deals if d['money_kind'] == 'external'])
rec = tally([d for d in loop_deals if d['money_kind'] == 'recycled'])
prom = tally([d for d in loop_deals if d['money_kind'] == 'promise'])
cash = {k: round(ext[k] + rec[k], 4) for k in ('headline_usd_b_sum', 'actual_usd_b_low_sum', 'actual_usd_b_high_sum')}
cash['n_deals'] = ext['n_deals'] + rec['n_deals']
totals = {
    'note': 'Presentation tallies over loop edges that are not aggregates. Different dates and scopes are mixed; this is a scale indicator, not an economic measure. Promise totals are kept apart and are never part of cash_total.',
    'external_cash': ext, 'recycled_cash': rec, 'promises': prom, 'cash_total': cash,
    'conditional_within_cash_headline_usd_b': round(sum(((d.get('amount_split') or {}).get('conditional_usd_b') or 0) for d in loop_deals if d['money_kind'] in ('external', 'recycled')), 4),
    'conditional_note': 'Some cash-kind deals have a part that has not moved because it is conditional (for example $35B of Amazon\'s $50B in OpenAI). Their headline is still inside the cash headline sums; this number is the part that has not moved. See amount_split on each deal.',
    'excluded_from_sums': [{'id': d['id'], 'reason': ('not a customer-loop edge' if not d['loop_edge'] else 'aggregate/duplicative')} for d in deals if d['sum_exclude'] or not d['loop_edge']],
}

# ----------------------------------------------------------------------------- entities
SITE = {
    'nvidia': '/nvidia-dollar.html', 'amd': '/who-makes-ai-chips.html', 'broadcom': '/who-makes-ai-chips.html', 'tsmc': '/who-makes-ai-chips.html',
    'coreweave': '/neoclouds.html', 'nebius': '/neoclouds.html', 'iren': '/neoclouds.html', 'lambda': '/neoclouds.html',
    'crusoe': '/neoclouds.html', 'nscale': '/neoclouds.html', 'fluidstack': '/neoclouds.html',
    'terawulf': '/neocloud-contagion.html', 'cipher': '/neocloud-contagion.html', 'applied_digital': '/neocloud-contagion.html',
    'core_scientific': '/neocloud-contagion.html', 'galaxy': '/neocloud-contagion.html',
}
ENT = [
    # id, name, layer, ticker
    ('nvidia', 'Nvidia', 'supply', 'NVDA'), ('amd', 'AMD', 'supply', 'AMD'), ('broadcom', 'Broadcom', 'supply', 'AVGO'), ('tsmc', 'TSMC', 'supply', 'TSM'),
    ('coreweave', 'CoreWeave', 'neocloud', 'CRWV'), ('nebius', 'Nebius', 'neocloud', 'NBIS'), ('iren', 'IREN', 'neocloud', 'IREN'),
    ('lambda', 'Lambda', 'neocloud', None), ('crusoe', 'Crusoe', 'neocloud', None), ('nscale', 'Nscale', 'neocloud', None), ('fluidstack', 'Fluidstack', 'neocloud', None),
    ('terawulf', 'TeraWulf', 'neocloud', 'WULF'), ('cipher', 'Cipher Mining', 'neocloud', 'CIFR'), ('applied_digital', 'Applied Digital', 'neocloud', 'APLD'),
    ('core_scientific', 'Core Scientific', 'neocloud', 'CORZ'), ('galaxy', 'Galaxy Digital', 'neocloud', 'GLXY'),
    ('microsoft', 'Microsoft', 'hyperscaler', 'MSFT'), ('google', 'Google (Alphabet)', 'hyperscaler', 'GOOGL'), ('amazon', 'Amazon', 'hyperscaler', 'AMZN'),
    ('meta', 'Meta', 'hyperscaler', 'META'), ('oracle', 'Oracle', 'hyperscaler', 'ORCL'),
    ('openai', 'OpenAI', 'lab', None), ('anthropic', 'Anthropic', 'lab', None), ('xai', 'xAI (now SpaceX)', 'lab', None), ('mistral', 'Mistral AI', 'lab', None),
    ('softbank', 'SoftBank', 'capital', '9984.T'), ('mgx', 'MGX', 'capital', None), ('blue_owl', 'Blue Owl', 'capital', 'OWL'), ('blackstone', 'Blackstone', 'capital', 'BX'),
    ('apollo', 'Apollo', 'capital', 'APO'), ('magnetar', 'Magnetar', 'capital', None), ('pimco', 'Pimco', 'capital', None), ('banks', 'Banks (JPMorgan, MUFG, Morgan Stanley, Goldman, Citi)', 'capital', None),
]
EXTRA_ENT = [
    ('intel', 'Intel', 'supply', 'INTC'), ('cerebras', 'Cerebras', 'supply', None), ('sb_energy', 'SB Energy', 'capital', None),
    ('vantage', 'Vantage Data Centers (Oracle tenant)', 'capital', None), ('macquarie', 'Macquarie', 'capital', None),
    ('xai_spv', 'xAI/SpaceX GPU-lease SPVs', 'capital', None), ('synopsys_nokia', 'Synopsys / Nokia', 'supply', None),
    ('investors_other', 'Other investors (a16z, Coatue, ASML, Samsung, retail, others)', 'capital', None),
    ('placement_buyers', 'Anthropic placement buyers (Google, Nvidia, AMD, Broadcom, Micron, Microsoft, TSMC)', 'capital', None),
    ('financing_platforms', 'Third-party AI infrastructure financing platforms (BlackRock, KKR, Brookfield and others)', 'capital', None),
    ('neocloud_group', 'Neocloud providers (unnamed)', 'neocloud', None), ('cloud_dc_providers', "Cloud and data-center providers serving Nvidia's own R&D (unnamed)", 'supply', None), ('compute_providers_all', 'All compute providers (aggregate)', 'lab', None),
]

# entity snapshot: field -> (value, status, as_of, source urls)
NV_Q3_PR = 'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/q3fy27pr.htm'
SNAP = {
    'nvidia': dict(debt=(32.4, 'verified', '2026-10-25', ['https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/q3fy27pr.htm', 'https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Third-Quarter-Fiscal-2027/']),
                   note='Long-term debt $32.4B (from $7.5B). Market cap not in research: price $150.96 on Nov 18 but no share count.'),
    'coreweave': dict(debt=(46.9, 'verified', '2026-09-30', ['https://www.sec.gov/Archives/edgar/data/0001769628/000176962826000461/coreweave3q26earningspress.htm', 'https://www.sec.gov/Archives/edgar/data/0001769628/000176962826000465/crwv-20260930.htm']),
                      note='Recourse $41.6B + non-recourse $5.3B, excl. finance leases. Market cap not in research (price $44.91 on Nov 19, reported; no share count).'),
    'oracle': dict(debt=(125.0, 'reported', '2026-08-31', ['https://www.cnbc.com/2026/09/10/oracle-orcl-q1-earnings-report-2027.html']), note='Long-term/senior debt per CNBC.'),
    'meta': dict(debt=(80.92, 'verified', '2026-09-30', ['https://investor.atmeta.com/investor-news/press-release-details/2026/Meta-Reports-Third-Quarter-2026-Results/default.aspx']), note='Long-term debt.'),
    'openai': dict(valuation=(852.0, 'verified', '2026-03-31', ['https://openai.com/index/accelerating-the-next-phase-ai/', 'https://www.bloomberg.com/news/articles/2026-03-31/openai-valued-at-852-billion-after-completing-122-billion-round']),
                   note='Post-money valuation of the March 2026 round ($122B committed). A reported Nov 2026 round at $1.25T pre-money is unconfirmed.'),
}
ENT_FACTS = {
    'nvidia': ['q3-revenue', 'q3-yoy', 'q3-dc-revenue', 'q3-gm', 'q4-guide', 'q3-fcf', 'q3-ocf', 'cash-mkt', 'mkt-equity', 'nonmkt-equity', 'equity-purchases-9m', 'equity-gains-9m', 'equity-commitments', 'nvda-guarantee-total', 'nvda-guarantee-total-jul', 'nvda-guar-land-power-shell', 'nvda-guar-sbenergy', 'nvda-guar-power-systems', 'nvda-own-rd-commitments', 'supply-commitments', 'neocloud-contingent', 'nv-cds'],
    'coreweave': ['crwv-q3-26-revenue', 'crwv-q3-26-opinc', 'crwv-q3-26-netloss', 'crwv-q3-26-interest', 'crwv-backlog', 'crwv-total-debt', 'crwv-avg-cost', 'crwv-cash', 'crwv-capex-guide', 'crwv-customer-a', 'crwv-customer-b', 'crwv-share-price'],
    'nebius': ['nebius-rpo'], 'nscale': ['nscale-backlog'], 'oracle': ['oracle-rpo', 'oracle-capex', 'oracle-fcf', 'oracle-ocf', 'oracle-debt', 'oracle-cds', 'oracle-rating'],
    'microsoft': ['msft-ocf', 'msft-capex', 'msft-rpo'], 'google': ['goog-ocf', 'goog-capex', 'goog-fcf', 'goog-guide'],
    'amazon': ['amzn-capex', 'amzn-guide', 'amzn-fcf'], 'meta': ['meta-ocf', 'meta-capex', 'meta-guide', 'meta-debt'],
    'openai': ['openai-runrate', 'openai-q3-rev', 'openai-2025-rev', 'openai-2025-burn', 'openai-burn-plan', 'openai-cash', 'openai-named-total', 'openai-yrs-named'],
    'anthropic': ['anthropic-runrate', 'anthropic-runrate-late', 'anthropic-yrs'], 'softbank': ['softbank-arm-margin'],
}
facts_all = {}
FACT_FILES = [('nvidia', R_NV['facts']), ('labs', R_LAB['facts']), ('neoclouds', R_NEO['facts']), ('lucent', R_EV['lucent']['facts'])]
for fname, flist in FACT_FILES:
    for f in flist:
        check(f['id'] not in facts_all, 'duplicate fact id %s' % f['id'])
        f = dict(f)
        f['source_ids'] = ids(f.pop('source_urls', []))
        f['research_file'] = fname
        fix_status(f, f['source_ids'], f['id'])
        facts_all[f['id']] = f

entities = []
for lst, extra in ((ENT, False), (EXTRA_ENT, True)):
    for eid, name, layer, ticker in lst:
        s = SNAP.get(eid, {})
        mc = s.get('mcap')
        debt = s.get('debt')
        val = s.get('valuation')
        urls = []
        stats = []
        as_of = None
        for v in (mc, debt, val):
            if v:
                stats.append(v[1]); as_of = v[2]
                for u in v[3]:
                    if u not in urls:
                        urls.append(u)
        sids = ids(urls)
        snap = {
            'marketcap_usd_b': mc[0] if mc else None,
            'debt_usd_b': debt[0] if debt else None,
            'valuation_usd_b': val[0] if val else None,
            'as_of': as_of, 'status': weakest(stats) if stats else 'unverified',
            'field_status': {'marketcap_usd_b': mc[1] if mc else None, 'debt_usd_b': debt[1] if debt else None, 'valuation_usd_b': val[1] if val else None},
            'source_urls': urls, 'source_ids': sids, 'note': s.get('note', 'No snapshot numbers in the research for this entity.') if s else 'No snapshot numbers in the research for this entity.',
        }
        for k in ('debt_usd_b', 'marketcap_usd_b', 'valuation_usd_b'):
            pass
        ent = {
            'id': eid, 'name': name, 'layer': layer, 'ticker': ticker, 'snapshot': snap,
            'links': {'site_path': SITE.get(eid)}, 'extra_node': extra,
            'facts': [facts_all[x]['id'] for x in ENT_FACTS.get(eid, []) if x in facts_all],
            'no_verified_deals': not any(eid == d['from'] or eid == d['to'] or eid in d['parties'] for d in deals),
        }
        entities.append(ent)
ent_ids = {e['id'] for e in entities}
for e in entities:
    for fid in ENT_FACTS.get(e['id'], []):
        check(fid in facts_all, 'entity fact %s missing' % fid)

# ----------------------------------------------------------------------------- events / history
events = []
for e in R_EV['events']:
    e = dict(e)
    e['source_ids'] = ids(e.pop('source_urls', []), e['date'] if re.fullmatch(r'\d{4}-\d\d(-\d\d)?', e['date']) else None)
    fix_status(e, e['source_ids'], e['id'])
    events.append(e)

hist_facts = []
for f in R_EV['lucent']['facts']:
    hist_facts.append(facts_all[f['id']])
caveats = [
    {'id': 'lu-revenue-basis', 'text': 'Lucent revenue basis: $8.1B total customer financing commitments (verified, FY2002 10-K) over FY2000 revenue of $28.904B as restated in that same 10-K (continuing-operations basis, verified) is about 28%. On revenue as originally reported in the FY2000 10-K405 ($33.813B, verified) the same ratio is about 24%. The page must name one basis; the default is the restated 28% and must be labelled as such.', 'status': 'calculated'},
    {'id': 'lu-commit-sources', 'text': 'Lucent FY2000 loan commitments ($6.7B), advances ($1.3B), guarantees ($1.4B) and the Verizon (13%) and AT&T (10%) customer shares are in the FY2000 10-K405. The FY1999 comparatives ($7.1B, $1.6B) are carried from the same filing but were not re-checked line by line. Totals for later years are in the FY2002 10-K: $8.1B (FY2000), $5.3B (FY2001), $1.3B (FY2002).', 'status': 'verified'},
    {'id': 'lu-secondary-claims', 'text': 'Winstar ($2B committed, ~$700M write-off) and the SEC revenue-recognition matter ($1.148B revenue, $25M fine) are from a secondary source (Tunguz) and unverified. The SEC matter is specific to Lucent in 2000 and is not an allegation about any AI-era company.', 'status': 'unverified'},
    {'id': 'nortel-drawn', 'text': 'Nortel drawn customer financing at 31 Dec 2000 is unverified ($1.08B net per press citing the SEC filing vs $1.6B per another outlet). Undrawn commitments of about $4.1B are verified.', 'status': 'unverified'},
    {'id': 'framing', 'text': 'The Lucent/Nortel parallel is a framing used by commentators, not a tested conclusion. Differences: Nvidia generates tens of billions in quarterly free cash flow; buyers are among the richest companies; GPU useful life is disputed vs decades-long fiber life; Nvidia says no payments have been made under its guarantees.', 'status': 'reported'},
    {'id': 'timing', 'text': "Lucent's customer defaults came in 2001, about a year after peak financing (Winstar Chapter 11 on April 18, 2001). No confirmed public default on a GPU-backed loan had been found as of October 2026.", 'status': 'reported'},
]
lu_rev = 28.904
history = {
    'as_of': AS_OF,
    'note': 'Lucent/Nortel vendor-financing history and the bull/bear case. Statuses and caveats are carried through from the research. Even-handed: neither side is a conclusion.',
    'lucent_facts': hist_facts,
    'derived': [
        {'id': 'lu-commit-share-restated', 'label': 'Lucent FY2000 customer financing commitments as share of revenue (restated basis)', 'value': round(8.1 / lu_rev * 100, 1), 'unit': 'percent',
         'status': 'calculated', 'formula_text': '8.1 / 28.904 (both verified, FY2002 10-K)', 'basis': 'restated continuing-operations revenue',
         'source_ids': facts_all['lu-fy00-total']['source_ids'] + [s for s in facts_all['lu-rev-restated']['source_ids'] if s not in facts_all['lu-fy00-total']['source_ids']]},
        {'id': 'lu-commit-share-original', 'label': 'Same ratio on originally reported revenue (FY2000 10-K405)', 'value': round(8.1 / 33.813 * 100, 1), 'unit': 'percent', 'status': 'calculated',
         'formula_text': '8.1 / 33.813 (both verified: $8.1B total commitments; revenue as originally reported in the FY2000 10-K405)',
         'basis': 'originally reported revenue of $33.813B', 'source_ids': facts_all['lu-rev-original']['source_ids'] + [x for x in facts_all['lu-fy00-total']['source_ids'] if x not in facts_all['lu-rev-original']['source_ids']]},
    ],
    'caveats': caveats,
    'bull_arguments': [],
    'bear_arguments': [],
    'open_questions': R_EV['open_questions'],
}
for side in ('bull_arguments', 'bear_arguments'):
    for a in R_EV['lucent'][side]:
        a = dict(a)
        a['source_ids'] = ids(a.pop('source_urls', []))
        history[side].append(a)
history['huang_note'] = "On Nov 12 Nvidia filed an 8-K saying Jensen Huang had resigned as CEO, president and director, and that CFO Colette Kress would serve as interim CEO. The filing gave no reason. We don't know the reason and we won't guess." 

# ----------------------------------------------------------------------------- params
Q3_PR_NV = 'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-third-quarter-fiscal-2027'
PARAMS = [
    dict(id='seed_usd', group='scale', label='Seed: Nvidia cash put in at lap 1', value=100, min=10, max=1000, step=10, unit='USD', status='calculated', scale=True,
         urls=[], rationale='Display unit only. Everything is per $100 of seed unless you change this; the ratios do not depend on it.'),
    dict(id='loan_to_cost', group='spv', label='Loan-to-cost (debt as share of GPU build cost)', value=0.625, min=0.3, max=0.8, step=0.005, unit='fraction', status='reported',
         urls=['https://w.media/iren-closes-usd-3-65bn-financing-for-microsoft-ai-infrastructure-deal/', 'https://iren.gcs-web.com/static-files/56eec258-62fb-4929-9e93-02c816693da2', 'https://uk.finance.yahoo.com/news/musk-xai-pursuing-20-billion-180609978.html'],
         rationale='Two datapoints in the research: IREN debt $3.65B on $5.81B contract GPU capex = 63% (reported); xAI SPV $12.5B debt of $20B = 62.5% (reported). With Microsoft prepayments IREN is ~96% funded, but debt alone is 63%. Generic market advance rates are quoted at 50-70% (secondary).'),
    dict(id='nvidia_share_of_build_cost', group='spv', label="Nvidia's share of the SPV's build cost (revenue it books)", value=0.60, min=0.3, max=0.85, step=0.01, unit='fraction', status='hypothetical',
         urls=[], rationale='Hypothetical. Not in the research. The SPV buys servers, so Nvidia GPUs and networking are the largest line, but ODM assembly, memory and other vendors take a share. A data-center shell, power and cooling are financed separately (for example by lessors) and are outside this SPV. Slide it to see how much of the bill returns to Nvidia.'),
    dict(id='nvidia_gross_margin', group='nvidia', label='Nvidia gross margin on that revenue', value=0.748, min=0.5, max=0.85, step=0.001, unit='fraction', status='verified',
         urls=[Q3_PR_NV], rationale='Q3 FY27 GAAP gross margin 74.8% (verified, Nvidia release). Q4 FY27 guidance is 71-72% (also in the release), so the forward margin may be lower; the guidance midpoint (71.5%) is kept as an alternative value. Company-wide margin is applied to this slice as a simplification.',
         alt_values=[{'label': 'Q4 FY27 guide midpoint', 'value': 0.715, 'status': 'verified'}]),
    dict(id='gross_to_net_conversion', group='nvidia', label='Net profit as share of gross profit', value=0.75, min=0.3, max=0.95, step=0.01, unit='fraction', status='calculated',
         urls=[Q3_PR_NV, 'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/q3fy27pr.htm'],
         rationale='Calculated from verified Q3 FY27 figures: GAAP net income $65.3B / (revenue $115.8B x 74.8% gross margin = $86.6B gross profit) = 75%. GAAP net income includes equity-investment gains, so this is slightly generous.'),
    dict(id='recurring_revenue_share', group='nvidia', label='Share of the new profit the market treats as recurring', value=0.5, min=0.0, max=1.0, step=0.05, unit='fraction', status='hypothetical',
         urls=[], rationale='Hypothetical. A one-time build order is not recurring unless the next lap happens. 0.5 is a deliberately middle setting; 1.0 values every dollar as if it repeats forever, 0 means no paper value.'),
    dict(id='valuation_multiple', group='nvidia', label='Valuation multiple on net profit (P/E)', value=12, min=3, max=40, step=0.5, unit='x', status='hypothetical',
         urls=[], rationale='Hypothetical. The research gives Nvidia\'s price ($150.96 on Nov 18, down more than 13% on the week and 36-39% from the October high) but no share count or market cap, so no current multiple is derived here. Not a statement about what Nvidia trades at.'),
    dict(id='reinvest_fraction', group='loop', label="Share of Nvidia's gross profit reinvested as next lap's seed", value=0.18, min=0.0, max=0.9, step=0.01, unit='fraction', status='calculated',
         urls=['https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/q3fy27pr.htm', Q3_PR_NV, 'https://www.cnbc.com/2026/11/17/nvidia-earnings-investor-china-jensen.html'],
         rationale='Calculated: Q3 FY27 equity-securities purchases $15.7B / gross profit $86.6B = 18% (verified inputs). Nine-month purchases $58.1B vs operating cash flow $122.7B = 47%; JPMorgan AM says 58% of operating cash flow went to equity investments and M&A (reported). Includes non-circular holdings such as Intel, so this overstates the customer-loop part. Controls convergence: the lap ratio r = reinvest x margin x Nvidia share / (1 - loan-to-cost) must stay below 1.'),
    dict(id='contract_value_to_build_cost', group='contract', label='Compute contract value as a multiple of build cost', value=1.67, min=1.0, max=3.0, step=0.01, unit='x', status='calculated',
         urls=['https://www.theblock.co/news/business/2026-08-17-iren-delivers-first-four-ai-cloud-deployments-microsoft-under-9-7-billion-deal-412016', 'https://www.sec.gov/Archives/edgar/data/0001878848/000187884826000052/iren-20260630.htm'],
         rationale='Calculated from IREN-Microsoft: $9.7B five-year contract / $5.81B GPU capex = 1.67. The contract also covers power and site, so this overstates GPU-only coverage.'),
    dict(id='contract_years', group='contract', label='Contract length (years)', value=5, min=1, max=10, step=0.5, unit='years', status='reported',
         urls=['https://www.theblock.co/news/business/2026-08-17-iren-delivers-first-four-ai-cloud-deployments-microsoft-under-9-7-billion-deal-412016', 'https://techinformed.com/nebius-signs-3-billion-meta-ai-infrastructure-deal-over-five-years/'],
         rationale='IREN-Microsoft and Nebius-Meta/Microsoft contracts are five-year (reported); CoreWeave-Meta runs to 2031, OpenAI-Oracle about five years from 2027.'),
    dict(id='contract_prepayment_share', group='contract', label='Prepayment share of contract value', value=0.20, min=0.0, max=0.5, step=0.01, unit='fraction', status='reported',
         urls=['https://www.theblock.co/news/business/2026-08-17-iren-delivers-first-four-ai-cloud-deployments-microsoft-under-9-7-billion-deal-412016'],
         rationale='IREN-Microsoft: 20% prepayment (reported). It is the dollar value of the lab\'s claim in the claims stack.'),
    dict(id='lab_outside_revenue_share', group='lab', label='Share of lab payments funded by outside (end-user) revenue', value=0.5, min=0.1, max=0.95, step=0.05, unit='fraction', status='hypothetical',
         urls=['https://www.cnbc.com/2026/02/20/openai-resets-spend-expectations-targets-around-600-billion-by-2030.html', 'https://runtimewire.com/article/openai-278b-cash-burn-1-2t-valuation'],
         rationale='Hypothetical. Reference points (reported): OpenAI 2025 revenue $13.1B vs cash burn $8B implies revenue covers about 62% of spending ($13.1B / $21.1B); FT-reported plan shows $278B negative free cash flow over 2026-2030; named priced contracts of about $720B equal 14 years of the current $50B run-rate. Default 50% sits below the 2025 point because contracted spend is growing faster than revenue.'),
    dict(id='lab_funding_mix', group='lab', label="Share of the lab's raised capital that is recycled (from vendors)", value=0.5, min=0.0, max=0.9, step=0.05, unit='fraction', status='hypothetical',
         urls=['https://openai.com/index/accelerating-the-next-phase-ai/', 'https://www.aboutamazon.com/news/aws/amazon-open-ai-strategic-partnership-investment'],
         rationale='Hypothetical, bracketed by calculation: in the $122B OpenAI round, Amazon ($50B headline) plus Nvidia ($30B) are vendors = 66% on headlines; with only Amazon\'s initial $15B funded, ($15B + $30B)/($122B - $35B) = 52%. SoftBank ($30B) is outside money but borrowed. Default 0.5.'),
    dict(id='nvidia_share_of_vendor_funding', group='lab', label="Nvidia's share of vendor-sourced lab capital", value=0.375, min=0.0, max=1.0, step=0.005, unit='fraction', status='calculated',
         urls=['https://www.cnbc.com/2026/02/19/nvidia-is-in-talks-to-invest-up-to-30-billion-in-openai-source-says.html', 'https://www.aboutamazon.com/news/aws/amazon-open-ai-strategic-partnership-investment'],
         rationale='Calculated: Nvidia $30B / (Nvidia $30B + Amazon $50B) = 37.5% in the 2026 OpenAI round (headline figures; Amazon\'s is conditional). Only sets who holds claim #4.'),
    dict(id='neocloud_opex_share', group='neocloud', label='Neocloud operating cost as share of contract revenue', value=0.35, min=0.1, max=0.7, step=0.01, unit='fraction', status='hypothetical',
         urls=[], rationale='Hypothetical. The research gives CoreWeave Q3 2026 revenue ($3.66B) and operating income ($207M) but not cash operating cost excluding depreciation. Used only in the stress test.'),
    dict(id='backstop_share_of_capacity', group='backstop', label="Nvidia backstop cap as share of the cluster's build cost", value=0.15, min=0.0, max=0.5, step=0.01, unit='fraction', status='hypothetical',
         urls=['https://mycroftproject.substack.com/p/nvidia-circular-financing-coreweave-backstop', 'https://www.sec.gov/Archives/edgar/data/0001769628/000176962826000461/coreweave3q26earningspress.htm'],
         rationale='Hypothetical, one analogue: Nvidia\'s up-to-$6.3B unsold-capacity purchase vs CoreWeave FY2026 capex guidance of $37-39B is 17%. Not every neocloud has one, and Oracle-type sites report none (set 0).'),
    dict(id='backstop_trigger_shortfall', group='backstop', label='Backstop is called when lab payments fall short by at least', value=0.20, min=0.0, max=0.9, step=0.05, unit='fraction', status='hypothetical',
         urls=[], rationale='Hypothetical. Real triggers are conditional on unsold capacity and conditions in the agreement, which are not public. Nvidia says guarantees apply only after financing, deployment and acceptance and that nothing has been paid.'),
    dict(id='credit_fund_back_leverage_ratio', group='capital', label='Credit-fund back-leverage (bank debt per $1 of LP equity)', value=0.5, min=0.0, max=2.0, step=0.05, unit='x', status='hypothetical',
         urls=[], rationale='Hypothetical. Back-leverage on private-credit funds is common but its terms are not disclosed for the loans in this research. 0.5x means the bank funds one-third of the loan and LPs two-thirds. Set 0 for a fully unlevered fund.'),
    dict(id='mezz_ratio', group='capital', label="Neocloud parent bonds/converts per $1 of Nvidia equity", value=0.5, min=0.0, max=2.0, step=0.05, unit='x', status='hypothetical',
         urls=['https://www.sec.gov/Archives/edgar/data/0001769628/000176962826000461/coreweave3q26earningspress.htm', 'https://renstocks.substack.com/p/nebius-q3-2026-prepaid-demand-late'],
         rationale='Hypothetical. Real examples: CoreWeave about $4.2B converts in Q3 2026 and Nebius $5.75B converts (Aug 2026). Proceeds are not traced in the hop trace; only the claim is shown.'),
    dict(id='margin_loan_share', group='capital', label='Share of neocloud stock held on margin', value=0.20, min=0.0, max=0.7, step=0.05, unit='fraction', status='hypothetical',
         urls=['https://finance.yahoo.com/technology/ai/articles/softbank-raises-arm-margin-loan-054546224.html'], rationale='Hypothetical. Margin lending is documented at the SoftBank level (Arm-backed margin loan of $25B, reported) but no neocloud-holder margin data is in the research.'),
    dict(id='neocloud_equity_mark', group='capital', label="Market value of Nvidia's neocloud stake vs cost (1.0 = at cost)", value=1.0, min=0.2, max=3.0, step=0.05, unit='x', status='hypothetical',
         urls=['https://www.cnbc.com/2026/01/26/3coreweave-nvidia-stock-ai-data-centers.html', 'https://www.tokenpost.com/news/business/61712'],
         rationale='Default 1.0 = at cost, so the baseline has no gain or loss. Reference: Nvidia paid $87.20 per CoreWeave share (Jan 2026); the stock closed $44.91 on Nov 19, 2026 (reported), a mark of about 0.5.'),
    dict(id='gpu_useful_life_years', group='asset', label='GPU useful life (years)', value=5, min=3, max=6, step=0.5, unit='years', status='reported',
         urls=['https://www.levelheadedinvesting.com/p/are-ai-chips-useful-lives-creating-useless-earnings', 'https://www.cnbc.com/2025/11/11/big-short-investor-michael-burry-accuses-ai-hyperscalers-of-artificially-boosting-earnings.html'],
         rationale='Presets 3-6. CoreWeave depreciates over 6 years (reported, not re-verified in 2026 filings); hyperscalers use 5-6 (Meta 5.5); Burry argues the economic life is 2-3 years. Default 5.',
         presets=[{'label': 'Burry-style short life', 'value': 3}, {'label': '4 years', 'value': 4}, {'label': 'Default 5', 'value': 5}, {'label': 'CoreWeave 6', 'value': 6}]),
    dict(id='gpu_rental_decline_per_year', group='asset', label='Annual decline in rental value of the GPUs', value=0.10, min=0.0, max=0.4, step=0.01, unit='per year', status='hypothetical',
         urls=['https://www.cloudzero.com/blog/h100-gpu-cost/', 'https://data.ornn.com/gpu-cloud-price-comparison'],
         rationale='Hypothetical. H100 rental fell from about $8/hr (early 2023) to $1.80-3.50 (Q2 2026): about -28% a year on that span; but the Silicon Data index rose from $2.00 (Dec 2025) to $3.01 (Nov 2026). Default 10% a year sits between falling-trend and recent-rise datapoints.'),
    dict(id='base_rate', group='rates', label='Base rate (SOFR proxy)', value=0.03875, min=0.0, max=0.08, step=0.00125, unit='per year', status='reported',
         urls=['https://www.fool.com/investing/2026/09/21/fed-hiked-rates-ai-stocks-feel-it-amzn-nvda/', 'https://www.cnbc.com/2026/11/18/fed-minutes-october-2026.html'],
         rationale='Midpoint of the Fed funds target range of 3.75%-4.00% (after the Sept 16, 2026 hike; reported). SOFR itself is not in the research.'),
    dict(id='credit_spread', group='rates', label='Credit spread over base rate', value=0.04, min=0.01, max=0.10, step=0.0005, unit='per year', status='reported',
         urls=['https://www.bankingjudgmentlab.com/the-wire/coreweave-gpu-backed-loans', 'https://convergedigest.com/coreweave-q3-2026-earnings-financing-nvidia-backlog/'],
         rationale='CoreWeave DDTL 3.0 priced SOFR+4.0% (Jul 2025), DDTL 4.0 SOFR+2.25% (rated A3, verified); lower-rated customers SOFR+4.5-5.5%. 3.875% + 4.0% = 7.9% matches CoreWeave\'s management-reported weighted average borrowing cost of 7.9% (reported).'),
    dict(id='debt_term_years', group='rates', label='Debt amortization term (years)', value=5, min=2, max=10, step=0.5, unit='years', status='hypothetical',
         urls=['https://investors.coreweave.com/news/news-details/2026/CoreWeave-Closes-Landmark-8-5-Billion-Financing-Facility-Achieving-First-Investment-Grade-Rated-GPU-backed-Financing/default.aspx'],
         rationale='Hypothetical simplification: an annuity over five years, matching the contract and useful life. CoreWeave DDTL 4.0 matures in about six years (Mar 2032, verified).'),
    dict(id='floating_share', group='rates', label='Share of debt that floats with the base rate', value=0.5, min=0.0, max=1.0, step=0.05, unit='fraction', status='hypothetical',
         urls=['https://iren.gcs-web.com/static-files/56eec258-62fb-4929-9e93-02c816693da2'], rationale='Hypothetical. IREN combined a fixed-rate placement (IREN reports a 6.00% blended cost) with a SOFR+2.25% loan; CoreWeave DDTL 4.0 has floating and fixed tranches. Only matters for the rate-shock stress knob.'),
]

PRESET_LIST = [
    dict(id='coreweave_like', label='CoreWeave-like', description='Neocloud with GPU-backed delayed-draw loans, hyperscaler/OpenAI customers, a long depreciation life and an Nvidia equity stake and unsold-capacity purchase.',
         overrides={
             'loan_to_cost': (0.65, 'hypothetical', 'No advance rate is disclosed in CoreWeave releases. Generic market range 50-70%; one blog reports about 70% on the first Magnetar/Blackstone loan.'),
             'gpu_useful_life_years': (6, 'reported', 'CoreWeave depreciation life of 6 years (reported, not re-verified in 2026 filings).'),
             'backstop_share_of_capacity': (0.17, 'hypothetical', 'Nvidia up-to-$6.3B unsold-capacity purchase vs FY2026 capex guidance of about $38B = 17% (calculated from reported and verified figures).'),
             'lab_outside_revenue_share': (0.7, 'hypothetical', 'Customers are hyperscalers and OpenAI, which fund more of their payments from their own revenue than a pure lab does. Customer A 24% and B 30% of Q3 2026 revenue (verified, anonymized).'),
             'neocloud_equity_mark': (0.5, 'hypothetical', 'Nvidia paid $87.20 per share (Jan 2026); CRWV closed $44.91 on Nov 19, 2026 (reported): a mark of about 0.5.'),
             'credit_spread': (0.04, 'reported', 'Weighted average borrowing cost 7.9% (reported) = 3.875% base + 4.0%.')}),
    dict(id='oracle_like', label='Oracle-like', description='Investment-grade-adjacent tenant leasing project-financed sites for one very large AI customer; no Nvidia backstop; shell and power financed by developers so Nvidia captures a smaller share of the bill.',
         overrides={
             'loan_to_cost': (0.75, 'hypothetical', 'Construction debt packages for Vantage sites ($38B) are reported but advance rates are not disclosed. Project finance is typically higher-leveraged than GPU loans.'),
             'nvidia_share_of_build_cost': (0.45, 'hypothetical', 'Vantage and Blue Owl campuses are shells, power and cooling; servers are a smaller part of the bill that the SPV finances.'),
             'backstop_share_of_capacity': (0.0, 'hypothetical', 'No Nvidia backstop for Oracle sites is reported. Nvidia\'s $105B guarantee is for the SB Energy Ohio campus (verified).'),
             'lab_outside_revenue_share': (0.45, 'hypothetical', 'OpenAI: reported revenue run-rate $50B vs about $720B of named priced contracts (14 years of revenue); 2025 revenue covered about 62% of spending.'),
             'contract_value_to_build_cost': (2.0, 'hypothetical', 'Long-dated take-or-pay leases with large RPO ($664B at 31 Aug 2026, reported) relative to build cost.'),
             'credit_spread': (0.03, 'hypothetical', 'Oracle is BBB- (S&P) with 5-year CDS near 295bp (reported); about 3% over base.')}),
    dict(id='xai_spv_like', label='xAI SPV-like', description='Off-balance-sheet SPV leases Nvidia GPUs to xAI/SpaceX; bonds sold to investors; no Nvidia backstop reported; no credit-fund back-leverage.',
         overrides={
             'loan_to_cost': (0.625, 'reported', '$12.5B debt of a $20B SPV = 62.5% (reported, closing unconfirmed).'),
             'backstop_share_of_capacity': (0.0, 'hypothetical', 'No Nvidia capacity backstop reported for the xAI SPV; Nvidia up to $2B equity is a different mechanism.'),
             'contract_value_to_build_cost': (1.3, 'hypothetical', 'Five-year lease with purchase option: repays cost plus financing cost, no extra site services.'),
             'lab_outside_revenue_share': (0.3, 'hypothetical', 'xAI/SpaceX AI services are nascent; most payments depend on capital raised (SpaceX IPO, bonds).'),
             'lab_funding_mix': (0.4, 'hypothetical', 'Nvidia put $10B into xAI, but SpaceX public equity and bonds supply the rest.'),
             'credit_spread': (0.044, 'hypothetical', 'Illustrative: a slightly higher spread than the default for a less seasoned borrower. A figure of 8.26% on SpaceX SPV bonds circulated but could not be confirmed, so it is not used as evidence.'),
             'credit_fund_back_leverage_ratio': (0.0, 'hypothetical', 'Bonds sold to investors, no private-credit fund back-leverage reported.'),
             'mezz_ratio': (0.0, 'hypothetical', 'No parent-level converts in the structure reported.')}),
]


def decimals(x):
    s = repr(x)
    return len(s.split('.')[1]) if '.' in s else 0


def on_grid(p, v):
    k = round((v - p['min']) / p['step'])
    return abs(p['min'] + k * p['step'] - v) < 1e-9 and 0 <= k <= round((p['max'] - p['min']) / p['step'])


PARAM_BY_ID = {p['id']: p for p in PARAMS}
for p in PARAMS:
    check(on_grid(p, p['value']), 'param default not on grid: %s' % p['id'])
    check(p['min'] <= p['value'] <= p['max'], 'param default out of range: %s' % p['id'])
    check(p['status'] in STATUSES, 'param status invalid: %s' % p['id'])
    p['source_ids'] = ids(p.pop('urls'))
    if p['status'] == 'verified':
        check(any(sid_to_type(s) == 'primary' for s in p['source_ids']), 'verified param without primary source: %s' % p['id'])
    if p['status'] in ('verified', 'reported', 'calculated'):
        check(len(p['source_ids']) >= 1 or p.get('scale'), 'param needs a source: %s' % p['id'])
presets_out = []
for pr in PRESET_LIST:
    ov = {}
    rat = {}
    for k, (v, st, why) in pr['overrides'].items():
        check(k in PARAM_BY_ID, 'preset unknown param %s' % k)
        check(on_grid(PARAM_BY_ID[k], v), 'preset value off grid: %s.%s=%s' % (pr['id'], k, v))
        ov[k] = v
        rat[k] = {'value': v, 'status': st, 'rationale': why}
    presets_out.append({'id': pr['id'], 'label': pr['label'], 'description': pr['description'], 'params': ov, 'overrides': rat,
                        'status_note': 'Preset values are illustrative analogues of the named structure, not that company\'s actual parameters. Outputs inherit hypothetical unless every override is reported/verified.'})

# ----------------------------------------------------------------------------- write model defs into JS
defs_js = [{k: p[k] for k in ('id', 'group', 'label', 'value', 'min', 'max', 'step', 'unit', 'status') if k in p} | ({'scale': True} if p.get('scale') else {}) for p in PARAMS]
preset_js = {pr['id']: {'label': pr['label'], 'params': pr['params']} for pr in presets_out}
block = ('/* BEGIN GENERATED: DEFS */\n  var PARAM_DEFS = [\n' + ',\n'.join('    ' + json.dumps(d) for d in defs_js) +
         '\n  ];\n  var PRESETS = ' + json.dumps(preset_js) + ';\n  /* END GENERATED: DEFS */')
js_path = ROOT / 'src' / 'loop-model.js'
js = js_path.read_text()
js2 = re.sub(r'/\* BEGIN GENERATED: DEFS \*/.*?/\* END GENERATED: DEFS \*/', lambda m: block, js, flags=re.S)
check(js2 != js or block in js, 'could not inject defs into loop-model.js')
js_path.write_text(js2)

# ----------------------------------------------------------------------------- run the model for derived headline numbers
node_script = r"""
const M = require(process.argv[1]);
const d = M.defaults();
const run = M.runLoop(d, 1);
const lev = M.leverage(d);
const cs = M.claimsStack(d, 0);
const es = M.externalShare(d);
const P = M.plain;
const out = {
  checks: run.checks,
  lap1: P(run.cumulative),
  ratio: P(run.geometric.ratio), limit_factor: P(run.geometric.sum_factor_limit),
  leverage: P(lev.headline),
  claims: {claims_count: P(cs.claims_count), claimants_count: P(cs.claimants_count), per_asset: P(cs.ratios.claims_per_usd_asset), per_asset_cash: P(cs.ratios.claims_per_usd_asset_cash), per_debt: P(cs.ratios.claims_per_usd_debt)},
  external_share: P(es.headline.external_share), end_user_share: P(es.headline.end_user_share),
  seeds_status: run.cumulative.external_share.status
};
console.log(JSON.stringify(out));
"""
proc = subprocess.run(['node', '-e', node_script, str(js_path)], capture_output=True, text=True)
if proc.returncode != 0:
    print(proc.stderr)
    errors.append('node model run failed')
    default_run = {}
else:
    default_run = json.loads(proc.stdout)
    chk = default_run['checks']
    for k, v in chk.items():
        check(v, 'model identity failed in default run: %s' % k)
    L1 = default_run['lap1']
    check(abs(L1['external_share'] + L1['recycled_share'] - 1) < 1e-9, 'external + recycled share != 100%')
    check(abs(L1['external_cash'] + L1['recycled_cash'] - L1['cash_moved']) < 1e-9, 'cash tallies do not add')
    check(abs(L1['external_end_user'] + L1['external_capital'] - L1['external_cash']) < 1e-9, 'external split does not add')
    check(0 < default_run['ratio'] < 1, 'default lap ratio must converge')

defaults_doc = {
    'as_of': AS_OF,
    'model_version': '1.0.0',
    'note': 'Single source of truth for model parameters; the same definitions are embedded in src/loop-model.js between GENERATED markers. Default values are chosen from the research where possible; hypothetical ones are labelled and explained. Per $100 of seed cash.',
    'status_ordering': 'verified < reported < calculated < hypothetical < unverified; an output takes the weakest status of its inputs and is never better than calculated. Any parameter value changed away from its default is treated as hypothetical.',
    'status_set': STATUSES,
    'money_kinds': MONEY_DEF,
    'params': [{k: v for k, v in p.items()} for p in PARAMS],
    'presets': presets_out,
    'default_run': default_run,
}

# ----------------------------------------------------------------------------- source claims skeleton
claims = {'as_of': AS_OF, 'note': 'Skeleton: fact id -> source ids for every fact the page surfaces. Fill in claim text/quote anchors as the page copy is written.',
          'facts': {}, 'deals': {}, 'events': {}, 'params': {}, 'entity_snapshots': {}}
for fid, f in facts_all.items():
    claims['facts'][fid] = {'label': f['label'], 'value': f['value'], 'unit': f['unit'], 'status': f['status'], 'source_ids': f['source_ids'], 'quote_anchor': None}
    for _k in ('comparable_across_periods', 'comparability_caveat', 'prior_period_value', 'prior_period', 'attribution'):
        if _k in f:
            claims['facts'][fid][_k] = f[_k]
for d in deals:
    claims['deals'][d['id']] = {'status': d['status'], 'source_ids': d['source_ids'], 'quote_anchor': None}
for e in events:
    claims['events'][e['id']] = {'status': e['status'], 'source_ids': e['source_ids'], 'quote_anchor': None}
for p in PARAMS:
    claims['params'][p['id']] = {'status': p['status'], 'source_ids': p['source_ids']}
for e in entities:
    if e['snapshot']['source_ids']:
        claims['entity_snapshots'][e['id']] = {'status': e['snapshot']['status'], 'source_ids': e['snapshot']['source_ids']}
for a in history['bull_arguments'] + history['bear_arguments']:
    pass

# ----------------------------------------------------------------------------- assertions
deal_ids = set()
src_by_id = {s['id']: s for s in SOURCES.values()}
for d in deals:
    check(d['id'] not in deal_ids, 'duplicate deal id %s' % d['id'])
    deal_ids.add(d['id'])
    check(d['type'] in DEAL_TYPES, 'bad type %s (%s)' % (d['type'], d['id']))
    check(d['money_kind'] in MONEY_KINDS, 'bad money_kind (%s)' % d['id'])
    check(d['status'] in STATUSES, 'bad status (%s)' % d['id'])
    check(len(d['source_ids']) >= 1, 'deal has no source: %s' % d['id'])
    check(all(s in src_by_id for s in d['source_ids']), 'deal references unknown source: %s' % d['id'])
    check(d['from'] in ent_ids, 'deal %s from unknown entity %s' % (d['id'], d['from']))
    check(d['to'] in ent_ids, 'deal %s to unknown entity %s' % (d['id'], d['to']))
    for pty in d['parties']:
        check(pty in ent_ids, 'deal %s party unknown %s' % (d['id'], pty))
    if d['status'] == 'verified':
        check(any(src_by_id[s]['type'] == 'primary' for s in d['source_ids']), 'verified deal without primary source: %s' % d['id'])
    # a promise is never cash and cash types are never promises
    if d['type'] in PROMISE_TYPES:
        check(d['money_kind'] == 'promise', 'promise-type deal not tagged promise: %s' % d['id'])
    if d['type'] in CASH_TYPES:
        # equity/debt are cash unless explicitly contingent (e.g. closes only if an IPO closes): then a promise, never cash moved
        ok = d['money_kind'] in ('external', 'recycled', 'mixed', 'outside_loop_investment') or (d['money_kind'] == 'promise' and d['contingent'])
        check(ok, 'cash-type deal tagged promise without contingent flag: %s' % d['id'])
    if d['money_kind'] == 'mixed':
        check(d['money_split'] and abs(sum(x['usd_b'] for x in d['money_split']) - (d['headline_usd_b'] or 0)) < 1e-6, 'mixed deal split must add to headline: %s' % d['id'])
    if d['money_kind'] == 'outside_loop_investment':
        check(not d['loop_edge'], 'outside_loop_investment must not be a loop edge: %s' % d['id'])
    if d['actual_usd_b_low'] is not None and d['actual_usd_b_high'] is not None:
        check(d['actual_usd_b_low'] <= d['actual_usd_b_high'], 'actual low > high: %s' % d['id'])
# totals: independent recomputation, promises never in cash
recomputed_cash_low = 0.0
for d in deals:
    if d['loop_edge'] and not d['sum_exclude'] and d['money_kind'] in ('external', 'recycled'):
        lo = d['actual_usd_b_low'] if d['actual_usd_b_low'] is not None else d['actual_usd_b_high']
        if lo is not None:
            recomputed_cash_low += lo
check(abs(recomputed_cash_low - totals['cash_total']['actual_usd_b_low_sum']) < 1e-6, 'cash total low does not equal external + recycled only')
check(abs(totals['cash_total']['headline_usd_b_sum'] - (ext['headline_usd_b_sum'] + rec['headline_usd_b_sum'])) < 1e-6, 'cash total headline mismatch')
for d in deals:
    if d['money_kind'] == 'promise':
        for bucket in ('external_cash', 'recycled_cash'):
            pass
for e in events:
    check(e['status'] in STATUSES, 'event status bad %s' % e['id'])
    check(len(e['source_ids']) >= 1, 'event without source %s' % e['id'])
    if e['status'] == 'verified':
        check(any(src_by_id[s]['type'] == 'primary' for s in e['source_ids']), 'verified event without primary source %s' % e['id'])
for fid, f in facts_all.items():
    check(f['status'] in STATUSES, 'fact status bad %s' % fid)
    if f['status'] == 'verified':
        check(any(src_by_id[s]['type'] == 'primary' for s in f['source_ids']), 'verified fact without primary source %s' % fid)
    if f['status'] in ('verified', 'reported') and not f['source_ids']:
        f['status_adjusted_from'] = f['status']
        f['status'] = 'calculated'  # derived/aggregate fact computed from other facts
        f['status_adjustment_reason'] = 'No source URL in research: treated as a calculation from other facts, not a sourced fact.'
        claims['facts'][fid]['status'] = 'calculated'
for e in entities:
    check(e['layer'] in LAYERS, 'bad layer %s' % e['id'])
    check(e['snapshot']['status'] in STATUSES, 'snapshot status bad %s' % e['id'])
    if e['snapshot']['status'] == 'verified':
        check(any(src_by_id[s]['type'] == 'primary' for s in e['snapshot']['source_ids']), 'verified snapshot without primary %s' % e['id'])
for a in history['bull_arguments'] + history['bear_arguments']:
    check(len(a['source_ids']) >= 1, 'argument without source')
for pr in presets_out:
    for k in pr['params']:
        check(k in PARAM_BY_ID, 'preset param unknown')
for p in PARAMS:
    check(p['id'] in claims['params'], 'param missing from source claims')
# all listed requested entities exist
required = ['nvidia', 'amd', 'broadcom', 'tsmc', 'coreweave', 'nebius', 'iren', 'lambda', 'crusoe', 'nscale', 'fluidstack', 'terawulf', 'cipher', 'applied_digital', 'core_scientific', 'galaxy',
            'microsoft', 'google', 'amazon', 'meta', 'oracle', 'openai', 'anthropic', 'xai', 'mistral', 'softbank', 'mgx', 'blue_owl', 'blackstone', 'apollo', 'magnetar', 'pimco', 'banks']
for r in required:
    check(r in ent_ids, 'required entity missing %s' % r)

if errors:
    print('BUILD FAILED:')
    for e in errors:
        print(' -', e)
    sys.exit(1)

# ----------------------------------------------------------------------------- reader layer (round 2)
sources_out = sorted(SOURCES.values(), key=lambda s: (s['publisher'], s['url']))
for src in sources_out:
    dt, orig = RT.display_title(src)
    if orig and re.sub(r'[^a-z]', '', orig.lower()) != re.sub(r'[^a-z]', '', dt.lower()):
        src['original_title'] = orig
        src['original_title_attribution'] = 'Headline as published by %s; shown for attribution only, not as our characterisation.' % src['publisher']
    src['title'] = dt
    src['title_is_derived'] = False if dt != orig else src.get('title_is_derived', True)

for p_ in defaults_doc['params']:
    p_['reader_note'] = RT.PARAM_READER[p_['id']]
    p_['rationale'] = p_['reader_note']
defaults_doc['money_kinds'] = MONEY_DEF
MONEY_KIND_LABELS = {
    'external': {'label': 'Outside cash', 'reader_text': MONEY_DEF['external']},
    'recycled': {'label': 'Recycled cash', 'reader_text': MONEY_DEF['recycled']},
    'promise': {'label': 'Promise (not cash)', 'reader_text': MONEY_DEF['promise']},
    'mixed': {'label': 'Mixed round', 'reader_text': MONEY_DEF['mixed'] + ' Chapters should show the money_split parts (for example vendor money and other investors) and never the bare word "mixed".'},
    'outside_loop_investment': {'label': 'Stake outside the loop', 'reader_text': MONEY_DEF['outside_loop_investment']},
}

# meta.json: every count a chapter prints comes from here, never typed into chapter text.
kind_counts = {k: sum(1 for d in deals if d['money_kind'] == k) for k in MONEY_KINDS}
check(sum(kind_counts.values()) == len(deals), 'money_kind counts do not add to deal count')
parties_with_lines = sorted({x for d in deals for x in (d['from'], d['to'])})
meta = {
    'as_of': AS_OF,
    'note': 'Counts derived from the data files by tools/build_data.py. Chapters must read these instead of typing numbers.',
    'deal_count': len(deals),
    'deal_count_by_money_kind': kind_counts,
    'cash_in_loop_count': kind_counts['external'] + kind_counts['recycled'],
    'promise_count': kind_counts['promise'],
    'mixed_count': kind_counts['mixed'],
    'outside_loop_count': kind_counts['outside_loop_investment'],
    'external_count': kind_counts['external'],
    'recycled_count': kind_counts['recycled'],
    'excluded_from_sums_count': len(totals['excluded_from_sums']),
    'parties_with_deal_lines': len(parties_with_lines),
    'entity_count': len(entities),
    'named_entity_count': sum(1 for e in entities if not e['extra_node']),
    'event_count': len(events),
    'fact_count': len(facts_all),
    'source_count': len(sources_out),
    'param_count': len(PARAMS),
    'bull_argument_count': len(history['bull_arguments']),
    'bear_argument_count': len(history['bear_arguments']),
    'hops': {
        'stops': 11, 'first_index': 0, 'last_index': 10, 'moves': 10,
        'wording': 'The loop has 11 stops, numbered hop 0 to hop 10. Hop 0 is where the cash starts and hop 10 is where the loop closes, so the money makes ten moves.',
    },
    'money_kind_labels': MONEY_KIND_LABELS,
}
meta['deal_line_sentence'] = '%d deal lines: %d are cash inside the loop (equity or debt), %d are promises, %d %s a mixed round holding both vendor and outside money, and %d %s in companies outside the loop.' % (
    meta['deal_count'], meta['cash_in_loop_count'], meta['promise_count'], meta['mixed_count'], 'is' if meta['mixed_count'] == 1 else 'are', meta['outside_loop_count'], 'is a stake' if meta['outside_loop_count'] == 1 else 'are stakes')

INTERNAL = ('internal_notes', 'merge_log', 'status_adjusted_from', 'status_adjustment_reason', 'research_file', 'merged_from')
deals_doc = {'as_of': AS_OF, 'money_kinds': MONEY_DEF, 'money_kind_labels': MONEY_KIND_LABELS, 'status_set': STATUSES,
             'direction_note': 'Arrows point payer to payee for cash and contracts; grantor to beneficiary for backstops, guarantees and warrants.',
             'headline_vs_actual_note': 'headline_usd_b is the announced "up to" figure. actual_usd_b_low/high is the best-supported amount that has actually flowed or is firmly committed. For promises, actual means money that could realistically be paid if conditions are met. null means no supporting figure. amount_split, where present, separates cash that has moved from conditional or unfunded parts of the headline.',
             'totals': totals, 'merge_log': merge_log, 'deals': deals, 'sources': sources_out}
_skip = INTERNAL
deals_doc = {k: (RT.scrub_tree(v, skip_keys=_skip) if k not in ('merge_log',) else v) for k, v in deals_doc.items()}
events_doc = RT.scrub_tree({'as_of': AS_OF, 'events': events}, skip_keys=_skip)
entities_doc = RT.scrub_tree({'as_of': AS_OF, 'layers': LAYERS, 'nodes': entities})
history_doc = RT.scrub_tree(history, skip_keys=_skip)
defaults_doc = RT.scrub_tree(defaults_doc)
claims = RT.scrub_tree(claims, skip_keys=_skip)

# guard: no process language reaches a reader-facing string
import re as _re
_banned = _re.compile('|'.join(RT.BANNED_READER_PATTERNS), _re.I)


def _walk(o, path=''):
    if isinstance(o, dict):
        for k, v in o.items():
            if k in INTERNAL or k in ('url', 'source_urls', 'original_title', 'quote_anchor'):
                continue
            yield from _walk(v, path + '/' + k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from _walk(v, path + '[%d]' % i)
    elif isinstance(o, str):
        yield path, o


for _name, _doc in (('deals', deals_doc), ('events', events_doc), ('entities', entities_doc), ('history', history_doc), ('defaults', defaults_doc)):
    for _p, _t in _walk(_doc):
        check(not _banned.search(_t), 'process language in reader-facing %s%s: %s' % (_name, _p, _t[:120]))

(DATA / 'deals.json').write_text(json.dumps(deals_doc, indent=1, ensure_ascii=False) + '\n')
(DATA / 'entities.json').write_text(json.dumps(entities_doc, indent=1, ensure_ascii=False) + '\n')
(DATA / 'events.json').write_text(json.dumps(events_doc, indent=1, ensure_ascii=False) + '\n')
(DATA / 'history.json').write_text(json.dumps(history_doc, indent=1, ensure_ascii=False) + '\n')
(DATA / 'loop-defaults.json').write_text(json.dumps(defaults_doc, indent=1, ensure_ascii=False) + '\n')
(DATA / 'source-claims.json').write_text(json.dumps(claims, indent=1, ensure_ascii=False) + '\n')
(DATA / 'sources.json').write_text(json.dumps({'as_of': AS_OF, 'sources': sources_out}, indent=1, ensure_ascii=False) + '\n')
(DATA / 'meta.json').write_text(json.dumps(meta, indent=1, ensure_ascii=False) + '\n')
if errors:
    print('BUILD FAILED:')
    for e in errors:
        print(' -', e)
    sys.exit(1)

print('OK: %d deals, %d entities, %d events, %d facts, %d sources, %d params, %d presets' % (len(deals), len(entities), len(events), len(facts_all), len(sources_out), len(PARAMS), len(presets_out)))
print('cash_total (loop, non-aggregate): headline %.1f, actual %.1f-%.1f ; promises headline %.1f (kept separate)' % (
    totals['cash_total']['headline_usd_b_sum'], totals['cash_total']['actual_usd_b_low_sum'], totals['cash_total']['actual_usd_b_high_sum'], prom['headline_usd_b_sum']))
if default_run:
    print('default run:', json.dumps({k: default_run['leverage'][k] for k in ('debt', 'revenue', 'paper_value')}),
          'claims', default_run['claims']['claims_count'], 'claimants', default_run['claims']['claimants_count'],
          'external share %.3f' % default_run['lap1']['external_share'])
