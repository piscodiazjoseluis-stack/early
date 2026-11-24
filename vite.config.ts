import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    // Unit/component tests must not depend on a developer's .env.local.
    // Services are mocked; these non-secret values target loopback only.
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'unit-test-placeholder-not-a-real-key',
    },
    setupFiles: './tests/setup.ts',
    include: ['tests/{unit,integration}/**/*.{test,spec}.{ts,tsx}'],
  },
})
