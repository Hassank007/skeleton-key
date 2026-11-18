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
    css: { include: [/tokens\/.*\.css/] },
    passWithNoTests: true,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    // Machine-readable results for the ACR generator (npm run acr). evidence/ is gitignored.
    reporters: ['default', 'json'],
    outputFile: { json: 'evidence/vitest.json' },
  },
})
