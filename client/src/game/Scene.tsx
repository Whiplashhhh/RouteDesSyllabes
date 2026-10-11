import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { SeanceConfig } from '../../../shared/seance';
import type { RouteTiree } from '../../../shared/tirage';
import { Couloir } from './Couloir';
import { Fond } from './decor/Fond';
import { calculerGeometrie } from './geometrie';

export interface Tirage {
  routes: RouteTiree[];
  /** Une liste de variations d'espacement par route. */
  variations: number[][];
  generation: number;
}

interface Props {
  config: SeanceConfig;
  tirage: Tirage;
  jetonDepart?: number;
  interactif?: boolean;
  /** Mode aperçu (éditeur) : pas d'animations de fond coûteuses. */
  apercu?: boolean;
}

function preferenceMouvementReduit(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/** La scène de jeu : fond, routes, véhicules et lettres. S'adapte à son conteneur. */
export function Scene({
  config,
  tirage,
  jetonDepart = 0,
  interactif = true,
  apercu = false,
}: Props) {
  const hoteRef = useRef<HTMLDivElement>(null);
  const [taille, setTaille] = useState<{ l: number; h: number } | null>(null);
  const [mouvementReduit, setMouvementReduit] = useState(preferenceMouvementReduit);

  useLayoutEffect(() => {
    const el = hoteRef.current;
    if (!el) return;
    const mesurer = () => {
      const r = el.getBoundingClientRect();
      setTaille((t) =>
        t && Math.abs(t.l - r.width) < 0.5 && Math.abs(t.h - r.height) < 0.5
          ? t
          : { l: r.width, h: r.height },
      );
    };
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const maj = () => setMouvementReduit(mq.matches);
    mq.addEventListener('change', maj);
    return () => mq.removeEventListener('change', maj);
  }, []);

  const reduit = mouvementReduit || config.retours.animationsReduites;
  const nbRoutes = tirage.routes.length;
  const { decor } = config;
  const geo = useMemo(
    () => (taille ? calculerGeometrie(taille.l, taille.h, nbRoutes) : null),
    [taille, nbRoutes],
  );

  return (
    <div
      ref={hoteRef}
      className={`scene${reduit ? ' scene-reduite' : ''}${apercu ? ' scene-apercu' : ''}`}
      data-testid="scene"
    >
      <Fond
        fond={decor.fond}
        couleurUnie={decor.couleurUnie}
        anime={decor.animationsFond && !reduit && !apercu}
      />
      {taille &&
        geo &&
        tirage.routes.map((route, i) => {
          const vehicule = decor.memeVehicule
            ? decor.vehicules[0]
            : (decor.vehicules[i] ?? decor.vehicules[0]);
          return (
            <Couloir
              key={`${nbRoutes}-${i}`}
              index={i}
              largeur={taille.l}
              geo={geo}
              route={route}
              variations={tirage.variations[i] ?? []}
              generation={tirage.generation}
              jetonDepart={jetonDepart}
              vehicule={vehicule ?? { type: 'citadine', couleur: 'rouge' }}
              yeux={decor.yeux}
              styleRoute={decor.route}
              police={config.police}
              retours={config.retours}
              reduit={reduit}
              interactif={interactif}
            />
          );
        })}
    </div>
  );
}
