/* סימולטור בגרות – צד תלמיד. תוכן הבחינה נטען מקובץ JSON; תשובות נשמרות בשרת (או בדפדפן במצב הדגמה). */
{
const CFG = window.SIM_CONFIG || {};
const DEMO = !CFG.api;
const $ = id => document.getElementById(id);
const app = $("app");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const strip = h => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent.replace(/\s+/g, " ").trim(); };
/* טקסט שאלה מגיע מקובץ הבחינה שלנו. מותרות רק תגיות עיצוב בסיסיות. */
const safe = h => esc(h).replace(/&lt;(\/?)(u|b|strong|em|i|br)&gt;/g, "<$1$2>");

/* ===== מצב ===== */
const S = { token: "", name: "", id: "", exam: null, examRef: null, acc: { readAloud: false, voiceAnswer: false, extraTime: 0 },
  page: 0, ans: {}, left: 0, open: { 0: true }, dirty: false, online: true, submitted: false, rec: {} };
let PAGES = [];
const KEY = () => "sim:" + (S.examRef?.examId || "demo") + ":" + S.id;

/* ===== שרת ===== */
async function api(action, body) {
  const r = await fetch(CFG.api, { method: "POST", body: JSON.stringify(Object.assign({ action }, body || {})) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "שגיאה");
  return j.data;
}
function local(save) {
  try {
    if (save) localStorage.setItem(KEY(), JSON.stringify({ ans: S.ans, left: S.left, page: S.page, submitted: S.submitted }));
    else return JSON.parse(localStorage.getItem(KEY()) || "null");
  } catch (e) { return null; }
}
let saveTimer = null;
function touch() { S.dirty = true; local(true); clearTimeout(saveTimer); saveTimer = setTimeout(sync, 2500); }
async function sync() {
  if (DEMO || !S.dirty || S.submitted) { mark(); return; }
  try { await api("student.save", { token: S.token, answers: S.ans, timeLeft: S.left }); S.dirty = false; S.online = true; }
  catch (e) { S.online = false; }
  mark();
}
function mark() {
  const s = $("saved"); if (!s) return;
  s.className = "net" + (S.online ? "" : " off");
  s.textContent = S.online ? (DEMO ? "מצב הדגמה · נשמר בדפדפן" : "נשמר " + new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })) : "אין חיבור – התשובות נשמרות במחשב";
}

