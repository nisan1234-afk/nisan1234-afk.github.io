"""Builds tayarut/index.html: a catalog of all topic decks, media and CET units.
Run again whenever a deck, video, podcast or CET unit is added."""
import os, re, html, json
import json as _json
FB=_json.load(open("/home/claude/work/feedback_links.json",encoding="utf-8"))

ROOT = '/home/claude/nisan1234-afk.github.io/tayarut'
BASE = 'https://nisan1234-afk.github.io/tayarut'

REGIONS = [  # order, slug, display name, short blurb
    ('jerusalem', 'ירושלים', 'העיר העתיקה, שלוש הדתות, העיר החדשה'),
    ('deadsea', 'ים המלח ומדבר יהודה', 'המקום הנמוך בעולם, נופש פעיל, מצדה וקומראן'),
    ('valleys', 'העמקים', 'עמק יזרעאל, בית שאן והגלבוע'),
    ('coastal', 'מישור החוף', 'עכו, חיפה, תל אביב–יפו, השרון והדרום'),
    ('galilee', 'הגליל', 'הגליל העליון, צפת, טבריה וסובב כינרת'),
    ('golan', 'רמת הגולן', 'נוף געשי, מים, היסטוריה וצפון הגולן'),
    ('negev', 'הנגב, הערבה ואילת', 'מכתשים, מורשת, הערבה ואילת'),
]

# CET "My Studio" units: (region, topic) -> player document id
CET = {
    ('jerusalem', '01'): '003311dd-c00b-6c29-24bd-2627f231d024',
    ('jerusalem', '02'): '2b4986c0-7766-69c2-dbb1-513bdcc76ba7',
    ('jerusalem', '03'): '9d69fdec-b2ce-6dab-6f7c-8cdf4046a774',
    ('jerusalem', '04'): '21150223-27e5-4064-9b5d-ba25f454beb7',
    ('jerusalem', '05'): 'e62d18ae-ba08-4e88-9d40-f4a7d006c8ea',
    ('jerusalem', '06'): '8212da45-bf00-4806-9837-10eeefca9525',
    ('deadsea', '01'): '1bccf78e-7883-4504-8739-8e412441645d',
    ('deadsea', '02'): '6fa068b8-44ca-449c-b975-eaa0719f0a71',
    ('deadsea', '03'): '0075712c-cc87-4fb8-bf71-7bf1c7827906',
    ('coastal', '01'): 'dad83f1d-67f8-435a-ac49-d451af6eca7d',
    ('coastal', '02'): 'bfa6e7ff-c08f-453a-afc1-5c3e742ca2c1',
    ('coastal', '03'): '060f257c-d266-469b-bcdc-2f020e901cb4',
    ('coastal', '04'): '4c3847ab-c886-404d-b744-bb2e5da68732',
    ('galilee', '01'): '8876e6dd-17e9-4fa3-9ab0-62a201cf4fbd',
    ('galilee', '02'): 'e7cfb309-aeff-465e-b3fa-dd35b38e8323',
    ('galilee', '03'): 'db8e03a4-137c-4e3a-9a06-a444ed40f795',
    ('galilee', '04'): '0a55bf4e-b19d-427f-a90e-e5640eb4ae19',
    ('golan', '01'): '08a4729a-8769-4494-b0ee-47929063d1b4',
    ('golan', '02'): '3b6549d5-593c-4fd4-a7e6-385783964697',
    ('golan', '03'): 'c1575078-4aff-489f-9f66-f0be887e5400',
    ('golan', '04'): 'edcedf82-4b82-4fee-9e46-27c3e528370b',
    ('negev', '01'): 'e5a334e4-af4c-4f01-9302-f11b98a31cba',
    ('negev', '02'): 'cdb07236-5ee9-452c-bcdf-59c77c62f452',
    ('negev', '03'): '71ee5809-bfd4-43e2-9e20-9aa7241bdba4',
    ('negev', '04'): '1d96dd0e-a3f7-4ddd-8279-4dfc4ab1fb6c',
    ('negev', '05'): '17f0de92-234c-4af0-97c7-1c32200234f9',
    ('valleys', '01'): 'bc675790-0f2c-4eb9-b3db-2e7840a2d33d',
    ('valleys', '02'): '5248eda7-635d-4df8-9e89-a4845655734b',
    ('valleys', '03'): '92dc100d-0e92-403f-abc0-374e18eaec46',
}

