import json,re
exec(open('gen11.py').read().split("REG={")[0])
from defs import D,OFFD,EN
G=[('רקע וחשיבות התיירות',1,12),('גורמים המשפיעים על התיירות',13,22),('ייחודה של ישראל',23,35),
 ('עקרונות הגישה השיווקית',36,47),('תועלות ומצבי ביקוש',48,59),('שיווק מטרה',60,72),('אסטרטגיית המוצר',73,84)]
def ref(n): return OV[n] if n in OV else ch[n][0]+'#'+ch[n][1]
REG={'jerusalem':'ירושלים','coastal':'מישור החוף','negev':'הנגב','golan':'הגולן','galilee':'הגליל','valleys':'העמקים','deadsea':'ים המלח','marketing':'שיווק'}
def lab(r): d=r.split('#')[0]; a,b=d.split('/'); return f'{REG[a]} {int(b)}'
items=[]
for gi,(g,a,b) in enumerate(G):
    for n in range(a,b+1):
        t=re.sub(r'\s*\((Peak|Off|Package)[^)]*\)','',L[n]).strip()
        d,e=D[n]; r=ref(n)
        items.append(dict(id=n,t=t,en=EN.get(n,''),d=d,e=e,g=gi,y=Y.get(n,[]),l=r,ll=lab(r),list=True))
for i,(t,(d,e,r,y)) in enumerate(OFFD.items()):
    items.append(dict(id=100+i,t=t,en='',d=d,e=e,g=7,y=y,l=r,ll=lab(r),list=False))
data=dict(version=1,groups=[g[0] for g in G]+['נשאלו בעבר · לא במיקוד 2026'],items=items)
json.dump(data,open('/home/claude/nisan1234-afk.github.io/tayarut/concepts/concepts.json','w'),ensure_ascii=False,indent=0)
print(len(items))