/* ===== גרפיקה ===== */
const I = {
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6"><path d="M4 4l16 16M20 4L4 20"/></svg>`,
  xs: `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1l12 12M13 1L1 13"/></svg>`,
  nav: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 5h13M3 12h13M3 19h13"/><circle cx="21" cy="5" r="1.2" fill="currentColor"/><circle cx="21" cy="12" r="1.2" fill="currentColor"/><circle cx="21" cy="19" r="1.2" fill="currentColor"/></svg>`,
  draft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/></svg>`,
  end: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 12l3 3 5-6"/></svg>`,
  user: `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="6" cy="4" r="2.3"/><path d="M1.5 11.5c.6-2.4 2.3-3.6 4.5-3.6s3.9 1.2 4.5 3.6"/></svg>`,
  chev: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>`,
  right: `<svg viewBox="0 0 22 22" fill="none" stroke="#000" stroke-width="1.6"><path d="M2 11h18M13 4l7 7-7 7"/></svg>`,
  left: `<svg viewBox="0 0 22 22" fill="none" stroke="#000" stroke-width="1.6"><path d="M20 11H2M9 4l-7 7 7 7"/></svg>`,
  spk: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 6h3l4-3v10L5 10H2z"/><path d="M11 5.5a3.5 3.5 0 010 5M12.5 3.5a6 6 0 010 9" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  mic: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5.5" y="1.5" width="5" height="8" rx="2.5"/><path d="M3 7.5a5 5 0 0010 0M8 12.5v2.5"/></svg>`,
  fs: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5"/></svg>`
};
const LOGO = `<svg class="logo" viewBox="0 0 56 50"><path d="M20 10l16-7 16 7-16 7z" fill="#d3e64c"/><path d="M20 10v18l16 7V17z" fill="#b5c92a"/><path d="M52 10v18l-16 7V17z" fill="#93a51a"/><path d="M4 28l12-5 12 5-12 5z" fill="#d3e64c"/><path d="M4 28v13l12 5V33z" fill="#b5c92a"/><path d="M28 28v13l-12 5V33z" fill="#93a51a"/></svg>`;
const MAP = `<svg viewBox="0 0 551 510" role="img" aria-label="מפה סכמטית של רמת הגולן"><defs><linearGradient id="g1" x1="0" x2="1"><stop offset="0" stop-color="#cfe08a"/><stop offset=".45" stop-color="#e7d79a"/><stop offset="1" stop-color="#c8834a"/></linearGradient></defs><rect width="551" height="510" fill="url(#g1)"/><path d="M190 30C250 22 320 32 360 62L410 140 430 250 420 360 392 470 226 476 212 386 202 296 188 196Z" fill="#d18d55" opacity=".75"/><path d="M190 30C235 24 280 26 300 40L292 92 240 104 200 92Z" fill="#a86b3d" opacity=".8"/><path d="M110 0L190 30 360 62 462 0" fill="none" stroke="#7a1111" stroke-width="3.5"/><path d="M360 62L410 140 430 250 420 360 462 510" fill="none" stroke="#7a1111" stroke-width="3.5" stroke-dasharray="9 6"/><path d="M226 476C296 466 376 476 462 510" fill="none" stroke="#7a1111" stroke-width="3.5"/><path d="M140 166L172 156 182 196 162 226 142 206Z" fill="#9fcbe9"/><ellipse cx="178" cy="414" rx="40" ry="60" fill="#7fb6dd"/><path d="M168 36C172 106 162 156 160 170M160 226C162 286 168 336 172 356" stroke="#3d8ed0" stroke-width="2.5" fill="none" stroke-dasharray="5 3"/><g font-family="Segoe UI,Arimo,Arial" font-size="15" fill="#1d1d1d" text-anchor="middle"><text x="178" y="419">כנרת</text><text x="150" y="140">עמק החולה</text><text x="318" y="262" font-size="21" font-weight="700" letter-spacing="2">רמת הגולן</text><circle cx="298" cy="318" r="3.5"/><text x="298" y="340">קצרין</text><circle cx="256" cy="118" r="3.5"/><text x="256" y="138">הר חרמון</text></g><text x="12" y="500" font-family="Assistant" font-size="12" fill="#333">איור סכמטי לתרגול – לא בקנה מידה</text></svg>`;
const MAPBOX = [{ x: 39, y: 7 }, { x: 4, y: 45 }, { x: 20, y: 93 }];

/* ===== מסך מלא כשהסימולטור מוטמע (למשל במט"ח) ===== */
const EMB = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
function goFull() {
  const el = document.documentElement;
  if (el.requestFullscreen && document.fullscreenEnabled) el.requestFullscreen().catch(openTab); else openTab();
}
function openTab() { window.open(location.href, "_blank", "noopener"); }
const fsBtn = id => EMB ? `<button type="button" class="fsb" id="${id}">${I.fs}פתיחה במסך מלא</button>` : "";
document.addEventListener("fullscreenchange", () => document.querySelectorAll(".fsb").forEach(b => b.style.display = document.fullscreenElement ? "none" : ""));

