# ExamSpring Nigeria — Claude Code Instructions

Read `SKILL.md` at the repo root before writing any code. It is the master
specification. This file is the condensed version.

## What This Project Is

ExamSpring is a mobile-first, offline-capable exam-prep platform for Nigerian
students. It supports 6 exams (FSLC, BECE, NECO, NABTEB, WAEC/JAMB, POST UTME)
in its data model. The MVP launches with WAEC/JAMB Math + English content only.

It is NOT a generic AI tutor. It is an auditable exam-readiness system. Every
question maps to a syllabus objective and has human review and provenance.

## The 8 Non-Negotiables

1. Child safety first — most users are minors
2. NDPA compliance (Nigeria Data Protection Act 2023)
3. Content provenance — no scraped content, ever
4. Human review of every question
5. Deterministic scoring — AI never scores
6. AI optional — product works without the tutor
7. Offline-capable — core learning works without internet
8. No data selling

## Locked Tech Stack

- TypeScript strict. No `any`. No JS in src/
- Frontend: Next.js 14 (App Router), Tailwind, shadcn/ui, Zustand, React Hook Form + Zod, TanStack Query, next-pwa, Dexie
- Backend: NestJS, Node 20, REST, Zod, JWT + bcrypt, BullMQ, Pino, Sentry
- DB: Postgres 15+, Prisma, RLS, pgcrypto/pg_trgm/citext
- Cache: Redis (Upstash)
- Storage: Cloudflare R2 + CDN
- Payments: Paystack
- Email: Resend + React Email
- AI (Phase 2): OpenAI + pgvector, closed corpus
- Tests: Vitest, Playwright, Supertest
- Deploy: Vercel + Railway/Fly + Upstash + R2 + GitHub Actions
- Monorepo: pnpm + Turborepo
- Secrets: Doppler or Infisical

## Architecture Rules

- Modular monolith. No microservices, no K8s, no GraphQL, no WebSockets
- Backend modules: identity, curriculum, questions, attempts, mastery,
  content-packs, cohorts, reports, billing, notifications, audit, health
- Frontend route groups: (auth), (learner), (parent), (teacher), (admin)
- API: `/v1/`. Response envelope: `{success, data|error, meta}`
- Cursor pagination. `Idempotency-Key` on mutations
- Auth: JWT access (15 min, in memory) + refresh (30d, httpOnly, rotated)
- Roles: LEARNER, PARENT, TEACHER, ADMIN. Object-level authz in service layer
- RLS on tenant-scoped tables
- Transactional outbox for all external side effects
- Append-only: attempts, attempt_items, mastery_events, audit_log,
  question_versions, payment_events

## Coding Rules

- Strict TypeScript. No `any`. No `as` without reason. No non-null without check
- Named exports only (except Next.js pages)
- Absolute imports (`@/`, `@app/`)
- Max 400 lines/file, 50 lines/function, 4 params, 4 nesting levels
- No `console.log`. Use Pino (backend) or remove (frontend)
- No commented-out code. No orphan TODOs
- Zod validates all inputs and external data
- All API calls via `lib/api` client. No raw `fetch` in components
- Server Components by default. Client only when needed
- No N+1. No `select: *`. No `findMany`/`delete` without `where`
- No raw SQL except documented cases
- No hardcoded config. Env vars only
- No new dependencies without approval
- Pin exact versions
- Conventional Commits
- PR < 500 lines

## Security Rules (Never Break)

- Never trust the client
- Every resource access checks ownership in the service layer
- Every input validated with Zod
- Every external response treated as untrusted
- No PII in logs, URLs, or errors
- No secrets in code or committed files
- Rate limit every public endpoint
- Idempotent every mutating endpoint
- OWASP API Top 10 compliance
- Children's data is sacred

## Child Safety Rules

- Minors (< 18) require guardian consent before activation
- Data minimization — collect only what the product uses
- Every data subject right supported: access, rectification, erasure,
  restriction, portability, objection
- Retention schedule enforced
- Plain-language privacy notice
- No marketing to minors. No trackers. No ads
- Parent sees progress, not conversations
- Lawyer reviews before public launch

## AI Tutor Rules (Phase 2)

- Closed corpus only. No open web. No general knowledge
- Citations required in every response
- Refusal is a feature (target 10–25% refusal rate)
- Safety escalates immediately to human review
- Cost capped (20/day free, 100/day paid)
- Every interaction logged
- Model changes tested with red-team suite
- Kill switch required

## Top 20 "Never Do"

1. Never use `any`
2. Never `console.log`
3. Never raw `fetch` in components
4. Never skip authz on a resource
5. Never log PII
6. Never commit secrets
7. Never edit merged migrations
8. Never skip idempotency on mutations
9. Never call external API in a DB transaction
10. Never add a dependency without approval
11. Never build outside MVP scope (Section 2 of SKILL.md)
12. Never let AI score answers
13. Never let the tutor use open web
14. Never scrape exam content
15. Never publish unreviewed questions
16. Never skip tests on critical paths
17. Never merge with failing CI
18. Never deploy without staging test
19. Never skip the response envelope
20. Never bypass SKILL.md without founder approval

## Definition of Done

A task is done when it is: tested, reviewed, deployed, monitored, documented.
All five. Plus mobile verification, empty/loading/error states, rollback plan.

## Workflow

1. Read SKILL.md first
2. Read Section 12 (Current Sprint) for what to work on
3. Work on one task at a time
4. Write code that follows Sections 4 and 6
5. Test before marking done (Section 11)
6. Never violate Section 10
7. When in doubt, ask the founder

## Current Sprint

See SKILL.md Section 12.2 for the current sprint tasks and acceptance
criteria. Always work from the current sprint list.

## The Meta-Rule

When in doubt, ask the founder. Do not guess. Do not creatively interpret
rules. Do not build things not in scope. The SKILL.md is the contract.