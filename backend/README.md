# ExamSpring API (backend)

NestJS 10 modular monolith. All routes under `/v1/`. Envelope:
`{ success, data | error, meta }`.

## Modules

- `identity` — signup, login, refresh, logout, password reset, email verify,
  JWT + bcrypt, rate limiting
- `consent` — guardian invite/approve, `ConsentRecord` evidence
- `mail` + `outbox` — Resend templates, transactional outbox, BullMQ worker
- `curriculum` — exams, versions, subjects, objectives
- `questions` — question bank, versions, admin CRUD
- `attempts` — diagnostic, practice loop, deterministic scoring, mastery events
- `parent` — parent views of linked learners
- `teacher` — cohorts, assignments, progress
- `redis` — rate limiting, cache
- `common`, `config`, `database` — env validation, Prisma client, filters

## Run

```powershell
docker compose up -d          # Postgres on 5434, Redis on 6380
pnpm install
cp .env.example backend/.env  # adjust secrets
pnpm db:migrate
pnpm db:seed
pnpm --filter @examspring/api dev   # http://localhost:3001/v1/health
```

## Test

```powershell
pnpm --filter @examspring/api test
```

Requires Postgres + Redis running locally (see docker-compose.yml).
