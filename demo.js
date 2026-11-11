/* Presenter page: scales the iPad, shows a note for the app's current
 * screen, and sends demo settings into the app. */

'use strict';

/* ---------- Notes for each app screen ---------- */
const NOTES = {
  'home': {
    title: 'Four buttons, one for each part of the lesson',
    body: 'We kept the four flows we\'re sure about. It\'s in school colours, plain and silent, so it looks like an approved tool and not a game. The screen stays on for the whole lesson.',
    try: 'Tap Lesson start.',
  },
  'ls-intro': {
    title: 'Lesson start',
    body: 'Used as students sit down. Plain logic with no AI: a short equipment check, then the starter task.',
    try: 'Tap Go.',
  },
  'ls-item': {
    title: 'A checklist that knows the lesson',
    body: 'The app knows the lesson from the school timetable, and the teacher\'s preset for that class picks the three items that matter: a calculator for maths, coloured pencils for geography. One question at a time avoids overload. Over time it could drop items a student always has.',
    try: 'Answer No to see what happens when something is missing. Or change the lesson in the controls below.',
  },
  'ls-bag': {
    title: 'Missing something? Sort it out, don\'t wait',
    body: 'Each No leads to the next step: check your bag, ask the teacher for a spare, share with a partner, then raise your hand.',
  },
  'ls-spare': {
    title: 'Ask for a spare',
    body: 'Students learn to sort it out themselves rather than sit and wait. Whatever they borrow is remembered for Lesson end.',
  },
  'ls-partner': {
    title: 'Share with a partner',
    body: 'The next option if the teacher has no spare.',
  },
  'ls-hand': {
    title: 'Last step: tell the teacher',
    body: 'The teacher stays in the loop and can adapt the task if needed.',
  },
  'ls-know': {
    title: 'Do you know what to do?',
    body: 'If yes, they start straight away. The app prompts; it doesn\'t do the work. If no, they take a photo of the starter task.',
    try: 'Tap No.',
  },
  'photo': {
    title: 'Take a photo of the task',
    body: 'In the real app this is the iPad camera, and the photo goes to an AI along with the student\'s needs. In the demo the camera is pretend: it always captures the example bearings worksheet.',
    try: 'Tap the shutter button.',
  },
  'analyse': {
    title: 'Reading the task',
    body: 'The AI reads the slide or sheet. This step is scripted for the demo.',
  },
  'chunk': {
    title: 'Small steps, not answers',
    body: 'The AI sees the sheet is split into A, B and C, so it shows only question 1 of A. A guardrail stops it giving subject answers. The problem we\'re solving is executive function, not maths.',
    try: 'Tap Still stuck to see the help ladder.',
  },
  'ladder-0': {
    title: 'Brain → friend → teacher',
    body: 'Help in the order we agreed: your own notes first…',
  },
  'ladder-1': {
    title: 'Brain → friend → teacher',
    body: '…then the person next to you. Most teachers encourage this for starter tasks…',
  },
  'ladder-2': {
    title: 'Brain → friend → teacher',
    body: '…and finally the teacher. Students wait with something useful to do instead of drifting.',
  },
  'ready': {
    title: 'Ready to start',
    body: 'Borrowed items are remembered. Lesson end will remind the student to give them back.',
    try: 'Tap Start a task timer, or go Home and open Lesson end.',
  },
  'ts-set': {
    title: 'Time first, so the clock is ticking',
    body: 'Tap buttons rather than typing: 5 + 2 = 7 minutes. The countdown stays on screen for the rest of the task.',
    try: 'Set Timer speed to 10× in the controls below so the check-ins appear within seconds.',
  },
  'ts-where': {
    title: 'Where is the task?',
    body: 'Paper → take a photo. Google Classroom → choose the assignment. Spoken → the student says what they think the task is.',
  },
  'ts-classroom': {
    title: 'Google Classroom',
    body: 'Later this would read the actual assignment, so the app knows the parts of the task. The list here is made up.',
  },
  'ts-spoken': {
    title: 'Say the task out loud',
    body: 'The student repeats the task in their own words. The transcript is scripted for the demo.',
    try: 'Tap the microphone.',
  },
  'ts-who': {
    title: 'Who are you working with?',
    body: 'Working alone, with a partner or in a group changes what help makes sense.',
  },
  'ts-assess': {
    title: 'Is this an assessment?',
    body: 'Covers short in-class knowledge checks where students may not have their usual access arrangements. The timer and check-ins still help.',
  },
  'ts-know': {
    title: 'Do you know what to do first?',
    body: 'If not, the same small-steps view and help ladder as Lesson start.',
  },
  'ts-focus': {
    title: 'A big countdown for time blindness',
    body: 'The ring shrinks as time passes. A check-in flashes at every quarter so students know how far through they should be. The timer keeps going if they go Home; it shows in the app\'s top bar.',
    try: 'Wait for the 25% check-in.',
  },
  'checkin': {
    title: 'Check-in',
    body: 'It flashes on screen with no sound. "You should be about halfway through" helps students judge time. I\'m stuck goes to the help ladder.',
  },
  'timeup': {
    title: 'Time\'s up',
    body: 'Finish the sentence you\'re on, then look up for the teacher.',
  },
  'ts-done': {
    title: 'Task done',
    body: 'Back to the four buttons.',
  },
  'le-pack': {
    title: 'Lesson end: just packing up',
    body: 'Pack up and give back anything borrowed at lesson start. There are no reflection questions, so the app doesn\'t hold students up while the teacher is packing up.',
    try: 'Tap each item.',
  },
  'le-hw': {
    title: 'Homework, as a backup',
    body: 'Homework should be on Google Classroom, but that\'s not guaranteed, so students can note it here. Linking to Moodle or Classroom is on hold for now.',
  },
  'le-unsure': {
    title: 'Not sure about homework?',
    body: 'Students are prompted to check before they go.',
  },
  'le-hwform': {
    title: 'Note the homework',
    body: 'It\'s saved to the Assessments list.',
  },
  'le-done': {
    title: 'All packed',
    body: 'One last reminder about anything borrowed, then the lesson is reset.',
  },
  'as-list': {
    title: 'Assessments',
    body: 'Students record a test when the teacher announces it. Homework from Lesson end appears here too.',
    try: 'Open the French vocab test.',
  },
  'as-hw': {
    title: 'Homework item',
    body: 'Students mark it done when it\'s handed in.',
  },
  'as-add': {
    title: 'Record a test',
    body: 'Subject, type, date and topics, noted in class while the teacher is talking about it.',
  },
  'as-plan': {
    title: 'A plan and the right way to revise',
    body: 'Short revision sessions spread out before the test, using the method that suits the subject: flashcards for vocab, practice questions for maths, brain dumps for subjects with lots of content.',
    try: 'Tap Show me what good looks like.',
  },
  'as-example': {
    title: 'What good looks like',
    body: 'An example of the method, so students know what they\'re aiming for.',
  },
};

