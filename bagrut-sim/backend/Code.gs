/**
 * סימולטור בגרות – שרת (Google Apps Script)
 * --------------------------------------------------
 * כל המידע נשמר בגיליון אחד. כל רשומה נושאת teacherId, כדי שכמה מורים יוכלו להשתמש באותה מערכת.
 * מפתחות API נשמרים רק כאן, במאפייני הסקריפט (Project Settings → Script properties):
 *   ANTHROPIC_API_KEY   – לבדיקת התשובות
 *   GEMINI_API_KEY      – לתמלול תשובות בעל פה ולהקראה (TTS)
 *   CLAUDE_MODEL        – לא חובה. ברירת מחדל: claude-sonnet-5-5
 *   GEMINI_MODEL        – לא חובה. ברירת מחדל: gemini-2.5-flash
 *   GEMINI_TTS_MODEL    – לא חובה. ברירת מחדל: gemini-2.5-flash-preview-tts
 *   EXAMS_BASE_URL      – כתובת תיקיית הבחינות באתר, למשל https://nisan1234-afk.github.io/bagrut-sim/exams/
 * התקנה: להריץ פעם אחת את setup() – הפונקציה יוצרת את הגיליון והתיקייה ומדפיסה ביומן מפתח מורה ראשון.
 */

const VERSION = '1.0.0';
const P = PropertiesService.getScriptProperties();
const TABLES = {
  Teachers: ['teacherId', 'name', 'email', 'keyHash', 'created'],
  Classes: ['classId', 'teacherId', 'name', 'created'],
  Students: ['studentId', 'classId', 'teacherId', 'name', 'cetName', 'readAloud', 'voiceAnswer', 'extraTime', 'updated'],
  Exams: ['examId', 'teacherId', 'title', 'url', 'created'],
  Sessions: ['sessionId', 'teacherId', 'classId', 'examId', 'openCode', 'minutes', 'status', 'created'],
  Attempts: ['attemptId', 'sessionId', 'teacherId', 'studentId', 'secret', 'status', 'startedAt', 'updatedAt', 'submittedAt', 'timeLeft', 'answers'],
  Grades: ['attemptId', 'teacherId', 'studentId', 'score', 'detail', 'cetText', 'gradedAt', 'model', 'cetEntered', 'error'],
  Audio: ['audioId', 'teacherId', 'kind', 'ref', 'fileId', 'mime', 'transcript', 'created']
};

/* ================= נקודות כניסה ================= */
function doGet() { return json_({ ok: true, app: 'bagrut-sim', version: VERSION }); }

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents || '{}');
    const fn = ACTIONS[req.action];
    if (!fn) throw new Error('פעולה לא מוכרת');
    return json_({ ok: true, data: fn(req) });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

const ACTIONS = {
  /* ---- תלמיד ---- */
  'student.login': studentLogin,
  'student.save': r => { const a = attemptByToken_(r.token); saveAnswers_(a, r.answers, r.timeLeft); return { saved: now_() }; },
  'student.submit': studentSubmit,
  'student.audio': studentAudio,
  'audio.get': audioGet,
  /* ---- מורה ---- */
  'teacher.me': r => { const t = teacher_(r); return { teacherId: t.teacherId, name: t.name }; },
  'classes.list': r => rows_('Classes').filter(x => x.teacherId === teacher_(r).teacherId),
  'classes.save': r => upsert_('Classes', 'classId', withOwner_(r, r.item, 'classId')),
  'students.list': r => rows_('Students').filter(x => x.teacherId === teacher_(r).teacherId && (!r.classId || x.classId === r.classId)),
  'students.save': studentsSave,
  'exams.list': r => rows_('Exams').filter(x => x.teacherId === teacher_(r).teacherId),
  'exams.save': r => upsert_('Exams', 'examId', withOwner_(r, r.item, 'examId')),
  'sessions.list': r => rows_('Sessions').filter(x => x.teacherId === teacher_(r).teacherId),
  'sessions.save': sessionsSave,
  'attempts.list': attemptsList,
  'grade.run': r => { teacher_(r); return gradeAttempt_(r.attemptId, true); },
  'grade.edit': gradeEdit,
  'grade.cetMark': r => { const t = teacher_(r); const g = rowBy_('Grades', 'attemptId', r.attemptId); if (!g || g.teacherId !== t.teacherId) throw new Error('לא נמצא'); g.cetEntered = r.value ? now_() : ''; upsert_('Grades', 'attemptId', g); return g; },
  'audio.saveQuestion': audioSaveQuestion,
  'audio.tts': audioTts,
  'audio.list': r => rows_('Audio').filter(x => x.teacherId === teacher_(r).teacherId && x.kind !== 'answer').map(x => ({ audioId: x.audioId, kind: x.kind, ref: x.ref }))
};

