import re,sys
d,num,title=sys.argv[1],sys.argv[2],sys.argv[3]
region=sys.argv[4] if len(sys.argv)>4 else 'ירושלים'
brand=sys.argv[5] if len(sys.argv)>5 else 'ירושלים והסביבה'
t=open('/home/claude/work/deck/template.html').read()
t=t.replace('<title>ירושלים · פתיחה</title>',f'<title>{region} · {title}</title>').replace('</style>',open('/home/claude/work/deck2/extra2.css').read()+'</style>',1).replace('<b>ירושלים והסביבה</b>',f'<b>{brand}</b>').replace('<span>נושא 1 · פתיחה</span>',f'<span>נושא {num} · {title}</span>')
a=t.index('<div class="prog"'); a=t.index('</div>',a)+6
b=t.index('<nav class="nav"'); b=t.rindex('</div>',0,b)
body=open(d+'/body.part').read(); n=body.count('<section'); t=t[:a]+'\n'+body+'\n'+t[b:]
t=re.sub(r'1 / \d+',f'1 / {n}',t)
SK='<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
open(d+'/index.html','w').write(SK+t+'</body></html>')
# missing images check
for src in set(re.findall(r'src="(img/[^"]+)"',body)):
    import os
    if not os.path.exists(d+'/'+src): print('MISSING',src)
print(n,'slides')
