/**
 * טרוול בוסטר צעד-צעד — שרת עצמאי (לא קשור לכיתה פלוס).
 *
 * מה הוא עושה:
 *  - תלמיד/ה נכנס/ת למדריך בטלפון עם גוגל. השרת מאמת את הכניסה מול גוגל.
 *  - בכניסה הראשונה נוצר לתלמיד/ה גיליון Google Sheets אישי בתיקייה שלך בדרייב,
 *    והוא משותף איתו/ה לצפייה.
 *  - בגיליון: לשונית לכל חלק למידה (FIT, קבוצות, ...), ועמודה לכל יחידה.
 *    כל מעבר שלב בטלפון מעדכן את העמודה; בסוף יחידה נכתב מספר הדוקט.
 *  - בנוסף יש גיליון מרכזי אחד ("כל התלמידים"): לשונית "תלמידים" (שורה לכל תלמיד/ה וקישור לגיליון שלו/ה)
 *    ולשונית "התקדמות" (שורה לכל תלמיד/ה × יחידה). ממנה קורא עמוד המורה (tb/teacher.html).
 *  - עמוד המורה פתוח רק לבעל/ת הסקריפט, ולמיילים נוספים שרשומים ב-Script Properties תחת teachers
 *    (מופרדים בפסיק).
 *
 *  - בוט עזרה (action = ask): התלמיד/ה שואל/ת, אפשר עם צילום מסך, ו-Gemini עונה עם קישור לשלב במדריך.
 *    צריך מפתח Gemini ב-Script Properties תחת gemini_key. ר' "בוט העזרה" בסוף הקובץ.
 *
 * התקנה: ר' tb/apps-script/README.md (העתקה של הקובץ הזה, הרצה אחת של setup, ופריסה).
 * הכול נוצר אוטומטית בדרייב של מי שמריץ את הסקריפט. אין צורך לערוך כלום בקובץ.
 */

const CLIENT_ID = '988232727899-pajp4mhs43tet1phcu3rc8c8mutsgpme.apps.googleusercontent.com';
const GUIDE_URL = 'https://nisan1234-afk.github.io/tb/';
const FOLDER_NAME = 'טרוול בוסטר — גיליונות תלמידים';
const REGISTRY_NAME = 'טרוול בוסטר — כל התלמידים';
const UNIT_ID_RE = /^(base|fit|grp|mid|ex)-[a-z0-9-]{2,40}$/;

// שורות בכל לשונית חלק-למידה. שורה 1 מוסתרת ומחזיקה את מזהה היחידה (כך אפשר לשנות כותרת בלי לשבור).
const ROWS = {
  id: 1, title: 2, status: 3, step: 4, total: 5, percent: 6, docket: 7, note: 8,
  started: 9, updated: 10, completed: 11
};
const ROW_LABELS = ['unit_id', 'יחידה', 'סטטוס', 'שלב נוכחי', 'מתוך', 'התקדמות %', 'דוקט / הצעה', 'הערה שלי',
  'התחלתי', 'עדכון אחרון', 'סיימתי'];
const REGISTRY_HEADERS = ['שם', 'מייל', 'הגיליון', 'יחידות שהושלמו', 'יחידה אחרונה', 'שלב', 'דוקט אחרון', 'עדכון אחרון', 'נוצר'];
const PROGRESS_TAB = 'התקדמות';
const PROGRESS_HEADERS = ['מייל', 'שם', 'unit_id', 'יחידה', 'חלק', 'סטטוס', 'שלב', 'מתוך', 'התקדמות %', 'דוקט / הצעה', 'הערה', 'התחלתי', 'עדכון אחרון', 'סיימתי'];
const P = { email: 1, name: 2, id: 3, title: 4, track: 5, status: 6, step: 7, total: 8, percent: 9, docket: 10, note: 11, started: 12, updated: 13, completed: 14 };