/* ================= התקנה ================= */
function setup() {
  let id = P.getProperty('SHEET_ID'), ss;
  if (id) ss = SpreadsheetApp.openById(id);
  else { ss = SpreadsheetApp.create('סימולטור בגרות – נתונים'); P.setProperty('SHEET_ID', ss.getId()); }
  Object.keys(TABLES).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, TABLES[name].length).setValues([TABLES[name]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  const s1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('גיליון1'); if (s1 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  if (!P.getProperty('FOLDER_ID')) P.setProperty('FOLDER_ID', DriveApp.createFolder('סימולטור בגרות – קבצי שמע').getId());
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('gradeQueue').timeBased().everyMinutes(1).create();
  if (!rows_('Teachers').length) { const k = newTeacher_('המורה הראשי', Session.getActiveUser().getEmail()); Logger.log('מפתח המורה שלך (לשמור!): ' + k); }
  Logger.log('הגיליון: ' + ss.getUrl());
}

/** להוספת מורה נוסף: לשנות שם ולהריץ. המפתח יודפס ביומן. */
function addTeacher() { Logger.log('מפתח: ' + newTeacher_('מורה חדש', '')); }

function newTeacher_(name, email) {
  const key = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
  append_('Teachers', { teacherId: 't_' + Utilities.getUuid().slice(0, 8), name: name, email: email, keyHash: hash_(key), created: now_() });
  return key;
}

/* ================= תלמיד ================= */
function studentLogin(r) {
  const id = String(r.studentId || '').trim(), code = String(r.openCode || '').trim();
  if (!/^\d{5,9}$/.test(id)) throw new Error('מספר זהות לא תקין');
  const s = rows_('Sessions').find(x => String(x.openCode) === code && x.status === 'open');
  if (!s) throw new Error('הסיסמה שגויה או שהבחינה סגורה');
  const st = rows_('Students').find(x => String(x.studentId) === id && x.classId === s.classId && x.teacherId === s.teacherId);
  if (!st) throw new Error('מספר הזהות לא רשום בכיתה של הבחינה הזו');
  const exam = rowBy_('Exams', 'examId', s.examId);
  let a = rows_('Attempts').find(x => x.sessionId === s.sessionId && String(x.studentId) === id);
  const extra = Number(st.extraTime || 0);
  const total = Math.round(Number(s.minutes) * 60 * (1 + extra / 100));
  if (!a) {
    a = { attemptId: 'a_' + Utilities.getUuid().slice(0, 12), sessionId: s.sessionId, teacherId: s.teacherId, studentId: id,
      secret: Utilities.getUuid(), status: 'active', startedAt: now_(), updatedAt: now_(), submittedAt: '', timeLeft: total, answers: '{}' };
    append_('Attempts', a);
  }
  return {
    token: a.attemptId + '.' + a.secret, status: a.status, name: st.name,
    exam: { examId: exam.examId, title: exam.title, url: exam.url },
    timeLeft: Number(a.timeLeft), answers: JSON.parse(a.answers || '{}'),
    acc: { readAloud: truthy_(st.readAloud), voiceAnswer: truthy_(st.voiceAnswer), extraTime: extra }
  };
}

function studentSubmit(r) {
  const a = attemptByToken_(r.token);
  saveAnswers_(a, r.answers, r.timeLeft);
  a.status = 'submitted'; a.submittedAt = now_();
  upsert_('Attempts', 'attemptId', a);
  return { submittedAt: a.submittedAt };
}

function studentAudio(r) {
  const a = attemptByToken_(r.token);
  const f = saveFile_(r.base64, r.mime, 'answer_' + a.studentId + '_' + r.sectionId);
  const id = 'au_' + Utilities.getUuid().slice(0, 10);
  append_('Audio', { audioId: id, teacherId: a.teacherId, kind: 'answer', ref: a.attemptId + ':' + r.sectionId, fileId: f.getId(), mime: r.mime, transcript: '', created: now_() });
  return { audioId: id };
}

/** הקראה: הקלטת מורה קודמת להקראה ממוחשבת. מחזיר את הקובץ כ-base64. */
function audioGet(r) {
  let teacherId;
  if (r.token) teacherId = attemptByToken_(r.token).teacherId; else teacherId = teacher_(r).teacherId;
  const all = rows_('Audio').filter(x => x.teacherId === teacherId && x.ref === r.examId + ':' + r.sectionId);
  const pick = all.find(x => x.kind === 'question') || all.find(x => x.kind === 'tts');
  if (!pick) return null;
  const blob = DriveApp.getFileById(pick.fileId).getBlob();
  return { kind: pick.kind, mime: pick.mime, base64: Utilities.base64Encode(blob.getBytes()) };
}

/* ================= מורה ================= */
function studentsSave(r) {
  const t = teacher_(r);
  (r.items || []).forEach(s => {
    if (!/^\d{5,9}$/.test(String(s.studentId))) return;
    const ex = rows_('Students').find(x => String(x.studentId) === String(s.studentId) && x.classId === s.classId && x.teacherId === t.teacherId);
    const rec = Object.assign({}, ex || {}, s, { teacherId: t.teacherId, updated: now_() });
    if (ex) updateWhere_('Students', x => String(x.studentId) === String(s.studentId) && x.classId === s.classId && x.teacherId === t.teacherId, rec);
    else append_('Students', rec);
  });
  if (r.remove) r.remove.forEach(k => deleteWhere_('Students', x => String(x.studentId) === String(k.studentId) && x.classId === k.classId && x.teacherId === t.teacherId));
  return rows_('Students').filter(x => x.teacherId === t.teacherId && (!r.classId || x.classId === r.classId));
}

function sessionsSave(r) {
  const item = withOwner_(r, r.item, 'sessionId');
  if (!item.openCode) item.openCode = String(Math.floor(1000 + Math.random() * 9000));
  const clash = rows_('Sessions').find(x => x.openCode === item.openCode && x.status === 'open' && x.sessionId !== item.sessionId);
  if (clash && item.status === 'open') throw new Error('הסיסמה כבר בשימוש בבחינה פתוחה אחרת');
  return upsert_('Sessions', 'sessionId', item);
}

function attemptsList(r) {
  const t = teacher_(r);
  const grades = rows_('Grades').reduce((m, g) => (m[g.attemptId] = g, m), {});
  const studs = rows_('Students').filter(x => x.teacherId === t.teacherId);
  return rows_('Attempts').filter(x => x.teacherId === t.teacherId && (!r.sessionId || x.sessionId === r.sessionId)).map(a => {
    const st = studs.find(s => String(s.studentId) === String(a.studentId)) || {};
    const g = grades[a.attemptId] || null;
    return { attemptId: a.attemptId, sessionId: a.sessionId, studentId: a.studentId, name: st.name, cetName: st.cetName, status: a.status,
      startedAt: a.startedAt, updatedAt: a.updatedAt, submittedAt: a.submittedAt, timeLeft: a.timeLeft,
      answers: r.full ? JSON.parse(a.answers || '{}') : undefined,
      grade: g ? { score: g.score, gradedAt: g.gradedAt, cetEntered: g.cetEntered, error: g.error, cetText: r.full ? g.cetText : undefined, detail: r.full && g.detail ? JSON.parse(g.detail) : undefined } : null };
  });
}

function gradeEdit(r) {
  const t = teacher_(r);
  const g = rowBy_('Grades', 'attemptId', r.attemptId);
  if (!g || g.teacherId !== t.teacherId) throw new Error('לא נמצא');
  if (r.score != null) g.score = r.score;
  if (r.cetText != null) g.cetText = r.cetText;
  return upsert_('Grades', 'attemptId', g);
}

function audioSaveQuestion(r) {
  const t = teacher_(r);
  const ref = r.examId + ':' + r.sectionId;
  deleteWhere_('Audio', x => x.teacherId === t.teacherId && x.kind === 'question' && x.ref === ref);
  if (!r.base64) return { removed: true };
  const f = saveFile_(r.base64, r.mime, 'q_' + ref);
  append_('Audio', { audioId: 'au_' + Utilities.getUuid().slice(0, 10), teacherId: t.teacherId, kind: 'question', ref: ref, fileId: f.getId(), mime: r.mime, transcript: '', created: now_() });
  return { saved: true };
}

/** הקראה ממוחשבת של סעיף (Gemini TTS). נשמרת ונשלחת לתלמידים במקום הקראה של הדפדפן. */
function audioTts(r) {
  const t = teacher_(r);
  const ref = r.examId + ':' + r.sectionId;
  const pcm = geminiTts_(r.text);
  const wav = pcmToWav_(pcm, 24000);
  deleteWhere_('Audio', x => x.teacherId === t.teacherId && x.kind === 'tts' && x.ref === ref);
  const f = DriveApp.getFolderById(P.getProperty('FOLDER_ID')).createFile(Utilities.newBlob(wav, 'audio/wav', 'tts_' + ref + '.wav'));
  append_('Audio', { audioId: 'au_' + Utilities.getUuid().slice(0, 10), teacherId: t.teacherId, kind: 'tts', ref: ref, fileId: f.getId(), mime: 'audio/wav', transcript: r.text, created: now_() });
  return { saved: true };
}

/* ================= בדיקה ================= */
/** רץ כל דקה (טריגר). בודק הגשות שעוד לא נבדקו. */
function gradeQueue() {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return;
  try {
    const done = rows_('Grades').reduce((m, g) => (m[g.attemptId] = g, m), {});
    const pending = rows_('Attempts').filter(a => a.status === 'submitted' && (!done[a.attemptId] || (done[a.attemptId].error && !done[a.attemptId].score)));
    pending.slice(0, 3).forEach(a => { try { gradeAttempt_(a.attemptId, false); } catch (e) { Logger.log(e); } });
  } finally { lock.releaseLock(); }
}

function gradeAttempt_(attemptId, force) {
  const a = rowBy_('Attempts', 'attemptId', attemptId); if (!a) throw new Error('הגשה לא נמצאה');
  const s = rowBy_('Sessions', 'sessionId', a.sessionId);
  const examRow = rowBy_('Exams', 'examId', s.examId);
  const exam = JSON.parse(UrlFetchApp.fetch(resolveUrl_(examRow.url)).getContentText());
  const st = rows_('Students').find(x => String(x.studentId) === String(a.studentId) && x.teacherId === a.teacherId) || {};
  const answers = JSON.parse(a.answers || '{}');
  try {
    transcribeAnswers_(a, answers);
    const plan = selectCounted_(exam, answers);
    const ai = claudeGrade_(exam, plan, answers);
    const result = assemble_(exam, plan, ai);
    const cetText = cetText_(exam, st, result, ai);
    upsert_('Grades', 'attemptId', { attemptId: a.attemptId, teacherId: a.teacherId, studentId: a.studentId, score: result.total,
      detail: JSON.stringify({ result: result, analysis: ai.analysis }), cetText: cetText, gradedAt: now_(), model: model_(), cetEntered: '', error: '' });
    return { score: result.total };
  } catch (e) {
    upsert_('Grades', 'attemptId', { attemptId: a.attemptId, teacherId: a.teacherId, studentId: a.studentId, score: '', detail: '', cetText: '', gradedAt: now_(), model: model_(), cetEntered: '', error: String(e.message || e) });
    if (force) throw e; return { error: String(e) };
  }
}

/** מתמלל תשובות שהוקלטו ומכניס את התמלול לתשובה. */
function transcribeAnswers_(a, answers) {
  const bySec = {};
  rows_('Audio').filter(x => x.kind === 'answer' && String(x.ref).indexOf(a.attemptId + ':') === 0).forEach(au => {
    const sid = au.ref.split(':')[1];
    if (!au.transcript) {
      const b = DriveApp.getFileById(au.fileId).getBlob();
      au.transcript = geminiTranscribe_(Utilities.base64Encode(b.getBytes()), au.mime);
      upsert_('Audio', 'audioId', au);
    }
    (bySec[sid] = bySec[sid] || []).push(au.transcript);
  });
  // מחליף את הסימון "הוקלטו N תשובות" בתמלול עצמו
  Object.keys(bySec).forEach(sid => { answers[sid + '__voice'] = '[תשובה בעל פה – תמלול] ' + bySec[sid].join('\n'); });
}

/** מי נבדק: שאלות/סעיפי בחירה – לפי הסדר, רק המספר הנדרש. מחזיר גם מה נענה מעבר לנדרש ומה חסר. */
function selectCounted_(exam, answers) {
  const has = sid => Object.keys(answers).some(k => k.split('__')[0] === sid && String(answers[k] || '').trim() && answers[k] !== '');
  const out = { sections: [], notes: [] };
  exam.chapters.forEach(ch => {
    const answeredQ = ch.questions.filter(q => q.sections.some(sec => has(sec.id)));
    const needQ = ch.choose ? ch.choose.n : ch.questions.length;
    const countedQ = ch.choose ? answeredQ.slice(0, needQ) : ch.questions;
    if (ch.choose && answeredQ.length > needQ) out.notes.push({ chapter: ch.name, type: 'extra', answered: answeredQ.length, need: needQ, ignored: answeredQ.slice(needQ).map(q => q.num) });
    if (ch.choose && answeredQ.length < needQ) out.notes.push({ chapter: ch.name, type: 'missing', answered: answeredQ.length, need: needQ, lost: (needQ - answeredQ.length) * (ch.points / needQ) });
    countedQ.forEach(q => {
      const answeredS = q.sections.filter(sec => has(sec.id));
      const needS = q.choose ? q.choose.n : q.sections.length;
      const countedS = q.choose ? answeredS.slice(0, needS) : q.sections;
      if (q.choose && answeredS.length > needS) out.notes.push({ question: q.num, type: 'extraSections', ignored: answeredS.slice(needS).map(x => x.letter) });
      if (q.choose && answeredS.length < needS) out.notes.push({ question: q.num, type: 'missingSections', lost: (needS - answeredS.length) * q.sections[0].points });
      countedS.forEach(sec => out.sections.push({ q: q, sec: sec, answered: has(sec.id) }));
    });
    // לחישוב "מה היה קורה אילו בחר טוב יותר": בודקים גם שאלות שלא נספרו
    answeredQ.slice(needQ).forEach(q => q.sections.filter(sec => has(sec.id)).forEach(sec => out.sections.push({ q: q, sec: sec, answered: true, extra: true })));
  });
  return out;
}

function claudeGrade_(exam, plan, answers) {
  const items = plan.sections.filter(x => x.answered).map(x => ({
    id: x.sec.id, question: x.q.title, letter: x.sec.letter, max: x.sec.points, text: x.sec.text,
    rubric: x.sec.rubric + (x.sec.rubricBase && x.sec.rubricBase != x.sec.points ? ` (המחוון המקורי ל-${x.sec.rubricBase} נקודות – יש לחשב לפי היחס, מתוך ${x.sec.points})` : ''),
    sample: x.sec.answer,
    student: Object.keys(answers).filter(k => k.split('__')[0] === x.sec.id).map(k => answers[k]).join('\n')
  }));
  if (!items.length) return { sections: {}, analysis: { strengths: [], weaknesses: [], mustImprove: [], practice: [], summary: 'התלמיד לא ענה על אף סעיף.' } };
  const sys = 'אתה בודק בחינות בגרות בתיירות (שאלון 880387). בודקים לפי המחוון בלבד, בהגינות, בלי להמציא דרישות. ' +
    'ניקוד בחלקי נקודות מותר (עד 0.25). כותבים בעברית פשוטה, ישירה ומכבדת, בגוף שני לתלמיד. מחזירים JSON בלבד.';
  const user = 'בדוק כל סעיף. החזר JSON במבנה: {"sections":{"<id>":{"score":מספר,"max":מספר,"ok":["מה נכון"],"missing":["מה חסר כדי לקבל ניקוד מלא"],"wrong":["טעויות עובדתיות"],"tip":"משפט אחד: איך לשפר"}},' +
    '"analysis":{"summary":"2-3 משפטים","strengths":["..."],"weaknesses":["..."],"mustImprove":["דברים שחייבים לשפר עד הבגרות"],"practice":["תרגול מומלץ ספציפי"]}}\n\nהסעיפים:\n' + JSON.stringify(items);
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': needKey_('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: model_(), max_tokens: 8000, system: sys, messages: [{ role: 'user', content: user }] })
  });
  if (res.getResponseCode() !== 200) throw new Error('Claude: ' + res.getContentText().slice(0, 300));
  const txt = JSON.parse(res.getContentText()).content.map(c => c.text || '').join('');
  const m = txt.match(/\{[\s\S]*\}/); if (!m) throw new Error('תשובת הבדיקה לא בפורמט JSON');
  return JSON.parse(m[0]);
}

