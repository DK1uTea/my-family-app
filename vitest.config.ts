import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Unit + component tests.
 *
 * Both test suites live outside `src/`, so `src/` is source only:
 *
 *   tests/**\/*.test.ts(x)   → Vitest (this config), mirroring the `src/` tree
 *   e2e/**\/*.spec.ts        → Playwright (playwright.config.ts)
 *
 * The two extensions are also kept distinct, so neither runner ever picks up the
 * other's files and `expect` never comes from the wrong library.
 */
export default defineConfig({
  plugins: [react()],
  // Resolves the `@/*` alias straight from tsconfig.json, so a test importing
  // `@/lib/utils` needs no relative path back into src.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**', 'old/**'],
    clearMocks: true,
    restoreMocks: true,
    server: {
      // next-intl ships ESM that imports `next/navigation` as a bare subpath.
      // Node's externalized resolution ignores Next's package exports map and
      // fails; inlining hands resolution to Vite, which honours it.
      deps: { inline: ['next-intl'] },
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
      // Coverage is measured on the source, which no longer contains any tests.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*-skeleton.tsx',
        'src/messages/**',
        'src/app/**/{loading,error,layout,not-found}.tsx',
      ],
    },
  },
});
