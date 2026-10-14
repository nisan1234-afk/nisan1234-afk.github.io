// בונה את units.js מתוך course/*.json + course/shots.json. הרצה: node tb/build.mjs
// שדות לתלמיד בלבד נכנסים ל-units.js. verify/shot/sources נשארים רק ב-course/ ובדף הסקירה.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = dirname(fileURLToPath(import.meta.url));
const shots = JSON.parse(readFileSync(join(DIR, 'course/shots.json'), 'utf8'));
const TRACK_ORDER = { BASE: 0, FIT: 1, GRP: 2 };
// מה רושמים בסוף יחידה: דוקט, מספר הצעה, או כלום (יחידות רקע)
const RECORD = (u) => (u.track === 'BASE' || u.id === 'fit-bh-site') ? 'none'
  : (u.track === 'GRP' && !['grp-docket', 'grp-accounting'].includes(u.id)) ? 'proposal' : 'docket';
const problems = [];
const units = readdirSync(join(DIR, 'course')).filter((f) => f.endsWith('.json') && f !== 'shots.json')
  .map((f) => JSON.parse(readFileSync(join(DIR, 'course', f), 'utf8')))
  .sort((a, b) => TRACK_ORDER[a.track] - TRACK_ORDER[b.track] || a.order - b.order)
  .map((u) => ({
    id: u.id, track: u.track, icon: u.icon, title: u.title, goal: u.goal, why: u.why,
    record: RECORD(u),
    before: u.before || [], oral: u.oral || [], check: u.check || [],
    steps: u.steps.map((s, i) => {
      const sh = shots[`${u.id}:${i + 1}`];
      if (sh && !existsSync(join(DIR, 'img', sh.img + '.webp'))) problems.push(`חסר img/${sh.img}.webp`);
      const o = { title: s.title, text: s.text };
      if (s.why) o.why = s.why;
      if (s.trap) o.trap = s.trap;
      if (sh) { o.img = sh.img; o.hl = sh.hl; }
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
console.log(`units.js: ${units.length} יחידות, ${units.reduce((n, u) => n + u.steps.length, 0)} שלבים, ${units.reduce((n, u) => n + u.steps.filter((s) => s.img).length, 0)} עם צילום`);