function assemble_(exam, plan, ai) {
  const lines = []; let total = 0, extraBetter = 0;
  plan.sections.forEach(x => {
    const g = (ai.sections || {})[x.sec.id] || { score: 0, max: x.sec.points, ok: [], missing: x.answered ? [] : ['לא נענה'], wrong: [], tip: '' };
    const score = Math.max(0, Math.min(Number(g.score) || 0, x.sec.points));
    lines.push({ id: x.sec.id, qnum: x.q.num, title: x.q.title, letter: x.sec.letter, max: x.sec.points, score: score, counted: !x.extra, answered: x.answered,
      ok: g.ok || [], missing: g.missing || [], wrong: g.wrong || [], tip: g.tip || '' });
    if (!x.extra) total += score;
  });
  // כמה נקודות הפסיד בבחירה לא טובה (ענה על יותר מהנדרש)
  plan.notes.filter(n => n.type === 'extra').forEach(n => {
    const ch = exam.chapters.find(c => c.name === n.chapter);
    const perQ = {}; lines.filter(l => ch.questions.some(q => q.num === l.qnum)).forEach(l => perQ[l.qnum] = (perQ[l.qnum] || 0) + l.score);
    const all = Object.values(perQ).sort((a, b) => b - a);
    const best = all.slice(0, n.need).reduce((s, v) => s + v, 0);
    const got = Object.keys(perQ).filter(k => !n.ignored.includes(Number(k))).reduce((s, k) => s + perQ[k], 0);
    n.couldGain = Math.max(0, Math.round((best - got) * 100) / 100); extraBetter += n.couldGain;
  });
  return { total: Math.round(total * 100) / 100, lines: lines, notes: plan.notes, couldGain: extraBetter };
}

