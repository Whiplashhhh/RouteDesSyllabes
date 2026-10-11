import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export type Environnement = 'development' | 'production' | 'test';

/** Paramètres argon2id (mémoire en Kio). */
export interface ParametresArgon2 {
  memoryCost: number;
  timeCost: number;
  parallelism: number;
}

export interface Config {
  environnement: Environnement;
  port: number;
  host: string;
  databasePath: string;
  sessionSecret: string;
  cookieSecure: boolean;
  allowSignup: boolean;
  /** `true`/`false`, ou liste d'adresses/plages de proxys de confiance. */
  trustProxy: boolean | string[];
  /** Dossier du client buildé, ou `null` s'il n'existe pas. */
  staticDir: string | null;
  argon2: ParametresArgon2;
}

export const ARGON2_PAR_DEFAUT: ParametresArgon2 = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const SECRET_DEV = 'secret-de-developpement-a-ne-jamais-utiliser-en-production';

/** Retrouve le dossier `server/` (fonctionne depuis `src/` comme depuis `dist/`). */
function dossierServeur(): string {
  let dossier = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const manifeste = join(dossier, 'package.json');
    if (existsSync(manifeste)) {
      const { name } = JSON.parse(readFileSync(manifeste, 'utf8')) as { name?: string };
      if (name === '@rds/server') return dossier;
    }
    const parent = dirname(dossier);
    if (parent === dossier) throw new Error('Dossier du serveur introuvable.');
    dossier = parent;
  }
}

/**
 * Chemin de la base : DATABASE_PATH (relatif au dossier courant) ou, par défaut,
 * `data/route-des-syllabes.sqlite` dans le dossier du serveur.
 */
export function resoudreCheminBase(valeur: string | undefined): string {
  const chemin = valeur?.trim();
  if (!chemin) return join(dossierServeur(), 'data', 'route-des-syllabes.sqlite');
  return chemin === ':memory:' ? chemin : resolve(chemin);
}

const booleen = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v, ctx) => {
    if (['true', '1', 'yes', 'oui'].includes(v)) return true;
    if (['false', '0', 'no', 'non', ''].includes(v)) return false;
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'booléen attendu (true/false)' });
    return z.NEVER;
  });

const trustProxy = z
  .string()
  .trim()
  .transform((v): boolean | string[] => {
    const minuscule = v.toLowerCase();
    if (['true', '1'].includes(minuscule)) return true;
    if (['false', '0', ''].includes(minuscule)) return false;
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  });

const schemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().trim().min(1).default('0.0.0.0'),
  DATABASE_PATH: z.string().trim().min(1).optional(),
  SESSION_SECRET: z.string().optional(),
  COOKIE_SECURE: booleen.default('false'),
  ALLOW_SIGNUP: booleen.default('false'),
  TRUST_PROXY: trustProxy.default('false'),
  STATIC_DIR: z.string().trim().min(1).optional(),
});

export interface ResultatConfig {
  config: Config;
  avertissements: string[];
}

/**
 * Lit et valide les variables d'environnement.
 * Lève une erreur au message explicite si la configuration est invalide.
 */
export function chargerConfig(env: NodeJS.ProcessEnv = process.env): ResultatConfig {
  const resultat = schemaEnv.safeParse(env);
  if (!resultat.success) {
    const lignes = resultat.error.issues.map((i) => `  - ${i.path.join('.')} : ${i.message}`);
    throw new Error(`Configuration invalide :\n${lignes.join('\n')}`);
  }
  const e = resultat.data;
  const avertissements: string[] = [];
  const serveur = dossierServeur();

  let sessionSecret = e.SESSION_SECRET;
  if (sessionSecret === undefined || sessionSecret === '') {
    if (e.NODE_ENV === 'production') {
      throw new Error('Configuration invalide : SESSION_SECRET est obligatoire en production.');
    }
    sessionSecret = SECRET_DEV;
    avertissements.push(
      "SESSION_SECRET absent : utilisation d'un secret de développement (à ne pas faire en production).",
    );
  } else if (sessionSecret.length < 32) {
    throw new Error('Configuration invalide : SESSION_SECRET doit faire au moins 32 caractères.');
  }

  const databasePath = resoudreCheminBase(e.DATABASE_PATH);

  const dossierStatique = e.STATIC_DIR
    ? resolve(e.STATIC_DIR)
    : resolve(serveur, '..', 'client', 'dist');
  const staticDir =
    existsSync(dossierStatique) && statSync(dossierStatique).isDirectory() ? dossierStatique : null;
  if (!staticDir) {
    avertissements.push(
      `Dossier du client introuvable (${dossierStatique}) : les fichiers statiques ne seront pas servis.`,
    );
  }

  return {
    config: {
      environnement: e.NODE_ENV,
      port: e.PORT,
      host: e.HOST,
      databasePath,
      sessionSecret,
      cookieSecure: e.COOKIE_SECURE,
      allowSignup: e.ALLOW_SIGNUP,
      trustProxy: e.TRUST_PROXY,
      staticDir,
      argon2: ARGON2_PAR_DEFAUT,
    },
    avertissements,
  };
}
