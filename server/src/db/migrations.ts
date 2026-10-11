import type { Database } from 'better-sqlite3';

export interface Migration {
  version: number;
  nom: string;
  sql: string;
}

/**
 * Migrations versionnées, appliquées dans l'ordre.
 * Ne jamais modifier une migration déjà livrée : en ajouter une nouvelle.
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    nom: 'schéma initial',
    sql: `
      CREATE TABLE users (
        id            TEXT PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at    TEXT NOT NULL
      );

      -- Dates en millisecondes depuis l'époque Unix (comparées à chaque requête).
      CREATE TABLE sessions (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        token_hash   TEXT NOT NULL UNIQUE,
        created_at   INTEGER NOT NULL,
        last_used_at INTEGER NOT NULL,
        expires_at   INTEGER NOT NULL,
        persistent   INTEGER NOT NULL CHECK (persistent IN (0, 1))
      );
      CREATE INDEX sessions_user_id ON sessions (user_id);
      CREATE INDEX sessions_expires_at ON sessions (expires_at);

      CREATE TABLE seances (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        nom        TEXT NOT NULL,
        config     TEXT NOT NULL CHECK (json_valid(config)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE INDEX seances_user_id_created_at ON seances (user_id, created_at);
    `,
  },
];

/** Applique, dans une transaction, les migrations pas encore passées. */
export function migrer(db: Database, migrations: readonly Migration[] = MIGRATIONS): number[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     INTEGER PRIMARY KEY,
      nom         TEXT NOT NULL,
      applique_le TEXT NOT NULL
    )
  `);
  const dejaAppliquees = new Set(
    db.prepare('SELECT version FROM schema_migrations').pluck().all() as number[],
  );
  const aAppliquer = [...migrations]
    .sort((a, b) => a.version - b.version)
    .filter((m) => !dejaAppliquees.has(m.version));

  const enregistrer = db.prepare(
    'INSERT INTO schema_migrations (version, nom, applique_le) VALUES (?, ?, ?)',
  );
  db.transaction(() => {
    for (const migration of aAppliquer) {
      db.exec(migration.sql);
      enregistrer.run(migration.version, migration.nom, new Date().toISOString());
    }
  })();
  return aAppliquer.map((m) => m.version);
}