def ready(f):
    return os.path.exists(f) and 'media-status" content="pending' not in open(f, encoding='utf-8').read()

data = []
for slug, name, blurb in REGIONS:
    d = os.path.join(ROOT, slug)
    topics = []
    for t in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        p = os.path.join(d, t)
        if not os.path.isfile(os.path.join(p, 'index.html')):
            continue
        title = re.search(r'<title>([^<]*)</title>', open(os.path.join(p, 'index.html'), encoding='utf-8').read()).group(1)
        title = title.split(' · ', 1)[-1]
        topics.append({
            'n': int(t), 'title': title,
            'deck': f'{BASE}/{slug}/{t}/',
            'video': f'{BASE}/{slug}/{t}/video.html' if ready(os.path.join(p, 'video.html')) else None,
            'podcast': f'{BASE}/{slug}/{t}/podcast.html' if ready(os.path.join(p, 'podcast.html')) else None,
            'pdf': f'{BASE}/{slug}/{t}/worksheet.pdf' if os.path.exists(os.path.join(p, 'worksheet.pdf')) else None,
            'docx': f'{BASE}/{slug}/{t}/worksheet.docx' if os.path.exists(os.path.join(p, 'worksheet.docx')) else None,
            'fb': FB.get(f'{slug}-{t}'),
            'cet': f'https://lo.cet.ac.il/player/?document={CET[(slug, t)]}&language=he' if (slug, t) in CET else None,
        })
    data.append({'slug': slug, 'name': name, 'blurb': blurb, 'topics': topics})

n_topics = sum(len(r['topics']) for r in data)
n_media = sum(1 for r in data for t in r['topics'] if t['video'])
n_cet = sum(1 for r in data for t in r['topics'] if t['cet'])


# ---- new catalog design (based on the Stitch draft) ----
import sys
IMG = {'jerusalem': 'jerusalem/01/img/walls.jpg', 'deadsea': 'deadsea/01/img/hero.jpg', 'valleys': 'valleys/01/img/hero.jpg',
       'coastal': 'coastal/01/img/knights.jpg', 'galilee': 'galilee/01/img/teldan.jpg', 'golan': 'golan/01/img/hero.jpg',
       'negev': 'negev/01/img/ramon.jpg'}
FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSfPH4yVHpoVDgWuujNlOalr5OQ58aG-LXlM2PoRxTDdiMylSA/viewform'
ICON = {
    'deck': '<path d="M3 4h18v12H3z"/><path d="M8 20h8M12 16v4"/>',
    'vid': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    'pod': '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
    'cet': '<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M2 20h20"/>',
    'pdf': '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/>',
    'doc': '<path d="M6 2h9l5 5v15H6z"/><path d="M9 13h6M9 17h6"/>',
    'fb': '<path d="M4 5h16v11H8l-4 4z"/>',
}
TYPES = [('deck', 'מצגת'), ('vid', 'סרטון פתיחה'), ('pod', 'פודקאסט'), ('cet', 'יחידה במט״ח'),
         ('pdf', 'דף עבודה PDF'), ('doc', 'דף עבודה Word'), ('fb', 'משוב מורים')]


def ico(k):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true">{ICON[k]}</svg>'


def chip(url, k, label):
    if not url:
        return f'<span class="chip off c-{k}" data-t="{k}">{ico(k)}{label}</span>'
    return f'<a class="chip c-{k}" data-t="{k}" href="{html.escape(url)}" target="_blank" rel="noopener">{ico(k)}{label}</a>'