/** הטקסט שנכנס במט"ח: פירוט טכני מלא ואחריו ניתוח. */
function cetText_(exam, st, r, ai) {
  const L = [];
  L.push(`ציון: ${r.total} מתוך 100`);
  L.push(`${exam.subject} – ${exam.session} (שאלון ${exam.code})`);
  L.push('');
  L.push('פירוט לפי סעיפים');
  let cur = null;
  r.lines.filter(l => l.counted).forEach(l => {
    if (cur !== l.qnum) { L.push(''); L.push(`■ ${l.title}`); cur = l.qnum; }
    L.push(`סעיף ${l.letter || ''} – ${l.score} מתוך ${l.max}${l.answered ? '' : ' (לא נענה)'}`.replace('סעיף  –', 'הסעיף –'));
    l.ok.forEach(x => L.push('  ✓ ' + x));
    l.missing.forEach(x => L.push('  ✗ חסר: ' + x));
    l.wrong.forEach(x => L.push('  ✗ שגוי: ' + x));
    if (l.tip) L.push('  → ' + l.tip);
  });
  r.notes.forEach(n => {
    L.push('');
    if (n.type === 'extra') L.push(`שים לב: ב${n.chapter} ענית על ${n.answered} שאלות, ונבדקו רק ${n.need} הראשונות (לפי הסדר).` + (n.couldGain ? ` אילו בחרת את ${n.need} הטובות, היית מקבל ${n.couldGain} נקודות יותר.` : ''));
    if (n.type === 'missing') L.push(`שים לב: ב${n.chapter} ענית על ${n.answered} שאלות מתוך ${n.need} הנדרשות. הפסדת ${n.lost} נקודות.`);
    if (n.type === 'missingSections') L.push(`שים לב: בשאלה ${n.question} לא ענית על כל הסעיפים הנדרשים. הפסדת ${n.lost} נקודות.`);
    if (n.type === 'extraSections') L.push(`שים לב: בשאלה ${n.question} ענית על יותר סעיפים מהנדרש. נבדקו רק הראשונים.`);
  });
  const an = ai.analysis || {};
  L.push(''); L.push('ניתוח');
  if (an.summary) L.push(an.summary);
  const list = (h, arr) => { if (arr && arr.length) { L.push(''); L.push(h); arr.forEach(x => L.push('• ' + x)); } };
  list('במה אתה טוב:', an.strengths); list('איפה קשה לך:', an.weaknesses); list('חייב לשפר עד הבגרות:', an.mustImprove); list('תרגול מומלץ:', an.practice);
  return L.join('\n');
}

