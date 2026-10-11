/**
 * Tirage des lettres d'une séance : chaque route reçoit une consonne
 * et N voyelles distinctes.
 */
import type { SeanceConfig } from './seance.js';

export interface RouteTiree {
  consonne: string;
  voyelles: string[];
}

/** Générateur aléatoire injectable (pour des tests reproductibles). */
export type Aleatoire = () => number;

function melanger<T>(liste: readonly T[], aleatoire: Aleatoire): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(aleatoire() * (i + 1));
    [copie[i], copie[j]] = [copie[j] as T, copie[i] as T];
  }
  return copie;
}

function borner(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * Tire les lettres de toutes les routes.
 *
 * - On évite que deux routes aient la même consonne si la liste le permet.
 * - Les voyelles d'une même route sont distinctes.
 * - `precedent` permet d'éviter de retomber exactement sur le même tirage.
 */
export function tirerRoutes(
  config: Pick<
    SeanceConfig,
    'consonnes' | 'voyelles' | 'nbRoutes' | 'voyellesParRoute' | 'tirage' | 'routesFixes'
  >,
  aleatoire: Aleatoire = Math.random,
  precedent?: RouteTiree[],
): RouteTiree[] {
  const nbRoutes = borner(config.nbRoutes, 1, 4);
  const consonnes = config.consonnes.length ? config.consonnes : ['l'];
  const voyelles = config.voyelles.length ? config.voyelles : ['a'];
  const nbVoyelles = borner(config.voyellesParRoute, 1, 3);

  if (config.tirage === 'fixe') {
    return Array.from({ length: nbRoutes }, (_, i) => {
      const fixe = config.routesFixes[i];
      const voy = (fixe?.voyelles ?? []).filter(Boolean).slice(0, 3);
      return {
        consonne: fixe?.consonne || consonnes[i % consonnes.length] || 'l',
        voyelles: voy.length ? voy : [voyelles[0] ?? 'a'],
      };
    });
  }

  const tirer = (): RouteTiree[] => {
    let sac: string[] = [];
    return Array.from({ length: nbRoutes }, () => {
      // Le « sac » de consonnes garantit qu'on ne répète pas une consonne
      // tant que toutes n'ont pas été utilisées.
      if (sac.length === 0) sac = melanger(consonnes, aleatoire);
      const consonne = sac.pop() as string;
      const voy = melanger(voyelles, aleatoire).slice(0, Math.min(nbVoyelles, voyelles.length));
      return { consonne, voyelles: voy };
    });
  };

  let resultat = tirer();
  // Quelques essais pour éviter de redonner exactement le même écran.
  const cle = (r: RouteTiree[]) => r.map((x) => `${x.consonne}:${x.voyelles.join(',')}`).join('|');
  if (precedent) {
    for (let essai = 0; essai < 8 && cle(resultat) === cle(precedent); essai++) {
      resultat = tirer();
    }
  }
  return resultat;
}

/** Forme la syllabe affichée et prononcée. */
export function syllabe(consonne: string, voyelle: string): string {
  // « c » + « i » ne se lit pas « ki » : on garde l'écriture telle quelle,
  // c'est à la maîtresse de choisir ses combinaisons.
  return `${consonne}${voyelle}`;
}