/* ---------- Flows (shared screens are placed by the current section) ---------- */
const SECTIONS = {
  start: {
    label: 'Lesson start',
    steps: [
      ['Equipment check', ['ls-intro', 'ls-item']],
      ['Missing equipment', ['ls-bag', 'ls-spare', 'ls-partner', 'ls-hand']],
      ['Do you know what to do?', ['ls-know']],
      ['Photo of the starter', ['photo', 'analyse']],
      ['One small step', ['chunk']],
      ['Brain → friend → teacher', ['ladder-0', 'ladder-1', 'ladder-2']],
      ['Ready', ['ready']],
    ],
  },
  task: {
    label: 'Task start',
    steps: [
      ['Set the time', ['ts-set']],
      ['Where is the task?', ['ts-where', 'ts-classroom', 'ts-spoken', 'photo']],
      ['Who with?', ['ts-who']],
      ['Assessment?', ['ts-assess']],
      ['Do you know what to do?', ['ts-know', 'analyse', 'chunk', 'ladder-0', 'ladder-1', 'ladder-2']],
      ['Focus and check-ins', ['ts-focus', 'checkin', 'timeup', 'ts-done']],
    ],
  },
  end: {
    label: 'Lesson end',
    steps: [
      ['Pack up', ['le-pack']],
      ['Homework', ['le-hw', 'le-unsure', 'le-hwform']],
      ['Done', ['le-done']],
    ],
  },
  assess: {
    label: 'Assessments',
    steps: [
      ['Coming up', ['as-list', 'as-hw']],
      ['Record a test', ['as-add']],
      ['Revision plan', ['as-plan']],
      ['What good looks like', ['as-example']],
    ],
  },
};

