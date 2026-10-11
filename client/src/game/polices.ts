import type { PoliceId } from '../../../shared/seance';

/**
 * Registre des polices des lettres.
 *
 * Pour ajouter une police cursive scolaire : déposer le fichier
 * `client/public/polices/cursive.woff2`, puis passer `disponible` à `true`
 * ci-dessous (voir README, section « Police cursive »).
 */
export interface Police {
  id: PoliceId;
  nom: string;
  famille: string;
  majuscules: boolean;
  disponible: boolean;
}

export const POLICES_LETTRES: Record<PoliceId, Police> = {
  'script-minuscule': {
    id: 'script-minuscule',
    nom: 'Script minuscule',
    famille: "'Andika', 'Andika Lettres', sans-serif",
    majuscules: false,
    disponible: true,
  },
  'script-majuscule': {
    id: 'script-majuscule',
    nom: 'Script majuscule',
    famille: "'Andika', 'Andika Lettres', sans-serif",
    majuscules: true,
    disponible: true,
  },
  cursive: {
    id: 'cursive',
    nom: 'Cursive',
    famille: "'RDS Cursive', 'Andika', sans-serif",
    majuscules: false,
    disponible: false,
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
