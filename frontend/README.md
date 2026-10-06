# ExamSpring Web (frontend)

Next.js 14 App Router, Tailwind, Zustand, React Hook Form + Zod, TanStack
Query, next-pwa, Dexie (offline).

## Routes

- `(auth)` — signup, login, verify-email, reset-password, consent pending/approve
- `(learner)` — dashboard, diagnostic, practice
- `(parent)` — linked learners' progress
- `(teacher)` — cohorts, assignments
- `(admin)` — question review/CRUD

## Run

```powershell
pnpm --filter @examspring/web dev   # http://localhost:3000
```

API base URL via `NEXT_PUBLIC_API_URL` (see `.env.example`). All API calls go
through `src/lib/api` — no raw `fetch` in components. Tokens live in memory;
refresh token in httpOnly cookie; refresh-on-401 in the client.
