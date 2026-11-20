#!/usr/bin/env python3
"""Real-browser QA for the circular-finance page (file://, system Chrome, Playwright).

Run:  /private/tmp/claude-501/gauntlet/venv/bin/python tests/browser_test.py
Writes screenshots to /private/tmp/claude-501/gauntlet/shots4 and JSON results to
/private/tmp/claude-501/gauntlet/shots4/results.json. Exit code 1 if any BLOCK finding.
Round 3 (shots4): clicks the collapse toggles first (ch02 company cards, ch04 advanced, ch07 full list,
ch08 real examples), runs axe on every viewport, sweeps widths 861-1439.
"""
import json, os, sys, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent.parent
URL = 'file://' + str(HERE / 'index.html')
SHOTS = pathlib.Path('/private/tmp/claude-501/gauntlet/shots4'); SHOTS.mkdir(parents=True, exist_ok=True)
AXE = pathlib.Path('/private/tmp/claude-501/gauntlet/node_modules/axe-core/axe.min.js')
VIEWPORTS = [('1440x900', 1440, 900, False), ('1280x800', 1280, 800, False),
             ('820x1180', 820, 1180, False), ('390x844', 390, 844, False),
             ('1280x800-reduced-motion', 1280, 800, True)]
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
RES = {}
def log(vp, kind, msg, sev='MINOR'):
    RES.setdefault(vp, {'findings': [], 'ok': []})['findings'].append({'kind': kind, 'sev': sev, 'msg': msg})
    print(f'[{vp}] {sev} {kind}: {msg}')
def ok(vp, msg):
    RES.setdefault(vp, {'findings': [], 'ok': []})['ok'].append(msg)

def set_range(pg, sel, frac):
    """Set a range input to min+(max-min)*frac and fire input+change."""
    return pg.evaluate('''([sel,f])=>{const e=document.querySelector(sel); if(!e) return null;
      const mn=+e.min||0, mx=+e.max||100, st=+e.step||1; let v=mn+(mx-mn)*f; v=Math.round(v/st)*st;
      e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return e.value}''', [sel, frac])

