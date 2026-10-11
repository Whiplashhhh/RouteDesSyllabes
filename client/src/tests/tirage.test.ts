import { describe, expect, it } from 'vitest';
import { configParDefaut, normaliserConfig } from '../../../shared/seance';
import { syllabe, tirerRoutes } from '../../../shared/tirage';

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
function graine(n: number) {
  let a = n;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('tirerRoutes', () => {
  it('donne une consonne et N voyelles distinctes à chaque route', () => {
    const config = { ...configParDefaut(), nbRoutes: 3, voyellesParRoute: 2 };
    for (let s = 1; s < 200; s++) {
      const routes = tirerRoutes(config, graine(s));
      expect(routes).toHaveLength(3);
      for (const r of routes) {
        expect(config.consonnes).toContain(r.consonne);
        expect(r.voyelles).toHaveLength(2);
        expect(new Set(r.voyelles).size).toBe(2);
        r.voyelles.forEach((v) => expect(config.voyelles).toContain(v));
      }
    }
  });

  it('évite deux routes avec la même consonne quand la liste le permet', () => {
    const config = { ...configParDefaut(), consonnes: ['l', 'm', 'r', 's'], nbRoutes: 4 };
    for (let s = 1; s < 200; s++) {
      const consonnes = tirerRoutes(config, graine(s)).map((r) => r.consonne);
      expect(new Set(consonnes).size).toBe(4);
    }
  });

  it('réutilise les consonnes seulement si elles sont trop peu nombreuses', () => {
    const config = { ...configParDefaut(), consonnes: ['l', 'm'], nbRoutes: 4 };
    const consonnes = tirerRoutes(config, graine(3)).map((r) => r.consonne);
    expect(new Set(consonnes.slice(0, 2)).size).toBe(2);
    expect(new Set(consonnes.slice(2, 4)).size).toBe(2);
  });

  it('borne le nombre de voyelles à la taille de la liste', () => {
    const config = { ...configParDefaut(), voyelles: ['a'], voyellesParRoute: 3 };
    tirerRoutes(config, graine(1)).forEach((r) => expect(r.voyelles).toEqual(['a']));
  });

  it('borne le nombre de routes entre 1 et 4', () => {
    expect(tirerRoutes({ ...configParDefaut(), nbRoutes: 9 }, graine(1))).toHaveLength(4);
    expect(tirerRoutes({ ...configParDefaut(), nbRoutes: 0 }, graine(1))).toHaveLength(1);
  });

  it('gère les graphèmes à plusieurs lettres comme une seule étiquette', () => {
    const config = { ...configParDefaut(), consonnes: ['ch'], voyelles: ['ou', 'on'], nbRoutes: 1 };
    const [route] = tirerRoutes(config, graine(5));
    expect(route?.consonne).toBe('ch');
    expect(route?.voyelles.sort()).toEqual(['on', 'ou']);
  });

  it("respecte l'ordre fixe défini par la maîtresse", () => {
    const config = {
      ...configParDefaut(),
      tirage: 'fixe' as const,
      nbRoutes: 2,
      routesFixes: [
        { consonne: 'l', voyelles: ['a', 'i'] },
        { consonne: 'ch', voyelles: ['ou'] },
      ],
    };
    expect(tirerRoutes(config, graine(1))).toEqual([
      { consonne: 'l', voyelles: ['a', 'i'] },
      { consonne: 'ch', voyelles: ['ou'] },
    ]);
  });

  it('évite de redonner exactement le même tirage', () => {
    const config = { ...configParDefaut(), nbRoutes: 1, voyellesParRoute: 1 };
    const alea = graine(42);
    let precedent = tirerRoutes(config, alea);
    for (let i = 0; i < 50; i++) {
      const suivant = tirerRoutes(config, alea, precedent);
      expect(suivant).not.toEqual(precedent);
      precedent = suivant;
    }
  });

  it('ne plante pas avec des listes vides', () => {
    const routes = tirerRoutes({ ...configParDefaut(), consonnes: [], voyelles: [] }, graine(1));
    expect(routes[0]?.consonne).toBeTruthy();
    expect(routes[0]?.voyelles.length).toBeGreaterThan(0);
  });
});

describe('syllabe et normalisation', () => {
  it('forme la syllabe dans le sens de lecture', () => {
    expect(syllabe('l', 'a')).toBe('la');
    expect(syllabe('ch', 'ou')).toBe('chou');
  });

  it('complète une configuration partielle avec les valeurs par défaut', () => {
    const c = normaliserConfig({ consonnes: ['s'], retours: { voix: true } as never });
    expect(c.consonnes).toEqual(['s']);
    expect(c.retours.voix).toBe(true);
    expect(c.retours.trainee).toBe(true);
    expect(c.decor.vehicules).toHaveLength(4);
  });
});
