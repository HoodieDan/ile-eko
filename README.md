# Ilé Èkó

Mobile platform for managing rental properties in Lagos, plus a companion marketplace app for prospective tenants. This repository contains the **frontend** (Expo + React Native monorepo) and a reserved **backend** folder for the future Node.js + Express + MongoDB Atlas + OpenAI API.

## Repository layout

```
ile-eko/
├── frontend/                     # Expo monorepo — pnpm workspace root
│   ├── apps/
│   │   ├── landlord/             # Ilé Èkó — the management app
│   │   └── tenant/               # Ilé Èkó Homes — the marketplace app
│   ├── packages/
│   │   ├── ui/                   # @ile-eko/ui — design tokens, theme, primitives
│   │   ├── core/                 # @ile-eko/core — shared types, API client, auth
│   │   └── config/               # @ile-eko/config — shared tsconfig/eslint/prettier
│   └── ...
└── backend/                      # reserved — Node.js + Express + MongoDB Atlas + OpenAI
```

### Frontend (this work)

Two Expo apps share one design system and one core library:

- **Ilé Èkó (landlord)** — properties, tenants, rent/payments, AI assistant, team management with per-property permissions, activity log, tenant-enquiries inbox.
- **Ilé Èkó Homes (tenant)** — browse vacant homes in plain language, view listings, enquire with landlords. Browse-first: login is only required on Enquire / Save.

Both apps consume the same `@ile-eko/ui` primitives and `@ile-eko/core` types, hooks, and auth — so a button or a `Property` shape is defined once and reused everywhere.

### Backend (reserved)

The Express API will live in `backend/`. It will import the shared TypeScript types from `frontend/packages/core/src/types`, so the two halves stay in lockstep. Until that exists, the apps run against `EXPO_PUBLIC_API_URL` with mocked hooks.

## Run scripts (frontend)

All scripts are run from `frontend/`, not the repo root.

```bash
cd frontend
pnpm install

pnpm landlord          # start landlord app only (Metro :8081)
pnpm tenant            # start tenant app only   (Metro :8082)
pnpm dev               # start both, colour-coded, side-by-side

pnpm ios:landlord      # open landlord app in iOS simulator
pnpm android:landlord  # open landlord app on Android
pnpm ios:tenant        # open tenant app in iOS simulator
pnpm android:tenant    # open tenant app on Android

pnpm typecheck         # tsc --noEmit across the workspace
pnpm lint              # eslint across the workspace
pnpm clean             # remove .expo, .turbo, dist, node_modules
```

Each app also runs directly:

```bash
cd frontend/apps/landlord && npx expo start
```

## Tech stack

- Expo (managed) + React Native + TypeScript (strict)
- Expo Router (file-based navigation, per app)
- pnpm workspaces + Turborepo
- Token-based design system + `ThemeProvider`/`useTheme`
- TanStack Query (React Query) with a typed API client
- `expo-secure-store` for JWT + `AuthProvider` in `@ile-eko/core`

## Environment

Each app reads `EXPO_PUBLIC_API_URL` from its own `.env`. Copy `.env.example` to `.env` and point it at your backend (or leave the default mock URL while the backend is reserved).
