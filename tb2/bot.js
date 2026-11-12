/* בוט העזרה של המדריך: שאלה בטקסט, אפשר עם צילום מסך, ותשובה עם קישורים לשלבים במדריך.
 * השרת: action = ask ב-apps-script/Code.gs (Gemini). עובד רק אחרי כניסה עם גוגל.
 * השיחה נשמרת ב-sessionStorage (tbBot) עד שסוגרים את הלשונית. */
(function () {
  'use strict';
  var TB = window.TB;
  var btn = document.getElementById('tbAsk');
  if (!TB || !btn || !(window.TB_CONFIG || {}).api) return;
  btn.hidden = false;

  // מצב רמזים (דף התרגילים): window.TB_BOT = { mode: 'hint', exerciseId, guide: './' }
  var MODE = window.TB_BOT || {};
  var HINT = MODE.mode === 'hint';
  var KEY = HINT ? 'tbBotHint:' + MODE.exerciseId : 'tbBot';
  var GUIDE = MODE.guide || '';
  var history = [];
  try { history = JSON.parse(sessionStorage.getItem(KEY) || '[]') || []; } catch (_) {}
  var image = null; // {mime, data, url}
  var busy = false;

  var panel = document.createElement('section');
  panel.className = 'tb-bot';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'שאלה לבוט');
  panel.innerHTML =
    '<header class="tb-bot-head"><b>' + (HINT ? '💡 רמזים לתרגיל' : '💬 העוזר של טרוול בוסטר') + '</b>' +
    '<span><button type="button" class="tb-bot-clear" title="שיחה חדשה">שיחה חדשה</button>' +
    '<button type="button" class="tb-bot-close" aria-label="סגירה">✕</button></span></header>' +
    '<div class="tb-bot-log" aria-live="polite"></div>' +
    '<form class="tb-bot-form" novalidate>' +
    '<div class="tb-bot-preview" hidden><img alt="הצילום שצירפתם"><button type="button" aria-label="הסרת הצילום">✕</button></div>' +
    '<div class="tb-bot-row">' +
    '<label class="tb-bot-cam" title="צילום במצלמה" aria-label="צילום במצלמה">📷<input type="file" accept="image/*" capture="environment" hidden></label>' +
    '<label class="tb-bot-cam" title="תמונה מהגלריה" aria-label="תמונה מהגלריה">🖼️<input type="file" accept="image/*" hidden></label>' +
    '<textarea rows="1" maxlength="1500" placeholder="' + (HINT ? 'על מה צריך רמז?' : 'מה לא ברור?') + '"></textarea>' +
    '<button type="submit" class="tb-bot-send" aria-label="שליחה">➤</button></div>' +
    '<small class="tb-bot-note">הבוט יכול לטעות. כשלא בטוחים, שואלים את המורה.</small></form>';
  document.body.appendChild(panel);

  var log = panel.querySelector('.tb-bot-log');
  var form = panel.querySelector('form');
  var ta = panel.querySelector('textarea');
  var files = panel.querySelectorAll('input[type=file]');
  var preview = panel.querySelector('.tb-bot-preview');

  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-20))); } catch (_) {} }
  function where() {
    var m = /^#u\/([a-z0-9-]+)\/(\d+)$/.exec(location.hash);
    return m ? { unit_id: m[1], step: Number(m[2]) } : {};
  }

  function msgHtml(h) {
    if (h.role === 'user') {
      return '<div class="tb-bot-msg me">' + (h.img ? '<span class="tb-bot-imgtag">📷 צילום מסך</span>' : '') + TB.esc(h.text || '').replace(/\n/g, '<br>') + '</div>';
    }
    var links = (h.links || []).map(function (l) {
      return '<a class="tb-bot-link"' + (HINT ? ' target="_blank" rel="noopener"' : '') + ' href="' + GUIDE + '#u/' + TB.esc(l.unit) + '/' + Number(l.step) + '">📖 ' + TB.esc(l.label) + '</a>';
    }).join('');
    return '<div class="tb-bot-msg bot' + (h.error ? ' err' : '') + '">' + TB.rich(h.text || '').replace(/\n/g, '<br>') + links + '</div>';
  }
  function render(extra) {
    if (TB.isGuest()) {
      log.innerHTML = '<div class="tb-bot-empty"><p>הבוט עובד רק אחרי כניסה עם גוגל.</p>' +
        '<button type="button" class="btn btn-primary" data-login>כניסה עם גוגל</button></div>';
      log.querySelector('[data-login]').addEventListener('click', function () { close(); TB.login(); });
      form.hidden = true;
      return;
    }
    form.hidden = false;
    var html = history.length ? history.map(msgHtml).join('') : HINT ?
      '<div class="tb-bot-empty"><p><b>תקועים בתרגיל? אני נותן רמזים, לא תשובות.</b></p>' +
      '<p>כתבו באיזה סעיף אתם ומה לא מסתדר. אפשר לצלם את המסך עם 📷 או לבחור תמונה עם 🖼️.</p><p>צריכים עוד? בקשו "עוד רמז".</p></div>' :
      '<div class="tb-bot-empty"><p><b>אפשר לשאול כל דבר על טרוול בוסטר ובין הרים.</b></p>' +
      '<p>למשל: "איך מאשרים הזמנה עם סימן שאלה?"</p><p>תקועים במסך? מצלמים אותו עם 📷, או בוחרים תמונה מהגלריה עם 🖼️, ושואלים "מה עושים עכשיו?"</p></div>';
    log.innerHTML = html + (extra || '');
    log.scrollTop = log.scrollHeight;
  }

  function open() { panel.hidden = false; document.body.classList.add('tb-bot-open'); render(); if (!TB.isGuest()) setTimeout(function () { ta.focus(); }, 50); }
  function close() { panel.hidden = true; document.body.classList.remove('tb-bot-open'); }
  btn.addEventListener('click', open);
  panel.querySelector('.tb-bot-close').addEventListener('click', close);
  panel.querySelector('.tb-bot-clear').addEventListener('click', function () { history = []; save(); clearImage(); render(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
  // קישור לשלב: סוגרים את הבוט ועוברים לשלב
  log.addEventListener('click', function (e) { if (!HINT && e.target.closest('.tb-bot-link')) close(); });

  // גובה תיבת הטקסט גדל עם הכתיבה; Enter שולח (Shift+Enter = שורה חדשה)
  ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; });
  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); form.requestSubmit(); }
  });

  // תמונה (מצלמה או גלריה): מקטינים בטלפון לפני השליחה (עד 1600 פיקסלים, JPEG).
  // טוענים דרך כתובת זמנית (objectURL) ולא כ-dataURL, כי צילום מצלמה גדול נכשל בטלפונים.
  function clearImage() { image = null; preview.hidden = true; files.forEach(function (f) { f.value = ''; }); }
  preview.querySelector('button').addEventListener('click', clearImage);
  function drawScaled(src, w, h) {
    var max = 1600, k = Math.min(1, max / Math.max(w, h));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    var url = c.toDataURL('image/jpeg', 0.82);
    image = { mime: 'image/jpeg', data: url.split(',')[1], url: url };
    preview.querySelector('img').src = url;
    preview.hidden = false;
  }
  function failImage() {
    clearImage();
    history.push({ role: 'bot', text: 'לא הצלחתי לפתוח את התמונה. נסו לצלם שוב, או לבחור אותה מהגלריה.', error: true });
    save(); render();
  }
  function loadImage(f) {
    if (window.createImageBitmap) {
      createImageBitmap(f).then(function (bmp) { drawScaled(bmp, bmp.width, bmp.height); if (bmp.close) bmp.close(); })
        .catch(function () { loadViaImg(f); });
    } else loadViaImg(f);
  }
  function loadViaImg(f) {
    var url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function () { drawScaled(img, img.naturalWidth, img.naturalHeight); URL.revokeObjectURL(url); };
    img.onerror = function () { URL.revokeObjectURL(url); failImage(); };
    img.src = url;
  }
  files.forEach(function (input) {
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (f) loadImage(f);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var q = ta.value.trim();
    if (!q && !image) { ta.focus(); return; }
    busy = true;
    var past = history.filter(function (h) { return !h.error; }).slice(-6).map(function (h) { return { role: h.role, text: h.text }; });
    var sentImage = image;
    history.push({ role: 'user', text: q || 'מה עושים עכשיו?', img: !!sentImage });
    ta.value = ''; ta.style.height = 'auto';
    clearImage();
    render('<div class="tb-bot-msg bot wait">חושב…</div>');
    var at = where();
    TB.api('ask', { question: q, image: sentImage ? { mime: sentImage.mime, data: sentImage.data } : null, history: past, unit_id: at.unit_id || '', step: at.step || 0, mode: HINT ? 'hint' : '', exercise_id: HINT ? MODE.exerciseId : '' })
      .then(function (d) {
        history.push({ role: 'bot', text: d.answer, links: d.links || [] });
      })
      .catch(function (err) {
        var m = err.message === 'LOGIN' ? 'הכניסה פגה. סוגרים את הבוט, נכנסים שוב, ושואלים שוב.' : err.message;
        history.push({ role: 'bot', text: m, error: true });
      })
      .then(function () { busy = false; save(); render(); });
  });
})();
