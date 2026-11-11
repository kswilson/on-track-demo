/* On Track: demo prototype.
 * Plain JS, no build step. Every screen is a "card" rendered into #view.
 * The AI steps are scripted for the demo (see chunkStep). */

'use strict';

/* ------------------------------------------------------------------ *
 * Preset lesson config. In the real thing the lesson comes from the school
 * timetable and the teacher sets the items per class; the app only shows
 * the 3 most important ones.
 * ------------------------------------------------------------------ */
const SUBJECTS = {
  maths: {
    name: 'Maths', period: 'Period 3',
    items: [
      { id: 'calc', name: 'calculator', your: 'your calculator' },
      { id: 'book', name: 'exercise book', your: 'your exercise book',
        spareQ: 'Ask your teacher for paper.', spareYes: 'Got some', spareNo: 'None' },
      { id: 'ruler', name: 'ruler', your: 'a ruler' },
    ],
  },
  physics: {
    name: 'Physics', period: 'Period 4',
    items: [
      { id: 'labbook', name: 'lab book', your: 'your lab book',
        spareQ: 'Ask your teacher for paper.', spareYes: 'Got some', spareNo: 'None' },
      { id: 'calc', name: 'calculator', your: 'your calculator' },
      { id: 'pen', name: 'pen and pencil', your: 'a pen and a pencil' },
    ],
  },
  geography: {
    name: 'Geography', period: 'Period 2',
    items: [
      { id: 'pencils', name: 'coloured pencils', your: 'your coloured pencils' },
      { id: 'book', name: 'exercise book', your: 'your exercise book',
        spareQ: 'Ask your teacher for paper.', spareYes: 'Got some', spareNo: 'None' },
      { id: 'ruler', name: 'ruler', your: 'a ruler' },
    ],
  },
};

const ICONS = {
  start: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
  task: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6M12 2v3"/>',
  end: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  assess: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h3"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  tick: '<path d="m5 12 5 5 9-10"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const EMBED = window.self !== window.top;
let lastScreen = 'home';
function emit(screen, transient) {
  if (!transient) lastScreen = screen;
  if (EMBED) window.parent.postMessage({ source: 'ontrack', type: 'screen', screen }, '*');
}

/* ------------------------------------------------------------------ *
 * State (persisted per device; demo only)
 * ------------------------------------------------------------------ */
const DAY = 86400000;
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const addDays = (n) => new Date(today().getTime() + n * DAY).toISOString();

function freshState() {
  return {
    subject: 'maths',
    speed: EMBED ? 10 : 1,   // presenter page defaults to 10x so check-ins show quickly
    equip: {},            // item id -> 'had' | 'borrowed' | 'paper' | 'shared' | 'none'
    started: false,
    starterPhoto: null,
    task: {},
    items: [
      { id: 'a1', kind: 'assessment', subject: 'French', type: 'vocab', due: addDays(8), topics: 'Food and drink (units D1 and D2)' },
      { id: 'a2', kind: 'assessment', subject: 'Maths', type: 'topic', due: addDays(13), topics: 'Bearings and angles' },
    ],
  };
}

const STORE_KEY = 'ontrack-demo-v1';
let S = freshState();
try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
  if (saved) S = Object.assign(freshState(), saved, { starterPhoto: null });
} catch (e) { /* storage unavailable: run in memory */ }
function save() {
  try {
    const { starterPhoto, ...rest } = S;
    localStorage.setItem(STORE_KEY, JSON.stringify(rest));
  } catch (e) { /* ignore */ }
}
const subj = () => SUBJECTS[S.subject] || SUBJECTS.maths;

/* ------------------------------------------------------------------ *
 * Rendering helpers
 * ------------------------------------------------------------------ */
const view = document.getElementById('view');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function render(html, bind) {
  view.innerHTML = html;
  window.scrollTo(0, 0);
  view.focus({ preventScroll: true });
  if (bind) bind();
  updateChrome();
  tick();
}

const stepsHtml = ({ i, n }) =>
  `<div class="steps" aria-label="Step ${i + 1} of ${n}">${Array.from({ length: n }, (_, k) => `<span class="${k <= i ? 'on' : ''}"></span>`).join('')}</div>`;

const LADDER = ['Notes', 'Friend', 'Teacher'];
const ladderHtml = (stage) =>
  `<div class="ladder" aria-label="Help steps">${LADDER.map((l, k) =>
    `<div class="rung ${k < stage ? 'done' : k === stage ? 'on' : ''}">${k + 1}. ${l}</div>`).join('')}</div>`;

/**
 * card({ kicker, title, body, img, note, noteKind, steps, ladder, top, extra,
 *        buttons: [{ label, kind, on, file, disabled }], stack, onRender })
 */