// ========== נקודת כניסה ==========

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const user = verifyGoogleToken_(body.token);
    const handlers = {
      hello: () => hello_(user),
      step: () => withLock_(() => saveStep_(user, body)),
      complete: () => withLock_(() => complete_(user, body)),
      teacher: () => teacherSummary_(user),
      ask: () => askBot_(user, body)
    };
    if (!handlers[body.action]) return json_({ ok: false, error: 'פעולה לא מוכרת' });
    return json_({ ok: true, data: handlers[body.action]() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function doGet() {
  return json_({ ok: true, message: 'טרוול בוסטר צעד-צעד — השרת פעיל' });
}

/** להריץ פעם אחת מהעורך: יוצר תיקייה וגיליון מרכזי, ומבקש הרשאות. */
function setup() {
  const folder = getFolder_();
  const reg = getRegistry_();
  Logger.log('תיקייה: ' + folder.getUrl());
  Logger.log('גיליון מרכזי: ' + reg.getUrl());
}

// ========== אימות ==========

function verifyGoogleToken_(token) {
  if (!token) throw new Error('צריך להיכנס עם גוגל');
  const cache = CacheService.getScriptCache();
  const key = 'tok:' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token), Utilities.Charset.UTF_8));
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('הכניסה פגה. היכנסו שוב עם גוגל.');
  const info = JSON.parse(res.getContentText());
  if (info.aud !== CLIENT_ID) throw new Error('כניסה לא תקינה');
  if (String(info.email_verified) !== 'true') throw new Error('חשבון הגוגל לא מאומת');
  const user = { email: String(info.email).toLowerCase(), name: info.name || info.email };
  const left = Number(info.exp) - Math.floor(Date.now() / 1000);
  if (left > 30) cache.put(key, JSON.stringify(user), Math.min(600, left - 10));
  return user;
}

// ========== פעולות ==========

/** כניסה: מוצא/יוצר את הגיליון, ומחזיר את ההתקדמות כדי שהטלפון ימשיך מאיפה שעצר. */
function hello_(user) {
  const ss = withLock_(() => getOrCreateStudentSheet_(user));
  return { name: user.name, email: user.email, sheet_url: ss.getUrl(), units: readProgress_(ss) };
}

function saveStep_(user, body) {
  const unit = checkUnit_(body);
  const step = clampInt_(body.step, 0, 300);
  const ss = getOrCreateStudentSheet_(user);
  const sh = trackSheet_(ss, unit.track);
  const col = unitColumn_(sh, unit);
  const now = new Date();
  const total = clampInt_(body.steps_total, 0, 300) || Number(sh.getRange(ROWS.total, col).getValue()) || 0;
  const prevPercent = Number(sh.getRange(ROWS.percent, col).getValue()) || 0;
  const done = String(sh.getRange(ROWS.status, col).getValue()).indexOf('הושלם') === 0;
  const percent = total ? Math.max(prevPercent, Math.round((step / total) * 100)) : prevPercent;
  // יחידה שכבר הושלמה: חזרה לשלבים (לחזרה/רענון) לא מוחקת את הסיום, רק מעדכנת זמן
  setCol_(sh, col, done ? { updated: now } : {
    status: 'בתהליך', step: step, total: total, percent: percent, updated: now,
    started: sh.getRange(ROWS.started, col).getValue() ? null : now
  });
  // מספר דוקט/הצעה שנרשם באמצע היחידה (חלון החובה במדריך)
  const dk = String(body.docket == null ? '' : body.docket).replace(/[^\d]/g, '');
  if (/^\d{1,9}$/.test(dk)) {
    sh.getRange(ROWS.docket, col).setValue("'" + dk);
    upsertProgress_(user, unit, { docket: "'" + dk, updated: now });
  }
  updateRegistry_(user, ss, { unit: unit.title, step: total ? step + ' / ' + total : step, docket: /^\d{1,9}$/.test(dk) ? dk : null });
  upsertProgress_(user, unit, done ? { updated: now } : {
    status: 'בתהליך', step: step, total: total, percent: percent, updated: now
  });
  return { saved: true };
}

