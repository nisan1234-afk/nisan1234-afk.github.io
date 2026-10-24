# Brief: planning a bagrut region (חבל) for the CET Studio rebuild — tourism track, 11th grade, paper 880387

You plan ONE region. Output is a Hebrew markdown plan file. Do NOT build slides; do NOT touch the browser.

## The teacher's method (fixed, already proven on Jerusalem topics 1–2)
- A region is split into topics (נושאים). Size by content depth: don't stretch a thin region, don't squeeze a rich one (Jerusalem = 6 topics; smaller regions may be 2–4).
- Per topic: (1) an HTML slide deck (~14–20 slides) organized around SITES: "site → what the tourist sees/does → why it matters", with real photos; (2) a CET Studio unit embedding the deck section by section with "practice stops" between them; (3) a NotebookLM opening video + review podcast.
- Studio unit: weights sum to exactly 100. Approx mix: ~16 auto-graded (sequence / match-lines / multiple choice / drag-sort), one short open question (~10–12), 2–3 concept questions in exam format (explain the concept, 6 pts each), and a bagrut-style closing block (~50–55) built from REAL past bagrut questions wherever possible. Never use the "choose 2 of 3" question type (CET scores it badly).
- Open answers stay open (Claude grades later). Every open question gets a model answer for post-submission feedback.
- Units must stand alone for absent students. Anything a closing question asks must be taught in that topic's slides.
- Content must stay inside the region (no Dead Sea content in Jerusalem, etc.). Galilee and Coastal Plain are separate materials — do not mix. "גליל מערבי ומישור חוף צפוני" belongs to the Coastal Plain, not the Galilee.
- Mark anything not in the class book as [הרחבה].

## Concepts
Only from the official list "מושגים לבגרות 2026" (84 concepts; read it from Drive file id 1sgPD-WstAPAtP_juvJQvQniZdm9XW68f). Concepts 36–84 = marketing chapter, not regions. Already used: Jerusalem T1: 8,9,11,16,22,33. Jerusalem T2: 1,2,3,6,7,10,13,14,15. Reserved for Jerusalem T6: 28 (book fair, held in Jerusalem), 35 (WTO). PRE-ASSIGNED to avoid clashes between regions planned in parallel — use these: Coastal Plain: 12, 23, 24, 25, 26, 27, 29, 30. Negev-Arava-Eilat: 4, 5, 17, 18, 19, 20, 21, 34 (seasonality, charter flights, open skies, eco-tourism fit Eilat/Ramon airport and the desert). Golan: 31 (industry tourism, e.g. winery visits). Galilee: 32 (rural). Valleys: may reuse 32 (kibbutz/moshav rural tourism) if central. Dead Sea: may reuse 22 (carrying capacity — bagrut asked about it for the Dead Sea). A concept may be reused only if truly central. Concept questions follow the exam's concepts section: explain + example, 6 points.

## Real bagrut questions
Use the ledger idea: each real question is assigned to exactly ONE topic (or to the region exam). Source: the analysis doc "98 — מה שואלים בבגרות" (Drive id 1PVuPnvS9BnafvvyfzoKViATdmbqCNwBDLkULpylInRo; 8 exams 2018–2025) and region-specific question files if you find them in Drive. Keep the exam's own wording where you have it; otherwise mark "בעקבות בגרות YYYY".

## Sources (Drive, read with the Google Drive tools)
- Master folder 1sC16O5iGnYdjfvMF9uwk3kcGYgpgGDzK: docs named "א04.x — תיירות בישראל | פרק ד׳: <region>" (book-based summaries; for the Negev use the corrected version "גרסה מתוקנת — רק מהספר" plus "א04.7ב השלמה מהבוט", NOT the "ישן" one). Search the folder by title.
- Region folder in "חבלים" (1LB5avqcn2kFlNLqGw8f5UPBBGYQDAPuz): subfolders per region with raw materials (presentations, bagrut questions, official answer keys "מחוון רשמי 880387 ..."). List them and read the relevant text files (docx/pdf/google docs). Do not try to download huge pptx files.
- Official image deck (Google Slides, read text only to know which photos exist per region): "מצגת תמונות תיירות - חבלי ארץ" id 1_M07vrheDqtckt_nArH4ug08GEl8DP3o9d-tbqaFs9M. Older split: Jerusalem 2–46, Negev/Arava/Eilat 47–67, Golan 68–82, Upper Galilee 83–93, Lower Galilee 94–111, Dead Sea 112–121, Coastal Plain 122–173, Valleys 174–181 (verify against the merged deck's text).

## Output file: /home/claude/work/regions/<slug>-plan.md (Hebrew) containing
1. Region overview + list of topics (name, scope, key sites, why this split, est. slides).
2. Per topic: slide outline (titles + 1-line content each, the sites, which image-deck slide numbers fit), concepts assigned (number + name), Studio question list with types, weights (sum 100), and an answer key (מחוון) with point breakdown for each open question, plus model answers.
3. Ledger: every real bagrut question for this region → topic or region exam.
4. Open issues / facts to verify.
Be accurate; prefer the book-based master doc and official answer keys. Hebrew only in the file; be concise but complete.

## LOCAL materials now available (staged from the teacher's computer) under /mnt/user-data/uploads/האחסון שלי/
- Official answer keys (מחוון בגרות 880387) 2018, 2019, 2021, 2022, 2023, 2024, 2025, 2026: "אתר תירות אלוני הבשן/חבלים/קישור לבחינות מתוקשבות ומחוונים-20260906/*.pdf" — use pdftotext; they contain the real exam questions + official answers. STRONGLY prefer these for the ledger and answer keys.
- National-broadcast teacher decks (Hebrew, rich text + photos), in "הורדות/": P1_csujacsy (סובב כנרת), P1_gxmq2mwq (מישור חוף הכרמל והרי הכרמל), P1_ic6mpp8l (הגליל העליון), P1_rs9pgk86 (צפון רמת הגולן), P1_rsx78tc2 (מרכז ודרום רמת הגולן), P1_u2glqsu3 (הגליל התחתון), P1_u5zea5fh (דרום ים המלח), P1_uqcceo89 (מישור החוף הצפוני — חוף הגליל המערבי), tourism-vod-P1_wylff2bd (צפון ים המלח). Arabic versions: P1_23odqb3h (גליל תחתון), P1_3kzob1oj (גליל עליון).
- Valleys: "אתר תירות אלוני הבשן/חבלים/העמקים/חומרי גלם/" P1_ihy43i4s.pptx, מצגת -העמקים.pptx, מפות העמקים.pptx.
- Coastal: "אתר תירות אלוני הבשן/חבלים/מישור החוף/מישור_החוף_מצגת.pptx" and "חומר גלם/1מישור החוף הצפוני.pptx".
- Dead Sea: "אתר תירות אלוני הבשן/חבלים/ים המלח ומדבר יהודה/Dead_Sea_Earths_Lowest_Epic.pdf".
- Negev/Golan/Galilee photos: "אתר תירות אלוני הבשן/חבלים/תמונות - הנגב,הערבה ואילת ,רמת הגולן, גליל.pptx" and "חבלים/הנגב הערבה ואילת/jpegmini_optimized.zip".
Extract slide text with python zipfile (ppt/slides/slideN.xml, <a:t>) — do not print images. For each topic's slide outline, cite which local deck + slide number has a usable photo (e.g. "P1_u5zea5fh s12").
