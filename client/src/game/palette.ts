import type { CouleurId } from '../../../shared/seance';

/** Teintes de carrosserie : principale, ombre (contours) et reflet. */
export interface Teinte {
  nom: string;
  principale: string;
  fonce: string;
  clair: string;
}

export const TEINTES: Record<CouleurId, Teinte> = {
  rouge: { nom: 'Rouge', principale: '#ee5d5a', fonce: '#b8403e', clair: '#ff9d96' },
  corail: { nom: 'Corail', principale: '#ff8a65', fonce: '#cf6542', clair: '#ffb79e' },
  orange: { nom: 'Orange', principale: '#ffa53d', fonce: '#d17d17', clair: '#ffcb85' },
  jaune: { nom: 'Jaune', principale: '#ffd23f', fonce: '#d4a20a', clair: '#ffe892' },
  vert: { nom: 'Vert', principale: '#5cc97a', fonce: '#36985a', clair: '#9be5ae' },
  turquoise: { nom: 'Turquoise', principale: '#35c4bc', fonce: '#1d938d', clair: '#86e2db' },
  bleu: { nom: 'Bleu', principale: '#4ea8f2', fonce: '#2a7cc4', clair: '#98d0fb' },
  indigo: { nom: 'Indigo', principale: '#6f80ef', fonce: '#4a59c2', clair: '#aab6ff' },
  violet: { nom: 'Violet', principale: '#a37ff0', fonce: '#7856c4', clair: '#cbb5ff' },
  rose: { nom: 'Rose', principale: '#f58ab5', fonce: '#cc5f8d', clair: '#ffbcd6' },
};

/** Variables CSS appliquées sur un véhicule pour le colorer. */
export function variablesTeinte(couleur: CouleurId): Record<string, string> {
  const t = TEINTES[couleur] ?? TEINTES.rouge;
  return {
    '--carrosserie': t.principale,
    '--carrosserie-fonce': t.fonce,
    '--carrosserie-clair': t.clair,
  };
}
