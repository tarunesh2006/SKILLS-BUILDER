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
| **1. Access** | Separate login for students (roll number + password) and admin (restricted) |
| **2. Course delivery** | Catalog of 8 tracks, text lessons with code snippets, a per-module *"check your understanding"* MCQ quiz (retakeable, immediate feedback), and **automatic completion** — a module is marked complete once the student has opened every lesson in it *and* passed its quiz. No manual "mark complete". |
| **3. Test module** | A **separate** admin-managed component: test bank (I/O pairs for coding tracks, MCQ/short-answer for the rest), per-student one-time time-limited access-code gate, sandboxed judge engine |
| **4. Admin panel** | Content CRUD (incl. module quiz questions), test creator + access-code export, and progress / module-quiz / test-score reports |

> **Two kinds of assessment.** *Module quizzes* live with the course content — short self-checks, no gate, take them anytime. *Tests* are the formal, code-gated exams the admin builds and unlocks per student. They are different tables, different screens, different UI sections.

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
#  only for upgrading a database created before those features existed.)

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

Students authenticate by university email or roll number; admins by username.
Change these before any real deployment.

### Adding more users (admins and students)

**From the admin panel:** sign in as an admin → **People** → *Add a user*.
Pick the role, fill in the details, and either type a password or hit
*Suggest*. The new password is shown once on the confirmation card. The same
screen lists all users and lets you disable an account or reset a password.

**From the command line** (no UI needed):

```bash
cd backend
npm run create-admin   -- --username jane --name "Jane Doe" --password 's3cret!'
npm run create-student -- --roll S010 --name "Sam Lee" --email sam@uni.edu --password 'pw'
```

Omit `--password` and a strong one is generated and printed once. Re-running
with an existing username/roll updates that account (including its password).

---

## Judge engine safety

Submitted student code for the 4 coding tracks (C, C++, Java, Python) is **never**
executed on the API server. The backend calls the Piston container over HTTP;
Piston runs each submission in its own isolated, resource-limited sandbox.
See [judge/README.md](judge/README.md).
