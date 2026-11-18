# yourmomlovesmyai.com

The AI Stack visual documentary series, as one static site with a shared nav bar.
Plain HTML/CSS/JS. No framework, no build step, no database, no server.

## How it's organized

```
index.html                 Home page (episode grid + live tools)
<slug>.html                One page per episode: shared nav bar + the original page framed below
404.html
pages/<dir>/               The original episode pages, untouched (each is self-contained)
assets/site.css, nav.js    Shared nav + home styling
assets/thumbs/             Card thumbnails
episodes.json              The episode list: order, numbers, titles, blurbs
scripts/build.py           Regenerates index.html, <slug>.html and 404.html from episodes.json
scripts/refresh/           Live-data scripts for Sector Pulse and the Contagion Monitor
.github/workflows/         Hourly job that runs those scripts and commits fresh live.json
vercel.json                Clean URLs (/neoclouds/), cache headers
```

URLs: `/sand-to-thought/`, `/who-makes-ai-chips/`, `/sector-pulse/`, `/nvidia-dollar/`,
`/situational-awareness/` (coming soon), `/open-vs-closed/`, `/neoclouds/`,
`/neocloud-contagion/`, `/ai-kill-switch/`, `/burry-depreciation/`, `/ai-cake-3d/`.

## Why the episodes are framed instead of merged

Each episode was built and tested as a standalone page, and several pin their own progress
bars and headers to the top of the screen. Framing them under one nav bar keeps every page
exactly as it was tested while giving the site one consistent menu, prev/next arrows and
clean URLs. The ↗ button opens any episode full screen on its own.

## Add or change an episode

1. Put the episode's files in `pages/<folder>/` (its `index.html` plus assets).
2. Add an entry to `episodes.json` (`kind`: `episode`, `companion` with a `parent`, or `soon`).
3. Run `python3 scripts/build.py`, commit, push. Vercel redeploys automatically.

When Situational Awareness is ready: drop it in `pages/04-situational-awareness/`, set that
entry's `"dir": "04-situational-awareness"` and `"kind": "episode"`, rebuild, push.
For a new card thumbnail, save a 640×400 JPG to `assets/thumbs/<slug>.jpg`.

## The AI Cake in 3D (episode 10)

`pages/10-ai-cake-3d/` is a three.js scene. three.js 0.160 is vendored in `vendor/` (MIT, license included),
so the page has no CDN dependency. The dataset (nodes, links, sources) is the JSON inside
`<script id="data">` in its `index.html`.

## Live data

`refresh-live-data.yml` runs hourly (Sun–Fri, at :07 UTC). It pulls prices from Yahoo Finance
(yfinance) and headlines from Google News RSS, writes the two `live.json` files, and commits
only if something changed. Each commit triggers a Vercel redeploy. If a source fails, the last
good snapshot stays live. Run it by hand from the Actions tab ("Run workflow").

Keep the repo public so Actions minutes are free and unlimited; a private repo would use roughly
1,000–1,300 of the 2,000 free monthly minutes.

## Local preview

`python3 -m http.server` won't map the clean URLs. Use `npx vercel dev`, or `npx serve .`
and open the `.html` files directly.
