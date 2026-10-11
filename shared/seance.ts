/**
 * Modèle partagé entre le client et le serveur : description d'une séance.
 *
 * Ce fichier ne dépend d'aucune librairie, pour pouvoir être importé
 * aussi bien par Vite (client) que par Node (serveur).
 */

// ---------------------------------------------------------------------------
// Catalogues
// ---------------------------------------------------------------------------

/** Consonnes proposées dans l'éditeur (graphèmes d'une lettre). */
export const CONSONNES = [
  'l',
  'm',
  'r',
  's',
  'f',
  'v',
  'n',
  'j',
  'z',
  'p',
  't',
  'b',
  'd',
  'c',
  'k',
  'g',
  'h',
  'x',
  'w',
] as const;

/** Voyelles simples proposées dans l'éditeur. */
export const VOYELLES = ['a', 'e', 'i', 'o', 'u', 'y', 'é', 'è', 'ê'] as const;

/** Sons complexes : consonnes à plusieurs lettres. */
export const SONS_COMPLEXES_CONSONNES = ['ch', 'gn', 'ph', 'qu'] as const;

/** Sons complexes : voyelles à plusieurs lettres. */
export const SONS_COMPLEXES_VOYELLES = [
  'ou',
  'on',
  'an',
  'en',
  'in',
  'oi',
  'au',
  'eau',
  'ai',
  'ei',
  'eu',
  'un',
] as const;

/** Consonnes « qui glissent » : le son peut se prolonger (« llll… »). */
export const CONSONNES_QUI_GLISSENT = ['l', 'm', 'r', 's', 'f', 'v', 'n', 'ch', 'j', 'z'] as const;

export const VEHICULES = [
  'citadine',
  'bus',
  'pompiers',
  'tracteur',
  'train',
  'scooter',
  'police',
  'taxi',
] as const;
export type VehiculeId = (typeof VEHICULES)[number];

export const ROUTES = ['goudron', 'terre', 'rails', 'arc-en-ciel'] as const;
export type RouteStyleId = (typeof ROUTES)[number];

export const FONDS = ['ciel', 'campagne', 'coucher', 'nuit', 'uni'] as const;
export type FondId = (typeof FONDS)[number];

/** Palette des véhicules : couleurs vives mais douces. */
export const COULEURS = [
  'rouge',
  'corail',
  'orange',
  'jaune',
  'vert',
  'turquoise',
  'bleu',
  'indigo',
  'violet',
  'rose',
] as const;
export type CouleurId = (typeof COULEURS)[number];

/** Polices des lettres. */
export const POLICES = ['script-minuscule', 'script-majuscule', 'cursive'] as const;
export type PoliceId = (typeof POLICES)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouteFixe {
  consonne: string;
  voyelles: string[];
}

export interface VehiculeRoute {
  type: VehiculeId;
  couleur: CouleurId;
}

export interface Decor {
  fond: FondId;
  /** Couleur hexadécimale utilisée par le fond « uni ». */
  couleurUnie: string;
  route: RouteStyleId;
  /** Toujours 4 entrées : une par route possible. */
  vehicules: VehiculeRoute[];
  /** Si vrai, le véhicule de la route 1 est utilisé partout. */
  memeVehicule: boolean;
  /** Yeux expressifs sur les véhicules. */
  yeux: boolean;
  /** Nuages qui dérivent, étoiles qui scintillent. */
  animationsFond: boolean;
}

export interface Retours {
  /** Traînée de consonnes pendant le glissement. */
  trainee: boolean;
  /** Fusion animée (rebond + couleur). */
  fusion: boolean;
  /** Petite fête (étoiles) après une syllabe. */
  fete: boolean;
  /** Bruitages Web Audio (ding, moteur). */
  bruitages: boolean;
  /** Lecture de la syllabe par synthèse vocale. */
  voix: boolean;
  /** Petit nuage de fumée quand on tire vite. */
  fumee: boolean;
  /** Retour automatique au départ après une syllabe réussie. */
  retourAuto: boolean;
  /** Animations réduites (en plus de prefers-reduced-motion). */
  animationsReduites: boolean;
}

export interface SeanceConfig {
  consonnes: string[];
  voyelles: string[];
  nbRoutes: number; // 1 à 4
  voyellesParRoute: number; // 1 à 3
  tirage: 'aleatoire' | 'fixe';
  /** Utilisé quand tirage = 'fixe' : une entrée par route. */
  routesFixes: RouteFixe[];
  police: PoliceId;
  decor: Decor;
  retours: Retours;
}

/** Séance telle que renvoyée par l'API. */
export interface Seance {
  id: string;
  nom: string;
  config: SeanceConfig;
  creeLe: string;
  modifieLe: string;
}

// ---------------------------------------------------------------------------
// Limites et valeurs par défaut
// ---------------------------------------------------------------------------