/* ===== כניסה ===== */
function loginView(msg) {
  app.innerHTML = `<div class="login"><div class="lcard"><header>${LOGO}<div><b>סימולטור בגרות</b>בחינה מתוקשבת לתרגול</div></header>
  <form id="lf" novalidate><label>מספר זהות<input id="lid" inputmode="numeric" autocomplete="off"></label>
  ${DEMO ? `<label>שם הנבחן<input id="lnm" autocomplete="off"></label>` : ""}
  <label>סיסמה לפתיחת הבחינה<input id="lpw" inputmode="numeric" autocomplete="off"></label>
  ${EMB ? `<div class="emb-note">מומלץ לעבוד במסך מלא, כמו בבחינה האמיתית.${fsBtn("fs1")}</div>` : ""}
  <div class="lerr" id="lerr">${esc(msg || "")}</div><button class="btn l" id="lgo">המשך</button>
  ${DEMO ? `<div class="lmsg">מצב הדגמה: הסיסמה היא ${esc(CFG.demoCode || "1234")}</div>` : ""}</form></div></div>`;
  if (EMB) $("fs1").onclick = goFull;
  $("lf").addEventListener("submit", async e => {
    e.preventDefault();
    const id = $("lid").value.trim(), pw = $("lpw").value.trim();
    if (!/^\d{5,9}$/.test(id)) return $("lerr").textContent = "יש להקליד מספר זהות תקין";
    $("lgo").disabled = true; $("lerr").textContent = "טוען…";
    try {
      if (DEMO) {
        if (pw !== String(CFG.demoCode || "1234")) throw new Error("הסיסמה שגויה");
        S.id = id; S.name = ($("lnm").value.trim() || "נבחן");
        S.examRef = { examId: "demo", url: CFG.demoExam };
        S.acc = { readAloud: true, voiceAnswer: true, extraTime: 0 };
        await loadExam(); S.left = S.exam.minutes * 60;
        const d = local(); if (d) { S.ans = d.ans || {}; S.left = d.left ?? S.left; S.page = d.page || 0; S.submitted = !!d.submitted; }
      } else {
        const r = await api("student.login", { studentId: id, openCode: pw });
        S.id = id; S.token = r.token; S.name = r.name; S.examRef = r.exam; S.acc = r.acc; S.left = r.timeLeft;
        S.ans = r.answers || {}; S.submitted = r.status === "submitted";
        await loadExam();
        const d = local(); if (d && d.ans && Object.keys(d.ans).length > Object.keys(S.ans).length) { S.ans = d.ans; S.dirty = true; }
      }
      shell();
    } catch (err) { $("lgo").disabled = false; $("lerr").textContent = err.message; }
  });
}
async function loadExam() {
  const u = S.examRef.url, base = new URL(".", location.href);
  const r = await fetch(new URL(u, base)); if (!r.ok) throw new Error("לא הצלחתי לטעון את הבחינה");
  S.exam = await r.json();
  PAGES = [{ t: "gate" }];
  S.exam.chapters.forEach((c, ci) => c.questions.forEach(q => PAGES.push({ t: "q", ci, q })));
  PAGES.push({ t: "summary" });
}

