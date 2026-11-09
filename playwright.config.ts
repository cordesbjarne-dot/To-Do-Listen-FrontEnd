import { defineConfig, devices } from '@playwright/test'

// End-to-End-Tests gegen die echte Anwendung (Frontend + Backend + PostgreSQL).
// Das Backend muss bereits laufen (lokal oder in GitHub Actions gestartet).
// - E2E_BASE_URL gesetzt: Tests laufen gegen dieses bereits laufende Frontend.
// - sonst: Playwright baut das Frontend und startet "vite preview" auf Port 4173.
const externalBaseUrl = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: externalBaseUrl ?? 'http://localhost:4173',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run build-only && npx vite preview --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