n_pod = sum(1 for r in data for t in r['topics'] if t['podcast'])
regs, navr = [], []
for i, r in enumerate(data, 1):
    navr.append(f'<a class="rchip" href="#{r["slug"]}">{r["name"]}<span>{len(r["topics"])}</span></a>')
    rows = []
    for t in r['topics']:
        nn = t["deck"].rstrip("/").split("/")[-1]
        urls = {'deck': t['deck'], 'vid': t['video'], 'pod': t['podcast'], 'cet': t['cet'],
                'pdf': t['pdf'], 'doc': t['docx'], 'fb': t['fb']}
        chips = ''.join(chip(urls[k], k, l) for k, l in TYPES)
        search = html.escape(r["name"] + " " + t["title"])
        rows.append(
            f'<li class="topic" id="{r["slug"]}-{nn}" data-s="{search}">'
            f'<div class="tinfo"><span class="tnum">נושא {t["n"]}</span><h3>{html.escape(t["title"])}</h3></div>'
            f'<div class="chips">{chips}</div></li>')
    regs.append(
        f'<section class="region" id="{r["slug"]}"><div class="rcard">'
        f'<div class="rtext"><span class="rk">חבל {i} מתוך {len(data)}</span><h2>{r["name"]}</h2>'
        f'<p>{r["blurb"]}</p><span class="rcount">{len(r["topics"])} נושאים</span></div>'
        f'<div class="rimg" style="background-image:url(\'{IMG[r["slug"]]}\')"></div></div>'
        f'<ol class="topics">{"".join(rows)}</ol></section>')

legend = ''.join(f'<div class="lg c-{k}">{ico(k)}<b>{l}</b></div>' for k, l in TYPES)
tfilter = ''.join(f'<button class="tf" data-t="{k}">{l}</button>' for k, l in TYPES[:6])