/* ===== מעטפת ===== */
function shell() {
  const E = S.exam;
  app.innerHTML = `<header class="top">${LOGO}<div class="det"><b>${esc(E.subject)}, ${esc(E.kind)}, ${esc(E.session)}, שאלון ${esc(E.code)}</b><span>${I.user}${esc(S.name)}</span></div>
  <div class="mid">${fsBtn("fs2")}<span class="saved" id="saved"></span><div class="clock" id="clock" title="זמן שנותר"><span id="tm"></span></div><button class="circ" id="bfont" aria-label="גודל טקסט" title="גודל טקסט"><span>A<i>א</i></span></button></div>
  <button class="x" id="bx" aria-label="סיום">${I.x}</button></header>
  <aside class="rail" aria-label="תפריט"><div class="cap"></div><button class="rbtn" id="bnav">${I.nav}ניווט</button>
  <div class="rest"><button class="rbtn" id="bdraft">${I.draft}טיוטה</button><button class="rbtn" id="bend">${I.end}סיום</button></div></aside>
  <section class="stage"><div class="scroll" id="scroll"><div id="main"></div></div></section>
  <button class="pg prv" id="bprev" aria-label="לעמוד הקודם">${I.right}</button><button class="pg nxt" id="bnext" aria-label="לעמוד הבא">${I.left}</button>
  <aside class="drawer" id="drawer" aria-label="ניווט"></aside>
  <div class="draft" id="draft"><header>טיוטה (לא נבדקת)</header><textarea id="dtx" aria-label="טיוטה"></textarea></div>
  <div class="modal" id="modal"><div class="mcard" id="mcard"></div></div>`;
  if (EMB) $("fs2").onclick = goFull;
  $("bfont").onclick = () => document.body.classList.toggle("big");
  $("bnav").onclick = () => drawer();
  $("bdraft").onclick = () => { const o = $("draft").classList.toggle("open"); $("bdraft").classList.toggle("on", o); };
  $("bend").onclick = $("bx").onclick = () => go(PAGES.length - 1);
  $("bprev").onclick = () => go(S.page - 1); $("bnext").onclick = () => go(S.page + 1);
  $("modal").onclick = e => { if (e.target.id === "modal") $("modal").classList.remove("open"); };
  $("dtx").value = S.ans._draft || ""; $("dtx").oninput = e => { S.ans._draft = e.target.value; touch(); };
  document.addEventListener("keydown", e => { if (e.key === "Escape") { $("modal").classList.remove("open"); drawer(false); } });
  window.addEventListener("online", sync);
  setInterval(tick, 1000); setInterval(sync, 20000); tick(); mark(); render();
}
function tick() {
  if (!S.submitted && S.left > 0) { S.left--; if (S.left === 0) submit(true); }
  const t = $("tm"); if (!t) return;
  const s = Math.max(0, S.left), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  t.textContent = h + ":" + String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  $("clock").classList.toggle("warn", S.left < 900);
  if (S.left % 30 === 0) local(true);
}
function go(p) { if (p < 0 || p >= PAGES.length) return; stopAudio(); S.page = p; local(true); render(); $("scroll").scrollTop = 0; }
function drawer(force) { const d = $("drawer"), o = force ?? !d.classList.contains("open"); d.classList.toggle("open", o); $("bnav").classList.toggle("on", o); if (o) drawNav(); }

/* ===== מצב מענה ===== */
const secAnswered = sid => Object.keys(S.ans).some(k => k.split("__")[0] === sid && String(S.ans[k] || "").trim());
const qAnswered = q => q.sections.filter(s => secAnswered(s.id)).length;

function drawNav() {
  const p = PAGES[S.page];
  $("drawer").innerHTML = `<div class="dh">ניווט<button id="dx" aria-label="סגירה">${I.xs}</button></div>
  <button class="db ${p.t === "gate" ? "cur" : ""}" data-p="0">שער</button>
  ${S.exam.chapters.map((c, i) => { const nq = c.questions.filter(q => qAnswered(q)).length;
    return `<div class="dch ${S.open[i] ? "open" : ""}"><button class="dct" data-c="${i}"><span class="nm">${I.chev}${esc(c.name)}</span><span class="pts"><b>${c.points}</b> נק'</span></button>
    <div class="dbody"><p class="dd">${esc(c.desc)}</p>${c.choose ? `<span class="chs">ענית על ${nq} מתוך ${c.choose.n} הנדרשות${nq > c.choose.n ? " – ייבדקו רק הראשונות" : ""}</span>` : ""}
    ${c.questions.map(q => { const a = qAnswered(q), need = q.choose ? q.choose.n : q.sections.length;
      return `<button class="dq ${p.q === q ? "cur" : ""}" data-p="${PAGES.findIndex(x => x.q === q)}">${esc(q.title)}<span class="st ${a >= need ? "done" : ""}">${a ? a + "/" + need : ""}</span></button>`; }).join("")}</div></div>`; }).join("")}
  <div class="dch"><button class="db ${p.t === "summary" ? "cur" : ""}" data-p="${PAGES.length - 1}">סיום והגשה</button></div>`;
  $("dx").onclick = () => drawer(false);
  document.querySelectorAll("#drawer [data-p]").forEach(b => b.onclick = () => { go(+b.dataset.p); drawer(false); });
  document.querySelectorAll("#drawer [data-c]").forEach(b => b.onclick = () => { S.open[b.dataset.c] = !S.open[b.dataset.c]; drawNav(); });
}

