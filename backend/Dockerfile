# --- build stage ---
FROM node:24-slim AS build
WORKDIR /app
# Install pnpm directly (more reliable in CI than corepack).
RUN npm install -g pnpm@10.18.3
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# --- runtime stage ---
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN npm install -g pnpm@10.18.3
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
# Cloud Run / Render inject PORT; the app binds process.env.PORT ?? 4000
EXPOSE 4000
CMD ["node", "dist/index.js"]
