import sys,re
from playwright.sync_api import sync_playwright
S='/home/claude/nisan1234-afk.github.io/tayarut'
FS='/home/claude/work/pdf/node_modules/@fontsource'
css=[]
for fam,d,ws in [('Heebo','heebo',[300,400,500,700]),('Frank Ruhl Libre','frank-ruhl-libre',[400,500,700,900])]:
  for w in ws:
    for sub in ['hebrew','latin']:
      css.append(f"@font-face{{font-family:'{fam}';font-weight:{w};src:url('file://{FS}/{d}/files/{d}-{sub}-{w}-normal.woff2')}}")
CSS='\n'.join(css)
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':720})
  pg.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'),lambda r:r.fulfill(status=200,content_type='text/css',body=CSS))
  for a in sys.argv[1:]:
    deck,sid=a.split('#')
    pg.goto(f'file://{S}/{deck}/index.html#{sid}'); pg.wait_for_timeout(700)
    ov=pg.evaluate("(id)=>{const s=document.getElementById(id);const pad=s.querySelector('.pad')||s;return [s.scrollHeight,s.clientHeight,pad.scrollHeight]}",sid)
    out=a.replace('/','_').replace('#','_')+'.png'; pg.screenshot(path=out); print(a,ov,out)
  b.close()
