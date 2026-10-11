import { expect, type Page } from '@playwright/test';

export const MAITRESSE = { email: 'maitresse@ecole.fr', motDePasse: 'bonjour123' };

export async function seConnecter(page: Page, compte = MAITRESSE) {
  await page.goto('/connexion');
  await page.getByLabel('Email').fill(compte.email);
  await page.getByLabel('Mot de passe').fill(compte.motDePasse);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('heading', { name: 'Mes séances' })).toBeVisible();
}

/** Centre du véhicule de la route `i`. */
export async function centreVehicule(page: Page, i: number) {
  const boite = await page.locator('.vehicule-rig').nth(i).boundingBox();
  if (!boite) throw new Error('véhicule introuvable');
  return { x: boite.x + boite.width / 2, y: boite.y + boite.height / 2 };
}

/** Distance horizontale entre l'étiquette de la consonne et la 1re voyelle de la route `i`. */
export async function distanceVoyelle(page: Page, i: number) {
  return page
    .locator('.couloir')
    .nth(i)
    .evaluate((c) => {
      const consonne = c.querySelector('.consonne .etiquette')!.getBoundingClientRect();
      const voyelle = c.querySelector('.voyelle')!.getBoundingClientRect();
      return voyelle.x - consonne.right;
    });
}

type Doigt = { x: number; y: number; id: number };

/** Glisser tactile multi-doigts (Chromium, via le protocole DevTools). */
export async function glisserAuDoigt(
  page: Page,
  trajets: { de: Doigt; dx: number }[],
  etapes = 24,
) {
  const cdp = await page.context().newCDPSession(page);
  const points = (k: number) =>
    trajets.map((t) => ({ x: t.de.x + (t.dx * k) / etapes, y: t.de.y, id: t.de.id }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(0) });
  for (let k = 1; k <= etapes; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(k) });
    await page.waitForTimeout(16);
  }
  return {
    lacher: async () => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    },
  };
}