CSS = """
:root{--bg:#fff8f3;--card:#fff;--soft:#f4ede6;--ink:#1e1b17;--mute:#5b5850;--line:#e6ddd3;--olive:#3e4d34;--olive-d:#28361f;--olive-s:#e3ead9;--rust:#9e4225}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:Heebo,Arial,sans-serif;line-height:1.55}
a{color:inherit}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px}
header.top{background:#fff;border-bottom:1px solid var(--line)}
header.top .wrap{display:flex;align-items:center;gap:14px;padding-block:12px}
.logo{width:38px;height:38px;border-radius:9px;background:var(--olive);display:grid;place-items:center;color:#fff;font-family:"Frank Ruhl Libre",serif;font-weight:900;font-size:20px;flex:none}
.brand b{display:block;font-family:"Frank Ruhl Libre",serif;font-size:19px;line-height:1.2}
.brand span{font-size:13px;color:var(--mute)}
.search{margin-inline-start:auto;position:relative}
.search input{font:inherit;border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:8px 38px 8px 16px;width:260px}
.search svg{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;stroke:var(--mute);fill:none;stroke-width:2}
.hero .wrap{display:grid;grid-template-columns:1.25fr 1fr;gap:40px;align-items:center;padding-block:48px 36px}
.pill{display:inline-block;background:var(--olive-s);color:var(--olive-d);font-weight:500;font-size:13px;border-radius:999px;padding:4px 12px}
.hero h1{font-family:"Frank Ruhl Libre",serif;font-weight:900;font-size:52px;line-height:1.1;margin:14px 0 8px;color:var(--olive-d)}
.hero .sub{font-family:"Frank Ruhl Libre",serif;color:var(--rust);font-size:20px;margin:0 0 12px}
.hero p.lead{color:var(--mute);font-size:17px;margin:0 0 22px;max-width:56ch}
.btns{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:500;border-radius:10px;padding:11px 18px}
.btn.p{background:var(--olive-d);color:#fff}
.btn.s{background:#fff;border:1px solid var(--line)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:26px}
.stat{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.stat b{display:block;font-family:"Frank Ruhl Libre",serif;font-size:28px;color:var(--olive-d);line-height:1}
.stat span{font-size:13px;color:var(--mute)}
.himg{border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(40,54,31,.15);aspect-ratio:4/3.4;background-size:cover;background-position:center;position:relative}
.himg span{position:absolute;bottom:12px;right:12px;background:rgba(30,27,23,.75);color:#fff;font-size:12px;border-radius:999px;padding:3px 10px}
.bar{position:sticky;top:0;z-index:5;background:rgba(255,248,243,.96);backdrop-filter:blur(6px);border-block:1px solid var(--line)}
.bar .wrap{display:flex;flex-direction:column;gap:8px;padding-block:10px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.row>b{font-size:13px;color:var(--mute);margin-inline-end:4px;flex:none}
.rchip,.tf{font:inherit;font-size:14px;text-decoration:none;border:1px solid var(--line);background:#fff;border-radius:999px;padding:4px 12px;cursor:pointer;display:inline-flex;gap:6px;align-items:center;color:var(--ink)}
.rchip span{background:var(--soft);border-radius:999px;font-size:12px;padding:0 7px}
.rchip:hover,.tf:hover{border-color:var(--olive)}
.tf.on{background:var(--olive-d);color:#fff;border-color:var(--olive-d)}
.legend{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;margin:28px 0}
.legend h2{font-family:"Frank Ruhl Libre",serif;margin:0 0 4px;font-size:22px}
.legend p{margin:0 0 14px;color:var(--mute);font-size:14px}
.lgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
.lg{border-radius:12px;padding:12px 8px;text-align:center;font-size:14px;border:1px solid}
.lg svg{width:26px;height:26px;display:block;margin:0 auto 6px}
.region{margin:36px 0;scroll-margin-top:110px}
.rcard{display:grid;grid-template-columns:1.6fr 1fr;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-bottom:14px}
.rtext{padding:24px 26px}
.rk{display:inline-block;background:var(--rust);color:#fff;font-size:12px;border-radius:999px;padding:2px 10px}
.rtext h2{font-family:"Frank Ruhl Libre",serif;font-size:32px;margin:10px 0 4px;color:var(--olive-d)}
.rtext p{margin:0 0 12px;color:var(--mute)}
.rcount{font-size:13px;background:var(--soft);border-radius:999px;padding:3px 10px}
.xlink{text-decoration:none}.xlink:hover{border-color:var(--olive)}
.rimg{background-size:cover;background-position:center;min-height:180px}
.topics{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.topic{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 18px;display:grid;grid-template-columns:minmax(200px,.8fr) 3fr;gap:14px;align-items:center;scroll-margin-top:120px}
.topic:hover{border-color:#cfc4b5}
.topic:target{border-color:var(--olive);box-shadow:0 0 0 3px var(--olive-s)}
.tnum{display:inline-block;background:var(--olive-d);color:#fff;font-size:12px;border-radius:5px;padding:1px 8px}
.topic h3{margin:6px 0 0;font-size:18px;font-weight:700}
.chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}
.chip{display:inline-flex;align-items:center;gap:5px;font-size:13px;text-decoration:none;border-radius:999px;padding:4px 11px;border:1px solid transparent;white-space:nowrap}
.chip svg,.lg svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.chip svg{width:15px;height:15px}
a.chip:hover{filter:brightness(.95);text-decoration:underline}
.chip.off{opacity:.45}
.c-deck{background:#e6f2e6;color:#2e5b32;border-color:#c9e2c9}
.c-vid{background:#fdf1d8;color:#7a5000;border-color:#f3dfae}
.c-pod{background:#fde6dc;color:#9e4225;border-color:#f6cbb9}
.c-cet{background:#eceae6;color:#3e3a33;border-color:#d9d5ce}
.c-pdf{background:#fbe4e8;color:#9b2c45;border-color:#f3c6d0}
.c-doc{background:#e3ecfb;color:#284f91;border-color:#c5d6f3}
.c-fb{background:#e1f4f1;color:#1f6b5f;border-color:#bfe5de}
.topic.hide,.region.hide{display:none}
.chips.only .chip:not(.pick){display:none}
footer{color:var(--mute);font-size:13px;text-align:center;padding:28px 16px 40px}
@media (max-width:900px){.hero .wrap{grid-template-columns:1fr;padding-block:32px 24px}.himg{display:none}.lgrid{grid-template-columns:repeat(4,1fr)}.topic{grid-template-columns:1fr}.chips{justify-content:flex-start}}
@media (max-width:600px){.hero h1{font-size:38px}.stats{grid-template-columns:repeat(2,1fr)}.search{display:none}.rcard{grid-template-columns:1fr}.rimg{order:-1;min-height:140px}.lgrid{grid-template-columns:repeat(2,1fr)}.wrap{padding:0 16px}.bar .row{flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px}.rchip,.tf{flex:none}}
"""

