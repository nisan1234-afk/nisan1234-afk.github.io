/**
 * טרוול בוסטר צעד-צעד — שרת עצמאי (לא קשור לכיתה פלוס).
 *
 * מה הוא עושה:
 *  - תלמיד/ה נכנס/ת למדריך בטלפון עם גוגל. השרת מאמת את הכניסה מול גוגל.
 *  - בכניסה הראשונה נוצר לתלמיד/ה גיליון Google Sheets אישי בתיקייה שלך בדרייב,
 *    והוא משותף איתו/ה לצפייה.
 *  - בגיליון: לשונית לכל חלק למידה (FIT, קבוצות, ...), ועמודה לכל יחידה.
 *    כל מעבר שלב בטלפון מעדכן את העמודה; בסוף יחידה נכתב מספר הדוקט.
 *  - בנוסף יש גיליון מרכזי אחד ("כל התלמידים") עם שורה לכל תלמיד/ה וקישור לגיליון שלו/ה.
 *
 * התקנה: ר' tb/apps-script/README.md (העתקה של הקובץ הזה, הרצה אחת של setup, ופריסה).
 * הכול נוצר אוטומטית בדרייב של מי שמריץ את הסקריפט. אין צורך לערוך כלום בקובץ.
 */

const CLIENT_ID = '988232727899-pajp4mhs43tet1phcu3rc8c8mutsgpme.apps.googleusercontent.com';
const GUIDE_URL = 'https://nisan1234-afk.github.io/tb/';
const FOLDER_NAME = 'טרוול בוסטר — גיליונות תלמידים';
const REGISTRY_NAME = 'טרוול בוסטר — כל התלמידים';
const UNIT_ID_RE = /^(fit|grp|ex)-[a-z0-9-]{2,40}$/;

// שורות בכל לשונית חלק-למידה. שורה 1 מוסתרת ומחזיקה את מזהה היחידה (כך אפשר לשנות כותרת בלי לשבור).
const ROWS = {
  id: 1, title: 2, status: 3, step: 4, total: 5, percent: 6, docket: 7, note: 8,
  started: 9, updated: 10, completed: 11
};
const ROW_LABELS = ['unit_id', 'יחידה', 'סטטוס', 'שלב נוכחי', 'מתוך', 'התקדמות %', 'מספר דוקט', 'הערה שלי',
  'התחלתי', 'עדכון אחרון', 'סיימתי'];
const REGISTRY_HEADERS = ['שם', 'מייל', 'הגיליון', 'יחידות שהושלמו', 'יחידה אחרונה', 'שלב', 'דוקט אחרון', 'עדכון אחרון', 'נוצר'];

// ========== נקודת כניסה ==========

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const user = verifyGoogleToken_(body.token);
    const handlers = {
      hello: () => hello_(user),
      step: () => withLock_(() => saveStep_(user, body)),
      complete: () => withLock_(() => complete_(user, body))
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
  updateRegistry_(user, ss, { unit: unit.title, step: total ? step + ' / ' + total : step });
  return { saved: true };
}

function complete_(user, body) {
  const unit = checkUnit_(body);
  const docket = String(body.docket == null ? '' : body.docket).replace(/[^\d]/g, '');
  if (!/^\d{3,9}$/.test(docket)) throw new Error('מספר דוקט לא תקין (רק ספרות)');
  const total = clampInt_(body.steps_total, 0, 300);
  const ss = getOrCreateStudentSheet_(user);
  const sh = trackSheet_(ss, unit.track);
  const col = unitColumn_(sh, unit);
  const now = new Date();
  setCol_(sh, col, {
    status: 'הושלם ✓', step: total, total: total, percent: 100,
    docket: "'" + docket, note: String(body.note || '').slice(0, 500),
    updated: now, completed: now, started: sh.getRange(ROWS.started, col).getValue() ? null : now
  });
  sh.getRange(ROWS.status, col).setBackground('#dff3e7');
  updateRegistry_(user, ss, { unit: unit.title, step: 'הושלם', docket: docket });
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
