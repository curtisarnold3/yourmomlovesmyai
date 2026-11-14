#!/usr/bin/env python3
"""Sector Pulse live refresh.
Pulls prices (Yahoo Finance via yfinance) and headlines (Google News RSS), compares every
company's move to what its chip-sector beta implies, flags notable moves, and prints one JSON
snapshot to stdout (or writes it to the path given as argv[1]).
Descriptive statistics only; not investment advice."""
import sys, json, datetime as dt, urllib.request, xml.etree.ElementTree as ET, email.utils
import numpy as np, pandas as pd, yfinance as yf

CO = [("nv","NVDA","Nvidia"),("amd","AMD","AMD"),("avgo","AVGO","Broadcom"),("cdn","CDNS","Cadence"),("snps","SNPS","Synopsys"),
 ("amat","AMAT","Applied Materials"),("lam","LRCX","Lam Research"),("tel","8035.T","Tokyo Electron"),("asml","ASML","ASML"),
 ("kla","KLAC","KLA"),("disco","6146.T","DISCO"),("shin","4063.T","Shin-Etsu"),("sumco","3436.T","SUMCO"),("ajin","2802.T","Ajinomoto"),
 ("ibiden","4062.T","Ibiden"),("unim","3037.TW","Unimicron"),("tsmc","TSM","TSMC"),("hynix","000660.KS","SK Hynix"),("mu","MU","Micron"),
 ("sams","005930.KS","Samsung"),("adv","6857.T","Advantest"),("ter","TER","Teradyne"),("fox","2317.TW","Foxconn"),("wis","3231.TW","Wistron"),
 ("crwv","CRWV","CoreWeave")]
BENCH = [("smh","SMH"),("spx","^GSPC")]
ASIA = lambda t: t.endswith((".T", ".TW", ".KS"))
TZ = lambda t: "Asia/Tokyo" if t.endswith(".T") else "Asia/Taipei" if t.endswith(".TW") else "Asia/Seoul" if t.endswith(".KS") else "America/New_York"
NEWS_Q = ["Nvidia stock", "TSMC", "ASML", "semiconductor stocks", "SK Hynix OR Micron HBM", "Applied Materials OR Lam Research OR KLA", "CoreWeave", "AMD stock OR Broadcom stock"]
KEYW = {"nv":["nvidia","jensen huang"],"amd":["amd"],"avgo":["broadcom"],"cdn":["cadence"],"snps":["synopsys"],"amat":["applied materials"],
 "lam":["lam research"],"tel":["tokyo electron"],"asml":["asml"],"kla":["kla"],"disco":["disco corp"],"shin":["shin-etsu"],"sumco":["sumco"],
 "ajin":["ajinomoto"],"ibiden":["ibiden"],"unim":["unimicron"],"tsmc":["tsmc","taiwan semiconductor"],"hynix":["sk hynix","hynix"],"mu":["micron"],
 "sams":["samsung"],"adv":["advantest"],"ter":["teradyne"],"fox":["foxconn","hon hai"],"wis":["wistron"],"crwv":["coreweave"]}

