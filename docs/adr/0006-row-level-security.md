# 0006: Postgres row-level security for tenant isolation

## Status

Accepted (2026-10-22)

## Context

SKILL.md 3.4 and 5.15 require RLS on every tenant-scoped table (`questions`,
`cohorts`, `assignments`, `tenant_memberships`). At MVP every row is global
(`tenant_id IS NULL`); school tenants come later. Isolation has to be in place
before the first tenant row exists, not retrofitted after.

## Decision

- Migration `tenants_and_rls` adds `tenants`, `tenant_memberships` and
  `assignments.tenant_id`, then enables **and forces** RLS on the four tables
  with the SKILL.md policy:
  `tenant_id IS NULL OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid`
  (`tenant_memberships` has no global rows, so only the second clause).
- `FORCE ROW LEVEL SECURITY` makes the policy apply to the table owner too.
- `current_setting(..., true)` returns NULL when unset, so a connection that has
  not chosen a tenant sees and writes only global rows. Fail-safe by default.
- Code that touches tenant data runs inside `withTenant(tenantId, fn)` from
  `@examspring/db`, which sets `app.tenant_id` with `set_config(..., true)` —
  local to that transaction, so pooled connections never leak a tenant.

## Runtime role requirement

Postgres **superusers and roles with BYPASSRLS ignore RLS entirely**, even when
forced. Railway's default `postgres` user is a superuser. Production and staging
therefore use two connection strings:

| Variable                 | Role                                                         | Used by                      |
| ------------------------ | ------------------------------------------------------------ | ---------------------------- |
| `MIGRATION_DATABASE_URL` | owner (may be superuser)                                     | `prisma migrate deploy` only |
| `DATABASE_URL`           | `examspring_app`: `NOSUPERUSER NOBYPASSRLS`, DML grants only | the API                      |

Create the app role once per environment:

```sql
CREATE ROLE examspring_app LOGIN PASSWORD '<from Doppler>' NOSUPERUSER NOBYPASSRLS;
GRANT CONNECT ON DATABASE railway TO examspring_app;
GRANT USAGE ON SCHEMA public TO examspring_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO examspring_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO examspring_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO examspring_app;
```

## Consequences

- `backend/test/rls.spec.ts` proves isolation by switching to a non-superuser
  role inside a transaction; local Docker connects as a superuser, so ordinary
  tests are unaffected.
- Any future tenant feature must go through `withTenant`; queries outside it
  cannot see tenant rows, which is the intended failure mode.
- `tenant_id` columns on `users`, `questions`, `cohorts` and `assignments` do not
  yet have foreign keys to `tenants`; add them with the first tenant feature.
