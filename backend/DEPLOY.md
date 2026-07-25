# Deploying Ilé Èkó backend — free tier (Render + MongoDB Atlas)

Total time ~20 min. No credit card required for the database; Render's free web
service needs no card. AI is left off (endpoints return `degraded: true`).

Split of work:
- **You** create the two accounts and paste one connection string.
- **The config is already in the repo**: `render.yaml` (service) and
  `.github/workflows/ile-eko-scheduler.yml` (free cron for outbox + daily sweep).

## 1. MongoDB Atlas (free M0, no card)
1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create a **free M0 cluster** (any provider/region).
3. **Database Access** → add a database user (username + password).
4. **Network Access** → allow `0.0.0.0/0` (Render has no fixed egress IP; access
   is still gated by the DB password).
5. **Connect → Drivers** → copy the connection string, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/ile-eko?retryWrites=true&w=majority`
   (add the `/ile-eko` database name before the `?`).

## 2. Push the code to GitHub
The backend deploys from your GitHub repo. Either merge `feat/backend` to `main`
or point Render at the `feat/backend` branch. (I can open a PR / push for you.)

## 3. Render (free web service)
1. Sign up at https://render.com (GitHub login).
2. **New → Blueprint** → pick this repo. Render reads `render.yaml`.
3. When prompted, set **`MONGODB_URI`** to the Atlas string from step 1.
   (`JWT_SECRET` and `TASKS_TOKEN` are auto-generated.)
4. Deploy. You'll get a URL like `https://ile-eko-api.onrender.com`.
5. Check `https://<url>/health` → `{"status":"ok"}`.
6. In the service's **Environment** tab, copy the generated **`TASKS_TOKEN`** value.

## 4. Enable the free scheduler (GitHub Actions)
In the GitHub repo → **Settings → Secrets and variables → Actions → New secret**:
- `API_BASE_URL` = your Render URL (e.g. `https://ile-eko-api.onrender.com`)
- `TASKS_TOKEN`  = the value you copied from Render

The workflow then runs every 10 min: drains the outbox (notifications), runs the
daily rent sweep (idempotent), and keeps the free service warm.

## 5. Point the apps at the API
In each Expo app set `EXPO_PUBLIC_API_URL=https://<your-render-url>/v1`.

## Seed demo data (optional)
From the Render **Shell** (or locally against the Atlas URI):
`SEED_ALLOW=1 pnpm seed` → prints one-time demo credentials.

## Later: turn on AI
Add `AI_API_KEY` (+ `AI_PROVIDER=openai|anthropic`, `AI_MODEL`) in Render's
Environment tab and redeploy. No code change — AI endpoints stop returning
`degraded`.

## Later: real file uploads
On the free tier, `/uploads/sign` returns a stub URL (files don't persist). For
working uploads, wire a provider (e.g. Cloudinary free tier or GCS) into
`src/services/storage.ts`.
