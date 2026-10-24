#!/usr/bin/env python3
"""Student worksheet (Word) for one topic: python3 make_docx.py jerusalem 01
Black-and-white: the teacher teaches from the deck, the student fills in.
Diagrams and maps from the deck (inline SVG, map/cross-section images) are included in greyscale."""
import sys, re, copy
from bs4 import BeautifulSoup
from docx import Document
from docx.shared import Pt, Mm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

region, nn = sys.argv[1], sys.argv[2]
SITE = '/home/claude/nisan1234-afk.github.io/tayarut'
DECK = f'{SITE}/{region}/{nn}'
REGION_HE = {'jerusalem': 'חבל ירושלים', 'deadsea': 'ים המלח ומדבר יהודה', 'coastal': 'מישור החוף',
             'galilee': 'הגליל', 'golan': 'רמת הגולן', 'negev': 'הנגב, הערבה ואילת', 'valleys': 'חבל העמקים', 'marketing': 'מאפיינים ושיווק'}
FONT = 'Arial'
GREY = RGBColor(0x55, 0x55, 0x55)

soup = BeautifulSoup(open(f'{DECK}/index.html', encoding='utf8').read(), 'html.parser')
for d in soup.select('details, figcaption, .credit, img, svg, .tag, .tag-ext, .src, nav'):
    d.decompose()

def T(el):
    return re.sub(r'\s+', ' ', el.get_text(' ')).strip() if el else ''

# ---------- docx helpers (RTL everywhere) ----------
doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Mm(210), Mm(297)
sec.left_margin = sec.right_margin = Mm(18)
sec.top_margin, sec.bottom_margin = Mm(16), Mm(16)
sec._sectPr.append(OxmlElement('w:bidi'))
st = doc.styles['Normal']
st.font.name = FONT; st.font.size = Pt(11.5)
st.element.rPr.rFonts.set(qn('w:cs'), FONT)
st.element.rPr.rFonts.set(qn('w:eastAsia'), FONT)
szcs = OxmlElement('w:szCs'); szcs.set(qn('w:val'), '23'); st.element.rPr.append(szcs)

def rtl_p(p, align=WD_ALIGN_PARAGRAPH.RIGHT):
    p._p.get_or_add_pPr().append(OxmlElement('w:bidi'))
    # In a bidi paragraph Word reads jc=right as the END side (= visual left).
    # The default (no jc) is the START side, which is the right edge in RTL.
    if align != WD_ALIGN_PARAGRAPH.RIGHT:
        p.alignment = align
    return p

def run(p, text, bold=False, size=None, color=None, italic=False):
    r = p.add_run(text)
    rPr = r._r.get_or_add_rPr()
    rPr.append(OxmlElement('w:rtl'))
    f = OxmlElement('w:rFonts')
    for a in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
        f.set(qn(a), FONT)
    rPr.insert(0, f)
    r.bold = bold; r.italic = italic
    if bold:
        rPr.append(OxmlElement('w:bCs'))
    if size:
        r.font.size = Pt(size)
        s = OxmlElement('w:szCs'); s.set(qn('w:val'), str(int(size * 2))); rPr.append(s)
    if color:
        r.font.color.rgb = color
    return r

def para(text='', bold=False, size=None, color=None, before=0, after=4, align=WD_ALIGN_PARAGRAPH.RIGHT, keep=False):
    p = rtl_p(doc.add_paragraph(), align)
    if text:
        run(p, text, bold, size, color)
    pf = p.paragraph_format
    pf.space_before, pf.space_after = Pt(before), Pt(after)
    if keep:
        pf.keep_with_next = True
    return p

def bottom_border(p):
    pPr = p._p.get_or_add_pPr()
    b = OxmlElement('w:pBdr'); e = OxmlElement('w:bottom')
    for k, v in (('w:val', 'single'), ('w:sz', '4'), ('w:space', '1'), ('w:color', '999999')):
        e.set(qn(k), v)
    b.append(e); pPr.append(b)

def fix_w(t, widths):
    t.autofit = False
    lay = OxmlElement('w:tblLayout'); lay.set(qn('w:type'), 'fixed'); t._tbl.tblPr.append(lay)
    for i, w in enumerate(widths):
        t.columns[i].width = Mm(w)
        for c in t.columns[i].cells:
            c.width = Mm(w)

