# Deploying ExamSpring

Web on **Vercel**, API on **Railway**, Postgres on Railway, Redis on Upstash
(SKILL.md 2.15, 3.12). The browser only talks to the Vercel domain: Next.js
rewrites `/api/*` to the Railway API, so the `SameSite=strict` refresh cookie
stays first-party.

```
browser ──▶ Vercel (Next.js PWA) ──/api/*──▶ Railway (NestJS API) ──▶ Postgres / Upstash Redis
```

Secrets live in Doppler or Infisical and are synced to each platform. Never
commit them.

## One-time setup per environment (staging, then production)

### 1. Database (Railway Postgres)

1. Add a Postgres service to the Railway project.
2. Its default connection string is the **owner** role. Store it as
   `MIGRATION_DATABASE_URL` on the API service.
3. Create the non-superuser app role so RLS applies (`docs/adr/0006`). Run the
   SQL in that ADR with a password from Doppler.
4. Set `DATABASE_URL` on the API service to the same host/database with the
   `examspring_app` user.

### 2. Redis (Upstash)

Create a database and set `REDIS_URL` to its `rediss://` URL.

### 3. API (Railway service from this repo)

`railway.toml` at the repo root builds the workspace, runs
`prisma migrate deploy` as the owner before each deploy, starts
`node backend/dist/main.js` and health-checks `/v1/health`.

| Variable                                  | Value                                       |
| ----------------------------------------- | ------------------------------------------- |
| `NODE_ENV`                                | `production`                                |
| `DATABASE_URL`                            | app role URL (see above)                    |
| `MIGRATION_DATABASE_URL`                  | owner URL                                   |
| `REDIS_URL`                               | Upstash `rediss://` URL                     |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | 64+ random chars each, different            |
| `WEB_ORIGIN`                              | `https://<vercel domain>`                   |
| `REFRESH_COOKIE_PATH`                     | `/api/v1/auth`                              |
| `RESEND_API_KEY`, `EMAIL_FROM`            | Resend key and verified sender              |
| `PAYSTACK_SECRET_KEY`                     | test key on staging, live key on production |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT`        | from Sentry                                 |

Point the Paystack webhook at `https://<vercel domain>/api/v1/billing/webhooks/paystack`.

### 4. Web (Vercel project `examspring-web`)

Project settings: **Root Directory = `frontend`** (uses `frontend/vercel.json`).

| Variable                               | Value                                              |
| -------------------------------------- | -------------------------------------------------- |
| `API_ORIGIN`                           | `https://<railway API domain>` (no trailing slash) |
| `NEXT_PUBLIC_API_URL`                  | `/api/v1`                                          |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` | from Sentry                                        |
| `SENTRY_AUTH_TOKEN`                    | optional, enables source map upload                |

### 5. First data

Run once against the new database (owner URL), with real admin credentials:

```bash
DATABASE_URL="$MIGRATION_DATABASE_URL" SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... pnpm db:seed
```

## Every release

1. CI green on the PR (lint, typecheck, migrate, 70 integration tests, build).
2. Merge → staging deploys from `main` (Vercel and Railway Git integrations).
3. Check staging: `/api/v1/health`, sign up as an adult and as a minor,
   guardian approval email, a diagnostic, offline practice + sync, on a real phone.
4. Promote to production.
5. `pnpm --filter @examspring/api sentry:test` once per environment to confirm
   Sentry receives events.

## Rollback

- Web: `vercel rollback <previous deployment url>` or "Instant Rollback" in the dashboard.
- API: redeploy the previous Railway deployment from the dashboard.
- Migrations are forward-only. A bad migration is fixed by a new migration,
  never by editing a merged one.
