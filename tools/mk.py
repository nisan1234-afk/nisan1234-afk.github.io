"""Build a marketing-chapter deck: python3 mk.py NN "כותרת"
Reads tayarut/marketing/NN/body.part (only <section> elements) and wraps it in the shared
deck shell (same CSS and script as the region decks)."""
import re, sys, os, json, urllib.parse
SITE = '/home/claude/nisan1234-afk.github.io/tayarut'
nn, title = sys.argv[1], sys.argv[2]
d = f'{SITE}/marketing/{nn}'
shell = open(f'{SITE}/jerusalem/02/index.html', encoding='utf-8').read()
head = shell[:shell.index('<div class="deck"')]
head = re.sub(r'<title>[^<]*</title>', f'<title>מאפיינים ושיווק · {title}</title>', head)
EXTRA = """
.ctab th,.ctab td{padding:4px 8px;font-size:14px;line-height:1.35}
.ctab td.d{white-space:normal}
.ctab .tag{margin:0;font-size:11px}
.ctab a{color:var(--olive)}
.ctwo{gap:16px;align-items:start}
/* marketing chapter: links to region topics, "not in 2026 focus" tag */
.seen{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:14px;color:var(--ink-2)}
.seen b{font-weight:500;color:var(--ink-3);font-size:13px}
.seen a{color:var(--olive);text-decoration:none;border:1px solid var(--olive);border-radius:99px;padding:1px 10px;font-size:13px}
.seen a:hover{background:var(--olive-soft)}
.tag.off{border-style:dashed}
.card>.tag{align-self:flex-start;margin-inline-start:0}
.mini{font-size:15px;color:var(--ink-2)}
.big{font-family:var(--display);font-weight:900;font-size:var(--step-2);color:var(--olive);line-height:1.1}
.flow{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.flow span{border:1px solid var(--rule);border-radius:10px;padding:6px 12px;background:var(--bg);font-size:15px}
.flow i{font-style:normal;color:var(--copper);font-weight:700}
"""
head = head.replace('</style>', EXTRA + '</style>', 1)
fb = json.load(open('/home/claude/work/feedback_links.json', encoding='utf-8')).get(f'marketing-{nn}')
fbhtml = f' · <a class="fb" href="{fb}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">משוב מורים</a>' if fb else ''
num = int(nn)
bar = f'<div class="deck" dir="rtl" lang="he">\n  <div class="bar"><b>מאפיינים ושיווק</b><span>נושא {num} · {title}{fbhtml}</span></div>\n  <div class="prog" aria-hidden="true"><i id="prog"></i></div>\n'
body = open(f'{d}/body.part', encoding='utf-8').read()
n = body.count('<section')
# first slide visible, the rest hidden
secs = re.findall(r'<section\b', body)
k = 0
def hid(m):
    global k
    k += 1
    return m.group(0) if k == 1 else m.group(0)
tail = shell[shell.index('<nav class="nav"'):]
tail = re.sub(r'1 / \d+', f'1 / {n}', tail)
out = head + bar + body + '\n</div>\n\n' + tail
open(f'{d}/index.html', 'w', encoding='utf-8').write(out)
for src in set(re.findall(r'src="(img/[^"]+)"', body)):
    if not os.path.exists(f'{d}/{src}'):
        print('MISSING', src)
ids = re.findall(r'<section[^>]*id="(s[^"]+)"', body)
print(nn, n, 'slides', ' '.join(ids))
