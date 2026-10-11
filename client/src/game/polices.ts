import type { PoliceId } from '../../../shared/seance';

/**
 * Registre des polices des lettres.
 *
 * La cursive utilise Playwrite FR Trad (licence OFL, auto-hébergée via
 * @fontsource), modèle d'écriture scolaire française.
 */
export interface Police {
  id: PoliceId;
  nom: string;
  famille: string;
  majuscules: boolean;
  /** Graisse des étiquettes (la cursive n'existe qu'en 400 : pas de faux gras). */
  graisse: number;
  /** Facteur de taille : les boucles de la cursive montent plus haut. */
  taille: number;
  /** Écriture liée : une fois collée, la syllabe s'écrit d'un seul trait. */
  liee: boolean;
  /** Encre des lettres : l'étiquette s'ajuste aux boucles et jambages de la route. */
  encre?: Encre;
  disponible: boolean;
}

/** Étendue verticale des lettres, en em, mesurée depuis la ligne de base. */
export interface Encre {
  /** Hauteur des lettres par groupe ; les autres montent à `hautDefaut`. */
  haut: [string, number][];
  hautDefaut: number;
  /** Profondeur des jambages par groupe ; les autres descendent à `basDefaut`. */
  bas: [string, number][];
  basDefaut: number;
  /** Ligne de base sous le milieu de la ligne : (ascendante − descendante) / 2 de la police. */
  decalageBase: number;
}

/** Glyphes de Playwrite FR Trad (relevés avec fontTools). */
const ENCRE_PLAYWRITE: Encre = {
  haut: [
    ['bdfhkl', 1.43],
    ['àâîéèêôùû', 0.84],
    ['ijÿäïëöü', 0.8],
    ['t', 0.73],
    ['rs', 0.58],
  ],
  hautDefaut: 0.52,
  bas: [
    ['fgjpqyzÿ', 0.93],
    ['ç', 0.27],
  ],
  basDefaut: 0.02,
  decalageBase: (1.927 - 0.925) / 2,
};

export const POLICES_LETTRES: Record<PoliceId, Police> = {
  'script-minuscule': {
    id: 'script-minuscule',
    nom: 'Script minuscule',
    famille: "'Andika', 'Andika Lettres', sans-serif",
    majuscules: false,
    graisse: 700,
    taille: 1,
    liee: false,
    disponible: true,
  },
  'script-majuscule': {
    id: 'script-majuscule',
    nom: 'Script majuscule',
    famille: "'Andika', 'Andika Lettres', sans-serif",
    majuscules: true,
    graisse: 700,
    taille: 1,
    liee: false,
    disponible: true,
  },
  cursive: {
    id: 'cursive',
    nom: 'Cursive',
    famille: "'Playwrite FR Trad', 'Andika', cursive",
    majuscules: false,
    graisse: 400,
    taille: 0.74,
    liee: true,
    encre: ENCRE_PLAYWRITE,
    disponible: true,
  },
};

export function police(id: PoliceId): Police {
  const p = POLICES_LETTRES[id];
  return p?.disponible ? p : POLICES_LETTRES['script-minuscule'];
}

/** Texte tel qu'il s'affiche avec la police choisie. */
export function afficher(grapheme: string, id: PoliceId): string {
  return police(id).majuscules ? grapheme.toLocaleUpperCase('fr-FR') : grapheme;
}

function etendue(groupes: [string, number][], defaut: number, texte: string): number {
  let max = 0;
  for (const c of texte.toLocaleLowerCase('fr-FR')) {
    max = Math.max(max, groupes.find(([lettres]) => lettres.includes(c))?.[1] ?? defaut);
  }
  return max;
}

/**
 * Cadre commun aux étiquettes d'une route : toutes ont la même hauteur et la même
 * ligne de base. La lettre la plus haute et la plus basse de la route laissent la
 * même marge en haut et en bas, sans descendre sous la hauteur `hauteurMin`.
 * Hauteur et interligne sont en pixels ; sans encre connue, le cadre reste fixe.
 */
export function cadreEtiquettes(
  p: Police,
  textes: string[],
  taillePolice: number,
  hauteurMin: number,
): { hauteur: number; interligne: number } {
  const e = p.encre;
  if (!e) return { hauteur: hauteurMin, interligne: hauteurMin };
  const f = taillePolice * p.taille;
  const tout = textes.join('');
  const haut = etendue(e.haut, e.hautDefaut, tout) * f;
  const bas = etendue(e.bas, e.basDefaut, tout) * f;
  // Marge de part et d'autre de l'encre : les lettres respirent dans leur étiquette.
  const marge = taillePolice * 0.16;
  const hauteur = Math.max(hauteurMin, haut + bas + 2 * marge);
  // La ligne de base se place à `interligne / 2 + decalageBase` du haut du texte.
  // Mesurée depuis le haut du texte, sous la bordure de 0,03 em de .etiquette.
  const base = (hauteur - haut - bas) / 2 + haut - 0.03 * f;
  return { hauteur, interligne: 2 * (base - e.decalageBase * f) };
}
