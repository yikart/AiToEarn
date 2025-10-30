import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: __dirname,
    include: [
      'test/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'electron/**/__tests__/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'electron/**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ],
    testTimeout: 1000 * 29,
    environment: 'node',
  },
})
