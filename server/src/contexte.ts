import type { FastifyRequest } from 'fastify';
import type { Utilisateur } from '../../shared/api.js';
import type { LimiteurTentatives } from './auth/limiteur.js';
import type { HacheurMotDePasse } from './auth/motDePasse.js';
import type { DepotSessions, SessionValide } from './auth/sessions.js';
import type { Config } from './config.js';
import type { BaseDeDonnees } from './db/connexion.js';
import { ErreurHttp, MESSAGES } from './erreurs.js';
import type { DepotSeances } from './seances/depot.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Session de l'utilisatrice connectée, résolue pour les requêtes /api. */
    session: SessionValide | null;
  }
}

/** Dépendances partagées par les routes. */
export interface Contexte {
  config: Config;
  db: BaseDeDonnees;
  hacheur: HacheurMotDePasse;
  sessions: DepotSessions;
  seances: DepotSeances;
  limiteurEmail: LimiteurTentatives;
  limiteurIp: LimiteurTentatives;
  /** Délai ajouté à chaque échec de connexion (ralentit les essais en rafale). */
  delaiEchecConnexionMs: number;
}

export interface OptionsRoutes {
  contexte: Contexte;
}

export function estCheminApi(url: string): boolean {
  return url === '/api' || url.startsWith('/api/') || url.startsWith('/api?');
}

export function exigerUtilisateur(request: FastifyRequest): Utilisateur {
  if (!request.session) throw new ErreurHttp(401, MESSAGES.nonConnectee);
  return request.session.utilisateur;
}
