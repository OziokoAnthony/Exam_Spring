# 0004: JWT access + rotating refresh tokens

## Status

Accepted (2026-10-02)

## Context

Auth must support short-lived sessions, revocation, and guardian consent
gating for minors. No third-party auth provider in the MVP stack.

## Decision

- Access token: JWT, 15 min, kept in memory on the client.
- Refresh token: 30 days, httpOnly cookie, rotated on every refresh; the
  `Session` row tracks device + expiry and supports logout/revocation.
- Passwords hashed with bcrypt.
- Email verification + password reset via single-use, hashed tokens.
- Rate limiting on all `/v1/auth/*` endpoints (Redis-backed).
- Minors (< 18 from DOB) get `PENDING_GUARDIAN_CONSENT` until a guardian
  approves via single-use token.

## Consequences

- Frontend stores tokens in memory + httpOnly cookie only; no localStorage
  tokens.
- Refresh-on-401 in the API client.
- Secrets via env only; never in code or logs.
