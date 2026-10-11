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
  disponible: boolean;
}

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
    taille: 0.82,
    liee: true,
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