/* ================= Gemini ================= */
function geminiTranscribe_(b64, mime) {
  const model = P.getProperty('GEMINI_MODEL') || 'gemini-2.5-flash';
  const res = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${needKey_('GEMINI_API_KEY')}`, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ contents: [{ parts: [{ text: 'תמלל במדויק את ההקלטה בעברית. החזר רק את התמלול.' }, { inline_data: { mime_type: (mime || 'audio/webm').split(';')[0], data: b64 } }] }] })
  });
  if (res.getResponseCode() !== 200) throw new Error('תמלול: ' + res.getContentText().slice(0, 200));
  return JSON.parse(res.getContentText()).candidates[0].content.parts.map(p => p.text || '').join('').trim();
}

function geminiTts_(text) {
  const model = P.getProperty('GEMINI_TTS_MODEL') || 'gemini-2.5-flash-preview-tts';
  const res = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${needKey_('GEMINI_API_KEY')}`, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ contents: [{ parts: [{ text: 'הקרא בעברית, בקצב רגוע וברור, כמו הקראת שאלון בבחינה: ' + text }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } } })
  });
  if (res.getResponseCode() !== 200) throw new Error('הקראה: ' + res.getContentText().slice(0, 200));
  return Utilities.base64Decode(JSON.parse(res.getContentText()).candidates[0].content.parts[0].inlineData.data);
}

