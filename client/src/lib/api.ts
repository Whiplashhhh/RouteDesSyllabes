/**
 * Accès à l'API du serveur. Toutes les erreurs sont traduites en messages
 * humains et rassurants, jamais techniques.
 */
import type { ConfigPublique, Identifiants, SeanceEntree, Utilisateur } from '../../../shared/api';
import { normaliserConfig, type Seance } from '../../../shared/seance';

export class ErreurApi extends Error {
  constructor(
    message: string,
    readonly statut: number,
  ) {
    super(message);
  }
}

const MESSAGE_RESEAU = 'Oups, la connexion a été coupée. On réessaie ?';
const MESSAGE_SERVEUR = 'Oups, un souci est survenu de notre côté. On réessaie ?';

async function requete<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`/api${chemin}`, {
      credentials: 'same-origin',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ErreurApi(MESSAGE_RESEAU, 0);
  }
  if (reponse.status === 204) return undefined as T;
  let corps: unknown = null;
  try {
    corps = await reponse.json();
  } catch {
    // corps vide ou non JSON
  }
  if (!reponse.ok) {
    const message =
      corps && typeof corps === 'object' && 'erreur' in corps && typeof corps.erreur === 'string'
        ? corps.erreur
        : reponse.status >= 500
          ? MESSAGE_SERVEUR
          : MESSAGE_RESEAU;
    throw new ErreurApi(message, reponse.status);
  }
  return corps as T;
}

const json = (methode: string, corps?: unknown): RequestInit => ({
  method: methode,
  body: corps === undefined ? undefined : JSON.stringify(corps),
});

/** Les séances reçues sont normalisées (compatibilité avec d'anciens réglages). */
const normaliser = (s: Seance): Seance => ({ ...s, config: normaliserConfig(s.config) });

export const api = {
  configPublique: () => requete<ConfigPublique>('/config'),
  moi: () => requete<Utilisateur>('/auth/me'),
  connexion: (identifiants: Identifiants) =>
    requete<Utilisateur>('/auth/login', json('POST', identifiants)),
  inscription: (identifiants: Identifiants) =>
    requete<Utilisateur>('/auth/signup', json('POST', identifiants)),
  deconnexion: () => requete<void>('/auth/logout', json('POST')),

  seances: async () => (await requete<Seance[]>('/seances')).map(normaliser),
  seance: async (id: string) => normaliser(await requete<Seance>(`/seances/${id}`)),
  creerSeance: async (entree: SeanceEntree) =>
    normaliser(await requete<Seance>('/seances', json('POST', entree))),
  modifierSeance: async (id: string, entree: SeanceEntree) =>
    normaliser(await requete<Seance>(`/seances/${id}`, json('PUT', entree))),
  supprimerSeance: (id: string) => requete<void>(`/seances/${id}`, json('DELETE')),
  restaurerSeance: async (id: string) =>
    normaliser(await requete<Seance>(`/seances/${id}/restaurer`, json('POST'))),
  dupliquerSeance: async (id: string) =>
    normaliser(await requete<Seance>(`/seances/${id}/dupliquer`, json('POST'))),
};