function card(o) {
  const buttons = o.buttons || [];
  const btns = buttons.map((b, i) => b.file
    ? `<label class="btn ${b.kind || 'primary'}"><input type="file" accept="image/*" capture="environment" data-file="${i}">${b.label}</label>`
    : `<button class="btn ${b.kind || 'primary'}" data-b="${i}" ${b.disabled ? 'disabled' : ''}>${b.label}</button>`).join('');
  const two = buttons.length === 2 && !o.stack;
  if (o.screen) emit(o.screen);
  render(`
    <section class="card">
      <div class="card-top">
        <button class="back" data-home>← Home</button>
        ${o.steps ? stepsHtml(o.steps) : ''}
      </div>
      ${o.top || ''}
      ${o.ladder != null ? ladderHtml(o.ladder) : ''}
      ${o.kicker ? `<p class="kicker">${o.kicker}</p>` : ''}
      <h2>${o.title}</h2>
      ${o.img ? `<figure class="card-img ${o.img.focus ? 'focus' : ''}"><img src="${o.img.src}" alt="${esc(o.img.alt)}"></figure>` : ''}
      ${o.body ? `<div class="card-body">${o.body}</div>` : ''}
      ${o.note ? `<p class="note ${o.noteKind || ''}">${o.note}</p>` : ''}
      ${o.extra || ''}
      ${btns ? `<div class="btn-row ${two ? 'two' : ''}">${btns}</div>` : ''}
    </section>`, () => {
    view.querySelectorAll('[data-b]').forEach((el) => { el.onclick = () => buttons[+el.dataset.b].on(); });
    view.querySelectorAll('[data-file]').forEach((el) => {
      el.onchange = () => { const f = el.files && el.files[0]; if (f) buttons[+el.dataset.file].on(f); };
    });
    if (o.onRender) o.onRender();
  });
}

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-home]')) home();
});

function updateChrome() {
  const s = subj();
  document.getElementById('lessonLabel').textContent = `${s.name} · ${s.period}`;
}

/* ------------------------------------------------------------------ *
 * Home
 * ------------------------------------------------------------------ */
function home() {
  emit('home');
  const s = subj();
  const borrowed = s.items.filter((it) => S.equip[it.id] === 'borrowed').map((it) => it.name);
  const pills = [
    S.started ? '<span class="pill ok">✓ Ready for lesson</span>' : '',
    borrowed.length ? `<span class="pill warn">Borrowed: ${esc(borrowed.join(', '))}</span>` : '',
    T.total && !T.done ? '<span class="pill ok">Task timer running</span>' : '',
  ].join('');

  const tile = (id, c, ic, title, sub) =>
    `<button class="tile" data-c="${c}" data-go="${id}">
       <span class="tile-icon">${icon(ic)}</span>
       <span><span class="tile-title">${title}</span><br><span class="tile-sub">${sub}</span></span>
     </button>`;

  render(`
    ${pills ? `<div class="status-row home-status">${pills}</div>` : ''}
    <h1 class="sr-only">Lesson mode</h1>
    <div class="tiles">
      ${tile('start', 'teal', 'start', 'Lesson start', 'Check you\'re ready')}
      ${tile('task', 'yellow', 'task', 'Task start', 'Timer and getting going')}
      ${tile('end', 'blue', 'end', 'Lesson end', 'Pack up and homework')}
      ${tile('assess', 'navy', 'assess', 'Assessments', 'Tests and revision')}
    </div>

    <details class="settings" ${EMBED ? 'hidden' : ''}>
      <summary>Demo settings</summary>
      <div class="settings-body">
        <label>Lesson
          <select id="setSubject">
            ${Object.entries(SUBJECTS).map(([k, v]) => `<option value="${k}" ${k === S.subject ? 'selected' : ''}>${v.name}</option>`).join('')}
          </select>
        </label>
        <label>Timer speed (to show check-ins quickly)
          <select id="setSpeed">
            ${[1, 10, 60].map((v) => `<option value="${v}" ${v === S.speed ? 'selected' : ''}>${v === 1 ? 'Real time' : v + '× faster'}</option>`).join('')}
          </select>
        </label>
        <button class="btn ghost" id="resetDemo">Reset demo</button>
      </div>
    </details>`, () => {
    const go = { start: lessonStart, task: taskStart, end: lessonEnd, assess: assessments };
    view.querySelectorAll('[data-go]').forEach((el) => { el.onclick = () => go[el.dataset.go](); });
    document.getElementById('setSubject').onchange = (e) => {
      S.subject = e.target.value; S.equip = {}; S.started = false; save(); home();
    };
    document.getElementById('setSpeed').onchange = (e) => setSpeed(+e.target.value);
    document.getElementById('resetDemo').onclick = () => {
      stopTimer(); S = freshState(); save(); home();
    };
  });
}

/* ------------------------------------------------------------------ *
 * 1. Lesson start: equipment, then starter task
 * Writing rule for every screen: one instruction, and it is the title.
 * No labels, reasons or reassurance for the student to read past.
 * ------------------------------------------------------------------ */
function lessonStart() {
  S.equip = {}; S.started = false; S.starterPhoto = null;
  itemStep(0);
}