JS = """
const q=document.getElementById('q');
function apply(){const v=(q.value||'').trim();document.querySelectorAll('.region').forEach(r=>{if(!r.querySelector('.topic'))return;let any=false;r.querySelectorAll('.topic').forEach(t=>{const ok=!v||t.dataset.s.includes(v);t.classList.toggle('hide',!ok);any=any||ok});r.classList.toggle('hide',!any)})}
if(q)q.addEventListener('input',apply);
document.querySelectorAll('.tf').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tf').forEach(x=>x.classList.remove('on'));b.classList.add('on');const t=b.dataset.t;document.querySelectorAll('.chips').forEach(c=>{c.classList.toggle('only',t!=='all');c.querySelectorAll('.chip').forEach(ch=>ch.classList.toggle('pick',ch.dataset.t===t))})}));
"""

page = f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>חומרי הבגרות בתיירות · שאלון 880387</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@400;500;700&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
<header class="top"><div class="wrap">
  <div class="logo">ת</div>
  <div class="brand"><b>חומרי הבגרות בתיירות</b><span>מגמת תיירות · ישיבת אלוני הבשן</span></div>
  <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" type="search" placeholder="חיפוש נושא או חבל"></label>
</div></header>
<section class="hero"><div class="wrap">
  <div>
    <span class="pill">שאלון 880387 · חבלי ארץ</span>
    <h1>חומרי הבגרות בתיירות</h1>
    <p class="sub">מרחב למידה והוראה למורים ולתלמידים</p>
    <p class="lead">כל חבלי הארץ במקום אחד: מצגות עם שאלות בגרות, סרטוני פתיחה, פודקאסטים לחזרה, יחידות לתרגול במט״ח ודפי עבודה מוכנים להדפסה.</p>
    <div class="btns"><a class="btn p" href="#jerusalem">לחבלי הארץ</a><a class="btn s" href="marketing/">לפרק מאפיינים ושיווק</a><a class="btn s" href="{FORM}" target="_blank" rel="noopener">משוב מורים</a></div>
    <div class="stats">
      <div class="stat"><b>{len(data)}</b><span>חבלי ארץ</span></div>
      <div class="stat"><b>{n_topics}</b><span>נושאים</span></div>
      <div class="stat"><b>{n_media}</b><span>סרטוני פתיחה</span></div>
      <div class="stat"><b>{n_pod}</b><span>פודקאסטים</span></div>
    </div>
  </div>
  <div class="himg" style="background-image:url('{IMG['jerusalem']}')"><span>חומות העיר העתיקה, ירושלים</span></div>
</div></section>
<div class="bar"><div class="wrap">
  <div class="row"><b>חבלים:</b>{"".join(navr)}<a class="rchip" href="marketing/">מאפיינים ושיווק ←</a></div>
  <div class="row"><b>הצגת:</b><button class="tf on" data-t="all">הכל</button>{tfilter}</div>