def _borders(t, spec):
    tblPr = t._tbl.tblPr
    b = OxmlElement('w:tblBorders')
    for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        e = OxmlElement(f'w:{side}')
        v = spec.get(side, 'nil')
        e.set(qn('w:val'), v)
        if v != 'nil':
            e.set(qn('w:sz'), '4'); e.set(qn('w:color'), '999999')
        b.append(e)
    tblPr.append(b)

def lines(n, after=True):
    t = doc.add_table(rows=n, cols=1)
    t._tbl.tblPr.append(OxmlElement('w:bidiVisual'))
    _borders(t, {'insideH': 'single', 'bottom': 'single'})
    fix_w(t, [174])
    for k, r in enumerate(t.rows):
        r.height = Mm(9)
        p = rtl_p(r.cells[0].paragraphs[0])
        if k < n - 1:
            p.paragraph_format.keep_with_next = True
    if after:
        para('', after=2)

def label_lines(labels, w0=40):
    t = doc.add_table(rows=len(labels), cols=2)
    t._tbl.tblPr.append(OxmlElement('w:bidiVisual'))
    _borders(t, {'insideH': 'single', 'bottom': 'single'})
    fix_w(t, [w0, 174 - w0])
    for r, l in zip(t.rows, labels):
        r.height = Mm(10)
        cell_text(r.cells[0], l + ':', bold=True)
        rtl_p(r.cells[1].paragraphs[0])
    para('', after=4)

def cell_text(c, text, bold=False, size=None, color=None):
    p = c.paragraphs[0]
    rtl_p(p)
    if text:
        run(p, text, bold, size, color)

def table(rows, widths, header=True, min_h=None):
    t = doc.add_table(rows=len(rows), cols=len(widths))
    t.style = 'Table Grid'
    tblPr = t._tbl.tblPr
    tblPr.append(OxmlElement('w:bidiVisual'))
    for i, r in enumerate(rows):
        tr = t.rows[i]
        if min_h and not (header and i == 0):
            tr.height = Mm(min_h)
        trPr = tr._tr.get_or_add_trPr(); cs = OxmlElement('w:cantSplit'); trPr.append(cs)
        for j, v in enumerate(r):
            c = tr.cells[j]; c.width = Mm(widths[j])
            bold = bool((header and i == 0) or (j == 0 and v))
            cell_text(c, v, bold=bold, size=10.5)
            if header and i == 0:
                if j == 0:
                    th = OxmlElement('w:tblHeader'); trPr.append(th)
                sh = OxmlElement('w:shd'); sh.set(qn('w:val'), 'clear'); sh.set(qn('w:fill'), 'E6E6E6')
                c._tc.get_or_add_tcPr().append(sh)
    fix_w(t, widths)
    para('', after=4)
    return t

def heading(text, kick='', n=None):
    p = para('', before=10, after=2, keep=True)
    if n is not None:
        run(p, f'שקף {n}  ', size=9, color=GREY)
    if kick:
        run(p, kick + '  ', size=9, color=GREY)
    p2 = para('', after=4, keep=True)
    run(p2, text, bold=True, size=14)

