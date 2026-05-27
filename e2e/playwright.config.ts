// ══════════════════════════════════════════════════════════
//  playwright.config.ts — E2E tests for Farmacy
//  Targets: localhost:5173 (frontend) + localhost:3000 (backend)
// ══════════════════════════════════════════════════════════
import { defineConfig, devices } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ['html', { outputFolder: 'reports' }],
    ['list', { printSteps: true }],
  ],

  timeout: 60_000,
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { maxDiffPixels: 100 },
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        launchOptions: {
          args: [
            // Permite probar PWA/service-worker sin HTTPS
            '--unsafely-treat-insecure-origin-as-secure=http://localhost:5173',
            '--ignore-certificate-errors',
          ],
        },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 412, height: 915 },
      },
    },
  ],

  // Carpeta de salida
  outputDir: 'results',
})