function complete_(user, body) {
  const unit = checkUnit_(body);
  // יחידות רקע (record = none) מסתיימות בלי מספר; כל השאר דורשות דוקט או מספר הצעת מחיר
  const docket = String(body.docket == null ? '' : body.docket).replace(/[^\d]/g, '');
  if (body.record !== 'none' && !/^\d{3,9}$/.test(docket)) throw new Error('מספר לא תקין (רק ספרות)');
  const total = clampInt_(body.steps_total, 0, 300);
  const ss = getOrCreateStudentSheet_(user);
  const sh = trackSheet_(ss, unit.track);
  const col = unitColumn_(sh, unit);
  const now = new Date();
  setCol_(sh, col, {
    status: 'הושלם ✓', step: total, total: total, percent: 100,
    docket: docket ? "'" + docket : null, note: String(body.note || '').slice(0, 500),
    updated: now, completed: now, started: sh.getRange(ROWS.started, col).getValue() ? null : now
  });
  sh.getRange(ROWS.status, col).setBackground('#dff3e7');
  updateRegistry_(user, ss, { unit: unit.title, step: 'הושלם', docket: docket || null });
  upsertProgress_(user, unit, {
    status: 'הושלם', step: total, total: total, percent: 100, docket: docket ? "'" + docket : '',
    note: String(body.note || '').slice(0, 500), updated: now, completed: now
  });
  return { saved: true, docket: docket };
}

// ========== גיליון התלמיד ==========

function getOrCreateStudentSheet_(user) {
  const props = PropertiesService.getScriptProperties();
  const key = 'sheet:' + user.email;
  const id = props.getProperty(key);
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (_) { /* נמחק — ניצור מחדש */ }
  }
  const ss = SpreadsheetApp.create('טרוול בוסטר — ' + user.name);
  const file = DriveApp.getFileById(ss.getId());
  file.moveTo(getFolder_());
  try { file.addViewer(user.email); } catch (_) { /* חשבון שלא ניתן לשתף איתו: הגיליון עדיין נשמר אצלך */ }

  const info = ss.getSheets()[0];
  info.setName('פרטים');
  info.setRightToLeft(true);
  info.getRange(1, 1, 5, 2).setValues([
    ['שם', user.name],
    ['מייל', user.email],
    ['נוצר', new Date()],
    ['המדריך', GUIDE_URL],
    ['מה יש כאן', 'לשונית לכל חלק למידה. כל עמודה היא יחידה, והיא מתעדכנת לבד כשמתקדמים במדריך בטלפון.']
  ]);
  info.getRange(1, 1, 5, 1).setFontWeight('bold');
  info.setColumnWidth(1, 110);
  info.setColumnWidth(2, 460);
  trackSheet_(ss, 'יסודות');
  trackSheet_(ss, 'FIT');
  trackSheet_(ss, 'קבוצות');

  props.setProperty(key, ss.getId());
  const reg = getRegistry_().getSheets()[0];
  reg.appendRow([user.name, user.email, ss.getUrl(), 0, '', '', '', new Date(), new Date()]);
  return ss;
}

/** לשונית לחלק למידה (FIT / קבוצות / תרגילים...). נוצרת בפעם הראשונה שצריך אותה. */
function trackSheet_(ss, track) {
  const name = String(track || 'FIT').replace(/[\[\]\*\?\/\\:]/g, '').slice(0, 30) || 'FIT';
  let sh = ss.getSheetByName(name);
  if (sh) return sh;
  sh = ss.insertSheet(name);
  sh.setRightToLeft(true);
  sh.getRange(1, 1, ROW_LABELS.length, 1).setValues(ROW_LABELS.map(l => [l])).setFontWeight('bold').setBackground('#f2eadc');
  sh.getRange(ROWS.title, 1, 1, 1).setBackground('#173d37').setFontColor('#ffffff');
  sh.setFrozenRows(ROWS.title);
  sh.setFrozenColumns(1);
  sh.hideRows(ROWS.id);
  sh.setColumnWidth(1, 120);
  return sh;
}

