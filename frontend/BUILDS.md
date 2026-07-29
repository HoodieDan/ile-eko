# Builds, previews & versioning

Two Expo apps, each its own EAS project:

| App | Directory | Slug | EAS project id |
|---|---|---|---|
| Ilé Èkó (landlord) | `apps/landlord` | `ile-eko` | `f6b31e93-9b6a-4f53-bd57-2c319a9243f1` |
| Ilé Èkó Homes (tenant) | `apps/tenant` | `ile-eko-homes` | `91017f07-4da0-4f8d-a05f-10ed1251c59b` |

## One-time setup

```bash
pnpm install
pnpm exec eas login          # or export EXPO_TOKEN=...
```

For the PR-preview workflow, add a repo secret:
1. **expo.dev → Account Settings → Access Tokens → Create token**
2. **GitHub → Settings → Secrets and variables → Actions → New secret**
   `EXPO_TOKEN` = that token

## Build profiles (`apps/*/eas.json`)

| Profile | Distribution | Channel | Use |
|---|---|---|---|
| `development` | internal | `development` | Dev client — **install this once per device to view PR previews** |
| `development-simulator` | internal | `development` | iOS Simulator build |
| `preview` | internal (APK) | `preview` | Shareable test build; no store account needed |
| `production` | store | `production` | Store submission; `autoIncrement` bumps the native build number |

Every profile injects `EXPO_PUBLIC_API_URL` pointing at the deployed API, so a
build never accidentally ships pointing at `localhost`.

## Commands

Run from `frontend/`:

```bash
# Builds
pnpm build:landlord:dev        # dev client (install once, then use PR previews)
pnpm build:landlord:preview    # shareable APK / internal iOS build
pnpm build:landlord:prod       # store build, auto-incremented build number
pnpm build:tenant:dev
pnpm build:tenant:preview
pnpm build:tenant:prod
pnpm build:all:preview         # both apps, preview profile

# OTA updates — ship JS-only changes to EXISTING builds (no rebuild, ~1 min)
pnpm update:landlord "fix: dashboard copy"
pnpm update:tenant   "fix: search filters"
pnpm update:landlord:prod "hotfix: payment total"

# Versions
pnpm version:landlord patch    # 0.1.0 → 0.1.1
pnpm version:tenant  minor     # 0.1.0 → 0.2.0
pnpm version:all     1.0.0     # set both explicitly
```

## Versioning model

- **`expo.version` in `app.json` is the source of truth.** `pnpm version:*` bumps it
  and keeps the app's `package.json` in lockstep.
- **Native build numbers are not in the repo.** The `production` profile sets
  `autoIncrement`, so EAS assigns the next iOS `buildNumber` / Android
  `versionCode` on every build — no manual bookkeeping, no collisions.
- **`runtimeVersion` follows `appVersion`.** An OTA update only reaches builds of
  the *same* version. That's the safety rail: if you change native code or bump
  the version, old binaries keep their own JS instead of being handed a bundle
  they can't run.

So: **JS/UI-only change → `pnpm update:*`** (instant). **Native change (new
package, permission, config plugin) or a release → bump the version and build.**

## PR previews

`.github/workflows/eas-pr-preview.yml` runs on every PR touching `frontend/`:

1. Detects which app(s) changed (shared `packages/**` triggers both).
2. Typechecks the affected app.
3. Publishes an EAS Update to branch `pr-<number>-<app>`.
4. Comments the QR code / link on the PR.

Reviewers open the QR **inside a development build** (`pnpm build:*:dev`),
installed once per device.

Why updates rather than full builds per PR: a build takes ~15–25 min and burns
the free tier's monthly quota, so it can't run on every push. An update ships in
about a minute and costs nothing.

Notes:
- Forks are skipped — they can't read `EXPO_TOKEN`, so the job would only fail.
- Concurrency is per-PR: a new push cancels the in-flight preview.
- The PR title is passed to the shell via `env:`, never interpolated into the
  command, so a crafted title can't inject shell.

## Monorepo notes

`.npmrc` sets `node-linker=hoisted` + `shamefully-hoist=true`, which is what lets
Metro and the EAS build resolve the workspace packages (`@ile-eko/core`,
`@ile-eko/ui`) from the app directories.

`eas-cli` is pinned as a workspace dev dependency, so the `pnpm build:*` scripts
always use that version. A stale **global** `eas` can differ — prefer the
scripts, or run `pnpm exec eas ...`.
