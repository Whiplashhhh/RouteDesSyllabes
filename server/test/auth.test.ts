import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hacherToken } from '../src/auth/sessions.js';
import {
  connecter,
  creerBanc,
  creerUtilisateur,
  fermerBanc,
  MOT_DE_PASSE,
  requete,
  type Banc,
} from './aide.js';

const EMAIL = 'maitresse@ecole.fr';
const INCORRECT = { erreur: 'Email ou mot de passe incorrect.' };
const TROP_D_ESSAIS = {
  erreur: "Trop d'essais. Patientez quelques minutes avant de réessayer.",
};

function login(banc: Banc, corps: Record<string, unknown>, ip = '127.0.0.1') {
  return requete(banc.app, {
    method: 'POST',
    url: '/api/auth/login',
    payload: corps,
    remoteAddress: ip,
  });
}

describe('connexion', () => {
  let banc: Banc;

  beforeEach(async () => {
    banc = await creerBanc();
    await creerUtilisateur(banc.db, EMAIL);
  });
  afterEach(() => fermerBanc(banc));

  it('connecte avec les bons identifiants (email insensible à la casse et aux espaces)', async () => {
    const reponse = await login(banc, {
      email: '  Maitresse@Ecole.FR ',
      motDePasse: MOT_DE_PASSE,
    });
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json()).toEqual({ id: expect.any(String), email: EMAIL });
  });

  it('pose un cookie HttpOnly, SameSite=Lax, de 30 jours par défaut', async () => {
    const reponse = await login(banc, { email: EMAIL, motDePasse: MOT_DE_PASSE });
    const entete = String(reponse.headers['set-cookie']);
    expect(entete).toMatch(/^rds_session=[A-Za-z0-9_-]{43};/);
    expect(entete).toContain('HttpOnly');
    expect(entete).toContain('SameSite=Lax');
    expect(entete).toContain('Path=/');
    expect(entete).toContain(`Max-Age=${30 * 24 * 3600}`);
    expect(entete).not.toContain('Secure');
  });

  it('pose un cookie de session navigateur sans « rester connectée »', async () => {
    const reponse = await login(banc, {
      email: EMAIL,
      motDePasse: MOT_DE_PASSE,
      resterConnectee: false,
    });
    const entete = String(reponse.headers['set-cookie']);
    expect(entete).toContain('HttpOnly');
    expect(entete).not.toContain('Max-Age');
    expect(entete).not.toContain('Expires');
  });

  it('ajoute Secure quand COOKIE_SECURE est actif', async () => {
    const securise = await creerBanc({ cookieSecure: true });
    await creerUtilisateur(securise.db, EMAIL);
    const reponse = await login(securise, { email: EMAIL, motDePasse: MOT_DE_PASSE });
    expect(String(reponse.headers['set-cookie'])).toContain('Secure');
    await fermerBanc(securise);
  });

  it('ne stocke en base que le HMAC du token', async () => {
    const token = await connecter(banc.app, EMAIL);
    const hashes = banc.db.prepare('SELECT token_hash FROM sessions').pluck().all();
    expect(hashes).toEqual([hacherToken('secret-de-test-suffisamment-long-pour-hmac', token)]);
    expect(hashes).not.toContain(token);
  });

  it('répond le même message pour un email inconnu et un mauvais mot de passe', async () => {
    const inconnu = await login(banc, { email: 'inconnue@ecole.fr', motDePasse: MOT_DE_PASSE });
    const mauvais = await login(banc, { email: EMAIL, motDePasse: 'mauvais mot de passe' });
    expect(inconnu.statusCode).toBe(401);
    expect(mauvais.statusCode).toBe(401);
    expect(inconnu.json()).toEqual(INCORRECT);
    expect(mauvais.json()).toEqual(INCORRECT);
    expect(inconnu.headers['set-cookie']).toBeUndefined();
  });

  it('refuse un corps invalide en 400', async () => {
    const reponse = await login(banc, { email: EMAIL });
    expect(reponse.statusCode).toBe(400);
    expect(reponse.json()).toMatchObject({
      erreur: 'Certaines informations ne sont pas valides.',
      details: ['motDePasse'],
    });
  });

  it('bloque un email en 429 après 5 échecs, même avec le bon mot de passe', async () => {
    for (let i = 0; i < 5; i++) {
      const reponse = await login(banc, { email: EMAIL, motDePasse: 'mauvais' });
      expect(reponse.statusCode).toBe(401);
    }
    const bloquee = await login(banc, { email: EMAIL, motDePasse: MOT_DE_PASSE });
    expect(bloquee.statusCode).toBe(429);
    expect(bloquee.json()).toEqual(TROP_D_ESSAIS);
    expect(Number(bloquee.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('bloque aussi le même email depuis une autre IP', async () => {
    for (let i = 0; i < 5; i++) await login(banc, { email: EMAIL, motDePasse: 'x' }, '10.0.0.1');
    const reponse = await login(banc, { email: EMAIL, motDePasse: MOT_DE_PASSE }, '10.0.0.2');
    expect(reponse.statusCode).toBe(429);
  });

  it('bloque une IP en 429 après 20 échecs sur des emails variés', async () => {
    for (let i = 0; i < 20; i++) {
      await login(banc, { email: `inconnue${i}@ecole.fr`, motDePasse: 'x' }, '10.0.0.9');
    }
    const bloquee = await login(banc, { email: EMAIL, motDePasse: MOT_DE_PASSE }, '10.0.0.9');
    expect(bloquee.statusCode).toBe(429);
    const autreIp = await login(banc, { email: EMAIL, motDePasse: MOT_DE_PASSE }, '10.0.0.10');
    expect(autreIp.statusCode).toBe(200);
  });

  it('réinitialise le compteur de l’email après un succès', async () => {
    for (let i = 0; i < 4; i++) await login(banc, { email: EMAIL, motDePasse: 'x' });
    expect((await login(banc, { email: EMAIL, motDePasse: MOT_DE_PASSE })).statusCode).toBe(200);
    for (let i = 0; i < 4; i++) await login(banc, { email: EMAIL, motDePasse: 'x' });
    expect((await login(banc, { email: EMAIL, motDePasse: MOT_DE_PASSE })).statusCode).toBe(200);
  });
});

describe('session', () => {
  let banc: Banc;
  let maintenant: number;

  beforeEach(async () => {
    maintenant = Date.UTC(2026, 0, 5, 8);
    banc = await creerBanc({}, { maintenant: () => maintenant });
    await creerUtilisateur(banc.db, EMAIL);
  });
  afterEach(() => fermerBanc(banc));

  const me = (session?: string) =>
    requete(banc.app, { method: 'GET', url: '/api/auth/me', session });

  it('me renvoie 401 sans session, et l’utilisatrice avec', async () => {
    const anonyme = await me();
    expect(anonyme.statusCode).toBe(401);
    expect(anonyme.json()).toHaveProperty('erreur');

    const token = await connecter(banc.app, EMAIL);
    const reponse = await me(token);
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json()).toEqual({ id: expect.any(String), email: EMAIL });
  });

  it('refuse un token inconnu et efface le cookie', async () => {
    const reponse = await me('token-invente');
    expect(reponse.statusCode).toBe(401);
    expect(String(reponse.headers['set-cookie'])).toMatch(
      /rds_session=;.*Expires=Thu, 01 Jan 1970/,
    );
  });

  it('logout supprime la session en base et efface le cookie', async () => {
    const token = await connecter(banc.app, EMAIL);
    const reponse = await requete(banc.app, {
      method: 'POST',
      url: '/api/auth/logout',
      session: token,
    });
    expect(reponse.statusCode).toBe(204);
    expect(String(reponse.headers['set-cookie'])).toMatch(/^rds_session=;/);
    expect(banc.db.prepare('SELECT COUNT(*) FROM sessions').pluck().get()).toBe(0);
    expect((await me(token)).statusCode).toBe(401);
  });

  it('prolonge une session persistante à l’usage, au plus une fois par heure', async () => {
    const token = await connecter(banc.app, EMAIL);
    const expiration = () =>
      banc.db.prepare('SELECT expires_at FROM sessions').pluck().get() as number;
    const initiale = expiration();

    maintenant += 30 * 60 * 1000;
    const tot = await me(token);
    expect(tot.headers['set-cookie']).toBeUndefined();
    expect(expiration()).toBe(initiale);

    maintenant += 31 * 60 * 1000;
    const tard = await me(token);
    expect(String(tard.headers['set-cookie'])).toContain(`Max-Age=${30 * 24 * 3600}`);
    expect(expiration()).toBe(maintenant + 30 * 24 * 3600 * 1000);
  });

  it('expire une session persistante inutilisée après 30 jours', async () => {
    const token = await connecter(banc.app, EMAIL);
    maintenant += 30 * 24 * 3600 * 1000;
    expect((await me(token)).statusCode).toBe(401);
  });

  it('expire une session navigateur après 12 h sans activité, mais la prolonge à l’usage', async () => {
    const token = await connecter(banc.app, EMAIL, MOT_DE_PASSE, false);
    maintenant += 11 * 3600 * 1000;
    const reponse = await me(token);
    expect(reponse.statusCode).toBe(200);
    expect(reponse.headers['set-cookie']).toBeUndefined();
    maintenant += 11 * 3600 * 1000;
    expect((await me(token)).statusCode).toBe(200);
    maintenant += 12 * 3600 * 1000;
    expect((await me(token)).statusCode).toBe(401);
  });
});

describe('inscription', () => {
  it('est fermée par défaut (403) et annoncée comme telle', async () => {
    const banc = await creerBanc();
    const config = await requete(banc.app, { method: 'GET', url: '/api/config' });
    expect(config.json()).toEqual({ inscriptionOuverte: false });

    const reponse = await requete(banc.app, {
      method: 'POST',
      url: '/api/auth/signup',
      payload: { email: 'nouvelle@ecole.fr', motDePasse: MOT_DE_PASSE },
    });
    expect(reponse.statusCode).toBe(403);
    expect(reponse.json().erreur).toMatch(/inscriptions sont fermées/);
    expect(banc.db.prepare('SELECT COUNT(*) FROM users').pluck().get()).toBe(0);
    await fermerBanc(banc);
  });

  it('crée le compte, les séances d’exemple et la session quand elle est ouverte', async () => {
    const banc = await creerBanc({ allowSignup: true });
    expect((await requete(banc.app, { method: 'GET', url: '/api/config' })).json()).toEqual({
      inscriptionOuverte: true,
    });

    const signup = (email: string, motDePasse = MOT_DE_PASSE) =>
      requete(banc.app, {
        method: 'POST',
        url: '/api/auth/signup',
        payload: { email, motDePasse },
      });

    const reponse = await signup(' Nouvelle@Ecole.fr ');
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json()).toEqual({ id: expect.any(String), email: 'nouvelle@ecole.fr' });
    const token = reponse.cookies.find((c) => c.name === 'rds_session')?.value;
    const seances = await requete(banc.app, { method: 'GET', url: '/api/seances', session: token });
    expect(seances.json()).toHaveLength(4);

    const doublon = await signup('NOUVELLE@ecole.fr');
    expect(doublon.statusCode).toBe(400);
    expect(doublon.json()).toEqual({ erreur: 'Impossible de créer ce compte.' });

    const court = await signup('autre@ecole.fr', 'court');
    expect(court.statusCode).toBe(400);
    expect(court.json().erreur).toMatch(/8/);
    await fermerBanc(banc);
  });
});
