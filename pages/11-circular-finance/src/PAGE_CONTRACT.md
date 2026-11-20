# Page contract (Episode 11 "The Loop")

Read `src/API.md` (model) first. Look at `pages/03-nvidia-dollar/assets/css/site.css` and `assets/js/iso.js` for the series look (dark glass, isometric SVG, tokens `--bg-0 --ink --cyan --amber --violet --teal --coral`).

## Files
```
src/shell.html            page skeleton with <!--CHAPTER:01--> ... <!--CHAPTER:10--> and <!--EPILOGUE--> placeholders  (owner: shell agent)
src/base.css              tokens, layout, legend, tag badges, glass panels, bottom sheet, buttons       (owner: shell agent)
src/runtime.js            builds window.Ctx and boots chapters                                           (owner: shell agent)
src/chapters/NN.html      chapter markup: one <section id="chNN" class="chapter" data-chapter="NN"> ...  (owner: chapter agent)
src/chapters/NN.css       styles; EVERY selector prefixed #chNN                                          (owner: chapter agent)
src/chapters/NN.js        `Chapters["NN"] = function(root, ctx){ ... }`  called once at DOMContentLoaded  (owner: chapter agent)
tools/bundle.py           inlines css/js/chapters + data JSON + model -> index.html and dist/circular-finance.html (single file, works from file://)
```
Chapters 01..10 and `epilogue` (file name `11`, section id `ch11`).
No numbers in markup: every figure is rendered by JS from `ctx.data` / `LoopModel`. Prose may state qualitative things; any fact sentence with a number must be built from data (template strings reading ctx) so it stays in sync.

## ctx (window.Ctx)
```
ctx.M            = window.LoopModel
ctx.data         = { deals, entities, defaults, events, history, sources }   // parsed JSON, see data/*.json
ctx.state        = { params, laps, yearT, ui }      // shared; params is a full LoopModel param object
ctx.set(patch)   // merge into params, re-validate, notify subscribers, update URL hash via M.encodeState
ctx.reset()      // back to M.defaults()
ctx.subscribe(fn)  // fn(state) on every change; returns unsubscribe
ctx.tag(status, opts?) -> HTMLElement  // badge span for verified|reported|calculated|hypothetical|unverified; click/hover/focus shows meaning
ctx.tagged(el, taggedValue)            // renders {value,status,formula_text} into el: formatted value + badge + title/aria with formula_text
ctx.fmt = { usd(n, {digits}), pct(n), x(n) /* 2.3x */, compact(n) /* $1.2T */, num(n) }
ctx.colors = { external, recycled, promise, debt, paper }  // CSS var names: --c-external --c-recycled --c-promise --c-debt --c-paper
ctx.legend(el)   // append the standard money-kind legend (external warm, recycled cool, promise dashed ghost, debt red-orange, paper hatched)
ctx.reducedMotion  // bool (prefers-reduced-motion)
ctx.svg(tag, attrs, children?) // tiny SVG element helper
ctx.onVisible(el, fn) // IntersectionObserver once
ctx.sourceLink(id) -> HTMLAnchorElement (target=_blank rel=noopener) from data.sources
ctx.siteLink(path, text) -> <a href=path> (opens in top window: target="_top")
```
Colors (fixed): external cash = warm amber `#f0a32e`; recycled cash = cool cyan `#3bc4f2`; promises = dashed outline, 35% opacity ghost of violet `#9a7df0`; debt = red-orange `#ff5a36`; paper value = hatched pattern (SVG `<pattern id="hatch">` provided by shell in a defs block, use fill="url(#hatch)"). Gains/losses always carry a sign (+/-) as well as color.

## Quality bar for every chapter
- Hook paragraph (story), ONE core visual, ONE interaction, closing "What this means" line. Voice: bestselling science popularizer to a curious friend, "we", contractions, short quotable lines, uncertainty words where warranted ("we don't know yet"); no AI-speak (delve, robust, moreover, landscape, tapestry). One idea per paragraph, everyday analogies. Even-handed: show bull and bear readings; no verdict; never imply fraud; layered claims are NOT double pledging.
- Every number carries a status tag visible on hover/tap/focus (use ctx.tagged / ctx.tag).
- Promises are never added to cash totals without saying so on screen. Draw promises dashed + ghosted.
- Accessibility: semantic headings, keyboard operable controls with visible focus, aria-labels, `prefers-reduced-motion` respected (no autoplay animation when reduced), min tap target 40px, no color-only encoding. Mobile 390px: no horizontal overflow; wide SVGs use viewBox and scale.
- Works from file:// (no fetch, no CDN, no modules). Plain JS only. No raster images with numbers.
- Link other episodes with ctx.siteLink('/nvidia-dollar/' ...). Only: /nvidia-dollar/, /neoclouds/, /neocloud-contagion/, /burry-depreciation/, /sector-pulse/.
- Do not edit other agents' files. If you need a ctx helper that doesn't exist, define it locally inside your chapter JS and tell the lead.
- To preview/test: tools/bundle.py (written by the shell agent; if not present yet, build a tiny local harness in your scratch space) then open index.html; use Playwright if installed (`python3 -c "import playwright"`) or the built-in browser; verify no console errors.
