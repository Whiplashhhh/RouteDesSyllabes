import { describe, expect, it } from 'vitest';
import { cadreEtiquettes, police } from '../game/polices';

const T = 100;
const MIN = T * 1.24;

describe('cadre des étiquettes', () => {
  it('garde le cadre fixe pour l’écriture script', () => {
    expect(cadreEtiquettes(police('script-minuscule'), ['l', 'y'], T, MIN)).toEqual({
      hauteur: MIN,
      interligne: MIN,
    });
  });

  it('en cursive, une route sans jambage a une étiquette moins haute', () => {
    const cursive = police('cursive');
    const boucles = cadreEtiquettes(cursive, ['l', 'a', 'o'], T, MIN);
    const complet = cadreEtiquettes(cursive, ['l', 'a', 'y'], T, MIN);
    expect(boucles.hauteur).toBeLessThan(complet.hauteur);
    expect(boucles.hauteur).toBeGreaterThanOrEqual(MIN);
  });

  it('en cursive, laisse la même marge au-dessus des boucles et sous les jambages', () => {
    const cursive = police('cursive');
    const f = T * cursive.taille;
    for (const textes of [
      ['l', 'a'],
      ['m', 'y'],
      ['f', 'i'],
    ]) {
      const { hauteur, interligne } = cadreEtiquettes(cursive, textes, T, MIN);
      const bord = 0.03 * f;
      const base = bord + interligne / 2 + cursive.encre!.decalageBase * f;
      const haut = { l: 1.43, a: 0.52, m: 0.52, y: 0.52, f: 1.43, i: 0.8 };
      const bas = { l: 0.02, a: 0.02, m: 0.02, y: 0.93, f: 0.93, i: 0.02 };
      const h = Math.max(...textes.map((t) => haut[t as keyof typeof haut])) * f;
      const b = Math.max(...textes.map((t) => bas[t as keyof typeof bas])) * f;
      expect(base - h).toBeCloseTo(hauteur - (base + b), 5);
      expect(base - h).toBeGreaterThan(0);
    }
  });

  it('en cursive, ne descend pas sous la hauteur minimale', () => {
    expect(cadreEtiquettes(police('cursive'), ['m', 'a'], T, MIN).hauteur).toBe(MIN);
  });
});
