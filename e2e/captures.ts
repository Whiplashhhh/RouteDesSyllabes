/**
 * Captures d'écran des écrans principaux, en trois résolutions.
 * Lancement : npm run screenshots  →  docs/screenshots/
 */
import { test, type Page } from '@playwright/test';
import { centreVehicule, distanceVoyelle, glisserAuDoigt, seConnecter } from './outils';

const RESOLUTIONS = [
  { nom: '1920x1080', width: 1920, height: 1080 },
  { nom: '3840x2160', width: 3840, height: 2160 },
  { nom: '1366x768', width: 1366, height: 768 },
];

const dossier = 'docs/screenshots';

for (const r of RESOLUTIONS) {
  test.describe(`captures ${r.nom}`, () => {
    test.use({ viewport: { width: r.width, height: r.height }, hasTouch: true });

    const capture = (page: Page, nom: string, pleine = false) =>
      page.screenshot({ path: `${dossier}/${r.nom}/${nom}.png`, fullPage: pleine });

    test('espace maîtresse', async ({ page }) => {
      await page.goto('/connexion');
      await page.waitForTimeout(3300); // la voiture forme sa première syllabe
      await capture(page, '01-connexion');
      await seConnecter(page);
      await page.waitForTimeout(900);
      await capture(page, '02-accueil');
      await page
        .getByTestId('carte-seance')
        .first()
        .getByRole('link', { name: /Modifier/ })
        .click();
      await page.locator('.editeur').waitFor();
      await page.waitForTimeout(700);
      await capture(page, '03-editeur-lettres');
      await page.getByRole('tab', { name: /Décor/ }).click();
      await page.waitForTimeout(400);
      await capture(page, '04-editeur-decor');
      await page.getByRole('tab', { name: /Règles/ }).click();
      await page.waitForTimeout(400);
      await capture(page, '05-editeur-regles');
      await page.getByRole('tab', { name: /Retours/ }).click();
      await page.waitForTimeout(400);
      await capture(page, '06-editeur-retours');
    });

    for (const n of [1, 3, 4]) {
      test(`jeu ${n} route(s)`, async ({ page }) => {
        const decor =
          n === 4
            ? '&fond=nuit&route=arc-en-ciel'
            : n === 1
              ? '&fond=campagne&route=terre&vehicule=tracteur&couleur=vert'
              : '';
        await page.goto(`/demo?routes=${n}${decor}`);
        await page.waitForTimeout(1200);
        await capture(page, `07-jeu-${n}-route${n > 1 ? 's' : ''}`);
      });
    }

    test('jeu pendant une fusion', async ({ page }) => {
      await page.goto('/demo?fete=1');
      await page.waitForTimeout(800);
      const a = await centreVehicule(page, 0);
      const d = await distanceVoyelle(page, 0);
      const b = await centreVehicule(page, 1);
      const glisse = await glisserAuDoigt(page, [
        { de: { ...a, id: 1 }, dx: d + 4 },
        { de: { ...b, id: 2 }, dx: r.width * 0.18 },
      ]);
      await page.waitForTimeout(160);
      await capture(page, '08-jeu-fusion');
      await glisse.lacher();
    });

    test('panneau de la maîtresse', async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      await capture(page, '09-panneau-maitresse');
    });
  });
}
