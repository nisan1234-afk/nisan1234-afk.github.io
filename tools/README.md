# כלי העבודה של אתר התיירות לבגרות

הסקריפטים שבונים ומתחזקים את האתר `tayarut/`. נשמרו כאן כדי שלא יאבדו כשסביבת העבודה בענן נמחקת.

בסשן חדש: משכפלים את הריפו, ומעתיקים את הכלים לתיקיית העבודה (`/home/claude/work`), כי הנתיבים בסקריפטים מכוונים לשם:

```
cp -r tools/* /home/claude/work/
mv /home/claude/work/make_docx.py /home/claude/work/pdf/   # אחרי mkdir -p /home/claude/work/pdf
cd /home/claude/work/pdf && npm i @fontsource/heebo @fontsource/frank-ruhl-libre   # פונטים מקומיים לצילומי מסך
pip install python-docx qrcode[pil] playwright --break-system-packages
```

## הסקריפטים

| קובץ | מה הוא עושה | הרצה |
|---|---|---|
| `build_catalog.py` | בונה את דף הקטלוג `tayarut/index.html` (עיצוב חדש בהשראת Stitch): חיפוש, סינון, כרטיס לכל חבל, 7 כפתורים לכל נושא. קורא מ־`feedback_links.json` את קישורי טופס המשוב | `python3 build_catalog.py` |
| `make_docx.py` | דף עבודה בוורד לנושא (עברית מימין לשמאל, שרטוטים בשחור־לבן, ברקוד לנושא באתר). אחריו ממירים ל־PDF | `python3 make_docx.py negev 03` ואז `soffice --headless --convert-to pdf --outdir <DECK> <DECK>/worksheet.docx` |
| `media_pages.py` | דף סרטון (הטמעה מהדרייב) או דף פודקאסט לנושא | `python3 media_pages.py video <region> <NN> "<topic>" <driveId> <min>` / `podcast <region> <NN> "<topic>" "<h1>" "<desc>"` |
| `shot.py` | צילום שקף אחד ובדיקת גובה (מעל 720 = גולש) | `python3 shot.py negev/03#s8` (מתוך `tayarut/`) |
| `feedback_links.json` | קישור מלא־מראש לטופס המשוב לכל נושא | — |
| `cet/cet_helpers.js` | פונקציות לעורך הסטודיו של מט"ח: `doQ`, `addQ`, `qEd`, `visEd`, `weights` | מדביקים בקונסולה של העורך, או `eval(localStorage.getItem('tayarutH'))` |
| `specs/` | קובצי SPEC לכל חבל: שאלות פתוחות `[ניקוד, html, תשובה, מחוון]` | `window.SPEC=...` ואז `doQ(n)` |
| `plans/` | תכנון החבלים, תכנון יחידות ירושלים, ודוח כיסוי שאלות הבגרות | — |
| `nlm/prompts.md` | הפרומפטים לסרטונים ולפודקאסטים בנוטבוק | — |
| `deck/reference_deck.html` | מצגת לדוגמה (ירושלים 1) כתבנית למצגת חדשה | — |

## אחרי כל שינוי

```
cd /home/claude/work && python3 build_catalog.py
cd /home/claude/nisan1234-afk.github.io && git add -A && git commit -m "..." && git push
```
