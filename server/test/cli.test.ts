import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { ouvrirBase } from '../src/db/connexion.js';

const dossier = mkdtempSync(join(tmpdir(), 'rds-cli-'));
const base = join(dossier, 'base.sqlite');

const dossierCli = fileURLToPath(new URL('../src/cli/', import.meta.url));

function lancer(script: 'create-user' | 'reset-password', email: string, motDePasse?: string) {
  const args = ['--email', email, ...(motDePasse === undefined ? [] : ['--password', motDePasse])];
  const resultat = spawnSync(
    process.execPath,
    ['--import', 'tsx', join(dossierCli, `${script}.ts`), ...args],
    { env: { ...process.env, DATABASE_PATH: base }, encoding: 'utf8' },
  );
  return { code: resultat.status, sortie: resultat.stdout, erreur: resultat.stderr };
}

afterAll(() => rmSync(dossier, { recursive: true, force: true }));

describe('ligne de commande', { timeout: 30_000 }, () => {
  it('crée un compte avec ses séances d’exemple', () => {
    const { code, sortie } = lancer('create-user', 'Alice@Ecole.fr', 'motdepasse');
    expect(code).toBe(0);
    expect(sortie).toContain('Compte créé pour alice@ecole.fr');
    const db = ouvrirBase(base);
    expect(db.prepare('SELECT COUNT(*) FROM seances').pluck().get()).toBe(4);
    db.close();
  });

  it('refuse un email déjà pris', () => {
    const { code, erreur } = lancer('create-user', 'alice@ecole.fr', 'motdepasse');
    expect(code).toBe(1);
    expect(erreur).toContain('existe déjà');
  });

  it('refuse un mot de passe trop court', () => {
    const { code, erreur } = lancer('create-user', 'bob@ecole.fr', 'court');
    expect(code).toBe(1);
    expect(erreur).toContain('entre 8 et 200 caractères');
  });

  it('signale les options manquantes', () => {
    const { code, erreur } = lancer('create-user', 'bob@ecole.fr');
    expect(code).toBe(2);
    expect(erreur).toContain('Usage');
  });

  it('réinitialise le mot de passe et ferme les sessions', () => {
    const db = ouvrirBase(base);
    db.prepare(
      `INSERT INTO sessions (id, user_id, token_hash, created_at, last_used_at, expires_at, persistent)
       SELECT 's1', id, 'h', 0, 0, 9e15, 1 FROM users`,
    ).run();
    db.close();

    const { code, sortie } = lancer('reset-password', 'alice@ecole.fr', 'nouveau-mdp');
    expect(code).toBe(0);
    expect(sortie).toContain('1 session(s) fermée(s)');
    const apres = ouvrirBase(base);
    expect(apres.prepare('SELECT COUNT(*) FROM sessions').pluck().get()).toBe(0);
    apres.close();
  });

  it('signale un utilisateur introuvable', () => {
    const { code, erreur } = lancer('reset-password', 'personne@ecole.fr', 'nouveau-mdp');
    expect(code).toBe(1);
    expect(erreur).toContain('Aucun compte');
  });
});
