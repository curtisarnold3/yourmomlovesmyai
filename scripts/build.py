#!/usr/bin/env python3
"""Generate the site shell from episodes.json.

Writes:
  index.html            home page with the episode grid
  <slug>.html           one page per episode: shared nav bar + the original page framed below
  404.html
Episode content itself lives untouched in pages/<dir>/.

Run from the repo root:  python3 scripts/build.py
Add an episode: drop its files in pages/<dir>/, add an entry to episodes.json, re-run.
"""
import json, html, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "Your Mom Loves My AI"
DOMAIN = "https://yourmomlovesmyai.com"
TAGLINE = "The AI stack, explained: interactive visual documentaries from sand to stock price."
EPS = json.load(open(os.path.join(ROOT, "episodes.json")))
esc = html.escape


def label(e):
    return e["short"]


def nav(current=None):
    pills, rows = [], []
    for e in EPS:
        cur = ' aria-current="page"' if current and e["slug"] == current["slug"] else ""
        cls = "ep" + (" sub" if e["kind"] == "companion" else "") + (" soon" if e["kind"] == "soon" else "")
        live = ' <span class="live">LIVE</span>' if e.get("live") else ""
        num = "" if e["kind"] == "companion" else f'<span class="n">{e["num"]}</span>'
        pills.append(f'<a class="{cls}" href="/{e["slug"]}/" title="{esc(e["title"])}"{cur}>{num}<span class="lbl">{esc(label(e))}</span>{live}</a>')
        dcls = ("sub" if e["kind"] == "companion" else "") + (" soon" if e["kind"] == "soon" else "")
        dnum = "" if e["kind"] == "companion" else e["num"]
        rows.append(f'<a class="{dcls.strip()}" href="/{e["slug"]}/"{cur}><span class="n">{dnum}</span>'
                    f'<span>{esc(e["title"])}{live}</span></a>')

    if current:
        i = EPS.index(current)
        prev = EPS[i - 1] if i > 0 else None
        nxt = EPS[i + 1] if i < len(EPS) - 1 else None
        tools = (
            (f'<a class="iconbtn" href="/{prev["slug"]}/" title="Previous: {esc(prev["title"])}" aria-label="Previous episode">&larr;</a>'
             if prev else '<a class="iconbtn" aria-disabled="true" aria-label="Previous episode">&larr;</a>')
            + (f'<a class="iconbtn" href="/{nxt["slug"]}/" title="Next: {esc(nxt["title"])}" aria-label="Next episode">&rarr;</a>'
               if nxt else '<a class="iconbtn" aria-disabled="true" aria-label="Next episode">&rarr;</a>')
            + (f'<a class="iconbtn ext" href="/pages/{current["dir"]}/" target="_blank" rel="noopener" '
               f'title="Open this page on its own, full screen" aria-label="Open full screen">&#x2197;</a>' if current.get("dir") else "")
        )
        mb_num = current["num"] if current["kind"] != "companion" else "↳"
        menu_label = f'<span class="n">{mb_num}</span><span class="t">{esc(current["title"])}</span>'
    else:
        tools = ""
        menu_label = '<span class="t">All episodes</span>'

    return f"""<header class="sitenav">
  <a class="brand" href="/" aria-label="{SITE} home"><span class="mark">AI</span><span class="word">yourmomlovesmy<span class="dot">ai</span></span></a>
  <nav class="eps" aria-label="Episodes">{''.join(pills)}</nav>
  <button class="menubtn" aria-expanded="false" aria-controls="drawer">{menu_label}<span aria-hidden="true">&#9662;</span></button>
  <div class="navtools">{tools}</div>
</header>
<nav class="drawer" id="drawer" aria-label="All episodes"><a href="/"><span class="n">&#8962;</span><span>Home</span></a>{''.join(rows)}</nav>"""


def head(title, desc, path):
    return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{DOMAIN}{path}">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}">
<meta property="og:type" content="website"><meta property="og:url" content="{DOMAIN}{path}">
<meta name="theme-color" content="#060a14">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
</head><body>"""


def write(name, s):
    with open(os.path.join(ROOT, name), "w") as f:
        f.write(s)


# ---- episode pages ----
for e in EPS:
    title = f'{e["num"]} · {e["title"]} — {SITE}' if e["kind"] != "companion" else f'{e["title"]} — {SITE}'
    page = head(title, e["dek"], f'/{e["slug"]}/') + nav(e)
    if e["kind"] == "soon":
        page += f"""
