# טרוול בוסטר — בסיס ידע (תיירות נכנסת, בגרות ניהול תיירותי)
המקור: tb2/bot/knowledge.md. נכנס לבוט דרך build.mjs (bot-context.json). מעדכנים כאן ומריצים build.

## 1. רקע עסקי
- סוגי תיירות: Incoming (נכנסת — זה החומר), Outgoing (יוצאת — מידענות), Domestic.
- סוגי עסקאות מול ספקים:
  - Allocation / Allotment — הקצאה. הזמנה "מתוך המערכת". אישור מיידי כל עוד יש מקום, אבל חובה לדווח לספק (Report and Confirm).
  - Free Sale — הזמנה "מחוץ למערכת" (בין הרים). מזמינים אצל הספק; טרוול בוסטר רק רושמת. אין צורך לדווח.
  - Commitment — התחייבות מלאה (קבוצות). דיווח פעם אחת.
- סוגי דוקט בבגרות:
  - FIT (Individual Travel File) — לקוח פרטי, בלי סוכן ובלי אשראי, מחירי ברוטו, הרווח = עמלה מהספק. בסוף הדוקט מתאפס.
  - קבוצה (Group Travel File) — סוכן עם אשראי (ירוק), מחירי נטו + Markup שאנחנו קובעים. יתרת הדוקט בסוף = הרווח.
- ההבדל החשבונאי נובע מסוכן עם אשראי, לא מכך שזו קבוצה.
- עמלה (Commission) = מהספק, שייכת לשירות. דמי טיפול (Transaction Fee) = מהלקוח, שייכים לדוקט — לא רלוונטי לתלמידים.

## 2. מבנה הדוקט
- דוקט = תיק נסיעה; כל נסיעה = דוקט נפרד; כל שורת שירות = טרנזקציה.
- Header: מספר חד-ערכי, שם (נוסע ראשי / שם קבוצה), Incoming / Group, סטטוס, תאריך, סוכן, סניף; יתרה ב-$ ובש"ח (אדום = חובה, ירוק = זכות); Profit.
- חלקים: Passengers (Rooming / Financial join) → Services → Transaction Fee → Accounting → Communication.
- מקשים: עיפרון (Edit) ו"המבורגר" (Menu) על כל שורה; מקשים כחולים בראש כל חלק.
- איתור דוקט: Find → By Number (מהיר) | לוגו/רשימה | Travel Files → My Travel Files (עמודת סוג: I / O / G).
- Help: Tools → Help.

