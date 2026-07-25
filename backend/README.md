# Ilé Èkó — Backend (IVPM)

Node.js + **Express 5** + **MongoDB Atlas** (Mongoose) + **Zod contracts** + **Vercel AI SDK**,
built to the architecture plan in the
[backend gist](https://gist.github.com/HoodieDan/771e35d50ef92196308def17399fa8d5).
Deployment target: Google Cloud Run.

## Status — all milestones implemented (M0–M6), 39 tests passing

| Milestone | What |
|---|---|
| **M0** | Foundation: env (zod), pino, mongoose (pool-sized), `/v1` API, `/health`, error handler, rate limiting, Dockerfile, tsup build, vitest |
| **M1** | Auth: register (role-restricted), login (email/phone), per-device `Session` (JWT `sid`), logout/list/revoke, change-password, capabilities in `SessionDTO` |
| **M2** | Ledger: `Lease → RentObligation → Payment → PaymentAllocation` (transactional), properties/units/tenants, materialized `Listing`, dashboard/stats, uploads, idempotency, outbox |
| **M3** | Team: `TeamInvitation` + accept, per-property RBAC (`OrgContext`), landlord-only guards, caretaker access |
| **M4** | Marketplace: public listings/search/recommendations (browse-first), saved-listings, two-sided enquiries, listing views, tenant preferences |
| **M5** | AI: injectable engine (isolates the SDK), deterministic risk score/band, chat, briefing/briefs, rent-suggestion, NL search — all with `degraded` fallbacks |
| **M6** | Notifications + Expo push (via outbox), reminders daily sweep (idempotent), crash-safe outbox worker, seed (prod-refusal + random creds), Terraform infra |

## Quick start

```bash
pnpm install
cp .env.example .env          # set MONGODB_URI + JWT_SECRET (16+ chars)
pnpm dev                      # http://localhost:4000  (health: /health, API: /v1)
```

Optional: `WORKER_INLINE=true` drains the outbox in-process for local dev.
`AI_API_KEY` unset → AI features return `degraded: true` (never hang).

## Scripts

`pnpm dev` · `pnpm build` · `pnpm start` · `pnpm typecheck` · `pnpm test` · `pnpm seed`
(tests spin up an in-memory replica set — real transactions.)

## Layout

```
src/
  config/        env, logger, db (pool)
  contracts/     zod DTOs = source of truth (auth, property, ledger, listing, ai, …)
  models/        Mongoose schemas (users, ledger, listing, outbox, sessions, …)
  middleware/    authenticate (jwt+session), org (per-property RBAC), validate,
                 idempotency, optionalAuth, rateLimit, errorHandler
  rbac/          capability resolver + access (OrgContext)
  services/      ledger, stats, activityLog, outbox, notify, reminders, storage, occupancy
  ai/            engine (injectable seam), retry, risk (deterministic)
  worker/        outbox consumer (claim/lock + EffectDelivery, at-least-once)
  presenters/    document → DTO
  modules/       auth account properties units tenants leases payments dashboard
                 activity uploads team listings search recommendations saved
                 enquiries ai notifications tasks
  seed/          demo world (prod-refusal, random creds)
infra/           Terraform (Cloud Run + GCS + Scheduler + IAM)
```

## Notes

- Built as a **self-contained project** for now (contracts local to `src/contracts`);
  per the plan these extract into a shared `@ile-eko/contracts` package during the
  frontend migration.
- **Deploy** (needs your GCP project, MongoDB Atlas, AI key): see the gist §13 —
  build to Artifact Registry, `gcloud run deploy` with secrets, Cloud Scheduler →
  `/tasks/daily-sweep`, Cloud Tasks → `/tasks/outbox` (OIDC).