/** העמודה של היחידה (לפי המזהה בשורה המוסתרת). יחידה חדשה = עמודה חדשה בסוף. */
function unitColumn_(sh, unit) {
  const last = sh.getLastColumn();
  if (last > 1) {
    const ids = sh.getRange(ROWS.id, 2, 1, last - 1).getValues()[0];
    const i = ids.indexOf(unit.id);
    if (i !== -1) {
      const col = i + 2;
      if (unit.title && sh.getRange(ROWS.title, col).getValue() !== unit.title) sh.getRange(ROWS.title, col).setValue(unit.title);
      return col;
    }
  }
  const col = Math.max(2, last + 1);
  sh.getRange(ROWS.id, col).setValue(unit.id);
  sh.getRange(ROWS.title, col).setValue(unit.title || unit.id).setFontWeight('bold').setBackground('#173d37').setFontColor('#ffffff').setWrap(true);
  sh.getRange(ROWS.status, col).setValue('לא התחיל');
  sh.setColumnWidth(col, 150);
  sh.getRange(ROWS.started, col, 3, 1).setNumberFormat('dd/MM HH:mm');
  return col;
}

function setCol_(sh, col, fields) {
  Object.keys(fields).forEach(k => {
    if (fields[k] === null || fields[k] === undefined) return;
    sh.getRange(ROWS[k], col).setValue(fields[k]);
  });
}

/** ההתקדמות מכל הלשוניות, בשביל "להמשיך מאיפה שעצרת" בטלפון. */
function readProgress_(ss) {
  const units = {};
  ss.getSheets().forEach(sh => {
    if (sh.getName() === 'פרטים' || sh.getLastColumn() < 2) return;
    const v = sh.getRange(1, 2, ROW_LABELS.length, sh.getLastColumn() - 1).getValues();
    for (let c = 0; c < v[0].length; c++) {
      const id = v[ROWS.id - 1][c];
      if (!id) continue;
      units[id] = {
        unit_id: id,
        done: String(v[ROWS.status - 1][c]).indexOf('הושלם') === 0,
        step: Number(v[ROWS.step - 1][c]) || 0,
        steps_total: Number(v[ROWS.total - 1][c]) || 0,
        percent: Number(v[ROWS.percent - 1][c]) || 0,
        docket: String(v[ROWS.docket - 1][c] || '').replace(/^'/, ''),
        note: String(v[ROWS.note - 1][c] || '')
      };
    }
  });
  return units;
}

// ========== גיליון מרכזי ==========

function getFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('folderId');
  if (id) { try { return DriveApp.getFolderById(id); } catch (_) {} }
  const folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('folderId', folder.getId());
  return folder;
}

function getRegistry_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('registryId');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (_) {} }
  const ss = SpreadsheetApp.create(REGISTRY_NAME);
  DriveApp.getFileById(ss.getId()).moveTo(getFolder_());
  const sh = ss.getSheets()[0];
  sh.setName('תלמידים');
  sh.setRightToLeft(true);
  sh.getRange(1, 1, 1, REGISTRY_HEADERS.length).setValues([REGISTRY_HEADERS]).setFontWeight('bold').setBackground('#173d37').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  props.setProperty('registryId', ss.getId());
  return ss;
}

function updateRegistry_(user, ss, info) {
  const sh = getRegistry_().getSheets()[0];
  const last = sh.getLastRow();
  if (last < 2) return;
  const emails = sh.getRange(2, 2, last - 1, 1).getValues().map(r => String(r[0]).toLowerCase());
  const i = emails.indexOf(user.email);
  if (i === -1) return;
  const row = i + 2;
  const units = readProgress_(ss);
  const done = Object.keys(units).filter(k => units[k].done).length;
  sh.getRange(row, 4, 1, 2).setValues([[done, info.unit || '']]);
  sh.getRange(row, 6).setValue(info.step == null ? '' : String(info.step));
  if (info.docket) sh.getRange(row, 7).setValue("'" + info.docket);
  sh.getRange(row, 8).setValue(new Date());
}

