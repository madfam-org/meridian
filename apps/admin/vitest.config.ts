/**
 * Test config for the admin application.
 *
 * jsdom rather than node: these tests assert what a reader actually sees — that
 * a coverage boundary renders, that an error summary takes focus, that a
 * disclosure downgrade is stated rather than silently applied. A logic-only
 * suite would pass while the page said nothing.
 */
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
