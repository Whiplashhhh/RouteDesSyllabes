import { describe, expect, it } from 'vitest';
import { ouvrirBase } from '../src/db/connexion.js';
import { migrer, MIGRATIONS } from '../src/db/migrations.js';
import { creerUtilisateur } from './aide.js';

describe('base de données', () => {
  it('applique les migrations une seule fois', () => {
    const db = ouvrirBase(':memory:');
    const versions = db.prepare('SELECT version FROM schema_migrations').pluck().all();
    expect(versions).toEqual(MIGRATIONS.map((m) => m.version));
    expect(migrer(db)).toEqual([]);
    db.close();
  });

  it('annule toutes les migrations en attente si l’une échoue', () => {
    const db = ouvrirBase(':memory:');
    const fautives = [
      ...MIGRATIONS,
      { version: 2, nom: 'ok', sql: 'CREATE TABLE essai (x INTEGER)' },
      { version: 3, nom: 'cassée', sql: 'CREATE TABLE ???' },
    ];
    expect(() => migrer(db, fautives)).toThrow();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'essai'")
      .all();
    expect(tables).toEqual([]);
    db.close();
  });

  it('active les clés étrangères (suppression en cascade)', async () => {
    const db = ouvrirBase(':memory:');
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    const { id } = await creerUtilisateur(db, 'alice@ecole.fr');
    expect(db.prepare('SELECT COUNT(*) FROM seances').pluck().get()).toBe(4);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    expect(db.prepare('SELECT COUNT(*) FROM seances').pluck().get()).toBe(0);
    db.close();
  });

  it('rend l’email unique sans tenir compte de la casse', async () => {
    const db = ouvrirBase(':memory:');
    await creerUtilisateur(db, 'alice@ecole.fr');
    expect(() =>
      db.prepare("INSERT INTO users VALUES ('x', 'ALICE@ecole.fr', 'h', '2026-01-01')").run(),
    ).toThrow(/UNIQUE/);
    db.close();
  });
});