# ---------- diagrams from the deck ----------
FIGS = {}
def collect_figs():
    from playwright.sync_api import sync_playwright
    from PIL import Image, ImageOps
    import os
    out = f'/home/claude/work/pdf/out/{region}{nn}/figs'
    os.makedirs(out, exist_ok=True)
    pat = re.compile(r'(map|cross|diagram|chart|scheme|timeline)', re.I)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
        pg.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'), lambda r: r.fulfill(status=200, content_type='text/css', body=''))
        pg.goto(f'file://{DECK}/index.html'); pg.wait_for_timeout(600)
        pg.add_style_tag(content='.nav,.progress,#progress,.hint,.credit{display:none!important} section.slide{height:auto!important;min-height:720px!important}')
        ids = pg.evaluate("[...document.querySelectorAll('section.slide')].map(s=>s.id)")
        for sid in ids:
            pg.evaluate("(id)=>document.querySelectorAll('section.slide').forEach(x=>{x.hidden=x.id!==id;x.classList.toggle('active',x.id===id)})", sid)
            pg.wait_for_timeout(150)
            # outermost diagram boxes: inline svg (or its wrapper) and images whose file name says map/cross/diagram
            n = pg.evaluate("""(id)=>{const s=document.getElementById(id); const pat=/(map|cross|diagram|chart|scheme|timeline)/i; let k=0;
                const els=[...s.querySelectorAll('svg')].filter(v=>!v.parentElement.closest('svg')&&v.getBoundingClientRect().width>220)
                  .map(v=>v.closest('.mapwrap,.bars,figure')||v)
                  .concat([...s.querySelectorAll('.bars')])
                  .concat([...s.querySelectorAll('img:not(.bg)')].filter(i=>/(מפת|מפה|חתך|שרטוט|תרשים)/.test(i.getAttribute('alt')||'')&&!/מאוירת/.test(i.getAttribute('alt')||'')));
                const uniq=[...new Set(els)]; uniq.forEach(e=>e.setAttribute('data-fig',k++)); return k;}""", sid)
            for k in range(n):
                f = f'{out}/{sid}-{k}.png'
                pg.locator(f'section#{sid} [data-fig="{k}"]').screenshot(path=f)
                im = ImageOps.autocontrast(Image.open(f).convert('L'), cutoff=1)
                im.save(f)
                FIGS.setdefault(sid, []).append(f)
        b.close()

def figure(path):
    from PIL import Image
    w, h = Image.open(path).size
    width = 120
    if h / w * width > 110:
        width = 110 * w / h
    p = para('', after=2, align=WD_ALIGN_PARAGRAPH.CENTER, keep=True)
    p.add_run().add_picture(path, width=Mm(width))

collect_figs()

# ---------- cover ----------
title = T(soup.find('h1')) or T(soup.title)
para(f'מגמת תיירות · שאלון 880387 · {REGION_HE.get(region, region)}', size=10, color=GREY, before=0)
para(title, bold=True, size=26, after=2)
para(f'דף עבודה לתלמיד · נושא {int(nn)}', size=14, after=10)
para('שם: ______________________   כיתה: ________   תאריך: ____________', after=10)
p = para('', after=2)
run(p, 'איך עובדים עם הדף: ', bold=True)
run(p, 'המורה מציג את המצגת, ואתם ממלאים כאן את מה שחשוב בכל שקף. בסוף הדף יש שאלות תרגול ובגרות.')
# where it lives on the site + QR code to the topic page
import qrcode, os
URL = f'https://nisan1234-afk.github.io/tayarut/marketing/#marketing-{nn}' if region == 'marketing' else f'https://nisan1234-afk.github.io/tayarut/#{region}-{nn}'
qr_path = f'/home/claude/work/pdf/out/{region}{nn}/qr.png'
os.makedirs(os.path.dirname(qr_path), exist_ok=True)
qrcode.make(URL, box_size=10, border=1).save(qr_path)
t = doc.add_table(rows=1, cols=1)
t._tbl.tblPr.append(OxmlElement('w:bidiVisual'))
_borders(t, {'top': 'single', 'bottom': 'single'})
fix_w(t, [174])
c = t.rows[0].cells[0]
cell_text(c, 'החומר של הנושא באתר המגמה', bold=True, size=11)
for line in [(f'באתר המגמה, בפרק {REGION_HE[region]}, נושא {int(nn)}: {title}.' if region == 'marketing' else f'באתר המגמה, בחבל {REGION_HE.get(region, region)}, נושא {int(nn)}: {title}.'),
             'בשורה של הנושא יש קישורים למצגת, לסרטון הפתיחה, לפודקאסט החזרה ולדף העבודה הזה.',
             'סרקו את הברקוד בטלפון, או הקלידו את הכתובת:']:
    pp = rtl_p(c.add_paragraph()); run(pp, line, size=10)
pp = rtl_p(c.add_paragraph()); run(pp, '\u202a' + URL.replace('https://', '') + '\u202c', size=10, color=GREY)
qp = rtl_p(c.add_paragraph(), WD_ALIGN_PARAGRAPH.CENTER)
qp.add_run().add_picture(qr_path, width=Mm(30))
para('', after=8)