function itemStep(i) {
  const items = subj().items;
  if (i >= items.length) { S.started = true; save(); return knowStarter(); }
  const it = items[i];
  const steps = { i, n: items.length };
  const next = () => itemStep(i + 1);
  const set = (v) => { S.equip[it.id] = v; save(); };

  const ask = () => card({ screen: 'ls-item', steps,
    title: `Have you got ${esc(it.your)}?`,
    buttons: [
      { label: 'Yes', kind: 'yes', on: () => { set('had'); next(); } },
      { label: 'No', kind: 'no', on: bag },
    ],
  });
  const bag = () => card({ screen: 'ls-bag', steps,
    title: 'Check your bag.',
    buttons: [
      { label: 'Found it', kind: 'yes', on: () => { set('had'); next(); } },
      { label: 'Not there', kind: 'no', on: spare },
    ],
  });
  const spare = () => card({ screen: 'ls-spare', steps,
    title: esc(it.spareQ || `Ask your teacher for a spare ${it.name}.`),
    buttons: [
      { label: it.spareYes || 'Got one', kind: 'yes', on: () => { set(it.spareQ ? 'paper' : 'borrowed'); next(); } },
      { label: it.spareNo || 'No spare', kind: 'no', on: partner },
    ],
  });
  const partner = () => card({ screen: 'ls-partner', steps,
    title: 'Share with your partner?',
    buttons: [
      { label: 'Yes', kind: 'yes', on: () => { set('shared'); next(); } },
      { label: 'No', kind: 'no', on: hand },
    ],
  });
  const hand = () => card({ screen: 'ls-hand', steps,
    title: 'Put your hand up.',
    buttons: [{ label: 'Done', kind: 'primary', on: () => { set('none'); next(); } }],
  });
  ask();
}

function knowStarter() {
  card({ screen: 'ls-know',
    title: 'Do you know what to do?',
    buttons: [
      { label: 'Yes', kind: 'yes', on: home },
      { label: 'No', kind: 'no', on: () => photoStep({ next: (photo) => { S.starterPhoto = photo; analyse(photo, starterCtx()); } }) },
    ],
  });
}

const starterCtx = () => ({ ok: home, stuckDone: home });

/* Pretend camera: no real picker. The shutter always "captures" the example worksheet. */
function photoStep({ next, title = 'Take a photo of the starter.' }) {
  card({ screen: 'photo',
    title,
    extra: `
      <div class="viewfinder" id="viewfinder">
        <img src="assets/starter.jpg" alt="Camera view of the starter worksheet">
        <span class="vf-corners" aria-hidden="true"></span>
        <span class="vf-flash" aria-hidden="true"></span>
      </div>
      <button class="shutter" id="shutter" aria-label="Take photo"></button>`,
    onRender: () => {
      document.getElementById('shutter').onclick = (e) => {
        e.currentTarget.disabled = true;
        document.getElementById('viewfinder').classList.add('snap');
        setTimeout(() => next('assets/starter.jpg'), 450);
      };
    },
  });
}

function analyse(photo, ctx) {
  card({ screen: 'analyse',
    title: 'Reading the task…',
    extra: '<div class="spinner" role="status" aria-label="Working"></div>',
  });
  setTimeout(() => chunkStep(photo, ctx), 1600);
}

/* Scripted "AI" response for the example bearings worksheet: it sees the
 * A/B/C differentiation and shows only question 1 of A. One instruction. */
function chunkStep(photo, ctx) {
  card({ screen: 'chunk',
    title: 'Just do this one.',
    img: { src: 'assets/part-a-q1.jpg', alt: 'Section A, question 1: Burlet is on a bearing of 080° from Leighton. Find angle a.', focus: true },
    buttons: [
      { label: 'I can do it', kind: 'yes', on: ctx.ok },
      { label: 'Still stuck', kind: 'no', on: () => ladder(0, ctx) },
    ],
  });
}

/* Help ladder: notes → friend → teacher */
function ladder(stage, ctx) {
  const top = ctx.top ? ctx.top() : '';
  if (stage === 0) return card({ screen: 'ladder-0', top, ladder: 0,
    title: 'Look in your notes.',
    buttons: [
      { label: 'That helped', kind: 'yes', on: ctx.ok },
      { label: 'Still stuck', kind: 'no', on: () => ladder(1, ctx) },
    ],
  });
  if (stage === 1) return card({ screen: 'ladder-1', top, ladder: 1,
    title: 'Ask the person next to you.',
    buttons: [
      { label: 'That helped', kind: 'yes', on: ctx.ok },
      { label: 'Still stuck', kind: 'no', on: () => ladder(2, ctx) },
    ],
  });
  return card({ screen: 'ladder-2', top, ladder: 2,
    title: 'Put your hand up.',
    body: '<p>While you wait, copy out the question.</p>',
    buttons: [{ label: 'Done', kind: 'primary', on: ctx.stuckDone }],
  });
}

/* ------------------------------------------------------------------ *
 * Timer engine (keeps running across screens)
 * ------------------------------------------------------------------ */
const T = { total: 0, base: 0, seg: 0, running: false, fired: [], done: false };
const RING_C = 2 * Math.PI * 90;

