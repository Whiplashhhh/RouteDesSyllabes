import { useMemo } from 'react';
import type { SeanceConfig } from '../../../shared/seance';
import { tirerRoutes } from '../../../shared/tirage';
import { Scene, type Tirage } from '../game/Scene';

/** Petit générateur reproductible : un aperçu stable pour une même séance. */
function aleatoireStable(graine: string) {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

interface Props {
  config: SeanceConfig;
  graine?: string;
  interactif?: boolean;
  /** Incrémenter pour tirer de nouvelles lettres. */
  generation?: number;
}

/** Aperçu miniature réel de la séance (vrai rendu du jeu). */
export function ApercuSeance({ config, graine = '', interactif = false, generation = 0 }: Props) {
  const cleTirage = JSON.stringify([
    config.consonnes,
    config.voyelles,
    config.nbRoutes,
    config.voyellesParRoute,
    config.tirage,
    config.routesFixes,
  ]);
  const tirage = useMemo<Tirage>(() => {
    const alea = aleatoireStable(`${graine}|${cleTirage}|${generation}`);
    const routes = tirerRoutes(config, alea);
    return {
      routes,
      variations: routes.map((r) => r.voyelles.map(() => alea())),
      generation: 1,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleTirage, graine, generation]);

  return (
    <div className="apercu">
      <Scene
        key={tirage.routes.length}
        config={config}
        tirage={tirage}
        interactif={interactif}
        apercu
      />
    </div>
  );
}
