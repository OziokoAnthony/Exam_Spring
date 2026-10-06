# ExamSpring (MVP slice)

Mobile-first, offline-capable exam-readiness platform for Nigerian students.

## Layout

- `frontend` — Next.js 14 PWA (port 3000)
- `backend` — NestJS API (port 3001, `/v1/`)
- `packages/shared` — Zod schemas, types, constants
- `packages/db` — Prisma schema, migrations, seed

## Day 1–9 built

- Day 1: monorepo, Docker Compose (Postgres 5434, Redis 6380), Prisma, lint/format hooks
- Day 2: auth backend — signup/login/refresh/logout/reset/verify, JWT + bcrypt, Zod, rate limiting, envelope, integration tests
- Day 3: consent flow (guardian invite/approve), Resend email, outbox + BullMQ worker
- Day 4: auth frontend — signup/login/verify/reset pages, API client with refresh-on-401, Zustand auth store
- Day 5: role dashboards (empty shells), GitHub Actions CI
- Day 6: curriculum models (Exam/ExamVersion/Subject/Objective), question bank + versions, admin question CRUD, seed (WAEC Math, 5 objectives, 15 questions)
- Day 7: diagnostic — 15-question attempt, server-side scoring, mastery events + scores, frontend UI
- Day 8: practice loop — deterministic recommendation, practice session, submission, explanation review
- Day 9: polish + demo (this README)

## Run locally

```powershell
docker compose up -d
pnpm install
cp .env.example backend/.env   # adjust secrets
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Web: http://localhost:3000
API health: http://localhost:3001/v1/health

Key pages: `/login`, `/signup`, `/learner`, `/learner/diagnostic`, `/learner/practice`, `/consent/pending`, `/consent/approve`.

## Tests

```powershell
pnpm --filter @examspring/api test
```

## Deferred (founder action required)

- Resend live key, Sentry DSN, Vercel/Railway/GitHub deploy secrets
- Founder-authored real question bank (currently placeholders)
- Day 10+ polish: offline packs, CBT timer, parent/teacher features, payments