</div></div>
<main class="wrap">
  <section class="legend"><h2>שבעה סוגי חומר לכל נושא</h2><p>לוחצים על הכפתור הצבעוני ליד הנושא, והחומר נפתח בכרטיסייה חדשה.</p><div class="lgrid">{legend}</div></section>
  {"".join(regs)}
  <section class="region" id="marketing"><a class="rcard xlink" href="marketing/"><div class="rtext"><span class="rk">פרק נוסף</span><h2>מאפיינים ושיווק</h2><p>גורמים המשפיעים, סוגי תיירות, שירותי תיירות, המוצר, השיווק ופרק המושגים. 11 נושאים בדף נפרד.</p><span class="rcount">למעבר לדף הפרק ←</span></div><div class="rimg" style="background-image:url('marketing/04/img/hero.jpg')"></div></a></section>
</main>
<footer>החומרים נבנו במגמת התיירות, ישיבת אלוני הבשן. מקורות התמונות מצוינים בכל שקף. כפתור חיוור = החומר עוד לא מוכן.</footer>
<script>{JS}</script>
</body>
</html>"""

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'index.html')
open(out, 'w', encoding='utf-8').write(page)
print(len(data), 'regions', n_topics, 'topics', n_media, 'media', n_cet, 'cet', out)


# ================= marketing chapter catalog: tayarut/marketing/index.html =================
MT = json.load(open('/home/claude/work/mtitles.json', encoding='utf-8'))
CET_M = {'01': '27915cdf-5b94-4697-a763-8e4b8f492d94', '02': '1ab79647-649a-41d0-82bc-231c238b94b8', '03': '56d5bcf9-3455-43ca-9280-bfad47461119', '04': '3b158ea9-d750-483e-b08f-a540cff697dc', '05': 'b10b4e22-91f8-4f7d-b044-6a00a535d240', '06': 'acdcd932-7c84-45d9-85cc-43c7e1392956', '07': 'f2de8ef0-f931-456b-8f18-3227c5fedad2', '08': '1a78b0e5-eb11-4280-993f-da0da6ff5320'}  # 'NN' -> CET document id, filled when the units are built
MGROUPS = [
    ('trait', 'מאפייני התיירות', 'מה משפיע על התיירות לישראל, סוגי התיירות ושירותי התיירות', ['01', '02', '03', '04', '05'], '04/img/hero.jpg'),
    ('mkt', 'שיווק התיירות', 'המוצר, התמהיל, השיווק והפילוח, והתקשורת השיווקית', ['06', '07', '08', '09', '10'], '07/img/hero.jpg'),
    ('terms', 'מושגים לבגרות', 'כל מושגי 2026 ומושגים שנשאלו בעבר, עם קישור לשקף שבו לומדים כל מושג', ['11'], '11/img/hero.jpg'),
]
MROOT = os.path.join(ROOT, 'marketing'); MBASE = BASE + '/marketing'
mregs, mnav, mt_count, mv, mp = [], [], 0, 0, 0
for gi, (gslug, gname, gblurb, nums, gimg) in enumerate(MGROUPS, 1):
    rows = []
    for t in nums:
        p = os.path.join(MROOT, t)
        if not os.path.isfile(os.path.join(p, 'index.html')):
            continue
        mt_count += 1
        v = f'{MBASE}/{t}/video.html' if ready(os.path.join(p, 'video.html')) else None
        pc = f'{MBASE}/{t}/podcast.html' if ready(os.path.join(p, 'podcast.html')) else None
        mv += bool(v); mp += bool(pc)
        urls = {'deck': f'{MBASE}/{t}/', 'vid': v, 'pod': pc,
                'cet': f'https://lo.cet.ac.il/player/?document={CET_M[t]}&language=he' if t in CET_M else None,
                'pdf': f'{MBASE}/{t}/worksheet.pdf' if os.path.exists(os.path.join(p, 'worksheet.pdf')) else None,
                'doc': f'{MBASE}/{t}/worksheet.docx' if os.path.exists(os.path.join(p, 'worksheet.docx')) else None,
                'fb': FB.get(f'marketing-{t}')}
        chips = ''.join(chip(urls[k], k, l) for k, l in TYPES)
        rows.append(f'<li class="topic" id="marketing-{t}" data-s="{html.escape(gname + " " + MT[t])}">'
                    f'<div class="tinfo"><span class="tnum">נושא {int(t)}</span><h3>{html.escape(MT[t])}</h3></div>'
                    f'<div class="chips">{chips}</div></li>')
    mnav.append(f'<a class="rchip" href="#{gslug}">{gname}<span>{len(rows)}</span></a>')
    mregs.append(f'<section class="region" id="{gslug}"><div class="rcard">'
                 f'<div class="rtext"><span class="rk">חלק {gi} מתוך {len(MGROUPS)}</span><h2>{gname}</h2>'
                 f'<p>{gblurb}</p><span class="rcount">{len(rows)} נושאים</span></div>'
                 f'<div class="rimg" style="background-image:url(\'{gimg}\')"></div></div>'
                 f'<ol class="topics">{"".join(rows)}</ol></section>')
mpage = page
mpage = mpage.replace('<title>חומרי הבגרות בתיירות · שאלון 880387</title>', '<title>מאפיינים ושיווק · חומרי הבגרות בתיירות</title>')
a = mpage.index('<section class="hero">'); b = mpage.index('<main class="wrap">')
mhero = f"""<section class="hero"><div class="wrap">
  <div>
    <span class="pill">שאלון 880387 · מאפיינים ושיווק</span>
    <h1>מאפיינים ושיווק</h1>
    <p class="sub">הפרק השני של הבחינה, ופרק המושגים</p>
    <p class="lead">גורמים המשפיעים על התיירות, סוגי תיירות, שירותי תיירות, המוצר התיירותי והשיווק. בכל נושא: מצגת עם שאלות בגרות, דף עבודה, תרגול במט״ח, סרטון ופודקאסט.</p>
    <div class="btns"><a class="btn p" href="#trait">לנושאים</a><a class="btn s" href="../">לחבלי הארץ</a><a class="btn s" href="{FORM}" target="_blank" rel="noopener">משוב מורים</a></div>
    <div class="stats">
      <div class="stat"><b>{mt_count}</b><span>נושאים</span></div>
      <div class="stat"><b>84</b><span>מושגים ברשימת 2026</span></div>
      <div class="stat"><b>{mv}</b><span>סרטוני פתיחה</span></div>
      <div class="stat"><b>{mp}</b><span>פודקאסטים</span></div>
    </div>
  </div>
  <div class="himg" style="background-image:url('05/img/hero.jpg')"><span>מרינה אשקלון · מערכת השידורים הלאומית</span></div>
</div></section>
<div class="bar"><div class="wrap">
  <div class="row"><b>חלקים:</b>{"".join(mnav)}<a class="rchip" href="../">← חבלי הארץ</a></div>
  <div class="row"><b>הצגת:</b><button class="tf on" data-t="all">הכל</button>{tfilter}</div>
</div></div>
"""
mpage = mpage[:a] + mhero + mpage[b:]
a = mpage.index('<main class="wrap">'); b = mpage.index('</main>')
mpage = mpage[:a] + f'<main class="wrap">\n  <section class="legend"><h2>שבעה סוגי חומר לכל נושא</h2><p>לוחצים על הכפתור הצבעוני ליד הנושא, והחומר נפתח בכרטיסייה חדשה.</p><div class="lgrid">{legend}</div></section>\n  {"".join(mregs)}\n' + mpage[b:]
mpage = mpage.replace('placeholder="חיפוש נושא או חבל"', 'placeholder="חיפוש נושא"')
if len(sys.argv) <= 1:
    open(os.path.join(MROOT, 'index.html'), 'w', encoding='utf-8').write(mpage)
    print('marketing catalog', mt_count, 'topics', mv, 'media')
