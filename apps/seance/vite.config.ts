/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    globals: true,
    // The booking flow tests drive three steps with user-event and run axe; they need more than the 5 s default under load.
    testTimeout: 30000,
    css: { include: [/tokens\/.*\.css/] },
    passWithNoTests: true,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    // Machine-readable results for the ACR generator (npm run acr). evidence/ is gitignored.
    reporters: ['default', 'json'],
    outputFile: { json: 'evidence/vitest.json' },
  },
})
