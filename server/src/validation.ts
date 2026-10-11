import { z } from 'zod';
import {
  COULEURS,
  FONDS,
  LIMITES,
  POLICES,
  ROUTES,
  VEHICULES,
  normaliserConfig,
  type SeanceConfig,
} from '../../shared/seance.js';
import { ErreurHttp, MESSAGES } from './erreurs.js';

export const MOT_DE_PASSE_MIN = 8;
export const MOT_DE_PASSE_MAX = 200;

/** Email normalisé : espaces retirés et minuscules. */
export const schemaEmail = z.string().trim().toLowerCase().max(254).email();

export const schemaMotDePasse = z.string().min(MOT_DE_PASSE_MIN).max(MOT_DE_PASSE_MAX);

export const schemaConnexion = z.object({
  // À la connexion, on ne refuse pas un format « bizarre » : on répond simplement « incorrect ».
  email: z.string().trim().toLowerCase().min(1).max(254),
  motDePasse: z.string().min(1).max(MOT_DE_PASSE_MAX),
  resterConnectee: z.boolean().default(true),
});

export const schemaInscription = z.object({
  email: schemaEmail,
  motDePasse: schemaMotDePasse,
});

const grapheme = z.string().regex(LIMITES.grapheme);
const listeGraphemes = z.array(grapheme).min(1).max(LIMITES.lettresMax);

export const schemaSeanceConfig = z.object({
  consonnes: listeGraphemes,
  voyelles: listeGraphemes,
  nbRoutes: z.number().int().min(LIMITES.routesMin).max(LIMITES.routesMax),
  voyellesParRoute: z.number().int().min(LIMITES.voyellesMin).max(LIMITES.voyellesMax),
  tirage: z.enum(['aleatoire', 'fixe']),
  routesFixes: z
    .array(
      z.object({
        consonne: grapheme,
        voyelles: z.array(grapheme).min(1).max(LIMITES.voyellesMax),
      }),
    )
    .max(LIMITES.routesMax),
  police: z.enum(POLICES),
  decor: z.object({
    fond: z.enum(FONDS),
    couleurUnie: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .transform((c) => c.toLowerCase()),
    route: z.enum(ROUTES),
    vehicules: z
      .array(z.object({ type: z.enum(VEHICULES), couleur: z.enum(COULEURS) }))
      .length(LIMITES.routesMax),
    memeVehicule: z.boolean(),
    yeux: z.boolean(),
    animationsFond: z.boolean(),
  }),
  retours: z.object({
    trainee: z.boolean(),
    fusion: z.boolean(),
    fete: z.boolean(),
    bruitages: z.boolean(),
    voix: z.boolean(),
    fumee: z.boolean(),
    retourAuto: z.boolean(),
    animationsReduites: z.boolean(),
  }),
}) satisfies z.ZodType<SeanceConfig, z.ZodTypeDef, unknown>;

export const schemaNomSeance = z.string().trim().min(1).max(LIMITES.nomMax);

export const schemaSeanceEntree = z.object({
  nom: schemaNomSeance,
  config: schemaSeanceConfig.transform((config) => normaliserConfig(config)),
});

/** Valide une entrée ; lève une erreur 400 listant les champs concernés. */
export function valider<S extends z.ZodTypeAny>(schema: S, donnees: unknown): z.output<S> {
  const resultat = schema.safeParse(donnees);
  if (resultat.success) return resultat.data;
  const champs = [...new Set(resultat.error.issues.map((i) => i.path.join('.') || '(corps)'))];
  throw new ErreurHttp(400, MESSAGES.validation, champs);
}