## 3. FIT — סדר עבודה מומלץ לבחינה
1. קוראים את כל השאלה. מסמנים תאריכים, סידור חדרים (לפעמים מופיע רק בסעיף המלון!), ובשני צבעים: מתוך המערכת / בין הרים.
2. מתחילים תמיד במלון (הוא פותח את הדוקט).
3. שירותים מתוך המערכת (העברות, Activity, Guide — שימו לב לחריגות ק"מ/שעות).
4. בין הרים — מזמינים באתר (רק עד המחיר) ומיד רושמים בטרוול.
5. מאשרים רק הזמנות עם סימן שאלה.
6. שינויים וביטולים.
7. מאשרים את כל השאר.
8. חשבונית → שוברים → קבלה → Itinerary / Travel File Details.

## 4. FIT — הזמנות מתוך המערכת (Add Services)
מלון (פותח דוקט): לא נוגעים ב-Agent. חדרים/מבוגרים/ילדים+גיל, V ב-Twin לשתי מיטות → Destination (2-3 אותיות ובחירה) → Check In/Out → Search → מלון → Details → ריחוף על המחיר = מחירון (לאדם בזוגי, יחיד, Adult Share, Child Share + גיל ילד, תוספת HB/FB, אמצע שבוע מול סופ"ש) → סוג חדר → Book → בסיס אירוח → Proceed → לוודא שיש מחיר ולא 0 (אם 0 — לצאת ולהיכנס מחדש) → שמות (Title, Last, First; Copy לשם משפחה; Next Passenger) → Done → Continue → מסך סיכום: לבדוק חדרים/תאריכים/סוג/בסיס (סמלים: חץ בודד = יחיד, זוגי, "זרוע" = שלישי בחדר) → להחליף אמצעי תשלום מכרטיס אשראי → Confirm → לרשום מספר דוקט.
מלון שני: Add Services → Hotel; לשנות תאריכים (ברירת המחדל = התחלה); לא מזינים שמות.
Transport: From (BEN GURION / עיר), תאריך+שעה, To → Search → רכב לפי מספר נוסעים (3 → ל-4) → Book Now → Origin/Destination בקוד 3 (BGN, TLV, JRS, HFA), Airline בקוד 2 (LY, BA, AF, OS, AA, AC), Flight No. → Continue → תשלום → Confirm.
Activity (מוזיאון, אתר, סיור רגולרי — "יחד עם אחרים"): Destination, טווח תאריכים → Search → Details → Type/Date → Select → Book (עדיף כל אטרקציה בנפרד) → Continue → Confirm.
Guide (סיור פרטי ברכב אשכול — "פרטי שלי"): Destination תמיד Israel; Start = End ליום אחד; Type (Half/Full) → Search → Private Touring לפי מקומות (4/6/10) → Book → V ב-Additional Kilometers / Additional Hours + כמות (לינת מדריך רק ביותר מיום) → Proceed → Confirm.

## 5. FIT — בין הרים (Add Manual Services)
- באתר: Private Tours → Airport Transfers | Private Tours (לפי אזור) | Daily Tours / Tour Packages. תמיד להיכנס ל-Book Now ולבחור תאריך (שבת/חג משנים מחיר). לעצור במחיר. שמות טיולים דומים מאוד!
- מידע שעשוי להישאל: ימי פעילות ושפות, Included / Not Included, ביטול, הנחת ילדים, גיל מינימום, שעות ונקודות איסוף.
- רישום בטרוול: Transport / Guide / Activities → שם (העתקה), Destination מרשימה, ספק Ben Harim, תאריכים ושעות, Status = OK → לא Save → Passengers & Pricing → Supplier Price → Calc → Save & Exit.
- מחיר לרכב (העברה, פרטי) = סכום אחד אצל נוסע אחד. מחיר לנוסע (רגולרי) = מבוגר ליד כל מבוגר, ילד ליד כל ילד; בקרה מול הסה"כ באתר.
- סיור רגולרי: חובה להזין שעת איסוף לפי נקודת היציאה.

## 6. FIT — ביטולים, שינויים, אישורים
- ביטול מתוך המערכת (לפני אישור): המבורגר → Cancel Reservation → X אדום. לא Delete Transaction בבחינה.
- ביטול בין הרים: עיפרון → Status = Cancellation Confirmed → Save & Exit.
- ביטול אחרי אישור: עיפרון → Reservation → Cancel, Report and Confirm. אם התקבל עיגול כתום (Request for Cancellation): פעמיים — Report Cancellation, ואז Confirm Cancellation.
- אחרי שובר: קודם Cancel Voucher. אחרי חשבונית/קבלה: קודם לבטל אותן.
- Amend Reservation: Change Dates | Change board basis | Change room type (ברירת המחדל חוזרת ל-BB — להחזיר את בסיס האירוח!). בכל שינוי — להחליף אמצעי תשלום → Confirm.
- אישור: עיפרון → Reservation → (Reserve,) Report and Confirm → Confirmed with (שם) / Reference (מספר) → OK. גם ירוקים חייבים אישור. מבחוץ אי אפשר לדעת; בפנים: נשאר רק Cancel = אושר.
- הזמנה לא מאושרת לא נספרת ביתרה — לאשר לפני "כמה ישלמו".
- סטטוסים: Confirmed (ירוק V), Request (סימן שאלה כחול — נגמרה ההקצאה), Waiting List, Sold Out, Request for Cancellation (כתום), Cancellation Confirmed (X אדום), Unconfirmed.

## 7. FIT — חשבונאות ומסמכים
- Invoice: Accounting → Invoice. שחור. אין השפעה על היתרה (רישומי).
- Voucher: Ticket/Voucher (כל השוברים יחד). יוצרת חובה (אדום); מופיע Profit; T = תחבורה, V = שאר.
- Receipt: Receipt → Amount → Cash → Generate. ירוק, זכות; FIT מסתיים ב-0.
- Itinerary = אישור ללא מחירים, רק שירותים מאושרים. Travel File Details = עם מחירים; להוריד V ממבוטלים. Send Page → מייל → Send.

## 8. קבוצות — הצעת מחיר (Tools → Calculation Sheet → add new)
1. Information: Group Name, For (שם התלמיד), Agent ירוק בלבד (אדום = בלגן, אין תיקון), Staff in Single / Double → Save → לרשום מספר הצעה.
2. Price Definitions: Gross → Net, Markup באחוזים (לא Fix Amount), טבלת משלמים + חופשיים ("1 על כל 20" → 1 ב-20, 2 ב-40), למחוק שורות מיותרות, לא 0 בשורה הראשונה → Save.
3. Itinerary: התחלה + סיום/ימים/לילות → Create Itinerary → Save (בלי Save אין Transport/Guide). טעות בתאריכים = הצעה חדשה.
4. Transport ואז Guide: ברירת מחדל Full Day; יום העברה = None + V Transfer; תוספת לילה/ערב; חיצים בין ימים; אחרי Save חוזרים ליום הראשון. מה שלא כתוב = Full Day.
5. Add Hotel: יעד, שם → Find → סוג חדר → + → תאריך/לילות, Board → Done פנימי + חיצוני (לחיצה כפולה = כפילות; מחיקה ב-X).
6. Add Activity: V ב-Include FIT Rate, Find (עדיף בלי להקליד שם), Group Rate אם יש, + → תאריך, שעות בפורמט 12:00 → Done. אזורים: Jerusalem, Tel Aviv, Eilat, Dead Sea, Galilee. מלכודות: מגדל דוד ≠ עיר דוד; מצדה עם/בלי רכבל; מוזיאון תל אביב ≠ ארץ ישראל. תאריך שגוי → גוררים.
7. Add Restaurant: Include FIT (בלעדיו אין מסעדות), שעות הגיוניות, לפי מיקום הקבוצה.
8. Add General: כובע — יום ראשון בלבד; מים — כל יום; בלי שעה.
9. Save הרבה. בדיקה: Print → Totals.
10. עוצרים וקוראים לבוחן לפני השינויים (אין היסטוריה בהצעת מחיר).
11. שינויים: Board | המבורגר ביום → Edit Day → Remarks | X → Yes | Markup לשירות: חץ בשירות → Add Markup → Apply → % → OK | Markup כללי: Totals → Edit.
12. שליחה: Print → Itinerary / Send Proposal by Mail.

## 9. קבוצות — קריאת ה-Calculation Sheet
- עמודה לכל גודל קבוצה = הצעות לאותה קבוצה. המחירים לאדם בחדר זוגי.
- Group Costs (קבועות): אוטובוס, מדריך, Staff → Net per person (יורד ככל שיש יותר משתתפים).
- Individual Costs: מלון, מסעדות, Activities, General, Add for Free (עלות החופשיים) → Total individual expenses.
- Totals: Cost per person (נטו) | Markup | Total selling price.
- Supplements: Half Board, Single Supplement, Child Reduction, 3rd Adult Reduction.
- Staff (נהג, מדריך מלווה, מורים מלווים) ≠ Free (הטבה למארגן).

## 10. קבוצות — דוקט
- Create Travel File → חדרים זוגיים / יחיד (לשים לב: חדרים או נוסעים) → מספר דוקט.
- בדוקט: ללא שמות; Agent; שורה ורודה = סכום לתשלום כולל רווח; שורה לבנה = הערה; מלון פעמיים (נוסעים + צוות).
- כל השירותים באדום → מאשרים כל אחד (עיפרון → Reservation → Reserve, Report and Confirm). בלי אישור — אין שובר. לא לאשר את הוורודה ואת ההערה.
- שגיאת "no rooms or passengers" — לא לתקן, להמשיך ולהסביר לבוחן.
- לא משנים דוקט קבוצתי אחרי פתיחה — הכול בהצעה.
- Voucher/Ticket → חובה (שוברים נטו, אחד לכל שירות).
- Invoice → ירוקה, הדוקט ביתרת זכות.
- קבלה: המבורגר בשורת ה-Invoice → Payment by agent → לשנות את הסכום (אחרת Fully Paid) → Cash → Generate. לא Receipt (תשלום כפול).
- רווח = יתרת הדוקט = חשבונית פחות שוברים; גם בחלון Profit.

## 11. בגרות
- פרק טרוול בוסטר: 50 נק' (דוקט/הצעה 25, שינויים ומסמכים 15, בעל פה 10).
- בסוף כל חלק — לקרוא לבוחן ולהשאיר הכול פתוח.
- בודקים דרך והיגיון. טעות שזוהתה והוסברה — מורידה נקודות בלבד; לא להתחיל מחדש.
- מזינים באנגלית.
