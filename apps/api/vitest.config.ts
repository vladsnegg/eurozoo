import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
    hookTimeout: 30_000,
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
