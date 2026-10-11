import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de bout en bout et captures d'écran.
 *
 * Le serveur de production est construit puis lancé avec une base temporaire
 * (voir e2e/serveur.sh). En local, si Chromium ne peut pas être téléchargé,
 * indiquez un exécutable avec PW_CHROMIUM_PATH.
 */
const PORT = Number(process.env.E2E_PORT ?? 3210);
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
const args = executablePath ? ['--no-sandbox', '--disable-gpu', '--no-zygote'] : [];

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: { executablePath, args },
  },
  webServer: {
    command: `bash e2e/serveur.sh ${PORT}`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'e2e',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'captures',
      testMatch: /captures\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
