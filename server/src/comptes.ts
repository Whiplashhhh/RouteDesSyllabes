import { randomUUID } from 'node:crypto';
import type { Utilisateur } from '../../shared/api.js';
import { seancesExemples } from '../../shared/seance.js';
import type { HacheurMotDePasse } from './auth/motDePasse.js';
import type { BaseDeDonnees } from './db/connexion.js';
import { DepotSeances } from './seances/depot.js';

export interface LigneUtilisateur {
  id: string;
  email: string;
  password_hash: string;
}

export class EmailDejaPris extends Error {
  constructor() {
    super('Un compte existe déjà avec cet email.');
    this.name = 'EmailDejaPris';
  }
}

export function normaliserEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function trouverUtilisateurParEmail(
  db: BaseDeDonnees,
  email: string,
): LigneUtilisateur | undefined {
  return db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(normaliserEmail(email)) as LigneUtilisateur | undefined;
}

/**
 * Crée un compte et ses séances d'exemple, dans une seule transaction.
 * Le mot de passe doit avoir été validé par l'appelant.
 */
export async function creerCompte(
  db: BaseDeDonnees,
  hacheur: HacheurMotDePasse,
  email: string,
  motDePasse: string,
  seances = new DepotSeances(db),
): Promise<Utilisateur> {
  const emailNormalise = normaliserEmail(email);
  // Vérification préalable pour éviter un hachage inutile ; la contrainte UNIQUE reste l'arbitre.
  if (trouverUtilisateurParEmail(db, emailNormalise)) throw new EmailDejaPris();
  const hache = await hacheur.hacher(motDePasse);
  const id = randomUUID();

  try {
    db.transaction(() => {
      db.prepare(
        'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
      ).run(id, emailNormalise, hache, new Date().toISOString());
      for (const exemple of seancesExemples()) seances.creer(id, exemple.nom, exemple.config);
    })();
  } catch (erreur) {
    if ((erreur as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new EmailDejaPris();
    }
    throw erreur;
  }
  return { id, email: emailNormalise };
}

/** Change le mot de passe et ferme toutes les sessions de l'utilisateur. */
export async function changerMotDePasse(
  db: BaseDeDonnees,
  hacheur: HacheurMotDePasse,
  userId: string,
  motDePasse: string,
): Promise<{ sessionsFermees: number }> {
  const hache = await hacheur.hacher(motDePasse);
  return db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hache, userId);
    const { changes } = db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    return { sessionsFermees: changes };
  })();
}
