/**
 * Contrat de l'API HTTP (sous /api). Types partagés client/serveur.
 *
 * GET    /api/health                  -> { ok: true }
 * GET    /api/config                  -> ConfigPublique
 * POST   /api/auth/login              { email, motDePasse, resterConnectee } -> Utilisateur
 * POST   /api/auth/signup             { email, motDePasse } -> Utilisateur (si ALLOW_SIGNUP)
 * POST   /api/auth/logout             -> 204
 * GET    /api/auth/me                 -> Utilisateur | 401
 * GET    /api/seances                 -> Seance[]
 * POST   /api/seances                 { nom, config } -> Seance (201)
 * GET    /api/seances/:id             -> Seance | 404
 * PUT    /api/seances/:id             { nom, config } -> Seance
 * DELETE /api/seances/:id             -> 204 (suppression douce, annulable)
 * POST   /api/seances/:id/restaurer   -> Seance
 * POST   /api/seances/:id/dupliquer   -> Seance (201)
 *
 * Erreurs : { erreur: string } avec un message humain en français.
 */
import type { SeanceConfig } from './seance.js';

export interface Utilisateur {
  id: string;
  email: string;
}

export interface ConfigPublique {
  inscriptionOuverte: boolean;
}

export interface Identifiants {
  email: string;
  motDePasse: string;
  resterConnectee?: boolean;
}

export interface SeanceEntree {
  nom: string;
  config: SeanceConfig;
}

export interface ErreurApi {
  erreur: string;
}
