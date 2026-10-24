import json,re,glob
root='/home/claude/nisan1234-afk.github.io/tayarut/'
L={}
txt=open('/home/claude/work/concepts/list2026.txt').read()
for line in txt.strip().split('\n'):
    n,name=line.split('|',1); L[int(n)]=name
ch={int(k):v for k,v in json.load(open('/home/claude/work/concepts/choice.json')).items()}
OV={2:'marketing/01#s14',13:'marketing/01#s3',14:'marketing/01#s5',15:'marketing/01#s5',16:'marketing/01#s12',21:'marketing/05#s5',34:'marketing/04#s10',
 38:'marketing/08#s4',40:'marketing/08#s5',42:'marketing/08#s7',43:'marketing/08#s7',47:'marketing/06#s2',61:'marketing/09#s3',69:'marketing/09#s5',
 76:'marketing/07#s2',77:'marketing/07#s3',78:'marketing/07#s3',79:'marketing/07#s3',83:'marketing/07#s9',84:'marketing/07#s9',8:'marketing/01#s15',9:'jerusalem/01#s26'}
Y={1:[2026],2:[2024,2025],4:[2018],5:[2021],7:[2024],12:[2019,2021,2022,2026],13:[2025],15:[2026],17:[2023],18:[2024],21:[2026],22:[2024],
 26:[2023,2026],29:[2021,2023],30:[2018],31:[2019],32:[2022],33:[2018,2026],34:[2018],35:[2021],37:[2023],38:[2019,2021],39:[2018,2021],40:[2019],
 42:[2019,2021],44:[2026],45:[2019],46:[2021],50:[2019],56:[2022],58:[2021],59:[2018],60:[2022],62:[2023],65:[2024,2026],68:[2025],74:[2018,2023,2026],
 75:[2024],80:[2022],81:[2023,2026],82:[2018]}
OFF=[("חאג', עומרה וזיארה",[2018,2022,2023,2024,2025],'marketing/04#s7','חאג׳ 2022, 2024 · עומרה 2025 · זיארה 2018, 2023'),
 ('בהאים',[2018,2021],'marketing/04#s8',''),('תמהיל התקשורת',[2024,2025],'marketing/10#s3',''),
 ('תיירות מרפא',[2021],'marketing/03#s8',''),('תיירות ריפוי',[2025],'marketing/03#s8',''),
 ('צפרות',[2019],'marketing/04#s4',''),('תיירות אתגר',[2019],'marketing/03#s7',''),('ביקור משפחות',[2019],'marketing/03#s3',''),
 ('טיול משפחות',[2025],'marketing/03#s3',''),('תיירות SSS',[2022],'marketing/03#s5',''),('תיירות תרבות',[2022],'marketing/03#s6',''),
 ('מוצר בר קיימא',[2022],'marketing/06#s2',''),('שיטה מוניטרית',[2022],'marketing/08#s4',''),('טיולי גיל הזהב',[2024],'marketing/03#s4',''),
 ('קידוד המסר',[2024],'marketing/10#s4',''),('תיירות בת קיימא',[2023],'marketing/01#s11',''),('צורך',[2023],'marketing/08#s3',''),
 ('פרוטסטנטים',[2025],'marketing/04#s6',''),('סחר מקוון',[2025],'marketing/05#s11',''),('פילוח התנהגותי',[2025],'marketing/09#s5','ברשימה: 68'),
 ('יחסי ציבור',[2025],'marketing/10#s7','')]
OFF=[o for o in OFF if o[0]!='פילוח התנהגותי']
REG={'jerusalem':'ירושלים','coastal':'מישור החוף','negev':'הנגב','golan':'הגולן','galilee':'הגליל','valleys':'העמקים','deadsea':'ים המלח','marketing':'שיווק'}
def heads():
    T={}
    for f in glob.glob(root+'*/*/index.html'):
        d=f.split('tayarut/')[1].rsplit('/',1)[0]
        h=open(f).read()
        for m in re.finditer(r'<section class="slide[^"]*" id="(s\w+)"[^>]*>(.*?)</section>',h,re.S):
            h2=re.search(r'<h2[^>]*>(.*?)</h2>',m.group(2),re.S)
            T[d+'#'+m.group(1)]=re.sub('<[^>]+>','',h2.group(1)).strip() if h2 else ''
    return T
T=heads()
def link(ref):
    d,s=ref.split('#'); reg,num=d.split('/')
    lab=f'{REG[reg]} {int(num)}'
    return f'<a href="../../{d}/#{s}" title="{T.get(ref,"")}">{lab}</a>'