# ---------- part A: guided notes ----------
CONCEPTS = region == 'marketing' and nn == '11'
if CONCEPTS:
    para('חלק א · מחברת מושגים', bold=True, size=16, before=6, after=2)
    para('לכל מושג: הסבר במילים שלכם ודוגמה מישראל. מתחת לשם המושג: השנים שבהן נשאל בבגרות.', color=GREY, after=4)
    raw = BeautifulSoup(open(f'{DECK}/index.html', encoding='utf8').read(), 'html.parser')
    for sl in raw.select('section.slide'):
        tabs = sl.select('.ctab table')
        h = sl.find('h2')
        if not tabs or 'הכי הרבה' in T(h):
            continue
        heading(T(h), T(sl.select_one('.kick')))
        rows = [['מושג', 'הסבר במילים שלי', 'דוגמה']]
        for tb in tabs:
            for tr in tb.select('tr')[1:]:
                tds = tr.find_all('td')
                num = T(tds[0]) if len(tds) == 4 else ''
                name = T(tr.select_one('td.d'))
                yr = T(tds[2] if len(tds) == 4 else tds[1])
                lab = (num + '. ' if num else '') + name + (f'\nנשאל: {yr}' if yr and yr != '—' else '')
                rows.append([lab, '', ''])
        table(rows, [46, 80, 48], min_h=14)
para('חלק א · סיכום מודרך', bold=True, size=16, before=6, after=4) if not CONCEPTS else None
slides = [] if CONCEPTS else soup.select('section.slide')
qslides = []
for i, s in enumerate(slides, 1):
    if s.select_one('.q'):
        qslides.append(s); continue
    h = s.find(['h2', 'h1'])
    kick = T(s.select_one('.kick'))
    name = T(h) if h else T(s.find('h3'))
    if i == 1:
        continue  # opening slide
    if i == len(slides) or kick == 'סיכום':
        heading('סיכום: שלושה דברים חשובים שלמדתי בנושא', n=i)
        label_lines(['1', '2', '3'], 10)
        continue
    done = False
    heading(name, kick, i)
    for img in FIGS.get(s.get('id'), []):
        figure(img)
    # facts (number cards): label | blank
    facts = s.select('.fact')
    if facts:
        table([['נתון', 'מה המספר?']] + [[T(f.select_one('.l')), ''] for f in facts], [120, 54], min_h=8)
        done = True
    # real tables: header + first column, the rest blank
    for tb in s.find_all('table'):
        rows = []
        for tr in tb.find_all('tr'):
            cells = [T(c) for c in tr.find_all(['th', 'td'])]
            if not cells:
                continue
            if tr.find('th') and not rows:
                rows.append(cells)
            else:
                rows.append([cells[0]] + [''] * (len(cells) - 1))
        ncol = max(len(r) for r in rows)
        rows = [r + [''] * (ncol - len(r)) for r in rows]
        w0 = 40 if ncol > 2 else 55
        widths = [w0] + [(174 - w0) / (ncol - 1)] * (ncol - 1)
        table(rows, widths, min_h=12)
        done = True
    # concept cards
    cards = [c for c in s.select('.card') if c.select_one('.t')]
    if cards:
        rows = [['מושג', 'הגדרה במילים שלי', 'דוגמה']]
        for c in cards:
            t = T(c.select_one('.t')); en = T(c.select_one('.en'))
            rows.append([t + (f'\n{en}' if en else ''), '', ''])
        for c in cards:
            c.decompose()
    if cards:
        pass
    if not done:
        # labelled items: h3 / b / leading <strong> in li
        labels = [T(x) for x in s.select('h3')] or [T(x) for x in s.select('.factor b, .box b, .grid b')]
        if not labels:
            labels = [T(x) for x in s.find_all('b') if len(T(x)) < 40]
        lis = s.find_all('li')
        lead = [T(li.find('strong')).rstrip(':') for li in lis if li.find('strong')]
        if labels:
            table([['', 'מה חשוב לזכור']] + [[l, ''] for l in labels], [48, 126], min_h=11)
        elif lead:
            label_lines(lead)
        elif lis and len(lis) >= 3:
            para('רשמו את הנקודות העיקריות:', color=GREY, after=0, keep=True)
            label_lines([str(k + 1) for k in range(len(lis))], 10)
        else:
            if not cards:
                para('רשמו את הרעיון המרכזי של השקף:', color=GREY, after=0, keep=True)
                lines(3)
    if cards:
        table(rows, [38, 86, 50], min_h=18)

