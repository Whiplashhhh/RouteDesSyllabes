/**
 * Géométrie du jeu : toutes les tailles découlent des dimensions de la scène,
 * ce qui garantit la même mise en page du portable 13 pouces à l'écran de 86 pouces
 * (et dans l'aperçu miniature de l'éditeur).
 */

/** Proportions du dessin des véhicules (viewBox 240 × 150). */
export const VEHICULE_VB = { largeur: 240, hauteur: 150, sol: 146 } as const;

export interface GeometrieRoute {
  /** Hauteur d'un couloir (route + ciel au-dessus). */
  hauteurCouloir: number;
  /** Hauteur et largeur du véhicule en pixels. */
  vehiculeH: number;
  vehiculeL: number;
  /** Ligne du sol (bas des roues), mesurée depuis le haut du couloir. */
  sol: number;
  /** Bande de route. */
  routeHaut: number;
  routeH: number;
  /** Taille de police des lettres. */
  taillePolice: number;
  /** Étiquettes. */
  etiquetteH: number;
  etiquetteHaut: number;
  /** Décalage horizontal de l'étiquette par rapport à l'arrière du véhicule. */
  etiquetteX: number;
  /** Positions extrêmes du véhicule. */
  departX: number;
  margeDroite: number;
  /** Distance d'aimantation et de décrochage. */
  aimant: number;
  decrochage: number;
}

export function calculerGeometrie(
  largeur: number,
  hauteur: number,
  nbRoutes: number,
): GeometrieRoute {
  const hauteurCouloir = hauteur / nbRoutes;
  const vehiculeH = Math.max(24, Math.min(hauteurCouloir * 0.6, hauteur * 0.31, largeur * 0.125));
  const vehiculeL = (vehiculeH * VEHICULE_VB.largeur) / VEHICULE_VB.hauteur;
  const sol = Math.min(hauteurCouloir * 0.9, hauteurCouloir / 2 + vehiculeH * 0.62);
  const routeH = vehiculeH * 0.6;
  const routeHaut = sol - routeH * 0.7;
  const taillePolice = vehiculeH * 0.5;
  const etiquetteH = taillePolice * 1.24;
  const etiquetteHaut = sol - vehiculeH * 0.06 - etiquetteH;
  return {
    hauteurCouloir,
    vehiculeH,
    vehiculeL,
    sol,
    routeHaut,
    routeH,
    taillePolice,
    etiquetteH,
    etiquetteHaut,
    etiquetteX: vehiculeL * 0.965,
    departX: largeur * 0.02,
    margeDroite: largeur * 0.012,
    aimant: taillePolice * 0.22,
    decrochage: taillePolice * 0.95,
  };
}

/**
 * Place les voyelles d'une route : espacement régulier, légèrement varié,
 * toujours à droite du véhicule au départ.
 *
 * `variations` contient des nombres dans [0, 1[ tirés une fois par tirage,
 * pour que la position ne change pas lors d'un redimensionnement.
 */
export function placerVoyelles(
  largeur: number,
  geo: GeometrieRoute,
  largeurEtiquetteConsonne: number,
  largeursVoyelles: number[],
  variations: number[],
): number[] {
  const n = largeursVoyelles.length;
  if (n === 0) return [];
  const avantDepart = geo.departX + geo.etiquetteX + largeurEtiquetteConsonne;
  const debut = avantDepart + Math.max(largeur * 0.1, geo.taillePolice * 1.2);
  const plusLarge = Math.max(...largeursVoyelles);
  const fin = largeur - geo.margeDroite - plusLarge - geo.taillePolice * 0.4;
  const etendue = Math.max(0, fin - debut);
  const pas = etendue / n;
  return largeursVoyelles.map((_, i) => {
    const v = variations[i] ?? 0.5;
    const centre = n === 1 ? 0.45 : (i + 0.5) / n;
    const decalage = (v - 0.5) * pas * 0.22;
    return Math.round(debut + etendue * centre + decalage);
  });
}
