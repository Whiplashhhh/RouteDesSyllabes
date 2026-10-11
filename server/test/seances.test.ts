import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { configParDefaut, seancesExemples, type Seance } from '../../shared/seance.js';
import { buildApp } from '../src/app.js';
import {
  configTest,
  connecter,
  creerBanc,
  creerUtilisateur,
  fermerBanc,
  requete,
  type Banc,
} from './aide.js';

const JOUR = 24 * 3600 * 1000;

describe('séances', () => {
  let banc: Banc;
  let alice: string;
  let bob: string;
  let maintenant: number;

  beforeEach(async () => {
    // Après la création des comptes (horloge réelle) pour garder l'ordre chronologique.
    maintenant = Date.now() + 1000;
    banc = await creerBanc({}, { maintenant: () => maintenant });
    await creerUtilisateur(banc.db, 'alice@ecole.fr');
    await creerUtilisateur(banc.db, 'bob@ecole.fr');
    alice = await connecter(banc.app, 'alice@ecole.fr');
    bob = await connecter(banc.app, 'bob@ecole.fr');
  });
  afterEach(() => fermerBanc(banc));

  const lister = async (session: string) =>
    (await requete(banc.app, { method: 'GET', url: '/api/seances', session })).json() as Seance[];

  const creer = async (session: string, nom = 'Ma séance') => {
    const reponse = await requete(banc.app, {
      method: 'POST',
      url: '/api/seances',
      session,
      payload: { nom, config: configParDefaut() },
    });
    expect(reponse.statusCode).toBe(201);
    return reponse.json() as Seance;
  };

  it('exige une session (401)', async () => {
    const reponse = await requete(banc.app, { method: 'GET', url: '/api/seances' });
    expect(reponse.statusCode).toBe(401);
  });

  it('crée les 4 séances d’exemple, dans l’ordre de progression', async () => {
    const seances = await lister(alice);
    expect(seances.map((s) => s.nom)).toEqual(seancesExemples().map((e) => e.nom));
    expect(seances.map((s) => s.nom)).toEqual([
      'Premières syllabes',
      'On ajoute le u et le é',
      'Les sons qui glissent',
      'Avec les sons complexes',
    ]);
    expect(seances[0]?.config).toEqual(seancesExemples()[0]?.config);
  });

  it('CRUD complet', async () => {
    const creee = await creer(alice, '  Lundi matin  ');
    expect(creee).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      nom: 'Lundi matin',
      config: configParDefaut(),
      creeLe: new Date(maintenant).toISOString(),
      modifieLe: new Date(maintenant).toISOString(),
    });

    const lue = await requete(banc.app, {
      method: 'GET',
      url: `/api/seances/${creee.id}`,
      session: alice,
    });
    expect(lue.json()).toEqual(creee);

    maintenant += 60_000;
    const config = { ...configParDefaut(), nbRoutes: 4, voyellesParRoute: 3 };
    const modifiee = await requete(banc.app, {
      method: 'PUT',
      url: `/api/seances/${creee.id}`,
      session: alice,
      payload: { nom: 'Lundi après-midi', config },
    });
    expect(modifiee.statusCode).toBe(200);
    expect(modifiee.json()).toMatchObject({
      nom: 'Lundi après-midi',
      config: { nbRoutes: 4, voyellesParRoute: 3 },
      creeLe: creee.creeLe,
      modifieLe: new Date(maintenant).toISOString(),
    });

    const listee = await lister(alice);
    expect(listee).toHaveLength(5);
    expect(listee.at(-1)?.id).toBe(creee.id);

    const suppression = await requete(banc.app, {
      method: 'DELETE',
      url: `/api/seances/${creee.id}`,
      session: alice,
    });
    expect(suppression.statusCode).toBe(204);
    expect(await lister(alice)).toHaveLength(4);
  });

  it('refuse une configuration invalide en 400', async () => {
    const reponse = await requete(banc.app, {
      method: 'POST',
      url: '/api/seances',
      session: alice,
      payload: { nom: 'X', config: { ...configParDefaut(), nbRoutes: 9 } },
    });
    expect(reponse.statusCode).toBe(400);
    expect(reponse.json()).toEqual({
      erreur: 'Certaines informations ne sont pas valides.',
      details: ['config.nbRoutes'],
    });
  });

  it('renvoie 404 pour une séance inexistante', async () => {
    const reponse = await requete(banc.app, {
      method: 'GET',
      url: '/api/seances/00000000-0000-0000-0000-000000000000',
      session: alice,
    });
    expect(reponse.statusCode).toBe(404);
    expect(reponse.json()).toEqual({ erreur: 'Cette séance est introuvable.' });
  });

  it('suppression douce puis restauration', async () => {
    const seance = await creer(alice);
    await requete(banc.app, { method: 'DELETE', url: `/api/seances/${seance.id}`, session: alice });

    const lue = await requete(banc.app, {
      method: 'GET',
      url: `/api/seances/${seance.id}`,
      session: alice,
    });
    expect(lue.statusCode).toBe(404);
    expect(
      banc.db.prepare('SELECT deleted_at FROM seances WHERE id = ?').pluck().get(seance.id),
    ).not.toBeNull();

    const restauree = await requete(banc.app, {
      method: 'POST',
      url: `/api/seances/${seance.id}/restaurer`,
      session: alice,
      headers: { 'content-type': 'application/json' },
    });
    expect(restauree.statusCode).toBe(200);
    expect(restauree.json()).toEqual(seance);
    expect((await lister(alice)).map((s) => s.id)).toContain(seance.id);
  });

  it('purge au démarrage les séances supprimées depuis plus de 7 jours', async () => {
    const ancienne = await creer(alice, 'Ancienne');
    const recente = await creer(alice, 'Récente');
    await requete(banc.app, {
      method: 'DELETE',
      url: `/api/seances/${ancienne.id}`,
      session: alice,
    });
    maintenant += 6 * JOUR;
    await requete(banc.app, {
      method: 'DELETE',
      url: `/api/seances/${recente.id}`,
      session: alice,
    });
    maintenant += 2 * JOUR;

    const redemarree = await buildApp({
      config: configTest(),
      db: banc.db,
      maintenant: () => maintenant,
    });
    const ids = banc.db.prepare('SELECT id FROM seances').pluck().all();
    expect(ids).not.toContain(ancienne.id);
    expect(ids).toContain(recente.id);
    await redemarree.close();
  });

  it('duplique avec le suffixe « (copie) »', async () => {
    const source = await creer(alice, 'Séance du jeudi');
    const reponse = await requete(banc.app, {
      method: 'POST',
      url: `/api/seances/${source.id}/dupliquer`,
      session: alice,
    });
    expect(reponse.statusCode).toBe(201);
    const copie = reponse.json() as Seance;
    expect(copie.id).not.toBe(source.id);
    expect(copie.nom).toBe('Séance du jeudi (copie)');
    expect(copie.config).toEqual(source.config);
  });

  describe('isolation entre comptes', () => {
    let seanceAlice: Seance;

    beforeEach(async () => {
      seanceAlice = await creer(alice, 'Secret d’Alice');
    });

    it.each([
      ['lire', 'GET', ''],
      ['modifier', 'PUT', ''],
      ['supprimer', 'DELETE', ''],
      ['restaurer', 'POST', '/restaurer'],
      ['dupliquer', 'POST', '/dupliquer'],
    ] as const)('Bob ne peut pas %s la séance d’Alice (404)', async (_, method, suffixe) => {
      const reponse = await requete(banc.app, {
        method,
        url: `/api/seances/${seanceAlice.id}${suffixe}`,
        session: bob,
        ...(method === 'PUT' ? { payload: { nom: 'Piratée', config: configParDefaut() } } : {}),
      });
      expect(reponse.statusCode).toBe(404);
      expect(reponse.json()).toEqual({ erreur: 'Cette séance est introuvable.' });
    });

    it('la séance d’Alice reste intacte et absente de la liste de Bob', async () => {
      for (const [method, suffixe] of [
        ['PUT', ''],
        ['DELETE', ''],
        ['POST', '/dupliquer'],
      ] as const) {
        await requete(banc.app, {
          method,
          url: `/api/seances/${seanceAlice.id}${suffixe}`,
          session: bob,
          ...(method === 'PUT' ? { payload: { nom: 'Piratée', config: configParDefaut() } } : {}),
        });
      }
      expect((await lister(bob)).map((s) => s.nom)).not.toContain('Secret d’Alice');
      expect(await lister(bob)).toHaveLength(4);
      const lue = await requete(banc.app, {
        method: 'GET',
        url: `/api/seances/${seanceAlice.id}`,
        session: alice,
      });
      expect(lue.json()).toEqual(seanceAlice);
    });
  });
});
