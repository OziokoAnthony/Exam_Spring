# 0003: Postgres + Prisma

## Status

Accepted (2026-10-02)

## Context

Data must be relational (users, sessions, attempts, mastery events,
questions), auditable, and migratable without downtime. Children's data
requires access control and retention enforcement.

## Decision

PostgreSQL 15 via Prisma ORM, migrations in `packages/db/prisma/migrations`.
Append-only tables (attempts, mastery_events, audit_log, question_versions,
outbox_events) are never updated in place. Row-level security (RLS) is a
planned hardening step; today authorization is enforced in the service layer.
Extensions: pgcrypto, citext, pg_trgm.

## Consequences

- `pnpm db:migrate` / `pnpm db:seed` from the root.
- Never edit a merged migration — add a new one.
- No `select: *`, no `findMany` without `where`, no N+1.
