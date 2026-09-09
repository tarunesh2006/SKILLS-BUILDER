# Student Programming Learning Platform

A self-paced learning platform for students covering 8 tracks:
**C, C++, Java, Python, MySQL, MongoDB, React, Networking.**

Text-based lessons with code snippets, automatic per-module progress
tracking (Cisco-style: a module completes once every lesson is opened and
its quiz passed), and an admin-managed test module with auto-grading for
coding tracks.

> Reference model: Cisco Networking Academy's site architecture
> (catalog → course content → progress tracking → admin-managed testing),
> adapted to this scope.

### Out of scope
- No video content
- No interactive coding labs
- No completion certificates

---

## Architecture — 4 layers

| Layer | What it does |
|-------|--------------|
| **1. Access** | Students sign in with **Google** (college account); on first login they set a username + roll number. Email/password stays as a hidden fallback for demo accounts. Admins sign in by username + password. |
| **2. Course delivery** | Catalog of 8 tracks, text lessons with code snippets, a per-module *"check your understanding"* MCQ quiz (retakeable, immediate feedback), and **automatic completion** — a module is marked complete once the student has opened every lesson in it *and* passed its quiz. No manual "mark complete". |
| **3. Test module (contest-style)** | Admin-built contests: a scheduled open/close window + per-attempt time limit, per-student one-time access **token delivered in-app** (shown on the student's *My tests* page with one-click Start), per-question **Run** (sample cases, unscored) and **Submit** (all cases, scored), **multiple submissions** with best-or-last scoring, and a live **leaderboard** ranked by score then time penalty. Sandboxed judge engine. |
| **4. Admin panel** | Content CRUD (incl. module quiz questions), a tabbed test editor (Details / Questions / Participants / Leaderboard / Statistics), and progress / module-quiz / test-score reports |

> **Two kinds of assessment.** *Module quizzes* live with the course content — short self-checks, no gate, take them anytime. *Tests* are the formal, token-gated contests the admin builds and assigns per student. They are different tables, different screens, different UI sections.

## Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MySQL — single relational DB for everything
- **Judge engine:** [Piston](https://github.com/engineer-man/piston) via Docker, isolated from the main backend

MongoDB is a *subject taught on the platform*, not part of its infrastructure.

---

## Repository layout

```
db/            SQL schema + seed data
backend/       Express API (auth, catalog, progress, tests, admin)
frontend/      React SPA (student + admin UIs)
judge/         Docker Compose for the Piston sandbox
docker-compose.yml   Dev orchestration (mysql + piston)
```

---

## Getting started

Prerequisites: **Node.js 20+**, **Docker + Docker Compose**.

```bash
# 1. Start MySQL + the Piston judge sandbox
docker compose up -d

# 2. Load the schema and seed data (--default-character-set keeps UTF-8 intact)
MYSQL="docker compose exec -T mysql mysql -uroot -proot --default-character-set=utf8mb4 learning_platform"
$MYSQL < db/schema.sql
$MYSQL < db/seed.sql                    # 8 tracks + a little sample content
$MYSQL < db/seed_c_track.sql                    # C track: 10 modules, ~39 lessons, 6 code assessments
$MYSQL < db/seed_c_module_quizzes.sql           # C per-module quizzes (50 MCQs)
$MYSQL < db/seed_networking_track.sql           # Networking track: 12 modules, ~49 lessons, 4 MCQ assessments
$MYSQL < db/seed_networking_module_quizzes.sql  # Networking per-module quizzes (60 MCQs)
# (schema.sql already includes every table; the db/migrations/*.sql files are
#  only for upgrading a database created before those features existed —
#  e.g. db/migrations/003_contest_tests.sql adds the contest columns + Google.)

# 3. Backend
cd backend
cp .env.example .env
npm install
npm run seed           # admin + demo students (hashed passwords)
npm run dev            # http://localhost:4000

# 4. Frontend
cd ../frontend
npm install
npm run dev            # http://localhost:5173

# 5. Install the judge runtimes (one-time) — see judge/README.md
for p in '{"language":"python","version":"3.12.0"}' \
         '{"language":"java","version":"15.0.2"}' \
         '{"language":"gcc","version":"10.2.0"}'; do
  curl -s -XPOST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d "$p"
done
```

### Default seed accounts

| Role | Sign in with | Password |
|------|--------------|----------|
| Admin | username `admin` | `admin123` |
| Student | email `asha@example.edu` (or roll `S001`) | `student123` |

Admins sign in by username. Students normally sign in with Google; the seeded
demo students above use the email/password fallback (kept available while
`ALLOW_PASSWORD_LOGIN` is not `false`). Change these before any real deployment.

### Enabling Google Sign-In for students

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials →
   OAuth client ID → Web application**.
2. Add `http://localhost:5173` under **Authorised JavaScript origins**.
3. Put the client ID in `backend/.env` as `GOOGLE_CLIENT_ID` (and the secret as
   `GOOGLE_CLIENT_SECRET`), then restart the backend.

The backend verifies the Google ID token itself (no extra npm package). While
`GOOGLE_CLIENT_ID` is empty the login screen just shows the email/password form.
On their first Google login a student is sent to **/complete-profile** to choose
a username and enter their roll number.

### Adding more users (admins and students)

```bash
cd backend
npm run create-admin   -- --username jane --name "Jane Doe" --password 's3cret!'
npm run create-student -- --roll S010 --name "Sam Lee" --email sam@uni.edu --password 'pw'
```

Omit `--password` and a strong one is generated and printed once. Re-running
with an existing username/roll updates that account (including its password).
Pass `--inactive` to create the account disabled.

### Running a contest (test module)

1. **Admin → Tests → New contest / test** — pick a track, set the open/close
   window, an optional per-attempt time limit, and the scoring mode
   (keep *best* or *last* submission).
2. Open it and use the tabs:
   - **Questions** — add coding questions (stdin → expected stdout, mark some
     cases *visible sample*) or MCQ / short-answer for non-coding tracks.
     *Or import instead of typing:*
     - **From a URL** — paste a problem page; the server fetches it and
       best-effort extracts the statement + visible sample cases into the form
       for review. (Works well on static problem pages e.g. CSES, Codeforces,
       Kattis; some sites block bots or need JS — then paste the text into bulk
       import instead. Only import content you have the right to use.)
     - **Bulk import** — paste or upload **JSON**, **CSV** or **Markdown** with
       many questions at once. Formats:
       - *JSON*: `[{ "type": "coding", "prompt": "...", "points": 30,
         "cases": [{ "input": "3", "output": "9", "sample": true }] }, ...]`
         (`mcq` uses `"options": [{ "label": "...", "isCorrect": true }]`).
       - *CSV* (MCQ): `type,prompt,points,optionA,optionB,optionC,correct`
         with `correct` as a letter (`B`) or the option text.
       - *Markdown*: questions separated by a line of `---`, optional first line
         `@type=mcq points=5`, coding samples as paired ```` ```in ```` / ```` ```out ````
         fences, MCQ options as `- [x]` / `- [ ]` lines.
   - **Participants** — assign selected students or *all active students*. Each
     gets a one-time token; it appears on their **My tests** page automatically.
   - **Details** — flip **Published** on when it's ready.
3. **Student → My tests** — the card shows the token, a countdown, and a
   **Start** button. Inside, each question has **Run** (sample cases, no score)
   and **Submit** (all cases, scored). Students may submit repeatedly.
4. **Leaderboard / Statistics** tabs (admin) and the in-test **Leaderboard** tab
   (student, if enabled) update live — rank is score, then total time-to-best
   penalty, then who reached the score first.

---

## Judge engine safety

Submitted student code for the 4 coding tracks (C, C++, Java, Python) is **never**
executed on the API server. The backend calls the Piston container over HTTP;
Piston runs each submission in its own isolated, resource-limited sandbox.
See [judge/README.md](judge/README.md).
