# Student Programming Learning Platform

A self-paced learning platform for students covering 8 tracks:
**C, C++, Java, Python, MySQL, MongoDB, React, Networking.**

Text-based lessons with code snippets, per-module progress tracking, and an
admin-managed test module with auto-grading for coding tracks.

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
| **2. Course delivery** | Catalog of 8 tracks, text lessons with code snippets, per-module progress tracker |
| **3. Test module** | Test bank (I/O pairs for coding tracks, MCQ/short-answer for the rest), per-student one-time time-limited access code gate, sandboxed judge engine |
| **4. Admin panel** | Content CRUD, test creator + access-code export, progress & score reports |

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

# 2. Load the schema and seed data
docker compose exec -T mysql mysql -uroot -proot learning_platform < db/schema.sql
docker compose exec -T mysql mysql -uroot -proot learning_platform < db/seed.sql

# 3. Backend
cd backend
cp .env.example .env
npm install
npm run dev            # http://localhost:4000

# 4. Frontend
cd ../frontend
npm install
npm run dev            # http://localhost:5173
```

### Default seed accounts

| Role | Login | Password |
|------|-------|----------|
| Admin | `admin` | `admin123` |
| Student | roll `S001` | `student123` |

Change these before any real deployment.

---

## Judge engine safety

Submitted student code for the 4 coding tracks (C, C++, Java, Python) is **never**
executed on the API server. The backend calls the Piston container over HTTP;
Piston runs each submission in its own isolated, resource-limited sandbox.
See [judge/README.md](judge/README.md).
