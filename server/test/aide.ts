import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify';
import { buildApp, type OptionsApp } from '../src/app.js';
import { creerHacheur } from '../src/auth/motDePasse.js';
import { creerCompte } from '../src/comptes.js';
import type { Config, ParametresArgon2 } from '../src/config.js';
import { ouvrirBase, type BaseDeDonnees } from '../src/db/connexion.js';

/** Paramètres argon2 volontairement faibles pour accélérer les tests. */
export const ARGON2_TEST: ParametresArgon2 = { memoryCost: 1024, timeCost: 1, parallelism: 1 };

export const ORIGINE = 'http://localhost';
export const MOT_DE_PASSE = 'correct cheval batterie';

export function configTest(surcharge: Partial<Config> = {}): Config {
  return {
    environnement: 'test',
    port: 0,
    host: '127.0.0.1',
    databasePath: ':memory:',
    sessionSecret: 'secret-de-test-suffisamment-long-pour-hmac',
    cookieSecure: false,
    allowSignup: false,
    trustProxy: false,
    staticDir: null,
    argon2: ARGON2_TEST,
    ...surcharge,
  };
}

export interface Banc {
  app: FastifyInstance;
  db: BaseDeDonnees;
}

export async function creerBanc(
  surcharge: Partial<Config> = {},
  options: Partial<OptionsApp> = {},
): Promise<Banc> {
  const db = ouvrirBase(':memory:');
  const app = await buildApp({
    config: configTest(surcharge),
    db,
    delaiEchecConnexionMs: 0,
    ...options,
  });
  return { app, db };
}

export async function fermerBanc({ app, db }: Banc): Promise<void> {
  await app.close();
  db.close();
}

export function creerUtilisateur(db: BaseDeDonnees, email: string, motDePasse = MOT_DE_PASSE) {
  return creerCompte(db, creerHacheur(ARGON2_TEST), email, motDePasse);
}

/** Requête « navigateur » : en-tête Origin du même site et cookie de session éventuel. */
export function requete(
  app: FastifyInstance,
  options: InjectOptions & { session?: string },
): Promise<LightMyRequestResponse> {
  const { session, headers, ...reste } = options;
  return app.inject({
    ...reste,
    headers: {
      origin: ORIGINE,
      ...(session ? { cookie: `rds_session=${session}` } : {}),
      ...headers,
    },
  });
}

/** Connecte un compte et renvoie la valeur du cookie de session. */
export async function connecter(
  app: FastifyInstance,
  email: string,
  motDePasse = MOT_DE_PASSE,
  resterConnectee = true,
): Promise<string> {
  const reponse = await requete(app, {
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, motDePasse, resterConnectee },
  });
  if (reponse.statusCode !== 200) throw new Error(`Connexion impossible : ${reponse.body}`);
  const cookie = reponse.cookies.find((c) => c.name === 'rds_session');
  if (!cookie) throw new Error('Cookie de session absent.');
  return cookie.value;
}
