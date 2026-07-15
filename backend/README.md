# Ilé Èkó — Backend (IVPM)

Node.js + **Express 5** + **MongoDB Atlas** (Mongoose) + **Zod contracts**, built to the
architecture plan in the [backend gist](https://gist.github.com/HoodieDan/771e35d50ef92196308def17399fa8d5).
Deployment target: Google Cloud Run. AI (Vercel AI SDK) lands in M5.

## Status

**M0 (foundation) + M1 (auth) — implemented and tested.**

- Config validated via Zod (`src/config/env.ts`), pino logging, Mongoose connection with pool sizing.
- Express app under `/v1`, `/health` at root, central `{ message }` error handler, `asyncHandler`, rate limiting.
- Zod **contracts** as the single source of truth (`src/contracts/`) — Role, Capability enum, envelope, auth/user/session DTOs.
- **Auth (§6.1, §8):** register (role restricted to `landlord|tenant`), login (email or phone), per-device
  **Session** model (JWT carries `sid`), `/auth/session` (user + capabilities), logout (single device),
  list/revoke sessions, `register-push`, and dedicated `/account/change-password` (revokes other sessions).
- **RBAC:** capability resolver delivered to the client via `SessionDTO` (never re-derived on the frontend).
- **Tests:** health + auth (forbidden-role rejection, per-device revocation) on `MongoMemoryReplSet`.

Not yet built: M2 ledger/CRUD, M3 team, M4 marketplace, M5 AI, M6 uploads/notifications/scheduler.

## Quick start

```bash
pnpm install
cp .env.example .env          # set MONGODB_URI + JWT_SECRET (16+ chars)
pnpm dev                      # http://localhost:4000  (health: /health)
```

## Scripts

| Script | Does |
|---|---|
| `pnpm dev` | Run with reload (tsx) |
| `pnpm build` | Bundle to `dist/` (tsup) |
| `pnpm start` | Run the built server |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest integration tests (spins up an in-memory replica set) |

## Layout

```
src/
  config/        env (zod), logger (pino), db (mongoose + pool)
  contracts/     zod DTOs = source of truth (Role, Capability, auth, user)
  models/        User, Session, IdempotencyRecord
  middleware/    authenticate (jwt+session), authorize, validate, errorHandler, rateLimit
  rbac/          capability resolver
  presenters/    document → DTO mapping (not toJSON)
  modules/       auth/, account/  (routes + controller + service)
  utils/         AppError, asyncHandler, jwt, password, duration
```

## Notes

- Built as a **self-contained project** for now (contracts local to `src/contracts`). Per the plan these
  contracts extract into a shared `@ile-eko/contracts` package during the frontend migration.
- Cloud provisioning (GCP project, MongoDB Atlas, AI keys) is deferred to deploy time — see the gist §13.
