#!/usr/bin/env python3
"""Bundle Episode 11 into one self-contained HTML file (index.html + dist/circular-finance.html)."""
import json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
CH = os.path.join(SRC, 'chapters')
DATA = os.path.join(ROOT, 'data')
DATA_FILES = [('deals', 'deals'), ('entities', 'entities'), ('loop-defaults', 'loop-defaults'),
              ('events', 'events'), ('history', 'history'), ('sources', 'sources'), ('source-claims', 'source-claims'), ('meta', 'meta')]
# Builder/research-process fields: kept in data/*.json for audit, never embedded in the page bundle.
INTERNAL_KEYS = {'internal_notes', 'merge_log', 'status_adjusted_from', 'status_adjustment_reason', 'research_file', 'merged_from'}


def strip_internal(o):
    if isinstance(o, dict):
        return {k: strip_internal(v) for k, v in o.items() if k not in INTERNAL_KEYS}
    if isinstance(o, list):
        return [strip_internal(v) for v in o]
    return o

KEYS = ['%02d' % i for i in range(1, 12)]


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def safe_script(s):
    return re.sub(r'</(script)', r'<\\/\1', s, flags=re.I)


def node_check(path, errors):
    r = subprocess.run(['node', '--check', path], capture_output=True, text=True)
    if r.returncode != 0:
        errors.append('JS syntax error in %s:\n%s' % (os.path.relpath(path, ROOT), r.stderr.strip()))


def main():
    errors, warnings = [], []
    shell = read(os.path.join(SRC, 'shell.html'))
    css = [('base.css', read(os.path.join(SRC, 'base.css')))]
    js = []
    for p in ('loop-model.js', 'runtime.js'):
        full = os.path.join(SRC, p)
        node_check(full, errors)
        js.append((p, read(full)))
    chapters = {}
    for k in KEYS:
        h = os.path.join(CH, k + '.html')
        c = os.path.join(CH, k + '.css')
        j = os.path.join(CH, k + '.js')
        if os.path.exists(h):
            chapters[k] = read(h)
        else:
            warnings.append('chapter %s: no html, using placeholder' % k)
            chapters[k] = ('<section id="ch%s" class="chapter soon" data-chapter="%s"><div class="ch-head"><div class="ch-num">%s</div>'
                           '<h2>Chapter %s</h2></div><p>Coming soon.</p></section>') % (k, k, k, k)
        if os.path.exists(c):
            css.append((k + '.css', read(c)))
        if os.path.exists(j):
            node_check(j, errors)
            js.append((k + '.js', read(j)))
    # data
    data_tags = []
    for fname, ident in DATA_FILES:
        p = os.path.join(DATA, fname + '.json')
        if not os.path.exists(p):
            warnings.append('missing data/%s.json' % fname)
            raw = '{}'
        else:
            raw = json.dumps(strip_internal(json.load(open(p, encoding='utf-8'))), separators=(',', ':'), ensure_ascii=False)
        raw = raw.replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
        data_tags.append('<script type="application/json" id="data-%s">%s</script>' % (ident, raw))
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        sys.exit(1)

    out = shell
    out = out.replace('<!--STYLES-->', '<style>\n' + '\n'.join('/* %s */\n%s' % (n, s) for n, s in css) + '\n</style>')
    for k in KEYS[:10]:
        out = out.replace('<!--CHAPTER:%s-->' % k, chapters[k])
    out = out.replace('<!--EPILOGUE-->', chapters['11'])
    out = out.replace('<!--DATA-->', '\n'.join(data_tags))
    scripts = '\n'.join('<script>\n/* %s */\n%s\n</script>' % (n, safe_script(s)) for n, s in js)
    out = out.replace('<!--SCRIPTS-->', scripts)
    left = re.findall(r'<!--(?:CHAPTER:\d+|EPILOGUE|STYLES|DATA|SCRIPTS)-->', out)
    if left:
        print('unreplaced placeholders: %s' % left, file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    for p in (os.path.join(ROOT, 'index.html'), os.path.join(ROOT, 'dist', 'circular-finance.html')):
        with open(p, 'w', encoding='utf-8') as f:
            f.write(out)
    for w in warnings:
        print('warn:', w)
    print('built index.html and dist/circular-finance.html (%.0f KB)' % (len(out.encode('utf-8')) / 1024))


if __name__ == '__main__':
    main()
