import { hash, verify, type Algorithm } from '@node-rs/argon2';
import type { ParametresArgon2 } from '../config.js';

// `Algorithm` est un « const enum » ambiant, inaccessible avec isolatedModules :
// 2 correspond à Algorithm.Argon2id.
const ARGON2ID = 2 as Algorithm;

export interface HacheurMotDePasse {
  hacher(motDePasse: string): Promise<string>;
  verifier(hache: string, motDePasse: string): Promise<boolean>;
  /** Vérification factice, pour égaliser le temps de réponse quand l'email est inconnu. */
  verifierFactice(motDePasse: string): Promise<false>;
}

export function creerHacheur(parametres: ParametresArgon2): HacheurMotDePasse {
  const options = { ...parametres, algorithm: ARGON2ID };
  let hacheFactice: Promise<string> | undefined;

  const hacher = (motDePasse: string) => hash(motDePasse, options);

  const verifier = async (hache: string, motDePasse: string) => {
    try {
      return await verify(hache, motDePasse);
    } catch {
      // Hash corrompu ou illisible : on refuse sans planter.
      return false;
    }
  };

  return {
    hacher,
    verifier,
    async verifierFactice(motDePasse) {
      hacheFactice ??= hacher('mot-de-passe-factice-pour-egaliser-le-temps');
      await verifier(await hacheFactice, motDePasse);
      return false;
    },
  };
}