def run_vp(p, name, w, h, rm):
    b = p.chromium.launch(executable_path=CHROME)
    ctx = b.new_context(viewport={'width': w, 'height': h}, reduced_motion='reduce' if rm else 'no-preference',
                        has_touch=(w < 500), is_mobile=(w < 500), permissions=['clipboard-read', 'clipboard-write'] if False else [])
    pg = ctx.new_page()
    errs = []
    pg.on('console', lambda m: errs.append(f'console.{m.type}: {m.text}') if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
    pg.on('requestfailed', lambda r: errs.append(f'requestfailed: {r.url[:100]}') if not r.url.startswith('data:') else None)
    pg.goto(URL); pg.add_style_tag(content='html{scroll-behavior:auto!important}'); pg.wait_for_timeout(1500)
    # scroll through to trigger lazy/observer rendering
    H = pg.evaluate('document.documentElement.scrollHeight')
    for y in range(0, H, max(400, h // 2)):
        pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(40)
    pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(300)

    def step(label, fn):
        before = len(errs)
        try:
            r = fn()
            pg.wait_for_timeout(120)
            if len(errs) > before: log(name, 'console', f'{label}: ' + ' | '.join(errs[before:]), 'BLOCK')
            if r is False: log(name, 'interaction', f'{label}: no effect / unusable', 'BLOCK')
            elif isinstance(r, str): log(name, 'interaction', f'{label}: {r}', 'MINOR')
            else: ok(name, label)
        except Exception as e:
            log(name, 'interaction', f'{label}: EXC {str(e)[:200]}', 'BLOCK')

    def click(sel, nth=0, scroll=True):
        loc = pg.locator(sel).nth(nth)
        if scroll: loc.scroll_into_view_if_needed(timeout=3000)
        loc.click(timeout=4000)

    # ---------- load checks ----------
    if errs: log(name, 'console', ' | '.join(errs), 'BLOCK')
    else: ok(name, 'no console/page errors on load')
    sw, iw = pg.evaluate('[document.documentElement.scrollWidth, window.innerWidth]')
    if sw > iw + 1: log(name, 'overflow', f'scrollWidth {sw} > innerWidth {iw}', 'BLOCK')
    else: ok(name, f'no horizontal overflow ({sw}<={iw})')
    off = pg.evaluate('''()=>{const W=innerWidth,out=[];
      const scr=e=>{for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const o=getComputedStyle(p).overflowX; if(o==='auto'||o==='scroll'||o==='hidden'||o==='clip') return true} return false};
      document.querySelectorAll('body *').forEach(e=>{ if(e.closest('svg')&&e.tagName!=='svg') return; const cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden'||e.classList.contains('skip')) return;
        const r=e.getBoundingClientRect(); if(!r.width||!r.height) return; const t=(e.innerText||'').trim(); if(!t) return;
        if(e.children.length>3) return; if((r.right>W+1||r.left<-1)&&!scr(e)) out.push(e.tagName+'#'+e.id+'.'+String(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className).slice(0,30)+' '+Math.round(r.left)+'..'+Math.round(r.right)+' "'+t.slice(0,30)+'"')});
      return out.slice(0,15)}''')
    if off: log(name, 'beyond-viewport', f'{len(off)} text elements beyond viewport width (not inside scroll container): ' + '; '.join(off[:8]), 'BLOCK')
    else: ok(name, 'no unscrollable text elements beyond viewport')
    clipped = pg.evaluate('''()=>{const out=[];document.querySelectorAll('button,.btn,.tag,label,h1,h2,h3,td,th,.c2-chip').forEach(e=>{const cs=getComputedStyle(e);if(cs.display==='none')return;
        if(e.scrollWidth>e.clientWidth+2&&(cs.overflowX==='hidden'||cs.textOverflow==='ellipsis')&&e.clientWidth>0)out.push(e.tagName+'.'+String(e.className).slice(0,25)+' "'+(e.textContent||'').trim().slice(0,30)+'"')});return out.slice(0,10)}''')
    if clipped: log(name, 'clipped-text', '; '.join(clipped))
    pg.screenshot(path=str(SHOTS / f'{name}-full.png'), full_page=True)
    # per-chapter shots (more legible than one giant image)
    for cid in ['hero'] + [f'ch{i:02d}' for i in range(1, 12)]:
        try:
            loc = pg.locator('section.hero' if cid == 'hero' else '#' + cid)
            loc.scroll_into_view_if_needed(); pg.wait_for_timeout(150)
            if name in ('1280x800', '390x844'):
                loc.screenshot(path=str(SHOTS / f'{name}-{cid}.png'))
        except Exception as e:
            log(name, 'screenshot', f'{cid}: {str(e)[:100]}')

    # ---------- a11y (axe) ----------
    if True:
        try:
            pg.add_script_tag(path=str(AXE))
            r = pg.evaluate('async()=>{const r=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","best-practice"]}});return r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,n:v.nodes.length,ex:v.nodes.slice(0,3).map(n=>n.target.join(" ")+" :: "+(n.failureSummary||"").split("\\n").slice(0,3).join(" ").slice(0,200))}))}')
            RES.setdefault('axe', {})[name] = r
            print('AXE', name, json.dumps(r)[:1200])
            for v in r:
                if v['impact'] in ('critical', 'serious'): log(name, 'axe-' + v['id'], f"{v['impact']} x{v['n']}: " + v['help'], 'BLOCK')
        except Exception as e:
            log(name, 'axe', str(e)[:200])

    # ---------- ch01 ----------
    step('ch01 friends slider', lambda: (set_range(pg, '#ch01-n', 1), pg.locator('#ch01-nout').text_content())[1] is not None)
    step('ch01 laps slider', lambda: set_range(pg, '#ch01-l', .6) is not None)
    step('ch01 guest toggle', lambda: (click('#ch01-guest'), pg.locator('#ch01-guest').get_attribute('aria-pressed'))[1] in ('true', 'false', None) or False)
    step('ch01 play/step/end/reset', lambda: [click('#ch01-play'), pg.wait_for_timeout(600), click('#ch01-step'), click('#ch01-end'), click('#ch01-reset')] and True)

    # ---------- ch02 ----------
    mobile = w < 500
    def c2_types():
        n = pg.locator('#ch02 .c2-chip').count()
        for i in range(n): click('#ch02 .c2-chip', i)
        for i in range(n): click('#ch02 .c2-chip', i)  # toggle back
        return n >= 9
    step('ch02 chips (edge type + money kind) toggle all', c2_types)
    def c2_filter_effect():
        before = pg.locator('#ch02 g.c2-e').count()
        vis = lambda: pg.evaluate("[...document.querySelectorAll('#ch02 g.c2-e')].filter(e=>getComputedStyle(e).display!=='none'&&+getComputedStyle(e).opacity>0.3).length")
        v0 = vis(); click('#ch02 .c2-chip', 0); v1 = vis(); click('#ch02 .c2-chip', 0)
        return True if v1 != v0 else f'type filter did not change visible edge count ({v0}->{v1})'
    step('ch02 type filter changes edges', c2_filter_effect)
    def c2_kind():
        vis = lambda: pg.evaluate("[...document.querySelectorAll('#ch02 g.c2-e')].filter(e=>getComputedStyle(e).display!=='none'&&+getComputedStyle(e).opacity>0.3).length")
        v0 = vis(); click('#ch02 .c2-chip', 11); v1 = vis(); click('#ch02 .c2-chip', 11)
        return True if v1 != v0 else f'kind filter did not change visible edges ({v0}->{v1})'
    step('ch02 money-kind filter', c2_kind)
    def c2_search():
        s = pg.locator('#ch02 input[type=search]'); s.scroll_into_view_if_needed(); s.fill('CoreWeave'); pg.wait_for_timeout(300)
        s.fill(''); return True
    step('ch02 search', c2_search)
    def c2_focus():
        pg.locator('#ch02 g.c2-e').nth(2).scroll_into_view_if_needed()
        pg.locator('#ch02 g.c2-e').nth(2).focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
        # node focus: click a node
        nodes = pg.locator('#ch02 svg g[class*="c2-n"], #ch02 svg g.node')
        if nodes.count(): nodes.first.click(force=True)
        click('#ch02 button:has-text("Clear focus")'); return True
    if not mobile: step('ch02 edge select + node focus + clear', c2_focus)
    def c2_list():
        click('#ch02 .c2-btn[data-view=list]'); pg.wait_for_timeout(200)
        vis = pg.evaluate("(()=>{const l=document.querySelector('#ch02 .c2-list');return l&&getComputedStyle(l).display!=='none'&&l.getBoundingClientRect().height>50})()")
        ex = pg.locator('#ch02 .c2-btn[data-view=map]').get_attribute('aria-expanded')
        pg.screenshot(path=str(SHOTS / f'{name}-ch02-list.png'))
        click('#ch02 .c2-btn[data-view=map]'); pg.wait_for_timeout(150)
        gone = pg.evaluate("(()=>{const l=document.querySelector('#ch02 .c2-list');return getComputedStyle(l).display==='none'})()")
        if not vis: return False
        return True if gone else 'company cards did not hide again'
    if not (w < 500 and not pg.locator('#ch02 .c2-btn[data-view=list]').is_visible()):
        step('ch02 company-cards toggle', c2_list)
    else: ok(name, 'ch02 mobile: list-only view, toggle intentionally hidden')
    if w < 500:
        v = pg.evaluate("(()=>{const m=document.querySelector('#ch02 .c2-main'),l=document.querySelector('#ch02 .c2-list');return [getComputedStyle(m).display,getComputedStyle(l).display]})()")
        step('ch02 mobile default shows map or list', lambda: True if (v[0] != 'none' or v[1] != 'none') else f'mobile default: neither map nor list visible {v} until toggle is tapped')
    if not mobile: step('ch02 pause pulses', lambda: (True if (rm and not pg.locator('#ch02 .c2-btn[data-slot=pause]').is_visible()) else click('#ch02 .c2-btn[data-slot=pause]') or True))

    # ---------- ch03 ----------
    def c3():
        if pg.locator('#c3-next').is_disabled(): click('#c3-prev', 0) if not pg.locator('#c3-prev').is_disabled() else None  # autoplay may have reached the last hop
        pg.evaluate("document.querySelector('#c3-play') && document.querySelector('#c3-play').getAttribute('aria-pressed')==='true' && document.querySelector('#c3-play').click()")
        for _ in range(3): click('#c3-next') if not pg.locator('#c3-next').is_disabled() else click('#c3-prev')
        for _ in range(2): click('#c3-prev')
        a = pg.locator('#c3-count').text_content()
        (None if pg.locator('#c3-play').is_disabled() else (click('#c3-play'), pg.wait_for_timeout(1500), click('#c3-play')))
        return bool(a)
    step('ch03 next/back/play', c3)
    def c3_laps():
        click('#c3-laps button', 1); click('#c3-laps button', 0)
        lap = pg.locator('#c3-nbtn');
        if lap.count(): click('#c3-nbtn')
        s = pg.locator('#c3-n')
        if s.count() and s.get_attribute('type') == 'range': set_range(pg, '#c3-n', .5)
        return True
    step('ch03 laps control', c3_laps)
    def c3_math():
        d = pg.locator('#c3-math'); d.scroll_into_view_if_needed()
        tag = d.evaluate('e=>e.tagName')
        if tag == 'DETAILS': d.locator('summary').click(); o = d.evaluate('e=>e.open')
        else: d.click(); o = True
        pg.wait_for_timeout(200); vis = pg.locator('#c3-mathbody').is_visible()
        return True if vis else 'show-the-math body not visible after click'
    step('ch03 show-the-math drawer', c3_math)

    # ---------- ch04 ----------
    def c4_sliders():
        pg.locator('#ch04 details.c4-more').scroll_into_view_if_needed()
        click('#ch04 details.c4-more > summary')
        if not pg.evaluate("document.querySelector('#ch04 details.c4-more').open"): return 'advanced toggle did not open'
        nm = pg.evaluate("document.querySelectorAll('#c4-rows-more input[type=range]').length")
        if nm < 1: return 'no sliders inside advanced settings'
        for sid in pg.evaluate("[...document.querySelectorAll('#c4-rows-more input[type=range]')].map(e=>e.id)"):
            click('#' + sid) if False else None; set_range(pg, '#' + sid, .8); set_range(pg, '#' + sid, .2)
        pg.screenshot(path=str(SHOTS / f'{name}-ch04-advanced.png'))
        click('#ch04 details.c4-more > summary')
        ids = pg.evaluate("[...document.querySelectorAll('#c4-rows input[type=range]')].map(e=>e.id)")
        for i in ids:
            set_range(pg, '#' + i, .9); set_range(pg, '#' + i, .1)
        return len(ids) >= 4
    step('ch04 every slider + advanced toggle', c4_sliders)
    def c4_presets():
        for i in range(3):
            pg.locator('#ch04 .btn:has-text("-like")').nth(i).scroll_into_view_if_needed(); pg.locator('#ch04 .btn:has-text("-like")').nth(i).click()
        h = pg.evaluate('location.hash'); return True if h else 'preset did not write share hash'
    step('ch04 presets', c4_presets)
    def c4_copy():
        click('#c4-copy'); pg.wait_for_timeout(300); v = pg.locator('#c4-url').input_value()
        return True if 'index.html' in v or v.startswith('file') or v.startswith('http') else f'share URL box empty/odd: {v!r}'
    step('ch04 copy share link', c4_copy)
    step('ch04 reset', lambda: click('#c4-reset') or True)
    # hash round trip
    def roundtrip():
        sid = pg.evaluate("document.querySelector('#ch04 input[type=range]').id")
        set_range(pg, '#' + sid, .8); pg.wait_for_timeout(200)
        v1 = pg.locator('#' + sid).input_value(); h = pg.evaluate('location.hash')
        if not h: return 'no hash written after slider change (file:// replaceState?)'
        pg.goto(URL + h); pg.reload(); pg.wait_for_timeout(1200)
        v2 = pg.locator('#' + sid).input_value()
        return True if abs(float(v1) - float(v2)) < 1e-6 else f'hash did not round-trip: {v1} -> {v2} (hash {h})'
    step('share-state round-trip', roundtrip)
    # clean state again
    pg.goto(URL); pg.wait_for_timeout(1000)

    # ---------- ch05 ----------
    def c5():
        n = pg.locator('#ch05 g.slab').count()
        for i in range(n): pg.locator('#ch05 g.slab').nth(i).scroll_into_view_if_needed(); pg.locator('#ch05 g.slab').nth(i).click(force=True)
        for yrs in range(4): click('#ch05 button:has-text("years")', yrs)
        set_range(pg, '#ch05-year', 1); set_range(pg, '#ch05-year', .3)
        click('#ch05 button:has-text("The senior loan")'); click('#ch05 button:has-text("The GPU\'s value")')
        a0 = pg.locator('#ch05 [data-amort]').get_attribute('aria-pressed'); click('#ch05 [data-amort]'); a1 = pg.locator('#ch05 [data-amort]').get_attribute('aria-pressed'); click('#ch05 [data-amort]')
        if a0 == a1: return 'debt-paydown toggle did not flip aria-pressed'
        return n >= 7
    step('ch05 slabs/life/year/ratio', c5)

    # ---------- ch06 ----------
    step('ch06 growth slider', lambda: set_range(pg, '#ch06-g', .9) is not None and set_range(pg, '#ch06-g', .1) is not None)

    # ---------- ch07 ----------
    def c7():
        pg.locator('#ch07').scroll_into_view_if_needed()
        if pg.locator('#ch07 [data-slot=callouts] > *').count() < 3: return 'fewer than 3 tangled-pair callouts'
        t = pg.locator('#ch07 [data-slot=fulltoggle]'); t.scroll_into_view_if_needed(); t.click(); pg.wait_for_timeout(250)
        if t.get_attribute('aria-expanded') != 'true' or pg.locator('#c7-full').is_hidden(): return 'full-list toggle did not expand'
        for i in range(3): click('#ch07 .c7-btn[data-sort]', i)
        click('#ch07 input[type=checkbox]'); click('#ch07 input[type=checkbox]')
        if w >= 700:
            c = pg.locator('#ch07 td.has'); c.first.scroll_into_view_if_needed()
            c.nth(1).hover(); pg.wait_for_timeout(300)
            tip1 = pg.locator('#ch07 [data-slot=tip]').inner_text().strip()
            c.nth(2).focus(); pg.wait_for_timeout(300)
            tip2 = pg.locator('#ch07 [data-slot=tip]').inner_text().strip()
            pg.screenshot(path=str(SHOTS / f'{name}-ch07-cell.png'))
            if not (tip1 or tip2): return 'cell hover/focus showed no detail'
        else:
            pg.screenshot(path=str(SHOTS / f'{name}-ch07-full.png'))
        t.click(); pg.wait_for_timeout(200)
        return True if pg.locator('#c7-full').is_hidden() else 'full-list toggle did not collapse'
    step('ch07 callouts / full-list toggle / sort / 3+ / hover+focus', c7)

    # ---------- ch08 ----------
    def c8():
        g = pg.locator('#ch08 button:has-text("Next")'); n = g.count()
        for i in range(n):
            g.nth(i).scroll_into_view_if_needed()
            for _ in range(3): g.nth(i).click()
            pg.locator('#ch08 button:has-text("Back")').nth(i).click(); pg.locator('#ch08 button:has-text("Reset")').nth(i).click()
        d = pg.locator('#ch08 details.ch08-ex'); m = d.count()
        for i in range(m):
            d.nth(i).scroll_into_view_if_needed(); d.nth(i).locator('summary').click(); pg.wait_for_timeout(100)
            if not d.nth(i).evaluate('e=>e.open') or d.nth(i).locator('li').first.is_hidden(): return f'real-example toggle {i} did not reveal content'
        pg.screenshot(path=str(SHOTS / f'{name}-ch08-examples.png'))
        for i in range(m): d.nth(i).locator('summary').click()
        return n >= 4 and m >= 4
    step('ch08 diagram steps + real-example toggles', c8)

    # ---------- ch09 ----------
    def c9():
        for i in range(4): click('#ch09 .presets button', i)
        for sid in pg.evaluate("[...document.querySelectorAll('#ch09 input[type=range]')].map(e=>e.id)"):
            set_range(pg, '#' + sid, .8)
        click('#ch09 input[type=checkbox]'); click('#ch09 .btn-reset'); return True
    step('ch09 presets/sliders/missed payment/reset', c9)

    # ---------- ch10 ----------
    def c10():
        for t in ['Then', 'Now', 'Both', 'Facts only', 'Bull reading', 'Bear reading']:
            b_ = pg.locator(f'#ch10 button:text-is("{t}")'); b_.scroll_into_view_if_needed(); b_.click()
            if b_.get_attribute('aria-pressed') != 'true': return f'{t} not aria-pressed after click'
        return True
    step('ch10 toggles', c10)

    # ---------- ch11 ----------
    def c11():
        set_range(pg, '#ch11-target', .9); pg.wait_for_timeout(200); set_range(pg, '#ch11-target', .5)  # 72.5-ish: reachable
        if pg.locator('#ch11-apply').is_disabled(): set_range(pg, '#ch11-target', .45)
        click('#ch11-apply'); click('#ch11-resetm')
        click('#ch11-share'); pg.wait_for_timeout(300)
        m = pg.locator('#ch11-sharemsg').text_content().strip()
        return True if m else 'copy-link gave no confirmation message'
    step('ch11 target slider/apply/reset/copy link', c11)

    # ---------- tag popover: hover, focus, tap ----------
    def tags():
        t = pg.locator('#ch01 .tag').first; t.scroll_into_view_if_needed()
        res = []
        if w >= 500:
            t.hover(); pg.wait_for_timeout(350); res.append(('hover', pg.locator('#popover').is_visible()))
            pg.mouse.move(5, 5); pg.wait_for_timeout(300)
        t.focus(); pg.wait_for_timeout(350); res.append(('focus', pg.locator('#popover').is_visible()))
        pg.screenshot(path=str(SHOTS / f'{name}-popover-focus.png'))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        t2 = pg.locator('#ch01 .tag').nth(1)
        if w < 500: t2.tap()
        else: t2.click()
        pg.wait_for_timeout(350); res.append(('tap/click', pg.locator('#popover').is_visible()))
        box = pg.locator('#popover').bounding_box()
        pg.screenshot(path=str(SHOTS / f'{name}-popover-tap.png'))
        if box and (box['x'] < -1 or box['x'] + box['width'] > w + 1): res.append(('popover-in-viewport', False))
        bad = [k for k, v in res if not v]
        return True if not bad else 'popover failed for: ' + ', '.join(bad)
    step('tag badge popover (hover/focus/tap)', tags)

    # ---------- mobile tallies sheet ----------
    def sheet():
        pg.evaluate('window.scrollTo(0,0)')
        tg = pg.locator('#talliesToggle')
        vis = tg.is_visible()
        if not vis: return 'tallies toggle not visible at this width' if w < 900 else True
        a0 = tg.get_attribute('aria-expanded'); tg.click(); pg.wait_for_timeout(300); a1 = tg.get_attribute('aria-expanded')
        pg.screenshot(path=str(SHOTS / f'{name}-tallies-open.png'))
        tg.click(); pg.wait_for_timeout(200)
        return True if a0 != a1 else 'aria-expanded did not toggle'
    step('mobile bottom sheet toggle', sheet)

    # ---------- keyboard-only ----------
    def kbd():
        pg.goto(URL); pg.add_style_tag(content='html{scroll-behavior:auto!important}'); pg.wait_for_timeout(1000); pg.evaluate('document.activeElement&&document.activeElement.blur();window.scrollTo(0,0)')
        seen = []; noindicator = []; trap = None
        sig = lambda: pg.evaluate('''()=>{const e=document.activeElement; if(!e||e===document.body) return null; const cs=getComputedStyle(e);
          const r=e.getBoundingClientRect();
          return {k:e.tagName+'#'+e.id+'.'+String(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className).slice(0,25)+'|'+(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,80)+'@'+Math.round(r.top+scrollY),
            ctx:(e.closest('#tallies,.tallies,[id*=tall]')?'tallies':'')+' top='+Math.round(r.top)+' h='+innerHeight,ring:(cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0)||(cs.boxShadow&&cs.boxShadow!=='none')||(e.namespaceURI.indexOf('svg')>=0),
            vis:r.width>0&&r.height>0, inview:r.bottom>0&&r.top<innerHeight}}''')
        N = 700; same = 0; prev = None; uniq = set()
        for i in range(N):
            pg.keyboard.press('Tab'); s = sig()
            if s is None:
                if i > 5 and prev is None: same += 1
                prev = None; continue
            uniq.add(s['k'])
            if prev == s['k']:
                same += 1
                if same >= 4: trap = s['k']; break
            else: same = 0
            prev = s['k']
            if not s['ring'] or not s['vis']: noindicator.append(s['k'] + (' (zero-size)' if not s['vis'] else ''))
            if not s['inview']: noindicator.append(s['k'] + ' (not scrolled into view; ' + s['ctx'] + ')')
        # wrap check: did we return to start (pass whole page)?
        out = []
        if trap: out.append('KEYBOARD TRAP at ' + trap)
        RES.setdefault(name, {})['kbd'] = {'unique_stops': len(uniq), 'no_indicator': sorted(set(noindicator))[:25], 'trap': trap}
        if trap: log(name, 'keyboard-trap', trap, 'BLOCK')
        if noindicator:
            log(name, 'focus-visible', f'{len(set(noindicator))} stops lacking visible focus ring/in-view: ' + '; '.join(sorted(set(noindicator))[:12]), 'BLOCK' if len(set(noindicator)) > 5 else 'MINOR')
        return True
    if name in ('1280x800', '390x844'):
        step('keyboard-only Tab traversal', kbd)

    # final console
    if errs: log(name, 'console', 'errors during session: ' + ' | '.join(sorted(set(errs))[:5]), 'BLOCK')
    b.close()

def sweep(p):
    b = p.chromium.launch(executable_path=CHROME)
    widths = sorted(set([320, 360, 390, 600, 700, 760, 820, 860, 861, 900, 1000, 1024, 1100, 1200, 1280, 1300, 1366, 1439, 1440, 1600] + list(range(861, 1440, 40))))
    bad = []
    for wd in widths:
        ctx = b.new_context(viewport={'width': wd, 'height': 900}); pg = ctx.new_page(); pg.goto(URL); pg.wait_for_timeout(500)
        # open every collapse toggle so hidden content is measured too
        pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true);document.querySelectorAll('[data-slot=fulltoggle],[data-view=list]').forEach(b=>b.click())")
        pg.wait_for_timeout(300)
        sw = pg.evaluate('document.documentElement.scrollWidth')
        if sw > wd + 1: bad.append((wd, sw)); log('sweep', 'overflow', f'{wd}: scrollWidth {sw}', 'BLOCK')
        ctx.close()
    RES['sweep_detail'] = {'widths': widths, 'overflow': bad}
    if not bad: ok('sweep', f'no overflow at {len(widths)} widths incl. 1024, 1366 (collapses open)')
    b.close()

def main():
    with sync_playwright() as p:
        for v in VIEWPORTS: run_vp(p, *v)
        sweep(p)
    json.dump(RES, open('/private/tmp/claude-501/gauntlet/shots4/results.json', 'w'), indent=1)
    blocks = sum(1 for k, v in RES.items() if isinstance(v, dict) for f in v.get('findings', []) if f['sev'] == 'BLOCK')
    print('BLOCK findings:', blocks)
    sys.exit(1 if blocks else 0)

if __name__ == '__main__':
    main()