export const LIMITES = {
  routesMin: 1,
  routesMax: 4,
  voyellesMin: 1,
  voyellesMax: 3,
  nomMax: 60,
  grapheme: /^[a-zàâäéèêëïîôöùûüÿçœæ]{1,4}$/u,
  lettresMax: 40,
} as const;

export const RETOURS_PAR_DEFAUT: Retours = {
  trainee: true,
  fusion: true,
  fete: false,
  bruitages: false,
  voix: false,
  fumee: true,
  retourAuto: false,
  animationsReduites: false,
};

export const DECOR_PAR_DEFAUT: Decor = {
  fond: 'ciel',
  couleurUnie: '#bfe3f5',
  route: 'goudron',
  vehicules: [
    { type: 'citadine', couleur: 'rouge' },
    { type: 'bus', couleur: 'jaune' },
    { type: 'taxi', couleur: 'turquoise' },
    { type: 'pompiers', couleur: 'rouge' },
  ],
  memeVehicule: false,
  yeux: true,
  animationsFond: true,
};

export function configParDefaut(): SeanceConfig {
  return {
    consonnes: ['l', 'm', 'r'],
    voyelles: ['a', 'i', 'o'],
    nbRoutes: 3,
    voyellesParRoute: 2,
    tirage: 'aleatoire',
    routesFixes: [
      { consonne: 'l', voyelles: ['a', 'i'] },
      { consonne: 'm', voyelles: ['o', 'a'] },
      { consonne: 'r', voyelles: ['i', 'o'] },
      { consonne: 'l', voyelles: ['o', 'i'] },
    ],
    police: 'script-minuscule',
    decor: structuredClone(DECOR_PAR_DEFAUT),
    retours: { ...RETOURS_PAR_DEFAUT },
  };
}

/** Séances d'exemple créées pour chaque nouveau compte (progression de CP). */
export function seancesExemples(): { nom: string; config: SeanceConfig }[] {
  const base = configParDefaut();
  return [
    {
      nom: 'Premières syllabes',
      config: { ...structuredClone(base), consonnes: ['l', 'm', 'r'], voyelles: ['a', 'i', 'o'] },
    },
    {
      nom: 'On ajoute le u et le é',
      config: {
        ...structuredClone(base),
        consonnes: ['l', 'm', 'r', 's'],
        voyelles: ['a', 'i', 'o', 'u', 'é'],
        decor: {
          ...structuredClone(base.decor),
          fond: 'campagne',
          route: 'terre',
          vehicules: [
            { type: 'tracteur', couleur: 'vert' },
            { type: 'citadine', couleur: 'orange' },
            { type: 'scooter', couleur: 'violet' },
            { type: 'bus', couleur: 'jaune' },
          ],
        },
      },
    },
    {
      nom: 'Les sons qui glissent',
      config: {
        ...structuredClone(base),
        consonnes: ['f', 's', 'v', 'n', 'ch'],
        voyelles: ['a', 'i', 'o', 'u'],
        nbRoutes: 3,
        decor: {
          ...structuredClone(base.decor),
          fond: 'coucher',
          route: 'rails',
          memeVehicule: true,
          vehicules: [
            { type: 'train', couleur: 'bleu' },
            { type: 'train', couleur: 'rouge' },
            { type: 'train', couleur: 'vert' },
            { type: 'train', couleur: 'violet' },
          ],
        },
      },
    },
    {
      nom: 'Avec les sons complexes',
      config: {
        ...structuredClone(base),
        consonnes: ['l', 'm', 'r', 'p', 't'],
        voyelles: ['ou', 'on', 'an'],
        nbRoutes: 2,
        decor: {
          ...structuredClone(base.decor),
          fond: 'nuit',
          route: 'arc-en-ciel',
          vehicules: [
            { type: 'police', couleur: 'bleu' },
            { type: 'pompiers', couleur: 'rouge' },
            { type: 'taxi', couleur: 'jaune' },
            { type: 'citadine', couleur: 'rose' },
          ],
        },
      },
    },
  ];
}

/**
 * Complète une configuration partielle (ou ancienne) avec les valeurs par défaut,
 * pour rester compatible quand de nouveaux réglages apparaissent.
 */
export function normaliserConfig(partielle: Partial<SeanceConfig> | undefined): SeanceConfig {
  const defaut = configParDefaut();
  const c = partielle ?? {};
  const vehicules = [...(c.decor?.vehicules ?? []), ...defaut.decor.vehicules].slice(0, 4);
  return {
    ...defaut,
    ...c,
    decor: { ...defaut.decor, ...(c.decor ?? {}), vehicules },
    retours: { ...defaut.retours, ...(c.retours ?? {}) },
    routesFixes: c.routesFixes?.length ? c.routesFixes : defaut.routesFixes,
  };
}

export function estQuiGlisse(grapheme: string): boolean {
  return (CONSONNES_QUI_GLISSENT as readonly string[]).includes(grapheme);
}