def yrs(n):
    y=Y.get(n)
    return '<span class="tag real">'+', '.join(map(str,y))+'</span>' if y else '<span class="mini">—</span>'
def ref(n):
    if n in OV: return OV[n]
    c=ch[n]; return c[0]+'#'+c[1]
for n in L: ref(n) in T or print('BADREF',n,ref(n))
groups=[('רקע וחשיבות התיירות לישראל',1,12),('גורמים המשפיעים על התיירות',13,22),('ייחודה של ישראל כארץ תיירות',23,35),
 ('עקרונות הגישה השיווקית',36,47),('תועלות ומצבי ביקוש',48,59),('שיווק מטרה',60,72),('אסטרטגיית המוצר',73,84)]
out=[]
out.append('''  <section class="slide hero" id="s1">
    <img src="img/hero.jpg" alt="אגמון החולה">
    <span class="credit">אגמון החולה · מצגת התמונות הרשמית</span>
    <div class="pad">
      <p class="kick">מאפיינים ושיווק · נושא 11</p>
      <h1>מושגים לבגרות</h1>
      <p class="lead">כל 84 המושגים מרשימת 2026, ועוד מושגים שנשאלו בבגרות בשנים קודמות. ליד כל מושג: באילו שנים נשאל, ובאיזה שקף לומדים אותו.</p>
      <div class="chips"><span class="chip">פרק 1 בבחינה</span><span class="chip">5 מתוך 10</span><span class="chip">6 נקודות למושג</span><span class="chip">8 מחוונים, 2018–2026</span></div>
    </div>
  </section>''')
out.append('''  <section class="slide" id="s2" hidden>
    <div class="pad">
      <p class="kick">איך עונים</p>
      <h2>שאלת מושג: הסבר ודוגמה</h2>
      <div class="two">
        <div>
          <ul class="clean">
            <li><b>בוחרים 5 מתוך 10.</b> מתחילים במושגים שבטוחים בהם.</li>
            <li><b>מסבירים במשפט או שניים</b>, במילים שלכם. לא מספיק לתרגם את המילה.</li>
            <li><b>מוסיפים דוגמה מישראל</b>: אתר, אירוע, עסק או קהל.</li>
            <li>במושג עם צמד (<b>שמיים פתוחים / מוגבלים</b>, <b>מרפא / ריפוי</b>) כדאי להראות את ההבדל.</li>
          </ul>
        </div>
        <div class="card">
          <h3>דוגמה לתשובה מלאה</h3>
          <p class="mini"><b>ביקוש קשיח (2026):</b> המחיר משתנה, אבל הכמות המבוקשת כמעט לא משתנה, כי המוצר הכרחי. דוגמה: תרופות. בתיירות: צליין שמגיע לחג הפסחא בירושלים יבוא גם אם המלונות התייקרו.</p>
          <p class="note" style="margin-top:10px">תגית ירוקה = השנים שבהן המושג נשאל. "—" = עוד לא נשאל, אבל הוא ברשימת 2026.</p>
        </div>
      </div>
    </div>
  </section>''')
# top repeated
top=[("שיט חופים / נוסע בשיוט",'4 שנים','2019, 2021, 2022, 2026','12'),("חאג', עומרה וזיארה",'5 שנים','2018, 2022, 2023, 2024, 2025','לא ברשימה'),
 ('חליפין, ברטר, שוק ושיטה מוניטרית','4 שנים','2018, 2019, 2021, 2022','38–40'),('קו מוצרים','3 שנים','2018, 2023, 2026','74'),
 ('היצע','שנתיים','2019, 2021','42'),('ייצוא סמוי','שנתיים','2024, 2025','2'),('סיור תמריץ','שנתיים','2021, 2023','29'),('אגריטק','שנתיים','2023, 2026','26'),
 ('תיירות עירונית','שנתיים','2018, 2026','33'),('מיצוב','שנתיים','2023, 2026','81'),('שיווק נישה','שנתיים','2024, 2026','65'),('שמיים פתוחים / מוגבלים','שנתיים','2023, 2024','17–18')]
