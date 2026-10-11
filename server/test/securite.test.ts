import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { configParDefaut } from '../../shared/seance.js';
import { CONTENT_SECURITY_POLICY } from '../src/securite.js';
import {
  connecter,
  creerBanc,
  creerUtilisateur,
  fermerBanc,
  MOT_DE_PASSE,
  requete,
  type Banc,
} from './aide.js';

const REFUSEE = { erreur: 'Requête refusée.' };

describe('API générale', () => {
  let banc: Banc;

  beforeEach(async () => {
    banc = await creerBanc();
  });
  afterEach(() => fermerBanc(banc));

  it('health répond { ok: true }', async () => {
    const reponse = await banc.app.inject({ method: 'GET', url: '/api/health' });
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json()).toEqual({ ok: true });
  });

  it('pose les en-têtes de sécurité et no-store sur /api', async () => {
    const { headers } = await banc.app.inject({ method: 'GET', url: '/api/health' });
    expect(headers['content-security-policy']).toBe(CONTENT_SECURITY_POLICY);
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('same-origin');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['cache-control']).toBe('no-store');
    expect(headers['strict-transport-security']).toBeUndefined();
  });

  it('renvoie un 404 JSON sur une route /api inconnue', async () => {
    const reponse = await banc.app.inject({ method: 'GET', url: '/api/inexistante' });
    expect(reponse.statusCode).toBe(404);
    expect(reponse.json()).toEqual({ erreur: "Cette adresse n'existe pas." });
    expect(reponse.headers['x-frame-options']).toBe('DENY');
  });

  it('refuse un JSON malformé sans détail technique', async () => {
    const reponse = await requete(banc.app, {
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '{"email":',
    });
    expect(reponse.statusCode).toBe(400);
    expect(reponse.json()).toEqual({ erreur: 'Certaines informations ne sont pas valides.' });
  });

  it('refuse un corps trop volumineux (413)', async () => {
    const reponse = await requete(banc.app, {
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'a@b.fr', motDePasse: 'x'.repeat(70 * 1024) },
    });
    expect(reponse.statusCode).toBe(413);
    expect(reponse.json()).toHaveProperty('erreur');
  });

  it('masque les erreurs internes (500)', async () => {
    banc.app.get('/api/boum', async () => {
      throw new Error('détail technique SQLITE_secret');
    });
    const reponse = await banc.app.inject({ method: 'GET', url: '/api/boum' });
    expect(reponse.statusCode).toBe(500);
    expect(reponse.json()).toEqual({
      erreur: 'Oups, un souci est survenu de notre côté. On réessaie ?',
    });
    expect(reponse.body).not.toContain('SQLITE');
  });
});

describe('vérification de l’origine', () => {
  let banc: Banc;
  let session: string;
  const creation = { nom: 'Test', config: configParDefaut() };

  beforeEach(async () => {
    banc = await creerBanc({ trustProxy: true });
    await creerUtilisateur(banc.db, 'alice@ecole.fr');
    session = await connecter(banc.app, 'alice@ecole.fr');
  });
  afterEach(() => fermerBanc(banc));

  const poster = (headers: Record<string, string>) =>
    banc.app.inject({
      method: 'POST',
      url: '/api/seances',
      payload: creation,
      headers: { cookie: `rds_session=${session}`, ...headers },
    });

  it('refuse sans en-tête Origin', async () => {
    const reponse = await poster({});
    expect(reponse.statusCode).toBe(403);
    expect(reponse.json()).toEqual(REFUSEE);
  });

  it('refuse une origine étrangère', async () => {
    const reponse = await poster({ origin: 'http://pirate.example' });
    expect(reponse.statusCode).toBe(403);
    expect(reponse.json()).toEqual(REFUSEE);
  });

  it('refuse Origin: null et un port différent', async () => {
    expect((await poster({ origin: 'null' })).statusCode).toBe(403);
    expect((await poster({ origin: 'http://localhost:8080' })).statusCode).toBe(403);
  });

  it('refuse aussi la connexion depuis une origine étrangère', async () => {
    const reponse = await banc.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@ecole.fr', motDePasse: MOT_DE_PASSE },
      headers: { origin: 'http://pirate.example' },
    });
    expect(reponse.statusCode).toBe(403);
  });

  it('accepte la même origine', async () => {
    expect((await poster({ origin: 'http://localhost' })).statusCode).toBe(201);
  });

  it('accepte Sec-Fetch-Site: same-origin sans Origin', async () => {
    expect((await poster({ 'sec-fetch-site': 'same-origin' })).statusCode).toBe(201);
    expect((await poster({ 'sec-fetch-site': 'cross-site' })).statusCode).toBe(403);
  });

  it('utilise X-Forwarded-Host derrière un proxy de confiance', async () => {
    const reponse = await poster({
      origin: 'https://classe.example.fr',
      'x-forwarded-host': 'classe.example.fr',
      'x-forwarded-proto': 'https',
    });
    expect(reponse.statusCode).toBe(201);
  });

  it('ne contrôle pas les lectures', async () => {
    const reponse = await banc.app.inject({
      method: 'GET',
      url: '/api/seances',
      headers: { cookie: `rds_session=${session}` },
    });
    expect(reponse.statusCode).toBe(200);
  });
});

describe('fichiers statiques', () => {
  let dossier: string;
  let banc: Banc;

  beforeAll(() => {
    dossier = mkdtempSync(join(tmpdir(), 'rds-client-'));
    mkdirSync(join(dossier, 'assets'));
    writeFileSync(join(dossier, 'index.html'), '<!doctype html><title>RDS</title>');
    writeFileSync(join(dossier, 'assets', 'app-abc123.js'), 'console.log(1);');
    writeFileSync(join(dossier, 'manifest.webmanifest'), '{}');
  });
  afterAll(() => rmSync(dossier, { recursive: true, force: true }));

  beforeEach(async () => {
    banc = await creerBanc({ staticDir: dossier });
  });
  afterEach(() => fermerBanc(banc));

  it('sert index.html en no-cache avec les en-têtes de sécurité', async () => {
    const reponse = await banc.app.inject({ method: 'GET', url: '/' });
    expect(reponse.statusCode).toBe(200);
    expect(reponse.body).toContain('<title>RDS</title>');
    expect(reponse.headers['cache-control']).toBe('no-cache');
    expect(reponse.headers['content-security-policy']).toBe(CONTENT_SECURITY_POLICY);
  });

  it('sert les assets avec un cache immuable', async () => {
    const reponse = await banc.app.inject({ method: 'GET', url: '/assets/app-abc123.js' });
    expect(reponse.statusCode).toBe(200);
    expect(reponse.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('renvoie index.html pour une route du client (fallback SPA)', async () => {
    const reponse = await banc.app.inject({ method: 'GET', url: '/seances/42/jouer?x=1' });
    expect(reponse.statusCode).toBe(200);
    expect(reponse.body).toContain('<title>RDS</title>');
    expect(reponse.headers['cache-control']).toBe('no-cache');
  });

  it('ne fait pas de fallback pour /api ni pour un asset manquant', async () => {
    const api = await banc.app.inject({ method: 'GET', url: '/api/inconnue' });
    expect(api.statusCode).toBe(404);
    expect(api.json()).toHaveProperty('erreur');
    const asset = await banc.app.inject({ method: 'GET', url: '/assets/absent.js' });
    expect(asset.statusCode).toBe(404);
  });
});