/* ===== עמודים ===== */
function render() {
  const m = $("main"), p = PAGES[S.page], E = S.exam;
  $("bprev").disabled = S.page === 0; $("bnext").disabled = S.page === PAGES.length - 1;
  if (S.submitted && p.t !== "summary") { S.page = PAGES.length - 1; return render(); }
  if (p.t === "gate") m.innerHTML = `<div class="sheet gate"><div class="sh"><div class="glabel">סימולטור בגרות<small>${esc(E.kind)}</small></div>
    <dl class="gmeta"><dt>סוג הבחינה:</dt><dd>${esc(E.kind)}</dd><dt>מועד הבחינה:</dt><dd>${esc(E.session)}</dd><dt>סמל השאלון:</dt><dd>${esc(E.code)}</dd></dl>
    <div class="band">${esc(E.subject)}</div></div><div class="qt"><h3>הוראות לנבחנים</h3><ol>
    <li><b>משך הבחינה:</b> ${E.minutes === 180 ? "שלוש שעות" : E.minutes + " דקות"}${S.acc.extraTime ? ` (כולל הארכת זמן של ${S.acc.extraTime}%)` : ""}.</li>
    <li><b>מבנה השאלון ומפתח ההערכה:</b> בשאלון זה ${E.chapters.length} פרקים. ${E.chapters.map(c => `${esc(c.name)} – ${c.points} נקודות`).join("; ")}. סך הכול – 100 נקודות.</li>
    <li><b>שאלות בחירה:</b> אם תענו על יותר שאלות מהנדרש, ייבדקו רק הראשונות לפי הסדר.</li>
    <li><b>מעבר בין השאלות:</b> בחיצים שבצדי המסך או בלשונית "ניווט".</li>
    <li><b>שמירה:</b> התשובות נשמרות אוטומטית תוך כדי עבודה.</li>
    ${S.acc.readAloud ? `<li><b>הקראה:</b> לחצו על ${I.spk.replace("<svg", '<svg style="width:14px;vertical-align:-2px"')} ליד סעיף כדי לשמוע אותו.</li>` : ""}
    ${S.acc.voiceAnswer ? `<li><b>מענה בעל פה:</b> לחצו על ${I.mic.replace("<svg", '<svg style="width:14px;vertical-align:-2px"')} כדי להקליט תשובה, ולחצו שוב כדי לעצור.</li>` : ""}
    </ol>${E.note ? `<div class="disc">${esc(E.note)}</div>` : ""}<div class="disc">סימולציה לתרגול בכיתה · אינה בחינה רשמית</div></div></div>`;
  if (p.t === "q") {
    const c = E.chapters[p.ci], q = p.q;
    m.innerHTML = `<div class="sheet"><div class="sh"><p><b>${esc(c.name)}</b> (${c.points} נקודות)</p><p><b>${esc(c.desc.replace(/^בפרק זה עליכם /, "").replace(/^ל/, "").replace(/^ענות/, "ענו"))}</b></p></div>
    <div class="qt"><div class="topline"></div><span class="numq">${esc(q.title)}</span>
    ${q.instr ? `<p class="instr">${safe(q.instr)}${spk("instr:" + q.id, strip(q.instr))}</p>` : ""}
    ${q.sections.map(sec => secHtml(q, sec)).join("")}</div></div>`;
    bindQ();
  }
  if (p.t === "summary") summary(m);
}
const spk = (ref, text) => S.acc.readAloud ? `<button class="spk" data-ref="${esc(ref)}" data-text="${esc(text)}" aria-label="הקראה" title="הקראה">${I.spk}</button>` : "";
function secHtml(q, sec) {
  const fields = sec.fields.map((f, i) => {
    const k = `${sec.id}__f${i}`;
    if (f.type === "map") return `<div class="flabel">${esc(f.label)}</div><div class="mapq">${MAP}${Array.from({ length: f.boxes || 3 }, (_, j) => `<input class="cz" data-k="${k}_b${j}" aria-label="${esc(f.label)} ${j + 1}" style="right:${MAPBOX[j].x}%;top:${MAPBOX[j].y}%">`).join("")}</div>`;
    if (f.type === "input") return `<div class="flabel">${esc(f.label)}</div><input class="inp" data-k="${k}" aria-label="${esc(f.label)}">`;
    return `<span class="tw"><textarea data-k="${k}" maxlength="${f.max || 3000}" aria-label="תשובה לסעיף ${esc(sec.letter || q.num)}"></textarea><div class="cnt" data-c="${k}"></div></span>`;
  }).join("");
  const voice = S.acc.voiceAnswer ? `<div class="voice" id="v_${sec.id}"><button class="mic" data-sid="${sec.id}" aria-label="הקלטת תשובה" title="הקלטת תשובה בעל פה">${I.mic}</button><span class="vstat">${S.ans[sec.id + "__voice"] ? "הוקלטה תשובה בעל פה" : "מענה בעל פה"}</span></div>` : "";
  return `<div class="sec"><b>${esc(sec.letter ? sec.letter + "." : "")}</b><div><div class="stext"><div class="tx">${safe(sec.text)}<div class="nik">(${sec.points} נקודות)</div></div>${spk(sec.id, (sec.letter ? "סעיף " + sec.letter + ". " : "") + strip(sec.text))}</div>${fields}${voice}</div></div>`;
}
function bindQ() {
  document.querySelectorAll("#main [data-k]").forEach(el => {
    const k = el.dataset.k; if (S.ans[k] != null) el.value = S.ans[k];
    const c = document.querySelector(`[data-c="${k}"]`);
    const cnt = () => { if (c) c.textContent = (el.value || "").length + " / " + el.maxLength + " תווים"; };
    cnt(); el.addEventListener("input", () => { S.ans[k] = el.value; cnt(); touch(); });
  });
  document.querySelectorAll(".spk").forEach(b => b.onclick = () => readAloud(b));
  document.querySelectorAll(".mic").forEach(b => b.onclick = () => record(b));
}

