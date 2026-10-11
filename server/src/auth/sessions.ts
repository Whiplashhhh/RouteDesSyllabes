import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import type { Utilisateur } from '../../../shared/api.js';
import type { BaseDeDonnees } from '../db/connexion.js';

const HEURE = 60 * 60 * 1000;
export const DUREE_SESSION_PERSISTANTE_MS = 30 * 24 * HEURE;
export const DUREE_SESSION_NAVIGATEUR_MS = 12 * HEURE;
/** On ne réécrit l'expiration (base et cookie) qu'au plus une fois par heure. */
export const INTERVALLE_RENOUVELLEMENT_MS = HEURE;

export interface SessionValide {
  id: string;
  utilisateur: Utilisateur;
  persistante: boolean;
  expireLe: number;
  /** Vrai si l'expiration vient d'être prolongée (le cookie doit être réémis). */
  renouvelee: boolean;
}

interface LigneSession {
  id: string;
  user_id: string;
  email: string;
  last_used_at: number;
  expires_at: number;
  persistent: 0 | 1;
}

export function genererToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Seul ce condensat est stocké : une fuite de la base ne donne pas de session utilisable. */
export function hacherToken(secret: string, token: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function dureeSession(persistante: boolean): number {
  return persistante ? DUREE_SESSION_PERSISTANTE_MS : DUREE_SESSION_NAVIGATEUR_MS;
}

export class DepotSessions {
  private readonly requetes;

  constructor(
    db: BaseDeDonnees,
    private readonly secret: string,
    private readonly maintenant: () => number = Date.now,
  ) {
    this.requetes = {
      inserer: db.prepare(
        `INSERT INTO sessions (id, user_id, token_hash, created_at, last_used_at, expires_at, persistent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ),
      trouver: db.prepare(
        `SELECT s.id, s.user_id, u.email, s.last_used_at, s.expires_at, s.persistent
           FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ?`,
      ),
      prolonger: db.prepare('UPDATE sessions SET last_used_at = ?, expires_at = ? WHERE id = ?'),
      supprimerParHash: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
      supprimerParId: db.prepare('DELETE FROM sessions WHERE id = ?'),
      purger: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
    };
  }

  creer(userId: string, persistante: boolean): { token: string; expireLe: number } {
    const token = genererToken();
    const maintenant = this.maintenant();
    const expireLe = maintenant + dureeSession(persistante);
    this.requetes.inserer.run(
      randomUUID(),
      userId,
      hacherToken(this.secret, token),
      maintenant,
      maintenant,
      expireLe,
      persistante ? 1 : 0,
    );
    return { token, expireLe };
  }

  /** Vérifie un token et prolonge la session (expiration glissante). */
  valider(token: string): SessionValide | null {
    const ligne = this.requetes.trouver.get(hacherToken(this.secret, token)) as
      | LigneSession
      | undefined;
    if (!ligne) return null;
    const maintenant = this.maintenant();
    if (ligne.expires_at <= maintenant) {
      this.requetes.supprimerParId.run(ligne.id);
      return null;
    }
    const persistante = ligne.persistent === 1;
    let expireLe = ligne.expires_at;
    const renouvelee = maintenant - ligne.last_used_at >= INTERVALLE_RENOUVELLEMENT_MS;
    if (renouvelee) {
      expireLe = maintenant + dureeSession(persistante);
      this.requetes.prolonger.run(maintenant, expireLe, ligne.id);
    }
    return {
      id: ligne.id,
      utilisateur: { id: ligne.user_id, email: ligne.email },
      persistante,
      expireLe,
      renouvelee,
    };
  }

  supprimer(token: string): void {
    this.requetes.supprimerParHash.run(hacherToken(this.secret, token));
  }

  purgerExpirees(): number {
    return this.requetes.purger.run(this.maintenant()).changes;
  }
}
