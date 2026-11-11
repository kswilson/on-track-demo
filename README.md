# On Track (demo)

A classroom companion for students who struggle with executive function: getting started, staying on task, and packing up. It prompts students towards independence (brain → friend → teacher) and never gives subject answers.

This is a clickable demo. The AI steps are scripted.

## The four buttons

- **Lesson start**: checks up to 3 items of equipment, one question at a time, based on the lesson (preset by the teacher). If something is missing: check your bag → ask the teacher for a spare → share with a partner → raise your hand. Then "Do you know what to do?" If not, take a photo of the starter and the app shows only the part to focus on.
- **Task start**: a big countdown timer (tap +1/+2/+5/+10), then where the task is (paper / Google Classroom / spoken), who you're working with, and whether it's an assessment. It flashes a check-in every 25% of the time.
- **Lesson end**: pack-up checklist, including anything borrowed at lesson start, then homework.
- **Assessments**: record a test, get a spaced revision plan and the best method for that subject (e.g. flashcards for vocab), with an example of what a good one looks like.

Open **Demo settings** on the home screen to switch lesson or speed the timer up (10× or 60×) so check-ins can be shown quickly.

## Run locally

No build step. Open `index.html`, or serve the folder:

```
python3 -m http.server 8000
```

## Structure

| File | What it does |
| --- | --- |
| `index.html` | Page shell |
| `style.css` | Colours (top of file) and layout |
| `app.js` | All the screens and flows. Lesson presets are at the top (`SUBJECTS`) |
| `assets/` | Example starter worksheet and icons |

Deploys automatically to GitHub Pages on push to `main`.