def main(out=None, prev_path=None):
    now = dt.datetime.now(dt.timezone.utc)
    tick = [c[1] for c in CO] + [b[1] for b in BENCH]
    d = yf.download(tick, period="9mo", interval="1d", auto_adjust=True, progress=False, group_by="ticker")
    C = pd.DataFrame({t: d[t]["Close"] for t in tick}).sort_index()
    R = C.pct_change(fill_method=None)
    us = R["SMH"].dropna().index
    def prev_us(x):
        p = us[us < x]; return p[-1] if len(p) else None
    def aligned(t):
        s = R[t].dropna()
        if not ASIA(t): return s
        return pd.Series({prev_us(k): v for k, v in s.items() if prev_us(k) is not None})
    A = pd.DataFrame({t: aligned(t) for t in tick})
    est = A.iloc[-130:-1]  # ~6 months, excluding the latest session
    beta = {t: float(est[[t, "SMH"]].dropna().cov().iloc[0, 1] / est["SMH"].var()) for t in tick}
    corr_nv = {t: float(est[[t, "NVDA"]].dropna().corr().iloc[0, 1]) for t in tick}
    nextc = {t: float(est[[t, "SMH"]].dropna().corr().iloc[0, 1]) for t in tick if ASIA(t)}

    h = yf.download(tick, period="5d", interval="60m", auto_adjust=True, progress=False, group_by="ticker")
    rows, hourly = {}, {}
    for k, t, n in CO + [(b[0], b[1], b[1]) for b in BENCH]:
        s = h[t]["Close"].dropna() if t in h.columns.get_level_values(0) else pd.Series(dtype=float)
        if s.empty: continue
        last_ts = s.index[-1].tz_convert("UTC"); local_day = s.index[-1].tz_convert(TZ(t)).date()
        daily = C[t].dropna()
        prev = daily[daily.index.date < local_day]
        if prev.empty: continue
        pc = float(prev.iloc[-1]); px = float(s.iloc[-1])
        today = s[[ix.tz_convert(TZ(t)).date() == local_day for ix in s.index]]
        hourly[k] = [[ix.tz_convert("UTC").strftime("%Y-%m-%dT%H:%MZ"), round((float(v) / pc - 1) * 100, 2)] for ix, v in today.items()]
        rows[k] = {"t": t, "n": n, "pct": round((px / pc - 1) * 100, 2), "asOf": last_ts.strftime("%Y-%m-%dT%H:%MZ"),
                   "localDay": str(local_day), "ageH": round((now - last_ts.to_pydatetime()).total_seconds() / 3600, 1), "asia": ASIA(t)}
    smh = rows.get("smh", {}); smh_pct = smh.get("pct", 0.0)
    # Asia reacts to the last COMPLETED US session; its benchmark is that session's SMH move
    smh_last_closed = float(R["SMH"].dropna().iloc[-1]) * 100
    if smh and smh["ageH"] < 1.5:  # US session in progress: last completed session is the one before today
        smh_last_closed = float(R["SMH"].dropna().iloc[-2]) * 100 if str(R["SMH"].dropna().index[-1].date()) == smh["localDay"] else smh_last_closed
    study = []
    for k, t, n in CO:
        if k not in rows: continue
        if ASIA(t):
            pu = prev_us(pd.Timestamp(rows[k]["localDay"]))
            bench = float(R["SMH"].get(pu, 0) or 0) * 100 if pu is not None else smh_last_closed
        else:
            bench = smh_pct
        exp = beta[t] * bench; act = rows[k]["pct"]
        rows[k].update({"beta": round(beta[t], 2), "exp": round(exp, 2), "excess": round(act - exp, 2)})
        study.append([k, act, round(exp, 2), round(act - exp, 2)])
    us_rows = [r for r in study if not ASIA(rows[r[0]]["t"])]
    same = sum(1 for r in us_rows if np.sign(r[1]) == np.sign(smh_pct))
    alerts = []
    day = smh.get("localDay", str(now.date()))
    if smh.get("ageH", 99) < 2 and abs(smh_pct) >= 3 and us_rows and same / len(us_rows) >= 0.75:
        alerts.append({"key": f"{day}:systemic:{'down' if smh_pct < 0 else 'up'}", "kind": "systemic",
                       "msg": f"Sector-wide move: chip ETF {smh_pct:+.1f}%, {same}/{len(us_rows)} US names same direction"})
    for r in study:
        k, act, exp, ex = r
        if abs(ex) >= 4 and abs(act) >= 3 and rows[k]["ageH"] < 2:
            alerts.append({"key": f"{rows[k]['localDay']}:{k}:break:{'down' if ex < 0 else 'up'}", "kind": "break",
                           "msg": f"{rows[k]['n']} {act:+.1f}% vs {exp:+.1f}% implied by sector ({ex:+.1f} pts)"})
    # what to watch next: if a US move is under way, Asia's beta-implied next-session reaction
    watch = []
    if smh.get("ageH", 99) < 2 and abs(smh_pct) >= 2:
        for k, t, n in CO:
            if ASIA(t) and k in rows:
                watch.append({"k": k, "n": n, "impl": round(beta[t] * smh_pct, 1), "corr": round(nextc[t], 2)})
        watch.sort(key=lambda w: -abs(w["impl"]))
    news = []
    seen = set()
    for q in NEWS_Q:
        try:
            url = "https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=" + urllib.parse.quote(q + " when:1d")
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 SectorPulse"})
            root = ET.fromstring(urllib.request.urlopen(req, timeout=15).read())
            for it in root.iter("item"):
                title = it.findtext("title") or ""
                if title in seen: continue
                seen.add(title)
                pub = email.utils.parsedate_to_datetime(it.findtext("pubDate")).astimezone(dt.timezone.utc)
                low = title.lower(); tags = [k for k, ws in KEYW.items() if any(w in low for w in ws)]
                news.append({"title": title, "link": it.findtext("link"), "src": it.findtext("source") or "", "t": pub.strftime("%Y-%m-%dT%H:%MZ"), "tags": tags})
        except Exception as e:
            news.append({"title": f"(news query failed: {q}: {type(e).__name__})", "link": "", "src": "", "t": now.strftime("%Y-%m-%dT%H:%MZ"), "tags": []})
    news = sorted([n for n in news if n["tags"] or "fail" in n["title"]], key=lambda n: n["t"], reverse=True)[:10]
    snap = {"builtAt": now.strftime("%Y-%m-%dT%H:%MZ"), "smh": smh_pct, "smhLastClosed": round(smh_last_closed, 2),
            "spx": rows.get("spx", {}).get("pct"), "rows": rows, "alerts": alerts, "watch": watch[:6],
            "news": news, "source": "Yahoo Finance via yfinance (unofficial, may lag); Google News RSS"}
    prev_keys = []
    if prev_path:
        try: prev_keys = json.load(open(prev_path)).get("alertKeys", [])
        except Exception: prev_keys = []
    new = [a for a in alerts if a["key"] not in prev_keys]
    snap["newAlerts"] = new
    snap["alertKeys"] = (prev_keys + [a["key"] for a in new])[-60:]
    js = json.dumps(snap, separators=(",", ":"))
    if out: open(out, "w").write(js)
    else: print(js)

if __name__ == "__main__":
    import urllib.parse
    main(sys.argv[1] if len(sys.argv) > 1 else None, sys.argv[2] if len(sys.argv) > 2 else None)
