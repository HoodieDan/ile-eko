import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Integration tests share one in-memory replica set; run serially.
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // Provide required env BEFORE modules import config/env (avoids hoist issues).
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-at-least-16-characters-long',
      JWT_EXPIRES_IN: '7d',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/ile-eko-test-placeholder',
      // Blank every external-service credential so a developer's local .env can
      // never leak into the suite: real keys would make tests hit live APIs
      // (billable, slow, non-deterministic) and break the degraded-path tests.
      AI_API_KEY: '',
      RESEND_API_KEY: '',
      CLOUDINARY_URL: '',
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
      EXPO_ACCESS_TOKEN: '',
    },
  },
});