// ========== התקדמות מרוכזת (לעמוד המורה) ==========

function progressSheet_() {
  const ss = getRegistry_();
  let sh = ss.getSheetByName(PROGRESS_TAB);
  if (sh) return sh;
  sh = ss.insertSheet(PROGRESS_TAB);
  sh.setRightToLeft(true);
  sh.getRange(1, 1, 1, PROGRESS_HEADERS.length).setValues([PROGRESS_HEADERS]).setFontWeight('bold').setBackground('#173d37').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  sh.getRange(2, P.started, 1000, 3).setNumberFormat('dd/MM HH:mm');
  return sh;
}

/** שורה אחת לכל תלמיד/ה × יחידה. מעדכן אם קיימת, אחרת מוסיף. */
function upsertProgress_(user, unit, fields) {
  const sh = progressSheet_();
  const last = sh.getLastRow();
  let row = -1;
  if (last >= 2) {
    const keys = sh.getRange(2, P.email, last - 1, P.id).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]).toLowerCase() === user.email && keys[i][P.id - 1] === unit.id) { row = i + 2; break; }
    }
  }
  if (row === -1) {
    row = Math.max(2, last + 1);
    sh.getRange(row, 1, 1, 5).setValues([[user.email, user.name, unit.id, unit.title, unit.track]]);
    if (!fields.started) fields.started = new Date();
  } else {
    sh.getRange(row, P.name).setValue(user.name);
    if (unit.title) sh.getRange(row, P.title).setValue(unit.title);
  }
  Object.keys(fields).forEach(k => {
    if (fields[k] === null || fields[k] === undefined || !P[k]) return;
    sh.getRange(row, P[k]).setValue(fields[k]);
  });
}

function isTeacher_(email) {
  const list = String(PropertiesService.getScriptProperties().getProperty('teachers') || '')
    .split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  let owner = '';
  try { owner = String(Session.getEffectiveUser().getEmail() || '').toLowerCase(); } catch (_) {}
  return email === owner || list.indexOf(email) !== -1;
}