<main class="soonpage"><div>
  <div class="n">{e["num"]}</div>
  <div class="kicker">Coming soon</div>
  <h1>{esc(e["title"])}</h1>
  <p>This episode is still in production. In the meantime, keep going with the next one.</p>
  <a class="cta" href="/{EPS[EPS.index(e) + 1]["slug"]}/">Continue to {EPS[EPS.index(e) + 1]["num"]} · {esc(EPS[EPS.index(e) + 1]["short"])} &rarr;</a>
</div></main>"""
    else:
        src = f'/pages/{e["dir"]}/'
        page += f"""
<div class="framewrap"><iframe src="{src}" data-src="{src}" title="{esc(e["title"])}" allow="fullscreen; clipboard-write" allowfullscreen></iframe></div>
<noscript><p style="padding:80px 20px"><a href="{src}">Open {esc(e["title"])}</a></p></noscript>"""
    page += '\n<script src="/assets/nav.js" defer></script>\n</body></html>\n'
    write(f'{e["slug"]}.html', page)

# ---- home ----
cards, live_cards = [], []
for e in EPS:
    if e["kind"] == "companion":
        continue
    kids = [c for c in EPS if c.get("parent") == e["slug"]]
    comp = "".join(f'<div class="companion"><span class="live">LIVE</span> Companion tool: <a href="/{c["slug"]}/">{esc(c["title"])} &rarr;</a></div>' for c in kids)
    if e["kind"] == "soon":
        cards.append(f'<div class="card soon" aria-disabled="true"><div class="thumb">COMING SOON</div><div class="body">'
                     f'<div class="num">{e["num"]}</div><h3>{esc(e["title"])}</h3><p>{esc(e["dek"])}</p></div></div>')
        continue
    # whole card is a link; companion link sits inside, so use a stretched-link pattern
    cards.append(f'<article class="card"><a href="/{e["slug"]}/" style="text-decoration:none;color:inherit;display:contents">'
                 f'<div class="thumb" style="background-image:url(/assets/thumbs/{e["slug"]}.jpg)"></div>'
                 f'<div class="body"><div class="num">EPISODE {e["num"]}</div><h3>{esc(e["title"])}</h3><p>{esc(e["dek"])}</p></div></a>'
                 f'{"<div class=body style=padding-top:0>" + comp + "</div>" if comp else ""}</article>')
for c in EPS:
    if c.get("live"):
        live_cards.append(f'<a class="card" href="/{c["slug"]}/"><div class="thumb" style="background-image:url(/assets/thumbs/{c["slug"]}.jpg)"></div>'
                          f'<div class="body"><div class="num"><span class="live">LIVE · UPDATES HOURLY</span></div><h3>{esc(c["title"])}</h3>'
                          f'<p>{esc(c["dek"])}</p></div></a>')

first = EPS[0]
home = head(f"{SITE} — The AI stack, explained", TAGLINE, "/") + nav(None) + f"""
<main class="home">
  <section class="hero">
    <div class="kicker">The AI Stack · Visual documentary series</div>
    <h1>From sand to stock price, <em>one layer at a time.</em></h1>
    <p>Interactive explainers on how AI actually gets built and paid for: the chips, the factories, the money, the models, and the risks hiding in the balance sheets. Scroll, click, and poke at the models yourself.</p>
    <a class="cta" href="/{first["slug"]}/">Start with {first["num"]} · {esc(first["title"])} &rarr;</a>
    <a class="cta ghost" href="#live">Live market tools</a>
  </section>
  <div class="stack"><h2>Episodes</h2><span>Best read in order, but each one stands alone.</span></div>
  <div class="grid">{''.join(cards)}</div>
  <div class="stack" id="live"><h2>Live tools</h2><span>Refreshed hourly from market data and headlines.</span></div>
  <div class="livegrid">{''.join(live_cards)}</div>
  <footer class="site">
    <span>&copy; yourmomlovesmyai.com</span>
    <span>Teaching models, not investment advice. Figures are sourced on each page; judgment calls are labelled.</span>
  </footer>
</main>
<script src="/assets/nav.js" defer></script>
</body></html>
"""
write("index.html", home)

write("404.html", head(f"Not found — {SITE}", TAGLINE, "/404") + nav(None) + """
<main class="soonpage"><div><div class="n">404</div><h1>That page wandered off.</h1>
<p>It might have moved when the series got its new home.</p><a class="cta" href="/">Back to all episodes &rarr;</a></div></main>
<script src="/assets/nav.js" defer></script></body></html>
""")

print("built", len(EPS), "episode pages + home + 404")
