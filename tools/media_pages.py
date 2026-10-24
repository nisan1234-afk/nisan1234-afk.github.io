import sys,os,html
base='/home/claude/nisan1234-afk.github.io/tayarut'
def title_of(region,n):
    import re
    t=open(f'{base}/{region}/{n}/index.html',encoding='utf-8').read()
    m=re.search(r'<title>([^<]+)</title>',t); return m.group(1).split('·')[0].strip() if m else region
HEAD='''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>{title}</title>
<style>
  html,body{{margin:0;background:#f6f2e8;font-family:Heebo,Arial,sans-serif;color:#1c2226}}
{css}
</style>
</head>
<body>
{body}
</body>
</html>
'''
def video(region,n,topic,drive_id,minutes):
    css='''  .wrap{max-width:960px;margin:0 auto;padding:12px}
  .frame{position:relative;width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#000}
  .frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
  p{font-size:14px;color:#5a6066;margin:8px 2px 0}'''
    body=f'''<div class="wrap">
  <div class="frame"><iframe src="https://drive.google.com/file/d/{drive_id}/preview" allow="autoplay; fullscreen" allowfullscreen title="סרטון פתיחה"></iframe></div>
  <p>סרטון פתיחה לנושא, כ־{minutes} דקות. נוצר ב־NotebookLM מתוך המצגת של היחידה.</p>
</div>'''
    open(f'{base}/{region}/{n}/video.html','w',encoding='utf-8').write(HEAD.format(title=f'{topic} · סרטון פתיחה',css=css,body=body))
def podcast(region,n,topic,h1,desc):
    css='''  .card{max-width:760px;margin:0 auto;padding:18px 20px;background:#fffdf8;border:1px solid #e3dccb;border-radius:14px}
  h1{font-size:20px;margin:0 0 4px}
  p{font-size:15px;color:#5a6066;margin:0 0 12px;line-height:1.6}
  audio{width:100%}'''
    body=f'''<div class="card">
  <h1>פודקאסט חזרה: {html.escape(h1)}</h1>
  <p>{html.escape(desc)}</p>
  <audio controls preload="metadata" src="podcast.mp3"></audio>
</div>'''
    open(f'{base}/{region}/{n}/podcast.html','w',encoding='utf-8').write(HEAD.format(title=f'{topic} · פודקאסט חזרה',css=css,body=body))
if __name__=='__main__':
    kind=sys.argv[1]
    if kind=='video': video(*sys.argv[2:7])
    else: podcast(*sys.argv[2:7])