/** עמוד המורה: כל התלמידים + שורת התקדמות לכל יחידה. */
function teacherSummary_(user) {
  if (!isTeacher_(user.email)) throw new Error('אין הרשאת מורה לחשבון הזה');
  const reg = getRegistry_();
  const st = reg.getSheets()[0];
  const students = st.getLastRow() < 2 ? [] : st.getRange(2, 1, st.getLastRow() - 1, REGISTRY_HEADERS.length).getValues()
    .filter(r => r[1])
    .map(r => ({ name: String(r[0]), email: String(r[1]).toLowerCase(), sheet_url: String(r[2]), created: iso_(r[8]) }));
  const ps = progressSheet_();
  const rows = ps.getLastRow() < 2 ? [] : ps.getRange(2, 1, ps.getLastRow() - 1, PROGRESS_HEADERS.length).getValues()
    .filter(r => r[0] && r[2])
    .map(r => ({
      email: String(r[P.email - 1]).toLowerCase(), unit_id: String(r[P.id - 1]), title: String(r[P.title - 1]),
      track: String(r[P.track - 1]), done: String(r[P.status - 1]).indexOf('הושלם') === 0,
      step: Number(r[P.step - 1]) || 0, steps_total: Number(r[P.total - 1]) || 0, percent: Number(r[P.percent - 1]) || 0,
      docket: String(r[P.docket - 1] || '').replace(/^'/, ''), note: String(r[P.note - 1] || ''),
      started_at: iso_(r[P.started - 1]), updated_at: iso_(r[P.updated - 1]), completed_at: iso_(r[P.completed - 1])
    }));
  return { now: new Date().toISOString(), registry_url: reg.getUrl(), students: students, progress: rows };
}

function iso_(v) { return v instanceof Date ? v.toISOString() : (v ? String(v) : ''); }

// ========== עזרים ==========

function checkUnit_(body) {
  const id = String(body.unit_id || '');
  if (!UNIT_ID_RE.test(id)) throw new Error('יחידה לא מוכרת');
  return {
    id: id,
    title: String(body.unit_title || id).slice(0, 80),
    track: String(body.track_title || 'FIT').slice(0, 30)
  };
}

function clampInt_(v, min, max) {
  const n = Math.round(Number(v) || 0);
  return Math.max(min, Math.min(max, n));
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ========== בוט העזרה ==========
// Script Properties:
//   gemini_key   — מפתח מ-Google AI Studio (חובה)
//   gemini_model — לא חובה. ברירת מחדל: gemini-flash-latest (תמיד הגרסה העדכנית של Flash)
//   bot_daily    — לא חובה. כמה שאלות לתלמיד/ה ביום. ברירת מחדל: 40
//   bot_off      — לא חובה. כתבו 1 כדי לכבות את הבוט (למשל ביום בחינה)
// כל שאלה נרשמת בגיליון המרכזי, בלשונית "שאלות לבוט".

const BOT_CONTEXT_URL = 'https://nisan1234-afk.github.io/tb2/bot-context.json';
const BOT_TAB = 'שאלות לבוט';
const BOT_HEADERS = ['זמן', 'מייל', 'שם', 'יחידה', 'שלב', 'שאלה', 'צילום', 'תשובה', 'קישורים'];
const BOT_TRACKS = { BASE: 'יסודות', FIT: 'FIT', GRP: 'קבוצות', MID: 'מידענות' };

function askBot_(user, body) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('bot_off') === '1') throw new Error('הבוט כבוי כרגע. שאלו את המורה.');
  const key = props.getProperty('gemini_key');
  if (!key) throw new Error('הבוט עוד לא הוגדר (חסר מפתח). ספרו למורה.');

  const question = String(body.question || '').trim().slice(0, 1500);
  const image = body.image && typeof body.image === 'object' ? body.image : null;
  if (image && (!/^image\/(jpeg|png|webp)$/.test(String(image.mime)) || String(image.data || '').length > 4000000)) throw new Error('הצילום לא נתמך או גדול מדי');
  if (!question && !image) throw new Error('כתבו שאלה או צרפו צילום מסך');

  // מגבלה יומית לכל תלמיד/ה
  const daily = Number(props.getProperty('bot_daily')) || 40;
  const cache = CacheService.getScriptCache();
  const today = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyyMMdd');
  const countKey = 'botn:' + today + ':' + user.email;
  const used = Number(cache.get(countKey)) || 0;
  if (used >= daily && !isTeacher_(user.email)) throw new Error('הגעתם למספר השאלות להיום (' + daily + '). שאלו את המורה, או נסו מחר.');
  cache.put(countKey, String(used + 1), 6 * 3600);

  const ctx = botContext_();
  const here = botLocate_(ctx, body.unit_id, body.step);
  const system = botPrompt_(ctx, here);

  // היסטוריה קצרה מהשיחה (טקסט בלבד)
  const contents = [];
  (Array.isArray(body.history) ? body.history.slice(-6) : []).forEach(h => {
    const text = String(h && h.text || '').slice(0, 1500);
    if (!text) return;
    const role = h.role === 'bot' ? 'model' : 'user';
    const prev = contents[contents.length - 1];
    if (!prev && role === 'model') return; // השיחה מתחילה תמיד בתלמיד/ה
    if (prev && prev.role === role) prev.parts[0].text += '\n' + text; // שתי הודעות רצופות מאותו צד = אחת
    else contents.push({ role: role, parts: [{ text: text }] });
  });
  if (contents.length && contents[contents.length - 1].role === 'user') contents.pop(); // שאלה קודמת בלי תשובה
  const parts = [];
  if (image) parts.push({ inline_data: { mime_type: image.mime, data: String(image.data) } });
  parts.push({ text: (here.unit ? '[התלמיד/ה נמצא/ת עכשיו במדריך ביחידה ' + here.unit.id + (here.step ? ', שלב ' + here.step : '') + ']\n' : '') +
    (question || 'מה רואים בצילום, ומה עושים עכשיו?') });
  contents.push({ role: 'user', parts: parts });

  const model = props.getProperty('gemini_model') || 'gemini-flash-latest';
  const res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': key },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            answer: { type: 'STRING' },
            links: { type: 'ARRAY', items: { type: 'OBJECT', properties: { unit: { type: 'STRING' }, step: { type: 'INTEGER' } }, required: ['unit', 'step'] } }
          },
          required: ['answer']
        }
      }
    })
  });
  const code = res.getResponseCode();
  if (code === 429) throw new Error('הבוט עמוס עכשיו. נסו שוב בעוד דקה.');
  if (code !== 200) {
    console.error('Gemini ' + code + ': ' + res.getContentText().slice(0, 500));
    throw new Error('הבוט לא הצליח לענות (' + code + '). נסו שוב.');
  }
  const out = JSON.parse(res.getContentText());
  const cand = out.candidates && out.candidates[0];
  const raw = cand && cand.content && cand.content.parts ? cand.content.parts.map(p => p.text || '').join('') : '';
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch (_) { parsed = { answer: raw, links: [] }; }
  const answer = String(parsed.answer || '').trim() || 'לא הצלחתי לענות על זה. נסו לנסח אחרת, או שאלו את המורה.';

  // רק קישורים לשלבים שקיימים באמת
  const links = [];
  (parsed.links || []).forEach(l => {
    const u = ctx.units.find(x => x.id === String(l.unit));
    const n = Math.round(Number(l.step) || 0);
    if (!u || n < 0 || n > u.steps.length || links.length >= 3) return;
    if (links.some(x => x.unit === u.id && x.step === n)) return;
    links.push({ unit: u.id, step: n, label: u.title + (n ? ' · שלב ' + n + ': ' + u.steps[n - 1].t : '') });
  });

  try { botLog_(user, here, question, !!image, answer, links); } catch (err) { console.error(err); }
  return { answer: answer, links: links, left: Math.max(0, daily - used - 1) };
}

