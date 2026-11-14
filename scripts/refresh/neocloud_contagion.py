#!/usr/bin/env python3
"""Neocloud Contagion Monitor - data refresh.
Pulls prices/fundamentals from Yahoo Finance (yfinance) and headlines from Google News RSS,
computes betas, vol, liquidity, leverage and a Merton-style distance to default,
and writes live.json. Usage: python3 refresh.py [previous_live.json] [out.json]
"""
import sys, json, math, time, datetime as dt, urllib.request, urllib.parse, xml.etree.ElementTree as ET
import numpy as np, pandas as pd, yfinance as yf

PREV = sys.argv[1] if len(sys.argv) > 1 else None
OUT = sys.argv[2] if len(sys.argv) > 2 else 'live.json'

# ---- universe -------------------------------------------------------------
NODES = {
 # id: (group, label)
 'CRWV': ('neocloud', 'CoreWeave'), 'NBIS': ('neocloud', 'Nebius'), 'IREN': ('neocloud', 'IREN'),
 'WYFI': ('neocloud', 'WhiteFiber'),
 'GLXY': ('landlord', 'Galaxy (Helios)'), 'APLD': ('landlord', 'Applied Digital'), 'CORZ': ('landlord', 'Core Scientific'),
 'CIFR': ('landlord', 'Cipher'), 'WULF': ('landlord', 'TeraWulf'),
 'NVDA': ('supplier', 'Nvidia'), 'DELL': ('supplier', 'Dell'), 'SMCI': ('supplier', 'Supermicro'), 'AMD': ('supplier', 'AMD'),
 'MSFT': ('customer', 'Microsoft'), 'META': ('customer', 'Meta'), 'GOOGL': ('customer', 'Alphabet'), 'AMZN': ('customer', 'Amazon'),
 'ORCL': ('customer', 'Oracle'),
 'BX': ('lender', 'Blackstone'), 'OWL': ('lender', 'Blue Owl'), 'APO': ('lender', 'Apollo'),
}
MARKET = ['QQQ', 'SMH', 'HYG', '^VIX', 'BTC-USD', '^W5000']
LEV_ETFS = {  # ticker: (underlying, leverage)
 'CWVX': ('CRWV', 2), 'CRWG': ('CRWV', 2), 'CRWX': ('CRWV', 2),
 'NEBX': ('NBIS', 2), 'NBIL': ('NBIS', 2), 'IREX': ('IREN', 2), 'WULX': ('WULF', 2), 'APLX': ('APLD', 2),
 'NVDL': ('NVDA', 2), 'NVDU': ('NVDA', 2), 'NVDX': ('NVDA', 2),
 'TQQQ': ('QQQ', 3), 'QLD': ('QQQ', 2), 'SOXL': ('SMH', 3),
}
NEWS_Q = ['CoreWeave', 'neocloud', 'Nebius stock', 'IREN stock', 'Nvidia stock', 'AI data center debt']

def now_iso():
    return dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

def safe(x, nd=4):
    try:
        if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))): return None
        return round(float(x), nd)
    except Exception:
        return None

def norm_cdf(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))

def merton(E, D, sigE, r=0.04, T=1.0):
    """Simplified Merton (1-yr): solve asset value V by bisection for a given asset vol, iterate asset vol (damped).
    Returns (distance to default, default probability). Mirrors the page's JS."""
    if not E or not D or D <= 0 or not sigE: return None, None
    if E / D < 0.002: return -3.0, 0.999
    sigE = min(sigE, 3.0); sq = math.sqrt(T); disc = D * math.exp(-r * T)
    def call(V, s):
        d1 = (math.log(V / D) + (r + 0.5 * s * s) * T) / (s * sq)
        return V * norm_cdf(d1) - disc * norm_cdf(d1 - s * sq), norm_cdf(d1)
    sV = sigE * E / (E + D); V = E + D
    for _ in range(40):
        lo, hi = E, E + D * 1.5
        for _ in range(60):
            mid = (lo + hi) / 2
            if call(mid, sV)[0] > E: hi = mid
            else: lo = mid
        V = (lo + hi) / 2
        nd1 = max(call(V, sV)[1], 1e-4)
        sN = min(max(sigE * E / (nd1 * V), 0.01), 3.0)
        if abs(sN - sV) < 1e-7: sV = sN; break
        sV = 0.5 * sV + 0.5 * sN
    dd = (math.log(V / D) + (r - 0.5 * sV * sV) * T) / (sV * sq)
    return dd, norm_cdf(-dd)

