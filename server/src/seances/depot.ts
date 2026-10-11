import { randomUUID } from 'node:crypto';
import {
  LIMITES,
  normaliserConfig,
  type Seance,
  type SeanceConfig,
} from '../../../shared/seance.js';
import type { BaseDeDonnees } from '../db/connexion.js';

/** Durée pendant laquelle une séance supprimée reste restaurable. */
export const RETENTION_SUPPRESSION_MS = 7 * 24 * 60 * 60 * 1000;

interface LigneSeance {
  id: string;
  nom: string;
  config: string;
  created_at: string;
  updated_at: string;
}

const COLONNES = 'id, nom, config, created_at, updated_at';

function versSeance(ligne: LigneSeance): Seance {
  return {
    id: ligne.id,
    nom: ligne.nom,
    // Normalisation à la lecture : une ancienne config reçoit les réglages apparus depuis.
    config: normaliserConfig(JSON.parse(ligne.config) as Partial<SeanceConfig>),
    creeLe: ligne.created_at,
    modifieLe: ligne.updated_at,
  };
}

export function nomDeCopie(nom: string): string {
  const suffixe = ' (copie)';
  return nom.slice(0, LIMITES.nomMax - suffixe.length).trimEnd() + suffixe;
}

/**
 * Accès aux séances. Toutes les méthodes sont cloisonnées par utilisateur :
 * une séance d'un autre compte est traitée comme inexistante.
 */
export class DepotSeances {
  private readonly requetes;

  constructor(
    db: BaseDeDonnees,
    private readonly maintenant: () => Date = () => new Date(),
  ) {
    this.requetes = {
      lister: db.prepare(
        `SELECT ${COLONNES} FROM seances
          WHERE user_id = ? AND deleted_at IS NULL
          ORDER BY created_at, rowid`,
      ),
      obtenir: db.prepare(
        `SELECT ${COLONNES} FROM seances
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      ),
      inserer: db.prepare(
        `INSERT INTO seances (id, user_id, nom, config, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ),
      modifier: db.prepare(
        `UPDATE seances SET nom = ?, config = ?, updated_at = ?
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      ),
      supprimer: db.prepare(
        `UPDATE seances SET deleted_at = ?
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      ),
      restaurer: db.prepare(`UPDATE seances SET deleted_at = NULL WHERE id = ? AND user_id = ?`),
      purger: db.prepare('DELETE FROM seances WHERE deleted_at IS NOT NULL AND deleted_at <= ?'),
    };
  }

  lister(userId: string): Seance[] {
    return (this.requetes.lister.all(userId) as LigneSeance[]).map(versSeance);
  }

  obtenir(userId: string, id: string): Seance | null {
    const ligne = this.requetes.obtenir.get(id, userId) as LigneSeance | undefined;
    return ligne ? versSeance(ligne) : null;
  }

  creer(userId: string, nom: string, config: SeanceConfig): Seance {
    const id = randomUUID();
    const date = this.maintenant().toISOString();
    this.requetes.inserer.run(id, userId, nom, JSON.stringify(config), date, date);
    return this.obtenirOuEchouer(userId, id);
  }

  modifier(userId: string, id: string, nom: string, config: SeanceConfig): Seance | null {
    const date = this.maintenant().toISOString();
    const { changes } = this.requetes.modifier.run(nom, JSON.stringify(config), date, id, userId);
    return changes ? this.obtenirOuEchouer(userId, id) : null;
  }

  /** Suppression douce : la séance reste restaurable pendant 7 jours. */
  supprimer(userId: string, id: string): boolean {
    const date = this.maintenant().toISOString();
    return this.requetes.supprimer.run(date, id, userId).changes > 0;
  }

  restaurer(userId: string, id: string): Seance | null {
    const { changes } = this.requetes.restaurer.run(id, userId);
    return changes ? this.obtenirOuEchouer(userId, id) : null;
  }

  dupliquer(userId: string, id: string): Seance | null {
    const source = this.obtenir(userId, id);
    return source ? this.creer(userId, nomDeCopie(source.nom), source.config) : null;
  }

  /** Efface définitivement les séances supprimées depuis plus de 7 jours. */
  purgerSupprimees(): number {
    const limite = new Date(this.maintenant().getTime() - RETENTION_SUPPRESSION_MS);
    return this.requetes.purger.run(limite.toISOString()).changes;
  }

  private obtenirOuEchouer(userId: string, id: string): Seance {
    const seance = this.obtenir(userId, id);
    if (!seance) throw new Error(`Séance ${id} introuvable juste après écriture.`);
    return seance;
  }
}
