import { describe, expect, it } from 'vitest';
import { calculerGeometrie, placerVoyelles } from '../game/geometrie';

describe('géométrie du jeu', () => {
  it('garde les mêmes proportions du portable au très grand écran', () => {
    const petit = calculerGeometrie(1366, 768, 3);
    const grand = calculerGeometrie(3840, 2160, 3);
    expect(grand.taillePolice / 2160).toBeCloseTo(petit.taillePolice / 768, 2);
  });

  it('affiche des lettres énormes (plus de 6 % de la hauteur, même avec 4 routes)', () => {
    for (const n of [1, 2, 3, 4]) {
      const g = calculerGeometrie(1920, 1080, n);
      expect(g.taillePolice / 1080).toBeGreaterThan(0.06);
    }
  });

  it('place toutes les voyelles à droite du véhicule, dans l’écran, de gauche à droite', () => {
    for (const n of [1, 2, 3, 4]) {
      const g = calculerGeometrie(1920, 1080, n);
      const consonne = g.taillePolice;
      const voyelles = [g.taillePolice, g.taillePolice * 1.5, g.taillePolice];
      for (const variations of [
        [0, 0, 0],
        [0.99, 0.99, 0.99],
        [0.99, 0, 0.5],
      ]) {
        const x = placerVoyelles(1920, g, consonne, voyelles, variations);
        const avant = g.departX + g.etiquetteX + consonne;
        expect(x[0]).toBeGreaterThan(avant);
        expect(x[2]! + voyelles[2]!).toBeLessThan(1920);
        expect(x[1]! - (x[0]! + voyelles[0]!)).toBeGreaterThan(0);
        expect(x[2]! - (x[1]! + voyelles[1]!)).toBeGreaterThan(0);
      }
    }
  });
});
