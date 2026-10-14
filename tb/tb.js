/* טרוול בוסטר צעד-צעד: מדריך לטלפון שמונח ליד המחשב. עצמאי, בלי כיתה פלוס.
 * כניסה עם גוגל; כל תלמיד/ה מקבל/ת גיליון Google Sheets אישי (נוצר בשרת, tb/apps-script/Code.gs),
 * עם לשונית לכל חלק למידה ועמודה לכל יחידה. כל מעבר שלב מתעדכן שם.
 * מסלול: #  = רשימת יחידות | #u/<unit>/<i> = מסך בתוך יחידה (0 = פתיחה, 1..n = שלבים, n+1 = סיום ומספר דוקט). */
(function () {
  'use strict';
  var CFG = window.TB_CONFIG || {};
  var API = CFG.api || '';
  var TRACK_TITLES = { BASE: 'יסודות', FIT: 'FIT', GRP: 'קבוצות', EX: 'תרגילים' };
  var TRACK_LABELS = { BASE: 'יסודות · לפני שמתחילים', FIT: 'FIT · לקוח פרטי', GRP: 'קבוצות · הצעת מחיר ודוקט', EX: 'תרגילים' };
  var RECORD_LABEL = { docket: 'מספר הדוקט', proposal: 'מספר הצעת המחיר' };
  var UNITS = window.TB_UNITS || [];
  var app = document.getElementById('tbApp');
  var syncEl = document.getElementById('tbSync');
  var sheetLink = document.getElementById('tbSheet');

  var auth = null; // {token, exp, name, email}
  try { auth = JSON.parse(sessionStorage.getItem('tbAuth') || 'null'); } catch (_) {}
  var progress = {}; // unit_id -> התקדמות מהגיליון
  var loaded = false;
  var loadError = '';
  var pendingStep = null; // שמירת שלב שנכשלה, לניסיון חוזר

  // ---------- עזרים ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // [[Term]] -> צ׳יפ באנגלית משמאל לימין, כך שהעברית מסביב לא מתהפכת
  function rich(s) {
    return esc(s).replace(/\[\[(.+?)\]\]/g, '<bdi class="term" dir="ltr">$1</bdi>');
  }
  function unitById(id) {
    for (var i = 0; i < UNITS.length; i++) if (UNITS[i].id === id) return UNITS[i];
    return null;
  }
  function store(key, val) {
    try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(val)); } catch (_) { return null; }
  }
  function setSync(text, bad) {
    if (!text) { syncEl.hidden = true; return; }
    syncEl.hidden = false;
    syncEl.textContent = text;
    syncEl.classList.toggle('bad', !!bad);
  }

  // ---------- כניסה עם גוגל ----------
  function tokenValid() { return auth && auth.token && auth.exp * 1000 > Date.now() + 60000; }
  function decodeJwt(t) {
    try {
      var p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (p.length % 4) p += '=';
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    } catch (_) { return {}; }
  }
  function onGoogle(resp) {
    var info = decodeJwt(resp.credential);
    auth = { token: resp.credential, exp: info.exp || 0, name: info.name || info.email || '', email: info.email || '' };
    try { sessionStorage.setItem('tbAuth', JSON.stringify(auth)); } catch (_) {}
    start();
  }
  var gisReady = false;
  function withGis(fn) {
    if (window.google && google.accounts && google.accounts.id) {
      if (!gisReady) {
        google.accounts.id.initialize({ client_id: CFG.clientId, callback: onGoogle, auto_select: true, use_fedcm_for_prompt: true });
        gisReady = true;
      }
      fn();
    } else setTimeout(function () { withGis(fn); }, 250);
  }
  function showLogin(reason) {
    keepAwake(false);
    app.innerHTML = '<section class="tb-card tb-login"><div class="big">✈️</div><h2>טרוול בוסטר צעד-צעד</h2>' +
      '<p class="tb-text">' + esc(reason || 'נכנסים עם חשבון הגוגל שלכם. ההתקדמות נשמרת בגיליון אישי שנפתח לכם בדרייב.') + '</p>' +
      '<div id="tbGoogleBtn" class="tb-gbtn"></div></section>';
    withGis(function () {
      google.accounts.id.renderButton(document.getElementById('tbGoogleBtn'), { theme: 'filled_blue', size: 'large', text: 'signin_with', locale: 'he', width: 280 });
      google.accounts.id.prompt();
    });
  }
  function needLogin(msg) {
    auth = null;
    try { sessionStorage.removeItem('tbAuth'); } catch (_) {}
    showLogin(msg);
  }

  function api(action, params) {
    if (!tokenValid()) return Promise.reject(new Error('LOGIN'));
    var body = { action: action, token: auth.token };
    for (var k in params) body[k] = params[k];
    return fetch(API, { method: 'POST', body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok && /הכניסה פגה|צריך להיכנס/.test(d.error || '')) {
          if (auth) auth.exp = 0; // השרת דחה את הטוקן: מכאן מבקשים כניסה מחדש
          throw new Error('LOGIN');
        }
        if (!d.ok) throw new Error(d.error || 'שגיאה');
        return d.data;
      });
  }

  function saveStep(unit, step) {
    var p = progress[unit.id] || (progress[unit.id] = { unit_id: unit.id, step: 0, percent: 0, steps_total: unit.steps.length });
    if (!p.done) {
      p.step = step;
      p.percent = Math.max(p.percent || 0, Math.round((step / unit.steps.length) * 100));
    }
    p.steps_total = unit.steps.length;
    store('tbLast', { unit: unit.id, i: step });
    pendingStep = unitPayload(unit, { step: step });
    flushStep();
  }
  function flushStep() {
    if (!pendingStep) return;
    if (!tokenValid()) { setSync('הכניסה פגה, לחצו להתחבר', true); return; }
    var sending = pendingStep;
    api('step', sending).then(function () {
      if (pendingStep === sending) pendingStep = null;
      setSync('');
    }).catch(function (err) {
      setSync(err.message === 'LOGIN' ? 'הכניסה פגה, לחצו להתחבר' : 'לא נשמר, ננסה שוב', true);
    });
  }
  setInterval(flushStep, 20000);
  // לחיצה על "הכניסה פגה" מחזירה למסך הכניסה, ואחרי הכניסה ממשיכים מאותו מקום (ה-hash נשמר)
  syncEl.addEventListener('click', function () { if (!tokenValid()) needLogin('הכניסה פגה. נכנסים שוב וממשיכים מאותו שלב.'); });
  function unitPayload(unit, extra) {
    var o = { unit_id: unit.id, unit_title: unit.title, track_title: TRACK_TITLES[unit.track] || unit.track, steps_total: unit.steps.length };
    for (var k in extra) o[k] = extra[k];
    return o;
  }

  // ---------- מסך מלא: נעילת מסך דלוק בזמן עבודה ----------
  var wakeLock = null;
  function keepAwake(on) {
    if (!('wakeLock' in navigator)) return;
    if (on && !wakeLock) {
      navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; w.addEventListener('release', function () { wakeLock = null; }); }).catch(function () {});
    } else if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && /^#u\//.test(location.hash)) keepAwake(true);
  });

  // ---------- תצוגות ----------
  function statusOf(unit) {
    var p = progress[unit.id];
    if (!p) return { label: 'עוד לא התחלת', pct: 0 };
    if (p.done) return { label: 'הושלמה ✓' + (p.docket ? (unit.record === 'proposal' ? ' · הצעה ' : ' · דוקט ') + '<bdi>' + esc(p.docket) + '</bdi>' : ''), pct: 100, p: p };
    var n = unit.steps ? unit.steps.length : p.steps_total || 1;
    var at = Math.min(p.step || 0, n);
    return { label: 'בשלב ' + at + ' מתוך ' + n, pct: p.percent || 0, p: p };
  }

  function renderHome() {
    keepAwake(false);
    var html = '<section class="tb-hello"><h1>שלום' + (auth && auth.name ? ' ' + esc(auth.name.split(' ')[0]) : '') + '</h1>' +
      '<p>הטלפון ליד המחשב: כאן רואים מה לעשות בכל שלב, ובמחשב עושים את זה בטרוול בוסטר. לוחצים על צילום כדי להגדיל אותו. ההתקדמות נשמרת בגיליון האישי שלכם.</p></section>';
    if (loadError) html += '<p class="tb-error">' + esc(loadError) + '</p>';

    var last = store('tbLast');
    var lastUnit = last && unitById(last.unit);
    if (lastUnit && !lastUnit.soon && !(progress[lastUnit.id] && progress[lastUnit.id].done)) {
      html += '<div class="tb-resume"><span>להמשיך מאיפה שעצרת?<br><b>' + esc(lastUnit.title) + '</b></span>' +
        '<a class="btn btn-primary" href="#u/' + lastUnit.id + '/' + (last.i || 0) + '">המשך</a></div>';
    }

    var tracks = {};
    UNITS.forEach(function (u) { (tracks[u.track] = tracks[u.track] || []).push(u); });
    Object.keys(tracks).forEach(function (t) {
      html += '<div class="tb-track">' + (TRACK_LABELS[t] || t) + '</div><ul class="tb-units">';
      tracks[t].forEach(function (u) {
        if (u.soon) {
          html += '<li><button class="tb-unit" disabled><span class="ic">' + u.icon + '</span><span><b>' + esc(u.title) + '</b><small>בקרוב</small></span><span></span></button></li>';
          return;
        }
        var s = statusOf(u);
        html += '<li><button class="tb-unit" data-open="' + u.id + '"><span class="ic">' + u.icon + '</span><span><b>' + esc(u.title) + '</b><small>' + s.label + '</small>' +
          '<span class="tb-meter"><i style="width:' + s.pct + '%"></i></span></span><span class="go">←</span></button></li>';
      });
      html += '</ul>';
    });
    app.innerHTML = html;
    app.querySelectorAll('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        var u = unitById(b.getAttribute('data-open'));
        var p = progress[u.id];
        var i = p && !p.done && p.step ? p.step : 0;
        location.hash = 'u/' + u.id + '/' + i;
      });
    });
    window.scrollTo(0, 0);
  }

  // תצוגה ממוקדת: בטלפון צילום רחב קטן מדי לקריאה, אז מראים רק את האזור סביב ההדגשות
  // (אם כולן קרובות זו לזו). נגיעה מגדילה את הצילום המלא.
  function focusBox(hl) {
    if (!hl || !hl.length) return null;
    var x0 = 100, y0 = 100, x1 = 0, y1 = 0;
    hl.forEach(function (h) { x0 = Math.min(x0, h[0]); y0 = Math.min(y0, h[1]); x1 = Math.max(x1, h[0] + h[2]); y1 = Math.max(y1, h[1] + h[3]); });
    var padX = 10, padY = 14;
    x0 = Math.max(0, x0 - padX); x1 = Math.min(100, x1 + padX);
    y0 = Math.max(0, y0 - padY); y1 = Math.min(100, y1 + padY);
    if (x1 - x0 > 72) return null; // ההדגשות פרושות על כל הרוחב, אין טעם לחתוך
    return [x0, y0, x1 - x0, y1 - y0];
  }
  function stageHtml(step, box) {
    var hls = (step.hl || []).map(function (h) {
      return '<span class="hl" style="left:' + h[0] + '%;top:' + h[1] + '%;width:' + h[2] + '%;height:' + h[3] + '%"></span>';
    }).join('');
    var st = box ? ' style="width:' + (10000 / box[2]) + '%;height:' + (10000 / box[3]) + '%;left:' + (-box[0] * 100 / box[2]) + '%;top:' + (-box[1] * 100 / box[3]) + '%"' : '';
    return '<div class="tb-stage' + (box ? ' cropped' : '') + '"' + st + '><img src="img/' + esc(step.img) + '.webp" alt="צילום מסך: ' + esc(step.title) + '">' + hls + '</div>';
  }
  function shotHtml(step) {
    if (!step.img) return '';
    var box = focusBox(step.hl);
    return '<figure style="margin:12px 0 0"><div class="tb-shot' + (box ? ' is-cropped' : '') + '" data-zoom role="button" tabindex="0" aria-label="הגדלת הצילום"' +
      (box ? ' data-box="' + box.join(',') + '"' : '') + '>' + stageHtml(step, box) + '</div>' +
      '<small class="tb-shot-hint">' + (box ? 'מוצג רק האזור החשוב · נגיעה מראה את כל המסך' : 'הסימון הכתום = איפה לוחצים · נגיעה מגדילה') + '</small></figure>';
  }
  // גובה התצוגה הממוקדת נקבע לפי יחס התמונה, שידוע רק אחרי טעינה
  function sizeCrops() {
    app.querySelectorAll('.tb-shot.is-cropped').forEach(function (el) {
      var img = el.querySelector('img');
      var box = el.getAttribute('data-box').split(',').map(Number);
      var set = function () {
        if (!img.naturalWidth) return;
        el.style.aspectRatio = (img.naturalWidth * box[2]) / (img.naturalHeight * box[3]);
      };
      if (img.complete) set(); else img.addEventListener('load', set);
    });
  }

  function headHtml(unit, i) {
    var n = unit.steps.length;
    var label = i === 0 ? 'פתיחה' : i === n + 1 ? 'בדיקה ושאלות בוחן' : i > n ? 'סיום' : 'שלב ' + i + ' מתוך ' + n;
    var pct = Math.round((Math.min(i, n) / n) * 100);
    return '<div class="tb-head"><a class="btn btn-ghost" href="#" aria-label="לרשימת היחידות">→</a><div class="t"><small>' + unit.icon + ' ' + esc(unit.title) + '</small><b>' + label + '</b></div></div>' +
      '<div class="tb-progress"><i style="width:' + pct + '%"></i></div>';
  }

  function navHtml(prevHref, nextLabel, nextHref) {
    return '<nav class="tb-nav">' +
      (prevHref ? '<a class="btn" href="' + prevHref + '">הקודם</a>' : '<span></span>') +
      '<a class="btn btn-primary" href="' + nextHref + '" data-next>' + nextLabel + '</a></nav>';
  }

  function beforeHtml(unit) {
    if (!unit.before || !unit.before.length) return '';
    return '<h3 class="tb-sub">📘 לפני שמתחילים</h3><div class="tb-before">' + unit.before.map(function (b) {
      return '<div class="tb-concept"><b>' + rich(/[a-zA-Z]/.test(b.term) && !/[\u0590-\u05FF]/.test(b.term) ? '[[' + b.term + ']]' : b.term) + '</b><p>' + rich(b.text) + '</p></div>';
    }).join('') + '</div>';
  }
  // אחרי השלבים: רשימת בדיקה לפני שקוראים לבוחן + שאלות בעל פה (לוחצים כדי לראות תשובה)
  function reviewHtml(unit) {
    var h = '<article class="tb-card"><h2>✅ לפני שקוראים לבוחן</h2>';
    if (unit.check && unit.check.length) {
      h += '<ul class="tb-check">' + unit.check.map(function (c, k) {
        return '<li><label><input type="checkbox" data-chk="' + k + '"> <span>' + rich(c) + '</span></label></li>';
      }).join('') + '</ul>';
    }
    h += '</article>';
    if (unit.oral && unit.oral.length) {
      h += '<article class="tb-card" style="margin-top:14px"><h2>🗣️ שאלות שהבוחן עשוי לשאול</h2><p class="tb-text" style="margin-top:0">עונים בקול, ורק אז פותחים את התשובה.</p>' +
        unit.oral.map(function (o) {
          return '<details class="tb-oral"><summary>' + rich(o.q) + '</summary><p>' + rich(o.a) + '</p></details>';
        }).join('') + '</article>';
    }
    return h;
  }

  function renderUnit(unit, i) {
    keepAwake(true);
    var n = unit.steps.length;
    var base = '#u/' + unit.id + '/';
    var html = headHtml(unit, i);
    if (i === 0) {
      html += '<article class="tb-card tb-intro"><h2>' + unit.icon + ' ' + esc(unit.title) + '</h2>' +
        '<p><b>מה עושים:</b> ' + rich(unit.goal) + '</p><div class="tb-why"><b>💡 למה זה חשוב</b>' + rich(unit.why) + '</div>' +
        beforeHtml(unit) +
        '<p style="margin-bottom:0">' + n + ' שלבים. בכל שלב: קוראים, עושים במחשב, ולוחצים "עשיתי".</p></article>';
      html += navHtml('', 'מתחילים', base + '1');
    } else if (i <= n) {
      var s = unit.steps[i - 1];
      currentStep = s;
      html += '<article class="tb-card"><h2><span class="num">' + i + '</span>' + esc(s.title) + '</h2>' +
        shotHtml(s) + '<p class="tb-text">' + rich(s.text) + '</p>' +
        (s.trap ? '<div class="tb-trap"><b>⚠️ מלכודת</b>' + rich(s.trap) + '</div>' : '') +
        (s.why ? '<div class="tb-why"><b>💡 למה</b>' + rich(s.why) + '</div>' : '') + '</article>';
      html += navHtml(base + (i - 1), i === n ? 'עשיתי ✓ לבדיקה' : 'עשיתי ✓ הבא', base + (i + 1));
    } else if (i === n + 1) {
      html += reviewHtml(unit);
      html += navHtml(base + n, 'לסיום היחידה', base + (n + 2));
    } else {
      html += renderCheckpoint(unit);
    }
    app.innerHTML = html;
    if (i >= 1 && i <= n) saveStep(unit, i);
    if (i > n + 1) wireCheckpoint(unit);
    sizeCrops();
    app.querySelectorAll('[data-zoom]').forEach(function (el) {
      el.addEventListener('click', function () { openZoom(el); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') openZoom(el); });
    });
    window.scrollTo(0, 0);
  }

  function renderCheckpoint(unit) {
    var p = progress[unit.id] || {};
    var back = '<nav class="tb-nav"><a class="btn" href="#u/' + unit.id + '/' + (unit.steps.length + 1) + '">הקודם</a><a class="btn" href="#">לרשימה</a></nav>';
    if (unit.record === 'none') {
      return '<article class="tb-card"><h2>🏁 סיום היחידה</h2><p class="tb-text">עברתם על כל השלבים. לחיצה על הכפתור מסמנת את היחידה כהושלמה בגיליון שלכם.</p>' +
        '<form class="tb-form" id="tbDone" novalidate><label for="tbNote">משהו היה לא ברור? (לא חובה)</label><textarea id="tbNote" rows="3" maxlength="500">' + esc(p.note || '') + '</textarea>' +
        '<p class="msg" id="tbMsg"></p><button class="btn btn-primary" style="width:100%" type="submit">סיימתי את היחידה</button></form></article>' + back;
    }
    var label = RECORD_LABEL[unit.record] || 'מספר הדוקט';
    return '<article class="tb-card"><h2>🏁 סיום: ' + label + '</h2>' +
      '<p class="tb-text">מקלידים את ' + label + ' מטרוול בוסטר. הוא נשמר בגיליון שלכם, בעמודה של היחידה.</p>' +
      '<form class="tb-form" id="tbDone" novalidate>' +
      '<label for="tbDocket">' + label + '</label><input id="tbDocket" inputmode="numeric" autocomplete="off" maxlength="9" placeholder="152843" value="' + esc(p.docket || '') + '">' +
      '<label for="tbNote">משהו היה לא ברור? (לא חובה)</label><textarea id="tbNote" rows="3" maxlength="500">' + esc(p.note || '') + '</textarea>' +
      '<p class="msg" id="tbMsg"></p><button class="btn btn-primary" style="width:100%" type="submit">שמירה וסיום</button></form></article>' + back;
  }

  function wireCheckpoint(unit) {
    var form = document.getElementById('tbDone');
    var input = document.getElementById('tbDocket');
    var msg = document.getElementById('tbMsg');
    if (input) input.addEventListener('input', function () { input.value = input.value.replace(/[^\d]/g, ''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var docket = input ? input.value.trim() : '';
      if (input && !/^\d{3,9}$/.test(docket)) { msg.textContent = 'רק ספרות (למשל 152843).'; input.focus(); return; }
      var note = document.getElementById('tbNote').value.trim();
      var btn = form.querySelector('button');
      btn.disabled = true;
      msg.textContent = '';
      var done = function () {
        progress[unit.id] = Object.assign(progress[unit.id] || {}, { unit_id: unit.id, done: true, docket: docket, note: note, step: unit.steps.length, percent: 100, steps_total: unit.steps.length });
        store('tbLast', null);
        renderDone(unit, docket);
      };
      api('complete', unitPayload(unit, { docket: docket, note: note, record: unit.record }))
        .then(done)
        .catch(function (err) {
          btn.disabled = false;
          msg.textContent = err.message === 'LOGIN' ? 'הכניסה פגה. לחצו על הכפתור למעלה כדי להתחבר שוב, ואז "שמירה וסיום".' : 'לא נשמר: ' + err.message;
          if (err.message === 'LOGIN') setSync('הכניסה פגה, לחצו להתחבר', true);
        });
    });
  }

  function renderDone(unit, docket) {
    keepAwake(false);
    var idx = UNITS.indexOf(unit);
    var next = null;
    for (var k = idx + 1; k < UNITS.length; k++) if (!UNITS[k].soon) { next = UNITS[k]; break; }
    app.innerHTML = '<article class="tb-card tb-done"><div class="big">🎉</div><h2>כל הכבוד!</h2>' +
      (docket ? '<p class="tb-text">נשמר בגיליון שלך עם ' + (unit.record === 'proposal' ? 'מספר הצעה' : 'דוקט') + '</p><div class="docket">' + esc(docket) + '</div>' : '<p class="tb-text">היחידה סומנה כהושלמה בגיליון שלך.</p>') +
      '<p class="tb-text">בבחינה: בסוף כל חלק קוראים לבוחן ומשאירים את הכול פתוח על המסך.</p></article>' +
      '<nav class="tb-nav"><a class="btn" href="#">לרשימה</a>' +
      (next ? '<a class="btn btn-primary" href="#u/' + next.id + '/0">ליחידה הבאה</a>' : '<a class="btn btn-primary" href="#">סיום</a>') + '</nav>';
    window.scrollTo(0, 0);
  }

  // ---------- הגדלה ----------
  var zoom = document.getElementById('tbZoom');
  var zoomShot = document.getElementById('tbZoomShot');
  var currentStep = null;
  function openZoom() {
    if (!currentStep) return;
    zoomShot.innerHTML = stageHtml(currentStep, null);
    zoom.hidden = false;
  }
  function closeZoom() { zoom.hidden = true; zoomShot.innerHTML = ''; }
  zoom.querySelector('.tb-zoom-close').addEventListener('click', closeZoom);
  zoomShot.addEventListener('click', closeZoom);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !zoom.hidden) closeZoom(); });

  // ---------- החלקה: ימינה = הבא (כמו דפדוף בספר בעברית), שמאלה = הקודם ----------
  var touch = null;
  app.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { touch = null; return; }
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  app.addEventListener('touchend', function (e) {
    if (!touch || !zoom.hidden) return;
    var dx = e.changedTouches[0].clientX - touch.x;
    var dy = e.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    var nav = document.querySelector('.tb-nav');
    if (!nav) return;
    var target = dx > 0 ? nav.querySelector('[data-next]') : nav.querySelector('a.btn:not(.btn-primary)');
    if (target && target.getAttribute('href') && target.getAttribute('href') !== '#') location.hash = target.getAttribute('href').slice(1);
  }, { passive: true });

  // ---------- ניתוב ----------
  function route() {
    if (!zoom.hidden) closeZoom();
    var m = /^#u\/([a-z0-9-]+)\/(\d+)$/.exec(location.hash);
    var unit = m && unitById(m[1]);
    if (unit && !unit.soon) {
      var i = Math.max(0, Math.min(Number(m[2]), unit.steps.length + 2));
      renderUnit(unit, i);
    } else if (!loaded) {
      app.innerHTML = '<p class="tb-loading">טוען את ההתקדמות שלך…</p>';
    } else {
      renderHome();
    }
  }
  window.addEventListener('hashchange', route);
  document.querySelectorAll('[data-home]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); location.hash = ''; }); });

  function start() {
    if (!API) { app.innerHTML = '<p class="tb-error">המערכת עוד לא חוברה לשרת (חסרה כתובת ב-config.js).</p>'; return; }
    if (!tokenValid()) { showLogin(); return; }
    document.getElementById('tbUser').textContent = auth.name || auth.email;
    loaded = false;
    route();
    api('hello', {})
      .then(function (d) {
        progress = d.units || {};
        loadError = '';
        if (d.sheet_url) { sheetLink.href = d.sheet_url; sheetLink.hidden = false; }
        flushStep();
      })
      .catch(function (err) {
        if (err.message === 'LOGIN') { needLogin('הכניסה פגה. נכנסים שוב וממשיכים מאותו מקום.'); throw err; }
        loadError = 'לא הצלחנו לטעון את ההתקדמות: ' + err.message;
      })
      .then(function () { loaded = true; if (!/^#u\//.test(location.hash)) renderHome(); }, function () {});
  }
  start();
})();
