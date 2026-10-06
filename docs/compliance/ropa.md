# Record of Processing Activities (ROPA) — Skeleton

> Status: draft skeleton for the founder to complete with legal counsel
> before public launch. See SKILL.md Section 7 (Child Safety & NDPA).

## 1. Controller

- Name: ExamSpring (founder entity TBD)
- Contact: TBD
- DPO (if required): TBD
- Jurisdiction: Nigeria (NDPA 2023); data subjects primarily Nigerian minors
  and parents/guardians.

## 2. Processing Activities

| #   | Purpose                               | Data Categories                                               | Data Subjects                   | Legal Basis (NDPA)                       | Recipients                     | Retention                                |
| --- | ------------------------------------- | ------------------------------------------------------------- | ------------------------------- | ---------------------------------------- | ------------------------------ | ---------------------------------------- |
| 1   | Account registration & authentication | Name, email, password hash, DOB, role                         | Learner, parent, teacher, admin | Consent (guardian for minors) / contract | Auth/email provider (Resend)   | Account lifetime + 12 months, then erase |
| 2   | Guardian consent for minors           | Guardian name, email, consent evidence (token, timestamp, IP) | Guardian                        | Legal obligation / consent record        | Email provider                 | 7 years (evidence), per counsel          |
| 3   | Learning/practice progress            | Attempts, scores, mastery events, diagnostic results          | Learner                         | Contract / legitimate interest           | None (no third party)          | Account lifetime; erase on request       |
| 4   | Cohorts & assignments                 | Cohort, assignment metadata, progress aggregates              | Learner, teacher, parent        | Contract                                 | School/teacher (as authorized) | Term + 12 months                         |
| 5   | Payments (future)                     | Paystack reference, amount, status — never card data          | Parent                          | Contract                                 | Paystack                       | 7 years (tax)                            |
| 6   | Support & audit                       | Request logs, audit log, notification log                     | All                             | Legitimate interest / legal obligation   | None                           | 12 months (logs), 7 years (audit)        |

## 3. Data Subject Rights

Supported via in-product flows and `/v1` endpoints:

- Access — export user data (portability)
- Rectification — profile edit
- Erasure — account deletion (cascades to attempts, consent evidence retained
  per law)
- Restriction — freeze account
- Objection — opt out of non-essential processing
- Consent withdrawal — guardian revokes; learner account restricted

## 4. Security Measures

- bcrypt password hashing, JWT rotation, Redis rate limiting
- Helmet, CORS allowlist, body size limits, error filter (no stack traces)
- No PII in logs/URLs/errors; Pino with redaction
- Secrets in env/Doppler only; TLS in transit; R2/Postgres encryption at rest
- RLS + service-layer object-level authorization

## 5. International Transfers

TBD — hosting regions (Vercel/Railway/Upstash/R2) to be documented with
adequacy or safeguards assessment.

## 6. Breach Notification

Notify NITDA within 72 hours of becoming aware of a breach affecting personal
data, per NDPA. Runbook: TBD.

## 7. Review

Review this ROPA every 6 months and on any new processing activity.