# ---------- part B: questions ----------
p = para('חלק ב · שאלות', bold=True, size=16, before=0, after=4)
p.paragraph_format.page_break_before = True
soup2 = BeautifulSoup(open(f'{DECK}/index.html', encoding='utf8').read(), 'html.parser')
for s in soup2.select('section.slide'):
    if not s.select_one('.q'):
        continue
    para(T(s.find('h2')), bold=True, size=12.5, before=8, after=4, keep=True)
    for q in s.select('.q'):
        n = T(q.select_one('.qn')); qt = q.select_one('.qt')
        tags = [T(t) for t in qt.select('.tag')]
        real = bool(qt.select('.tag.real'))
        subs = [T(x) for x in qt.select('.sub')]
        for t in qt.select('.tag, .sub'):
            t.decompose()
        txt = T(qt)
        p = para('', after=2, keep=True)
        run(p, f'{n}.  ', bold=True)
        run(p, txt, bold=True)
        if tags:
            run(p, '  (' + ' · '.join(tags) + ')', size=9, color=GREY)
        for x in subs:
            para('    ' + x, after=0, keep=True)
        k = 4 if (real or any('בגרות' in t for t in tags)) else 3
        if re.search(r'הסבירו|תארו|נמקו', txt):
            k += 2
        lines(k)
    note = T(s.select_one('.src'))
    if note:
        para(note, size=9.5, color=GREY)

# footer page numbers
fp = rtl_p(sec.footer.paragraphs[0], WD_ALIGN_PARAGRAPH.CENTER)
r = fp.add_run()
for kind, txt in (('begin', None), (None, 'PAGE'), ('end', None)):
    if kind:
        e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'), kind); r._r.append(e)
    else:
        e = OxmlElement('w:instrText'); e.set(qn('xml:space'), 'preserve'); e.text = txt; r._r.append(e)

out = f'{DECK}/worksheet.docx'
ORDER = {
 'rPr': ['rStyle','rFonts','b','bCs','i','iCs','caps','smallCaps','strike','dstrike','outline','shadow','emboss','imprint','noProof','snapToGrid','vanish','webHidden','color','spacing','w','kern','position','sz','szCs','highlight','u','effect','bdr','shd','fitText','vertAlign','rtl','cs','em','lang','eastAsianLayout','specVanish','oMath'],
 'pPr': ['pStyle','keepNext','keepLines','pageBreakBefore','framePr','widowControl','numPr','suppressLineNumbers','pBdr','shd','tabs','suppressAutoHyphens','kinsoku','wordWrap','overflowPunct','topLinePunct','autoSpaceDE','autoSpaceDN','bidi','adjustRightInd','snapToGrid','spacing','ind','contextualSpacing','mirrorIndents','suppressOverlap','jc','textDirection','textAlignment','textboxTightWrap','outlineLvl','divId','cnfStyle','rPr','sectPr','pPrChange'],
 'tblPr': ['tblStyle','tblpPr','tblOverlap','bidiVisual','tblStyleRowBandSize','tblStyleColBandSize','tblW','jc','tblCellSpacing','tblInd','tblBorders','shd','tblLayout','tblCellMar','tblLook'],
 'trPr': ['cnfStyle','divId','gridBefore','gridAfter','wBefore','wAfter','cantSplit','trHeight','tblHeader','tblCellSpacing','jc','hidden'],
 'tcPr': ['cnfStyle','tcW','gridSpan','hMerge','vMerge','tcBorders','shd','noWrap','tcMar','textDirection','tcFitText','vAlign','hideMark'],
}
def fix_order(root):
    W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
    for tag, order in ORDER.items():
        for el in root.iter(W + tag):
            kids = list(el)
            seen = {}
            for c in kids:  # drop duplicate flags (e.g. two w:bidi)
                key = c.tag
                if key in seen and len(c) == 0 and not c.attrib:
                    el.remove(c); continue
                seen[key] = 1
            kids = list(el)
            def rank(c):
                n = c.tag.replace(W, '')
                return order.index(n) if n in order else len(order)
            kids.sort(key=rank)
            for c in kids:
                el.remove(c)
            for c in kids:
                el.append(c)
fix_order(doc.element.body)
fix_order(sec.footer._element)
fix_order(doc.styles.element)
doc.save(out)
print(out)
