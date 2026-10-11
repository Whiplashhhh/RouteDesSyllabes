import type { SeanceConfig } from '../../../shared/seance';
import { tirerRoutes } from '../../../shared/tirage';
import type { Tirage } from './Scene';

/** Nouveau tirage de lettres, avec des variations d'espacement figées. */
export function nouveauTirage(config: SeanceConfig, precedent?: Tirage): Tirage {
  const routes = tirerRoutes(config, Math.random, precedent?.routes);
  return {
    routes,
    variations: routes.map((r) => r.voyelles.map(() => Math.random())),
    generation: (precedent?.generation ?? 0) + 1,
  };
}
