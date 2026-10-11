import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { migrer } from './migrations.js';

export type BaseDeDonnees = Database.Database;

/** Ouvre la base SQLite (`:memory:` accepté), règle les pragmas et applique les migrations. */
export function ouvrirBase(chemin: string): BaseDeDonnees {
  if (chemin !== ':memory:') mkdirSync(dirname(chemin), { recursive: true });
  const db = new Database(chemin);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  migrer(db);
  return db;
}