/** הקשר הבוט מהאתר (bot-context.json), במטמון לשעה. נשמר בחלקים כי לכל ערך במטמון יש תקרה. */
function botContext_() {
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get('botctx:n')) || 0;
  if (n) {
    const keys = []; for (let i = 0; i < n; i++) keys.push('botctx:' + i);
    const got = cache.getAll(keys);
    if (keys.every(k => got[k] != null)) {
      try { return JSON.parse(keys.map(k => got[k]).join('')); } catch (_) {}
    }
  }
  const res = UrlFetchApp.fetch(BOT_CONTEXT_URL + '?t=' + Date.now(), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('לא הצלחתי לטעון את חומר המדריך לבוט');
  const text = res.getContentText('UTF-8');
  const ctx = JSON.parse(text);
  const SIZE = 30000, chunks = {};
  for (let i = 0; i * SIZE < text.length; i++) chunks['botctx:' + i] = text.slice(i * SIZE, (i + 1) * SIZE);
  const count = Object.keys(chunks).length;
  try { cache.putAll(chunks, 3600); cache.put('botctx:n', String(count), 3600); } catch (_) {}
  return ctx;
}

function botLocate_(ctx, unitId, step) {
  const unit = ctx.units.find(u => u.id === String(unitId || '')) || null;
  const n = unit ? Math.round(Number(step) || 0) : 0;
  return { unit: unit, step: unit && n >= 1 && n <= unit.steps.length ? n : 0 };
}