def tb3(p): return '<div class="plan ctab"><table><tr><th>מושג</th><th>שנים</th><th>ברשימה</th></tr>'+''.join(f'<tr><td class="d">{a}</td><td>{c}</td><td>{d}</td></tr>' for a,b,c,d in p)+'</table></div>'
rows=tb3(top[:6])+tb3(top[6:])
out.append(f'''  <section class="slide" id="s3" hidden>
    <div class="pad">
      <p class="kick">מה חוזר</p>
      <h2>המושגים שנשאלו הכי הרבה</h2>
      <div class="two ctwo">{rows}</div>
      <p class="mini" style="margin-top:8px">גם בהאים ותמהיל התקשורת נשאלו פעמיים, והם לא ברשימת 2026. הם בשקפים האחרונים.</p>
    </div>
  </section>''')
sid=4
for title,a,b in groups:
    ns=list(range(a,b+1)); h=(len(ns)+1)//2
    def tb(part): return '<div class="plan ctab"><table><tr><th>#</th><th>מושג</th><th>נשאל</th><th>לומדים ב</th></tr>'+''.join(f'<tr><td>{n}</td><td class="d">{L[n]}</td><td>{yrs(n)}</td><td>{link(ref(n))}</td></tr>' for n in part)+'</table></div>'
    rows=tb(ns[:h])+tb(ns[h:])
    out.append(f'''  <section class="slide" id="s{sid}" hidden>
    <div class="pad">
      <p class="kick">רשימת 2026 · מושגים {a}–{b}</p>
      <h2>{title}</h2>
      <div class="two ctwo">{rows}</div>
    </div>
  </section>''')
    sid+=1
half=(len(OFF)+1)//2
for i,part in enumerate([OFF[:half],OFF[half:]]):
    hh=(len(part)+1)//2
    def tb2(p): return '<div class="plan ctab"><table><tr><th>מושג</th><th>נשאל</th><th>לומדים ב</th></tr>'+''.join(f'<tr><td class="d">{a}</td><td><span class="tag off">{", ".join(map(str,y))}</span></td><td>{link(r)}</td></tr>' for a,y,r,note in p)+'</table></div>'
    rows=tb2(part[:hh])+tb2(part[hh:])
    out.append(f'''  <section class="slide" id="s{sid}" hidden>
    <div class="pad">
      <p class="kick">נשאלו בבגרות · לא במיקוד 2026 · {i+1}/2</p>
      <h2>מושגים שכדאי לדעת גם כן</h2>
      <p class="mini">הם לא ברשימת 2026, אולי רק בגלל המיקוד של השנה. הם יכולים לחזור.</p>
      <div class="two ctwo">{rows}</div>
    </div>
  </section>''')
    sid+=1
out.append(f'''  <section class="slide stop tint" id="s{sid}" hidden>
    <img class="bg" src="img/hero.jpg" alt="">
    <div class="pad">
      <p class="kick">תרגול · עונים בסטודיו</p>
      <h2>תרגול מושגים</h2>
      <div class="q"><span class="qn">1</span><div class="qt">התאימו מושג להגדרה, במושגים שנשאלו הכי הרבה.<span class="tag">התאמה</span></div></div>
      <div class="q"><span class="qn">2</span><div class="qt">מיינו מושגים לפי הנושא: גורמים, שירותים, שיווק, מוצר.<span class="tag">מיון</span></div></div>
      <div class="q"><span class="qn">3–10</span><div class="qt">שמונה מושגים בפורמט של הבגרות: הסבר ודוגמה. קודם החוזרים, ואחריהם מושגים שעוד לא נשאלו.<span class="tag real">פורמט בגרות</span></div></div>
    </div>
  </section>''')
sid+=1
out.append(f'''  <section class="slide bgslide" id="s{sid}" hidden>
    <img class="bg" src="img/hero.jpg" alt="אגמון החולה">
    <span class="credit">מצגת התמונות הרשמית</span>
    <div class="pad">
      <p class="kick">סיכום</p>
      <h2>איך מתכוננים לפרק המושגים</h2>
      <ul class="clean">
        <li>מתחילים במושגים שחוזרים: שיט חופים, חאג', חליפין וברטר, קו מוצרים.</li>
        <li>לכל מושג: הסבר במילים שלכם, ודוגמה מישראל.</li>
        <li>מושג שלא ברור: לוחצים על הקישור וחוזרים לשקף שבו לומדים אותו.</li>
        <li>לא מוותרים על מושגים שנשאלו בעבר, גם אם הם לא ברשימת 2026.</li>
      </ul>
    </div>
  </section>''')
open(root+'marketing/11/body.part','w').write('\n\n'.join(out)+'\n')
print('slides',sid)