function pcmToWav_(pcm, rate) {
  const len = pcm.length, h = [];
  const w32 = v => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255], w16 = v => [v & 255, (v >> 8) & 255];
  const str = s => s.split('').map(c => c.charCodeAt(0));
  h.push(...str('RIFF'), ...w32(36 + len), ...str('WAVEfmt '), ...w32(16), ...w16(1), ...w16(1), ...w32(rate), ...w32(rate * 2), ...w16(2), ...w16(16), ...str('data'), ...w32(len));
  return h.map(b => b > 127 ? b - 256 : b).concat(pcm);
}

/* ================= עזרים ================= */
function teacher_(r) {
  const h = hash_(String(r.key || ''));
  const t = rows_('Teachers').find(x => x.keyHash === h);
  if (!t) throw new Error('מפתח מורה שגוי');
  return t;
}
function withOwner_(r, item, idField) {
  const t = teacher_(r); item = Object.assign({}, item || {});
  if (item[idField]) { const ex = rowBy_(sheetOf_(idField), idField, item[idField]); if (ex && ex.teacherId !== t.teacherId) throw new Error('אין הרשאה'); }
  else item[idField] = idField.replace('Id', '').slice(0, 2) + '_' + Utilities.getUuid().slice(0, 8);
  item.teacherId = t.teacherId; if (!item.created) item.created = now_();
  return item;
}
function sheetOf_(idField) { return { classId: 'Classes', examId: 'Exams', sessionId: 'Sessions' }[idField]; }
function attemptByToken_(token) {
  const [id, secret] = String(token || '').split('.');
  const a = rowBy_('Attempts', 'attemptId', id);
  if (!a || a.secret !== secret) throw new Error('יש להתחבר מחדש');
  return a;
}
function saveAnswers_(a, answers, timeLeft) {
  if (a.status === 'submitted') throw new Error('הבחינה כבר הוגשה');
  a.answers = JSON.stringify(answers || {}); a.timeLeft = Math.max(0, Number(timeLeft) || 0); a.updatedAt = now_();
  upsert_('Attempts', 'attemptId', a);
}
function saveFile_(b64, mime, name) {
  return DriveApp.getFolderById(P.getProperty('FOLDER_ID')).createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime || 'audio/webm', name));
}
function resolveUrl_(u) { return /^https?:/.test(u) ? u : (P.getProperty('EXAMS_BASE_URL') || '') + u; }
function model_() { return P.getProperty('CLAUDE_MODEL') || 'claude-sonnet-5-5'; }
function needKey_(k) { const v = P.getProperty(k); if (!v) throw new Error('חסר מפתח ' + k + ' במאפייני הסקריפט'); return v; }
function truthy_(v) { return v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1' || v === 'כן'; }
function hash_(s) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s + '|bagrut-sim')); }
function now_() { return new Date().toISOString(); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function sheet_(name) { return SpreadsheetApp.openById(P.getProperty('SHEET_ID')).getSheetByName(name); }
function rows_(name) {
  const v = sheet_(name).getDataRange().getValues(); const hd = v.shift();
  return v.filter(r => r.join('') !== '').map(r => hd.reduce((o, k, i) => (o[k] = r[i], o), {}));
}
function rowBy_(name, key, val) { return rows_(name).find(r => String(r[key]) === String(val)); }
function append_(name, obj) { sheet_(name).appendRow(TABLES[name].map(k => obj[k] === undefined ? '' : obj[k])); return obj; }
function upsert_(name, key, obj) {
  const sh = sheet_(name), v = sh.getDataRange().getValues(), hd = v[0], ki = hd.indexOf(key);
  for (let i = 1; i < v.length; i++) if (String(v[i][ki]) === String(obj[key])) {
    const merged = hd.map((k, j) => obj[k] === undefined ? v[i][j] : obj[k]);
    sh.getRange(i + 1, 1, 1, hd.length).setValues([merged]); return obj;
  }
  return append_(name, obj);
}
function updateWhere_(name, pred, obj) {
  const sh = sheet_(name), v = sh.getDataRange().getValues(), hd = v[0];
  for (let i = 1; i < v.length; i++) { const r = hd.reduce((o, k, j) => (o[k] = v[i][j], o), {}); if (pred(r)) sh.getRange(i + 1, 1, 1, hd.length).setValues([hd.map(k => obj[k] === undefined ? r[k] : obj[k])]); }
}
function deleteWhere_(name, pred) {
  const sh = sheet_(name), v = sh.getDataRange().getValues(), hd = v[0];
  for (let i = v.length - 1; i >= 1; i--) { const r = hd.reduce((o, k, j) => (o[k] = v[i][j], o), {}); if (pred(r)) sh.deleteRow(i + 1); }
}