/** ההנחיה לבוט: כללים + בסיס ידע + מפת כל השלבים + טקסט מלא של החלק שבו התלמיד/ה נמצא/ת. */
function botPrompt_(ctx, here) {
  const track = here.unit ? here.unit.track : '';
  const lines = [];
  lines.push(
    'אתה "העוזר של טרוול בוסטר": עוזר לתלמידי י"ב במגמת תיירות שמתרגלים את מערכת Travel Booster לקראת הבגרות.',
    'התלמיד/ה עובד/ת במחשב בטרוול בוסטר, ושואל/ת אותך מהטלפון. לפעמים יש צילום מסך מהמחשב או מהטלפון.',
    '',
    'כללים:',
    '1. עונים בעברית פשוטה, קצר: 2–6 שורות. צעד-צעד כשצריך, עם מספור.',
    '2. שמות של כפתורים, שדות וחלונות באנגלית כותבים בדיוק כמו במערכת, ועוטפים בסוגריים כפולים: [[Add Services]], [[Report and Confirm]].',
    '3. כשיש צילום: קודם אומרים בקצרה מה רואים בו (איזה מסך, מה מסומן, הודעת שגיאה), ורק אז מה עושים עכשיו. אם הצילום לא ברור, מבקשים צילום קרוב יותר.',
    '4. מסתמכים רק על החומר למטה. אם אין בו תשובה, אומרים שלא בטוחים וממליצים לשאול את המורה. לא ממציאים מסכים או כפתורים.',
    '5. לא פותרים במקום התלמיד/ה תרגיל שלם ולא נותנים מחירים או תשובות סופיות לתרגיל. מסבירים את הדרך ומכוונים לשלב במדריך.',
    '6. בשדה links מחזירים 0–3 קישורים לשלבים במדריך שמסבירים בדיוק את הנושא: unit = מזהה היחידה מהמפה, step = מספר השלב (0 = פתיחת היחידה). רק מזהים ומספרים שמופיעים במפה.',
    '7. שאלות שלא קשורות לטרוול בוסטר, לבין הרים או לבגרות בתיירות: עונים בנימוס שאתה עוזר רק בזה.',
    '',
    '=== בסיס ידע ===',
    ctx.kb,
    '',
    '=== מפת המדריך (מזהה יחידה | כותרת | שלבים) ==='
  );
  ctx.units.forEach(u => {
    lines.push(u.id + ' | ' + (BOT_TRACKS[u.track] || u.track) + ' · ' + u.title + ' | ' + u.steps.map((s, i) => (i + 1) + '. ' + s.t).join(' ; '));
  });
  const full = ctx.units.filter(u => u.track === 'BASE' || (track && u.track === track));
  lines.push('', '=== הטקסט המלא של השלבים' + (track ? ' (' + (BOT_TRACKS[track] || track) + ' ויסודות)' : ' (יסודות)') + ' ===');
  full.forEach(u => {
    lines.push('', '## ' + u.id + ' — ' + u.title, 'מטרה: ' + u.goal);
    u.steps.forEach((s, i) => lines.push((i + 1) + '. ' + s.t + ': ' + s.x));
  });
  if (here.unit) lines.push('', 'התלמיד/ה נמצא/ת עכשיו ביחידה ' + here.unit.id + ' (' + here.unit.title + ')' +
    (here.step ? ', שלב ' + here.step + ': ' + here.unit.steps[here.step - 1].t : '') + '. כנראה שהשאלה קשורה לזה.');
  return lines.join('\n');
}

function botLog_(user, here, question, hadImage, answer, links) {
  const ss = getRegistry_();
  let sh = ss.getSheetByName(BOT_TAB);
  if (!sh) {
    sh = ss.insertSheet(BOT_TAB);
    sh.setRightToLeft(true);
    sh.getRange(1, 1, 1, BOT_HEADERS.length).setValues([BOT_HEADERS]).setFontWeight('bold').setBackground('#173d37').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.setColumnWidth(6, 280);
    sh.setColumnWidth(8, 380);
  }
  sh.appendRow([new Date(), user.email, user.name, here.unit ? here.unit.title : '', here.step || '',
    question, hadImage ? 'כן' : '', answer.slice(0, 2000), links.map(l => l.label).join(' | ')]);
}
