# ▶ [Open the live demo](https://kswilson.github.io/on-track-demo/)

**https://kswilson.github.io/on-track-demo/**

App on its own (for an iPad home screen): https://kswilson.github.io/on-track-demo/app/

---

## Lesson mode (On Track demo)

This is **Lesson mode**: the in-class part of the app. A classroom companion for students who struggle with executive function: getting started, staying on task, and packing up. It prompts students towards independence (brain → friend → teacher) and never gives subject answers.

This is a clickable demo. The AI steps are scripted.

## The four buttons

- **Lesson start**: checks up to 3 items of equipment, one question at a time, based on the lesson (from the school timetable; the teacher presets the items). If something is missing: check your bag → ask the teacher for a spare → share with a partner → raise your hand. Then "Do you know what to do?" If not, take a photo of the starter and the app shows only the part to focus on.
- **Task start**: a big countdown timer (tap +1/+2/+5/+10), then where the task is (paper / Google Classroom / spoken), who you're working with, and whether it's an assessment. It flashes a check-in every 25% of the time.
- **Lesson end**: pack-up checklist, including anything borrowed at lesson start, then homework.
- **Assessments**: record a test, get a spaced revision plan and the best method for that subject (e.g. flashcards for vocab), with an example of what a good one looks like.

## Two pages

- **`/` (presenter page)**: the app running on a landscape iPad, with notes on the right that follow whatever screen the app is on, plus demo controls (lesson, timer speed, reset). Use this for presentations.
- **`/app/`**: the app on its own. Open it on an iPad and use *Add to Home Screen*. Its own **Demo settings** (bottom of the home screen) appear only when it isn't inside the presenter page.

Speed the timer up (10× or 60×) to show the check-ins quickly.

## Run locally

No build step. Open `index.html`, or serve the folder:

```
python3 -m http.server 8000
```

## Structure

| File | What it does |
| --- | --- |
| `index.html`, `demo.css`, `demo.js` | Presenter page. Notes for each screen are in `NOTES` in `demo.js` |
| `app/index.html` | App shell |
| `app/style.css` | App colours (top of file) and layout |
| `app/app.js` | All the screens and flows. Lesson presets are at the top (`SUBJECTS`) |
| `app/assets/` | Example starter worksheet and icons |

The app tells the presenter page which screen it's showing via `postMessage` (each `card()` has a `screen` id), and the panel sends settings back the same way.

Deploys automatically to GitHub Pages on push to `main`.
