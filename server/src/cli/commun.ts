import { parseArgs } from 'node:util';
import { creerHacheur, type HacheurMotDePasse } from '../auth/motDePasse.js';
import { ARGON2_PAR_DEFAUT, resoudreCheminBase } from '../config.js';
import { ouvrirBase, type BaseDeDonnees } from '../db/connexion.js';
import {
  schemaEmail,
  schemaMotDePasse,
  MOT_DE_PASSE_MAX,
  MOT_DE_PASSE_MIN,
} from '../validation.js';

/** Erreur à afficher telle quelle, suivie d'une sortie en échec. */
export class ErreurCli extends Error {
  constructor(
    message: string,
    readonly codeSortie = 1,
  ) {
    super(message);
  }
}

export interface Identifiants {
  email: string;
  motDePasse: string;
}

/** Lit et valide `--email` et `--password`. */
export function lireIdentifiants(usage: string, args = process.argv.slice(2)): Identifiants {
  let valeurs: { email?: string; password?: string };
  try {
    ({ values: valeurs } = parseArgs({
      args,
      options: { email: { type: 'string' }, password: { type: 'string' } },
      strict: true,
    }));
  } catch {
    throw new ErreurCli(`Arguments invalides.\nUsage : ${usage}`, 2);
  }
  if (!valeurs.email || valeurs.password === undefined) {
    throw new ErreurCli(
      `Les options --email et --password sont obligatoires.\nUsage : ${usage}`,
      2,
    );
  }
  const email = schemaEmail.safeParse(valeurs.email);
  if (!email.success) throw new ErreurCli(`Email invalide : « ${valeurs.email} ».`);
  if (!schemaMotDePasse.safeParse(valeurs.password).success) {
    throw new ErreurCli(
      `Le mot de passe doit contenir entre ${MOT_DE_PASSE_MIN} et ${MOT_DE_PASSE_MAX} caractères.`,
    );
  }
  return { email: email.data, motDePasse: valeurs.password };
}

/** Ouvre la base et exécute la commande, en gérant affichage et code de sortie. */
export async function executer(
  commande: (db: BaseDeDonnees, hacheur: HacheurMotDePasse) => Promise<string>,
): Promise<void> {
  let db: BaseDeDonnees | undefined;
  try {
    db = ouvrirBase(resoudreCheminBase(process.env.DATABASE_PATH));
    console.log(await commande(db, creerHacheur(ARGON2_PAR_DEFAUT)));
  } catch (erreur) {
    if (erreur instanceof ErreurCli) {
      console.error(erreur.message);
      process.exitCode = erreur.codeSortie;
    } else {
      console.error('Erreur inattendue :', erreur instanceof Error ? erreur.message : erreur);
      process.exitCode = 1;
    }
  } finally {
    db?.close();
  }
}
