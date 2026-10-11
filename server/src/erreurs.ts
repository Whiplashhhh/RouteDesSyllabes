/** Erreur dont le message est destiné à l'utilisatrice (renvoyé tel quel par l'API). */
export class ErreurHttp extends Error {
  constructor(
    readonly statusCode: number,
    readonly messagePublic: string,
    readonly details?: string[],
  ) {
    super(messagePublic);
    this.name = 'ErreurHttp';
  }
}

export const MESSAGES = {
  interne: 'Oups, un souci est survenu de notre côté. On réessaie ?',
  introuvable: "Cette adresse n'existe pas.",
  seanceIntrouvable: 'Cette séance est introuvable.',
  nonConnectee: 'Merci de vous connecter pour continuer.',
  identifiantsIncorrects: 'Email ou mot de passe incorrect.',
  tropDEssais: "Trop d'essais. Patientez quelques minutes avant de réessayer.",
  inscriptionFermee:
    "Les inscriptions sont fermées. Demandez un compte à la personne qui gère l'application.",
  inscriptionImpossible: 'Impossible de créer ce compte.',
  requeteRefusee: 'Requête refusée.',
  corpsTropGros: 'Les informations envoyées sont trop volumineuses.',
  validation: 'Certaines informations ne sont pas valides.',
} as const;
