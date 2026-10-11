import { expect, test } from '@playwright/test';
import { centreVehicule, distanceVoyelle, glisserAuDoigt, MAITRESSE, seConnecter } from './outils';

test.describe('Espace maîtresse', () => {
  test('refuse un mauvais mot de passe avec un message humain', async ({ page }) => {
    await page.goto('/connexion');
    await page.getByLabel('Email').fill(MAITRESSE.email);
    await page.getByLabel('Mot de passe').fill('pas-le-bon');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('alert')).toContainText('Email ou mot de passe incorrect');
  });

  test('affiche les quatre séances d’exemple après connexion', async ({ page }) => {
    await seConnecter(page);
    const cartes = page.getByTestId('carte-seance');
    await expect(cartes).toHaveCount(4);
    await expect(cartes.first()).toContainText('Premières syllabes');
    await expect(cartes.nth(3)).toContainText('Avec les sons complexes');
  });

  test('crée une séance, l’enregistre automatiquement et la retrouve', async ({ page }) => {
    await seConnecter(page);
    await page.getByRole('link', { name: 'Nouvelle séance', exact: true }).click();
    const nom = page.getByLabel('Nom de la séance');
    await nom.fill('Les sons du jour');
    await page.getByRole('button', { name: 's, son qui se prolonge', exact: true }).click();
    await page.getByRole('button', { name: 'u', exact: true }).click();
    await page.getByRole('tab', { name: /Règles/ }).click();
    await page.getByRole('radio', { name: '4 routes' }).click();
    await expect(page.locator('.editeur-apercu .couloir')).toHaveCount(4);
    await expect(page.getByRole('status').filter({ hasText: 'Enregistré' })).toBeVisible();
    await expect(page).toHaveURL(/\/seances\/[0-9a-f-]{36}$/);
    await page.getByRole('button', { name: 'Enregistrer et revenir aux séances' }).click();
    const carte = page.getByTestId('carte-seance').filter({ hasText: 'Les sons du jour' });
    await expect(carte).toBeVisible();
    await expect(carte.locator('.pastille-consonne', { hasText: 's' })).toBeVisible();
  });

  test('supprime une séance puis annule la suppression', async ({ page }) => {
    await seConnecter(page);
    const carte = page.getByTestId('carte-seance').filter({ hasText: 'Les sons qui glissent' });
    await carte.getByRole('button', { name: /Supprimer/ }).click();
    await carte.getByRole('button', { name: 'Supprimer', exact: true }).click();
    await expect(carte).toHaveCount(0);
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(
      page.getByTestId('carte-seance').filter({ hasText: 'Les sons qui glissent' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByTestId('carte-seance').filter({ hasText: 'Les sons qui glissent' }),
    ).toBeVisible();
  });

  test('lance le jeu puis le quitte grâce à l’appui long', async ({ page }) => {
    await seConnecter(page);
    await page
      .getByTestId('carte-seance')
      .first()
      .getByRole('button', { name: 'Jouer', exact: true })
      .click();
    await expect(page.getByTestId('ecran-jeu')).toBeVisible();
    await expect(page.locator('.couloir')).toHaveCount(3);

    const bouton = page.getByTestId('bouton-maitresse');
    // Un simple tap ne fait rien.
    await bouton.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Un appui maintenu ouvre le panneau.
    const boite = (await bouton.boundingBox())!;
    await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1800);
    await page.mouse.up();
    const panneau = page.getByRole('dialog', { name: 'Commandes de la maîtresse' });
    await expect(panneau).toBeVisible();
    await panneau.getByRole('button', { name: 'Choisir une séance' }).click();
    await panneau.getByRole('button', { name: /On ajoute le u et le é/ }).click();
    await expect(page).toHaveURL(/\/jouer\//);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').getByRole('button', { name: 'Quitter' }).click();
    await expect(page.getByRole('heading', { name: 'Mes séances' })).toBeVisible();
  });

  test('protège l’accès aux séances sans connexion', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/connexion$/);
  });
});

test.describe('Mode élève', () => {
  test.use({ hasTouch: true });

  test('deux doigts glissent deux véhicules en même temps et forment des syllabes', async ({
    page,
  }) => {
    await page.goto('/demo');
    await expect(page.locator('.couloir')).toHaveCount(3);
    await page.waitForTimeout(500);
    const a = await centreVehicule(page, 0);
    const b = await centreVehicule(page, 1);
    const da = await distanceVoyelle(page, 0);
    const db = await distanceVoyelle(page, 1);
    const glisse = await glisserAuDoigt(page, [
      { de: { ...a, id: 1 }, dx: da + 4 },
      { de: { ...b, id: 2 }, dx: db + 4 },
    ]);
    await expect(page.locator('.couloir').nth(0).locator('.voyelle.soudee')).toHaveCount(1);
    await expect(page.locator('.couloir').nth(1).locator('.voyelle.soudee')).toHaveCount(1);
    await expect(page.locator('.couloir').nth(2).locator('.soudee')).toHaveCount(0);
    await glisse.lacher();
    // Au relâchement, le véhicule reste où il est.
    const apres = await centreVehicule(page, 0);
    expect(apres.x).toBeGreaterThan(a.x + da - 10);
  });

  test('le véhicule reste sur sa route et ne sort pas de l’écran', async ({ page }) => {
    await page.goto('/demo?routes=1');
    await page.waitForTimeout(400);
    const a = await centreVehicule(page, 0);
    const glisse = await glisserAuDoigt(page, [{ de: { ...a, id: 1 }, dx: 4000 }], 30);
    await glisse.lacher();
    await page.waitForTimeout(700);
    const boite = (await page.locator('.consonne .etiquette').boundingBox())!;
    expect(boite.x + boite.width).toBeLessThanOrEqual(1920);
    const apres = await centreVehicule(page, 0);
    expect(Math.abs(apres.y - a.y)).toBeLessThan(2);
  });

  test('« Nouvelles lettres » au clavier change les lettres', async ({ page }) => {
    await page.goto('/demo?lettres=l,m,r,s,f,v:a,i,o,u,é');
    const lettres = () =>
      page.locator('.couloir').evaluateAll((cs) => cs.map((c) => c.textContent).join('|'));
    const avant = await lettres();
    await page.keyboard.press('ArrowRight');
    await expect.poll(lettres, { timeout: 5000 }).not.toBe(avant);
  });
});