def main():
    prev = {}
    if PREV:
        try: prev = json.load(open(PREV))
        except Exception: prev = {}
    tickers = list(NODES) + MARKET + list(LEV_ETFS)
    hist = yf.download(tickers, period='1y', interval='1d', progress=False, auto_adjust=True, threads=True)
    close, vol = hist['Close'], hist['Volume']
    intr = yf.download(list(NODES) + ['QQQ', 'SMH'], period='2d', interval='60m', progress=False, auto_adjust=True, threads=True)['Close']
    rets = close.pct_change()
    q = rets['QQQ']; nv = rets['NVDA']
    # NVDA residual vs QQQ
    w = rets[['QQQ', 'NVDA']].dropna().iloc[-252:]
    b_nq = np.cov(w['NVDA'], w['QQQ'])[0, 1] / np.var(w['QQQ'], ddof=1)
    nv_res = nv - b_nq * q
    out = {'asof': now_iso(), 'nodes': {}, 'market': {}, 'levEtfs': {}, 'corr': {}, 'news': [], 'alerts': [], 'beta_nvda_qqq': safe(b_nq)}
    for t, (grp, label) in NODES.items():
        c = close[t].dropna()
        if c.empty: continue
        r = rets[t]
        d = pd.concat([r, q, nv_res], axis=1).dropna().iloc[-252:]
        d.columns = ['r', 'q', 'n']
        X = np.column_stack([np.ones(len(d)), d['q'], d['n']])
        coef, *_ = np.linalg.lstsq(X, d['r'].values, rcond=None)
        resid = d['r'].values - X @ coef
        info = {}
        try: info = yf.Ticker(t).info
        except Exception: pass
        price = float(c.iloc[-1])
        ip = intr[t].dropna() if t in intr else pd.Series(dtype=float)
        last = float(ip.iloc[-1]) if len(ip) else price
        lastbar = ip.index[-1].isoformat() if len(ip) else None
        sig = float(r.iloc[-63:].std() * math.sqrt(252))
        sig1y = float(r.iloc[-252:].std() * math.sqrt(252))
        adv = float((vol[t].iloc[-20:] * c.iloc[-20:]).mean())
        mcap = info.get('marketCap') or None
        debt = info.get('totalDebt') or 0
        cash = info.get('totalCash') or 0
        dd, pd_ = merton(mcap, debt, sig) if mcap and debt else (None, None)
        hi = float(c.iloc[-252:].max())
        out['nodes'][t] = {
            'label': label, 'group': grp, 'price': safe(last, 3), 'close': safe(price, 3),
            'prevClose': safe(c.iloc[-2], 3) if len(c) > 1 else None,
            'chg1d': safe(last / float(c.iloc[-2]) - 1) if len(c) > 1 else None,
            'chg5d': safe(last / float(c.iloc[-6]) - 1) if len(c) > 5 else None,
            'chg1m': safe(last / float(c.iloc[-22]) - 1) if len(c) > 21 else None,
            'fromHigh': safe(last / hi - 1), 'betaQ': safe(coef[1], 3), 'betaN': safe(coef[2], 3),
            'idioVol': safe(np.std(resid) * math.sqrt(252), 3), 'vol3m': safe(sig, 3), 'vol1y': safe(sig1y, 3),
            'adv': safe(adv, 0), 'mcap': mcap, 'debt': debt, 'cash': cash, 'ebitda': info.get('ebitda'),
            'inst': safe(info.get('heldPercentInstitutions'), 3), 'shortFloat': safe(info.get('shortPercentOfFloat'), 3),
            'dd': safe(dd, 3), 'pd1y': safe(pd_, 4), 'lastBar': lastbar,
            'spark': [safe(x, 2) for x in c.iloc[-60:].tolist()],
        }
    for t in MARKET:
        c = close[t].dropna()
        if c.empty: continue
        out['market'][t] = {'price': safe(c.iloc[-1], 3), 'chg1d': safe(c.iloc[-1] / c.iloc[-2] - 1), 'chg1m': safe(c.iloc[-1] / c.iloc[-22] - 1) if len(c) > 21 else None,
                            'fromHigh': safe(c.iloc[-1] / c.iloc[-252:].max() - 1), 'vol3m': safe(rets[t].iloc[-63:].std() * math.sqrt(252), 3),
                            'adv': safe(float((vol[t].iloc[-20:] * c.iloc[-20:]).mean()), 0) if t in vol else None}
    for t, (u, L) in LEV_ETFS.items():
        aum = None
        try: aum = yf.Ticker(t).info.get('totalAssets')
        except Exception: pass
        out['levEtfs'][t] = {'underlying': u, 'lev': L, 'aum': aum, 'price': safe(close[t].dropna().iloc[-1], 3) if not close[t].dropna().empty else None}
    core = ['NVDA', 'CRWV', 'NBIS', 'IREN', 'WYFI', 'GLXY', 'APLD', 'CORZ', 'CIFR', 'WULF', 'ORCL', 'MSFT', 'META', 'OWL', 'QQQ']
    cm = rets[core].iloc[-126:].corr()
    out['corr'] = {'tickers': core, 'm': [[safe(cm.loc[a, b], 3) for b in core] for a in core]}
    # news
    seen = set()
    for qy in NEWS_Q:
        try:
            u = 'https://news.google.com/rss/search?' + urllib.parse.urlencode({'q': qy + ' when:2d', 'hl': 'en-US', 'gl': 'US', 'ceid': 'US:en'})
            x = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=15).read()
            for it in ET.fromstring(x).iter('item'):
                ti = it.findtext('title') or ''
                if ti in seen: continue
                seen.add(ti)
                out['news'].append({'q': qy, 'title': ti, 'link': it.findtext('link'), 'date': it.findtext('pubDate'), 'src': (it.find('source').text if it.find('source') is not None else '')})
        except Exception as e:
            pass
    def pdate(s):
        try: return dt.datetime.strptime(s, '%a, %d %b %Y %H:%M:%S %Z').timestamp()
        except Exception: return 0
    out['news'].sort(key=lambda n: -pdate(n['date']))
    out['news'] = out['news'][:30]
    # alerts
    N = out['nodes']
    neos = [N[t]['chg1d'] for t in ['CRWV', 'NBIS', 'IREN', 'WYFI', 'GLXY', 'APLD', 'CORZ', 'CIFR', 'WULF'] if t in N and N[t]['chg1d'] is not None]
    basket = float(np.mean(neos)) if neos else 0
    day = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%d')
    al = []
    if abs(basket) >= 0.05: al.append({'key': f'basket-{day}-{"dn" if basket<0 else "up"}', 'kind': 'systemic', 'text': f'Neocloud basket {basket*100:+.1f}% last session'})
    for t, n in N.items():
        if n['chg1d'] is not None and abs(n['chg1d']) >= 0.08:
            al.append({'key': f'{t}-{day}-{"dn" if n["chg1d"]<0 else "up"}', 'kind': 'move', 'text': f'{n["label"]} {n["chg1d"]*100:+.1f}% last session'})
        if n.get('pd1y') is not None and n['pd1y'] >= 0.15:
            al.append({'key': f'{t}-pd15-{day}', 'kind': 'credit', 'text': f'{n["label"]} model 1-yr default probability {n["pd1y"]*100:.0f}% (Merton toy)'})
    qq = out['market'].get('QQQ', {}).get('chg1d') or 0
    if qq <= -0.03: al.append({'key': f'qqq-{day}', 'kind': 'systemic', 'text': f'Nasdaq-100 {qq*100:+.1f}% last session'})
    oldkeys = set(prev.get('alertKeys', []))
    out['alerts'] = al
    out['newAlerts'] = [a for a in al if a['key'] not in oldkeys]
    out['alertKeys'] = sorted(set(list(oldkeys)[-300:]) | {a['key'] for a in al})
    out['basket1d'] = safe(basket)
    json.dump(out, open(OUT, 'w'), separators=(',', ':'))
    print(json.dumps({'asof': out['asof'], 'nodes': len(N), 'news': len(out['news']), 'alerts': len(al), 'new': len(out['newAlerts'])}))

if __name__ == '__main__':
    main()