/* ===== הקראה: הקלטת מורה → הקראה שנוצרה בשרת → קול הדפדפן ===== */
let curAudio = null, curBtn = null; const audioCache = {};
function stopAudio() { if (curAudio) { curAudio.pause(); curAudio = null; } if (window.speechSynthesis) speechSynthesis.cancel(); if (curBtn) curBtn.classList.remove("on"); curBtn = null; }
async function readAloud(btn) {
  if (curBtn === btn) return stopAudio();
  stopAudio(); curBtn = btn; btn.classList.add("on");
  const ref = btn.dataset.ref;
  let src = audioCache[ref];
  if (src === undefined && !DEMO) {
    try { const a = await api("audio.get", { token: S.token, examId: S.examRef.examId, sectionId: ref }); src = a ? `data:${a.mime};base64,${a.base64}` : null; }
    catch (e) { src = null; }
    audioCache[ref] = src;
  }
  if (curBtn !== btn) return;
  if (src) { curAudio = new Audio(src); curAudio.onended = stopAudio; curAudio.play().catch(stopAudio); return; }
  if (!window.speechSynthesis) { stopAudio(); return; }
  const u = new SpeechSynthesisUtterance(btn.dataset.text); u.lang = "he-IL"; u.rate = .92;
  const v = speechSynthesis.getVoices().find(x => /^he/i.test(x.lang)); if (v) u.voice = v;
  u.onend = u.onerror = stopAudio; speechSynthesis.speak(u);
}