const $ = (id) => document.getElementById(id);
const frame = $('app');
let section = null;
let current = null;

const stepIndex = (sec, screen) => SECTIONS[sec].steps.findIndex(([, ids]) => ids.includes(screen));

function showScreen(screen) {
  if (screen === current) return;
  current = screen;

  // Keep the current section if it contains this screen; otherwise find one.
  if (screen === 'home') section = null;
  else if (!section || stepIndex(section, screen) < 0) {
    section = Object.keys(SECTIONS).find((k) => stepIndex(k, screen) >= 0) || null;
  }

  const note = NOTES[screen] || { title: '', body: '' };
  $('calloutKicker').textContent = section ? SECTIONS[section].label : 'Home screen';
  $('calloutTitle').textContent = note.title;
  $('calloutBody').textContent = note.body;
  const tryEl = $('calloutTry');
  tryEl.hidden = !note.try;
  tryEl.querySelector('span').textContent = note.try || '';

  const c = $('callout');
  c.classList.remove('changed'); void c.offsetWidth; c.classList.add('changed');

  const flow = $('flow');
  if (!section) { flow.hidden = true; return; }
  const idx = stepIndex(section, screen);
  flow.hidden = false;
  $('flowLabel').textContent = `${SECTIONS[section].label}: the flow`;
  $('flowSteps').innerHTML = SECTIONS[section].steps
    .map(([label], i) => `<li class="${i === idx ? 'on' : i < idx ? 'done' : ''}">${label}</li>`).join('');
}

/* ---------- Messages from the app ---------- */
window.addEventListener('message', (e) => {
  if (e.source !== frame.contentWindow || !e.data || e.data.source !== 'ontrack') return;
  if (e.data.type === 'screen') showScreen(e.data.screen);
  if (e.data.type === 'state') {
    $('ctlSubject').value = e.data.subject;
    $('ctlSpeed').value = String(e.data.speed);
  }
});

/* ---------- Controls -> app ---------- */
const send = (type, value) => frame.contentWindow.postMessage({ source: 'ontrack-panel', type, value }, '*');
$('ctlSubject').onchange = (e) => send('subject', e.target.value);
$('ctlSpeed').onchange = (e) => send('speed', e.target.value);
$('ctlHome').onclick = () => send('home');
$('ctlReset').onclick = () => send('reset');

/* ---------- Fit the iPad to the space ---------- */
const SCREEN_W = 1180, SCREEN_H = 820, BEZEL = 24, PANEL_W = 340, GAP = 56, PAD = 24;
let k = 0.6;
function fit() {
  const wide = window.innerWidth > 1100;
  const availW = wide ? window.innerWidth - 2 * PAD - GAP - PANEL_W : window.innerWidth - 32;
  const availH = wide ? window.innerHeight - 2 * PAD : Infinity;
  k = Math.max(0.2, Math.min(availW / (SCREEN_W + 2 * BEZEL), availH / (SCREEN_H + 2 * BEZEL), 1.1));
  document.documentElement.style.setProperty('--k', k.toFixed(4));
  placeHand();
}

/* ---------- Pointing hand: shows where to tap first ---------- */
const hand = $('hand');
let handOn = true;
function placeHand() {
  if (!handOn) { hand.hidden = true; return; }
  let el = null;
  try { el = frame.contentDocument.querySelector('[data-go="start"]'); } catch (e) { /* cross-origin */ }
  if (!el) return;
  const r = el.getBoundingClientRect();           // in app (unscaled) pixels
  const x = r.left + r.width * 0.42, y = r.top + r.height * 0.62;
  hand.style.left = `${(BEZEL + x) * k}px`;
  hand.style.top = `${(BEZEL + y) * k}px`;
  hand.hidden = false;
}
function hideHand() { handOn = false; hand.hidden = true; }
window.addEventListener('message', (e) => {
  if (e.source !== frame.contentWindow || !e.data || e.data.source !== 'ontrack' || e.data.type !== 'screen') return;
  if (e.data.screen === 'home') { if (handOn) requestAnimationFrame(placeHand); }
  else hideHand();
});
$('ctlReset').addEventListener('click', () => { handOn = true; setTimeout(placeHand, 60); });
frame.addEventListener('load', () => { setTimeout(placeHand, 60); setTimeout(placeHand, 800); });

window.addEventListener('resize', fit);
fit();
showScreen('home');
