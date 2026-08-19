# חומרי לימוד — שלד ראשוני

מקטע חדש באתר "כיתה פלוס" להצגת חומרים שמופקים ב-NotebookLM.

## החלטות טכניות

- אין פריימוורק — HTML/CSS/JS סטטי, תואם לשאר האתר (GitHub Pages, בלי build step).
- תוכן נטען מ-`content/manifest.json` (ראו `content/manifest.example.json` למבנה).
- כל נושא הוא תיקייה תחת `content/<subject>/<topic>/` עם:
  - `summary.md`, `guide.md` — Markdown.
  - `quiz.json` — שאלות תרגול מובנות: `{question, options, answer, explanation}`.
  - קבצי אודיו (`.mp3`) — קבצים נפרדים, מקושרים מה-manifest.
- מכיוון שהאתר סטטי (GitHub Pages), אין קריאה חיה ל-Drive בזמן ריצה. חומרים חדשים
  ייקראו מ-Drive ויתווספו כקבצים סטטיים בריפו בכל עדכון.

## פתוח לדיון

- מבנה תיקיות/שמות ב-Drive (כדי שהשליפה תהיה עקבית).
- האם המקטע פתוח לכולם או דורש התחברות (יש כבר מערכת login/token באתר).
- שיוך חומרים לפי כיתה/מקצוע/תלמיד, אם רלוונטי.