/* ===== מענה בעל פה ===== */
async function record(btn) {
  const sid = btn.dataset.sid, R = S.rec;
  if (R.mr && R.sid === sid) { R.mr.stop(); return; }
  if (R.mr) return;
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (e) { setVoice(sid, "אין גישה למיקרופון. פתחו את הסימולטור במסך מלא ונסו שוב."); return; }
  const chunks = [], mr = new MediaRecorder(stream);
  R.mr = mr; R.sid = sid; btn.classList.add("rec"); setVoice(sid, "מקליט… לחצו שוב לעצירה");
  mr.ondataavailable = e => chunks.push(e.data);
  mr.onstop = async () => {
    stream.getTracks().forEach(t => t.stop()); btn.classList.remove("rec"); R.mr = null;
    const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
    const url = URL.createObjectURL(blob);
    setVoice(sid, "שומר…", url);
    try {
      if (!DEMO) { const b64 = await toB64(blob); await api("student.audio", { token: S.token, sectionId: sid, base64: b64, mime: blob.type }); }
      const n = (Number(String(S.ans[sid + "__voice"] || "").replace(/\D/g, "")) || 0) + 1;
      S.ans[sid + "__voice"] = `הוקלטו ${n} תשובות בעל פה`; touch();
      setVoice(sid, "התשובה בעל פה נשמרה", url);
    } catch (e) { setVoice(sid, "השמירה נכשלה – נסו להקליט שוב", url); }
  };
  mr.start();
}
function setVoice(sid, msg, url) {
  const box = $("v_" + sid); if (!box) return;
  box.querySelector(".vstat").textContent = msg;
  let au = box.querySelector("audio");
  if (url) { if (!au) { au = document.createElement("audio"); au.controls = true; box.appendChild(au); } au.src = url; }
}
const toB64 = blob => new Promise(r => { const f = new FileReader(); f.onload = () => r(String(f.result).split(",")[1]); f.readAsDataURL(blob); });

/* ===== סיכום והגשה ===== */
function summary(m) {
  if (S.submitted) { m.innerHTML = `<div class="sheet"><div class="donebox"><b>הבחינה הוגשה</b>התשובות נשמרו. הציון והמשוב יופיעו במשימה במט״ח אחרי הבדיקה.</div></div>`; return; }
  const rows = [];
  S.exam.chapters.forEach(c => {
    const n = c.questions.filter(q => qAnswered(q)).length;
    let warn = "";
    if (c.choose && n > c.choose.n) warn = `ענית על ${n} שאלות. ייבדקו רק ${c.choose.n} הראשונות לפי הסדר.`;
    if (c.choose && n < c.choose.n) warn = `ענית על ${n} שאלות מתוך ${c.choose.n} הנדרשות.`;
    if (!c.choose) c.questions.forEach(q => { if (qAnswered(q) < q.sections.length) warn = `ב${q.title.split(" –")[0]} לא ענית על כל הסעיפים.`; });
    rows.push(`<tr><td>${esc(c.name)}</td><td>${c.questions.filter(q => qAnswered(q)).map(q => q.num).join(", ") || "—"}</td><td class="${warn ? "no" : "ok"}">${warn ? esc(warn) : "תקין"}</td></tr>`);
  });
  m.innerHTML = `<div class="sheet"><div class="sh"><b>סיום והגשה</b></div><div class="qt">
  <table class="t sum"><thead><tr><th>פרק</th><th>שאלות שענית עליהן</th><th>מצב</th></tr></thead><tbody>${rows.join("")}</tbody></table>
  <div class="warnbox">אחרי ההגשה לא ניתן לשנות את התשובות.</div>
  <p style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><button class="btn l" id="sub">הגשת הבחינה</button><button class="btn" id="back">חזרה לשאלות</button></p><div id="sent" class="lerr"></div></div></div>`;
  $("back").onclick = () => go(1);
  $("sub").onclick = () => submit(false);
}
async function submit(auto) {
  if (S.submitted) return;
  if (S.rec.mr) S.rec.mr.stop();
  const b = $("sub"); if (b) b.disabled = true;
  try {
    if (!DEMO) await api("student.submit", { token: S.token, answers: S.ans, timeLeft: S.left });
    S.submitted = true; local(true); go(PAGES.length - 1);
  } catch (e) {
    if (b) b.disabled = false;
    const s = $("sent"); if (s) s.textContent = "ההגשה נכשלה: " + e.message + ". התשובות שמורות במחשב – נסו שוב.";
    if (auto) setTimeout(() => submit(true), 15000);
  }
}

loginView();
}
