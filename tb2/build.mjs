// בונה את units.js מתוך course/*.json + course/shots.json. הרצה: node tb/build.mjs
// שדות לתלמיד בלבד נכנסים ל-units.js. verify/shot/sources נשארים רק ב-course/ ובדף הסקירה.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = dirname(fileURLToPath(import.meta.url));
const shots = JSON.parse(readFileSync(join(DIR, 'course/shots.json'), 'utf8'));
const TRACK_ORDER = { BASE: 0, FIT: 1, GRP: 2, MID: 3 };
// מה רושמים בסוף יחידה: דוקט, מספר הצעה, או כלום (יחידות רקע)
const RECORD = (u) => (u.track === 'BASE' || u.id === 'fit-bh-site' || ['mid-exam', 'mid-concepts', 'mid-mymaps', 'mid-flights', 'mid-hotel', 'mid-car', 'mid-attraction'].includes(u.id)) ? 'none'
  : (u.track === 'GRP' && !['grp-docket', 'grp-accounting'].includes(u.id)) ? 'proposal' : 'docket';
const problems = [];
const units = readdirSync(join(DIR, 'course')).filter((f) => f.endsWith('.json') && f !== 'shots.json')
  .map((f) => JSON.parse(readFileSync(join(DIR, 'course', f), 'utf8')))
  .sort((a, b) => TRACK_ORDER[a.track] - TRACK_ORDER[b.track] || a.order - b.order)
  .map((u) => ({
    id: u.id, track: u.track, icon: u.icon, title: u.title, goal: u.goal, why: u.why,
    record: RECORD(u), docketAt: u.docketAt || 0,
    before: u.before || [], oral: u.oral || [], check: u.check || [],
    steps: u.steps.map((s, i) => {
      const sh = shots[`${u.id}:${i + 1}`];
      if (sh && sh.img && !existsSync(join(DIR, 'img', sh.img + '.webp'))) problems.push(`חסר img/${sh.img}.webp`);
      const o = { title: s.title, text: s.text };
      if (s.why) o.why = s.why;
      if (s.trap) o.trap = s.trap;
      if (sh) {
        if (sh.img) { o.img = sh.img; o.hl = sh.hl; if (sh.site) o.site = sh.site; }
        if (sh.sites) {
          o.sites = sh.sites;
          sh.sites.forEach((s) => { if (!existsSync(join(DIR, 'img', s.img + '.webp'))) problems.push(`חסר img/${s.img}.webp`); });
        }
      }
      return o;
    }),
  }));
for (const k of Object.keys(shots)) if (k !== '_doc') {
  const [id, n] = k.split(':'); const u = units.find((x) => x.id === id);
  if (!u || !u.steps[n - 1]) problems.push('shots.json מצביע על שלב שלא קיים: ' + k);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
// עותק מלא (כולל verify/shot/sources) לדף הסקירה של המורה
const full = readdirSync(join(DIR, 'course')).filter((f) => f.endsWith('.json') && f !== 'shots.json')
  .map((f) => JSON.parse(readFileSync(join(DIR, 'course', f), 'utf8')))
  .sort((a, b) => TRACK_ORDER[a.track] - TRACK_ORDER[b.track] || a.order - b.order)
  .map((u) => ({ ...u, record: RECORD(u), steps: u.steps.map((s, i) => ({ ...s, ...(shots[`${u.id}:${i + 1}`] || {}) })) }));
writeFileSync(join(DIR, 'course-review.js'), '/* נוצר אוטומטית ע"י build.mjs */\nwindow.TB_COURSE = ' + JSON.stringify(full) + ';\n');
writeFileSync(join(DIR, 'units.js'), '/* נוצר אוטומטית מ-course/*.json ע"י build.mjs — לא לערוך ידנית. */\nwindow.TB_UNITS = ' + JSON.stringify(units, null, 1) + ';\n');

// הקשר לבוט העזרה: בסיס הידע (bot/knowledge.md) + כל השלבים, בטקסט פשוט. השרת (Code.gs) קורא את הקובץ הזה מהאתר.
const plain = (t) => String(t || '').replace(/\[\[(.+?)\]\]/g, '$1');
writeFileSync(join(DIR, 'bot-context.json'), JSON.stringify({
  built: new Date().toISOString(),
  kb: readFileSync(join(DIR, 'bot/knowledge.md'), 'utf8'),
  exercises: (() => {
    const w = {}; new Function('window', readFileSync(join(DIR, 'exercises.js'), 'utf8'))(w);
    return (w.TB_EXERCISES || []).map((e) => ({
      id: e.id, track: e.track, level: e.level, title: e.title,
      text: e.parts.map((p) => p.title + ': ' + plain(p.story) + '\n' + p.items.map((it, i) => '- ' + plain(it.text)).join('\n')).join('\n'),
      oral: (e.oral || []).map(plain), key: (e.key || []).map(plain), solution: (e.solution || []).map(plain),
    }));
  })(),
  units: units.map((u) => ({
    id: u.id, track: u.track, title: u.title, goal: plain(u.goal),
    steps: u.steps.map((s) => ({ t: plain(s.title), x: plain(s.text) + (s.trap ? ' | מלכודת: ' + plain(s.trap) : '') })),
  })),
}));
console.log(`units.js: ${units.length} יחידות, ${units.reduce((n, u) => n + u.steps.length, 0)} שלבים, ${units.reduce((n, u) => n + u.steps.filter((s) => s.img).length, 0)} עם צילום`);