const elapsed = () => (T.running ? T.base + ((Date.now() - T.seg) / 1000) * S.speed : T.base);
const remaining = () => Math.max(0, T.total - elapsed());
const fmt = (sec) => { const s = Math.ceil(sec); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function startTimer(sec) {
  Object.assign(T, { total: sec, base: 0, seg: Date.now(), running: true, fired: [], done: false });
}
function stopTimer() { Object.assign(T, { total: 0, base: 0, running: false, fired: [], done: false }); tick(); }
function setSpeed(v) {
  if (T.running) { T.base = elapsed(); T.seg = Date.now(); }
  S.speed = v; save();
}

const CHECKS = [0.25, 0.5, 0.75];
function tick() {
  const chip = document.getElementById('timerChip');
  if (!T.total) { chip.hidden = true; return; }
  const rem = remaining();
  const frac = Math.min(1, elapsed() / T.total);
  chip.hidden = false;
  document.querySelectorAll('[data-timer-text]').forEach((el) => { el.textContent = fmt(rem); });
  document.querySelectorAll('[data-ring]').forEach((el) => {
    el.style.strokeDashoffset = String(RING_C * frac);
    el.style.stroke = frac >= 1 ? 'var(--orange)' : frac >= 0.75 ? 'var(--yellow)' : 'var(--teal)';
  });
  if (rem <= 0 && !T.done) {
    T.done = true; T.running = false; T.base = T.total;
    return checkIn(1);
  }
  // At high speeds several thresholds can pass in one tick: show only the latest.
  const passed = CHECKS.filter((p) => frac >= p && !T.fired.includes(p));
  if (passed.length && !T.done) { T.fired.push(...passed); checkIn(passed[passed.length - 1]); }
}
setInterval(tick, 250);

document.getElementById('timerChip').onclick = () => focusView();

const ringHtml = (compact) => `
  <div class="ring-wrap ${compact ? 'compact' : ''}">
    <svg class="ring" viewBox="0 0 200 200" aria-hidden="true">
      <circle class="track" cx="100" cy="100" r="90"/>
      <circle class="bar" data-ring cx="100" cy="100" r="90" stroke-dasharray="${RING_C}" stroke-dashoffset="0"/>
    </svg>
    <div class="ring-label" role="timer"><strong data-timer-text>${fmt(remaining())}</strong><span>left of ${fmt(T.total)}</span></div>
  </div>`;

/* Check-in overlay: flashes every 25% of the time */
const CHECK_MSG = {
  0.25: ['Still on task?', '¼ of the time has gone.'],
  0.5: ['Halfway.', 'Half the time has gone.'],
  0.75: ['Start finishing off.', '¾ of the time has gone.'],
  1: ['Time\'s up.', 'Finish your sentence.'],
};
function checkIn(p) {
  const [t, b] = CHECK_MSG[p];
  const box = document.getElementById('checkin');
  document.getElementById('checkinTitle').textContent = t;
  document.getElementById('checkinBody').textContent = b;
  document.getElementById('checkinBar').style.width = `${p * 100}%`;
  const btns = document.getElementById('checkinBtns');
  const close = () => { box.hidden = true; emit(lastScreen); };
  if (p === 1) {
    btns.className = 'btn-row';
    btns.innerHTML = '<button class="btn primary">OK</button>';
    btns.firstChild.onclick = () => { close(); stopTimer(); home(); };
  } else {
    btns.className = 'btn-row two';
    btns.innerHTML = '<button class="btn yes">Yes</button><button class="btn no">I\'m stuck</button>';
    btns.children[0].onclick = close;
    btns.children[1].onclick = () => { close(); ladder(0, taskCtx()); };
  }
  box.hidden = false;
  emit(p === 1 ? 'timeup' : 'checkin', true);
  // Restart the flash animation if it's shown again
  box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
  btns.firstChild.focus();
  if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
}

/* ------------------------------------------------------------------ *
 * 2. Task start: time first, then where / who / assessment
 * ------------------------------------------------------------------ */
function taskStart() {
  if (T.total && !T.done) return focusView();
  S.task = {};
  let secs = 0;
  card({ screen: 'ts-set',
    title: 'How many minutes?',
    extra: `
      <div class="timer-set">
        <div class="big-time" id="setTime" aria-live="polite">0:00</div>
        <div class="add-btns">
          ${[1, 2, 5, 10].map((m) => `<button class="btn no" data-add="${m}">+${m}</button>`).join('')}
        </div>
      </div>`,
    buttons: [
      { label: 'Start', kind: 'primary', disabled: true, on: () => { startTimer(secs); whereStep(); } },
      { label: 'Clear', kind: 'ghost', on: () => { secs = 0; refresh(); } },
    ],
    onRender: () => {
      view.querySelectorAll('[data-add]').forEach((el) => {
        el.onclick = () => { secs = Math.min(secs + +el.dataset.add * 60, 90 * 60); refresh(); };
      });
    },
  });
  function refresh() {
    document.getElementById('setTime').textContent = fmt(secs);
    view.querySelector('[data-b="0"]').disabled = secs === 0;
  }
}

const taskTop = () => ringHtml(true);
const taskCtx = () => ({ top: taskTop, ok: focusView, stuckDone: focusView });

function whereStep() {
  card({ screen: 'ts-where',
    top: taskTop(), steps: { i: 0, n: 4 },
    title: 'Where is the task?',
    buttons: [
      { label: 'Paper or board', kind: 'no', on: () => photoStep({
        title: 'Take a photo of the task.',
        next: (photo) => { S.task.where = 'On paper'; S.task.photo = photo; whoStep(); },
      }) },
      { label: 'Google Classroom', kind: 'no', on: classroomStep },
      { label: 'Teacher said it', kind: 'no', on: spokenStep },
    ],
  });
}

function classroomStep() {
  const tasks = ['Bearings: practice questions', '3D Pythagoras worksheet', 'Angles in polygons: revision'];
  card({ screen: 'ts-classroom',
    top: taskTop(), steps: { i: 0, n: 4 },
    title: 'Which one?',
    buttons: tasks.map((t) => ({ label: t, kind: 'no', on: () => { S.task.where = `Classroom: ${t}`; whoStep(); } })),
  });
}

function spokenStep() {
  card({ screen: 'ts-spoken',
    top: taskTop(), steps: { i: 0, n: 4 },
    title: 'Say the task.',
    extra: `<button class="mic" id="mic" aria-label="Start recording">${icon('mic')}</button>
            <div id="micOut"></div>`,
    onRender: () => {
      const mic = document.getElementById('mic');
      mic.onclick = () => {
        mic.classList.add('rec'); mic.disabled = true;
        setTimeout(() => {
          mic.classList.remove('rec');
          const said = 'Do questions 1 to 8 on bearings, then check with your partner.';
          document.getElementById('micOut').innerHTML = `<p class="quote">“${said}”</p>
            <div class="btn-row two"><button class="btn yes" id="sayYes">That's right</button><button class="btn no" id="sayNo">Try again</button></div>`;
          document.getElementById('sayYes').onclick = () => { S.task.where = 'Spoken'; S.task.said = said; whoStep(); };
          document.getElementById('sayNo').onclick = spokenStep;
        }, 2200);
      };
    },
  });
}

function whoStep() {
  const pick = (v) => () => { S.task.who = v; assessStep(); };
  card({ screen: 'ts-who',
    top: taskTop(), steps: { i: 1, n: 4 },
    title: 'Who are you working with?',
    buttons: [
      { label: 'On my own', kind: 'no', on: pick('On my own') },
      { label: 'Partner', kind: 'no', on: pick('Partner') },
      { label: 'Group', kind: 'no', on: pick('Group') },
    ],
  });
}

function assessStep() {
  card({ screen: 'ts-assess',
    top: taskTop(), steps: { i: 2, n: 4 },
    title: 'Is it a test?',
    buttons: [
      { label: 'Yes', kind: 'yes', on: () => { S.task.assessment = true; knowTask(); } },
      { label: 'No', kind: 'no', on: () => { S.task.assessment = false; knowTask(); } },
    ],
  });
}

function knowTask() {
  card({ screen: 'ts-know',
    top: taskTop(), steps: { i: 3, n: 4 },
    title: 'Do you know what to do?',
    buttons: [
      { label: 'Yes', kind: 'yes', on: focusView },
      { label: 'No', kind: 'no', on: () => (S.task.photo ? analyse(S.task.photo, taskCtx()) : ladder(0, taskCtx())) },
    ],
  });
}

function focusView() {
  if (!T.total) return taskStart();
  card({ screen: 'ts-focus',
    top: ringHtml(false),
    title: 'Keep going.',
    buttons: [
      { label: 'I\'m stuck', kind: 'accent', on: () => ladder(0, taskCtx()) },
      { label: 'Finished', kind: 'yes', on: () => {
        stopTimer();
        card({ screen: 'ts-done',
          title: 'Check your work.',
          buttons: [{ label: 'Done', kind: 'primary', on: home }],
        });
      } },
      { label: 'Home', kind: 'ghost', on: home },
    ],
    stack: true,
  });
}

/* ------------------------------------------------------------------ *
 * 3. Lesson end: pack up, give back what you borrowed, homework
 * ------------------------------------------------------------------ */
function lessonEnd() {
  const s = subj();
  const rows = [];
  for (const it of s.items) {
    const st = S.equip[it.id];
    if (st === 'borrowed') rows.push({ label: `Give the ${it.name} back to your teacher`, borrowed: true });
    else if (st === 'paper') rows.push({ label: 'Paper from your teacher' });
    else if (st === 'shared') rows.push({ label: `Give your partner their ${it.name}` });
    else if (st === 'had' || !S.started) rows.push({ label: `Your ${it.name}` });
  }
  rows.push({ label: 'Pencil case' });
  rows.push({ label: 'Anything outside the room' });

  card({ screen: 'le-pack',
    title: 'Pack up.',
    extra: `<ul class="checklist">${rows.map((r, i) => `
      <li><button class="check ${r.borrowed ? 'borrowed' : ''}" data-check="${i}" aria-pressed="false">
        <span class="box">${icon('tick')}</span>
        <span>${esc(r.label)}</span>
      </button></li>`).join('')}</ul>`,
    buttons: [{ label: 'Next', kind: 'primary', on: homeworkStep }],
    onRender: () => {
      view.querySelectorAll('[data-check]').forEach((el) => {
        el.onclick = () => {
          const on = el.classList.toggle('on');
          el.setAttribute('aria-pressed', String(on));
        };
      });
    },
  });
}

function homeworkStep() {
  card({ screen: 'le-hw',
    title: 'Any homework?',
    buttons: [
      { label: 'Yes', kind: 'yes', on: homeworkForm },
      { label: 'No', kind: 'no', on: endDone },
      { label: 'Not sure', kind: 'ghost', on: () => card({ screen: 'le-unsure',
        title: 'Ask your teacher on the way out.',
        buttons: [{ label: 'OK', kind: 'primary', on: endDone }],
      }) },
    ],
    stack: true,
  });
}

function homeworkForm() {
  let due = null;
  const opts = [['Tomorrow', 1], ['Next lesson', 2], ['In a week', 7]];
  card({ screen: 'le-hwform',
    title: 'What\'s the homework?',
    extra: `
      <label class="field"><textarea id="hwText" aria-label="The homework" placeholder="e.g. Questions 4 to 8"></textarea></label>
      <div class="field"><span>When is it due?</span>
        <div class="chips">${opts.map(([l, d]) => `<button class="chip" data-due="${d}">${l}</button>`).join('')}</div></div>`,
    buttons: [{ label: 'Save', kind: 'primary', disabled: true, on: () => {
      S.items.push({ id: 'h' + Date.now(), kind: 'homework', subject: subj().name,
        title: document.getElementById('hwText').value.trim(), due: addDays(due) });
      save();
      endDone();
    } }],
    onRender: () => {
      const txt = document.getElementById('hwText');
      const saveBtn = view.querySelector('[data-b="0"]');
      const check = () => { saveBtn.disabled = !(due && txt.value.trim()); };
      txt.oninput = check;
      view.querySelectorAll('[data-due]').forEach((el) => {
        el.onclick = () => {
          view.querySelectorAll('[data-due]').forEach((c) => c.classList.remove('on'));
          el.classList.add('on'); due = +el.dataset.due; check();
        };
      });
    },
  });
}

function endDone() {
  const borrowed = subj().items.filter((it) => S.equip[it.id] === 'borrowed').map((it) => it.name);
  card({ screen: 'le-done',
    title: borrowed.length ? `Give the ${esc(borrowed.join(' and '))} back.` : 'All packed.',
    buttons: [{ label: 'Done', kind: 'primary', on: () => {
      S.equip = {}; S.started = false; S.task = {}; save(); home();
    } }],
  });
}

/* ------------------------------------------------------------------ *
 * 4. Assessments: record it, get a plan and a way to revise
 * ------------------------------------------------------------------ */
const daysUntil = (iso) => Math.round((new Date(iso).setHours(0, 0, 0, 0) - today().getTime()) / DAY);
const dueText = (iso) => { const d = daysUntil(iso); return d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`; };
const dateText = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const TYPES = { vocab: 'Vocab test', topic: 'Topic test', essay: 'Essay / extended writing', practical: 'Practical' };
const itemTitle = (a) => (a.kind === 'homework' ? `${a.subject} homework` : `${a.subject} ${TYPES[a.type].toLowerCase()}`);

function assessments() {
  const list = [...S.items].sort((a, b) => new Date(a.due) - new Date(b.due));
  card({ screen: 'as-list',
    title: 'Coming up',
    extra: list.length ? `<ul class="list">${list.map((a) => `
      <li><button class="item" data-item="${a.id}">
        <span><span class="tag ${a.kind === 'homework' ? 'hw' : ''}">${a.kind === 'homework' ? 'Homework' : 'Assessment'}</span>
          <h3>${esc(itemTitle(a))}</h3>
          <span class="muted small">${esc(a.kind === 'homework' ? a.title : a.topics || '')}</span></span>
        <span class="due">${dueText(a.due)}<br><span class="muted small">${dateText(a.due)}</span></span>
      </button></li>`).join('')}</ul>` : '<p class="muted">Nothing recorded yet.</p>',
    buttons: [{ label: '+ Add a test', kind: 'primary', on: addAssessment }],
    onRender: () => {
      view.querySelectorAll('[data-item]').forEach((el) => {
        el.onclick = () => {
          const a = S.items.find((x) => x.id === el.dataset.item);
          if (a.kind === 'homework') homeworkView(a); else planView(a);
        };
      });
    },
  });
}

function homeworkView(a) {
  card({ screen: 'as-hw',
    title: esc(itemTitle(a)),
    body: `<p class="muted">${dueText(a.due)} · ${dateText(a.due)}</p><p class="quote">${esc(a.title)}</p>`,
    buttons: [
      { label: 'Mark as done', kind: 'yes', on: () => { S.items = S.items.filter((x) => x !== a); save(); assessments(); } },
      { label: 'Back', kind: 'ghost', on: assessments },
    ],
  });
}

function addAssessment() {
  const draft = {};
  const subjects = ['Maths', 'English', 'Science', 'French', 'Spanish', 'History', 'Geography'];
  const whens = [['In 1 week', 7], ['In 2 weeks', 14], ['In 3 weeks', 21]];
  const chips = (key, opts) => `<div class="chips">${opts.map(([l, v]) => `<button class="chip" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
  card({ screen: 'as-add',
    title: 'Add a test',
    extra: `
      <div class="field"><span>Subject</span>${chips('subject', subjects.map((s) => [s, s]))}</div>
      <div class="field"><span>What kind?</span>${chips('type', Object.entries(TYPES).map(([k, v]) => [v, k]))}</div>
      <div class="field"><span>When?</span>${chips('days', whens)}</div>
      <label class="field"><span>Topics (if you know them)</span>
        <textarea id="topics" placeholder="e.g. Units D1 and D2"></textarea></label>`,
    buttons: [{ label: 'Make my plan', kind: 'primary', disabled: true, on: () => {
      const a = { id: 'a' + Date.now(), kind: 'assessment', subject: draft.subject, type: draft.type,
        due: addDays(+draft.days), topics: document.getElementById('topics').value.trim() };
      S.items.push(a); save(); planView(a);
    } }],
    onRender: () => {
      const btn = view.querySelector('[data-b="0"]');
      view.querySelectorAll('[data-k]').forEach((el) => {
        el.onclick = () => {
          view.querySelectorAll(`[data-k="${el.dataset.k}"]`).forEach((c) => c.classList.remove('on'));
          el.classList.add('on'); draft[el.dataset.k] = el.dataset.v;
          btn.disabled = !(draft.subject && draft.type && draft.days);
        };
      });
    },
  });
}

/* Revision method by subject and test type (Claude can extend this table). */
function strategyFor(a) {
  if (a.type === 'vocab') return {
    name: 'Flashcards', icon: '🃏', ex: 'flash',
    why: 'Vocab tests check what you can remember. Testing yourself with cards works better than reading lists.',
    tasks: ['Make cards for the first half of the words', 'Make cards for the rest', 'Test yourself. Sort into "know" and "don\'t know"', 'Test only the "don\'t know" pile', 'Quick test on all of them'],
  };
  if (a.type === 'essay') return {
    name: 'Plan practice answers', icon: '📝', ex: 'plan',
    why: 'Writing whole essays takes ages. Planning lots of answers quickly gets you ready for any question.',
    tasks: ['List the likely questions', 'Plan one answer in 10 minutes', 'Plan two more answers', 'Write one paragraph in full, timed', 'Re-read your plans'],
  };
  if (a.type === 'practical') return {
    name: 'Learn the method', icon: '🔬', ex: 'method',
    why: 'Practical questions ask what you did and why. Learn the steps in order.',
    tasks: ['Write the method as numbered steps', 'Cover it and write it again from memory', 'Add the safety points and why each step matters', 'Explain it out loud to someone at home', 'Final run-through from memory'],
  };
  if (a.subject === 'Maths') return {
    name: 'Practice questions', icon: '✏️', ex: 'practice',
    why: 'In maths you get better by doing questions, not by reading notes.',
    tasks: ['Do 5 questions on the first topic, then mark them', 'Redo any you got wrong', 'Do 5 questions on the next topic', 'Mixed questions from all the topics', 'Redo everything in your mistakes log'],
  };
  return {
    name: 'Brain dump', icon: '🧠', ex: 'blurt',
    why: 'Write down everything you remember, then check your notes. You find the gaps fast.',
    tasks: ['Brain dump on the first topic, then fill gaps in a different colour', 'Brain dump on the next topic', 'Turn your gaps into 5 questions and answer them', 'Brain dump on everything', 'Answer your gap questions again'],
  };
}

function planView(a) {
  const st = strategyFor(a);
  const days = Math.max(1, daysUntil(a.due));
  const n = Math.max(1, Math.min(5, Math.floor(days / 2)));
  const offs = Array.from({ length: n }, (_, k) => Math.max(0, Math.round(((k + 1) * (days - 1)) / n)));
  const tasks = n === 1 ? [st.tasks[st.tasks.length - 1]] : [...st.tasks.slice(0, n - 1), st.tasks[st.tasks.length - 1]];
  const rows = offs.map((o, k) => `<li><b>${dateText(addDays(o))}</b><span>${esc(tasks[k])} <span class="muted small">· 20 min</span></span></li>`).join('');

  card({ screen: 'as-plan',
    title: esc(itemTitle(a)),
    body: `<p class="muted">${dueText(a.due)}${a.topics ? ` · ${esc(a.topics)}` : ''}</p>`,
    extra: `
      <div class="strategy"><span class="strategy-icon" aria-hidden="true">${st.icon}</span>
        <div><p class="kicker" style="margin-bottom:2px">Revise with</p><h3 style="margin:0">${st.name}</h3></div></div>
      <ol class="plan">${rows}<li class="test"><b>${dateText(a.due)}</b><span><b>Test day</b></span></li></ol>`,
    buttons: [
      { label: 'Show me an example', kind: 'accent', on: () => exampleView(a, st) },
      { label: 'Back', kind: 'ghost', on: assessments },
    ],
    stack: true,
  });
}

function exampleView(a, st) {
  const back = [{ label: 'Back', kind: 'primary', on: () => planView(a) }];
  const ex = {
    practice: `<div class="example"><h3>A mistakes log</h3>
      <ul><li><b>Question:</b> Bearing of A from B, when B from A is 060°</li>
      <li><b>What went wrong:</b> I took away 180° instead of adding</li>
      <li><b>Next time:</b> Draw the north line at B first</li></ul></div>`,
    blurt: `<div class="example"><h3>A brain dump</h3>
      <p class="small">Black pen: what you remembered. <span style="color:var(--bright-blue)"><b>Blue pen</b></span>: what you added from your notes.</p>
      <ul><li>Rivers erode by abrasion, attrition…</li><li style="color:var(--bright-blue)">…hydraulic action and solution</li>
      <li>Meanders form on the outside bend</li><li style="color:var(--bright-blue)">Fastest flow on the outside, so erosion there; deposition on the inside</li></ul></div>`,
    plan: `<div class="example"><h3>A 10-minute essay plan</h3>
      <ol><li><b>Point 1:</b> main idea + one quote</li><li><b>Point 2:</b> second idea + one quote</li>
      <li><b>Point 3:</b> the counter-argument</li><li><b>Conclusion:</b> answer the question in one sentence</li></ol></div>`,
    method: `<div class="example"><h3>Method as steps</h3>
      <ol><li>Measure 50 cm³ of water with a measuring cylinder</li><li>Record the starting temperature</li>
      <li>Add the solid and stir</li><li>Record the highest temperature reached</li></ol></div>`,
  };
  if (st.ex !== 'flash') {
    return card({ screen: 'as-example', title: `${st.name}: an example`, extra: ex[st.ex], buttons: back });
  }
  const decks = {
    Spanish: [['el pan', 'bread'], ['las patatas', 'potatoes'], ['el desayuno', 'breakfast']],
    default: [['le pain', 'bread'], ['les pommes de terre', 'potatoes'], ['le petit-déjeuner', 'breakfast']],
  };
  const deck = decks[a.subject] || decks.default;
  let i = 0;
  card({ screen: 'as-example',
    title: 'Say the answer, then tap to flip.',
    extra: `<div class="flash-wrap"><button class="flash" id="flash" aria-label="Flashcard. Tap to flip."></button></div>
            <p class="muted small" id="flashCount" style="text-align:center"></p>`,
    buttons: [{ label: 'Next card', kind: 'no', on: () => { i = (i + 1) % deck.length; draw(); } }, ...back],
    stack: true,
    onRender: () => { document.getElementById('flash').onclick = (e) => e.currentTarget.classList.toggle('flipped'); draw(); },
  });
  function draw() {
    const f = document.getElementById('flash');
    f.classList.remove('flipped');
    f.innerHTML = `<span class="flash-face flash-front">${esc(deck[i][0])}<small>${esc(a.subject === 'Spanish' ? 'Spanish' : 'French')}</small></span>
                   <span class="flash-face flash-back">${esc(deck[i][1])}<small>English</small></span>`;
    document.getElementById('flashCount').textContent = `Card ${i + 1} of ${deck.length}`;
  }
}

/* ------------------------------------------------------------------ *
 * Keep the screen on during the lesson (Screen Wake Lock API)
 * ------------------------------------------------------------------ */
let wake = null;
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && !wake && document.visibilityState === 'visible') {
      wake = await navigator.wakeLock.request('screen');
      wake.addEventListener('release', () => { wake = null; showWake(); });
    }
  } catch (e) { /* not allowed yet; try again on next tap */ }
  showWake();
}
function showWake() {
  document.getElementById('wakeStatus').textContent = wake ? 'Screen stays on' : '';
}
document.addEventListener('click', keepAwake);
document.addEventListener('visibilitychange', keepAwake);

/* ------------------------------------------------------------------ *
 * Presenter page bridge: when embedded in the demo page, report the
 * current screen and accept settings from the panel next to the iPad.
 * ------------------------------------------------------------------ */
function applyFromPanel(msg) {
  if (msg.type === 'subject' && SUBJECTS[msg.value]) {
    S.subject = msg.value; S.equip = {}; S.started = false; save(); home();
  } else if (msg.type === 'speed') {
    setSpeed(+msg.value);
  } else if (msg.type === 'reset') {
    document.getElementById('checkin').hidden = true;
    stopTimer(); S = freshState(); save(); home();
  } else if (msg.type === 'home') {
    document.getElementById('checkin').hidden = true;
    home();
  }
  sendState();
}
function sendState() {
  if (EMBED) window.parent.postMessage({ source: 'ontrack', type: 'state', subject: S.subject, speed: S.speed }, '*');
}
window.addEventListener('message', (e) => {
  if (e.source !== window.parent || !e.data || e.data.source !== 'ontrack-panel') return;
  applyFromPanel(e.data);
});

if (EMBED) document.documentElement.classList.add('embedded');
home();
sendState();
keepAwake();
