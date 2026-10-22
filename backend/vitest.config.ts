import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ['test/**/*.spec.ts'],
    setupFiles: ['dotenv/config'],
    // Spec files share Redis rate-limit keys; run them one at a time.
    fileParallelism: false,
  },
});
