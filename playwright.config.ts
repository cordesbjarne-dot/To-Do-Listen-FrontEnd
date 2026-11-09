import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    baseURL: 'http://localhost:15173',
    viewport: { width: 1280, height: 900 },
    channel: process.env.PW_CHANNEL || undefined,
  },
  webServer: {
    command: 'npm run dev -- --port 15173 --strictPort',
    url: 'http://localhost:15173',
    env: { VITE_BACKEND_BASE_URL: 'http://localhost:18080' },
  },
})
